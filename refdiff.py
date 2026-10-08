#!/usr/bin/env python3
"""
RefDiff (The Ref-Differentiator)
--------------------------------
A diff-decoupling engine for wikitext that eliminates "template camouflage"
by separating human prose edits from citation metadata changes.

Performs raw diffs on the contents of <ref> spans without decoding templates
or introducing new styling.

Usage:
    python3 refdiff.py old.wiki new.wiki
    python3 refdiff.py --stat old.wiki new.wiki
    python3 refdiff.py --json old.wiki new.wiki
    git diff (when configured as git-refdiff in .gitconfig)
"""

import sys
import os
import re
import difflib
import json
import argparse
from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, List, Tuple, Any

# ==============================================================================
# ANSI Color Formatting Helpers
# ==============================================================================

class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    UNDERLINE = "\033[4m"
    
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    
    BG_RED = "\033[41m"
    BG_GREEN = "\033[42m"
    
    @classmethod
    def disable(cls):
        for attr in dir(cls):
            if not attr.startswith("__") and isinstance(getattr(cls, attr), str):
                setattr(cls, attr, "")


# ==============================================================================
# Data Structures
# ==============================================================================

@dataclass
class Citation:
    ref_id: str                      # Canonical ID: name or content hash
    name: Optional[str] = None       # name="..." attribute
    group: Optional[str] = None      # group="..." attribute
    details: Optional[str] = None    # details="..." sub-referencing attribute
    raw_content: str = ""            # Content inside <ref>...</ref>
    full_tag: str = ""               # Full encapsulating <ref ...>...</ref> tag
    section: str = ""                # Section title
    is_definition: bool = False      # Defined inside <references hidden>
    order_in_section: int = 0        # 1-based order in current section


@dataclass
class Section:
    title: str
    level: int                       # Heading level (e.g. 2 for == Heading ==)
    raw_text: str
    prose: str
    citations: Dict[str, Citation] = field(default_factory=dict)


@dataclass
class ParsedDocument:
    filename: str
    sections: List[Section]
    citations: Dict[str, Citation] = field(default_factory=dict)


@dataclass
class DiffToken:
    type: str                        # 'equal', 'delete', 'insert', 'ref_badge'
    text: str
    ref_id: Optional[str] = None
    ref_label: Optional[str] = None
    badge_status: Optional[str] = None # 'equal', 'delete', 'insert'


@dataclass
class CitationDelta:
    added: List[Citation] = field(default_factory=list)
    removed: List[Citation] = field(default_factory=list)
    modified: List[Tuple[Citation, Citation, List[DiffToken]]] = field(default_factory=list)


@dataclass
class SectionDiff:
    title: str
    has_prose_changes: bool
    prose_tokens: List[DiffToken]
    words_added: int
    words_removed: int
    citation_delta: CitationDelta


# ==============================================================================
# Wikitext Parser & Tokenizer (Raw Extraction, No Template Decoding)
# ==============================================================================

