import React, { useEffect, useRef } from 'react';

export const BiosensorTelemetry: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      for (let x = 0; x < canvas.width; x++) {
        const y = Math.sin((x + frame) * 0.05) * 20 + canvas.height / 2;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      frame += 2;
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="font-semibold text-slate-800 mb-4">Live Biosensor Waveform</h3>
      <canvas ref={canvasRef} width={400} height={100} className="w-full bg-slate-50 rounded" />
    </div>
  );
};
