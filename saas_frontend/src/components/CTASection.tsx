'use client';

import React from 'react';

export default function CTASection() {
  return (
    <section className="py-32 px-6 bg-[#0b1329] relative overflow-hidden">
      {/* Radial teal gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(20,184,166,0.10) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Pill badge */}
        <span className="inline-block bg-teal-500/10 text-teal-400 text-xs font-medium px-4 py-1.5 rounded-full border border-teal-500/20">
          Get Started
        </span>

        {/* Title */}
        <h2 className="text-4xl md:text-5xl font-bold text-white mt-6">
          Ready to Transform Your Clinical Operations?
        </h2>

        {/* Subtitle */}
        <p className="text-slate-400 mt-6 max-w-2xl mx-auto text-lg">
          Join the network of hospital systems deploying enterprise-grade
          diagnostic intelligence. Schedule a confidential executive briefing
          with our clinical solutions team.
        </p>

        {/* Dual CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          {/* Primary CTA */}
          <button
            type="button"
            className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/25 text-lg cursor-pointer"
          >
            Schedule Executive Briefing
          </button>

          {/* Ghost CTA */}
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-teal-500/50 hover:bg-white/5 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 text-lg cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Technical Brief
          </button>
        </div>

        {/* Trust markers */}
        <div className="mt-12 flex justify-center items-center gap-8 text-xs text-slate-600">
          <span>No commitment required</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" aria-hidden="true" />
          <span>SOC 2 certified</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" aria-hidden="true" />
          <span>HIPAA compliant</span>
        </div>
      </div>
    </section>
  );
}
