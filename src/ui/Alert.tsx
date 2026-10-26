import type { ReactNode } from "react";
import { cx } from "./cx";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "./icons";

interface AlertProps {
  tone?: "info" | "warn" | "neg" | "pos";
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  role?: "status" | "alert";
}

const ICONS = { info: Info, warn: TriangleAlert, neg: CircleAlert, pos: CircleCheck } as const;

export function Alert({ tone = "info", children, action, className, role }: AlertProps) {
  const Icon = ICONS[tone];
  return (
    <div className={cx("alert", `alert--${tone}`, className)} role={role ?? (tone === "neg" ? "alert" : "status")}>
      <Icon size={18} aria-hidden />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {action}
    </div>
  );
}
