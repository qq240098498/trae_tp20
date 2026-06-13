const wanToYuan = (wan: number) => wan * 10000;

type RepaymentMethod = 'equal-principal-interest' | 'equal-principal';
type PrepaymentStrategy = 'shorten-term' | 'reduce-payment';

interface MonthlyPayment {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingPrincipal: number;
}

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

// 测试场景：100万商贷，3.45%利率，30年，等额本息，第3年末提前还10万
const principal = wanToYuan(100);
const rate = 3.45;
const years = 30;
const method: RepaymentMethod = 'equal-principal-interest';
const prepayments = [{ month: 3 * 12, amount: wanToYuan(10) }];

// 先计算原始贷款（不提前还款）
const original = calcSingleLoanWithPrepayments(principal, rate, years, method, [], 'shorten-term');
console.log('=== 原始贷款（不提前还款） ===');
console.log(`总还款: ${(original.totalPayment / 10000).toFixed(2)}万`);
console.log(`总利息: ${(original.totalInterest / 10000).toFixed(2)}万`);
console.log(`还款期数: ${original.schedule.length}期 (${years}年)`);
console.log(`首月月供: ${original.newMonthlyPayment.toFixed(2)}元`);
console.log('');

// 缩短年限方案
const shorten = calcSingleLoanWithPrepayments(principal, rate, years, method, prepayments, 'shorten-term');
console.log('=== 方案一：缩短年限 ===');
console.log(`总还款: ${(shorten.totalPayment / 10000).toFixed(2)}万`);
console.log(`总利息: ${(shorten.totalInterest / 10000).toFixed(2)}万`);
console.log(`节省利息: ${((original.totalInterest - shorten.totalInterest) / 10000).toFixed(2)}万`);
console.log(`还款期数: ${shorten.schedule.length}期 (${Math.ceil(shorten.schedule.length / 12)}年${shorten.schedule.length % 12 ? shorten.schedule.length % 12 + '个月' : ''})`);
console.log(`缩短: ${original.schedule.length - shorten.schedule.length}期 (约${Math.floor((original.schedule.length - shorten.schedule.length) / 12)}年${(original.schedule.length - shorten.schedule.length) % 12}个月)`);
console.log('');

// 减少月供方案
const reduce = calcSingleLoanWithPrepayments(principal, rate, years, method, prepayments, 'reduce-payment');
console.log('=== 方案二：减少月供 ===');
console.log(`总还款: ${(reduce.totalPayment / 10000).toFixed(2)}万`);
console.log(`总利息: ${(reduce.totalInterest / 10000).toFixed(2)}万`);
console.log(`节省利息: ${((original.totalInterest - reduce.totalInterest) / 10000).toFixed(2)}万`);
console.log(`还款期数: ${reduce.schedule.length}期`);
console.log(`新月供: ${reduce.newMonthlyPayment.toFixed(2)}元`);
console.log(`月供减少: ${(original.newMonthlyPayment - reduce.newMonthlyPayment).toFixed(2)}元`);
console.log('');

// 推荐方案
const shortenSaved = original.totalInterest - shorten.totalInterest;
const reduceSaved = original.totalInterest - reduce.totalInterest;
console.log('=== 对比结论 ===');
console.log(`缩短年限多节省: ${((shortenSaved - reduceSaved) / 10000).toFixed(2)}万`);
console.log(`推荐方案: ${shortenSaved >= reduceSaved ? '缩短年限 ✅' : '减少月供 ✅'}`);
