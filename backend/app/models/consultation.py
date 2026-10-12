from datetime import datetime

from sqlalchemy import Column, Integer, Text, DateTime

from app.database.database import Base


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)

    case_id = Column(Integer, nullable=False, index=True)
    patient_id = Column(Integer, nullable=False, index=True)
    doctor_id = Column(Integer, nullable=True, index=True)

    physician_notes = Column(Text, nullable=True)
    examination_findings = Column(Text, nullable=True)
    assessment_plan = Column(Text, nullable=True)
    follow_up_notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )