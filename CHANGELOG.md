# Cambios

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
