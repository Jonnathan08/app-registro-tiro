<script lang="ts" generics="T extends string">
  let {
    opciones,
    valor = $bindable(),
    etiqueta,
    alCambiar,
    columnas,
  }: {
    /** muestra: color CSS de un círculo decorativo delante del texto (p. ej. una var(--…)) */
    opciones: { valor: T; texto: string; muestra?: string }[];
    valor: T;
    etiqueta: string;
    alCambiar?: (v: T) => void;
    /** Sin él, todas las opciones en una fila; con él, en cuadrícula de ese número de columnas */
    columnas?: number;
  } = $props();
</script>

<div class="seg" class:cuadricula={columnas} style:--columnas={columnas} role="group" aria-label={etiqueta}>
  {#each opciones as o (o.valor)}
    <button
      type="button"
      class="estado"
      aria-pressed={valor === o.valor}
      onclick={() => {
        valor = o.valor;
        alCambiar?.(o.valor);
      }}
    >
      {#if o.muestra}<span class="muestra" aria-hidden="true" style:background={o.muestra}></span>{/if}
      {o.texto}
    </button>
  {/each}
</div>
