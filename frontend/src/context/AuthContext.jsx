// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("r2v_token");
    const role  = localStorage.getItem("r2v_role");
    const name  = localStorage.getItem("r2v_name");
    if (token && role) setAuth({ token, role, name });
    setReady(true);
  }, []);

  function login(data) {
    localStorage.setItem("r2v_token", data.access_token);
    localStorage.setItem("r2v_role",  data.role);
    localStorage.setItem("r2v_name",  data.full_name);
    setAuth({ token: data.access_token, role: data.role, name: data.full_name });
  }

  function logout() {
    localStorage.removeItem("r2v_token");
    localStorage.removeItem("r2v_role");
    localStorage.removeItem("r2v_name");
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
