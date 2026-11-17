# Contexto UX — app de registro de tiro

Memoria del agente `experto-ux`. Se actualiza en la misma rama que el cambio que la vuelve falsa.
Última revisión: 2026-11-17 (versión 0.4.2).

## Usuario y uso

- Un arquero de recurvo olímpico (el dueño de la app) y, en ocasiones, su entrenador.
- Teléfono: **Pixel 8** con **Brave**, app instalada como PWA (pantalla completa, solo vertical).
- Se usa en el campo de tiro: a pleno sol, de pie, entre rondas, con una mano y a veces con dactilera. La tarea crítica es **anotar las flechas de la ronda rápido y sin errores**; todo lo demás es secundario.
- Distancias habituales 18/30/50/60/70 m; objetivo 70 m.

## Sistema visual

- Estilo **«marcador deportivo»** sobre Material 3 hecho a mano (sin librería de componentes).
- `src/estilos/tema.css`: tokens `--md-sys-color-*` exportados de Material Theme Builder (semilla azul petróleo, primary #156683). Generado: no se edita a mano.
- Variantes por clase en `<html>` (las pone `src/lib/tema.ts`): `light|dark` + `''|-medium-contrast|-high-contrast`. **Por defecto: contraste medio**, modo según el sistema.
- **Franja del tablero** (`.tablero`; tokens `--tablero-fondo|texto|rotulo|acento|linea|tenue` en `base.css`): fondo primary en claro medio y alto, `on-primary-fixed-variant` en claro estándar y en los tres oscuros; rótulos rgb(140 207 241) en todas las variantes; acento `--diana-oro`; foco amarillo dentro del tablero; en oscuro, el último bloque del tablero lleva borde inferior `outline-variant`. La forman bloques hermanos: `Barra.svelte` (título), `Marcador.svelte` (pares rótulo-valor en `<dl>`, dentro de un `role="group"`) y, en Registro, las pestañas.
- **Fuente**: Barlow Condensed 600/700 incluida en la app (`fuentes.css`, desde @fontsource, precacheada) para cifras, rótulos, botones, pestañas y navegación; Roboto/sistema para el texto corrido. Las mayúsculas, solo con `text-transform` (el texto fuente va en minúscula para que el lector no deletree).
- Tipografía: `t-cifra-xl`, `t-cifra-l`, `t-rotulo`, `t-seccion` (también `h2.sec`), `t-titulo-tablero`, `t-contexto`, más `t-title-m` y `t-body-s`. Ya no existen `t-display`, `t-headline`, `t-title-l`, `t-label`.
- Forma: `--shape-s` (8 px) en botones, segmentados, casillas, teclas, tarjetas, hoja, campos, diálogos y aviso; `.icbtn` redondo.
- `Marcador` admite `nota`: línea de 13 px bajo la cifra, leída junto al valor; con nota, las cifras secundarias se alinean con la cifra.
- Botones: `.btn` de 48 px mínimo (Barlow 700 18, mayúsculas), `.grande` 56; el ícono no se encoge (`flex: none`); `.contorno` con 2px `on-surface`; `.lleno` (en claro, ícono en oro); `.lleno.peligro`; `.texto`.
- Segmentado y chips: botones separados; lo elegido en **primary / on-primary**, sin ✓.
- Bordes: controles interactivos en `outline-variant`; divisores decorativos en `surface-container-highest`.
- Colores de la diana World Archery fijos (`--diana-*`, clases `z-oro|rojo|azul|negro|blanco|fuera`): no dependen del tema. La M usa `--diana-fallo` #4c5458 (fijo, texto blanco).
- Barra de estado del sistema: color de `--tablero-fondo`; durante Entrada (`body.entrando`), `surface`.
- Íconos: Material Symbols copiados como trazos en `Icono.svelte` (sin fuentes externas).

## Navegación y pantallas

Navegación inferior fija de 76 px (`--alto-nav`) con 3 destinos, **Sesión**, **Historial**, **Ajustes**; el activo en un recuadro primary.

- **Configurar**: tablero FORMATO / FLECHAS / MÁXIMO (en Libre: FORMATO / DISTANCIA / DIANA), al día con lo elegido. Perfil, caja de distancia (cifra grande, error en línea), atajos de distancia, diana 122/80/40 cm, rondas y flechas (solo Abierto). «Empezar sesión» pegado sobre la navegación.
- **Registro**: barra de contexto «Perfil · d m · Diana cm» (« cm» oculto); marcador RONDA n/N (leído « de N»; en Libre sin /N; con todo guardado se queda en N) / ESTA RONDA (amarillo; «–» con todo guardado) / SESIÓN (solo rondas guardadas). Pestañas **Anotar** y **Hoja** dentro del tablero, pegadas arriba, indicador amarillo de 4 px en `::before`; Hoja se lee «Hoja, N rondas guardadas»; también se cambia deslizando.
  - Anotar: tira de casillas cuadradas de 50 px (borde 2px `on-surface`, cifra 30 px; el siguiente hueco con borde primary), sin caja tonal ni suma (está en el tablero), con «pop» de la flecha nueva; en Libre, fila desplazable con máscara a la izquierda solo cuando está desplazada. Diana o teclado 3×4 (teclas de 56 a 76 px), dimensionados con `--resto` y `--ayuda` para no desplazar. Barra fija Deshacer (contorno) / Guardar ronda (lleno) en proporción 1 : 1,35. ⓘ ayuda de la diana, alternar teclado/diana y menú ⋮ («Terminar sesión ahora», «Descartar sesión» en error).
  - Rondas completas: tarjeta con «Terminar y guardar» (`.lleno.grande`) y debajo «Ir a las notas» (`.contorno`), a todo el ancho.
  - Hoja: Resumen en caja con borde 2px, solo de rondas guardadas, rótulo «Total» y «N flechas» como nota bajo la cifra; hoja; notas; «Terminar sesión».
- **Historial**: progreso en la franja (chips de distancia si hay varias, promedio de la última sesión, insignia ± frente a la anterior —nunca rojo/verde—, tendencia de las últimas 12 sesiones con puntos tocables que abren la sesión); lista por mes con el total en casilla primary («N puntos»), fecha, perfil · flechas · promedio y distancia.
- **Detalle**: fila del título pegada arriba (volver, «d m · Perfil», fecha · hora · id, compartir); tablero TOTAL (con «N flechas» como nota) / X / 10+X / PROM.; diana por ronda con ◀ ▶ (Todas → R1 … Rn → Todas, anunciado); gráfico de barras (mínimo 24 px, desplazable de lado, la elegida en oro y llevada a la vista); fila elegida de la hoja en oro con marca primary y texto `on-surface`; notas en solo lectura; «Borrar sesión».
- **Ajustes**: tablero SESIONES / FLECHAS y «Guardadas solo en este teléfono.»; modo, contraste, exportar/importar CSV, versión.
- `Entrada.svelte`: animación de arranque (ver decisiones).

## Decisiones validadas por el usuario (no reabrir)

- Le gustan los colores del tema; contraste **medio** por defecto.
- Rediseño **«marcador deportivo»** aprobado (2026-11-17), a partir de maquetas de todas las pantallas.
- Perfiles **Control** (12×6 fijo), **Abierto** (configurable) y **Libre** (solo distancia y diana; rondas libres hasta terminar, tope 24 flechas por ronda).
- Notas en **dos campos**: personales y del entrenador; se bloquean al terminar la sesión.
- Marcado en la diana: **lupa cuadrada fija arriba a la izquierda** que salta a la derecha si el dedo pasa por debajo; zoom con dos dedos; regla de la línea.
- Corrección de una ronda guardada: con el teclado (descarta la posición) o volviendo a marcar en la diana.
- Animación de entrada: arranca igual que la pantalla de inicio de Android con el ícono maskable, pasa a gris, dos flechas fallan, la tercera acierta y vuelven los colores. Sus constantes están medidas en el Pixel 8; no cambiarlas sin medir de nuevo.
- Tira de la ronda **sin caja tonal** (casillas sueltas, suma solo en el tablero), conservando el pop. Sustituye a la «caja tonal» de 0.3.1.
- En Anotar **no hay gráfico**; la diana, lo más grande posible. Se mantiene la barra Deshacer + Guardar ronda.
- Detalle con gráfico de **barras**. Progreso del Historial **por distancia, últimas 12**, en la franja (sin tarjeta plegable).
- Barra de estado **oscura** (color del tablero), clara durante Entrada. `--diana-fallo` aceptado.
- El ícono maskable lleva versión en el nombre (`icono-512-mask-v2`): Brave lo guarda en caché, así que cambiarlo implica un nombre nuevo (v3…).

## Criterios ya aplicados

- Objetivos táctiles de 48 px mínimo; filas de la hoja tocables enteras con un botón de 48 px en la primera celda; chips de distancia del Historial de 36 px visibles con zona táctil de 48.
- Menús se cierran al tocar fuera, con Escape o con atrás, y devuelven el foco al ⋮ (también los diálogos abiertos desde el menú, con `devolverFoco`).
- **Atrás de Android** (`src/lib/atras.ts`): cada capa (menú, diálogo, editor, Detalle) registra `capa()` en un `$effect`; una sola entrada de historial; sin capas, atrás sale de la app. Toda capa nueva debe usarlo.
- Avisos (`Aviso.svelte`) tipo snackbar. Con acción («Deshacer» tras guardar una ronda): 5 s, pausa con foco o dedo encima, botón de 48 px fuera de la región viva, solo el botón recibe toques, se retira al marcar una flecha nueva y sube sobre la barra fija.
- Abreviaturas visuales con texto oculto (`.oculto`): «/6» → « de 6», ▲▼ → sube/baja, R / Pts / Acum. de la hoja, «Prom.» (`rotuloLeido`), fecha completa en las filas del historial, total del historial leído «N puntos». Teclas X («X, 10 puntos») y M («Fallo») con `aria-label`.
- `scroll-padding-bottom` con la barra fija de acciones. Al volver de Detalle se restauran el scroll y el foco en la fila.
- Diana: centro del grupo y flecha seleccionada con doble trazo (`--diana-tinta` debajo, blanco encima). Números sobre rojo en 700.
- Todas las casillas y teclas llevan borde 2px `on-surface` (separa la negra del fondo oscuro y la M del resto).
- Fila elegida de la hoja con texto `on-surface` (con `--diana-tinta` en oscuro no llegaba a AA).
- `prefers-reduced-motion` respetado en `Entrada`, `Aviso` y el pop de la tira.
- Capa de estado: `:hover` solo dentro de `@media (hover: hover)` (en táctil se quedaba pegado); el indicador de pestaña va en `::before`, separado de la capa `::after`.
- Todo contenedor con `overflow` que contenga `.oculto` debe ser posicionado (`position: relative`, como `.hoja` y `.grafico`); si no, el texto oculto escapa, ensancha la página y en Android agranda el viewport y descoloca los diálogos y la navegación fija.

## Pendientes y deuda conocida

- Blanco sobre `--diana-rojo` ≈ 4:1, por debajo de AA en texto pequeño: limitación aceptada (los colores de la diana no se tocan), compensada con peso 700 y tamaño grande.
- Atrás desde Historial/Ajustes vuelve a Sesión: lo decide el usuario.
- El gráfico de barras desplazable no indica que hay más barras.
- Teclado en 360×640: con teclas de 56 px se desplazan unos 27 px (aceptado; no es el equipo del usuario).
- El rediseño 0.4.0 se revisó leyendo código, sin verlo renderizado: validarlo en el Pixel 8.

## Historial de revisiones

- 2026-11-12 · feature/rediseno-ux · propuesta e implementación aprobadas con cambios: toda capa se cierra por un solo camino (limpieza del `$effect`) y la pila de atrás evita la carrera back()/pushState; el indicador de pestaña comparte `::after` con `.estado` (fijar posición y opacidad); los diálogos abiertos desde un menú devuelven el foco al ⋮.
- 2026-11-13 · fix/tira-caja-y-pestanas · aprobado con cambios: tira en caja tonal con pop; el destello en la pestaña que se deja venía de compartir `::after` con la capa de estado y del hover pegado en táctil (supera la nota anterior sobre `::after`); corregido.
- 2026-11-17 · feature/estilo-marcador · rediseño «marcador deportivo»; aprobado tras corregir el contraste de la fila elegida en oscuro y la altura de Anotar con la ayuda visible.
- 2026-11-17 · fix/hoja-y-terminar (0.4.1) · aprobado: botones de «Rondas completas» en columna y nota de flechas bajo el total.
- 2026-11-17 · fix/hoja-desborde (0.4.2) · aprobado: `.hoja` posicionada para que los `.oculto` de la cabecera no ensanchen la página; pendiente validar en el Pixel 8.
