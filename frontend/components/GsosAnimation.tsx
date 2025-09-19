"use client";
import { useEffect, useRef, useState } from "react";

export default function GsosAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let width = 900, height = 460;

    function resize() {
      const w = parentRef.current?.clientWidth ?? 900;
      width = Math.min(1100, Math.max(640, w));
      height = Math.round(width * 0.5);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (parentRef.current) ro.observe(parentRef.current);

    const nodes = [
      { label: "Identity", color: "#22c55e", baseAngle: 0 },
      { label: "Finance", color: "#f59e0b", baseAngle: 60 },
      { label: "Logistics", color: "#3b82f6", baseAngle: 120 },
      { label: "Compliance", color: "#8b5cf6", baseAngle: 180 },
      { label: "Risk", color: "#ef4444", baseAngle: 240 },
      { label: "Data", color: "#06b6d4", baseAngle: 300 },
    ];

    function draw(now: number) {
      const t = now / 1000;
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2, cy = height / 2;
      const orbitR = Math.min(width, height) * 0.28;

      // glowing orbit
      ctx.beginPath();
      ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(99,102,241,0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      const pts = nodes.map((n, i) => {
        const ang = ((n.baseAngle) * Math.PI) / 180 + t * 0.4;
        return { ...n, x: cx + Math.cos(ang) * orbitR, y: cy + Math.sin(ang) * orbitR };
      });

      // hub
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.fillStyle = "black";
      ctx.shadowColor = "rgba(99,102,241,0.7)";
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "white";
      ctx.font = "600 13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GSOS Core", cx, cy);

      // nodes
      pts.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, hover === p.label ? 22 : 16, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        ctx.fillStyle = "#111827";
        ctx.font = "600 12px Inter, sans-serif";
        ctx.fillText(p.label, p.x, p.y + 30);
      });

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [hover]);

  return (
    <div ref={parentRef} className="w-full rounded-2xl border bg-white shadow p-4">
      <h3 className="text-xl font-semibold mb-2 text-gray-900 text-center">
        How GSOS Orchestrates Trust
      </h3>
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl cursor-pointer"
        onMouseMove={(e) => {
          // placeholder: you can later add tooltip detection for hover
        }}
      />
    </div>
  );
}
