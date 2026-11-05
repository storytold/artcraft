import { setLanguage, useTranslation } from "@storyteller/i18n";
import { CheckIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
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
  const { language, t: translateUI } = useTranslation();

  const [selected, setSelected] = useState<AppTheme>(getStoredTheme());

  useEffect(() => {
    applyTheme(selected);
  }, [selected]);

  const themes = useMemo(
    () => [
      {
        id: "gray" as const,
        label: "Default",
        swatch: <Swatch background="#121316" />,
      },
      {
        id: "light" as const,
        label: "Light",
        swatch: <Swatch background="#ffffff" />,
      },
      {
        id: "black" as const,
        label: "Black",
        swatch: <Swatch background="#000000" />,
      },
      {
        id: "aurora" as const,
        label: "Aurora",
        swatch: (
          <Swatch background="radial-gradient(28px 14px at 20% 10%, #2d81ff, transparent), radial-gradient(32px 20px at 80% 80%, #1cb6be, transparent), #0d0f16" />
        ),
      },
      {
        id: "sunset" as const,
        label: "Sunset",
        swatch: (
          <Swatch background="radial-gradient(28px 14px at 20% 10%, #8b5cf6, transparent), radial-gradient(32px 20px at 80% 80%, #fb923c, transparent), #140b12" />
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4 pt-3 text-base-fg">
      <div className="flex flex-col gap-2">
        <Label htmlFor="interface-language">{translateUI("Interface language")}</Label>
        <select
          id="interface-language"
          className="border border-ui-panel-border bg-base px-3 py-2 text-base-fg"
          value={language}
          onChange={(event) => {
            if (event.target.value === "en" || event.target.value === "zh-TW") {
              setLanguage(event.target.value);
            }
          }}
        >
          <option value="en">English</option>
          <option value="zh-TW">繁體中文（台灣）</option>
        </select>
        <p className="text-xs opacity-70">
          {translateUI("Changes apply immediately. Your creative work stays unchanged.")}
        </p>
      </div>
      <div className="flex flex-col gap-0.5">
        <Label>{translateUI("Themes")}</Label>
        <p className="text-xs opacity-70">{translateUI("Choose your preferred look. Applies instantly.")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {themes.map((t) => {
          const isSelected = selected === t.id;
          return (
            <button
              key={t.id}
              className={twMerge(
                "group flex items-center gap-3 border p-2 text-left transition-colors duration-100",
                isSelected
                  ? "border-base-fg/70 bg-base-fg/10"
                  : "border-ui-panel-border bg-base-fg/[0.03] hover:border-base-fg/30 hover:bg-base-fg/[0.06]",
              )}
              onClick={() => setSelected(t.id)}
              aria-pressed={isSelected}
            >
              {t.swatch}
              <span className="flex-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
                {translateUI(t.label)}
              </span>
              {isSelected && (
                <CheckIcon aria-hidden className="mr-1 h-3.5 w-3.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Swatch = ({ background }: { background: string }) => (
  <div
    className="h-8 w-8 shrink-0 border border-base-fg/20"
    style={{ background }}
  />
);
