from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from datetime import datetime

from app.database.database import Base


class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
        index=True
    )

    # Document belongs to a specific clinical case
    case_id = Column(
        Integer,
        ForeignKey("clinical_cases.id"),
        nullable=True,
        index=True
    )

    filename = Column(
        Text,
        nullable=False
    )

    file_type = Column(
        Text,
        nullable=False
    )

    ocr_text = Column(
        Text,
        nullable=True
    )

    medicines = Column(
        Text,
        nullable=True
    )

    diagnoses = Column(
        Text,
        nullable=True
    )

    investigations = Column(
        Text,
        nullable=True
    )

    dates = Column(
        Text,
        nullable=True
    )

    medical_timeline = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )