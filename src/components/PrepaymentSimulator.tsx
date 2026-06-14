import { useState, useMemo } from 'react';
import { Calculator, TrendingDown, Clock, DollarSign, Plus, X, CheckCircle2, ArrowRight, Sparkles, Wallet, Target, TrendingUp } from 'lucide-react';
import { useLoanStore } from '@/store/loanStore';
import { formatCurrencyWan, formatCurrency } from '@/utils/format';
import { calculateLoanRecommendation, findOptimalLoanTerm } from '@/utils/calculator';
import type { PrepaymentEntry } from '@/types/loan';

export default function PrepaymentSimulator() {
  const {
    params,
    prepaymentEntries,
    prepaymentResult,
    setPrepaymentEntries,
    addPrepaymentEntry,
    removePrepaymentEntry,
    setParams,
  } = useLoanStore();

  const [newYear, setNewYear] = useState<number>(3);
  const [newAmount, setNewAmount] = useState<number>(10);

  const totalLoanAmount = useMemo(() => {
    if (params.mode === 'commercial') return params.commercialAmount;
    if (params.mode === 'provident') return params.providentAmount;
    return params.commercialAmount + params.providentAmount;
  }, [params]);

  const currentRate = useMemo(() => {
    if (params.mode === 'commercial') return params.commercialRate;
    if (params.mode === 'provident') return params.providentRate;
    const total = params.commercialAmount + params.providentAmount;
    if (total === 0) return params.commercialRate;
    return (params.commercialAmount * params.commercialRate + params.providentAmount * params.providentRate) / total;
  }, [params]);

  const recommendation = useMemo(() => {
    return calculateLoanRecommendation(params.monthlySalary, currentRate, params.years, 0.5);
  }, [params.monthlySalary, currentRate, params.years]);

  const optimalTerm = useMemo(() => {
    return findOptimalLoanTerm(params.monthlySalary, currentRate, totalLoanAmount, 0.5);
  }, [params.monthlySalary, currentRate, totalLoanAmount]);

  const handleAddEntry = () => {
    if (newYear > 0 && newYear < params.years && newAmount > 0) {
      addPrepaymentEntry({ year: newYear, amount: newAmount });
    }
  };

  const handleUpdateEntry = (index: number, field: keyof PrepaymentEntry, value: number) => {
    const updated = [...prepaymentEntries];
    updated[index] = { ...updated[index], [field]: value };
    setPrepaymentEntries(updated);
  };

  const totalPrepaymentAmount = prepaymentEntries.reduce((sum, e) => sum + e.amount, 0);

  const shortenTerm = prepaymentResult?.strategies.find(s => s.strategy === 'shorten-term');
  const reducePayment = prepaymentResult?.strategies.find(s => s.strategy === 'reduce-payment');
  const isShortenBetter = prepaymentResult?.recommendedStrategy === 'shorten-term';

  const savedInterestDiff = shortenTerm && reducePayment
    ? Math.abs(shortenTerm.savedInterest - reducePayment.savedInterest)
    : 0;
  const maxSavedInterest = shortenTerm && reducePayment
    ? Math.max(shortenTerm.savedInterest, reducePayment.savedInterest)
    : 0;
  const savedInterestPercent = prepaymentResult && prepaymentResult.originalTotalInterest > 0
    ? (maxSavedInterest / prepaymentResult.originalTotalInterest) * 100
    : 0;

  const shortenMonths = shortenTerm && prepaymentResult
    ? prepaymentResult.originalTermMonths - shortenTerm.newTermMonths
    : 0;
  const shortenYears = Math.floor(shortenMonths / 12);
  const shortenRemainMonths = shortenMonths % 12;

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/60 overflow-hidden animate-[fadeInUp_.6s_ease-out_both]">
      <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-pink-50/40 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
          提前还款模拟
        </h2>
        <p className="text-sm text-slate-500 mt-1">输入提前还款计划，对比两种方案的节省效果</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-purple-600" />
            月薪设置
          </label>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">月收入</label>
              <div className="relative">
                <input
                  type="number"
                  value={params.monthlySalary || ''}
                  onChange={(e) => setParams({ monthlySalary: parseInt(e.target.value) || 0 })}
                  min={0}
                  step={1000}
                  placeholder="请输入月收入"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 focus:bg-white transition-all"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-medium text-slate-500">
                  元
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-xs font-medium text-slate-500">智能推荐</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 ring-1 ring-purple-200/60">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">推荐贷款额度</h3>
                <p className="text-xs text-slate-500">月供占月薪 50%</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">推荐总额度</span>
                <span className="text-xl font-bold text-purple-600">
                  {formatCurrencyWan(recommendation.recommendedAmount * 10000, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">每月还款</span>
                <span className="text-sm font-semibold text-slate-700">
                  {formatCurrency(recommendation.monthlyPayment)}元
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">总利息</span>
                <span className="text-sm font-semibold text-amber-600">
                  {formatCurrencyWan(recommendation.totalInterest, 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-emerald-200/60">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">推荐贷款期数</h3>
                <p className="text-xs text-slate-500">基于当前贷款额度</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">推荐年限</span>
                <span className="text-xl font-bold text-emerald-600">
                  {optimalTerm.years}年
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">还款期数</span>
                <span className="text-sm font-semibold text-slate-700">
                  {optimalTerm.months}期
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">每月还款</span>
                <span className={`text-sm font-semibold ${optimalTerm.isAffordable ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatCurrency(optimalTerm.monthlyPayment)}元
                </span>
              </div>
            </div>
            {!optimalTerm.isAffordable && (
              <div className="mt-3 p-2.5 bg-red-50 rounded-lg text-xs text-red-600 flex items-start gap-1.5">
                <span className="mt-0.5">⚠️</span>
                <span>当前贷款额度超出月供承受能力，建议延长贷款年限或减少贷款额度</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl ring-1 ring-amber-200/60">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium">舒适贷款额度</p>
              <p className="text-xs text-amber-600 mt-0.5">
                月供占月薪 30%，生活更轻松：
                <span className="font-bold ml-1">{formatCurrencyWan(recommendation.comfortableAmount * 10000, 0)}</span>
                （月供约 {formatCurrency(recommendation.comfortableMonthlyPayment)}元）
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-xs font-medium text-slate-500">提前还款模拟</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-purple-600" />
            提前还款计划
          </label>

          <div className="space-y-2 mb-4">
            {prepaymentEntries.map((entry, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">还款时间</label>
                    <div className="flex items-center">
                      <span className="text-sm text-slate-500 mr-1.5">第</span>
                      <input
                        type="number"
                        value={entry.year}
                        onChange={(e) => handleUpdateEntry(index, 'year', parseInt(e.target.value) || 0)}
                        min={1}
                        max={params.years - 1}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
                      />
                      <span className="ml-1.5 text-sm text-slate-500">年末</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">还款金额</label>
                    <div className="flex items-center">
                      <span className="text-sm text-slate-500 mr-1.5">还</span>
                      <input
                        type="number"
                        value={entry.amount}
                        onChange={(e) => handleUpdateEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                        min={1}
                        step={1}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
                      />
                      <span className="ml-1.5 text-sm text-slate-500">万</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removePrepaymentEntry(index)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {prepaymentEntries.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {prepaymentEntries.map((entry, index) => (
                <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                  第{entry.year}年还{entry.amount}万
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">第几年末</label>
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(parseInt(e.target.value) || 0)}
                min={1}
                max={params.years - 1}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">还款金额（万元）</label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                min={1}
                step={1}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
              />
            </div>
            <button
              onClick={handleAddEntry}
              disabled={newYear <= 0 || newYear >= params.years || newAmount <= 0}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">计划提前还款总额</span>
              <span className="text-lg font-bold text-purple-600">{formatCurrencyWan(totalPrepaymentAmount * 10000, 0)}</span>
            </div>
          </div>
        </div>

        {!prepaymentResult && prepaymentEntries.length === 0 && (
          <div className="p-6 bg-slate-50 rounded-2xl text-center">
            <p className="text-slate-500 text-sm">请添加提前还款计划（如「第3年还10万」），即可对比两种方案的节省效果</p>
          </div>
        )}

        {prepaymentResult && shortenTerm && reducePayment && (
          <>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-xs font-medium text-slate-500">方案对比</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`relative p-5 rounded-2xl border-2 transition-all ${
            isShortenBetter
              ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg shadow-purple-500/10'
              : 'border-slate-200 bg-white'
          }`}>
            {isShortenBetter && (
              <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                更优方案
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-xl ${isShortenBetter ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">缩短年限</h3>
                <p className="text-xs text-slate-500">保持月供不变，提前还清</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">新还款期限</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-800">
                    {Math.ceil(shortenTerm.newTermMonths / 12)}年
                  </span>
                  <span className="text-sm text-slate-400 ml-1">
                    ({shortenTerm.newTermMonths}期)
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">缩短时间</span>
                <span className="text-sm font-semibold text-green-600">
                  {shortenYears > 0 && `${shortenYears}年`}{shortenRemainMonths > 0 && `${shortenRemainMonths}个月`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">每月还款</span>
                <span className="text-sm font-semibold text-slate-700">
                  {formatCurrency(prepaymentResult.originalMonthlyPayment)}元
                </span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">节省利息</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrencyWan(shortenTerm.savedInterest)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">总利息</span>
                <span className="text-sm text-slate-600">
                  {formatCurrencyWan(shortenTerm.totalInterest)}
                </span>
              </div>
            </div>
          </div>

          <div className={`relative p-5 rounded-2xl border-2 transition-all ${
            !isShortenBetter
              ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg shadow-purple-500/10'
              : 'border-slate-200 bg-white'
          }`}>
            {!isShortenBetter && (
              <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                更优方案
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-xl ${!isShortenBetter ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">减少月供</h3>
                <p className="text-xs text-slate-500">保持期限不变，降低月供</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">新每月还款</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-800">
                    {formatCurrency(reducePayment.newMonthlyPayment)}
                  </span>
                  <span className="text-sm text-slate-400 ml-1">元</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">每月减少</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(prepaymentResult.originalMonthlyPayment - reducePayment.newMonthlyPayment)}元
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">还款期限</span>
                <span className="text-sm font-semibold text-slate-700">
                  {params.years}年 ({params.years * 12}期)
                </span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">节省利息</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrencyWan(reducePayment.savedInterest)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">总利息</span>
                <span className="text-sm text-slate-600">
                  {formatCurrencyWan(reducePayment.totalInterest)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl ring-1 ring-green-200/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-800">节省利息对比</span>
            <span className="text-xs text-green-600">最多可节省原利息的 {savedInterestPercent.toFixed(1)}%</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600">缩短年限</span>
                <span className="font-semibold text-green-700">{formatCurrencyWan(shortenTerm.savedInterest)}</span>
              </div>
              <div className="h-2.5 bg-green-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${maxSavedInterest > 0 ? (shortenTerm.savedInterest / maxSavedInterest) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600">减少月供</span>
                <span className="font-semibold text-green-700">{formatCurrencyWan(reducePayment.savedInterest)}</span>
              </div>
              <div className="h-2.5 bg-green-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full transition-all duration-700"
                  style={{ width: `${maxSavedInterest > 0 ? (reducePayment.savedInterest / maxSavedInterest) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">智能推荐</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                建议选择
                <span className="text-yellow-400 font-bold mx-1">
                  {isShortenBetter ? '「缩短年限」' : '「减少月供」'}
                </span>
                方案，可多节省利息
                <span className="text-green-400 font-bold mx-1">
                  {formatCurrencyWan(savedInterestDiff)}
                </span>
                。
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-green-400" />
                  <span>原总利息: {formatCurrencyWan(prepaymentResult.originalTotalInterest)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-yellow-400" />
                  <span>最多可省: {formatCurrencyWan(maxSavedInterest)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
