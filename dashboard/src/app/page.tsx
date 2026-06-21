'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import KPISection from '@/components/KPISection'
import VisualizationSection from '@/components/VisualizationSection'
import SkeletonLoader from '@/components/SkeletonLoader'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeView, setActiveView] = useState('advanced-dashboard')

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const renderContent = () => {
    switch (activeView) {
      case 'prediction-workspace':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="p-8"
          >
            <h1 className="text-4xl font-bold mb-2 text-slate-900">Prediction Workspace</h1>
            <p className="text-slate-600 mb-8">Enter patient symptoms and get real-time disease predictions</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold mb-2">Patient Input Form</h3>
                <p className="text-slate-600 mb-4">Select symptoms and generate predictions</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Open Predictor
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold mb-2">Historical Predictions</h3>
                <p className="text-slate-600 mb-4">View past predictions and patient records</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  View History
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
                <p className="text-slate-600 mb-4">Upload CSV for bulk predictions</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Upload File
                </button>
              </div>
            </div>
          </motion.div>
        )

      case 'model-history':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="p-8"
          >
            <h1 className="text-4xl font-bold mb-2 text-slate-900">Model Performance History</h1>
            <p className="text-slate-600 mb-8">Track model training iterations and performance metrics over time</p>
            <div className="space-y-4">
              {[
                { date: '2026-06-01', accuracy: '94.8%', f1: '0.93', status: 'Current' },
                { date: '2026-05-28', accuracy: '93.2%', f1: '0.91', status: 'Previous' },
                { date: '2026-05-15', accuracy: '91.5%', f1: '0.88', status: 'Archive' },
                { date: '2026-05-01', accuracy: '89.7%', f1: '0.85', status: 'Archive' },
              ].map((entry, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.date}</p>
                    <p className="text-sm text-slate-600">Accuracy: {entry.accuracy} • F1-Score: {entry.f1}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    entry.status === 'Current' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )

      case 'reports':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="p-8"
          >
            <h1 className="text-4xl font-bold mb-2 text-slate-900">Custom Reports</h1>
            <p className="text-slate-600 mb-8">Generate and download detailed analysis reports</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold mb-2">📊 Model Performance Report</h3>
                <p className="text-slate-600 mb-4">Comprehensive metrics and statistical analysis</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold mb-2">🔍 Outlier Analysis Report</h3>
                <p className="text-slate-600 mb-4">Detailed analysis of anomalies and edge cases</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold mb-2">🎯 Feature Importance Report</h3>
                <p className="text-slate-600 mb-4">Analysis of top contributing features</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold mb-2">📈 Trend Analysis Report</h3>
                <p className="text-slate-600 mb-4">Historical trends and performance evolution</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>
          </motion.div>
        )

      case 'advanced-dashboard':
      default:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="p-8"
          >
            <Header />
            <KPISection />
            <VisualizationSection />
          </motion.div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          renderContent()
        )}
      </main>
    </div>
  )
}
