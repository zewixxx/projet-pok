import type { ReactNode } from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <label className="switch">
      <input
        className="switch__input"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch__track" aria-hidden />
      <span className="switch__text">
        {label}
        {description && <span className="switch__desc">{description}</span>}
      </span>
    </label>
  );
}
