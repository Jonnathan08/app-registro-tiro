<script lang="ts">
  import { aplicarPasos, deltaAngulo, ELEVACION, GRADOS_POR_PASO, pasosGirados, textoElevacion } from '../lib/mira';
  import Icono from './Icono.svelte';

  // Perilla de elevación: se gira arrastrando en círculo (cada 18° es un paso de 0,1), con −/+ a los lados y
  // con el teclado. El dibujo gira con el atributo transform del SVG (no con style: lo impide la CSP).
  let {
    valor = $bindable(),
    etiqueta = 'Perilla de elevación',
  }: {
    valor: number;
    etiqueta?: string;
  } = $props();

  const angulo = $derived(Math.round(valor / ELEVACION.paso) * GRADOS_POR_PASO);
  const RETENES = 360 / GRADOS_POR_PASO;

  let girando = $state(false);
  // Estado del arrastre en variables normales: no hace falta reactividad en cada movimiento
  let centro = { x: 0, y: 0 };
  let ultimo = 0;
  let acumulado = 0;
  let inicio = 0;

  const vibrar = () => navigator.vibrate?.(5);
  function poner(v: number) {
    if (v === valor) return;
    valor = v;
    vibrar();
  }

  function bajar(e: PointerEvent) {
    const el = e.currentTarget as SVGSVGElement;
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    centro = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    ultimo = Math.atan2(e.clientY - centro.y, e.clientX - centro.x);
    acumulado = 0;
    inicio = valor;
    girando = true;
  }
  function mover(e: PointerEvent) {
    if (!girando) return;
    const dx = e.clientX - centro.x,
      dy = e.clientY - centro.y;
    // Cerca del centro el ángulo salta: se ignora
    if (Math.hypot(dx, dy) < 24) return;
    const a = Math.atan2(dy, dx);
    acumulado += deltaAngulo(ultimo, a);
    ultimo = a;
    poner(aplicarPasos(inicio, pasosGirados(acumulado)));
  }
  const soltar = () => (girando = false);

  function tecla(e: KeyboardEvent) {
    const pasos = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
    if (pasos) valor = aplicarPasos(valor, pasos);
    else if (e.key === 'Home') valor = ELEVACION.min;
    else if (e.key === 'End') valor = ELEVACION.max;
    else return;
    e.preventDefault();
  }

  // −/+: un paso al pulsar y, si se mantiene, repetición (tras 400 ms, cada 100 ms)
  let espera: ReturnType<typeof setTimeout> | undefined;
  let repite: ReturnType<typeof setInterval> | undefined;
  let anunciado = $state('');
  let anuncio: ReturnType<typeof setTimeout> | undefined;
  function boton(signo: 1 | -1) {
    poner(aplicarPasos(valor, signo));
    espera = setTimeout(() => (repite = setInterval(() => poner(aplicarPasos(valor, signo)), 100)), 400);
  }
  function parar() {
    clearTimeout(espera);
    clearInterval(repite);
    // Con −/+ el foco no está en la perilla: se anuncia el valor al terminar
    clearTimeout(anuncio);
    anuncio = setTimeout(() => (anunciado = `Elevación ${textoElevacion(valor)}`), 500);
  }
  $effect(() => () => {
    clearTimeout(espera);
    clearInterval(repite);
    clearTimeout(anuncio);
  });
</script>

<div class="fila">
  <button
    type="button"
    class="btn contorno estado pm"
    aria-label="Bajar 0,1"
    disabled={valor <= ELEVACION.min}
    onpointerdown={() => boton(-1)}
    onpointerup={parar}
    onpointerleave={parar}
    onpointercancel={parar}
    onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), (valor = aplicarPasos(valor, -1)))}
    ><Icono nombre="menos" /></button
  >
  <svg
    class="perilla"
    class:girando
    viewBox="-100 -100 200 200"
    role="slider"
    tabindex="0"
    aria-label={etiqueta}
    aria-valuemin={ELEVACION.min}
    aria-valuemax={ELEVACION.max}
    aria-valuenow={valor}
    aria-valuetext={textoElevacion(valor)}
    onpointerdown={bajar}
    onpointermove={mover}
    onpointerup={soltar}
    onpointercancel={soltar}
    onlostpointercapture={soltar}
    onkeydown={tecla}
  >
    <path class="indice" d="M-8 -99 L8 -99 L0 -88 Z" />
    <g transform="rotate({angulo})">
      <circle class="aro" r="84" />
      {#each { length: RETENES }, i (i)}
        <line class="muesca" y1="-84" y2={i % 5 === 0 ? -70 : -74} transform="rotate({i * GRADOS_POR_PASO})" />
      {/each}
      <line class="aguja" y1="-80" y2="-52" />
      <circle class="tapa" r="28" />
    </g>
  </svg>
  <button
    type="button"
    class="btn contorno estado pm"
    aria-label="Subir 0,1"
    disabled={valor >= ELEVACION.max}
    onpointerdown={() => boton(1)}
    onpointerup={parar}
    onpointerleave={parar}
    onpointercancel={parar}
    onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), (valor = aplicarPasos(valor, 1)))}
    ><Icono nombre="sumar" /></button
  >
  <span class="oculto" aria-live="polite">{anunciado}</span>
</div>

<style>
  .fila {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }
  .pm {
    width: 56px;
    height: 56px;
    min-height: 56px;
    padding: 0;
    flex: none;
  }
  .perilla {
    width: 168px;
    height: 168px;
    flex: none;
    /* El arrastre no desplaza la hoja ni cambia de pestaña */
    touch-action: none;
    cursor: grab;
    border-radius: 50%;
  }
  .perilla.girando {
    cursor: grabbing;
  }
  .perilla:focus-visible {
    outline: 3px solid var(--md-sys-color-primary);
    outline-offset: 3px;
  }
  .indice {
    fill: var(--md-sys-color-on-surface);
  }
  .aro {
    fill: var(--md-sys-color-surface-container-highest);
    stroke: var(--md-sys-color-on-surface);
    stroke-width: 2;
  }
  .girando .aro {
    stroke: var(--md-sys-color-primary);
    stroke-width: 3;
  }
  .muesca {
    stroke: var(--md-sys-color-on-surface-variant);
    stroke-width: 2.4;
  }
  .aguja {
    stroke: var(--md-sys-color-primary);
    stroke-width: 5;
    stroke-linecap: round;
  }
  .tapa {
    fill: var(--md-sys-color-surface-container-lowest);
    stroke: var(--md-sys-color-outline-variant);
    stroke-width: 1;
  }
</style>
