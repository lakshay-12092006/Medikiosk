from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# =========================================
# CREATE CLINICAL CASE
# =========================================

class ClinicalCaseCreate(BaseModel):

    patient_id: int

    opd_type: str = "AYUSH"

    chief_complaint: Optional[str] = None

    current_history: Optional[str] = None

    past_history: Optional[str] = None

    medications: Optional[str] = None

    allergies: Optional[str] = None

    family_history: Optional[str] = None

    personal_history: Optional[str] = None

    review_of_systems: Optional[str] = None

    ayush_assessment: Optional[str] = None

    clinical_alerts: Optional[str] = None


# =========================================
# RESPONSE
# =========================================

class ClinicalCaseResponse(BaseModel):

    id: int

    patient_id: int

    opd_type: str

    chief_complaint: Optional[str] = None

    current_history: Optional[str] = None

    past_history: Optional[str] = None

    medications: Optional[str] = None

    allergies: Optional[str] = None

    family_history: Optional[str] = None

    personal_history: Optional[str] = None

    review_of_systems: Optional[str] = None

    ayush_assessment: Optional[str] = None

    clinical_alerts: Optional[str] = None

    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True