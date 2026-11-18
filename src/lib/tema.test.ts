import { beforeEach, describe, expect, it, vi } from 'vitest';
import { guardarAjustes, leerAjustes, type Ajustes } from './tema';

const CLAVE = 'registro-tiro:ajustes';
let datos: Record<string, string>;

beforeEach(() => {
  datos = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => datos[k] ?? null,
    setItem: (k: string, v: string) => (datos[k] = v),
  });
});

const DEFECTO: Ajustes = { modo: 'sistema', contraste: 'medio', paleta: 'petroleo' };

describe('ajustes de apariencia', () => {
  it('sin nada guardado, el defecto: Petróleo con contraste medio', () => {
    expect(leerAjustes()).toEqual(DEFECTO);
  });

  it('los ajustes de antes de la paleta conservan modo y contraste y toman Petróleo', () => {
    datos[CLAVE] = JSON.stringify({ modo: 'oscuro', contraste: 'alto' });
    expect(leerAjustes()).toEqual({ modo: 'oscuro', contraste: 'alto', paleta: 'petroleo' });
  });

  it.each(['rojo', 3, null, '__proto__', 'toString'])('una paleta desconocida (%s) toma Petróleo', (paleta) => {
    datos[CLAVE] = JSON.stringify({ modo: 'claro', contraste: 'estandar', paleta });
    expect(leerAjustes()).toEqual({ modo: 'claro', contraste: 'estandar', paleta: 'petroleo' });
  });

  it('conserva una paleta válida', () => {
    datos[CLAVE] = JSON.stringify({ ...DEFECTO, paleta: 'grafito' });
    expect(leerAjustes().paleta).toBe('grafito');
  });

  it.each(['{no es json', '"x"', '5', 'null'])('lo guardado ilegible (%s) da el defecto', (crudo) => {
    datos[CLAVE] = crudo;
    expect(leerAjustes()).toEqual(DEFECTO);
  });

  it('lo guardado se lee igual', () => {
    const a: Ajustes = { modo: 'claro', contraste: 'alto', paleta: 'violeta' };
    guardarAjustes(a);
    expect(leerAjustes()).toEqual(a);
  });
});
