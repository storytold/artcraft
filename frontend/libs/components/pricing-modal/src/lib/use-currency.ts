// React's three hooks used below: useState holds the chosen currency and the exchange rates, useEffect fetches the rates once per mount,
// useCallback keeps the setCurrency / convert / formatPrice functions the same object between renders until their inputs change.
import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// The five currencies the app can show prices in. USD is the real price; the other four are display-only conversions.
export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CNY";

// One row of the currency picker: the code, the text shown in the dropdown, the symbol put in front of a price, and the decimal places.
export interface CurrencyOption {
  value: CurrencyCode;
  label: string;
  symbol: string;
  /** Number of decimal places for display (e.g. JPY uses 0) */
  decimals: number;
}

// The shape of the answer from the Frankfurter exchange-rate service: only `rates` (code -> units per 1 USD) is read below.
interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// localStorage key that remembers which currency the user picked (read when the hook mounts, written by setCurrency).
const LOCAL_STORAGE_KEY = "artcraft_preferred_currency";
// localStorage key that remembers the last good set of exchange rates together with the time they were saved.
const RATES_CACHE_KEY = "artcraft_currency_rates";
const RATES_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// The picker rows, in display order. USD first: it is the default and the fallback when a saved value is not in this list.
// JPY has 0 decimals; the others have 2. Note JPY and CNY share the "¥" symbol, only the label tells them apart.
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: "USD", label: "USD ($)", symbol: "$", decimals: 2 },
  { value: "EUR", label: "EUR (€)", symbol: "€", decimals: 2 },
  { value: "GBP", label: "GBP (£)", symbol: "£", decimals: 2 },
  { value: "JPY", label: "JPY (¥)", symbol: "¥", decimals: 0 },
  { value: "CNY", label: "CNY (¥)", symbol: "¥", decimals: 2 },
];

// The comma-separated list sent to the rate service ("EUR,GBP,JPY,CNY"): every option except USD, because USD is the base currency of the request.
const SYMBOLS = CURRENCY_OPTIONS.filter((o) => o.value !== "USD")
  .map((o) => o.value)
  .join(",");

// Fallback rates – kept in case the API is unreachable
// Hard-coded units-per-1-USD numbers typed into the source (they do not update themselves), so a price shown with these is only approximate.
// They are used (a) as the very first rates before any fetch finishes, and (b) when the fetch fails. A failed fetch is NOT cached (see fetchRates).
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

// Reads the user's saved currency from localStorage. Returns "USD" when nothing is saved, the saved value is not one of the five codes
// (an old or hand-edited value), or localStorage itself cannot be used.
function loadSavedCurrency(): CurrencyCode {
  try {
    // Raw text saved earlier by saveCurrency, or null if the user never picked one.
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    // Accept it only when it is a known code, so the cast on the next line is safe.
    if (saved && CURRENCY_OPTIONS.some((o) => o.value === saved)) {
      return saved as CurrencyCode;
    }
  } catch {
    // localStorage may be unavailable
  }
  return "USD";
}

// Remembers the user's choice for the next launch. Failures (storage blocked or full) are swallowed: the choice then only lasts until restart.
function saveCurrency(code: CurrencyCode) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

// What is stored under RATES_CACHE_KEY: the rates plus the moment (milliseconds since 1970) they were saved, so their age can be checked.
interface CachedRates {
  rates: Record<CurrencyCode, number>;
  timestamp: number;
}

// Returns the cached rates if they exist and are younger than 4 hours; otherwise null (nothing saved, too old, unreadable JSON, or no storage).
function loadCachedRates(): Record<CurrencyCode, number> | null {
  try {
    // Raw JSON text, or null when nothing was ever saved.
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedRates = JSON.parse(raw);
    // Fresh enough: age (now minus saved time) is under the 4-hour limit.
    if (Date.now() - parsed.timestamp < RATES_CACHE_TTL_MS) {
      return parsed.rates;
    }
  } catch {
    // ignore
  }
  return null;
}

