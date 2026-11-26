// Libreta de marcas de mira: una elevación (y una nota) por distancia, independiente de las sesiones.
import { LIMITES } from './modelo';

/** Versión del formato de las marcas, aparte de VERSION_DATOS (las sesiones no cambian). */
export const VERSION_MIRA = 1;

export interface MarcaMira {
  version: number;
  distanciaM: number;
  elevacion: number;
  nota: string;
  /** ISO 8601 del último cambio. */
  actualizada: string;
}

/** Rango y paso de la elevación (decisión del usuario: 0 a 100 en pasos de 0,1). */
export const ELEVACION = { min: 0, max: 100, paso: 0.1, decimales: 1 } as const;
export const MAX_NOTA_MIRA = 200;
/** Distancias de los atajos del editor. */
export const DISTANCIAS_HABITUALES = [18, 30, 50, 60, 70];
/** Perilla: 20 retenes por vuelta, 18° cada uno (una vuelta = 2,0). */
export const GRADOS_POR_PASO = 18;

/** Redondea a los decimales de la elevación sin arrastrar error de coma flotante. */
export const redondear = (v: number, d: number = ELEVACION.decimales) => Math.round(v * 10 ** d) / 10 ** d;

/** Elevación dentro del rango y redondeada al paso. */
export const acotar = (v: number) => redondear(Math.min(ELEVACION.max, Math.max(ELEVACION.min, v)));

const distanciaValida = (d: unknown): d is number =>
  typeof d === 'number' && Number.isInteger(d) && d >= LIMITES.distanciaM.min && d <= LIMITES.distanciaM.max;
const elevacionValida = (e: unknown): e is number =>
  typeof e === 'number' && Number.isFinite(e) && e >= ELEVACION.min && e <= ELEVACION.max;

/**
 * Marca validada de una entrada externa (IndexedDB o CSV); null si la distancia o la elevación no sirven.
 * La nota se recorta y una fecha no válida o futura pasa a ser la de ahora (una futura ganaría siempre al importar).
 */
export function validarMarca(v: unknown, ahora = new Date()): MarcaMira | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!distanciaValida(o.distanciaM) || !elevacionValida(o.elevacion)) return null;
  const t = typeof o.actualizada === 'string' ? Date.parse(o.actualizada) : NaN;
  return {
    version: VERSION_MIRA,
    distanciaM: o.distanciaM,
    elevacion: redondear(o.elevacion),
    nota: typeof o.nota === 'string' ? o.nota.slice(0, MAX_NOTA_MIRA) : '',
    actualizada: new Date(Number.isNaN(t) || t > ahora.getTime() ? ahora : t).toISOString(),
  };
}

/** Una marca por distancia, la de fecha más reciente (p. ej. varias copias importadas a la vez). */
export function unaPorDistancia(ms: MarcaMira[]): MarcaMira[] {
  const porDistancia = new Map<number, MarcaMira>();
  for (const m of ms) {
    const previa = porDistancia.get(m.distanciaM);
    if (!previa || Date.parse(m.actualizada) > Date.parse(previa.actualizada)) porDistancia.set(m.distanciaM, m);
  }
  return [...porDistancia.values()];
}

/** Marca nueva o editada, con la fecha de ahora. */
export function crearMarca(distanciaM: number, elevacion: number, nota: string, ahora = new Date()): MarcaMira {
  return {
    version: VERSION_MIRA,
    distanciaM,
    elevacion: acotar(elevacion),
    nota: nota.trim().slice(0, MAX_NOTA_MIRA),
    actualizada: ahora.toISOString(),
  };
}

export const ordenarMarcas = (ms: MarcaMira[]) => [...ms].sort((a, b) => a.distanciaM - b.distanciaM);

export const marcaDe = (ms: MarcaMira[], distanciaM: number) => ms.find((m) => m.distanciaM === distanciaM);

/** Marca de la distancia más cercana (en empate, la menor): punto de partida para una marca nueva. */
export function masCercana(ms: MarcaMira[], distanciaM: number): MarcaMira | undefined {
  let mejor: MarcaMira | undefined;
  for (const m of ordenarMarcas(ms)) {
    if (!mejor || Math.abs(m.distanciaM - distanciaM) < Math.abs(mejor.distanciaM - distanciaM)) mejor = m;
  }
  return mejor;
}

/**
 * Une las marcas importadas con las del teléfono: por distancia gana la de fecha más reciente.
 * Devuelve las que hay que guardar y los recuentos.
 */
export function fusionar(
  actuales: MarcaMira[],
  importadas: MarcaMira[],
): { guardar: MarcaMira[]; nuevas: number; actualizadas: number; iguales: number } {
  const guardar: MarcaMira[] = [];
  let nuevas = 0,
    actualizadas = 0,
    iguales = 0;
  for (const m of unaPorDistancia(importadas)) {
    const a = marcaDe(actuales, m.distanciaM);
    if (!a) {
      nuevas++;
      guardar.push(m);
    } else if (Date.parse(m.actualizada) > Date.parse(a.actualizada)) {
      actualizadas++;
      guardar.push(m);
    } else iguales++;
  }
  return { guardar, nuevas, actualizadas, iguales };
}

// ---- Texto ----

const fmt = new Intl.NumberFormat('es', {
  minimumFractionDigits: ELEVACION.decimales,
  maximumFractionDigits: ELEVACION.decimales,
});
/** «6,4» */
export const textoElevacion = (v: number) => fmt.format(v);

/** Elevación escrita con coma o punto; null si no es un número. */
export function leerElevacion(texto: string): number | null {
  const t = texto.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(t)) return null;
  return Number(t);
}

// ---- Perilla ----

/** Diferencia entre dos ángulos (radianes) llevada a (−π, π]: no salta al cruzar ±π. */
export function deltaAngulo(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}

/** Pasos enteros que suma un giro acumulado (radianes); hacia cero, para no adelantarse a un retén. */
export const pasosGirados = (acumulado: number, gradosPorPaso = GRADOS_POR_PASO) =>
  Math.trunc((acumulado * 180) / Math.PI / gradosPorPaso);

/** Valor tras girar: siempre desde el valor al empezar, nunca sumando un paso tras otro (no deriva). */
export const aplicarPasos = (inicio: number, pasos: number) => acotar(inicio + pasos * ELEVACION.paso);
