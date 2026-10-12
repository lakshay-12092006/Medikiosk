# MediKiosk Structured Case Summary
# Converts patient case information into a
# clean physician-ready summary.


def generate_structured_summary(
    patient_data: dict,
    case_data: dict,
    document_data: dict = None
):
    """
    Generate a structured physician-ready
    patient case summary.
    """

    if document_data is None:
        document_data = {}

    summary = {
        "patient_information": {
            "name": patient_data.get("name"),
            "age": patient_data.get("age"),
            "gender": patient_data.get("gender"),
            "preferred_language": patient_data.get(
                "preferred_language"
            )
        },

        "chief_complaint": case_data.get(
            "chief_complaint"
        ),

        "history_of_present_illness": case_data.get(
            "current_history"
        ),

        "past_medical_history": case_data.get(
            "past_history"
        ),

        "medications": case_data.get(
            "medications"
        ),

        "allergies": case_data.get(
            "allergies"
        ),

        "family_history": case_data.get(
            "family_history"
        ),

        "personal_history": case_data.get(
            "personal_history"
        ),

        "review_of_systems": case_data.get(
            "review_of_systems"
        ),

        "ayush_assessment": case_data.get(
            "ayush_assessment"
        ),

        "clinical_alerts": case_data.get(
            "clinical_alerts"
        ),

        "previous_documents": {
            "medicines": document_data.get(
                "medicines", []
            ),

            "diagnoses": document_data.get(
                "diagnoses", []
            ),

            "investigations": document_data.get(
                "investigations", []
            ),

            "dates": document_data.get(
                "dates", []
            ),

            "medical_timeline": document_data.get(
                "medical_timeline", []
            )
        }
    }

    return summary