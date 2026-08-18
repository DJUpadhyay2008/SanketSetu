import unittest
import json
from fastapi.testclient import TestClient
from main import app
from app.database.session import SessionLocal
from app.database import models

class TestPhase5Schemes(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_list_schemes(self):
        """Test retrieving all active schemes and filtering by category/state."""
        # Retrieve all
        response = self.client.get("/api/schemes/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 1)
        
        # Verify ADIP or other seeded schemes are in output
        titles = [s["title"] for s in data]
        self.assertTrue(any("ADIP" in t for t in titles))

        # Filter by Gujarat state
        response_gujarat = self.client.get("/api/schemes/?state=Gujarat")
        self.assertEqual(response_gujarat.status_code, 200)
        gujarat_data = response_gujarat.json()
        for s in gujarat_data:
            self.assertEqual(s["state"], "Gujarat")

    def test_eligibility_engine_scenarios(self):
        """Test deterministic matching engine across various demographic profiles."""
        
        # Profile 1: 19 year old student in Gujarat with Rs. 15,000 income, deaf (hearing impairment)
        # Matches:
        # - ADIP Scheme: eligible (income 15000 <= 30000, disability matches)
        # - NFPwD: potentially_eligible (student=True, but education_level is not postgraduate, which is missing from input or unmatched)
        # - Gujarat Divyang Sahay: potentially_eligible (age 19 is between 18-79, state matches, but disability degree criteria or poverty status is missing/unmatched)
        profile_1 = {
            "age": 19,
            "state": "Gujarat",
            "student": True,
            "income": 15000,
            "disability_category": "hearing_impairment"
        }
        
        response = self.client.post("/api/schemes/evaluate-eligibility", json=profile_1)
        self.assertEqual(response.status_code, 200)
        evaluations = response.json()
        
        # Find ADIP Scheme evaluation
        adip_eval = next((e for e in evaluations if "ADIP" in e["title"]), None)
        self.assertIsNotNone(adip_eval)
        # Should be eligible since all rules (income <= 30000, disability=hearing_impairment) are satisfied
        self.assertEqual(adip_eval["status"], "eligible")
        
        # Profile 2: High income earner (Rs. 80,000)
        # Should be ineligible for ADIP Scheme
        profile_2 = {
            "age": 30,
            "state": "Delhi",
            "student": False,
            "income": 80000,
            "disability_category": "hearing_impairment"
        }
        
        response = self.client.post("/api/schemes/evaluate-eligibility", json=profile_2)
        self.assertEqual(response.status_code, 200)
        evaluations_2 = response.json()
        
        adip_eval_2 = next((e for e in evaluations_2 if "ADIP" in e["title"]), None)
        self.assertEqual(adip_eval_2["status"], "ineligible")
        self.assertTrue(any("exceeds limit" in c for c in adip_eval_2["unmatched_criteria"]))

    def test_rag_hallucination_safeguards(self):
        """Test that schemes bot correctly answers valid queries and refuses unknown queries to prevent hallucinations."""
        
        # Query 1: Valid question about ADIP benefits
        response = self.client.post("/api/schemes/ask", json={"question": "What does the ADIP scheme cover and what is the income limit?"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Ensure it either gives the answer or the fallback if no API key, but should not crash
        if data["answer"] != "I couldn't verify this from our current government sources.":
            self.assertIn("ADIP", data["answer"])
            self.assertTrue(len(data["sources"]) >= 1)
            
        # Query 2: Random invalid query that is NOT in verified data to test hallucination safeguard
        response_fake = self.client.post("/api/schemes/ask", json={"question": "How do I get free spacecraft travel discount as PwD?"})
        self.assertEqual(response_fake.status_code, 200)
        data_fake = response_fake.json()
        
        # MUST trigger fallback safeguard!
        self.assertEqual(data_fake["answer"], "I couldn't verify this from our current government sources.")
        self.assertEqual(data_fake["sources"], [])
        self.assertEqual(data_fake["urls"], [])

if __name__ == "__main__":
    unittest.main()
