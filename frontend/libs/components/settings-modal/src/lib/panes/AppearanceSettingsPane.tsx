import { Label } from "@storyteller/ui-label";
import { useEffect, useMemo, useState } from "react";

type AppTheme = "light" | "gray" | "black" | "aurora" | "sunset";

const THEME_STORAGE_KEY = "st-theme";

function getStoredTheme(): AppTheme {
  const value = (localStorage.getItem(THEME_STORAGE_KEY) || "").trim();
  if (
    value === "light" ||
    value === "gray" ||
    value === "black" ||
    value === "aurora" ||
    value === "sunset" ||
    value === "gradient" /* backward compat */
  ) {
    return value === "gradient" ? "aurora" : (value as AppTheme);
  }
  return "gray";
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  const toRemove: string[] = [];
  root.classList.forEach((c) => {
    if (c.startsWith("theme-")) toRemove.push(c);
  });
  toRemove.forEach((c) => root.classList.remove(c));
  root.classList.add(`theme-${theme}`);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export const AppearanceSettingsPane = () => {
  const [selected, setSelected] = useState<AppTheme>(getStoredTheme());

  useEffect(() => {
    applyTheme(selected);
  }, [selected]);

  const themes = useMemo(
    () => [
      {
        id: "light" as const,
        label: "Light",
        swatch: (
          <div
            className="h-8 w-8 rounded-full border border-gray-300"
            style={{ background: "#ffffff" }}
          />
        ),
      },
      {
        id: "gray" as const,
        label: "Gray",
        swatch: (
          <div
            className="h-8 w-8 rounded-full border border-gray-700"
            style={{ background: "#242424" }}
          />
        ),
      },
      {
        id: "black" as const,
        label: "Black",
        swatch: (
          <div
            className="h-8 w-8 rounded-full border border-gray-800"
            style={{ background: "#000000" }}
          />
        ),
      },
      {
        id: "aurora" as const,
        label: "Aurora",
        swatch: (
          <div
            className="h-8 w-8 rounded-full border border-gray-700"
            style={{
              background:
                "radial-gradient(28px 14px at 20% 10%, #2d81ff, transparent), radial-gradient(32px 20px at 80% 80%, #1cb6be, transparent), #0d0f16",
            }}
          />
        ),
      },
      {
        id: "sunset" as const,
        label: "Sunset",
        swatch: (
          <div
            className="h-8 w-8 rounded-full border border-gray-700"
            style={{
              background:
                "radial-gradient(28px 14px at 20% 10%, #8b5cf6, transparent), radial-gradient(32px 20px at 80% 80%, #fb923c, transparent), #140b12",
            }}
          />
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div>
        <Label>Themes</Label>
        <p className="text-sm opacity-70">
          Choose your preferred look. Applies instantly.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {themes.map((t) => (
          <button
            key={t.id}
            className={`group flex items-center gap-3 rounded-lg border border-white/10 bg-[#63636B]/10 p-2 text-left transition-colors duration-100 hover:bg-[#63636B]/30 ${
              selected === t.id ? "ring-2 ring-brand-primary-500" : ""
            }`}
            onClick={() => setSelected(t.id)}
            aria-pressed={selected === t.id}
          >
            {t.swatch}
            <div className="text-sm opacity-90">{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
