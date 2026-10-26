/**
 * Grave build/icon.ico dans l'exécutable Windows.
 * electron-builder ne peut pas le faire ici : l'outil officiel exige des liens
 * symboliques que Windows refuse sans privilège administrateur.
 */
const fs = require("fs");
const path = require("path");
const ResEdit = require("resedit");

function setExeIcon(exePath, icoPath) {
  const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath));
  const res = ResEdit.NtExecutableResource.from(exe);
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const targets = groups.length ? groups : [{ id: 1, lang: 1033 }];

  for (const group of targets) {
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
      res.entries,
      group.id,
      group.lang,
      iconFile.icons.map((item) => item.data),
    );
  }

  res.outputResource(exe);
  const next = Buffer.from(exe.generate());
  const tmp = `${exePath}.tmp`;
  fs.writeFileSync(tmp, next);
  fs.rmSync(exePath, { force: true });
  fs.renameSync(tmp, exePath);
}

/** Crochet electron-builder, appelé après la construction de l'application. */
module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return;
  const exe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const ico = path.join(__dirname, "..", "build", "icon.ico");
  setExeIcon(exe, ico);
  console.log("Icône appliquée :", exe);
};

if (require.main === module) {
  const [exe, ico] = process.argv.slice(2);
  if (!exe || !ico) {
    console.error("Usage: node scripts/set-exe-icon.cjs <app.exe> <icon.ico>");
    process.exit(1);
  }
  setExeIcon(exe, ico);
  console.log("Icône appliquée :", exe);
}
