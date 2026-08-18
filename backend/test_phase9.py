import unittest
from unittest.mock import patch, MagicMock
import uuid
from fastapi.testclient import TestClient
from main import app
from app.database.session import SessionLocal
from app.database import models

class TestPhase9OfflineAndLive(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()
        self.mock_user_id = "d3b07384-d113-495f-9e77-94d3a0429f55"
        self.mock_email = "citizen@sanketsetu.in"
        self.headers = {"Authorization": f"Bearer mock_jwt_token_for_{self.mock_email}"}

    def tearDown(self):
        self.db.close()

    # ── Emergency Pack (public, no auth) ──────────────────────

    def test_emergency_pack_is_public(self):
        """Emergency pack must be accessible without authentication."""
        response = self.client.get("/api/learning/emergency-pack")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("signs", data)
        self.assertGreaterEqual(len(data["signs"]), 7)
        words = [s["word"] for s in data["signs"]]
        self.assertIn("Help", words)
        self.assertIn("Hospital", words)
        self.assertIn("Emergency", words)

    def test_emergency_pack_has_required_fields(self):
        """Each sign must have word, description, icon, priority."""
        response = self.client.get("/api/learning/emergency-pack")
        data = response.json()
        for sign in data["signs"]:
            self.assertIn("word", sign)
            self.assertIn("description", sign)
            self.assertIn("icon", sign)
            self.assertIn("priority", sign)

    # ── Offline Progress Sync ──────────────────────────────────

    @patch("app.auth.dependencies.supabase_client.auth.get_user")
    def test_sync_offline_progress(self, mock_get_user):
        """Syncing offline progress for a valid lesson should succeed."""
        mock_supabase_response = MagicMock()
        mock_supabase_response.user.id = self.mock_user_id
        mock_supabase_response.user.email = self.mock_email
        mock_get_user.return_value = mock_supabase_response

        # Get a seeded lesson ID
        lesson = self.db.query(models.Lesson).first()
        self.assertIsNotNone(lesson, "Need at least one seeded lesson")
        course = self.db.query(models.Course).first()
        self.assertIsNotNone(course)

        payload = {
            "lesson_id": str(lesson.id),
            "course_id": str(course.id),
            "completed": True,
            "quiz_score": 85,
            "scenario_completed": True,
            "time_spent_seconds": 320,
            "completed_at": "2026-08-16T14:00:00Z"
        }
        response = self.client.post("/api/learning/progress", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "synced")
        self.assertEqual(data["lesson_id"], str(lesson.id))

    @patch("app.auth.dependencies.supabase_client.auth.get_user")
    def test_sync_invalid_lesson_id_returns_400(self, mock_get_user):
        """Invalid lesson_id format should return 400."""
        mock_supabase_response = MagicMock()
        mock_supabase_response.user.id = self.mock_user_id
        mock_supabase_response.user.email = self.mock_email
        mock_get_user.return_value = mock_supabase_response

        payload = {
            "lesson_id": "not-a-uuid",
            "course_id": str(uuid.uuid4()),
            "completed": True,
        }
        response = self.client.post("/api/learning/progress", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 400)

    # ── Sanket Live CV API ─────────────────────────────────────

    def test_recognize_learning_mode(self):
        """Learning mode recognition returns valid sign, confidence, and feedback."""
        payload = {
            "frame_data": "AAAA",  # Minimal mock base64
            "target_sign": "Namaste",
        }
        response = self.client.post("/api/isl-live/recognize", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("recognized_sign", data)
        self.assertIn("confidence", data)
        self.assertIn("feedback", data)
        self.assertEqual(data["recognized_sign"], "Namaste")
        self.assertGreater(data["confidence"], 0.5)

    def test_recognize_communication_mode(self):
        """Communication mode (no target) returns a generic recognized sign."""
        payload = {"frame_data": "AAAA"}
        response = self.client.post("/api/isl-live/recognize", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("recognized_sign", data)
        self.assertGreater(data["confidence"], 0)

    def test_recognize_low_confidence_signal(self):
        """Sending a 'fail' target returns low confidence with try-again prompt."""
        payload = {"frame_data": "AAAA", "target_sign": "fail_test"}
        response = self.client.post("/api/isl-live/recognize", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertLess(data["confidence"], 0.5)
        self.assertIn("try again", data["feedback"].lower())

if __name__ == "__main__":
    unittest.main()
