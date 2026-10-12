import time
from typing import Dict, Any, List
from .providers import NebiusAIProvider, DeterministicMockProvider

class InvestigationAgent:
    def __init__(self, provider_type: str = "mock"):
        if provider_type == "nebius":
            self.provider = NebiusAIProvider()
        else:
            self.provider = DeterministicMockProvider()

    async def investigate(self, incident: Dict[str, Any]) -> Dict[str, Any]:
        context = {
            "title": incident["title"],
            "severity": incident["severity"],
            "service": incident["affected_service"],
            "logs": incident.get("logs", [])[:20]
        }
        return await self.provider.investigate(context)
