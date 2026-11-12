<script lang="ts">
  import type { Snippet } from 'svelte';

  // Barra superior de cada pantalla: título, subtítulo opcional y botones a los lados
  let { titulo, subtitulo, fija = false, inicio, fin }: {
    titulo: string;
    subtitulo?: string;
    /** Queda pegada arriba al desplazar. */
    fija?: boolean;
    /** Botón a la izquierda (p. ej. volver). */
    inicio?: Snippet;
    /** Botones a la derecha (p. ej. menú). */
    fin?: Snippet;
  } = $props();
</script>

<header class="barra" class:fija class:con-inicio={!!inicio} class:con-fin={!!fin}>
  {@render inicio?.()}
  <div class="titulo">
    <h1 class="t-title-l">{titulo}</h1>
    {#if subtitulo}<small class="num">{subtitulo}</small>{/if}
  </div>
  {@render fin?.()}
</header>

<style>
  .barra { height: 64px; display: flex; align-items: center; gap: 4px; padding: 0 16px; }
  .con-inicio { padding-left: 4px; }
  .con-fin { padding-right: 4px; }
  .fija { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--md-sys-color-surface); }
  .titulo { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  h1 { margin: 0; }
  small { font-size: 12px; line-height: 16px; letter-spacing: .4px; color: var(--md-sys-color-on-surface-variant); }
</style>
