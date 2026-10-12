# 🏥 MediKiosk — AI-Powered Clinical History & Patient Case-Taking Platform

### 🤖 AI prepares. Doctor decides.

🔗 **Live Demo:** https://medikiosk-phi-rust.vercel.app  
💻 **GitHub Repository:** https://github.com/lakshay-12092006/Medikiosk

MediKiosk is an AI-powered, multilingual and AYUSH-aware clinical intake platform designed to collect patient history and organize medical information before consultation. It aims to transform patient responses and uploaded medical documents into a structured, physician-ready case summary, helping healthcare professionals review relevant information more efficiently.

## 🎯 Problem Statement

Patient history collection can be time-consuming, and important details may be spread across conversations, prescriptions, laboratory reports and previous medical records.

MediKiosk aims to simplify this process by organizing patient information digitally before the doctor consultation.

## ✨ Key Features

- 👤 **Patient Registration & Login** — Digital access for patients.
- 🗣️ **Guided Case Taking** — Interactive questions for structured patient history collection.
- 🎙️ **Voice-Based Input** — Voice interaction to support accessible patient intake.
- 📄 **Medical Document Processing** — Upload documents for text extraction and review.
- 🧠 **Structured Case Summary** — Organizes collected information into a physician-ready format.
- 🚨 **Clinical Alerts** — Highlights relevant information for doctors to review.
- 🩺 **Doctor Dashboard** — Helps doctors review patient case information.
- 📝 **Consultation Notes** — Supports recording and saving consultation details.
- 🌿 **AYUSH-Aware Workflow** — Designed around patient case-taking needs relevant to AYUSH healthcare.

## 🛠️ Technology Stack

### 🎨 Frontend
- React
- Vite
- JavaScript
- CSS

### ⚙️ Backend
- Python
- FastAPI
- SQLAlchemy
- SQLite

### 🔍 Other Components
- REST APIs
- OCR and medical document text extraction
- Structured information extraction
- Rule-based clinical alerts
- Browser-based voice interaction

## 🔄 How It Works

1. 👤 The patient registers or logs in.
2. 💬 The patient answers guided case-taking questions.
3. 📄 Medical documents can be uploaded for text extraction.
4. 🧠 The platform organizes the collected information into a structured case summary.
5. 🩺 The doctor reviews patient information and relevant clinical alerts.
6. 📝 The doctor records consultation notes and makes the final clinical decisions.

## 📁 Project Structure

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

## 🚀 Getting Started

### 📌 Prerequisites

- Python
- Node.js and npm
- Git

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/lakshay-12092006/Medikiosk.git
cd Medikiosk
```

### 2️⃣ Start the Backend

Open a terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn sqlalchemy python-multipart
python -m uvicorn app.main:app --reload
```

🔗 Backend: http://127.0.0.1:8000  
📚 API Documentation: http://127.0.0.1:8000/docs

> 💡 Install any additional dependencies required by the project. If `backend/requirements.txt` exists, use `pip install -r requirements.txt` instead of the individual installation command above.

### 3️⃣ Start the Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

🌐 Frontend: http://localhost:5173

## 🔐 Responsible Use of AI

MediKiosk is intended to support clinical history collection and information organization. It is not a replacement for professional medical judgment. Clinical information and alerts should be reviewed by a qualified healthcare professional.

**🤖 AI prepares. Doctor decides.**

## 🔮 Future Scope

- 🌐 Improved multilingual patient interaction
- 📑 Enhanced medical document extraction and timeline generation
- 🔗 Healthcare information system integration, subject to appropriate authorization and standards
- 🧪 Additional validation and testing in clinical workflows

## 👨‍💻 Author

**Lakshay Singla**  
🎓 B.Tech — Computer Science and Engineering

- 🐙 GitHub: [lakshay-12092006](https://github.com/lakshay-12092006)

---

💚 *Built to improve the organization of patient history before consultation.*
