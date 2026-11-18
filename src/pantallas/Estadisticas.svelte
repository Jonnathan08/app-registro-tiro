<script lang="ts" module>
  import type { Filtro } from '../lib/estadisticas';
  // Se conserva entre visitas mientras la app está abierta
  let recordado: Filtro = { periodo: 'todo', clave: null };
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import Barra from '../componentes/Barra.svelte';
  import Icono from '../componentes/Icono.svelte';
  import MapaCalor from '../componentes/MapaCalor.svelte';
  import Marcador, { type Cifra } from '../componentes/Marcador.svelte';
  import { describir, describirLeido, densidad, maximo, MIN_CALOR, puntosNormalizados } from '../lib/calor';
  import {
    conteoZonas,
    filtrar,
    flechasPorSemana,
    mejores,
    MIN_FLECHAS_RONDA,
    MIN_FLECHAS_SESION,
    promedioSemanal,
    proporcion,
    totales,
    type Marca,
    type Periodo,
  } from '../lib/estadisticas';
  import { estado } from '../lib/estado.svelte';
  import { dosDecimales, fechaCorta, fechaLarga, porcentaje } from '../lib/formato';
  import { mediaPuntos, todasLasFlechas } from '../lib/modelo';
  import { gruposProgreso } from '../lib/progreso';

  const ahora = new Date();
  let periodo = $state<Periodo>(recordado.periodo);
  let clave = $state<string | null>(recordado.clave);

  // Distancias de todo el historial: no cambian al cambiar de periodo (no se mueven bajo el dedo)
  const grupos = $derived(gruposProgreso(estado.historial));
  const grupo = $derived(grupos.find((g) => g.k === clave) ?? null);
  // Si la distancia elegida ya no está (p. ej. se borró su última sesión), se ven todas
  const claveEfectiva = $derived(grupo ? clave : null);
  $effect(() => {
    recordado = { periodo, clave };
  });

  const PERIODOS: { p: Periodo; texto: string; largo: string }[] = [
    { p: 30, texto: '30 días', largo: 'Últimos 30 días' },
    { p: 90, texto: '90 días', largo: 'Últimos 90 días' },
    { p: 'todo', texto: 'Todo', largo: 'Todo el periodo' },
  ];
  const resumenFiltro = $derived(
    `${PERIODOS.find((x) => x.p === periodo)!.largo} · ${grupo ? grupo.texto : 'todas las distancias'}`,
  );

  const filtradas = $derived(filtrar(estado.historial, { periodo, clave: claveEfectiva }, ahora));
  const flechas = $derived(filtradas.flatMap(todasLasFlechas));
  const t = $derived(totales(filtradas));
  const m = $derived(mejores(filtradas));
  const zonas = $derived(conteoZonas(flechas));
  const maxZona = $derived(Math.max(1, ...zonas.map((z) => z.n)));

  const cifras: Cifra[] = $derived([
    { rotulo: 'Sesiones', valor: t.sesiones },
    { rotulo: 'Flechas', valor: t.flechas },
    t.flechas
      ? { rotulo: 'Prom.', rotuloLeido: 'Promedio por flecha', valor: dosDecimales(t.promedio), acento: true }
      : { rotulo: 'Prom.', rotuloLeido: 'Promedio por flecha', valor: '–', leido: 'sin datos', acento: true },
  ]);

  // ---- Agrupación ----
  const N = 64;
  const puntos = $derived(puntosNormalizados(filtradas));
  const dens = $derived(puntos.length >= MIN_CALOR ? densidad(puntos, N) : null);
  const centro = $derived(mediaPuntos(puntos));
  const caliente = $derived(dens ? maximo(dens, N) : null);
  const dianas = $derived(
    [...new Set(filtradas.filter((s) => todasLasFlechas(s).some((f) => f.pos)).map((s) => s.dianaCm))].sort(
      (a, b) => b - a,
    ),
  );
  const listaY = new Intl.ListFormat('es', { type: 'conjunction' });
  const notaMapa = $derived(
    (puntos.length === t.flechas
      ? `${puntos.length} flechas, todas marcadas en la diana.`
      : `${puntos.length} de ${t.flechas} flechas: solo cuentan las marcadas en la diana.`) +
      (dianas.length > 1 ? ` Dianas de ${listaY.format(dianas.map(String))} cm superpuestas a escala.` : ''),
  );

  // ---- Flechas por semana: últimas 12, sin importar el periodo; sí la distancia ----
  const ALTO = 120;
  const deDistancia = $derived(filtrar(estado.historial, { periodo: 'todo', clave: claveEfectiva }, ahora));
  const semanas = $derived(flechasPorSemana(deDistancia, ahora));
  const primera = $derived.by(() => {
    const ts = deDistancia.map((s) => Date.parse(s.fecha)).filter((x) => !Number.isNaN(x));
    return ts.length ? new Date(Math.min(...ts)) : null;
  });
  const promSemana = $derived(promedioSemanal(semanas, primera));
  const maxSemana = $derived(Math.max(1, promSemana ?? 0, ...semanas.map((w) => w.flechas)));
  const estaSemana = $derived(semanas.at(-1)!.flechas);
  // Solo si hay con qué comparar: con una única semana con flechas no dice nada
  const semanaRecord = $derived(
    estaSemana > 0 &&
      semanas.slice(0, -1).some((w) => w.flechas > 0) &&
      semanas.slice(0, -1).every((w) => w.flechas < estaSemana),
  );
  const textoSemanas = $derived(
    [
      ...(semanas.every((w) => !w.flechas)
        ? ['Sin flechas en las últimas 12 semanas.']
        : [
            `Esta semana: ${estaSemana} flechas.`,
            promSemana !== null ? `Promedio de las semanas anteriores: ${Math.round(promSemana)}.` : '',
            semanaRecord ? 'Tu semana con más flechas de las últimas 12.' : '',
          ]),
      'Últimas 12 semanas, sin importar el periodo elegido.',
    ]
      .filter(Boolean)
      .join(' '),
  );

  // ---- Récords ----
  interface Casilla {
    rotulo: string;
    rotuloLeido?: string;
    marca: Marca | null;
    linea?: (m: Marca) => string;
    vacio: string;
  }
  const casillas: Casilla[] = $derived([
    {
      rotulo: 'Mejor sesión',
      marca: m.sesion,
      linea: (x) => `${porcentaje(proporcion(x))} · ${dosDecimales(x.valor / (x.maximo! / 10))} por flecha`,
      vacio: `Ninguna sesión de ${MIN_FLECHAS_SESION} flechas o más`,
    },
    {
      rotulo: 'Mejor ronda',
      marca: m.ronda,
      linea: (x) => `${porcentaje(proporcion(x))} · ronda ${x.ronda}`,
      vacio: `Ninguna ronda de ${MIN_FLECHAS_RONDA} flechas o más`,
    },
    { rotulo: 'Más X', rotuloLeido: 'Más X en una sesión', marca: m.x, vacio: 'Sin X todavía' },
    {
      rotulo: 'Más 10+X',
      rotuloLeido: 'Más dieces en una sesión, con las X',
      marca: m.dieces,
      vacio: 'Ningún 10 todavía',
    },
  ]);

  async function verTodo() {
    periodo = 'todo';
    await tick();
    document.querySelector<HTMLElement>('[data-periodo="todo"]')?.focus();
  }