class WikitextParser:
    """Extracts clean prose and raw citation content without decoding templates."""

    # Matches XML attributes: key="val", key='val', key=val
    ATTR_RE = re.compile(r'([a-zA-Z0-9_\-]+)\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s"\'=<>`]+))')

    # Matches section headings: == Title ==
    HEADING_RE = re.compile(r'^(={1,6})\s*(.*?)\s*\1\s*$', re.MULTILINE)

    # Matches <references hidden>...</references> or <references-def>...</references-def>
    REF_DEF_BLOCK_RE = re.compile(
        r'<references\s+(?:hidden|display\s*=\s*["\']?none["\']?)[^>]*>(.*?)</references>|'
        r'<references-def[^>]*>(.*?)</references-def>',
        re.DOTALL | re.IGNORECASE
    )

    # Matches standard <references /> or <references>...</references>
    REF_RENDER_BLOCK_RE = re.compile(
        r'<references(?:\s*/>|\s*[^>]*>.*?</references>)',
        re.DOTALL | re.IGNORECASE
    )

    # Matches <ref ...>...</ref> or self-closing <ref .../>
    REF_TAG_RE = re.compile(
        r'<ref\b(?P<attrs>[^>/]*)(?:/(?:\s*)>|>(?P<content>.*?)</ref>)',
        re.DOTALL | re.IGNORECASE
    )

    @classmethod
    def parse_attributes(cls, attr_str: str) -> Dict[str, str]:
        attrs = {}
        for match in cls.ATTR_RE.finditer(attr_str):
            key = match.group(1).lower()
            val = match.group(2) if match.group(2) is not None else (
                match.group(3) if match.group(3) is not None else match.group(4)
            )
            attrs[key] = val or ""
        return attrs

    @classmethod
    def parse_document(cls, wikitext: str, filename: str = "document") -> ParsedDocument:
        """Parses full wikitext into sections, prose stream, and raw citation registry."""
        sections: List[Section] = []
        all_citations: Dict[str, Citation] = {}
        anon_counter = 1

        # 1. Segment text into sections
        heading_matches = list(cls.HEADING_RE.finditer(wikitext))
        
        splits = []
        if not heading_matches or heading_matches[0].start() > 0:
            lead_end = heading_matches[0].start() if heading_matches else len(wikitext)
            splits.append(("(Lead)", 1, wikitext[:lead_end]))

        for i, match in enumerate(heading_matches):
            level = len(match.group(1))
            title = match.group(2).strip()
            start = match.end()
            end = heading_matches[i+1].start() if i + 1 < len(heading_matches) else len(wikitext)
            splits.append((title, level, wikitext[start:end]))

        # 2. Process each section
        for title, level, raw_section_text in splits:
            section_citations: Dict[str, Citation] = {}
            working_text = raw_section_text
            order_in_section = 1

            # (A) Extract and strip <references hidden> definition blocks
            def def_block_replacer(m):
                block_content = m.group(1) or m.group(2) or ""
                for ref_m in cls.REF_TAG_RE.finditer(block_content):
                    attrs = cls.parse_attributes(ref_m.group('attrs') or "")
                    content = (ref_m.group('content') or "").strip()
                    ref_name = attrs.get('name')
                    ref_id = ref_name if ref_name else f"anon_{len(all_citations)+1}"
                    cit = Citation(
                        ref_id=ref_id,
                        name=ref_name,
                        group=attrs.get('group'),
                        details=attrs.get('details'),
                        raw_content=content,
                        full_tag=ref_m.group(0).strip(),
                        section=title,
                        is_definition=True
                    )
                    section_citations[ref_id] = cit
                    all_citations[ref_id] = cit
                return "" # Strip completely from prose

            working_text = cls.REF_DEF_BLOCK_RE.sub(def_block_replacer, working_text)

            # (B) Strip document-level <references /> render tag from prose
            working_text = cls.REF_RENDER_BLOCK_RE.sub("", working_text)

            # (C) Scan and replace inline <ref> tags with sentinels
            def inline_ref_replacer(m):
                nonlocal anon_counter, order_in_section
                attrs = cls.parse_attributes(m.group('attrs') or "")
                content = (m.group('content') or "").strip()
                ref_name = attrs.get('name')

                if ref_name:
                    ref_id = ref_name
                else:
                    ref_id = f"anon_{anon_counter}"
                    anon_counter += 1

                # If this inline tag includes a definition body and wasn't defined earlier
                if ref_id not in all_citations or content:
                    cit = Citation(
                        ref_id=ref_id,
                        name=ref_name,
                        group=attrs.get('group'),
                        details=attrs.get('details'),
                        raw_content=content,
                        full_tag=m.group(0).strip(),
                        section=title,
                        is_definition=False,
                        order_in_section=order_in_section
                    )
                    section_citations[ref_id] = cit
                    all_citations[ref_id] = cit
                else:
                    # Associate existing citation with current section
                    section_citations[ref_id] = all_citations[ref_id]
                    # Update details if specified on reuse
                    if attrs.get('details') and not all_citations[ref_id].details:
                        all_citations[ref_id].details = attrs.get('details')

                order_in_section += 1
                return f"⟦ref:{ref_id}⟧"

            clean_prose = cls.REF_TAG_RE.sub(inline_ref_replacer, working_text)

            sections.append(Section(
                title=title,
                level=level,
                raw_text=raw_section_text,
                prose=clean_prose.strip(),
                citations=section_citations
            ))

        return ParsedDocument(filename=filename, sections=sections, citations=all_citations)


# ==============================================================================
# Diff Engines (Prose & Raw Citation Content)
# ==============================================================================

