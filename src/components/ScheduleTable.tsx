import { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, ListFilter, CalendarDays, Calendar, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useLoanStore } from '@/store/loanStore';
import { formatCurrency, formatMonth } from '@/utils/format';
import type { MonthlyPayment, YearlySummary } from '@/types/loan';

export default function ScheduleTable() {
  const { result, scheduleView, setScheduleView, currentPage, pageSize, setCurrentPage } = useLoanStore();
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([1]));

  if (!result) return null;

  const monthlySchedule = result.schedule;
  const yearlySchedule = result.yearlySchedule;

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const n = new Set(prev);
      if (n.has(year)) n.delete(year);
      else n.add(year);
      return n;
    });
  };

  const expandAll = () => setExpandedYears(new Set(yearlySchedule.map((y) => y.year)));
  const collapseAll = () => setExpandedYears(new Set());

  const monthlyTotalPages = Math.max(1, Math.ceil(monthlySchedule.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, monthlySchedule.length);
  const pagedMonthly: MonthlyPayment[] = monthlySchedule.slice(startIdx, endIdx);

  const renderMonthlyRow = (m: MonthlyPayment) => {
    const principalRatio = m.payment > 0 ? m.principal / m.payment : 0;
    const interestRatio = 1 - principalRatio;
    return (
      <tr key={m.month} className="border-b border-slate-100 hover:bg-teal-50/40 transition-colors group">
        <td className="px-4 py-3 text-sm text-slate-500 font-medium whitespace-nowrap">{formatMonth(m.month)}</td>
        <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right tabular-nums">¥{formatCurrency(m.payment)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3 min-w-[140px]">
            <div className="relative flex-1 h-2 rounded-full overflow-hidden bg-slate-100 flex">
              <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500" style={{ width: `${principalRatio * 100}%` }} />
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${interestRatio * 100}%` }} />
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm font-medium text-teal-700 text-right tabular-nums">¥{formatCurrency(m.principal)}</td>
        <td className="px-4 py-3 text-sm font-medium text-amber-700 text-right tabular-nums">¥{formatCurrency(m.interest)}</td>
        <td className="px-4 py-3 text-sm text-slate-600 text-right tabular-nums">¥{formatCurrency(m.remainingPrincipal)}</td>
      </tr>
    );
  };

  const renderYearlyRow = (y: YearlySummary) => {
    const principalRatio = y.totalPayment > 0 ? y.totalPrincipal / y.totalPayment : 0;
    const interestRatio = 1 - principalRatio;
    const expanded = expandedYears.has(y.year);
    return (
      <>
        <tr key={`y-${y.year}`} className={`border-b border-slate-200 bg-gradient-to-r from-slate-50/80 to-white hover:from-teal-50/60 transition-colors cursor-pointer`} onClick={() => toggleYear(y.year)}>
          <td className="px-4 py-3.5">
            <button className="flex items-center gap-2 font-semibold text-slate-900">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${expanded ? 'bg-teal-500 text-white rotate-90' : 'bg-slate-200 text-slate-500'}`}>
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <span className="text-sm">第 {y.year} 年</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium">
                {y.year === yearlySchedule.length ? `第${(y.year - 1) * 12 + 1}-${yearlySchedule.flatMap(ys => ys.monthlyDetails).length}期` : `第${(y.year - 1) * 12 + 1}-${y.year * 12}期`}
              </span>
            </button>
          </td>
          <td className="px-4 py-3.5 text-sm font-bold text-slate-900 text-right tabular-nums">¥{formatCurrency(y.totalPayment)}</td>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-3 min-w-[140px]">
              <div className="relative flex-1 h-2.5 rounded-full overflow-hidden bg-slate-200 flex">
                <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500" style={{ width: `${principalRatio * 100}%` }} />
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${interestRatio * 100}%` }} />
              </div>
              <span className="text-[11px] font-medium text-slate-500 w-8 text-right">{Math.round(principalRatio * 100)}%</span>
            </div>
          </td>
          <td className="px-4 py-3.5 text-sm font-semibold text-teal-700 text-right tabular-nums">¥{formatCurrency(y.totalPrincipal)}</td>
          <td className="px-4 py-3.5 text-sm font-semibold text-amber-700 text-right tabular-nums">¥{formatCurrency(y.totalInterest)}</td>
          <td className="px-4 py-3.5 text-sm text-slate-600 text-right tabular-nums">¥{formatCurrency(y.remainingPrincipal)}</td>
        </tr>
        {expanded && y.monthlyDetails.map((m) => (
          <tr key={`y-${y.year}-m-${m.month}`} className="border-b border-slate-100 bg-white/60 hover:bg-teal-50/30">
            <td className="px-4 py-2.5 pl-12 text-xs text-slate-500 whitespace-nowrap flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              {formatMonth(m.month)}
            </td>
            <td className="px-4 py-2.5 text-xs font-semibold text-slate-700 text-right tabular-nums">¥{formatCurrency(m.payment)}</td>
            <td className="px-4 py-2.5">
              <div className="relative h-1.5 rounded-full overflow-hidden bg-slate-100 flex min-w-[140px]">
                <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500" style={{ width: `${(m.principal / m.payment) * 100}%` }} />
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${(m.interest / m.payment) * 100}%` }} />
              </div>
            </td>
            <td className="px-4 py-2.5 text-xs font-medium text-teal-600 text-right tabular-nums">¥{formatCurrency(m.principal)}</td>
            <td className="px-4 py-2.5 text-xs font-medium text-amber-600 text-right tabular-nums">¥{formatCurrency(m.interest)}</td>
            <td className="px-4 py-2.5 text-xs text-slate-500 text-right tabular-nums">¥{formatCurrency(m.remainingPrincipal)}</td>
          </tr>
        ))}
      </>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/60 overflow-hidden animate-[fadeInUp_.5s_ease-out_200ms_both]">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-400" />
          还款计划表
          <span className="text-xs font-normal text-slate-400">
            共 {monthlySchedule.length} 期 / {yearlySchedule.length} 年
          </span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-1 rounded-xl bg-slate-100 ring-1 ring-slate-200">
            <button
              onClick={() => setScheduleView('yearly')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                scheduleView === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              按年
            </button>
            <button
              onClick={() => setScheduleView('monthly')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                scheduleView === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              按月
            </button>
          </div>
          {scheduleView === 'yearly' && (
            <div className="flex p-1 rounded-xl bg-slate-100 ring-1 ring-slate-200">
              <button
                onClick={expandAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                全部展开
              </button>
              <button
                onClick={collapseAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                全部收起
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-gradient-to-r from-slate-50 via-slate-50 to-teal-50/40 sticky top-0">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {scheduleView === 'yearly' ? '年度' : '期数'}
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                月供/年供
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pl-8">
                <ListFilter className="w-3.5 h-3.5 inline mr-1" />
                本息构成
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-teal-700 uppercase tracking-wider">本金</th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-amber-700 uppercase tracking-wider">利息</th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">剩余本金</th>
            </tr>
          </thead>
          <tbody>
            {scheduleView === 'yearly'
              ? yearlySchedule.map(renderYearlyRow)
              : pagedMonthly.map(renderMonthlyRow)}
          </tbody>
        </table>
      </div>

      {scheduleView === 'monthly' && monthlyTotalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            显示第 <span className="font-semibold text-slate-700">{startIdx + 1}</span> - <span className="font-semibold text-slate-700">{endIdx}</span> 期，共 <span className="font-semibold text-slate-700">{monthlySchedule.length}</span> 期
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-3">
              {Array.from({ length: Math.min(7, monthlyTotalPages) }, (_, i) => {
                let pageNum: number;
                const half = 3;
                if (monthlyTotalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= half + 1) {
                  pageNum = i + 1;
                } else if (currentPage >= monthlyTotalPages - half) {
                  pageNum = monthlyTotalPages - 6 + i;
                } else {
                  pageNum = currentPage - half + i;
                }
                const active = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[34px] h-8 px-2 rounded-lg text-sm font-semibold transition-all ${
                      active
                        ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25'
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === monthlyTotalPages}
              className="p-2 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(monthlyTotalPages)}
              disabled={currentPage === monthlyTotalPages}
              className="p-2 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="px-6 py-4 border-t border-slate-100 bg-gradient-to-r from-teal-50/40 via-white to-amber-50/40">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500" />
            本金部分：逐月增加，用于冲抵贷款本金
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-400" />
            利息部分：随剩余本金减少而逐月下降
          </div>
        </div>
      </div>
    </div>
  );
}
