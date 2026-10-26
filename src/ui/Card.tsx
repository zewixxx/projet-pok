import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article" | "aside";
  flush?: boolean;
  interactive?: boolean;
}

export function Card({ as: Tag = "section", flush, interactive, className, children, ...rest }: CardProps) {
  return (
    <Tag className={cx("card", flush && "card--flush", interactive && "card--interactive", className)} {...rest}>
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3;
  id?: string;
}

export function CardHeader({ title, sub, actions, headingLevel = 2, id }: CardHeaderProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <header className="card__header">
      <div>
        <Heading className="card__title" id={id}>
          {title}
        </Heading>
        {sub && <p className="card__sub">{sub}</p>}
      </div>
      {actions && <div className="card__actions">{actions}</div>}
    </header>
  );
}
