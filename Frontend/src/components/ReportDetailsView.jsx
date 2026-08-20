import React, { useState } from "react";
import {
  Calendar,
  ChartNoAxesCombined,
  Briefcase,
  Code2,
  Users,
  BookOpen,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Target,
  ChevronRight,
  CalendarCheck,
} from "lucide-react";

const ReportDetailsView = ({ activeReport, user, onStartInterview }) => {
  const [reportTab, setReportTab] = useState("technical"); // "technical", "behavioral", "plan"
  const [expandedQuestions, setExpandedQuestions] = useState({});

  if (!activeReport) return null;

  const toggleQuestion = (idx) => {
    setExpandedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const techCount = activeReport.technicalQuestions?.length || 0;
  const behavioralCount = activeReport.behavioralQuestions?.length || 0;
  const totalQuestions = techCount + behavioralCount;

  return (
    <div className="space-y-6 pt-4 border-t border-slate-200/80">
      {/* Hero Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Your AI Interview Report
          </h1>
         
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Match Score */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <div className="w-20 h-20 rounded-full border-8 border-emerald-500 border-t-emerald-200 flex items-center justify-center">
              <div className="text-center">
                <span className="text-xl font-black text-slate-900">
                  {activeReport.matchScore ?? 0}
                </span>
                <span className="text-[10px] block text-slate-400 font-bold">/10</span>
              </div>
            </div>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-s font-bold text-emerald-600">ATS SCORE</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              You're a good fit for this role. Focus on improving key skill gaps.
            </p>
          </div>
        </div>

        {/* Card 2: Total Questions */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Questions
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {totalQuestions > 0 ? totalQuestions : 8}
            </span>
            <span className="text-xs font-bold text-slate-500">Questions</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
              {techCount > 0 ? techCount : 4} Technical
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
              {behavioralCount > 0 ? behavioralCount : 4} Behavioral
            </div>
          </div>
        </div>

        {/* Card 3: Job Role */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Job Role
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Briefcase size={16} />
            </div>
          </div>
          <h4 className="text-base font-extrabold text-emerald-700 truncate">
            {activeReport.targetRole}
          </h4>
          <div className="flex flex-wrap gap-1">
            {["Frontend", "React", "JavaScript", "System Design"].map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Questions & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 cols): Tabs & Question Lists */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab Navigation Bar */}
          <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500">
            <button
              type="button"
              onClick={() => setReportTab("technical")}
              className={`pb-3 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                reportTab === "technical"
                  ? "border-emerald-500 text-emerald-600 font-extrabold"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <Code2 size={16} />
              <span>Technical Questions</span>
            </button>

            <button
              type="button"
              onClick={() => setReportTab("behavioral")}
              className={`pb-3 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                reportTab === "behavioral"
                  ? "border-emerald-500 text-emerald-600 font-extrabold"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <Users size={16} />
              <span>Behavioral Questions</span>
            </button>

            <button
              type="button"
              onClick={() => setReportTab("plan")}
              className={`pb-3 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                reportTab === "plan"
                  ? "border-emerald-500 text-emerald-600 font-extrabold"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <BookOpen size={16} />
              <span>Preparation Plan</span>
            </button>
          </div>

          {/* TAB 1: TECHNICAL QUESTIONS */}
          {reportTab === "technical" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Technical Questions ({techCount > 0 ? techCount : 4})
                </h3>
                <p className="text-xs text-slate-500">
                  Practice these technical questions to strengthen your core concepts.
                </p>
              </div>

              <div className="space-y-3">
                {(activeReport.technicalQuestions?.length > 0
                  ? activeReport.technicalQuestions
                  : [
                      {
                        question: "Explain the Virtual DOM in React. How does it work?",
                        answer:
                          "The Virtual DOM is a lightweight JS representation of the real DOM. React uses reconciliation and diffing algorithms to compute updates efficiently.",
                        tags: "React, Virtual DOM, Performance",
                      },
                      {
                        question: "What is the difference between var, let and const in JavaScript?",
                        answer:
                          "var is function-scoped and hoisted. let and const are block-scoped. const prevents re-assignment of the variable reference.",
                        tags: "JavaScript, ES6, Fundamentals",
                      },
                      {
                        question: "Explain the concept of State and Props in React.",
                        answer:
                          "Props are read-only inputs passed from parent to child. State is mutable internal data managed within the component.",
                        tags: "React, State, Props",
                      },
                      {
                        question: "How does JavaScript event loop work?",
                        answer:
                          "The event loop monitors the call stack and callback queue. When the call stack is empty, it pushes pending callbacks onto the stack.",
                        tags: "JavaScript, Event Loop, Concurrency",
                      },
                    ]
                ).map((q, idx) => {
                  const isExpanded = expandedQuestions[idx];
                  const tagsList =
                    typeof q.tags === "string" ? q.tags.split(",") : ["Fundamentals"];
                  const difficulty = idx === 1 ? "Easy" : idx === 3 ? "Hard" : "Medium";
                  const diffColor =
                    difficulty === "Easy"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : difficulty === "Hard"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200";

                  return (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3"
                    >
                      <div
                        onClick={() => toggleQuestion(idx)}
                        className="flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-800 leading-snug">
                            {q.question}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffColor}`}
                          >
                            {difficulty}
                          </span>
                          <button type="button" className="text-slate-400 hover:text-slate-700">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 pl-10">
                        {tagsList.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>

                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs pl-10">
                          <p className="text-[10px] font-extrabold uppercase text-slate-400">
                            Model Solution
                          </p>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {q.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: BEHAVIORAL QUESTIONS */}
          {reportTab === "behavioral" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Behavioral Questions ({behavioralCount > 0 ? behavioralCount : 4})
                </h3>
                <p className="text-xs text-slate-500">
                  Practice STAR method responses tailored to your target company.
                </p>
              </div>

              <div className="space-y-3">
                {(activeReport.behavioralQuestions?.length > 0
                  ? activeReport.behavioralQuestions
                  : [
                      {
                        question:
                          "Describe a situation where you had to meet a tight deadline under pressure.",
                        answer:
                          "Situation: During a sprint release, a critical bug was found 2 days before launch. Task: Resolve the issue without delaying deployment. Action: I prioritized root cause analysis and refactored the module. Result: Delivered on schedule with zero critical errors.",
                        tags: "Time Management, STAR Method",
                      },
                      {
                        question:
                          "How do you handle disagreement with a senior team member regarding technical decisions?",
                        answer:
                          "I listen actively, present data-backed benchmarks, and prioritize team consensus over personal preference.",
                        tags: "Collaboration, Communication",
                      },
                    ]
                ).map((q, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-800">{q.question}</h4>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed pl-10">
                      {q.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PREPARATION PLAN */}
          {reportTab === "plan" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Multi-Day Study Plan 
                </h3>
                <p className="text-xs text-slate-500">
                  Follow this day-by-day roadmap to bridge your skill gaps.
                </p>
              </div>

              <div className="space-y-3">
                {activeReport.preparationPlan?.map((day, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <Calendar size={14} />
                      <span>
                         {day.focus}
                      </span>
                    </div>
                    <ul className="pl-6 space-y-1 text-xs text-slate-600 list-disc">
                      {day.tasks?.map((t, tIdx) => (
                        <li key={tIdx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About This Report Info Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-50/60 to-purple-50/60 border border-indigo-100 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-indigo-600" /> About This Report
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                This report is generated using AI based on your resume, job description, and skills.
                Use it as a guide to prepare better and ace your interviews!
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Target size={22} />
            </div>
          </div>

          {/* Motivation Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 text-center text-xs font-bold text-indigo-900 flex items-center justify-center gap-2">
            <ChartNoAxesCombined size={14} className="text-indigo-600" />
            <span>Consistency is the key to success. Practice daily and stay focused! </span>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols): Skill Gaps & Book Mock */}
        <div className="lg:col-span-4 space-y-5">
          {/* Skill Gaps Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">
                Skill Gaps ({activeReport.skillGaps?.length || 4})
              </h4>
              <p className="text-[11px] text-slate-500">
                Focus on these skills to improve your match score.
              </p>
            </div>

            <ul className="space-y-2 text-xs font-medium text-slate-700">
              {(activeReport.skillGaps?.length > 0
                ? activeReport.skillGaps
                : [
                    { skill: "Advanced React Concepts" },
                    { skill: "System Design" },
                    { skill: "Performance Optimization" },
                    { skill: "Docker & Kubernetes" },
                  ]
              ).map((g, idx) => (
                <li key={idx} className="flex items-center gap-2 text-rose-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-slate-800">{g.skill}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setReportTab("technical")}
              className="w-full py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1"
            >
              <span>View Skill Gap Analysis</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Need Help / Book Mock Interview */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <Users size={22} />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Need Help?</h4>
              <p className="text-[11px] text-slate-500">
                Get personalized feedback and 1:1 mock interviews.
              </p>
            </div>

            <button
              type="button"
              onClick={onStartInterview}
              className="w-full py-2.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CalendarCheck size={15} />
              <span>Book Mock Interview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsView;
