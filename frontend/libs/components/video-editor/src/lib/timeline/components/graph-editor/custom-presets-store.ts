"use client";

import { useSyncExternalStore } from "react";
import { generateUUID } from "../../../utils/id";
import type { NormalizedCubicBezier } from "../../../animation/types";
import type { EasingPreset } from "./easing-presets";

const STORAGE_KEY = "graph-editor-presets";

let cachedPresets: EasingPreset[] | null = null;
const listeners = new Set<() => void>();

function isValidPresetArray(value: unknown): value is EasingPreset[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.label === "string" &&
        Array.isArray(item.value) &&
        item.value.length === 4 &&
        item.value.every((number: unknown) => typeof number === "number"),
    )
  );
}

function readFromStorage(): EasingPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return isValidPresetArray(parsed) ? parsed : [];
  } catch {
    // Silently recover — corrupted localStorage shouldn't crash the editor
    return [];
  }
}

function writeToStorage({ presets }: { presets: EasingPreset[] }): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function getSnapshot(): EasingPreset[] {
  cachedPresets ??= readFromStorage();
  return cachedPresets;
}

function getServerSnapshot(): EasingPreset[] {
  return [];
}

function notify(): void {
  cachedPresets = null;
  for (const listener of listeners) {
    listener();
  }
}

function onStorageChange(event: StorageEvent): void {
  if (event.key === STORAGE_KEY) notify();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorageChange);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorageChange);
    }
  };
}

export function useCustomPresets(): EasingPreset[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function savePreset({ value }: { value: NormalizedCubicBezier }): void {
  const current = getSnapshot();
  writeToStorage({
    presets: [
      ...current,
      {
        id: generateUUID(),
        label: `Custom ${current.length + 1}`,
        value,
        isCustom: true,
      },
    ],
  });
  notify();
}

export function removePreset({ id }: { id: string }): void {
  writeToStorage({ presets: getSnapshot().filter((preset) => preset.id !== id) });
  notify();
}
