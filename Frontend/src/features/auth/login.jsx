import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ScanLine,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  BrainCircuit,
} from "lucide-react";
import {
  loginUserApi,
  resendVerificationEmailApi,
  verifyEmailApi,
} from "../../api/user.api";
import { AuthContext } from "../../context/user.context";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const submit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setNeedsVerification(false);
    setInfoMessage("");
    setIsLoading(true);

    try {
      const data = await loginUserApi({ email: email.trim(), password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.message || "Unable to sign in.");
      const requiresVerification = (error.message || "").toLowerCase().includes("verify your email");
      setNeedsVerification(requiresVerification);
      if (requiresVerification) {
        setInfoMessage("Enter the 6-digit code sent to your email.");
        setCooldownSeconds(60);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (!/^\d{6}$/.test(otp)) { setErrorMessage("Please enter a valid 6-digit code."); return; }
    setIsLoading(true);
    try {
      const data = await verifyEmailApi({ email: email.trim(), otp });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/dashboard");
    } catch (error) { setErrorMessage(error.message || "Invalid or expired verification code."); } finally { setIsLoading(false); }
  };

  const resendOtp = async () => {
    if (cooldownSeconds > 0 || isResending) return;
    setErrorMessage("");
    setInfoMessage("");
    setIsResending(true);
    try {
      const data = await resendVerificationEmailApi(email.trim());
      setInfoMessage(data.message || "A new verification code has been sent.");
      setCooldownSeconds(60);
    } catch (error) {
      setErrorMessage(error.message || "Could not resend the verification code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-emerald-200">
      
      {/* Global Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 lg:px-12 py-4 flex items-center justify-between shrink-0">
        {/* Brand Logo */}
        <div 
          onClick={() => navigate("/")} 
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <ScanLine size={18} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Resume<span className="text-emerald-500">IQ</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
         
          <button 
            onClick={() => navigate("/sign-in")} 
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition shadow-md shadow-emerald-500/20"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Full-Screen Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-indigo-100/50">
        
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

        {/* LEFT COLUMN: Feature Showcase Banner */}
        <div className="lg:col-span-7 p-8 lg:p-16 flex flex-col justify-between relative z-10 hidden md:flex">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
     
              <span>AI Interview & Resume Platform</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Welcome back to <span className="text-emerald-600">ResumeIQ</span>.
            </h1>

            <p className="text-slate-600 text-base lg:text-lg leading-relaxed">
            Welcome back to ResumeIQ.
            Sign in to manage your career profiles, review interview insights, and continue preparing for your next opportunity.
            </p>
          </div>

          {/* Floating Preview Cards */}
          <div className="grid grid-cols-3 gap-4 max-w-xl mt-8">
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                <FileCheck2 size={18} />
              </div>
              <h4 className="text-xs font-bold text-slate-900">27+ ATS Checks</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Instant resume analysis</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                <BrainCircuit size={18} />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Mock Practice</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Section-based testing</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center mb-2">
                <CheckCircle2 size={18} />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Target Match</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Job description alignment</p>
            </div>
          </div>

          
        </div>

        {/* RIGHT COLUMN: Glassmorphic Login Form */}
        <div className="lg:col-span-5 p-6 sm:p-12 lg:p-16 flex items-center justify-center relative z-10">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-2xl p-7 sm:p-9 space-y-6">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {needsVerification ? "Verify your email" : "Welcome back"}
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                {needsVerification ? "Enter the 6-digit code sent to your email." : "Enter your credentials to access your workspace."}
              </p>
            </div>

            {/* Login Form */}
            {!needsVerification ? <form className="space-y-4" onSubmit={submit}>
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <Mail size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="ml-3 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <Lock size={18} className="text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="ml-3 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50/90 px-3.5 py-2.5 text-xs font-medium text-rose-700"
                >
                  {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                disabled={isLoading}
                type="submit"
                className="w-full h-11 mt-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white rounded-xl shadow-md shadow-emerald-500/20 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form> : <form className="space-y-4" onSubmit={verifyOtp}>
              <div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Verification code</label><div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20"><ShieldCheck size={18} className="text-slate-400 shrink-0" /><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="123456" className="ml-3 min-w-0 flex-1 bg-transparent text-center text-base tracking-[0.35em] text-slate-900 outline-none placeholder:tracking-normal placeholder:text-slate-400" /></div></div>
              {errorMessage && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50/90 px-3.5 py-2.5 text-xs font-medium text-rose-700">{errorMessage}</div>}
              {infoMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-3.5 py-2.5 text-xs font-medium text-emerald-700">{infoMessage}</div>}
              <button disabled={isLoading} type="submit" className="w-full h-11 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white rounded-xl shadow-md shadow-emerald-500/20 transition disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? "Verifying..." : <>Verify and continue <ArrowRight size={17} /></>}</button>
              <div className="flex items-center justify-between text-xs"><button type="button" onClick={() => { setNeedsVerification(false); setOtp(""); setErrorMessage(""); setInfoMessage(""); }} className="font-semibold text-slate-500 hover:text-slate-700">Use another account</button><button type="button" disabled={isResending || cooldownSeconds > 0} onClick={resendOtp} className="font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50">{isResending ? "Sending..." : cooldownSeconds > 0 ? `Resend code (${cooldownSeconds}s)` : "Resend code"}</button></div>
            </form>}

            {/* Footer Registration Link */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                New to ResumeIQ?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/sign-in")}
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default Login;