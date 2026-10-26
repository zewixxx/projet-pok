import type { ReactNode } from "react";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
}

interface SegmentedProps<T extends string | number> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
}

/** Groupe de choix exclusifs (préréglages, thème…). */
export function Segmented<T extends string | number>({ options, value, onChange, label, disabled }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          aria-label={o.ariaLabel}
          className="segmented__btn"
          disabled={disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
