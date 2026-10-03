# App de registro de tiro (PWA)

App web instalable para registrar sesiones de tiro con arco recurvo. Funciona sin conexión y guarda todo en el teléfono.

**Usar:** https://jonnathan08.github.io/app-registro-tiro/ → menú del navegador → *Instalar app*.

## Qué hace
- Perfiles de sesión: **Control** (12 rondas × 6 flechas) y **Abierto** (rondas y flechas a elección).
- Distancia de tiro y diana de 122, 80 o 40 cm.
- Registro flecha a flecha tocando la diana (con lupa y regla de la línea) o con teclado manual.
- Hoja de puntuación, total, X, 10+X, promedio y centro del grupo.
- Edición de rondas ya guardadas durante la sesión en curso (lápiz en la hoja): corregir el valor con el teclado (conserva la posición) o volver a marcar en la diana.
- Notas personales y notas del entrenador.
- Exportación a CSV completo con el menú de compartir del teléfono (Drive, correo…). Nombre: `tiro_<fecha>_<distancia>m_<id>.csv`.

## Seguridad
- Sin analítica, sin servidores, sin fuentes ni scripts externos: la CSP solo permite recursos del propio origen.
- Los datos viven en IndexedDB del teléfono; solo salen si los compartes tú.
- Dependencias con versión fija y `ignore-scripts` en `.npmrc` (ningún paquete ejecuta código al instalarse).
- Acciones de GitHub fijadas por hash de commit.
- CI (GitHub Actions): cada pull request a `main` corre `npm audit`, pruebas, chequeo de tipos y compilación; al integrar en `main` se publica en GitHub Pages.

## Desarrollo
Requiere Node 24 (`nvm use 24`).

```
npm ci            # instala dependencias exactas
npm run dev       # servidor de desarrollo
npm test          # pruebas de puntuación y exportación
npm run check     # chequeo de tipos
npm run build     # compila a dist/
```

## Formato del CSV
Una fila por flecha; los datos de la sesión y las notas se repiten en cada fila (RFC 4180, UTF-8).

| Columna | Significado |
|---|---|
| `sesion_id`, `fecha`, `perfil`, `distancia_m`, `diana_cm` | Datos de la sesión (`perfil`: control/abierto) |
| `rondas`, `flechas_por_ronda`, `total_sesion` | Formato y total |
| `ronda`, `flecha` | Posición en la hoja (desde 1) |
| `valor`, `puntaje`, `es_x` | `X`/`10`…`1`/`M`; puntaje numérico (M = 0) |
| `x_mm`, `y_mm` | Impacto en mm desde el centro, x a la derecha, y hacia arriba; vacío si se ingresó a mano |
| `corregida` | 1 si el valor se corrigió a mano después de marcarla |
| `notas_personales`, `notas_entrenador` | Notas de la sesión |

Se usa CSV porque los navegadores basados en Chromium (Chrome, Brave) no permiten compartir archivos `.json`.

## Flujo de trabajo
1. Crear una rama desde `main`: `feature/<nombre>` o `fix/<nombre>`.
2. Hacer commits y subir la rama.
3. Abrir un pull request a `main`; esperar a que pase la verificación.
4. Integrar (merge) el PR; GitHub Actions publica la nueva versión.
