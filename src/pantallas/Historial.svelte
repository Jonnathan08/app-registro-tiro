<script lang="ts" module>
  // Se conservan entre visitas: al volver del detalle, la lista sigue donde estaba
  let volver: { y: number; id: string } | null = null;
  let progresoAbierto = false;
</script>

<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Grafico from '../componentes/Grafico.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Segmentado from '../componentes/Segmentado.svelte';
  import { tick } from 'svelte';
  import { estado } from '../lib/estado.svelte';
  import { dosDecimales, fechaCorta, fechaDia, fechaLarga, fechaLista, mesAnio } from '../lib/formato';
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
    const lista = [...m.entries()].map(([k, ss]) => ({
      k,
      sesiones: [...ss].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    }));
    lista.sort(
      (a, b) => a.sesiones[0].distanciaM - b.sesiones[0].distanciaM || a.sesiones[0].dianaCm - b.sesiones[0].dianaCm,
    );
    return lista.map((g) => {
      const s0 = g.sesiones[0];
      const variasDianas = lista.filter((h) => h.sesiones[0].distanciaM === s0.distanciaM).length > 1;
      return { ...g, texto: variasDianas ? `${s0.distanciaM} m · ${s0.dianaCm}` : `${s0.distanciaM} m` };
    });
  });

  let elegido = $state<string | null>(null);
  let punto = $state<number | null>(null);
  let abierto = $state(progresoAbierto);
  // Por defecto, la distancia de la última sesión
  const grupo = $derived(
    grupos.find((g) => g.k === elegido) ??
      grupos.find((g) => estado.historial[0] && g.k === clave(estado.historial[0])) ??
      grupos[0],
  );
  const serie = $derived(grupo ? grupo.sesiones.map((s) => ({ s, r: resumen(s) })) : []);
  const sesionPunto = $derived(punto !== null ? serie[punto] : undefined);

  // Resumen plegado: último promedio y diferencia (redondeada como se muestra) con la sesión anterior
  const ultimo = $derived(serie.at(-1)?.r.promedio ?? 0);
  const diferencia = $derived(serie.length > 1 ? Math.round((ultimo - serie.at(-2)!.r.promedio) * 100) / 100 : null);
  // Línea de tendencia de las últimas sesiones, en una caja de 88×32
  const tendencia = $derived.by(() => {
    const v = serie.slice(-12).map((p) => p.r.promedio);
    if (v.length < 2) return null;
    const min = Math.min(...v),
      max = Math.max(...v);
    const pts = v.map((p, i) => ({
      x: 3 + (i * 82) / (v.length - 1),
      y: max > min ? 4 + (1 - (p - min) / (max - min)) * 24 : 16,
    }));
    return { d: pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(''), fin: pts.at(-1)! };
  });

  // Sesiones agrupadas por mes, en el orden del historial (más recientes primero). Con un mapa, un mes
  // no se repite aunque fechas importadas con otro huso horario alteren el orden.
  const meses = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- mapa temporal dentro del $derived
    const m = new Map<string, Sesion[]>();
    for (const s of estado.historial) {
      const texto = mesAnio(s.fecha);
      m.set(texto, [...(m.get(texto) ?? []), s]);
    }
    return [...m].map(([texto, sesiones]) => ({ texto, sesiones }));
  });

  function abrir(s: Sesion) {
    volver = { y: scrollY, id: s.id };
    estado.detalle = s;
  }

  function plegar() {
    abierto = progresoAbierto = !abierto;
  }

  // Al volver del detalle: misma posición y el foco en la sesión que se abrió
  $effect(() => {
    if (!volver) return;
    const { y, id } = volver;
    volver = null;
    void tick().then(() => {
      scrollTo(0, y);
      document.querySelector<HTMLElement>(`[data-sesion="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
    });
  });
</script>

<Barra titulo="Historial" />

<div class="cuerpo">
  {#if !estado.historial.length}
    <div class="vacio">
      <Icono nombre="historial" clase="grande" />
      <p class="t-title-m">Todavía no hay sesiones guardadas</p>
      <p class="t-body-s">
        Cuando termines una sesión aparecerá aquí, con su hoja de puntuación y las opciones para exportarla.
      </p>
    </div>
  {:else}
    {#if grupo}
      <section class="progreso">
        <button
          type="button"
          class="cabecera estado"
          aria-expanded={abierto}
          aria-controls="cuerpo-progreso"
          aria-labelledby="titulo-progreso"
          aria-describedby="valor-progreso"
          onclick={plegar}
        >
          <span class="textos">
            <span id="titulo-progreso" class="titulo">Progreso · {grupo.texto}</span>
            <span id="valor-progreso" class="valor num"
              ><b>{dosDecimales(ultimo)}</b> por flecha{#if diferencia !== null}
                <span class="dif" class:sube={diferencia > 0}
                  ><span aria-hidden="true">{diferencia > 0 ? '▲' : diferencia < 0 ? '▼' : '='}</span><span
                    class="oculto">{diferencia > 0 ? 'sube' : diferencia < 0 ? 'baja' : 'igual'}</span
                  >
                  {dosDecimales(Math.abs(diferencia))}</span
                > vs. anterior{/if}</span
            >
          </span>
          {#if tendencia}
            <svg class="tendencia" viewBox="0 0 88 32" aria-hidden="true">
              <path d={tendencia.d} />
              <circle cx={tendencia.fin.x} cy={tendencia.fin.y} r="3" />
            </svg>
          {/if}
          <Icono nombre="desplegar" clase="ic chevron" />
        </button>

        <div id="cuerpo-progreso" class="desplegado" hidden={!abierto}>
          {#if abierto}
            {#if grupos.length > 1}
              <Segmentado
                etiqueta="Distancia"
                valor={grupo.k}
                opciones={grupos.map((g) => ({ valor: g.k, texto: g.texto }))}
                alCambiar={(k) => {
                  elegido = k;
                  punto = null;
                }}
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
                <button type="button" class="lectura estado" onclick={() => abrir(sesionPunto.s)}>
                  <span class="num"
                    ><span class="cap">{fechaLista(sesionPunto.s.fecha)}</span> ·
                    <b>{dosDecimales(sesionPunto.r.promedio)}</b>
                    por flecha · {sesionPunto.r.total}/{sesionPunto.r.maximo}</span
                  >
                  <Icono nombre="flecha" />
                </button>
              {:else}
                <p class="t-body-s ayuda">Toca un punto para ver la sesión.</p>
              {/if}
            {:else}
              <p class="t-body-s ayuda">
                Con dos o más sesiones a {grupo.texto} verás aquí cómo evoluciona tu promedio.
              </p>
            {/if}
          {/if}
        </div>
      </section>
    {/if}

    {#each meses as m (m.texto)}
      <h2 class="mes">{m.texto}</h2>
      <ul class="lista">
        {#each m.sesiones as s (s.id)}
          {@const r = resumen(s)}
          <li>
            <button type="button" class="item estado" data-sesion={s.id} onclick={() => abrir(s)}>
              <span class="total num">{r.total}</span>
              <span class="txt">
                <span class="t-title-m"
                  ><span aria-hidden="true">{fechaDia(s.fecha)}</span><span class="oculto">{fechaLarga(s.fecha)}</span
                  ></span
                >
                <span class="t-body-s num"
                  >{NOMBRE_PERFIL[s.perfil]} · {r.flechas} flechas · prom. {dosDecimales(r.promedio)}</span
                >
              </span>
              <span class="dist num">{s.distanciaM} m</span>
            </button>
          </li>
        {/each}
      </ul>
    {/each}
  {/if}
</div>

<style>
  .cuerpo {
    padding: 0 0 24px;
  }
  .vacio {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    padding: 48px 32px;
    color: var(--md-sys-color-on-surface-variant);
  }
  .vacio p {
    margin: 0;
    max-width: 32ch;
  }
  .vacio :global(.grande) {
    width: 48px;
    height: 48px;
    fill: currentColor;
  }
  .lista {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .item {
    width: 100%;
    min-height: 72px;
    padding: 8px 16px;
    border: 0;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    color: var(--md-sys-color-on-surface-variant);
  }
  .total {
    width: 52px;
    height: 52px;
    flex: none;
    border-radius: var(--shape-m);
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 500;
  }
  .dist {
    flex: none;
    height: 28px;
    padding: 0 10px;
    border-radius: var(--shape-s);
    border: 1px solid var(--md-sys-color-outline);
    display: inline-flex;
    align-items: center;
    font-size: 13px;
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
  }
  .mes {
    margin: 16px 16px 4px;
    font-size: 14px;
    line-height: 20px;
    font-weight: 500;
    letter-spacing: 0.1px;
    color: var(--md-sys-color-primary);
  }

  .progreso {
    margin: 0 16px 8px;
    border-radius: var(--shape-l);
    background: var(--md-sys-color-surface-container-low);
  }
  .cabecera {
    width: 100%;
    min-height: 72px;
    border-radius: var(--shape-l);
    padding: 12px 8px 12px 16px;
    border: 0;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    color: var(--md-sys-color-on-surface);
  }
  .textos {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .titulo {
    font-size: 14px;
    line-height: 20px;
    font-weight: 500;
    letter-spacing: 0.1px;
    color: var(--md-sys-color-on-surface-variant);
  }
  .valor {
    font-size: 14px;
    line-height: 20px;
    color: var(--md-sys-color-on-surface-variant);
  }
  .valor b {
    font-size: 22px;
    line-height: 28px;
    font-weight: 400;
    color: var(--md-sys-color-on-surface);
  }
  /* Nunca rojo/verde: sube en azul petróleo, baja en gris */
  .dif {
    margin-left: 4px;
    font-weight: 500;
    white-space: nowrap;
  }
  .dif.sube {
    color: var(--md-sys-color-primary);
  }
  .tendencia {
    width: 88px;
    height: 32px;
    flex: none;
  }
  .tendencia path {
    fill: none;
    stroke: var(--md-sys-color-primary);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .tendencia circle {
    fill: var(--md-sys-color-primary);
  }
  .cabecera :global(.chevron) {
    color: var(--md-sys-color-on-surface-variant);
    transition: transform 0.2s;
  }
  .cabecera[aria-expanded='true'] :global(.chevron) {
    transform: rotate(180deg);
  }
  .desplegado {
    padding: 0 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ayuda {
    margin: 0;
    font-size: 12px;
    line-height: 16px;
  }
  .lectura {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 48px;
    padding: 0 4px 0 8px;
    border: 0;
    border-radius: var(--shape-s);
    background: none;
    cursor: pointer;
    text-align: left;
    font-size: 13px;
    line-height: 18px;
    color: var(--md-sys-color-on-surface-variant);
  }
  .lectura b {
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
  }
  .cap {
    text-transform: capitalize;
  }
  .txt {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .txt .t-title-m {
    color: var(--md-sys-color-on-surface);
    text-transform: capitalize;
  }
  @media (prefers-reduced-motion: reduce) {
    .cabecera :global(.chevron) {
      transition: none;
    }
  }
</style>
