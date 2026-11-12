import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ayudaNueva, contarMarca, UMBRAL_AYUDA } from './ayuda';

let datos: Record<string, string>;

beforeEach(() => {
  datos = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => datos[k] ?? null,
    setItem: (k: string, v: string) => (datos[k] = v),
  });
});

describe('ayuda de la diana', () => {
  it('es nueva hasta marcar el número de flechas del umbral', () => {
    for (let i = 0; i < UMBRAL_AYUDA - 1; i++) contarMarca();
    expect(ayudaNueva()).toBe(true);
    contarMarca();
    expect(ayudaNueva()).toBe(false);
    contarMarca();
    expect(Object.values(datos)).toEqual([String(UMBRAL_AYUDA)]);
  });

  it('un valor guardado inválido cuenta como cero', () => {
    datos['registro-tiro:marcas-diana'] = 'abc';
    expect(ayudaNueva()).toBe(true);
  });

  it('sin almacenamiento la ayuda sigue visible y no falla', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    });
    expect(() => contarMarca()).not.toThrow();
    expect(ayudaNueva()).toBe(true);
  });
});
