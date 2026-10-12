import os
import time
import json
from typing import Dict, Any, List

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False
    import urllib.request
    import urllib.error

class AIProvider:
    def is_configured(self) -> bool:
        raise NotImplementedError

    async def check_health(self) -> Dict[str, Any]:
        raise NotImplementedError

    async def investigate(self, context: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

class NebiusAIProvider(AIProvider):
    """
    Official Nebius Token Factory Provider using NVIDIA open-source models
    such as nvidia/Llama-3.1-Nemotron-70B-Instruct-HF.
    """
    def __init__(self):
        self.base_url = os.getenv("NEBIUS_BASE_URL", "https://api.studio.nebius.ai/v1").rstrip("/")
        self.api_key = os.getenv("NEBIUS_API_KEY", "")
        self.model = os.getenv("NEBIUS_MODEL", "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF")

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key != "your-nebius-token-factory-api-key" and len(self.api_key) > 5)

    async def check_health(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "ok": False,
                "message": "NEBIUS_API_KEY not configured in environment"
            }
        start = time.time()
        try:
            if HAS_HTTPX:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    res = await client.get(
                        f"{self.base_url}/models",
                        headers={"Authorization": f"Bearer {self.api_key}"}
                    )
                    latency = int((time.time() - start) * 1000)
                    if res.status_code == 200:
                        return {"ok": True, "message": f"Connected to Nebius Token Factory ({self.model})", "latency_ms": latency}
                    return {"ok": False, "message": f"Nebius error: {res.status_code}", "latency_ms": latency}
            else:
                req = urllib.request.Request(
                    f"{self.base_url}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                with urllib.request.urlopen(req, timeout=8.0) as response:
                    latency = int((time.time() - start) * 1000)
                    return {"ok": True, "message": f"Connected to Nebius Token Factory ({self.model})", "latency_ms": latency}
        except Exception as e:
            return {"ok": False, "message": str(e)}

    async def investigate(self, context: Dict[str, Any]) -> Dict[str, Any]:
        start = time.time()
        system_prompt = (
            "You are AgentShield, an evidence-driven AI incident investigator. "
            "You must cite ONLY real provided log lines and line numbers. "
            "Respond strictly in JSON with 'hypotheses', 'executive_summary', and 'uncertainty_factors'."
        )
        user_prompt = f"INCIDENT: {json.dumps(context)}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"}
                }
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            parsed["latency_ms"] = int((time.time() - start) * 1000)
            parsed["tokens_used"] = data.get("usage", {}).get("total_tokens")
            parsed["model"] = self.model
            parsed["provider"] = "Nebius Token Factory"
            return parsed

class DeterministicMockProvider(AIProvider):
    def __init__(self):
        self.model = "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF [Simulated]"

    def is_configured(self) -> bool:
        return True

    async def check_health(self) -> Dict[str, Any]:
        return {
            "ok": True,
            "message": "Deterministic mock provider active. Reproducible benchmarks ready.",
            "latency_ms": 5
        }

    async def investigate(self, context: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "hypotheses": [
                {
                    "title": "Database Connection Pool Exhaustion under Peak Traffic",
                    "explanation": "Connection pool maximum capacity of 10 was reached, blocking subsequent requests until acquisition timeout.",
                    "category": "database",
                    "model_confidence_score": 88,
                    "supporting_evidence": [
                        {
                            "source_location": "payment-gateway.log:5",
                            "excerpt": "TimeoutError: ResourceRequest timed out after 5000ms",
                            "relevance_explanation": "Direct log verification of connection timeout"
                        }
                    ],
                    "contradicting_evidence": [],
                    "missing_information": ["pg_stat_activity view snapshot"],
                    "recommended_diagnostic_step": "Scale pool max capacity and wrap connections in try/finally blocks."
                }
            ],
            "executive_summary": "Identified database pool saturation as primary root cause with verified citations.",
            "uncertainty_factors": ["Direct database query statistics not present in application logs"],
            "latency_ms": 350,
            "tokens_used": 540,
            "model": self.model,
            "provider": "Deterministic Mock Provider"
        }
