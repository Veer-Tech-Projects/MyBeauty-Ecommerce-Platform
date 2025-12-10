import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../../utils/adminAuthService";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { LogIn, User, Lock } from "lucide-react";

const AdminLogin = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { loadAdmin } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Both fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await adminLogin(form.username, form.password);
      await loadAdmin();
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const msg = err.message || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <>
      {/* Animated gradient background */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          background:
            "linear-gradient(135deg, #f9f4f1, #f8e7ef, #ede7ff, #f9f4f1)",
          backgroundSize: "300% 300%",
          animation: "gradientMove 12s ease infinite",
        }}
      />

      <style>
        {`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      {/* Center content */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "80px",
          paddingBottom: "40px",
        }}
      >
        <div
          className="shadow-lg border-0"
          style={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255, 255, 255, 0.75)",
            borderRadius: "20px",
            padding: "3rem",
            width: "100%",
            maxWidth: "420px",
            boxShadow:
              "0 8px 24px rgba(139, 105, 240, 0.15), 0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Logo + Title */}
          <div className="text-center mb-4">
            <img
              src="/assets/logo2.png"
              alt="MyBeauty Logo"
              style={{ width: "60px", marginBottom: "10px" }}
            />
            <h3 className="fw-bold" style={{ color: "#4B3F72" }}>
              ADMIN LOGIN
            </h3>
            <p className="text-muted" style={{ fontSize: "0.95rem" }}>
              Access your admin panel securely
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              <strong>Error:</strong> {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError("")}
                aria-label="Close"
              ></button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label fw-medium">
                Username
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  className="form-control form-control-lg border-start-0"
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-medium">
                Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  className="form-control form-control-lg border-start-0"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-lg w-100 text-white d-flex align-items-center justify-content-center"
              disabled={loading}
              style={{
                background:
                  "linear-gradient(90deg, #8b69f0 0%, #b57bf3 50%, #d38ef7 100%)",
                border: "none",
                borderRadius: "12px",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) =>
                (e.target.style.background =
                  "linear-gradient(90deg, #9a76f2 0%, #c98df6 100%)")
              }
              onMouseOut={(e) =>
                (e.target.style.background =
                  "linear-gradient(90deg, #8b69f0 0%, #b57bf3 50%, #d38ef7 100%)")
              }
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} className="me-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <small className="text-muted">
              Secured with <strong>end-to-end encryption </strong> 
            </small>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
