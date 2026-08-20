import React, { useState } from "react";
import { LogIn, ShieldAlert, CheckCircle2 } from "lucide-react";

import { useNavigate } from "react-router";

const OnlineAssessment = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-emerald-50/50 selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        {/* Background Glows */}
        <div className="absolute top-1/3 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-900/5 transition-all duration-300 sm:p-10">
          {/* Header Icon */}
         

          {/* Title & Description */}
          <div className="mt-6 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-800">
              Ready for Assessment
            </span>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Enter Assessment Mode
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
              Click below to unlock and enter the assessment portal. Make sure
              your setup is ready before proceeding.
            </p>
          </div>

          {/* Instructions List */}
          <div className="mt-6 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-sm text-gray-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>Stable internet connection required</span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>Do not refresh or leave the tab during testing</span>
            </div>
          </div>

          {/* Enter Mode Trigger Button */}
          <div className="mt-8">
            <button
              onClick={() => navigate("/start/online-assessment")}
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:bg-emerald-700 hover:shadow-emerald-600/30 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 active:scale-[0.98]"
            >
              <span>Enter Assessment</span>
              <LogIn className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineAssessment;
