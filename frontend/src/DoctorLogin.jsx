import { useState } from "react";

function DoctorLogin({ onLoginSuccess, onBack }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ================= LOGIN =================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!mobile.trim() || !password) {
      setMessage("Please enter mobile number and password.");
      return;
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setMessage("Signing in...");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/doctors/login?mobile=${encodeURIComponent(
          mobile.trim()
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Doctor login successful!");

        setTimeout(() => {
          onLoginSuccess(data);
        }, 500);
      } else {
        if (data.detail) {
          setMessage(data.detail);
        } else {
          setMessage("Login failed. Please check your credentials.");
        }
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to MediKiosk server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-login-page">

      {/* =====================================================
          INTERNAL STYLING
      ===================================================== */}

      <style>{`
        .doctor-login-page {
          min-height: 100vh;
          background: #f3faf8;
          color: #083f39;
          display: flex;
          flex-direction: column;
          font-family: Arial, Helvetica, sans-serif;
        }

        .doctor-login-header {
          height: 76px;
          padding: 0 6%;
          background: #ffffff;
          border-bottom: 1px solid #dcebe7;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .doctor-login-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .doctor-login-logo .logo-symbol {
          width: 42px;
          height: 42px;
          background: #07845f;
          color: white;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          font-weight: bold;
        }

        .doctor-login-logo .logo-name {
          font-size: 24px;
          line-height: 1;
          font-weight: 800;
          color: #073b36;
        }

        .doctor-login-logo .logo-name span {
          color: #07845f;
        }

        .doctor-login-logo .logo-subtitle {
          margin-top: 5px;
          font-size: 9px;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: #79918c;
        }

        .doctor-back-button {
          border: 1px solid #07845f;
          background: white;
          color: #07845f;
          padding: 11px 18px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .doctor-back-button:hover {
          background: #07845f;
          color: white;
        }

        .doctor-login-main {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 55px 20px;
          box-sizing: border-box;
        }

        .doctor-login-card {
          width: 100%;
          max-width: 520px;
          background: white;
          border: 1px solid #dcebe7;
          border-radius: 22px;
          padding: 38px 42px;
          box-sizing: border-box;
          box-shadow: 0 18px 50px rgba(16, 77, 65, 0.09);
        }

        .doctor-login-icon {
          width: 66px;
          height: 66px;
          border-radius: 17px;
          background: #e1f7ef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin-bottom: 25px;
        }

        .doctor-login-heading .section-label {
          color: #07845f;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .doctor-login-heading h1 {
          margin: 0;
          color: #073b36;
          font-size: 38px;
          line-height: 1.1;
          font-weight: 800;
        }

        .doctor-login-heading p {
          margin: 12px 0 30px;
          color: #647b76;
          font-size: 15px;
          line-height: 1.7;
        }

        .doctor-form-group {
          margin-bottom: 20px;
        }

        .doctor-form-group label {
          display: block;
          margin-bottom: 8px;
          color: #173f3a;
          font-size: 14px;
          font-weight: 700;
        }

        .doctor-form-group input {
          width: 100%;
          height: 48px;
          padding: 0 14px;
          border: 1px solid #cfe1dc;
          border-radius: 9px;
          background: #fbfefd;
          color: #173f3a;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
          transition: 0.2s ease;
        }

        .doctor-form-group input:focus {
          border-color: #07845f;
          box-shadow: 0 0 0 3px rgba(7, 132, 95, 0.10);
          background: white;
        }

        .doctor-form-group input::placeholder {
          color: #9aadaa;
        }

        .doctor-login-message {
          margin: 5px 0 18px;
          padding: 12px 14px;
          border-radius: 9px;
          background: #fff3f1;
          border: 1px solid #f1c8c2;
          color: #b42318;
          font-size: 14px;
          line-height: 1.5;
        }

        .doctor-login-message.success {
          background: #e6f8f0;
          border-color: #bde9d7;
          color: #087f5b;
        }

        .doctor-login-submit {
          width: 100%;
          height: 50px;
          border: none;
          border-radius: 10px;
          background: #07845f;
          color: white;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .doctor-login-submit:hover {
          background: #056d50;
          transform: translateY(-1px);
        }

        .doctor-login-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .doctor-login-info {
          margin-top: 25px;
          padding: 15px;
          border-radius: 11px;
          background: #f2f8f6;
          border: 1px solid #dcebe7;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .doctor-login-info span {
          font-size: 17px;
          line-height: 1.3;
        }

        .doctor-login-info p {
          margin: 0;
          color: #647b76;
          font-size: 12px;
          line-height: 1.6;
        }

        .doctor-login-footer {
          padding: 20px 6%;
          text-align: center;
          background: #073b36;
          color: #a8c5be;
          font-size: 12px;
          letter-spacing: 0.2px;
        }

        @media (max-width: 650px) {
          .doctor-login-header {
            padding: 0 5%;
          }

          .doctor-login-logo .logo-name {
            font-size: 21px;
          }

          .doctor-back-button {
            padding: 9px 12px;
            font-size: 12px;
          }

          .doctor-login-main {
            padding: 35px 15px;
          }

          .doctor-login-card {
            padding: 30px 24px;
            border-radius: 18px;
          }

          .doctor-login-heading h1 {
            font-size: 32px;
          }
        }
      `}</style>


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="doctor-login-header">

        <div
          className="doctor-login-logo"
          onClick={onBack}
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

        <button
          className="doctor-back-button"
          onClick={onBack}
        >
          ← Back to Home
        </button>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="doctor-login-main">

        <div className="doctor-login-card">

          {/* ICON */}

          <div className="doctor-login-icon">
            🩺
          </div>


          {/* HEADING */}

          <div className="doctor-login-heading">

            <div className="section-label">
              FOR PHYSICIANS
            </div>

            <h1>
              Doctor Login
            </h1>

            <p>
              Sign in to review AI-prepared patient context
              and continue with consultation.
            </p>

          </div>


          {/* FORM */}

          <form onSubmit={handleLogin}>

            {/* MOBILE */}

            <div className="doctor-form-group">

              <label>
                Mobile Number
              </label>

              <input
                type="tel"
                value={mobile}
                onChange={(e) =>
                  setMobile(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  )
                }
                placeholder="Enter 10-digit mobile number"
                maxLength="10"
              />

            </div>


            {/* PASSWORD */}

            <div className="doctor-form-group">

              <label>
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
              />

            </div>


            {/* MESSAGE */}

            {message && (
              <div
                className={
                  message === "Doctor login successful!"
                    ? "doctor-login-message success"
                    : "doctor-login-message"
                }
              >
                {message}
              </div>
            )}


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="doctor-login-submit"
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Login as Doctor →"}
            </button>

          </form>


          {/* SECURITY INFO */}

          <div className="doctor-login-info">

            <span>
              🔒
            </span>

            <p>
              Secure physician access. Patient information
              is shown only for authorized clinical review.
            </p>

          </div>

        </div>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="doctor-login-footer">
        MediKiosk • AI prepares patient context. Doctor verifies and decides.
      </footer>

    </div>
  );
}

export default DoctorLogin;