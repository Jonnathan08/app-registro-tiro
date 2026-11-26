# App de registro de tiro (PWA)

App web instalable para registrar sesiones de tiro con arco recurvo. Funciona sin conexión y guarda todo en el teléfono.

**Usar:** https://jonnathan08.github.io/app-registro-tiro/ → menú del navegador → _Instalar app_.

## Qué hace

- Perfiles de sesión: **Control** (12 rondas × 6 flechas), **Abierto** (rondas y flechas a elección) y **Libre** (sin formato: rondas de cualquier tamaño hasta terminar la sesión).
- Distancia de tiro y diana de 122, 80 o 40 cm.
- Estilo «marcador deportivo»: una franja oscura arriba con las cifras clave (ronda, puntos de la ronda en curso, total), legible a pleno sol.
- Registro flecha a flecha tocando la diana (con lupa y regla de la línea) o con teclado manual; se cambia con el ícono de la barra superior. Deshacer y Guardar ronda quedan fijos sobre la navegación, y la diana se ve entera sin desplazar.
- Al guardar una ronda, el aviso ofrece **Deshacer** para devolverla a la ronda en curso y corregirla.
- Hoja de puntuación, total, X, 10+X, promedio y centro del grupo. La sesión en curso tiene dos pestañas: **Anotar** y **Hoja** (hoja y notas).
- El botón atrás de Android cierra primero el menú, los diálogos, el editor de ronda o el detalle de una sesión; desde Historial, Estadísticas o Ajustes vuelve a Sesión, y solo sale de la app desde Sesión.
- Zoom con dos dedos sobre la diana y lupa fija en una esquina para afinar el impacto.
- Edición de rondas ya guardadas durante la sesión en curso (lápiz en la hoja): corregir el valor con el teclado (descarta la posición) o volver a marcar en la diana (reemplaza posición y valor).
- Notas personales y notas del entrenador; quedan bloqueadas al terminar la sesión.
- Historial agrupado por mes, con el progreso en la franja de arriba (último promedio, diferencia con la sesión anterior y tendencia de las últimas 12 sesiones, por distancia); en cada sesión, puntos por ronda en barras y la ronda elegida resaltada en la diana (◀ ▶ para recorrerlas).
- Estadísticas, filtradas por periodo (30 días, 90 días, todo) y distancia: sesiones, flechas y promedio por flecha; récords (mejor sesión y mejor ronda por porcentaje del máximo, más X y más 10+X en una sesión); mapa de calor de la agrupación sobre la diana con los colores de la diana (o los impactos, con menos de 30 flechas marcadas); puntos por zona; y flechas por semana de las últimas 12 semanas.
- Ajustes muestra cuántas sesiones y flechas hay guardadas.
- Color de la app a elegir en Ajustes: Petróleo (predeterminado), Bosque, Violeta o Grafito, en claro u oscuro y con tres niveles de contraste. Los colores de la diana no cambian.
- Exportación a CSV completo con el menú de compartir del teléfono (Drive, correo…). Nombre: `tiro_<fecha>_<distancia>m_<id>.csv`.
- Importación del mismo CSV en Ajustes, para recuperar el historial en otro teléfono; las sesiones que ya están no se duplican.

## Seguridad

- Sin analítica, sin servidores, sin fuentes ni scripts externos: la CSP solo permite recursos del propio origen. La fuente Barlow Condensed (OFL) va incluida en la app desde `@fontsource/barlow-condensed` (solo latin, pesos 600 y 700) y el service worker la guarda para usarla sin conexión.
- Los datos viven en IndexedDB del teléfono; solo salen si los compartes tú.
- Dependencias con versión fija y `ignore-scripts` en `.npmrc` (ningún paquete ejecuta código al instalarse).
- Acciones de GitHub fijadas por hash de commit.
- CI (GitHub Actions): cada pull request a `main` corre `npm audit` (bloquea si hay vulnerabilidades altas en lo que llega al teléfono o críticas en cualquier dependencia; las altas de herramientas de desarrollo quedan como aviso), formato y lint, pruebas, chequeo de tipos y compilación; al integrar en `main` se publica en GitHub Pages.
- `npm audit --omit=dev` (lo que llega al teléfono) da 0 vulnerabilidades. Las altas vienen de herramientas de compilación por `picomatch` (GHSA-fc5q-39xc-vjpf), todavía sin versión corregida; hay que actualizarlo en cuanto salga.

