<script lang="ts">
  let {
    abierto = $bindable(false),
    titulo,
    texto,
    confirmar,
    peligro = false,
    alConfirmar,
    secundario,
    alSecundario,
  }: {
    abierto: boolean;
    titulo: string;
    texto: string;
    confirmar: string;
    peligro?: boolean;
    alConfirmar: () => void;
    /** Acción alternativa opcional, a la izquierda de Cancelar. */
    secundario?: string;
    alSecundario?: () => void;
  } = $props();

  const id = $props.id();
  let dlg: HTMLDialogElement;
  $effect(() => {
    if (abierto && !dlg.open) dlg.showModal();
    if (!abierto && dlg.open) dlg.close();
  });
</script>

<dialog bind:this={dlg} onclose={() => (abierto = false)} aria-labelledby="{id}-titulo">
  <h2 id="{id}-titulo" class="t-headline">{titulo}</h2>
  <p>{texto}</p>
  <div class="acciones">
    {#if secundario}
      <button type="button" class="btn texto estado otra" onclick={() => { abierto = false; alSecundario?.(); }}>{secundario}</button>
    {/if}
    <button type="button" class="btn texto estado" onclick={() => (abierto = false)}>Cancelar</button>
    <button type="button" class="btn texto estado" class:peligro onclick={() => { abierto = false; alConfirmar(); }}>{confirmar}</button>
  </div>
</dialog>

<style>
  dialog {
    border: 0; border-radius: var(--shape-xl); padding: 24px;
    width: min(312px, calc(100% - 48px));
    background: var(--md-sys-color-surface-container-high); color: var(--md-sys-color-on-surface);
  }
  dialog::backdrop { background: rgb(0 0 0 / .32); }
  h2 { margin: 0 0 16px; }
  p { margin: 0 0 24px; font-size: 14px; line-height: 20px; color: var(--md-sys-color-on-surface-variant); }
  .acciones { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; }
  .otra { margin-right: auto; }
</style>
