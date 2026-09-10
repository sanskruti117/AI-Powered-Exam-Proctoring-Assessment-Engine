import unittest

from backend.services.ai_evaluator import ImportedQuestionSet


class ImportedQuestionModelTests(unittest.TestCase):
    def test_mixed_question_payload_is_validated(self):
        payload = {
            "questions": [
                {
                    "question_text": "Which structure is LIFO?",
                    "question_type": "MCQ",
                    "options": [
                        {"option_text": "Stack", "is_correct": True, "order": 0},
                        {"option_text": "Queue", "is_correct": False, "order": 1},
                    ],
                },
                {
                    "question_text": "Explain normalization.",
                    "question_type": "LONG_ANSWER",
                    "expected_answer": "Discuss 1NF, 2NF and 3NF.",
                },
            ]
        }
        imported = ImportedQuestionSet.model_validate(payload)
        self.assertEqual(len(imported.questions), 2)
        self.assertTrue(imported.questions[0].options[0].is_correct)


if __name__ == "__main__":
    unittest.main()
