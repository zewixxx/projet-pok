interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  accent?: boolean;
  icon?: string;
}

export function StatCard({ label, value, sub, trend, accent, icon }: StatCardProps) {
  const trendIcon = trend === "up" ? "▲" : trend === "down" ? "▼" : null;
  const trendClass = trend === "up" ? "stat-card__trend--up" : trend === "down" ? "stat-card__trend--down" : "";

  return (
    <div className={`stat-card${accent ? " stat-card--accent" : ""}`}>
      {icon && <div className="stat-card__icon">{icon}</div>}
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {(sub || trend) && (
        <div className="stat-card__footer">
          {trendIcon && (
            <span className={`stat-card__trend ${trendClass}`}>{trendIcon}</span>
          )}
          {sub && <span className="stat-card__sub">{sub}</span>}
        </div>
      )}
    </div>
  );
}
