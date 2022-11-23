import {Period} from "src/types/common";

export function numberToOrdinal (n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};


// assumes time in seconds
export const roundUpTime = (time: number, period: Period) => {
  let offset: number;
  if (period === '1m') {
    offset = 60;
  } else if (period === '5m') {
    offset = 60 * 5;
  } else if (period === '15m') {
    offset = 60 * 15;
  } else if (period === '4h') {
    offset = 60 * 60 * 4;
  } else if (period === '1d') {
    offset = 60 * 60 * 24;
  } else {
    offset = 1;
  }
  return (Number(time / offset) * offset) + offset;
}

export function convertStringToFloat(str: string, decimals = 0) {
  return parseFloat(str).toFixed(decimals);
}

export function copyToClipboard(item: string) {
  navigator.clipboard.writeText(item);
}

export function shareToTwitter(text: string) {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
}

