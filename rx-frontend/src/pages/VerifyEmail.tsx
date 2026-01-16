// src/pages/VerifyEmail.tsx
import React, { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";

export default function VerifyEmail() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const initial = (location.state as any) || {};

  const [email, setEmail] = useState<string>(initial.email || "");
  const [password, setPassword] = useState<string>(initial.password || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!email) setMsg("Enter your email and verification code.");
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      // ✅ Correct axios call
      await api.post("/auth/verify-email", { email, code });

      // ✅ If password is available, auto-login
      if (password && auth?.login) {
        try {
          await auth.login(email, password);
          navigate("/dashboard");
          return;
        } catch {
          navigate("/login", { state: { info: "Account verified — please login." } });
          return;
        }
      }

      // ✅ Otherwise go to login page
      navigate("/login", { state: { info: "Account verified — please login." } });

    } catch (error: any) {
      const errMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Verification failed";
      setMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "60px auto",
        padding: 24,
        background: "white",
        borderRadius: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#2e7d32" }}>Verify your email</h3>

      <form onSubmit={handleVerify}>
        <label style={{ display: "block", marginBottom: 6 }}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
        />

        <label style={{ display: "block", marginBottom: 6 }}>Verification Code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
        />

        {/* Ask password only if not passed from Register */}
        {!initial.password && (
          <>
            <label style={{ display: "block", marginBottom: 6 }}>Password (to auto-login)</label>
            <input
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
            />
          </>
        )}

        <button
          disabled={loading}
          type="submit"
          style={{
            background: "#2e7d32",
            color: "white",
            padding: "10px 14px",
            borderRadius: 6,
            border: "none",
            width: "100%",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </form>

      {msg && <div style={{ marginTop: 12, color: "red" }}>{msg}</div>}
    </div>
  );
}
