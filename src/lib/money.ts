const DEFAULT_CURRENCY = import.meta.env.VITE_CURRENCY || "RWF";
const DEFAULT_LOCALE = import.meta.env.VITE_LOCALE || "en";

export function formatMoney(amount: number, currency: string = DEFAULT_CURRENCY) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: currency === "RWF" ? 0 : 2,
  }).format(safeAmount);
}
