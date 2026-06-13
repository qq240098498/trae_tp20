import { useEffect, useRef } from 'react';
import { useLoanStore } from '@/store/loanStore';
import { formatCurrencyWan } from '@/utils/format';

export default function BarChart() {
  const { result } = useLoanStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<{ x: number; y: number; idx: number } | null>(null);

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

    const data = result.yearlySchedule;
    if (data.length === 0) return;

    const padding = { top: 20, right: 16, bottom: 34, left: 44 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map((d) => d.totalPayment));
    const barCount = data.length;
    const groupWidth = chartW / barCount;
    const barWidth = Math.min(groupWidth * 0.55, 28);

    const ySteps = 4;
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (chartH / ySteps) * i;
      const val = maxVal * (1 - i / ySteps);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
      ctx.fillText(formatCurrencyWan(val, 0), padding.left - 6, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.forEach((d, i) => {
      const x = padding.left + groupWidth * i + groupWidth / 2;
      if (barCount <= 12 || i % Math.ceil(barCount / 10) === 0 || i === barCount - 1) {
        ctx.fillStyle = '#64748b';
        ctx.fillText(`${d.year}`, x, padding.top + chartH + 8);
      }
    });

    data.forEach((d, i) => {
      const cx = padding.left + groupWidth * i + groupWidth / 2;
      const pRatio = d.totalPayment > 0 ? d.totalPrincipal / d.totalPayment : 0;
      const totalH = (d.totalPayment / maxVal) * chartH;
      const pH = totalH * pRatio;
      const iH = totalH - pH;

      const isHover = hoverRef.current?.idx === i;
      const bw = isHover ? barWidth + 3 : barWidth;
      const bx = cx - bw / 2;
      const pY = padding.top + chartH - totalH;

      const shadowBlur = isHover ? 12 : 4;
      const shadowColor = isHover ? 'rgba(13,148,136,0.3)' : 'rgba(0,0,0,0.08)';
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetY = 2;

      const iGrad = ctx.createLinearGradient(bx, pY, bx, pY + iH);
      iGrad.addColorStop(0, '#fb923c');
      iGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = iGrad;
      ctx.beginPath();
      const r = Math.min(bw / 2, 4);
      roundRect(ctx, bx, pY, bw, iH, r, r, 0, 0);
      ctx.fill();

      const pGrad = ctx.createLinearGradient(bx, pY + iH, bx, pY + iH + pH);
      pGrad.addColorStop(0, '#10b981');
      pGrad.addColorStop(1, '#0d9488');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      roundRect(ctx, bx, pY + iH, bw, pH, 0, 0, r, r);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      if (isHover) {
        const tooltip = `第${d.year}年 还款${formatCurrencyWan(d.totalPayment)} 利息${formatCurrencyWan(d.totalInterest)}`;
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        const tw = ctx.measureText(tooltip).width + 16;
        const tx = Math.min(Math.max(cx - tw / 2, 4), w - tw - 4);
        const ty = pY - 28;
        ctx.fillStyle = '#0f172a';
        roundRect(ctx, tx, ty, tw, 22, 6, 6, 6, 6);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        ctx.fillText(tooltip, cx, ty + 11);
        ctx.textBaseline = 'top';
      }
    });
  }, [result, hoverRef.current?.idx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: MouseEvent) => {
      if (!result) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const padding = { top: 20, right: 16, bottom: 34, left: 44 };
      const chartW = canvas.clientWidth - padding.left - padding.right;
      const data = result.yearlySchedule;
      const groupWidth = chartW / data.length;
      let found = -1;
      for (let i = 0; i < data.length; i++) {
        const cx = padding.left + groupWidth * i + groupWidth / 2;
        if (Math.abs(mx - cx) < groupWidth * 0.4 && my >= padding.top && my <= canvas.clientHeight - padding.bottom) {
          found = i;
          break;
        }
      }
      if (found !== hoverRef.current?.idx) {
        hoverRef.current = found >= 0 ? { x: mx, y: my, idx: found } : null;
        const ev = new CustomEvent('repaint');
        canvas.dispatchEvent(ev);
      }
    };
    const onLeave = () => {
      if (hoverRef.current) {
        hoverRef.current = null;
        const ev = new CustomEvent('repaint');
        canvas?.dispatchEvent(ev);
      }
    };
    const onRepaint = () => {
      const store = useLoanStore.getState();
      store.setScheduleView(store.scheduleView);
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('repaint', onRepaint);
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('repaint', onRepaint);
    };
  }, [result]);

  if (!result || result.yearlySchedule.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 ring-1 ring-slate-200/60 shadow-lg shadow-slate-900/5">
      <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-amber-500 to-orange-400" />
        年度还款趋势
      </h3>
      <div className="flex gap-4 text-[11px] text-slate-500 mb-2">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gradient-to-b from-teal-400 to-teal-600" />本金</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gradient-to-b from-amber-400 to-orange-400" />利息</span>
      </div>
      <canvas ref={canvasRef} className="w-full cursor-crosshair" style={{ height: '220px' }} />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  tl: number, tr: number, br: number, bl: number,
) {
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}
