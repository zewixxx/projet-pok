/**
 * Plugin Vite — import automatique du dossier history/ au démarrage dev/build.
 * Comportement traqueur : analyse tout le dossier si les données sont absentes ou obsolètes.
 */

import { spawnSync } from "child_process";
import { existsSync, readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";
import type { Plugin } from "vite";

function needsImport(root: string): boolean {
  const historyDir = join(root, "history");
  const realData   = join(root, "src", "features", "import", "realData.json");
  const handsDir   = join(root, "src", "features", "import", "hands");

  if (!existsSync(historyDir)) return false;

  const txtFiles = readdirSync(historyDir).filter(f => f.toLowerCase().endsWith(".txt"));
  if (txtFiles.length === 0) return false;

  if (!existsSync(realData)) return true;

  const handsFiles = existsSync(handsDir)
    ? readdirSync(handsDir).filter(f => f.endsWith(".json"))
    : [];
  if (handsFiles.length === 0) return true;

  try {
    const raw = JSON.parse(readFileSync(realData, "utf8"));
    // Ancien format bugué (mains inline ou sans stats)
    if (Array.isArray(raw.hands) && raw.hands.length > 0) return true;
    if (!raw.stats) return true;
    if (!Array.isArray(raw.sessions) || raw.sessions.length === 0) return true;
  } catch { return true; }

  const realDataMtime = statSync(realData).mtimeMs;
  return txtFiles.some(f => statSync(join(historyDir, f)).mtimeMs > realDataMtime);
}

export function importHistoryPlugin(): Plugin {
  let ran = false;

  return {
    name: "import-history",
    config() {
      if (ran) return;
      ran = true;

      const root = process.cwd();
      if (!needsImport(root)) return;

      console.log("\n📥  Import automatique du dossier history/ …\n");

      const result = spawnSync(
        process.execPath,
        [join(root, "scripts", "import-history.mjs")],
        { cwd: root, stdio: "inherit" },
      );

      if (result.status !== 0) {
        console.warn("\n⚠️   Import history échoué. Lancez : node scripts/import-history.mjs\n");
      }
    },
  };
}
