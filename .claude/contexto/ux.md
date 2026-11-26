# Contexto UX — app de registro de tiro

Memoria del agente `experto-ux`. Se actualiza en la misma rama que el cambio que la vuelve falsa.
Última revisión: 2026-11-26 (versión 0.8.0).

## Usuario y uso

- Un arquero de recurvo olímpico (el dueño de la app) y, en ocasiones, su entrenador.
- Teléfono: **Pixel 8** con **Brave**, app instalada como PWA (pantalla completa, solo vertical).
- Se usa en el campo de tiro: a pleno sol, de pie, entre rondas, con una mano y a veces con dactilera. La tarea crítica es **anotar las flechas de la ronda rápido y sin errores**; todo lo demás es secundario.
- Distancias habituales 18/30/50/60/70 m; objetivo 70 m.

## Sistema visual

- Estilo **«marcador deportivo»** sobre Material 3 hecho a mano (sin librería de componentes).
- `src/estilos/tema.css` = paleta **Petróleo** (predeterminada): tokens `--md-sys-color-*` exportados de Material Theme Builder (semilla #156683). Generado: no se edita a mano.
- `src/estilos/paletas.css` (generado con material-color-utilities por `scripts/generar-paletas.mjs`; no se edita a mano): **Bosque** #2f6b3f, **Violeta** #6750a4 (terciario #156683) y **Grafito** #5d6168 (esquema Neutral, terciario #156683). Se aplica con `data-paleta` en `<html>` (también `petroleo`, sin CSS propio), nunca como clase. Nunca rojo ni amarillo en primario ni terciario.
- `--paleta-muestra-*` en `base.css`: primary del claro estándar de cada paleta; única excepción de color fijo además de la diana.
- `.chip-tablero` (`base.css`): chip de filtro sobre la franja (36 px visibles, 48 de zona táctil, lo elegido en oro con tinta), compartido por Historial y Estadísticas.
- Mapa de calor: grises de la diana de fondo y escala negro → azul → rojo → oro → blanco son colores fijos como la diana; viven en `calor.ts`/`MapaCalor.svelte` (el canvas no lee variables CSS) y deben coincidir con `--diana-*`.
- Variantes por clase en `<html>` (las pone `src/lib/tema.ts`): `light|dark` + `''|-medium-contrast|-high-contrast`. **Por defecto: contraste medio**, modo según el sistema.
- **Franja del tablero** (`.tablero`; tokens `--tablero-fondo|texto|rotulo|acento|linea|tenue` en `base.css`): fondo primary en claro medio y alto, `on-primary-fixed-variant` en claro estándar y en los tres oscuros; rótulos `inverse-primary` (rgb(140 207 241) en Petróleo); las reglas del tablero valen por tono para las cuatro paletas sin ajustes propios y `paletas.test.ts` vigila sus contrastes en las 24 combinaciones; acento `--diana-oro`; foco amarillo dentro del tablero; en oscuro, el último bloque del tablero lleva borde inferior `outline-variant`. La forman bloques hermanos: `Barra.svelte` (título), `Marcador.svelte` (pares rótulo-valor en `<dl>`, dentro de un `role="group"`) y, en Registro, las pestañas.
- **Fuente**: Barlow Condensed 600/700 incluida en la app (`fuentes.css`, desde @fontsource, precacheada) para cifras, rótulos, botones, pestañas y navegación; Roboto/sistema para el texto corrido. Las mayúsculas, solo con `text-transform` (el texto fuente va en minúscula para que el lector no deletree).
- Tipografía: `t-cifra-xl`, `t-cifra-l`, `t-rotulo`, `t-seccion` (también `h2.sec`), `t-titulo-tablero`, `t-contexto`, más `t-title-m` y `t-body-s`. Ya no existen `t-display`, `t-headline`, `t-title-l`, `t-label`.
- Forma: `--shape-s` (8 px) en botones, segmentados, casillas, teclas, tarjetas, hoja, campos, diálogos y aviso; `.icbtn` redondo. `.hoja-inferior` compartida en `base.css` (`--shape-m` arriba, tirador) para EditarRonda y la libreta; `.caja-cifra` compartida (distancia de Configurar y de la libreta).
- **Perilla** (`Perilla.svelte`): SVG de 168 px, `role="slider"`; 20 retenes de 18° (paso 0,1, una vuelta = 2,0); rango 0–100; arrastre circular con `touch-action: none` (se ignora a menos de 24 px del centro; el giro de más en un límite no se acumula); índice fijo `on-surface`, aguja `primary`, muescas `on-surface-variant`; −/+ de 56 px con repetición (400/100 ms), `aria-disabled` (opacidad 0,38) en el límite, nunca `disabled`, sin menú contextual; teclado ←↓→↑, RePág/AvPág ±1, Inicio/Fin; vibración de 5 ms por retén, solo al tocar; región viva para −/+; sin transiciones.
- Libreta: editor «Marca de N m» / «Nueva marca»; caja Distancia + chips; elevación en un campo grande (coma o punto) con «Guardada: x · ±d» o «Parte de la marca de N m.» (solo sin girar); nota en `.campo` «Nota (opcional)»; «Cambiada el …»; Borrar (con `Dialogo` de peligro) / Cancelar / Guardar. Lista: filas de 64 px, distancia en `t-cifra-l`, nota y fecha corta, elevación en `primary`. Escape, igual que atrás: en el editor vuelve a la lista; en la lista cierra la hoja. La tarjeta destacada se nombra con `aria-labelledby` a su rótulo.
- `Marcador` admite `nota`: línea de 13 px bajo la cifra, leída junto al valor; con nota, las cifras secundarias se alinean con la cifra.
- Botones: `.btn` de 48 px mínimo (Barlow 700 18, mayúsculas), `.grande` 56; el ícono no se encoge (`flex: none`); `.contorno` con 2px `on-surface`; `.lleno` (en claro, ícono en oro); `.lleno.peligro`; `.texto`.
- Segmentado y chips: botones separados; lo elegido en **primary / on-primary**, sin ✓. `Segmentado` admite `columnas` (cuadrícula) y `muestra` por opción (círculo decorativo de 18 px con borde `currentColor`, `aria-hidden`; la de la opción elegida va llena en `currentColor`, porque en su color se veía como un aro vacío).
- Bordes: controles interactivos en `outline-variant`; divisores decorativos en `surface-container-highest`.
- Colores de la diana World Archery fijos (`--diana-*`, clases `z-oro|rojo|azul|negro|blanco|fuera`): no dependen del tema. La M usa `--diana-fallo` #4c5458 (fijo, texto blanco).
- Barra de estado del sistema: color de `--tablero-fondo`; durante Entrada (`body.entrando`), `surface`.
- Íconos: Material Symbols copiados como trazos en `Icono.svelte` (sin fuentes externas).

## Navegación y pantallas

Navegación inferior fija de 76 px (`--alto-nav`) con 4 destinos, **Sesión**, **Historial**, **Estadísticas**, **Ajustes**; el activo en un recuadro primary; etiqueta 13 px, interletra 0,8 px, sin corte a 360 px. La app abre en Sesión. Atrás desde otra pestaña vuelve a Sesión.

- **Configurar**: tablero FORMATO / FLECHAS / MÁXIMO (en Libre: FORMATO / DISTANCIA / DIANA), al día con lo elegido. Perfil, caja de distancia (cifra grande, error en línea), atajos de distancia, diana 122/80/40 cm, rondas y flechas (solo Abierto). «Empezar sesión» pegado sobre la navegación.
- **Registro**: barra de contexto «Perfil · d m · Diana cm» (« cm» oculto); marcador RONDA n/N (leído « de N»; en Libre sin /N; con todo guardado se queda en N) / ESTA RONDA (amarillo; «–» con todo guardado) / SESIÓN (solo rondas guardadas). Pestañas **Anotar** y **Hoja** dentro del tablero, pegadas arriba, indicador amarillo de 4 px en `::before`; Hoja se lee «Hoja, N rondas guardadas»; también se cambia deslizando. Menú ⋮ con «Marcas de mira» como primer ítem (antes de «Terminar sesión ahora» y «Descartar sesión»): abre la hoja de la libreta con la marca de la distancia de la sesión destacada (tarjeta con borde 2px `primary`, elevación en `t-cifra-xl`, «Ajustar») o «Sin marca para N m» con «Agregar marca de N m», «Otras distancias» y «Agregar marca»; al cerrar, el foco vuelve al ⋮; la barra y `--resto` no cambian.
  - Anotar: tira de casillas cuadradas de 50 px (borde 2px `on-surface`, cifra 30 px; el siguiente hueco con borde primary), sin caja tonal ni suma (está en el tablero), con «pop» de la flecha nueva; en Libre, fila desplazable con máscara a la izquierda solo cuando está desplazada. Diana o teclado 3×4 (teclas de 56 a 76 px), dimensionados con `--resto` y `--ayuda` para no desplazar. Barra fija Deshacer (contorno) / Guardar ronda (lleno) en proporción 1 : 1,35. ⓘ ayuda de la diana, alternar teclado/diana y menú ⋮ («Terminar sesión ahora», «Descartar sesión» en error).
  - Rondas completas: tarjeta con «Terminar y guardar» (`.lleno.grande`) y debajo «Ir a las notas» (`.contorno`), a todo el ancho.
  - Hoja: Resumen en caja con borde 2px, solo de rondas guardadas, rótulo «Total» y «N flechas» como nota bajo la cifra; hoja; notas; «Terminar sesión».
- **Historial**: progreso en la franja (chips de distancia si hay varias, promedio de la última sesión, insignia ± frente a la anterior —nunca rojo/verde—, tendencia de las últimas 12 sesiones con puntos tocables que abren la sesión); lista por mes con el total en casilla primary («N puntos»), fecha, perfil · flechas · promedio y distancia.
- **Detalle**: fila del título pegada arriba (volver, «d m · Perfil», fecha · hora · id, compartir); tablero TOTAL (con «N flechas» como nota) / X / 10+X / PROM.; diana por ronda con ◀ ▶ (Todas → R1 … Rn → Todas, anunciado); gráfico de barras (mínimo 24 px, desplazable de lado, la elegida en oro y llevada a la vista); fila elegida de la hoja en oro con marca primary y texto `on-surface`; notas en solo lectura; «Borrar sesión».
- **Estadísticas**: Barra fija con el resumen de filtros como subtítulo («Todo el periodo · todas las distancias»); franja con chips Periodo (30 días / 90 días / Todo) y Distancia (Todas + grupos de `gruposProgreso` de todo el historial, solo si hay más de uno); Marcador SESIONES / FLECHAS / PROM.
  - Récords 2×2 en `<dl>`, no pulsables: Mejor sesión (mayor % sobre 10 por flecha, sesiones de 36+ flechas, cualquier perfil; «671/720», «93,2 % · 9,32 por flecha», lugar y la fecha en su propia línea), Mejor ronda (igual, rondas de 3+ flechas), Más X, Más 10+X. Empate: el más antiguo.
  - Agrupación: mapa de calor en canvas, en radios de diana (122/80/40 superpuestas); diana en grises claros por zona (#f4f5f6, #a3a9ad, #cdd2d5, #b3b9bd, #e3e6e8), líneas `--diana-tinta` al 45 %, borde 2 px `on-surface`; escala negro → azul → rojo → oro → blanco con rampa de opacidad desde 0,05; contorno oscuro (isolínea al 90 %, rgb(35 31 32 / 0,65), 1,5 px) en la zona de más impactos; con menos de 30 flechas marcadas, impactos en tinta con borde blanco; ✕ del centro del grupo; lectura visible «Centro del grupo» y «Más impactos» (solo en el mapa) y nota de cuántas flechas cuentan.
  - Puntos por zona: 12 filas fijas con fichas `z-*`, todas las flechas.
  - Flechas por semana: últimas 12 (lunes a domingo), según la distancia y no el periodo; actual en oro; promedio de las semanas cerradas desde la primera sesión con su rótulo en un margen derecho propio; etiquetas cada 4 semanas, omitidas a menos de 4 de la actual; tabla `.oculto` y resumen en texto («Tu semana con más flechas de las últimas 12.» solo si hay semanas anteriores con flechas).
  - Vacíos: «Todavía no hay estadísticas…»; filtro sin sesiones: «Sin sesiones…» y «Ver todo el periodo» (foco al chip «Todo»).
- **Ajustes**: tablero SESIONES / FLECHAS y «Guardadas solo en este teléfono.»; primera sección **Marcas de mira** (lista + «Agregar marca»; el editor en una hoja inferior; vacío: «Todavía no hay marcas…»); Datos: «Exportar sesiones y marcas» / «Importar copia (CSV)», varios archivos a la vez sin duplicar sesiones ni distancias, de las marcas gana la más reciente, aviso «N marcas actualizadas» (o «…, las marcas no se pudieron guardar»); Apariencia: Color (Segmentado 2×2 con muestra; «Los colores de la diana no cambian.»), Modo, Contraste; exportar/importar CSV, versión.
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
- **Libreta de marcas de mira** (2026-11-26): independiente de las sesiones; una marca por distancia (elevación con perilla de 0 a 100 en pasos de 0,1 + nota libre; sin deriva estructurada); en el menú ⋮ de Registro (no un cuarto botón, para no cortar el título) y como primera sección de Ajustes; una nueva parte de la marca más cercana; guardar explícito; borrar con confirmación; fecha del último cambio; en la copia de seguridad gana la más reciente.
- **Atrás** (2026-11-26): desde Historial, Estadísticas o Ajustes sin capas vuelve a Sesión; desde Sesión sale de la app; las capas se cierran primero.
- **Estadísticas** (2026-11-18): pestaña propia (no Inicio), la app sigue abriendo en Sesión; contenido y orden: franja con filtros y cifras, Récords, Agrupación, Puntos por zona, Flechas por semana. Descartado «Camino a 70 m». Récords por proporción con los mínimos de arriba; chips de distancia de todo el historial; diana del mapa en grises claros por zona; escala hasta blanco con contorno oscuro (frente a bajar la opacidad); umbral de 30; récords no pulsables; semanas independientes del periodo.
- **Color de la app** (2026-11-18): cuatro paletas exactas, Petróleo por defecto, sin rojo ni amarillo; Grafito con esquema Neutral; terciario #156683 en Violeta y Grafito; la diana, el ícono y el manifiesto no cambian con la paleta. Petróleo generado se acepta con ±1/255 por canal.
- El ícono maskable lleva versión en el nombre (`icono-512-mask-v2`): Brave lo guarda en caché, así que cambiarlo implica un nombre nuevo (v3…).

## Criterios ya aplicados

- Objetivos táctiles de 48 px mínimo; filas de la hoja tocables enteras con un botón de 48 px en la primera celda; chips de distancia del Historial de 36 px visibles con zona táctil de 48.
- Menús se cierran al tocar fuera, con Escape o con atrás, y devuelven el foco al ⋮ (también los diálogos abiertos desde el menú, con `devolverFoco`).
- **Atrás de Android** (`src/lib/atras.ts`): cada capa (menú, diálogo, editor, Detalle) registra `capa()` en un `$effect`; la pestaña distinta de Sesión es la capa del fondo (`capa(…, { fondo: true })`, registrada en `App.svelte`) y atrás vuelve a Sesión con `ir('sesion')`, arriba y con el foco en el destino «Sesión»; no hay historial de pestañas; una sola entrada de historial; desde Sesión sin capas, atrás sale de la app (sin «pulsa otra vez para salir»: la sesión activa se guarda en cada flecha). Toda capa nueva debe usarlo.
- Avisos (`Aviso.svelte`) tipo snackbar. Con acción («Deshacer» tras guardar una ronda): 5 s, pausa con foco o dedo encima, botón de 48 px fuera de la región viva, solo el botón recibe toques, se retira al marcar una flecha nueva y sube sobre la barra fija.
- Abreviaturas visuales con texto oculto (`.oculto`): «/6» → « de 6», ▲▼ → sube/baja, R / Pts / Acum. de la hoja, «Prom.» (`rotuloLeido`), fecha completa en las filas del historial, total del historial leído «N puntos». Teclas X («X, 10 puntos») y M («Fallo») con `aria-label`.
- `scroll-padding-bottom` con la barra fija de acciones. Al volver de Detalle se restauran el scroll y el foco en la fila.
- Diana: centro del grupo y flecha seleccionada con doble trazo (`--diana-tinta` debajo, blanco encima). Números sobre rojo en 700.
- Todas las casillas y teclas llevan borde 2px `on-surface` (separa la negra del fondo oscuro y la M del resto).
- Fila elegida de la hoja con texto `on-surface` (con `--diana-tinta` en oscuro no llegaba a AA).
- `prefers-reduced-motion` respetado en `Entrada`, `Aviso` y el pop de la tira.
- Una capa con vistas internas (lista → editor) registra una `capa()` por vista: atrás retrocede una vista antes de cerrar.
- Nunca `position: relative|static` en un `<dialog>` modal: en la capa superior se vuelve `absolute` y se descoloca con la página desplazada; el modal ya está posicionado.
- Botones con repetición: el paso se da en `click` cuando no lo dio el puntero (teclado y lectores) y se repite con el puntero; no se deshabilitan mientras se mantienen pulsados.
- Todo gráfico tiene un equivalente textual visible o una tabla `.oculto` dentro de un contenedor posicionado.
- Capa de estado: `:hover` solo dentro de `@media (hover: hover)` (en táctil se quedaba pegado); el indicador de pestaña va en `::before`, separado de la capa `::after`.
- Todo contenedor con `overflow` que contenga `.oculto` debe ser posicionado (`position: relative`, como `.hoja` y `.grafico`); si no, el texto oculto escapa, ensancha la página y en Android agranda el viewport y descoloca los diálogos y la navegación fija.

## Pendientes y deuda conocida

- Blanco sobre `--diana-rojo` ≈ 4:1, por debajo de AA en texto pequeño: limitación aceptada (los colores de la diana no se tocan), compensada con peso 700 y tamaño grande.
- El gráfico de barras desplazable no indica que hay más barras.
- Teclado en 360×640: con teclas de 56 px se desplazan unos 27 px (aceptado; no es el equipo del usuario).
- El rediseño 0.4.0 se revisó leyendo código, sin verlo renderizado: validarlo en el Pixel 8.
- Validar en el Pixel 8 Grafito frente a la M (tira y hoja) y el borde de la lupa sobre los anillos negro y azul.
- Validar en el Pixel 8, al sol, el mapa de calor (contorno y blanco de la zona de más impactos).
- Validar en el Pixel 8, con Brave y dactilera, la perilla (vibración, arrastre circular a pleno sol) y la repetición de −/+.

## Historial de revisiones

- 2026-11-12 · feature/rediseno-ux · propuesta e implementación aprobadas con cambios: toda capa se cierra por un solo camino (limpieza del `$effect`) y la pila de atrás evita la carrera back()/pushState; el indicador de pestaña comparte `::after` con `.estado` (fijar posición y opacidad); los diálogos abiertos desde un menú devuelven el foco al ⋮.
- 2026-11-13 · fix/tira-caja-y-pestanas · aprobado con cambios: tira en caja tonal con pop; el destello en la pestaña que se deja venía de compartir `::after` con la capa de estado y del hover pegado en táctil (supera la nota anterior sobre `::after`); corregido.
- 2026-11-17 · feature/estilo-marcador · rediseño «marcador deportivo»; aprobado tras corregir el contraste de la fila elegida en oscuro y la altura de Anotar con la ayuda visible.
- 2026-11-17 · fix/hoja-y-terminar (0.4.1) · aprobado: botones de «Rondas completas» en columna y nota de flechas bajo el total.
- 2026-11-17 · fix/hoja-desborde (0.4.2) · aprobado: `.hoja` posicionada para que los `.oculto` de la cabecera no ensanchen la página; pendiente validar en el Pixel 8.
- 2026-11-18 · feature/paleta-color (0.5.0) · cuatro paletas de color en Ajustes; aprobado tras rellenar la muestra elegida; pendiente Grafito frente a la M y la lupa en el Pixel 8.
- 2026-11-18 · feature/estadisticas (0.6.0) · pestaña Estadísticas (4 destinos); aprobado con cambios (impactos en tinta, fecha sin partir, lista de dianas, semana récord, rótulo del promedio); re-revisión aprobada: contorno oscuro de la zona de más impactos (decisión del usuario).
- 2026-11-26 · fix/atras-vuelve-a-sesion (0.7.0) · atrás desde otra pestaña vuelve a Sesión (decisión del usuario), capa de fondo y foco en el destino; aprobado; corrige el pendiente que lo daba por hecho.
- 2026-11-26 · feature/libreta-mira (0.8.0) · libreta de marcas de mira en el ⋮ de Registro y en Ajustes; aprobado con cambios tras corregir la posición del diálogo y el clic y la repetición de −/+.
