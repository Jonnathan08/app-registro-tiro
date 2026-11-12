import { describe, expect, it } from 'vitest';
import { aCSV, celda, nombreArchivo } from './exportar';
import { nuevaSesion, type Flecha } from './modelo';

const f = (puntaje: number, x = false, pos: Flecha['pos'] = null): Flecha => ({ puntaje, x, pos });
const fecha = new Date('2026-10-04T09:30:00Z');

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
    expect(csv).toContain(
      ',abierto,30,80,1,2,10,1,1,X,10,1,1.2,-4.6,0,"Viento, ráfagas","Dijo ""anclaje""\nmás bajo"\n',
    );
    expect(csv).toContain(',1,2,M,0,0,,,1,');
  });

  it('en Libre exporta las rondas tiradas y deja vacío flechas_por_ronda', () => {
    const s = nuevaSesion({ perfil: 'libre', distanciaM: 30, dianaCm: 80, rondas: 0, flechasPorRonda: 0 }, fecha);
    s.registro.push({ flechas: [f(9), f(8), f(7)] }, { flechas: [f(10)] });
    expect(aCSV(s)).toContain(',libre,30,80,2,,34,2,1,10,10,');
  });

  it('varias sesiones comparten una sola cabecera', () => {
    const cabeceras = aCSV([sesion(), sesion()])
      .split('\n')
      .filter((l) => l.startsWith('sesion_id'));
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
