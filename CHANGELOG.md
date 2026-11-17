# Cambios

## 0.4.2 — 2026-11-17

- Corrección: con una ronda de muchas flechas en la Hoja (Libre), la página se ensanchaba; los diálogos salían desplazados y cortados y la navegación inferior desaparecía.

## 0.4.1 — 2026-11-17

- Rondas completas: «Terminar y guardar» e «Ir a las notas» van uno sobre otro a todo el ancho; antes «Terminar y guardar» se salía de la tarjeta y su ícono se aplastaba. Ningún botón encoge ya su ícono.
- Resumen de la Hoja y tablero del Detalle: el rótulo es «Total» y las flechas van debajo de la cifra («9 flechas»); antes se cortaban.

## 0.4.0 — 2026-11-17

- Nuevo estilo **Marcador deportivo** en toda la app: franja oscura arriba con las cifras grandes en Barlow Condensed (incluida en la app, sin fuentes externas), rótulos en mayúsculas, botones y casillas cuadrados con borde grueso y el amarillo de la diana como acento. La barra de estado del teléfono toma el color de la franja.
- Anotar: el tablero muestra la ronda, los puntos de esta ronda y el total de las rondas guardadas; las pestañas van en la franja. Las flechas, en casillas cuadradas (el hueco siguiente resaltado); la diana ocupa todo el ancho que permite la pantalla sin desplazar; teclado de 3 × 4 teclas de hasta 76 px. El resumen de la pestaña Hoja cuenta solo las rondas guardadas, como «Sesión» en el tablero.
- Nueva sesión: el tablero muestra el formato, las flechas y el máximo mientras eliges; aviso si la distancia no es válida; «Empezar sesión» siempre a la vista.
- Historial: el progreso pasa a la franja (promedio de la última sesión, diferencia con la anterior y tendencia de las últimas 12 sesiones por distancia, con selector de distancia). Lista con el total destacado.
- Detalle: ◀ ▶ para recorrer las rondas en la diana; puntos por ronda en barras, con la ronda elegida en amarillo y resaltada en la hoja.
- Ajustes: la franja muestra cuántas sesiones y flechas hay guardadas.
- La M (fallo) tiene un color propio, igual en tema claro y oscuro.

## 0.3.1 — 2026-11-13

- Anotar: la ronda actual va en un panel con la suma destacada a la derecha; la flecha nueva aparece con una animación breve.
- Corrección: al cambiar de pestaña se marcaba también la otra.

## 0.3.0 — 2026-11-12

- Anotar: la ronda actual pasa a una tira compacta y Deshacer / Guardar ronda a una barra fija de botones de 56 px sobre la navegación; la diana completa se ve sin desplazar en un teléfono de 390×844.
- El cambio entre diana y teclado es un ícono en la barra superior; título «Ronda 3/6» y pestañas **Anotar** y **Hoja**.
- La ayuda de la diana se muestra sola durante las primeras 12 flechas y después con el botón ⓘ.
- Aviso «Ronda 3 guardada · 54 pts» con **Deshacer**, que devuelve la ronda a la ronda en curso.
- Botón atrás de Android: cierra menú, diálogos, editor de ronda y detalle antes de salir de la app.
- Diana: el centro del grupo y la flecha seleccionada se dibujan en blanco con borde oscuro, visibles sobre cualquier anillo.
- Historial: separadores por mes, distancia como etiqueta y progreso plegable con tendencia. Al volver de una sesión, la lista sigue donde estaba.
- Detalle: compartir pasa a un ícono en la barra superior.
- Colores: lo seleccionado en azul petróleo medio (contenedor primario); resumen, totales e insignia en azul petróleo oscuro; números sobre rojo en negrita; anillo blanco con borde más oscuro; Deshacer con contorno.
- Tarjetas con esquina de 16 px y teclado de 64 px.
- Corrección: el indicador de la pestaña seleccionada no se veía.

## 0.2.0 — 2026-11-12

- Importar sesiones desde el CSV exportado (Ajustes), sin duplicar las que ya están.
- Si el almacenamiento del navegador falla: pantalla de error con «Reintentar» al abrir y aviso al guardar o borrar; una sesión que no se pudo guardar no pasa al historial.
- Las notas pendientes se guardan al pasar la app a segundo plano.
- Configuración y ajustes guardados validados al leerlos; migración de datos preparada para futuros cambios de formato.
- El menú de la sesión se cierra al tocar fuera o con Escape.
- Código: componentes Barra y Teclado, formatos compartidos, Prettier y ESLint en el CI, más pruebas (estado e importación).
- Dependencias al día (vite-plugin-pwa 2, svelte 5.57.3…) y Node 24 fijado con `.nvmrc`.

## 0.1.0 — piloto (octubre de 2026)

- Perfiles Control, Abierto y Libre; distancia y diana de 122, 80 o 40 cm.
- Registro en la diana (lupa fija, zoom con dos dedos, regla de la línea) o con teclado.
- Edición de rondas guardadas, notas personales y del entrenador, exportación CSV.
- Historial con gráficos de progreso y de puntos por ronda; ronda resaltada en la diana.
- Animación de entrada desde la pantalla de inicio de Android.
