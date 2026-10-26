/**
 * Préférences d'affichage : thème (auto / sombre / clair) et taille du texte.
 * Stockées localement, appliquées sur <html> pour piloter les tokens CSS.
 */

import { useSyncExternalStore } from "react";

export type ThemePreference = "auto" | "dark" | "light";
export type TextSize = "normal" | "large";

export interface Preferences {
  theme: ThemePreference;
  textSize: TextSize;
}

const STORAGE_KEY = "projet-pok:preferences";
const DEFAULTS: Preferences = { theme: "auto", textSize: "normal" };

function read(): Preferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      theme: parsed.theme === "dark" || parsed.theme === "light" ? parsed.theme : "auto",
      textSize: parsed.textSize === "large" ? "large" : "normal",
    };
  } catch {
    return DEFAULTS;
  }
}

let current: Preferences = typeof window === "undefined" ? DEFAULTS : read();
const listeners = new Set<() => void>();

function systemPrefersLight(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches === true;
}

export function resolveTheme(pref: ThemePreference): "dark" | "light" {
  if (pref === "auto") return systemPrefersLight() ? "light" : "dark";
  return pref;
}

export function applyPreferences(prefs: Preferences = current): void {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(prefs.theme);
  root.dataset.text = prefs.textSize;
}

function emit(): void {
  for (const l of listeners) l();
}

export function getPreferences(): Preferences {
  return current;
}

export function setPreferences(patch: Partial<Preferences>): void {
  current = { ...current, ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* stockage indisponible : on garde la valeur en mémoire */
  }
  applyPreferences(current);
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Thème « auto » : on suit le système en direct.
if (typeof window !== "undefined" && window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: light)").addEventListener?.("change", () => {
    if (current.theme === "auto") {
      applyPreferences(current);
      emit();
    }
  });
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, getPreferences, getPreferences);
}
