import { useCallback, useEffect, useRef, useState } from "react";

interface UseResizableHeightOptions {
  storageKey: string;
  /** 0 = mode auto (hauteur du contenu) jusqu’au premier redimensionnement */
  defaultHeight: number;
  minHeight: number;
  maxHeight: number;
  autoSize?: boolean;
}

export function useResizableHeight({
  storageKey,
  defaultHeight,
  minHeight,
  maxHeight,
  autoSize = false,
}: UseResizableHeightOptions) {
  const [height, setHeight] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "auto") return null;
      if (saved) {
        const n = parseInt(saved, 10);
        if (!Number.isNaN(n) && n > 0) {
          return Math.min(maxHeight, Math.max(minHeight, n));
        }
      }
    } catch {
      /* ignore */
    }
    if (autoSize || defaultHeight <= 0) return null;
    return defaultHeight;
  });

  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);
  const heightRef = useRef<number | null>(height);
  const panelRef = useRef<HTMLElement | null>(null);
  heightRef.current = height;

  const persist = useCallback(
    (h: number | null) => {
      try {
        localStorage.setItem(storageKey, h == null ? "auto" : String(h));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault();
      dragging.current = true;
      startY.current = e.clientY;
      const current =
        heightRef.current ??
        panelRef.current?.getBoundingClientRect().height ??
        minHeight;
      startH.current = current;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [minHeight],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const next = Math.min(
        maxHeight,
        Math.max(minHeight, startH.current + (e.clientY - startY.current)),
      );
      heightRef.current = next;
      setHeight(next);
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      persist(heightRef.current);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [minHeight, maxHeight, persist]);

  const reset = useCallback(() => {
    const next = autoSize || defaultHeight <= 0 ? null : defaultHeight;
    setHeight(next);
    persist(next);
  }, [autoSize, defaultHeight, persist]);

  return { height, onPointerDown, reset, panelRef };
}
