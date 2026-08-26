import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  ScanLine,
  User,
  LogOut,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Briefcase,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Brain,
  MessageSquareCode,
  Calendar,
  Layers,
  Award,
  ArrowRight,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { useUser } from "../context/user.context";
import {
  getCareerProfiles,
  getInterviewReportsApi,
  getInterviewReportByIdApi,
  generateInterviewReportApi,
} from "../api/user.api";

const ReportPage = () => {
  const { user, token, logout } = useUser();
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [searchParams] = useSearchParams();
  const profileIdQuery = searchParams.get("profileId");

  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(profileIdQuery || "");
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [activeTab, setActiveTab] = useState("overview"); // overview, technical, behavioral, gaps, plan
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const toggleQuestion = (id) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Fetch profiles and reports
  const initData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      // 1. Fetch user career profiles
      const profRes = await getCareerProfiles(token);
      let loadedProfiles = [];
      if (profRes.success && profRes.careerProfiles) {
        loadedProfiles = profRes.careerProfiles;
        setProfiles(loadedProfiles);
        if (!selectedProfileId && loadedProfiles.length > 0) {
          setSelectedProfileId(loadedProfiles[0]._id);
        }
      }

      // 2. Fetch report if reportId param exists
      if (reportId) {
        const repRes = await getInterviewReportByIdApi(reportId, token);
        if (repRes.success && repRes.report) {
          setCurrentReport(repRes.report);
          setSelectedProfileId(repRes.report.careerProfile?._id || repRes.report.careerProfile);
          setLoading(false);
          return;
        }
      }

      // 3. Otherwise fetch reports for selected profile or all reports
      const targetProfileId = selectedProfileId || (loadedProfiles.length > 0 ? loadedProfiles[0]._id : "");
      const repListRes = await getInterviewReportsApi(token, targetProfileId);
      if (repListRes.success && repListRes.reports && repListRes.reports.length > 0) {
        setReports(repListRes.reports);
        setCurrentReport(repListRes.reports[0]);
      } else {
        setReports([]);
        setCurrentReport(null);
      }
    } catch (err) {
      setError("Failed to load interview report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, [token, reportId]);

  const handleGenerateReport = async () => {
    if (!selectedProfileId) {
      setError("Please select or create a career profile first.");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await generateInterviewReportApi({ careerProfileId: selectedProfileId }, token);
      if (res.success && res.report) {
        setCurrentReport(res.report);
        setSuccessMsg("New AI interview report generated successfully!");
        initData();
      } else {
        setError(res.message || "Our AI is currently experiencing high traffic. Please try again in a few moments.");
      }
    } catch (err) {
      setError("Our AI is currently experiencing high traffic. Please try again in a few moments.");
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/landing");
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 6) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getSeverityBadge = (severity) => {
    const s = String(severity || "").toLowerCase();
    if (s.includes("high") || s.includes("critical")) {
      return "bg-rose-500/10 border-rose-500/20 text-rose-300";
    }
    if (s.includes("medium") || s.includes("moderate")) {
      return "bg-amber-500/10 border-amber-500/20 text-amber-300";
    }
    return "bg-slate-800 border-slate-700 text-slate-300";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-emerald-400 transition cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <ScanLine size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-white hidden sm:inline">
              Resume<span className="text-emerald-400">IQ</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <User size={14} className="text-emerald-400" />
            <span className="text-slate-200 font-medium">{user?.username || user?.email}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Profile Selector & Report Generation Controls */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
              <Sparkles size={12} />
              <span>AI Intelligence Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Interview Report</h1>
            <p className="text-xs text-slate-400">
              Detailed ATS keyword alignment, skill gaps, technical questions, & multi-day study roadmap.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {profiles.length > 0 && (
              <select
                value={selectedProfileId}
                onChange={(e) => {
                  setSelectedProfileId(e.target.value);
                  const foundRep = reports.find((r) => String(r.careerProfile?._id || r.careerProfile) === e.target.value);
                  if (foundRep) setCurrentReport(foundRep);
                }}
                className="h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-emerald-500 transition cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.targetRole || "Role"})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              disabled={generating}
              onClick={handleGenerateReport}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Generating AI Report...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Generate New Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <Loader2 size={32} className="animate-spin text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">Loading interview report...</p>
          </div>
        ) : !currentReport ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Brain size={28} />
            </div>
            <h2 className="text-lg font-bold text-white">No Report Available Yet</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Select a career profile above and click <strong>"Generate New Report"</strong> to generate your tailored AI interview assessment.
            </p>
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Generate AI Report Now</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Report Hero Card */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6 mb-6">
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    {currentReport.careerProfile?.targetRole || "Target Role"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {currentReport.careerProfile?.name || "Career Profile Report"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Generated on {new Date(currentReport.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>

                {/* Score Dial Badge */}
                <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-xl font-black ${getScoreColor(currentReport.matchScore)}`}>
                    {Number(currentReport.matchScore || 0).toFixed(1)}
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Match Score</p>
                    <p className="text-sm font-bold text-white">
                      {currentReport.matchScore >= 8 ? "Strong Match" : currentReport.matchScore >= 6 ? "Moderate Match" : "Skill Gap Alert"}
                    </p>
                    <p className="text-[11px] text-slate-400">out of 10.0</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Practice */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/mock-test?reportId=${currentReport._id}`)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    <Award size={16} />
                    <span>Take MCQ Mock Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/mock-interview?reportId=${currentReport._id}`)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
                  >
                    <MessageSquareCode size={16} className="text-emerald-400" />
                    <span>Start AI Interview</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 gap-1 overflow-x-auto text-xs font-semibold text-slate-400">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`flex-1 min-w-[110px] py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "overview" ? "bg-slate-800 text-white shadow-sm border border-slate-700" : "hover:text-slate-200"
                }`}
              >
                <Layers size={14} className="text-emerald-400" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("gaps")}
                className={`flex-1 min-w-[110px] py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "gaps" ? "bg-slate-800 text-white shadow-sm border border-slate-700" : "hover:text-slate-200"
                }`}
              >
                <AlertCircle size={14} className="text-amber-400" />
                <span>Skill Gaps ({currentReport.skillGaps?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("technical")}
                className={`flex-1 min-w-[110px] py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "technical" ? "bg-slate-800 text-white shadow-sm border border-slate-700" : "hover:text-slate-200"
                }`}
              >
                <Brain size={14} className="text-teal-400" />
                <span>Technical ({currentReport.technicalQuestions?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("behavioral")}
                className={`flex-1 min-w-[110px] py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "behavioral" ? "bg-slate-800 text-white shadow-sm border border-slate-700" : "hover:text-slate-200"
                }`}
              >
                <MessageSquareCode size={14} className="text-indigo-400" />
                <span>Behavioral ({currentReport.behavioralQuestions?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("plan")}
                className={`flex-1 min-w-[110px] py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "plan" ? "bg-slate-800 text-white shadow-sm border border-slate-700" : "hover:text-slate-200"
                }`}
              >
                <Calendar size={14} className="text-emerald-400" />
                <span>Study Plan ({currentReport.preparationPlan?.length || 0} Days)</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skill Gaps Card */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-400" />
                      <span>Key Skill Gaps</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("gaps")}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      View All &rarr;
                    </button>
                  </div>
                  <div className="space-y-2">
                    {currentReport.skillGaps?.slice(0, 4).map((g, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-xs font-semibold text-slate-200">{g.skill}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${getSeverityBadge(g.severity)}`}>
                          {g.severity || "Moderate"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preparation Roadmap Card */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Calendar size={16} className="text-emerald-400" />
                      <span>Target Preparation Roadmap</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("plan")}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      View Timeline &rarr;
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {currentReport.preparationPlan?.slice(0, 3).map((day, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-400">Day {day.day}</span>
                          <span className="text-slate-300 font-medium">{day.focus}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {day.tasks?.join(" • ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SKILL GAPS */}
            {activeTab === "gaps" && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">Identified Skill Gaps & Focus Areas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentReport.skillGaps?.map((g, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1">{g.skill}</h4>
                        <p className="text-xs text-slate-400">Target requirement in job description missing or weak in current profile.</p>
                      </div>
                      <span className={`shrink-0 text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg border ${getSeverityBadge(g.severity)}`}>
                        {g.severity || "Moderate"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: TECHNICAL QUESTIONS */}
            {activeTab === "technical" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Technical Questions & Model Solutions</h3>
                {currentReport.technicalQuestions?.map((q, idx) => {
                  const key = `tech-${idx}`;
                  const isExpanded = expandedQuestions[key];
                  return (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => toggleQuestion(key)}>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            {q.tags || "Technical"}
                          </span>
                          <h4 className="text-sm font-bold text-white leading-snug">{q.question}</h4>
                        </div>
                        <button type="button" className="text-slate-400 hover:text-white p-1">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-800/80 space-y-3 text-xs">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Model Solution</p>
                            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {q.answer}
                            </div>
                          </div>
                          {q.intention && (
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Recruiter Intention</p>
                              <p className="text-xs text-slate-400 italic">{q.intention}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 4: BEHAVIORAL QUESTIONS */}
            {activeTab === "behavioral" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Behavioral & STAR Scenario Questions</h3>
                {currentReport.behavioralQuestions?.map((q, idx) => {
                  const key = `beh-${idx}`;
                  const isExpanded = expandedQuestions[key];
                  return (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => toggleQuestion(key)}>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {q.tags || "Behavioral"}
                          </span>
                          <h4 className="text-sm font-bold text-white leading-snug">{q.question}</h4>
                        </div>
                        <button type="button" className="text-slate-400 hover:text-white p-1">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-800/80 space-y-3 text-xs">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">STAR Method Guidance & Answer</p>
                            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {q.answer}
                            </div>
                          </div>
                          {q.intention && (
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Interviewer Intention</p>
                              <p className="text-xs text-slate-400 italic">{q.intention}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 5: PREPARATION PLAN */}
            {activeTab === "plan" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Multi-Day Action Plan</h3>
                <div className="space-y-4">
                  {currentReport.preparationPlan?.map((day, idx) => (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                          D{day.day}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Day {day.day}: {day.focus}</h4>
                          <p className="text-xs text-slate-400">Target study objectives for this phase</p>
                        </div>
                      </div>

                      <div className="pl-11 space-y-2">
                        {day.tasks?.map((t, tIdx) => (
                          <div key={tIdx} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md py-4 px-6 text-center text-xs text-slate-500">
        ResumeIQ &copy; {new Date().getFullYear()} — Career AI Assistant
      </footer>
    </div>
  );
};

export default ReportPage;
