import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { NotificationsProvider } from "./context/NotificationsContext";

import { GoogleOAuthProvider } from "@react-oauth/google";

declare global {
  interface Window {
    _env_?: {
      VITE_GOOGLE_CLIENT_ID?: string;
    };
  }
}

const GOOGLE_CLIENT_ID =
  window._env_?.VITE_GOOGLE_CLIENT_ID ||
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "";
// (or use process.env.GOOGLE_CLIENT_ID if CRA)

// axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* ✅ Wrap everything with GoogleOAuthProvider */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <NotificationsProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </NotificationsProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
