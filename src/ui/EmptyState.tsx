import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function EmptyState({ icon, title, children, actions }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="empty__icon" aria-hidden>
        {icon}
      </div>
      <h3 className="empty__title">{title}</h3>
      {children && <p className="empty__text">{children}</p>}
      {actions && <div className="empty__actions">{actions}</div>}
    </div>
  );
}
