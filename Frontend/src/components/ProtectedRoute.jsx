import React, { useContext } from 'react';
import { Navigate } from 'react-router';
import { AuthContext } from '../context/user.context';

/**
 * ProtectedRoute Component
 * Prevents unauthenticated users from accessing protected pages using AuthContext.
 */
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem('token');

  // Check both context user state and stored token
  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
