# Contexto UX — app de registro de tiro

Memoria del agente `experto-ux`. Se actualiza en la misma rama que el cambio que la vuelve falsa.
Última revisión: 2026-11-13 (versión 0.3.1).

## Usuario y uso

- Un arquero de recurvo olímpico (el dueño de la app) y, en ocasiones, su entrenador.
- Teléfono: **Pixel 8** con **Brave**, app instalada como PWA (pantalla completa, solo vertical).
- Se usa en el campo de tiro: a pleno sol, de pie, entre rondas, con una mano y a veces con dactilera. La tarea crítica es **anotar las flechas de la ronda rápido y sin errores**; todo lo demás es secundario.
- Distancias habituales 18/30/50/60/70 m; objetivo 70 m.

## Sistema visual

- **Material 3** hecho a mano, sin librería de componentes.
- `src/estilos/tema.css`: tokens `--md-sys-color-*` exportados de Material Theme Builder (semilla azul petróleo, primary #156683). Generado: no se edita a mano.
- Variantes por clase en `<html>` (las pone `src/lib/tema.ts`): `light|dark` + `''|-medium-contrast|-high-contrast`. **Por defecto: contraste medio**, modo según el sistema.
- Selección (`.seg`, `.chip`, pastilla de navegación, fila `.activa` de la hoja) en **primary-container / on-primary-container**; resumen, totales del historial e insignia de la pestaña Hoja en **primary / on-primary**. Tarjetas, hoja, marco de la diana y progreso con radio `--shape-l` (16 px).
- `src/estilos/base.css`: forma (`--shape-xs…full`), tipografía (`t-display`, `t-headline`, `t-title-l`, `t-title-m`, `t-label`, `t-body-s`), capa de estado (`.estado`), botones (`.btn` + `lleno|tonal|contorno|texto|peligro`, `.icbtn` 48×48), segmentado (`.seg`), `.chip`, `.campo`, `.grupo`, `.tarjeta`, hoja de puntuación (`.hoja`), `.num` (cifras tabulares).
- Colores de la diana World Archery fijos (`--diana-*`, clases `z-oro|rojo|azul|negro|blanco|fuera`): no dependen del tema.
- Íconos: Material Symbols copiados como trazos en `Icono.svelte` (sin fuentes externas).
- Fuente: Roboto/sistema. Foco: contorno de 3 px en `primary`.

## Navegación y pantallas

Barra inferior fija con 3 destinos: **Sesión**, **Historial**, **Ajustes**. Cada pantalla usa `Barra.svelte` arriba.

- **Configurar** (Sesión sin sesión activa): perfil, distancia (con atajos de distancias habituales y su diana), diana 122/80/40 cm, rondas y flechas (solo Abierto).
- **Registro** (sesión activa): título «Ronda n/N» («/N» atenuado, leído « de N»). Dos pestañas, **Anotar** y **Hoja** (resumen, hoja, notas, «Terminar sesión»; la insignia cuenta las rondas guardadas); también se cambia deslizando. En Anotar: tira de la ronda actual en un panel `surface-container` (`--shape-l`), con fichas de 40 px como máximo (16 px/600) y la suma en un compartimento `primary-container` de 72 px pegado a la derecha (26 px/700 y «PTS»; se lee «Suma: N puntos»); la flecha recién anotada entra con un «pop» de 320 ms (en Libre, una fila desplazable anclada a la última flecha), diana o teclado (teclas de 64 px) y una **barra fija Deshacer (contorno) / Guardar ronda** de 56 px sobre la navegación. En la barra superior, un solo botón alterna teclado/diana y ⓘ muestra la ayuda de la diana (visible sola durante las primeras 12 flechas). Menú ⋮ con «Terminar sesión ahora» y «Descartar sesión». En 390×844 la diana entra sin desplazar.
- **Historial**: tarjeta de **Progreso** plegable (plegada: último promedio, ▲ en primary / ▼ en gris frente a la sesión anterior, tendencia de las últimas 12; nunca rojo/verde; desplegada: segmentado de distancia y gráfico) y lista agrupada por mes con la distancia como etiqueta.
- **Detalle**: compartir CSV como ícono en la barra superior; sesión terminada, gráfico de puntos por ronda, ronda elegida resaltada en la diana, notas en solo lectura.
- **Ajustes**: modo, contraste, exportar/importar CSV, versión.
- `Entrada.svelte`: animación de arranque (ver decisiones).

## Decisiones validadas por el usuario (no reabrir)

- Le gustan los colores del tema; contraste **medio** por defecto.
- Perfiles **Control** (12×6 fijo), **Abierto** (configurable) y **Libre** (solo distancia y diana; rondas libres hasta terminar, tope 24 flechas por ronda).
- Notas en **dos campos**: personales y del entrenador; se bloquean al terminar la sesión.
- Marcado en la diana: **lupa cuadrada fija arriba a la izquierda** que salta a la derecha si el dedo pasa por debajo; zoom con dos dedos; regla de la línea.
- Corrección de una ronda guardada: con el teclado (descarta la posición) o volviendo a marcar en la diana.
- Animación de entrada: arranca igual que la pantalla de inicio de Android con el ícono maskable, pasa a gris, dos flechas fallan, la tercera acierta y vuelven los colores. Sus constantes están medidas en el Pixel 8; no cambiarlas sin medir de nuevo.
- Tira de la ronda en «caja tonal» (variante A) con animación pop de la última flecha: conservarla.
- El ícono maskable lleva versión en el nombre (`icono-512-mask-v2`): Brave lo guarda en caché, así que cambiarlo implica un nombre nuevo (v3…).

## Criterios ya aplicados

- Objetivos táctiles de 48 px mínimo (`.icbtn`); filas de la hoja tocables enteras con un botón en la primera celda para teclado y lector de pantalla.
- Menús se cierran al tocar fuera, con Escape o con atrás, y devuelven el foco al ⋮ (también los diálogos abiertos desde el menú, con `devolverFoco`).
- **Atrás de Android** (`src/lib/atras.ts`): cada capa (menú, diálogo, editor, Detalle) registra `capa()` en un `$effect`; una sola entrada de historial; sin capas, atrás sale de la app. Toda capa nueva debe usarlo.
- Avisos (`Aviso.svelte`) tipo snackbar. Con acción («Deshacer» tras guardar una ronda): 5 s, pausa con foco o dedo encima, botón de 48 px fuera de la región viva, solo el botón recibe toques, se retira al marcar una flecha nueva y sube sobre la barra fija.
- Abreviaturas visuales con texto oculto (`.oculto`): «/6» → « de 6», ▲▼ → sube/baja, fecha completa en las filas del historial.
- `scroll-padding-bottom` con la barra fija de acciones. Al volver de Detalle se restauran el scroll y el foco en la fila.
- Diana: centro del grupo y flecha seleccionada con doble trazo (`--diana-tinta` debajo, blanco encima). Números sobre rojo en 700; anillo blanco con borde 1,5 px #8a8a8a.
- `prefers-reduced-motion` respetado en `Entrada`, `Aviso` y el pop de la tira.
- En la tira, contorno de 1,5 px en `outline` para la M (siempre) y para el negro en tema oscuro (`html[class^='dark']`): si no, se confunden con el panel.
- Capa de estado: `:hover` solo dentro de `@media (hover: hover)` (en táctil se quedaba pegado); el indicador de pestaña va en `::before`, separado de la capa `::after`.

## Pendientes y deuda conocida

- Blanco sobre `--diana-rojo` ≈ 4:1, por debajo de AA en texto pequeño: limitación aceptada (los colores de la diana no se tocan), compensada con peso 700.
- Atrás desde Historial/Ajustes vuelve a Sesión: lo decide el usuario.
- En Libre, la tira desplazable no indica que hay flechas a la izquierda (posible degradado en el borde).

## Historial de revisiones

- 2026-11-12 · feature/rediseno-ux · propuesta e implementación aprobadas con cambios: toda capa se cierra por un solo camino (limpieza del `$effect`) y la pila de atrás evita la carrera back()/pushState; el indicador de pestaña comparte `::after` con `.estado` (fijar posición y opacidad); los diálogos abiertos desde un menú devuelven el foco al ⋮.
- 2026-11-13 · fix/tira-caja-y-pestanas · aprobado con cambios: tira en caja tonal con pop; el destello en la pestaña que se deja venía de compartir `::after` con la capa de estado y del hover pegado en táctil (supera la nota anterior sobre `::after`); corregido.
