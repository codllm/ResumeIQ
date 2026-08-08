import React from 'react';
import { createBrowserRouter } from 'react-router';
import Login from './features/auth/login';
import Register from './features/auth/register';
import ProtectedRoute from './components/ProtectedRoute';
import Home from '../src/Interview/pages/home';
import InterviewReport from '../src/Interview/pages/interviewReport';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
      <Home/>
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
  {
    path:'/resume-analysis',
    element:(
      <ProtectedRoute>
        <InterviewReport/>
      </ProtectedRoute>
    )
  }
]);