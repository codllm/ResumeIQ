import React, { useState, useContext } from "react";
import { useNavigate } from "react-router";
import {
  Mail,
  Lock,
  FileText,
  BrainCircuit,
  BadgeCheck,
  ScanLine,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { loginUserApi } from "../../api/user.api";
import { AuthContext } from "../../context/user.context";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOnLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    try {
      const data = await loginUserApi({ email, password });

      localStorage.setItem("token", data.token);

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      }

      navigate("/");
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: FileText,
      title: "Resume parsing",
      desc: "Every field extracted automatically, no manual entry.",
    },
    {
      icon: BrainCircuit,
      title: "AI matching",
      desc: "Resumes ranked against the role in seconds.",
    },
    {
      icon: BadgeCheck,
      title: "Interview ready",
      desc: "Technical and behavioral questions, generated for you.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-stone-50">
      <style>{`
        @keyframes scanSweep {
          0% { top: -8%; opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { top: 104%; opacity: 0; }
        }
        @keyframes chipIn {
          0%, 20% { opacity: 0; transform: translateY(6px) scale(0.96); }
          35%, 100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .scan-sweep { animation: scanSweep 3.4s ease-in-out infinite; }
        .chip-in { animation: chipIn 3.4s ease-in-out infinite; }
      `}</style>

      {/* Left / Hero panel */}
      <div className="relative w-full lg:w-[46%] lg:min-h-screen bg-indigo-700 text-white overflow-hidden">
        {/* faint dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14 lg:min-h-screen">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-400 flex items-center justify-center">
              <ScanLine size={18} className="text-slate-950" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Resume<span className="text-emerald-400">IQ</span>
            </span>
          </div>

          {/* Headline + signature scan visual */}
          <div className="mt-8 lg:mt-0">
            <h1 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-semibold tracking-tight leading-[1.15] max-w-md">
            Turn your resume into a roadmap for your dream job.
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-sm">
            Get personalized career insights, skill-gap analysis, interview questions, and a step-by-step learning plan tailored to your target job
            </p>

            {/* Signature: scanning resume card */}
            <div className="mt-7 sm:mt-8 relative w-full max-w-[280px] sm:max-w-xs">
              <div className="relative rounded-xl bg-white/[0.06] border border-white/10 p-4 sm:p-5 overflow-hidden">
                {/* scan line */}
                <div className="scan-sweep absolute left-0 right-0 h-10 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent, rgba(52,211,153,0.35), transparent)",
                  }}
                />
                {/* fake resume header */}
                <div className="flex items-center gap-2.5 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-white/15 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 rounded-full bg-white/25 w-2/3" />
                    <div className="h-1.5 rounded-full bg-white/10 w-1/3" />
                  </div>
                </div>
                {/* fake resume lines */}
                <div className="mt-4 space-y-2 relative z-10">
                  <div className="h-1.5 rounded-full bg-white/15 w-full" />
                  <div className="h-1.5 rounded-full bg-white/15 w-11/12" />
                  <div className="h-1.5 rounded-full bg-white/15 w-4/5" />
                  <div className="h-1.5 rounded-full bg-white/15 w-full" />
                  <div className="h-1.5 rounded-full bg-white/15 w-3/5" />
                </div>
              </div>

              {/* match score chip */}
              <div className="chip-in absolute -right-3 -bottom-3 sm:-right-4 sm:-bottom-4 bg-emerald-400 text-slate-950 rounded-lg px-3 py-1.5 shadow-lg shadow-emerald-950/40 flex items-center gap-1.5">
                <BadgeCheck size={14} strokeWidth={2.5} />
                <span className="text-xs font-bold tracking-tight">96% match</span>
              </div>
            </div>
          </div>

          {/* Feature list — hidden on smallest screens, compact row on sm/md, full on lg */}
          <div className="hidden sm:block mt-10 lg:mt-0">
            <div className="grid grid-cols-3 gap-3 lg:hidden">
              {features.map(({ icon: Icon, title }) => (
                <div
                  key={title}
                  className="flex flex-col items-center text-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2 py-3"
                >
                  <Icon size={18} className="text-emerald-400" />
                  <span className="text-[11px] leading-tight text-slate-300">
                    {title}
                  </span>
                </div>
              ))}
            </div>

            <div className="hidden lg:flex flex-col gap-5">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3.5">
                  <div className="mt-0.5 p-2 rounded-lg bg-white/10 shrink-0">
                    <Icon size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-white">{title}</h3>
                    <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block text-slate-500 text-xs mt-10">
            © 2026 ResumeIQ
          </div>
        </div>
      </div>

      {/* Right / Form panel */}
      <div className="flex-1 flex justify-center items-center px-4 py-10 sm:px-8 sm:py-12 lg:p-16">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="mb-7 sm:mb-8">
            <h2 className="text-2xl sm:text-[1.75rem] font-semibold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-slate-500 mt-1.5 text-sm sm:text-base">
              Sign in to continue to ResumeIQ
            </p>
          </div>

          <form onSubmit={handleOnLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <div className="mt-1.5 flex items-center border border-slate-300 rounded-lg px-3.5 h-12 bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition">
                <Mail size={18} className="text-slate-400 shrink-0" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="ml-3 flex-1 outline-none bg-transparent text-slate-900 placeholder:text-slate-400 min-w-0"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="mt-1.5 flex items-center border border-slate-300 rounded-lg px-3.5 h-12 bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition">
                <Lock size={18} className="text-slate-400 shrink-0" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ml-3 flex-1 outline-none bg-transparent text-slate-900 placeholder:text-slate-400 min-w-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 hover:text-slate-600 shrink-0 ml-2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
              >
                Forgot password?
              </button>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            <button
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="relative py-2.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-stone-50 sm:bg-white px-3 text-xs text-slate-400 tracking-wide">
                  OR
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 pt-2">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/create")}
                className="text-emerald-700 font-semibold hover:text-emerald-800"
              >
                Create account
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;