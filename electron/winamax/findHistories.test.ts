import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { scanPokerHistories, sniffRoom } from "./findHistories";

function rootsFor(base: string) {
  return {
    documents: path.join(base, "Documents"),
    roaming: path.join(base, "Roaming"),
    local: path.join(base, "Local"),
    downloads: path.join(base, "Downloads"),
    desktop: path.join(base, "Desktop"),
  };
}

describe("sniffRoom", () => {
  it("reconnaît Winamax et PokerStars d’après l’en-tête", () => {
    expect(sniffRoom("Winamax Poker - Tournament summary")).toBe("Winamax");
    expect(sniffRoom("PokerStars Hand #123456: Tournament")).toBe("PokerStars");
    expect(sniffRoom("notes de vacances")).toBeNull();
  });
});

describe("scanPokerHistories", () => {
  it("trouve les dossiers habituels et ignore le reste", () => {
    const base = mkdtempSync(path.join(tmpdir(), "pok-scan-"));
    const roots = rootsFor(base);
    mkdirSync(path.join(roots.documents, "Winamax Poker", "Accounts", "zewix", "History"), { recursive: true });
    writeFileSync(
      path.join(roots.documents, "Winamax Poker", "Accounts", "zewix", "History", "hand.txt"),
      "Winamax Poker - CashGame",
    );
    mkdirSync(path.join(roots.local, "PokerStars.FR", "HandHistory", "hero"), { recursive: true });
    writeFileSync(
      path.join(roots.local, "PokerStars.FR", "HandHistory", "hero", "hh.txt"),
      "PokerStars Hand #99",
    );
    mkdirSync(path.join(roots.documents, "Photos"), { recursive: true });
    writeFileSync(path.join(roots.documents, "Photos", "notes.txt"), "PokerStars Hand #ne-pas-lire");
    mkdirSync(roots.downloads, { recursive: true });
    writeFileSync(path.join(roots.downloads, "winamax-export.dat"), "encrypted");
    mkdirSync(roots.desktop, { recursive: true });
    mkdirSync(roots.roaming, { recursive: true });

    const found = scanPokerHistories(roots);
    const txt = found.filter((item) => item.kind === "txt");
    const dat = found.filter((item) => item.kind === "dat");

    expect(txt.map((item) => item.room).sort()).toEqual(["PokerStars", "Winamax"]);
    expect(txt.find((item) => item.room === "Winamax")?.account).toBe("zewix");
    expect(txt.find((item) => item.room === "PokerStars")?.account).toBe("hero");
    expect(dat).toHaveLength(1);
    expect(found.some((item) => item.dir.includes("Photos"))).toBe(false);
  });
});
