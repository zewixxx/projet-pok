import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  /** Icône affichée avant le texte. */
  icon?: ReactNode;
  /** Bouton carré avec icône seule : fournir aria-label. */
  iconOnly?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  block,
  icon,
  iconOnly,
  loading,
  className,
  children,
  type = "button",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "btn",
        `btn--${variant}`,
        size !== "md" && `btn--${size}`,
        block && "btn--block",
        iconOnly && "btn--icon",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="btn__spinner" aria-hidden /> : icon}
      {children}
    </button>
  );
}
