import { useEffect, useId, useRef, useState } from "react";

export type AppPage = "dashboard" | "review" | "winamax";

interface NavItem {
  id: AppPage;
  label: string;
  hint: string;
}

const ITEMS: NavItem[] = [
  { id: "dashboard", label: "Score", hint: "Performances & fuites" },
  { id: "review", label: "Review", hint: "Rejouer tes mains" },
  { id: "winamax", label: "Winamax", hint: "Sync & analyse" },
];

interface BurgerNavProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export default function BurgerNav({ activePage, onNavigate }: BurgerNavProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const active = ITEMS.find((i) => i.id === activePage);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="burger-nav" ref={rootRef}>
      <button
        type="button"
        className={`burger-nav__btn${open ? " burger-nav__btn--open" : ""}`}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="burger-nav__icon" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </button>

      <span className="burger-nav__current" aria-live="polite">
        {active?.label}
      </span>

      {open && (
        <div className="burger-nav__panel" id={menuId} role="menu">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={`burger-nav__item${item.id === activePage ? " burger-nav__item--active" : ""}`}
              onClick={() => {
                onNavigate(item.id);
                setOpen(false);
              }}
            >
              <span className="burger-nav__item-label">{item.label}</span>
              <span className="burger-nav__item-hint">{item.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
