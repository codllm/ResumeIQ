import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  ScanLine,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileCheck2,
  Loader2,
  CheckCircle2,
  Target,
  BrainCircuit,
  Zap,
  UploadCloud,
} from "lucide-react";
import { useUser} from "../context/user.context";
import { userLogin, userRegister } from "../api/user.api";


const Landing = () => {
  const { user, login, isAuthenticated } = useUser();
  const navigate = useNavigate();


  const [loginmode, setloginmode] = useState(true);
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [username, setusername] = useState("");

  const [error, seterror] = useState("");
  const [successMsg, setsuccessMsg] = useState("");
  const [submitting, setsubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    seterror("");
    setsuccessMsg("");

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanUsername = username.trim();

    if (!cleanEmail || !cleanPassword || (!loginmode && !cleanUsername)) {
      seterror("Please fill in all required fields.");
      return;
    }

    if (!loginmode && cleanPassword.length < 4) {
      seterror("Password must be at least 4 characters.");
      return;
    }

    setsubmitting(true);

    try {
      if (loginmode) {
        const res = await userLogin(cleanEmail, cleanPassword);
        if (res.success) {
          login(res.user, res.token);
          setsuccessMsg("Signed in successfully! Redirecting...");
          setTimeout(() => {
            navigate("/dashboard");
          }, 800);
        } else {
          seterror(
            res.message || "Failed to sign in. Please check your credentials."
          );
        }
      } else {
        const res = await userRegister(
          cleanUsername,
          cleanEmail,
          cleanPassword
        );
        if (res.success) {
          login(res.user, res.token);
          setsuccessMsg("Account created successfully! Redirecting...");
          setTimeout(() => {
            navigate("/complete-profile");
          }, 800);
        } else {
          seterror(
            res.message || "Failed to create account. Please try again."
          );
        }
      }
    } catch (err) {
      seterror("An unexpected error occurred. Please try again.");
    } finally {
      setsubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Theta Soft Cyan/Mint Background Mesh Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] bg-emerald-200/40 rounded-full blur-[140px]" />
        <div className="absolute top-[10%] right-[-10%] w-[800px] h-[800px] bg-teal-200/50 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-cyan-100/60 rounded-full blur-[140px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <ScanLine size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Resume<span className="text-emerald-500">IQ</span>
          </span>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-600 font-medium hidden sm:inline">
              Logged in as{" "}
              <strong className="text-slate-900">
                {user?.username || user?.email}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => localStorage.getItem("resumeiq_token")?navigate("/dashboard"):""}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition cursor-pointer shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
            >
              Go to Dashboard <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setloginmode(true);
                seterror("");
                setsuccessMsg("");
              }}
              className="text-xs font-semibold px-4 py-2 rounded-xl text-slate-700 hover:text-emerald-600 transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setloginmode(false);
                seterror("");
                setsuccessMsg("");
              }}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition cursor-pointer shadow-md shadow-emerald-500/20"
            >
              Get Started
            </button>
          </div>
        )}
      </header>

      {/* Main Split Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 lg:px-16 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Content */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold uppercase tracking-wider">
            
            <span>AI Resume Checker & Prep</span>
          </div>

          <h1 className="text-4xl sm:text-4xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            Turn your resume into a <br className="hidden sm:inline" />
            <span className="text-slate-900">roadmap for your</span> <br className="hidden sm:inline" /> <span className="text-emerald-500">Dream Job</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
            A free and fast AI resume checker doing key checks to ensure your
            resume’s content, layout, and design is technically compatible with
            ATS systems and gets you interview callbacks.
          </p>

          {/* Upload Placeholder Badge Box matching Enhancv layout */}
          <div className="p-6 rounded-2xl bg-emerald-50/50 border-2 border-dashed border-emerald-300 max-w-lg space-y-3 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Drop your resume here or create an account
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PDF & DOCX only. Max 5MB file size.
              </p>
            </div>
            <button
              onClick={() => setloginmode(false)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-md shadow-emerald-500/20 shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud size={16} />
              <span>Create Account</span>
            </button>
          </div>

          {/* Quick Value Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl cursor-pointer">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
              <Target className="text-emerald-500 shrink-0" size={18} />
              <span className="text-xs font-semibold text-slate-700">
                ATS Match Scoring
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
              <BrainCircuit className="text-teal-500 shrink-0" size={18} />
              <span className="text-xs font-semibold text-slate-700">
                Skill Gap Analysis
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
              <Zap className="text-emerald-600 shrink-0" size={18} />
              <span className="text-xs font-semibold text-slate-700">
                Interview Kits
              </span>
            </div>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-300/40 relative">
            <div className="text-left space-y-1 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {loginmode ? "Sign in to ResumeIQ" : "Create your account"}
              </h2>
              <p className="text-xs text-slate-500">
                {loginmode
                  ? "Enter your credentials to access your workspace."
                  : "Build reusable target profiles & practice interviews."}
              </p>
            </div>

            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field (Register Only) */}
              {!loginmode && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Username
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setusername(e.target.value)}
                      placeholder="johndoe"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setemail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setpassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 mt-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{loginmode ? "Sign In" : "Create Account"}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Toggle Login/Register */}
            <div className="mt-6 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
              {loginmode ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setloginmode(false);
                      seterror("");
                      setsuccessMsg("");
                    }}
                    className="text-emerald-600 font-bold hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setloginmode(true);
                      seterror("");
                      setsuccessMsg("");
                    }}
                    className="text-emerald-600 font-bold hover:underline cursor-pointer"
                  >
                    Log in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Enhancv Step-by-Step Info Section */}
      <section className="relative z-10 border-t border-slate-200/80 bg-white/60 backdrop-blur-md py-16 px-6 lg:px-16">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            
            <h3 className="text-3xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Optimize your resume in 4 simple steps
            </h3>
          </div>

          {/* Vertical Zig-Zag Staggered List */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.25 },
              },
            }}
            className="relative space-y-10 md:space-y-12 before:absolute before:inset-0 before:left-5 md:before:left-1/2 md:before:-translate-x-1/2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-300 before:via-teal-200 before:to-emerald-100"
          >
            {/* Step 1 - Left on Desktop */}
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -30, y: 10 },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  transition: { duration: 0.5 },
                },
              }}
              className="relative flex flex-col md:flex-row items-start md:items-center group"
            >
              {/* Node Badge */}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10 w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300 shrink-0">
                1
              </div>

              {/* Card (Left Side) */}
              <div className="pl-14 md:pl-0 md:w-1/2 md:pr-12 md:text-right w-full">
                <div className="bg-white/80 border border-slate-200/90 rounded-2xl p-5 shadow-sm group-hover:shadow-md group-hover:border-emerald-200 transition-all duration-300">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                    Target Profile Creation
                  </h4>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                    Upload your PDF resume once along with target job
                    descriptions to store reusable target profiles.
                  </p>
                </div>
              </div>

              {/* Empty Spacer for Desktop Alignment */}
              <div className="hidden md:block md:w-1/2" />
            </motion.div>

            {/* Step 2 - Right on Desktop */}
            <motion.div
              variants={{
                hidden: { opacity: 0, x: 30, y: 10 },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  transition: { duration: 0.5 },
                },
              }}
              className="relative flex flex-col md:flex-row items-start md:items-center group"
            >
              {/* Node Badge */}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10 w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300 shrink-0">
                2
              </div>

              {/* Empty Spacer for Desktop Alignment */}
              <div className="hidden md:block md:w-1/2" />

              {/* Card (Right Side) */}
              <div className="pl-14 md:pl-12 md:w-1/2 md:text-left w-full">
                <div className="bg-white/80 border border-slate-200/90 rounded-2xl p-5 shadow-sm group-hover:shadow-md group-hover:border-emerald-200 transition-all duration-300">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                    ATS Content Interpretation
                  </h4>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                    Analyzes your background against signals from top ATS
                    platforms like Greenhouse, Lever, and Workday.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 3 - Left on Desktop */}
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -30, y: 10 },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  transition: { duration: 0.5 },
                },
              }}
              className="relative flex flex-col md:flex-row items-start md:items-center group"
            >
              {/* Node Badge */}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10 w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300 shrink-0">
                3
              </div>

              {/* Card (Left Side) */}
              <div className="pl-14 md:pl-0 md:w-1/2 md:pr-12 md:text-right w-full">
                <div className="bg-white/80 border border-slate-200/90 rounded-2xl p-5 shadow-sm group-hover:shadow-md group-hover:border-emerald-200 transition-all duration-300">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                    Tailored Prep Generation
                  </h4>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                    Generate customized interview preparation plans tailored
                    specifically to your target roles.
                  </p>
                </div>
              </div>

              {/* Empty Spacer for Desktop Alignment */}
              <div className="hidden md:block md:w-1/2" />
            </motion.div>

            {/* Step 4 - Right on Desktop */}
            <motion.div
              variants={{
                hidden: { opacity: 0, x: 30, y: 10 },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  transition: { duration: 0.5 },
                },
              }}
              className="relative flex flex-col md:flex-row items-start md:items-center group"
            >
              {/* Node Badge */}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10 w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300 shrink-0">
                4
              </div>

              {/* Empty Spacer for Desktop Alignment */}
              <div className="hidden md:block md:w-1/2" />

              {/* Card (Right Side) */}
              <div className="pl-14 md:pl-12 md:w-1/2 md:text-left w-full">
                <div className="bg-white/80 border border-slate-200/90 rounded-2xl p-5 shadow-sm group-hover:shadow-md group-hover:border-emerald-200 transition-all duration-300">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                    Accelerate Interview Callbacks
                  </h4>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                    Practice behavioral and technical responses repeatedly using
                    stored profiles without needing to re-upload files.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ResumeIQ. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