// Saves a good set of rates with the current time. Only fetchRates calls it, and only after a successful fetch.
function saveCachedRates(rates: Record<CurrencyCode, number>) {
  try {
    const data: CachedRates = { rates, timestamp: Date.now() };
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Module-level singleton so all hook instances share one fetch
// Holds the fetch that is currently running (or null when none is). Lives outside the hook, so every mounted copy of the hook shares it.
let _ratesFetchPromise: Promise<Record<CurrencyCode, number>> | null = null;

// Gives back the exchange rates, from the cache if it is fresh, otherwise from the Frankfurter service, otherwise the hard-coded fallbacks.
// It never rejects: every failure turns into the fallback rates.
async function fetchRates(): Promise<Record<CurrencyCode, number>> {
  // Check cache first
  // A fresh cache answers immediately with no network call.
  const cached = loadCachedRates();
  if (cached) return cached;

  // A fetch is already running (another hook copy started it): wait for that one instead of starting a second.
  if (_ratesFetchPromise) return _ratesFetchPromise;

  // Start the fetch and store its promise in the singleton right away (before anything is awaited), so a second caller finds it.
  _ratesFetchPromise = (async () => {
    try {
      // Ask the service for 1 USD in EUR, GBP, JPY and CNY. This is a plain browser fetch to a third-party host; the desktop app's
      // security policy (CSP in tauri.conf.json) does not list api.frankfurter.dev (BUGS.md N-86, not checked in a running app),
      // and if it blocks the call the catch below turns that into the fallback rates.
      const res = await fetch(
        `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${SYMBOLS}`,
      );
      // An HTTP error status (404, 500, ...) is treated like a network failure.
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FrankfurterResponse = await res.json();
      // Build the full table: USD is always 1, and any code the service left out falls back to its hard-coded number.
      const rates: Record<CurrencyCode, number> = {
        USD: 1,
        EUR: data.rates.EUR ?? FALLBACK_RATES.EUR,
        GBP: data.rates.GBP ?? FALLBACK_RATES.GBP,
        JPY: data.rates.JPY ?? FALLBACK_RATES.JPY,
        CNY: data.rates.CNY ?? FALLBACK_RATES.CNY,
      };
      // Remember the good table for the next four hours.
      saveCachedRates(rates);
      return rates;
    } catch (err) {
      // Network error, blocked request, bad status or unreadable answer: log it and hand back a COPY of the fallbacks.
      // The failure is not saved to the cache, so the next hook mount tries the service again.
      console.warn("Failed to fetch currency rates, using fallback:", err);
      return { ...FALLBACK_RATES };
    } finally {
      // Whatever happened, the fetch is over: clear the singleton so a later call may start a new one.
      _ratesFetchPromise = null;
    }
  })();

  return _ratesFetchPromise;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// Everything the hook hands back to the component that calls it.
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

// Currency hook: lets a component show USD prices in the user's chosen currency.
// Each component that calls it gets its OWN currency state (only the rate fetch is shared), so a choice made through one copy is not seen
// by another copy until that one remounts. In the shipped app the only live caller is CostBreakdownModal (the Costs dialog);
// apps/artcraft/app/src/components/reusable/CostModal.tsx also calls it but is imported nowhere (dormant).
export function useCurrency(): UseCurrencyResult {
  // The chosen currency. The function form of useState calls loadSavedCurrency once, on the first render only.
  const [currency, setCurrencyState] =
    useState<CurrencyCode>(loadSavedCurrency);
  // The rates in use. Starts with the cached rates if they are fresh, otherwise the hard-coded fallbacks, so the first render already has numbers.
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(
    () => loadCachedRates() ?? FALLBACK_RATES,
  );
  // True once the rate lookup has finished. It also becomes true when the lookup failed and fallbacks are in use. No live component reads it.
  const [ratesLoaded, setRatesLoaded] = useState(false);

  // Runs once after the first render: asks for fresh rates and stores them when they arrive.
  useEffect(() => {
    // Set by the cleanup below when the component goes away first, so a late answer does not update an unmounted component.
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

  // Picks a currency. It takes a code or any string/number (so a dropdown's raw value can be passed straight in) and ignores
  // anything that is not one of the five known codes. A valid pick is applied to the screen and saved for the next launch.
  const setCurrency = useCallback((code: CurrencyCode | string | number) => {
    const str = String(code) as CurrencyCode;
    if (CURRENCY_OPTIONS.some((o) => o.value === str)) {
      setCurrencyState(str);
      saveCurrency(str);
    }
  }, []);

  // The full picker row for the chosen code (symbol, label, decimals); falls back to the first row (USD) if the code were ever missing.
  const currencyOption =
    CURRENCY_OPTIONS.find((o) => o.value === currency) ?? CURRENCY_OPTIONS[0];

  // USD amount -> number in the chosen currency (multiply by the rate). A missing rate counts as 1, i.e. the number is left as it is.
  const convert = useCallback(
    (usdAmount: number): number => {
      return usdAmount * (rates[currency] ?? 1);
    },
    [currency, rates],
  );

  // USD amount -> display text such as "€0.85": converts, rounds to 0 decimals for JPY and 2 for everything else, and puts the symbol in front.
  // The decimals are written out here (JPY = 0, else 2) instead of reading currencyOption.decimals; the two agree for the five current currencies.
  const formatPrice = useCallback(
    (usdAmount: number): string => {
      const converted = usdAmount * (rates[currency] ?? 1);
      const decimals = currencyOption.value === "JPY" ? 0 : 2;
      const formatted = converted.toFixed(decimals);
      return `${currencyOption.symbol}${formatted}`;
    },
    [currency, rates, currencyOption],
  );

  // The object the component receives; currencyOptions is the shared constant list, handed out so a dropdown can be built from it.
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
