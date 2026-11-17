<script lang="ts" generics="T extends string">
  let {
    opciones,
    valor = $bindable(),
    etiqueta,
    alCambiar,
  }: {
    opciones: { valor: T; texto: string }[];
    valor: T;
    etiqueta: string;
    alCambiar?: (v: T) => void;
  } = $props();
</script>

<div class="seg" role="group" aria-label={etiqueta}>
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
      {o.texto}
    </button>
  {/each}
</div>
