from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.case import ClinicalCase
from app.models.patient import Patient
from app.schemas.case import (
    ClinicalCaseCreate,
    ClinicalCaseResponse
)


router = APIRouter(
    prefix="/cases",
    tags=["Clinical Cases"]
)


# =========================================================
# CREATE / SAVE PATIENT CASE
# =========================================================

@router.post(
    "/",
    response_model=ClinicalCaseResponse
)
def create_case(
    case: ClinicalCaseCreate,
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # Check patient
    # -----------------------------------------

    patient = (
        db.query(Patient)
        .filter(Patient.id == case.patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # -----------------------------------------
    # MediKiosk currently AYUSH focused
    # -----------------------------------------

    if case.opd_type.strip().upper() not in [
        "AYUSH",
        "AYURVEDA"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only AYUSH cases are supported."
        )

    # -----------------------------------------
    # Create new case
    # -----------------------------------------

    new_case = ClinicalCase(

        patient_id=case.patient_id,

        opd_type="AYUSH",

        chief_complaint=case.chief_complaint,

        current_history=case.current_history,

        past_history=case.past_history,

        medications=case.medications,

        allergies=case.allergies,

        family_history=case.family_history,

        personal_history=case.personal_history,

        review_of_systems=case.review_of_systems,

        ayush_assessment=case.ayush_assessment,

        clinical_alerts=case.clinical_alerts
    )

    # -----------------------------------------
    # Save to database
    # -----------------------------------------

    db.add(new_case)

    db.commit()

    db.refresh(new_case)

    return new_case


# =========================================================
# GET ALL CASES
# =========================================================

@router.get(
    "/",
    response_model=list[ClinicalCaseResponse]
)
def get_all_cases(
    db: Session = Depends(get_db)
):

    cases = (
        db.query(ClinicalCase)
        .order_by(ClinicalCase.created_at.desc())
        .all()
    )

    return cases


# =========================================================
# GET CASES OF A PARTICULAR PATIENT
# IMPORTANT FOR PATIENT DASHBOARD + DOCTOR DASHBOARD
# =========================================================

@router.get(
    "/patient/{patient_id}",
    response_model=list[ClinicalCaseResponse]
)
def get_patient_cases(
    patient_id: int,
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # Check patient exists
    # -----------------------------------------

    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # -----------------------------------------
    # Get patient's cases
    # -----------------------------------------

    cases = (
        db.query(ClinicalCase)
        .filter(
            ClinicalCase.patient_id == patient_id
        )
        .order_by(
            ClinicalCase.created_at.desc()
        )
        .all()
    )

    return cases


# =========================================================
# GET SINGLE CASE
# =========================================================

@router.get(
    "/{case_id}",
    response_model=ClinicalCaseResponse
)
def get_case(
    case_id: int,
    db: Session = Depends(get_db)
):

    case = (
        db.query(ClinicalCase)
        .filter(
            ClinicalCase.id == case_id
        )
        .first()
    )

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Clinical case not found"
        )

    return case