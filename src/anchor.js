  /* ==========================================================================
     VIRTUAL FILE: src/anchor.js
     Description: Live DOM footnote anchor discovery engine. Maps citation tokens,
                  named references, and shortened footnote FOOTNOTE anchors to
                  Wikipedia's cite_note elements to activate native popups.
     ========================================================================== */

  /**
   * Sanitizes a string for use in HTML element ID attributes.
   * @param {string} str
   * @returns {string}
   */
  function sanitizeAnchor(str) {
    return String(str || '').trim().replace(/[^a-zA-Z0-9_\-.:]+/g, '_').replace(/^_+|_+$/g, '');
  }

  /**
   * Discovers the corresponding #cite_note anchor ID in the live document, if present.
   * Matches explicit reference names directly (name="ABC"). For anonymous/unnamed references,
   * matches persistent identifiers (DOI, PMID, PMC, unique URL) in the rendered document,
   * falling back to template metadata, plain text content, or sequential reference numbering.
   * @param {string|null} name Reference name attribute
   * @param {string} rawContent Raw wikitext content of the reference
   * @param {string} [label] Badge label (e.g. 'ref2', 'kami')
   * @returns {string|null} Anchor element ID (e.g. 'cite_note-AlicanteRyanair-57') or null
   */
  function findCiteNoteAnchor(name, rawContent, label) {
    if (typeof document === 'undefined' || !document.querySelector) return null;

    // 1. Try explicit reference name (e.g. cite_note-name-1 or cite_note-FOOTNOTE...)
    if (name) {
      const candidates = [name];
      if (/\s/.test(name)) {
        candidates.push(name.trim().replace(/\s+/g, '_'));
      }
      for (const cand of candidates) {
        try {
          const safe = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(cand) : cand.replace(/["\\]/g, '\\$&');
          const el = document.querySelector(`[id^="cite_note-${safe}-"], [id="cite_note-${safe}"]`) ||
            (safe.startsWith('FOOTNOTE') ? document.querySelector(`[id*="${safe}"]`) : null);
          if (el && el.id) return el.id;
        } catch (_e) {
          // Selector query failed
        }
      }

      // Fallback manual scan if selector query did not find or threw
      try {
        const allNotes = document.querySelectorAll('[id^="cite_note-"]');
        if (allNotes && allNotes.length > 0) {
          for (const cand of candidates) {
            const prefix = `cite_note-${cand}-`.toLowerCase();
            const exact = `cite_note-${cand}`.toLowerCase();
            const candLower = cand.toLowerCase();
            for (let i = 0; i < allNotes.length; i++) {
              const id = allNotes[i].id.toLowerCase();
              if (id === exact || id.startsWith(prefix) || id.includes(candLower)) return allNotes[i].id;
            }
          }
        }
      } catch (_e) {
        // Fallback scan error ignored
      }
    }

    if (rawContent && typeof rawContent === 'string') {
      // 2. If sfn template, match author/year in .references li text
      if (/\{\{\s*sfn/i.test(rawContent)) {
        const info = extractSfnInfo(rawContent.replace(/^\{\{\s*sfn[a-z]*\|?/i, '').replace(/\}\}$/, ''));
        if (info && info.authors && info.authors.length) {
          const allNotes = document.querySelectorAll('.references li[id^="cite_note-"]');
          for (let i = 0; i < allNotes.length; i++) {
            const text = allNotes[i].textContent;
            const matchesAuthors = info.authors.every(a => text.includes(a));
            const matchesYear = !info.year || text.includes(info.year);
            if (matchesAuthors && matchesYear) {
              return allNotes[i].id;
            }
          }
        }
      }

      // 3. For anonymous/unnamed references: Try matching persistent identifiers (URL, DOI, PMID, PMC) in rendered reference list
      // MediaWiki renders these identifiers into external anchor links inside .references li[id^="cite_note-"]
      const idCandidates = [];

      // Web URL (e.g. https://www.example.com/...)
      const urlMatch = rawContent.match(/https?:\/\/[^\s|}<>"]+/);
      if (urlMatch) {
        idCandidates.push(urlMatch[0]);
      }

      // DOI (e.g. 10.1183/20734735.0310-2019)
      const doiMatch = rawContent.match(/\b(?:doi\s*=\s*(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:)?|https?:\/\/(?:dx\.)?doi\.org\/)?(10\.\d{4,9}\/[^\s|}<>"]+)/i);
      if (doiMatch) {
        idCandidates.push(doiMatch[1]);
      }

      // PMID (e.g. pmid = 31803258)
      const pmidMatch = rawContent.match(/\bpmid\s*=\s*(\d+)/i);
      if (pmidMatch) {
        idCandidates.push(pmidMatch[1]);
      }

      // PMC (e.g. pmc = 6885340)
      const pmcMatch = rawContent.match(/\bpmc\s*=\s*(?:PMC)?(\d+)/i);
      if (pmcMatch) {
        idCandidates.push(pmcMatch[1]);
      }

      // ISBN (e.g. isbn = 978-0-12-345678-9 matching Special:BookSources/...)
      const isbnMatch = rawContent.match(/\bisbn\s*=\s*([0-9Xx-]+)/i);
      if (isbnMatch) {
        const cleanIsbn = isbnMatch[1].replace(/[- ]/g, '').trim();
        if (cleanIsbn.length >= 9) {
          idCandidates.push(cleanIsbn);
        }
      }

      for (let idx = 0; idx < idCandidates.length; idx++) {
        const idVal = idCandidates[idx];
        try {
          const safeId = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(idVal) : idVal.replace(/["\\]/g, '\\$&');
          const link = document.querySelector(`.references a[href*="${safeId}"], #mw-content-text a.external[href*="${safeId}"], #mw-content-text a[href*="${safeId}"]`);
          if (link && link.closest) {
            const li = link.closest('li[id^="cite_note-"]');
            if (li && li.id) return li.id;
          }
        } catch (_e) {
          // Selector query failed, fallback to loop
        }
        try {
          const refLinks = document.querySelectorAll('.references a[href]');
          for (let i = 0; i < refLinks.length; i++) {
            const href = refLinks[i].getAttribute('href');
            if (href && href.includes(idVal)) {
              const li = refLinks[i].closest ? refLinks[i].closest('li[id^="cite_note-"]') : null;
              if (li && li.id) return li.id;
            }
          }
        } catch (_e) {
          // Loop error ignored
        }
      }

      // 4. Citation template metadata matching (title and/or author)
      const titleM = rawContent.match(/\btitle\s*=\s*([^|}]+)/i);
      const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').replace(/['[\]]/g, '').trim().toLowerCase() : '';

      const authorM = rawContent.match(/\b(?:author|last|author1|last1)\s*=\s*([^|}]+)/i);
      const author = authorM ? authorM[1].replace(/<[^>]+>/g, '').replace(/['[\]]/g, '').trim().toLowerCase() : '';

      if (title || author) {
        const allNotes = document.querySelectorAll('.references li[id^="cite_note-"], li[id^="cite_note-"]');
        for (let i = 0; i < allNotes.length; i++) {
          const text = (allNotes[i].textContent || '').toLowerCase();
          if (title && author) {
            if (text.includes(title) && text.includes(author)) return allNotes[i].id;
          } else if (title && title.length >= 4 && text.includes(title)) {
            return allNotes[i].id;
          } else if (author && author.length >= 4 && text.includes(author)) {
            return allNotes[i].id;
          }
        }
      }

      // 5. Plain text reference matching (non-template <ref>Some text...</ref>)
      const cleanText = rawContent.replace(/<[^>]+>/g, '').replace(/\{\{[^}]+\}\}/g, '').trim();
      if (cleanText.length >= 10) {
        const needle = cleanText.slice(0, 40).toLowerCase();
        const allNotes = document.querySelectorAll('.references li[id^="cite_note-"], li[id^="cite_note-"]');
        for (let i = 0; i < allNotes.length; i++) {
          const text = (allNotes[i].textContent || '').toLowerCase();
          if (text.includes(needle)) return allNotes[i].id;
        }
      }
    }

    // 6. Positional anonymous reference fallback (e.g. label 'ref2' -> id 'cite_note-2')
    if (label) {
      const numMatch = String(label).match(/^ref(\d+)$/i);
      if (numMatch) {
        const candidate = (document.getElementById && document.getElementById(`cite_note-${numMatch[1]}`)) ||
          (document.querySelector && document.querySelector(`[id="cite_note-${numMatch[1]}"]`));
        if (candidate && candidate.id) return candidate.id;
      }
    }

    return null;
  }
  /* === [END VIRTUAL FILE: src/anchor.js] === */
