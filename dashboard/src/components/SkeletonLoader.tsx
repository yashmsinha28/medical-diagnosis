'use client'

import React from 'react'
import { motion } from 'framer-motion'

const SkeletonLoader: React.FC = () => {
  return (
    <div className="p-8 h-screen bg-slate-50">
      {/* Header Skeleton */}
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mb-12"
      >
        <div className="h-10 bg-slate-200 rounded-lg w-3/4 mb-2"></div>
        <div className="h-5 bg-slate-200 rounded-lg w-1/3"></div>
      </motion.div>

      {/* KPI Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            className="bg-white p-6 rounded-xl border border-slate-100 h-32"
          >
            <div className="h-4 bg-slate-200 rounded w-2/3 mb-3"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
          </motion.div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 + i * 0.1 }}
            className="bg-white p-6 rounded-xl border border-slate-100 h-80"
          >
            <div className="h-5 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="h-12 bg-slate-100 rounded"></div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default SkeletonLoader
