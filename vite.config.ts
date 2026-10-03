import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import paquete from './package.json' with { type: 'json' };

// Política de seguridad del contenido: la app solo carga recursos de su propio origen
// y no puede conectarse a ningún servidor externo. Se aplica solo al compilar,
// porque el servidor de desarrollo necesita scripts en línea.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function csp(): Plugin {
  return {
    name: 'csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n    <meta http-equiv="Content-Security-Policy" content="${CSP}">`),
  };
}

export default defineConfig({
  base: '/app-registro-tiro/',
  define: { __VERSION__: JSON.stringify(paquete.version) },
  build: { assetsInlineLimit: 0, modulePreload: { polyfill: false } },
  plugins: [
    svelte(),
    csp(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['icono.svg'],
      manifest: {
        name: 'Registro de tiro',
        short_name: 'Tiro',
        description: 'Registro de sesiones de tiro con arco recurvo. Funciona sin conexión.',
        lang: 'es',
        theme_color: '#f6fafe',
        background_color: '#f6fafe',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-512-mask.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png}'] },
    }),
  ],
  test: { include: ['src/**/*.test.ts'] },
});
