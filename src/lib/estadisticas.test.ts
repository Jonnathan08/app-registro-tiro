import { describe, expect, it } from 'vitest';
import {
  conteoZonas,
  filtrar,
  flechasPorSemana,
  lunes,
  mejores,
  promedioSemanal,
  proporcion,
  totales,
  type Filtro,
} from './estadisticas';
import { CONFIG_DEFECTO, nuevaSesion, type Flecha, type Sesion } from './modelo';

const f = (puntaje: number, x = false): Flecha => ({ puntaje, x, pos: null });

/** Sesión con rondas de puntajes (10.5 = X). */
function sesion(fecha: Date, rondas: number[][], distanciaM = 70, dianaCm: 122 | 80 | 40 = 122): Sesion {
  const s = nuevaSesion({ ...CONFIG_DEFECTO, distanciaM, dianaCm }, fecha);
  s.registro = rondas.map((r) => ({ flechas: r.map((p) => (p === 10.5 ? f(10, true) : f(p))) }));
  s.terminada = true;
  return s;
}
const repetir = (v: number, n: number) => Array.from({ length: n }, () => v);
const AHORA = new Date(2026, 10, 18, 12); // miércoles 18/11/2026, hora local
const diasAntes = (d: number) => new Date(AHORA.getTime() - d * 864e5);
const TODO: Filtro = { periodo: 'todo', clave: null };

describe('filtrar', () => {
  it('el límite exacto del periodo entra; un milisegundo antes, no', () => {
    const justo = sesion(diasAntes(30), [[9]]);
    const antes = sesion(new Date(diasAntes(30).getTime() - 1), [[9]]);
    expect(filtrar([justo, antes], { periodo: 30, clave: null }, AHORA)).toEqual([justo]);
  });
  it('una fecha no válida queda fuera de 30 y 90 días y dentro de «todo»', () => {
    const s = sesion(AHORA, [[9]]);
    s.fecha = 'no es fecha';
    expect(filtrar([s], { periodo: 30, clave: null }, AHORA)).toEqual([]);
    expect(filtrar([s], { periodo: 90, clave: null }, AHORA)).toEqual([]);
    expect(filtrar([s], TODO, AHORA)).toEqual([s]);
  });
  it('la distancia separa dianas distintas', () => {
    const a = sesion(AHORA, [[9]], 18, 40),
      b = sesion(AHORA, [[9]], 18, 80);
    expect(filtrar([a, b], { periodo: 'todo', clave: '18-80' }, AHORA)).toEqual([b]);
  });
  it('deja fuera las sesiones sin flechas', () => {
    expect(filtrar([sesion(AHORA, [])], TODO, AHORA)).toEqual([]);
  });
});

describe('totales', () => {
  it('el promedio es por flecha, no la media de los promedios de cada sesión', () => {
    const t = totales([sesion(AHORA, [[10]]), sesion(AHORA, [repetir(5, 71)])]);
    expect(t).toMatchObject({ sesiones: 2, flechas: 72, puntos: 365 });
    expect(t.promedio).toBeCloseTo(365 / 72);
  });
  it('sin sesiones da ceros, no NaN', () => {
    expect(totales([])).toEqual({ sesiones: 0, flechas: 0, puntos: 0, promedio: 0 });
  });
});

