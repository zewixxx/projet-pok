import { useMemo } from "react";
import { IMPORT_STATS } from "../../import";

export default function ImportBanner() {
  const stats = IMPORT_STATS;
  if (!stats || stats.handsTotal === 0) return null;

  const date = useMemo(() => {
    try {
      return new Date(stats.importedAt).toLocaleString("fr-FR");
    } catch {
      return stats.importedAt;
    }
  }, [stats.importedAt]);

  return (
    <div className="import-banner" role="status">
      <span className="import-banner__icon">📥</span>
      <span className="import-banner__text">
        Import <strong>{stats.handsTotal.toLocaleString("fr-FR")} mains</strong>
        {" · "}{stats.tournamentsTotal} tournois
        {" · "}{stats.sessionsTotal} sessions
        {stats.totalProfitNet !== undefined && (
          <>{" · "}<strong className={stats.totalProfitNet >= 0 ? "import-banner__profit-pos" : "import-banner__profit-neg"}>
            {stats.totalProfitNet >= 0 ? "+" : ""}{stats.totalProfitNet.toLocaleString("fr-FR")}€
          </strong></>
        )}
      </span>
      <span className="import-banner__date">{date}</span>
    </div>
  );
}
