import React from "react";
import { PlusCircle, Target, ChevronDown, CheckCircle2 } from "lucide-react";

const WelcomeBanner = ({
  user,
  profiles = [],
  activeProfile,
  onSelectProfile,
  generating,
  onGenerateNewReport,
  navigate,
}) => {
  return (
    <div className="lg:col-span-12 relative overflow-hidden bg-gradient-to-r from-[#072d27] via-[#093c33] to-[#041d19] rounded-3xl p-4 text-white shadow-xl flex flex-col md:flex-row items-center justify-between min-h-[220px]">
      {/* Background Decorative Rings */}
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full border border-emerald-500/10 pointer-events-none" />
      <div className="absolute -right-8 -top-8 w-64 h-64 rounded-full border border-emerald-500/15 pointer-events-none" />

      {/* Left Content */}
      <div className="z-10 space-y-4 max-w-xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            TARGET PROFILE ACTIVE
          </div>

          {/* Profile Selection Dropdown */}
          {profiles.length > 0 && (
            <div className="relative inline-block">
              <select
                value={activeProfile?._id || ""}
                onChange={(e) => {
                  if (e.target.value === "new") {
                    if (navigate) navigate("/create-new-profile");
                  } else if (onSelectProfile) {
                    onSelectProfile(e.target.value);
                  }
                }}
                className="bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 text-[11px] font-bold py-1 pl-3 pr-7 rounded-full border border-emerald-400/40 outline-none cursor-pointer appearance-none transition shadow-sm"
              >
                {profiles.map((p) => (
                  <option key={p._id} value={p._id} className="bg-slate-900 text-white font-medium">
                    {p.name || p.targetRole || "Career Profile"} {p.targetRole ? `(${p.targetRole})` : ""}
                  </option>
                ))}
               
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Welcome back, {user?.username?.toUpperCase() || user?.name?.toUpperCase() || "USER"}! 👋
        </h1>

        

        <button
          onClick={onGenerateNewReport}
          disabled={generating}
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <PlusCircle size={15} className="text-emerald-600" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Right Target Graphic & Badge */}
      <div className="relative z-10 hidden lg:flex items-center gap-6 mt-6 md:mt-0">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping"></div>
          <div className="w-36 h-36 rounded-full border-8 border-emerald-500/30 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-8 border-emerald-400/60 flex items-center justify-center bg-emerald-900/40">
              <Target size={40} className="text-emerald-300" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-[180px]">
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            You're doing great! 🚀
          </p>
          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
            Keep improving and stay consistent.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;