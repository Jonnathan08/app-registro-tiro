<script lang="ts">
  import { geometria, puntuar, RADIO_FLECHA_MM, type TipoDiana } from '../lib/diana';
  import { centroGrupo, type Flecha } from '../lib/modelo';

  let {
    dianaCm,
    anteriores = [],
    actuales = [],
    interactiva = false,
    alMarcar,
  }: {
    dianaCm: TipoDiana;
    anteriores?: Flecha[];
    actuales?: Flecha[];
    interactiva?: boolean;
    alMarcar?: (f: Flecha) => void;
  } = $props();

  // Unidades del dibujo = mm de la diana real. En SVG la y crece hacia abajo; en los datos, hacia arriba.
  const g = $derived(geometria(dianaCm));
  const borde = $derived(g.radio * 1.05);
  const caja = $derived(`${-borde} ${-borde} ${borde * 2} ${borde * 2}`);
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

  // ---- Marcado con lupa: presionar, arrastrar para afinar, soltar para fijar ----
  let svg: SVGSVGElement;
  let punta = $state<{ x: number; y: number } | null>(null);   // coordenadas SVG
  const ZOOM = 3;
  const hueco = RADIO_FLECHA_MM * ZOOM * 1.6;   // espacio libre en la cruz de la lupa
  const radioLupa = $derived(g.radio * 0.26);
  const lupa = $derived.by(() => {
    if (!punta) return null;
    const sep = radioLupa * 1.9;
    let y = punta.y - sep;
    if (y - radioLupa < -borde) y = punta.y + sep;
    const x = Math.min(Math.max(punta.x, -borde + radioLupa), borde - radioLupa);
    return { x, y };
  });
  const previa = $derived(punta ? puntuar(punta.x, -punta.y, dianaCm) : null);

  function aSVG(e: PointerEvent) {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: q.x, y: q.y };
  }
  function abajo(e: PointerEvent) {
    if (!interactiva) return;
    svg.setPointerCapture(e.pointerId);
    punta = aSVG(e);
  }
  function mover(e: PointerEvent) {
    if (punta) punta = aSVG(e);
  }
  function arriba() {
    if (!punta) return;
    const { x, y } = punta;
    punta = null;
    alMarcar?.({ ...puntuar(x, -y, dianaCm), pos: { x, y: -y } });
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
      <circle cx={f.pos.x} cy={-f.pos.y} r={tamMarca} fill="#231f20" stroke="#fff" stroke-width={tamMarca * 0.2} />
      <text x={f.pos.x} y={-f.pos.y + tamMarca * 0.42} text-anchor="middle" font-size={tamMarca * 1.2} font-weight="700" fill="#fff">{i + 1}</text>
    {/if}
  {/each}
{/snippet}

<svg
  bind:this={svg}
  viewBox={caja}
  class="diana"
  class:interactiva
  role={interactiva ? 'application' : 'img'}
  aria-label={interactiva ? `Diana de ${dianaCm} cm. Mantén presionado, ajusta y suelta para marcar una flecha.` : `Diana de ${dianaCm} cm con las flechas de la sesión`}
  onpointerdown={abajo}
  onpointermove={mover}
  onpointerup={arriba}
  onpointercancel={() => (punta = null)}
>
  <defs>
    <g id="{uid}-cara">{@render cara()}</g>
    <clipPath id="{uid}-clip"><circle r={radioLupa} /></clipPath>
  </defs>
  <use href="#{uid}-cara" />
  {@render impactos()}
  {#if centro}
    {@const c = tamMarca * 0.9}
    <path class="centro" d={`M${centro.x - c} ${-centro.y - c}L${centro.x + c} ${-centro.y + c}M${centro.x + c} ${-centro.y - c}L${centro.x - c} ${-centro.y + c}`} stroke-width={tamMarca * 0.28} />
  {/if}

  {#if punta && lupa && previa}
    <circle cx={punta.x} cy={punta.y} r={tamMarca} fill="none" stroke="#fff" stroke-width={tamMarca * 0.25} />
    <g transform={`translate(${lupa.x} ${lupa.y})`}>
      <g clip-path="url(#{uid}-clip)">
        <rect x={-radioLupa} y={-radioLupa} width={radioLupa * 2} height={radioLupa * 2} fill="#fff" />
        <g transform={`scale(${ZOOM}) translate(${-punta.x} ${-punta.y})`}>
          <use href="#{uid}-cara" />
          {@render impactos()}
        </g>
      </g>
      <circle r={radioLupa} fill="none" class="borde-lupa" stroke-width={g.anillo * 0.08} />
      <!-- círculo del tamaño real de la flecha, ampliado -->
      <circle r={RADIO_FLECHA_MM * ZOOM} fill="none" stroke="#231f20" stroke-width={g.anillo * 0.03} />
      <path d={`M${-radioLupa} 0H${-hueco}M${hueco} 0H${radioLupa}M0 ${-radioLupa}V${-hueco}M0 ${hueco}V${radioLupa}`} stroke="#231f20" stroke-opacity=".5" stroke-width={g.anillo * 0.02} />
      <g transform={`translate(0 ${radioLupa + g.anillo * 0.55})`}>
        <rect x={-g.anillo * 0.6} y={-g.anillo * 0.4} width={g.anillo * 1.2} height={g.anillo * 0.8} rx={g.anillo * 0.4} class="pastilla" />
        <text y={g.anillo * 0.17} text-anchor="middle" font-size={g.anillo * 0.5} font-weight="700" class="pastilla-txt">{previa.x ? 'X' : previa.puntaje === 0 ? 'M' : previa.puntaje}</text>
      </g>
    </g>
  {/if}
</svg>

<style>
  .diana {
    width: 100%; max-width: 100%; height: auto; display: block;
    font-family: var(--font);
    border-radius: var(--shape-m);
    background: var(--md-sys-color-surface-container-low);
    user-select: none; -webkit-user-select: none;
  }
  .interactiva { touch-action: none; cursor: crosshair; }
  .centro { stroke: var(--md-sys-color-tertiary); stroke-linecap: round; fill: none; }
  .borde-lupa { stroke: var(--md-sys-color-primary); }
  .pastilla { fill: var(--md-sys-color-inverse-surface); }
  .pastilla-txt { fill: var(--md-sys-color-inverse-on-surface); }
</style>
