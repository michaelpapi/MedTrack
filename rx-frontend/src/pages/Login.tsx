import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUsername("");
    setPassword("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await auth?.login(username, password);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login failed:", err);
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Invalid username or password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await auth?.googleLogin();
      navigate("/dashboard");
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "60px auto",
        padding: 30,
        background: "#ffffff",
        borderRadius: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: "1px solid #e0e0e0",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: 24,
          color: "#2e7d32",
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        Welcome Back 👋
      </h2>

      <form onSubmit={handleSubmit} autoComplete="off">
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#333" }}>
          Username / E-mail
        </label>
        <input
          name="username"
          autoComplete="username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: 16,
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 14,
            outline: "none",
            transition: "border 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.border = "1px solid #2e7d32")}
          onBlur={(e) => (e.currentTarget.style.border = "1px solid #ccc")}
        />

        <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#333" }}>
          Password
        </label>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: 20,
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 14,
            outline: "none",
            transition: "border 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.border = "1px solid #2e7d32")}
          onBlur={(e) => (e.currentTarget.style.border = "1px solid #ccc")}
        />

        {/* ✅ Forgot Password Link */}
        <div style={{ textAlign: "right", marginBottom: 18 }}>
          <Link
           to="/forgot-password"
            style={{ color: "#2e7d32", fontSize: 14, textDecoration: "none" }}
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 0",
            border: "none",
            borderRadius: 6,
            background: loading ? "#81c784" : "#2e7d32",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.3s, transform 0.1s",
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.background = "#1b5e20")}
          onMouseOut={(e) => (e.currentTarget.style.background = loading ? "#81c784" : "#2e7d32")}
          onMouseDown={(e) => !loading && (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* ✅ Google Login Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: 14,
          padding: "10px 0",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.3s, transform 0.1s",
        }}
        onMouseOver={(e) => !loading && (e.currentTarget.style.background = "#f5f5f5")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}
        onMouseDown={(e) => !loading && (e.currentTarget.style.transform = "scale(0.98)") }
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)") }
      >
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          width="18"
          alt="Google logo"
        />
        <span style={{ fontWeight: 500, color: "#333" }}>
          Sign in with Google
        </span>
      </button>

      {error && (
        <div
          style={{
            color: "red",
            marginTop: 16,
            textAlign: "center",
            background: "#ffeaea",
            padding: "8px 10px",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <p style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
        Do not have an account?{" "}
        <Link
          to="/register"
          style={{
            color: "#2e7d32",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Register
        </Link>
      </p>
    </div>
  );
}
