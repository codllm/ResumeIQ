import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Download, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Code2,
  Sparkles,
  BarChart3,
  HelpCircle
} from 'lucide-react';

import { getassessmentreports } from '../api/user.api';
import { useUser } from '../context/user.context';

export default function AssessmentReport() {
  const navigate = useNavigate();
  const { token: contextToken } = useUser();
  const profileId = localStorage.getItem('active_profile_id');
  const token =
    contextToken ||
    localStorage.getItem("resumeiq_token") ||
    localStorage.getItem("token");

  const [reports, setReports] = useState([]);
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'summary'
  const [filter, setFilter] = useState('All Questions'); // 'All Questions' | 'Correct' | 'Incorrect' | 'Unattempted'
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedExplanations, setExpandedExplanations] = useState({});

  const pageSize = 6;

  useEffect(() => {
    const fetchAssessmentReports = async () => {
      setLoading(true);
      try {
        let oareports = await getassessmentreports(token, profileId, true);

        if ((!Array.isArray(oareports) || oareports.length === 0) && profileId) {
          oareports = await getassessmentreports(token, "", true);
        }

        if (Array.isArray(oareports)) {
          setReports(oareports);
        } else {
          setReports([]);
        }
      } catch (err) {
        console.error("Error fetching assessment report:", err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAssessmentReports();
    } else {
      setLoading(false);
    }
  }, [token, profileId]);

  // Reset page & expanded explanations on filter or report change
  useEffect(() => {
    setCurrentPage(1);
    setExpandedExplanations({});
  }, [filter, selectedReportIndex]);

  const activeReport = reports[selectedReportIndex] || null;
  const questions = activeReport?.questionsReview || activeReport?.questions || [];

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'Correct') return q.isCorrect;
    if (filter === 'Incorrect') return q.isAttempted && !q.isCorrect;
    if (filter === 'Unattempted') return !q.isAttempted;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + pageSize);

  const toggleExplanation = (qId) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-8 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-6 h-6 border-2 border-[#00875A] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600">Loading Assessment Reports...</span>
        </div>
      </div>
    );
  }

  if (!activeReport || reports.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 md:p-8 font-sans">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm text-center my-16">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#00875A] mx-auto flex items-center justify-center mb-4 border border-emerald-100">
            <Code2 size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">No Assessment Reports Found</h2>
          <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto mb-6">
            You haven't completed any online assessments yet. Take an assessment to test your knowledge, track progress, and view detailed analysis.
          </p>
          <button
            onClick={() => navigate('/mock-test')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00875A] hover:bg-[#00714B] text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            <Sparkles size={16} />
            Start Online Assessment
          </button>
        </div>
      </div>
    );
  }

  // Active Report Calculations
  const totalScore = activeReport.totalScore || 1;
  const earnedScore = activeReport.score || 0;
  const scorePercent = Math.round((earnedScore / totalScore) * 100);
  const totalQuestions = activeReport.totalQuestions || questions.length;
  const correctCount = activeReport.correctAnswersCount ?? questions.filter(q => q.isCorrect).length;
  const incorrectCount = activeReport.incorrectAnswersCount ?? questions.filter(q => q.isAttempted && !q.isCorrect).length;
  const unattemptedCount = activeReport.unattemptedCount ?? questions.filter(q => !q.isAttempted).length;
  const duration = activeReport.totalDurationMinutes || 60;

  const formatDate = (dateString) => {
    if (!dateString) return "Recent";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recent";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formattedDate = formatDate(activeReport.submittedAt);
  const strokeDasharray = `${scorePercent}, 100`;

  const renderQuestionCard = (q, globalIndex, isForPrint = false) => {
    const isExpanded = expandedExplanations[q._id || globalIndex] || isForPrint;

    return (
      <div
        key={q._id || globalIndex}
        className={`bg-white rounded-2xl p-5 border transition-all ${
          isForPrint 
            ? 'print-card border-slate-300 mb-4' 
            : 'border-slate-200/80 shadow-sm hover:border-slate-300'
        }`}
      >
        {/* Header: Index, Status Icon, Title, Score */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <span
              className={`w-7 h-7 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                q.isCorrect
                  ? 'bg-emerald-100 text-[#00875A]'
                  : q.isAttempted
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {globalIndex}
            </span>

            <div className="mt-0.5">
              {q.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-[#00875A] shrink-0" />
              ) : q.isAttempted ? (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              ) : (
                <MinusCircle className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {q.question}
              </h3>
              {(q.category || q.topic) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {q.category && (
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {q.category}
                    </span>
                  )}
                  {q.topic && (
                    <span className="inline-block px-2 py-0.5 bg-emerald-50 text-[#00875A] border border-emerald-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {q.topic}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <span
            className={`text-xs font-bold shrink-0 px-2.5 py-1 rounded-lg ${
              q.isCorrect
                ? 'bg-emerald-50 text-[#00875A] border border-emerald-100'
                : q.isAttempted
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {q.score} / {q.maxScore || 1} pts
          </span>
        </div>

        {/* Options Grid */}
        {Array.isArray(q.options) && q.options.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 pl-0 md:pl-10">
            {q.options.map((option, optIdx) => {
              const optionLetter = String.fromCharCode(65 + optIdx);
              const isUserChoice = q.userAnswer === option || q.chosenAnswer === option;
              const isCorrectChoice = q.correctAnswer === option;

              let optionStyle = "bg-slate-50 border-slate-200/80 text-slate-700";
              let badgeText = null;
              let badgeStyle = "";

              if (isUserChoice && isCorrectChoice) {
                optionStyle = "bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold ring-1 ring-emerald-400/30";
                badgeText = "Your Answer (Correct)";
                badgeStyle = "bg-emerald-200/70 text-emerald-900";
              } else if (isUserChoice && !isCorrectChoice) {
                optionStyle = "bg-rose-50/80 border-rose-300 text-rose-900 font-semibold";
                badgeText = "Your Answer (Incorrect)";
                badgeStyle = "bg-rose-200/80 text-rose-900";
              } else if (isCorrectChoice) {
                optionStyle = "bg-emerald-50/50 border-emerald-200 text-emerald-900 font-semibold";
                badgeText = "Correct Answer";
                badgeStyle = "bg-emerald-100/80 text-emerald-800 border border-emerald-200/60";
              }

              return (
                <div
                  key={optIdx}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${optionStyle}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">{optionLetter}.</span>
                    <span>{option}</span>
                  </span>
                  {badgeText && (
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md ${badgeStyle}`}>
                      {badgeText}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mb-4 pl-0 md:pl-10 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Your Answer:</span>
            <span className={`px-2.5 py-1 rounded-lg font-bold ${q.isCorrect ? 'bg-emerald-100 text-[#00875A]' : 'bg-rose-100 text-rose-800'}`}>
              {q.userAnswer || q.chosenAnswer || 'Not Attempted'} {q.isCorrect ? '(Correct)' : '(Incorrect)'}
            </span>
            {!q.isCorrect && q.correctAnswer && (
              <>
                <span className="font-semibold text-slate-500 ml-2">Correct Answer:</span>
                <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-100 text-[#00875A]">
                  {q.correctAnswer}
                </span>
              </>
            )}
          </div>
        )}

        {/* AI Explanation Accordion */}
        {q.explanation && (
          <div className="pl-0 md:pl-10">
            {!isForPrint ? (
              <button
                onClick={() => toggleExplanation(q._id || globalIndex)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00875A]" />
                  <span className="text-xs font-bold text-slate-700">Explanation & AI Insights</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isExpanded ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
            ) : (
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00875A]" />
                <span className="text-xs font-bold text-slate-700">Explanation & AI Insights</span>
              </div>
            )}
            {isExpanded && (
              <div className="mt-2 bg-slate-50/80 border border-slate-200/60 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed">
                {q.explanation}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 md:p-8 font-sans">
      <style>{`
        @media print {
          @page {
            margin: 10mm;
            size: portrait;
          }
          body {
            background-color: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside, header, nav, .print\\:hidden, button, select {
            display: none !important;
          }
          .screen-report {
            display: none !important;
          }
          .print-report {
            display: block !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 1.5rem !important;
          }
        }
      `}</style>

      <div className="print-report hidden">
        <div className="mb-6 border-b border-slate-300 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#00875A]">
            ResumeIQ Online Assessment
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
            Full Assessment Report
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Submitted on {formattedDate} • Duration: {duration} min • Role: {activeReport.role || "Online Assessment"}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-300 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Score</p>
            <p className="text-lg font-extrabold text-slate-900">{scorePercent}%</p>
            <p className="text-xs text-slate-600">{earnedScore} / {totalScore} pts</p>
          </div>
          <div className="rounded-xl border border-slate-300 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Correct</p>
            <p className="text-lg font-extrabold text-[#00875A]">{correctCount}</p>
          </div>
          <div className="rounded-xl border border-slate-300 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Incorrect</p>
            <p className="text-lg font-extrabold text-rose-600">{incorrectCount}</p>
          </div>
          <div className="rounded-xl border border-slate-300 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Unattempted</p>
            <p className="text-lg font-extrabold text-slate-900">{unattemptedCount}</p>
          </div>
        </div>

        {Array.isArray(activeReport.sections) && activeReport.sections.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-extrabold text-slate-900">
              Section Breakdown
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {activeReport.sections.map((section, sIdx) => (
                <div key={sIdx} className="rounded-xl border border-slate-300 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-slate-900">{section.category}</p>
                    <p className="text-[10px] font-bold capitalize text-[#00875A]">
                      {section.difficulty || "Mixed"}
                    </p>
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-slate-600">{section.reason}</p>
                  <p className="mt-2 text-[10px] font-bold text-slate-700">
                    Questions: {section.questionCount} • Duration: {section.durationMinutes} min
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="mb-3 text-sm font-extrabold text-slate-900">
          Question Review
        </h2>
        <div className="space-y-4">
          {questions.map((q, idx) => renderQuestionCard(q, idx + 1, true))}
        </div>
      </div>

      <div className="screen-report max-w-6xl mx-auto space-y-6">

        {/* Top Navigation Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl text-slate-600 transition cursor-pointer print:hidden"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assessment Report</h1>
                {reports.length > 1 && (
                  <div className="relative print:hidden">
                    <select
                      value={selectedReportIndex}
                      onChange={(e) => setSelectedReportIndex(Number(e.target.value))}
                      className="appearance-none bg-emerald-50/80 border border-emerald-200 text-[#00875A] font-bold rounded-lg px-2.5 py-0.5 pr-6 text-xs focus:outline-none cursor-pointer"
                    >
                      {reports.map((rep, idx) => (
                        <option key={rep._id || idx} value={idx}>
                          Attempt #{reports.length - idx} - {Math.round(((rep.score || 0) / (rep.totalScore || 1)) * 100)}%
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-[#00875A] absolute right-1.5 top-1.5 pointer-events-none" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted on {formattedDate} • Duration: {duration} min
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs shadow-sm transition cursor-pointer print:hidden"
          >
            <Download size={15} />
            Download Full PDF
          </button>
        </div>

        {/* Metrics Dashboard Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Main Score Card */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 ring-1 ring-emerald-500/10 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Overall Score
            </span>
            
            <div className="relative w-20 h-20 flex items-center justify-center my-1">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={scorePercent >= 70 ? "text-[#00875A]" : scorePercent >= 40 ? "text-amber-500" : "text-rose-500"}
                  strokeDasharray={strokeDasharray}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xl font-extrabold text-slate-900">{scorePercent}%</span>
            </div>

            <p className="text-xs font-bold text-slate-700 mt-1">{earnedScore} / {totalScore} pts</p>
          </div>

          {/* Correct Answers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Correct</span>
              <div className="p-1.5 bg-emerald-50 text-[#00875A] rounded-lg">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-extrabold text-slate-900">{correctCount}</div>
              <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}% Accuracy
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#00875A] h-full rounded-full"
                style={{ width: `${totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Incorrect Answers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Incorrect</span>
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <XCircle size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-extrabold text-slate-900">{incorrectCount}</div>
              <p className="text-xs font-semibold text-rose-500 mt-0.5">
                {totalQuestions > 0 ? Math.round((incorrectCount / totalQuestions) * 100) : 0}% Errors
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full"
                style={{ width: `${totalQuestions > 0 ? (incorrectCount / totalQuestions) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Total Questions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Questions</span>
              <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                <HelpCircle size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-extrabold text-slate-900">{totalQuestions}</div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {unattemptedCount > 0 ? `${unattemptedCount} Unattempted` : 'All Attempted'}
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-700 h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Duration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Duration</span>
              <div className="p-1.5 bg-[#00875A]/10 text-[#00875A] rounded-lg">
                <Clock size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="text-2xl font-extrabold text-slate-900">{duration} min</div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Allocated Time</p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#00875A] h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

        </div>

        {/* Tab & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 gap-4 pt-2 print:hidden">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('review')}
              className={`pb-3 text-xs font-bold transition cursor-pointer border-b-2 ${
                activeTab === 'review'
                  ? 'text-[#00875A] border-[#00875A]'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              Question Review ({filteredQuestions.length})
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-3 text-xs font-bold transition cursor-pointer border-b-2 ${
                activeTab === 'summary'
                  ? 'text-[#00875A] border-[#00875A]'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              Section Breakdown
            </button>
          </div>

          {activeTab === 'review' && (
            <div className="mb-2">
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200/80 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none cursor-pointer"
                >
                  <option value="All Questions">All Questions ({questions.length})</option>
                  <option value="Correct">Correct ({correctCount})</option>
                  <option value="Incorrect">Incorrect ({incorrectCount})</option>
                  <option value="Unattempted">Unattempted ({unattemptedCount})</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Review Tab Content */}
        {activeTab === 'review' ? (
          <>
            {/* Status Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 print:hidden">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00875A]"></span>
                <span>Correct</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Incorrect</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                <span>Unattempted</span>
              </div>
            </div>

            {/* Questions List (Screen View - Paginated) */}
            <div className="space-y-4 print:hidden">
              {paginatedQuestions.length > 0 ? (
                paginatedQuestions.map((q, idx) =>
                  renderQuestionCard(q, startIndex + idx + 1, false)
                )
              ) : (
                <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center">
                  <p className="text-xs font-semibold text-slate-500">
                    No questions match the filter "{filter}".
                  </p>
                </div>
              )}
            </div>

            {/* Questions List (Print Export - All Questions) */}
            <div className="hidden print:block space-y-4">
              {questions.map((q, idx) =>
                renderQuestionCard(q, idx + 1, true)
              )}
            </div>

            {/* Pagination controls */}
            {filteredQuestions.length > pageSize && (
              <div className="flex items-center justify-between pt-2 print:hidden">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-xs font-semibold text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200/80 rounded-xl text-xs font-semibold text-[#00875A] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Summary Tab View */
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Assessment Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of sections, difficulties, and duration per domain.
              </p>
            </div>

            {Array.isArray(activeReport.sections) && activeReport.sections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {activeReport.sections.map((section, sIdx) => (
                  <div key={sIdx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{section.category}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-[#00875A] rounded-md capitalize border border-emerald-100">
                        {section.difficulty || 'Mixed'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{section.reason}</p>
                    <div className="flex items-center justify-between text-xs text-slate-600 font-semibold pt-2 border-t border-slate-200/60">
                      <span>Questions: {section.questionCount}</span>
                      <span>Allocated: {section.durationMinutes} min</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-slate-50/50 rounded-xl text-center border border-slate-100">
                <BarChart3 className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Section analytics were compiled automatically during test execution.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
