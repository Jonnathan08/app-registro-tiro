import { resumen, type Sesion } from './modelo';

/** Sesiones de una misma distancia (y diana) para seguir el promedio por flecha, de la más antigua a la más reciente. */
export interface GrupoProgreso {
  k: string;
  /** «70 m», o «70 m · 122» si a esa distancia se usó más de una diana. */
  texto: string;
  sesiones: Sesion[];
}

/** Cuántas sesiones muestra la tendencia: con más, los puntos quedan demasiado juntos para tocarlos. */
export const MAX_TENDENCIA = 12;

export const claveProgreso = (s: Sesion) => `${s.distanciaM}-${s.dianaCm}`;

/** Agrupa por distancia y diana las sesiones con flechas, ordenadas por fecha; los grupos van por distancia y diana. */
export function gruposProgreso(historial: Sesion[]): GrupoProgreso[] {
  const m = new Map<string, Sesion[]>();
  for (const s of historial) {
    if (!resumen(s).flechas) continue;
    m.set(claveProgreso(s), [...(m.get(claveProgreso(s)) ?? []), s]);
  }
  const lista = [...m].map(([k, ss]) => ({ k, sesiones: [...ss].sort((a, b) => a.fecha.localeCompare(b.fecha)) }));
  lista.sort(
    (a, b) => a.sesiones[0].distanciaM - b.sesiones[0].distanciaM || a.sesiones[0].dianaCm - b.sesiones[0].dianaCm,
  );
  return lista.map((g) => {
    const s0 = g.sesiones[0];
    const variasDianas = lista.filter((h) => h.sesiones[0].distanciaM === s0.distanciaM).length > 1;
    return { ...g, texto: variasDianas ? `${s0.distanciaM} m · ${s0.dianaCm}` : `${s0.distanciaM} m` };
  });
}

/** Diferencia entre los dos últimos valores, redondeada a centésimas como se muestra; null con menos de dos. */
export function diferencia(valores: number[]): number | null {
  if (valores.length < 2) return null;
  return Math.round((valores.at(-1)! - valores.at(-2)!) * 100) / 100;
}

/**
 * Puntos de la línea de tendencia de los últimos MAX_TENDENCIA valores en una caja ancho×alto con un margen
 * alrededor. Sin variación, la línea queda plana a media altura. null con menos de dos valores.
 */
export function puntosTendencia(
  valores: number[],
  ancho: number,
  alto: number,
  margen: number,
): { x: number; y: number }[] | null {
  const v = valores.slice(-MAX_TENDENCIA);
  if (v.length < 2) return null;
  const min = Math.min(...v),
    max = Math.max(...v);
  const w = ancho - 2 * margen,
    h = alto - 2 * margen;
  return v.map((p, i) => ({
    x: margen + (i * w) / (v.length - 1),
    y: max > min ? margen + (1 - (p - min) / (max - min)) * h : alto / 2,
  }));
}
