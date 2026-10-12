from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientResponse
from app.services.auth import hash_password, verify_password


router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)


# =========================
# CREATE PATIENT ACCOUNT
# =========================
@router.post("/", response_model=PatientResponse)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db)
):
    # Check identification method
    if patient.identifier_type not in ["ABHA", "AADHAAR"]:
        raise HTTPException(
            status_code=400,
            detail="Identifier type must be ABHA or AADHAAR"
        )

    # =========================
    # ABHA REGISTRATION
    # =========================
    if patient.identifier_type == "ABHA":

        if not patient.abha_id:
            raise HTTPException(
                status_code=400,
                detail="ABHA ID is required"
            )

        existing_patient = (
            db.query(Patient)
            .filter(Patient.abha_id == patient.abha_id)
            .first()
        )

        if existing_patient:
            raise HTTPException(
                status_code=400,
                detail="Patient with this ABHA ID already exists"
            )

        aadhaar_id = None
        abha_id = patient.abha_id

    # =========================
    # AADHAAR REGISTRATION
    # =========================
    else:

        if not patient.aadhaar_id:
            raise HTTPException(
                status_code=400,
                detail="Aadhaar ID is required"
            )

        existing_patient = (
            db.query(Patient)
            .filter(Patient.aadhaar_id == patient.aadhaar_id)
            .first()
        )

        if existing_patient:
            raise HTTPException(
                status_code=400,
                detail="Patient with this Aadhaar ID already exists"
            )

        abha_id = None
        aadhaar_id = patient.aadhaar_id

    # =========================
    # CREATE NEW PATIENT
    # =========================
    new_patient = Patient(
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        mobile=patient.mobile,

        identifier_type=patient.identifier_type,

        abha_id=abha_id,
        aadhaar_id=aadhaar_id,

        password_hash=hash_password(patient.password),

        preferred_language=patient.preferred_language,
        consent_given=patient.consent_given
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient


# =========================
# PATIENT LOGIN
# =========================
@router.post("/login", response_model=PatientResponse)
def login_patient(
    identifier_type: str,
    identifier: str,
    password: str,
    db: Session = Depends(get_db)
):

    if identifier_type not in ["ABHA", "AADHAAR"]:
        raise HTTPException(
            status_code=400,
            detail="Identifier type must be ABHA or AADHAAR"
        )

    # Find patient
    if identifier_type == "ABHA":

        patient = (
            db.query(Patient)
            .filter(Patient.abha_id == identifier)
            .first()
        )

    else:

        patient = (
            db.query(Patient)
            .filter(Patient.aadhaar_id == identifier)
            .first()
        )

    # Patient not found
    if not patient:
        raise HTTPException(
            status_code=401,
            detail="Invalid identification or password"
        )

    # Old accounts may not have password yet
    if not patient.password_hash:
        raise HTTPException(
            status_code=401,
            detail="This account needs password setup"
        )

    # Verify password
    if not verify_password(
        password,
        patient.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid identification or password"
        )

    return patient


# =========================
# GET ALL PATIENTS
# =========================
@router.get("/", response_model=list[PatientResponse])
def get_all_patients(
    db: Session = Depends(get_db)
):
    patients = db.query(Patient).all()
    return patients


# =========================
# GET SINGLE PATIENT
# =========================
@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db)
):

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

    return patient