<script lang="ts">
  import { estado } from '../lib/estado.svelte';

  let visible = $state(false);
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  let pausado = false; // con el foco o el dedo encima no se va (WCAG 2.2.1)

  // Con acción dura más, para que dé tiempo a tocarla
  const duracion = () => (estado.aviso?.accion ? 5000 : 3000);
  function programar() {
    clearTimeout(temporizador);
    if (!pausado) temporizador = setTimeout(() => (visible = false), duracion());
  }

  $effect(() => {
    if (!estado.aviso) {
      visible = false;
      return;
    }
    void estado.aviso.n;
    visible = true;
    programar();
  });

  function pausar() {
    pausado = true;
    clearTimeout(temporizador);
  }
  function seguir() {
    pausado = false;
    programar();
  }

  function actuar() {
    const accion = estado.aviso?.accion;
    visible = false;
    pausado = false;
    clearTimeout(temporizador);
    accion?.hacer();
  }
</script>

<div class="snack" class:visible>
  <span class="mensaje" role="status" aria-live="polite">{estado.aviso?.texto ?? ''}</span>
  <!-- Fuera de la región viva para que no se lea con el texto; solo existe mientras el aviso se ve -->
  {#if visible && estado.aviso?.accion}
    <button
      type="button"
      class="btn texto estado"
      aria-label={estado.aviso.accion.etiqueta}
      onclick={actuar}
      onfocus={pausar}
      onblur={seguir}
      onpointerenter={pausar}
      onpointerleave={seguir}>{estado.aviso.accion.texto}</button
    >
  {/if}
</div>

<style>
  .snack {
    position: fixed;
    left: 16px;
    right: 16px;
    z-index: 20;
    bottom: calc(96px + env(safe-area-inset-bottom, 0px));
    max-width: 560px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    background: var(--md-sys-color-inverse-surface);
    color: var(--md-sys-color-inverse-on-surface);
    border-radius: var(--shape-xs);
    padding: 4px 8px 4px 16px;
    font-size: 14px;
    line-height: 20px;
    box-shadow: 0 3px 6px rgb(0 0 0 / 0.3);
    opacity: 0;
    transform: translateY(8px);
    /* Los toques pasan a través (p. ej. a la diana); solo el botón los recibe */
    pointer-events: none;
    transition:
      opacity 0.2s,
      transform 0.2s;
  }
  /* Con la barra de Deshacer / Guardar ronda en pantalla, el aviso queda encima de ella */
  :global(body:has(.acciones-fijas)) .snack {
    bottom: calc(176px + env(safe-area-inset-bottom, 0px));
  }
  .mensaje {
    flex: 1;
    padding: 10px 0;
  }
  .visible {
    opacity: 1;
    transform: none;
  }
  .snack .btn {
    pointer-events: auto;
    color: var(--md-sys-color-inverse-primary);
  }
  @media (prefers-reduced-motion: reduce) {
    .snack {
      transition: none;
    }
  }
</style>
