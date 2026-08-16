import React from "react";
import { PlusCircle, Loader2 } from "lucide-react";

const WelcomeBanner = ({ user, activeProfile, generating, onGenerateNewReport }) => {
  return (
    <div className="lg:col-span-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-md shadow-emerald-600/10 flex flex-col justify-between">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200 bg-emerald-800/40 px-2.5 py-1 rounded-md border border-emerald-500/30">
          Target Profile Active
        </span>
        <h2 className="text-xl font-black mt-2">
          Welcome back, {user?.username || "Nishant Nikhil"}! 👋
        </h2>
        <p className="text-xs text-emerald-100/90 leading-relaxed mt-1">
          Ready to evaluate your resume against your target role:{" "}
          <strong>
            {activeProfile?.targetRole || activeProfile?.name || "Software Developer 2 (SD2)"}
          </strong>.
        </p>
      </div>

      <div className="pt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={generating}
          onClick={onGenerateNewReport}
          className="px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-extrabold text-xs hover:bg-emerald-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <PlusCircle size={15} />
              <span>Generate New Report</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WelcomeBanner;
