import { create } from 'zustand';
import type { LoanParams, CalculationResult, ScheduleView } from '@/types/loan';
import { calculateLoan } from '@/utils/calculator';

interface LoanState {
  params: LoanParams;
  result: CalculationResult | null;
  scheduleView: ScheduleView;
  currentPage: number;
  pageSize: number;
  setParams: (partial: Partial<LoanParams>) => void;
  setScheduleView: (view: ScheduleView) => void;
  setCurrentPage: (page: number) => void;
  recalculate: () => void;
}

const defaultParams: LoanParams = {
  mode: 'commercial',
  commercialAmount: 100,
  commercialRate: 3.45,
  providentAmount: 60,
  providentRate: 2.85,
  years: 30,
  method: 'equal-principal-interest',
};

export const useLoanStore = create<LoanState>((set, get) => ({
  params: defaultParams,
  result: calculateLoan(defaultParams),
  scheduleView: 'monthly',
  currentPage: 1,
  pageSize: 24,
  setParams: (partial) => {
    const newParams = { ...get().params, ...partial };
    const result = calculateLoan(newParams);
    set({ params: newParams, result, currentPage: 1 });
  },
  setScheduleView: (view) => set({ scheduleView: view, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  recalculate: () => {
    const result = calculateLoan(get().params);
    set({ result });
  },
}));
