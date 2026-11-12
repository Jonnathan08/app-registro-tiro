# Cambios

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
