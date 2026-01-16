import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";

interface Product {
  drug?: string;
  brand?: string;
}

interface DispenseItem {
  id: number;
  qty: number;
  product?: Product;
}

interface Dispense {
  id: number;
  created_at: string;
  items: DispenseItem[];
}

export default function UserProfile() {
  const auth = useContext(AuthContext);
  const [history, setHistory] = useState<Dispense[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/dispense/my-history`);
        setHistory(res.data);
      } catch (err) {
        console.error("Error fetching history", err);
      } finally {
        setLoading(false);
      }
    };

    if (auth?.user) fetchHistory();
  }, [auth?.user]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        padding: "40px 20px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "auto",
          background: "white",
          padding: 30,
          borderRadius: 12,
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        }}
      >
        <h1 style={{ color: "#28a745", textAlign: "center", marginBottom: 30 }}>
          👤 User Profile
        </h1>

        {/* Profile Info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: 20,
            background: "#f9fafb",
            borderRadius: 8,
            border: "1px solid #eee",
          }}
        >
          <img
            src="https://via.placeholder.com/80"
            alt="Profile"
            style={{
              borderRadius: "50%",
              width: 80,
              height: 80,
              objectFit: "cover",
            }}
          />
          <div>
            <h2 style={{ margin: 0 }}>{auth?.user?.username}</h2>
            <p style={{ margin: "4px 0", color: "#666" }}>{auth?.user?.email}</p>
            <p style={{ margin: 0 }}>
              {auth?.user?.first_name} {auth?.user?.last_name}
            </p>
          </div>
        </div>

        {/* History Button */}
        <button
          onClick={() => setShowHistory((prev) => !prev)}
          style={{
            marginTop: 20,
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            cursor: "pointer",
            transition: "background 0.3s",
          }}
        >
          {showHistory ? "Hide History" : "View Dispense History"}
        </button>

        {/* History Table */}
        {showHistory && (
          <div style={{ marginTop: 30 }}>
            <h3 style={{ color: "#28a745" }}>💊 Dispense History</h3>
            {loading ? (
              <p>Loading...</p>
            ) : history.length === 0 ? (
              <p>No dispense records yet.</p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "white",
                  marginTop: 10,
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <thead>
                  <tr style={{ background: "#f1f5f2" }}>
                    <th style={{ padding: 10, textAlign: "left" }}>Drug</th>
                    <th style={{ padding: 10, textAlign: "left" }}>Brand</th>
                    <th style={{ padding: 10, textAlign: "left" }}>Qty</th>
                    <th style={{ padding: 10, textAlign: "left" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((dispense) =>
                    dispense.items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: 10 }}>
                          {item.product?.drug || "N/A"}
                        </td>
                        <td style={{ padding: 10 }}>
                          {item.product?.brand || "—"}
                        </td>
                        <td style={{ padding: 10 }}>{item.qty}</td>
                        <td style={{ padding: 10 }}>
                          {new Date(dispense.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
