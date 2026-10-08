#!/usr/bin/env python3
import unittest
import json
from refdiff import WikitextParser, RefDiffEngine, JsonFormatter, StatFormatter, TerminalFormatter

class TestRefDiffParser(unittest.TestCase):

    def test_parse_attributes(self):
        attr_str = 'name="schmidt2020" group=\'science\' details="pp. 12–15" unquoted=val'
        attrs = WikitextParser.parse_attributes(attr_str)
        self.assertEqual(attrs.get("name"), "schmidt2020")
        self.assertEqual(attrs.get("group"), "science")
        self.assertEqual(attrs.get("details"), "pp. 12–15")
        self.assertEqual(attrs.get("unquoted"), "val")

    def test_section_and_inline_extraction(self):
        wikitext = (
            "== Geology ==\n"
            "The surface is rocky<ref name=\"s20\">{{Cite book |pages=10}}</ref>.\n"
            "== Climate ==\n"
            "It is hot<ref name=\"c20\">See Smith 2020, p. 15</ref>."
        )
        doc = WikitextParser.parse_document(wikitext)
        self.assertEqual(len(doc.sections), 2)
        self.assertEqual(doc.sections[0].title, "Geology")
        self.assertEqual(doc.sections[0].prose, "The surface is rocky⟦ref:s20⟧.")
        self.assertEqual(doc.sections[1].title, "Climate")
        self.assertEqual(doc.sections[1].prose, "It is hot⟦ref:c20⟧.")
        self.assertIn("s20", doc.citations)
        self.assertEqual(doc.citations["s20"].raw_content, "{{Cite book |pages=10}}")
        self.assertIn("c20", doc.citations)
        self.assertEqual(doc.citations["c20"].raw_content, "See Smith 2020, p. 15")

    def test_references_hidden_block(self):
        wikitext = (
            "== Lead Section ==\n"
            "Venus is volcanic<ref name=\"volc\" />.\n\n"
            "<references hidden>\n"
            "<ref name=\"volc\">{{Cite book |author=Vulcan |year=2021}}</ref>\n"
            "</references>"
        )
        doc = WikitextParser.parse_document(wikitext)
        self.assertEqual(doc.sections[0].prose, "Venus is volcanic⟦ref:volc⟧.")
        self.assertIn("volc", doc.citations)
        self.assertTrue(doc.citations["volc"].is_definition)
        self.assertEqual(doc.citations["volc"].raw_content, "{{Cite book |author=Vulcan |year=2021}}")

    def test_diff_engine_named_ref_badge(self):
        old_text = "== Test ==\nVenus has volcanism<ref name=\"s1\">{{Cite book |pages=10}}</ref>."
        new_text = "== Test ==\nVenus has volcanism<ref name=\"s1\">{{Cite book |pages=20}}</ref>."
        doc_a = WikitextParser.parse_document(old_text)
        doc_b = WikitextParser.parse_document(new_text)

        diffs, stats, ref_label_map = RefDiffEngine.compare_documents(doc_a, doc_b)
        self.assertEqual(len(diffs), 1)
        self.assertTrue(diffs[0].has_prose_changes)
        self.assertEqual(stats["words_added"], 0)
        self.assertEqual(stats["words_removed"], 0)
        self.assertEqual(stats["cits_modified"], 1)

        # Check badge annotation in prose uses ⟨~s1~⟩
        prose_str = TerminalFormatter.render_tokens(diffs[0].prose_tokens)
        self.assertIn("⟨~s1~⟩", prose_str)

        # Check citation diff
        old_cit, new_cit, raw_diff = diffs[0].citation_delta.modified[0]
        self.assertEqual(new_cit.ref_id, "s1")
        rendered_cit = TerminalFormatter.render_tokens(raw_diff)
        self.assertIn("[- 10 -]", rendered_cit)
        self.assertIn("{+ 20 +}", rendered_cit)

        # Check full render output uses ⟨~s1~⟩
        full_render = TerminalFormatter.render(doc_a, doc_b, diffs, stats, ref_label_map)
        self.assertIn("🟡 MODIFIED ⟨~s1~⟩:", full_render)
        self.assertIn("⟨~s1~⟩", full_render)

        # Check stat output uses ⟨~s1~⟩
        stat_render = StatFormatter.render(doc_a, doc_b, diffs, stats, ref_label_map)
        self.assertIn("⟨~s1~⟩", stat_render)

    def test_diff_engine_anonymous_ref_fallback(self):
        old_text = "== Test ==\nVenus is hot<ref>{{Cite book |pages=10}}</ref>."
        new_text = "== Test ==\nVenus is very hot<ref>{{Cite book |pages=10}}</ref>."
        doc_a = WikitextParser.parse_document(old_text)
        doc_b = WikitextParser.parse_document(new_text)

        diffs, stats, ref_label_map = RefDiffEngine.compare_documents(doc_a, doc_b)
        self.assertTrue(diffs[0].has_prose_changes)
        self.assertEqual(stats["words_added"], 1)
        self.assertEqual(stats["words_removed"], 0)

        # Anonymous citation has standard cyan badge [ref1]
        self.assertEqual(diffs[0].prose_tokens[-2].ref_label, "ref1")

    def test_json_formatter(self):
        old_text = "== Test ==\nCold<ref name=\"s1\">See page 10</ref>."
        new_text = "== Test ==\nHot<ref name=\"s1\">See page 20</ref>."
        doc_a = WikitextParser.parse_document(old_text)
        doc_b = WikitextParser.parse_document(new_text)
        diffs, stats, ref_label_map = RefDiffEngine.compare_documents(doc_a, doc_b)

        json_str = JsonFormatter.render(doc_a, doc_b, diffs, stats, ref_label_map)
        data = json.loads(json_str)
        self.assertIn("summary", data)
        self.assertEqual(data["summary"]["prose_words_added"], 1)
        self.assertEqual(data["summary"]["citations_modified"], 1)
        self.assertEqual(data["sections"][0]["title"], "Test")
        self.assertEqual(data["sections"][0]["citation_delta"]["modified"][0]["ref_label"], "s1")

if __name__ == "__main__":
    unittest.main()
