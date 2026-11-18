import { describe, expect, it } from 'vitest';
import tema from '../estilos/tema.css?raw';
import paletas from '../estilos/paletas.css?raw';
import base from '../estilos/base.css?raw';
import { PALETAS, type Paleta } from './tema';

type Tokens = Record<string, string>;

const VARIANTES = [
  'light',
  'light-medium-contrast',
  'light-high-contrast',
  'dark',
  'dark-medium-contrast',
  'dark-high-contrast',
] as const;
type Variante = (typeof VARIANTES)[number];

/** Tokens --md-sys-color-* (sin prefijo) del bloque cuyo selector es exactamente `selector`. */
function bloque(css: string, selector: string): Tokens {
  const inicio = css.indexOf(`${selector} {`);
  if (inicio < 0) return {};
  const cuerpo = css.slice(inicio, css.indexOf('}', inicio));
  return Object.fromEntries([...cuerpo.matchAll(/--md-sys-color-([\w-]+): (rgb\([^)]*\));/g)].map((m) => [m[1], m[2]]));
}

const tokens = (p: Paleta, v: Variante): Tokens =>
  p === 'petroleo' ? bloque(tema, `:root.${v}`) : bloque(paletas, `:root[data-paleta='${p}'].${v}`);

type RGB = [number, number, number];
const rgb = (c: string): RGB => c.match(/\d+/g)!.slice(0, 3).map(Number) as RGB;
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
/** color-mix(in srgb, a p%, b) */
const mezcla = (a: RGB, b: RGB, p: number): RGB => a.map((x, i) => x * p + b[i] * (1 - p)) as RGB;

/** Luminancia relativa WCAG 2. */
function luminancia(c: RGB): number {
  const [r, g, b] = c.map((x) => {
    const s = x / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a: RGB, b: RGB): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const ORO = hex('#ffe14d'); // --diana-oro de base.css

/** Colores del tablero: el mismo reparto que --tablero-* en base.css. */
function tablero(t: Tokens, v: Variante) {
  const oscuro = v.startsWith('dark');
  const fondo = rgb(t[v === 'light' || oscuro ? 'on-primary-fixed-variant' : 'primary']);
  const texto = rgb(t[oscuro ? 'on-surface' : 'on-primary']);
  const rotulo = rgb(t[oscuro ? 'primary-fixed-dim' : 'inverse-primary']);
  return { fondo, texto, rotulo, tenue: mezcla(texto, fondo, 0.82) };
}

const NOMBRES = Object.keys(bloque(tema, ':root.light'));
const LISTA = Object.keys(PALETAS) as Paleta[];

describe('paletas generadas', () => {
  it('Petróleo es la predeterminada y no está en paletas.css', () => {
    expect(LISTA[0]).toBe('petroleo');
    expect(paletas).not.toContain("'petroleo'");
  });

  it.each(LISTA.filter((p) => p !== 'petroleo'))('%s tiene las seis variantes con los tokens de tema.css', (p) => {
    for (const v of VARIANTES) expect(Object.keys(tokens(p, v))).toEqual(NOMBRES);
  });

  it.each(LISTA.filter((p) => p !== 'petroleo'))('%s se generó con la semilla de PALETAS', (p) => {
    expect(paletas).toContain(`/* ${p}: semilla ${PALETAS[p].semilla.toUpperCase()},`);
  });

  it('la muestra de cada paleta (base.css) es su primary en claro estándar', () => {
    for (const p of LISTA) {
      const muestra = base.match(new RegExp(`--paleta-muestra-${p}: (#[0-9a-f]{6});`))?.[1];
      expect(muestra, p).toBeDefined();
      expect(hex(muestra!), p).toEqual(rgb(tokens(p, 'light').primary));
    }
  });
});

describe.each(LISTA)('contraste de %s', (p) => {
  it.each(VARIANTES)('%s', (v) => {
    const t = tokens(p, v);
    const c = (a: string, b: string) => contraste(rgb(t[a]), rgb(t[b]));
    const tb = tablero(t, v);

    // Tablero (marcador): se lee de un vistazo, al sol
    expect(contraste(tb.texto, tb.fondo), 'texto del tablero').toBeGreaterThanOrEqual(7);
    expect(contraste(tb.rotulo, tb.fondo), 'rótulo del tablero').toBeGreaterThanOrEqual(4.5);
    expect(contraste(tb.tenue, tb.fondo), 'texto tenue del tablero').toBeGreaterThanOrEqual(4.5);
    expect(contraste(ORO, tb.fondo), 'oro sobre el tablero').toBeGreaterThanOrEqual(4.5);
    // Barra de estado del color del tablero: oscura (tono ≤ 30, Y ≤ 0,063) para que Android ponga íconos claros
    expect(luminancia(tb.fondo), 'tablero oscuro').toBeLessThanOrEqual(0.063);

    // Botones llenos, segmentado elegido, chips
    expect(c('on-primary', 'primary'), 'on-primary / primary').toBeGreaterThanOrEqual(4.5);
    // Texto y foco en primary sobre la página
    expect(c('primary', 'surface'), 'primary / surface').toBeGreaterThanOrEqual(4.5);
    // Segmentado: lo elegido frente a lo no elegido
    expect(c('primary', 'surface-container-lowest'), 'segmentado elegido').toBeGreaterThanOrEqual(3);
    // Ronda corregida (contorno) y su insignia
    expect(c('tertiary', 'surface'), 'tertiary / surface').toBeGreaterThanOrEqual(3);
    expect(c('on-tertiary-container', 'tertiary-container'), 'tertiary-container').toBeGreaterThanOrEqual(4.5);
    // Acción del Aviso
    expect(c('inverse-primary', 'inverse-surface'), 'acción del aviso').toBeGreaterThanOrEqual(4.5);
    // Ícono oro del botón lleno, solo en claro
    if (v.startsWith('light')) expect(contraste(ORO, rgb(t.primary)), 'oro / primary').toBeGreaterThanOrEqual(3);
  });
});
