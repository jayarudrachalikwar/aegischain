import React, { useEffect, useState } from 'react';
import { Shield, Anchor, Plane, Compass, Crosshair, Award, FileCheck, Layers, Cpu, Database } from 'lucide-react';

export const BranchingSettlementMesh: React.FC = () => {
  const [packetProgress, setPacketProgress] = useState(0);

  useEffect(() => {
    let animId: number;
    let start = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - start) / 1000;
      setPacketProgress((elapsed * 0.4) % 1); // 0 to 1 loop
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, []);

  // Left nodes (Tri-service & Strategic commands)
  const leftNodes = [
    { label: 'ARMY', icon: Shield },
    { label: 'NAVY', icon: Anchor },
    { label: 'AIR FORCE', icon: Plane },
    { label: 'COAST', icon: Compass },
    { label: 'DRDO', icon: Crosshair },
  ];

  // Right nodes (BEL & Audit entities)
  const rightNodes = [
    { label: 'BEL R&D', icon: Cpu },
    { label: 'TEST LAB', icon: Database },
    { label: 'CAG AUDIT', icon: FileCheck },
    { label: 'MINISTRY', icon: Award },
    { label: 'CONSORTIUM', icon: Layers },
  ];

  // SVG coordinate layout
  const w = 320;
  const h = 200;
  const hubX = 160;
  const hubY = 100;
  const leftX = 35;
  const rightX = 285;

  // Bezier point computation for packet position
  const getCubicPoint = (
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
  ) => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
    };
  };

  return (
    <div className="relative w-full h-[220px] flex items-center justify-center select-none overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
        {/* Left branching bezier curves into center hub */}
        {leftNodes.map((_, i) => {
          const y = 30 + i * 35;
          const p0 = { x: leftX + 10, y };
          const p1 = { x: leftX + 65, y };
          const p2 = { x: hubX - 45, y: hubY };
          const p3 = { x: hubX - 35, y: hubY };

          // Packet position along this curve
          const pt = getCubicPoint(p0, p1, p2, p3, (packetProgress + i * 0.2) % 1);

          return (
            <g key={`left-${i}`}>
              <path
                d={`M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
                fill="none"
                stroke="#d4d4d4"
                strokeWidth="1.2"
              />
              {/* Flowing signal packet */}
              <circle cx={pt.x} cy={pt.y} r="2.2" fill="#0d0d0d" />
            </g>
          );
        })}

        {/* Right branching bezier curves out of center hub */}
        {rightNodes.map((_, i) => {
          const y = 30 + i * 35;
          const p0 = { x: hubX + 35, y: hubY };
          const p1 = { x: hubX + 45, y: hubY };
          const p2 = { x: rightX - 65, y };
          const p3 = { x: rightX - 10, y };

          // Packet position along this curve
          const pt = getCubicPoint(p0, p1, p2, p3, (packetProgress + i * 0.25) % 1);

          return (
            <g key={`right-${i}`}>
              <path
                d={`M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
                fill="none"
                stroke="#d4d4d4"
                strokeWidth="1.2"
              />
              {/* Flowing signal packet */}
              <circle cx={pt.x} cy={pt.y} r="2.2" fill="#0d0d0d" />
            </g>
          );
        })}

        {/* Left Nodes (Badges) */}
        {leftNodes.map((node, i) => {
          const y = 30 + i * 35;
          const Icon = node.icon;
          return (
            <g key={`node-l-${i}`} transform={`translate(${leftX}, ${y})`}>
              <circle cx="0" cy="0" r="10" fill="#f0f0f0" stroke="#0d0d0d" strokeWidth="1" />
              <foreignObject x="-6" y="-6" width="12" height="12">
                <div className="w-full h-full flex items-center justify-center text-[#0d0d0d]">
                  <Icon className="w-2.5 h-2.5" />
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Right Nodes (Institutions) */}
        {rightNodes.map((node, i) => {
          const y = 30 + i * 35;
          const Icon = node.icon;
          return (
            <g key={`node-r-${i}`} transform={`translate(${rightX}, ${y})`}>
              <circle cx="0" cy="0" r="10" fill="#f0f0f0" stroke="#0d0d0d" strokeWidth="1" />
              <foreignObject x="-6" y="-6" width="12" height="12">
                <div className="w-full h-full flex items-center justify-center text-[#0d0d0d]">
                  <Icon className="w-2.5 h-2.5" />
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Central Hub: Black pill AEGISCHAIN (matching USDT in Image 3!) */}
        <g transform={`translate(${hubX}, ${hubY})`}>
          <rect
            x="-42"
            y="-14"
            width="84"
            height="28"
            rx="14"
            fill="#0d0d0d"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <circle cx="-24" cy="0" r="2.5" fill="#4ade80" />
          <text
            x="2"
            y="4"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
            letterSpacing="0.08em"
          >
            AEGIS
          </text>
        </g>
      </svg>
    </div>
  );
};
