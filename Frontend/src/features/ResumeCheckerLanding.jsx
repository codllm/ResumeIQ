import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router";
import {
  Upload,
  Lock,
  Check,
  X,
  ScanLine,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import {
  registerUserApi,
  verifyEmailApi,
  resendVerificationEmailApi,
} from "../api/user.api";
import { AuthContext } from "../context/user.context";


const ResumeCheckerLanding = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);

  // Toggle state to embed Register form inline on the right side
  const [showRegister, setShowRegister] = useState(false);

  // Registration Form State
  const [regStep, setRegStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleOnRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await registerUserApi({ username, email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/build/profile");
    } catch (error) {
      setErrorMessage(error.message || "Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setErrorMessage("Please enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await verifyEmailApi({
        email: email.trim(),
        otp: otp.trim(),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.message || "Invalid or expired verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || isResending) return;
    setErrorMessage("");
    setInfoMessage("");
    setIsResending(true);

    try {
      const data = await resendVerificationEmailApi(email.trim());
      setInfoMessage(data.message || "A new verification code has been sent.");
      setCooldownSeconds(60);
    } catch (error) {
      setErrorMessage(error.message || "Could not resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-emerald-200">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 lg:px-12 py-4 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <ScanLine size={18} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Resume<span className="text-emerald-500">IQ</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button 
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition bg-white shadow-xs cursor-pointer"
            onClick={() => navigate('/login')}
          >
            Login 
          </button>
          <button 
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition shadow-md shadow-emerald-500/20 cursor-pointer"
            onClick={() => setShowRegister(true)}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section with Mesh Gradient */}
      <main className="flex-1 relative overflow-hidden bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-indigo-100/50 py-12 lg:py-40 px-6 lg:px-16 flex items-center">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Column: Copy & Dropzone */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
              <span>Resume Checker</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            Turn your resume into a roadmap for your <span className="text-emerald-600">dream job</span>.
            </h1>

            <p className="text-slate-600 text-base lg:text-lg leading-relaxed">
              Create your profile today and start analyzing resumes, generating tailored mock interviews, and measuring ATS readiness in under a minute.
            </p>

            {/* Drag and Drop Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center bg-white/70 backdrop-blur-sm transition ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50/50"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
                  <Upload size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {file ? file.name : "Drop your resume here or browse"}
                </p>
                <p className="text-xs text-slate-500">
                  Supports PDF, DOCX (Max 10MB)
                </p>
              </label>
            </div>
          </div>

          {/* Right Column: Toggle between Score Report & Inline Register Card */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-2xl p-6 space-y-6 relative z-10 transition-all duration-300">
              
              {!showRegister ? (
                /* DEFAULT STATE: Resume Score Report Mockup */
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-7">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                        ✓
                      </div>
                      <span className="text-s font-semibold text-slate-700">
                        Resume Score Report
                      </span>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                      8 Issues Found
                    </span>
                  </div>

                  {/* Score Gauge Widget */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5 bg-slate-50/80 rounded-xl p-4 border border-slate-100 text-center">
                      <span className="text-xs font-medium text-slate-500 block mb-1">
                        Resume Score
                      </span>

                      <div className="relative w-24 h-12 mx-auto overflow-hidden mt-2">
                        <div className="w-24 h-24 rounded-full border-[8px] border-slate-200 border-t-emerald-500 border-r-emerald-500 rotate-[45deg]" />
                      </div>

                      <div className="mt-1">
                        <span className="text-2xl font-bold text-slate-900">?</span>
                        <span className="text-xs text-slate-400">/100</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                        24 Passed Checks
                      </span>
                    </div>

                    {/* Checklist Breakdown */}
                    <div className="col-span-7 space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Check size={12} className="text-emerald-500" /> ATS Parse Rate
                        </span>
                        <span className="text-emerald-600 font-semibold">98%</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Check size={12} className="text-emerald-500" /> Quantifying Impact
                        </span>
                        <span className="text-emerald-600 font-semibold">Good</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <X size={12} className="text-rose-500" /> Repetition
                        </span>
                        <span className="text-rose-500 font-semibold">Fix 2 words</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="flex items-center gap-1.5 font-medium text-slate-400">
                          <Lock size={10} /> Spelling & Grammar
                        </span>
                        <span className="text-slate-400">Pro</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bars Mockup */}
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-s font-medium text-slate-600">
                        <span>CONTENT & BREVITY</span>
                        <span className="text-emerald-600">84%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-[84%]" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-s font-medium text-slate-600">
                        <span>STYLE & FORMAT</span>
                        <span className="text-amber-500">60%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full w-[60%]" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* REGISTER STATE: Inline Registration / Verification Form */
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div
                    className="cursor-pointer text-slate-500 hover:text-slate-900 inline-block"
                    onClick={() => {
                      if (regStep === 2) {
                        setRegStep(1);
                        setOtp("");
                        setErrorMessage("");
                        setInfoMessage("");
                      } else {
                        setShowRegister(false);
                      }
                    }}
                  >
                    <ArrowLeft size={18} />
                  </div>

                  {regStep === 1 ? (
                    <>
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          Create your account
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                          Sign up to run full AI checks and view detailed interview reports.
                        </p>
                      </div>

                      <form onSubmit={handleOnRegister} className="space-y-3.5">
                        {/* Full Name Field */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Full Name
                          </label>
                          <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
                            <User size={16} className="text-slate-400 shrink-0" />
                            <input
                              type="text"
                              required
                              placeholder="Nishant Nikhil"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="ml-2.5 flex-1 bg-transparent text-s text-slate-900 outline-none placeholder:text-slate-400 min-w-0"
                            />
                          </div>
                        </div>

                        {/* Email Field */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Email Address
                          </label>
                          <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
                            <Mail size={16} className="text-slate-400 shrink-0" />
                            <input
                              type="email"
                              required
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="ml-2.5 flex-1 bg-transparent text-s text-slate-900 outline-none placeholder:text-slate-400 min-w-0"
                            />
                          </div>
                        </div>

                        {/* Password Field */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Password
                          </label>
                          <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
                            <Lock size={16} className="text-slate-400 shrink-0" />
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              minLength={8}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="ml-2.5 flex-1 bg-transparent text-s text-slate-900 outline-none placeholder:text-slate-400 min-w-0"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                            >
                              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                          <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 text-center">
                            {errorMessage}
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-10 mt-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-s font-bold text-white rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-60"
                        >
                          {isLoading ? (
                            "Creating Account..."
                          ) : (
                            <>
                              Create Account
                              <ArrowRight size={15} />
                            </>
                          )}
                        </button>
                      </form>

                      <div className="pt-2 border-t border-slate-100 text-center">
                        <p className="text-s text-slate-600">
                          Already have an account?{" "}
                          <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                          >
                            Sign in
                          </button>
                        </p>
                      </div>
                    </>
                  ) : (
                    /* Step 2: Inline Verification Code Form */
                    <>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
                          <ShieldCheck size={13} />
                          <span>Verify Email</span>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          Enter Verification Code
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          We sent a 6-digit code to <strong className="text-slate-900 font-semibold">{email}</strong>.
                        </p>
                      </div>

                      <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            6-Digit Verification Code
                          </label>
                          <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
                            <KeyRound size={18} className="text-slate-400 shrink-0" />
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={6}
                              required
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                              placeholder="123456"
                              className="ml-2 flex-1 bg-transparent text-center font-mono text-lg font-bold tracking-[0.35em] text-slate-900 outline-none placeholder:text-slate-300 placeholder:tracking-normal min-w-0"
                            />
                          </div>
                        </div>

                        {errorMessage && (
                          <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 text-center">
                            {errorMessage}
                          </div>
                        )}
                        {infoMessage && (
                          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 text-center">
                            {infoMessage}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-10 mt-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-s font-bold text-white rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-60"
                        >
                          {isLoading ? "Verifying..." : <>Verify and continue <ArrowRight size={15} /></>}
                        </button>
                      </form>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <button
                          type="button"
                          onClick={() => {
                            setRegStep(1);
                            setOtp("");
                            setErrorMessage("");
                            setInfoMessage("");
                          }}
                          className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800 transition"
                        >
                          <ArrowLeft size={13} /> Edit details
                        </button>

                        <button
                          type="button"
                          disabled={isResending || cooldownSeconds > 0}
                          onClick={handleResendOtp}
                          className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 hover:underline disabled:opacity-50"
                        >
                          <RotateCcw size={12} />
                          {isResending
                            ? "Sending..."
                            : cooldownSeconds > 0
                            ? `Resend code (${cooldownSeconds}s)`
                            : "Resend code"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* How ResumeIQ Works Section */}
      <section className="bg-white py-16 lg:py-24 px-6 lg:px-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Sticky Left Column / Heading Header */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
            <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">
              Complete Preparation Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              How ResumeIQ turns your profile into interview offers
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              ResumeIQ is an AI-powered interview preparation suite that bridges the gap between your resume and target roles through tailored analytics, quizzes, and live practice.
            </p>
          </div>

          {/* Right Column: Numbered Breakdown */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 font-stretch-100%">
                Career Profile Customization
              </h3>
              <p className="text-slate-600 text-3xl sm:text-base leading-relaxed">
                Create a career profile using your resume, background, and target job. ResumeIQ remembers your goals so every recommendation is tailored to the role you're preparing for
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Interview-Readiness Reports
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                See exactly how your resume compares to the job description with ATS analysis, keyword matching, skill gaps, and actionable suggestions to improve your chances.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Section-Based Mock Tests
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Practice quizzes generated from your target role. Focus on the technical concepts, tools, and topics you're most likely to face in interviews.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center text-sm">
                4
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Interactive Mock Interview Sessions
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Practice realistic interview conversations with AI that adapts to your experience level and target role. Receive instant feedback after every answer so you know what to improve.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default ResumeCheckerLanding;