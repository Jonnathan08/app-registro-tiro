<script lang="ts" module>
  export interface Cifra {
    rotulo: string;
    /** Cómo se lee el rótulo, si es una abreviatura (p. ej. «Prom.» → «Promedio»). */
    rotuloLeido?: string;
    valor: string | number;
    /** Continuación en el color de los rótulos (p. ej. «/12»), oculta al lector si hay sufijoLeido. */
    sufijo?: string;
    sufijoLeido?: string;
    /** Línea pequeña bajo la cifra (p. ej. «9 flechas»); se lee junto al valor. */
    nota?: string;
    /** Lo que lee el lector de pantalla en lugar del valor visible (p. ej. «–» → «sin ronda en curso»). */
    leido?: string;
    /** Cifra en el amarillo de la diana. */
    acento?: boolean;
    /** Ocupa más ancho que las demás. */
    ancha?: boolean;
    /** Tamaño de la cifra: «l» para las secundarias junto a una principal. */
    tamano?: 'xl' | 'l';
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  // Cifras del tablero: pares rótulo-valor sobre la franja oscura de arriba
  let { cifras, etiqueta, children }: { cifras: Cifra[]; etiqueta?: string; children?: Snippet } = $props();

  const columnas = $derived(cifras.map((c) => (c.ancha ? '1.6fr' : '1fr')).join(' '));
</script>

<div class="tablero marcador" role={etiqueta ? 'group' : undefined} aria-label={etiqueta}>
  <dl style:grid-template-columns={columnas} class:con-nota={!!cifras[0]?.nota}>
    {#each cifras as c (c.rotulo)}
      {@const largo = String(c.valor).length >= 4}
      <div class="celda" class:abajo={c.tamano === 'l'}>
        <dt class="t-rotulo">
          {#if c.rotuloLeido}<span aria-hidden="true">{c.rotulo}</span><span class="oculto">{c.rotuloLeido}</span
            >{:else}{c.rotulo}{/if}
        </dt>
        <dd class={c.tamano === 'l' ? 't-cifra-l' : 't-cifra-xl'} class:acento={c.acento} class:largo>
          <span aria-hidden={c.leido ? 'true' : undefined}
            >{c.valor}{#if c.sufijo}<small aria-hidden={c.sufijoLeido ? 'true' : undefined}>{c.sufijo}</small
              >{/if}</span
          >{#if c.leido}<span class="oculto">{c.leido}</span>{:else if c.sufijoLeido}<span class="oculto"
              >{c.sufijoLeido}</span
            >{/if}{#if c.nota}<span class="nota">{c.nota}</span>{/if}
        </dd>
      </div>
    {/each}
  </dl>
  {@render children?.()}
</div>

<style>
  .marcador {
    background: var(--tablero-fondo);
    color: var(--tablero-texto);
    padding: 0 16px 12px;
  }
  dl {
    display: grid;
    margin: 0;
  }
  .celda {
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding-left: 14px;
    border-left: 1px solid var(--tablero-linea);
  }
  .celda:first-child {
    padding-left: 0;
    border-left: 0;
  }
  /* Cifras secundarias: rótulo debajo y alineadas al pie de la principal */
  .celda.abajo {
    flex-direction: column-reverse;
    justify-content: flex-start;
    align-items: center;
    padding-left: 0;
  }
  .celda.abajo dd {
    margin-top: auto;
  }
  dt {
    color: var(--tablero-rotulo);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  dd {
    margin: 0;
    white-space: nowrap;
  }
  dd.largo.t-cifra-xl {
    font-size: 38px;
  }
  .nota {
    display: block;
    font-family: var(--font);
    font-size: 13px;
    line-height: 16px;
    font-weight: 500;
    letter-spacing: 0;
    color: var(--tablero-rotulo);
  }
  /* Con nota bajo la primera cifra, las secundarias se alinean con la cifra y no con la nota */
  .con-nota .celda.abajo {
    padding-bottom: 16px;
  }
  .acento {
    color: var(--tablero-acento);
  }
  small {
    font-size: 0.5em;
    color: var(--tablero-rotulo);
  }
</style>
