import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/user.context";
import { useLocation, useNavigate } from "react-router";
import {
  Sparkles,
  Calendar,
  Code2,
  Users,
  Map,
  Briefcase,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Headphones,
  Info,
} from "lucide-react";

const InterviewReport = () => {
  const location = useLocation();
  const { report } = location.state || { report: null };
  const { user } = useContext(AuthContext);

  // Safely extract arrays (fallback to empty arrays if undefined)
  const behavioralQuestions = report?.behavioralQuestions || [];
  const technicalQuestions = report?.technicalQuestions || [];
  const preparationPlan = report?.preparationPlan || [];
  const skillGaps = report?.skillGaps || [];
  const matchScore = report?.matchScore ?? 0;
  const naviagte = useNavigate()

  const [activeTab, setActiveTab] = useState("Technical Questions");

  if (!report) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-slate-600">
        No report data found. Please generate a report first.
      </div>
    );
  }
  const scoreColor =
    matchScore >= 8
      ? {
          text: "text-green-600",
          badge: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
          label: "Excellent Match",
        }
      : matchScore >= 6
      ? {
          text: "text-yellow-600",
          badge: "text-yellow-700",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          label: "Good Match",
        }
      : {
          text: "text-red-600",
          badge: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          label: "Needs Improvement",
        };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-12">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white px-8 py-3.5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-slate-900 text-lg tracking-tight cursor-pointer" onClick={()=>naviagte('/dashboard')}>
            Resume<span className="text-indigo-600">IQ</span>
          </span>
        </div>

        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-medium text-xs flex items-center justify-center">
            {user?.username
              ? user.username.substring(0, 2).toUpperCase()
              : "NN"}
          </div>
          <span className="text-sm font-semibold text-slate-800">
            {user?.username || "Nishant Nikhil"}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-4">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/40 rounded-2xl p-6 border border-slate-100 flex justify-between items-center overflow-hidden">
          <div className="space-y-3 z-10">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Interview Readiness Report
            </h1>
            <p className="text-slate-600 text-m font-medium">
              A detailed analysis of your strengths and areas to improve
            </p>

            <div className="pt-2">
              <p className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
                👋 Welcome back, {user?.username || "Nishant Nikhil"},
              </p>
              <p className="text-slate-600 text-sm max-w-md mt-1 leading-relaxed">
                Your resume has been evaluated against the Developer role.
                <br />
                Explore your match score, skill gaps, and personalized
                interview questions below.
              </p>
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-xs pt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {report.createdAt
                  ? new Date(report.createdAt).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Banner Graphic */}
          <div className="hidden md:flex items-center justify-center relative w-64 h-40">
            <div className="w-40 h-48 bg-gradient-to-tr from-indigo-500 to-indigo-400 rounded-2xl shadow-xl shadow-indigo-200 transform rotate-12 flex flex-col p-4 border-2 border-white">
              <div className="w-full flex justify-end mb-2">
                <Sparkles className="w-4 h-4 text-indigo-100" />
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-indigo-300 rounded w-3/4"></div>
                <div className="h-2 bg-indigo-300 rounded w-1/2"></div>
                <div className="h-2 bg-indigo-300 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Match Score Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold">
                <span>Fair Match</span>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </div>
              <div className="relative flex items-center justify-center w-20 h-20 pt-2">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent flex items-center justify-center font-bold text-xl text-slate-900">
                  {matchScore}
                  <span className="text-[11px] text-slate-500 font-normal block absolute bottom-3">
                    /10
                  </span>
                </div>
              </div>
            </div>
            <div className="max-w-[140px]">
              <span className="text-sm font-bold text-indigo-600 block">
                Good Match
              </span>
              <p className="text-xs text-slate-600 mt-1 leading-normal">
                Your profile matches many of the core requirements.
                Improving the highlighted skills can increase your chances.
              </p>
            </div>
          </div>

          {/* Total Questions Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
            <span className="text-xs font-semibold text-slate-600">
              Interview Questions
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">
                {technicalQuestions.length + behavioralQuestions.length}
              </span>
              <span className="text-xs text-slate-500">Questions</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-indigo-50/50 p-2 rounded-lg text-center">
                <span className="block text-indigo-600 font-bold text-sm">
                  {technicalQuestions.length}
                </span>
                <span className="text-xs text-indigo-500 font-medium">
                  Technical
                </span>
              </div>
              <div className="bg-emerald-50/50 p-2 rounded-lg text-center">
                <span className="block text-emerald-600 font-bold text-sm">
                  {behavioralQuestions.length}
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  Behavioral
                </span>
              </div>
            </div>
          </div>

          {/* Job Role Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-600">
                  Job Role
                </span>
                <h3 className="text-lg font-bold text-emerald-600 mt-0.5">
                  Developer
                </h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1.5">
                Key Technologies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {["Frontend", "React", "JavaScript", "System Design"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content & Side Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Interactive Tabs & Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Tab Nav */}
              <div className="flex border-b border-slate-100 px-4 pt-2 gap-6 bg-slate-50/30">
                {[
                  { name: "Technical Questions", icon: Code2 },
                  { name: "Behavioral Questions", icon: Users },
                  { name: "Preparation Plan", icon: Map },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.name;
                  return (
                    <button
                      key={tab.name}
                      onClick={() => setActiveTab(tab.name)}
                      className={`flex items-center gap-2 py-3 px-1 text-sm font-semibold transition-all border-b-2 -mb-px ${
                        isActive
                          ? "border-indigo-600 text-indigo-600"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.name}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-5">
                {/* 1. Technical Questions Tab */}
                {activeTab === "Technical Questions" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Technical Questions ({technicalQuestions.length})
                      </h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Practice these technical questions to strengthen your
                        core concepts.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {technicalQuestions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="space-y-2">
                              <h5 className="text-sm font-bold text-slate-900 leading-snug">
                                {q.question}
                              </h5>
                              {q.answer && (
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {q.answer}
                                </p>
                              )}
                              {q.intention && (
                                <p className="text-xs text-slate-500 italic">
                                  Intention: {q.intention}
                                </p>
                              )}
                              {q.tags && (
                                <div className="flex flex-wrap gap-1.5">
                                  {/* {q.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium"
                                    >
                                      {tag}
                                    </span>
                                  ))} */}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {q.difficulty && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-600 border-indigo-200">
                                {q.difficulty}
                              </span>
                            )}
                            <div className="p-1 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Behavioral Questions Tab */}
                {activeTab === "Behavioral Questions" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Behavioral Questions ({behavioralQuestions.length})
                      </h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Practice behavioral questions using the STAR
                        technique.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {behavioralQuestions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="space-y-2">
                              <h5 className="text-sm font-bold text-slate-900 leading-snug">
                                {q.question}
                              </h5>
                              {q.answer && (
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {q.answer}
                                </p>
                              )}
                              {q.intention && (
                                <p className="text-xs text-slate-500 italic">
                                  Intention: {q.intention}
                                </p>
                              )}
                              {q.tags && (
                                <div className="flex flex-wrap gap-1.5">
                                  {/* {q.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium"
                                    >
                                      {tag}
                                    </span>
                                  ))} */}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {q.difficulty && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">
                                {q.difficulty}
                              </span>
                            )}
                            <div className="p-1 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Preparation Plan Tab */}
                {activeTab === "Preparation Plan" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Preparation Plan ({preparationPlan.length} Steps)
                      </h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Follow this structured roadmap to boost your
                        preparation.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {preparationPlan.map((step, idx) => (
                        <div
                          key={step.id || idx}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex items-start gap-3"
                        >
                          <span className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-slate-900 leading-snug">
                              {step.title ||
                                step.topic ||
                                step.step ||
                                `Step ${idx + 1}`}
                            </h5>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {step.description ||
                                step.details ||
                                JSON.stringify(step)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom About Banner */}
            <div className="bg-indigo-50/40 rounded-xl p-5 border border-indigo-100/60 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900">
                    About This Report
                  </h5>
                  <p className="text-sm text-slate-600 mt-1 max-w-md leading-relaxed">
                    This report is generated using AI based on your resume,
                    job description, and skills. Use it as a guide to prepare
                    better and ace your interviews!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Widgets */}
          <div className="space-y-5">
            {/* Side Score Visual */}
            <div
              className={`p-5 rounded-xl border shadow-sm text-center space-y-3 ${scoreColor.bg} ${scoreColor.border}`}
            >
              <h4 className="text-sm font-semibold text-slate-600 text-left">
                Match Score
              </h4>

              <div className="relative flex flex-col items-center justify-center py-2">
                <span className={`text-3xl font-black ${scoreColor.text}`}>
                  {matchScore}
                  <span className="text-sm text-slate-500 font-normal">
                    {" "}
                    /10
                  </span>
                </span>

                <span className={`text-sm font-bold mt-1 ${scoreColor.badge}`}>
                  {scoreColor.label}
                </span>
              </div>

              <p className="text-xs text-slate-600 px-2">
                {matchScore >= 8
                  ? "Your resume aligns very well with the job requirements."
                  : matchScore >= 6
                  ? "You're close! A few improvements can significantly increase your chances."
                  : "Consider improving your skills and tailoring your resume to this role."}
              </p>
            </div>

            {/* Skill Gaps Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-slate-600">
                Skill Gaps ({skillGaps.length})
              </h4>
              <p className="text-xs text-slate-500">
                Focus on these skills to improve your match score.
              </p>

              <ul className="space-y-2 pt-1">
                {skillGaps.map((skill, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm font-medium text-slate-800"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    {typeof skill === "string"
                      ? skill
                      : skill.name || skill.skill || JSON.stringify(skill)}
                  </li>
                ))}
              </ul>

              <button className="w-full mt-2 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-center gap-1">
                View Skill Gap Analysis <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Need Help Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">
                  Need Help?
                </h4>
                <p className="text-xs text-slate-500 max-w-[130px] leading-tight">
                  Get personalized feedback and 1:1 mock interviews.
                </p>
                <button className="mt-1 px-3 py-1.5 border border-indigo-200 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-50">
                  Book Mock Interview
                </button>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-500 rounded-full">
                <Headphones className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Banner */}
        <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-3 flex items-center justify-center gap-2 text-sm text-indigo-900 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            Consistency is the key to success. Practice daily and stay
            focused! 🚀
          </span>
        </div>
      </div>
    </div>
  );
};

export default InterviewReport;