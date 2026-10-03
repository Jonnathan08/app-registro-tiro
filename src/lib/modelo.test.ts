import { describe, expect, it } from 'vitest';
import { aCSV, celda, nombreArchivo } from './exportar';
import { centroGrupo, corregir, nuevaSesion, ordenHoja, resumen, type Flecha } from './modelo';

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

describe('exportar', () => {
  const sesion = () => {
    const s = nuevaSesion({ perfil: 'abierto', distanciaM: 30, dianaCm: 80, rondas: 1, flechasPorRonda: 2 }, fecha);
    s.registro.push({ flechas: [f(10, true, { x: 1.23, y: -4.56 }), { ...f(0), corregida: true }] });
    s.notasPersonales = 'Viento, ráfagas';
    s.notasEntrenador = 'Dijo "anclaje"\nmás bajo';
    return s;
  };

  it('cabecera con datos de sesión, flecha y notas', () => {
    expect(aCSV(sesion()).split('\n')[0]).toBe(
      'sesion_id,fecha,perfil,distancia_m,diana_cm,rondas,flechas_por_ronda,total_sesion,ronda,flecha,valor,puntaje,es_x,x_mm,y_mm,corregida,notas_personales,notas_entrenador',
    );
  });

  it('una fila por flecha, con las notas escapadas', () => {
    const csv = aCSV(sesion());
    expect(csv).toContain(',abierto,30,80,1,2,10,1,1,X,10,1,1.2,-4.6,0,"Viento, ráfagas","Dijo ""anclaje""\nmás bajo"\n');
    expect(csv).toContain(',1,2,M,0,0,,,1,');
  });

  it('varias sesiones comparten una sola cabecera', () => {
    const cabeceras = aCSV([sesion(), sesion()]).split('\n').filter((l) => l.startsWith('sesion_id'));
    expect(cabeceras).toHaveLength(1);
  });

  it('escapa comas, comillas y saltos de línea', () => {
    expect(celda('a,b')).toBe('"a,b"');
    expect(celda('di "x"')).toBe('"di ""x"""');
    expect(celda('l1\nl2')).toBe('"l1\nl2"');
    expect(celda(7)).toBe('7');
    expect(celda(null)).toBe('');
  });

  it('nombre con fecha, distancia e id corto', () => {
    const s = sesion();
    expect(nombreArchivo(s)).toBe(`tiro_2026-10-04_30m_${s.id.slice(0, 8)}.csv`);
  });
});
