
import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Loader2, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { reportScore } from "../api/user.api";
import { useUser } from "../context/user.context";

const emptyScoreCard = {
  resumeReportCard: [],
  mocktestReportCard: [],
  mockInterviewReportCard: [],
};

const toDayKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const toDayLabel = (dateValue) =>
  new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const getLatestNumber = (values) => {
  const latest = [...values]
    .filter((entry) => Number.isFinite(Number(entry.score)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .at(-1);

  return latest ? Number(latest.score) : null;
};

const scoreSeries = [
  { key: "reportScore", label: "Resume Report", color: "#34d399" },
  { key: "mockTestScore", label: "Mock Test", color: "#60a5fa" },
  { key: "mockInterviewScore", label: "Mock Interview", color: "#fbbf24" },
];

const ScoreHistoryGraph = ({
  loading,
  formattedReports = [],
  onViewAllReports,
}) => {
  const { token } = useUser();
  const [scoreCard, setScoreCard] = useState(emptyScoreCard);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadScoreHistory = async () => {
      setScoreLoading(true);
      setScoreError("");

      const res = await reportScore(token);

      if (cancelled) return;

      if (res.success) {
        setScoreCard({
          resumeReportCard: res.reportScoreData?.resumeReportCard || [],
          mocktestReportCard: res.reportScoreData?.mocktestReportCard || [],
          mockInterviewReportCard: res.reportScoreData?.mockInterviewReportCard || [],
        });
      } else {
        setScoreError(res.message || "Failed to fetch score history.");
      }

      setScoreLoading(false);
    };

    loadScoreHistory();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const fallbackHistory = useMemo(
    () =>
      formattedReports
        .map((report) => ({
          date: report.fullDate || report.date,
          score: Number(report.atsScore || (report.matchScore || 0) * 10 || 0),
        }))
        .reverse(),
    [formattedReports]
  );

  const chartData = useMemo(() => {
    const pointsByDate = new Map();

    const addPoint = (entry, dataKey) => {
      const key = toDayKey(entry.date);
      if (!key) return;

      const existing = pointsByDate.get(key) || {
        date: toDayLabel(entry.date),
        timestamp: new Date(entry.date).getTime(),
        reportScore: null,
        mockTestScore: null,
        mockInterviewScore: null,
      };

      existing[dataKey] = Number(entry.score ?? entry.reportScore ?? 0);
      pointsByDate.set(key, existing);
    };

    const resumeEntries =
      scoreCard.resumeReportCard.length > 0
        ? scoreCard.resumeReportCard
        : fallbackHistory;

    resumeEntries.forEach((entry) => addPoint(entry, "reportScore"));
    scoreCard.mocktestReportCard.forEach((entry) => addPoint(entry, "mockTestScore"));
    scoreCard.mockInterviewReportCard.forEach((entry) => addPoint(entry, "mockInterviewScore"));

    return Array.from(pointsByDate.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [fallbackHistory, scoreCard]);

  const latestScores = useMemo(() => {
    const reportScoreValue = getLatestNumber(
      scoreCard.resumeReportCard.length > 0 ? scoreCard.resumeReportCard : fallbackHistory
    );
    const mockTestScoreValue = getLatestNumber(scoreCard.mocktestReportCard);
    const mockInterviewScoreValue = getLatestNumber(scoreCard.mockInterviewReportCard);

    return {
      reportScore: reportScoreValue,
      mockTestScore: mockTestScoreValue,
      mockInterviewScore: mockInterviewScoreValue,
    };
  }, [fallbackHistory, scoreCard]);

  const readinessScore = useMemo(() => {
    const values = Object.values(latestScores).filter((score) => typeof score === "number");
    if (values.length === 0) return 0;

    return Number((values.reduce((sum, score) => sum + score, 0) / values.length).toFixed(1));
  }, [latestScores]);

  const allScores = useMemo(
    () =>
      [
        ...scoreCard.resumeReportCard,
        ...scoreCard.mocktestReportCard,
        ...scoreCard.mockInterviewReportCard,
        ...(scoreCard.resumeReportCard.length > 0 ? [] : fallbackHistory),
      ]
        .map((entry) => Number(entry.score))
        .filter((score) => Number.isFinite(score)),
    [fallbackHistory, scoreCard]
  );

  const distributionData = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, index) => ({
      label: `${(index + 1) * 10}`,
      min: index * 10,
      max: (index + 1) * 10,
      count: 0,
      active: false,
    }));

    allScores.forEach((score) => {
      const index = Math.min(9, Math.max(0, Math.floor(score / 10)));
      buckets[index].count += 1;
    });

    if (allScores.length > 0) {
      const activeIndex = Math.min(9, Math.max(0, Math.floor(readinessScore / 10)));
      buckets[activeIndex].active = true;
    }

    return buckets.map((bucket) => ({
      ...bucket,
      count: Math.max(bucket.count, bucket.active ? 1 : 0),
    }));
  }, [allScores, readinessScore]);

  const readinessPercentile = useMemo(() => {
    if (allScores.length === 0) return 0;

    const scoresBelowOrEqual = allScores.filter((score) => score <= readinessScore).length;
    return Math.round((scoresBelowOrEqual / allScores.length) * 100);
  }, [allScores, readinessScore]);

  const rankLabel = allScores.length > 0
    ? `Top ${Math.max(1, 100 - readinessPercentile)}%`
    : "--";

  const totalScoreEntries = useMemo(
    () =>
      scoreCard.resumeReportCard.length +
      scoreCard.mocktestReportCard.length +
      scoreCard.mockInterviewReportCard.length,
    [scoreCard]
  );

  const trendText = useMemo(() => {
    const reportScores = chartData
      .map((entry) => entry.reportScore)
      .filter((score) => typeof score === "number");

    if (reportScores.length < 2) return "Generate more results to compare score trends.";

    const firstScore = reportScores[0];
    const latestScore = reportScores[reportScores.length - 1];
    const change = Math.round(latestScore - firstScore);
    const direction = change >= 0 ? "improved" : "changed";

    return `Resume report score ${direction} by ${change >= 0 ? "+" : ""}${change}% over recent scans.`;
  }, [chartData]);
		  
  return (
    <div className="lg:col-span-8 grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr] gap-5">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5 min-h-0">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-amber-500" />
              <h3 className="font-extrabold text-slate-900 text-sm">Score History & Growth Trend</h3>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Resume, mock test, and mock interview scores over time.
            </p>
          </div>
          <span className="text-xs text-slate-700 font-bold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 shrink-0">
            {totalScoreEntries || formattedReports.length} Scores
          </span>
        </div>

        <div className="h-64 w-full">
          {loading || scoreLoading ? (
            <div className="h-full flex items-center justify-center text-xs font-bold text-slate-500">
              <Loader2 size={18} className="animate-spin mr-2 text-amber-500" />
              Loading score history...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-bold text-slate-500">
              No score history yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 14, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    color: "#0f172a",
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                  }}
                  formatter={(value, name) => [
                    value,
                    {
                      reportScore: "Resume Report",
                      mockTestScore: "Mock Test",
                      mockInterviewScore: "Mock Interview",
                    }[name] || name,
                  ]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 800, color: "#475569" }} />
                {scoreSeries.map((series) => (
                  <Line
                    key={series.key}
                    type="natural"
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.color}
                    strokeWidth={3}
                    dot={{ r: 4, fill: series.color, strokeWidth: 2, stroke: "#ffffff" }}
                    activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-2 font-medium">
            <Activity size={16} className="text-amber-500" />
            {scoreError || trendText}
          </span>
          <button
            type="button"
            onClick={onViewAllReports}
            className="text-emerald-700 font-extrabold hover:underline cursor-pointer shrink-0"
          >
            View Full Analysis &rarr;
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4 min-h-0">
        <div className="border-b border-slate-100 pb-3">
          <p className="text-xs font-bold text-slate-500">Current Position</p>
          <p className="text-4xl font-black tracking-normal text-slate-900 mt-1">{rankLabel}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Compared with your saved score history</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-slate-500">Readiness Score</p>
            <p className="text-2xl font-black text-slate-900">{readinessScore.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Tracked Scores</p>
            <p className="text-2xl font-black text-slate-900">{totalScoreEntries || formattedReports.length}</p>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} margin={{ top: 14, right: 4, left: 0, bottom: 2 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  color: "#0f172a",
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                }}
                formatter={(value) => [value, "Scores"]}
                labelFormatter={(label) => `Score bucket up to ${label}`}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {distributionData.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={entry.active ? "#f59e0b" : "#e2e8f0"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          {scoreSeries.map((series) => (
            <div key={series.key}>
              <p className="font-bold text-slate-500 leading-tight">{series.label}</p>
              <p className="font-black" style={{ color: series.color }}>
                {typeof latestScores[series.key] === "number"
                  ? latestScores[series.key].toFixed(1)
                  : "--"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScoreHistoryGraph;
