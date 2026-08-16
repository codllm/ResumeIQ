import React from "react";

const StatCards = ({ latestAtsScore = 78, latestSkillMatch = 70, latestKeywordMatch = 83 }) => {
  return (
    <div className="lg:col-span-7 grid grid-cols-3 gap-4">
      {/* Card 1: ATS Match Score */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
          ATS Match Score
        </span>
        <div className="my-2">
          <span className="text-3xl font-black text-emerald-600">{latestAtsScore}%</span>
          <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 ml-2">
            Good
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${latestAtsScore}%` }} />
        </div>
      </div>

      {/* Card 2: Skill Alignment */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
          Skill Alignment
        </span>
        <div className="my-2">
          <span className="text-3xl font-black text-teal-600">{latestSkillMatch}%</span>
          <span className="text-[10px] text-teal-600 font-extrabold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 ml-2">
            Needs Review
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-teal-500 h-full rounded-full" style={{ width: `${latestSkillMatch}%` }} />
        </div>
      </div>

      {/* Card 3: Keyword Match */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
          Keyword Match
        </span>
        <div className="my-2">
          <span className="text-3xl font-black text-indigo-600">{latestKeywordMatch}%</span>
          <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 ml-2">
            Optimal
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${latestKeywordMatch}%` }} />
        </div>
      </div>
    </div>
  );
};

export default StatCards;
