import React, { useEffect, useState, useMemo } from 'react';

export const AnimatedClearanceCards: React.FC = () => {
  const [phase, setPhase] = useState(0);
  const [blockNum, setBlockNum] = useState(894215);
  const [secondsRemaining, setSecondsRemaining] = useState(298); // 04:58

  useEffect(() => {
    let frameId: number;
    let startTime = performance.now();

    const update = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      setPhase(elapsed);
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);

    // Live block generation simulator
    const blockInterval = setInterval(() => {
      setBlockNum((prev) => prev + 1);
    }, 4000);

    // Live time-bound countdown simulator
    const countdownInterval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 1 ? prev - 1 : 300));
    }, 1000);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(blockInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  // Format MM:SS for the clearance countdown
  const timeFormatted = useMemo(() => {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [secondsRemaining]);

  // Compute live wave dynamics
  const waveOffset = Math.sin(phase * 2.2) * 5;
  const peakY = 64 + Math.sin(phase * 2.5) * 3;

  // Compute a traveling pulse along the exponential curve (parametric progress 0 -> 1)
  const pulseT = (phase * 0.45) % 1; // 0 to 1 cycle every ~2.2s
  // Cubic Bezier interpolation for the moving tracer: P0(15,95) -> P1(90,94) -> P2(170,80) -> P3(255, peakY-40)
  const tracerX = Math.pow(1 - pulseT, 3) * 15 +
    3 * Math.pow(1 - pulseT, 2) * pulseT * 90 +
    3 * (1 - pulseT) * Math.pow(pulseT, 2) * 180 +
    Math.pow(pulseT, 3) * 255;
  const tracerY = Math.pow(1 - pulseT, 3) * 95 +
    3 * Math.pow(1 - pulseT, 2) * pulseT * 94 +
    3 * (1 - pulseT) * Math.pow(pulseT, 2) * 60 +
    Math.pow(pulseT, 3) * (peakY - 40);

  return (
    <div className="relative w-full h-[225px] flex items-end justify-center pb-2 select-none">
      {/* Background Layer 1: L1 Card with subtle floating motion */}
      <div
        className="absolute w-[82%] h-[160px] bg-[#ebebeb] border border-black/[0.08] rounded-2xl px-4 py-2 text-[10px] font-mono uppercase text-[#909090] flex items-start justify-between transition-transform duration-300"
        style={{
          top: '2px',
          transform: `translateY(${Math.sin(phase * 1.4) * 4}px)`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#909090]/50" />
          <span>LEVEL-1 // OPERATIONAL</span>
        </div>
        <span className="text-[9px] text-[#909090]">BEL-HQ // BENGALURU</span>
      </div>

      {/* Middle Layer 2: L2 Card with offset floating motion */}
      <div
        className="absolute w-[89%] h-[170px] bg-[#f5f5f5] border border-black/[0.08] rounded-2xl px-5 py-2.5 text-[10px] font-mono uppercase text-[#666666] flex items-start justify-between transition-transform duration-300"
        style={{
          top: '18px',
          transform: `translateY(${Math.sin(phase * 1.8 + 1) * 3}px)`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#484848]/60" />
          <span>LEVEL-2 // CLASSIFIED</span>
        </div>
        <span className="text-[9px] text-[#666666]">AESA SENSOR LAB</span>
      </div>

      {/* Foreground Layer 3: Main Active Clearance Card */}
      <div
        className="relative w-[96%] h-[184px] bg-white border border-black/[0.12] rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_-6px_rgba(0,0,0,0.06)] transition-transform duration-300"
        style={{
          transform: `translateY(${Math.sin(phase * 1.2 + 2) * 1.5}px)`,
        }}
      >
        {/* Card Header with Live Ticking Telemetry */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#0d0d0d]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0d0d0d] animate-pulse" />
            <span className="font-semibold tracking-wider uppercase">LEVEL-4 CLEARANCE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-black/[0.05] text-[#0d0d0d] font-mono">
              EXP: {timeFormatted}
            </span>
            <span className="text-[10px] text-[#909090] font-normal hidden sm:inline">
              BLOCK #{blockNum}
            </span>
          </div>
        </div>

        {/* Live SVG Graph & Animated Trajectory */}
        <div className="relative w-full h-[105px] flex items-center justify-center my-0.5">
          <svg viewBox="0 0 280 100" className="w-full h-full overflow-visible">
            <defs>
              {/* Subtle Gradient Fill under Curve */}
              <linearGradient id="curveFillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d0d0d" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#0d0d0d" stopOpacity="0" />
              </linearGradient>

              {/* Laser stroke gradient */}
              <linearGradient id="laserStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#909090" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#0d0d0d" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0d0d0d" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Dotted horizontal grid lines */}
            <line x1="10" y1="20" x2="270" y2="20" stroke="#ebebeb" strokeDasharray="3 3" />
            <line x1="10" y1="48" x2="270" y2="48" stroke="#ebebeb" strokeDasharray="3 3" />
            <line x1="10" y1="76" x2="270" y2="76" stroke="#ebebeb" strokeDasharray="3 3" />

            {/* Baseline */}
            <line x1="10" y1="92" x2="270" y2="92" stroke="#e0e0e0" strokeWidth="1" />

            {/* Dynamic Curve Path definition */}
            {/* Area Fill Under Curve with breathing opacity */}
            <path
              d={`M 15 90 C 85 89, 140 ${86 + waveOffset * 0.4}, 205 ${32 + waveOffset * 0.6} S 240 ${peakY - 37}, 255 ${peakY - 42} L 255 92 L 15 92 Z`}
              fill="url(#curveFillGrad)"
              opacity={0.6 + Math.sin(phase * 2) * 0.25}
            />

            {/* Base Solid Exponential Curve */}
            <path
              d={`M 15 90 C 85 89, 140 ${86 + waveOffset * 0.4}, 205 ${32 + waveOffset * 0.6} S 240 ${peakY - 37}, 255 ${peakY - 42}`}
              fill="none"
              stroke="#0d0d0d"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Animated Laser Pulse Traveling along the Curve */}
            <path
              d={`M 15 90 C 85 89, 140 ${86 + waveOffset * 0.4}, 205 ${32 + waveOffset * 0.6} S 240 ${peakY - 37}, 255 ${peakY - 42}`}
              fill="none"
              stroke="#0d0d0d"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="35 180"
              style={{
                strokeDashoffset: `${-phase * 110}`,
                filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
              }}
            />

            {/* Traveling Light Particle following the curve */}
            <circle
              cx={tracerX}
              cy={tracerY}
              r="2.8"
              fill="#0d0d0d"
              style={{
                filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))',
              }}
            />

            {/* Peak Terminal Target Node */}
            <circle cx="255" cy={peakY - 42} r="3" fill="#0d0d0d" />

            {/* Radar Ripple Ping around Target Node */}
            <circle
              cx="255"
              cy={peakY - 42}
              r={4 + (phase * 12) % 14}
              fill="none"
              stroke="#0d0d0d"
              strokeWidth="1"
              opacity={Math.max(0, 1 - ((phase * 12) % 14) / 14)}
            />
            <circle
              cx="255"
              cy={peakY - 42}
              r={4 + ((phase * 12 + 7) % 14)}
              fill="none"
              stroke="#0d0d0d"
              strokeWidth="0.8"
              opacity={Math.max(0, 1 - (((phase * 12 + 7) % 14) / 14))}
            />

            {/* Anchored Pill Badge at Peak: <1s REVOKE with dynamic pulse */}
            <g transform={`translate(208, ${peakY - 65})`}>
              <rect
                x="0"
                y="0"
                width="66"
                height="19"
                rx="9.5"
                fill="#f5f5f5"
                stroke="#0d0d0d"
                strokeWidth="1"
                className="drop-shadow-sm"
              />
              <circle
                cx="11"
                cy="9.5"
                r="2"
                fill="#0d0d0d"
                className="animate-pulse"
              />
              <text
                x="37"
                y="13"
                textAnchor="middle"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#0d0d0d"
                letterSpacing="0.05em"
              >
                &lt;1s REVOKE
              </text>
            </g>
          </svg>
        </div>

        {/* Card Footer Micro-bar with Live Depletion Indicator */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#909090] border-t border-black/[0.06] pt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping inline-block mr-0.5" />
            <span className="text-[#0d0d0d] font-semibold">SMART CONTRACT ACTIVE</span>
          </div>
          <div className="flex items-center gap-2 text-[#4d4d4d]">
            <span className="hidden sm:inline">AUTO-EXPIRE:</span>
            <span className="font-mono text-[#0d0d0d] font-medium">ON-CHAIN TIMESTAMP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
