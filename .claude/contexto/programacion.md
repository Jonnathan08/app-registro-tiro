# Contexto de programación — app de registro de tiro

Memoria del agente `experto-programador`. Se actualiza en la misma rama que el cambio que la vuelve falsa.
Última revisión: 2026-11-17 (versión 0.4.2).

## Pila

- **Svelte 5** (runes) + **TypeScript** estricto + **Vite 8**, PWA con `vite-plugin-pwa` (Workbox, `autoUpdate`).
- Dependencias de ejecución: **`idb`** (IndexedDB) y **`@fontsource/barlow-condensed`** 5.3.0 (fuente OFL: solo el subconjunto latin, pesos 600 y 700, woff2). Todo lo demás es de desarrollo.
- La fuente se carga con `@font-face` propio en `src/estilos/fuentes.css` (Vite resuelve `url('@fontsource/…')`) y el precache incluye `woff2` (`globPatterns`).
- Pruebas con **Vitest** (`src/**/*.test.ts`); tipos con `svelte-check`; **Prettier** (comillas simples, ancho 120, plugin Svelte) y **ESLint** (recomendado JS + TS + Svelte; `_` marca variables sin uso).
- Node 24 vía nvm: `. ~/.nvm/nvm.sh && nvm use` (lee `.nvmrc`).
- Publicada en GitHub Pages con `base: '/app-registro-tiro/'`.

## Arquitectura

```
src/main.ts, App.svelte   arranque, tema, navegación inferior, pantalla de error de almacenamiento
src/pantallas/            una por destino: Configurar, Registro, Historial, Detalle, Ajustes
src/componentes/          piezas reutilizables (Barra, Marcador, Diana, DianaRonda, Teclado, Hoja, Grafico, Dialogo…)
                          franja del tablero = bloques hermanos: Barra (variante pantalla|contexto, children opcional
                          para el título) + Marcador (cifras en <dl>, tipo Cifra) + pestañas de Registro; hermanos
                          porque las pestañas sticky deben ser hijas del flujo. Resumen: variantes caja|tablero.
                          Grafico: solo barras (prop maxValores), desplazable de lado; lleva la barra elegida a la
                          vista moviendo scrollLeft (no scrollIntoView, que movería la página) y por eso .grafico es
                          position: relative. La tendencia del Historial es un SVG propio con puntosTendencia.
src/lib/                  lógica sin interfaz, con pruebas al lado
  modelo.ts               tipos (Sesion, Ronda, Flecha, Configuracion), perfiles, LIMITES, validarConfig, migrar, cálculos
                          (rondaEnCurso no pasa de N; totalCerrado sin enCurso; totalesHistorial)
  progreso.ts             progreso del historial: gruposProgreso, diferencia, puntosTendencia, MAX_TENDENCIA = 12
  diana.ts                geometría y puntuación de dianas World Archery (mm desde el centro, y hacia arriba)
  estado.svelte.ts        clase Estado (singleton `estado`): estado global con $state y todas las acciones
  almacen.ts              IndexedDB 'registro-tiro' v1, store 'sesiones' (keyPath id, índice fecha)
  exportar.ts/importar.ts CSV RFC 4180 de ida y vuelta (una fila por flecha)
  formato.ts, tema.ts     Intl en español; tema claro/oscuro y contraste en localStorage
  atras.ts                botón atrás de Android por capas: una sola entrada propia en history, contador `ignorar`,
                          scrollRestoration='manual'; `capa(cerrar)` se usa como limpieza de un $effect
  ayuda.ts                contador en localStorage (`registro-tiro:marcas-diana`) de la ayuda de la diana
src/estilos/              tema.css (generado, no tocar), base.css (tokens del tablero y componentes) y fuentes.css
```

Flujo de datos: las pantallas leen `estado` y llaman a sus acciones; las acciones mutan `$state` y luego `persistir()` guarda `$state.snapshot(...)` en `almacen`. No hay router ni store externo.

## Convenciones