class RefDiffEngine:
    """Computes decoupled diffs: word-level prose diff + raw citation content diff."""

    SENTINEL_RE = re.compile(r'⟦ref:([^⟧]+)⟧')
    TOKEN_RE = re.compile(r'(⟦ref:[^⟧]+⟧|[a-zA-Z0-9_\u00C0-\u017F]+|\s+|[^\w\s])')
    RAW_TOKEN_RE = re.compile(r'([a-zA-Z0-9_\u00C0-\u017F]+|\s+|[^\w\s])')

    @classmethod
    def tokenize_prose(cls, text: str) -> List[str]:
        return [tok for tok in cls.TOKEN_RE.findall(text) if tok]

    @classmethod
    def tokenize_raw(cls, text: str) -> List[str]:
        return [tok for tok in cls.RAW_TOKEN_RE.findall(text) if tok]

    @classmethod
    def diff_raw_content(cls, old_content: str, new_content: str) -> List[DiffToken]:
        """Performs raw word-level diff on citation content."""
        tokens_a = cls.tokenize_raw(old_content)
        tokens_b = cls.tokenize_raw(new_content)

        matcher = difflib.SequenceMatcher(None, tokens_a, tokens_b)
        result: List[DiffToken] = []

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                for tok in tokens_a[i1:i2]:
                    result.append(DiffToken(type='equal', text=tok))
            elif tag == 'delete':
                for tok in tokens_a[i1:i2]:
                    result.append(DiffToken(type='delete', text=tok))
            elif tag == 'insert':
                for tok in tokens_b[j1:j2]:
                    result.append(DiffToken(type='insert', text=tok))
            elif tag == 'replace':
                for tok in tokens_a[i1:i2]:
                    result.append(DiffToken(type='delete', text=tok))
                for tok in tokens_b[j1:j2]:
                    result.append(DiffToken(type='insert', text=tok))

        return result

    @classmethod
    def diff_prose(cls, old_prose: str, new_prose: str, ref_label_map: Dict[str, str], modified_ref_ids: Optional[set] = None) -> Tuple[List[DiffToken], int, int]:
        """Performs word-level diff, resolving sentinels into styled badges and annotating modified refs."""
        tokens_a = cls.tokenize_prose(old_prose)
        tokens_b = cls.tokenize_prose(new_prose)

        matcher = difflib.SequenceMatcher(None, tokens_a, tokens_b)
        result: List[DiffToken] = []
        words_added = 0
        words_removed = 0

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                for tok in tokens_a[i1:i2]:
                    m = cls.SENTINEL_RE.match(tok)
                    if m:
                        ref_id = m.group(1)
                        label = ref_label_map.get(ref_id, ref_id)
                        status = 'modified' if (modified_ref_ids and ref_id in modified_ref_ids) else 'equal'
                        result.append(DiffToken(type='ref_badge', text=tok, ref_id=ref_id, ref_label=label, badge_status=status))
                    else:
                        result.append(DiffToken(type='equal', text=tok))

            elif tag == 'delete':
                for tok in tokens_a[i1:i2]:
                    m = cls.SENTINEL_RE.match(tok)
                    if m:
                        ref_id = m.group(1)
                        label = ref_label_map.get(ref_id, ref_id)
                        result.append(DiffToken(type='ref_badge', text=tok, ref_id=ref_id, ref_label=label, badge_status='delete'))
                    else:
                        result.append(DiffToken(type='delete', text=tok))
                        if re.search(r'\w', tok):
                            words_removed += 1

            elif tag == 'insert':
                for tok in tokens_b[j1:j2]:
                    m = cls.SENTINEL_RE.match(tok)
                    if m:
                        ref_id = m.group(1)
                        label = ref_label_map.get(ref_id, ref_id)
                        result.append(DiffToken(type='ref_badge', text=tok, ref_id=ref_id, ref_label=label, badge_status='insert'))
                    else:
                        result.append(DiffToken(type='insert', text=tok))
                        if re.search(r'\w', tok):
                            words_added += 1

            elif tag == 'replace':
                for tok in tokens_a[i1:i2]:
                    m = cls.SENTINEL_RE.match(tok)
                    if m:
                        ref_id = m.group(1)
                        label = ref_label_map.get(ref_id, ref_id)
                        result.append(DiffToken(type='ref_badge', text=tok, ref_id=ref_id, ref_label=label, badge_status='delete'))
                    else:
                        result.append(DiffToken(type='delete', text=tok))
                        if re.search(r'\w', tok):
                            words_removed += 1

                for tok in tokens_b[j1:j2]:
                    m = cls.SENTINEL_RE.match(tok)
                    if m:
                        ref_id = m.group(1)
                        label = ref_label_map.get(ref_id, ref_id)
                        result.append(DiffToken(type='ref_badge', text=tok, ref_id=ref_id, ref_label=label, badge_status='insert'))
                    else:
                        result.append(DiffToken(type='insert', text=tok))
                        if re.search(r'\w', tok):
                            words_added += 1

        return result, words_added, words_removed

    @classmethod
    def diff_citations(cls, old_cits: Dict[str, Citation], new_cits: Dict[str, Citation]) -> CitationDelta:
        """Compares two sets of citations, performing raw diffs on changed content."""
        added: List[Citation] = []
        removed: List[Citation] = []
        modified: List[Tuple[Citation, Citation, List[DiffToken]]] = []

        all_keys = set(old_cits.keys()).union(set(new_cits.keys()))

        for k in sorted(all_keys):
            in_old = k in old_cits
            in_new = k in new_cits

            if in_new and not in_old:
                added.append(new_cits[k])
            elif in_old and not in_new:
                removed.append(old_cits[k])
            else:
                c_old = old_cits[k]
                c_new = new_cits[k]

                # Check if full encapsulating tag changed
                tag_old = (c_old.full_tag or c_old.raw_content).strip()
                tag_new = (c_new.full_tag or c_new.raw_content).strip()

                if tag_old != tag_new:
                    raw_diff = cls.diff_raw_content(tag_old, tag_new)
                    modified.append((c_old, c_new, raw_diff))

        return CitationDelta(added=added, removed=removed, modified=modified)

    @classmethod
    def compare_documents(cls, old_doc: ParsedDocument, new_doc: ParsedDocument) -> Tuple[List[SectionDiff], Dict[str, int], Dict[str, str]]:
        """Coordinates section-by-section decoupled comparison."""
        
        # Build 1-based human badge label map (e.g. schmidt2020 -> "ref1")
        ref_label_map: Dict[str, str] = {}
        counter = 1
        for sec in new_doc.sections:
            for ref_id in sec.citations:
                if ref_id not in ref_label_map:
                    ref_label_map[ref_id] = f"ref{counter}"
                    counter += 1
        for sec in old_doc.sections:
            for ref_id in sec.citations:
                if ref_id not in ref_label_map:
                    ref_label_map[ref_id] = f"ref{counter}"
                    counter += 1

        old_sec_map = {s.title: s for s in old_doc.sections}
        new_sec_map = {s.title: s for s in new_doc.sections}
        all_titles = list(dict.fromkeys([s.title for s in old_doc.sections] + [s.title for s in new_doc.sections]))

        section_diffs: List[SectionDiff] = []
        total_stats = {
            "words_added": 0,
            "words_removed": 0,
            "cits_added": 0,
            "cits_removed": 0,
            "cits_modified": 0
        }

        for title in all_titles:
            s_old = old_sec_map.get(title, Section(title=title, level=2, raw_text="", prose="", citations={}))
            s_new = new_sec_map.get(title, Section(title=title, level=2, raw_text="", prose="", citations={}))

            cit_delta = cls.diff_citations(s_old.citations, s_new.citations)
            modified_ref_ids = {c_new.ref_id for _, c_new, _ in cit_delta.modified}

            prose_tokens, w_add, w_rem = cls.diff_prose(s_old.prose, s_new.prose, ref_label_map, modified_ref_ids)

            has_prose_changes = (w_add > 0 or w_rem > 0 or any(t.badge_status in ('insert', 'delete', 'modified') for t in prose_tokens))

            total_stats["words_added"] += w_add
            total_stats["words_removed"] += w_rem
            total_stats["cits_added"] += len(cit_delta.added)
            total_stats["cits_removed"] += len(cit_delta.removed)
            total_stats["cits_modified"] += len(cit_delta.modified)

            section_diffs.append(SectionDiff(
                title=title,
                has_prose_changes=has_prose_changes,
                prose_tokens=prose_tokens,
                words_added=w_add,
                words_removed=w_rem,
                citation_delta=cit_delta
            ))

        return section_diffs, total_stats, ref_label_map


