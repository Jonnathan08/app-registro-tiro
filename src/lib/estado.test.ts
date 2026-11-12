import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as almacen from './almacen';
import { estado } from './estado.svelte';
import { nuevaSesion, type Configuracion, type Flecha } from './modelo';

vi.mock('./almacen', () => ({
  guardar: vi.fn(async () => {}),
  guardarVarias: vi.fn(async () => {}),
  listar: vi.fn(async () => []),
  borrar: vi.fn(async () => {}),
  pedirPersistencia: vi.fn(async () => true),
}));

const f = (puntaje: number): Flecha => ({ puntaje, x: false, pos: null });
const abierto: Configuracion = { perfil: 'abierto', distanciaM: 30, dianaCm: 80, rondas: 2, flechasPorRonda: 3 };

beforeEach(async () => {
  vi.clearAllMocks();
  estado.activa = null;
  estado.historial = [];
  estado.detalle = null;
  estado.aviso = null;
  await estado.cargar();
});

describe('estado', () => {
  it('cargar separa la sesión en curso del historial', async () => {
    const b = nuevaSesion(abierto);
    const a = { ...nuevaSesion(abierto), terminada: true };
    vi.mocked(almacen.listar).mockResolvedValueOnce([b, a]);
    await estado.cargar();
    expect(estado.activa?.id).toBe(b.id);
    expect(estado.historial.map((s) => s.id)).toEqual([a.id]);
  });

  it('si el almacenamiento falla al cargar, guarda el error', async () => {
    vi.mocked(almacen.listar).mockRejectedValueOnce(new Error('bloqueado'));
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    await estado.cargar();
    expect(estado.error).toMatch(/almacenamiento/);
  });

  it('no deja marcar más flechas que las de la ronda', async () => {
    await estado.empezar(abierto);
    for (const p of [9, 8, 7, 6]) await estado.marcar(f(p));
    expect(estado.activa!.enCurso.map((a) => a.puntaje)).toEqual([9, 8, 7]);
    await estado.guardarRonda();
    expect(estado.activa!.registro).toHaveLength(1);
    expect(estado.aviso?.texto).toBe('Ronda 1 guardada · 24 puntos');
  });

  it('guarda una copia plana (sin proxies) en el almacén', async () => {
    await estado.empezar(abierto);
    await estado.marcar(f(10));
    const guardada = vi.mocked(almacen.guardar).mock.lastCall![0];
    expect(guardada.enCurso).toEqual([f(10)]);
    expect(() => structuredClone(guardada)).not.toThrow();
  });

  it('si no se puede guardar, avisa y no confirma la ronda', async () => {
    await estado.empezar(abierto);
    for (const p of [9, 8, 7]) await estado.marcar(f(p));
    vi.mocked(almacen.guardar).mockRejectedValueOnce(new Error('cuota'));
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    await estado.guardarRonda();
    expect(estado.aviso?.texto).toMatch(/No se pudo guardar/);
  });

  it('editarRonda exige el mismo número de flechas', async () => {
    await estado.empezar(abierto);
    for (const p of [9, 8, 7]) await estado.marcar(f(p));
    await estado.guardarRonda();
    await estado.editarRonda(0, [f(10)]);
    expect(estado.activa!.registro[0].flechas.map((a) => a.puntaje)).toEqual([9, 8, 7]);
    await estado.editarRonda(0, [f(10), f(10), f(10)]);
    expect(estado.activa!.registro[0].flechas.map((a) => a.puntaje)).toEqual([10, 10, 10]);
  });

  it('terminar guarda la ronda a medias y abre el detalle en el historial', async () => {
    await estado.empezar(abierto);
    await estado.marcar(f(9));
    await estado.terminar();
    expect(estado.activa).toBeNull();
    expect(estado.pantalla).toBe('historial');
    expect(estado.detalle?.registro).toEqual([{ flechas: [f(9)] }]);
    expect(estado.historial[0].terminada).toBe(true);
  });

  it('si terminar no puede guardar, la sesión sigue activa', async () => {
    await estado.empezar(abierto);
    vi.mocked(almacen.guardar).mockRejectedValueOnce(new Error('cuota'));
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    await estado.terminar();
    expect(estado.activa?.terminada).toBe(false);
    expect(estado.historial).toHaveLength(0);
  });

  it('descartar no quita la sesión si el borrado falla', async () => {
    await estado.empezar(abierto);
    vi.mocked(almacen.borrar).mockRejectedValueOnce(new Error('x'));
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    await estado.descartar();
    expect(estado.activa).not.toBeNull();
    await estado.descartar();
    expect(estado.activa).toBeNull();
  });
});

describe('importar', () => {
  it('añade solo las sesiones que no están y las ordena por fecha', async () => {
    const vieja = { ...nuevaSesion(abierto, new Date('2026-09-01')), terminada: true };
    const nueva = { ...nuevaSesion(abierto, new Date('2026-10-01')), terminada: true };
    estado.historial = [nueva];
    const r = await estado.importar([vieja, nueva]);
    expect(r).toEqual({ nuevas: 1, repetidas: 1 });
    expect(vi.mocked(almacen.guardarVarias)).toHaveBeenCalledWith([vieja]);
    expect(estado.historial.map((s) => s.id)).toEqual([nueva.id, vieja.id]);
  });
});
