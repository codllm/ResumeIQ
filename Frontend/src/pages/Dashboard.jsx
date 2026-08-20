import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlusCircle,
  Loader2,
  FileText,
  Sparkles,
} from "lucide-react";
import { useUser } from "../context/user.context";
import {
  getCareerProfiles,
  getInterviewReportsApi,
  generateInterviewReportApi,
} from "../api/user.api";

// Import Modular Components
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import WelcomeBanner from "../components/WelcomeBanner";
import StatCards from "../components/StatCards";
import ScoreHistoryGraph from "../components/ScoreHistoryGraph";
import PastReportsList from "../components/PastReportsList";
import ReportDetailsView from "../components/ReportDetailsView";
import StartInterview from "../components/startInterview";
import StartOnlineAssessment from "../components/StartOnlineAssessment";
const Dashboard = () => {
  const { user, token, logout } = useUser();
  const navigate = useNavigate();

  // Navigation State: "dashboard", "reports", "oa", "interview", "settings"
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedReport, setSelectedReport] = useState(null);

  // Dynamic Data States
  const [profiles, setProfiles] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch data on mount
  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      // 1. Fetch career profiles
      const profRes = await getCareerProfiles(token);
      let activeProfiles = [];
      if (profRes.success && profRes.careerProfiles) {
        activeProfiles = profRes.careerProfiles;
        setProfiles(activeProfiles);
      }

      // 2. Fetch interview reports
      const repRes = await getInterviewReportsApi(token);
      if (repRes.success && repRes.reports) {
        setReports(repRes.reports);
        if (repRes.reports.length > 0 && !selectedReport) {
          setSelectedReport(repRes.reports[0]);
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Active target profile summary
  const activeProfile = profiles.length > 0 ? profiles[0] : null;

  // Format real reports for display
  const formattedReports = reports.map((r) => ({
    id: r._id,
    date: new Date(r.createdAt || Date.now()).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    fullDate: new Date(r.createdAt || Date.now()).toLocaleString(),
    title:
      r.careerProfile?.name ||
      r.careerProfile?.targetRole ||
      "Software Developer Profile",
    targetRole: r.careerProfile?.targetRole || "Developer",
    matchScore: Number(r.matchScore || 7.8).toFixed(1),
    atsScore: Math.round((r.matchScore || 7.8) * 10),
    skillMatch: Math.max(
      50,
      Math.round(((10 - (r.skillGaps?.length || 0)) / 10) * 100)
    ),
    keywordMatch: Math.min(
      98,
      Math.max(60, Math.round((r.matchScore || 7.8) * 10 + 5))
    ),
    technicalQuestions: r.technicalQuestions || [],
    behavioralQuestions: r.behavioralQuestions || [],
    skillGaps: r.skillGaps || [],
    preparationPlan: r.preparationPlan || [],
    rawReport: r,
  }));

  const activeReport = selectedReport
    ? formattedReports.find(
        (r) => r.id === selectedReport.id || r.id === selectedReport._id
      ) || formattedReports[0]
    : formattedReports.length > 0
    ? formattedReports[0]
    : null;

  // Latest metrics for top cards
  const latestAtsScore =
    formattedReports.length > 0 ? formattedReports[0].atsScore : 78;
  const latestSkillMatch =
    formattedReports.length > 0 ? formattedReports[0].skillMatch : 70;
  const latestKeywordMatch =
    formattedReports.length > 0 ? formattedReports[0].keywordMatch : 83;

  const handleGenerateNewReport = async () => {
    if (!activeProfile) {
      navigate("/complete-profile");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await generateInterviewReportApi(
        { careerProfileId: activeProfile._id },
        token
      );
      if (res.success && res.report) {
        setSuccessMsg("New AI interview report generated successfully!");
        await fetchDashboardData();

        const newFormatted = {
          id: res.report._id,
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          fullDate: new Date().toLocaleString(),
          title:
            activeProfile.name || activeProfile.targetRole || "Career Profile",
          targetRole: activeProfile.targetRole || "Developer",
          matchScore: Number(res.report.matchScore || 7.8).toFixed(1),
          atsScore: Math.round((res.report.matchScore || 7.8) * 10),
          skillMatch: Math.max(
            50,
            Math.round(((10 - (res.report.skillGaps?.length || 0)) / 10) * 100)
          ),
          keywordMatch: 88,
          technicalQuestions: res.report.technicalQuestions || [],
          behavioralQuestions: res.report.behavioralQuestions || [],
          skillGaps: res.report.skillGaps || [],
          preparationPlan: res.report.preparationPlan || [],
          rawReport: res.report,
        };

        // Select newly generated report without tab navigation
        setSelectedReport(newFormatted);
      } else {
        setError(res.message || "Failed to generate report.");
      }
    } catch (err) {
      setError("Error generating report.");
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/landing");
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 flex font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. LEFT SIDE NAVIGATION COMPONENT (STATIC & UNBLURRED) */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        user={user}
        activeProfile={activeProfile}
        onLogout={handleLogout}
        navigate={navigate}
      />

      {/* 2. RIGHT MAIN CONTENT CANVAS */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        {/* Top Sticky Header Component (UNBLURRED) */}
        <Header user={user} />

        {/* Notifications */}
        {successMsg && (
          <div className="mx-8 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg("")}
              className="text-emerald-600 hover:text-emerald-900"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="mx-8 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="text-rose-600 hover:text-rose-900"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: DASHBOARD TAB (OVERVIEW + REPORT BELOW)       */}
        {/* ---------------------------------------------------- */}
        {activeNav === "dashboard" && (
          <main className="p-8 max-w-7xl w-full mx-auto space-y-6 relative min-h-[500px]">
            {/* LOCAL GENERATING OVERLAY (SCOPED ONLY TO MAIN CONTENT) */}
            <AnimatePresence>
              {generating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-30 flex items-center justify-center p-4 rounded-3xl"
                >
                  <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 max-w-sm w-full text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                      <Loader2
                        size={32}
                        className="animate-spin text-emerald-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Generating Resume Report...
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Analyzing your resume against target role requirements
                        and calculating ATS scores.
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 py-2 rounded-xl border border-emerald-100">
                      <span> ⏳ AI agent is processing your request...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TOP BANNER & SCORE METRICS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <WelcomeBanner
                user={user}
                activeProfile={activeProfile}
                generating={generating}
                onGenerateNewReport={handleGenerateNewReport}
              />
              <StatCards
                latestAtsScore={latestAtsScore}
                latestSkillMatch={latestSkillMatch}
                latestKeywordMatch={latestKeywordMatch}
              />
            </div>

            {/* MIDDLE GRID: GRAPH + PAST REPORTS LIST */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <ScoreHistoryGraph
                loading={loading}
                formattedReports={formattedReports}
                activeReport={activeReport}
                onSelectReport={(rep) => setSelectedReport(rep)}
                onGenerateNewReport={handleGenerateNewReport}
                onViewAllReports={() => setActiveNav("reports")}
              />
              <PastReportsList
                formattedReports={formattedReports}
                activeReport={activeReport}
                onSelectReport={(rep) => setSelectedReport(rep)}
              />
            </div>

            {/* BOTTOM SECTION RIGHT HERE ON DASHBOARD: FULL AI REPORT */}
            {activeReport && (
              <ReportDetailsView
                activeReport={activeReport}
                user={user}
                onStartInterview={() => navigate("/complete-profile")}
              />
            )}
          </main>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 2: RESUME REPORTS TAB (ALL PAST REPORTS LIST)   */}
        {/* ---------------------------------------------------- */}
        {activeNav === "reports" && (
          <main className="p-8 max-w-7xl w-full mx-auto space-y-6 relative min-h-[500px]">
            {/* LOCAL GENERATING OVERLAY (SCOPED ONLY TO REPORT PAGE CONTENT) */}
            <AnimatePresence>
              {generating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-30 flex items-center justify-center p-4 rounded-3xl"
                >
                  <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 max-w-sm w-full text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                      <Loader2
                        size={32}
                        className="animate-spin text-emerald-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Generating AI Report...
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Analyzing your resume against target role requirements
                        and calculating ATS scores.
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 py-2 rounded-xl border border-emerald-100">
                      <Sparkles size={14} className="animate-pulse" />
                      <span>Gemini AI Engine Processing</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  Resume Reports Library
                </h1>
                <p className="text-xs text-slate-500">
                  Select any report from your scan history to inspect its
                  complete AI analysis.
                </p>
              </div>
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerateNewReport}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <PlusCircle size={15} />
                )}
                <span>Generate New Report</span>
              </button>
            </div>

            {/* Reports Selection Cards List */}
            {formattedReports.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
                <FileText size={28} className="text-emerald-500 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-900">
                  No Reports Found
                </h3>
                <p className="text-xs text-slate-500">
                  Generate your first report to start analyzing resume
                  alignment.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {formattedReports.map((rep) => {
                    const isSelected = activeReport?.id === rep.id;
                    return (
                      <div
                        key={rep.id}
                        onClick={() => setSelectedReport(rep)}
                        className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                          isSelected
                            ? "bg-emerald-50/80 border-emerald-400 shadow-md ring-2 ring-emerald-500/20"
                            : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">
                            {rep.title}
                          </h4>
                          <span className="text-xs font-black text-emerald-600 bg-white border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                            {rep.atsScore}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          {rep.targetRole}
                        </p>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>📅 {rep.date}</span>
                          <span
                            className={
                              isSelected
                                ? "text-emerald-700 font-bold"
                                : "text-slate-500"
                            }
                          >
                            {isSelected ? "● Selected" : "Click to view"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Render ONLY the selected report below */}
                {activeReport && (
                  <ReportDetailsView
                    activeReport={activeReport}
                    user={user}
                    onStartInterview={() => navigate("/complete-profile")}
                  />
                )}
              </div>
            )}
          </main>
        )}
        {activeNav === "oa" && (
          <div>
            <StartOnlineAssessment />
          </div>
        )}
        {activeNav === "interview" && (
          <div>
            <StartInterview />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
