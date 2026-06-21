'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

const Header: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Advanced Diagnosis & Model Performance Board
          </h1>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              Live Dashboard
            </span>
            <span className="text-sm text-slate-600 flex items-center gap-1">
              <TrendingUp size={16} className="text-green-600" />
              Dynamic performance & feature analysis
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Header