- Código, nombres, comentarios, commits y textos de la interfaz **en español** (sin tildes en identificadores).
- Comentarios breves que explican el porqué; JSDoc `/** */` en funciones exportadas de `lib/` cuando no son obvias.
- Errores de almacenamiento: `console.error` + `estado.avisar(...)` y devolver `false`; nunca perder lo que está en pantalla. La sesión no pasa al historial si no se pudo guardar.
- Entradas externas siempre validadas: `validarConfig`, `leerAjustes`, `importar.ts` (cada campo inválido toma el defecto o se rechaza la fila).
- Cambios de formato de datos: subir `VERSION_DATOS` en `modelo.ts`, añadir el paso en `migrar()`, prueba en `modelo.test.ts`, actualizar la tabla del CSV en README.
- Toda capa modal nueva (menú, diálogo, hoja inferior, pantalla de detalle) registra `capa(cerrar)` en un `$effect`.
- `estado.avisar(texto, accion?)` admite una acción (p. ej. Deshacer); la acción valida que el estado sigue siendo el esperado (como `reabrirRonda`) y `marcar` retira los avisos con acción.
- Claves de localStorage (entradas externas, siempre validadas y con try/catch): `registro-tiro:ultima-config`, `registro-tiro:ajustes`, `registro-tiro:marcas-diana`.
- Perfil Libre se guarda con `rondas = 0` y `flechasPorRonda = 0`; usar `esLibre()` en vez de comparar a mano.
- Capa de estado: `.estado::after` es solo la capa de hover/pulsación (hover solo en `@media (hover: hover)`); indicadores u otros adornos van en `::before` o en un elemento propio, nunca reutilizando `::after`.
- Animaciones de entrada ligadas a una acción del usuario: clase CSS con `@keyframes` y un índice `$state` que se fija en la acción y se limpia en `animationend` (ver `nueva` en Registro); con `prefers-reduced-motion`, duración de 1 ms para que `animationend` llegue. Las transiciones `in:` de Svelte no admiten curvas CSS.
- Tema oscuro en CSS de componente: `:global(html[class^='dark'])` (`aplicarTema` asigna `className` completo).
- Estilo marcador: tokens `--tablero-fondo|texto|rotulo|acento|linea|tenue` (por defecto primary; en claro estándar y
  en oscuro, `on-primary-fixed-variant`), `--font-marcador`, `--alto-nav` (76 px; los desplazamientos sobre la
  navegación se calculan con él) y `--diana-fallo`. Los bloques de la franja llevan la clase `.tablero`; el borde
  inferior en oscuro va en base.css (`.tablero:not(:has(+ .tablero))`).
- Clases tipográficas `.t-cifra-xl`, `.t-cifra-l`, `.t-rotulo`, `.t-titulo-tablero`, `.t-contexto` y `h2.sec`. Mayúsculas
  siempre con `text-transform`, nunca escritas así en el código. Ya no existen `.t-display`, `.t-headline`,
  `.t-title-l`, `.t-label` ni `.btn.tonal`. `Cifra.rotuloLeido` lee completas las abreviaturas de los rótulos. `Cifra.nota` es la línea pequeña bajo la cifra
  (Roboto 500, 13/16, `--tablero-rotulo`); con nota en la primera cifra (`dl.con-nota`), las secundarias se alinean con
  la cifra y no con la nota (si otra cifra llevara nota, generalizar con `cifras.some`). `.btn svg` lleva `flex: none`.
- Registro: `.pagina` define `--resto` (lo que ocupa Anotar fuera de la diana o el teclado) y `--alto-tecla` (56–76 px
  según el alto). Si cambia la altura de la barra, el marcador, las pestañas o la tira, actualizar `--resto`.
- `colorBarraSistema()` (tema.ts) pone `theme-color` del color del tablero, o de la superficie mientras `body.entrando`.
- Todo contenedor con `overflow-x: auto` que tenga descendientes absolutos (`.oculto`, `::before`) lleva `position: relative`;
  si no, ensancha la página y Chrome Android descoloca los fijos y los diálogos (`.hoja`, `.grafico`).
- Git: rama `feature/…` o `fix/…` desde `main`; merge `--no-ff`; versión en `package.json` + entrada en `CHANGELOG.md` en cada publicación.

