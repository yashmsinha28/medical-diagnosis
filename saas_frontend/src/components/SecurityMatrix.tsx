'use client';

import React from 'react';

const securityPillars = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.13 9 11.25C17.25 22.13 21 17.25 21 12V7l-9-5z" />
        <rect x="9" y="10" width="6" height="5" rx="1" />
        <path d="M10 10V8a2 2 0 1 1 4 0v2" />
      </svg>
    ),
    title: 'End-to-End AES-256 Encryption',
    description:
      'All data encrypted at rest and in transit with military-grade AES-256-GCM encryption. TLS 1.3 enforced across all endpoints.',
    tags: ['AES-256', 'TLS 1.3', 'At Rest'],
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M21 12l-3-3m0 0l-3 3m3-3v8" />
      </svg>
    ),
    title: 'Role-Based Access Controls',
    description:
      'Granular RBAC with SSO integration, MFA enforcement, and comprehensive audit logging for complete access governance.',
    tags: ['RBAC', 'SSO', 'MFA'],
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-4V4a2 2 0 0 0-2-2h-0a2 2 0 0 0-2 2v6H6a2 2 0 0 0-2 2v0c0 4.97 3.58 9.12 8 9.95 4.42-.83 8-4.98 8-9.95v0a2 2 0 0 0-2-2z" />
        <path d="M12 12v4" />
        <path d="M10 14h4" />
      </svg>
    ),
    title: 'Flexible Deployment',
    description:
      'Deploy on-premise within your data center, in a dedicated secure cloud environment, or hybrid configurations to meet institutional requirements.',
    tags: ['On-Premise', 'Cloud', 'Hybrid'],
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 5v4c0 1.66-4.03 3-9 3S3 10.66 3 9V5" />
        <path d="M21 9v4c0 1.66-4.03 3-9 3s-9-1.34-9-3V9" />
        <path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4" />
        <line x1="16" y1="17" x2="20" y2="13" />
        <line x1="20" y1="17" x2="16" y2="13" />
      </svg>
    ),
    title: 'Zero-Retention Pipeline',
    description:
      'Ephemeral data processing with zero-retention architecture. Patient data is never stored beyond the active diagnostic session.',
    tags: ['Ephemeral', 'Zero-Store', 'HIPAA'],
  },
];

const trustBadges = [
  'HIPAA Compliant',
  'SOC 2 Type II',
  'HL7 FHIR R4',
  'HITRUST CSF',
  'ISO 27001',
];

const ShieldCheckIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-teal-500/60 shrink-0"
  >
    <path d="M12 2L3 7v5c0 5.25 3.75 10.13 9 11.25C17.25 22.13 21 17.25 21 12V7l-9-5z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export default function SecurityMatrix() {
  return (
    <section className="py-32 px-6 bg-[#0b1329] relative overflow-hidden">
      {/* Mesh gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(20,184,166,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 30%, rgba(59,130,246,0.04) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 50% 90%, rgba(20,184,166,0.03) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-teal-500/10 text-teal-400 text-xs font-medium px-4 py-1.5 rounded-full border border-teal-500/20">
            Security &amp; Compliance
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">
            Enterprise Integration &amp; Security Matrix
          </h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
            Purpose-built for regulated healthcare environments with
            zero-compromise security architecture.
          </p>
        </div>

        {/* Security pillar cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="group bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-teal-500/20 transition-all duration-500"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-all duration-300">
                {pillar.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-white mt-6">
                {pillar.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                {pillar.description}
              </p>

              {/* Tags */}
              <div className="mt-6 flex flex-wrap gap-2">
                {pillar.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] uppercase tracking-wider text-slate-500 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex justify-center gap-8 flex-wrap">
          {trustBadges.map((badge) => (
            <div
              key={badge}
              className="flex items-center gap-2 text-sm text-slate-500"
            >
              <ShieldCheckIcon />
              <span>{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
