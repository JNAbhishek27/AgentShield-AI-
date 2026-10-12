from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class LogEntryModel(BaseModel):
    id: str
    timestamp: str
    severity: str
    service: str
    message: str
    line_number: int
    request_id: Optional[str] = None
    stack_trace: Optional[List[str]] = None

class EvidenceItemModel(BaseModel):
    id: str
    source_type: str
    source_location: str
    timestamp: Optional[str] = None
    excerpt: str
    relevance_explanation: str
    supports_hypothesis_id: Optional[str] = None
    contradicts_hypothesis_id: Optional[str] = None
    verified: bool = True

class HypothesisModel(BaseModel):
    id: str
    title: str
    explanation: str
    category: str
    deterministic_confidence_score: int
    model_confidence_score: int
    supporting_evidence_ids: List[str] = []
    contradicting_evidence_ids: List[str] = []
    missing_information: List[str] = []
    recommended_diagnostic_step: str
    status: str = "active"

class CodePatchModel(BaseModel):
    id: str
    title: str
    explanation: str
    target_file: str
    diff: str
    patched_code: str
    status: str = "draft"
    validation_passed: bool = True

class ApprovalRecordModel(BaseModel):
    id: str
    action_proposed: str
    reviewer_decision: str
    reviewer_name: str
    timestamp: str
    comment: Optional[str] = None

class IncidentModel(BaseModel):
    id: str
    title: str
    severity: str
    status: str
    affected_service: str
    created_at: str
    error_count: int
    spike_ratio: float
    logs: List[LogEntryModel] = []
    hypotheses: List[HypothesisModel] = []
    evidence: List[EvidenceItemModel] = []
    patches: List[CodePatchModel] = []
    approvals: List[ApprovalRecordModel] = []
