from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)

from sqlalchemy.orm import Session

import os
import json
import uuid

from app.database.database import get_db
from app.models.patient import Patient
from app.models.case import ClinicalCase
from app.models.document import MedicalDocument

from app.services.document_processor import (
    extract_text_from_document,
    extract_document_information
)


router = APIRouter(
    prefix="/documents",
    tags=["Medical Documents"]
)


# =========================================================
# UPLOAD DIRECTORY
# =========================================================

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# =========================================================
# ALLOWED FILE TYPES
# =========================================================

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png"
}


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def safe_json_load(value):
    """
    Safely convert stored JSON text into Python data.
    """
    if not value:
        return []

    try:
        return json.loads(value)
    except Exception:
        return []


def build_fallback_timeline(
    dates,
    medicines,
    diagnoses,
    investigations
):
    """
    If the document processor does not generate a timeline,
    create a simple date-wise timeline for the prototype.
    """

    if not dates:
        return []

    timeline = []

    for date in dates:

        timeline.append({
            "date": str(date),
            "medicines": medicines,
            "diagnoses": diagnoses,
            "investigations": investigations
        })

    return timeline


def serialize_document(document):
    """
    Convert database document into frontend-friendly response.
    """

    medicines = safe_json_load(
        document.medicines
    )

    diagnoses = safe_json_load(
        document.diagnoses
    )

    investigations = safe_json_load(
        document.investigations
    )

    dates = safe_json_load(
        document.dates
    )

    medical_timeline = safe_json_load(
        document.medical_timeline
    )

    # Create fallback timeline if processor
    # did not generate one.
    if not medical_timeline:

        medical_timeline = build_fallback_timeline(
            dates=dates,
            medicines=medicines,
            diagnoses=diagnoses,
            investigations=investigations
        )

    return {
        "id": document.id,

        "patient_id": document.patient_id,

        "case_id": document.case_id,

        "filename": document.filename,

        "file_type": document.file_type,

        "ocr_text": document.ocr_text,

        "medicines": medicines,

        "diagnoses": diagnoses,

        "investigations": investigations,

        "dates": dates,

        "medical_timeline": medical_timeline,

        "created_at": document.created_at
    }


# =========================================================
# UPLOAD MEDICAL DOCUMENT
# =========================================================

