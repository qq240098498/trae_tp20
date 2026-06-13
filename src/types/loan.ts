export type LoanMode = 'commercial' | 'provident' | 'combined';
export type RepaymentMethod = 'equal-principal-interest' | 'equal-principal';
export type ScheduleView = 'yearly' | 'monthly';
export type PrepaymentStrategy = 'shorten-term' | 'reduce-payment';

export interface PrepaymentEntry {
  year: number;
  amount: number;
}

export interface PrepaymentParams {
  entries: PrepaymentEntry[];
}

export interface PrepaymentStrategyResult {
  strategy: PrepaymentStrategy;
  strategyName: string;
  totalPayment: number;
  totalInterest: number;
  savedInterest: number;
  newTermMonths: number;
  newMonthlyPayment: number;
  schedule: MonthlyPayment[];
  yearlySchedule: YearlySummary[];
}

export interface PrepaymentResult {
  originalTotalPayment: number;
  originalTotalInterest: number;
  originalTermMonths: number;
  originalMonthlyPayment: number;
  strategies: PrepaymentStrategyResult[];
  recommendedStrategy: PrepaymentStrategy;
}

export interface LoanParams {
  mode: LoanMode;
  commercialAmount: number;
  commercialRate: number;
  providentAmount: number;
  providentRate: number;
  years: number;
  method: RepaymentMethod;
}

export interface MonthlyPayment {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingPrincipal: number;
}

export interface YearlySummary {
  year: number;
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  remainingPrincipal: number;
  monthlyDetails: MonthlyPayment[];
}

export interface LoanPartResult {
  totalPayment: number;
  totalInterest: number;
}

export interface CalculationResult {
  monthlyPaymentFirst: number;
  monthlyPaymentLast: number;
  monthlyPaymentAvg: number;
  totalPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  schedule: MonthlyPayment[];
  yearlySchedule: YearlySummary[];
  commercialPart?: LoanPartResult;
  providentPart?: LoanPartResult;
}
