import unittest
from fastapi.testclient import TestClient
from main import app

class TestPhase7IndexAndPassport(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_get_institutions_index(self):
        """Test retrieving list of institutions with calculated scores and breakdown."""
        response = self.client.get("/api/institutions/index")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 5)
        
        # Verify first item contains score details
        first = data[0]
        self.assertIn("readiness_score", first)
        self.assertIn("tier", first)
        self.assertIn("breakdown", first)
        self.assertIn("staff_training", first["breakdown"])
        self.assertIn("service_accessibility", first["breakdown"])

    def test_self_register_institution(self):
        """Test self-registering an institution."""
        payload = {
            "name": "IIT Bombay Campus",
            "category": "education",
            "city": "Mumbai",
            "has_isl_interpreters": True,
            "staff_trained_percentage": 50,
            "has_video_relay_services": True,
            "isl_resources_score": 10,
            "emergency_readiness_score": 10,
            "learning_participation_score": 7,
            "user_feedback_score": 8,
            "accessibility_audit_score": 8
        }
        response = self.client.post("/api/institutions/register", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "IIT Bombay Campus")
        self.assertEqual(data["is_verified"], False) # Must start as unverified
        self.assertGreater(data["readiness_score"], 50)

    def test_verify_institution(self):
        """Test admin verification of an institution."""
        # Unverified institution ID seeded: 4a0f8b1a-2009-4bf9-866d-1bf8cbbe1105
        inst_id = "4a0f8b1a-2009-4bf9-866d-1bf8cbbe1105"
        response = self.client.post(f"/api/institutions/{inst_id}/verify")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["is_verified"], True)

    def test_submit_self_evaluation_preview(self):
        """Test previewing scoring prior to publishing."""
        payload = {
            "has_isl_interpreters": True,
            "staff_trained_percentage": 80,
            "has_video_relay_services": True,
            "isl_resources_score": 12,
            "emergency_readiness_score": 12,
            "learning_participation_score": 8,
            "user_feedback_score": 9,
            "accessibility_audit_score": 9
        }
        response = self.client.post("/api/institutions/evaluate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["calculated_score"], 80)
        self.assertEqual(data["breakdown"]["staff_training"], 16) # 80% of 20 = 16

    def test_get_leaderboard_institutions(self):
        """Test retrieving the ranked leaderboard of institutions."""
        response = self.client.get("/api/leaderboard/institutions")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 5)
        # Verify they are ranked in descending order of score
        scores = [item["score"] for item in data]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_verify_credential_public(self):
        """Test public, masked credential verification endpoint."""
        # Seeded credential ID: 88888888-8888-4888-8888-88888888888f
        cred_id = "88888888-8888-4888-8888-88888888888f"
        response = self.client.get(f"/api/passport/verify/{cred_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["is_valid"], True)
        self.assertEqual(data["recipient_masked_name"], "S***** C******") # Sanket Citizen masked
        self.assertIn("Sanket Setu Platform Credential", data["disclaimer"])
        self.assertNotIn("Government", data["disclaimer"])

if __name__ == "__main__":
    unittest.main()
