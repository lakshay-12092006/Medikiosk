from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.patient import Patient
from app.models.case import ClinicalCase
from app.models.document import MedicalDocument

from app.services.structured_summary import (
    generate_structured_summary
)


router = APIRouter(
    prefix="/case-summary",
    tags=["Structured Case Summary"]
)


@router.post("/generate")
def generate_summary(data: dict):
    """
    Generate a structured physician-ready
    patient case summary from provided data.
    """

    patient_data = data.get(
        "patient_data",
        {}
    )

    case_data = data.get(
        "case_data",
        {}
    )

    document_data = data.get(
        "document_data",
        {}
    )

    summary = generate_structured_summary(
        patient_data=patient_data,
        case_data=case_data,
        document_data=document_data
    )

    return {
        "message": "Structured case summary generated successfully",
        "summary": summary
    }


@router.get("/{patient_id}")
def get_patient_summary(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """
    Automatically generate a structured summary
    using patient and clinical case data from database.
    """

    # ---------------------------------------------
    # 1. GET PATIENT
    # ---------------------------------------------

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


    # ---------------------------------------------
    # 2. GET LATEST CLINICAL CASE
    # ---------------------------------------------

    case = (
        db.query(ClinicalCase)
        .filter(
            ClinicalCase.patient_id == patient_id
        )
        .order_by(
            ClinicalCase.id.desc()
        )
        .first()
    )

    if not case:

        raise HTTPException(
            status_code=404,
            detail="Clinical case not found for this patient"
        )


    # ---------------------------------------------
    # 3. PATIENT DATA
    # ---------------------------------------------

    patient_data = {

        "name": patient.name,

        "age": patient.age,

        "gender": patient.gender,

        "preferred_language":
            patient.preferred_language
    }


    # ---------------------------------------------
    # 4. CASE DATA
    # ---------------------------------------------

    case_data = {

        "chief_complaint":
            case.chief_complaint,

        "current_history":
            case.current_history,

        "past_history":
            case.past_history,

        "medications":
            case.medications,

        "allergies":
            case.allergies,

        "family_history":
            case.family_history,

        "personal_history":
            case.personal_history,

        "review_of_systems":
            case.review_of_systems,

        "ayush_assessment":
            case.ayush_assessment,

        "clinical_alerts":
            case.clinical_alerts
    }

    # ---------------------------------------------
    # 5. GET PATIENT DOCUMENTS
    # ---------------------------------------------

    documents = (
        db.query(MedicalDocument)
        .filter(
            MedicalDocument.patient_id == patient_id
        )
        .order_by(
            MedicalDocument.id.desc()
        )
        .all()
    )


    # ---------------------------------------------
    # 6. COMBINE DOCUMENT INFORMATION
    # ---------------------------------------------

    import json

    document_medicines = []
    document_diagnoses = []
    document_investigations = []
    document_dates = []
    document_timeline = []


    for document in documents:

        try:
            document_medicines.extend(
                json.loads(
                    document.medicines or "[]"
                )
            )

            document_diagnoses.extend(
                json.loads(
                    document.diagnoses or "[]"
                )
            )

            document_investigations.extend(
                json.loads(
                    document.investigations or "[]"
                )
            )

            document_dates.extend(
                json.loads(
                    document.dates or "[]"
                )
            )

            document_timeline.extend(
                json.loads(
                    document.medical_timeline or "[]"
                )
            )

        except json.JSONDecodeError:
            continue


    # Remove duplicates

    document_medicines = list(
        dict.fromkeys(document_medicines)
    )

    document_diagnoses = list(
        dict.fromkeys(document_diagnoses)
    )

    document_investigations = list(
        dict.fromkeys(document_investigations)
    )

    document_dates = list(
        dict.fromkeys(document_dates)
    )


    document_data = {

        "medicines":
            document_medicines,

        "diagnoses":
            document_diagnoses,

        "investigations":
            document_investigations,

        "dates":
            document_dates,

        "medical_timeline":
            document_timeline
    }
    
    # ---------------------------------------------
    # 7. GENERATE SUMMARY
    # ---------------------------------------------

    summary = generate_structured_summary(

        patient_data=patient_data,

        case_data=case_data,

        document_data=document_data
    )


    return {

        "message":
            "Patient structured case summary generated successfully",

        "patient_id":
            patient_id,

        "summary":
            summary
    }