## Desarrollo

Requiere Node 24 (`nvm use`, lee `.nvmrc`).

```
npm ci            # instala dependencias exactas
npm run dev       # servidor de desarrollo
npm test          # pruebas (puntuación, modelo, progreso, estado, botón atrás, ayuda, exportación e importación,
                  #   ajustes de tema y contraste de cada paleta, estadísticas y mapa de calor)
npm run check     # chequeo de tipos
npm run lint      # formato (Prettier) y lint (ESLint)
npm run format    # aplica el formato de Prettier
npm run build     # compila a dist/
npm run paletas   # regenera src/estilos/paletas.css (solo al cambiar una semilla o añadir una paleta)
```

### Estructura

```
src/
  main.ts, App.svelte   arranque, navegación inferior y pantalla de error de almacenamiento
  pantallas/            una por destino: Configurar, Registro, Historial, Detalle, Estadisticas, Ajustes
  componentes/          piezas reutilizables (Barra y Marcador: la franja oscura; Diana, Teclado, Hoja, Grafico, Dialogo…)
  lib/                  lógica sin interfaz, con pruebas *.test.ts al lado
    modelo.ts           tipos de datos, perfiles, validación, migración y cálculos
    progreso.ts         progreso del historial: grupos por distancia, diferencia y tendencia
    estadisticas.ts     filtros, totales, récords, puntos por zona y flechas por semana
    calor.ts            mapa de calor: posiciones por radio de diana, densidad, escala de color y descripción
    diana.ts            geometría y puntuación de las dianas World Archery
    estado.svelte.ts    estado de la app y acciones (guarda en almacen.ts)
    almacen.ts          IndexedDB
    exportar.ts / importar.ts   CSV de ida y vuelta
    formato.ts, tema.ts formatos de número/fecha; tema: modo, contraste y paleta
  estilos/              tema.css (Petróleo, generado por Material Theme Builder), paletas.css (las otras paletas,
                        generado), base.css (tokens del tablero y componentes) y fuentes.css
scripts/
  generar-paletas.mjs   genera paletas.css con @material/material-color-utilities; antes comprueba que
                        reproduce tema.css con la semilla de Petróleo (±1 por canal) y, si no, no escribe nada
```

Cambios en el formato de los datos guardados: subir `VERSION_DATOS` en `modelo.ts` y añadir el paso en `migrar()`.

## Formato del CSV

Una fila por flecha; los datos de la sesión y las notas se repiten en cada fila (RFC 4180, UTF-8).

| Columna                                                   | Significado                                                                                                |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `sesion_id`, `fecha`, `perfil`, `distancia_m`, `diana_cm` | Datos de la sesión (`perfil`: control/abierto/libre)                                                       |
| `rondas`, `flechas_por_ronda`, `total_sesion`             | Formato y total (en Libre: rondas tiradas y `flechas_por_ronda` vacío)                                     |
| `ronda`, `flecha`                                         | Posición en la hoja (desde 1)                                                                              |
| `valor`, `puntaje`, `es_x`                                | `X`/`10`…`1`/`M`; puntaje numérico (M = 0)                                                                 |
| `x_mm`, `y_mm`                                            | Impacto en mm desde el centro, x a la derecha, y hacia arriba; vacío si se ingresó a mano                  |
| `corregida`                                               | 1 si el valor se corrigió con el teclado después de registrarla; en ese caso `x_mm` y `y_mm` quedan vacíos |
| `notas_personales`, `notas_entrenador`                    | Notas de la sesión                                                                                         |

Se usa CSV porque los navegadores basados en Chromium (Chrome, Brave) no permiten compartir archivos `.json`.

## Flujo de trabajo

1. Crear una rama desde `main`: `feature/<nombre>` o `fix/<nombre>`.
2. Hacer commits y subir la rama.
3. Abrir un pull request a `main`; esperar a que pase la verificación.
4. Integrar (merge) el PR; GitHub Actions publica la nueva versión.
5. En cada versión publicada, subir `version` en `package.json` (se muestra en Ajustes) y anotarla en `CHANGELOG.md`.
