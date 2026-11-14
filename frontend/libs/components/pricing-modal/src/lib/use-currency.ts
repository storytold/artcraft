import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CNY";

export interface CurrencyOption {
  value: CurrencyCode;
  label: string;
  symbol: string;
  /** Number of decimal places for display (e.g. JPY uses 0) */
  decimals: number;
}

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCAL_STORAGE_KEY = "artcraft_preferred_currency";
const RATES_CACHE_KEY = "artcraft_currency_rates";
const RATES_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: "USD", label: "USD ($)", symbol: "$", decimals: 2 },
  { value: "EUR", label: "EUR (€)", symbol: "€", decimals: 2 },
  { value: "GBP", label: "GBP (£)", symbol: "£", decimals: 2 },
  { value: "JPY", label: "JPY (¥)", symbol: "¥", decimals: 0 },
  { value: "CNY", label: "CNY (¥)", symbol: "¥", decimals: 2 },
];

const SYMBOLS = CURRENCY_OPTIONS.filter((o) => o.value !== "USD")
  .map((o) => o.value)
  .join(",");

// Fallback rates – kept in case the API is unreachable
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.847,
  GBP: 0.742,
  JPY: 156.0,
  CNY: 6.858,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadSavedCurrency(): CurrencyCode {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && CURRENCY_OPTIONS.some((o) => o.value === saved)) {
      return saved as CurrencyCode;
    }
  } catch {
    // localStorage may be unavailable
  }
  return "USD";
}

function saveCurrency(code: CurrencyCode) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

interface CachedRates {
  rates: Record<CurrencyCode, number>;
  timestamp: number;
}

function loadCachedRates(): Record<CurrencyCode, number> | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedRates = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < RATES_CACHE_TTL_MS) {
      return parsed.rates;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveCachedRates(rates: Record<CurrencyCode, number>) {
  try {
    const data: CachedRates = { rates, timestamp: Date.now() };
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Module-level singleton so all hook instances share one fetch
let _ratesFetchPromise: Promise<Record<CurrencyCode, number>> | null = null;

async function fetchRates(): Promise<Record<CurrencyCode, number>> {
  // Check cache first
  const cached = loadCachedRates();
  if (cached) return cached;

  if (_ratesFetchPromise) return _ratesFetchPromise;

  _ratesFetchPromise = (async () => {
    try {
      const res = await fetch(
        `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${SYMBOLS}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FrankfurterResponse = await res.json();
      const rates: Record<CurrencyCode, number> = {
        USD: 1,
        EUR: data.rates.EUR ?? FALLBACK_RATES.EUR,
        GBP: data.rates.GBP ?? FALLBACK_RATES.GBP,
        JPY: data.rates.JPY ?? FALLBACK_RATES.JPY,
        CNY: data.rates.CNY ?? FALLBACK_RATES.CNY,
      };
      saveCachedRates(rates);
      return rates;
    } catch (err) {
      console.warn("Failed to fetch currency rates, using fallback:", err);
      return { ...FALLBACK_RATES };
    } finally {
      _ratesFetchPromise = null;
    }
  })();

  return _ratesFetchPromise;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseCurrencyResult {
  /** Currently selected currency code */
  currency: CurrencyCode;
  /** Change the selected currency (persisted to localStorage) */
  setCurrency: (code: CurrencyCode | string | number) => void;
  /** The matching CurrencyOption object */
  currencyOption: CurrencyOption;
  /** Convert a USD amount to the selected currency */
  convert: (usdAmount: number) => number;
  /** Format a USD amount in the selected currency (e.g. "€0.85") */
  formatPrice: (usdAmount: number) => string;
  /** Whether rates have been loaded */
  ratesLoaded: boolean;
  /** All available currency options (for selectors) */
  currencyOptions: CurrencyOption[];
}

export function useCurrency(): UseCurrencyResult {
  const [currency, setCurrencyState] =
    useState<CurrencyCode>(loadSavedCurrency);
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(
    () => loadCachedRates() ?? FALLBACK_RATES,
  );
  const [ratesLoaded, setRatesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchRates().then((r) => {
      if (!cancelled) {
        setRates(r);
        setRatesLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((code: CurrencyCode | string | number) => {
    const str = String(code) as CurrencyCode;
    if (CURRENCY_OPTIONS.some((o) => o.value === str)) {
      setCurrencyState(str);
      saveCurrency(str);
    }
  }, []);

  const currencyOption =
    CURRENCY_OPTIONS.find((o) => o.value === currency) ?? CURRENCY_OPTIONS[0];

  const convert = useCallback(
    (usdAmount: number): number => {
      return usdAmount * (rates[currency] ?? 1);
    },
    [currency, rates],
  );

  const formatPrice = useCallback(
    (usdAmount: number): string => {
      const converted = usdAmount * (rates[currency] ?? 1);
      const decimals = currencyOption.value === "JPY" ? 0 : 2;
      const formatted = converted.toFixed(decimals);
      return `${currencyOption.symbol}${formatted}`;
    },
    [currency, rates, currencyOption],
  );

  return {
    currency,
    setCurrency,
    currencyOption,
    convert,
    formatPrice,
    ratesLoaded,
    currencyOptions: CURRENCY_OPTIONS,
  };
}
