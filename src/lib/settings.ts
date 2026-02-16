export type Theme = "light" | "dark";
export type CalcMode = "sequential" | "expression";

export type Settings = {
  taxRate: number; // 0.10 = 10%
  precision: number; // 小数点以下桁数
  grouping: boolean;
  scientific: boolean;
  theme: Theme;
  mode: CalcMode;
};

const KEY = "browsercalc:settings";

export const defaultSettings: Settings = {
  taxRate: 0.1,
  precision: 3,
  grouping: true,
  scientific: false,
  theme: "light",
  mode: "sequential",
};

function safeParse(json: string | null): Partial<Settings> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Partial<Settings>;
  } catch {
    return {};
  }
}

export function loadSettings(): Settings {
  if (typeof localStorage === "undefined") return defaultSettings;
  const raw = localStorage.getItem(KEY);
  const parsed = safeParse(raw);
  return {
    ...defaultSettings,
    ...parsed,
    // sanitize
    taxRate: clampNumber(parsed.taxRate, 0, 1, defaultSettings.taxRate),
    precision: clampNumber(parsed.precision, 1, 6, defaultSettings.precision),
    grouping: parsed.grouping ?? defaultSettings.grouping,
    scientific: parsed.scientific ?? defaultSettings.scientific,
    theme: parsed.theme === "dark" ? "dark" : "light",
    mode: parsed.mode === "expression" ? "expression" : "sequential",
  };
}

export function saveSettings(settings: Settings): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(settings));
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}
