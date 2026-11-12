import { DIANAS, type Impacto, type TipoDiana } from './diana';

export const VERSION_DATOS = 1;

export type Perfil = 'control' | 'abierto' | 'libre';

/** Perfil Control: formato fijo de 12 rondas de 6 flechas (72 flechas, como la ronda clasificatoria). */
export const CONTROL = { rondas: 12, flechasPorRonda: 6 } as const;

/** Perfil Libre: sin número de rondas ni de flechas por ronda (se guardan como 0). Tope de seguridad por ronda. */
export const LIBRE_MAX_FLECHAS = 24;

export const NOMBRE_PERFIL: Record<Perfil, string> = { control: 'Control', abierto: 'Abierto', libre: 'Libre' };

export const esLibre = (s: { perfil: Perfil }) => s.perfil === 'libre';

export interface Flecha extends Impacto {
  /** Posición en mm desde el centro (x a la derecha, y hacia arriba). null si se ingresó a mano. */
  pos: { x: number; y: number } | null;
  /** El valor se corrigió con el teclado después de registrarla. Su posición se descarta (pos = null). */
  corregida?: boolean;
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

export const PERFILES: Perfil[] = ['control', 'abierto', 'libre'];

/** Valores permitidos (enteros) de cada campo numérico de la configuración. */
export const LIMITES = {
  distanciaM: { min: 1, max: 150 },
  rondas: { min: 1, max: 36 },
  flechasPorRonda: { min: 1, max: 12 },
} as const;

export const CONFIG_DEFECTO: Configuracion = { perfil: 'control', distanciaM: 70, dianaCm: 122, rondas: 6, flechasPorRonda: 6 };

/**
 * Convierte un valor leído de fuera (p. ej. localStorage) en una configuración válida.
 * Cada campo que falte o no sea válido toma su valor por defecto.
 */
export function validarConfig(v: unknown): Configuracion {
  const o = (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
  const entero = (k: keyof typeof LIMITES) => {
    const n = o[k];
    const { min, max } = LIMITES[k];
    return typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max ? n : CONFIG_DEFECTO[k];
  };
  return {
    perfil: PERFILES.includes(o.perfil as Perfil) ? (o.perfil as Perfil) : CONFIG_DEFECTO.perfil,
    distanciaM: entero('distanciaM'),
    dianaCm: DIANAS.some((d) => d.cm === o.dianaCm) ? (o.dianaCm as TipoDiana) : CONFIG_DEFECTO.dianaCm,
    rondas: entero('rondas'),
    flechasPorRonda: entero('flechasPorRonda'),
  };
}

/**
 * Lleva una sesión guardada con una versión anterior del formato a la actual.
 * VERSION_DATOS 1 es la primera: cuando cambie el esquema, aquí se añade el paso v1 → v2, etc.
 */
export function migrar(s: Sesion): Sesion {
  return s;
}

export function nuevaSesion(c: Configuracion, ahora = new Date()): Sesion {
  const formato = c.perfil === 'control' ? CONTROL : c.perfil === 'libre' ? { rondas: 0, flechasPorRonda: 0 } : { rondas: c.rondas, flechasPorRonda: c.flechasPorRonda };
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

export const suma = (fl: Flecha[]) => fl.reduce((a, f) => a + f.puntaje, 0);
export const sumaRonda = (r: Ronda) => suma(r.flechas);

export function todasLasFlechas(s: Sesion): Flecha[] {
  return s.registro.flatMap((r) => r.flechas).concat(s.enCurso);
}

export function resumen(s: Sesion) {
  const fl = todasLasFlechas(s);
  const total = suma(fl);
  return {
    total,
    maximo: (esLibre(s) ? fl.length : s.rondas * s.flechasPorRonda) * 10,
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
export const rondaLlena = (s: Sesion) => s.enCurso.length >= (esLibre(s) ? LIBRE_MAX_FLECHAS : s.flechasPorRonda);
export const todasGuardadas = (s: Sesion) => !esLibre(s) && s.registro.length >= s.rondas;
/** Se puede guardar la ronda: llena o, en Libre, con al menos una flecha. */
export const rondaGuardable = (s: Sesion) => (esLibre(s) ? s.enCurso.length > 0 : rondaLlena(s));

/**
 * Corrige el valor de una flecha con el teclado. La posición se descarta porque ya no
 * coincidiría con el valor; para conservarla hay que volver a marcar la flecha en la diana.
 */
export function corregir(f: Flecha, puntaje: number, x: boolean): Flecha {
  if (f.puntaje === puntaje && f.x === x) return f;
  return { puntaje, x, pos: null, corregida: true };
}

/** Orden de hoja de puntuación: de mayor a menor, X antes que 10. */
export function ordenHoja(fl: Flecha[]): Flecha[] {
  const v = (f: Flecha) => f.puntaje + (f.x ? 0.5 : 0);
  return [...fl].sort((a, b) => v(b) - v(a));
}
