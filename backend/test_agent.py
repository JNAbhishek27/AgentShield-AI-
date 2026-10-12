import unittest
import asyncio
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from backend.providers import DeterministicMockProvider
    from backend.agent import InvestigationAgent
except ImportError:
    from providers import DeterministicMockProvider
    from agent import InvestigationAgent

class TestAgentWorkflow(unittest.TestCase):
    def setUp(self):
        self.agent = InvestigationAgent(provider_type="mock")

    def test_mock_provider_health(self):
        async def run_check():
            health = await self.agent.provider.check_health()
            self.assertTrue(health["ok"])
            self.assertIn("latency_ms", health)
        asyncio.run(run_check())

    def test_investigate_evidence_verification(self):
        async def run_investigate():
            sample_incident = {
                "id": "TEST-01",
                "title": "PostgreSQL connection pool timeout",
                "severity": "Critical",
                "affected_service": "payment-gateway",
                "logs": [
                    {"line_number": 5, "message": "TimeoutError: ResourceRequest timed out after 5000ms"}
                ]
            }
            res = await self.agent.investigate(sample_incident)
            self.assertIn("hypotheses", res)
            self.assertGreater(len(res["hypotheses"]), 0)
            top_hyp = res["hypotheses"][0]
            self.assertEqual(top_hyp["category"], "database")
            self.assertIn("supporting_evidence", top_hyp)
            self.assertGreater(len(top_hyp["supporting_evidence"]), 0)
        asyncio.run(run_investigate())

if __name__ == "__main__":
    unittest.main()
