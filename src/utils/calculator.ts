import type {
  LoanParams,
  MonthlyPayment,
  YearlySummary,
  CalculationResult,
  RepaymentMethod,
  PrepaymentEntry,
  PrepaymentResult,
  PrepaymentStrategyResult,
  PrepaymentStrategy,
  LoanRecommendation,
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

const calcSingleLoanWithPrepayments = (
  principal: number,
  annualRatePercent: number,
  years: number,
  method: RepaymentMethod,
  prepayments: { month: number; amount: number }[],
  strategy: PrepaymentStrategy,
): { schedule: MonthlyPayment[]; totalPayment: number; totalInterest: number; newMonthlyPayment: number } => {
  if (principal <= 0 || annualRatePercent <= 0 || years <= 0) {
    return { schedule: [], totalPayment: 0, totalInterest: 0, newMonthlyPayment: 0 };
  }

  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = years * 12;
  const schedule: MonthlyPayment[] = [];
  let remainingPrincipal = principal;
  let totalPayment = 0;

  const prepaymentMap = new Map<number, number>();
  for (const p of prepayments) {
    if (p.month > 0 && p.month < totalMonths && p.amount > 0) {
      prepaymentMap.set(p.month, (prepaymentMap.get(p.month) || 0) + p.amount);
    }
  }

  let currentMonthlyPayment = 0;
  let currentFixedPrincipal = 0;
  let reducePaymentNewMonthly = 0;

  if (method === 'equal-principal-interest') {
    currentMonthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  } else {
    currentFixedPrincipal = principal / totalMonths;
  }

  const originalFirstPayment =
    method === 'equal-principal-interest'
      ? currentMonthlyPayment
      : currentFixedPrincipal + principal * monthlyRate;

  for (let i = 1; i <= totalMonths; i++) {
    if (remainingPrincipal <= 0) break;

    const interest = remainingPrincipal * monthlyRate;
    let payment: number;
    let principalPart: number;

    if (method === 'equal-principal-interest') {
      payment = currentMonthlyPayment;
      principalPart = payment - interest;
      if (principalPart > remainingPrincipal) {
        principalPart = remainingPrincipal;
        payment = principalPart + interest;
      }
    } else {
      principalPart = Math.min(currentFixedPrincipal, remainingPrincipal);
      payment = principalPart + interest;
    }

    remainingPrincipal -= principalPart;
    totalPayment += payment;

    let prepaymentThisMonth = 0;
    if (prepaymentMap.has(i) && remainingPrincipal > 0) {
      prepaymentThisMonth = Math.min(prepaymentMap.get(i)!, remainingPrincipal);
      remainingPrincipal -= prepaymentThisMonth;
      totalPayment += prepaymentThisMonth;

      const remainingMonths = totalMonths - i;
      if (remainingMonths > 0 && remainingPrincipal > 0 && strategy === 'reduce-payment') {
        if (method === 'equal-principal-interest') {
          currentMonthlyPayment =
            (remainingPrincipal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
            (Math.pow(1 + monthlyRate, remainingMonths) - 1);
          reducePaymentNewMonthly = currentMonthlyPayment;
        } else {
          currentFixedPrincipal = remainingPrincipal / remainingMonths;
          reducePaymentNewMonthly = currentFixedPrincipal + remainingPrincipal * monthlyRate;
        }
      }
    }

    schedule.push({
      month: i,
      payment: payment + prepaymentThisMonth,
      principal: principalPart + prepaymentThisMonth,
      interest,
      remainingPrincipal,
    });

    if (remainingPrincipal <= 0) break;
  }

  const totalInterest = totalPayment - principal;

  let newMonthlyPayment: number;
  if (strategy === 'shorten-term') {
    newMonthlyPayment = originalFirstPayment;
  } else {
    newMonthlyPayment = reducePaymentNewMonthly > 0 ? reducePaymentNewMonthly : originalFirstPayment;
  }

  return { schedule, totalPayment, totalInterest, newMonthlyPayment };
};

const calcCombinedLoanWithPrepayments = (
  params: LoanParams,
  prepaymentEntries: PrepaymentEntry[],
  strategy: PrepaymentStrategy,
): { schedule: MonthlyPayment[]; totalPayment: number; totalInterest: number; newMonthlyPayment: number } => {
  const { mode, method, years, commercialRate, providentRate } = params;

  const commercialPrincipal = mode === 'commercial' || mode === 'combined' ? wanToYuan(params.commercialAmount) : 0;
  const providentPrincipal = mode === 'provident' || mode === 'combined' ? wanToYuan(params.providentAmount) : 0;
  const totalPrincipal = commercialPrincipal + providentPrincipal;
  const commercialRatio = totalPrincipal > 0 ? commercialPrincipal / totalPrincipal : 0;
  const providentRatio = totalPrincipal > 0 ? providentPrincipal / totalPrincipal : 0;

  const validEntries = prepaymentEntries.filter(e => e.year > 0 && e.year < years && e.amount > 0);

  const commercialPrepayments = validEntries.map(e => ({
    month: e.year * 12,
    amount: wanToYuan(e.amount) * commercialRatio,
  }));

  const providentPrepayments = validEntries.map(e => ({
    month: e.year * 12,
    amount: wanToYuan(e.amount) * providentRatio,
  }));

  let commercialSchedule: MonthlyPayment[] = [];
  let providentSchedule: MonthlyPayment[] = [];
  let commercialTotalPayment = 0;
  let commercialTotalInterest = 0;
  let providentTotalPayment = 0;
  let providentTotalInterest = 0;
  let commercialMonthlyPayment = 0;
  let providentMonthlyPayment = 0;

  if (mode === 'commercial' || mode === 'combined') {
    const res = calcSingleLoanWithPrepayments(
      commercialPrincipal,
      commercialRate,
      years,
      method,
      commercialPrepayments,
      strategy,
    );
    commercialSchedule = res.schedule;
    commercialTotalPayment = res.totalPayment;
    commercialTotalInterest = res.totalInterest;
    commercialMonthlyPayment = res.newMonthlyPayment;
  }

  if (mode === 'provident' || mode === 'combined') {
    const res = calcSingleLoanWithPrepayments(
      providentPrincipal,
      providentRate,
      years,
      method,
      providentPrepayments,
      strategy,
    );
    providentSchedule = res.schedule;
    providentTotalPayment = res.totalPayment;
    providentTotalInterest = res.totalInterest;
    providentMonthlyPayment = res.newMonthlyPayment;
  }

  let mergedSchedule: MonthlyPayment[];
  if (mode === 'commercial') mergedSchedule = commercialSchedule;
  else if (mode === 'provident') mergedSchedule = providentSchedule;
  else mergedSchedule = mergeSchedules(commercialSchedule, providentSchedule);

  return {
    schedule: mergedSchedule,
    totalPayment: commercialTotalPayment + providentTotalPayment,
    totalInterest: commercialTotalInterest + providentTotalInterest,
    newMonthlyPayment: commercialMonthlyPayment + providentMonthlyPayment,
  };
};

export const calculatePrepayment = (
  loanParams: LoanParams,
  originalResult: CalculationResult,
  prepaymentEntries: PrepaymentEntry[],
): PrepaymentResult | null => {
  if (!prepaymentEntries || prepaymentEntries.length === 0) return null;

  const validEntries = prepaymentEntries.filter(e => e.year > 0 && e.year < loanParams.years && e.amount > 0);
  if (validEntries.length === 0) return null;

  const strategies: PrepaymentStrategy[] = ['shorten-term', 'reduce-payment'];
  const strategyResults: PrepaymentStrategyResult[] = [];

  for (const strategy of strategies) {
    const res = calcCombinedLoanWithPrepayments(loanParams, validEntries, strategy);

    strategyResults.push({
      strategy,
      strategyName: strategy === 'shorten-term' ? '缩短年限' : '减少月供',
      totalPayment: res.totalPayment,
      totalInterest: res.totalInterest,
      savedInterest: originalResult.totalInterest - res.totalInterest,
      newTermMonths: res.schedule.length,
      newMonthlyPayment: res.newMonthlyPayment > 0 ? res.newMonthlyPayment : originalResult.monthlyPaymentFirst,
      schedule: res.schedule,
      yearlySchedule: buildYearlySchedule(res.schedule),
    });
  }

  const recommendedStrategy = strategyResults[0].savedInterest >= strategyResults[1].savedInterest
    ? 'shorten-term'
    : 'reduce-payment';

  return {
    originalTotalPayment: originalResult.totalPayment,
    originalTotalInterest: originalResult.totalInterest,
    originalTermMonths: originalResult.schedule.length,
    originalMonthlyPayment: originalResult.monthlyPaymentFirst,
    strategies: strategyResults,
    recommendedStrategy,
  };
};

export const calculateLoanRecommendation = (
  monthlySalary: number,
  annualRatePercent: number,
  targetYears: number = 30,
  salaryRatio: number = 0.5,
): LoanRecommendation => {
  if (monthlySalary <= 0 || annualRatePercent <= 0 || targetYears <= 0) {
    return {
      recommendedAmount: 0,
      comfortableAmount: 0,
      recommendedYears: 0,
      recommendedMonths: 0,
      monthlyPayment: 0,
      comfortableMonthlyPayment: 0,
      totalInterest: 0,
      salaryRatio,
    };
  }

  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = targetYears * 12;
  const maxMonthlyPayment = monthlySalary * salaryRatio;
  const comfortableMonthlyPayment = monthlySalary * 0.3;

  const calcPrincipal = (payment: number, months: number): number => {
    if (monthlyRate === 0) return payment * months;
    return (payment * (Math.pow(1 + monthlyRate, months) - 1)) /
      (monthlyRate * Math.pow(1 + monthlyRate, months));
  };

  const recommendedPrincipal = calcPrincipal(maxMonthlyPayment, totalMonths);
  const comfortablePrincipal = calcPrincipal(comfortableMonthlyPayment, totalMonths);

  const recommendedAmount = recommendedPrincipal / 10000;
  const comfortableAmount = comfortablePrincipal / 10000;

  const totalPayment = maxMonthlyPayment * totalMonths;
  const totalInterest = totalPayment - recommendedPrincipal;

  return {
    recommendedAmount,
    comfortableAmount,
    recommendedYears: targetYears,
    recommendedMonths: totalMonths,
    monthlyPayment: maxMonthlyPayment,
    comfortableMonthlyPayment,
    totalInterest,
    salaryRatio,
  };
};

export const findOptimalLoanTerm = (
  monthlySalary: number,
  annualRatePercent: number,
  targetAmount: number,
  salaryRatio: number = 0.5,
): { years: number; months: number; monthlyPayment: number; isAffordable: boolean } => {
  if (monthlySalary <= 0 || annualRatePercent <= 0 || targetAmount <= 0) {
    return { years: 30, months: 360, monthlyPayment: 0, isAffordable: false };
  }

  const principal = wanToYuan(targetAmount);
  const monthlyRate = annualRatePercent / 100 / 12;
  const maxPayment = monthlySalary * salaryRatio;

  const calcPayment = (months: number): number => {
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
  };

  let bestMonths = 360;
  let bestPayment = calcPayment(360);

  if (bestPayment <= maxPayment) {
    for (let months = 12; months <= 360; months += 12) {
      const payment = calcPayment(months);
      if (payment <= maxPayment) {
        bestMonths = months;
        bestPayment = payment;
        break;
      }
    }
  }

  const isAffordable = bestPayment <= maxPayment;

  return {
    years: Math.ceil(bestMonths / 12),
    months: bestMonths,
    monthlyPayment: bestPayment,
    isAffordable,
  };
};
