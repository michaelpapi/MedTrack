import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { NotificationsContext } from "../../context/NotificationsContext";
import { CartContext } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const auth = useContext(AuthContext);
  const { notifications } = useContext(NotificationsContext) || { notifications: [] };
  const cart = useContext(CartContext);
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    cart?.clear();
    auth?.logout();
    navigate("/login");
  };

  const handleAuthClick = () => {
    if (auth?.user) handleLogout();
    else navigate("/login");
  };

  const isLoggedIn = !!auth?.user;
  const isAdmin = Boolean(auth?.user?.is_admin); // ensure it’s a boolean

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#004d40",
        color: "white",
        padding: "14px 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: "0.5px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onClick={() => navigate(isLoggedIn ? "/dashboard" : "/login")}
      >
        💊 <span>MedTrack</span>
      </div>

      {/* Right Section */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Notifications */}
        {isLoggedIn && (
          <div style={{ position: "relative" }}>
            <span
              onClick={() => setShowNotifications((prev) => !prev)}
              style={{ cursor: "pointer", fontSize: 20, position: "relative" }}
            >
              🔔
              {notifications.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    background: "#e53935",
                    color: "white",
                    fontSize: 11,
                    borderRadius: "50%",
                    padding: "2px 5px",
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </span>

            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 30,
                  background: "white",
                  color: "#333",
                  borderRadius: 8,
                  width: 260,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  overflow: "hidden",
                  animation: "fadeIn 0.2s ease-in-out",
                }}
              >
                {notifications.length === 0 ? (
                  <p style={{ textAlign: "center", padding: 12 }}>
                    No new notifications
                  </p>
                ) : (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {notifications.map((n, i) => (
                      <li
                        key={i}
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid #eee",
                          fontSize: 14,
                        }}
                      >
                        {n}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Profile */}
        {isLoggedIn && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              transition: "0.2s ease",
            }}
            onClick={() => navigate("/profile")}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
              alt="User Avatar"
              style={{
                borderRadius: "50%",
                width: 40,
                height: 40,
                border: "2px solid white",
              }}
            />
            <span style={{ fontWeight: 500 }}>
              {auth?.user?.username || "User"}
            </span>
          </div>
        )}

        {/* 🧑‍💼 Admin Dashboard Button */}
        {isLoggedIn && isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            style={{
              background: "white",
              color: "#004d40",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f5e9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
          >
            Admin Dashboard
          </button>
        )}

        {/* Auth / Logout */}
        <button
          onClick={handleAuthClick}
          style={{
            background: isLoggedIn ? "white" : "#1b5e20",
            color: isLoggedIn ? "#004d40" : "white",
            border: "none",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = isLoggedIn
              ? "#e0f2f1"
              : "#2e7d32")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = isLoggedIn ? "white" : "#1b5e20")
          }
        >
          {isLoggedIn ? "Logout" : "Login"}
        </button>
      </div>
    </header>
  );
}