# ==============================================================================
# Formatters: Terminal ANSI, Summary Stat, and JSON
# ==============================================================================

class TerminalFormatter:
    """Renders human-readable decoupled diffs with standard ANSI diff styling."""

    @classmethod
    def render_tokens(cls, tokens: List[DiffToken]) -> str:
        """Groups contiguous word deletions and insertions into standard diff spans."""
        out = []
        del_buf = []
        ins_buf = []

        def flush():
            nonlocal del_buf, ins_buf
            if del_buf and ins_buf:
                del_str = "".join(del_buf).strip()
                ins_str = "".join(ins_buf).strip()
                if del_str:
                    out.append(f"{Colors.RED}[- {del_str} -]{Colors.RESET} ")
                if ins_str:
                    out.append(f"{Colors.GREEN}{{+ {ins_str} +}}{Colors.RESET}")
                del_buf = []
                ins_buf = []
            else:
                if del_buf:
                    del_str = "".join(del_buf).strip()
                    if del_str:
                        out.append(f"{Colors.RED}[- {del_str} -]{Colors.RESET}")
                    del_buf = []
                if ins_buf:
                    ins_str = "".join(ins_buf).strip()
                    if ins_str:
                        out.append(f"{Colors.GREEN}{{+ {ins_str} +}}{Colors.RESET}")
                    ins_buf = []

        for t in tokens:
            if t.type == 'equal':
                flush()
                out.append(t.text)
            elif t.type == 'delete':
                del_buf.append(t.text)
            elif t.type == 'insert':
                ins_buf.append(t.text)
            elif t.type == 'ref_badge':
                flush()
                badge = f"[{t.ref_label}]"
                if t.badge_status == 'equal':
                    out.append(f"{Colors.CYAN}{badge}{Colors.RESET}")
                elif t.badge_status == 'modified':
                    out.append(f"{Colors.BOLD}{Colors.YELLOW}{badge}{Colors.RESET}")
                elif t.badge_status == 'delete':
                    out.append(f"{Colors.RED}[- {badge} -]{Colors.RESET}")
                elif t.badge_status == 'insert':
                    out.append(f"{Colors.GREEN}{{+ {badge} +}}{Colors.RESET}")

        flush()
        return "".join(out).strip()

    @classmethod
    def render(cls, old_doc: ParsedDocument, new_doc: ParsedDocument, section_diffs: List[SectionDiff], stats: Dict[str, int], ref_label_map: Dict[str, str], show_all: bool = False) -> str:
        lines = []
        sep = "═" * 80
        thin_sep = "─" * 80

        # Header
        lines.append(f"{Colors.BOLD}{Colors.CYAN}{sep}{Colors.RESET}")
        lines.append(f"{Colors.BOLD}RefDiff: {old_doc.filename} ➔ {new_doc.filename}{Colors.RESET}")
        lines.append(
            f"Summary: Prose: {Colors.GREEN}+{stats['words_added']}{Colors.RESET} "
            f"{Colors.RED}-{stats['words_removed']}{Colors.RESET} words | "
            f"Citations: {Colors.YELLOW}{stats['cits_modified']} modified{Colors.RESET}, "
            f"{Colors.GREEN}{stats['cits_added']} added{Colors.RESET}, "
            f"{Colors.RED}{stats['cits_removed']} removed{Colors.RESET}"
        )
        lines.append(f"{Colors.BOLD}{Colors.CYAN}{sep}{Colors.RESET}\n")

        has_any_change = False

        for s_diff in section_diffs:
            has_cit_changes = (len(s_diff.citation_delta.added) > 0 or 
                               len(s_diff.citation_delta.removed) > 0 or 
                               len(s_diff.citation_delta.modified) > 0)
            
            if not s_diff.has_prose_changes and not has_cit_changes and not show_all:
                continue

            has_any_change = True
            lines.append(f"{Colors.BOLD}{Colors.BLUE}─── SECTION: == {s_diff.title} == {thin_sep[:max(0, 60 - len(s_diff.title))]}{Colors.RESET}")

            # 1. Prose Diff Pane
            lines.append(f"\n{Colors.BOLD}[ PROSE DIFF ]{Colors.RESET}")
            if s_diff.has_prose_changes:
                lines.append("  " + cls.render_tokens(s_diff.prose_tokens))
            else:
                lines.append(f"  {Colors.DIM}(No prose wording changes){Colors.RESET}")

            # 2. Citation Pane (Raw Diff on Full Encapsulating <ref> Tag)
            lines.append(f"\n{Colors.BOLD}[ CITATIONS ]{Colors.RESET}")
            if not has_cit_changes:
                lines.append(f"  {Colors.DIM}(No citation changes in this section){Colors.RESET}\n")
            else:
                delta = s_diff.citation_delta
                # Added
                for cit in delta.added:
                    lbl = f"[{ref_label_map.get(cit.ref_id, cit.ref_id)}]"
                    lines.append(f"  {Colors.GREEN}🟢 ADDED {lbl}:{Colors.RESET}")
                    tag_str = (cit.full_tag or cit.raw_content).strip()
                    lines.append(f"     {Colors.GREEN}{{+ {tag_str} +}}{Colors.RESET}")

                # Removed
                for cit in delta.removed:
                    lbl = f"[{ref_label_map.get(cit.ref_id, cit.ref_id)}]"
                    lines.append(f"  {Colors.RED}🔴 REMOVED {lbl}:{Colors.RESET}")
                    tag_str = (cit.full_tag or cit.raw_content).strip()
                    lines.append(f"     {Colors.RED}[- {tag_str} -]{Colors.RESET}")

                # Modified (Raw Diff on full encapsulating tag)
                for c_old, c_new, raw_diff in delta.modified:
                    num = ref_label_map.get(c_new.ref_id, c_new.ref_id)
                    lines.append(f"  {Colors.YELLOW}🟡 MODIFIED [{num}]:{Colors.RESET}")
                    rendered_diff = cls.render_tokens(raw_diff)
                    lines.append(f"     {rendered_diff}")

                lines.append("")

        if not has_any_change:
            lines.append(f"{Colors.DIM}No changes detected between revisions.{Colors.RESET}\n")

        lines.append(f"{Colors.CYAN}{thin_sep}{Colors.RESET}")
        return "\n".join(lines)


