export type Modo = 'sistema' | 'claro' | 'oscuro';
export type Contraste = 'estandar' | 'medio' | 'alto';

export type Paleta = 'petroleo' | 'bosque' | 'violeta' | 'grafito';

/**
 * Paletas elegibles, en el orden de Ajustes. Petróleo es tema.css; las demás, paletas.css, generado con
 * estas semillas por scripts/generar-paletas.mjs (que las repite; lo vigila paletas.test.ts).
 */
export const PALETAS: Record<Paleta, { nombre: string; semilla: string }> = {
  petroleo: { nombre: 'Petróleo', semilla: '#156683' },
  bosque: { nombre: 'Bosque', semilla: '#2f6b3f' },
  violeta: { nombre: 'Violeta', semilla: '#6750a4' },
  grafito: { nombre: 'Grafito', semilla: '#5d6168' },
};

export interface Ajustes {
  modo: Modo;
  contraste: Contraste;
  paleta: Paleta;
}

const CLAVE = 'registro-tiro:ajustes';
const DEFECTO: Ajustes = { modo: 'sistema', contraste: 'medio', paleta: 'petroleo' };
const SUFIJO: Record<Contraste, string> = { estandar: '', medio: '-medium-contrast', alto: '-high-contrast' };

const MODOS: Modo[] = ['sistema', 'claro', 'oscuro'];

/** Ajustes guardados; cada valor desconocido o ausente toma el de por defecto. */
export function leerAjustes(): Ajustes {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') ?? {};
    return {
      modo: MODOS.includes(g.modo) ? g.modo : DEFECTO.modo,
      contraste: Object.hasOwn(SUFIJO, g.contraste) ? g.contraste : DEFECTO.contraste,
      paleta: Object.hasOwn(PALETAS, g.paleta) ? g.paleta : DEFECTO.paleta,
    };
  } catch {
    return { ...DEFECTO };
  }
}

export function guardarAjustes(a: Ajustes): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(a));
  } catch {
    /* sin almacenamiento: se usa el defecto */
  }
}

// Se consulta al usarla (no al importar el módulo), para que tema.ts se pueda importar fuera del navegador
const media = () => matchMedia('(prefers-color-scheme: dark)');

/**
 * Pone en <html> la clase de modo y contraste (p. ej. "dark-medium-contrast") y la paleta
 * en data-paleta. La paleta va en un atributo, nunca en la clase: hay CSS que depende de [class^='dark'].
 */
export function aplicarTema(a: Ajustes): void {
  const oscuro = a.modo === 'oscuro' || (a.modo === 'sistema' && media().matches);
  const raiz = document.documentElement;
  raiz.className = (oscuro ? 'dark' : 'light') + SUFIJO[a.contraste];
  raiz.dataset.paleta = a.paleta;
  colorBarraSistema(); // después de cambiar la paleta, para leer su --tablero-fondo
}

/**
 * Color de la barra del sistema: el del tablero, para que se vea como un solo bloque con la franja de arriba.
 * Mientras dura la animación de entrada (body.entrando) va en el de la superficie, como la animación.
 */
export function colorBarraSistema(): void {
  const token = document.body?.classList.contains('entrando') ? '--md-sys-color-surface' : '--tablero-fondo';
  const color = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}

export function alCambiarSistema(fn: () => void): void {
  media().addEventListener('change', fn);
}
