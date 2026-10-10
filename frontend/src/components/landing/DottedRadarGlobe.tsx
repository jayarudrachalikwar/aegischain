import React, { useEffect, useRef } from 'react';

export const DottedRadarGlobe: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 340);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 240);
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

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Generate sphere points on latitude & longitude rings
    const sphereRadius = Math.min(width, height) * 0.48;
    const points: { x: number; y: number; z: number; isAnchor?: boolean }[] = [];
    const latLines = 14;
    const lonPoints = 28;

    for (let i = 0; i <= latLines; i++) {
      const theta = (i * Math.PI) / latLines - Math.PI / 2;
      const r = sphereRadius * Math.cos(theta);
      const y = sphereRadius * Math.sin(theta);

      for (let j = 0; j < lonPoints; j++) {
        const phi = (j * 2 * Math.PI) / lonPoints;
        const x = r * Math.sin(phi);
        const z = r * Math.cos(phi);
        // Tag one specific point to attach the floating badge
        const isAnchor = i === 6 && j === 7;
        points.push({ x, y, z, isAnchor });
      }
    }

    let angle = 0;
    let sweepAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (!prefersReducedMotion) {
        angle += 0.007;
        sweepAngle += 0.025;
      }

      const cx = width * 0.5;
      const cy = height * 0.65; // Positioned lower like in Image 3
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const tilt = 0.35;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      let anchorScreenPos: { x: number; y: number; z: number } | null = null;

      // Draw faint wireframe sphere rim
      ctx.beginPath();
      ctx.arc(cx, cy, sphereRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(13, 13, 13, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw rotating radar sweep wedge
      const sweepGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, sphereRadius);
      sweepGrad.addColorStop(0, 'rgba(13, 13, 13, 0.08)');
      sweepGrad.addColorStop(0.8, 'rgba(13, 13, 13, 0.02)');
      sweepGrad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, sphereRadius, sweepAngle - 0.4, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Render dotted cloud
      points.forEach((pt) => {
        // Rotate around Y
        const rx = pt.x * cosA + pt.z * sinA;
        const rz = -pt.x * sinA + pt.z * cosA;

        // Tilt around X
        const ry = pt.y * cosT - rz * sinT;
        const finalZ = pt.y * sinT + rz * cosT;

        // Perspective scale
        const scale = 380 / (380 + finalZ);
        const px = cx + rx * scale;
        const py = cy + ry * scale;

        // Only render or highlight front-facing points
        const alpha = Math.max(0.08, (finalZ + sphereRadius) / (2 * sphereRadius));
        const dotSize = Math.max(0.8, scale * 1.5);

        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(13, 13, 13, ${alpha * 0.55})`;
        ctx.fill();

        if (pt.isAnchor && finalZ > 0) {
          anchorScreenPos = { x: px, y: py, z: finalZ };
        }
      });

      // Draw floating anchored badge (matching USDT badge in Image 3!)
      if (anchorScreenPos !== null) {
        const anchor: { x: number; y: number; z: number } = anchorScreenPos;
        const ax = anchor.x;
        const ay = anchor.y;

        // Leader line
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax, ay - 24);
        ctx.strokeStyle = '#0d0d0d';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pin point
        ctx.beginPath();
        ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#0d0d0d';
        ctx.fill();

        // Badge pill
        const badgeW = 76;
        const badgeH = 22;
        const bx = ax - badgeW / 2;
        const by = ay - 24 - badgeH;

        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        ctx.roundRect(bx, by, badgeW, badgeH, 11);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AESA · 9.42G', ax, by + badgeH / 2);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-full h-[220px] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
