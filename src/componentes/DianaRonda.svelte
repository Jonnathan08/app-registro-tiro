<script lang="ts">
  import type { TipoDiana } from '../lib/diana';
  import { sumaRonda, type Ronda } from '../lib/modelo';
  import Diana from './Diana.svelte';
  import Icono from './Icono.svelte';

  // Diana de solo lectura con una ronda resaltada y el resto de la sesión atenuado. Los botones ◀ ▶ recorren
  // Todas → R1 → … → Rn → Todas.
  let {
    dianaCm,
    registro,
    ronda = $bindable(null),
  }: { dianaCm: TipoDiana; registro: Ronda[]; ronda?: number | null } = $props();

  let marco: HTMLElement;
  const elegida = $derived(ronda !== null ? registro[ronda] : undefined);
  const resto = $derived(registro.filter((_, i) => i !== ronda).flatMap((r) => r.flechas));
  const sinPosiciones = $derived(!!elegida && !elegida.flechas.some((f) => f.pos));

  function anterior() {
    ronda = ronda === null ? registro.length - 1 : ronda === 0 ? null : ronda - 1;
  }
  function siguiente() {
    ronda = ronda === null ? 0 : ronda === registro.length - 1 ? null : ronda + 1;
  }

  /** Trae la diana a la vista si quedó fuera de pantalla. */
  export function mostrar() {
    marco?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
</script>

<section class="tarjeta diana-ronda" aria-label="Flechas en la diana" bind:this={marco}>
  <div class="cabeza">
    <button type="button" class="icbtn estado" aria-label="Ronda anterior" onclick={anterior}
      ><Icono nombre="anterior" /></button
    >
    <span class="titulo" aria-live="polite">
      {#if elegida}
        <span aria-hidden="true">Ronda {ronda! + 1} · <b>{sumaRonda(elegida)}</b></span><span class="oculto"
          >Ronda {ronda! + 1}, {sumaRonda(elegida)} puntos</span
        >
      {:else}
        Todas las rondas
      {/if}
    </span>
    <button type="button" class="icbtn estado" aria-label="Ronda siguiente" onclick={siguiente}
      ><Icono nombre="flecha" /></button
    >
  </div>
  <Diana
    {dianaCm}
    anteriores={elegida ? resto : registro.flatMap((r) => r.flechas)}
    actuales={elegida?.flechas ?? []}
    centroActuales={!!elegida}
  />
  {#if sinPosiciones}
    <p class="t-body-s nota">Esta ronda se registró en modo manual: sus flechas no tienen posición.</p>
  {:else}
    <p class="t-body-s nota">
      Toca una ronda en la hoja{registro.length > 1 ? ' o en el gráfico' : ''} para verla aquí.
    </p>
  {/if}
</section>

<style>
  .diana-ronda {
    padding: 8px 8px 12px;
    gap: 6px;
    scroll-margin: calc(env(safe-area-inset-top, 0px) + 72px) 0 16px;
  }
  .cabeza {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .cabeza .icbtn {
    color: var(--md-sys-color-on-surface);
  }
  .titulo {
    font-family: var(--font-marcador);
    font-size: 20px;
    line-height: 24px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;
  }
  .titulo b {
    color: var(--md-sys-color-primary);
  }
  .nota {
    margin: 0;
    text-align: center;
    font-size: 12px;
    line-height: 16px;
  }
</style>
