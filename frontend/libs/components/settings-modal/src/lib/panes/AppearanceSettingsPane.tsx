import { CheckIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Label } from "@storyteller/ui-label";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { ListSystemFonts } from "@storyteller/tauri-api";
import { useEffect, useMemo, useState } from "react";
import { getStoredUiFont, quoteFontFamily, setUiFont } from "../ui-font";

type AppTheme = "light" | "gray" | "black" | "aurora" | "sunset";

const THEME_STORAGE_KEY = "st-theme";

// Each row previews its own font, and systems can have thousands installed.
const MAX_LISTED_FONTS = 100;

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
      <div className="flex flex-col gap-0.5">
        <Label>Themes</Label>
        <p className="text-xs opacity-70">
          Choose your preferred look. Applies instantly.
        </p>
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
                {t.label}
              </span>
              {isSelected && (
                <CheckIcon aria-hidden className="mr-1 h-3.5 w-3.5" />
              )}
            </button>
          );
        })}
      </div>
      <InterfaceFontSetting />
    </div>
  );
};

const InterfaceFontSetting = () => {
  const [selected, setSelected] = useState<string | null>(getStoredUiFont());
  // null while loading.
  const [families, setFamilies] = useState<string[] | "error" | null>(null);
  const [search, setSearch] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    ListSystemFonts()
      .then((result) => setFamilies(result.payload.families))
      .catch(() => setFamilies("error"));
  }, []);

  const matches = useMemo(() => {
    if (!Array.isArray(families)) return [];
    const query = search.trim().toLowerCase();
    if (!query) return families;
    const found = families.filter((f) => f.toLowerCase().includes(query));
    // An exact name goes first so the MAX_LISTED_FONTS cap can't hide it.
    const exact = found.filter((f) => f.toLowerCase() === query);
    return [...exact, ...found.filter((f) => f.toLowerCase() !== query)];
  }, [families, search]);

  const message =
    families === "error"
      ? "Couldn't load installed fonts."
      : families === null
        ? "Loading fonts…"
        : matches.length === 0
          ? "No installed fonts match."
          : null;

  const choose = (family: string | null) => {
    setSaveFailed(!setUiFont(family));
    setSelected(family);
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <Label>Interface font</Label>
          <p className="text-xs opacity-70">
            Current: {selected ?? "Default"}
          </p>
          {saveFailed && (
            <p className="text-xs opacity-70">
              Applied for now, but couldn't be saved for the next launch.
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          className="text-xs"
          disabled={!selected}
          onClick={() => choose(null)}
        >
          Restore default
        </Button>
      </div>
      <Input
        placeholder="Search installed fonts"
        aria-label="Search installed fonts"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {message ? (
        <p className="text-xs opacity-70">{message}</p>
      ) : (
        <div
          role="group"
          aria-label="Installed fonts"
          className="max-h-56 overflow-y-auto border border-ui-panel-border"
        >
          {matches.slice(0, MAX_LISTED_FONTS).map((family) => {
            const isSelected = selected === family;
            return (
              <button
                key={family}
                aria-pressed={isSelected}
                className={twMerge(
                  "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors duration-100",
                  isSelected ? "bg-base-fg/10" : "hover:bg-base-fg/[0.06]",
                )}
                style={{ fontFamily: `${quoteFontFamily(family)}, sans-serif` }}
                onClick={() => choose(family)}
              >
                <span className="flex-1 truncate">{family}</span>
                {isSelected && (
                  <CheckIcon aria-hidden className="h-3.5 w-3.5 shrink-0" />
                )}
              </button>
            );
          })}
          {matches.length > MAX_LISTED_FONTS && (
            <p className="px-2 py-1.5 text-xs opacity-70">
              {matches.length - MAX_LISTED_FONTS} more. Type to narrow the
              list.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const Swatch = ({ background }: { background: string }) => (
  <div
    className="h-8 w-8 shrink-0 border border-base-fg/20"
    style={{ background }}
  />
);
