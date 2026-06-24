import { useState, useEffect } from "react";

interface CountryInfo {
  name: string;
  code: string;
}

const countryCache = new Map<string, CountryInfo>();

export function useCountryFromIP(ip?: string) {
  const [country, setCountry] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!ip || ip === "N/A" || ip === "Unknown") {
      setCountry(null);
      setCountryCode(null);
      return;
    }

    if (countryCache.has(ip)) {
      const cached = countryCache.get(ip)!;
      setCountry(cached.name);
      setCountryCode(cached.code);
      return;
    }

    setIsLoading(true);
    Promise.all([
      fetch(`https://get.geojs.io/v1/ip/country/full/${ip}`).then((res) =>
        res.ok ? res.text() : Promise.reject(),
      ),
      fetch(`https://get.geojs.io/v1/ip/country/${ip}`).then((res) =>
        res.ok ? res.text() : Promise.reject(),
      ),
    ])
      .then(([nameRaw, codeRaw]) => {
        const name = nameRaw.trim();
        const code = codeRaw.trim().toUpperCase();
        const info: CountryInfo = {
          name: name && name !== "undefined" ? name : "Unknown",
          code: code && code !== "undefined" ? code : "",
        };
        countryCache.set(ip, info);
        setCountry(info.name);
        setCountryCode(info.code);
      })
      .catch(() => {
        const info: CountryInfo = { name: "Unknown", code: "" };
        countryCache.set(ip, info);
        setCountry("Unknown");
        setCountryCode("");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ip]);

  return { country, countryCode, isLoading };
}