class StatFormatter:
    """Renders compact git-style diffstat summary."""

    @classmethod
    def render(cls, old_doc: ParsedDocument, new_doc: ParsedDocument, section_diffs: List[SectionDiff], stats: Dict[str, int], ref_label_map: Dict[str, str]) -> str:
        lines = []
        for s in section_diffs:
            has_cit_changes = (len(s.citation_delta.added) + len(s.citation_delta.removed) + len(s.citation_delta.modified)) > 0
            if not s.has_prose_changes and not has_cit_changes:
                continue

            cit_details = []
            if s.citation_delta.added:
                cit_details.append(f"+{len(s.citation_delta.added)} added")
            if s.citation_delta.removed:
                cit_details.append(f"-{len(s.citation_delta.removed)} removed")
            if s.citation_delta.modified:
                mods = [f"[{ref_label_map.get(c_new.ref_id, c_new.ref_id)}]" for _, c_new, _ in s.citation_delta.modified]
                cit_details.append(f"{len(s.citation_delta.modified)} modified ({', '.join(mods)})")

            cit_str = f"Refs: {', '.join(cit_details)}" if cit_details else "Refs: 0 changed"
            prose_str = f"Prose: +{s.words_added} -{s.words_removed} words" if s.has_prose_changes else "Prose: 0 words"
            
            lines.append(f"{'== ' + s.title + ' ==':<26} | {prose_str:<22} | {cit_str}")

        lines.append(
            f"Total: {len(section_diffs)} sections | "
            f"Prose: +{stats['words_added']} -{stats['words_removed']} words | "
            f"Citations: +{stats['cits_added']} added, {stats['cits_modified']} modified, -{stats['cits_removed']} removed"
        )
        return "\n".join(lines)


