"""Regression cases for grammar that language-model drafts confused."""
import unittest
import spacy
from letter_grammar import explain_grammar

class GrammarTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.nlp = spacy.load('en_core_web_sm', disable=['ner'])

    def check_note(self, english, contains, excludes=()):
        _, note = explain_grammar(self.nlp(english))
        for text in contains:
            self.assertIn(text, note, english)
        for text in excludes:
            self.assertNotIn(text, note, english)

    def test_future_is_not_simple_present(self):
        self.check_note('The thought process will slow down.', ['will', '동사원형', '미래'], ['현재형'])

    def test_perfect_is_not_simple_past(self):
        self.check_note('It has touched my heart.', ['현재완료', 'have/has'], ['have/had', '과거형입니다'])
        self.check_note('I had received your letter.', ['과거완료', 'had + 과거분사'])

    def test_progressive_and_passive(self):
        self.check_note('I was waiting for your letter when it came.', ['과거진행형', 'was waiting'])
        self.check_note('Only the results can be observed not the progress.', ['수동', 'can be observed'])

    def test_ing_does_not_automatically_mean_progressive(self):
        self.check_note("Don't worry about results, just be with the experimenting.", ['부정 명령'], ['현재진행형'])
        self.check_note('Writing is my job.', ['be동사'], ['현재진행형'])

    def test_infinitive_is_not_a_command(self):
        self.check_note('To be.', ['to부정사'], ['명령문'])

    def test_poetic_fragments_and_homographs(self):
        self.check_note('Love.', ['명사'], ['명령문'])
        self.check_note('Live!', ['명령문'])
        self.check_note('The deeper the will, the nearer the destination.', ['상관 비교', '생략'])
        self.check_note('Only a few enter and still fewer progressively follow it.', ['두 절', '현재형'])

if __name__ == '__main__':
    unittest.main()
