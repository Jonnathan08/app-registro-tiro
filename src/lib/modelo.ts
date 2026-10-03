import type { Impacto, TipoDiana } from './diana';

export const VERSION_DATOS = 1;

export type Perfil = 'control' | 'abierto';

/** Perfil Control: formato fijo de 12 rondas de 6 flechas (72 flechas, como la ronda clasificatoria). */
export const CONTROL = { rondas: 12, flechasPorRonda: 6 } as const;

export interface Flecha extends Impacto {
  /** Posición en mm desde el centro (x a la derecha, y hacia arriba). null si se ingresó a mano. */
  pos: { x: number; y: number } | null;
}

export interface Ronda {
  flechas: Flecha[];
}

export interface Sesion {
  version: number;
  id: string;
  fecha: string;           // ISO 8601, inicio de la sesión
  perfil: Perfil;
  distanciaM: number;
  dianaCm: TipoDiana;
  rondas: number;
  flechasPorRonda: number;
  registro: Ronda[];       // rondas guardadas
  enCurso: Flecha[];       // flechas de la ronda que se está tirando
  notasPersonales: string;
  notasEntrenador: string;
  terminada: boolean;
  actualizada: string;
}

export interface Configuracion {
  perfil: Perfil;
  distanciaM: number;
  dianaCm: TipoDiana;
  rondas: number;
  flechasPorRonda: number;
}

export function nuevaSesion(c: Configuracion, ahora = new Date()): Sesion {
  const formato = c.perfil === 'control' ? CONTROL : { rondas: c.rondas, flechasPorRonda: c.flechasPorRonda };
  const iso = ahora.toISOString();
  return {
    version: VERSION_DATOS,
    id: crypto.randomUUID(),
    fecha: iso,
    perfil: c.perfil,
    distanciaM: c.distanciaM,
    dianaCm: c.dianaCm,
    rondas: formato.rondas,
    flechasPorRonda: formato.flechasPorRonda,
    registro: [],
    enCurso: [],
    notasPersonales: '',
    notasEntrenador: '',
    terminada: false,
    actualizada: iso,
  };
}

export const sumaRonda = (r: Ronda) => r.flechas.reduce((a, f) => a + f.puntaje, 0);

export function todasLasFlechas(s: Sesion): Flecha[] {
  return s.registro.flatMap((r) => r.flechas).concat(s.enCurso);
}

export function resumen(s: Sesion) {
  const fl = todasLasFlechas(s);
  const total = fl.reduce((a, f) => a + f.puntaje, 0);
  return {
    total,
    maximo: s.rondas * s.flechasPorRonda * 10,
    flechas: fl.length,
    x: fl.filter((f) => f.x).length,
    dieces: fl.filter((f) => f.puntaje === 10).length,
    promedio: fl.length ? total / fl.length : 0,
  };
}

/** Centro del grupo (media de las flechas con posición). */
export function centroGrupo(fl: Flecha[]): { x: number; y: number } | null {
  const p = fl.filter((f) => f.pos).map((f) => f.pos!);
  if (!p.length) return null;
  return {
    x: p.reduce((a, q) => a + q.x, 0) / p.length,
    y: p.reduce((a, q) => a + q.y, 0) / p.length,
  };
}

/** Número (desde 1) de la ronda en curso. */
export const numeroRonda = (s: Sesion) => s.registro.length + 1;
export const rondaLlena = (s: Sesion) => s.enCurso.length >= s.flechasPorRonda;
export const todasGuardadas = (s: Sesion) => s.registro.length >= s.rondas;

/** Orden de hoja de puntuación: de mayor a menor, X antes que 10. */
export function ordenHoja(fl: Flecha[]): Flecha[] {
  const v = (f: Flecha) => f.puntaje + (f.x ? 0.5 : 0);
  return [...fl].sort((a, b) => v(b) - v(a));
}
