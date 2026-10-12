from pydantic import BaseModel, Field
from typing import Optional


class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2)
    age: int = Field(..., ge=0, le=120)
    gender: str

    mobile: Optional[str] = None

    identifier_type: str = "ABHA"

    abha_id: Optional[str] = None
    aadhaar_id: Optional[str] = None

    password: str = Field(..., min_length=6)

    preferred_language: str = "English"
    consent_given: bool = False


class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str

    mobile: Optional[str] = None

    identifier_type: str

    abha_id: Optional[str] = None
    aadhaar_id: Optional[str] = None

    preferred_language: str
    consent_given: bool

    class Config:
        from_attributes = True