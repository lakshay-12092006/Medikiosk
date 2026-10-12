from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.consultation import Consultation
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationResponse,
)

router = APIRouter(
    prefix="/consultations",
    tags=["Consultations"]
)


@router.post("/", response_model=ConsultationResponse)
def create_consultation(
    consultation_data: ConsultationCreate,
    db: Session = Depends(get_db)
):
    consultation = Consultation(
        case_id=consultation_data.case_id,
        patient_id=consultation_data.patient_id,
        doctor_id=consultation_data.doctor_id,
        physician_notes=consultation_data.physician_notes,
        examination_findings=consultation_data.examination_findings,
        assessment_plan=consultation_data.assessment_plan,
        follow_up_notes=consultation_data.follow_up_notes,
    )

    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    return consultation


@router.get(
    "/case/{case_id}",
    response_model=list[ConsultationResponse]
)
def get_case_consultations(
    case_id: int,
    db: Session = Depends(get_db)
):
    consultations = (
        db.query(Consultation)
        .filter(Consultation.case_id == case_id)
        .order_by(Consultation.created_at.desc())
        .all()
    )

    return consultations