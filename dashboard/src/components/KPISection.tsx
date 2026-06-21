'use client'

import React from 'react'
import { motion } from 'framer-motion'
import CountUpNumber from './CountUpNumber'

const KPISection: React.FC = () => {
  const kpis = [
    {
      title: 'CROSS-VALIDATION ACCURACY',
      value: 94.8,
      suffix: '%',
      decimals: 1,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'MODEL WEIGHTED F1-SCORE',
      value: 0.93,
      suffix: '',
      decimals: 2,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'OUTLIER CASE DETECTION',
      value: 17,
      suffix: ' Cases',
      decimals: 0,
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      title: 'PREDICTION LATENCY (AVG)',
      value: 2.1,
      suffix: ' ms',
      decimals: 1,
      gradient: 'from-green-500 to-green-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + idx * 0.1, duration: 0.5 }}
          whileHover={{ y: -4, boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)' }}
          className="bg-white p-6 rounded-xl border border-slate-100 shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer"
        >
          <p className="text-xs font-semibold text-slate-600 tracking-widest mb-3 uppercase">
            {kpi.title}
          </p>
          <div className={`text-4xl font-bold bg-gradient-to-r ${kpi.gradient} bg-clip-text text-transparent`}>
            <CountUpNumber end={kpi.value} duration={1.5} suffix={kpi.suffix} decimals={kpi.decimals} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default KPISection
