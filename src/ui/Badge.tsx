import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export type Tone = "neutral" | "brand" | "pos" | "neg" | "warn" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  outline?: boolean;
}

export function Badge({ tone = "neutral", outline, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx("badge", tone !== "neutral" && `badge--${tone}`, outline && "badge--outline", className)} {...rest}>
      {children}
    </span>
  );
}
