import React from 'react';
import { createBrowserRouter } from 'react-router';
import Login from './features/auth/login';
import ProtectedRoute from './components/ProtectedRoute';
import BuildProfile from './Interview/pages/BuildProfile';
import InterviewReport from '../src/Interview/pages/interviewReport';
import ResumeCheckerLanding from './features/ResumeCheckerLanding';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ResumeCheckerLanding/>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <BuildProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/build/profile',
    element: (
      <ProtectedRoute>
        <BuildProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/sign-in',
    element: <Login />,
  },
  {
    path: '/resume-analysis',
    element: (
      <ProtectedRoute>
        <InterviewReport/>
      </ProtectedRoute>
    )
  }
]);
