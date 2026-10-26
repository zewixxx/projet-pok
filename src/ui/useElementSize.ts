import { useLayoutEffect, useRef, useState } from "react";

/** Largeur/hauteur mesurées d'un élément (suit les redimensionnements de la fenêtre). */
export function useElementSize<T extends HTMLElement>(): [React.RefObject<T>, { width: number; height: number }] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Mesure avant la première peinture : pas de flash à la mauvaise taille.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}
