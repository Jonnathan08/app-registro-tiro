import { describe, expect, it } from 'vitest';
import {
  CONFIG_DEFECTO,
  centroGrupo,
  corregir,
  LIBRE_MAX_FLECHAS,
  nuevaSesion,
  ordenHoja,
  resumen,
  rondaGuardable,
  rondaEnCurso,
  rondaLlena,
  todasGuardadas,
  totalCerrado,
  totalesHistorial,
  validarConfig,
  type Flecha,
} from './modelo';

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
  it('perfil Libre no tiene formato: rondas de cualquier tamaño y sin fin', () => {
    const s = nuevaSesion({ perfil: 'libre', distanciaM: 30, dianaCm: 80, rondas: 6, flechasPorRonda: 6 }, fecha);
    expect([s.rondas, s.flechasPorRonda]).toEqual([0, 0]);
    expect(rondaGuardable(s)).toBe(false);
    s.enCurso.push(f(9));
    expect([rondaGuardable(s), rondaLlena(s)]).toEqual([true, false]);
    for (let i = 0; i < 40; i++) s.registro.push({ flechas: [f(8)] });
    expect(todasGuardadas(s)).toBe(false);
    s.enCurso = Array.from({ length: LIBRE_MAX_FLECHAS }, () => f(7));
    expect(rondaLlena(s)).toBe(true);
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
  it('en Libre el máximo sale de las flechas tiradas', () => {
    const s = nuevaSesion({ perfil: 'libre', distanciaM: 30, dianaCm: 80, rondas: 0, flechasPorRonda: 0 }, fecha);
    s.registro.push({ flechas: [f(10), f(9), f(8)] }, { flechas: [f(7)] });
    expect(resumen(s)).toMatchObject({ total: 34, maximo: 40, flechas: 4 });
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

describe('corregir', () => {
  it('cambia el valor, descarta la posición y marca la flecha', () => {
    const c = corregir(f(9, false, { x: 60, y: 10 }), 10, false);
    expect(c).toEqual({ puntaje: 10, x: false, pos: null, corregida: true });
  });
  it('una flecha corregida no cuenta para el centro del grupo', () => {
    const fl = [f(9, false, { x: 10, y: 0 }), corregir(f(8, false, { x: 200, y: 0 }), 10, false)];
    expect(centroGrupo(fl)).toEqual({ x: 10, y: 0 });
  });
  it('si el valor no cambia, no la marca como corregida', () => {
    const o = f(9);
    expect(corregir(o, 9, false)).toBe(o);
  });
});

describe('validarConfig', () => {
  it('acepta una configuración válida tal cual', () => {
    const c = { perfil: 'abierto', distanciaM: 18, dianaCm: 40, rondas: 10, flechasPorRonda: 3 } as const;
    expect(validarConfig(c)).toEqual(c);
  });
  it('cada campo inválido toma su valor por defecto', () => {
    expect(validarConfig({ perfil: 'otro', distanciaM: '30', dianaCm: 100, rondas: 0, flechasPorRonda: 2.5 })).toEqual(
      CONFIG_DEFECTO,
    );
  });
  it('lo que no es un objeto da la configuración por defecto', () => {
    expect(validarConfig(null)).toEqual(CONFIG_DEFECTO);
    expect(validarConfig('x')).toEqual(CONFIG_DEFECTO);
  });
});

describe('tablero de la sesión', () => {
  const control = () => nuevaSesion({ ...CONFIG_DEFECTO, perfil: 'control' }, fecha);
  it('totalCerrado suma solo las rondas guardadas, no la que está en curso', () => {
    const s = control();
    expect(totalCerrado(s)).toBe(0);
    s.registro.push({ flechas: [f(10, true), f(9)] }, { flechas: [f(8)] });
    s.enCurso.push(f(7));
    expect(totalCerrado(s)).toBe(27);
  });
  it('rondaEnCurso no pasa de la última ronda', () => {
    const s = control();
    expect(rondaEnCurso(s)).toBe(1);
    for (let i = 0; i < 2; i++) s.registro.push({ flechas: [f(9)] });
    expect(rondaEnCurso(s)).toBe(3);
    for (let i = 0; i < 10; i++) s.registro.push({ flechas: [f(9)] });
    expect(rondaEnCurso(s)).toBe(12);
  });
  it('en Libre rondaEnCurso no tiene tope', () => {
    const s = nuevaSesion({ ...CONFIG_DEFECTO, perfil: 'libre' }, fecha);
    for (let i = 0; i < 20; i++) s.registro.push({ flechas: [f(9)] });
    expect(rondaEnCurso(s)).toBe(21);
  });
  it('totalesHistorial cuenta sesiones y todas sus flechas', () => {
    expect(totalesHistorial([])).toEqual({ sesiones: 0, flechas: 0 });
    const a = control();
    a.registro.push({ flechas: [f(9), f(8)] });
    a.enCurso.push(f(7));
    const b = control();
    b.registro.push({ flechas: [f(10)] });
    expect(totalesHistorial([a, b])).toEqual({ sesiones: 2, flechas: 4 });
  });
});
