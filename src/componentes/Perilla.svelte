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
  let enCentro = false;

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
    enCentro = false;
    inicio = valor;
    girando = true;
  }
  function mover(e: PointerEvent) {
    if (!girando) return;
    const dx = e.clientX - centro.x,
      dy = e.clientY - centro.y;
    // Cerca del centro el ángulo salta: se ignora, y al salir se retoma desde ahí (sin sumar el salto)
    if (Math.hypot(dx, dy) < 24) {
      enCentro = true;
      return;
    }
    const a = Math.atan2(dy, dx);
    if (enCentro) {
      enCentro = false;
      ultimo = a;
      return;
    }
    acumulado += deltaAngulo(ultimo, a);
    ultimo = a;
    const pasos = pasosGirados(acumulado);
    poner(aplicarPasos(inicio, pasos));
    // Pasado un límite, el giro de más no se acumula: al girar al revés, el valor se mueve al momento
    const sinLimite = inicio + pasos * ELEVACION.paso;
    if (sinLimite < ELEVACION.min || sinLimite > ELEVACION.max) {
      inicio = valor;
      acumulado = 0;
    }
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

  // −/+: el paso se da al pulsar con el dedo y, si se mantiene, se repite (tras 400 ms, cada 100 ms). Con teclado,
  // TalkBack o Switch Access solo llega el clic: ahí se da el paso. Nunca `disabled` (perdería el foco y el
  // pointerup que corta la repetición): en el límite se marca con aria-disabled y la repetición se para sola.
  let espera: ReturnType<typeof setTimeout> | undefined;
  let repite: ReturnType<typeof setInterval> | undefined;
  let pulsado = false;
  let anunciado = $state('');
  let anuncio: ReturnType<typeof setTimeout> | undefined;
  const enLimite = (signo: 1 | -1) => (signo < 0 ? valor <= ELEVACION.min : valor >= ELEVACION.max);
  function paso(signo: 1 | -1) {
    if (enLimite(signo)) return parar();
    poner(aplicarPasos(valor, signo));
  }
  function anunciar() {
    clearTimeout(anuncio);
    anuncio = setTimeout(() => (anunciado = `Elevación ${textoElevacion(valor)}`), 500);
  }
  function pulsar(signo: 1 | -1) {
    clearTimeout(espera);
    clearInterval(repite);
    pulsado = true;
    paso(signo);
    espera = setTimeout(() => (repite = setInterval(() => paso(signo), 100)), 400);
  }
  function parar() {
    clearTimeout(espera);
    clearInterval(repite);
    anunciar();
  }
  function clic(signo: 1 | -1) {
    // El paso ya lo dio el pointerdown
    if (pulsado) {
      pulsado = false;
      return;
    }
    paso(signo);
    anunciar();
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
    aria-disabled={valor <= ELEVACION.min}
    onpointerdown={() => pulsar(-1)}
    onpointerup={parar}
    onpointerleave={parar}
    onpointercancel={parar}
    onclick={() => clic(-1)}
    oncontextmenu={(e) => e.preventDefault()}><Icono nombre="menos" /></button
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
    aria-disabled={valor >= ELEVACION.max}
    onpointerdown={() => pulsar(1)}
    onpointerup={parar}
    onpointerleave={parar}
    onpointercancel={parar}
    onclick={() => clic(1)}
    oncontextmenu={(e) => e.preventDefault()}><Icono nombre="sumar" /></button
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
    /* Mantener pulsado con el dedo o con dactilera no debe abrir el menú contextual ni cancelar la repetición */
    touch-action: none;
    -webkit-touch-callout: none;
    user-select: none;
  }
  .pm[aria-disabled='true'] {
    opacity: 0.38;
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
