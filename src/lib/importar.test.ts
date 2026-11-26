import { describe, expect, it } from 'vitest';
import { aCSV, marcasACSV } from './exportar';
import { deArchivo, deCSV, deCSVMira, leerCSV, tipoCSV } from './importar';
import { CONFIG_DEFECTO, nuevaSesion, type Flecha } from './modelo';

const f = (puntaje: number, x = false, pos: Flecha['pos'] = null): Flecha => ({ puntaje, x, pos });
const fecha = new Date('2026-10-04T09:30:00Z');

describe('leerCSV', () => {
  it('celdas con comillas, comas y saltos de línea; CRLF y BOM', () => {
    expect(leerCSV('\uFEFFa,"b,c","d ""e""\nf"\r\n1,,3\r\n')).toEqual([
      ['a', 'b,c', 'd "e"\nf'],
      ['1', '', '3'],
    ]);
  });
  it('ignora líneas vacías y admite el final sin salto de línea', () => {
    expect(leerCSV('a,b\n\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('deCSV', () => {
  it('ida y vuelta: lo exportado se importa igual (posición redondeada a 0,1 mm)', () => {
    const s = nuevaSesion({ perfil: 'abierto', distanciaM: 30, dianaCm: 80, rondas: 2, flechasPorRonda: 2 }, fecha);
    s.registro.push(
      { flechas: [f(10, true, { x: 1.2, y: -4.6 }), { ...f(0), corregida: true }] },
      { flechas: [f(9, false, { x: 30, y: 10 }), f(8)] },
    );
    s.notasPersonales = 'Viento, ráfagas';
    s.notasEntrenador = 'Dijo "anclaje"\nmás bajo';
    s.terminada = true;
    const [r] = deCSV(aCSV(s));
    expect({ ...r, actualizada: s.actualizada }).toEqual(s);
  });

  it('en Libre las rondas y flechas por ronda vuelven a 0', () => {
    const s = nuevaSesion({ perfil: 'libre', distanciaM: 18, dianaCm: 40, rondas: 0, flechasPorRonda: 0 }, fecha);
    s.registro.push({ flechas: [f(9), f(8), f(7)] }, { flechas: [f(10)] });
    const [r] = deCSV(aCSV(s));
    expect([r.rondas, r.flechasPorRonda, r.registro.length]).toEqual([0, 0, 2]);
  });

  it('separa varias sesiones de un mismo archivo', () => {
    const a = nuevaSesion({ perfil: 'control', distanciaM: 70, dianaCm: 122, rondas: 0, flechasPorRonda: 0 }, fecha);
    const b = nuevaSesion({ perfil: 'control', distanciaM: 50, dianaCm: 80, rondas: 0, flechasPorRonda: 0 }, fecha);
    a.registro.push({ flechas: [f(9)] });
    b.registro.push({ flechas: [f(7)] });
    expect(deCSV(aCSV([a, b])).map((s) => s.id)).toEqual([a.id, b.id]);
  });

  it('rechaza un CSV que no es de la app', () => {
    expect(() => deCSV('nombre,edad\nAna,30\n')).toThrow(/No es un CSV exportado/);
    expect(() => deCSV('sesion_id,fecha\n')).toThrow(/Faltan las columnas perfil/);
    expect(() => deCSV('')).toThrow(/vacío/);
  });

  it('indica la línea con un valor no válido', () => {
    const s = nuevaSesion({ perfil: 'abierto', distanciaM: 30, dianaCm: 80, rondas: 1, flechasPorRonda: 1 }, fecha);
    s.registro.push({ flechas: [f(9)] });
    const malo = aCSV(s).replace(',9,0,,,0,', ',11,0,,,0,');
    expect(() => deCSV(malo)).toThrow(/Línea 2: valor no válido en puntaje/);
  });
});

describe('marcas de mira en CSV', () => {
  const ms = [
    {
      version: 1,
      distanciaM: 18,
      elevacion: 2.8,
      nota: 'sala, "aluminio"\nfrío',
      actualizada: '2026-10-03T09:00:00.000Z',
    },
    { version: 1, distanciaM: 70, elevacion: 6.4, nota: '', actualizada: '2026-11-22T09:00:00.000Z' },
  ];
  it('ida y vuelta, con comas, comillas y saltos de línea en la nota', () => {
    const csv = marcasACSV(ms);
    expect(csv.split('\n')[0]).toBe('distancia_m,elevacion,nota,actualizada');
    expect(csv).toContain('70,6.4,,2026-11-22');
    expect(deCSVMira(csv)).toEqual(ms);
  });
  it('deArchivo reconoce cada tipo; los CSV de sesiones siguen igual', () => {
    expect(deArchivo(marcasACSV(ms))).toEqual({ sesiones: [], marcas: ms });
    const s = nuevaSesion({ ...CONFIG_DEFECTO });
    s.registro.push({ flechas: [{ puntaje: 9, x: false, pos: null }] });
    const r = deArchivo(aCSV(s));
    expect(r.marcas).toEqual([]);
    expect(r.sesiones).toHaveLength(1);
  });
  it('una distancia repetida se queda con la más reciente', () => {
    const csv = 'distancia_m,elevacion,nota,actualizada\n50,5.6,,2026-11-01T00:00:00Z\n50,5.8,,2026-11-09T00:00:00Z\n';
    expect(deCSVMira(csv).map((m) => m.elevacion)).toEqual([5.8]);
  });
  it('indica la línea de una marca no válida y rechaza cabeceras ajenas', () => {
    expect(() => deCSVMira('distancia_m,elevacion,nota,actualizada\n50,abc,,\n')).toThrow(/Línea 2/);
    expect(() => deCSVMira('distancia_m,elevacion,nota,actualizada\n50,  ,,\n')).toThrow(/Línea 2/);
    expect(() => tipoCSV('a,b,c\n1,2,3\n')).toThrow(/No es un CSV/);
  });
});
