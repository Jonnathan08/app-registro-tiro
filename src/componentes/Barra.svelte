<script lang="ts">
  import type { Snippet } from 'svelte';

  // Barra superior de cada pantalla, sobre el fondo del tablero: título, subtítulo opcional y botones a los lados
  let {
    titulo,
    sufijo,
    sufijoLeido,
    subtitulo,
    variante = 'pantalla',
    fija = false,
    inicio,
    fin,
    children,
  }: {
    titulo: string;
    /** Continuación del título en el color de los rótulos (p. ej. «/6»). */
    sufijo?: string;
    /** Cómo lo lee el lector de pantalla (p. ej. « de 6»), si difiere de lo que se ve. */
    sufijoLeido?: string;
    subtitulo?: string;
    /** «pantalla»: título grande (Historial, Ajustes…). «contexto»: una línea con los datos de la sesión. */
    variante?: 'pantalla' | 'contexto';
    /** Queda pegada arriba al desplazar. */
    fija?: boolean;
    /** Botón a la izquierda (p. ej. volver). */
    inicio?: Snippet;
    /** Botones a la derecha (p. ej. menú). */
    fin?: Snippet;
    /** Contenido del título en lugar del texto (cuando una parte solo es para el lector de pantalla). */
    children?: Snippet;
  } = $props();
</script>

<header class="barra tablero {variante}" class:fija class:con-inicio={!!inicio} class:con-fin={!!fin}>
  {@render inicio?.()}
  <div class="titulo">
    <h1 class={variante === 'contexto' ? 't-contexto' : subtitulo ? 't-titulo-tablero chico' : 't-titulo-tablero'}>
      {#if children}{@render children()}{:else}{titulo}{/if}{#if sufijo}<span
          class="sufijo num"
          aria-hidden={sufijoLeido ? 'true' : undefined}>{sufijo}</span
        >{#if sufijoLeido}<span class="oculto">{sufijoLeido}</span>{/if}{/if}
    </h1>
    {#if subtitulo}<small class="num">{subtitulo}</small>{/if}
  </div>
  {@render fin?.()}
</header>

<style>
  .barra {
    min-height: 56px;
    padding: env(safe-area-inset-top, 0px) 16px 0;
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--tablero-fondo);
    color: var(--tablero-texto);
  }
  .contexto {
    min-height: 52px;
  }
  .con-inicio {
    padding-left: 4px;
  }
  .con-fin {
    padding-right: 4px;
  }
  .fija {
    position: sticky;
    top: 0;
    z-index: 5;
  }
  .titulo {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  h1 {
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chico {
    font-size: 20px;
    line-height: 24px;
  }
  .sufijo {
    color: var(--tablero-rotulo);
  }
  small {
    font-size: 13px;
    line-height: 18px;
    color: var(--tablero-tenue);
  }
</style>
