import { afterEach, expect, test, vi } from "vitest";
import { defaultSettings, loadSettings } from "./settings";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("defaults to expression mode when no preference is saved", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => null,
  });

  expect(defaultSettings.mode).toBe("expression");
  expect(loadSettings().mode).toBe("expression");
});

test("keeps a saved sequential mode preference", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => JSON.stringify({ mode: "sequential" }),
  });

  expect(loadSettings().mode).toBe("sequential");
});

test("falls back to expression mode for an invalid saved mode", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => JSON.stringify({ mode: "unexpected" }),
  });

  expect(loadSettings().mode).toBe("expression");
});
