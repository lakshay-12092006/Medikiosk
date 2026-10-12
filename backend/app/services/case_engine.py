# MediKiosk AI Case Engine
# Rule-based foundation for missing information detection


REQUIRED_FIELDS = [
    "chief_complaint",
    "duration",
    "symptoms"
]


OPTIONAL_FIELDS = [
    "past_history",
    "medications",
    "allergies",
    "family_history",
    "personal_history",
    "review_of_systems"
]


def detect_missing_information(case_data: dict):
    """
    Detect missing information from a patient's case data.
    """

    missing_required = []
    missing_optional = []

    # Check required fields
    for field in REQUIRED_FIELDS:
        value = case_data.get(field)

        if value is None or str(value).strip() == "":
            missing_required.append(field)

    # Check optional fields
    for field in OPTIONAL_FIELDS:
        value = case_data.get(field)

        if value is None or str(value).strip() == "":
            missing_optional.append(field)

    return {
        "missing_required": missing_required,
        "missing_optional": missing_optional,
        "has_missing_required": len(missing_required) > 0
    }


def get_next_question(field: str):
    """
    Generate the next question based on missing information.
    """

    questions = {
        "chief_complaint": "Aapko sabse zyada kya problem ho rahi hai?",

        "duration": "Ye problem kab se ho rahi hai?",

        "symptoms": "Is problem ke saath aur kya symptoms hain?",

        "past_history": "Kya aapko pehle koi badi bimari ya medical problem hui hai?",

        "medications": "Kya aap abhi koi medicine le rahe hain?",

        "allergies": "Kya aapko kisi medicine ya food se allergy hai?",

        "family_history": "Kya family mein kisi ko similar ya major medical problem hai?",

        "personal_history": "Aapka sleep, appetite, diet aur daily routine kaisa hai?",

        "review_of_systems": (
            "Kya aapko koi aur important symptom jaise "
            "chest pain, breathing difficulty, vomiting "
            "ya dizziness ho rahi hai?"
        )
    }

    return questions.get(field)


def get_next_follow_up_question(case_data: dict):
    """
    Find the first missing required field
    and return its follow-up question.
    """

    result = detect_missing_information(case_data)

    if not result["missing_required"]:
        return {
            "question_needed": False,
            "question": None,
            "field": None
        }

    next_field = result["missing_required"][0]

    return {
        "question_needed": True,
        "field": next_field,
        "question": get_next_question(next_field)
    }