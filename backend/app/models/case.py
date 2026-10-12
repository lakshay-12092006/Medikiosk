from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime

from app.database.database import Base


class ClinicalCase(Base):
    __tablename__ = "clinical_cases"

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

    opd_type = Column(
        String,
        nullable=False,
        default="AYUSH"
    )

    # =========================================
    # GENERAL CLINICAL HISTORY
    # =========================================

    chief_complaint = Column(
        Text,
        nullable=True
    )

    current_history = Column(
        Text,
        nullable=True
    )

    past_history = Column(
        Text,
        nullable=True
    )

    medications = Column(
        Text,
        nullable=True
    )

    allergies = Column(
        Text,
        nullable=True
    )

    family_history = Column(
        Text,
        nullable=True
    )

    personal_history = Column(
        Text,
        nullable=True
    )

    review_of_systems = Column(
        Text,
        nullable=True
    )

    # =========================================
    # AYUSH ASSESSMENT
    # =========================================

    ayush_assessment = Column(
        Text,
        nullable=True
    )

    # =========================================
    # CLINICAL ALERTS
    # =========================================

    clinical_alerts = Column(
        Text,
        nullable=True
    )

    # =========================================
    # CREATED DATE
    # =========================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )