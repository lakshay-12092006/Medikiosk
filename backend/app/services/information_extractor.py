# MediKiosk Information Extraction Engine
# Rule-based foundation for extracting basic clinical information


def extract_information(text: str):
    """
    Extract basic clinical information from patient's natural-language response.
    """

    text_lower = text.lower()

    extracted = {
        "chief_complaint": None,
        "duration": None,
        "symptoms": None
    }

    # Basic complaint detection
    if "fever" in text_lower or "bukhar" in text_lower:
        extracted["chief_complaint"] = "Fever"

    elif "headache" in text_lower or "sir dard" in text_lower:
        extracted["chief_complaint"] = "Headache"

    elif "cough" in text_lower or "khansi" in text_lower:
        extracted["chief_complaint"] = "Cough"

    elif "pain" in text_lower or "dard" in text_lower:
        extracted["chief_complaint"] = "Pain"

    # Basic duration detection
    duration_words = [
        "day",
        "days",
        "din",
        "week",
        "weeks",
        "hafte",
        "month",
        "months",
        "mahine"
    ]

    for word in duration_words:
        if word in text_lower:
            words = text_lower.split()

            for i, current_word in enumerate(words):
                if word in current_word and i > 0:
                    previous_word = words[i - 1]

                    if previous_word.isdigit():
                        extracted["duration"] = (
                            previous_word + " " + word
                        )
                        break

            if extracted["duration"]:
                break

    # Basic symptom detection
    detected_symptoms = []

    symptom_keywords = {
        "headache": ["headache", "sir dard"],
        "cough": ["cough", "khansi"],
        "vomiting": ["vomiting", "ulti"],
        "dizziness": ["dizziness", "chakkar"],
        "breathing difficulty": [
            "breathing difficulty",
            "saans lene mein dikkat",
            "breathlessness"
        ],
        "chest pain": ["chest pain", "seene mein dard"]
    }

    for symptom, keywords in symptom_keywords.items():
        for keyword in keywords:
            if keyword in text_lower:
                detected_symptoms.append(symptom)
                break

    if detected_symptoms:
        extracted["symptoms"] = ", ".join(detected_symptoms)

    return extracted