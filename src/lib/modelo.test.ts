import { describe, expect, it } from 'vitest';
import { aCSV, nombreArchivo } from './exportar';
import { centroGrupo, nuevaSesion, ordenHoja, resumen, type Flecha } from './modelo';

const f = (puntaje: number, x = false, pos: Flecha['pos'] = null): Flecha => ({ puntaje, x, pos });
const fecha = new Date('2026-10-04T09:30:00Z');

describe('nuevaSesion', () => {
  it('perfil Control fija 12 rondas de 6 flechas aunque se pidan otras', () => {
    const s = nuevaSesion({ perfil: 'control', distanciaM: 70, dianaCm: 122, rondas: 3, flechasPorRonda: 3 }, fecha);
    expect([s.rondas, s.flechasPorRonda]).toEqual([12, 6]);
  });
  it('perfil Abierto respeta la configuración', () => {
    const s = nuevaSesion({ perfil: 'abierto', distanciaM: 18, dianaCm: 40, rondas: 10, flechasPorRonda: 3 }, fecha);
    expect([s.rondas, s.flechasPorRonda, s.distanciaM]).toEqual([10, 3, 18]);
  });
});

describe('resumen', () => {
  it('suma rondas guardadas y en curso', () => {
    const s = nuevaSesion({ perfil: 'control', distanciaM: 70, dianaCm: 122, rondas: 0, flechasPorRonda: 0 }, fecha);
    s.registro.push({ flechas: [f(10, true), f(9), f(9), f(8), f(7), f(0)] });
    s.enCurso.push(f(10), f(10));
    const r = resumen(s);
    expect(r).toMatchObject({ total: 63, maximo: 720, flechas: 8, x: 1, dieces: 3 });
    expect(r.promedio).toBeCloseTo(7.875);
  });
});

describe('ordenHoja y centroGrupo', () => {
  it('X va antes que 10', () => {
    expect(ordenHoja([f(9), f(10), f(10, true)]).map((a) => a.x)).toEqual([true, false, false]);
  });
  it('centro del grupo ignora flechas sin posición', () => {
    expect(centroGrupo([f(9, false, { x: 10, y: 0 }), f(9, false, { x: 30, y: 20 }), f(8)])).toEqual({ x: 20, y: 10 });
  });
});

describe('exportar', () => {
  it('CSV con una fila por flecha y nombre con fecha y distancia', () => {
    const s = nuevaSesion({ perfil: 'abierto', distanciaM: 30, dianaCm: 80, rondas: 1, flechasPorRonda: 2 }, fecha);
    s.registro.push({ flechas: [f(10, true, { x: 1.23, y: -4.56 }), f(0)] });
    const lineas = aCSV(s).trim().split('\n');
    expect(lineas).toHaveLength(3);
    expect(lineas[1].endsWith(',1,1,X,10,1,1.2,-4.6')).toBe(true);
    expect(lineas[2].endsWith(',1,2,M,0,0,,')).toBe(true);
    expect(nombreArchivo(s, 'csv')).toBe('tiro_2026-10-04_30m.csv');
  });
});
