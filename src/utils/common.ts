
export function numberToOrdinal (n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export function convertStringToFloat(str: string, decimals = 0) {
  return parseFloat(str).toFixed(decimals);
}

export function copyToClipboard(item: string) {
  navigator.clipboard.writeText(item);
}

export function shareToTwitter(text: string) {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
}

