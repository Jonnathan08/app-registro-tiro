<script lang="ts">
  // Gráfico de barras de una sola serie. Tocar una barra la selecciona (y otra vez la deselecciona).
  let {
    valores,
    etiquetaX,
    nombrePunto,
    formato = (v: number) => String(v),
    seleccionado = null,
    alElegir,
    descripcion,
    maxValores = 12,
  }: {
    valores: number[];
    /** Texto bajo la barra i. */
    etiquetaX: (i: number) => string;
    /** Nombre de la barra i para el lector de pantalla. */
    nombrePunto: (i: number) => string;
    formato?: (v: number) => string;
    seleccionado?: number | null;
    alElegir?: (i: number | null) => void;
    descripcion: string;
    /** Con más barras que estas, solo se rotula la elegida (los valores se solaparían). */
    maxValores?: number;
  } = $props();

  // Escala sin empezar en cero (interesa la variación), con una altura mínima visible
  const escala = $derived.by(() => {
    if (!valores.length) return { lo: 0, hi: 1 };
    const min = Math.min(...valores),
      max = Math.max(...valores);
    return min === max ? { lo: min - 1, hi: max + 1 } : { lo: min - (max - min) * 0.15, hi: max };
  });
  const altoBarra = (v: number) => Math.round(8 + ((v - escala.lo) / (escala.hi - escala.lo)) * 52);
  const conValores = $derived(valores.length <= maxValores);

  const elegir = (i: number) => alElegir?.(seleccionado === i ? null : i);

  // Si se elige una ronda desde la hoja o con ◀ ▶ y su barra está fuera de la vista, el gráfico se desplaza de lado
  // hasta ella (solo de lado: scrollIntoView movería también la página)
  let caja = $state<HTMLElement>();
  $effect(() => {
    const b = seleccionado !== null ? caja?.querySelectorAll<HTMLElement>('.barra')[seleccionado] : undefined;
    if (!caja || !b) return;
    // .grafico es position: relative, así que offsetLeft se mide desde su borde
    const izq = b.offsetLeft,
      der = izq + b.offsetWidth;
    if (izq < caja.scrollLeft) caja.scrollLeft = izq;
    else if (der > caja.scrollLeft + caja.clientWidth) caja.scrollLeft = der - caja.clientWidth;
  });
</script>

<!-- Con muchas rondas, las barras no bajan de 24 px de ancho y el gráfico se desplaza de lado -->
<div class="grafico" bind:this={caja}>
  <div class="barras" role="group" aria-label={descripcion}>
    {#each valores as v, i (i)}
      <button
        type="button"
        class="barra"
        class:activa={i === seleccionado}
        aria-pressed={i === seleccionado}
        aria-label={nombrePunto(i)}
        disabled={!alElegir}
        onclick={() => elegir(i)}
      >
        {#if conValores}<span class="v" aria-hidden="true">{formato(v)}</span>{/if}
        <span class="b" style:height="{altoBarra(v)}px"></span>
        <span class="x" aria-hidden="true">{conValores || i === seleccionado ? etiquetaX(i) : ''}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  /* El margen vertical deja ver el contorno de foco de las barras, que el desplazamiento recortaría */
  .grafico {
    position: relative;
    overflow-x: auto;
    scrollbar-width: thin;
    padding-block: 4px;
  }
  .barras {
    height: 96px;
    display: flex;
    align-items: stretch;
    gap: 4px;
    font-family: var(--font-marcador);
    font-variant-numeric: tabular-nums;
  }
  .barra {
    flex: 1 0 24px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 2px;
  }
  .barra:disabled {
    cursor: default;
  }
  .v {
    font-size: 13px;
    line-height: 16px;
    font-weight: 700;
    white-space: nowrap;
  }
  .b {
    width: 100%;
    border-radius: var(--shape-xs) var(--shape-xs) 0 0;
    background: var(--md-sys-color-primary-container);
  }
  .activa .b {
    background: var(--diana-oro);
    box-shadow: inset 0 0 0 2px var(--md-sys-color-on-surface);
  }
  .x {
    min-height: 16px;
    font-size: 12px;
    line-height: 16px;
    font-weight: 600;
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
  }
</style>
