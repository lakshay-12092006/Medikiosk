from pydantic import BaseModel, Field
from typing import Optional


class DoctorCreate(BaseModel):
    name: str = Field(..., min_length=2)

    specialization: str = Field(
        ...,
        min_length=2
    )

    hospital: Optional[str] = None

    mobile: str = Field(
        ...,
        min_length=10,
        max_length=15
    )

    password: str = Field(
        ...,
        min_length=6
    )


class DoctorResponse(BaseModel):
    id: int
    name: str
    specialization: str
    hospital: Optional[str] = None
    mobile: str

    class Config:
        from_attributes = True