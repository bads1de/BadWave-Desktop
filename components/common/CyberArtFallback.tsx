"use client";

import React, { useRef, useEffect, memo } from "react";
import useMainAnalyser from "@/hooks/audio/useMainAnalyser";

/**
 * 画像がない曲用のサイバーパンク風ビジュアライザー
 * メイン AudioEngine の AnalyserNode と連動してリアルタイム描画
 */
const CyberArtFallback = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const { analyser, isPlaying } = useMainAnalyser();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 600;
    const H = 800;
    canvas.width = W;
    canvas.height = H;

    // パーティクル
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      hue: number;
    }

    const particles: Particle[] = [];
    const PARTICLE_COUNT = 50;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.8 - 0.2,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.3,
        hue: Math.random() > 0.5 ? 160 : 280,
      });
    }

    const GRID_SPACING = 40;
    const gridCols = Math.ceil(W / GRID_SPACING) + 1;
    const gridRows = Math.ceil(H / GRID_SPACING) + 1;

    let scanY = 0;
    let time = 0;

    // 周波数データバッファ
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      time += 0.016;
      ctx.clearRect(0, 0, W, H);

      // 背景
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#050510");
      bgGrad.addColorStop(0.5, "#0a0a1a");
      bgGrad.addColorStop(1, "#0f0520");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // グリッド
      ctx.strokeStyle = "rgba(0, 255, 200, 0.04)";
      ctx.lineWidth = 0.5;
      for (let row = 0; row < gridRows; row++) {
        ctx.beginPath();
        for (let col = 0; col < gridCols; col++) {
          const x = col * GRID_SPACING;
          const wave = Math.sin(x * 0.01 + time * 0.5) * 3;
          const y =
            (row * GRID_SPACING + time * 10) % (GRID_SPACING * 2) + wave;
          if (col === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 周波数データ取得
      let hasAudioData = false;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        // データがあるか確認（無音でなければ）
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        hasAudioData = sum > 0;
      }

      const centerY = H * 0.55;
      const barCount = 48;
      const barW = W / barCount / 2;

      if (hasAudioData) {
        // === 再生中: 実データ描画 ===
        // 低域〜中域を使う（音楽的に変化が大きい）
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          // 周波数ビンをサンプリング（低域寄り）
          const idx = Math.min(i * step, bufferLength - 1);
          const val = dataArray[idx] / 255;
          const barH = val * H * 0.35;

          const x = W / 2 + (i - barCount / 2) * barW * 2;

          // グラデーション（音量で明度変化）
          const alpha = 0.15 + val * 0.5;
          const grad = ctx.createLinearGradient(
            x,
            centerY - barH,
            x,
            centerY + barH
          );
          grad.addColorStop(0, `rgba(0, 255, 200, 0)`);
          grad.addColorStop(0.3, `rgba(0, 255, 200, ${alpha * 0.4})`);
          grad.addColorStop(0.5, `rgba(0, 255, 200, ${alpha})`);
          grad.addColorStop(0.7, `rgba(120, 0, 255, ${alpha * 0.4})`);
          grad.addColorStop(1, `rgba(120, 0, 255, 0)`);

          ctx.fillStyle = grad;
          ctx.fillRect(x - barW / 2, centerY - barH, barW, barH * 2);

          // バー上部にグロー
          if (val > 0.3) {
            ctx.shadowBlur = 12 * val;
            ctx.shadowColor = "rgba(0, 255, 200, 0.6)";
            ctx.fillStyle = `rgba(0, 255, 200, ${val * 0.3})`;
            ctx.fillRect(x - barW / 2, centerY - barH, barW, 2);
            ctx.fillRect(x - barW / 2, centerY + barH - 2, barW, 2);
            ctx.shadowBlur = 0;
          }
        }

        // 中央の波形ライン（time-domain）
        const timeData = new Uint8Array(analyser!.frequencyBinCount);
        analyser!.getByteTimeDomainData(timeData);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 255, 200, 0.25)";
        ctx.lineWidth = 1.5;
        const sliceW = W / timeData.length;
        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0;
          const y = centerY + (v - 1) * H * 0.1;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * sliceW, y);
        }
        ctx.stroke();

        // パーティクル速度を音量に連動
        const avgVol =
          dataArray.reduce((a, b) => a + b, 0) / bufferLength / 255;
        for (const p of particles) {
          p.vy = -(0.2 + avgVol * 2);
          p.alpha = 0.3 + avgVol * 0.5;
        }
      } else {
        // === 停止中: アンビエントアニメーション ===
        const waveOffset = time * 0.5;
        for (let i = 0; i < barCount; i++) {
          const val = Math.abs(
            Math.sin(i * 0.3 + waveOffset) *
              Math.cos(i * 0.15 + waveOffset * 0.7) *
              0.4
          );
          const barH = val * H * 0.1;
          const x = W / 2 + (i - barCount / 2) * barW * 2;

          const grad = ctx.createLinearGradient(
            x,
            centerY - barH,
            x,
            centerY + barH
          );
          grad.addColorStop(0, "rgba(0, 255, 200, 0.0)");
          grad.addColorStop(0.5, "rgba(0, 255, 200, 0.08)");
          grad.addColorStop(1, "rgba(0, 255, 200, 0.0)");

          ctx.fillStyle = grad;
          ctx.fillRect(x - barW / 2, centerY - barH, barW, barH * 2);
        }
      }

      // 中心ライン
      ctx.shadowBlur = hasAudioData ? 20 : 10;
      ctx.shadowColor = "rgba(0, 255, 200, 0.4)";
      ctx.strokeStyle = hasAudioData
        ? "rgba(0, 255, 200, 0.25)"
        : "rgba(0, 255, 200, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.15, centerY);
      ctx.lineTo(W * 0.85, centerY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // パーティクル
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = H + 10;
          p.x = Math.random() * W;
        }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle =
          p.hue === 160
            ? `rgba(0, 255, 200, ${p.alpha})`
            : `rgba(180, 100, 255, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor =
          p.hue === 160 ? "rgba(0,255,200,0.5)" : "rgba(180,100,255,0.5)";
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // 走査ライン
      const scanSpeed = hasAudioData ? 2.5 : 1.2;
      scanY = (scanY + scanSpeed) % H;
      const scanAlpha = hasAudioData ? 0.12 : 0.05;
      const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGrad.addColorStop(0, `rgba(0, 255, 200, 0)`);
      scanGrad.addColorStop(0.5, `rgba(0, 255, 200, ${scanAlpha})`);
      scanGrad.addColorStop(1, `rgba(0, 255, 200, 0)`);
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 30, W, 60);

      // HUD コーナー
      const cornerLen = 30;
      const cornerAlpha = hasAudioData ? 0.5 : 0.3;
      ctx.strokeStyle = `rgba(0, 255, 200, ${cornerAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cornerLen);
      ctx.lineTo(0, 0);
      ctx.lineTo(cornerLen, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - cornerLen, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, cornerLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, H - cornerLen);
      ctx.lineTo(0, H);
      ctx.lineTo(cornerLen, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - cornerLen, H);
      ctx.lineTo(W, H);
      ctx.lineTo(W, H - cornerLen);
      ctx.stroke();

      // テキスト
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(0, 255, 200, 0.2)";
      ctx.textAlign = "center";
      ctx.fillText(
        isPlaying ? "[ VISUALIZING ]" : "[ NO_ARTWORK ]",
        W / 2,
        H * 0.42
      );
      ctx.fillText(
        `[ ${new Date().toISOString().slice(11, 19)} ]`,
        W / 2,
        H * 0.42 + 16
      );

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [analyser, isPlaying]);

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover opacity-80"
      />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[length:100%_4px] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)]" />
    </div>
  );
});

CyberArtFallback.displayName = "CyberArtFallback";

export default CyberArtFallback;