class JsonFormatter:
    """Renders structured JSON payload for external tools and MediaWiki gadgets."""

    @classmethod
    def render(cls, old_doc: ParsedDocument, new_doc: ParsedDocument, section_diffs: List[SectionDiff], stats: Dict[str, int], ref_label_map: Dict[str, str]) -> str:
        payload = {
            "summary": {
                "prose_words_added": stats["words_added"],
                "prose_words_removed": stats["words_removed"],
                "citations_added": stats["cits_added"],
                "citations_removed": stats["cits_removed"],
                "citations_modified": stats["cits_modified"]
            },
            "sections": []
        }

        for s in section_diffs:
            tokens_json = []
            for t in s.prose_tokens:
                tokens_json.append({
                    "type": t.type,
                    "text": t.text,
                    "ref_id": t.ref_id,
                    "ref_label": t.ref_label,
                    "badge_status": t.badge_status
                })

            mod_json = []
            for c_old, c_new, raw_diff in s.citation_delta.modified:
                mod_json.append({
                    "ref_id": c_new.ref_id,
                    "ref_label": ref_label_map.get(c_new.ref_id, c_new.ref_id),
                    "name": c_new.name,
                    "old_raw": c_old.raw_content,
                    "new_raw": c_new.raw_content,
                    "raw_diff_tokens": [{"type": t.type, "text": t.text} for t in raw_diff]
                })

            sec_json = {
                "title": s.title,
                "has_prose_changes": s.has_prose_changes,
                "prose_diff": {
                    "words_added": s.words_added,
                    "words_removed": s.words_removed,
                    "tokens": tokens_json
                },
                "citation_delta": {
                    "added": [asdict(c) for c in s.citation_delta.added],
                    "removed": [asdict(c) for c in s.citation_delta.removed],
                    "modified": mod_json
                }
            }
            payload["sections"].append(sec_json)

        return json.dumps(payload, indent=2, ensure_ascii=False)


