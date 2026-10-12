from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ConsultationCreate(BaseModel):
    case_id: int
    patient_id: int
    doctor_id: Optional[int] = None

    physician_notes: Optional[str] = None
    examination_findings: Optional[str] = None
    assessment_plan: Optional[str] = None
    follow_up_notes: Optional[str] = None


class ConsultationResponse(BaseModel):
    id: int
    case_id: int
    patient_id: int
    doctor_id: Optional[int] = None

    physician_notes: Optional[str] = None
    examination_findings: Optional[str] = None
    assessment_plan: Optional[str] = None
    follow_up_notes: Optional[str] = None

    created_at: datetime

    class Config:
        from_attributes = True