<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Grafico from '../componentes/Grafico.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Segmentado from '../componentes/Segmentado.svelte';
  import { estado } from '../lib/estado.svelte';
  import { dosDecimales, fechaCorta, fechaLista } from '../lib/formato';
  import { NOMBRE_PERFIL, resumen, type Sesion } from '../lib/modelo';

  // ---- Progreso: promedio por flecha de cada sesión, por distancia (y diana, si a una distancia se usó más de una) ----
  const clave = (s: Sesion) => `${s.distanciaM}-${s.dianaCm}`;
  const grupos = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- mapa temporal dentro del $derived
    const m = new Map<string, Sesion[]>();
    for (const s of estado.historial) {
      if (!resumen(s).flechas) continue;
      m.set(clave(s), [...(m.get(clave(s)) ?? []), s]);
    }
    const lista = [...m.entries()].map(([k, ss]) => ({ k, sesiones: [...ss].sort((a, b) => a.fecha.localeCompare(b.fecha)) }));
    lista.sort((a, b) => a.sesiones[0].distanciaM - b.sesiones[0].distanciaM || a.sesiones[0].dianaCm - b.sesiones[0].dianaCm);
    return lista.map((g) => {
      const s0 = g.sesiones[0];
      const variasDianas = lista.filter((h) => h.sesiones[0].distanciaM === s0.distanciaM).length > 1;
      return { ...g, texto: variasDianas ? `${s0.distanciaM} m · ${s0.dianaCm}` : `${s0.distanciaM} m` };
    });
  });

  let elegido = $state<string | null>(null);
  let punto = $state<number | null>(null);
  // Por defecto, la distancia de la última sesión
  const grupo = $derived(grupos.find((g) => g.k === elegido) ?? grupos.find((g) => estado.historial[0] && g.k === clave(estado.historial[0])) ?? grupos[0]);
  const serie = $derived(grupo ? grupo.sesiones.map((s) => ({ s, r: resumen(s) })) : []);
  const sesionPunto = $derived(punto !== null ? serie[punto] : undefined);
</script>

<Barra titulo="Historial" />

<div class="cuerpo">
  {#if !estado.historial.length}
    <div class="vacio">
      <Icono nombre="historial" clase="grande" />
      <p class="t-title-m">Todavía no hay sesiones guardadas</p>
      <p class="t-body-s">Cuando termines una sesión aparecerá aquí, con su hoja de puntuación y las opciones para exportarla.</p>
    </div>
  {:else}
    {#if grupo}
      <section class="progreso" aria-labelledby="titulo-progreso">
        <h2 id="titulo-progreso" class="sec">Progreso · promedio por flecha</h2>
        {#if grupos.length > 1}
          <Segmentado
            etiqueta="Distancia"
            valor={grupo.k}
            opciones={grupos.map((g) => ({ valor: g.k, texto: g.texto }))}
            alCambiar={(k) => { elegido = k; punto = null; }}
          />
        {/if}
        {#if serie.length > 1}
          <Grafico
            valores={serie.map((p) => p.r.promedio)}
            etiquetaX={(i) => fechaCorta(serie[i].s.fecha)}
            nombrePunto={(i) => `${fechaLista(serie[i].s.fecha)}: ${dosDecimales(serie[i].r.promedio)} por flecha`}
            formato={dosDecimales}
            seleccionado={punto}
            alElegir={(i) => (punto = i)}
            descripcion="Promedio por flecha de cada sesión a {grupo.texto}"
          />
          {#if sesionPunto}
            <button type="button" class="lectura estado" onclick={() => (estado.detalle = sesionPunto.s)}>
              <span class="num"><span class="cap">{fechaLista(sesionPunto.s.fecha)}</span> · <b>{dosDecimales(sesionPunto.r.promedio)}</b> por flecha · {sesionPunto.r.total}/{sesionPunto.r.maximo}</span>
              <Icono nombre="flecha" />
            </button>
          {:else}
            <p class="t-body-s ayuda">Toca un punto para ver la sesión.</p>
          {/if}
        {:else}
          <p class="t-body-s ayuda">Con dos o más sesiones a {grupo.texto} verás aquí cómo evoluciona tu promedio.</p>
        {/if}
      </section>
    {/if}

    <h2 class="sec titulo-lista">Sesiones</h2>
    <ul class="lista">
      {#each estado.historial as s (s.id)}
        {@const r = resumen(s)}
        <li>
          <button type="button" class="item estado" onclick={() => (estado.detalle = s)}>
            <span class="total num">{r.total}</span>
            <span class="txt">
              <span class="t-title-m">{fechaLista(s.fecha)}</span>
              <span class="t-body-s num">{s.distanciaM} m · {NOMBRE_PERFIL[s.perfil]} · {r.flechas} flechas · prom. {dosDecimales(r.promedio)}</span>
            </span>
            <Icono nombre="flecha" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
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
  .progreso { margin: 0 16px 8px; padding: 12px; border-radius: var(--shape-m); background: var(--md-sys-color-surface-container-low); display: flex; flex-direction: column; gap: 12px; }
  .progreso .sec { margin: 0; }
  .ayuda { margin: 0; font-size: 12px; line-height: 16px; }
  .lectura {
    display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 40px;
    padding: 0 4px 0 8px; margin: -4px 0 0; border: 0; border-radius: var(--shape-s); background: none; cursor: pointer; text-align: left;
    font-size: 13px; line-height: 18px; color: var(--md-sys-color-on-surface-variant);
  }
  .lectura b { font-weight: 500; color: var(--md-sys-color-on-surface); }
  .cap { text-transform: capitalize; }
  .titulo-lista { margin: 8px 16px 0; }
  .txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .txt .t-title-m { color: var(--md-sys-color-on-surface); text-transform: capitalize; }
</style>
