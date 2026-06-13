export const formatCurrency = (value: number, fractionDigits = 2): string => {
  if (!isFinite(value) || isNaN(value)) return '0.00';
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

export const formatCurrencyWan = (value: number, fractionDigits = 2): string => {
  const wan = value / 10000;
  return `${formatCurrency(wan, fractionDigits)}万`;
};

export const formatPercent = (value: number, fractionDigits = 2): string => {
  return `${value.toFixed(fractionDigits)}%`;
};

export const yuanToWan = (yuan: number): number => yuan / 10000;

export const wanToYuan = (wan: number): number => wan * 10000;

export const formatMonth = (monthIndex: number): string => {
  const year = Math.floor((monthIndex - 1) / 12) + 1;
  const month = ((monthIndex - 1) % 12) + 1;
  return `第${year}年${month}月`;
};
