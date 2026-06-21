'use client';

export default function HeroSection() {
  return (
    <section className="relative bg-navy-950 mesh-gradient-hero grid-pattern overflow-hidden">
      <div className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 text-xs font-medium px-4 py-1.5 rounded-full border border-teal-500/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Trusted by 500+ Hospital Networks Worldwide
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="text-white">Enterprise-Grade </span>
            <span className="text-gradient">Clinical Intelligence</span>
            <span className="text-white">.</span>
            <br />
            <span className="text-white">Optimized for Hospital Networks.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
            Transform clinical decision-making with AI-powered diagnostics validated
            across 4,920 training records, 131 symptom features, and 41 disease
            classifications — delivering institutional-grade accuracy at scale.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20"
            >
              {/* Calendar Icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <rect
                  x="1.5"
                  y="2.5"
                  width="13"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path d="M1.5 6.5H14.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Schedule Executive Briefing
            </a>

            <a
              href="#validation"
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-teal-500/50 hover:bg-white/5 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300"
            >
              {/* Document Icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <path
                  d="M9.5 1.5H4C3.17157 1.5 2.5 2.17157 2.5 3V13C2.5 13.8284 3.17157 14.5 4 14.5H12C12.8284 14.5 13.5 13.8284 13.5 13V5.5L9.5 1.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.5 1.5V4C9.5 4.82843 10.1716 5.5 11 5.5H13.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M5.5 8.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M5.5 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Review Validation Studies
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 flex flex-wrap justify-center gap-12 md:gap-20">
            {[
              { value: '99.7%', label: 'Uptime SLA' },
              { value: '4,920', label: 'Training Records' },
              { value: '131', label: 'Symptom Features' },
              { value: '41', label: 'Disease Classes' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Glassmorphic Card — Left */}
      <div className="hidden lg:block absolute left-8 xl:left-16 top-1/2 -translate-y-1/2 animate-float pointer-events-none select-none">
        <div className="glass-card rounded-xl px-4 py-3 w-48 shadow-xl shadow-black/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              Accuracy
            </span>
          </div>
          <div className="text-xl font-bold text-white">99.2%</div>
          <div className="mt-2 flex items-end gap-[3px] h-6">
            {[40, 65, 50, 80, 70, 90, 85, 95].map((h, i) => (
              <div
                key={i}
                className="w-[4px] rounded-sm bg-teal-500/60"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Glassmorphic Card — Right */}
      <div className="hidden lg:block absolute right-8 xl:right-16 top-1/2 -translate-y-1/3 animate-float-delay pointer-events-none select-none">
        <div className="glass-card rounded-xl px-4 py-3 w-52 shadow-xl shadow-black/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              Live Throughput
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">1,284</span>
            <span className="text-xs text-teal-400 font-medium">+12.4%</span>
          </div>
          <div className="mt-2 w-full bg-white/5 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full w-[78%]" />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-500">Diagnoses / hr</span>
            <span className="text-[9px] text-slate-500">Target: 1,500</span>
          </div>
        </div>
      </div>
    </section>
  );
}
