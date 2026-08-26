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
  Check,
  Loader2,
} from "lucide-react";
import { UserContext } from "../context/user.context";
import { createCareerProfile } from "../api/user.api";
import { MoveLeft } from 'lucide-react';
const CreateNewProfile = ({ onSubmit,setnewprofilestate }) => {
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
        setnewprofilestate(false)
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

     

      {/* Main Content Layout — Adjusted spacing & top-alignment */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-4 lg:py-6 flex flex-col justify-center">
        <div onClick={()=>setnewprofilestate(false)}><MoveLeft></MoveLeft></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start my-auto">
          {/* Left Side: Brand Narrative & Progress */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Build your custom targeted resume profile
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Store reusable target profiles to generate tailored interview prep, ATS keyword alignment, and customized responses.
              </p>
            </div>

            {/* Stepper Progress Badges */}
            <div className="space-y-2.5 pt-1">
              {stepsInfo.map((s, idx) => {
                const StepIcon = s.icon;
                const isDone = step > idx + 1;
                const isCurrent = step === idx + 1;

                return (
                  <div
                    key={s.title}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                      isCurrent
                        ? "bg-white shadow-sm border border-emerald-200"
                        : "bg-slate-100/60 opacity-70"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isDone ? <Check size={14} /> : idx + 1}
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
                      size={15}
                      className={isCurrent ? "text-emerald-600" : "text-slate-400"}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Step Input Container */}
          <div className="lg:col-span-7">
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-lg shadow-slate-200/50 relative overflow-hidden">
              {/* Top Step Counter Bar */}
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    STEP 0{step}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">/ 04</span>
                </div>
                <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                    style={{ width: `${(step / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Dynamic Step Content with Transitions */}
              <div className="min-h-[260px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {/* STEP 1: RESUME */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          Upload your background
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Choose between uploading your PDF resume or pasting plain text directly.
                        </p>
                      </div>

                      {/* Mode Toggle Switcher */}
                      <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1 text-xs font-bold text-slate-600 border border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => setResumeMode("file")}
                          className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                            resumeMode === "file"
                              ? "bg-white text-emerald-600 shadow-xs"
                              : "hover:text-slate-900"
                          }`}
                        >
                          Upload PDF Document
                        </button>
                        <button
                          type="button"
                          onClick={() => setResumeMode("text")}
                          className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                            resumeMode === "text"
                              ? "bg-white text-emerald-600 shadow-xs"
                              : "hover:text-slate-900"
                          }`}
                        >
                          Paste Plain Text
                        </button>
                      </div>

                      {resumeMode === "file" ? (
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl cursor-pointer transition-all duration-300 group">
                          <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-xs mb-2 group-hover:scale-105 transition-transform">
                            <Upload size={20} />
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            {formData.resumeFile
                              ? formData.resumeFile.name
                              : "Click or drag PDF resume here"}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
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
                          rows={5}
                          value={formData.resumeText}
                          onChange={(e) => updateField("resumeText", e.target.value)}
                          placeholder="Paste plain text content from your resume standard sections..."
                          className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition resize-none leading-relaxed"
                        />
                      )}
                    </motion.div>
                  )}

                  {/* STEP 2: JOB DESCRIPTION */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          Job Description
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Paste the full role description so our system can analyze missing skills and keywords.
                        </p>
                      </div>

                      <textarea
                        rows={6}
                        value={formData.jobDescription}
                        onChange={(e) => updateField("jobDescription", e.target.value)}
                        placeholder="Paste target job responsibilities, key requirements, and qualifications..."
                        className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition resize-none leading-relaxed"
                      />
                    </motion.div>
                  )}

                  {/* STEP 3: SELF DESCRIPTION */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          Self Summary & Background
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Add key notes about your core technical strengths, preferred tech stack, or career highlights.
                        </p>
                      </div>

                      <textarea
                        rows={6}
                        value={formData.selfDescription}
                        onChange={(e) => updateField("selfDescription", e.target.value)}
                        placeholder="e.g., Computer science engineer focused on React/Tailwind frontend systems, competitive programming experience..."
                        className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition resize-none leading-relaxed"
                      />
                    </motion.div>
                  )}

                  {/* STEP 4: PROFILE NAME & TARGET ROLE */}
                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                          Final Step
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          Profile Details
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Name your profile and specify your target role title for indexing.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Profile Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => updateField("name", e.target.value)}
                            placeholder="e.g., Google Frontend Profile"
                            className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Desired Role Title
                          </label>
                          <input
                            type="text"
                            value={formData.targetRole}
                            onChange={(e) => updateField("targetRole", e.target.value)}
                            placeholder="e.g., Senior Frontend Engineer"
                            className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Toast */}
                {successMsg && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Inline Validation Alert */}
                {error && (
                  <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                    {error}
                  </div>
                )}
              </div>

              {/* Bottom Form Actions Controls */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 1 || submitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2">
                  {step === 4 && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={submitting}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
                    >
                      Skip & Complete
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <span>{step === 4 ? "Save Target Profile" : "Continue"}</span>
                        {step === 4 ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <ArrowRight size={15} />
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Simple Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/60 bg-white/50 py-3 px-6 lg:px-16 text-center text-[11px] text-slate-400 shrink-0">
        ResumeIQ &copy; {new Date().getFullYear()} — Career AI Assistant
      </footer>
    </div>
  );
};

export default CreateNewProfile;