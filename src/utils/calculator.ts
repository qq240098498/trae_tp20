import type {
  LoanParams,
  MonthlyPayment,
  YearlySummary,
  CalculationResult,
  RepaymentMethod,
} from '@/types/loan';
import { wanToYuan } from './format';

const calcSingleLoan = (
  principal: number,
  annualRatePercent: number,
  years: number,
  method: RepaymentMethod,
): { schedule: MonthlyPayment[]; totalPayment: number; totalInterest: number } => {
  if (principal <= 0 || annualRatePercent <= 0 || years <= 0) {
    return { schedule: [], totalPayment: 0, totalInterest: 0 };
  }

  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = years * 12;
  const schedule: MonthlyPayment[] = [];
  let remainingPrincipal = principal;
  let totalPayment = 0;

  if (method === 'equal-principal-interest') {
    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);

    for (let i = 1; i <= totalMonths; i++) {
      const interest = remainingPrincipal * monthlyRate;
      const principalPart = monthlyPayment - interest;
      remainingPrincipal = Math.max(0, remainingPrincipal - principalPart);
      const payment = principalPart + interest;
      totalPayment += payment;

      schedule.push({
        month: i,
        payment,
        principal: principalPart,
        interest,
        remainingPrincipal,
      });
    }
  } else {
    const fixedPrincipal = principal / totalMonths;

    for (let i = 1; i <= totalMonths; i++) {
      const interest = remainingPrincipal * monthlyRate;
      const payment = fixedPrincipal + interest;
      remainingPrincipal = Math.max(0, remainingPrincipal - fixedPrincipal);
      totalPayment += payment;

      schedule.push({
        month: i,
        payment,
        principal: fixedPrincipal,
        interest,
        remainingPrincipal,
      });
    }
  }

  const totalInterest = totalPayment - principal;
  return { schedule, totalPayment, totalInterest };
};

const buildYearlySchedule = (monthlySchedule: MonthlyPayment[]): YearlySummary[] => {
  const yearly: YearlySummary[] = [];
  if (monthlySchedule.length === 0) return yearly;

  const totalYears = Math.ceil(monthlySchedule.length / 12);
  for (let y = 1; y <= totalYears; y++) {
    const startIdx = (y - 1) * 12;
    const endIdx = Math.min(y * 12, monthlySchedule.length);
    const months = monthlySchedule.slice(startIdx, endIdx);

    let totalPayment = 0;
    let totalPrincipal = 0;
    let totalInterest = 0;
    months.forEach((m) => {
      totalPayment += m.payment;
      totalPrincipal += m.principal;
      totalInterest += m.interest;
    });

    yearly.push({
      year: y,
      totalPayment,
      totalPrincipal,
      totalInterest,
      remainingPrincipal: months[months.length - 1].remainingPrincipal,
      monthlyDetails: months,
    });
  }
  return yearly;
};

const mergeSchedules = (
  a: MonthlyPayment[],
  b: MonthlyPayment[],
): MonthlyPayment[] => {
  const len = Math.max(a.length, b.length);
  const result: MonthlyPayment[] = [];
  for (let i = 0; i < len; i++) {
    const ma = a[i] || { payment: 0, principal: 0, interest: 0, remainingPrincipal: 0 };
    const mb = b[i] || { payment: 0, principal: 0, interest: 0, remainingPrincipal: 0 };
    result.push({
      month: i + 1,
      payment: ma.payment + mb.payment,
      principal: ma.principal + mb.principal,
      interest: ma.interest + mb.interest,
      remainingPrincipal: ma.remainingPrincipal + mb.remainingPrincipal,
    });
  }
  return result;
};

export const calculateLoan = (params: LoanParams): CalculationResult | null => {
  const { mode, method, years } = params;

  let commercialSchedule: MonthlyPayment[] = [];
  let providentSchedule: MonthlyPayment[] = [];
  let commercialTotalPayment = 0;
  let commercialTotalInterest = 0;
  let providentTotalPayment = 0;
  let providentTotalInterest = 0;
  let commercialPrincipal = 0;
  let providentPrincipal = 0;

  if (mode === 'commercial' || mode === 'combined') {
    commercialPrincipal = wanToYuan(params.commercialAmount);
    const res = calcSingleLoan(
      commercialPrincipal,
      params.commercialRate,
      years,
      method,
    );
    commercialSchedule = res.schedule;
    commercialTotalPayment = res.totalPayment;
    commercialTotalInterest = res.totalInterest;
  }

  if (mode === 'provident' || mode === 'combined') {
    providentPrincipal = wanToYuan(params.providentAmount);
    const res = calcSingleLoan(
      providentPrincipal,
      params.providentRate,
      years,
      method,
    );
    providentSchedule = res.schedule;
    providentTotalPayment = res.totalPayment;
    providentTotalInterest = res.totalInterest;
  }

  let mergedSchedule: MonthlyPayment[];
  if (mode === 'commercial') mergedSchedule = commercialSchedule;
  else if (mode === 'provident') mergedSchedule = providentSchedule;
  else mergedSchedule = mergeSchedules(commercialSchedule, providentSchedule);

  if (mergedSchedule.length === 0) return null;

  const totalPrincipal = commercialPrincipal + providentPrincipal;
  const totalPayment = commercialTotalPayment + providentTotalPayment;
  const totalInterest = commercialTotalInterest + providentTotalInterest;

  const monthlyPaymentFirst = mergedSchedule[0]?.payment || 0;
  const monthlyPaymentLast = mergedSchedule[mergedSchedule.length - 1]?.payment || 0;
  const monthlyPaymentAvg = mergedSchedule.length
    ? totalPayment / mergedSchedule.length
    : 0;

  const result: CalculationResult = {
    monthlyPaymentFirst,
    monthlyPaymentLast,
    monthlyPaymentAvg,
    totalPayment,
    totalInterest,
    totalPrincipal,
    schedule: mergedSchedule,
    yearlySchedule: buildYearlySchedule(mergedSchedule),
  };

  if (mode === 'combined') {
    result.commercialPart = {
      totalPayment: commercialTotalPayment,
      totalInterest: commercialTotalInterest,
    };
    result.providentPart = {
      totalPayment: providentTotalPayment,
      totalInterest: providentTotalInterest,
    };
  }

  return result;
};
