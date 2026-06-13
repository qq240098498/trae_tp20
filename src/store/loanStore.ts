import { create } from 'zustand';
import type { LoanParams, CalculationResult, ScheduleView, PrepaymentEntry, PrepaymentResult } from '@/types/loan';
import { calculateLoan, calculatePrepayment } from '@/utils/calculator';

interface LoanState {
  params: LoanParams;
  result: CalculationResult | null;
  scheduleView: ScheduleView;
  currentPage: number;
  pageSize: number;
  prepaymentEntries: PrepaymentEntry[];
  prepaymentResult: PrepaymentResult | null;
  setParams: (partial: Partial<LoanParams>) => void;
  setScheduleView: (view: ScheduleView) => void;
  setCurrentPage: (page: number) => void;
  recalculate: () => void;
  setPrepaymentEntries: (entries: PrepaymentEntry[]) => void;
  addPrepaymentEntry: (entry: PrepaymentEntry) => void;
  removePrepaymentEntry: (index: number) => void;
  calculatePrepaymentResult: () => void;
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

const initialResult = calculateLoan(defaultParams);

export const useLoanStore = create<LoanState>((set, get) => ({
  params: defaultParams,
  result: initialResult,
  scheduleView: 'monthly',
  currentPage: 1,
  pageSize: 24,
  prepaymentEntries: [{ year: 3, amount: 10 }],
  prepaymentResult: initialResult ? calculatePrepayment(defaultParams, initialResult, [{ year: 3, amount: 10 }]) : null,
  setParams: (partial) => {
    const newParams = { ...get().params, ...partial };
    const result = calculateLoan(newParams);
    const prepaymentResult = result && get().prepaymentEntries.length > 0
      ? calculatePrepayment(newParams, result, get().prepaymentEntries)
      : null;
    set({ params: newParams, result, prepaymentResult, currentPage: 1 });
  },
  setScheduleView: (view) => set({ scheduleView: view, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  recalculate: () => {
    const result = calculateLoan(get().params);
    const prepaymentResult = result && get().prepaymentEntries.length > 0
      ? calculatePrepayment(get().params, result, get().prepaymentEntries)
      : null;
    set({ result, prepaymentResult });
  },
  setPrepaymentEntries: (entries) => {
    const result = get().result;
    const prepaymentResult = result && entries.length > 0
      ? calculatePrepayment(get().params, result, entries)
      : null;
    set({ prepaymentEntries: entries, prepaymentResult });
  },
  addPrepaymentEntry: (entry) => {
    const entries = [...get().prepaymentEntries, entry];
    const result = get().result;
    const prepaymentResult = result
      ? calculatePrepayment(get().params, result, entries)
      : null;
    set({ prepaymentEntries: entries, prepaymentResult });
  },
  removePrepaymentEntry: (index) => {
    const entries = get().prepaymentEntries.filter((_, i) => i !== index);
    const result = get().result;
    const prepaymentResult = result && entries.length > 0
      ? calculatePrepayment(get().params, result, entries)
      : null;
    set({ prepaymentEntries: entries, prepaymentResult });
  },
  calculatePrepaymentResult: () => {
    const { result, params, prepaymentEntries } = get();
    if (!result || prepaymentEntries.length === 0) {
      set({ prepaymentResult: null });
      return;
    }
    const prepaymentResult = calculatePrepayment(params, result, prepaymentEntries);
    set({ prepaymentResult });
  },
}));
