import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../auth/hooks/useAdminAuth";
import { LogIn, User, Lock } from "lucide-react";

const AdminLogin = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  
  const { login, status } = useAdminAuth();
  const navigate = useNavigate();
  const loading = status === 'LOADING';

  // Enhancement 3: Anti-Clickjacking Guard
  useEffect(() => {
    if (window.self !== window.top) {
      console.warn("Admin panel being framed. Redirecting to top.");
      window.top.location = window.self.location;
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Both fields are required");
      return;
    }
    setError("");

    try {
      await login(form.username, form.password);
      // Success is handled by state change in Context, but we navigate explicitly
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      // Error is set in Context, but we also show it locally
      setError(err.message || "Login failed");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          background: "linear-gradient(135deg, #f9f4f1, #f8e7ef, #ede7ff, #f9f4f1)",
          backgroundSize: "300% 300%",
          animation: "gradientMove 12s ease infinite",
        }}
      />
      <style>{`@keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "80px", paddingBottom: "40px" }}>
        <div className="shadow-lg border-0" style={{ backdropFilter: "blur(10px)", backgroundColor: "rgba(255, 255, 255, 0.75)", borderRadius: "20px", padding: "3rem", width: "100%", maxWidth: "420px" }}>
          <div className="text-center mb-4">
            <img src="/assets/logo2.png" alt="Logo" style={{ width: "60px", marginBottom: "10px" }} />
            <h3 className="fw-bold" style={{ color: "#4B3F72" }}>ADMIN LOGIN</h3>
            <p className="text-muted" style={{ fontSize: "0.95rem" }}>Access your admin panel securely</p>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>Error:</strong> {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-medium">Username</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0"><User size={18} /></span>
                <input type="text" className="form-control form-control-lg border-start-0" name="username" value={form.username} onChange={handleChange} placeholder="Enter username" disabled={loading} />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0"><Lock size={18} /></span>
                <input type="password" className="form-control form-control-lg border-start-0" name="password" value={form.password} onChange={handleChange} placeholder="Enter password" disabled={loading} />
              </div>
            </div>

            <button type="submit" className="btn btn-lg w-100 text-white d-flex align-items-center justify-content-center" disabled={loading} style={{ background: "linear-gradient(90deg, #8b69f0 0%, #b57bf3 50%, #d38ef7 100%)", border: "none", borderRadius: "12px" }}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <LogIn size={18} className="me-2" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          
          <div className="text-center mt-4">
             <small className="text-muted">Protected by <strong>Enterprise Auth</strong></small>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;