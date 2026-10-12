# MediKiosk — AI-Powered Clinical History & Patient Case-Taking Platform

**AI prepares. Doctor decides.**

MediKiosk is an AI-powered, multilingual and AYUSH-aware clinical intake platform designed to collect patient history and organize medical information before consultation. It aims to convert patient responses and uploaded medical documents into a structured, physician-ready case summary, helping healthcare professionals review relevant information more efficiently.

## Problem Statement

Patient history collection can be time-consuming, and important details may be spread across conversations, prescriptions, laboratory reports and previous medical records. A structured digital intake process can help organize this information before the consultation begins.

## Key Features

- **Patient Registration & Login:** Provides a digital entry point for patients.
- **Guided Case Taking:** Supports structured patient history collection through interactive questions.
- **Voice-Based Input:** Supports voice interaction for a more accessible intake experience.
- **Medical Document Processing:** Allows patients to upload medical documents for text extraction and review.
- **Structured Case Summary:** Organizes collected information into a physician-ready format.
- **Clinical Alerts:** Highlights relevant information for healthcare professionals to review.
- **Doctor Dashboard:** Enables doctors to review patient case information.
- **Consultation Notes:** Supports recording and saving consultation details.
- **AYUSH-Aware Workflow:** Designed around patient case-taking needs relevant to AYUSH healthcare.

## Technology Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Python
- FastAPI
- SQLAlchemy
- SQLite

**Other Components**
- REST APIs
- Document OCR and text extraction
- Structured information extraction
- Rule-based clinical alerts
- Voice interaction using browser capabilities

## How It Works

1. The patient registers or logs in.
2. The patient provides information through guided case-taking questions.
3. Relevant medical documents can be uploaded for text extraction.
4. The platform organizes the collected information into a structured case summary.
5. The doctor reviews the patient context and relevant clinical alerts.
6. The doctor records consultation notes and makes the final clinical decisions.

## Project Structure

```text
MediKiosk/
├── backend/
│   └── app/
│       ├── api/
│       ├── database/
│       ├── models/
│       ├── schemas/
│       └── services/
└── frontend/
    ├── public/
    └── src/
```

## Getting Started

### Prerequisites

- Python
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/lakshay-12092006/Medikiosk.git
cd Medikiosk
```

### 2. Start the Backend

Open a terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn sqlalchemy python-multipart
python -m uvicorn app.main:app --reload
```

Backend: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

**Note:** Install any additional dependencies required by the document-processing and authentication modules. If the project has a backend `requirements.txt`, prefer installing dependencies with `pip install -r requirements.txt`.

### 3. Start the Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Responsible Use of AI

MediKiosk is intended to support clinical history collection and information organization. It is not a replacement for professional medical judgment. Clinical information and alerts should be reviewed by a qualified healthcare professional.

**AI prepares. Doctor decides.**

## Future Scope

- Further improvements to multilingual patient interaction
- Enhanced medical document extraction and timeline generation
- Integration with healthcare information systems, subject to appropriate authorization and standards
- Additional validation and testing in clinical workflows

## Author

**Lakshay Singla**  
B.Tech — Computer Science and Engineering

- GitHub: [lakshay-12092006](https://github.com/lakshay-12092006)

---

*Built as a healthcare technology project focused on improving the organization of patient history before consultation.*
