import { describe, expect, it } from 'vitest';
import base from '../estilos/base.css?raw';
import { anillo, colorCalor, densidad, describir, direccion, maximo, PARADAS, puntosNormalizados } from './calor';
import { geometria } from './diana';
import { CONFIG_DEFECTO, mediaPuntos, nuevaSesion, type Sesion } from './modelo';

function sesion(dianaCm: 122 | 80 | 40, pos: ({ x: number; y: number } | null)[]): Sesion {
  const s = nuevaSesion({ ...CONFIG_DEFECTO, dianaCm }, new Date(2026, 10, 1));
  s.registro = [{ flechas: pos.map((p) => ({ puntaje: 9, x: false, pos: p })) }];
  return s;
}

describe('puntosNormalizados', () => {
  it('el mismo anillo en dianas de 122, 80 y 40 cm da el mismo punto; sin posición no cuenta', () => {
    const p = ([122, 80, 40] as const).map((cm) => {
      const g = geometria(cm);
      return puntosNormalizados([sesion(cm, [{ x: 0, y: -2.5 * g.anillo }, null])]);
    });
    for (const q of p) {
      expect(q).toHaveLength(1);
      expect(q[0].x).toBeCloseTo(0);
      expect(q[0].y).toBeCloseTo(-0.25);
    }
  });
});

describe('densidad', () => {
  const n = 32;
  it('un punto en el centro da el máximo 1 en las celdas centrales, simétrico', () => {
    const d = densidad([{ x: 0, y: 0 }], n);
    expect(Math.max(...d)).toBeCloseTo(1);
    const c = n / 2;
    expect(d[(c - 1) * n + (c - 1)]).toBeCloseTo(d[c * n + c]);
    expect(d[(c - 1) * n + c]).toBeCloseTo(d[c * n + (c - 1)]);
    expect(d[0]).toBeLessThan(0.01);
  });
  it('un punto arriba cae en las filas de arriba', () => {
    const d = densidad([{ x: 0, y: 0.6 }], n);
    const m = maximo(d, n)!;
    expect(m.y).toBeGreaterThan(0.5);
    expect(Math.abs(m.x)).toBeLessThan(0.1);
  });
  it('un fallo (fuera de la diana) no cuenta; sin puntos, todo ceros y sin NaN', () => {
    for (const d of [densidad([{ x: 1.02, y: 0 }], n), densidad([], n)]) {
      expect(d.every((v) => v === 0)).toBe(true);
    }
    expect(maximo(densidad([], n), n)).toBeNull();
  });
});

describe('colorCalor', () => {
  it('transparente por debajo del umbral; blanco en el máximo; valores acotados', () => {
    expect(colorCalor(0)[3]).toBe(0);
    expect(colorCalor(NaN)[3]).toBe(0);
    expect(colorCalor(1).slice(0, 3)).toEqual([255, 255, 255]);
    for (let t = 0.05; t <= 1; t += 0.05) for (const v of colorCalor(t)) expect(v >= 0 && v <= 255).toBe(true);
  });
  it('la escala usa los colores de la diana de base.css', () => {
    for (const nombre of ['negro', 'azul', 'rojo', 'oro', 'blanco']) {
      const hex = base.match(new RegExp(`--diana-${nombre}: (#[0-9a-f]{6});`))![1];
      expect(PARADAS.map(([, c]) => c)).toContain(hex);
    }
  });
});

describe('describir', () => {
  it('anillo y dirección de un punto normalizado', () => {
    expect(anillo({ x: 0, y: 0.02 })).toBe('X');
    expect(anillo({ x: 0.12, y: 0 })).toBe('9');
    expect(anillo({ x: 0, y: -1.1 })).toBe('M');
    expect(direccion({ x: 0.01, y: 0.01 })).toBe('centrado');
    expect(direccion({ x: -0.1, y: -0.1 })).toBe('abajo a la izquierda');
    expect(direccion({ x: 0, y: 0.3 })).toBe('arriba');
    expect(describir({ x: 0.15, y: 0 })).toBe('9 · a la derecha');
  });
  it('mediaPuntos: media, o null sin puntos', () => {
    expect(mediaPuntos([])).toBeNull();
    expect(
      mediaPuntos([
        { x: 0, y: 1 },
        { x: 2, y: 3 },
      ]),
    ).toEqual({ x: 1, y: 2 });
  });
});
