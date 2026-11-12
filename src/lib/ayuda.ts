// Ayuda de la diana («Mantén presionado…»): se muestra hasta que el usuario marca unas cuantas flechas.

const CLAVE = 'registro-tiro:marcas-diana';
/** Flechas marcadas en la diana a partir de las cuales la ayuda deja de mostrarse sola. */
export const UMBRAL_AYUDA = 12;

function leer(): number {
  try {
    const n = Number(localStorage.getItem(CLAVE));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** La ayuda todavía es nueva para el usuario. Sin almacenamiento, se muestra siempre. */
export const ayudaNueva = () => leer() < UMBRAL_AYUDA;

/** Cuenta una flecha marcada en la diana (deja de contar al llegar al umbral). */
export function contarMarca(): void {
  const n = leer();
  if (n >= UMBRAL_AYUDA) return;
  try {
    localStorage.setItem(CLAVE, String(n + 1));
  } catch {
    /* sin almacenamiento: la ayuda sigue visible */
  }
}
