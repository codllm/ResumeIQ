import React from "react";
import { Gauge, Layers3, SearchCheck, TrendingUp } from "lucide-react";

const StatCards = ({ latestAtsScore = 78, latestSkillMatch = 70, latestKeywordMatch = 83 }) => {
  const metrics = [
    {
      label: "Skill Alignment",
      value: latestSkillMatch,
      icon: Layers3,
      color: "#0d9488",
      bg: "bg-teal-50",
      text: "text-teal-700",
      status: latestSkillMatch >= 80 ? "Strong" : latestSkillMatch >= 65 ? "Needs Focus" : "Priority",
    },
    {
      label: "Keyword Match",
      value: latestKeywordMatch,
      icon: SearchCheck,
      color: "#4f46e5",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      status: latestKeywordMatch >= 80 ? "Optimal" : latestKeywordMatch >= 65 ? "Good" : "Low",
    },
  ];

  const atsStatus = latestAtsScore >= 85 ? "Excellent" : latestAtsScore >= 70 ? "Good" : "Improve";
  const averageScore = Math.round((latestAtsScore + latestSkillMatch + latestKeywordMatch) / 3);

  return (
    <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-stretch gap-5">
        <div className="md:w-[38%] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Latest Score Snapshot
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              <TrendingUp size={12} />
              {averageScore}% Avg
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="relative size-28 rounded-full grid place-items-center shrink-0"
              style={{
                background: `conic-gradient(#059669 ${latestAtsScore * 3.6}deg, #edf2f7 0deg)`,
              }}
            >
              <div className="absolute inset-2 rounded-full bg-white" />
              <div className="relative text-center">
                <p className="text-3xl font-black text-slate-900 leading-none">{latestAtsScore}%</p>
                <p className="text-[10px] font-extrabold text-slate-400 mt-1">ATS</p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Gauge size={13} />
                {atsStatus}
              </div>
              <h3 className="text-base font-black text-slate-900 mt-2">Resume Fit</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Snapshot from your latest generated report.
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:block w-px bg-slate-100" />

        <div className="flex-1 grid grid-cols-1 gap-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div key={metric.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <div className={`size-10 rounded-2xl ${metric.bg} ${metric.text} grid place-items-center`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-extrabold text-slate-700">{metric.label}</p>
                    <p className={`text-[11px] font-extrabold ${metric.text}`}>{metric.status}</p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                    />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 tabular-nums">{metric.value}%</p>
              </div>
            );
          })}

          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ATS</p>
              <p className="text-sm font-black text-emerald-600">{latestAtsScore}%</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Skills</p>
              <p className="text-sm font-black text-teal-600">{latestSkillMatch}%</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Keywords</p>
              <p className="text-sm font-black text-indigo-600">{latestKeywordMatch}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCards;
