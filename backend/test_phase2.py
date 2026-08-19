import unittest
from unittest.mock import patch, MagicMock
import uuid
from fastapi.testclient import TestClient

# Import our main app
from main import app
from app.database.session import SessionLocal
from app.database import models

class TestPhase2AuthAndProfile(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    @patch("app.auth.dependencies.supabase_client.auth.get_user")
    def test_authenticated_profile_flow(self, mock_get_user):
        # 1. Setup mock user details representing a successful email sign-in session
        mock_user_id = str(uuid.uuid4())
        mock_email = f"test_{mock_user_id[:8]}@sanketsetu.in"

        mock_supabase_response = MagicMock()
        mock_supabase_response.user.id = mock_user_id
        mock_supabase_response.user.email = mock_email
        mock_supabase_response.user.user_metadata = {
            "full_name": "Test Signer",
            "avatar_url": "https://sanketsetu.in/avatar.png"
        }

        mock_get_user.return_value = mock_supabase_response

        # 2. Test Unauthenticated Access: Should return 401 Unauthorized
        response = self.client.get("/api/users/me")
        self.assertEqual(response.status_code, 401)
        self.assertIn("Missing authorization header", response.json()["detail"])

        # 3. Test Authenticated Access: Should automatically sync user & profile in database
        headers = {"Authorization": f"Bearer mock_jwt_token_for_{mock_email}"}
        response = self.client.get("/api/users/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["email"], mock_email)
        self.assertEqual(data["roles"], ["learner"])

        # Verify database record exists
        db_user = self.db.query(models.User).filter(models.User.email == mock_email).first()
        self.assertIsNotNone(db_user)
        self.assertEqual(str(db_user.id), mock_user_id)

        # 4. Test GET /api/users/profile: Expose display_name, avatar_url, isl_level, badges, interests
        response = self.client.get("/api/users/profile", headers=headers)
        self.assertEqual(response.status_code, 200)
        profile_data = response.json()
        self.assertEqual(profile_data["display_name"], "Test Signer")
        self.assertEqual(profile_data["avatar_url"], "https://sanketsetu.in/avatar.png")
        self.assertEqual(profile_data["isl_level"], "1")
        self.assertEqual(profile_data["interests"], [])
        self.assertEqual(profile_data["badges"], [])

        # 5. Test PUT /api/users/profile: Update profile information
        update_payload = {
            "display_name": "Sanket Master",
            "interests": ["fingerspelling", "medical_emergency"]
        }
        response = self.client.put("/api/users/profile", json=update_payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        updated_data = response.json()
        self.assertEqual(updated_data["display_name"], "Sanket Master")
        self.assertEqual(updated_data["interests"], ["fingerspelling", "medical_emergency"])

        # Verify db updated values
        self.db.refresh(db_user)
        self.assertEqual(db_user.profile.display_name, "Sanket Master")
        self.assertEqual(db_user.profile.interests, ["fingerspelling", "medical_emergency"])

if __name__ == "__main__":
    unittest.main()
