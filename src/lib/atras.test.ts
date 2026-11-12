import { beforeEach, describe, expect, it, vi } from 'vitest';

// Historial simulado: cuenta las entradas propias y entrega popstate como el navegador (en otra tarea)
let entradas: number;
let alVolver: (e: { state: unknown }) => void;
const historia = {
  scrollRestoration: 'auto',
  pushState: vi.fn(() => entradas++),
  back: vi.fn(() => {
    entradas--;
    setTimeout(() => alVolver({ state: null }));
  }),
};
/** El usuario pulsa atrás. */
const atras = () => historia.back();
const esperar = () => new Promise((r) => setTimeout(r));

let capa: typeof import('./atras').capa;

beforeEach(async () => {
  entradas = 0;
  vi.clearAllMocks();
  vi.stubGlobal('history', historia);
  vi.stubGlobal('addEventListener', (_: string, fn: typeof alVolver) => (alVolver = fn));
  vi.resetModules();
  ({ capa } = await import('./atras'));
});

describe('capa', () => {
  it('atrás cierra la capa abierta y consume su entrada', async () => {
    const cerrar = vi.fn();
    capa(cerrar);
    expect(entradas).toBe(1);
    atras();
    await esperar();
    expect(cerrar).toHaveBeenCalledOnce();
    expect(entradas).toBe(0);
  });

  it('cerrar desde la interfaz quita la entrada sin llamar a cerrar', async () => {
    const cerrar = vi.fn();
    const quitar = capa(cerrar);
    quitar();
    await esperar();
    await esperar();
    expect(entradas).toBe(0);
    expect(cerrar).not.toHaveBeenCalled();
  });

  it('con capas anidadas, atrás cierra de una en una', async () => {
    const detalle = vi.fn(),
      dialogo = vi.fn();
    capa(detalle);
    capa(dialogo);
    expect(entradas).toBe(1);
    atras();
    await esperar();
    expect(dialogo).toHaveBeenCalledOnce();
    expect(detalle).not.toHaveBeenCalled();
    expect(entradas).toBe(1);
    atras();
    await esperar();
    expect(detalle).toHaveBeenCalledOnce();
    expect(entradas).toBe(0);
  });

  it('pasar del menú a un diálogo reutiliza la entrada', async () => {
    const quitarMenu = capa(vi.fn());
    quitarMenu();
    const dialogo = vi.fn();
    capa(dialogo);
    await esperar();
    await esperar();
    expect(entradas).toBe(1);
    expect(historia.back).not.toHaveBeenCalled();
    atras();
    await esperar();
    expect(dialogo).toHaveBeenCalledOnce();
  });

  it('«adelante» hacia una entrada propia no cierra ninguna capa', async () => {
    const cerrar = vi.fn();
    capa(cerrar);
    alVolver({ state: { capa: true } });
    expect(cerrar).not.toHaveBeenCalled();
  });

  it('la limpieza tras cerrar con atrás no retrocede otra vez', async () => {
    const quitar = capa(vi.fn());
    atras();
    await esperar();
    quitar();
    await esperar();
    expect(historia.back).toHaveBeenCalledOnce(); // solo el del usuario
  });
});
