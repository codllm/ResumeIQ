import React from "react";
import { Clock } from "lucide-react";

const PastReportsList = ({ formattedReports = [], activeReport, onSelectReport }) => {
  return (
    <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <Clock size={16} className="text-slate-400" /> Past Created Reports
        </h3>
      </div>

      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {formattedReports.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No reports found.</p>
        ) : (
          formattedReports.map((report) => {
            const isSelected = activeReport?.id === report.id;
            return (
              <div
                key={report.id}
                onClick={() => onSelectReport(report)}
                className={`group p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-emerald-50/70 border-emerald-300 shadow-xs"
                    : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-200"
                }`}
              >
                <div className="space-y-0.5 overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors truncate max-w-[150px]">
                    {report.title}
                  </h4>
                  <p className="text-[10px] text-slate-400">{report.date}</p>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg shrink-0">
                  {report.atsScore}%
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PastReportsList;
