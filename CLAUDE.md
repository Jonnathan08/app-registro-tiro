# App de registro de tiro

PWA Svelte 5 + TypeScript para registrar sesiones de tiro con arco. Ver README para funciones, estructura y comandos.

## Revisión por expertos

Cada cambio pasa por dos subagentes revisores (`.claude/agents/`). Claude implementa; ellos solo leen y dictaminan.

| Agente                | Revisa                                                                        | Contexto                           |
| --------------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| `experto-ux`          | Material 3, accesibilidad, ergonomía móvil, textos, consistencia              | `.claude/contexto/ux.md`           |
| `experto-programador` | organización, calidad, formato, seguridad, datos, pruebas, rendimiento y docs | `.claude/contexto/programacion.md` |

### Flujo

1. **Propuesta.** Si el cambio toca la interfaz (pantallas, componentes, estilos, textos), describir la propuesta y pedir dictamen a `experto-ux` **antes** de programar.
2. **Implementación** en una rama `feature/…` o `fix/…`.
3. **Revisión** del diff contra `main`: lanzar los agentes que correspondan **en paralelo**. Pasarles qué se cambió y por qué, y si la verificación ya se corrió.
   - Toca interfaz → los dos.
   - Solo lógica, configuración, dependencias o CI → solo `experto-programador`.
   - Trivial (un texto, un comentario, una errata) → sin revisión; basta con la verificación.
4. **Corrección** de todos los bloqueantes y nueva revisión del agente que los marcó. Las sugerencias se aplican o se descartan con motivo.
5. **Resumen al usuario** antes del merge: dictamen de cada agente, qué se corrigió y qué se dejó pendiente.
6. **Contextos al día**: aplicar las «Actualizar contexto» de los dictámenes que sean ciertas y añadir una línea al historial de revisiones del contexto, en la misma rama. Si el cambio altera una decisión, la arquitectura o una convención, actualizar el contexto aunque el agente no lo pida.

Las decisiones del usuario mandan sobre las opiniones de los agentes: si un agente contradice algo validado por el usuario, se le señala y no se aplica.

## Verificación

```
. ~/.nvm/nvm.sh && nvm use
npm ci && npm audit --audit-level=high && npm run lint && npm test && npm run check && npm run build
```