# ==============================================================================
# Main Entry Point & CLI Driver
# ==============================================================================

def main():
    # Detect standard Git external diff driver invocation:
    # git diff calls: command <path> <old-file> <old-hex> <old-mode> <new-file> <new-hex> <new-mode>
    if len(sys.argv) == 8 and not sys.argv[1].startswith("-"):
        old_path = sys.argv[2]
        new_path = sys.argv[5]
        label = sys.argv[1]
        raw_old = open(old_path, 'r', encoding='utf-8', errors='replace').read()
        raw_new = open(new_path, 'r', encoding='utf-8', errors='replace').read()
        doc_a = WikitextParser.parse_document(raw_old, filename=f"{label} (old)")
        doc_b = WikitextParser.parse_document(raw_new, filename=f"{label} (new)")
        diffs, stats, ref_label_map = RefDiffEngine.compare_documents(doc_a, doc_b)
        print(TerminalFormatter.render(doc_a, doc_b, diffs, stats, ref_label_map))
        return

    parser = argparse.ArgumentParser(
        description="RefDiff: A diff-decoupling engine separating prose edits from citation metadata changes."
    )
    parser.add_argument("old_file", help="Old revision wikitext file (or '-' for stdin)")
    parser.add_argument("new_file", help="New revision wikitext file")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    parser.add_argument("--stat", action="store_true", help="Output compact diffstat summary")
    parser.add_argument("--no-color", action="store_true", help="Disable ANSI color codes")
    parser.add_argument("--all", action="store_true", help="Show all sections including unchanged ones")

    args = parser.parse_args()

    if args.no_color or not sys.stdout.isatty():
        Colors.disable()

    try:
        if args.old_file == "-":
            raw_old = sys.stdin.read()
            old_name = "stdin"
        else:
            with open(args.old_file, "r", encoding="utf-8") as f:
                raw_old = f.read()
            old_name = os.path.basename(args.old_file)

        with open(args.new_file, "r", encoding="utf-8") as f:
            raw_new = f.read()
        new_name = os.path.basename(args.new_file)
    except Exception as e:
        sys.stderr.write(f"Error reading input files: {e}\n")
        sys.exit(1)

    doc_a = WikitextParser.parse_document(raw_old, filename=old_name)
    doc_b = WikitextParser.parse_document(raw_new, filename=new_name)

    diffs, stats, ref_label_map = RefDiffEngine.compare_documents(doc_a, doc_b)

    if args.json:
        print(JsonFormatter.render(doc_a, doc_b, diffs, stats, ref_label_map))
    elif args.stat:
        print(StatFormatter.render(doc_a, doc_b, diffs, stats, ref_label_map))
    else:
        print(TerminalFormatter.render(doc_a, doc_b, diffs, stats, ref_label_map, show_all=args.all))


if __name__ == "__main__":
    main()
