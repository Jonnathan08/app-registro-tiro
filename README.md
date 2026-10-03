# App de registro de tiro (PWA)

App web instalable para registrar sesiones de tiro con arco recurvo. Funciona sin conexión y guarda todo en el teléfono.

**Usar:** https://jonnathan08.github.io/app-registro-tiro/ → menú del navegador → *Instalar app*.

## Qué hace
- Perfiles de sesión: **Control** (12 rondas × 6 flechas) y **Abierto** (rondas y flechas a elección).
- Distancia de tiro y diana de 122, 80 o 40 cm.
- Registro flecha a flecha tocando la diana (con lupa y regla de la línea) o con teclado manual.
- Hoja de puntuación, total, X, 10+X, promedio y centro del grupo.
- Notas personales y notas del entrenador.
- Exportación a JSON (completo) o CSV (una fila por flecha) con el menú de compartir del teléfono.

## Seguridad
- Sin analítica, sin servidores, sin fuentes ni scripts externos: la CSP solo permite recursos del propio origen.
- Los datos viven en IndexedDB del teléfono; solo salen si los compartes tú.
- Dependencias con versión fija y `ignore-scripts` en `.npmrc` (ningún paquete ejecuta código al instalarse).
- Acciones de GitHub fijadas por hash de commit.
- El build de CI corre `npm audit`, pruebas y chequeo de tipos antes de publicar.

## Desarrollo
Requiere Node 24 (`nvm use 24`).

```
npm ci            # instala dependencias exactas
npm run dev       # servidor de desarrollo
npm test          # pruebas de puntuación y exportación
npm run check     # chequeo de tipos
npm run build     # compila a dist/
```

## Formato de datos
Coordenadas en mm desde el centro de la diana, x hacia la derecha, y hacia arriba. `puntaje` 0 = M. Ver `src/lib/modelo.ts`.
