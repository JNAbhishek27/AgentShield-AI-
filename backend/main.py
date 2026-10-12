import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import IncidentRepository
from .providers import NebiusAIProvider, DeterministicMockProvider
from .agent import InvestigationAgent
from .models import IncidentModel

app = FastAPI(
    title="AgentShield API",
    description="Evidence-Driven AI Incident Investigator powered by NVIDIA Nemotron on Nebius Token Factory",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

repo = IncidentRepository()
nebius_provider = NebiusAIProvider()
mock_provider = DeterministicMockProvider()

@app.get("/api/health")
async def health():
    active_type = os.getenv("AI_PROVIDER", "mock")
    active = nebius_provider if active_type == "nebius" and nebius_provider.is_configured() else mock_provider
    status = await active.check_health()
    return {
        "status": "ok",
        "active_provider": {
            "name": type(active).__name__,
            "model": getattr(active, "model", "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF"),
            "health": status
        }
    }

@app.get("/api/incidents")
async def get_incidents():
    return repo.get_all()

@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    inc = repo.get_by_id(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@app.post("/api/incidents/{incident_id}/investigate")
async def investigate_incident(incident_id: str):
    inc = repo.get_by_id(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    provider_type = os.getenv("AI_PROVIDER", "mock")
    agent = InvestigationAgent(provider_type)
    result = await agent.investigate(inc)
    return {"status": "completed", "result": result}
