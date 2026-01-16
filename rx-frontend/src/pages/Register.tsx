import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const auth = useContext(AuthContext);
  
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await auth?.register(firstName, lastName, username, email, password);
      if (!result) {
        setError("Registration failed. Please try again.");
        setLoading(false);
        return;
      }
       navigate("/verify-email", { state: { email: result.email, password } });
    } catch (err: any) {
      console.error("❌ Registration failed:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: 30,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          width: "100%",
          maxWidth: 400,
        }}
      >
        <h2 style={{ textAlign: "center", color: "#28a745", marginBottom: 20 }}>
          Create Account
        </h2>

        <form onSubmit={handleSubmit}>
          {[
            { placeholder: "First Name", value: firstName, setter: setFirstName },
            { placeholder: "Last Name", value: lastName, setter: setLastName },
            { placeholder: "Username", value: username, setter: setUsername },
            { placeholder: "Email", value: email, setter: setEmail, type: "email" },
            { placeholder: "Password", value: password, setter: setPassword, type: "password" },
          ].map((f, idx) => (
            <input
              key={idx}
              placeholder={f.placeholder}
              type={f.type || "text"}
              value={f.value}
              onChange={(e) => f.setter(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                marginBottom: 12,
                padding: 10,
                borderRadius: 6,
                border: "1px solid #ccc",
                outline: "none",
                fontSize: 14,
              }}
              required
            />
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 10,
              background: loading ? "#7abf92" : "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.3s",
            }}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}

        <p style={{ textAlign: "center", marginTop: 20 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#28a745", textDecoration: "none" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
