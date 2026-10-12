from fastapi import FastAPI

from app.database.database import engine, Base
from app.models.patient import Patient
from app.models.case import ClinicalCase
from app.api.patient import router as patient_router
from app.api.case import router as case_router
from app.api.case_questions import router as case_questions_router
from app.api.case_engine import router as case_engine_router
from app.api.documents import router as documents_router
from app.api.case_summary import router as case_summary_router
from app.models.document import MedicalDocument
from fastapi.middleware.cors import CORSMiddleware
from app.api import doctor
from app.models.consultation import Consultation
from app.api.consultation import router as consultation_router

# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="MediKiosk API",
    description="AI-Powered Clinical History & Patient Case-Taking Platform",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Patient API
app.include_router(patient_router)
# Case API
app.include_router(case_router)
# Case Questions API
app.include_router(case_questions_router)
# Case Engine API
app.include_router(case_engine_router)
# Documents API
app.include_router(documents_router)
# Case Summary API
app.include_router(case_summary_router)
app.include_router(doctor.router)
app.include_router(consultation_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to MediKiosk API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }