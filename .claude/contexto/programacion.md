# Contexto de programación — app de registro de tiro

Memoria del agente `experto-programador`. Se actualiza en la misma rama que el cambio que la vuelve falsa.
Última revisión: 2026-11-12 (versión 0.2.0).

## Pila

- **Svelte 5** (runes) + **TypeScript** estricto + **Vite 8**, PWA con `vite-plugin-pwa` (Workbox, `autoUpdate`).
- Única dependencia de ejecución: **`idb`** (IndexedDB). Todo lo demás es de desarrollo.
- Pruebas con **Vitest** (`src/**/*.test.ts`); tipos con `svelte-check`; **Prettier** (comillas simples, ancho 120, plugin Svelte) y **ESLint** (recomendado JS + TS + Svelte; `_` marca variables sin uso).
- Node 24 vía nvm: `. ~/.nvm/nvm.sh && nvm use` (lee `.nvmrc`).
- Publicada en GitHub Pages con `base: '/app-registro-tiro/'`.

## Arquitectura

```
src/main.ts, App.svelte   arranque, tema, navegación inferior, pantalla de error de almacenamiento
src/pantallas/            una por destino: Configurar, Registro, Historial, Detalle, Ajustes
src/componentes/          piezas reutilizables (Barra, Diana, DianaRonda, Teclado, Hoja, Grafico, Dialogo, Notas…)
src/lib/                  lógica sin interfaz, con pruebas al lado
  modelo.ts               tipos (Sesion, Ronda, Flecha, Configuracion), perfiles, LIMITES, validarConfig, migrar, cálculos
  diana.ts                geometría y puntuación de dianas World Archery (mm desde el centro, y hacia arriba)
  estado.svelte.ts        clase Estado (singleton `estado`): estado global con $state y todas las acciones
  almacen.ts              IndexedDB 'registro-tiro' v1, store 'sesiones' (keyPath id, índice fecha)
  exportar.ts/importar.ts CSV RFC 4180 de ida y vuelta (una fila por flecha)
  formato.ts, tema.ts     Intl en español; tema claro/oscuro y contraste en localStorage
src/estilos/              tema.css (generado, no tocar) y base.css (componentes MD3)
```

Flujo de datos: las pantallas leen `estado` y llaman a sus acciones; las acciones mutan `$state` y luego `persistir()` guarda `$state.snapshot(...)` en `almacen`. No hay router ni store externo.

## Convenciones

- Código, nombres, comentarios, commits y textos de la interfaz **en español** (sin tildes en identificadores).
- Comentarios breves que explican el porqué; JSDoc `/** */` en funciones exportadas de `lib/` cuando no son obvias.
- Errores de almacenamiento: `console.error` + `estado.avisar(...)` y devolver `false`; nunca perder lo que está en pantalla. La sesión no pasa al historial si no se pudo guardar.
- Entradas externas siempre validadas: `validarConfig`, `leerAjustes`, `importar.ts` (cada campo inválido toma el defecto o se rechaza la fila).
- Cambios de formato de datos: subir `VERSION_DATOS` en `modelo.ts`, añadir el paso en `migrar()`, prueba en `modelo.test.ts`, actualizar la tabla del CSV en README.
- Perfil Libre se guarda con `rondas = 0` y `flechasPorRonda = 0`; usar `esLibre()` en vez de comparar a mano.
- Git: rama `feature/…` o `fix/…` desde `main`; merge `--no-ff`; versión en `package.json` + entrada en `CHANGELOG.md` en cada publicación.

## Seguridad (requisito del usuario: sin puertas traseras ni vulnerabilidades)

- Se permiten librerías si dan mejor resultado: pocas, conocidas, mantenidas, versión exacta (`save-exact`).
- **Nada de red en tiempo de ejecución** (analítica, CDNs, fuentes, telemetría). Los datos solo salen si el usuario comparte el CSV.
- CSP estricta inyectada al compilar en `vite.config.ts` (`default-src 'self'`, `form-action 'none'`, `object-src 'none'`…). En desarrollo no se aplica.
- `.npmrc`: `ignore-scripts=true`, `save-exact=true`, `audit=true`.
- CI (`.github/workflows/publicar.yml`): permisos mínimos, acciones fijadas por hash; en PR corre audit (high), lint, test, check y build; en `main` además publica.
- No se usa `{@html}`, `innerHTML` ni `eval` (verificado 2026-11-12).

## Riesgos aceptados

- `npm audit` muestra avisos moderados de `deepmerge` y `glob` en herramientas de compilación (`workbox-build`, `vite-plugin-svelte`); no llegan al teléfono (`--omit=dev` da 0) y no hay versión corregida compatible.

## Pendientes y deuda conocida

- (vacío)

## Historial de revisiones

- (cada revisión añade aquí una línea: fecha, rama, dictamen y lo aprendido)