@router.post("/upload")
async def upload_document(
    patient_id: int,
    file: UploadFile = File(...),
    case_id: int | None = None,
    db: Session = Depends(get_db)
):

    """
    Upload and process a patient's medical document.

    Workflow:

    Patient
       ↓
    Clinical Case
       ↓
    Document Upload
       ↓
    OCR
       ↓
    Medical Information Extraction
       ↓
    Document linked to Case
       ↓
    Doctor Review
    """

    # -----------------------------------------------------
    # 1. CHECK PATIENT
    # -----------------------------------------------------

    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id
        )
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )


    # -----------------------------------------------------
    # 2. FIND / VALIDATE CASE
    # -----------------------------------------------------

    selected_case = None

    if case_id is not None:

        selected_case = (
            db.query(ClinicalCase)
            .filter(
                ClinicalCase.id == case_id,
                ClinicalCase.patient_id == patient_id
            )
            .first()
        )

        if not selected_case:

            raise HTTPException(
                status_code=404,
                detail="Clinical case not found for this patient."
            )

    else:

        # If frontend does not send case_id,
        # automatically attach document to
        # patient's latest AYUSH case.

        selected_case = (
            db.query(ClinicalCase)
            .filter(
                ClinicalCase.patient_id == patient_id
            )
            .order_by(
                ClinicalCase.created_at.desc()
            )
            .first()
        )


    # -----------------------------------------------------
    # 3. CHECK FILE NAME
    # -----------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )


    # -----------------------------------------------------
    # 4. CHECK FILE TYPE
    # -----------------------------------------------------

    original_filename = file.filename

    file_extension = os.path.splitext(
        original_filename
    )[1].lower()

    if file_extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF, JPG, JPEG and PNG "
                "files are allowed."
            )
        )


    # -----------------------------------------------------
    # 5. READ FILE
    # -----------------------------------------------------

    file_content = await file.read()

    if not file_content:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )


    # -----------------------------------------------------
    # 6. CREATE UNIQUE FILE NAME
    # -----------------------------------------------------

    unique_filename = (
        f"{uuid.uuid4().hex}"
        f"{file_extension}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        unique_filename
    )


    # -----------------------------------------------------
    # 7. SAVE FILE
    # -----------------------------------------------------

    try:

        with open(
            file_path,
            "wb"
        ) as buffer:

            buffer.write(
                file_content
            )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to save document: {str(e)}"
            )
        )


    # -----------------------------------------------------
    # 8. OCR / TEXT EXTRACTION
    # -----------------------------------------------------

    try:

        extracted_text = (
            extract_text_from_document(
                file_path
            )
        )

    except Exception as e:

        if os.path.exists(file_path):

            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail=(
                f"Document OCR failed: {str(e)}"
            )
        )


    # -----------------------------------------------------
    # 9. MEDICAL INFORMATION EXTRACTION
    # -----------------------------------------------------

    try:

        medical_information = (
            extract_document_information(
                extracted_text
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Medical information extraction failed: "
                f"{str(e)}"
            )
        )


    # -----------------------------------------------------
    # 10. EXTRACT DATA
    # -----------------------------------------------------

    medicines = medical_information.get(
        "medicines",
        []
    )

    diagnoses = medical_information.get(
        "diagnoses",
        []
    )

    investigations = medical_information.get(
        "investigations",
        []
    )

    dates = medical_information.get(
        "dates",
        []
    )

    medical_timeline = medical_information.get(
        "medical_timeline",
        []
    )


    # -----------------------------------------------------
    # 11. FALLBACK TIMELINE
    # -----------------------------------------------------

    if not medical_timeline:

        medical_timeline = build_fallback_timeline(
            dates=dates,
            medicines=medicines,
            diagnoses=diagnoses,
            investigations=investigations
        )


    # -----------------------------------------------------
    # 12. SAVE DOCUMENT
    # -----------------------------------------------------

    new_document = MedicalDocument(

        patient_id=patient_id,

        case_id=(
            selected_case.id
            if selected_case
            else None
        ),

        filename=original_filename,

        file_type=file_extension,

        ocr_text=extracted_text,

        medicines=json.dumps(
            medicines
        ),

        diagnoses=json.dumps(
            diagnoses
        ),

        investigations=json.dumps(
            investigations
        ),

        dates=json.dumps(
            dates
        ),

        medical_timeline=json.dumps(
            medical_timeline
        )
    )


    db.add(
        new_document
    )

    db.commit()

    db.refresh(
        new_document
    )


    # -----------------------------------------------------
    # 13. RESPONSE
    # -----------------------------------------------------

    return {

        "message":
            "Medical document uploaded and processed successfully",

        "document_id":
            new_document.id,

        "patient_id":
            patient_id,

        "case_id":
            new_document.case_id,

        "patient_name":
            patient.name,

        "filename":
            original_filename,

        "file_type":
            file_extension,

        "ocr_text":
            extracted_text,

        "medical_information":
            medical_information,

        "medical_timeline":
            medical_timeline,

        "status":
            "processed_and_saved"
    }


# =========================================================
# GET ALL DOCUMENTS OF A PATIENT
# =========================================================

@router.get("/patient/{patient_id}")
def get_patient_documents(
    patient_id: int,
    db: Session = Depends(get_db)
):

    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id
        )
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )


    documents = (
        db.query(MedicalDocument)
        .filter(
            MedicalDocument.patient_id == patient_id
        )
        .order_by(
            MedicalDocument.created_at.desc()
        )
        .all()
    )


    result = [
        serialize_document(document)
        for document in documents
    ]


    return {

        "patient_id":
            patient_id,

        "patient_name":
            patient.name,

        "total_documents":
            len(result),

        "documents":
            result
    }


# =========================================================
# GET DOCUMENTS OF A SPECIFIC CASE
# IMPORTANT FOR DOCTOR DASHBOARD
# =========================================================

@router.get("/case/{case_id}")
def get_case_documents(
    case_id: int,
    db: Session = Depends(get_db)
):

    clinical_case = (
        db.query(ClinicalCase)
        .filter(
            ClinicalCase.id == case_id
        )
        .first()
    )

    if not clinical_case:

        raise HTTPException(
            status_code=404,
            detail="Clinical case not found"
        )


    documents = (
        db.query(MedicalDocument)
        .filter(
            MedicalDocument.case_id == case_id
        )
        .order_by(
            MedicalDocument.created_at.desc()
        )
        .all()
    )


    result = [
        serialize_document(document)
        for document in documents
    ]


    return {

        "case_id":
            case_id,

        "patient_id":
            clinical_case.patient_id,

        "total_documents":
            len(result),

        "documents":
            result
    }


# =========================================================
# GET SINGLE DOCUMENT
# =========================================================

@router.get("/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):

    document = (
        db.query(MedicalDocument)
        .filter(
            MedicalDocument.id == document_id
        )
        .first()
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Medical document not found"
        )


    return serialize_document(
        document
    )