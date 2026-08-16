import React, { createContext, useState, useEffect, useContext } from "react";
import { getMe, logoutUserApi } from "../api/user.api";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("resumeiq_token") || null);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("resumeiq_token");
      if (savedToken) {
        setToken(savedToken);
        const res = await getMe(savedToken);
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem("resumeiq_token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData, userToken) => {
    if (userToken) {
      localStorage.setItem("resumeiq_token", userToken);
      setToken(userToken);
    }
    if (userData) {
      setUser(userData);
    }
  };

  const logout = async () => {
    if (token) {
      await logoutUserApi(token);
    }
    localStorage.removeItem("resumeiq_token");
    setToken(null);
    setUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};