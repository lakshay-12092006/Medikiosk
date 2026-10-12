import { useState } from "react";

function PatientLogin({ onLoginSuccess }) {
  const [mode, setMode] = useState("choice");

  // =========================================
  // IDENTIFICATION
  // =========================================

  const [identifierType, setIdentifierType] = useState("ABHA");

  const [abhaId, setAbhaId] = useState("");
  const [aadhaarId, setAadhaarId] = useState("");

  // =========================================
  // LOGIN
  // =========================================

  const [password, setPassword] = useState("");

  // =========================================
  // REGISTRATION
  // =========================================

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [mobile, setMobile] = useState("");
  const [language, setLanguage] = useState("Hindi");
  const [newPassword, setNewPassword] = useState("");
  const [consent, setConsent] = useState(false);

  // =========================================
  // COMMON
  // =========================================

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================================
  // RESET MESSAGE
  // =========================================

  const clearMessage = () => {
    setMessage("");
  };

  // =========================================
  // CHANGE IDENTIFIER TYPE
  // =========================================

  const handleIdentifierChange = (value) => {
    setIdentifierType(value);

    setAbhaId("");
    setAadhaarId("");
    setPassword("");
    clearMessage();
  };

  // =========================================
  // LOGIN
  // =========================================

  const handleLogin = async () => {
    const identifier =
      identifierType === "ABHA"
        ? abhaId.trim()
        : aadhaarId.trim();

    if (!identifier || !password) {
      setMessage(
        `Please enter your ${
          identifierType === "ABHA"
            ? "ABHA ID"
            : "Aadhaar ID"
        } and password.`
      );

      return;
    }

    setLoading(true);
    setMessage("Checking your account...");

    try {
      const params = new URLSearchParams({
        identifier_type: identifierType,
        identifier: identifier,
        password: password
      });

      const response = await fetch(
        `http://127.0.0.1:8000/patients/login?${params.toString()}`,
        {
          method: "POST"
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Login successful!");

        setTimeout(() => {
          onLoginSuccess(data);
        }, 500);
      } else {
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            const errorMessage = data.detail
              .map((error) => {
                const field =
                  error.loc &&
                  error.loc.length > 0
                    ? error.loc[error.loc.length - 1]
                    : "unknown field";

                return `${field}: ${error.msg}`;
              })
              .join(" | ");

            setMessage(errorMessage);
          } else {
            setMessage(data.detail);
          }
        } else {
          setMessage("Login failed.");
        }
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to MediKiosk server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // CREATE ACCOUNT
  // =========================================

  const handleCreateAccount = async () => {
    const identifier =
      identifierType === "ABHA"
        ? abhaId.trim()
        : aadhaarId.trim();

    // Required fields
    if (
      !identifier ||
      !name.trim() ||
      !age ||
      !gender ||
      !mobile.trim() ||
      !newPassword
    ) {
      setMessage(
        "Please fill all required fields."
      );

      return;
    }

    // Age validation
    if (Number(age) < 0 || Number(age) > 120) {
      setMessage(
        "Please enter a valid age between 0 and 120."
      );

      return;
    }

    // Password validation
    if (newPassword.length < 6) {
      setMessage(
        "Password must contain at least 6 characters."
      );

      return;
    }

    // Consent
    if (!consent) {
      setMessage(
        "Please provide consent to continue."
      );

      return;
    }

    setLoading(true);
    setMessage("Creating your account...");

    try {
      const requestBody = {
        name: name.trim(),

        age: Number(age),

        gender: gender,

        mobile: mobile.trim(),

        identifier_type: identifierType,

        abha_id:
          identifierType === "ABHA"
            ? identifier
            : null,

        aadhaar_id:
          identifierType === "AADHAAR"
            ? identifier
            : null,

        password: newPassword,

        preferred_language: language,

        consent_given: consent
      };

      console.log(
        "Registration request:",
        requestBody
      );

      const response = await fetch(
        "http://127.0.0.1:8000/patients/",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Account created successfully!"
        );

        setTimeout(() => {
          onLoginSuccess(data);
        }, 700);
      } else {
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            const errorMessage = data.detail
              .map((error) => {
                const field =
                  error.loc &&
                  error.loc.length > 0
                    ? error.loc[error.loc.length - 1]
                    : "unknown field";

                return `${field}: ${error.msg}`;
              })
              .join(" | ");

            setMessage(errorMessage);
          } else {
            setMessage(data.detail);
          }
        } else {
          setMessage(
            "Unable to create account."
          );
        }
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to MediKiosk server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // GO TO CHOICE
  // =========================================

  const goToChoice = () => {
    setMode("choice");
    clearMessage();
  };

  // =========================================
  // CHOICE SCREEN
  // =========================================

  if (mode === "choice") {
    return (
      <div className="patient-auth-page">

        {/* HEADER */}

        <header className="patient-auth-header">

          <div className="auth-brand">

            <div className="auth-brand-icon">
              +
            </div>

            <div>
              <div className="auth-brand-name">
                MediKiosk
              </div>

              <div className="auth-brand-tagline">
                CLINICAL INTAKE PLATFORM
              </div>
            </div>

          </div>

          <div className="auth-header-label">
            Patient Access
          </div>

        </header>

        {/* MAIN */}

        <main className="patient-auth-main">

          {/* LEFT SIDE */}

          <section className="auth-intro">

            <div className="auth-eyebrow">
              SECURE PATIENT ACCESS
            </div>

            <h1>
              Welcome to
              <span>MediKiosk.</span>
            </h1>

            <p className="auth-intro-text">
              A simple and secure starting point for
              your clinical history and pre-consultation
              journey.
            </p>

            {/* Feature stickers */}

            <div className="auth-feature-row">

              <div className="auth-feature">
                <span>✓</span>
                Consent-based
              </div>

              <div className="auth-feature">
                <span>✓</span>
                Patient-friendly
              </div>

              <div className="auth-feature">
                <span>✓</span>
                Multilingual
              </div>

            </div>

            {/* Decorative medical stickers */}

            <div className="auth-sticker-area">

              <div className="auth-sticker sticker-one">
                🩺
              </div>

              <div className="auth-sticker sticker-two">
                🌿
              </div>

              <div className="auth-sticker sticker-three">
                ✦
              </div>

            </div>

          </section>

          {/* RIGHT SIDE */}

          <section className="auth-choice-card">

            {/* Card heading */}

            <div className="auth-card-heading">

              <div className="auth-heading-icon">
                🔐
              </div>

              <div>

                <div className="auth-card-eyebrow">
                  PATIENT PORTAL
                </div>

                <h2>
                  Choose how you want to continue
                </h2>

              </div>

            </div>

            <div className="auth-divider"></div>

            {/* Existing account */}

            <button
              className="auth-choice-option"
              onClick={() => {
                setMode("login");
                clearMessage();
              }}
            >

              <div className="choice-option-icon">
                →
              </div>

              <div className="choice-option-content">

                <h3>
                  Open Existing Account
                </h3>

                <p>
                  Already registered? Login using
                  your ABHA ID or Aadhaar ID.
                </p>

                <span>
                  Continue to login →
                </span>

              </div>

            </button>

            {/* New account */}

            <button
              className="auth-choice-option"
              onClick={() => {
                setMode("register");
                clearMessage();
              }}
            >

              <div className="choice-option-icon">
                +
              </div>

              <div className="choice-option-content">

                <h3>
                  Create New Account
                </h3>

                <p>
                  New patient? Create your secure
                  MediKiosk account.
                </p>

                <span>
                  Create account →
                </span>

              </div>

            </button>

            {/* Security */}

            <div className="auth-security-note">

              <span>
                🔒
              </span>

              <p>
                Your information is handled securely
                and used for clinical case-taking
                with your consent.
              </p>

            </div>

          </section>

        </main>

        <footer className="auth-footer">
          MediKiosk • AI prepares patient context.
          Doctor verifies and decides.
        </footer>

      </div>
    );
  }

  // =========================================
  // LOGIN SCREEN
  // =========================================

  if (mode === "login") {
    return (
      <div className="patient-auth-page">

        {/* HEADER */}

        <header className="patient-auth-header">

          <div className="auth-brand">

            <div className="auth-brand-icon">
              +
            </div>

            <div>
              <div className="auth-brand-name">
                MediKiosk
              </div>

              <div className="auth-brand-tagline">
                CLINICAL INTAKE PLATFORM
              </div>
            </div>

          </div>

          <div className="auth-header-label">
            Patient Access
          </div>

        </header>

        {/* LOGIN */}

        <main className="patient-auth-main">

          {/* LEFT */}

          <section className="auth-intro auth-login-intro">

            <div className="auth-eyebrow">
              SECURE PATIENT LOGIN
            </div>

            <h1>
              Welcome
              <span>back.</span>
            </h1>

            <p className="auth-intro-text">
              Continue your clinical history and
              access your MediKiosk patient journey.
            </p>

            <div className="auth-mini-cards">

              <div className="auth-mini-card">

                <div>
                  🔐
                </div>

                <section>
                  <strong>
                    Secure Access
                  </strong>

                  <span>
                    Your account is protected.
                  </span>
                </section>

              </div>

              <div className="auth-mini-card">

                <div>
                  📋
                </div>

                <section>
                  <strong>
                    Clinical History
                  </strong>

                  <span>
                    Continue from your saved journey.
                  </span>

                </section>

              </div>

              <div className="auth-mini-card">

                <div>
                  🌿
                </div>

                <section>
                  <strong>
                    AYUSH Ready
                  </strong>

                  <span>
                    Prepare your AYUSH case.
                  </span>

                </section>

              </div>

            </div>

          </section>

          {/* RIGHT LOGIN CARD */}

          <section className="auth-form-card">

            <button
              className="auth-back-button"
              onClick={goToChoice}
            >
              ← Back
            </button>

            <div className="auth-form-heading">

              <div className="auth-heading-icon">
                🔐
              </div>

              <div>

                <div className="auth-card-eyebrow">
                  EXISTING ACCOUNT
                </div>

                <h2>
                  Open your account
                </h2>

                <p>
                  Login securely to continue.
                </p>

              </div>

            </div>

            <div className="auth-divider"></div>

            {/* Login method */}

            <div className="auth-form-group">

              <label>
                Login Using
              </label>

              <select
                value={identifierType}
                onChange={(e) =>
                  handleIdentifierChange(
                    e.target.value
                  )
                }
              >

                <option value="ABHA">
                  ABHA ID
                </option>

                <option value="AADHAAR">
                  Aadhaar ID
                </option>

              </select>

            </div>

            {/* Identifier */}

            <div className="auth-form-group">

              <label>
                {identifierType === "ABHA"
                  ? "ABHA ID"
                  : "Aadhaar ID"}
              </label>

              <div className="auth-input-wrapper">

                <span>
                  {identifierType === "ABHA"
                    ? "🪪"
                    : "🆔"}
                </span>

                <input
                  type="text"
                  placeholder={
                    identifierType === "ABHA"
                      ? "Enter your ABHA ID"
                      : "Enter your Aadhaar ID"
                  }
                  value={
                    identifierType === "ABHA"
                      ? abhaId
                      : aadhaarId
                  }
                  onChange={(e) => {

                    if (
                      identifierType === "ABHA"
                    ) {
                      setAbhaId(
                        e.target.value
                      );
                    } else {
                      setAadhaarId(
                        e.target.value
                      );
                    }

                  }}
                />

              </div>

            </div>

            {/* Password */}

            <div className="auth-form-group">

              <label>
                Password
              </label>

              <div className="auth-input-wrapper">

                <span>
                  🔒
                </span>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

            {/* Login button */}

            <button
              className="auth-primary-button"
              onClick={handleLogin}
              disabled={loading}
            >

              {loading
                ? "Checking..."
                : "Login to MediKiosk →"}

            </button>

            {/* Message */}

            {message && (
              <div className="auth-message">
                {message}
              </div>
            )}

            {/* Switch */}

            <div className="auth-switch-text">

              Don't have an account?

              <button
                className="auth-link-button"
                onClick={() => {
                  setMode("register");
                  clearMessage();
                }}
              >
                Create New Account
              </button>

            </div>

            <div className="auth-bottom-note">
              🔒 Your credentials are used only
              for secure account access.
            </div>

          </section>

        </main>

        <footer className="auth-footer">
          MediKiosk • Secure patient access
        </footer>

      </div>
    );
  }

  // =========================================
  // CREATE ACCOUNT SCREEN
  // =========================================

  return (
    <div className="patient-auth-page">

      {/* HEADER */}

      <header className="patient-auth-header">

        <div className="auth-brand">

          <div className="auth-brand-icon">
            +
          </div>

          <div>

            <div className="auth-brand-name">
              MediKiosk
            </div>

            <div className="auth-brand-tagline">
              CLINICAL INTAKE PLATFORM
            </div>

          </div>

        </div>

        <div className="auth-header-label">
          Patient Registration
        </div>

      </header>

      {/* REGISTER */}

      <main className="patient-auth-main register-main">

        {/* LEFT */}

        <section className="auth-intro register-intro">

          <div className="auth-eyebrow">
            NEW PATIENT REGISTRATION
          </div>

          <h1>
            Start your
            <span>clinical journey.</span>
          </h1>

          <p className="auth-intro-text">
            Create your secure MediKiosk account
            and prepare your information before
            your AYUSH consultation.
          </p>

          <div className="register-benefits">

            <div className="register-benefit">

              <div className="benefit-icon">
                🪪
              </div>

              <div>

                <strong>
                  Secure Identification
                </strong>

                <span>
                  ABHA ID or Aadhaar ID
                </span>

              </div>

            </div>

            <div className="register-benefit">

              <div className="benefit-icon">
                🌐
              </div>

              <div>

                <strong>
                  Preferred Language
                </strong>

                <span>
                  Hindi or English
                </span>

              </div>

            </div>

            <div className="register-benefit">

              <div className="benefit-icon">
                🌿
              </div>

              <div>

                <strong>
                  AYUSH Case Preparation
                </strong>

                <span>
                  Structured clinical history
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* RIGHT FORM */}

        <section className="auth-form-card register-form-card">

          <button
            className="auth-back-button"
            onClick={goToChoice}
          >
            ← Back
          </button>

          <div className="auth-form-heading">

            <div className="auth-heading-icon">
              +
            </div>

            <div>

              <div className="auth-card-eyebrow">
                PATIENT PORTAL
              </div>

              <h2>
                Create New Account
              </h2>

              <p>
                Enter your details to get started.
              </p>

            </div>

          </div>

          <div className="auth-divider"></div>

          {/* Identification */}

          <div className="auth-form-group">

            <label>
              Identification Method *
            </label>

            <select
              value={identifierType}
              onChange={(e) =>
                handleIdentifierChange(
                  e.target.value
                )
              }
            >

              <option value="ABHA">
                ABHA ID
              </option>

              <option value="AADHAAR">
                Aadhaar ID
              </option>

            </select>

          </div>

          {/* Identifier */}

          <div className="auth-form-group">

            <label>
              {identifierType === "ABHA"
                ? "ABHA ID *"
                : "Aadhaar ID *"}
            </label>

            <div className="auth-input-wrapper">

              <span>
                {identifierType === "ABHA"
                  ? "🪪"
                  : "🆔"}
              </span>

              <input
                type="text"
                placeholder={
                  identifierType === "ABHA"
                    ? "Enter your ABHA ID"
                    : "Enter your Aadhaar ID"
                }
                value={
                  identifierType === "ABHA"
                    ? abhaId
                    : aadhaarId
                }
                onChange={(e) => {

                  if (
                    identifierType === "ABHA"
                  ) {
                    setAbhaId(
                      e.target.value
                    );
                  } else {
                    setAadhaarId(
                      e.target.value
                    );
                  }

                }}
              />

            </div>

          </div>

          {/* Name */}

          <div className="auth-form-group">

            <label>
              Full Name *
            </label>

            <div className="auth-input-wrapper">

              <span>
                👤
              </span>

              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

            </div>

          </div>

          {/* Age + Gender */}

          <div className="auth-form-row">

            <div className="auth-form-group">

              <label>
                Age *
              </label>

              <input
                type="number"
                placeholder="Age"
                min="0"
                max="120"
                value={age}
                onChange={(e) =>
                  setAge(e.target.value)
                }
              />

            </div>

            <div className="auth-form-group">

              <label>
                Gender *
              </label>

              <select
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value)
                }
              >

                <option value="">
                  Select
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>

          </div>

          {/* Mobile */}

          <div className="auth-form-group">

            <label>
              Mobile Number *
            </label>

            <div className="auth-input-wrapper">

              <span>
                📱
              </span>

              <input
                type="tel"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value)
                }
              />

            </div>

          </div>

          {/* Language */}

          <div className="auth-form-group">

            <label>
              Preferred Language
            </label>

            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
            >

              <option value="Hindi">
                Hindi
              </option>

              <option value="English">
                English
              </option>

            </select>

          </div>

          {/* Password */}

          <div className="auth-form-group">

            <label>
              Create Password *
            </label>

            <div className="auth-input-wrapper">

              <span>
                🔒
              </span>

              <input
                type="password"
                placeholder="Create a password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
              />

            </div>

            <small>
              Minimum 6 characters
            </small>

          </div>

          {/* Consent */}

          <div className="auth-consent-box">

            <input
              type="checkbox"
              checked={consent}
              onChange={(e) =>
                setConsent(
                  e.target.checked
                )
              }
            />

            <div>

              <strong>
                Consent required
              </strong>

              <p>
                I give consent to MediKiosk to
                collect and process my clinical
                information for case-taking.
              </p>

            </div>

          </div>

          {/* Create */}

          <button
            className="auth-primary-button"
            onClick={handleCreateAccount}
            disabled={loading}
          >

            {loading
              ? "Creating account..."
              : "Create MediKiosk Account →"}

          </button>

          {/* Message */}

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <div className="auth-bottom-note">
            🔒 Consent is required before
            clinical information can be processed.
          </div>

        </section>

      </main>

      <footer className="auth-footer">
        MediKiosk • Secure • Consent-based • AYUSH-ready
      </footer>

    </div>
  );
}

export default PatientLogin;