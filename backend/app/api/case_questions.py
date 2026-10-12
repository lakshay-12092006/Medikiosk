from fastapi import APIRouter

from app.services.case_questions import get_questions


router = APIRouter(
    prefix="/case-questions",
    tags=["Case Questions"]
)


@router.get("/{opd_type}")
def get_case_questions(
    opd_type: str,
    language: str = "Hindi"
):
    """
    Get AYUSH case-taking questions according to
    the selected language.
    """

    questions = get_questions(
        opd_type,
        language
    )

    return {
        "opd_type": opd_type,
        "language": language,
        "total_questions": len(questions),
        "questions": questions
    }