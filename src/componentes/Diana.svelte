<script lang="ts">
  import { geometria, puntuar, RADIO_FLECHA_MM, type TipoDiana } from '../lib/diana';
  import { centroGrupo, type Flecha } from '../lib/modelo';
  import Icono from './Icono.svelte';

  let {
    dianaCm,
    anteriores = [],
    actuales = [],
    interactiva = false,
    ampliable = false,
    seleccionada = -1,
    alMarcar,
  }: {
    dianaCm: TipoDiana;
    anteriores?: Flecha[];
    actuales?: Flecha[];
    interactiva?: boolean;
    /** Permite acercar con dos dedos (aunque la diana no esté marcando). */
    ampliable?: boolean;
    seleccionada?: number;
    alMarcar?: (f: Flecha) => void;
  } = $props();

  // Unidades del dibujo = mm de la diana real. En SVG la y crece hacia abajo; en los datos, hacia arriba.
  const g = $derived(geometria(dianaCm));
  const borde = $derived(g.radio * 1.05);
  const uid = `d${Math.random().toString(36).slice(2, 8)}`;

  const RELLENO = ['--diana-blanco', '--diana-blanco', '--diana-negro', '--diana-negro', '--diana-azul', '--diana-azul', '--diana-rojo', '--diana-rojo', '--diana-oro', '--diana-oro'];
  const anillos = $derived(
    Array.from({ length: 10 }, (_, i) => {
      const s = i + 1;
      return { s, r: (11 - s) * g.anillo, relleno: `var(${RELLENO[i]})`, linea: s === 4 ? '#fff' : '#231f20', tinta: s === 3 || s === 4 || s === 7 || s === 8 ? '#fff' : '#231f20' };
    }),
  );

  const centro = $derived(centroGrupo([...anteriores, ...actuales]));
  const tamMarca = $derived(g.anillo * 0.3);

  // ---- Zoom con dos dedos: se cambia el viewBox (cuadrado) ----
  const ZOOM_MAX = 5;
  let vista = $state<{ x: number; y: number; w: number } | null>(null);   // null = diana completa
  const v = $derived(vista ?? { x: -borde, y: -borde, w: borde * 2 });
  const caja = $derived(`${v.x} ${v.y} ${v.w} ${v.w}`);
  const conZoom = $derived(ampliable || interactiva);

  function encuadrar(x: number, y: number, w: number) {
    const total = borde * 2;
    w = Math.min(Math.max(w, total / ZOOM_MAX), total);
    if (w >= total * 0.98) { vista = null; return; }
    const lim = (c: number) => Math.min(Math.max(c, -borde), borde - w);
    vista = { x: lim(x), y: lim(y), w };
  }

  // ---- Marcado con lupa: presionar, arrastrar para afinar, soltar para fijar ----
  // La lupa es un cuadro fijo arriba a la izquierda; si el dedo pasa por debajo, salta a la derecha.
  let svg: SVGSVGElement;
  let punta = $state<{ x: number; y: number } | null>(null);   // coordenadas SVG
  let lado = $state<'izq' | 'der'>('izq');
  const LUPA = 0.36;        // lado de la lupa, fracción del ancho de la diana
  const ZONA = LUPA + 0.08; // margen para que la lupa no tape el dedo
  const AUMENTO = 3;        // respecto a lo que se ve en pantalla
  const ladoLupa = $derived(v.w * LUPA / AUMENTO);   // mm que muestra la lupa
  const cajaLupa = $derived(punta ? `${punta.x - ladoLupa / 2} ${punta.y - ladoLupa / 2} ${ladoLupa} ${ladoLupa}` : '');
  const hueco = RADIO_FLECHA_MM * 1.6;   // espacio libre en la cruz de la lupa
  const previa = $derived(punta ? puntuar(punta.x, -punta.y, dianaCm) : null);

  // Dedos sobre la diana; con dos se acerca/aleja y se desplaza
  const dedos = new Map<number, { x: number; y: number }>();
  let pellizco: { d: number; w: number; p: { x: number; y: number } } | null = null;
  let marcando = -1;   // pointerId del dedo que marca

  function aSVG(cx: number, cy: number) {
    const p = svg.createSVGPoint();
    p.x = cx; p.y = cy;
    const q = p.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: q.x, y: q.y };
  }
  function iniciarPellizco() {
    const [a, b] = [...dedos.values()];
    const r = svg.getBoundingClientRect();
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    pellizco = {
      d: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      w: v.w,
      p: { x: v.x + ((m.x - r.left) / r.width) * v.w, y: v.y + ((m.y - r.top) / r.height) * v.w },   // punto bajo los dedos
    };
  }
  function moverPellizco() {
    if (!pellizco) return;
    const [a, b] = [...dedos.values()];
    const r = svg.getBoundingClientRect();
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const w = pellizco.w * pellizco.d / (Math.hypot(a.x - b.x, a.y - b.y) || 1);
    const wc = Math.min(Math.max(w, (borde * 2) / ZOOM_MAX), borde * 2);
    // El punto que estaba bajo los dedos sigue bajo los dedos
    encuadrar(pellizco.p.x - ((m.x - r.left) / r.width) * wc, pellizco.p.y - ((m.y - r.top) / r.height) * wc, wc);
  }
  function ubicarLupa(e: PointerEvent) {
    const r = svg.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    if (fy > ZONA) return;
    if (lado === 'izq' && fx < ZONA) lado = 'der';
    else if (lado === 'der' && fx > 1 - ZONA) lado = 'izq';
  }

  function abajo(e: PointerEvent) {
    if (!conZoom && !interactiva) return;
    svg.setPointerCapture(e.pointerId);
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.size === 2 && conZoom) {
      punta = null;   // el segundo dedo cancela el marcado
      marcando = -1;
      iniciarPellizco();
    } else if (dedos.size === 1 && interactiva) {
      marcando = e.pointerId;
      lado = 'izq';
      ubicarLupa(e);
      punta = aSVG(e.clientX, e.clientY);
    }
  }
  function mover(e: PointerEvent) {
    if (!dedos.has(e.pointerId)) return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pellizco && dedos.size >= 2) moverPellizco();
    else if (e.pointerId === marcando && punta) {
      ubicarLupa(e);
      punta = aSVG(e.clientX, e.clientY);
    }
  }
  function soltar(e: PointerEvent, cancelado = false) {
    dedos.delete(e.pointerId);
    if (dedos.size < 2) pellizco = null;
    if (e.pointerId !== marcando) return;
    marcando = -1;
    const p = punta;
    punta = null;
    if (p && !cancelado) alMarcar?.({ ...puntuar(p.x, -p.y, dianaCm), pos: { x: p.x, y: -p.y } });
  }
