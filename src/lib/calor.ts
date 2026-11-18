// Mapa de calor de la agrupación: posiciones normalizadas, densidad, escala de color y descripción.
import { geometria } from './diana';
import type { Sesion } from './modelo';

/** Punto en radios de diana: 1 es el borde exterior del anillo 1 y cada anillo mide 0,1; y hacia arriba. */
export interface Punto {
  x: number;
  y: number;
}

/** Con menos flechas marcadas se dibujan los impactos: un mapa de calor de pocas flechas engaña. */
export const MIN_CALOR = 30;

/**
 * Flechas con posición, divididas por el radio de su diana: las de 122, 80 y 40 cm se superponen por anillo.
 * Las corregidas con el teclado ya no tienen posición.
 */
export function puntosNormalizados(ss: Sesion[]): Punto[] {
  const p: Punto[] = [];
  for (const s of ss) {
    const r = geometria(s.dianaCm).radio;
    for (const ronda of s.registro)
      for (const f of ronda.flechas) if (f.pos) p.push({ x: f.pos.x / r, y: f.pos.y / r });
    for (const f of s.enCurso) if (f.pos) p.push({ x: f.pos.x / r, y: f.pos.y / r });
  }
  return p;
}

/** Centro de la celda (i, j) de una rejilla n×n sobre la diana; la fila 0 es la de arriba. */
export const centroCelda = (i: number, j: number, n: number): Punto => ({
  x: -1 + ((i + 0.5) * 2) / n,
  y: 1 - ((j + 0.5) * 2) / n,
});

/**
 * Densidad de impactos en una rejilla n×n que cubre la diana (de -1 a 1), con máximo 1; ceros sin puntos.
 * Cada punto se reparte entre las 4 celdas vecinas y luego se suaviza con un núcleo gaussiano separable
 * (dos pasadas 1D): el coste crece con flechas + n², no con flechas × n². Los fallos (fuera de la diana)
 * no cuentan. sigma en radios: 0,065 son unos dos tercios de anillo.
 */
export function densidad(puntos: Punto[], n = 64, sigma = 0.065): Float32Array {
  const celda = 2 / n;
  const malla = new Float32Array(n * n);
  for (const p of puntos) {
    if (Math.hypot(p.x, p.y) > 1) continue;
    const fx = (p.x + 1) / celda - 0.5,
      fy = (1 - p.y) / celda - 0.5;
    const i0 = Math.floor(fx),
      j0 = Math.floor(fy);
    const dx = fx - i0,
      dy = fy - j0;
    const sumar = (i: number, j: number, w: number) => {
      if (i >= 0 && i < n && j >= 0 && j < n) malla[j * n + i] += w;
    };
    sumar(i0, j0, (1 - dx) * (1 - dy));
    sumar(i0 + 1, j0, dx * (1 - dy));
    sumar(i0, j0 + 1, (1 - dx) * dy);
    sumar(i0 + 1, j0 + 1, dx * dy);
  }
  const s = sigma / celda;
  const radio = Math.max(1, Math.ceil(3 * s));
  const nucleo = Array.from({ length: 2 * radio + 1 }, (_, k) => Math.exp(-((k - radio) ** 2) / (2 * s * s)));
  const tmp = new Float32Array(n * n);
  const out = new Float32Array(n * n);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      let v = 0;
      for (let k = -radio; k <= radio; k++) {
        const ii = i + k;
        if (ii >= 0 && ii < n) v += malla[j * n + ii] * nucleo[k + radio];
      }
      tmp[j * n + i] = v;
    }
  let max = 0;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      let v = 0;
      for (let k = -radio; k <= radio; k++) {
        const jj = j + k;
        if (jj >= 0 && jj < n) v += tmp[jj * n + i] * nucleo[k + radio];
      }
      out[j * n + i] = v;
      if (v > max) max = v;
    }
  if (max > 0) for (let k = 0; k < out.length; k++) out[k] /= max;
  return out;
}

/** Escala con los colores de la diana (los de --diana-* en base.css; el canvas no lee variables CSS). */
export const PARADAS: [number, string][] = [
  [0, '#231f20'],
  [0.3, '#00a3da'],
  [0.55, '#e8403d'],
  [0.8, '#ffe14d'],
  [1, '#ffffff'],
];
/** Por debajo no se pinta: deja ver la diana donde casi no hay impactos. */
export const UMBRAL_CALOR = 0.05;

const rgb = (h: string) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));

/** Color de una densidad (0 a 1) como [r, g, b, a] de 0 a 255, para ImageData. */
export function colorCalor(t: number): [number, number, number, number] {
  if (!(t >= UMBRAL_CALOR)) return [0, 0, 0, 0];
  const v = Math.min(1, t);
  let k = 1;
  while (k < PARADAS.length - 1 && v > PARADAS[k][0]) k++;
  const [a, ca] = PARADAS[k - 1],
    [b, cb] = PARADAS[k];
  const f = (v - a) / (b - a);
  const c0 = rgb(ca),
    c1 = rgb(cb);
  const [r, g, bb] = c0.map((c, m) => Math.round(c + (c1[m] - c) * f));
  // La opacidad sube suave desde el umbral: un salto marcaría en escalones el borde de la mancha
  const e = Math.min(1, (v - UMBRAL_CALOR) / 0.25);
  const suave = e * e * (3 - 2 * e);
  return [r, g, bb, Math.round(Math.min(0.97, 0.45 + 0.8 * v) * suave * 255)];
}

/** Celda de mayor densidad, como punto; null si todo es cero. */
export function maximo(d: Float32Array, n: number): Punto | null {
  let k = -1,
    max = 0;
  for (let m = 0; m < d.length; m++)
    if (d[m] > max) {
      max = d[m];
      k = m;
    }
  return k < 0 ? null : centroCelda(k % n, Math.floor(k / n), n);
}

/** Anillo de un punto normalizado: «X», «10»…«1» o «M» (sin el grosor de la flecha). */
export function anillo(p: Punto): string {
  const r = Math.hypot(p.x, p.y);
  if (r >= 1) return 'M';
  if (r <= 0.05) return 'X';
  return String(10 - Math.floor(r / 0.1));
}

const DIRECCIONES = [
  'a la derecha',
  'arriba a la derecha',
  'arriba',
  'arriba a la izquierda',
  'a la izquierda',
  'abajo a la izquierda',
  'abajo',
  'abajo a la derecha',
];

/** Hacia dónde queda un punto respecto del centro, en 8 direcciones; «centrado» a menos de medio anillo. */
export function direccion(p: Punto): string {
  if (Math.hypot(p.x, p.y) < 0.05) return 'centrado';
  const a = Math.atan2(p.y, p.x);
  return DIRECCIONES[(Math.round(a / (Math.PI / 4)) + 8) % 8];
}

/** «9 · abajo a la izquierda» */
export const describir = (p: Punto) => `${anillo(p)} · ${direccion(p)}`;
