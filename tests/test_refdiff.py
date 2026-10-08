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

    def test_parse_template(self):
        raw = "{{Cite book |author=Schmidt, Rainer |title=[[Venus (planet)|Venus]] Geology |year=2020 |pages=45–48}}"
        tmpl, params = WikitextParser.parse_template(raw)
        self.assertEqual(tmpl, "Cite book")
        self.assertEqual(params.get("author"), "Schmidt, Rainer")
        self.assertEqual(params.get("title"), "[[Venus (planet)|Venus]] Geology")
        self.assertEqual(params.get("year"), "2020")
        self.assertEqual(params.get("pages"), "45–48")

    def test_nested_templates_in_parameters(self):
        raw = "{{Cite book |title=Planets {{lang|la|Venus}} |pages=10}}"
        tmpl, params = WikitextParser.parse_template(raw)
        self.assertEqual(tmpl, "Cite book")
        self.assertEqual(params.get("title"), "Planets {{lang|la|Venus}}")
        self.assertEqual(params.get("pages"), "10")

    def test_section_and_inline_extraction(self):
        wikitext = (
            "== Geology ==\n"
            "The surface is rocky<ref name=\"s20\">{{Cite book |pages=10}}</ref>.\n"
            "== Climate ==\n"
            "It is hot<ref name=\"c20\">{{Cite web |url=http://example.com}}</ref>."
        )
        doc = WikitextParser.parse_document(wikitext)
        self.assertEqual(len(doc.sections), 2)
        self.assertEqual(doc.sections[0].title, "Geology")
        self.assertEqual(doc.sections[0].prose, "The surface is rocky⟦ref:s20⟧.")
        self.assertEqual(doc.sections[1].title, "Climate")
        self.assertEqual(doc.sections[1].prose, "It is hot⟦ref:c20⟧.")
        self.assertIn("s20", doc.citations)
        self.assertIn("c20", doc.citations)

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
        self.assertEqual(doc.citations["volc"].params.get("author"), "Vulcan")

    def test_diff_engine_parameter_isolation(self):
        old_text = "== Test ==\nVenus has volcanism<ref name=\"s1\">{{Cite book |pages=10}}</ref>."
        new_text = "== Test ==\nVenus has volcanism<ref name=\"s1\">{{Cite book |pages=20}}</ref>."
        doc_a = WikitextParser.parse_document(old_text)
        doc_b = WikitextParser.parse_document(new_text)

        diffs, stats = RefDiffEngine.compare_documents(doc_a, doc_b)
        self.assertEqual(len(diffs), 1)
        self.assertFalse(diffs[0].has_prose_changes)  # Prose was untouched!
        self.assertEqual(stats["words_added"], 0)
        self.assertEqual(stats["words_removed"], 0)
        self.assertEqual(stats["cits_modified"], 1)

        mod_cit = diffs[0].citation_delta.modified[0]
        self.assertEqual(mod_cit[1].ref_id, "s1")
        self.assertEqual(mod_cit[2]["pages"], ("10", "20"))

    def test_diff_engine_prose_isolation(self):
        old_text = "== Test ==\nVenus is cold<ref name=\"s1\">{{Cite book |pages=10}}</ref>."
        new_text = "== Test ==\nVenus is hot<ref name=\"s1\">{{Cite book |pages=10}}</ref>."
        doc_a = WikitextParser.parse_document(old_text)
        doc_b = WikitextParser.parse_document(new_text)

        diffs, stats = RefDiffEngine.compare_documents(doc_a, doc_b)
        self.assertTrue(diffs[0].has_prose_changes)
        self.assertEqual(stats["words_added"], 1)
        self.assertEqual(stats["words_removed"], 1)
        self.assertEqual(stats["cits_modified"], 0)

    def test_json_formatter(self):
        old_text = "== Test ==\nCold<ref name=\"s1\">{{Cite book |pages=10}}</ref>."
        new_text = "== Test ==\nHot<ref name=\"s1\">{{Cite book |pages=20}}</ref>."
        doc_a = WikitextParser.parse_document(old_text)
        doc_b = WikitextParser.parse_document(new_text)
        diffs, stats = RefDiffEngine.compare_documents(doc_a, doc_b)

        json_str = JsonFormatter.render(doc_a, doc_b, diffs, stats)
        data = json.loads(json_str)
        self.assertIn("summary", data)
        self.assertEqual(data["summary"]["prose_words_added"], 1)
        self.assertEqual(data["summary"]["citations_modified"], 1)
        self.assertEqual(data["sections"][0]["title"], "Test")

if __name__ == "__main__":
    unittest.main()
