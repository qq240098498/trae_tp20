import { useEffect, useRef } from 'react';
import { useLoanStore } from '@/store/loanStore';
import { formatCurrencyWan } from '@/utils/format';

export default function PieChart() {
  const { result } = useLoanStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const principal = result.totalPrincipal;
    const interest = result.totalInterest;
    const total = principal + interest;
    if (total === 0) return;

    const cx = w / 2 - 40;
    const cy = h / 2;
    const outerR = Math.min(cx, cy, h / 2) - 10;
    const innerR = outerR * 0.62;

    const pAngle = (principal / total) * Math.PI * 2;
    const iAngle = (interest / total) * Math.PI * 2;

    const drawSegment = (startAngle: number, endAngle: number, colorStart: string, colorEnd: string) => {
      const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      grad.addColorStop(0, colorStart);
      grad.addColorStop(1, colorEnd);
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawSegment(-Math.PI / 2 - pAngle, -Math.PI / 2, '#0d9488', '#10b981');
    drawSegment(-Math.PI / 2, -Math.PI / 2 + iAngle, '#f59e0b', '#fb923c');

    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    const legendX = cx + outerR + 30;
    const legendStartY = cy - 28;

    ctx.beginPath();
    ctx.arc(legendX + 7, legendStartY, 6, 0, Math.PI * 2);
    const g1 = ctx.createRadialGradient(legendX + 7, legendStartY, 0, legendX + 7, legendStartY, 6);
    g1.addColorStop(0, '#10b981');
    g1.addColorStop(1, '#0d9488');
    ctx.fillStyle = g1;
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText('本金', legendX + 20, legendStartY + 4);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(formatCurrencyWan(principal), legendX + 20, legendStartY + 22);

    ctx.beginPath();
    ctx.arc(legendX + 7, legendStartY + 48, 6, 0, Math.PI * 2);
    const g2 = ctx.createRadialGradient(legendX + 7, legendStartY + 48, 0, legendX + 7, legendStartY + 48, 6);
    g2.addColorStop(0, '#fb923c');
    g2.addColorStop(1, '#f59e0b');
    ctx.fillStyle = g2;
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText('利息', legendX + 20, legendStartY + 52);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(formatCurrencyWan(interest), legendX + 20, legendStartY + 70);
  }, [result]);

  if (!result || result.totalPrincipal === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 ring-1 ring-slate-200/60 shadow-lg shadow-slate-900/5">
      <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-teal-500 to-emerald-400" />
        本息构成
      </h3>
      <canvas ref={canvasRef} className="w-full" style={{ height: '180px' }} />
    </div>
  );
}
