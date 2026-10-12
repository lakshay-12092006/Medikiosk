from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)

    mobile = Column(String, nullable=True)

    # Patient identification
    identifier_type = Column(String, nullable=False, default="ABHA")
    abha_id = Column(String, unique=True, nullable=True)
    aadhaar_id = Column(String, unique=True, nullable=True)

    # Password will be stored as a secure hash, not plain text
    password_hash = Column(String, nullable=True)

    preferred_language = Column(
        String,
        nullable=False,
        default="English"
    )

    consent_given = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )