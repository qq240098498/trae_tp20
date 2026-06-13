import { useEffect, useRef, useState } from 'react';
import { useLoanStore } from '@/store/loanStore';
import { formatCurrency, formatCurrencyWan } from '@/utils/format';
import { Building2, PiggyBank } from 'lucide-react';

const ANIMATION_DURATION = 900;

function useAnimatedNumber(target: number, deps: unknown[] = []): number {
  const [value, setValue] = useState(target);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = value;
    startRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / ANIMATION_DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ...deps]);

  return value;
}

export default function ResultCard() {
  const { result, params } = useLoanStore();
  const isEPI = params.method === 'equal-principal-interest';

  const first = useAnimatedNumber(result?.monthlyPaymentFirst ?? 0, [result?.monthlyPaymentFirst]);
  const last = useAnimatedNumber(result?.monthlyPaymentLast ?? 0, [result?.monthlyPaymentLast]);
  const avg = useAnimatedNumber(result?.monthlyPaymentAvg ?? 0, [result?.monthlyPaymentAvg]);
  const total = useAnimatedNumber(result?.totalPayment ?? 0, [result?.totalPayment]);
  const interest = useAnimatedNumber(result?.totalInterest ?? 0, [result?.totalInterest]);
  const principal = useAnimatedNumber(result?.totalPrincipal ?? 0, [result?.totalPrincipal]);

  const commInterest = useAnimatedNumber(result?.commercialPart?.totalInterest ?? 0, [result?.commercialPart?.totalInterest]);
  const provInterest = useAnimatedNumber(result?.providentPart?.totalInterest ?? 0, [result?.providentPart?.totalInterest]);
  const commTotal = useAnimatedNumber(result?.commercialPart?.totalPayment ?? 0, [result?.commercialPart?.totalPayment]);
  const provTotal = useAnimatedNumber(result?.providentPart?.totalPayment ?? 0, [result?.providentPart?.totalPayment]);

  const interestRatio = principal > 0 ? (interest / (principal + interest)) * 100 : 0;
  const principalRatio = principal > 0 ? (principal / (principal + interest)) * 100 : 0;

  if (!result || principal === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/60 p-12 flex flex-col items-center justify-center animate-[fadeInUp_.5s_ease-out_both]">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        </div>
        <div className="text-slate-500 text-center">
          <div className="font-medium">请输入有效的贷款参数</div>
          <div className="text-sm text-slate-400 mt-1">贷款金额需大于 0 万元</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-[fadeInUp_.5s_ease-out_100ms_both]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#2a5485] to-[#0d9488] rounded-3xl shadow-2xl shadow-teal-900/20 text-white p-7">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-teal-400/15 blur-2xl" />
          <div className="absolute -bottom-20 -left-12 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="relative space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/70 text-sm mb-1">{isEPI ? '每月固定还款' : '首月还款'}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tabular-nums tracking-tight" style={{ fontFamily: '"Noto Serif SC", Georgia, serif' }}>
                  ¥{formatCurrency(first)}
                </span>
              </div>
              {!isEPI && (
                <div className="text-white/60 text-sm mt-1 flex items-center gap-2">
                  <span>末月：¥{formatCurrency(last)}</span>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span>平均：¥{formatCurrency(avg)}</span>
                </div>
              )}
            </div>
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" className="text-white/15" fill="none" />
                <circle
                  cx="50" cy="50" r="42"
                  stroke="url(#gradRing)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(interestRatio / 100) * 264} 264`}
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="gradRing" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fcd34d" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[11px] text-white/60">利息比</div>
                <div className="text-xl font-bold tabular-nums text-amber-300">{interestRatio.toFixed(0)}%</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-5 border-t border-white/10">
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm ring-1 ring-white/10">
              <div className="text-white/60 text-xs mb-1.5">还款总额</div>
              <div className="text-2xl font-bold tabular-nums">¥{formatCurrencyWan(total)}</div>
              <div className="text-[11px] text-white/50 mt-1">¥{formatCurrency(total)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-400/10 backdrop-blur-sm ring-1 ring-amber-400/20">
              <div className="text-amber-200/80 text-xs mb-1.5">支付利息</div>
              <div className="text-2xl font-bold tabular-nums text-amber-200">¥{formatCurrencyWan(interest)}</div>
              <div className="text-[11px] text-amber-200/60 mt-1">¥{formatCurrency(interest)}</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-white/60 mb-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-400" />本金 ¥{formatCurrencyWan(principal)}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />利息 ¥{formatCurrencyWan(interest)}</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden bg-white/10 ring-1 ring-white/10 flex">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${principalRatio}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700 ease-out"
                style={{ width: `${interestRatio}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {result.commercialPart && result.providentPart && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 ring-1 ring-slate-200/60 shadow-lg shadow-slate-900/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Building2 className="w-4 h-4" /></div>
              <span className="font-semibold text-slate-800 text-sm">商业贷款</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-xs text-slate-500">还款总额</span>
                <span className="text-sm font-bold tabular-nums text-slate-800">¥{formatCurrencyWan(commTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-slate-500">支付利息</span>
                <span className="text-sm font-bold tabular-nums text-amber-600">¥{formatCurrencyWan(commInterest)}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 ring-1 ring-slate-200/60 shadow-lg shadow-slate-900/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><PiggyBank className="w-4 h-4" /></div>
              <span className="font-semibold text-slate-800 text-sm">公积金贷款</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-xs text-slate-500">还款总额</span>
                <span className="text-sm font-bold tabular-nums text-slate-800">¥{formatCurrencyWan(provTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-slate-500">支付利息</span>
                <span className="text-sm font-bold tabular-nums text-orange-600">¥{formatCurrencyWan(provInterest)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
