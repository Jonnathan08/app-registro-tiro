<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Diana from '../componentes/Diana.svelte';
  import Dialogo from '../componentes/Dialogo.svelte';
  import EditarRonda from '../componentes/EditarRonda.svelte';
  import LibretaMira from '../componentes/LibretaMira.svelte';
  import Hoja from '../componentes/Hoja.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Marcador, { type Cifra } from '../componentes/Marcador.svelte';
  import Notas from '../componentes/Notas.svelte';
  import Resumen from '../componentes/Resumen.svelte';
  import Teclado from '../componentes/Teclado.svelte';
  import { tick } from 'svelte';
  import { fly } from 'svelte/transition';
  import { capa } from '../lib/atras';
  import { ayudaNueva, contarMarca } from '../lib/ayuda';
  import { etiqueta, zona } from '../lib/diana';
  import { estado } from '../lib/estado.svelte';
  import {
    esLibre,
    NOMBRE_PERFIL,
    rondaEnCurso,
    rondaGuardable,
    rondaLlena,
    suma,
    todasGuardadas,
    totalCerrado,
    type Flecha,
    type Sesion,
  } from '../lib/modelo';

  let { sesion }: { sesion: Sesion } = $props();

  // Índice de la flecha recién anotada: solo esa hace el pop (deshacer, guardar o volver de Hoja no animan)
  let nueva = $state<number | null>(null);
  function anotar(f: Flecha) {
    nueva = sesion.enCurso.length;
    estado.marcar(f);
  }

  let entrada = $state<'diana' | 'manual'>('diana');
  let menu = $state(false);
  let libreta = $state(false);
  let anclaMenu = $state<HTMLElement>();

  // El menú se cierra al tocar fuera de él, con Escape o con el botón atrás de Android.
  // Con Escape o atrás el foco vuelve al botón ⋮ (si no, quedaría en la página).
  const focoMenu = () => anclaMenu?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
  const cerrarMenu = () => {
    menu = false;
    focoMenu();
  };
  $effect(() => {
    if (!menu) return;
    const fuera = (e: PointerEvent) => !anclaMenu?.contains(e.target as Node) && (menu = false);
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && cerrarMenu();
    addEventListener('pointerdown', fuera);
    addEventListener('keydown', escape);
    const quitarCapa = capa(cerrarMenu);
    return () => {
      removeEventListener('pointerdown', fuera);
      removeEventListener('keydown', escape);
      quitarCapa();
    };
  });
  // La ayuda de la diana se ve sola mientras es nueva; después, con el botón ⓘ
  let verAyuda = $state(ayudaNueva());
  let confirmarTerminar = $state(false);
  let confirmarDescartar = $state(false);
  let editando = $state<number | null>(null);
  let pagina = $state<'anotar' | 'hoja'>('anotar');

  // Abre la pestaña Hoja y baja hasta las notas
  async function irANotas() {
    ir('hoja');
    await tick();
    const n = document.getElementById('notas-personales');
    n?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    n?.focus({ preventScroll: true });
  }

  function ir(p: 'anotar' | 'hoja') {
    if (p === pagina) return;
    pagina = p;
    scrollTo(0, 0);
  }

  // Deslizamiento horizontal: al menos 60 px de lado y más horizontal que vertical
  let deslizar: { x: number; y: number } | null = null;
  function inicioDeslizar(e: TouchEvent) {
    const t = e.target as Element;
    deslizar =
      e.touches.length > 1 || t.closest('.marco, textarea, input, .hoja')
        ? null
        : { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function finDeslizar(e: TouchEvent) {
    if (!deslizar) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - deslizar.x,
      dy = p.clientY - deslizar.y;
    deslizar = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    ir(dx < 0 ? 'hoja' : 'anotar');
  }

  const completa = $derived(todasGuardadas(sesion));
  const llena = $derived(rondaLlena(sesion));
  const anteriores = $derived(sesion.registro.flatMap((r) => r.flechas));
  const sumaActual = $derived(suma(sesion.enCurso));
  // La pestaña Hoja resume las rondas guardadas, como «Sesión» en el tablero
  const guardadas = $derived({ ...sesion, enCurso: [] });
  const perfil = $derived(NOMBRE_PERFIL[sesion.perfil]);
  const libre = $derived(esLibre(sesion));
  // Tablero: ronda que se tira, puntos de esa ronda y total de las rondas guardadas
  const cifras = $derived<Cifra[]>([
    {
      rotulo: 'Ronda',
      valor: rondaEnCurso(sesion),
      sufijo: libre ? undefined : `/${sesion.rondas}`,
      sufijoLeido: libre ? undefined : ` de ${sesion.rondas}`,
    },
    {
      rotulo: 'Esta ronda',
      valor: completa ? '–' : sumaActual,
      leido: completa ? 'sin ronda en curso' : undefined,
      acento: true,
    },
    { rotulo: 'Sesión', valor: totalCerrado(sesion) },
  ]);
  // En Libre la tira es una sola fila que se desplaza y siempre muestra la última flecha
  let tira = $state<HTMLElement>();
  let desplazada = $state(false);
  $effect(() => {
    void sesion.enCurso.length;
    if (libre) tira?.scrollTo({ left: tira.scrollWidth });
  });

  // En Libre se muestran las flechas tiradas más un hueco para la siguiente
  const huecos = $derived(libre ? sesion.enCurso.length + (llena ? 0 : 1) : sesion.flechasPorRonda);
</script>

<Barra variante="contexto" titulo="{perfil} · {sesion.distanciaM} m · Diana {sesion.dianaCm} cm">
  {perfil} · {sesion.distanciaM} m · Diana {sesion.dianaCm}<span class="oculto"> cm</span>
  {#snippet fin()}
    {#if pagina === 'anotar' && !completa}
      {#if entrada === 'diana'}
        <button
          type="button"
          class="icbtn estado"
          aria-label="Cómo marcar en la diana"
          aria-expanded={verAyuda}
          aria-controls="ayuda-diana"
          onclick={() => (verAyuda = !verAyuda)}><Icono nombre="info" /></button
        >
      {/if}
      <button
        type="button"
        class="icbtn estado"
        aria-label={entrada === 'diana' ? 'Cambiar a teclado manual' : 'Cambiar a la diana'}
        onclick={() => (entrada = entrada === 'diana' ? 'manual' : 'diana')}
        ><Icono nombre={entrada === 'diana' ? 'teclado' : 'diana'} /></button
      >
    {/if}
    <div class="menu-ancla" bind:this={anclaMenu}>
      <button
        type="button"
        class="icbtn estado"
        aria-label="Opciones de la sesión"
        aria-haspopup="menu"
        aria-expanded={menu}
        onclick={() => (menu = !menu)}><Icono nombre="mas" /></button
      >
      {#if menu}
        <div class="menu" role="menu">
          <button
            type="button"
            role="menuitem"
            class="estado"
            onclick={() => {
              menu = false;
              libreta = true;
            }}>Marcas de mira</button
          >
          <button
            type="button"
            role="menuitem"
            class="estado"
            onclick={() => {
              menu = false;
              confirmarTerminar = true;
            }}>Terminar sesión ahora</button
          >
          <button
            type="button"
            role="menuitem"
            class="estado peligro"
            onclick={() => {
              menu = false;
              confirmarDescartar = true;
            }}>Descartar sesión</button
          >
        </div>
      {/if}
    </div>
  {/snippet}
</Barra>

<Marcador {cifras} etiqueta="Marcador de la sesión" />

<div class="pestanas tablero" role="tablist" aria-label="Páginas de la sesión">
  <button
    type="button"
    role="tab"
    id="tab-anotar"
    aria-controls="pag-anotar"
    aria-selected={pagina === 'anotar'}
    class="estado"
    onclick={() => ir('anotar')}>Anotar</button
  >
  <button
    type="button"
    role="tab"
    id="tab-hoja"
    aria-controls="pag-hoja"
    aria-selected={pagina === 'hoja'}
    class="estado"
    onclick={() => ir('hoja')}
  >
    Hoja{#if sesion.registro.length}<span aria-hidden="true">&nbsp;· {sesion.registro.length}</span><span class="oculto"
        >, {sesion.registro.length} {sesion.registro.length === 1 ? 'ronda guardada' : 'rondas guardadas'}</span
      >{/if}
  </button>
</div>

<!-- Deslizar de lado cambia de página (salvo sobre la diana, que usa los gestos para marcar). Es un atajo: las pestañas son la vía accesible. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="cuerpo"
  class:con-acciones={pagina === 'anotar' && !completa}
  ontouchstart={inicioDeslizar}
  ontouchend={finDeslizar}
  ontouchcancel={() => (deslizar = null)}
>
  {#if pagina === 'anotar'}
    <div id="pag-anotar" role="tabpanel" aria-labelledby="tab-anotar" class="pagina" in:fly={{ x: -40, duration: 150 }}>
      {#if !completa}
        <section class="tira" aria-label="Ronda actual, {sumaActual} puntos">
          <div
            class="flechas num"
            class:libre
            class:desplazada
            bind:this={tira}
            onscroll={() => (desplazada = !!tira && tira.scrollLeft > 0)}
            style:--cols={libre ? 6 : Math.min(sesion.flechasPorRonda, 6)}
          >
            {#each { length: huecos } as _, i (i)}
              {@const f = sesion.enCurso[i]}
              {#if f}
                <span class="flecha z-{zona(f.puntaje)}" class:pop={i === nueva} onanimationend={() => (nueva = null)}
                  >{etiqueta(f)}</span
                >
              {:else}
                <!-- Los huecos numerados no se leen: se confundirían con puntajes -->
                <span class="flecha vacia" class:siguiente={i === sesion.enCurso.length} aria-hidden="true"
                  >{i + 1}</span
                >
              {/if}
            {/each}
          </div>
        </section>

        {#if entrada === 'diana'}
          <div class="diana-wrap">
            <Diana
              dianaCm={sesion.dianaCm}
              {anteriores}
              actuales={sesion.enCurso}
              interactiva={!llena}
              ampliable
              alMarcar={(f) => {
                contarMarca();
                anotar(f);
              }}
            />
            <p class="ayuda leyenda">
              <span><i class="tenue"></i>Rondas anteriores</span>
              <span
                ><svg class="cruz" viewBox="-6 -6 12 12" aria-hidden="true"
                  ><path d="M-4 -4L4 4M4 -4L-4 4" class="fondo" /><path d="M-4 -4L4 4M4 -4L-4 4" /></svg
                >Centro del grupo</span
              >
            </p>
            <p id="ayuda-diana" class="ayuda" hidden={!verAyuda}>
              Mantén presionado, ajusta con la lupa y suelta. Pellizca para acercar.
            </p>
          </div>
        {:else}
          <Teclado deshabilitado={llena} alTocar={(puntaje, x) => anotar({ puntaje, x, pos: null })} />
        {/if}
      {:else}
        <section class="tarjeta">
          <h2 class="sec">Rondas completas</h2>
          <span class="t-title-m">Terminaste las {sesion.rondas} rondas</span>
          <p class="t-body-s">
            Agrega las notas en la pestaña <b>Hoja</b> y termina: después quedan bloqueadas. Podrás exportarla desde el historial.
          </p>
          <div class="acciones">
            <button type="button" class="btn lleno grande estado" onclick={() => estado.terminar()}
              ><Icono nombre="check" />Terminar y guardar</button
            >
            <button type="button" class="btn contorno estado" onclick={irANotas}>Ir a las notas</button>
          </div>
        </section>
      {/if}
    </div>
  {:else}
    <div id="pag-hoja" role="tabpanel" aria-labelledby="tab-hoja" class="pagina" in:fly={{ x: 40, duration: 150 }}>
      <Resumen sesion={guardadas} etiqueta="Resumen de las rondas guardadas" />

      <h2 class="sec">Hoja de puntuación</h2>
      {#if sesion.registro.length}
        <Hoja registro={sesion.registro} alEditar={(i) => (editando = i)} />
      {:else}
        <p class="t-body-s vacio">Todavía no hay rondas guardadas.</p>
      {/if}

      <Notas {sesion} alCambiar={() => estado.notas()} />

      {#if completa}
        <button type="button" class="btn lleno grande estado" onclick={() => estado.terminar()}
          ><Icono nombre="check" />Terminar y guardar</button
        >
      {:else}
        <button type="button" class="btn contorno grande estado" onclick={() => (confirmarTerminar = true)}
          ><Icono nombre="check" />Terminar sesión</button
        >
      {/if}
    </div>
  {/if}
</div>

{#if pagina === 'anotar' && !completa}
  <!-- Fija sobre la navegación inferior, al alcance del pulgar -->
  <div class="acciones-fijas">
    <div class="dentro">
      <button
        type="button"
        class="btn contorno grande estado"
        disabled={!sesion.enCurso.length}
        onclick={() => estado.deshacer()}><Icono nombre="deshacer" />Deshacer</button
      >
      <button
        type="button"
        class="btn lleno grande estado"
        disabled={!rondaGuardable(sesion)}
        onclick={() => estado.guardarRonda()}><Icono nombre="check" />Guardar ronda</button
      >
    </div>
  </div>
{/if}

{#if editando !== null}
  {#key editando}
    <EditarRonda
      numero={editando + 1}
      flechas={sesion.registro[editando].flechas}
      dianaCm={sesion.dianaCm}
      alGuardar={(f) => estado.editarRonda(editando!, f)}
      alCerrar={() => (editando = null)}
    />
  {/key}
{/if}

{#if libreta}
  <LibretaMira
    destacada={sesion.distanciaM}
    alCerrar={() => {
      libreta = false;
      // El ítem del menú que la abrió ya no existe: el foco vuelve al ⋮
      void tick().then(() => document.activeElement === document.body && focoMenu());
    }}
  />
{/if}

<Dialogo
  bind:abierto={confirmarTerminar}
  titulo="¿Terminar la sesión?"
  texto="Se guarda con las rondas registradas hasta ahora. La ronda a medias también se guarda. Después las notas ya no se pueden cambiar."
  confirmar="Terminar"
  alConfirmar={() => estado.terminar()}
  devolverFoco={focoMenu}
/>
<Dialogo
  bind:abierto={confirmarDescartar}
  titulo="¿Descartar la sesión?"
  texto="Se borran todas las flechas y notas de esta sesión. No se puede deshacer."
  confirmar="Descartar"
  peligro
  alConfirmar={() => estado.descartar()}
  devolverFoco={focoMenu}
/>

<style>
  .menu-ancla {
    position: relative;
  }
  .menu {
    position: absolute;
    right: 4px;
    top: 48px;
    min-width: 220px;
    z-index: 10;
    background: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--shape-s);
    padding: 8px 0;
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.25);
    display: flex;
    flex-direction: column;
  }
  .menu button {
    height: 48px;
    padding: 0 16px;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    font-size: 16px;
    cursor: pointer;
  }
  .menu button.peligro {
    color: var(--md-sys-color-error);
  }

  /* Pestañas dentro del tablero; solo esta fila queda pegada arriba al desplazar */
  .pestanas {
    display: grid;
    grid-template-columns: 1fr 1fr;
    position: sticky;
    top: env(safe-area-inset-top, 0px);
    z-index: 4;
    background: var(--tablero-fondo);
  }
  .pestanas button {
    height: 48px;
    border: 0;
    background: none;
    cursor: pointer;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-marcador);
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--tablero-rotulo);
  }
  .pestanas button[aria-selected='true'] {
    color: var(--tablero-texto);
  }
  /* Indicador en ::before, separado de la capa de estado (::after): si la compartiera, la pestaña que se deja
     destellaría al recuperar el tamaño completo mientras su opacidad baja */
  .pestanas button[aria-selected='true']::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--tablero-acento);
  }

  .cuerpo {
    padding: 12px 16px 24px;
    min-height: 60dvh;
  }
  /* Deja sitio a la barra fija de acciones (77 px); main ya reserva la navegación + 20 */
  .cuerpo.con-acciones {
    padding-bottom: 65px;
  }
  .pagina {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .vacio {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }
  /* Lo que ocupa Anotar fuera de la diana o el teclado: barra 52 + marcador 80 + pestañas 48 + margen 12 + tira 50
     + separación 16 + margen inferior 65 + 20 de main + navegación */
  .pagina {
    --resto: calc(343px + var(--alto-nav) + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px));
    /* Teclas lo más altas posible (de 56 a 76 px) sin desplazar: 4 filas y 3 separaciones de 8 */
    --alto-tecla: clamp(56px, calc((100dvh - var(--resto) - 24px) / 4), 76px);
  }
  /* La diana, lo más grande posible sin obligar a desplazar: resta además la leyenda (8 + 16) y, si está visible,
     la ayuda (8 + 32) */
  .diana-wrap {
    --ayuda: 0px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-self: center;
    width: min(100%, max(260px, calc(100dvh - var(--resto) - 24px - var(--ayuda))));
  }
  .diana-wrap:has(#ayuda-diana:not([hidden])) {
    --ayuda: 40px;
  }
  .ayuda {
    margin: 0;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.4px;
    color: var(--md-sys-color-on-surface-variant);
  }
  .leyenda {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
  }
  .leyenda span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  /* Como las flechas anteriores en la diana; el borde lo hace visible también en tema oscuro */
  .tenue {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--diana-tinta) 35%, transparent);
    box-shadow: inset 0 0 0 1px var(--md-sys-color-outline);
    display: inline-block;
  }
  /* Misma ✕ que en la diana: blanca con borde oscuro */
  .cruz {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: #fff;
    stroke-width: 1.6;
    stroke-linecap: round;
  }
  .cruz .fondo {
    stroke: var(--diana-tinta);
    stroke-width: 3.4;
  }

  /* Ronda actual: casillas cuadradas con borde grueso; la suma está en el tablero */
  .flechas {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 6px;
  }
  /* En Libre, una fila que se desplaza; el margen deja sitio al pop sin recortarlo */
  .flechas.libre {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 4px 0;
    margin: -4px 0;
  }
  /* Indica que hay flechas a la izquierda, solo cuando las hay */
  .flechas.libre.desplazada {
    mask-image: linear-gradient(to right, transparent, #000 16px);
  }
  .libre .flecha {
    flex: none;
    width: 44px;
  }
  .flecha {
    height: 50px;
    min-width: 0;
    border: 2px solid var(--md-sys-color-on-surface);
    border-radius: var(--shape-s);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-marcador);
    font-size: 30px;
    font-weight: 700;
  }
  .pop {
    animation: pop 320ms cubic-bezier(0.2, 1.6, 0.4, 1);
  }
  @keyframes pop {
    from {
      transform: scale(0.4);
      opacity: 0;
    }
  }
  /* Casi instantánea en vez de none: así llega animationend y nueva vuelve a null */
  @media (prefers-reduced-motion: reduce) {
    .pop {
      animation-duration: 1ms;
    }
  }
  .flecha.vacia {
    border-color: var(--md-sys-color-outline-variant);
    background: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 16px;
    font-weight: 600;
  }
  /* Dónde va la próxima flecha */
  .flecha.vacia.siguiente {
    border-color: var(--md-sys-color-primary);
  }

  /* Lo enfocado nunca queda debajo de la barra fija */
  :global(html:has(.acciones-fijas)) {
    scroll-padding-bottom: calc(var(--alto-nav) + 96px + env(safe-area-inset-bottom, 0px));
  }
  .acciones-fijas {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(var(--alto-nav) + env(safe-area-inset-bottom, 0px));
    z-index: 9;
    padding: 10px 16px;
    background: var(--md-sys-color-surface);
    border-top: 1px solid var(--md-sys-color-surface-container-highest);
  }
  .dentro {
    max-width: 568px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
    gap: 8px;
  }
  /* En columna y a todo el ancho: en una fila, «Terminar y guardar» no cabe */
  .acciones {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .tarjeta p {
    margin: 0;
  }
</style>
