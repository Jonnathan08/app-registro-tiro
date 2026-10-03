import { describe, expect, it } from 'vitest';
import { etiqueta, geometria, puntuar } from './diana';

describe('geometria', () => {
  it('diana de 122 cm: anillos de 61 mm y X de 30,5 mm', () => {
    expect(geometria(122)).toEqual({ radio: 610, anillo: 61, radioX: 30.5 });
  });
  it('diana de 40 cm: anillos de 20 mm', () => {
    expect(geometria(40).anillo).toBe(20);
  });
});

describe('puntuar (diana 122, sin radio de flecha)', () => {
  const p = (x: number, y: number) => puntuar(x, y, 122, 0);
  it('centro exacto es X', () => expect(p(0, 0)).toEqual({ puntaje: 10, x: true }));
  it('justo fuera de la X es 10', () => expect(p(31, 0)).toEqual({ puntaje: 10, x: false }));
  it('cada anillo baja un punto', () => {
    expect(p(61.5, 0).puntaje).toBe(9);
    expect(p(0, -300).puntaje).toBe(6);
    expect(p(600, 0).puntaje).toBe(1);
  });
  it('fuera de la diana es M', () => expect(p(611, 0)).toEqual({ puntaje: 0, x: false }));
});

describe('regla de la línea', () => {
  it('flecha cuyo borde toca la línea del 9 cuenta 10', () => {
    // centro a 64 mm: con radio 4,5 el borde llega a 59,5 mm, dentro del 10
    expect(puntuar(64, 0, 122).puntaje).toBe(10);
  });
  it('flecha que no toca la línea cuenta el anillo de abajo', () => {
    expect(puntuar(70, 0, 122).puntaje).toBe(9);
  });
  it('flecha que toca el borde exterior todavía puntúa 1', () => {
    expect(puntuar(612, 0, 122).puntaje).toBe(1);
  });
});

describe('etiqueta', () => {
  it('X, M y números', () => {
    expect(etiqueta({ puntaje: 10, x: true })).toBe('X');
    expect(etiqueta({ puntaje: 0, x: false })).toBe('M');
    expect(etiqueta({ puntaje: 7, x: false })).toBe('7');
  });
});
