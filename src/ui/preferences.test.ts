import { beforeEach, describe, expect, it } from "vitest";
import { applyPreferences, getPreferences, resolveTheme, setPreferences } from "./preferences";

describe("préférences d'affichage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setPreferences({ theme: "auto", textSize: "normal" });
  });

  it("applique le thème et la taille du texte sur la page", () => {
    setPreferences({ theme: "light", textSize: "large" });
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.dataset.text).toBe("large");
    expect(getPreferences()).toEqual({ theme: "light", textSize: "large" });
  });

  it("mémorise les choix localement", () => {
    setPreferences({ theme: "dark" });
    expect(JSON.parse(window.localStorage.getItem("projet-pok:preferences") ?? "{}")).toMatchObject({ theme: "dark" });
  });

  it("résout le mode automatique en clair ou sombre", () => {
    expect(["dark", "light"]).toContain(resolveTheme("auto"));
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
  });

  it("réapplique les préférences courantes", () => {
    setPreferences({ theme: "dark" });
    document.documentElement.dataset.theme = "light";
    applyPreferences();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
