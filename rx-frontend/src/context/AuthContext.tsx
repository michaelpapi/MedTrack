import React, { createContext, useState, useEffect, type ReactNode } from "react";
import api from "../api/axios";
import { useGoogleLogin } from "@react-oauth/google";

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_admin?: boolean;
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (username_or_email: string, password: string) => Promise<User>;
  googleLogin: () => void;
  logout: () => void;
  register: (
    first_name: string,
    last_name: string,
    username: string,
    email: string,
    password: string
  ) => Promise<{ email: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);


  // ✅ Logout helper
 const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (_) {}
  setUser(null);
  window.location.href = "/login";
 }

  // ✅ Check login session on refresh
 useEffect(() => {
  api
    .get<User>("/auth/me")
    .then((r) => setUser(r.data))
    .catch(() => setUser(null));
 }, []);



  // ✅ Normal Login
  const login = async (username_or_email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username_or_email);
    formData.append("password", password);

    await api.post("/auth/token", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const me = await api.get<User>("/auth/me");
    setUser(me.data);
    return me.data;
  };

  // ✅ Google Login
  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    scope: "openid email profile",
    onSuccess: async (googleResponse) => {
      try {
        await api.post("/auth/google-login", {
          code: googleResponse.code,
        });

        const me = await api.get<User>("/auth/me");
        setUser(me.data);
        window.location.href = "/dashboard";
      } catch (err) {
        console.error("Google Login Error:", err);
      }
    },
    onError: () => console.log("Google Login Cancelled"),
  });

  // ✅ Register
  const register = async (
    first_name: string,
    last_name: string,
    username: string,
    email: string,
    password: string
  ): Promise<{ email: string }> => {
    try {
      await api.post("/auth/register", {
        first_name,
        last_name,
        username,
        email,
        password,
      });

      return { email };
    } catch (err: any) {
      console.error("❌ Registration failed:", err.response?.data || err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, googleLogin, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
