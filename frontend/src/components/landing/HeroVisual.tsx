import React, { useEffect, useRef } from 'react';

export const HeroVisual: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Handle high DPI
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const setSize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    setSize();

    // Mouse interactive target & smoothed actual angles
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      mouse.targetX = x * 1.2;
      mouse.targetY = y * 0.8;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      setSize();
    };
    window.addEventListener('resize', handleResize);

    // 3D Orbital Rings Data
    // Concentric perspective rings and orbital arcs echoing tempo.xyz
    const rings = [
      { radius: 190, tilt: 0.65, rotSpeed: 0.003, color: 'rgba(13, 13, 13, 0.12)', lineWidth: 1.2 },
      { radius: 240, tilt: -0.45, rotSpeed: -0.002, color: 'rgba(24, 48, 48, 0.18)', lineWidth: 1.0 },
      { radius: 290, tilt: 0.35, rotSpeed: 0.0025, color: 'rgba(192, 192, 192, 0.4)', lineWidth: 1.0 },
      { radius: 340, tilt: -0.25, rotSpeed: -0.0015, color: 'rgba(13, 13, 13, 0.08)', lineWidth: 1.0 },
    ];

    // 3D Point cloud forming a subtle geodesic sphere
    const pointCount = 140;
    const points: { x: number; y: number; z: number }[] = [];
    const sphereRadius = 150;
    for (let i = 0; i < pointCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / pointCount);
      const theta = Math.sqrt(pointCount * Math.PI) * phi;
      points.push({
        x: sphereRadius * Math.cos(theta) * Math.sin(phi),
        y: sphereRadius * Math.sin(theta) * Math.sin(phi),
        z: sphereRadius * Math.cos(phi),
      });
    }

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      if (!prefersReducedMotion) {
        angle += 0.004;
      }

      const centerX = width * 0.5;
      const centerY = height * 0.5;

      // Draw subtle radial glow in palette
      const gradient = ctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, 380);
      gradient.addColorStop(0, 'rgba(240, 240, 240, 0.9)');
      gradient.addColorStop(0.5, 'rgba(243, 243, 243, 0.4)');
      gradient.addColorStop(1, 'rgba(243, 243, 243, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 380, 0, Math.PI * 2);
      ctx.fill();

      // Draw 3D concentric orbit rings with perspective projection
      rings.forEach((ring) => {
        const ringAngle = prefersReducedMotion ? 0 : angle * (ring.rotSpeed * 180);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ring.tilt + mouse.y * 0.5);

        ctx.beginPath();
        // Elliptical perspective orbit
        const rx = ring.radius;
        const ry = ring.radius * 0.38 + mouse.x * 20;
        ctx.ellipse(0, 0, Math.max(10, rx), Math.max(5, Math.abs(ry)), ringAngle, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.lineWidth;
        ctx.stroke();

        // Orbiting beacon satellite node on the ring
        if (!prefersReducedMotion) {
          const satAngle = angle * 2 + ring.radius;
          const satX = Math.cos(satAngle) * rx;
          const satY = Math.sin(satAngle) * ry;
          ctx.beginPath();
          ctx.arc(satX, satY, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#0d0d0d';
          ctx.fill();
        }

        ctx.restore();
      });

      // Draw 3D sphere points rotated by mouse & time
      const rotY = angle * 0.5 + mouse.x * 1.5;
      const rotX = mouse.y * 1.2;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Project & sort points
      const projected = points.map((p) => {
        // Rotate around Y
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;

        // Rotate around X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Perspective projection
        const fov = 420;
        const scale = fov / (fov + z2);
        const projX = centerX + x1 * scale;
        const projY = centerY + y2 * scale;

        return { x: projX, y: projY, z: z2, scale };
      });

      // Sort back-to-front
      projected.sort((a, b) => b.z - a.z);

      // Draw subtle connecting latitude lines
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(72, 72, 72, 0.05)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projected.length - 1; i += 6) {
        if (projected[i].z > -80 && projected[i + 1].z > -80) {
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[i + 1].x, projected[i + 1].y);
        }
      }
      ctx.stroke();

      // Draw projected nodes
      projected.forEach((p) => {
        const alpha = Math.max(0.08, (p.z + sphereRadius) / (sphereRadius * 2));
        const radius = Math.max(0.8, p.scale * 1.8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(13, 13, 13, ${alpha * 0.45})`;
        ctx.fill();
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="w-full h-full opacity-90 transition-opacity duration-700"
      />
    </div>
  );
};
