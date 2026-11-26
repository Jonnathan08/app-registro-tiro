import { describe, expect, it } from 'vitest';
import {
  acotar,
  aplicarPasos,
  crearMarca,
  deltaAngulo,
  fusionar,
  leerElevacion,
  masCercana,
  MAX_NOTA_MIRA,
  ordenarMarcas,
  pasosGirados,
  textoElevacion,
  validarMarca,
  type MarcaMira,
} from './mira';

const AHORA = new Date('2026-11-26T12:00:00Z');
const m = (distanciaM: number, elevacion: number, actualizada = '2026-11-01T10:00:00.000Z'): MarcaMira => ({
  version: 1,
  distanciaM,
  elevacion,
  nota: '',
  actualizada,
});

describe('validarMarca', () => {
  it('acepta una marca correcta y redondea la elevación', () => {
    expect(
      validarMarca({ distanciaM: 70, elevacion: 6.4400001, nota: 'x', actualizada: '2026-11-01T10:00:00Z' }),
    ).toEqual({ version: 1, distanciaM: 70, elevacion: 6.4, nota: 'x', actualizada: '2026-11-01T10:00:00.000Z' });
  });
  it.each([
    { distanciaM: 70.5, elevacion: 5 },
    { distanciaM: 0, elevacion: 5 },
    { distanciaM: 151, elevacion: 5 },
    { elevacion: 5 },
    { distanciaM: 70, elevacion: NaN },
    { distanciaM: 70, elevacion: Infinity },
    { distanciaM: 70, elevacion: -0.1 },
    { distanciaM: 70, elevacion: 100.1 },
    { distanciaM: 70, elevacion: '5' },
    null,
    'x',
  ])('rechaza %j', (v) => {
    expect(validarMarca(v)).toBeNull();
  });
  it('recorta la nota y pone la fecha de ahora si no es válida', () => {
    const r = validarMarca({ distanciaM: 30, elevacion: 4, nota: 'a'.repeat(300), actualizada: 'ayer' }, AHORA)!;
    expect(r.nota).toHaveLength(MAX_NOTA_MIRA);
    expect(r.actualizada).toBe(AHORA.toISOString());
  });
});

describe('crearMarca', () => {
  it('acota, redondea, recorta espacios de la nota y pone la fecha', () => {
    expect(crearMarca(50, 120, '  viento  ', AHORA)).toEqual({
      version: 1,
      distanciaM: 50,
      elevacion: 100,
      nota: 'viento',
      actualizada: AHORA.toISOString(),
    });
  });
});

describe('orden y distancia más cercana', () => {
  const ms = [m(70, 6.4), m(18, 2.8), m(50, 5.6)];
  it('ordena por distancia', () => {
    expect(ordenarMarcas(ms).map((x) => x.distanciaM)).toEqual([18, 50, 70]);
  });
  it('la más cercana; en empate, la menor', () => {
    expect(masCercana(ms, 60)!.distanciaM).toBe(50);
    expect(masCercana([m(30, 4), m(50, 5)], 40)!.distanciaM).toBe(30);
    expect(masCercana([], 40)).toBeUndefined();
  });
});

describe('fusionar', () => {
  it('por distancia gana la más reciente', () => {
    const actuales = [m(30, 4, '2026-11-10T00:00:00Z'), m(50, 5, '2026-11-10T00:00:00Z')];
    const importadas = [
      m(18, 2, '2026-01-01T00:00:00Z'), // nueva
      m(30, 4.5, '2026-11-20T00:00:00Z'), // más reciente
      m(50, 6, '2026-11-01T00:00:00Z'), // más antigua
    ];
    const r = fusionar(actuales, importadas);
    expect(r).toMatchObject({ nuevas: 1, actualizadas: 1, iguales: 1 });
    expect(r.guardar.map((x) => x.distanciaM)).toEqual([18, 30]);
  });
});

describe('texto de la elevación', () => {
  it('se muestra con coma y un decimal', () => {
    expect(textoElevacion(6.4)).toBe('6,4');
    expect(textoElevacion(12)).toBe('12,0');
  });
  it('se lee con coma o punto', () => {
    expect(leerElevacion('6,4')).toBe(6.4);
    expect(leerElevacion(' 6.45 ')).toBe(6.45);
    expect(leerElevacion('7')).toBe(7);
    expect(leerElevacion('')).toBeNull();
    expect(leerElevacion('-1')).toBeNull();
    expect(leerElevacion('6,4,1')).toBeNull();
    expect(leerElevacion('abc')).toBeNull();
  });
});

describe('perilla', () => {
  it('deltaAngulo no salta al cruzar ±π', () => {
    expect(deltaAngulo(Math.PI - 0.1, -Math.PI + 0.1)).toBeCloseTo(0.2);
    expect(deltaAngulo(-Math.PI + 0.1, Math.PI - 0.1)).toBeCloseTo(-0.2);
  });
  it('pasosGirados cuenta retenes completos de 18°', () => {
    const g = (grados: number) => (grados * Math.PI) / 180;
    expect(pasosGirados(g(17.9))).toBe(0);
    expect(pasosGirados(g(18.1))).toBe(1);
    expect(pasosGirados(g(-36.1))).toBe(-2);
    expect(pasosGirados(g(360))).toBe(20);
  });
  it('aplicarPasos no deriva y respeta el rango', () => {
    expect(aplicarPasos(6.4, 20)).toBe(8.4);
    expect(aplicarPasos(aplicarPasos(6.4, 20), -20)).toBe(6.4);
    expect(aplicarPasos(0.2, -5)).toBe(0);
    expect(aplicarPasos(99.9, 5)).toBe(100);
    expect(acotar(0.30000000000000004)).toBe(0.3);
  });
});
