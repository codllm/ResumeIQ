import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import LandingPage from "../pages/Landing";
import DashboardPage from "../pages/Dashboard";
import CompleteProfile from "../pages/completeprofile";
import ReportPage from "../pages/ReportPage";
import onlineAssessment from "../pages/onlineAssessment";
import { useUser } from "../context/user.context";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-300">
            Loading session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  return children;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/landing",
    element: <LandingPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/complete-profile",
    element: (
      <ProtectedRoute>
        <CompleteProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/report",
    element: (
      <ProtectedRoute>
        <ReportPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/report/:reportId",
    element: (
      <ProtectedRoute>
        <ReportPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/mock-test",
    element: (
      <ProtectedRoute>
        <OnlineAssessment />
      </ProtectedRoute>
    ),
  },
  {
    path: "/start/online-assessment",
    element: (
      <ProtectedRoute>
        <onlineAssessment />
      </ProtectedRoute>
    ),
  },
]);
