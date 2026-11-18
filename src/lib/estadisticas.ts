// Estadísticas del historial: filtros, cifras, récords, puntos por zona y flechas por semana.
import { etiqueta, zona, type Zona } from './diana';
import { suma, todasLasFlechas, type Flecha, type Sesion } from './modelo';
import { claveProgreso } from './progreso';

export type Periodo = 30 | 90 | 'todo';

export interface Filtro {
  periodo: Periodo;
  /** claveProgreso (distancia y diana); null = todas. */
  clave: string | null;
}

const DIA_MS = 864e5;

/** Mínimo de flechas para que una sesión o una ronda cuente en los récords de proporción. */
export const MIN_FLECHAS_SESION = 36;
export const MIN_FLECHAS_RONDA = 3;

/**
 * Sesiones con flechas dentro del periodo y de la distancia (y diana) del filtro. Una fecha no válida
 * (importada) queda fuera de 30 y 90 días y dentro de «todo».
 */
export function filtrar(historial: Sesion[], filtro: Filtro, ahora: Date): Sesion[] {
  const desde = filtro.periodo === 'todo' ? null : ahora.getTime() - filtro.periodo * DIA_MS;
  return historial.filter((s) => {
    if (!todasLasFlechas(s).length) return false;
    if (filtro.clave !== null && claveProgreso(s) !== filtro.clave) return false;
    if (desde === null) return true;
    const t = Date.parse(s.fecha);
    return t >= desde && t <= ahora.getTime();
  });
}

export interface Totales {
  sesiones: number;
  flechas: number;
  puntos: number;
  /** Puntos por flecha de todas las flechas juntas (no la media de los promedios de cada sesión). */
  promedio: number;
}

export function totales(ss: Sesion[]): Totales {
  let flechas = 0,
    puntos = 0;
  for (const s of ss) {
    const fl = todasLasFlechas(s);
    flechas += fl.length;
    puntos += suma(fl);
  }
  return { sesiones: ss.length, flechas, puntos, promedio: flechas ? puntos / flechas : 0 };
}

/** Un récord: el valor y dónde se logró. */
export interface Marca {
  valor: number;
  /** Puntaje teórico (10 por flecha), en los récords de proporción. */
  maximo?: number;
  sesion: Sesion;
  /** Número de ronda (desde 1), en el récord de ronda. */
  ronda?: number;
}

export interface Mejores {
  /** Mayor proporción de puntos sobre el máximo, entre sesiones de MIN_FLECHAS_SESION flechas o más. */
  sesion: Marca | null;
  /** Igual con rondas guardadas de MIN_FLECHAS_RONDA flechas o más. */
  ronda: Marca | null;
  /** Más X en una sesión. */
  x: Marca | null;
  /** Más 10 (X incluidas) en una sesión. */
  dieces: Marca | null;
}

/** Proporción de puntos sobre el máximo de una tanda de flechas. */
export const proporcion = (m: Marca) => (m.maximo ? m.valor / m.maximo : 0);

/** Récords de unas sesiones. En un empate gana la más antigua: el récord se conserva hasta superarlo. */
export function mejores(ss: Sesion[]): Mejores {
  const orden = [...ss].sort((a, b) => a.fecha.localeCompare(b.fecha));
  let sesion: Marca | null = null,
    ronda: Marca | null = null,
    x: Marca | null = null,
    dieces: Marca | null = null;
  const supera = (nueva: Marca, actual: Marca | null) => !actual || proporcion(nueva) > proporcion(actual);
  for (const s of orden) {
    const fl = todasLasFlechas(s);
    if (fl.length >= MIN_FLECHAS_SESION) {
      const m = { valor: suma(fl), maximo: fl.length * 10, sesion: s };
      if (supera(m, sesion)) sesion = m;
    }
    s.registro.forEach((r, i) => {
      if (r.flechas.length < MIN_FLECHAS_RONDA) return;
      const m = { valor: suma(r.flechas), maximo: r.flechas.length * 10, sesion: s, ronda: i + 1 };
      if (supera(m, ronda)) ronda = m;
    });
    const nx = fl.filter((f) => f.x).length;
    if (nx > 0 && nx > (x?.valor ?? 0)) x = { valor: nx, sesion: s };
    const n10 = fl.filter((f) => f.puntaje === 10).length;
    if (n10 > 0 && n10 > (dieces?.valor ?? 0)) dieces = { valor: n10, sesion: s };
  }
  return { sesion, ronda, x, dieces };
}

export interface ConteoZona {
  /** «X», «10»…«1», «M». */
  etiqueta: string;
  zona: Zona;
  n: number;
}

const ETIQUETAS = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];

/** Flechas por valor, siempre las 12 filas en orden (X, 10…1, M). «10» cuenta solo los 10 sin X. */
export function conteoZonas(flechas: Flecha[]): ConteoZona[] {
  const n = new Map(ETIQUETAS.map((e) => [e, 0]));
  for (const f of flechas) {
    const e = etiqueta(f);
    n.set(e, (n.get(e) ?? 0) + 1);
  }
  return ETIQUETAS.map((e) => ({
    etiqueta: e,
    zona: e === 'X' ? 'oro' : e === 'M' ? 'fuera' : zona(Number(e)),
    n: n.get(e)!,
  }));
}

export interface Semana {
  /** Lunes a las 0:00, hora local. */
  inicio: Date;
  flechas: number;
}

/** Lunes a las 0:00 (hora local) de la semana de una fecha. */
export function lunes(d: Date): Date {
  const l = new Date(d);
  l.setHours(0, 0, 0, 0);
  l.setDate(l.getDate() - ((l.getDay() + 6) % 7));
  return l;
}

/**
 * Flechas de las últimas n semanas (de lunes a domingo, hora local), de la más antigua a la actual. Cada
 * sesión cuenta entera en la semana en que empezó. Se ignoran fechas no válidas, futuras y anteriores.
 */
export function flechasPorSemana(historial: Sesion[], ahora: Date, n = 12): Semana[] {
  const actual = lunes(ahora);
  const semanas: Semana[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(actual);
    // Con setDate y no restando milisegundos: el cambio de hora movería los límites
    d.setDate(d.getDate() - 7 * i);
    semanas.push({ inicio: d, flechas: 0 });
  }
  const fin = new Date(actual);
  fin.setDate(fin.getDate() + 7);
  for (const s of historial) {
    const t = Date.parse(s.fecha);
    if (Number.isNaN(t) || t < semanas[0].inicio.getTime() || t >= fin.getTime() || t > ahora.getTime()) continue;
    let k = semanas.length - 1;
    while (k > 0 && t < semanas[k].inicio.getTime()) k--;
    semanas[k].flechas += todasLasFlechas(s).length;
  }
  return semanas;
}

/**
 * Promedio de flechas de las semanas cerradas (sin la actual), contando solo desde la semana de la primera
 * sesión: quien empezó hace poco no ve la cifra rebajada por semanas en que aún no usaba la app.
 * null si no hay ninguna semana cerrada que contar.
 */
export function promedioSemanal(semanas: Semana[], primeraSesion: Date | null): number | null {
  if (!primeraSesion || Number.isNaN(primeraSesion.getTime())) return null;
  const desde = lunes(primeraSesion).getTime();
  const cerradas = semanas.slice(0, -1).filter((s) => s.inicio.getTime() >= desde);
  if (!cerradas.length) return null;
  return cerradas.reduce((a, s) => a + s.flechas, 0) / cerradas.length;
}
