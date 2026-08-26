import React, { useContext, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Briefcase,
  User,
  Target,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Check,
  FileCheck,
  Loader2,
} from "lucide-react";
import { UserContext } from "../context/user.context";
import { createCareerProfile } from "../api/user.api";

const CompleteProfilePage = ({ onSubmit }) => {
  const navigate = useNavigate();
  const { user, token } = useContext(UserContext);

  const [step, setStep] = useState(1);
  const [resumeMode, setResumeMode] = useState("file");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    resumeFile: null,
    resumeText: "",
    jobDescription: "",
    selfDescription: "",
    targetRole: "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const submitProfile = async (finalData) => {
    if (onSubmit) {
      onSubmit(finalData);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const fd = new FormData();
      fd.append("name", finalData.name?.trim() || finalData.targetRole?.trim() || "Career Profile");
      fd.append("targetRole", finalData.targetRole?.trim() || "");
      fd.append("jobDescription", finalData.jobDescription?.trim() || "");
      fd.append("selfDescription", finalData.selfDescription?.trim() || "");
      if (finalData.resumeFile) {
        fd.append("resume", finalData.resumeFile);
      } else {
        fd.append("resumeText", finalData.resumeText?.trim() || "");
      }

      const res = await createCareerProfile(fd, token);
      if (res.success) {
        setSuccessMsg("Career profile created successfully! Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        setError(res.message || "Failed to create career profile. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (resumeMode === "file" && !formData.resumeFile) {
        setError("Please upload a PDF file or switch to text input.");
        return;
      }
      if (resumeMode === "text" && !formData.resumeText.trim()) {
        setError("Please paste your resume text.");
        return;
      }
    }

    if (step === 2 && !formData.jobDescription.trim()) {
      setError("Please provide the target job description.");
      return;
    }

    if (step === 3 && !formData.selfDescription.trim()) {
      setError("Please enter a short summary about yourself.");
      return;
    }

    if (step < 4) {
      setStep((prev) => prev + 1);
    } else {
      submitProfile(formData);
    }
  };

  const handleBack = () => {
    setError("");
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    if (step === 4) {
      const skippedData = { ...formData, targetRole: "" };
      submitProfile(skippedData);
    }
  };

  const stepsInfo = [
    { title: "Resume Upload", icon: FileText },
    { title: "Job Description", icon: Briefcase },
    { title: "Self Notes", icon: User },
    { title: "Target Role", icon: Target },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-6 lg:px-16 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Resume<span className="text-emerald-600">IQ</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all duration-300 group">
            {/* Avatar Circle with Online Dot */}
            <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-[10px] shadow-xs">
              {user?.username?.charAt(0).toUpperCase() || "U"}
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            {/* Username */}
            <span className="text-s font-bold text-slate-700 group-hover:text-slate-900 tracking-tight">
              {user?.username || "Guest User"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Brand Narrative & Progress */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Build your custom targeted resume profile
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Store reusable target profiles to generate tailored interview prep, ATS keyword alignment, and customized responses.
            </p>
          </div>

          {/* Stepper Progress Badges */}
          <div className="space-y-3 pt-2">
            {stepsInfo.map((s, idx) => {
              const StepIcon = s.icon;
              const isDone = step > idx + 1;
              const isCurrent = step === idx + 1;

              return (
                <div
                  key={s.title}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${
                    isCurrent
                      ? "bg-white shadow-md shadow-slate-200/60 border border-emerald-200"
                      : "bg-slate-100/60 opacity-70"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isDone ? <Check size={16} /> : idx + 1}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-xs font-bold ${
                        isCurrent ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {s.title}
                    </p>
                  </div>
                  <StepIcon
                    size={16}
                    className={isCurrent ? "text-emerald-600" : "text-slate-400"}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Step Input Container */}
        <div className="lg:col-span-7">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden">
            {/* Top Step Counter Bar */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  STEP 0{step}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 04</span>
              </div>
              <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Dynamic Step Content with Transitions */}
            <div className="min-h-[320px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {/* STEP 1: RESUME */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Upload your background
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Choose between uploading your PDF resume or pasting plain text directly.
                      </p>
                    </div>

                    {/* Mode Toggle Switcher */}
                    <div className="flex bg-slate-100/80 p-1 rounded-2xl gap-1 text-xs font-bold text-slate-600 border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setResumeMode("file")}
                        className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                          resumeMode === "file"
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "hover:text-slate-900"
                        }`}
                      >
                        Upload PDF Document
                      </button>
                      <button
                        type="button"
                        onClick={() => setResumeMode("text")}
                        className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                          resumeMode === "text"
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "hover:text-slate-900"
                        }`}
                      >
                        Paste Plain Text
                      </button>
                    </div>

                    {resumeMode === "file" ? (
                      <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-3xl cursor-pointer transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform">
                          <Upload size={22} />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {formData.resumeFile
                            ? formData.resumeFile.name
                            : "Click or drag PDF resume here"}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1">
                          Supports PDF documents up to 5MB
                        </span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) =>
                            updateField("resumeFile", e.target.files[0])
                          }
                        />
                      </label>
                    ) : (
                      <textarea
                        rows={7}
                        value={formData.resumeText}
                        onChange={(e) => updateField("resumeText", e.target.value)}
                        placeholder="Paste plain text content from your resume standard sections..."
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition resize-none leading-relaxed"
                      />
                    )}
                  </motion.div>
                )}

                {/* STEP 2: JOB DESCRIPTION */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                         Job Description
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Paste the full role description so our system can analyze missing skills and keywords.
                      </p>
                    </div>

                    <textarea
                      rows={8}
                      value={formData.jobDescription}
                      onChange={(e) => updateField("jobDescription", e.target.value)}
                      placeholder="Paste target job responsibilities, key requirements, and qualifications..."
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition resize-none leading-relaxed"
                    />
                  </motion.div>
                )}

                {/* STEP 3: SELF DESCRIPTION */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Self Summary & Background
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Add key notes about your core technical strengths, preferred tech stack, or career highlights.
                      </p>
                    </div>

                    <textarea
                      rows={7}
                      value={formData.selfDescription}
                      onChange={(e) => updateField("selfDescription", e.target.value)}
                      placeholder="e.g., Computer science engineer focused on React/Tailwind frontend systems, competitive programming experience..."
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition resize-none leading-relaxed"
                    />
                  </motion.div>
                )}

                {/* STEP 4: PROFILE NAME & TARGET ROLE */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                        Final Step
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Profile Details
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Name your profile and specify your target role title for precision indexing.
                      </p>
                    </div>

                    <div className="pt-2 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          Profile Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          placeholder="e.g., Google Frontend Profile"
                          className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          Desired Role Title
                        </label>
                        <input
                          type="text"
                          value={formData.targetRole}
                          onChange={(e) => updateField("targetRole", e.target.value)}
                          placeholder="e.g., Senior Frontend Engineer"
                          className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Toast */}
              {successMsg && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Inline Validation Alert */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                  {error}
                </div>
              )}
            </div>

            {/* Bottom Form Actions Controls */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1 || submitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                {step === 4 && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={submitting}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
                  >
                    Skip & Complete
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={submitting}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>{step === 4 ? "Save Target Profile" : "Continue"}</span>
                      {step === 4 ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <ArrowRight size={16} />
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Simple Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/60 bg-white/50 py-4 px-6 lg:px-16 text-center text-xs text-slate-400">
        ResumeIQ &copy; {new Date().getFullYear()} — Career AI Assistant
      </footer>
    </div>
  );
};

export default CompleteProfilePage;