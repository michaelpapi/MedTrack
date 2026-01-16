import React, { useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/auth/forgot-password", { email });
      navigate("/reset-password", { state: { email } }); // ✅ pass email along
    } catch (err: any) {
      setMessage("❌ Unable to send reset code. Check email and try again.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 30, background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0" }}>
      <h2 style={{ textAlign: "center", color: "#2e7d32", marginBottom: 20 }}>Reset Password</h2>

      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: 14 }}>Enter your email</label>
        <input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", marginBottom: 16 }}
        />

        <button
          type="submit"
          style={{ width: "100%", padding: 10, borderRadius: 6, background: "#2e7d32", color: "#fff", fontWeight: 600 }}
        >
          Send Reset Code
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 14, textAlign: "center", color: "#333", fontSize: 14 }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
        <Link to="/login" style={{ color: "#2e7d32" }}>Back to Login</Link>
      </p>
    </div>
  );
}
