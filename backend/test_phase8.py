import unittest
from unittest.mock import patch, MagicMock
import uuid
from fastapi.testclient import TestClient
from main import app
from app.database.session import SessionLocal
from app.database import models

class TestPhase8Community(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()
        
        # We need a stable mock user ID
        self.mock_user_id = "d3b07384-d113-495f-9e77-94d3a0429f55" # Seeded user
        self.mock_email = "citizen@sanketsetu.in"
        self.headers = {"Authorization": f"Bearer mock_jwt_token_for_{self.mock_email}"}

    def tearDown(self):
        self.db.close()

    @patch("app.auth.dependencies.supabase_client.auth.get_user")
    def test_get_partners_no_filter(self, mock_get_user):
        """Test retrieving list of potential practice partners."""
        mock_supabase_response = MagicMock()
        mock_supabase_response.user.id = self.mock_user_id
        mock_supabase_response.user.email = self.mock_email
        mock_get_user.return_value = mock_supabase_response

        response = self.client.get("/api/community/partners", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 1)
        
        # Verify no PII is returned
        for partner in data:
            self.assertIn("display_name", partner)
            self.assertIn("avatar_url", partner)
            self.assertIn("isl_level", partner)
            self.assertIn("badges", partner)
            self.assertIn("interests", partner)
            self.assertNotIn("email", partner)
            self.assertNotIn("disability_status", partner)
            self.assertNotIn("udid", partner)

    @patch("app.auth.dependencies.supabase_client.auth.get_user")
    def test_get_partners_level_filter(self, mock_get_user):
        """Test filtering partners by ISL Level."""
        mock_supabase_response = MagicMock()
        mock_supabase_response.user.id = self.mock_user_id
        mock_supabase_response.user.email = self.mock_email
        mock_get_user.return_value = mock_supabase_response

        response = self.client.get("/api/community/partners?level=2", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for p in data:
            self.assertEqual(p["isl_level"], 2)

    def test_get_mentors(self):
        """Test retrieving all active mentors with ratings and badges."""
        response = self.client.get("/api/community/mentors")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 1)
        
        # Check first mentor
        m = data[0]
        self.assertIn("display_name", m)
        self.assertIn("rating", m)
        self.assertIn("is_verified", m)
        self.assertIn("assessment_score", m)
        self.assertIn("reviews_count", m)

    @patch("app.auth.dependencies.supabase_client.auth.get_user")
    def test_practice_request_and_respond(self, mock_get_user):
        """Test sending and accepting a practice request."""
        mock_supabase_response = MagicMock()
        mock_supabase_response.user.id = self.mock_user_id
        mock_supabase_response.user.email = self.mock_email
        mock_get_user.return_value = mock_supabase_response

        # Find another user to send request to
        partner = self.db.query(models.Profile).filter(models.Profile.id != uuid.UUID(self.mock_user_id)).first()
        self.assertIsNotNone(partner)

        # Send request
        payload = {
            "receiver_id": str(partner.id),
            "service_type": "practice",
            "description": "Let's review healthcare signs together!",
            "location": "A-12, Green Park, Ahmedabad, Gujarat",
            "scheduled_time": "2026-08-20T15:00:00Z"
        }
        
        response = self.client.post("/api/community/requests", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        req_data = response.json()
        self.assertEqual(req_data["status"], "pending")
        # Assert location is truncated for privacy!
        self.assertEqual(req_data["location"], "Ahmedabad, Gujarat")

        # Now mock the receiver responding to it
        mock_receiver_response = MagicMock()
        mock_receiver_response.user.id = str(partner.id)
        mock_receiver_response.user.email = "partner@sanketsetu.in"
        mock_get_user.return_value = mock_receiver_response
        partner_headers = {"Authorization": f"Bearer mock_jwt_token_for_partner"}

        request_id = req_data["id"]
        response = self.client.post(
            f"/api/community/requests/{request_id}/respond", 
            json={"action": "accept"}, 
            headers=partner_headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["new_status"], "accepted")

    @patch("app.auth.dependencies.supabase_client.auth.get_user")
    def test_create_moderation_report(self, mock_get_user):
        """Test filing a content/user moderation report."""
        mock_supabase_response = MagicMock()
        mock_supabase_response.user.id = self.mock_user_id
        mock_supabase_response.user.email = self.mock_email
        mock_get_user.return_value = mock_supabase_response

        # Find another user to report
        partner = self.db.query(models.Profile).filter(models.Profile.id != uuid.UUID(self.mock_user_id)).first()
        self.assertIsNotNone(partner)

        payload = {
            "reported_user_id": str(partner.id),
            "content_type": "user",
            "reason": "Harassment during practice matching."
        }
        response = self.client.post("/api/community/reports", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")

if __name__ == "__main__":
    unittest.main()
