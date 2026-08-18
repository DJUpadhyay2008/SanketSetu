import unittest
from fastapi.testclient import TestClient
from main import app
from datetime import datetime, timedelta

class TestPhase6Assist(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_list_accessible_directory(self):
        """Test retrieving the directory of accessible public entities."""
        response = self.client.get("/api/assist/directory")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 2)
        
        # Verify specific mock keys are returned
        first_item = data[0]
        self.assertIn("id", first_item)
        self.assertIn("name", first_item)
        self.assertIn("category", first_item)
        self.assertIn("address", first_item)
        self.assertIn("isl_certified", first_item)

    def test_request_interpreter(self):
        """Test requesting a human sign language interpreter match."""
        scheduled_time = (datetime.now() + timedelta(days=2)).isoformat()
        payload = {
            "service_type": "medical_emergency",
            "description": "Deaf patient consultation in Vadodara Hospital",
            "location": "Vadodara Central Clinic",
            "scheduled_time": scheduled_time
        }
        response = self.client.post("/api/assist/request", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["service_type"], payload["service_type"])
        self.assertEqual(data["description"], payload["description"])
        self.assertEqual(data["location"], payload["location"])
        self.assertEqual(data["status"], "pending")
        self.assertIsNone(data["interpreter_name"])

    def test_list_active_requests(self):
        """Test listing existing interpreter requests."""
        response = self.client.get("/api/assist/requests")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 1)
        self.assertIn("interpreter_name", data[0])
        self.assertIn("status", data[0])

if __name__ == "__main__":
    unittest.main()
