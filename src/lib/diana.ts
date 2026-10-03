// Geometría y puntuación de las dianas de 10 anillos de World Archery.
// Todas las medidas en milímetros. Origen en el centro; x hacia la derecha, y hacia arriba.

export type TipoDiana = 122 | 80 | 40;

export const DIANAS: { cm: TipoDiana; nombre: string }[] = [
  { cm: 122, nombre: '122 cm' },
  { cm: 80, nombre: '80 cm' },
  { cm: 40, nombre: '40 cm' },
];

/** Radio del tubo de una flecha recurvo típica (~9 mm de diámetro en el agujero). */
export const RADIO_FLECHA_MM = 4.5;

export interface Geometria {
  radio: number;   // radio exterior (anillo 1)
  anillo: number;  // ancho de cada anillo
  radioX: number;  // radio del anillo X
}

export function geometria(cm: TipoDiana): Geometria {
  const radio = cm * 5;            // cm → mm, mitad del diámetro
  const anillo = radio / 10;
  return { radio, anillo, radioX: anillo / 2 };
}

export interface Impacto {
  puntaje: number;  // 0 = M (fuera), 1..10
  x: boolean;       // dentro del anillo X
}

/**
 * Puntúa una flecha por su posición.
 * Regla de la línea: si el tubo toca la línea divisoria, cuenta el valor mayor.
 * Por eso se resta el radio de la flecha a la distancia al centro.
 */
export function puntuar(xmm: number, ymm: number, cm: TipoDiana, radioFlecha = RADIO_FLECHA_MM): Impacto {
  const g = geometria(cm);
  const d = Math.max(0, Math.hypot(xmm, ymm) - radioFlecha);
  if (d >= g.radio) return { puntaje: 0, x: false };
  const puntaje = 10 - Math.floor(d / g.anillo);
  return { puntaje, x: d <= g.radioX };
}

export type Zona = 'oro' | 'rojo' | 'azul' | 'negro' | 'blanco' | 'fuera';

export function zona(puntaje: number): Zona {
  if (puntaje >= 9) return 'oro';
  if (puntaje >= 7) return 'rojo';
  if (puntaje >= 5) return 'azul';
  if (puntaje >= 3) return 'negro';
  if (puntaje >= 1) return 'blanco';
  return 'fuera';
}

export function etiqueta(i: Impacto): string {
  if (i.x) return 'X';
  if (i.puntaje === 0) return 'M';
  return String(i.puntaje);
}
