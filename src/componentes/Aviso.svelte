<script lang="ts">
  import { estado } from '../lib/estado.svelte';

  let visible = $state(false);
  let temporizador: ReturnType<typeof setTimeout>;

  $effect(() => {
    if (!estado.aviso) return;
    void estado.aviso.n;
    visible = true;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (visible = false), 3000);
  });
</script>

<div class="snack" class:visible role="status" aria-live="polite">{estado.aviso?.texto ?? ''}</div>

<style>
  .snack {
    position: fixed; left: 16px; right: 16px; z-index: 20;
    bottom: calc(96px + env(safe-area-inset-bottom, 0px));
    max-width: 560px; margin: 0 auto;
    background: var(--md-sys-color-inverse-surface); color: var(--md-sys-color-inverse-on-surface);
    border-radius: var(--shape-xs); padding: 14px 16px; font-size: 14px; line-height: 20px;
    box-shadow: 0 3px 6px rgb(0 0 0 / .3);
    opacity: 0; transform: translateY(8px); pointer-events: none;
    transition: opacity .2s, transform .2s;
  }
  .visible { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) { .snack { transition: none; } }
</style>
