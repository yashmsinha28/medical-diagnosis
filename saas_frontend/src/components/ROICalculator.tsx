'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                     */
/* ------------------------------------------------------------------ */
interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#0b1a3b] border border-white/10 rounded-xl p-4 shadow-2xl min-w-[180px]">
      <p className="text-white font-semibold text-sm mb-2 whitespace-pre-line">
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-2 text-slate-300 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="text-slate-200 text-xs font-medium">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function ROICalculator() {
  /* ---- state ---- */
  const [patientVolume, setPatientVolume] = useState(50000);
  const [triageTime, setTriageTime] = useState(45);
  const [bedCount, setBedCount] = useState(350);

  /* ---- callbacks ---- */
  const onPatientVolume = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setPatientVolume(Number(e.target.value)),
    [],
  );
  const onTriageTime = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setTriageTime(Number(e.target.value)),
    [],
  );
  const onBedCount = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setBedCount(Number(e.target.value)),
    [],
  );

  /* ---- derived KPIs ---- */
  const hoursSaved = useMemo(
    () => Math.round(patientVolume * (triageTime / 60) * 0.22),
    [patientVolume, triageTime],
  );

  const costReduction = useMemo(
    () => '$' + (Math.round(hoursSaved * 85) / 1000).toFixed(0) + 'K',
    [hoursSaved],
  );

  const earlyRiskDetection = useMemo(
    () => '+' + Math.round(bedCount * 0.18) + '%',
    [bedCount],
  );

  const diagnosticThroughput = useMemo(
    () => '+' + Math.round((patientVolume / 365) * 0.15) + '/day',
    [patientVolume],
  );

  /* ---- chart data ---- */
  const chartData = useMemo(
    () => [
      {
        metric: 'Triage Time',
        without: triageTime,
        with: Math.round(triageTime * 0.72),
      },
      {
        metric: 'Diagnostic\nAccuracy',
        without: 78,
        with: 96,
      },
      {
        metric: 'Risk Detection',
        without: 62,
        with: Math.round(62 + bedCount * 0.018),
      },
      {
        metric: 'Throughput\nIndex',
        without: 100,
        with: Math.round(100 + (patientVolume / 50000) * 35),
      },
    ],
    [triageTime, bedCount, patientVolume],
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <section
      id="roi-calculator"
      className="py-32 px-6 bg-[#0b1329] relative overflow-hidden"
    >
      {/* ---- mesh-gradient decorations ---- */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/[0.06] blur-[160px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.05] blur-[140px]"
      />

      {/* ---- header ---- */}
      <div className="text-center mb-16 relative z-10">
        <span className="inline-block bg-teal-500/10 text-teal-400 text-xs font-medium px-4 py-1.5 rounded-full border border-teal-500/20">
          ROI Calculator
        </span>
        <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">
          Quantify Your Operational Impact
        </h2>
        <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-base leading-relaxed">
          Model projected efficiency gains based on your institution&apos;s
          operational parameters.
        </p>
      </div>

      {/* ---- grid ---- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* ========== LEFT PANEL ========== */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-8">
          {/* heading */}
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Configuration Parameters
          </h3>

          {/* ---- sliders ---- */}
          {/* Patient Volume */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm text-slate-400">
                Annual Patient Volume
              </label>
              <span className="text-sm font-semibold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-md">
                {patientVolume.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={200000}
              step={5000}
              value={patientVolume}
              onChange={onPatientVolume}
              className="w-full accent-teal-500 h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:shadow-lg
                         [&::-webkit-slider-thumb]:shadow-teal-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-teal-300
                         [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
                         [&::-moz-range-thumb]:bg-teal-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-teal-300
                         [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-teal-500/30"
            />
          </div>

          {/* Triage Time */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm text-slate-400">
                Avg Triage Time (minutes)
              </label>
              <span className="text-sm font-semibold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-md">
                {triageTime}
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={120}
              step={5}
              value={triageTime}
              onChange={onTriageTime}
              className="w-full accent-teal-500 h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:shadow-lg
                         [&::-webkit-slider-thumb]:shadow-teal-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-teal-300
                         [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
                         [&::-moz-range-thumb]:bg-teal-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-teal-300
                         [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-teal-500/30"
            />
          </div>

          {/* Bed Count */}
          <div className="mb-0">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm text-slate-400">
                Hospital Bed Count
              </label>
              <span className="text-sm font-semibold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-md">
                {bedCount.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={bedCount}
              onChange={onBedCount}
              className="w-full accent-teal-500 h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:shadow-lg
                         [&::-webkit-slider-thumb]:shadow-teal-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-teal-300
                         [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
                         [&::-moz-range-thumb]:bg-teal-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-teal-300
                         [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-teal-500/30"
            />
          </div>

          {/* ---- divider ---- */}
          <div className="my-8 border-t border-white/[0.06]" />

          {/* ---- results ---- */}
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            Projected Annual Impact
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Hours Saved */}
            <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Hours Saved
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {hoursSaved.toLocaleString()}
                <span className="text-sm font-normal text-slate-400 ml-1">
                  hrs/year
                </span>
              </p>
            </div>

            {/* Cost Reduction */}
            <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Cost Reduction
              </p>
              <p className="text-2xl font-bold text-teal-400 mt-1">
                {costReduction}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Projected annual savings
              </p>
            </div>

            {/* Early Risk Detection */}
            <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Early Risk Detection
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {earlyRiskDetection}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Improvement in identification
              </p>
            </div>

            {/* Diagnostic Throughput */}
            <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Diagnostic Throughput
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {diagnosticThroughput}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Additional patients processed
              </p>
            </div>
          </div>
        </div>

        {/* ========== RIGHT PANEL ========== */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Workflow Optimization Analysis
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Comparing operational metrics with and without MedBI implementation
          </p>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                barCategoryGap="24%"
                barGap={4}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="metric"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Legend
                  wrapperStyle={{ color: '#94a3b8', fontSize: 12, paddingTop: 12 }}
                  iconType="square"
                  iconSize={10}
                />
                <Bar
                  dataKey="without"
                  name="Without MedBI"
                  fill="#334155"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={42}
                />
                <Bar
                  dataKey="with"
                  name="With MedBI"
                  fill="#14b8a6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
