import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Étiquette discrète au-dessus du titre (ex. mode démonstration). */
  eyebrow?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {eyebrow && <div className="page-header__eyebrow">{eyebrow}</div>}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
