import React from 'react';

interface Partner {
  id: string;
  name: string;
  subtext: string;
  renderLogo: () => React.ReactNode;
}

export const BelPartnerMarquee: React.FC = () => {
  const partners: Partner[] = [
    {
      id: 'drdo',
      name: 'DRDO',
      subtext: 'R&D PARTNER',
      renderLogo: () => (
        <svg className="w-7 h-7 text-[#0d0d0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
          <circle cx="12" cy="12" r="4" strokeWidth="2" />
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'iaf',
      name: 'INDIAN AIR FORCE',
      subtext: 'AVIONICS & AESA',
      renderLogo: () => (
        <svg className="w-7 h-7 text-[#0d0d0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 2L3 19l9-3 9 3L12 2z" strokeLinejoin="round" />
          <path d="M12 7v9" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'navy',
      name: 'INDIAN NAVY',
      subtext: 'COMBAT SUITES',
      renderLogo: () => (
        <svg className="w-7 h-7 text-[#0d0d0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="5" r="2.5" />
          <path d="M12 7.5v13.5M5 12h14M6 18c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'army',
      name: 'INDIAN ARMY',
      subtext: 'TACTICAL C4I',
      renderLogo: () => (
        <svg className="w-7 h-7 text-[#0d0d0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
          <path d="M12 8v8M8 12h8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'hal',
      name: 'HAL',
      subtext: 'AERONAUTICS',
      renderLogo: () => (
        <svg className="w-7 h-7 text-[#0d0d0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M2 16l20-8-12 12-2-4-6 0z" strokeLinejoin="round" />
          <circle cx="17" cy="8" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'bdl',
      name: 'BDL',
      subtext: 'GUIDED MISSILES',
      renderLogo: () => (
        <svg className="w-7 h-7 text-[#0d0d0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 2l4 7-4 13-4-13 4-7z" strokeLinejoin="round" />
          <path d="M6 12h12M9 16h6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'isro',
      name: 'ISRO',
      subtext: 'SPACE SUBSYSTEMS',
      renderLogo: () => (
        <svg className="w-7 h-7 text-[#0d0d0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-25 12 12)" />
        </svg>
      ),
    },
    {
      id: 'brahmos',
      name: 'BRAHMOS',
      subtext: 'SUPERSONIC MISSILE',
      renderLogo: () => (
        <svg className="w-7 h-7 text-[#0d0d0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'mod',
      name: 'DEFENCE PRODUCTION',
      subtext: 'MINISTRY OF DEFENCE',
      renderLogo: () => (
        <svg className="w-7 h-7 text-[#0d0d0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'coastguard',
      name: 'COAST GUARD',
      subtext: 'RADAR SURVEILLANCE',
      renderLogo: () => (
        <svg className="w-7 h-7 text-[#0d0d0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="9" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full overflow-hidden py-4 select-none relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      {/* Infinite Horizontal Marquee Track (Smooth, Continuous, Leftwards Flow) */}
      <div className="flex w-max bel-partner-marquee-track">
        {/* Track Segment 1 */}
        <div className="flex shrink-0 items-center gap-12 sm:gap-16 pr-12 sm:pr-16">
          {partners.map((partner) => (
            <div
              key={`p1-${partner.id}`}
              className="flex items-center gap-3 group opacity-50 hover:opacity-100 transition-opacity duration-200 cursor-default"
            >
              <div className="w-9 h-9 rounded-lg bg-black/[0.04] border border-black/[0.08] flex items-center justify-center group-hover:bg-[#0d0d0d] group-hover:text-white transition-colors duration-200">
                {partner.renderLogo()}
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[13px] sm:text-[14px] font-semibold tracking-[0.08em] text-[#0d0d0d] uppercase whitespace-nowrap">
                  {partner.name}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-[#909090] uppercase whitespace-nowrap">
                  {partner.subtext}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Track Segment 2 (Duplicate for 100% Seamless Continuous Infinite Scroll) */}
        <div aria-hidden="true" className="flex shrink-0 items-center gap-12 sm:gap-16 pr-12 sm:pr-16">
          {partners.map((partner) => (
            <div
              key={`p2-${partner.id}`}
              className="flex items-center gap-3 group opacity-50 hover:opacity-100 transition-opacity duration-200 cursor-default"
            >
              <div className="w-9 h-9 rounded-lg bg-black/[0.04] border border-black/[0.08] flex items-center justify-center group-hover:bg-[#0d0d0d] group-hover:text-white transition-colors duration-200">
                {partner.renderLogo()}
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[13px] sm:text-[14px] font-semibold tracking-[0.08em] text-[#0d0d0d] uppercase whitespace-nowrap">
                  {partner.name}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-[#909090] uppercase whitespace-nowrap">
                  {partner.subtext}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scoped CSS for Guaranteed 60fps Hardware-Accelerated Marquee Motion */}
      <style>{`
        .bel-partner-marquee-track {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: belMarqueeSlide 26s linear infinite;
        }

        .bel-partner-marquee-track:hover {
          animation-play-state: paused;
        }

        @keyframes belMarqueeSlide {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </div>
  );
};
