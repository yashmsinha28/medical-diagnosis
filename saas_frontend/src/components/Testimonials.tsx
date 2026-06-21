'use client';

import React from 'react';

interface Testimonial {
  metric: string;
  metricLabel: string;
  quote: string;
  name: string;
  title: string;
  org: string;
  initials: string;
}

const testimonials: Testimonial[] = [
  {
    metric: '22%',
    metricLabel: 'Reduction in Diagnostic Bottlenecks',
    quote:
      'MedBI Enterprise transformed our clinical workflow. We reduced critical diagnostic bottlenecks by 22% within 60 days of deployment, directly improving patient throughput in our emergency department.',
    name: 'Dr. Sarah Chen',
    title: 'Chief Medical Officer',
    org: 'University Health Network',
    initials: 'SC',
  },
  {
    metric: '3.2x',
    metricLabel: 'Faster High-Risk Patient Identification',
    quote:
      'The ML-driven triage intelligence identified high-risk outliers 3.2 times faster than our previous protocol. The FHIR integration was seamless with our Epic EHR deployment.',
    name: 'James Morrison',
    title: 'VP of Clinical Operations',
    org: 'Meridian Health Partners',
    initials: 'JM',
  },
  {
    metric: '45%',
    metricLabel: 'Decrease in Physician Decision Fatigue',
    quote:
      'Our physicians report a 45% decrease in decision fatigue during high-volume shifts. The diagnostic confidence scoring gives them actionable intelligence without information overload.',
    name: 'Dr. Priya Kapoor',
    title: 'Director of Emergency Medicine',
    org: 'Atlantic Regional Medical Center',
    initials: 'PK',
  },
];

export default function Testimonials() {
  return (
    <section className="py-32 px-6 bg-white">
      {/* Section header */}
      <div className="text-center mb-16">
        <span className="inline-block bg-teal-500/10 text-teal-600 text-xs font-medium px-4 py-1.5 rounded-full border border-teal-500/20">
          Institutional Proof
        </span>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4">
          Trusted by Leading Health Systems
        </h2>
        <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
          Measurable clinical and operational outcomes from our enterprise
          partners.
        </p>
      </div>

      {/* Testimonial cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t) => (
          <div
            key={t.initials}
            className="bg-white border border-slate-200/60 rounded-2xl p-8 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-300/40 transition-all duration-500 hover:-translate-y-1"
          >
            {/* Opening quote mark */}
            <span className="block text-teal-500/20 text-6xl font-serif leading-none select-none">
              &ldquo;
            </span>

            {/* Key metric */}
            <p className="text-3xl font-bold text-teal-600 mt-2">{t.metric}</p>

            {/* Metric label */}
            <p className="text-sm font-medium text-slate-700 mt-1">
              {t.metricLabel}
            </p>

            {/* Quote */}
            <p className="text-slate-600 mt-4 text-sm leading-relaxed italic">
              &ldquo;{t.quote}&rdquo;
            </p>

            {/* Divider */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {t.initials}
                </div>

                {/* Author info */}
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t.title}, {t.org}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
