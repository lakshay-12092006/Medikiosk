import { useRef, useState, useEffect } from "react";
import PatientLogin from "./PatientLogin";
import PatientDashboard from "./PatientDashboard";
import DoctorLogin from "./DoctorLogin";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [page, setPage] = useState("home");

  const [loggedInPatient, setLoggedInPatient] = useState(null);
  const [loggedInDoctor, setLoggedInDoctor] = useState(null);

  // =========================================================
  // DOCTOR CASE STATE
  // =========================================================

  const [doctorCases, setDoctorCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [loadingCases, setLoadingCases] = useState(false);
  const [caseError, setCaseError] = useState("");

  // =========================================================
  // MEDICAL DOCUMENT STATE
  // =========================================================

  const [caseDocuments, setCaseDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");

  // =========================================================
  // CONSULTATION STATE
  // =========================================================

  const [verifiedCases, setVerifiedCases] = useState({});
  const [consultationStarted, setConsultationStarted] = useState(false);

  const [consultationNotes, setConsultationNotes] = useState({
    physicianNotes: "",
    examinationFindings: "",
    assessmentPlan: "",
    followUpNotes: "",
  });

  const [consultationSaved, setConsultationSaved] = useState(false);
  const [consultationSaving, setConsultationSaving] = useState(false);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [existingConsultationId, setExistingConsultationId] =
    useState(null);

  // =========================================================
  // HOME VIDEO
  // =========================================================

  const videoRef = useRef(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // =========================================================
  // DOCUMENT HELPERS
  // =========================================================

  const parseDocumentArray = (value) => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
          return parsed;
        }

        return parsed ? [parsed] : [];
      } catch {
        return value.trim() ? [value] : [];
      }
    }

    return [];
  };

  const formatDocumentDate = (dateValue) => {
    if (!dateValue) {
      return "Date not available";
    }

    const dateText = String(dateValue).trim();

    return dateText || "Date not available";
  };

  // =========================================================
  // MEDICAL TIMELINE
  // =========================================================

  const buildMedicalTimeline = (documents) => {
    const timeline = [];

    documents.forEach((document) => {
      const dates = parseDocumentArray(document.dates);
      const medicines = parseDocumentArray(document.medicines);
      const diagnoses = parseDocumentArray(document.diagnoses);
      const investigations = parseDocumentArray(
        document.investigations
      );

      const documentTimeline = parseDocumentArray(
        document.medical_timeline
      );

      // Backend generated timeline
      if (documentTimeline.length > 0) {
        documentTimeline.forEach((entry) => {
          if (typeof entry === "object" && entry !== null) {
            timeline.push({
              date:
                entry.date ||
                entry.medical_date ||
                entry.record_date ||
                "Date not available",

              medicines: parseDocumentArray(entry.medicines),
              diagnoses: parseDocumentArray(entry.diagnoses),
              investigations: parseDocumentArray(
                entry.investigations
              ),

              filename: document.filename,
            });
          } else {
            timeline.push({
              date: String(entry),
              medicines,
              diagnoses,
              investigations,
              filename: document.filename,
            });
          }
        });

        return;
      }

      // Date based fallback
      if (dates.length > 0) {
        dates.forEach((date) => {
          timeline.push({
            date: formatDocumentDate(date),
            medicines,
            diagnoses,
            investigations,
            filename: document.filename,
          });
        });

        return;
      }

      // No date
      timeline.push({
        date: "Date not available",
        medicines,
        diagnoses,
        investigations,
        filename: document.filename,
      });
    });

    return timeline.sort((a, b) => {
      if (a.date === "Date not available") {
        return 1;
      }

      if (b.date === "Date not available") {
        return -1;
      }

      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) {
        return dateA - dateB;
      }

      return String(a.date).localeCompare(String(b.date));
    });
  };

  // =========================================================
  // RESET CONSULTATION
  // =========================================================

  const resetConsultationForm = () => {
    setConsultationNotes({
      physicianNotes: "",
      examinationFindings: "",
      assessmentPlan: "",
      followUpNotes: "",
    });

    setConsultationSaved(false);
    setExistingConsultationId(null);
  };

  // =========================================================
  // LOAD EXISTING CONSULTATION
  // =========================================================

  const loadExistingConsultation = async (caseId) => {
    if (!caseId) {
      resetConsultationForm();
      return;
    }

    try {
      setConsultationLoading(true);
      setConsultationSaved(false);
      setExistingConsultationId(null);

      const response = await fetch(
        `${API_URL}/consultations/case/${caseId}`
      );

      if (!response.ok) {
        throw new Error("Unable to load previous consultation.");
      }

      const consultations = await response.json();

      if (
        Array.isArray(consultations) &&
        consultations.length > 0
      ) {
        const latest = consultations[0];

        setExistingConsultationId(latest.id);

        setConsultationNotes({
          physicianNotes: latest.physician_notes || "",
          examinationFindings:
            latest.examination_findings || "",
          assessmentPlan: latest.assessment_plan || "",
          followUpNotes: latest.follow_up_notes || "",
        });

        setConsultationSaved(true);
      } else {
        resetConsultationForm();
      }
    } catch (error) {
      console.error("Consultation loading error:", error);
      resetConsultationForm();
    } finally {
      setConsultationLoading(false);
    }
  };

  // =========================================================
  // LOAD DOCUMENTS FOR CASE
  // =========================================================

  const loadCaseDocuments = async (caseId, patientId = null) => {
    if (!caseId) {
      setCaseDocuments([]);
      return;
    }

    try {
      setDocumentsLoading(true);
      setDocumentsError("");

      // First try case-specific documents
      let response = await fetch(
        `${API_URL}/documents/case/${caseId}`
      );

      let data = null;

      if (response.ok) {
        data = await response.json();
      } else if (patientId) {
        // Fallback to patient documents
        response = await fetch(
          `${API_URL}/documents/patient/${patientId}`
        );

        if (response.ok) {
          data = await response.json();
        }
      }

      if (!response.ok || !data) {
        throw new Error("Unable to load medical documents.");
      }

      const documents = Array.isArray(data?.documents)
        ? data.documents
        : [];

      setCaseDocuments(documents);
    } catch (error) {
      console.error(
        "Medical documents loading error:",
        error
      );

      setCaseDocuments([]);

      setDocumentsError(
        "Unable to load previous medical records."
      );
    } finally {
      setDocumentsLoading(false);
    }
  };

  // =========================================================
  // FETCH DOCTOR CASES
  // =========================================================

  const fetchDoctorCases = async () => {
    try {
      setLoadingCases(true);
      setCaseError("");

      const response = await fetch(`${API_URL}/cases/`);

      if (!response.ok) {
        throw new Error("Unable to fetch clinical cases.");
      }

      const cases = await response.json();

      const caseList = Array.isArray(cases)
        ? cases
        : cases?.cases || [];

      const enrichedCases = await Promise.all(
        caseList.map(async (clinicalCase) => {
          try {
            const patientResponse = await fetch(
              `${API_URL}/patients/${clinicalCase.patient_id}`
            );

            if (patientResponse.ok) {
              const patient = await patientResponse.json();

              return {
                ...clinicalCase,
                patient,
              };
            }
          } catch (error) {
            console.error(
              "Unable to fetch patient:",
              error
            );
          }

          return clinicalCase;
        })
      );

      setDoctorCases(enrichedCases);

      if (enrichedCases.length > 0) {
        const firstCase = enrichedCases[0];

        setSelectedCase(firstCase);
        setSelectedPatient(firstCase.patient || null);

        await Promise.all([
          loadCaseDocuments(
            firstCase.id,
            firstCase.patient_id
          ),

          loadExistingConsultation(firstCase.id),
        ]);
      } else {
        setSelectedCase(null);
        setSelectedPatient(null);
        setCaseDocuments([]);
        resetConsultationForm();
      }

      setConsultationStarted(false);
    } catch (error) {
      console.error("Doctor cases error:", error);

      setCaseError(
        "Unable to load patient cases. Please make sure the MediKiosk server is running."
      );
    } finally {
      setLoadingCases(false);
    }
  };

  // =========================================================
  // DOCTOR DASHBOARD EFFECT
  // =========================================================

  useEffect(() => {
    if (page !== "doctor-dashboard") {
      return;
    }

    fetchDoctorCases();
  }, [page]);

  // =========================================================
  // SELECT CASE
  // =========================================================

  const handleSelectCase = async (clinicalCase) => {
    setSelectedCase(clinicalCase);
    setSelectedPatient(clinicalCase.patient || null);

    setConsultationStarted(false);
    setCaseDocuments([]);

    await Promise.all([
      loadCaseDocuments(
        clinicalCase.id,
        clinicalCase.patient_id
      ),

      loadExistingConsultation(clinicalCase.id),
    ]);
  };

  // =========================================================
  // AYUSH ASSESSMENT
  // =========================================================

  const getAyushAssessment = () => {
    if (!selectedCase?.ayush_assessment) {
      return {};
    }

    if (
      typeof selectedCase.ayush_assessment === "object"
    ) {
      return selectedCase.ayush_assessment;
    }

    try {
      const parsed = JSON.parse(
        selectedCase.ayush_assessment
      );

      return parsed || {};
    } catch (error) {
      console.error(
        "Unable to parse AYUSH assessment:",
        error
      );

      return {};
    }
  };

  const ayushAssessment = getAyushAssessment();

  // =========================================================
  // VERIFY CONTEXT
  // =========================================================

  const handleVerifyContext = () => {
    if (!selectedCase?.id) {
      return;
    }

    setVerifiedCases((previous) => ({
      ...previous,
      [selectedCase.id]: true,
    }));

    setConsultationSaved(false);
  };

  // =========================================================
  // START CONSULTATION
  // =========================================================

  const handleStartConsultation = async () => {
    if (!selectedCase?.id) {
      return;
    }

    if (!verifiedCases[selectedCase.id]) {
      return;
    }

    setConsultationStarted(true);

    await loadExistingConsultation(selectedCase.id);
  };

  // =========================================================
  // SAVE CONSULTATION
  // =========================================================

  const handleSaveConsultation = async () => {
    if (!consultationStarted) {
      return;
    }

    if (!selectedCase?.id || !selectedPatient?.id) {
      return;
    }

    try {
      setConsultationSaving(true);
      setConsultationSaved(false);

      const payload = {
        case_id: selectedCase.id,
        patient_id: selectedPatient.id,
        doctor_id: loggedInDoctor?.id ?? null,

        physician_notes:
          consultationNotes.physicianNotes || "",

        examination_findings:
          consultationNotes.examinationFindings || "",

        assessment_plan:
          consultationNotes.assessmentPlan || "",

        follow_up_notes:
          consultationNotes.followUpNotes || "",
      };

      const response = await fetch(
        `${API_URL}/consultations/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Unable to save consultation.";

        try {
          const errorData = await response.json();

          if (errorData?.detail) {
            errorMessage =
              typeof errorData.detail === "string"
                ? errorData.detail
                : JSON.stringify(errorData.detail);
          }
        } catch {
          // Ignore response parsing error
        }

        throw new Error(errorMessage);
      }

      const savedConsultation =
        await response.json();

      setExistingConsultationId(
        savedConsultation.id
      );

      setConsultationSaved(true);
    } catch (error) {
      console.error(
        "Save consultation error:",
        error
      );

      setConsultationSaved(false);
    } finally {
      setConsultationSaving(false);
    }
  };

  // =========================================================
  // LOGOUT DOCTOR
  // =========================================================

  const logoutDoctor = () => {
    setLoggedInDoctor(null);
    setSelectedCase(null);
    setSelectedPatient(null);
    setDoctorCases([]);
    setCaseDocuments([]);
    setVerifiedCases({});
    setConsultationStarted(false);

    resetConsultationForm();

    setPage("home");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // HOME HELPERS
  // =========================================================

  const startVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const scrollToSection = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  // =========================================================
  // PATIENT LOGIN
  // =========================================================

  if (page === "patient-login") {
    return (
      <PatientLogin
        onLoginSuccess={(patient) => {
          setLoggedInPatient(patient);
          setPage("patient-dashboard");
        }}
      />
    );
  }

  // =========================================================
  // PATIENT DASHBOARD
  // =========================================================

  if (page === "patient-dashboard") {
    return (
      <PatientDashboard
        patient={loggedInPatient}
      />
    );
  }

  // =========================================================
  // DOCTOR LOGIN
  // =========================================================

  if (page === "doctor-login") {
    return (
      <DoctorLogin
        onLoginSuccess={(doctor) => {
          setLoggedInDoctor(doctor);
          setPage("doctor-dashboard");
        }}
        onBack={() => setPage("home")}
      />
    );
  }

  // =========================================================
  // DOCTOR DASHBOARD
  // =========================================================

  if (page === "doctor-dashboard") {
    const isSelectedCaseVerified =
      selectedCase?.id
        ? Boolean(
            verifiedCases[selectedCase.id]
          )
        : false;

    const medicalTimeline =
      buildMedicalTimeline(caseDocuments);

    return (
      <div className="dashboard-page">

        {/* =================================================
            DOCTOR DASHBOARD / CONSULTATION STYLES
        ================================================== */}

        <style>{`
          /* ================================================
            CONSULTATION WORKSPACE
          ================================================ */

          .consultation-workspace {
            margin-top: 28px;
            padding: 30px;
            background: #ffffff;
            border: 1px solid #dcebe7;
            border-radius: 20px;
            box-shadow: 0 12px 35px rgba(20, 80, 65, 0.08);
          }

          .consultation-workspace .context-section-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            padding-bottom: 22px;
            margin-bottom: 26px;
            border-bottom: 1px solid #e5efec;
          }

          .consultation-workspace .context-section-heading h3 {
            margin: 6px 0 8px;
            font-size: 23px;
            line-height: 1.3;
            color: #123f36;
          }

          .consultation-workspace .context-section-heading p {
            margin: 0;
            color: #66837d;
            font-size: 14px;
            line-height: 1.6;
          }

          /* ================================================
            VERIFIED BADGE
          ================================================ */

          .consultation-workspace .context-verified-badge {
            flex-shrink: 0;
            padding: 9px 14px;
            border-radius: 999px;
            background: #e8f6f1;
            border: 1px solid #c9e8dd;
            color: #08785d;
            font-size: 13px;
            font-weight: 700;
            white-space: nowrap;
          }

          /* ================================================
            CONSULTATION FIELDS
          ================================================ */

          .consultation-field {
            margin-bottom: 22px;
          }

          .consultation-field label {
            display: block;
            margin-bottom: 9px;
            color: #183f37;
            font-size: 14px;
            font-weight: 700;
          }

          .consultation-field textarea {
            display: block;
            width: 100%;
            min-height: 135px;
            padding: 15px 16px;
            box-sizing: border-box;

            border: 1px solid #cddfd9;
            border-radius: 12px;

            background: #fbfefd;
            color: #173d35;

            font-family: inherit;
            font-size: 14px;
            line-height: 1.6;

            resize: vertical;
            outline: none;

            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease,
              background 0.2s ease;
          }

          .consultation-field textarea::placeholder {
            color: #9aaea9;
          }

          .consultation-field textarea:hover {
            border-color: #a9cbc0;
          }

          .consultation-field textarea:focus {
            border-color: #0b8f6a;
            background: #ffffff;
            box-shadow: 0 0 0 4px rgba(11, 143, 106, 0.10);
          }

          /* ================================================
            PHYSICIAN CONTROLLED BOX
          ================================================ */

          .consultation-workspace .doctor-principle-box {
            display: flex;
            align-items: flex-start;
            gap: 14px;

            margin-top: 8px;
            padding: 17px 18px;

            background: #f4faf8;
            border: 1px solid #cfe7df;
            border-radius: 14px;
          }

          .consultation-workspace .doctor-principle-box .principle-icon {
            width: 34px;
            height: 34px;
            flex-shrink: 0;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 50%;
            background: #dff3ec;
            color: #08785d;

            font-size: 16px;
            font-weight: 800;
          }

          .consultation-workspace .doctor-principle-box strong {
            display: block;
            margin-bottom: 4px;
            color: #17483e;
            font-size: 14px;
          }

          .consultation-workspace .doctor-principle-box p {
            margin: 0;
            color: #66837d;
            font-size: 13px;
            line-height: 1.6;
          }

          /* ================================================
            ACTION BUTTON AREA
          ================================================ */

          .consultation-workspace .context-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;

            margin-top: 24px;
            padding-top: 20px;

            border-top: 1px solid #e5efec;
          }

          .consultation-workspace .dashboard-button {
            min-height: 46px;
            padding: 0 20px;

            border: none;
            border-radius: 10px;

            background: #08785d;
            color: #ffffff;

            font-family: inherit;
            font-size: 14px;
            font-weight: 700;

            cursor: pointer;

            transition:
              background 0.2s ease,
              transform 0.2s ease,
              box-shadow 0.2s ease;
          }

          .consultation-workspace .dashboard-button:hover {
            background: #06654f;
            transform: translateY(-1px);
            box-shadow: 0 7px 18px rgba(8, 120, 93, 0.20);
          }

          .consultation-workspace .dashboard-button:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }

          /* ================================================
            SAVED / LOADING MESSAGE
          ================================================ */

          .consultation-workspace .no-alert-box {
            margin: 16px 0 22px;
            padding: 13px 16px;

            border-radius: 10px;
            border: 1px solid #cfe7df;

            background: #f4faf8;
            color: #287063;

            font-size: 13px;
            line-height: 1.5;
          }

          /* ================================================
            MOBILE RESPONSIVE
          ================================================ */

          @media (max-width: 768px) {

            .consultation-workspace {
              padding: 20px;
              border-radius: 16px;
            }

            .consultation-workspace .context-section-heading {
              flex-direction: column;
              gap: 14px;
            }

            .consultation-workspace .context-section-heading h3 {
              font-size: 20px;
            }

            .consultation-workspace .context-verified-badge {
              align-self: flex-start;
            }

            .consultation-field textarea {
              min-height: 120px;
            }

            .consultation-workspace .context-actions {
              justify-content: stretch;
            }

            .consultation-workspace .dashboard-button {
              width: 100%;
            }

          }
    `}</style>

        {/* HEADER */}

        <header className="dashboard-header">

          <div
            className="home-logo"
            onClick={() => {
              setPage("home");

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            style={{
              cursor: "pointer",
            }}
          >

            <div className="logo-symbol">
              ✚
            </div>

            <div>

              <div className="logo-name">
                Medi<span>Kiosk</span>
              </div>

              <div className="logo-subtitle">
                Clinical Intake Platform
              </div>

            </div>

          </div>

          <div className="patient-welcome">
            Welcome,{" "}
            {loggedInDoctor?.name || "Doctor"}
          </div>

          <button
            className="home-login-button"
            onClick={logoutDoctor}
          >
            Logout
          </button>

        </header>

        {/* MAIN */}

        <main className="dashboard-content">

          {/* INTRO */}

          <div className="dashboard-intro">

            <div className="section-label">
              PHYSICIAN PORTAL
            </div>

            <h1>
              Doctor Dashboard
            </h1>

            <p>
              Review AI-prepared patient
              context before consultation.
            </p>

          </div>

          {/* PHYSICIAN INFORMATION */}

          <div className="patient-info-card">

            <div>

              <h2>
                Physician Information
              </h2>

              <p>
                <strong>Name:</strong>{" "}
                {loggedInDoctor?.name ||
                  "Doctor"}
              </p>

              <p>
                <strong>Specialization:</strong>{" "}
                {loggedInDoctor?.specialization ||
                  "Ayurveda"}
              </p>

              <p>
                <strong>Hospital:</strong>{" "}
                {loggedInDoctor?.hospital ||
                  "MediKiosk AYUSH Hospital"}
              </p>

            </div>

            <div className="consent-badge">
              ✓ Verified Physician
            </div>

          </div>

          {/* PATIENT CASES */}

          <div className="doctor-case-section">

            <div className="doctor-section-title">

              <div>

                <div className="section-label">
                  PATIENT CASES
                </div>

                <h2>
                  Recent Clinical Cases
                </h2>

                <p>
                  Select a patient case to
                  review the AI-prepared
                  clinical context.
                </p>

              </div>

              <button
                className="dashboard-button"
                onClick={fetchDoctorCases}
                disabled={loadingCases}
              >
                {loadingCases
                  ? "⟳ Loading..."
                  : "↻ Refresh Cases"}
              </button>

            </div>

            {/* LOADING */}

            {loadingCases && (
              <div className="doctor-empty-state">

                <div className="card-icon">
                  ⟳
                </div>

                <h3>
                  Loading patient cases...
                </h3>

                <p>
                  Fetching clinical cases
                  from MediKiosk server.
                </p>

              </div>
            )}

            {/* ERROR */}

            {!loadingCases &&
              caseError && (
                <div className="doctor-empty-state">

                  <div className="card-icon">
                    ⚠
                  </div>

                  <h3>
                    Unable to load cases
                  </h3>

                  <p>
                    {caseError}
                  </p>

                  <button
                    className="dashboard-button"
                    onClick={fetchDoctorCases}
                    style={{
                      marginTop: "15px",
                    }}
                  >
                    Try Again
                  </button>

                </div>
              )}

            {/* NO CASES */}

            {!loadingCases &&
              !caseError &&
              doctorCases.length === 0 && (
                <div className="doctor-empty-state">

                  <div className="card-icon">
                    📋
                  </div>

                  <h3>
                    No patient cases yet
                  </h3>

                  <p>
                    Once a patient completes
                    AYUSH case-taking, the
                    saved case will appear
                    here.
                  </p>

                </div>
              )}

            {/* CASE LAYOUT */}

            {!loadingCases &&
              !caseError &&
              doctorCases.length > 0 && (

                <div className="doctor-case-layout">

                  {/* LEFT CASE LIST */}

                  <div className="doctor-case-list">

                    {doctorCases.map(
                      (clinicalCase, index) => {

                        const patient =
                          clinicalCase.patient;

                        const isSelected =
                          selectedCase?.id ===
                          clinicalCase.id;

                        const isVerified =
                          clinicalCase.id
                            ? Boolean(
                                verifiedCases[
                                  clinicalCase.id
                                ]
                              )
                            : false;

                        return (
                          <button
                            key={
                              clinicalCase.id ||
                              `${clinicalCase.patient_id}-${index}`
                            }
                            className={`doctor-case-item ${
                              isSelected
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              handleSelectCase(
                                clinicalCase
                              )
                            }
                          >

                            <div className="case-item-avatar">

                              {patient?.name
                                ? patient.name
                                    .charAt(0)
                                    .toUpperCase()
                                : "P"}

                            </div>

                            <div className="case-item-content">

                              <strong>
                                {patient?.name ||
                                  `Patient #${clinicalCase.patient_id}`}
                              </strong>

                              <span>
                                {patient
                                  ? `${patient.age} years • ${patient.gender}`
                                  : `Patient ID: ${clinicalCase.patient_id}`}
                              </span>

                              <small>
                                AYUSH Case
                                {isVerified
                                  ? " • ✓ Verified"
                                  : ""}
                              </small>

                            </div>

                            <div className="case-item-arrow">
                              →
                            </div>

                          </button>
                        );
                      }
                    )}

                  </div>

                  {/* RIGHT CONTEXT */}

                  {selectedCase && (
                    <div className="patient-context-panel">

                      {/* CONTEXT HEADER */}

                      <div className="context-panel-header">

                        <div>

                          <div className="section-label">
                            AI-PREPARED PATIENT CONTEXT
                          </div>

                          <h2>
                            {selectedPatient?.name ||
                              `Patient #${selectedCase.patient_id}`}
                          </h2>

                          <p>
                            {isSelectedCaseVerified
                              ? "Patient context verified by physician"
                              : "Physician verification required"}
                          </p>

                        </div>

                        <div className="context-verified-badge">

                          {isSelectedCaseVerified
                            ? "✓ Physician Verified"
                            : "AI Prepared"}

                        </div>

                      </div>

                      {/* PATIENT INFORMATION */}

                      <div className="context-block">

                        <h3>
                          Patient Information
                        </h3>

                        <div className="context-grid">

                          <div>
                            <span>Name</span>
                            <strong>
                              {selectedPatient?.name ||
                                "Not available"}
                            </strong>
                          </div>

                          <div>
                            <span>Age</span>
                            <strong>
                              {selectedPatient?.age ??
                                "Not available"}
                            </strong>
                          </div>

                          <div>
                            <span>Gender</span>
                            <strong>
                              {selectedPatient?.gender ||
                                "Not available"}
                            </strong>
                          </div>

                          <div>
                            <span>Case Type</span>
                            <strong>AYUSH</strong>
                          </div>

                        </div>

                      </div>

                      {/* CHIEF COMPLAINT */}

                      <div className="context-block">

                        <h3>
                          Chief Complaint
                        </h3>

                        <div className="context-value-box">
                          {selectedCase.chief_complaint ||
                            "No chief complaint recorded."}
                        </div>

                      </div>

                      {/* HPI */}

                      <div className="context-block">

                        <h3>
                          History of Present Illness
                        </h3>

                        <div className="context-value-box">
                          {selectedCase.current_history ||
                            "No current history recorded."}
                        </div>

                      </div>

                      {/* PAST HISTORY */}

                      <div className="context-block">

                        <h3>
                          Past Medical History
                        </h3>

                        <div className="context-value-box">
                          {selectedCase.past_history ||
                            "No past medical history recorded."}
                        </div>

                      </div>

                      {/* MEDICATIONS + ALLERGIES */}

                      <div className="context-two-column">

                        <div className="context-block">

                          <h3>
                            Medications
                          </h3>

                          <div className="context-value-box">
                            {selectedCase.medications ||
                              "No medications recorded."}
                          </div>

                        </div>

                        <div className="context-block">

                          <h3>
                            Allergies
                          </h3>

                          <div className="context-value-box">
                            {selectedCase.allergies ||
                              "No allergies recorded."}
                          </div>

                        </div>

                      </div>

                      {/* FAMILY HISTORY */}

                      <div className="context-block">

                        <h3>
                          Family History
                        </h3>

                        <div className="context-value-box">
                          {selectedCase.family_history ||
                            "No family history recorded."}
                        </div>

                      </div>

                      {/* PERSONAL HISTORY */}

                      <div className="context-block">

                        <h3>
                          Personal History
                        </h3>

                        <div className="context-value-box">
                          {selectedCase.personal_history ||
                            "No personal history recorded."}
                        </div>

                      </div>

                      {/* REVIEW OF SYSTEMS */}

                      <div className="context-block">

                        <h3>
                          Symptoms / Review of Systems
                        </h3>

                        <div className="context-value-box">
                          {selectedCase.review_of_systems ||
                            "No additional symptoms recorded."}
                        </div>

                      </div>

                      {/* AYUSH ASSESSMENT */}

                      <div className="context-block">

                        <div className="context-section-heading">

                          <div>

                            <h3>
                              🌿 AYUSH Assessment
                            </h3>

                            <p>
                              Structured information
                              collected during AYUSH
                              case-taking.
                            </p>

                          </div>

                        </div>

                        {Object.keys(
                          ayushAssessment
                        ).length === 0 ? (

                          <div className="context-value-box">
                            No AYUSH assessment
                            information recorded.
                          </div>

                        ) : (

                          <div className="ayush-context-grid">

                            {Object.entries(
                              ayushAssessment
                            ).map(
                              ([key, value]) => {

                                if (
                                  !value ||
                                  !String(value).trim()
                                ) {
                                  return null;
                                }

                                const label =
                                  key
                                    .replace(
                                      /_/g,
                                      " "
                                    )
                                    .replace(
                                      /\b\w/g,
                                      (letter) =>
                                        letter.toUpperCase()
                                    );

                                return (
                                  <div
                                    className="ayush-context-item"
                                    key={key}
                                  >

                                    <span>
                                      {label}
                                    </span>

                                    <strong>
                                      {String(value)}
                                    </strong>

                                  </div>
                                );
                              }
                            )}

                          </div>
                        )}

                      </div>

                      {/* CLINICAL ALERTS */}

                      <div className="context-block">

                        <h3>
                          ⚠ Clinical Alerts
                        </h3>

                        {selectedCase.clinical_alerts ? (

                          <div className="clinical-alert-box">

                            <strong>
                              Doctor attention recommended
                            </strong>

                            <p>
                              {
                                selectedCase.clinical_alerts
                              }
                            </p>

                          </div>

                        ) : (

                          <div className="no-alert-box">
                            ✓ No potentially important
                            symptoms were detected by
                            the current alert rules.
                          </div>

                        )}

                      </div>

                      {/* =================================================
                          DOCUMENT INTELLIGENCE
                      ================================================== */}

                      <div className="context-block">

                        <div className="context-section-heading">

                          <div>

                            <div className="section-label">
                              DOCUMENT INTELLIGENCE
                            </div>

                            <h3>
                              📄 Previous Medical Records
                            </h3>

                            <p>
                              Previous prescriptions,
                              laboratory reports and
                              medical documents linked
                              to this patient case.
                            </p>

                          </div>

                          <button
                            className="context-secondary-button"
                            onClick={() =>
                              loadCaseDocuments(
                                selectedCase.id,
                                selectedCase.patient_id
                              )
                            }
                            disabled={
                              documentsLoading
                            }
                          >
                            {documentsLoading
                              ? "⟳ Loading..."
                              : "↻ Refresh Records"}
                          </button>

                        </div>

                        {documentsError && (

                          <div className="clinical-alert-box">
                            {documentsError}
                          </div>

                        )}

                        {!documentsLoading &&
                          !documentsError &&
                          caseDocuments.length === 0 && (

                            <div className="context-value-box">
                              No previous medical
                              documents attached
                              to this case.
                            </div>

                          )}

                        {/* DOCUMENT COUNT */}

                        {caseDocuments.length > 0 && (

                          <div className="no-alert-box">
                            ✓{" "}
                            {caseDocuments.length} previous
                            medical record
                            {caseDocuments.length > 1
                              ? "s"
                              : ""}{" "}
                            processed successfully.
                          </div>

                        )}

                        {/* DOCUMENT CARDS */}

                        {caseDocuments.length > 0 && (

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "16px",
                              marginTop: "16px",
                            }}
                          >

                            {caseDocuments.map(
                              (document) => {

                                const medicines =
                                  parseDocumentArray(
                                    document.medicines
                                  );

                                const diagnoses =
                                  parseDocumentArray(
                                    document.diagnoses
                                  );

                                const investigations =
                                  parseDocumentArray(
                                    document.investigations
                                  );

                                const dates =
                                  parseDocumentArray(
                                    document.dates
                                  );

                                return (
                                  <div
                                    key={document.id}
                                    style={{
                                      border:
                                        "1px solid #dcebe7",
                                      borderRadius:
                                        "14px",
                                      padding:
                                        "18px",
                                      background:
                                        "#f8fcfb",
                                    }}
                                  >

                                    {/* DOCUMENT HEADER */}

                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent:
                                          "space-between",
                                        gap: "15px",
                                        alignItems:
                                          "flex-start",
                                      }}
                                    >

                                      <div>

                                        <strong
                                          style={{
                                            fontSize:
                                              "17px",
                                          }}
                                        >
                                          📄{" "}
                                          {
                                            document.filename
                                          }
                                        </strong>

                                        <div
                                          style={{
                                            marginTop:
                                              "5px",
                                            color:
                                              "#55736d",
                                            fontSize:
                                              "13px",
                                          }}
                                        >
                                          Document ID:{" "}
                                          {document.id}
                                          {" • "}
                                          Type:{" "}
                                          {document.file_type ||
                                            "Medical Document"}
                                        </div>

                                      </div>

                                      <div className="consent-badge">
                                        ✓ Processed
                                      </div>

                                    </div>

                                    {/* DATES */}

                                    <div
                                      style={{
                                        marginTop:
                                          "18px",
                                      }}
                                    >

                                      <h4>
                                        📅 Dates
                                      </h4>

                                      {dates.length > 0 ? (

                                        <div
                                          style={{
                                            display:
                                              "flex",
                                            flexWrap:
                                              "wrap",
                                            gap:
                                              "8px",
                                          }}
                                        >

                                          {dates.map(
                                            (
                                              date,
                                              index
                                            ) => (
                                              <span
                                                key={
                                                  index
                                                }
                                                style={{
                                                  background:
                                                    "#e8f6f1",
                                                  border:
                                                    "1px solid #cde9df",
                                                  borderRadius:
                                                    "20px",
                                                  padding:
                                                    "7px 12px",
                                                  fontSize:
                                                    "13px",
                                                }}
                                              >
                                                📅{" "}
                                                {String(
                                                  date
                                                )}
                                              </span>
                                            )
                                          )}

                                        </div>

                                      ) : (

                                        <p>
                                          No dates
                                          detected.
                                        </p>

                                      )}

                                    </div>

                                    {/* MEDICINES */}

                                    <div
                                      style={{
                                        marginTop:
                                          "18px",
                                      }}
                                    >

                                      <h4>
                                        💊 Medicines
                                      </h4>

                                      {medicines.length >
                                      0 ? (

                                        <ul>
                                          {medicines.map(
                                            (
                                              item,
                                              index
                                            ) => (
                                              <li
                                                key={
                                                  index
                                                }
                                              >
                                                {String(
                                                  item
                                                )}
                                              </li>
                                            )
                                          )}
                                        </ul>

                                      ) : (

                                        <p>
                                          No medicines
                                          detected.
                                        </p>

                                      )}

                                    </div>

                                    {/* DIAGNOSES */}

                                    <div
                                      style={{
                                        marginTop:
                                          "18px",
                                      }}
                                    >

                                      <h4>
                                        🩺 Diagnoses
                                      </h4>

                                      {diagnoses.length >
                                      0 ? (

                                        <ul>
                                          {diagnoses.map(
                                            (
                                              item,
                                              index
                                            ) => (
                                              <li
                                                key={
                                                  index
                                                }
                                              >
                                                {String(
                                                  item
                                                )}
                                              </li>
                                            )
                                          )}
                                        </ul>

                                      ) : (

                                        <p>
                                          No diagnoses
                                          detected.
                                        </p>

                                      )}

                                    </div>

                                    {/* INVESTIGATIONS */}

                                    <div
                                      style={{
                                        marginTop:
                                          "18px",
                                      }}
                                    >

                                      <h4>
                                        🧪 Investigations
                                      </h4>

                                      {investigations.length >
                                      0 ? (

                                        <ul>
                                          {investigations.map(
                                            (
                                              item,
                                              index
                                            ) => (
                                              <li
                                                key={
                                                  index
                                                }
                                              >
                                                {String(
                                                  item
                                                )}
                                              </li>
                                            )
                                          )}
                                        </ul>

                                      ) : (

                                        <p>
                                          No investigations
                                          detected.
                                        </p>

                                      )}

                                    </div>

                                    {/* OCR TEXT */}

                                    {document.ocr_text && (

                                      <details
                                        style={{
                                          marginTop:
                                            "18px",
                                        }}
                                      >

                                        <summary
                                          style={{
                                            cursor:
                                              "pointer",
                                            fontWeight:
                                              "600",
                                          }}
                                        >
                                          📝 View Extracted
                                          OCR Text
                                        </summary>

                                        <div
                                          style={{
                                            marginTop:
                                              "10px",
                                            background:
                                              "#ffffff",
                                            border:
                                              "1px solid #dcebe7",
                                            borderRadius:
                                              "10px",
                                            padding:
                                              "15px",
                                            maxHeight:
                                              "260px",
                                            overflowY:
                                              "auto",
                                            whiteSpace:
                                              "pre-wrap",
                                            lineHeight:
                                              "1.6",
                                          }}
                                        >
                                          {
                                            document.ocr_text
                                          }
                                        </div>

                                      </details>

                                    )}

                                  </div>
                                );
                              }
                            )}

                          </div>

                        )}

                      </div>

                      {/* =================================================
                          MEDICAL TIMELINE
                      ================================================== */}

                      <div className="context-block">

                        <div className="context-section-heading">

                          <div>

                            <div className="section-label">
                              MEDICAL HISTORY
                            </div>

                            <h3>
                              🗓️ Medical Timeline
                            </h3>

                            <p>
                              Previous medical information
                              organized chronologically
                              from processed documents.
                            </p>

                          </div>

                        </div>

                        {medicalTimeline.length === 0 ? (

                          <div className="context-value-box">
                            No dated medical records
                            available for this case.
                          </div>

                        ) : (

                          <div
                            style={{
                              display: "flex",
                              flexDirection:
                                "column",
                              gap: "16px",
                            }}
                          >

                            {medicalTimeline.map(
                              (
                                entry,
                                index
                              ) => {

                                const medicines =
                                  parseDocumentArray(
                                    entry.medicines
                                  );

                                const diagnoses =
                                  parseDocumentArray(
                                    entry.diagnoses
                                  );

                                const investigations =
                                  parseDocumentArray(
                                    entry.investigations
                                  );

                                return (
                                  <div
                                    key={`${entry.date}-${index}`}
                                    style={{
                                      position:
                                        "relative",
                                      borderLeft:
                                        "3px solid #0b8f6a",
                                      paddingLeft:
                                        "20px",
                                      paddingBottom:
                                        "8px",
                                    }}
                                  >

                                    <div
                                      style={{
                                        fontWeight:
                                          "700",
                                        fontSize:
                                          "16px",
                                        color:
                                          "#08785d",
                                        marginBottom:
                                          "8px",
                                      }}
                                    >
                                      📅{" "}
                                      {entry.date}
                                    </div>

                                    {entry.filename && (

                                      <div
                                        style={{
                                          fontSize:
                                            "12px",
                                          color:
                                            "#66837d",
                                          marginBottom:
                                            "10px",
                                        }}
                                      >
                                        Source:{" "}
                                        {
                                          entry.filename
                                        }
                                      </div>

                                    )}

                                    {medicines.length >
                                      0 && (

                                      <div
                                        style={{
                                          background:
                                            "#f8fcfb",
                                          border:
                                            "1px solid #dcebe7",
                                          borderRadius:
                                            "10px",
                                          padding:
                                            "12px",
                                          marginBottom:
                                            "8px",
                                        }}
                                      >

                                        <strong>
                                          💊 Medicines
                                        </strong>

                                        <ul
                                          style={{
                                            marginBottom:
                                              "0",
                                          }}
                                        >
                                          {medicines.map(
                                            (
                                              item,
                                              itemIndex
                                            ) => (
                                              <li
                                                key={
                                                  itemIndex
                                                }
                                              >
                                                {String(
                                                  item
                                                )}
                                              </li>
                                            )
                                          )}
                                        </ul>

                                      </div>

                                    )}

                                    {diagnoses.length >
                                      0 && (

                                      <div
                                        style={{
                                          background:
                                            "#f8fcfb",
                                          border:
                                            "1px solid #dcebe7",
                                          borderRadius:
                                            "10px",
                                          padding:
                                            "12px",
                                          marginBottom:
                                            "8px",
                                        }}
                                      >

                                        <strong>
                                          🩺 Diagnoses
                                        </strong>

                                        <ul
                                          style={{
                                            marginBottom:
                                              "0",
                                          }}
                                        >
                                          {diagnoses.map(
                                            (
                                              item,
                                              itemIndex
                                            ) => (
                                              <li
                                                key={
                                                  itemIndex
                                                }
                                              >
                                                {String(
                                                  item
                                                )}
                                              </li>
                                            )
                                          )}
                                        </ul>

                                      </div>

                                    )}

                                    {investigations.length >
                                      0 && (

                                      <div
                                        style={{
                                          background:
                                            "#f8fcfb",
                                          border:
                                            "1px solid #dcebe7",
                                          borderRadius:
                                            "10px",
                                          padding:
                                            "12px",
                                        }}
                                      >

                                        <strong>
                                          🧪 Investigations
                                        </strong>

                                        <ul
                                          style={{
                                            marginBottom:
                                              "0",
                                          }}
                                        >
                                          {investigations.map(
                                            (
                                              item,
                                              itemIndex
                                            ) => (
                                              <li
                                                key={
                                                  itemIndex
                                                }
                                              >
                                                {String(
                                                  item
                                                )}
                                              </li>
                                            )
                                          )}
                                        </ul>

                                      </div>

                                    )}

                                  </div>
                                );
                              }
                            )}

                          </div>

                        )}

                      </div>

                      {/* DOCTOR PRINCIPLE */}

                      <div className="doctor-principle-box">

                        <div className="principle-icon">
                          ✦
                        </div>

                        <div>

                          <strong>
                            AI prepares the context.
                          </strong>

                          <p>
                            The physician reviews,
                            verifies, edits and makes
                            the final clinical decision.
                          </p>

                        </div>

                      </div>

                      {/* =================================================
                          CONSULTATION WORKSPACE
                      ================================================== */}

                      {consultationStarted && (

                        <div className="consultation-workspace">

                          <div className="context-section-heading">

                            <div>

                              <div className="section-label">
                                PHYSICIAN WORKSPACE
                              </div>

                              <h3>
                                🩺 Clinical Examination &
                                Consultation
                              </h3>

                              <p>
                                Record physician-entered
                                observations and the final
                                clinical plan.
                              </p>

                            </div>

                            <div className="context-verified-badge">
                              ✓ Context Verified
                            </div>

                          </div>

                          {consultationLoading && (

                            <div className="no-alert-box">
                              ⟳ Loading previous
                              consultation...
                            </div>

                          )}

                          {!consultationLoading &&
                            existingConsultationId && (

                              <div className="no-alert-box">
                                ✓ Previous consultation
                                loaded. You can review or
                                update the physician notes
                                below.
                              </div>

                            )}

                          {/* PHYSICIAN NOTES */}

                          <div className="consultation-field">

                            <label>
                              Physician Notes
                            </label>

                            <textarea
                              value={
                                consultationNotes.physicianNotes
                              }
                              onChange={(event) =>
                                setConsultationNotes(
                                  (previous) => ({
                                    ...previous,
                                    physicianNotes:
                                      event.target.value,
                                  })
                                )
                              }
                              placeholder="Enter clinical observations, patient interaction notes or other physician observations..."
                              rows={5}
                            />

                          </div>

                          {/* EXAMINATION */}

                          <div className="consultation-field">

                            <label>
                              Examination Findings
                            </label>

                            <textarea
                              value={
                                consultationNotes.examinationFindings
                              }
                              onChange={(event) =>
                                setConsultationNotes(
                                  (previous) => ({
                                    ...previous,
                                    examinationFindings:
                                      event.target.value,
                                  })
                                )
                              }
                              placeholder="Enter findings from physical or clinical examination..."
                              rows={5}
                            />

                          </div>

                          {/* ASSESSMENT */}

                          <div className="consultation-field">

                            <label>
                              Assessment / Plan
                            </label>

                            <textarea
                              value={
                                consultationNotes.assessmentPlan
                              }
                              onChange={(event) =>
                                setConsultationNotes(
                                  (previous) => ({
                                    ...previous,
                                    assessmentPlan:
                                      event.target.value,
                                  })
                                )
                              }
                              placeholder="Enter physician's assessment and planned management..."
                              rows={5}
                            />

                          </div>

                          {/* FOLLOW UP */}

                          <div className="consultation-field">

                            <label>
                              Follow-up Notes
                            </label>

                            <textarea
                              value={
                                consultationNotes.followUpNotes
                              }
                              onChange={(event) =>
                                setConsultationNotes(
                                  (previous) => ({
                                    ...previous,
                                    followUpNotes:
                                      event.target.value,
                                  })
                                )
                              }
                              placeholder="Enter follow-up instructions or review schedule..."
                              rows={4}
                            />

                          </div>

                          {/* PRINCIPLE */}

                          <div className="doctor-principle-box">

                            <div className="principle-icon">
                              ✓
                            </div>

                            <div>

                              <strong>
                                Physician-controlled
                                decision making
                              </strong>

                              <p>
                                These fields are entered
                                and finalized by the
                                physician. MediKiosk does
                                not autonomously diagnose
                                or prescribe treatment.
                              </p>

                            </div>

                          </div>

                          {/* SAVE */}

                          <div className="context-actions">

                            <button
                              className="dashboard-button"
                              onClick={
                                handleSaveConsultation
                              }
                              disabled={
                                consultationSaving
                              }
                            >
                              {consultationSaving
                                ? "⟳ Saving..."
                                : existingConsultationId
                                ? "✓ Save Consultation Update"
                                : "✓ Save Consultation"}
                            </button>

                          </div>

                          {consultationSaved && (

                            <div className="no-alert-box">
                              ✓ Consultation notes are
                              saved in the MediKiosk
                              database.
                            </div>

                          )}

                        </div>

                      )}

                      {/* ACTION BUTTONS */}

                      <div className="context-actions">

                        {!isSelectedCaseVerified && (

                          <button
                            className="dashboard-button"
                            onClick={
                              handleVerifyContext
                            }
                          >
                            ✓ Verify Patient Context
                          </button>

                        )}

                        {isSelectedCaseVerified && (

                          <>
                            {!consultationStarted && (

                              <button
                                className="dashboard-button"
                                onClick={
                                  handleStartConsultation
                                }
                              >
                                Continue to
                                Consultation →
                              </button>

                            )}

                            {consultationStarted && (

                              <button
                                className="context-secondary-button"
                                onClick={() =>
                                  setConsultationStarted(
                                    false
                                  )
                                }
                              >
                                ← Back to Patient
                                Context
                              </button>

                            )}

                          </>

                        )}

                      </div>

                    </div>
                  )}

                </div>

              )}

          </div>

        </main>

      </div>
    );
  }

  // =========================================================
  // HOME PAGE
  // =========================================================

  return (
    <div className="home-page">

      {/* NAVBAR */}

      <nav className="home-navbar">

        <div
          className="home-logo"
          onClick={() => {
            setPage("home");

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }}
        >

          <div className="logo-symbol">
            ✚
          </div>

          <div>

            <div className="logo-name">
              Medi<span>Kiosk</span>
            </div>

            <div className="logo-subtitle">
              Clinical Intake Platform
            </div>

          </div>

        </div>

        <div className="nav-links">

          <button
            onClick={() =>
              scrollToSection("how-it-works")
            }
          >
            How it works
          </button>

          <button
            onClick={() =>
              scrollToSection("features")
            }
          >
            Platform
          </button>

          <button
            onClick={() =>
              scrollToSection("for-doctors")
            }
          >
            For Doctors
          </button>

        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >

          <button
            className="home-login-button"
            onClick={() =>
              setPage("doctor-login")
            }
          >
            Doctor Login
          </button>

          <button
            className="home-login-button"
            onClick={() =>
              setPage("patient-login")
            }
          >
            Patient Login
          </button>

        </div>

      </nav>

      {/* HERO */}

      <section className="home-hero">

        <div className="hero-left">

          <div className="hero-label">

            <span className="status-dot"></span>

            AI-Powered Clinical Intake

          </div>

          <h1>
            Better patient stories.
            <br />
            <span>
              Better consultations.
            </span>
          </h1>

          <p className="hero-description">
            MediKiosk transforms patient
            conversations, previous medical
            documents and clinical information
            into a structured, physician-ready
            case before the consultation.
          </p>

          <div className="hero-buttons">

            <button
              className="hero-primary-button"
              onClick={() =>
                setPage("patient-login")
              }
            >
              Start Patient Case
              <span>→</span>
            </button>

            <button
              className="hero-secondary-button"
              onClick={() =>
                scrollToSection("how-it-works")
              }
            >
              Explore Platform
              <span>↓</span>
            </button>

          </div>

          <div className="hero-trust">

            <div>
              <strong>Voice + Text</strong>
              <span>
                Patient-friendly intake
              </span>
            </div>

            <div>
              <strong>OCR + AI</strong>
              <span>
                Medical document intelligence
              </span>
            </div>

            <div>
              <strong>AYUSH-aware</strong>
              <span>
                Structured history
              </span>
            </div>

          </div>

        </div>

        {/* VIDEO */}

        <div className="hero-visual">

          <div className="video-card">

            <div className="video-topbar">

              <span className="video-live-dot"></span>

              <span>
                MediKiosk Clinical Experience
              </span>

              <span className="video-time">
                Preview
              </span>

            </div>

            <div className="video-wrapper">

             <video
                ref={videoRef}
                className="hero-video"
                controls
                onPlay={() => setVideoPlaying(true)}
                onPause={() => setVideoPlaying(false)}
                onEnded={() => setVideoPlaying(false)}
              >
                <source src="/hospital.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

             {!videoPlaying && (
                <button
                  className="video-play-button"
                  onClick={startVideo}
                >
                  ▶
                </button>
              )}

              <div className="video-caption">

                <span>
                  Healthcare workflow preview
                </span>

                <span>
                  ▶ Click to play
                </span>

              </div>

            </div>

          </div>

          <div className="floating-card floating-card-one">

            <div className="floating-icon">
              ✓
            </div>

            <div>

              <strong>
                Structured Case
              </strong>

              <span>
                Ready for physician review
              </span>

            </div>

          </div>

          <div className="floating-card floating-card-two">

            <div className="floating-icon">
              ✦
            </div>

            <div>

              <strong>
                AI Prepared
              </strong>

              <span>
                Doctor verifies the context
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* TRUST STRIP */}

      <section className="trust-strip">

        <div className="trust-heading">
          Designed for modern clinical intake
        </div>

        <div className="trust-items">

          <div>
            <span>◉</span>
            Multilingual
          </div>

          <div>
            <span>◉</span>
            Voice + Text
          </div>

          <div>
            <span>◉</span>
            Medical OCR
          </div>

          <div>
            <span>◉</span>
            Structured History
          </div>

          <div>
            <span>◉</span>
            AYUSH-aware
          </div>

          <div>
            <span>◉</span>
            Consent-based
          </div>

        </div>

      </section>

      {/* HOW IT WORKS */}

      <section
        className="workflow-section"
        id="how-it-works"
      >

        <div className="section-heading">

          <div className="section-label">
            HOW MEDIKIOSK WORKS
          </div>

          <h2>
            From patient conversation
            <br />
            to a structured clinical case.
          </h2>

          <p>
            MediKiosk prepares the information
            before the consultation, helping
            doctors spend more time on
            examination, reasoning and patient
            counselling.
          </p>

        </div>

        <div className="workflow-grid">

          <div className="workflow-card">

            <div className="workflow-number">
              01
            </div>

            <div className="workflow-icon">
              ◉
            </div>

            <h3>
              Identify
            </h3>

            <p>
              Patient enters through ABHA ID,
              Aadhaar-based identification or
              new registration with consent.
            </p>

          </div>

          <div className="workflow-card">

            <div className="workflow-number">
              02
            </div>

            <div className="workflow-icon">
              ◌
            </div>

            <h3>
              Converse
            </h3>

            <p>
              Patient shares symptoms and
              history using voice, text and
              guided questions in a preferred
              language.
            </p>

          </div>

          <div className="workflow-card">

            <div className="workflow-number">
              03
            </div>

            <div className="workflow-icon">
              ▣
            </div>

            <h3>
              Scan
            </h3>

            <p>
              Previous prescriptions, laboratory
              reports and medical documents can
              be digitized using OCR.
            </p>

          </div>

          <div className="workflow-card">

            <div className="workflow-number">
              04
            </div>

            <div className="workflow-icon">
              ✓
            </div>

            <h3>
              Summarize
            </h3>

            <p>
              Information is organized into a
              structured case summary that the
              physician can review and verify.
            </p>

          </div>

        </div>

      </section>

      {/* FEATURES */}

      <section
        className="features-section"
        id="features"
      >

        <div className="features-intro">

          <div className="section-label">
            THE MEDIKIOSK PLATFORM
          </div>

          <h2>
            One clinical intake layer.
            <br />
            Multiple intelligent capabilities.
          </h2>

          <p>
            Built around the real workflow of
            patient history-taking, document
            review and physician consultation.
          </p>

        </div>

        <div className="feature-grid">

          <div className="large-feature-card">

            <div className="feature-card-icon">
              🎙
            </div>

            <div className="feature-tag">
              CONVERSATIONAL INTAKE
            </div>

            <h3>
              Let patients tell their story
              naturally.
            </h3>

            <p>
              Voice, text and guided interaction
              help capture patient information
              without forcing patients through
              complicated forms.
            </p>

            <div className="feature-list">

              <span>
                ✓ Multilingual interaction
              </span>

              <span>
                ✓ Adaptive follow-up questions
              </span>

              <span>
                ✓ Missing information detection
              </span>

            </div>

          </div>

          <div className="large-feature-card">

            <div className="feature-card-icon">
              📄
            </div>

            <div className="feature-tag">
              DOCUMENT INTELLIGENCE
            </div>

            <h3>
              Turn scattered documents
              into useful history.
            </h3>

            <p>
              Previous prescriptions, lab
              reports and discharge summaries
              can be digitized and organized
              into a meaningful medical timeline.
            </p>

            <div className="feature-list">

              <span>
                ✓ OCR-based extraction
              </span>

              <span>
                ✓ Medication information
              </span>

              <span>
                ✓ Investigation timeline
              </span>

            </div>

          </div>

          <div className="large-feature-card">

            <div className="feature-card-icon">
              🌿
            </div>

            <div className="feature-tag">
              AYUSH-AWARE
            </div>

            <h3>
              Designed with AYUSH
              case-taking in mind.
            </h3>

            <p>
              Supports structured AYUSH-oriented
              history including Prakriti, Vikriti
              and relevant assessment parameters.
            </p>

            <div className="feature-list">

              <span>
                ✓ Prakriti & Vikriti
              </span>

              <span>
                ✓ Dashavidha Pariksha
              </span>

              <span>
                ✓ Ahara & Vihara history
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* DOCTOR SECTION */}

      <section
        className="doctor-section"
        id="for-doctors"
      >

        <div className="doctor-content">

          <div className="section-label light-label">
            FOR PHYSICIANS
          </div>

          <h2>
            AI prepares the context.
            <br />
            <span>
              Doctor makes the decision.
            </span>
          </h2>

          <p>
            MediKiosk does not replace clinical
            judgment. It prepares patient
            information in a structured format
            so the physician can review, edit,
            verify and make the final clinical
            decision.
          </p>

          <div className="doctor-points">

            <div>
              <span>✓</span>
              Review the structured patient
              history
            </div>

            <div>
              <span>✓</span>
              Verify extracted information
            </div>

            <div>
              <span>✓</span>
              Review important clinical alerts
            </div>

            <div>
              <span>✓</span>
              Continue with examination and
              consultation
            </div>

          </div>

        </div>

        <div className="doctor-panel">

          <div className="doctor-panel-top">

            <span className="panel-dot"></span>

            Physician Review

          </div>

          <div className="doctor-summary">

            <div className="summary-header">

              <div className="summary-avatar">
                MC
              </div>

              <div>

                <strong>
                  Patient Context
                </strong>

                <span>
                  AI-prepared • Physician
                  verification required
                </span>

              </div>

            </div>

            <div className="summary-row">

              <span>
                Chief Complaint
              </span>

              <strong>
                Patient reported symptoms
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Past History
              </span>

              <strong>
                Structured medical history
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Documents
              </span>

              <strong>
                Previous records available
              </strong>

            </div>

            <div className="summary-row alert-row">

              <span>
                Clinical Information
              </span>

              <strong>
                Review recommended
              </strong>

            </div>

            <button
              className="verify-button"
              onClick={() =>
                setPage("doctor-login")
              }
            >
              Doctor Login →
            </button>

          </div>

        </div>

      </section>

      {/* FINAL CTA */}

      <section className="final-cta">

        <div>

          <div className="section-label">
            START WITH MEDIKIOSK
          </div>

          <h2>
            Give every consultation
            <br />
            a better starting point.
          </h2>

          <p>
            Start your patient case-taking
            journey with MediKiosk.
          </p>

        </div>

        <button
          onClick={() =>
            setPage("patient-login")
          }
        >
          Start Patient Case
          <span>→</span>
        </button>

      </section>

      {/* FOOTER */}

      <footer className="home-footer">

        <div className="footer-brand">

          <div className="footer-logo">

            <div className="logo-symbol">
              ✚
            </div>

            <div>

              <div className="logo-name">
                Medi<span>Kiosk</span>
              </div>

              <div className="logo-subtitle">
                Clinical Intake Platform
              </div>

            </div>

          </div>

          <p>
            AI-powered clinical history and
            patient case-taking platform for
            better pre-consultation workflows.
          </p>

        </div>

        <div className="footer-column">

          <h4>
            Platform
          </h4>

          <button
            onClick={() =>
              scrollToSection("how-it-works")
            }
          >
            How it works
          </button>

          <button
            onClick={() =>
              scrollToSection("features")
            }
          >
            Features
          </button>

          <button
            onClick={() =>
              scrollToSection("for-doctors")
            }
          >
            For Doctors
          </button>

        </div>

        <div className="footer-column">

          <h4>
            Patient
          </h4>

          <button
            onClick={() =>
              setPage("patient-login")
            }
          >
            Patient Login
          </button>

          <button
            onClick={() =>
              setPage("patient-login")
            }
          >
            Start Case Taking
          </button>

        </div>

        <div className="footer-column">

          <h4>
            Doctor
          </h4>

          <button
            onClick={() =>
              setPage("doctor-login")
            }
          >
            Doctor Login
          </button>

          <button
            onClick={() =>
              scrollToSection("for-doctors")
            }
          >
            Physician Portal
          </button>

        </div>

        <div className="footer-column">

          <h4>
            Clinical Principle
          </h4>

          <p>
            AI prepares patient context.
          </p>

          <p>
            Doctor verifies and decides.
          </p>

        </div>

        <div className="footer-bottom">

          <span>
            © 2026 MediKiosk
          </span>

          <span>
            Consent-based • Physician-verified
          </span>

        </div>

      </footer>

    </div>
  );
}

export default App;