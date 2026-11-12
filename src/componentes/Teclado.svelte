<script lang="ts">
  import { zona } from '../lib/diana';

  // Teclado de valores de flecha, con el color de cada anillo
  let {
    alTocar,
    deshabilitado = false,
    compacto = false,
  }: {
    alTocar: (puntaje: number, x: boolean) => void;
    deshabilitado?: boolean;
    /** Teclas más bajas, para la hoja de edición. */
    compacto?: boolean;
  } = $props();

  const TECLAS: { t: string; puntaje: number; x?: boolean }[] = [
    { t: 'X', puntaje: 10, x: true },
    { t: '10', puntaje: 10 },
    { t: '9', puntaje: 9 },
    { t: '8', puntaje: 8 },
    { t: '7', puntaje: 7 },
    { t: '6', puntaje: 6 },
    { t: '5', puntaje: 5 },
    { t: '4', puntaje: 4 },
    { t: '3', puntaje: 3 },
    { t: '2', puntaje: 2 },
    { t: '1', puntaje: 1 },
    { t: 'M', puntaje: 0 },
  ];
</script>

<div class="teclado" class:compacto>
  {#each TECLAS as k (k.t)}
    <button
      type="button"
      class="tecla estado num z-{zona(k.puntaje)}"
      disabled={deshabilitado}
      onclick={() => alTocar(k.puntaje, !!k.x)}>{k.t}</button
    >
  {/each}
</div>

<style>
  .teclado {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .tecla {
    height: 56px;
    border-radius: var(--shape-m);
    border: 0;
    font-size: 22px;
    font-weight: 500;
    cursor: pointer;
  }
  .compacto .tecla {
    height: 52px;
    font-size: 20px;
  }
  .tecla:disabled {
    opacity: 0.38;
    cursor: default;
  }
</style>
