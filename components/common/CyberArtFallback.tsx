"use client";

import React, { memo, useEffect, useRef } from "react";
import useMainAnalyser from "@/hooks/audio/useMainAnalyser";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

/**
 * Premium, generative abstract artwork shown when a cover image is missing.
 * Replaces the old radar with a sleek, glowing, music-reactive organic aura.
 */
const CyberArtFallback = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const { analyser, isPlaying } = useMainAnalyser();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const W = CANVAS_WIDTH;
    const H = CANVAS_HEIGHT;
    canvas.width = W;
    canvas.height = H;

    // Extract theme colors or use vibrant fallbacks (cyan and pink)
    const styles = getComputedStyle(document.documentElement);
    const primaryStr = styles.getPropertyValue("--theme-500").trim() || "6, 182, 212";
    const secondaryStr = styles.getPropertyValue("--theme-600").trim() || "219, 39, 119";

    // Dust particles
    const particles = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4 - 0.3,
      baseAlpha: Math.random() * 0.4 + 0.1,
    }));

    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    let time = 0;

    const render = () => {
      time += 0.008;

      let bass = 0;
      let mid = 0;
      let treble = 0;
      let hasAudio = false;

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > 0) hasAudio = true;
          if (i < bufferLength * 0.1) bass += dataArray[i];
          else if (i < bufferLength * 0.5) mid += dataArray[i];
          else treble += dataArray[i];
        }
        bass /= bufferLength * 0.1 * 255;
        mid /= bufferLength * 0.4 * 255;
        treble /= bufferLength * 0.5 * 255;
      }

      const activePulse = hasAudio ? bass : (Math.sin(time * 2) + 1) * 0.1;

      // 1. Deep Space Background
      ctx.fillStyle = "#030305";
      ctx.fillRect(0, 0, W, H);

      // 2. Ambient Glowing Orbs
      ctx.globalCompositeOperation = "screen";

      const drawOrb = (x: number, y: number, r: number, colorStr: string, alpha: number) => {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${colorStr}, ${alpha})`);
        grad.addColorStop(0.5, `rgba(${colorStr}, ${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${colorStr}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };

      // Primary Orb
      const orb1X = W * 0.5 + Math.sin(time * 1.1) * 120;
      const orb1Y = H * 0.4 + Math.cos(time * 0.8) * 120;
      drawOrb(orb1X, orb1Y, 350 + activePulse * 150, primaryStr, 0.25 + activePulse * 0.2);

      // Secondary Orb
      const orb2X = W * 0.5 + Math.sin(time * 1.3 + Math.PI) * 140;
      const orb2Y = H * 0.6 + Math.cos(time * 0.9 + Math.PI) * 140;
      drawOrb(orb2X, orb2Y, 300 + mid * 100, secondaryStr, 0.2 + mid * 0.2);

      ctx.globalCompositeOperation = "source-over";

      // 3. Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy - activePulse * 1.5;

        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;

        const pulseAlpha = hasAudio ? treble * 0.6 : Math.sin(time * 4 + p.x) * 0.2 + 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.baseAlpha + pulseAlpha)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + (hasAudio ? treble * 1.5 : 0), 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Center Audio Ring (Smooth Organic Morphing)
      const cx = W / 2;
      const cy = H / 2;
      const baseRadius = 140;
      const numPoints = 64;
      const points = [];

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
        // Mirror data for symmetrical shape
        const dataIdx = Math.floor(
          (Math.abs(i - numPoints / 2) / (numPoints / 2)) * (bufferLength * 0.6)
        );
        const val = hasAudio
          ? dataArray[dataIdx] / 255
          : (Math.sin(i * 0.3 + time * 3) + 1) * 0.05;

        const r = baseRadius + val * 80;
        points.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        });
      }

      // Draw smooth curve
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < numPoints; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % numPoints];
        const xc = (p1.x + p2.x) / 2;
        const yc = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
      }
      ctx.closePath();

      // Outer Glow
      ctx.lineWidth = 4;
      ctx.strokeStyle = `rgba(255, 255, 255, 0.9)`;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `rgba(${primaryStr}, 0.8)`;
      ctx.stroke();

      // Inner Fill (slight translucency)
      ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;
      ctx.fill();

      ctx.shadowBlur = 0; // reset shadow

      // Inner subtle core ring
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius - 20 - activePulse * 10, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${secondaryStr}, ${0.4 + activePulse * 0.4})`;
      ctx.stroke();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [analyser, isPlaying]);

  return (
    <div
      data-testid="cyber-art-fallback"
      className="absolute inset-0 isolate overflow-hidden bg-[#030305] pointer-events-none rounded-md"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover transition-opacity duration-1000"
      />

      {/* Premium Glassmorphism Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_30%,rgba(0,0,0,0.6)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-black/40" />

      {/* Sleek Minimalist Border Overlay */}
      <div className="absolute inset-4 rounded-xl border border-white/[0.06] shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]" />
    </div>
  );
});

CyberArtFallback.displayName = "CyberArtFallback";

export default CyberArtFallback;

