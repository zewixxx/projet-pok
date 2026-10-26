import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (id: T) => void;
  label: string;
  /** Préfixe commun aux id pour relier onglet ↔ panneau (voir tabPanelProps). */
  idPrefix?: string;
}

export function tabIds(prefix: string, id: string) {
  return { tab: `${prefix}-tab-${id}`, panel: `${prefix}-panel-${id}` };
}

/** Onglets accessibles : flèches gauche/droite, Début/Fin, tabindex itinérant. */
export function Tabs<T extends string>({ tabs, value, onChange, label, idPrefix }: TabsProps<T>) {
  const autoId = useId();
  const prefix = idPrefix ?? autoId;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (e: KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    const target = tabs[next];
    onChange(target.id);
    refs.current[target.id]?.focus();
  };

  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => {
        const ids = tabIds(prefix, t.id);
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={ids.tab}
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            className="tab"
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => move(e, i)}
          >
            {t.icon}
            <span className="truncate">{t.label}</span>
            {t.count != null && t.count > 0 && <span className="tab__count">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
