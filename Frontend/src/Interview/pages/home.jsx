import React, { useContext, useState } from "react";
import {
  ScanLine,
  Upload,
  FileText,
  Loader2,
  Sparkles,
  ArrowRight,
  UserCheck,
  Briefcase,
  Target,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  BookOpen
} from "lucide-react";
import { generateReportByAI } from "../api/generateResume";
import { AuthContext } from "../../context/user.context";
import { useNavigate } from "react-router";

const Home = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [resume, setResume] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const generateReport = async () => {
    setErrorMessage("");
    setIsLoading(true);

    const resumeFile = document.getElementById("resume").files[0];

    if (!resumeFile || !selfDescription || !jobDescription) {
      setErrorMessage("Please provide all required inputs including your resume.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await generateReportByAI(
        jobDescription,
        selfDescription,
        resumeFile
      );
      navigate("/resume-analysis", {
        state: { report: data.report },
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong while generating the report.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-16">
      {/* Navigation Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20 px-8 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <ScanLine className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">
            Resume<span className="text-indigo-600">IQ</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : "US"}
          </div>
          <span className="text-sm font-medium text-slate-700">
            Hi, {user?.name || "User"}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-12">
        {/* Hero Badge & Title */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Career Analysis Engine</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Land your next job with confidence.
          </h1>

          <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Upload your resume, share your background, and paste the job description. We’ll generate an instant match score, skill gaps, and custom interview prep.
          </p>
        </div>

        {/* Input Container Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-8">
          
          {/* File Upload Region */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              1. Upload Resume
            </label>
            
            <label
              htmlFor="resume"
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                resume
                  ? "border-emerald-300 bg-emerald-50/20"
                  : "border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-300"
              }`}
            >
              {resume ? (
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{resume.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(resume.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Drop your resume here, or <span className="text-indigo-600 font-bold">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PDF format only (Max 10MB)</p>
                  </div>
                </div>
              )}

              <input
                id="resume"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setResume(e.target.files[0])}
              />
            </label>
          </div>

          {/* Context Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Self Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                2. Tell AI About Yourself
              </label>
              <textarea
                rows={8}
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/30 p-4 text-xs md:text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none resize-none placeholder:text-slate-400"
                placeholder="Mention your key interests, career goals, years of experience, core tech stack, or standout achievements..."
              />
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                3. Paste Job Description
              </label>
              <textarea
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/30 p-4 text-xs md:text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none resize-none placeholder:text-slate-400"
                placeholder="Paste the target job description here (responsibilities, required skills, technical requirements)..."
              />
            </div>
          </div>

          {/* Validation Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={generateReport}
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>Analyzing Resume & Requirements...</span>
                </>
              ) : (
                <>
                  <span>Generate Analysis Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">ATS Match Score</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Instant evaluation against target candidate profiles.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Skill Gap Analysis</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Identify missing qualifications before you apply.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Interview Prep</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Tailored technical and behavioral question sets.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;