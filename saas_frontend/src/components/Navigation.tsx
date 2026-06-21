'use client';

import { useState } from 'react';

const navLinks = [
  { label: 'Clinical Efficiency', href: '#clinical-efficiency' },
  { label: 'Executive Analytics', href: '#executive-analytics' },
  { label: 'Enterprise Integration', href: '#enterprise-integration' },
];

const complianceBadges = ['HIPAA', 'SOC 2', 'HL7/FHIR'];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 shrink-0">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">Med</span>
            <span className="text-teal-400">BI</span>
          </span>
          <span className="hidden sm:block w-px h-5 bg-white/10" aria-hidden="true" />
          <span className="hidden sm:block text-xs text-slate-400 uppercase tracking-widest font-medium">
            Enterprise
          </span>
        </a>

        {/* Center Nav — Desktop */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-slate-300 hover:text-white transition-all duration-300 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-teal-400 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Right — Desktop */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 mr-2">
            {complianceBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 px-2.5 py-1 font-medium select-none"
              >
                {badge}
              </span>
            ))}
          </div>
          <a
            href="#demo"
            className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20 text-sm leading-none whitespace-nowrap"
          >
            Request Institutional Demo
          </a>
        </div>

        {/* Hamburger — Mobile */}
        <button
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="lg:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] group"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span
            className={`block w-5 h-[2px] bg-slate-300 transition-all duration-300 origin-center ${
              mobileOpen ? 'rotate-45 translate-y-[7px]' : ''
            }`}
          />
          <span
            className={`block w-5 h-[2px] bg-slate-300 transition-all duration-300 ${
              mobileOpen ? 'opacity-0 scale-x-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-[2px] bg-slate-300 transition-all duration-300 origin-center ${
              mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile Dropdown */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6 pt-2 border-t border-white/[0.06] space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg px-4 py-3 transition-all duration-300"
            >
              {link.label}
            </a>
          ))}

          <div className="flex items-center gap-2 pt-4 pb-2 px-4">
            {complianceBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 px-2.5 py-1 font-medium select-none"
              >
                {badge}
              </span>
            ))}
          </div>

          <a
            href="#demo"
            onClick={() => setMobileOpen(false)}
            className="block text-center bg-teal-500 hover:bg-teal-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20 text-sm mt-2"
          >
            Request Institutional Demo
          </a>
        </div>
      </div>
    </nav>
  );
}
