import React from 'react';
import { createBrowserRouter } from 'react-router';
import Login from './features/auth/login';
import Register from './features/auth/register';
import Home from './features/home/home';
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/create',
    element: <Register />,
  },
]);