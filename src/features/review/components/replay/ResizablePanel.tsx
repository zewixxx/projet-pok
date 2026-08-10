import type { ReactNode } from "react";
import { useResizableHeight } from "../../hooks/useResizableHeight";

interface ResizablePanelProps {
  id: string;
  title?: string;
  defaultHeight: number;
  minHeight?: number;
  maxHeight?: number;
  /** Si true : hauteur = contenu, jusqu’à ce que l’utilisateur redimensionne */
  autoSize?: boolean;
  className?: string;
  children: ReactNode;
}

export function ResizablePanel({
  id,
  title,
  defaultHeight,
  minHeight = 100,
  maxHeight = 600,
  autoSize = false,
  className = "",
  children,
}: ResizablePanelProps) {
  const { height, onPointerDown, reset, panelRef } = useResizableHeight({
    storageKey: `pok-resize-v2-${id}`,
    defaultHeight,
    minHeight,
    maxHeight,
    autoSize,
  });

  const isAuto = height == null;

  return (
    <section
      ref={(el) => {
        panelRef.current = el;
      }}
      className={`resize-panel ${isAuto ? "resize-panel--auto" : ""} ${className}`.trim()}
      style={isAuto ? { minHeight } : { height: height ?? undefined, minHeight }}
      aria-label={title}
    >
      {title && (
        <div className="resize-panel__toolbar">
          <span className="resize-panel__title">{title}</span>
          <button
            type="button"
            className="resize-panel__reset"
            onClick={reset}
            title="Taille automatique"
          >
            ↺ Auto
          </button>
        </div>
      )}
      <div className="resize-panel__body">{children}</div>
      <div
        className="resize-panel__handle"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Redimensionner — glisser pour agrandir ou réduire"
        onPointerDown={onPointerDown}
        title="Glisser pour ajuster la taille"
      >
        <span className="resize-panel__grip" aria-hidden />
        <span className="resize-panel__hint">↕ Agrandir / réduire</span>
      </div>
    </section>
  );
}
