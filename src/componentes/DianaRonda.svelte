<script lang="ts">
  import type { TipoDiana } from '../lib/diana';
  import { sumaRonda, type Ronda } from '../lib/modelo';
  import Diana from './Diana.svelte';
  import Icono from './Icono.svelte';

  // Diana de solo lectura con una ronda resaltada (numerada) y el resto de la sesión atenuado.
  let {
    dianaCm,
    registro,
    ronda = $bindable(null),
  }: { dianaCm: TipoDiana; registro: Ronda[]; ronda?: number | null } = $props();

  let marco: HTMLElement;
  const elegida = $derived(ronda !== null ? registro[ronda] : undefined);
  const resto = $derived(registro.filter((_, i) => i !== ronda).flatMap((r) => r.flechas));
  const sinPosiciones = $derived(!!elegida && !elegida.flechas.some((f) => f.pos));

  /** Trae la diana a la vista si quedó fuera de pantalla. */
  export function mostrar() {
    marco?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
</script>

<div class="diana-ronda" bind:this={marco}>
  <div class="cabeza">
    {#if elegida}
      <span class="t-title-s num">Ronda {ronda! + 1} · {sumaRonda(elegida)} pts</span>
      <button
        type="button"
        class="icbtn estado"
        aria-label="Quitar el resaltado de la ronda"
        onclick={() => (ronda = null)}><Icono nombre="cerrar" /></button
      >
    {:else}
      <span class="t-body-s">Toca una ronda de la hoja para resaltarla.</span>
    {/if}
  </div>
  <Diana
    {dianaCm}
    anteriores={elegida ? resto : registro.flatMap((r) => r.flechas)}
    actuales={elegida?.flechas ?? []}
    centroActuales={!!elegida}
  />
  {#if sinPosiciones}
    <p class="t-body-s aviso">Esta ronda se registró en modo manual: sus flechas no tienen posición.</p>
  {/if}
</div>

<style>
  .diana-ronda {
    display: flex;
    flex-direction: column;
    gap: 4px;
    scroll-margin: calc(env(safe-area-inset-top, 0px) + 120px) 0 16px;
  }
  .cabeza {
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .t-title-s {
    font-size: 14px;
    line-height: 20px;
    font-weight: 500;
    letter-spacing: 0.1px;
  }
  .aviso {
    margin: 0;
  }
</style>
