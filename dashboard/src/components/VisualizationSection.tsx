'use client'

import React from 'react'
import { motion } from 'framer-motion'
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
} from 'recharts'

const VisualizationSection: React.FC = () => {
  // Scatter plot data
  const scatterData = Array.from({ length: 100 }, (_, i) => ({
    id: Math.floor(Math.random() * 10000),
    probability: Math.random(),
    isOutlier: Math.random() > 0.85,
  }))

  // Bar chart data
  const barData = [
    { name: 'Symptom A', value: 0.95 },
    { name: 'Symptom B', value: 0.82 },
    { name: 'Symptom C', value: 0.75 },
    { name: 'Symptom D', value: 0.65 },
    { name: 'Symptom E', value: 0.58 },
  ]

  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Scatter Plot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-white p-6 rounded-xl border border-slate-100 shadow-soft hover:shadow-medium transition-all duration-300"
      >
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          OUTLIER PROBABILITY DISTRIBUTION
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="id"
              name="Patient Record ID"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              dataKey="probability"
              name="Model Probability"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            />
            <Scatter
              name="Normal"
              data={scatterData.filter((d) => !d.isOutlier)}
              fill="#1e293b"
              fillOpacity={0.6}
            />
            <Scatter
              name="Outlier"
              data={scatterData.filter((d) => d.isOutlier)}
              fill="#ef4444"
              fillOpacity={0.8}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Right: Horizontal Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="bg-white p-6 rounded-xl border border-slate-100 shadow-soft hover:shadow-medium transition-all duration-300"
      >
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          TOP 5 SYMPTOM FEATURE IMPORTANCE (Gini Index)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            layout="vertical"
            data={barData}
            margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis dataKey="name" type="category" stroke="#64748b" style={{ fontSize: '12px' }} width={140} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]}>
              {barData.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={colors[idx]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}

export default VisualizationSection
