import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header/Header";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import AdminPage from "./pages/admin/AdminPage";
import AdminRoute from "./components/AdminRoute/AdminRoute";

function App() {
  return (
    <Router>
      <Header /> {/* now visible on every route */}
      <div style={{ paddingTop: 70 /* avoid header overlap if header is sticky */ }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<UserProfile />} />
          
          <Route 
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
            />

          <Route path="*" element={<Login />} /> {/* fallback */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
