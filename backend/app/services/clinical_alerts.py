# MediKiosk Clinical Alert Engine
# Detects important symptoms reported by the patient.
# It does NOT diagnose or assign patient priority.


ALERT_SYMPTOMS = {
    "chest pain": [
        "chest pain",
        "seene mein dard",
        "seene me dard"
    ],
    "breathing difficulty": [
        "breathing difficulty",
        "breathlessness",
        "saans lene mein dikkat",
        "saans lene me dikkat",
        "saans ki dikkat"
    ],
    "fainting": [
        "fainting",
        "fainted",
        "behosh",
        "behoshi"
    ],
    "severe bleeding": [
        "severe bleeding",
        "heavy bleeding",
        "bahut zyada bleeding",
        "zyada khoon"
    ],
    "severe vomiting": [
        "severe vomiting",
        "continuous vomiting",
        "baar baar ulti",
        "bahut zyada ulti"
    ]
}


def detect_clinical_alerts(text: str):
    """
    Detect potentially important symptoms from patient-reported text.

    This function only highlights reported symptoms.
    It does not diagnose the patient or decide priority.
    """

    text_lower = text.lower()

    detected_alerts = []

    for alert_name, keywords in ALERT_SYMPTOMS.items():

        for keyword in keywords:

            if keyword in text_lower:

                detected_alerts.append({
                    "type": alert_name,
                    "message": (
                        f"Patient reported {alert_name}. "
                        "Doctor attention recommended."
                    )
                })

                break

    return {
        "has_alerts": len(detected_alerts) > 0,
        "alerts": detected_alerts
    }