</script>

{#snippet cara()}
  {#each anillos as a (a.s)}
    <circle r={a.r} fill={a.relleno} stroke={a.linea} stroke-width={g.anillo * 0.035} />
  {/each}
  <circle r={g.radioX} fill="none" stroke="#231f20" stroke-width={g.anillo * 0.025} />
  <path d={`M${-g.anillo * 0.12} 0H${g.anillo * 0.12}M0 ${-g.anillo * 0.12}V${g.anillo * 0.12}`} stroke="#231f20" stroke-width={g.anillo * 0.025} />
  {#each anillos as a (a.s)}
    <text x={(10.5 - a.s) * g.anillo} y={g.anillo * 0.13} text-anchor="middle" font-size={g.anillo * 0.38} fill={a.tinta} opacity=".7">{a.s}</text>
  {/each}
{/snippet}

{#snippet impactos()}
  {#each anteriores as f, i (i)}
    {#if f.pos}
      <circle cx={f.pos.x} cy={-f.pos.y} r={tamMarca * 0.5} fill="#231f20" fill-opacity=".3" stroke="#fff" stroke-opacity=".6" stroke-width={tamMarca * 0.1} />
    {/if}
  {/each}
  {#each actuales as f, i (i)}
    {#if f.pos}
      {#if i === seleccionada}
        <circle cx={f.pos.x} cy={-f.pos.y} r={tamMarca * 1.6} fill="none" class="sel" stroke-width={tamMarca * 0.3} />
      {/if}
      <circle cx={f.pos.x} cy={-f.pos.y} r={tamMarca} fill="#231f20" stroke="#fff" stroke-width={tamMarca * 0.2} />
      <text x={f.pos.x} y={-f.pos.y + tamMarca * 0.42} text-anchor="middle" font-size={tamMarca * 1.2} font-weight="700" fill="#fff">{i + 1}</text>
    {/if}
  {/each}
{/snippet}

<div class="marco">
  <svg
    bind:this={svg}
    viewBox={caja}
    class="diana"
    class:tactil={conZoom || interactiva}
    class:interactiva
    role={interactiva ? 'application' : 'img'}
    aria-label={interactiva ? `Diana de ${dianaCm} cm. Mantén presionado, ajusta y suelta para marcar una flecha. Pellizca con dos dedos para acercar.` : `Diana de ${dianaCm} cm con las flechas de la sesión`}
    onpointerdown={abajo}
    onpointermove={mover}
    onpointerup={(e) => soltar(e)}
    onpointercancel={(e) => soltar(e, true)}
  >
    <defs>
      <g id="{uid}-cara">{@render cara()}</g>
    </defs>
    <use href="#{uid}-cara" />
    {@render impactos()}
    {#if centro}
      {@const c = tamMarca * 0.9}
      <path class="centro" d={`M${centro.x - c} ${-centro.y - c}L${centro.x + c} ${-centro.y + c}M${centro.x + c} ${-centro.y - c}L${centro.x - c} ${-centro.y + c}`} stroke-width={tamMarca * 0.28} />
    {/if}
    {#if punta}
      <circle cx={punta.x} cy={punta.y} r={tamMarca} fill="none" stroke="#fff" stroke-width={tamMarca * 0.25} />
    {/if}
  </svg>

  {#if punta && previa}
    <div class="lupa {lado}" style:--lado="{LUPA * 100}%" aria-hidden="true">
      <svg viewBox={cajaLupa}>
        <rect x={punta.x - ladoLupa} y={punta.y - ladoLupa} width={ladoLupa * 2} height={ladoLupa * 2} fill="#fff" />
        <use href="#{uid}-cara" />
        {@render impactos()}
        <!-- círculo del tamaño real de la flecha -->
        <circle cx={punta.x} cy={punta.y} r={RADIO_FLECHA_MM} fill="none" stroke="#231f20" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        <path
          d={`M${punta.x - ladoLupa} ${punta.y}H${punta.x - hueco}M${punta.x + hueco} ${punta.y}H${punta.x + ladoLupa}M${punta.x} ${punta.y - ladoLupa}V${punta.y - hueco}M${punta.x} ${punta.y + hueco}V${punta.y + ladoLupa}`}
          stroke="#231f20" stroke-opacity=".5" stroke-width="1" vector-effect="non-scaling-stroke"
        />
      </svg>
      <span class="pastilla num">{previa.x ? 'X' : previa.puntaje === 0 ? 'M' : previa.puntaje}</span>
    </div>
  {/if}

  {#if vista}
    <button type="button" class="icbtn estado restablecer" aria-label="Ver la diana completa" onclick={() => (vista = null)}><Icono nombre="cerrar" /></button>
  {/if}
</div>

<style>
  .marco {
    position: relative; overflow: hidden;
    border-radius: var(--shape-m);
    background: var(--md-sys-color-surface-container-low);
  }
  .diana {
    width: 100%; max-width: 100%; height: auto; display: block;
    font-family: var(--font);
    user-select: none; -webkit-user-select: none;
  }
  .tactil { touch-action: none; }
  .interactiva { cursor: crosshair; }
  .centro { stroke: var(--md-sys-color-tertiary); stroke-linecap: round; fill: none; }
  .sel { stroke: var(--md-sys-color-tertiary); }

  .lupa {
    position: absolute; top: 8px; width: var(--lado); aspect-ratio: 1;
    border: 3px solid var(--md-sys-color-primary); border-radius: var(--shape-s);
    overflow: hidden; pointer-events: none; background: #fff;
    box-shadow: 0 2px 6px rgb(0 0 0 / .3);
  }
  .lupa.izq { left: 8px; }
  .lupa.der { right: 8px; }
  .lupa svg { width: 100%; height: 100%; display: block; font-family: var(--font); }
  .pastilla {
    position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
    min-width: 40px; padding: 2px 10px; border-radius: var(--shape-full); text-align: center;
    font-size: 18px; font-weight: 700; line-height: 24px;
    background: var(--md-sys-color-inverse-surface); color: var(--md-sys-color-inverse-on-surface);
  }
  .restablecer {
    position: absolute; right: 4px; bottom: 4px;
    background: var(--md-sys-color-surface-container-high); box-shadow: 0 1px 3px rgb(0 0 0 / .3);
  }
</style>
