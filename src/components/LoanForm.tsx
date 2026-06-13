import { Building2, PiggyBank, Layers, Percent, Calendar, Banknote } from 'lucide-react';
import { useLoanStore } from '@/store/loanStore';
import type { LoanMode, RepaymentMethod } from '@/types/loan';

const modeOptions: { value: LoanMode; label: string; icon: typeof Building2; desc: string }[] = [
  { value: 'commercial', label: '商业贷款', icon: Building2, desc: '纯商业贷款' },
  { value: 'provident', label: '公积金贷款', icon: PiggyBank, desc: '纯公积金贷款' },
  { value: 'combined', label: '组合贷款', icon: Layers, desc: '商贷+公积金' },
];

const methodOptions: { value: RepaymentMethod; label: string; desc: string }[] = [
  { value: 'equal-principal-interest', label: '等额本息', desc: '每月还款固定' },
  { value: 'equal-principal', label: '等额本金', desc: '月供逐月递减' },
];

const yearPresets = [5, 10, 15, 20, 25, 30];

const NumberInput = ({
  icon: Icon,
  label,
  value,
  onChange,
  suffix,
  step = 1,
  min = 0,
  max,
  placeholder,
}: {
  icon: typeof Percent;
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
}) => (
  <div>
    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
      <Icon className="w-4 h-4 text-teal-600" />
      {label}
    </label>
    <div className="relative group">
      <input
        type="number"
        value={value || ''}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(isNaN(v) ? 0 : v);
        }}
        className="w-full pl-11 pr-16 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:bg-white transition-all"
      />
      <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10 text-slate-400 group-focus-within:text-teal-500 transition-colors">
        <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
      </div>
      {suffix && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-medium text-slate-500">
          {suffix}
        </div>
      )}
    </div>
  </div>
);

export default function LoanForm() {
  const { params, setParams } = useLoanStore();
  const { mode, method, years, commercialAmount, commercialRate, providentAmount, providentRate } = params;

  const showCommercial = mode === 'commercial' || mode === 'combined';
  const showProvident = mode === 'provident' || mode === 'combined';

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/60 overflow-hidden animate-[fadeInUp_.5s_ease-out_both]">
      <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-teal-50/40 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-teal-500 to-emerald-400" />
          贷款参数设置
        </h2>
      </div>

      <div className="p-6 space-y-7">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">贷款类型</label>
          <div className="grid grid-cols-3 gap-2.5">
            {modeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setParams({ mode: opt.value })}
                  className={`group relative flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 transition-all duration-300 ${
                    active
                      ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 shadow-md shadow-teal-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                    <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                  </div>
                  <span className={`text-[13px] font-semibold ${active ? 'text-teal-700' : 'text-slate-700'}`}>{opt.label}</span>
                  <span className="text-[11px] text-slate-400">{opt.desc}</span>
                  {active && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_0_3px_rgba(20,184,166,0.15)]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">还款方式</label>
          <div className="grid grid-cols-2 gap-3">
            {methodOptions.map((opt) => {
              const active = method === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setParams({ method: opt.value })}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
                    active
                      ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md shadow-amber-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`text-[15px] font-bold mb-0.5 ${active ? 'text-amber-700' : 'text-slate-800'}`}>{opt.label}</div>
                  <div className="text-[12px] text-slate-500">{opt.desc}</div>
                  {active && <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-teal-600" />
            贷款年限
          </label>
          <div className="grid grid-cols-6 gap-2 mb-3">
            {yearPresets.map((y) => (
              <button
                key={y}
                onClick={() => setParams({ years: y })}
                className={`py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  years === y
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25 scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {y}年
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="range"
              min={1}
              max={30}
              value={years}
              onChange={(e) => setParams({ years: parseInt(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none bg-slate-200 cursor-pointer accent-teal-500"
              style={{
                background: `linear-gradient(to right, #14b8a6 0%, #10b981 ${(years / 30) * 100}%, #e2e8f0 ${(years / 30) * 100}%, #e2e8f0 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1.5">
              <span>1年</span>
              <span className="font-semibold text-teal-600">{years}年 ({years * 12}期)</span>
              <span>30年</span>
            </div>
          </div>
        </div>

        {showCommercial && (
          <div className={`space-y-4 p-5 rounded-2xl ${mode === 'combined' ? 'bg-gradient-to-br from-blue-50/80 to-slate-50 ring-1 ring-blue-100' : ''}`}>
            {mode === 'combined' && (
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Building2 className="w-4 h-4" />
                商业贷款部分
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                icon={Banknote}
                label={mode === 'combined' ? '商贷金额' : '贷款总额'}
                value={commercialAmount}
                onChange={(v) => setParams({ commercialAmount: v })}
                suffix="万元"
                step={1}
                min={0}
                max={10000}
              />
              <NumberInput
                icon={Percent}
                label={mode === 'combined' ? '商贷利率' : '年利率'}
                value={commercialRate}
                onChange={(v) => setParams({ commercialRate: v })}
                suffix="%"
                step={0.01}
                min={0}
              />
            </div>
          </div>
        )}

        {showProvident && (
          <div className={`space-y-4 p-5 rounded-2xl ${mode === 'combined' ? 'bg-gradient-to-br from-orange-50/80 to-amber-50 ring-1 ring-orange-100' : ''}`}>
            {mode === 'combined' && (
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                <PiggyBank className="w-4 h-4" />
                公积金贷款部分
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                icon={Banknote}
                label={mode === 'combined' ? '公积金金额' : '贷款总额'}
                value={providentAmount}
                onChange={(v) => setParams({ providentAmount: v })}
                suffix="万元"
                step={1}
                min={0}
                max={10000}
              />
              <NumberInput
                icon={Percent}
                label={mode === 'combined' ? '公积金利率' : '年利率'}
                value={providentRate}
                onChange={(v) => setParams({ providentRate: v })}
                suffix="%"
                step={0.01}
                min={0}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
