import React, { useEffect, useRef } from 'react';

export const SweepingLines: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 650);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse coordinates with smoothing for subtle interactive parallax
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = ((e.clientX - rect.left) / width - 0.5) * 50;
      mouse.targetY = ((e.clientY - rect.top) / height - 0.5) * 35;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let t = 0;

    // Cubic Bezier helper to compute point at t [0, 1]
    const getBezierPoint = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number },
      progress: number
    ) => {
      const u = 1 - progress;
      const tt = progress * progress;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * progress;

      const x = uuu * p0.x + 3 * uu * progress * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
      const y = uuu * p0.y + 3 * uu * progress * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
      return { x, y };
    };

    // Tangent derivative for tick rotation
    const getBezierTangent = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number },
      progress: number
    ) => {
      const u = 1 - progress;
      const dx =
        3 * u * u * (p1.x - p0.x) +
        6 * u * progress * (p2.x - p1.x) +
        3 * progress * progress * (p3.x - p2.x);
      const dy =
        3 * u * u * (p1.y - p0.y) +
        6 * u * progress * (p2.y - p1.y) +
        3 * progress * progress * (p3.y - p2.y);
      return Math.atan2(dy, dx);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      if (!prefersReducedMotion) {
        t += 0.003;
      }

      // Base curves matching the sweeping architectural lines in Image 1
      const curves = [
        // Track 1: Upper sweeping arc under & behind the navbar
        {
          p0: { x: -80, y: 140 + mouse.y * 0.4 },
          p1: { x: width * 0.28, y: 280 + mouse.y * 0.7 },
          p2: { x: width * 0.72, y: 310 + mouse.y * 0.6 },
          p3: { x: width + 80, y: 70 + mouse.y * 0.3 },
          hasTicks: true,
          twinOffset: 6,
          pulseSpeed: 0.12,
          color: 'rgba(13, 13, 13, 0.18)',
          subColor: 'rgba(13, 13, 13, 0.08)',
        },
        // Track 2: Deeper sweeping arc traversing the lower hero
        {
          p0: { x: -60, y: 220 + mouse.y * 0.6 },
          p1: { x: width * 0.35, y: 440 + mouse.y * 0.9 },
          p2: { x: width * 0.68, y: 460 + mouse.y * 0.8 },
          p3: { x: width + 80, y: 190 + mouse.y * 0.4 },
          hasTicks: true,
          twinOffset: 5,
          pulseSpeed: 0.08,
          color: 'rgba(13, 13, 13, 0.14)',
          subColor: 'rgba(13, 13, 13, 0.06)',
        },
        // Track 3: High delicate perspective arc
        {
          p0: { x: -100, y: 50 + mouse.y * 0.2 },
          p1: { x: width * 0.4, y: 180 + mouse.y * 0.5 },
          p2: { x: width * 0.7, y: 210 + mouse.y * 0.4 },
          p3: { x: width + 100, y: 20 + mouse.y * 0.1 },
          hasTicks: false,
          twinOffset: 0,
          pulseSpeed: 0.15,
          color: 'rgba(13, 13, 13, 0.09)',
          subColor: 'rgba(13, 13, 13, 0.04)',
        },
      ];

      curves.forEach((curve, cIdx) => {
        // 1. Draw main bezier stroke
        ctx.beginPath();
        ctx.moveTo(curve.p0.x, curve.p0.y);
        ctx.bezierCurveTo(curve.p1.x, curve.p1.y, curve.p2.x, curve.p2.y, curve.p3.x, curve.p3.y);
        ctx.strokeStyle = curve.color;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // 2. Draw parallel twin rail (just like tempo.xyz railway track in Image 1)
        if (curve.twinOffset > 0) {
          ctx.beginPath();
          ctx.moveTo(curve.p0.x, curve.p0.y + curve.twinOffset);
          ctx.bezierCurveTo(
            curve.p1.x,
            curve.p1.y + curve.twinOffset,
            curve.p2.x,
            curve.p2.y + curve.twinOffset,
            curve.p3.x,
            curve.p3.y + curve.twinOffset
          );
          ctx.strokeStyle = curve.subColor;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // 3. Draw tick marks along the curve
        if (curve.hasTicks) {
          const tickCount = 65;
          ctx.strokeStyle = 'rgba(13, 13, 13, 0.15)';
          ctx.lineWidth = 1;
          for (let i = 0; i <= tickCount; i++) {
            const progress = i / tickCount;
            const pt = getBezierPoint(curve.p0, curve.p1, curve.p2, curve.p3, progress);
            const angle = getBezierTangent(curve.p0, curve.p1, curve.p2, curve.p3, progress);

            const normalAngle = angle + Math.PI / 2;
            const tickLen = (i % 5 === 0) ? 9 : 4;
            const x1 = pt.x - Math.cos(normalAngle) * (tickLen * 0.5);
            const y1 = pt.y - Math.sin(normalAngle) * (tickLen * 0.5);
            const x2 = pt.x + Math.cos(normalAngle) * (tickLen * 0.5);
            const y2 = pt.y + Math.sin(normalAngle) * (tickLen * 0.5);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Small telemetry labels at key intervals
            if (i === 15 && cIdx === 0) {
              ctx.save();
              ctx.translate(pt.x, pt.y - 12);
              ctx.rotate(angle);
              ctx.font = '9px monospace';
              ctx.fillStyle = 'rgba(13, 13, 13, 0.4)';
              ctx.fillText('AESA-RADAR // TRACK 01', 0, 0);
              ctx.restore();
            }
            if (i === 48 && cIdx === 1) {
              ctx.save();
              ctx.translate(pt.x, pt.y + 16);
              ctx.rotate(angle);
              ctx.font = '9px monospace';
              ctx.fillStyle = 'rgba(13, 13, 13, 0.4)';
              ctx.fillText('BEL-GATEWAY // 9.42GHz', 0, 0);
              ctx.restore();
            }
          }
        }

        // 4. Moving signal pulses / dashed telemetry packets in motion along the rail
        if (!prefersReducedMotion) {
          const pulsePositions = [
            (t * curve.pulseSpeed + 0.1 * cIdx) % 1,
            (t * curve.pulseSpeed + 0.45 + 0.2 * cIdx) % 1,
            (t * curve.pulseSpeed + 0.8) % 1,
          ];

          pulsePositions.forEach((pos) => {
            const pt = getBezierPoint(curve.p0, curve.p1, curve.p2, curve.p3, pos);
            const angle = getBezierTangent(curve.p0, curve.p1, curve.p2, curve.p3, pos);

            // Draw a high-contrast glowing packet
            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.rotate(angle);

            // Pulse line
            ctx.beginPath();
            ctx.moveTo(-16, 0);
            ctx.lineTo(16, 0);
            ctx.strokeStyle = '#0d0d0d';
            ctx.lineWidth = 2.0;
            ctx.stroke();

            // Center beacon dot
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#0d0d0d';
            ctx.fill();

            ctx.restore();
          });
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
};