</script>

<Barra titulo="Estadísticas" subtitulo={grupos.length ? resumenFiltro : undefined} fija />

{#if !grupos.length}
  <div class="vacio">
    <Icono nombre="estadisticas" clase="grande" />
    <h2 class="sec">Todavía no hay estadísticas</h2>
    <p class="t-body-s">
      Cuando guardes tu primera sesión verás aquí tus récords, tu agrupación y cuántas flechas tiras cada semana.
    </p>
  </div>
{:else}
  <section class="tablero filtros" aria-label="Filtros">
    <div class="chips" role="group" aria-label="Periodo">
      {#each PERIODOS as x (x.p)}
        <button
          type="button"
          class="chip-tablero estado"
          data-periodo={x.p}
          aria-pressed={periodo === x.p}
          onclick={() => (periodo = x.p)}>{x.texto}</button
        >
      {/each}
    </div>
    {#if grupos.length > 1}
      <div class="chips" role="group" aria-label="Distancia">
        <button
          type="button"
          class="chip-tablero estado"
          aria-pressed={claveEfectiva === null}
          onclick={() => (clave = null)}>Todas</button
        >
        {#each grupos as g (g.k)}
          <button
            type="button"
            class="chip-tablero estado"
            aria-pressed={claveEfectiva === g.k}
            onclick={() => (clave = g.k)}>{g.texto}</button
          >
        {/each}
      </div>
    {/if}
  </section>
  <Marcador {cifras} etiqueta="Resumen" />

  <div class="cuerpo">
    {#if !filtradas.length}
      <div class="sin-datos">
        <p class="t-body-s">
          Sin sesiones{grupo ? ` a ${grupo.texto}` : ''}{periodo === 'todo' ? '' : ` en los últimos ${periodo} días`}.
        </p>
        {#if periodo !== 'todo'}
          <button type="button" class="btn contorno estado" onclick={verTodo}>Ver todo el periodo</button>
        {/if}
      </div>
    {:else}
      <section aria-labelledby="t-records">
        <h2 id="t-records" class="sec">Récords</h2>
        <dl class="records">
          {#each casillas as k (k.rotulo)}
            <div class="record">
              <dt class="t-rotulo">
                {#if k.rotuloLeido}<span aria-hidden="true">{k.rotulo}</span><span class="oculto">{k.rotuloLeido}</span
                  >{:else}{k.rotulo}{/if}
              </dt>
              {#if k.marca}
                {@const x = k.marca}
                <dd class="t-cifra-l valor">
                  {x.valor}{#if x.maximo}<span class="de" aria-hidden="true">/{x.maximo}</span><span class="oculto">
                      de {x.maximo}</span
                    >{/if}
                </dd>
                {#if k.linea}<dd class="t-body-s num">{k.linea(x)}</dd>{/if}
                <dd class="t-body-s num">
                  {x.sesion.distanciaM} m · {x.sesion.dianaCm} cm ·
                  <span class="sin-corte">{fechaCorta(x.sesion.fecha)}</span>
                </dd>
              {:else}
                <dd class="t-cifra-l valor"><span aria-hidden="true">–</span><span class="oculto">sin datos</span></dd>
                <dd class="t-body-s">{k.vacio}</dd>
              {/if}
            </div>
          {/each}
        </dl>
      </section>

      <section aria-labelledby="t-agrupacion">
        <h2 id="t-agrupacion" class="sec">Agrupación</h2>
        {#if !puntos.length}
          <p class="t-body-s">
            Ninguna flecha de este periodo se marcó en la diana. El mapa usa solo las marcadas: las del teclado no
            tienen posición.
          </p>
        {:else}
          <MapaCalor
            {puntos}
            {dens}
            n={N}
            {centro}
            etiqueta={dens
              ? `Mapa de calor de ${puntos.length} flechas sobre la diana`
              : `${puntos.length} impactos sobre la diana`}
          />
          {#if dens}
            <div class="leyenda" aria-hidden="true">
              <span>Menos</span><span class="escala"></span><span>Más</span>
            </div>
          {:else}
            <p class="t-body-s centrado">Pocas flechas para un mapa de calor: se muestran los impactos.</p>
          {/if}
          <dl class="lectura">
            {#if centro}
              <div>
                <dt>Centro del grupo</dt>
                <dd class="num">
                  <span aria-hidden="true">{describir(centro)}</span><span class="oculto">{describirLeido(centro)}</span
                  >
                </dd>
              </div>
            {/if}
            {#if caliente}
              <div>
                <dt>Más impactos</dt>
                <dd class="num">
                  <span aria-hidden="true">{describir(caliente)}</span><span class="oculto"
                    >{describirLeido(caliente)}</span
                  >
                </dd>
              </div>
            {/if}
          </dl>
          <p class="t-body-s">{notaMapa}</p>
        {/if}
      </section>

      <section aria-labelledby="t-zonas">
        <h2 id="t-zonas" class="sec">Puntos por zona</h2>
        <ul class="zonas">
          {#each zonas as z (z.etiqueta)}
            {@const p = porcentaje(t.flechas ? z.n / t.flechas : 0)}
            <li>
              <span class="ficha z-{z.zona}" aria-hidden="true">{z.etiqueta}</span>
              <span class="pista" aria-hidden="true"
                >{#if z.n}<span class="barra z-{z.zona}" style:width="{(z.n / maxZona) * 100}%"></span>{/if}</span
              >
              <span class="cuenta num" aria-hidden="true">{z.n} · {p}</span>
              <span class="oculto">{z.etiqueta === 'M' ? 'Fallos' : z.etiqueta}: {z.n} flechas, {p}</span>
            </li>
          {/each}
        </ul>
        <p class="t-body-s">Cuenta todas las flechas, también las del teclado.</p>
      </section>
    {/if}

    <section aria-labelledby="t-semanas">
      <h2 id="t-semanas" class="sec">Flechas por semana</h2>
      <div class="semanas" aria-hidden="true" style:height="{ALTO + 22}px">
        {#if promSemana !== null}
          <div class="ref" style:bottom="{22 + (promSemana / maxSemana) * ALTO}px">
            <span>Prom. {Math.round(promSemana)}</span>
          </div>
        {/if}
        {#each semanas as w, i (w.inicio.getTime())}
          <div class="col">
            <span
              class="b"
              class:actual={i === semanas.length - 1}
              style:height="{w.flechas ? Math.max(2, (w.flechas / maxSemana) * ALTO) : 0}px"
            ></span>
            <span class="et"
              >{i === semanas.length - 1 ? 'Esta sem.' : i % 4 === 0 ? fechaCorta(w.inicio.toISOString()) : ''}</span
            >
          </div>
        {/each}
      </div>
      <div class="tabla">
        <table class="oculto">
          <caption>Flechas por semana</caption>
          <thead><tr><th scope="col">Semana del</th><th scope="col">Flechas</th></tr></thead>
          <tbody>
            {#each semanas as w (w.inicio.getTime())}
              <tr><td>{fechaLarga(w.inicio.toISOString())}</td><td>{w.flechas}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="t-body-s">
        {textoSemanas}
      </p>
    </section>
  </div>
{/if}

<style>
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
  .filtros {
    background: var(--tablero-fondo);
    color: var(--tablero-texto);
    padding: 0 16px 4px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .cuerpo {
    display: flex;
    flex-direction: column;
    gap: 28px;
    padding: 20px 16px 24px;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  section h2.sec {
    margin: 0;
  }
  p {
    margin: 0;
  }
  .sin-datos {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  /* Récords */
  .records {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
  }
  .record {
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border: 2px solid var(--md-sys-color-on-surface);
    border-radius: var(--shape-s);
    background: var(--md-sys-color-surface-container-lowest);
  }
  .record dt {
    color: var(--md-sys-color-on-surface-variant);
  }
  .record dd {
    margin: 0;
  }
  .valor {
    color: var(--md-sys-color-primary);
  }
  .de {
    font-size: 0.6em;
    color: var(--md-sys-color-on-surface-variant);
  }

  /* Agrupación */
  .leyenda {
    display: flex;
    align-items: center;
    gap: 8px;
    width: min(100%, 260px);
    margin: 0 auto;
    font-size: 12px;
    line-height: 16px;
    color: var(--md-sys-color-on-surface-variant);
  }
  .escala {
    flex: 1;
    height: 10px;
    border-radius: 5px;
    border: 1px solid var(--md-sys-color-on-surface);
    /* Colores fijos de la diana, como el mapa (calor.ts) */
    background: linear-gradient(
      90deg,
      var(--diana-negro),
      var(--diana-azul),
      var(--diana-rojo),
      var(--diana-oro),
      var(--diana-blanco)
    );
  }
  .centrado {
    text-align: center;
  }
  .lectura {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
  }
  .lectura div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .lectura dt {
    color: var(--md-sys-color-on-surface-variant);
  }
  .lectura dd {
    margin: 0;
    font-weight: 500;
  }

  /* Puntos por zona */
  .zonas {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .zonas li {
    position: relative;
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    min-height: 28px;
  }
  .ficha {
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--md-sys-color-on-surface);
    border-radius: var(--shape-xs);
    font-family: var(--font-marcador);
    font-weight: 700;
    font-size: 15px;
  }
  .pista {
    display: flex;
    height: 14px;
  }
  .barra {
    height: 14px;
    min-width: 6px;
    border: 2px solid var(--md-sys-color-on-surface);
    border-radius: 3px;
    box-shadow: none;
  }
  .cuenta {
    font-family: var(--font-marcador);
    font-weight: 600;
    font-size: 16px;
    text-align: right;
  }

  /* Flechas por semana */
  /* Margen a la derecha para el rótulo del promedio: así nunca tapa una barra */
  .semanas {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 6px;
    padding-right: 58px;
  }
  .col {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
  }
  .b {
    width: 100%;
    background: var(--md-sys-color-primary);
    border-radius: var(--shape-xs) var(--shape-xs) 0 0;
  }
  .b.actual {
    background: var(--diana-oro);
    border: 2px solid var(--md-sys-color-on-surface);
    border-bottom: 0;
  }
  .et {
    height: 18px;
    font-size: 12px;
    line-height: 18px;
    white-space: nowrap;
    color: var(--md-sys-color-on-surface-variant);
  }
  .col:first-child .et {
    align-self: flex-start;
  }
  .col:last-child .et {
    align-self: flex-end;
  }
  .semanas::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 22px;
    border-top: 2px solid var(--md-sys-color-on-surface);
  }
  .ref {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 1;
    border-top: 2px dashed var(--md-sys-color-on-surface-variant);
  }
  .ref span {
    position: absolute;
    right: 0;
    bottom: 2px;
    font-family: var(--font-marcador);
    font-weight: 600;
    font-size: 13px;
    line-height: 16px;
    white-space: nowrap;
    color: var(--md-sys-color-on-surface-variant);
  }
  .sin-corte {
    white-space: nowrap;
  }
  /* Contenedor posicionado de la tabla oculta: si no, ensancha la página */
  .tabla {
    position: relative;
  }
</style>
