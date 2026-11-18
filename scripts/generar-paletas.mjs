// Genera src/estilos/paletas.css: los tokens --md-sys-color-* de las paletas elegibles en Ajustes.
// Uso: npm run paletas. Lo generado se confirma en git y no se edita a mano.
//
// Antes de escribir nada, reproduce tema.css (Petróleo) con el mismo método y se detiene si no coincide (±1):
// así las paletas nuevas salen del mismo molde que Material Theme Builder usó para la actual.
import { readFileSync, writeFileSync } from 'node:fs';
import {
  argbFromHex,
  DynamicScheme,
  Hct,
  MaterialDynamicColors,
  SchemeNeutral,
  SchemeTonalSpot,
  TonalPalette,
} from '@material/material-color-utilities';

const TEMA = new URL('../src/estilos/tema.css', import.meta.url);
const SALIDA = new URL('../src/estilos/paletas.css', import.meta.url);

// Semillas: iguales que PALETAS en src/lib/tema.ts (lo vigila src/lib/paletas.test.ts)
const PETROLEO = '#156683';
const PALETAS = {
  bosque: { semilla: '#2F6B3F', esquema: SchemeTonalSpot },
  // Terciario fijado en petróleo: el automático sería rosa rojizo, cerca del rojo de la diana
  violeta: { semilla: '#6750A4', esquema: SchemeTonalSpot, terciario: PETROLEO },
  // Esquema neutral (croma bajo): con tonal spot saldría azul. Terciario petróleo para distinguirlo del primario
  grafito: { semilla: '#5D6168', esquema: SchemeNeutral, terciario: PETROLEO },
};

// Clase de <html> → [oscuro, nivel de contraste]; los mismos nombres que exporta Material Theme Builder
const VARIANTES = {
  light: [false, 0],
  'light-medium-contrast': [false, 0.5],
  'light-high-contrast': [false, 1],
  dark: [true, 0],
  'dark-medium-contrast': [true, 0.5],
  'dark-high-contrast': [true, 1],
};

const tema = readFileSync(TEMA, 'utf8');

/** Tokens de un bloque de tema.css, en su orden: { 'primary': 'rgb(…)', … } */
function bloqueTema(clase) {
  const inicio = tema.indexOf(`:root.${clase} {`);
  if (inicio < 0) throw new Error(`tema.css no tiene el bloque :root.${clase}`);
  const cuerpo = tema.slice(inicio, tema.indexOf('}', inicio));
  return Object.fromEntries([...cuerpo.matchAll(/--md-sys-color-([\w-]+): (rgb\([^)]*\));/g)].map((m) => [m[1], m[2]]));
}

const TOKENS = Object.keys(bloqueTema('light'));
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const rgb = (argb) => `rgb(${(argb >> 16) & 255} ${(argb >> 8) & 255} ${argb & 255})`;

function esquema({ semilla, esquema: Esquema, terciario }, oscuro, contraste) {
  const base = new Esquema(Hct.fromInt(argbFromHex(semilla)), oscuro, contraste);
  if (!terciario) return base;
  return new DynamicScheme({
    sourceColorArgb: base.sourceColorArgb,
    variant: base.variant,
    contrastLevel: contraste,
    isDark: oscuro,
    primaryPalette: base.primaryPalette,
    secondaryPalette: base.secondaryPalette,
    // Como el color personalizado de Material Theme Builder: conserva matiz y croma del color dado
    tertiaryPalette: TonalPalette.fromInt(argbFromHex(terciario)),
    neutralPalette: base.neutralPalette,
    neutralVariantPalette: base.neutralVariantPalette,
  });
}

function tokens(paleta, oscuro, contraste) {
  const s = esquema(paleta, oscuro, contraste);
  return Object.fromEntries(
    TOKENS.map((t) => {
      const color = MaterialDynamicColors[camel(t)];
      if (!color) throw new Error(`material-color-utilities no tiene el token ${t}`);
      return [t, rgb(color.getArgb(s))];
    }),
  );
}

// 1. Calibración: Petróleo tiene que salir como tema.css. Se admite ±1 por canal: Material Theme Builder
//    redondea distinto que esta biblioteca (50 de 294 valores difieren en 1/255), algo invisible.
const canales = (c) => c.match(/\d+/g).map(Number);
const distintos = [];
for (const [clase, [oscuro, contraste]] of Object.entries(VARIANTES)) {
  const esperado = bloqueTema(clase);
  const generado = tokens({ semilla: PETROLEO, esquema: SchemeTonalSpot }, oscuro, contraste);
  for (const t of TOKENS) {
    const e = canales(esperado[t]);
    if (canales(generado[t]).some((v, i) => Math.abs(v - e[i]) > 1))
      distintos.push(`${clase} ${t}: ${generado[t]} ≠ ${esperado[t]}`);
  }
}
if (distintos.length) {
  console.error('El generador no reproduce tema.css; no se escribe nada:\n' + distintos.join('\n'));
  process.exit(1);
}

// 2. Paletas nuevas
let css =
  '/* Generado por scripts/generar-paletas.mjs (npm run paletas): no se edita a mano.\n' +
  '   Paletas elegibles en Ajustes; Petróleo, la predeterminada, es tema.css. Las aplica data-paleta en <html>. */\n';
for (const [nombre, paleta] of Object.entries(PALETAS)) {
  const terciario = paleta.terciario ? `, terciario ${paleta.terciario}` : '';
  const tipo = paleta.esquema === SchemeNeutral ? 'neutral' : 'tonal spot';
  css += `\n/* ${nombre}: semilla ${paleta.semilla}, ${tipo}${terciario} */\n`;
  for (const [clase, [oscuro, contraste]] of Object.entries(VARIANTES)) {
    const t = tokens(paleta, oscuro, contraste);
    css += `:root[data-paleta='${nombre}'].${clase} {\n`;
    for (const k of TOKENS) css += `  --md-sys-color-${k}: ${t[k]};\n`;
    css += '}\n';
  }
}
writeFileSync(SALIDA, css);
console.log(`Petróleo reproduce tema.css (${TOKENS.length} tokens × 6, ±1). Escrito src/estilos/paletas.css.`);
