import { useEffect, useRef, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function PatientDashboard({ patient }) {
  const [page, setPage] = useState("dashboard");

  // =========================================================
  // AYUSH ONLY
  // =========================================================

  const opdType = "AYUSH";

  // =========================================================
  // LANGUAGE
  // =========================================================

  const [language, setLanguage] = useState(
    patient?.preferred_language || "Hindi"
  );

  // =========================================================
  // QUESTIONS
  // =========================================================

  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState({});

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionError, setQuestionError] = useState("");

  const currentQuestion = questions[questionIndex];

  // =========================================================
  // VOICE INPUT
  // =========================================================

  const recognitionRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  // =========================================================
  // CASE SAVE
  // =========================================================

  const [savingCase, setSavingCase] = useState(false);
  const [saveError, setSaveError] = useState("");

  // =========================================================
  // SAVED CASES
  // =========================================================

  const [savedCases, setSavedCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  // =========================================================
  // MEDICAL DOCUMENTS
  // =========================================================

  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentError, setDocumentError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [selectedDocument, setSelectedDocument] = useState(null);

  const fileInputRef = useRef(null);

  // =========================================================
  // VOICE INPUT FUNCTIONS
  // =========================================================

  const getSpeechRecognition = () => {
    return (
      window.SpeechRecognition ||
      window.webkitSpeechRecognition
    );
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsListening(false);
    setInterimTranscript("");
  };

  const startVoiceInput = () => {
    const SpeechRecognition = getSpeechRecognition();

    setVoiceError("");
    setInterimTranscript("");

    if (!SpeechRecognition) {
      setVoiceError(
        "Voice input is not supported in this browser. Please use Chrome, Edge or Opera."
      );
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();

    recognition.lang =
      language === "English"
        ? "en-IN"
        : "hi-IN";

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceError("");
      setInterimTranscript("");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (finalText.trim()) {
        setAnswer((previousAnswer) => {
          const previous =
            previousAnswer.trim();

          const newText =
            finalText.trim();

          if (!previous) {
            return newText;
          }

          return `${previous} ${newText}`;
        });
      }

      setInterimTranscript(
        interimText
      );
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setIsListening(false);
      setInterimTranscript("");

      if (
        event.error ===
        "not-allowed"
      ) {
        setVoiceError(
          "Microphone permission denied. Please allow microphone access in your browser."
        );
      } else if (
        event.error === "no-speech"
      ) {
        setVoiceError(
          "No speech detected. Please try speaking again."
        );
      } else if (
        event.error ===
        "audio-capture"
      ) {
        setVoiceError(
          "No microphone was detected. Please check your microphone."
        );
      } else {
        setVoiceError(
          "Voice input could not start. Please try again."
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };

    recognitionRef.current =
      recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Voice start error:",
        error
      );

      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;

      setVoiceError(
        "Voice input could not be started. Please try again."
      );
    }
  };

  // =========================================================
  // VOICE CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  // =========================================================
  // STOP VOICE WHEN PAGE CHANGES
  // =========================================================

  useEffect(() => {
    if (page !== "case-taking") {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      setIsListening(false);
      setInterimTranscript("");
    }
  }, [page]);

  // =========================================================
  // FETCH QUESTIONS
  // =========================================================

  useEffect(() => {
    if (page !== "case-taking") {
      return;
    }

    const fetchQuestions = async () => {
      try {
        setLoadingQuestions(true);
        setQuestionError("");

        const response = await fetch(
          `${API_URL}/case-questions/AYUSH?language=${encodeURIComponent(
            language
          )}`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to fetch case questions."
          );
        }

        const data =
          await response.json();

        setQuestions(
          data.questions || []
        );

        setQuestionIndex(0);
        setAnswer("");
        setAnswers({});
        setVoiceError("");
        setInterimTranscript("");
      } catch (error) {
        console.error(error);

        setQuestionError(
          "Unable to load case questions. Please try again."
        );
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [page, language]);

  // =========================================================
  // FETCH SAVED CASES
  // =========================================================

  const fetchSavedCases = async () => {
    if (!patient?.id) {
      return;
    }

    try {
      setLoadingCases(true);

      const response = await fetch(
        `${API_URL}/cases/patient/${patient.id}`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to fetch patient cases."
        );
      }

      const data =
        await response.json();

      setSavedCases(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Case fetch error:",
        error
      );
    } finally {
      setLoadingCases(false);
    }
  };

  // =========================================================
  // FETCH MEDICAL DOCUMENTS
  // =========================================================

  const fetchDocuments = async () => {
    if (!patient?.id) {
      return;
    }

    try {
      setLoadingDocuments(true);
      setDocumentError("");

      const response = await fetch(
        `${API_URL}/documents/patient/${patient.id}`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to fetch medical documents."
        );
      }

      const data =
        await response.json();

      setDocuments(
        Array.isArray(
          data?.documents
        )
          ? data.documents
          : []
      );
    } catch (error) {
      console.error(
        "Document fetch error:",
        error
      );

      setDocumentError(
        "Unable to load your medical documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  // =========================================================
  // PAGE DATA
  // =========================================================

  useEffect(() => {
    if (
      page === "dashboard" ||
      page === "case-summary"
    ) {
      fetchSavedCases();
    }

    if (
      page === "dashboard" ||
      page === "documents"
    ) {
      fetchDocuments();
    }
  }, [page, patient?.id]);

  // =========================================================
  // RESET NEW CASE
  // =========================================================

  const startNewCase = () => {
    stopVoiceInput();

    setQuestionIndex(0);
    setAnswer("");
    setAnswers({});
    setQuestions([]);
    setQuestionError("");
    setSaveError("");
    setVoiceError("");
    setInterimTranscript("");
    setSelectedCase(null);

    setPage("case-setup");
  };

  // =========================================================
  // PREVIOUS QUESTION
  // =========================================================

  const handlePreviousQuestion = () => {
    stopVoiceInput();

    if (
      questionIndex === 0 ||
      !currentQuestion
    ) {
      return;
    }

    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]:
        answer.trim(),
    };

    setAnswers(updatedAnswers);

    const previousIndex =
      questionIndex - 1;

    setQuestionIndex(
      previousIndex
    );

    const previousQuestion =
      questions[previousIndex];

    if (previousQuestion) {
      setAnswer(
        updatedAnswers[
          previousQuestion.id
        ] || ""
      );
    } else {
      setAnswer("");
    }
  };

  // =========================================================
  // CLINICAL ALERTS
  // =========================================================

  const detectClinicalAlerts = (
    allAnswers
  ) => {
    const combinedText =
      Object.values(allAnswers)
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    const alertKeywords = [
      "chest pain",
      "breathing difficulty",
      "difficulty breathing",
      "severe bleeding",
      "unconscious",
      "fainting",
      "severe dizziness",
      "very high fever",
      "severe pain",
    ];

    const detected =
      alertKeywords.filter(
        (keyword) =>
          combinedText.includes(
            keyword
          )
      );

    if (detected.length === 0) {
      return "";
    }

    return (
      "Doctor attention recommended. Patient reported potentially important symptom(s): " +
      detected.join(", ") +
      "."
    );
  };

  // =========================================================
  // BUILD CLINICAL CASE
  // =========================================================

  const buildClinicalCase = (
    allAnswers
  ) => {
    const getAnswer = (id) =>
      allAnswers[id] || "";

    const currentHistoryParts =
      [];

    if (getAnswer("duration")) {
      currentHistoryParts.push(
        `Duration: ${getAnswer(
          "duration"
        )}`
      );
    }

    if (getAnswer("symptoms")) {
      currentHistoryParts.push(
        `Associated symptoms: ${getAnswer(
          "symptoms"
        )}`
      );
    }

    const ayushData = {
      prakriti:
        getAnswer("prakriti"),

      vikriti:
        getAnswer("vikriti"),

      sara:
        getAnswer("sara"),

      samhanana:
        getAnswer("samhanana"),

      pramana:
        getAnswer("pramana"),

      satmya:
        getAnswer("satmya"),

      sattva:
        getAnswer("sattva"),

      ahara_shakti:
        getAnswer(
          "ahara_shakti"
        ),

      vyayama_shakti:
        getAnswer(
          "vyayama_shakti"
        ),

      vaya:
        getAnswer("vaya"),

      ahara_vihara:
        getAnswer(
          "ahara_vihara"
        ),
    };

    const hasAyushData =
      Object.values(ayushData).some(
        (value) =>
          value &&
          value.trim()
      );

    return {
      patient_id: patient.id,

      opd_type: opdType,

      chief_complaint:
        getAnswer(
          "chief_complaint"
        ) || null,

      current_history:
        currentHistoryParts.length >
        0
          ? currentHistoryParts.join(
              "\n"
            )
          : null,

      past_history:
        getAnswer(
          "past_history"
        ) || null,

      medications:
        getAnswer(
          "medications"
        ) || null,

      allergies:
        getAnswer(
          "allergies"
        ) || null,

      family_history:
        getAnswer(
          "family_history"
        ) || null,

      personal_history:
        [
          getAnswer("sleep")
            ? `Sleep: ${getAnswer(
                "sleep"
              )}`
            : "",

          getAnswer(
            "bowel_habits"
          )
            ? `Bowel habits: ${getAnswer(
                "bowel_habits"
              )}`
            : "",
        ]
          .filter(Boolean)
          .join("\n") || null,

      review_of_systems:
        getAnswer(
          "review_of_systems"
        ) ||
        getAnswer("symptoms") ||
        null,

      ayush_assessment:
        hasAyushData
          ? JSON.stringify(
              ayushData
            )
          : null,

      clinical_alerts:
        detectClinicalAlerts(
          allAnswers
        ) || null,
    };
  };

  // =========================================================
  // SAVE CASE
  // =========================================================

  const saveCaseToBackend =
    async (allAnswers) => {
      try {
        setSavingCase(true);
        setSaveError("");

        stopVoiceInput();

        const caseData =
          buildClinicalCase(
            allAnswers
          );

        const response =
          await fetch(
            `${API_URL}/cases/`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                caseData
              ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Unable to save clinical case."
          );
        }

        setSelectedCase(data);

        await fetchSavedCases();

        setPage(
          "case-summary"
        );
      } catch (error) {
        console.error(
          "Save case error:",
          error
        );

        setSaveError(
          error.message ||
            "Unable to save your case."
        );
      } finally {
        setSavingCase(false);
      }
    };

  // =========================================================
  // NEXT QUESTION
  // =========================================================

  const handleNextQuestion =
    async () => {
      if (!currentQuestion) {
        return;
      }

      stopVoiceInput();

      if (
        currentQuestion.required &&
        !answer.trim()
      ) {
        alert(
          language === "English"
            ? "Please provide an answer before continuing."
            : "Kripya continue karne se pehle answer dein."
        );

        return;
      }

      const updatedAnswers = {
        ...answers,
        [currentQuestion.id]:
          answer.trim(),
      };

      setAnswers(
        updatedAnswers
      );

      if (
        questionIndex <
        questions.length - 1
      ) {
        const nextIndex =
          questionIndex + 1;

        setQuestionIndex(
          nextIndex
        );

        const nextQuestion =
          questions[nextIndex];

        setAnswer(
          updatedAnswers[
            nextQuestion?.id
          ] || ""
        );

        setVoiceError("");
        setInterimTranscript("");

        return;
      }

      await saveCaseToBackend(
        updatedAnswers
      );
    };

  // =========================================================
  // OPEN SAVED CASE
  // =========================================================

  const openSavedCase = (
    clinicalCase
  ) => {
    setSelectedCase(
      clinicalCase
    );

    setPage(
      "case-summary"
    );
  };

  // =========================================================
  // DOCUMENT - FILE SELECT
  // =========================================================

  const handleFileSelect = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    setUploadMessage("");
    setUploadError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setUploadError(
        "Only PDF, JPG, JPEG and PNG files are allowed."
      );

      setSelectedFile(null);

      event.target.value = "";

      return;
    }

    setSelectedFile(file);
  };

  // =========================================================
  // DOCUMENT - UPLOAD
  // =========================================================

  const handleUploadDocument =
    async () => {
      if (!patient?.id) {
        setUploadError(
          "Patient information is not available."
        );
        return;
      }

      if (!selectedFile) {
        setUploadError(
          "Please select a medical document first."
        );
        return;
      }

      try {
        setUploadingDocument(
          true
        );

        setUploadMessage("");
        setUploadError("");

        const formData =
          new FormData();

        formData.append(
          "file",
          selectedFile
        );

        const response =
          await fetch(
            `${API_URL}/documents/upload?patient_id=${patient.id}`,
            {
              method: "POST",
              body: formData,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Document upload failed."
          );
        }

        setUploadMessage(
          "Document uploaded and processed successfully."
        );

        setSelectedFile(null);

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        await fetchDocuments();
      } catch (error) {
        console.error(
          "Document upload error:",
          error
        );

        setUploadError(
          error.message ||
            "Unable to upload document."
        );
      } finally {
        setUploadingDocument(
          false
        );
      }
    };

  // =========================================================
  // DOCUMENT - FORMAT JSON
  // =========================================================

  const parseDocumentField = (
    value
  ) => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (
      typeof value ===
      "string"
    ) {
      try {
        const parsed =
          JSON.parse(value);

        return Array.isArray(
          parsed
        )
          ? parsed
          : [parsed];
      } catch {
        return [value];
      }
    }

    return [String(value)];
  };

  // =========================================================
  // CASE SETUP PAGE
  // =========================================================

  if (page === "case-setup") {
    return (
      <div className="dashboard-page">

        <header className="dashboard-header">
          <div className="logo">
            Medi<span>Kiosk</span>
          </div>

          <div className="patient-welcome">
            Welcome,{" "}
            {patient?.name ||
              "Patient"}
          </div>
        </header>

        <main className="dashboard-content">

          <button
            className="back-button"
            onClick={() =>
              setPage(
                "dashboard"
              )
            }
          >
            ← Back to Dashboard
          </button>

          <div className="dashboard-intro">

            <div className="section-label">
              AYUSH CASE PREPARATION
            </div>

            <h1>
              Prepare Your AYUSH Case
            </h1>

            <p>
              MediKiosk will collect
              your health history and
              AYUSH-specific information
              before your consultation.
            </p>

          </div>

          <section className="patient-info-card">

            <div>
              <h2>
                Patient Information
              </h2>

              <p>
                <strong>
                  Name:
                </strong>{" "}
                {patient?.name ||
                  "Not available"}
              </p>

              <p>
                <strong>
                  Age:
                </strong>{" "}
                {patient?.age ??
                  "Not available"}
              </p>

              <p>
                <strong>
                  Gender:
                </strong>{" "}
                {patient?.gender ||
                  "Not available"}
              </p>
            </div>

            <div className="consent-badge">
              ✓ Consent Given
            </div>

          </section>

          <section className="setup-card">

            <div className="setup-header">

              <div className="setup-icon">
                🌿
              </div>

              <div>
                <div className="section-label">
                  AYUSH CONSULTATION
                </div>

                <h2>
                  AYUSH Clinical Case Taking
                </h2>

                <p>
                  Your case will be prepared
                  using patient history and
                  AYUSH-specific assessment
                  information.
                </p>
              </div>

            </div>

            <div className="setup-form">

              <div className="form-group">

                <label>
                  Consultation Type
                </label>

                <div className="ayush-selected-card">

                  <div className="ayush-selected-icon">
                    🌿
                  </div>

                  <div className="ayush-selected-content">

                    <div className="ayush-selected-title">
                      AYUSH Clinical Consultation
                    </div>

                    <div className="ayush-selected-description">
                      AYUSH-focused clinical
                      history, assessment and
                      case preparation
                    </div>

                  </div>

                  <div className="ayush-selected-check">
                    ✓
                  </div>

                </div>

              </div>

              <div className="form-group">

                <label>
                  Preferred Language
                </label>

                <select
                  className="opd-select"
                  value={language}
                  onChange={(e) =>
                    setLanguage(
                      e.target.value
                    )
                  }
                >
                  <option value="Hindi">
                    Hindi
                  </option>

                  <option value="English">
                    English
                  </option>
                </select>

                <small>
                  Case-taking questions will
                  be presented in your
                  selected language.
                </small>

              </div>

            </div>

            <div className="setup-info">

              <span>✓</span>

              <p>
                MediKiosk will ask guided
                AYUSH questions and organize
                your responses into a
                structured clinical history
                for physician review.
              </p>

            </div>

            <button
              className="dashboard-button setup-continue"
              onClick={() => {
                setQuestionIndex(0);
                setAnswer("");
                setAnswers({});
                setQuestions([]);
                setQuestionError("");
                setSaveError("");
                setVoiceError("");
                setInterimTranscript("");
                setPage(
                  "case-taking"
                );
              }}
            >
              Start AYUSH Case Taking →
            </button>

          </section>

        </main>

        <footer className="footer">
          MediKiosk • AI prepares patient
          context. Doctor verifies and decides.
        </footer>

      </div>
    );
  }

  // =========================================================
  // CASE TAKING
  // =========================================================

  if (page === "case-taking") {

    if (savingCase) {
      return (
        <div className="case-taking-page">

          <header className="case-header">

            <div className="logo">
              Medi<span>Kiosk</span>
            </div>

            <div className="case-header-right">
              <span>🌿 AYUSH</span>
              <span>{language}</span>
              <strong>
                {patient?.name ||
                  "Patient"}
              </strong>
            </div>

          </header>

          <main className="case-main">

            <div className="case-loading">

              <div className="section-label">
                CASE COMPLETED
              </div>

              <h1>
                Preparing your clinical case...
              </h1>

              <p>
                MediKiosk is securely
                saving your responses and
                preparing your structured
                AYUSH case.
              </p>

            </div>

          </main>

        </div>
      );
    }

    if (loadingQuestions) {
      return (
        <div className="case-taking-page">

          <header className="case-header">

            <div className="logo">
              Medi<span>Kiosk</span>
            </div>

            <div className="case-header-right">
              <span>🌿 AYUSH</span>
              <span>{language}</span>
              <strong>
                {patient?.name ||
                  "Patient"}
              </strong>
            </div>

          </header>

          <main className="case-main">

            <div className="case-loading">

              <div className="section-label">
                AYUSH CASE TAKING
              </div>

              <h1>
                Preparing your questions...
              </h1>

              <p>
                MediKiosk is preparing
                questions in your selected
                language.
              </p>

            </div>

          </main>

        </div>
      );
    }

    if (questionError) {
      return (
        <div className="case-taking-page">

          <header className="case-header">

            <div className="logo">
              Medi<span>Kiosk</span>
            </div>

          </header>

          <main className="case-main">

            <button
              className="back-button"
              onClick={() =>
                setPage(
                  "case-setup"
                )
              }
            >
              ← Back to Case Setup
            </button>

            <div className="case-error">

              <h2>
                Unable to load case questions
              </h2>

              <p>
                {questionError}
              </p>

              <button
                className="dashboard-button"
                onClick={() =>
                  setPage(
                    "case-setup"
                  )
                }
              >
                Back to Case Setup
              </button>

            </div>

          </main>

        </div>
      );
    }

    if (saveError) {
      return (
        <div className="case-taking-page">

          <header className="case-header">

            <div className="logo">
              Medi<span>Kiosk</span>
            </div>

          </header>

          <main className="case-main">

            <div className="case-error">

              <h2>
                Unable to save your case
              </h2>

              <p>
                {saveError}
              </p>

              <button
                className="dashboard-button"
                onClick={() =>
                  setSaveError("")
                }
              >
                Try Again
              </button>

            </div>

          </main>

        </div>
      );
    }

    if (!currentQuestion) {
      return (
        <div className="case-taking-page">

          <header className="case-header">

            <div className="logo">
              Medi<span>Kiosk</span>
            </div>

          </header>

          <main className="case-main">

            <div className="case-error">

              <h2>
                No AYUSH questions available
              </h2>

              <p>
                Please go back and start
                the AYUSH case-taking
                session again.
              </p>

              <button
                className="dashboard-button"
                onClick={() =>
                  setPage(
                    "case-setup"
                  )
                }
              >
                Back to Case Setup
              </button>

            </div>

          </main>

        </div>
      );
    }

    const progress =
      questions.length > 0
        ? ((questionIndex + 1) /
            questions.length) *
          100
        : 0;

    return (
      <div className="case-taking-page">

        <header className="case-header">

          <div className="logo">
            Medi<span>Kiosk</span>
          </div>

          <div className="case-header-right">

            <span>🌿 AYUSH</span>

            <span>{language}</span>

            <strong>
              {patient?.name ||
                "Patient"}
            </strong>

          </div>

        </header>

        <main className="case-main">

          <button
            className="back-button"
            onClick={() => {
              stopVoiceInput();
              setPage(
                "case-setup"
              );
            }}
          >
            ← Back to Case Setup
          </button>

          <div className="case-title-row">

            <div>

              <div className="section-label">
                AYUSH AI-POWERED CASE TAKING
              </div>

              <h1>
                Tell us about your health.
              </h1>

              <p>
                Answer naturally. MediKiosk
                will organize your information
                into a structured AYUSH clinical
                history.
              </p>

            </div>

            <div className="case-progress-number">

              {questionIndex + 1}

              <span>
                {" "}
                / {questions.length}
              </span>

            </div>

          </div>

          <div className="progress-container">

            <div className="progress-label">

              <span>
                Case completion
              </span>

              <strong>
                {Math.round(
                  progress
                )}%
              </strong>

            </div>

            <div className="progress-bar">

              <div
                className="progress-fill"
                style={{
                  width:
                    `${progress}%`,
                }}
              ></div>

            </div>

          </div>

          <div className="case-layout">

            <section className="question-card">

              <div className="question-top">

                <span className="question-section">
                  {currentQuestion.category}
                </span>

                <span className="question-number">
                  Question{" "}
                  {questionIndex + 1}
                </span>

              </div>

              <div className="ai-question">

                <div className="ai-avatar">
                  ✦
                </div>

                <div>

                  <span className="ai-label">
                    MediKiosk AI
                  </span>

                  <h2>
                    {currentQuestion.question}
                  </h2>

                </div>

              </div>

              <div className="answer-area">

                <label>
                  Your answer
                </label>

                <textarea
                  value={answer}
                  onChange={(e) => {
                    setAnswer(
                      e.target.value
                    );
                    setVoiceError("");
                  }}
                  placeholder={
                    currentQuestion.placeholder ||
                    "Type your answer here..."
                  }
                  rows="7"
                />

                {/* VOICE STATUS */}

                {isListening && (
                  <div
                    style={{
                      marginTop:
                        "12px",
                      padding:
                        "12px 15px",
                      borderRadius:
                        "10px",
                      background:
                        "#eaf8f3",
                      border:
                        "1px solid #b8ddd3",
                      color:
                        "#075f4b",
                      fontWeight:
                        "600",
                    }}
                  >
                    🎙️ Listening...
                    {interimTranscript
                      ? ` ${interimTranscript}`
                      : " Speak now."}
                  </div>
                )}

                {/* VOICE ERROR */}

                {voiceError && (
                  <div
                    style={{
                      marginTop:
                        "12px",
                      padding:
                        "12px 15px",
                      borderRadius:
                        "10px",
                      background:
                        "#fff3f3",
                      border:
                        "1px solid #efcaca",
                      color:
                        "#a33a3a",
                    }}
                  >
                    ⚠️{" "}
                    {voiceError}
                  </div>
                )}

                <div className="answer-tools">

                  <button
                    type="button"
                    className="voice-button"
                    onClick={
                      isListening
                        ? stopVoiceInput
                        : startVoiceInput
                    }
                  >
                    🎙️

                    <span>
                      {isListening
                        ? "Stop listening"
                        : "Answer with voice"}
                    </span>
                  </button>

                  <span className="secure-text">
                    🔒 Your response is
                    consent-based
                  </span>

                </div>

              </div>

              <div className="question-navigation">

                <button
                  type="button"
                  className="previous-question-button"
                  onClick={
                    handlePreviousQuestion
                  }
                  disabled={
                    questionIndex ===
                    0
                  }
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  className="next-question-button"
                  onClick={
                    handleNextQuestion
                  }
                  disabled={
                    savingCase
                  }
                >
                  {questionIndex ===
                  questions.length - 1
                    ? "Finish AYUSH Case Taking"
                    : "Continue"}

                  <span>→</span>
                </button>

              </div>

            </section>

            <aside className="case-side-panel">

              <div className="side-card">

                <div className="side-card-icon">
                  ✦
                </div>

                <h3>
                  AI is preparing your AYUSH case
                </h3>

                <p>
                  Your answers will be
                  organized into a structured
                  clinical history for your doctor.
                </p>

                <div className="side-status">
                  <span>✓</span>
                  Information collection
                </div>

                <div className="side-status">
                  <span>✓</span>
                  AYUSH assessment
                </div>

                <div className="side-status">
                  <span>○</span>
                  Missing information detection
                </div>

                <div className="side-status">
                  <span>○</span>
                  Structured case summary
                </div>

              </div>

              <div className="help-card">

                <strong>
                  Need help?
                </strong>

                <p>
                  You can answer naturally.
                  There is no need to use
                  medical terminology.
                </p>

              </div>

            </aside>

          </div>

        </main>

        <footer className="footer">
          MediKiosk • AI prepares patient
          context. Doctor verifies and decides.
        </footer>

      </div>
    );
  }
  // =========================================================
  // MEDICAL DOCUMENTS PAGE
  // =========================================================

  if (page === "documents") {
    return (
      <div className="dashboard-page">

        <header className="dashboard-header">

          <div className="logo">
            Medi<span>Kiosk</span>
          </div>

          <div className="patient-welcome">
            Welcome,{" "}
            {patient?.name ||
              "Patient"}
          </div>

        </header>

        <main className="dashboard-content">

          <button
            className="back-button"
            onClick={() =>
              setPage(
                "dashboard"
              )
            }
          >
            ← Back to Dashboard
          </button>

          <div className="dashboard-intro">

            <div className="section-label">
              MEDICAL DOCUMENTS
            </div>

            <h1>
              Previous Medical Documents
            </h1>

            <p>
              Upload your previous
              prescriptions, reports and
              medical documents. MediKiosk
              will extract useful clinical
              information for your case.
            </p>

          </div>

          {/* UPLOAD CARD */}

          <section className="setup-card">

            <div className="setup-header">

              <div className="setup-icon">
                📄
              </div>

              <div>

                <div className="section-label">
                  DOCUMENT INTELLIGENCE
                </div>

                <h2>
                  Upload Medical Document
                </h2>

                <p>
                  Supported formats:
                  PDF, JPG, JPEG and PNG.
                </p>

              </div>

            </div>

            <div
              style={{
                marginTop: "25px",
                padding: "25px",
                border:
                  "2px dashed #b8ddd3",
                borderRadius: "16px",
                background: "#f8fcfb",
                textAlign: "center",
              }}
            >

              <div
                style={{
                  fontSize: "42px",
                  marginBottom:
                    "12px",
                }}
              >
                📑
              </div>

              <h3
                style={{
                  margin:
                    "0 0 8px",
                  color:
                    "#073b36",
                }}
              >
                Select a medical document
              </h3>

              <p
                style={{
                  color:
                    "#657b77",
                  marginBottom:
                    "18px",
                }}
              >
                Prescription, laboratory
                report, discharge summary
                or previous medical record
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={
                  handleFileSelect
                }
                style={{
                  display:
                    "none",
                }}
              />

              <button
                className="dashboard-button"
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                Choose Document
              </button>

              {selectedFile && (
                <div
                  style={{
                    marginTop:
                      "18px",
                    padding:
                      "12px 16px",
                    background:
                      "#eaf8f3",
                    borderRadius:
                      "10px",
                    color:
                      "#075f4b",
                    fontWeight:
                      "600",
                  }}
                >
                  📎{" "}
                  {selectedFile.name}
                </div>
              )}

            </div>

            {uploadError && (
              <div
                style={{
                  marginTop:
                    "18px",
                  padding:
                    "14px 16px",
                  borderRadius:
                    "10px",
                  background:
                    "#fff3f3",
                  border:
                    "1px solid #efcaca",
                  color:
                    "#a33a3a",
                }}
              >
                ⚠️{" "}
                {uploadError}
              </div>
            )}

            {uploadMessage && (
              <div
                style={{
                  marginTop:
                    "18px",
                  padding:
                    "14px 16px",
                  borderRadius:
                    "10px",
                  background:
                    "#e9f8f1",
                  border:
                    "1px solid #bce5d3",
                  color:
                    "#08704f",
                }}
              >
                ✓{" "}
                {uploadMessage}
              </div>
            )}

            <div
              style={{
                marginTop:
                  "20px",
                display:
                  "flex",
                gap: "12px",
                flexWrap:
                  "wrap",
              }}
            >

              <button
                className="dashboard-button"
                type="button"
                onClick={
                  handleUploadDocument
                }
                disabled={
                  uploadingDocument ||
                  !selectedFile
                }
                style={{
                  opacity:
                    uploadingDocument ||
                    !selectedFile
                      ? 0.6
                      : 1,
                  cursor:
                    uploadingDocument ||
                    !selectedFile
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {uploadingDocument
                  ? "Processing Document..."
                  : "Upload & Process"}
              </button>

              <button
                type="button"
                className="dashboard-button"
                onClick={
                  fetchDocuments
                }
              >
                ↻ Refresh Documents
              </button>

            </div>

          </section>

          {/* DOCUMENT LIST */}

          <section
            className="setup-card"
            style={{
              marginTop:
                "30px",
            }}
          >

            <div className="setup-header">

              <div className="setup-icon">
                🗂️
              </div>

              <div>

                <div className="section-label">
                  YOUR RECORDS
                </div>

                <h2>
                  Uploaded Documents
                </h2>

                <p>
                  Documents processed and
                  linked to your patient record.
                </p>

              </div>

            </div>

            {loadingDocuments ? (
              <div className="setup-info">
                <span>⏳</span>
                <p>
                  Loading your medical
                  documents...
                </p>
              </div>
            ) : documentError ? (
              <div
                className="setup-info"
                style={{
                  background:
                    "#fff4f4",
                }}
              >
                <span>⚠️</span>
                <p>
                  {documentError}
                </p>
              </div>
            ) : documents.length ===
              0 ? (
              <div className="setup-info">

                <span>ℹ️</span>

                <p>
                  No medical documents have
                  been uploaded yet.
                </p>

              </div>
            ) : (
              <div
                style={{
                  marginTop:
                    "20px",
                }}
              >

                {documents.map(
                  (document) => {

                    const medicines =
                      parseDocumentField(
                        document.medicines
                      );

                    const diagnoses =
                      parseDocumentField(
                        document.diagnoses
                      );

                    const investigations =
                      parseDocumentField(
                        document.investigations
                      );

                    const dates =
                      parseDocumentField(
                        document.dates
                      );

                    return (
                      <div
                        key={
                          document.id
                        }
                        style={{
                          border:
                            "1px solid #dcebe7",
                          borderRadius:
                            "16px",
                          padding:
                            "20px",
                          marginBottom:
                            "15px",
                          background:
                            "#ffffff",
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap:
                              "20px",
                            flexWrap:
                              "wrap",
                          }}
                        >

                          <div>

                            <h3
                              style={{
                                margin:
                                  "0 0 7px",
                                color:
                                  "#073b36",
                              }}
                            >
                              📄{" "}
                              {document.filename ||
                                "Medical Document"}
                            </h3>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                                color:
                                  "#657b77",
                              }}
                            >
                              File type:{" "}
                              {(
                                document.file_type ||
                                ""
                              ).toUpperCase()}
                            </p>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                                color:
                                  "#657b77",
                              }}
                            >
                              Document ID:{" "}
                              {document.id}
                            </p>

                          </div>

                          <button
                            className="dashboard-button"
                            type="button"
                            onClick={() =>
                              setSelectedDocument(
                                document
                              )
                            }
                          >
                            View Extracted Data
                          </button>

                        </div>

                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(160px, 1fr))",
                            gap:
                              "12px",
                            marginTop:
                              "18px",
                          }}
                        >

                          <div
                            style={{
                              padding:
                                "14px",
                              background:
                                "#f5faf8",
                              borderRadius:
                                "10px",
                            }}
                          >
                            <strong>
                              Medicines
                            </strong>

                            <div
                              style={{
                                marginTop:
                                  "5px",
                              }}
                            >
                              {medicines.length ||
                                0}
                            </div>

                          </div>

                          <div
                            style={{
                              padding:
                                "14px",
                              background:
                                "#f5faf8",
                              borderRadius:
                                "10px",
                            }}
                          >
                            <strong>
                              Diagnoses
                            </strong>

                            <div
                              style={{
                                marginTop:
                                  "5px",
                              }}
                            >
                              {diagnoses.length ||
                                0}
                            </div>

                          </div>

                          <div
                            style={{
                              padding:
                                "14px",
                              background:
                                "#f5faf8",
                              borderRadius:
                                "10px",
                            }}
                          >
                            <strong>
                              Investigations
                            </strong>

                            <div
                              style={{
                                marginTop:
                                  "5px",
                              }}
                            >
                              {investigations.length ||
                                0}
                            </div>

                          </div>

                          <div
                            style={{
                              padding:
                                "14px",
                              background:
                                "#f5faf8",
                              borderRadius:
                                "10px",
                            }}
                          >
                            <strong>
                              Dates
                            </strong>

                            <div
                              style={{
                                marginTop:
                                  "5px",
                              }}
                            >
                              {dates.length ||
                                0}
                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>

          {/* DOCUMENT DETAILS */}

          {selectedDocument && (
            <section
              className="setup-card"
              style={{
                marginTop:
                  "30px",
              }}
            >

              <div className="setup-header">

                <div className="setup-icon">
                  🔎
                </div>

                <div>

                  <div className="section-label">
                    DOCUMENT ANALYSIS
                  </div>

                  <h2>
                    Extracted Medical Information
                  </h2>

                  <p>
                    Information extracted from
                    your uploaded document.
                  </p>

                </div>

              </div>

              <div
                style={{
                  marginTop:
                    "20px",
                }}
              >

                <h3>
                  📄 Document
                </h3>

                <p>
                  <strong>
                    File:
                  </strong>{" "}
                  {selectedDocument.filename}
                </p>

                {/* MEDICINES */}

                <div
                  style={{
                    marginTop:
                      "22px",
                  }}
                >

                  <h3>
                    💊 Medicines
                  </h3>

                  {parseDocumentField(
                    selectedDocument.medicines
                  ).length > 0 ? (
                    <ul>
                      {parseDocumentField(
                        selectedDocument.medicines
                      ).map(
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
                      No medicines detected.
                    </p>
                  )}

                </div>

                {/* DIAGNOSES */}

                <div
                  style={{
                    marginTop:
                      "22px",
                  }}
                >

                  <h3>
                    🩺 Diagnoses
                  </h3>

                  {parseDocumentField(
                    selectedDocument.diagnoses
                  ).length > 0 ? (
                    <ul>
                      {parseDocumentField(
                        selectedDocument.diagnoses
                      ).map(
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
                      No diagnoses detected.
                    </p>
                  )}

                </div>

                {/* INVESTIGATIONS */}

                <div
                  style={{
                    marginTop:
                      "22px",
                  }}
                >

                  <h3>
                    🧪 Investigations
                  </h3>

                  {parseDocumentField(
                    selectedDocument.investigations
                  ).length > 0 ? (
                    <ul>
                      {parseDocumentField(
                        selectedDocument.investigations
                      ).map(
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
                      No investigations detected.
                    </p>
                  )}

                </div>

                {/* DATES */}

                <div
                  style={{
                    marginTop:
                      "22px",
                  }}
                >

                  <h3>
                    📅 Medical Dates
                  </h3>

                  {parseDocumentField(
                    selectedDocument.dates
                  ).length > 0 ? (
                    <ul>
                      {parseDocumentField(
                        selectedDocument.dates
                      ).map(
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
                      No dates detected.
                    </p>
                  )}

                </div>

                {/* OCR TEXT */}

                <div
                  style={{
                    marginTop:
                      "22px",
                  }}
                >

                  <h3>
                    📝 Extracted Text
                  </h3>

                  <div
                    style={{
                      background:
                        "#f6faf9",
                      border:
                        "1px solid #dcebe7",
                      borderRadius:
                        "12px",
                      padding:
                        "18px",
                      lineHeight:
                        "1.7",
                      maxHeight:
                        "300px",
                      overflowY:
                        "auto",
                      color:
                        "#425f5a",
                    }}
                  >
                    {selectedDocument.ocr_text ||
                      "No OCR text available."}
                  </div>

                </div>

                <button
                  className="dashboard-button"
                  style={{
                    marginTop:
                      "20px",
                  }}
                  onClick={() =>
                    setSelectedDocument(
                      null
                    )
                  }
                >
                  Close Details
                </button>

              </div>

            </section>
          )}

        </main>

        <footer className="footer">
          MediKiosk • AI prepares patient
          context. Doctor verifies and decides.
        </footer>

      </div>
    );
  }

  // =========================================================
  // CASE SUMMARY
  // =========================================================

  if (page === "case-summary") {

    const ayushAssessment =
      selectedCase?.ayush_assessment
        ? (() => {
            try {
              return JSON.parse(
                selectedCase.ayush_assessment
              );
            } catch {
              return null;
            }
          })()
        : null;

    return (
      <div className="dashboard-page">

        <header className="dashboard-header">

          <div className="logo">
            Medi<span>Kiosk</span>
          </div>

          <div className="patient-welcome">
            Welcome,{" "}
            {patient?.name ||
              "Patient"}
          </div>

        </header>

        <main className="dashboard-content">

          <button
            className="back-button"
            onClick={() =>
              setPage(
                "dashboard"
              )
            }
          >
            ← Back to Dashboard
          </button>

          <div className="dashboard-intro">

            <div className="section-label">
              STRUCTURED PATIENT CONTEXT
            </div>

            <h1>
              My AYUSH Case Summary
            </h1>

            <p>
              Your responses have been
              organized into a structured
              clinical history for physician
              review.
            </p>

          </div>

          {!selectedCase ? (
            <section className="case-error">

              <h2>
                No case selected
              </h2>

              <p>
                Please complete an AYUSH
                case-taking session first.
              </p>

              <button
                className="dashboard-button"
                onClick={() =>
                  setPage(
                    "dashboard"
                  )
                }
              >
                Back to Dashboard
              </button>

            </section>
          ) : (
            <>

              <section className="patient-info-card">

                <div>

                  <h2>
                    Patient Information
                  </h2>

                  <p>
                    <strong>
                      Name:
                    </strong>{" "}
                    {patient?.name}
                  </p>

                  <p>
                    <strong>
                      Age:
                    </strong>{" "}
                    {patient?.age}
                  </p>

                  <p>
                    <strong>
                      Gender:
                    </strong>{" "}
                    {patient?.gender}
                  </p>

                </div>

                <div className="consent-badge">
                  ✓ Physician Review Ready
                </div>

              </section>

              <section className="dashboard-card">

                <div className="card-icon">
                  🩺
                </div>

                <h2>
                  Chief Complaint
                </h2>

                <p>
                  {selectedCase.chief_complaint ||
                    "Not provided"}
                </p>

              </section>

              <section className="dashboard-card">

                <div className="card-icon">
                  📋
                </div>

                <h2>
                  Current History
                </h2>

                <p
                  style={{
                    whiteSpace:
                      "pre-line",
                  }}
                >
                  {selectedCase.current_history ||
                    "Not provided"}
                </p>

              </section>

              <section className="dashboard-card">

                <div className="card-icon">
                  🗂️
                </div>

                <h2>
                  Past Medical History
                </h2>

                <p>
                  {selectedCase.past_history ||
                    "Not provided"}
                </p>

              </section>

              <section className="dashboard-card">

                <div className="card-icon">
                  💊
                </div>

                <h2>
                  Medications
                </h2>

                <p>
                  {selectedCase.medications ||
                    "Not provided"}
                </p>

              </section>

              <section className="dashboard-card">

                <div className="card-icon">
                  ⚠️
                </div>

                <h2>
                  Allergies
                </h2>

                <p>
                  {selectedCase.allergies ||
                    "Not provided"}
                </p>

              </section>

              <section className="dashboard-card">

                <div className="card-icon">
                  👨‍👩‍👧
                </div>

                <h2>
                  Family History
                </h2>

                <p>
                  {selectedCase.family_history ||
                    "Not provided"}
                </p>

              </section>

              <section className="dashboard-card">

                <div className="card-icon">
                  🏠
                </div>

                <h2>
                  Personal History
                </h2>

                <p
                  style={{
                    whiteSpace:
                      "pre-line",
                  }}
                >
                  {selectedCase.personal_history ||
                    "Not provided"}
                </p>

              </section>

              <section className="dashboard-card">

                <div className="card-icon">
                  🌿
                </div>

                <h2>
                  AYUSH Assessment
                </h2>

                {ayushAssessment ? (
                  <div>

                    {Object.entries(
                      ayushAssessment
                    ).map(
                      ([key, value]) => {

                        if (!value) {
                          return null;
                        }

                        return (
                          <p key={key}>

                            <strong>
                              {key
                                .replaceAll(
                                  "_",
                                  " "
                                )
                                .replace(
                                  /\b\w/g,
                                  (
                                    letter
                                  ) =>
                                    letter.toUpperCase()
                                )}
                              :
                            </strong>{" "}
                            {value}

                          </p>
                        );
                      }
                    )}

                  </div>
                ) : (
                  <p>
                    AYUSH assessment
                    information not provided.
                  </p>
                )}

              </section>

              {selectedCase.clinical_alerts && (
                <section
                  className="dashboard-card"
                  style={{
                    border:
                      "1px solid #e7c98b",
                    background:
                      "#fffaf0",
                  }}
                >

                  <div className="card-icon">
                    ⚠️
                  </div>

                  <h2>
                    Clinical Alert
                  </h2>

                  <p>
                    {selectedCase.clinical_alerts}
                  </p>

                  <small>
                    This is a supporting
                    alert only. Final clinical
                    interpretation remains
                    with the physician.
                  </small>

                </section>
              )}

              <section className="setup-info">

                <span>✓</span>

                <p>
                  This case has been saved
                  and is available for physician
                  review. MediKiosk prepares
                  patient context; the physician
                  makes the final clinical
                  assessment and decisions.
                </p>

              </section>

            </>
          )}

        </main>

        <footer className="footer">
          MediKiosk • AI prepares patient
          context. Doctor verifies and decides.
        </footer>

      </div>
    );
  }

  // =========================================================
  // PATIENT DASHBOARD
  // =========================================================

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">

        <div className="logo">
          Medi<span>Kiosk</span>
        </div>

        <div className="patient-welcome">
          Welcome,{" "}
          {patient?.name ||
            "Patient"}
        </div>

      </header>

      <main className="dashboard-content">

        <div className="dashboard-intro">

          <div className="section-label">
            AYUSH PATIENT PORTAL
          </div>

          <h1>
            Patient Dashboard
          </h1>

          <p>
            Manage your clinical history
            and prepare for your AYUSH
            consultation.
          </p>

        </div>

        <section className="patient-info-card">

          <div>

            <h2>
              Patient Information
            </h2>

            <p>
              <strong>
                Name:
              </strong>{" "}
              {patient?.name ||
                "Not available"}
            </p>

            <p>
              <strong>
                Age:
              </strong>{" "}
              {patient?.age ??
                "Not available"}
            </p>

            <p>
              <strong>
                Gender:
              </strong>{" "}
              {patient?.gender ||
                "Not available"}
            </p>

          </div>

          <div className="consent-badge">
            ✓ Consent Given
          </div>

        </section>

        <div className="dashboard-grid">

          {/* START CASE */}

          <div className="dashboard-card">

            <div className="card-icon">
              🗣️
            </div>

            <h2>
              Start AYUSH Case Taking
            </h2>

            <p>
              Share your health concerns,
              symptoms and AYUSH-specific
              history through guided questions.
            </p>

            <button
              className="dashboard-button"
              onClick={
                startNewCase
              }
            >
              Start Case
            </button>

          </div>

          {/* DOCUMENTS */}

          <div className="dashboard-card">

            <div className="card-icon">
              📄
            </div>

            <h2>
              Previous Medical Documents
            </h2>

            <p>
              Upload prescriptions,
              laboratory reports and
              previous medical documents
              for your clinical record.
            </p>

            <button
              className="dashboard-button"
              onClick={() =>
                setPage(
                  "documents"
                )
              }
            >
              Upload Document
            </button>

          </div>

          {/* SUMMARY */}

          <div className="dashboard-card">

            <div className="card-icon">
              📋
            </div>

            <h2>
              My Case Summary
            </h2>

            <p>
              View your structured AYUSH
              clinical history prepared for
              physician review.
            </p>

            <button
              className="dashboard-button"
              onClick={() => {

                if (
                  savedCases.length >
                  0
                ) {
                  setSelectedCase(
                    savedCases[
                      savedCases.length -
                        1
                    ]
                  );

                  setPage(
                    "case-summary"
                  );
                } else {
                  alert(
                    "No saved case found. Please complete case taking first."
                  );
                }

              }}
            >
              View Summary
            </button>

          </div>

          {/* AYUSH ASSESSMENT */}

          <div className="dashboard-card">

            <div className="card-icon">
              🌿
            </div>

            <h2>
              AYUSH Assessment
            </h2>

            <p>
              View AYUSH-specific
              information including
              Prakriti, Vikriti, Dashavidha
              Pariksha and lifestyle.
            </p>

            <button
              className="dashboard-button"
              onClick={() => {

                if (
                  savedCases.length >
                  0
                ) {
                  setSelectedCase(
                    savedCases[
                      savedCases.length -
                        1
                    ]
                  );

                  setPage(
                    "case-summary"
                  );
                } else {
                  startNewCase();
                }

              }}
            >
              AYUSH History
            </button>

          </div>

        </div>

        {/* SAVED CASES */}

        <section
          className="setup-card"
          style={{
            marginTop:
              "30px",
          }}
        >

          <div className="setup-header">

            <div className="setup-icon">
              🗃️
            </div>

            <div>

              <div className="section-label">
                CLINICAL HISTORY
              </div>

              <h2>
                Saved Cases
              </h2>

              <p>
                Your previously completed
                AYUSH case histories.
              </p>

            </div>

          </div>

          {loadingCases ? (
            <p>
              Loading saved cases...
            </p>
          ) : savedCases.length ===
            0 ? (
            <div className="setup-info">

              <span>ℹ️</span>

              <p>
                No completed case found
                yet. Start your AYUSH
                case-taking session to
                create your first
                structured case.
              </p>

            </div>
          ) : (
            <div>

              {savedCases
                .slice()
                .reverse()
                .map(
                  (
                    clinicalCase
                  ) => (
                    <div
                      key={
                        clinicalCase.id
                      }
                      style={{
                        border:
                          "1px solid #dcebe7",
                        borderRadius:
                          "14px",
                        padding:
                          "18px",
                        marginBottom:
                          "12px",
                        background:
                          "#ffffff",
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap:
                          "20px",
                      }}
                    >

                      <div>

                        <strong>
                          AYUSH Case #
                          {
                            clinicalCase.id
                          }
                        </strong>

                        <p
                          style={{
                            margin:
                              "6px 0 0",
                          }}
                        >
                          {clinicalCase.chief_complaint ||
                            "Clinical history recorded"}
                        </p>

                      </div>

                      <button
                        className="dashboard-button"
                        onClick={() =>
                          openSavedCase(
                            clinicalCase
                          )
                        }
                      >
                        View Case
                      </button>

                    </div>
                  )
                )}

            </div>
          )}

        </section>

        {/* DOCUMENT QUICK ACCESS */}

        <section
          className="setup-card"
          style={{
            marginTop:
              "30px",
          }}
        >

          <div className="setup-header">

            <div className="setup-icon">
              📁
            </div>

            <div>

              <div className="section-label">
                MEDICAL RECORDS
              </div>

              <h2>
                Your Medical Documents
              </h2>

              <p>
                Access your uploaded
                prescriptions and medical
                reports.
              </p>

            </div>

          </div>

          <div className="setup-info">

            <span>📄</span>

            <p>
              {loadingDocuments
                ? "Loading documents..."
                : `${documents.length} medical document${
                    documents.length ===
                    1
                      ? ""
                      : "s"
                  } available in your record.`}
            </p>

          </div>

          <button
            className="dashboard-button"
            onClick={() =>
              setPage(
                "documents"
              )
            }
          >
            View Medical Documents
          </button>

        </section>

      </main>

      <footer className="footer">
        MediKiosk • Your information
        remains under your control
      </footer>

    </div>
  );
}

export default PatientDashboard;