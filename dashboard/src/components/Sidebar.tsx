'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, BarChart3, History, FileText, Zap } from 'lucide-react'
import clsx from 'clsx'

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navItems = [
    { id: 'prediction-workspace', label: 'Prediction Workspace', icon: Zap },
    { id: 'advanced-dashboard', label: 'Advanced BI Dashboard', icon: BarChart3 },
    { id: 'model-history', label: 'Model Performance History', icon: History },
    { id: 'reports', label: 'Custom Reports', icon: FileText },
  ]

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-sidebar text-white"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={clsx(
          'fixed md:relative w-72 h-screen bg-gradient-to-b from-sidebar to-slate-950 text-white p-6 flex flex-col justify-between z-40 transition-transform duration-300',
          !isMobileOpen && 'hidden md:flex'
        )}
      >
        <div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <BarChart3 size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">MEDICAL DIAGNOSIS BOARD</h1>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Navigate between advanced model analysis and diagnostic outlier detection.
            </p>
          </motion.div>

          <nav className="space-y-2 mb-8">
            {navItems.map((item, idx) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  onClick={() => {
                    setActiveView(item.id)
                    setIsMobileOpen(false)
                  }}
                  className={clsx(
                    'w-full px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-slate-700 text-blue-300 shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </motion.button>
              )
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-xs font-medium text-blue-300 mb-1">Data Sources</p>
            <p className="text-xs text-slate-400">MIMIC-III, Clinical Dataset</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-xs font-medium text-blue-300 mb-1">Operational Note</p>
            <p className="text-xs text-slate-400">Model training scheduled for 02:00 UTC</p>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar
