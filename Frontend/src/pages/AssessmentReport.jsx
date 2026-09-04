import React, { useEffect } from 'react';
import { 
  ArrowLeft, 
  Bell, 
  Download, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

import {getassessmentreports} from '../api/user.api';
export default function AssessmentReport() {

  const profileId = localStorage.getItem('active_profile_id');
  const token = localStorage.getItem("resumeiq_token");

  const [assessmentReport, setAssessmentReport] = React.useState(null);

  useEffect(() => {
    const fetchAssessmentReport = async () => {
      try {
        const oareports = await getassessmentreports(token, profileId);
        console.log("frontend oareports", oareports);
        console.table(oareports);
        setAssessmentReport(oareports);
      } catch (err) {
        console.error("Error fetching assessment report:", err);
      }
    };

    if (token && profileId) {
      fetchAssessmentReport();
    }
  }, [token, profileId]);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
   

      {/* Title & Action Section */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Assessment Report</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span>Full Stack Developer Assessment</span>
            <span>•</span>
            <span>20 May, 2024</span>
            <span>•</span>
            <span>60 min</span>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg text-sm transition-colors">
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {/* Overall Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">Overall Score</span>
          <div className="relative w-24 h-24 flex items-center justify-center mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500"
                strokeDasharray="78, 100"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-2xl font-bold text-slate-900">78%</span>
          </div>
          <span className="text-sm font-semibold text-slate-600">39 / 50</span>
        </div>

        {/* Correct Answers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-between text-center">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Correct Answers</span>
          <div className="my-auto">
            <div className="text-4xl font-extrabold text-emerald-600 mb-2">39</div>
            <div className="text-sm font-semibold text-slate-500">78%</div>
          </div>
          <div></div>
        </div>

        {/* Incorrect Answers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-between text-center">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Incorrect Answers</span>
          <div className="my-auto">
            <div className="text-4xl font-extrabold text-rose-500 mb-2">11</div>
            <div className="text-sm font-semibold text-slate-500">22%</div>
          </div>
          <div></div>
        </div>

        {/* Total Questions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-between text-center">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Total Questions</span>
          <div className="my-auto">
            <div className="text-4xl font-extrabold text-blue-600">50</div>
          </div>
          <div></div>
        </div>

        {/* Time Taken */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-between text-center">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Time Taken</span>
          <div className="my-auto">
            <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-slate-800 mb-1">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>48 min</span>
            </div>
            <div className="text-sm font-semibold text-slate-400">of 60 min</div>
          </div>
          <div></div>
        </div>
      </div>

      {/* Navigation Tabs & Filter */}
      <div className="flex items-center justify-between border-b border-slate-200 mb-6">
        <div className="flex gap-8">
          <button className="pb-3 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">
            Question Review
          </button>
          <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
            Summary
          </button>
        </div>
        <div className="mb-2">
          <div className="relative">
            <select className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-1.5 pr-8 text-sm font-medium text-slate-700 shadow-sm focus:outline-none">
              <option>All Questions</option>
              <option>Correct</option>
              <option>Incorrect</option>
              <option>Unattempted</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 text-sm font-medium text-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span>Correct</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <span>Incorrect</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-400"></span>
          <span>Unattempted</span>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4 mb-8">
        
        {/* Question 1 - Correct */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm">
        {assessmentReport && assessmentReport.length > 0 ? (
          <div>
            {assessmentReport.map((oaq, index) => (
              <div key={oaq._id || oaq.mocktestId || index} className="mb-6 border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-sm flex items-center justify-center">
                      {index + 1}
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      {oaq.question || `Assessment ${index + 1}`}
                    </h3>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    {oaq.score !== undefined ? `${oaq.score} / ${oaq.totalScore || 100}` : '+1'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 pl-10">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Your Answer</div>
                    <div className="text-sm font-semibold text-emerald-700">
                      {oaq.userAnswer || oaq.attemptedQuestions ? `${oaq.attemptedQuestions} questions attempted` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Correct Answer</div>
                    <div className="text-sm font-semibold text-emerald-700">
                      {oaq.correctAnswer || (oaq.score !== undefined ? `${oaq.score} points scored` : 'N/A')}
                    </div>
                  </div>
                </div>
                {oaq.explanation && (
                  <div className="pl-10">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 mb-1">Explanation</div>
                        <p className="text-xs text-slate-600">
                          {oaq.explanation}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500">No assessment report available.</p>
          </div>
        )}
        </div>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between pt-2">
        <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-400 bg-white hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <span className="text-sm font-semibold text-slate-600">1 - 5 of 50</span>

        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">
            1
          </button>
          <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-semibold flex items-center justify-center">
            2
          </button>
          <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-semibold flex items-center justify-center">
            3
          </button>
          <span className="text-slate-400 text-sm px-1">...</span>
          <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-semibold flex items-center justify-center">
            10
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-blue-600 bg-white hover:bg-slate-50 transition-colors ml-2">
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}