describe('mejores', () => {
  it('la mejor sesión es la de mayor proporción sobre el máximo, con 36 flechas o más', () => {
    const corta = sesion(diasAntes(3), [repetir(10, 35)]); // 100 %, pero de 35 flechas
    const media = sesion(diasAntes(2), [repetir(8, 36)]); // 288/360 = 80 %
    const larga = sesion(diasAntes(1), [repetir(7, 72)]); // 504/720 = 70 %
    const m = mejores([corta, media, larga]).sesion!;
    expect(m.sesion).toBe(media);
    expect(m).toMatchObject({ valor: 288, maximo: 360 });
    expect(proporcion(m)).toBeCloseTo(0.8);
  });
  it('en un empate gana la más antigua', () => {
    const nueva = sesion(diasAntes(1), [repetir(9, 36)]);
    const vieja = sesion(diasAntes(5), [repetir(9, 36)]);
    expect(mejores([nueva, vieja]).sesion!.sesion).toBe(vieja);
  });
  it('la mejor ronda usa la misma proporción, con rondas de 3 flechas o más', () => {
    const s = sesion(AHORA, [[10, 10], [10, 10, 9], repetir(9, 6)]);
    const r = mejores([s]).ronda!;
    expect(r).toMatchObject({ valor: 29, maximo: 30, ronda: 2 });
  });
  it('más X y más 10 (con las X) en una sesión', () => {
    const a = sesion(diasAntes(2), [[10.5, 10.5, 10, 9]]);
    const b = sesion(diasAntes(1), [[10.5, 10, 10, 10]]);
    const m = mejores([a, b]);
    expect(m.x).toMatchObject({ valor: 2, sesion: a });
    expect(m.dieces).toMatchObject({ valor: 4, sesion: b });
  });
  it('sin datos, todo null', () => {
    expect(mejores([sesion(AHORA, [[9, 8]])])).toEqual({ sesion: null, ronda: null, x: null, dieces: null });
  });
});

describe('conteoZonas', () => {
  it('siempre 12 filas en orden; X y 10 por separado; cuenta también las del teclado', () => {
    const c = conteoZonas([f(10, true), f(10), f(10), f(0), f(7)]);
    expect(c.map((z) => z.etiqueta)).toEqual(['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M']);
    expect(c.find((z) => z.etiqueta === 'X')).toMatchObject({ n: 1, zona: 'oro' });
    expect(c.find((z) => z.etiqueta === '10')!.n).toBe(2);
    expect(c.find((z) => z.etiqueta === '7')).toMatchObject({ n: 1, zona: 'rojo' });
    expect(c.find((z) => z.etiqueta === 'M')).toMatchObject({ n: 1, zona: 'fuera' });
    expect(c.find((z) => z.etiqueta === '1')!.n).toBe(0);
  });
});

describe('flechasPorSemana', () => {
  it('semanas de lunes a domingo en hora local, de la más antigua a la actual', () => {
    const domingo = sesion(new Date(2026, 10, 15, 23, 30), [[9, 9]]);
    const lunesS = sesion(new Date(2026, 10, 16, 0, 10), [[9, 9, 9]]);
    const s = flechasPorSemana([domingo, lunesS], AHORA);
    expect(s).toHaveLength(12);
    expect(s[11].inicio).toEqual(new Date(2026, 10, 16));
    expect(s[0].inicio).toEqual(new Date(2026, 7, 31));
    expect(s[11].flechas).toBe(3);
    expect(s[10].flechas).toBe(2);
  });
  it('ignora fechas futuras, anteriores a las 12 semanas y no válidas', () => {
    const futura = sesion(new Date(2026, 10, 19), [[9]]);
    const vieja = sesion(new Date(2026, 7, 30, 23), [[9]]);
    const rota = sesion(AHORA, [[9]]);
    rota.fecha = 'x';
    expect(flechasPorSemana([futura, vieja, rota], AHORA).every((w) => w.flechas === 0)).toBe(true);
  });
  it('un domingo pertenece a la semana que empezó el lunes anterior', () => {
    expect(lunes(new Date(2026, 10, 22, 20))).toEqual(new Date(2026, 10, 16));
  });
});

describe('promedioSemanal', () => {
  it('promedia las semanas cerradas desde la de la primera sesión, sin la actual', () => {
    const semanas = flechasPorSemana(
      [sesion(new Date(2026, 10, 3), [repetir(9, 60)]), sesion(new Date(2026, 10, 10), [repetir(9, 30)])],
      AHORA,
    );
    // Semanas del 2/11 y del 9/11 cerradas; la actual (16/11) no cuenta
    expect(promedioSemanal(semanas, new Date(2026, 10, 3))).toBe(45);
  });
  it('null sin semanas cerradas o sin primera sesión', () => {
    const semanas = flechasPorSemana([], AHORA);
    expect(promedioSemanal(semanas, new Date(2026, 10, 17))).toBeNull();
    expect(promedioSemanal(semanas, null)).toBeNull();
  });
});
