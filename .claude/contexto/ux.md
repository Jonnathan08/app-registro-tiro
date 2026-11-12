# Contexto UX — app de registro de tiro

Memoria del agente `experto-ux`. Se actualiza en la misma rama que el cambio que la vuelve falsa.
Última revisión: 2026-11-12 (versión 0.2.0).

## Usuario y uso

- Un arquero de recurvo olímpico (el dueño de la app) y, en ocasiones, su entrenador.
- Teléfono: **Pixel 8** con **Brave**, app instalada como PWA (pantalla completa, solo vertical).
- Se usa en el campo de tiro: a pleno sol, de pie, entre rondas, con una mano y a veces con dactilera. La tarea crítica es **anotar las flechas de la ronda rápido y sin errores**; todo lo demás es secundario.
- Distancias habituales 18/30/50/60/70 m; objetivo 70 m.

## Sistema visual

- **Material 3** hecho a mano, sin librería de componentes.
- `src/estilos/tema.css`: tokens `--md-sys-color-*` exportados de Material Theme Builder (semilla azul petróleo, primary #156683). Generado: no se edita a mano.
- Variantes por clase en `<html>` (las pone `src/lib/tema.ts`): `light|dark` + `''|-medium-contrast|-high-contrast`. **Por defecto: contraste medio**, modo según el sistema.
- `src/estilos/base.css`: forma (`--shape-xs…full`), tipografía (`t-display`, `t-headline`, `t-title-l`, `t-title-m`, `t-label`, `t-body-s`), capa de estado (`.estado`), botones (`.btn` + `lleno|tonal|contorno|texto|peligro`, `.icbtn` 48×48), segmentado (`.seg`), `.chip`, `.campo`, `.grupo`, `.tarjeta`, hoja de puntuación (`.hoja`), `.num` (cifras tabulares).
- Colores de la diana World Archery fijos (`--diana-*`, clases `z-oro|rojo|azul|negro|blanco|fuera`): no dependen del tema.
- Íconos: Material Symbols copiados como trazos en `Icono.svelte` (sin fuentes externas).
- Fuente: Roboto/sistema. Foco: contorno de 3 px en `primary`.

## Navegación y pantallas

Barra inferior fija con 3 destinos: **Sesión**, **Historial**, **Ajustes**. Cada pantalla usa `Barra.svelte` arriba.

- **Configurar** (Sesión sin sesión activa): perfil, distancia (con atajos de distancias habituales y su diana), diana 122/80/40 cm, rondas y flechas (solo Abierto).
- **Registro** (sesión activa): dos pestañas, **Ronda** (anotar) y **Sesión** (resumen, hoja, notas, botón «Terminar sesión» al final); también se cambia deslizando. En Ronda: ronda actual arriba y selector **Diana / Manual**. Menú ⋮ con terminar/descartar; su diálogo de terminar solo tiene Cancelar/Terminar.
- **Historial**: gráfico de progreso (promedio por flecha) por distancia y lista de sesiones.
- **Detalle**: sesión terminada, gráfico de puntos por ronda, ronda elegida resaltada en la diana, notas en solo lectura.
- **Ajustes**: modo, contraste, exportar/importar CSV, versión.
- `Entrada.svelte`: animación de arranque (ver decisiones).

## Decisiones validadas por el usuario (no reabrir)

- Le gustan los colores del tema; contraste **medio** por defecto.
- Perfiles **Control** (12×6 fijo), **Abierto** (configurable) y **Libre** (solo distancia y diana; rondas libres hasta terminar, tope 24 flechas por ronda).
- Notas en **dos campos**: personales y del entrenador; se bloquean al terminar la sesión.
- Marcado en la diana: **lupa cuadrada fija arriba a la izquierda** que salta a la derecha si el dedo pasa por debajo; zoom con dos dedos; regla de la línea.
- Corrección de una ronda guardada: con el teclado (descarta la posición) o volviendo a marcar en la diana.
- Animación de entrada: arranca igual que la pantalla de inicio de Android con el ícono maskable, pasa a gris, dos flechas fallan, la tercera acierta y vuelven los colores. Sus constantes están medidas en el Pixel 8; no cambiarlas sin medir de nuevo.
- El ícono maskable lleva versión en el nombre (`icono-512-mask-v2`): Brave lo guarda en caché, así que cambiarlo implica un nombre nuevo (v3…).

## Criterios ya aplicados

- Objetivos táctiles de 48 px mínimo (`.icbtn`); filas de la hoja tocables enteras con un botón en la primera celda para teclado y lector de pantalla.
- Menús se cierran al tocar fuera o con Escape.
- Avisos (`Aviso.svelte`) tipo snackbar para confirmar acciones y errores de guardado.
- `prefers-reduced-motion` respetado en `Entrada` y `Aviso`.

## Pendientes y deuda conocida

- (vacío)

## Historial de revisiones

- (cada revisión añade aquí una línea: fecha, rama, dictamen y lo aprendido)
