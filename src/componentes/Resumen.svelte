<script lang="ts">
  import Marcador from './Marcador.svelte';
  import { dosDecimales } from '../lib/formato';
  import { resumen, type Sesion } from '../lib/modelo';

  // Total, X, 10+X y promedio. «caja»: recuadro en la página; «tablero»: cifras sobre la franja oscura de arriba
  let {
    sesion,
    variante = 'caja',
    etiqueta = 'Resumen de la sesión',
  }: { sesion: Sesion; variante?: 'caja' | 'tablero'; etiqueta?: string } = $props();
  const r = $derived(resumen(sesion));
  const flechas = $derived(`${r.flechas} ${r.flechas === 1 ? 'flecha' : 'flechas'}`);
  const promedio = $derived(r.flechas ? dosDecimales(r.promedio) : '–');
</script>

{#if variante === 'tablero'}
  <Marcador
    {etiqueta}
    cifras={[
      {
        rotulo: `Total · ${flechas}`,
        valor: r.total,
        sufijo: ` /${r.maximo}`,
        sufijoLeido: ` de ${r.maximo}`,
        acento: true,
        ancha: true,
      },
      { rotulo: 'X', valor: r.x, tamano: 'l' },
      { rotulo: '10+X', valor: r.dieces, tamano: 'l' },
      { rotulo: 'Prom.', valor: promedio, leido: `promedio ${promedio}`, tamano: 'l' },
    ]}
  />
{:else}
  <section class="resumen" aria-label={etiqueta}>
    <div class="total">
      <span class="t-rotulo">Total · {flechas}</span>
      <span class="cifra"
        >{r.total}<small aria-hidden="true"> /{r.maximo}</small><span class="oculto"> de {r.maximo}</span></span
      >
    </div>
    <div class="dato"><b>{r.x}</b><span class="t-rotulo">X</span></div>
    <div class="dato"><b>{r.dieces}</b><span class="t-rotulo">10+X</span></div>
    <div class="dato">
      <b>{promedio}</b><span class="t-rotulo"
        ><span aria-hidden="true">Prom.</span><span class="oculto">promedio</span></span
      >
    </div>
  </section>
{/if}

<style>
  .resumen {
    display: grid;
    grid-template-columns: 1.6fr repeat(3, minmax(0, 1fr));
    border: 2px solid var(--md-sys-color-on-surface);
    border-radius: var(--shape-s);
    background: var(--md-sys-color-surface-container-lowest);
    font-family: var(--font-marcador);
    font-variant-numeric: tabular-nums;
  }
  .total {
    min-width: 0;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
  }
  .total .t-rotulo {
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cifra {
    font-size: 44px;
    line-height: 48px;
    font-weight: 700;
    color: var(--md-sys-color-primary);
    white-space: nowrap;
  }
  .cifra small {
    font-size: 20px;
    color: var(--md-sys-color-on-surface-variant);
  }
  .dato {
    min-width: 0;
    padding: 10px 0;
    border-left: 1px solid var(--md-sys-color-surface-container-highest);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
  }
  .dato b {
    font-size: 30px;
    line-height: 34px;
    font-weight: 700;
  }
  .dato .t-rotulo {
    color: var(--md-sys-color-on-surface-variant);
  }
</style>
