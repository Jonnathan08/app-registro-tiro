# App de registro de tiro

PWA Svelte 5 + TypeScript para registrar sesiones de tiro con arco. Ver README para funciones, estructura y comandos.

## Trabajo con expertos

Dos subagentes expertos (`.claude/agents/`) planifican y revisan cada cambio. Claude es el implementador: escribe el código; los expertos solo leen, planifican y dictaminan.

| Agente                | Cubre                                                                         | Contexto                           |
| --------------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| `experto-ux`          | Material 3, accesibilidad, ergonomía móvil, textos, consistencia              | `.claude/contexto/ux.md`           |
| `experto-programador` | organización, calidad, formato, seguridad, datos, pruebas, rendimiento y docs | `.claude/contexto/programacion.md` |

### Flujo

1. **Propuesta.** Se describe el cambio: qué se pide y por qué.
2. **Qué expertos entran.** El implementador lo decide y lo dice en una línea (el usuario puede corregirlo):
   - Toca la interfaz (pantallas, componentes, estilos, textos) → los dos.
   - Solo lógica, datos, configuración, dependencias o CI → `experto-programador`.
   - Trivial (un texto, un comentario, una errata) → ninguno; basta con la verificación. Se salta al paso 6.
3. **Plan.** Cada experto que entra recibe la propuesta en **modo plan** (en paralelo si son dos) y devuelve su plan. Si los planes chocan entre sí o con una decisión del usuario, el implementador se detiene y pregunta al usuario; no elige solo.
4. **Implementación** en una rama `feature/…` o `fix/…`, siguiendo los planes. Si algo del plan no se puede o no conviene seguir, se anota el motivo para el resumen.
5. **Revisión** en **modo revisión** del diff contra `main`, por los mismos expertos que planificaron (en paralelo). Si se puede, se continúa el mismo agente del paso 3 (SendMessage); si no, se le pasa su plan. Es un ciclo:
   - Hasta que cada experto dé «aprobado» o «aprobado con cambios» sin bloqueantes.
   - Las correcciones se vuelven a revisar por quien las pidió y, si cambian código, **siempre** también por `experto-programador`.
   - Las sugerencias se aplican o se descartan con motivo.
6. **Resumen y alto.** Se aplican a los contextos las «Actualizar contexto» que sean ciertas y se añade una línea a su historial de revisiones, en la misma rama. Luego se presenta al usuario el resumen: qué se hizo, dictamen final de cada experto, qué se corrigió, qué se descartó y por qué, y el resultado de la verificación. **No se integra en `main` hasta que el usuario lo apruebe.**

Las decisiones del usuario mandan sobre las opiniones de los expertos: si un experto contradice algo validado por el usuario, se le señala y no se aplica. Si el cambio altera una decisión, la arquitectura o una convención, el contexto correspondiente se actualiza aunque el experto no lo pida.

## Verificación

```
. ~/.nvm/nvm.sh && nvm use
npm ci && npm audit --audit-level=high && npm run lint && npm test && npm run check && npm run build
```
