import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/auth/reset-password", { email, code, new_password: newPassword });
      setMsg("✅ Password changed successfully!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setMsg("❌ Invalid code or email.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 30, background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0" }}>
      <h2 style={{ textAlign: "center", color: "#2e7d32", marginBottom: 20 }}>Set New Password</h2>

      <form onSubmit={handleReset}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", marginBottom: 12 }} />
        <input placeholder="Reset Code" value={code} onChange={(e) => setCode(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", marginBottom: 12 }} />
        <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", marginBottom: 16 }} />

        <button style={{ width: "100%", padding: 10, borderRadius: 6, background: "#2e7d32", color: "#fff", fontWeight: 600 }}>
          Reset Password
        </button>
      </form>

      {msg && <p style={{ marginTop: 16, textAlign: "center" }}>{msg}</p>}

      <p style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
        <Link to="/login" style={{ color: "#2e7d32" }}>Back to Login</Link>
      </p>
    </div>
  );
}
