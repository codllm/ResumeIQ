import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Sparkles,
  Play,
  Loader2,
  Clock,
  Mic,
  Video,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const StartInterviewComponent = ({ activeReport }) => {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  window.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  const targetRoleName =
    activeReport?.careerProfile?.targetRole ||
    activeReport?.careerProfile?.name ||
    "Software Engineer";

  const handleStartInterview = () => {
    setIsStarting(true);
    setTimeout(() => {
      navigate("/ai/interview/start-point");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-emerald-50/40 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-800">
      <div className="w-full max-w-lg relative">
        {/* Decorative background glow elements */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-200/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />

        {/* Main Card */}
        <div className="relative bg-white border border-emerald-100 rounded-3xl shadow-xl shadow-emerald-900/5 p-3 sm:p-8 space-y-6">
          
          {/* Header & Icon */}
          <div className="flex flex-col items-center text-center space-y-3">
           

            <div className="space-y-1">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                AI Technical Interview
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
                Ready to Start?
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xs leading-relaxed">
              You are about to begin your mock evaluation for{" "}
              <span className="font-bold text-emerald-600">{targetRoleName}</span>.
            </p>
          </div>

          {/* Technical Specs Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">(10-13)min</span>
              <span className="text-[10px] text-slate-500 font-medium">Duration</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
              <Mic className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">Microphone</span>
              <span className="text-[10px] text-slate-500 font-medium">Required</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
              <Video className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">Camera</span>
              <span className="text-[10px] text-slate-500 font-medium">Required</span>
            </div>
          </div>

          {/* Quick Preparation List */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Checklist
            </span>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Find a quiet room with stable internet connection.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Speak clearly into your microphone when answering.</span>
              </li>
            </ul>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleStartInterview}
            disabled={isStarting}
            className="group relative w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Setting Up Your Interview...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Interview</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>


        </div>
      </div>
    </div>
  );
};

export default StartInterviewComponent;