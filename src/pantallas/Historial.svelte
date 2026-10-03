<script lang="ts">
  import Icono from '../componentes/Icono.svelte';
  import { estado } from '../lib/estado.svelte';
  import { resumen } from '../lib/modelo';

  const fecha = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const prom = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<header class="barra"><h1 class="t-title-l">Historial</h1></header>

<div class="cuerpo">
  {#if !estado.historial.length}
    <div class="vacio">
      <Icono nombre="historial" clase="grande" />
      <p class="t-title-m">Todavía no hay sesiones guardadas</p>
      <p class="t-body-s">Cuando termines una sesión aparecerá aquí, con su hoja de puntuación y las opciones para exportarla.</p>
    </div>
  {:else}
    <ul class="lista">
      {#each estado.historial as s (s.id)}
        {@const r = resumen(s)}
        <li>
          <button type="button" class="item estado" onclick={() => (estado.detalle = s)}>
            <span class="total num">{r.total}</span>
            <span class="txt">
              <span class="t-title-m">{fecha.format(new Date(s.fecha))}</span>
              <span class="t-body-s num">{s.distanciaM} m · {s.perfil === 'control' ? 'Control' : 'Abierto'} · {r.flechas} flechas · prom. {prom.format(r.promedio)}</span>
            </span>
            <Icono nombre="flecha" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .barra { height: 64px; display: flex; align-items: center; padding: 0 16px; }
  h1 { margin: 0; }
  .cuerpo { padding: 0 0 24px; }
  .vacio { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 48px 32px; color: var(--md-sys-color-on-surface-variant); }
  .vacio p { margin: 0; max-width: 32ch; }
  .vacio :global(.grande) { width: 48px; height: 48px; fill: currentColor; }
  .lista { list-style: none; margin: 0; padding: 0; }
  .item {
    width: 100%; min-height: 72px; padding: 8px 16px; border: 0; background: none; cursor: pointer;
    display: flex; align-items: center; gap: 16px; text-align: left;
    color: var(--md-sys-color-on-surface-variant);
  }
  .total {
    width: 56px; height: 56px; flex: none; border-radius: var(--shape-m);
    background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);
    display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 500;
  }
  .txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .txt .t-title-m { color: var(--md-sys-color-on-surface); text-transform: capitalize; }
</style>
