<script lang="ts" module>
  // Se conserva entre visitas: al volver del detalle, la lista sigue donde estaba
  let volver: { y: number; id: string } | null = null;
</script>

<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Icono from '../componentes/Icono.svelte';
  import { tick } from 'svelte';
  import { estado } from '../lib/estado.svelte';
  import { dosDecimales, fechaDia, fechaLarga, fechaLista, mesAnio } from '../lib/formato';
  import { NOMBRE_PERFIL, resumen, type Sesion } from '../lib/modelo';
  import { claveProgreso, diferencia, gruposProgreso, MAX_TENDENCIA, puntosTendencia } from '../lib/progreso';

  // ---- Progreso (en el tablero): promedio por flecha de las últimas sesiones a una distancia ----
  const grupos = $derived(gruposProgreso(estado.historial));
  let elegido = $state<string | null>(null);
  let punto = $state<number | null>(null);
  // Por defecto, la distancia de la última sesión
  const grupo = $derived(
    grupos.find((g) => g.k === elegido) ??
      grupos.find((g) => estado.historial[0] && g.k === claveProgreso(estado.historial[0])) ??
      grupos[0],
  );
  const serie = $derived(grupo ? grupo.sesiones.slice(-MAX_TENDENCIA).map((s) => ({ s, r: resumen(s) })) : []);
  const promedios = $derived(serie.map((p) => p.r.promedio));
  const ultimo = $derived(promedios.at(-1) ?? 0);
  const dif = $derived(diferencia(promedios));
  const sesionPunto = $derived(punto !== null ? serie[punto] : undefined);

  // Línea de tendencia: ocupa el ancho del tablero; cada punto tiene su franja táctil
  const ALTO = 76;
  let ancho = $state(320);
  const puntos = $derived(puntosTendencia(promedios, ancho, ALTO, 10));
  const franja = $derived(puntos && puntos.length > 1 ? puntos[1].x - puntos[0].x : ancho);
  const elegir = (i: number) => (punto = punto === i ? null : i);

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
{#if grupo}
  <section class="tablero progreso" aria-labelledby="titulo-progreso">
    {#if grupos.length > 1}
      <div class="distancias" role="group" aria-label="Distancia del progreso">
        {#each grupos as g (g.k)}
          <button
            type="button"
            class="chip-tablero estado"
            aria-pressed={g.k === grupo.k}
            onclick={() => {
              elegido = g.k;
              punto = null;
            }}>{g.texto}</button
          >
        {/each}
      </div>
    {/if}
    <div class="cifra">
      <div class="dato">
        <h2 id="titulo-progreso" class="t-rotulo">Promedio por flecha · última sesión</h2>
        <span class="t-cifra-xl valor">{dosDecimales(ultimo)}</span>
      </div>
      {#if dif !== null}
        <span class="dif"
          ><span aria-hidden="true">{dif > 0 ? '▲' : dif < 0 ? '▼' : '='}</span><span class="oculto"
            >{dif > 0 ? 'sube' : dif < 0 ? 'baja' : 'igual'}</span
          >
          {dif > 0 ? '+' : dif < 0 ? '−' : ''}{dosDecimales(Math.abs(dif))} vs. la anterior</span
        >
      {/if}
    </div>
    {#if puntos}
      <div class="tendencia" bind:clientWidth={ancho}>
        <svg
          width={ancho}
          height={ALTO}
          role="group"
          aria-label="Promedio por flecha de las últimas {serie.length} sesiones a {grupo.texto}"
        >
          <line class="base" x1="0" x2={ancho} y1={ALTO - 2} y2={ALTO - 2} />
          <polyline class="linea" points={puntos.map((p) => `${p.x},${p.y}`).join(' ')} />
          {#each puntos as p, i (i)}
            <circle
              class="punto"
              class:activo={punto === null ? i === puntos.length - 1 : i === punto}
              cx={p.x}
              cy={p.y}
              r={(punto === null ? i === puntos.length - 1 : i === punto) ? 6 : 4}
            />
          {/each}
          {#each puntos as p, i (i)}
            <rect
              class="toque"
              x={p.x - franja / 2}
              y="0"
              width={franja}
              height={ALTO}
              role="button"
              tabindex="0"
              aria-pressed={i === punto}
              aria-label="{fechaLista(serie[i].s.fecha)}: {dosDecimales(serie[i].r.promedio)} por flecha"
              onclick={() => elegir(i)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  elegir(i);
                }
              }}
            />
          {/each}
        </svg>
      </div>
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
        <p class="ayuda">Toca un punto para ver la sesión.</p>
      {/if}
    {:else}
      <p class="ayuda">Con dos o más sesiones a {grupo.texto} verás aquí cómo evoluciona tu promedio.</p>
    {/if}
  </section>
{/if}

<div class="cuerpo">
  {#if !estado.historial.length}
    <div class="vacio">
      <Icono nombre="historial" clase="grande" />
      <h2 class="sec">Todavía no hay sesiones guardadas</h2>
      <p class="t-body-s">
        Cuando termines una sesión aparecerá aquí, con su hoja de puntuación y las opciones para exportarla.
      </p>
    </div>
  {:else}
    {#each meses as m (m.texto)}
      <h2 class="mes">{m.texto}</h2>
      <ul class="lista">
        {#each m.sesiones as s (s.id)}
          {@const r = resumen(s)}
          <li>
            <button type="button" class="item estado" data-sesion={s.id} onclick={() => abrir(s)}>
              <span class="total">{r.total}<span class="oculto"> puntos</span></span>
              <span class="txt">
                <span class="fecha"
                  ><span aria-hidden="true">{fechaDia(s.fecha)}</span><span class="oculto">{fechaLarga(s.fecha)}</span
                  ></span
                >
                <span class="t-body-s num"
                  >{NOMBRE_PERFIL[s.perfil]} · {r.flechas} flechas · <span class="oculto">promedio </span>{dosDecimales(
                    r.promedio,
                  )}</span
                >
              </span>
              <span class="dist">{s.distanciaM} m</span>
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
  .vacio p,
  .vacio h2 {
    margin: 0;
    max-width: 32ch;
  }
  .vacio :global(.grande) {
    width: 48px;
    height: 48px;
    fill: currentColor;
  }

  /* ---- Progreso, en el tablero ---- */
  .progreso {
    background: var(--tablero-fondo);
    color: var(--tablero-texto);
    padding: 0 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .distancias {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .cifra {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 4px 12px;
  }
  .dato {
    display: flex;
    flex-direction: column;
  }
  .dato h2 {
    margin: 0;
    color: var(--tablero-rotulo);
  }
  .valor {
    font-size: 52px;
    line-height: 56px;
  }
  /* Nunca rojo/verde: la flecha y el signo dicen si sube o baja */
  .dif {
    margin-bottom: 10px;
    padding: 3px 10px;
    border-radius: var(--shape-xs);
    background: color-mix(in srgb, var(--tablero-rotulo) 18%, transparent);
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .dif > span[aria-hidden='true'] {
    color: var(--tablero-rotulo);
  }
  .tendencia {
    width: 100%;
  }
  .tendencia svg {
    display: block;
    overflow: visible;
  }
  .base {
    stroke: var(--tablero-linea);
    stroke-width: 1;
  }
  .linea {
    fill: none;
    stroke: var(--tablero-rotulo);
    stroke-width: 2.5;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .punto {
    fill: var(--tablero-fondo);
    stroke: var(--tablero-rotulo);
    stroke-width: 2;
  }
  .punto.activo {
    fill: var(--tablero-acento);
    stroke: var(--tablero-fondo);
  }
  .toque {
    fill: transparent;
    cursor: pointer;
    outline: none;
  }
  .toque:focus-visible {
    fill: var(--tablero-texto);
    fill-opacity: 0.12;
  }
  .ayuda {
    margin: 0;
    font-size: 12px;
    line-height: 16px;
    color: var(--tablero-tenue);
  }
  .lectura {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 48px;
    padding: 0 4px 0 8px;
    border: 1px solid var(--tablero-linea);
    border-radius: var(--shape-s);
    background: none;
    cursor: pointer;
    text-align: left;
    font-size: 13px;
    line-height: 18px;
    color: var(--tablero-texto);
  }
  .lectura b {
    font-weight: 700;
  }
  .cap {
    text-transform: capitalize;
  }

  /* ---- Lista por meses ---- */
  .mes {
    margin: 0;
    padding: 18px 16px 8px;
    font-family: var(--font-marcador);
    font-size: 14px;
    line-height: 20px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--md-sys-color-on-surface-variant);
  }
  .lista {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--md-sys-color-surface-container-lowest);
    border-top: 1px solid var(--md-sys-color-surface-container-highest);
  }
  .lista li {
    border-bottom: 1px solid var(--md-sys-color-surface-container-highest);
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
    gap: 14px;
    text-align: left;
    color: var(--md-sys-color-on-surface-variant);
  }
  .total {
    width: 64px;
    height: 52px;
    flex: none;
    border-radius: var(--shape-s);
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-marcador);
    font-size: 30px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .txt {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .fecha {
    font-family: var(--font-marcador);
    font-size: 18px;
    line-height: 24px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--md-sys-color-on-surface);
  }
  .dist {
    flex: none;
    padding: 2px 8px;
    border-radius: var(--shape-s);
    border: 2px solid var(--md-sys-color-on-surface);
    font-family: var(--font-marcador);
    font-size: 16px;
    font-weight: 700;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;
    color: var(--md-sys-color-on-surface);
  }
</style>