## Seguridad (requisito del usuario: sin puertas traseras ni vulnerabilidades)

- Se permiten librerías si dan mejor resultado: pocas, conocidas, mantenidas, versión exacta (`save-exact`).
- **Nada de red en tiempo de ejecución** (analítica, CDNs, fuentes, telemetría). Los datos solo salen si el usuario comparte el CSV. La fuente va incluida en la app (auto-alojada y precacheada).
- CSP estricta inyectada al compilar en `vite.config.ts` (`default-src 'self'`, `form-action 'none'`, `object-src 'none'`…). En desarrollo no se aplica.
- `.npmrc`: `ignore-scripts=true`, `save-exact=true`, `audit=true`.
- CI (`.github/workflows/publicar.yml`): permisos mínimos, acciones fijadas por hash; en PR corre audit (sin dev en alto y completo en crítico bloquean; completo en alto, aviso `::warning`), lint, test, check y build; en `main` además publica.
- No se usa `{@html}`, `innerHTML` ni `eval` (verificado 2026-11-12).

## Riesgos aceptados

- `npm audit` completo: 12 moderados y 14 altas solo en herramientas de desarrollo y compilación (las altas por
  GHSA-fc5q-39xc-vjpf, `picomatch` <=4.0.7, sin versión corregida a 2026-11-17, vía vite, vitest, svelte-check y
  vite-plugin-pwa); `--omit=dev` da 0. Por decisión del usuario (2026-11-17) el CI solo bloquea por altas sin dev y por
  críticas en todo; las altas de desarrollo quedan como aviso. Una alta real en una herramienta de compilación ya no
  detiene la publicación.

## Pendientes y deuda conocida

- Actualizar `picomatch` por vulnerabilidad (GHSA-fc5q-39xc-vjpf, ReDoS) en cuanto salga la 4.0.8 o posterior: `npm update`,
  comprobar que `npm audit --audit-level=high` queda limpio y preguntar al usuario si el CI vuelve a bloquear por la
  auditoría completa en alto.
- Fechas importadas sin normalizar a ISO UTC (`importar.ts`): pueden alterar el orden del historial. La agrupación por mes ya usa un mapa y no duplica meses.

## Historial de revisiones

- 2026-11-12 · feature/rediseno-ux · aprobado con cambios · capas del botón atrás (con «adelante» ignorado vía `state.capa`) y aviso con acción (la pausa se reinicia con cada aviso); ojo con las claves derivadas de fechas importadas.
- 2026-11-13 · fix/tira-caja-y-pestanas · aprobado · tira en caja tonal con pop en la flecha nueva; el indicador de la pestaña compartía `::after` con la capa de estado y destellaba en la pestaña abandonada.
- 2026-11-17 · feature/estilo-marcador · aprobado con cambios · rediseño marcador con fuente auto-alojada y precacheada; quedaron la variante de línea de Grafico sin uso y las barras/teclado por validar en pantallas pequeñas.
- 2026-11-17 · feature/estilo-marcador (2.ª vuelta) · aprobado · Grafico solo barras con desplazamiento lateral; alturas de la diana y del teclado calculadas con --resto y --alto-nav; queda por probar en 360×640 en el teléfono.
- 2026-11-17 · feature/estilo-marcador (3.ª vuelta) · aprobado · barra elegida a la vista con scrollLeft; queda por probar en 360×640 en el teléfono.
- 2026-11-17 · fix/hoja-y-terminar · aprobado · botones de Rondas completas en columna, el ícono del botón no se encoge y el total con las flechas como nota bajo la cifra.
- 2026-11-17 · fix/hoja-desborde · aprobado con cambios · .hoja posicionada para que los .oculto no ensanchen la página (diálogo y navegación descolocados en Chrome Android); el audit en alto falla por picomatch sin corrección publicada y bloquea la publicación en CI.
- 2026-11-17 · fix/ci-audit · aprobado · el CI bloquea por altas sin dev y por críticas en todo; las altas de desarrollo, como aviso `::warning`; pendiente picomatch 4.0.8.
