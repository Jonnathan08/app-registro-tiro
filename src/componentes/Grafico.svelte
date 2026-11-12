<script lang="ts">
  // Gráfico de línea de una sola serie. Tocar un punto lo selecciona (y otra vez lo deselecciona).
  let {
    valores,
    etiquetaX,
    nombrePunto,
    formato = (v: number) => String(v),
    seleccionado = null,
    alElegir,
    descripcion,
  }: {
    valores: number[];
    /** Texto bajo el eje X para el punto i. */
    etiquetaX: (i: number) => string;
    /** Nombre del punto i para el lector de pantalla. */
    nombrePunto: (i: number) => string;
    formato?: (v: number) => string;
    seleccionado?: number | null;
    alElegir?: (i: number | null) => void;
    descripcion: string;
  } = $props();

  const ALTO = 168;
  const M = { izq: 40, der: 16, arr: 12, aba: 28 };
  let ancho = $state(320);

  // Escala Y con marcas redondas, sin empezar en cero: interesa la variación
  const escala = $derived.by(() => {
    if (!valores.length) return { lo: 0, hi: 1, marcas: [] };
    let min = Math.min(...valores),
      max = Math.max(...valores);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const paso =
      [0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100].find((p) => Math.ceil(max / p) - Math.floor(min / p) <= 4) ??
      100;
    const lo = Math.max(0, Math.floor(min / paso) * paso),
      hi = Math.ceil(max / paso) * paso;
    const marcas: number[] = [];
    for (let t = lo; t <= hi + paso / 2; t += paso) marcas.push(+t.toFixed(2));
    return { lo, hi: hi > lo ? hi : lo + paso, marcas };
  });

  const n = $derived(valores.length);
  const plano = $derived(ancho - M.izq - M.der);
  const x = (i: number) => M.izq + (n > 1 ? (i * plano) / (n - 1) : plano / 2);
  const y = (v: number) => M.arr + (1 - (v - escala.lo) / (escala.hi - escala.lo)) * (ALTO - M.arr - M.aba);
  const linea = $derived(valores.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(''));
  const area = $derived(n > 1 ? `${linea}L${x(n - 1)} ${ALTO - M.aba}L${x(0)} ${ALTO - M.aba}Z` : '');

  // Como mucho ~6 etiquetas en X, siempre la primera y la última
  const marcasX = $derived.by(() => {
    const cada = Math.max(1, Math.ceil(n / 6));
    const idx = valores.map((_, i) => i).filter((i) => i % cada === 0);
    if (idx.at(-1) !== n - 1) {
      if (n - 1 - idx.at(-1)! < cada / 2) idx.pop();
      idx.push(n - 1);
    }
    return idx;
  });
  const franja = $derived(n > 1 ? plano / (n - 1) : plano); // zona táctil de cada punto

  const elegir = (i: number) => alElegir?.(seleccionado === i ? null : i);
</script>

<div class="grafico" bind:clientWidth={ancho}>
  <svg width={ancho} height={ALTO} role="group" aria-label={descripcion}>
    {#each escala.marcas as t (t)}
      <line class="rejilla" x1={M.izq} x2={ancho - M.der} y1={y(t)} y2={y(t)} />
      <text class="eje" x={M.izq - 6} y={y(t) + 4} text-anchor="end">{formato(t)}</text>
    {/each}
    {#each marcasX as i (i)}
      <text
        class="eje"
        x={x(i)}
        y={ALTO - 8}
        text-anchor={n > 1 && i === 0 ? 'start' : n > 1 && i === n - 1 ? 'end' : 'middle'}>{etiquetaX(i)}</text
      >
    {/each}

    {#if area}<path class="area" d={area} />{/if}
    <path class="linea" d={linea} />

    {#if seleccionado !== null && valores[seleccionado] !== undefined}
      <line class="guia" x1={x(seleccionado)} x2={x(seleccionado)} y1={M.arr} y2={ALTO - M.aba} />
    {/if}
    {#each valores as v, i (i)}
      <circle
        class="punto"
        class:activo={i === seleccionado}
        cx={x(i)}
        cy={y(v)}
        r={i === seleccionado ? 6 : n > 30 ? 3 : 4}
      />
    {/each}

    {#if alElegir}
      {#each valores as _, i (i)}
        <rect
          class="toque"
          x={x(i) - franja / 2}
          y={0}
          width={franja}
          height={ALTO}
          role="button"
          tabindex="0"
          aria-pressed={i === seleccionado}
          aria-label={nombrePunto(i)}
          onclick={() => elegir(i)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              elegir(i);
            }
          }}
        />
      {/each}
    {/if}
  </svg>
</div>

<style>
  .grafico {
    width: 100%;
  }
  svg {
    display: block;
    font-family: var(--font);
    overflow: visible;
  }
  .rejilla {
    stroke: var(--md-sys-color-surface-variant);
    stroke-width: 1;
  }
  .guia {
    stroke: var(--md-sys-color-outline);
    stroke-width: 1;
  }
  .eje {
    font-size: 11px;
    fill: var(--md-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }
  .area {
    fill: var(--md-sys-color-primary);
    fill-opacity: 0.1;
  }
  .linea {
    fill: none;
    stroke: var(--md-sys-color-primary);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .punto {
    fill: var(--md-sys-color-primary);
    stroke: var(--md-sys-color-surface-container-low);
    stroke-width: 2;
  }
  .punto.activo {
    fill: var(--md-sys-color-tertiary);
  }
  .toque {
    fill: transparent;
    cursor: pointer;
    outline: none;
  }
  .toque:focus-visible {
    fill: var(--md-sys-color-primary);
    fill-opacity: 0.08;
  }
</style>
