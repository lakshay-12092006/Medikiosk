from fastapi import APIRouter
from typing import Dict, Any

from app.services.case_engine import (
    detect_missing_information,
    get_next_follow_up_question
)

from app.services.information_extractor import (
    extract_information
)

from app.services.clinical_alerts import (
    detect_clinical_alerts
)


router = APIRouter(
    prefix="/case-engine",
    tags=["AI Case Engine"]
)


@router.post("/analyze")
def analyze_case(case_data: Dict[str, Any]):
    """
    Analyze patient case data.

    Performs:
    1. Information extraction
    2. Missing information detection
    3. Follow-up question generation
    4. Clinical alert detection
    """

    # Get patient's natural-language response
    patient_text = case_data.get("text", "")

    # Information extraction
    extracted_information = {}

    if patient_text:
        extracted_information = extract_information(patient_text)

        for field, value in extracted_information.items():
            if value is not None:
                case_data[field] = value

    # Missing information detection
    missing_info = detect_missing_information(case_data)

    # Next follow-up question
    next_question = get_next_follow_up_question(case_data)

    # Clinical alert detection
    clinical_alerts = detect_clinical_alerts(patient_text)

    return {
        "extracted_information": {
            "chief_complaint": case_data.get("chief_complaint"),
            "duration": case_data.get("duration"),
            "symptoms": case_data.get("symptoms")
        },

        "missing_information": missing_info,

        "next_follow_up": next_question,

        "clinical_alerts": clinical_alerts
    }