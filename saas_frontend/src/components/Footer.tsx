export default function Footer() {
  const complianceBadges = ['HIPAA', 'SOC 2', 'HL7/FHIR'];

  const columns = [
    {
      heading: 'Platform',
      links: [
        { label: 'Clinical Efficiency', href: '#clinical-efficiency' },
        { label: 'Executive Analytics', href: '#executive-analytics' },
        { label: 'Enterprise Integration', href: '#enterprise-integration' },
        { label: 'API Documentation', href: '#api-docs' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Validation Studies', href: '#validation' },
        { label: 'Case Studies', href: '#case-studies' },
        { label: 'White Papers', href: '#white-papers' },
        { label: 'Compliance', href: '#compliance' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '#about' },
        { label: 'Careers', href: '#careers' },
        { label: 'Contact', href: '#contact' },
        { label: 'Press', href: '#press' },
      ],
    },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Terms of Service', href: '#terms' },
    { label: 'Security', href: '#security' },
  ];

  return (
    <footer className="bg-navy-950 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto py-16 px-6">
        {/* Top Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column — spans 2 */}
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">Med</span>
                <span className="text-teal-400">BI</span>
              </span>
              <span className="w-px h-5 bg-white/10" aria-hidden="true" />
              <span className="text-xs text-slate-400 uppercase tracking-widest font-medium">
                Enterprise
              </span>
            </a>
            <p className="text-sm text-slate-500 mt-4 max-w-xs leading-relaxed">
              Enterprise-grade clinical intelligence platform for hospital networks
              and health systems.
            </p>
            <div className="flex items-center gap-2 mt-5">
              {complianceBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 px-2.5 py-1 font-medium select-none"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                {col.heading}
              </h4>
              <ul className="space-y-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-teal-400 transition-colors block mt-2.5"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Row */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} MedBI Enterprise. All rights reserved.
          </span>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
