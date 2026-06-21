'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

/* ------------------------------------------------------------------ */
/*  Static Data                                                        */
/* ------------------------------------------------------------------ */
const KPI_DATA = [
  { label: 'Model Accuracy', value: '99.2%' },
  { label: 'Precision Score', value: '98.7%' },
  { label: 'Recall Rate', value: '97.8%' },
  { label: 'F1 Score', value: '98.2%' },
] as const;

/* Scatter clusters — four disease groups */
const clusterA = [
  { x: 12, y: 78, z: 60 },
  { x: 18, y: 82, z: 45 },
  { x: 15, y: 71, z: 80 },
  { x: 22, y: 85, z: 35 },
  { x: 10, y: 74, z: 55 },
  { x: 19, y: 90, z: 70 },
  { x: 14, y: 68, z: 40 },
  { x: 25, y: 79, z: 50 },
  { x: 8, y: 83, z: 65 },
  { x: 21, y: 76, z: 30 },
];

const clusterB = [
  { x: 45, y: 35, z: 70 },
  { x: 52, y: 42, z: 55 },
  { x: 48, y: 28, z: 40 },
  { x: 55, y: 38, z: 85 },
  { x: 42, y: 31, z: 60 },
  { x: 50, y: 45, z: 45 },
  { x: 58, y: 33, z: 75 },
  { x: 47, y: 40, z: 50 },
  { x: 53, y: 25, z: 35 },
];

const clusterC = [
  { x: 72, y: 60, z: 50 },
  { x: 78, y: 55, z: 65 },
  { x: 80, y: 68, z: 40 },
  { x: 75, y: 52, z: 90 },
  { x: 85, y: 63, z: 55 },
  { x: 70, y: 58, z: 75 },
  { x: 82, y: 70, z: 30 },
  { x: 76, y: 48, z: 60 },
  { x: 88, y: 65, z: 45 },
  { x: 74, y: 72, z: 80 },
];

const clusterD = [
  { x: 35, y: 88, z: 55 },
  { x: 40, y: 92, z: 40 },
  { x: 38, y: 85, z: 70 },
  { x: 32, y: 95, z: 35 },
  { x: 42, y: 90, z: 60 },
  { x: 36, y: 80, z: 50 },
  { x: 44, y: 87, z: 45 },
  { x: 30, y: 93, z: 65 },
];

const featureData = [
  { name: 'Chest Pain', value: 0.089 },
  { name: 'Fatigue', value: 0.076 },
  { name: 'High Fever', value: 0.071 },
  { name: 'Headache', value: 0.065 },
  { name: 'Cough', value: 0.058 },
  { name: 'Nausea', value: 0.052 },
  { name: 'Joint Pain', value: 0.047 },
  { name: 'Dizziness', value: 0.041 },
];

/* Gradient colours for the horizontal bars */
const BAR_COLORS = [
  '#0d9488',
  '#0f9e91',
  '#11a899',
  '#14b8a6',
  '#22c4ad',
  '#2dd4bf',
  '#3ee0c8',
  '#5eead4',
];

/* ------------------------------------------------------------------ */
/*  Custom Tooltips                                                    */
/* ------------------------------------------------------------------ */
interface ScatterPayload {
  x: number;
  y: number;
  z: number;
}

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ScatterPayload }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0b1a3b] border border-white/10 rounded-lg p-3 shadow-2xl text-xs">
      <p className="text-white font-semibold mb-1">Data Point</p>
      <p className="text-slate-300">
        X: <span className="text-teal-400 font-medium">{d.x}</span>
      </p>
      <p className="text-slate-300">
        Y: <span className="text-teal-400 font-medium">{d.y}</span>
      </p>
      <p className="text-slate-300">
        Size: <span className="text-teal-400 font-medium">{d.z}</span>
      </p>
    </div>
  );
}

interface BarPayloadEntry {
  name: string;
  value: number;
  color: string;
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: BarPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#0b1a3b] border border-white/10 rounded-lg p-3 shadow-2xl text-xs min-w-[160px]">
      <p className="text-white font-semibold mb-1">{label}</p>
      <p className="text-slate-300">
        Gini Index:{' '}
        <span className="text-teal-400 font-medium">
          {payload[0].value.toFixed(3)}
        </span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function DashboardSandbox() {
  return (
    <section className="py-32 px-6 bg-white relative">
      {/* ---- header ---- */}
      <div className="text-center mb-16">
        <span className="inline-block bg-teal-500/10 text-teal-600 text-xs font-medium px-4 py-1.5 rounded-full border border-teal-500/20">
          Live Platform Preview
        </span>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4">
          The Core Analytics Suite
        </h2>
        <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-base leading-relaxed">
          A real-time window into diagnostic intelligence, model reliability,
          and clinical feature analysis.
        </p>
      </div>

      {/* ---- dashboard frame ---- */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#0b1329] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-[#0b1329]/50">
          {/* browser chrome */}
          <div className="h-10 bg-[#0b1a3b] flex items-center px-4 gap-2 border-b border-white/[0.06]">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-amber-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
            <div className="ml-4 flex-1 bg-white/5 rounded-md px-3 py-1 text-xs text-slate-500 select-none">
              analytics.medbi.health/dashboard
            </div>
          </div>

          {/* dashboard content */}
          <div className="p-6">
            {/* ---- KPI row ---- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {KPI_DATA.map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]"
                >
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {kpi.value}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-teal-400">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full inline-block" />
                    Optimal
                  </div>
                </div>
              ))}
            </div>

            {/* ---- charts row ---- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LEFT — scatter chart */}
              <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
                <p className="text-sm font-semibold text-white mb-4">
                  Diagnostic Distribution Analysis
                </p>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 10, right: 10, bottom: 5, left: -10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="X"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                        domain={[0, 100]}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Y"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        content={<ScatterTooltip />}
                        cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.15)' }}
                      />
                      <Scatter
                        name="Cardiovascular"
                        data={clusterA}
                        fill="#14b8a6"
                        opacity={0.85}
                      />
                      <Scatter
                        name="Respiratory"
                        data={clusterB}
                        fill="#3b82f6"
                        opacity={0.85}
                      />
                      <Scatter
                        name="Neurological"
                        data={clusterC}
                        fill="#8b5cf6"
                        opacity={0.85}
                      />
                      <Scatter
                        name="Autoimmune"
                        data={clusterD}
                        fill="#f59e0b"
                        opacity={0.85}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RIGHT — horizontal bar chart */}
              <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
                <p className="text-sm font-semibold text-white mb-1">
                  Symptom Feature Importance
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Gini Index Weights
                </p>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={featureData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      barCategoryGap="18%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        domain={[0, 0.1]}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                        tickFormatter={(v: number) => v.toFixed(2)}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                        width={90}
                      />
                      <Tooltip
                        content={<BarTooltip />}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={22}
                      >
                        {featureData.map((_, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={BAR_COLORS[idx % BAR_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
