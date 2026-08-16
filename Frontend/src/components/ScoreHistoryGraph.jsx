import React from "react";
import { BarChart3, Loader2, Activity } from "lucide-react";

const ScoreHistoryGraph = ({
  loading,
  formattedReports = [],
  activeReport,
  onSelectReport,
  onGenerateNewReport,
  onViewAllReports,
}) => {
  return (
    <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-emerald-600" />
          <h3 className="font-extrabold text-slate-900 text-sm">Score History & Growth Trend</h3>
        </div>
        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          {formattedReports.length} Reports Evaluated
        </span>
      </div>

      {/* Graph Bar Container */}
      <div className="h-44 flex items-end justify-between gap-6 pt-4 px-6 bg-slate-50/70 rounded-2xl border border-slate-100">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-emerald-600" />
          </div>
        ) : formattedReports.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-1">
            <p>No reports generated yet.</p>
            <button
              type="button"
              onClick={onGenerateNewReport}
              className="text-emerald-600 font-bold hover:underline cursor-pointer"
            >
              Generate your first report &rarr;
            </button>
          </div>
        ) : (
          formattedReports.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => onSelectReport(item)}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
            >
              <span className="text-[10px] font-black text-slate-600 group-hover:text-emerald-600 transition-colors">
                {item.atsScore}%
              </span>
              <div
                style={{ height: `${item.atsScore}%` }}
                className={`w-full rounded-xl transition-all duration-300 ${
                  activeReport?.id === item.id
                    ? "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm"
                    : "bg-slate-200 group-hover:bg-slate-300"
                }`}
              />
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700">
                {item.date}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between text-xs text-slate-600">
        <span className="flex items-center gap-2 font-medium">
          <Activity size={16} className="text-emerald-600" />
          Your ATS compatibility score improved by <strong>+23%</strong> over recent scans.
        </span>
        <button
          type="button"
          onClick={onViewAllReports}
          className="text-emerald-700 font-extrabold hover:underline cursor-pointer"
        >
          View Full Analysis &rarr;
        </button>
      </div>
    </div>
  );
};

export default ScoreHistoryGraph;
