import React from 'react';

export const TempoHeroRings: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 right-0 w-full pointer-events-none select-none z-0 overflow-hidden"
      style={{
        // Moved slightly above (top: -22px) as requested
        top: '-22px',
        height: 'clamp(120px, 19vw, 305px)',
      }}
    >
      <div className="relative w-full h-full">
        {/* Layer 1: Base existing lines (hero-rings.webp wireframe) */}
        <img
          src="/hero-rings.webp"
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-bottom mix-blend-multiply opacity-55"
        />

        {/* Layer 2: Repeated Ambient Black Glow on the EXACT existing lines */}
        <div
          className="absolute inset-0 w-full h-full mix-blend-multiply pointer-events-none"
          style={{
            animation: 'existingBlackGlowBreath 3.6s ease-in-out infinite',
          }}
        >
          <img
            src="/hero-rings.webp"
            alt=""
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-bottom"
            style={{
              filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 10px rgba(0, 0, 0, 0.35)) contrast(160%) brightness(0.4)',
            }}
          />
        </div>

        {/* Layer 3: Primary Traveling Black Flow Wave across the EXACT existing lines */}
        <div
          className="absolute inset-0 w-full h-full mix-blend-multiply pointer-events-none"
          style={{
            WebkitMaskImage:
              'linear-gradient(115deg, transparent 0%, transparent 34%, rgba(0,0,0,0.2) 42%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.2) 58%, transparent 66%, transparent 100%)',
            WebkitMaskSize: '320% 100%',
            WebkitMaskRepeat: 'no-repeat',
            maskImage:
              'linear-gradient(115deg, transparent 0%, transparent 34%, rgba(0,0,0,0.2) 42%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.2) 58%, transparent 66%, transparent 100%)',
            maskSize: '320% 100%',
            maskRepeat: 'no-repeat',
            animation: 'blackFlowPrimary 4.0s linear infinite',
          }}
        >
          <img
            src="/hero-rings.webp"
            alt=""
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-bottom"
            style={{
              filter:
                'contrast(380%) brightness(0.08) drop-shadow(0 0 3px #000000) drop-shadow(0 0 12px rgba(0, 0, 0, 0.95))',
            }}
          />
        </div>

        {/* Layer 4: Secondary Cascading Black Flow Wave (Continuous liquid motion) */}
        <div
          className="absolute inset-0 w-full h-full mix-blend-multiply pointer-events-none"
          style={{
            WebkitMaskImage:
              'linear-gradient(120deg, transparent 0%, transparent 36%, rgba(0,0,0,0.15) 43%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.15) 57%, transparent 64%, transparent 100%)',
            WebkitMaskSize: '320% 100%',
            WebkitMaskRepeat: 'no-repeat',
            maskImage:
              'linear-gradient(120deg, transparent 0%, transparent 36%, rgba(0,0,0,0.15) 43%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.15) 57%, transparent 64%, transparent 100%)',
            maskSize: '320% 100%',
            maskRepeat: 'no-repeat',
            animation: 'blackFlowSecondary 4.8s cubic-bezier(0.4, 0, 0.2, 1) 2.0s infinite',
          }}
        >
          <img
            src="/hero-rings.webp"
            alt=""
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-bottom"
            style={{
              filter:
                'contrast(320%) brightness(0.12) drop-shadow(0 0 3px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 8px rgba(0, 0, 0, 0.75))',
            }}
          />
        </div>

        {/* Soft bottom blend into page background #f3f3f3 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#f3f3f3]" />
      </div>

      {/* Pure CSS Animations for the Black Flow along Existing Lines */}
      <style>{`
        @keyframes existingBlackGlowBreath {
          0%, 100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.75;
          }
        }

        @keyframes blackFlowPrimary {
          0% {
            -webkit-mask-position: -120% 0;
            mask-position: -120% 0;
            opacity: 0.2;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            -webkit-mask-position: 220% 0;
            mask-position: 220% 0;
            opacity: 0.2;
          }
        }

        @keyframes blackFlowSecondary {
          0% {
            -webkit-mask-position: -120% 0;
            mask-position: -120% 0;
            opacity: 0.15;
          }
          20% {
            opacity: 0.95;
          }
          80% {
            opacity: 0.95;
          }
          100% {
            -webkit-mask-position: 220% 0;
            mask-position: 220% 0;
            opacity: 0.15;
          }
        }
      `}</style>
    </div>
  );
};
