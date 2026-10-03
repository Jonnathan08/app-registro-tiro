export type Modo = 'sistema' | 'claro' | 'oscuro';
export type Contraste = 'estandar' | 'medio' | 'alto';

export interface Ajustes {
  modo: Modo;
  contraste: Contraste;
}

const CLAVE = 'registro-tiro:ajustes';
const DEFECTO: Ajustes = { modo: 'sistema', contraste: 'medio' };
const SUFIJO: Record<Contraste, string> = { estandar: '', medio: '-medium-contrast', alto: '-high-contrast' };

export function leerAjustes(): Ajustes {
  try {
    return { ...DEFECTO, ...JSON.parse(localStorage.getItem(CLAVE) ?? '{}') };
  } catch {
    return { ...DEFECTO };
  }
}

export function guardarAjustes(a: Ajustes): void {
  try { localStorage.setItem(CLAVE, JSON.stringify(a)); } catch { /* sin almacenamiento: se usa el defecto */ }
}

const media = matchMedia('(prefers-color-scheme: dark)');

/** Pone en <html> la clase exportada por Material Theme Builder (p. ej. "dark-medium-contrast"). */
export function aplicarTema(a: Ajustes): void {
  const oscuro = a.modo === 'oscuro' || (a.modo === 'sistema' && media.matches);
  const raiz = document.documentElement;
  raiz.className = (oscuro ? 'dark' : 'light') + SUFIJO[a.contraste];
  // Color de la barra del sistema = superficie del tema
  const superficie = getComputedStyle(raiz).getPropertyValue('--md-sys-color-surface').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', superficie);
}

export function alCambiarSistema(fn: () => void): void {
  media.addEventListener('change', fn);
}
