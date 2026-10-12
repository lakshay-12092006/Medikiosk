from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.doctor import Doctor
from app.schemas.doctor import (
    DoctorCreate,
    DoctorResponse
)
from app.services.auth import (
    hash_password,
    verify_password
)


router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"]
)


@router.post(
    "/register",
    response_model=DoctorResponse
)
def register_doctor(
    doctor: DoctorCreate,
    db: Session = Depends(get_db)
):
    existing_doctor = (
        db.query(Doctor)
        .filter(
            Doctor.mobile == doctor.mobile
        )
        .first()
    )

    if existing_doctor:
        raise HTTPException(
            status_code=400,
            detail="Doctor with this mobile number already exists"
        )

    new_doctor = Doctor(
        name=doctor.name,
        specialization=doctor.specialization,
        hospital=doctor.hospital,
        mobile=doctor.mobile,
        password_hash=hash_password(
            doctor.password
        )
    )

    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)

    return new_doctor


@router.post("/login")
def login_doctor(
    mobile: str,
    password: str,
    db: Session = Depends(get_db)
):
    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.mobile == mobile
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=401,
            detail="Invalid mobile number or password"
        )

    if not verify_password(
        password,
        doctor.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid mobile number or password"
        )

    return {
        "message": "Doctor login successful",
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "specialization": doctor.specialization,
            "hospital": doctor.hospital,
            "mobile": doctor.mobile
        }
    }


@router.get(
    "/",
    response_model=list[DoctorResponse]
)
def get_doctors(
    db: Session = Depends(get_db)
):
    return db.query(Doctor).all()