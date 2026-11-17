import { describe, expect, it } from 'vitest';
import { CONFIG_DEFECTO, nuevaSesion, type Sesion } from './modelo';
import { diferencia, gruposProgreso, MAX_TENDENCIA, puntosTendencia } from './progreso';

function sesion(dia: number, distanciaM: number, dianaCm: 122 | 80 | 40, puntajes: number[]): Sesion {
  const s = nuevaSesion(
    { ...CONFIG_DEFECTO, distanciaM, dianaCm },
    new Date(`2026-10-${String(dia).padStart(2, '0')}T10:00:00Z`),
  );
  if (puntajes.length) s.registro.push({ flechas: puntajes.map((puntaje) => ({ puntaje, x: false, pos: null })) });
  return s;
}

describe('gruposProgreso', () => {
  it('agrupa por distancia y ordena cada grupo por fecha', () => {
    const h = [sesion(9, 70, 122, [9]), sesion(3, 30, 80, [8]), sesion(5, 70, 122, [7])];
    const g = gruposProgreso(h);
    expect(g.map((x) => x.texto)).toEqual(['30 m', '70 m']);
    expect(g[1].sesiones.map((s) => s.fecha.slice(8, 10))).toEqual(['05', '09']);
  });
  it('nombra la diana solo si a esa distancia se usó más de una', () => {
    const g = gruposProgreso([sesion(1, 18, 40, [9]), sesion(2, 18, 80, [9]), sesion(3, 30, 80, [9])]);
    expect(g.map((x) => x.texto)).toEqual(['18 m · 40', '18 m · 80', '30 m']);
  });
  it('deja fuera las sesiones sin flechas', () => {
    expect(gruposProgreso([sesion(1, 30, 80, [])])).toEqual([]);
  });
});

describe('diferencia', () => {
  it('es null con menos de dos valores', () => {
    expect(diferencia([])).toBeNull();
    expect(diferencia([8.5])).toBeNull();
  });
  it('redondea a centésimas como se muestra', () => {
    expect(diferencia([8.6, 8.615])).toBe(0.02);
    expect(diferencia([8.61, 8.49])).toBe(-0.12);
  });
});

describe('puntosTendencia', () => {
  it('es null con menos de dos valores', () => {
    expect(puntosTendencia([8], 100, 50, 5)).toBeNull();
  });
  it('va de margen a margen; el mayor arriba y el menor abajo', () => {
    const p = puntosTendencia([8, 9, 8.5], 100, 50, 5)!;
    expect(p.map((q) => q.x)).toEqual([5, 50, 95]);
    expect(p.map((q) => q.y)).toEqual([45, 5, 25]);
  });
  it('sin variación la línea queda plana a media altura', () => {
    expect(puntosTendencia([8, 8], 100, 50, 5)!.map((q) => q.y)).toEqual([25, 25]);
  });
  it(`usa como mucho las ${MAX_TENDENCIA} últimas`, () => {
    const v = Array.from({ length: 20 }, (_, i) => i);
    expect(puntosTendencia(v, 100, 50, 0)).toHaveLength(MAX_TENDENCIA);
  });
});
