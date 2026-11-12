<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Diana from '../componentes/Diana.svelte';
  import Dialogo from '../componentes/Dialogo.svelte';
  import EditarRonda from '../componentes/EditarRonda.svelte';
  import Hoja from '../componentes/Hoja.svelte';
  import Icono from '../componentes/Icono.svelte';
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
    numeroRonda,
    rondaGuardable,
    rondaLlena,
    suma,
    todasGuardadas,
    type Sesion,
  } from '../lib/modelo';

  let { sesion }: { sesion: Sesion } = $props();

  let entrada = $state<'diana' | 'manual'>('diana');
  let menu = $state(false);
  let anclaMenu = $state<HTMLElement>();

  // El menú se cierra al tocar fuera de él, con Escape o con el botón atrás de Android.
  // Con Escape o atrás el foco vuelve al botón ⋮ (si no, quedaría en la página).
  const cerrarMenu = () => {
    menu = false;
    anclaMenu?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
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
  const perfil = $derived(NOMBRE_PERFIL[sesion.perfil]);
  const libre = $derived(esLibre(sesion));
  const titulo = $derived(completa ? 'Rondas completas' : `Ronda ${numeroRonda(sesion)}`);
  const conTotal = $derived(!completa && !libre);
  // En Libre la tira es una sola fila que se desplaza y siempre muestra la última flecha
  let tira = $state<HTMLElement>();
  $effect(() => {
    void sesion.enCurso.length;
    if (libre) tira?.scrollTo({ left: tira.scrollWidth });
  });

  // En Libre se muestran las flechas tiradas más un hueco para la siguiente
  const huecos = $derived(libre ? sesion.enCurso.length + (llena ? 0 : 1) : sesion.flechasPorRonda);
</script>

<Barra
  fija
  {titulo}
  sufijo={conTotal ? `/${sesion.rondas}` : undefined}
  sufijoLeido={conTotal ? ` de ${sesion.rondas}` : undefined}
  subtitulo="{sesion.distanciaM} m · Diana {sesion.dianaCm} cm · {perfil}"
>
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
              confirmarTerminar = true;
            }}>Terminar sesión ahora</button
          >
          <button
            type="button"
            role="menuitem"
            class="estado"
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

<div class="pestanas" role="tablist" aria-label="Páginas de la sesión">
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
    Hoja{#if sesion.registro.length}<span class="insignia num">{sesion.registro.length}</span>{/if}
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
        <section class="tira" aria-label="Ronda actual">
          <div
            class="flechas num"
            class:libre
            bind:this={tira}
            style:--cols={libre ? 6 : Math.min(sesion.flechasPorRonda, 6)}
          >
            {#each { length: huecos } as _, i (i)}
              {@const f = sesion.enCurso[i]}
              {#if f}
                <span class="flecha z-{zona(f.puntaje)}">{etiqueta(f)}</span>
              {:else}
                <!-- Los huecos numerados no se leen: se confundirían con puntajes -->
                <span class="flecha vacia" aria-hidden="true">{i + 1}</span>
              {/if}
            {/each}
          </div>
          <div class="suma num"><b>{sumaActual}</b><span>pts</span></div>
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
                estado.marcar(f);
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
          <Teclado deshabilitado={llena} alTocar={(puntaje, x) => estado.marcar({ puntaje, x, pos: null })} />
        {/if}
      {:else}
        <section class="tarjeta relleno">
          <span class="t-title-m">Terminaste las {sesion.rondas} rondas</span>
          <p class="t-body-s">
            Agrega las notas en la pestaña <b>Hoja</b> y termina: después quedan bloqueadas. Podrás exportarla desde el historial.
          </p>
          <div class="acciones">
            <button type="button" class="btn tonal estado" onclick={irANotas}>Ir a las notas</button>
            <button type="button" class="btn lleno estado crece" onclick={() => estado.terminar()}
              ><Icono nombre="check" />Terminar y guardar</button
            >
          </div>
        </section>
      {/if}
    </div>
  {:else}
    <div id="pag-hoja" role="tabpanel" aria-labelledby="tab-hoja" class="pagina" in:fly={{ x: 40, duration: 150 }}>
      <Resumen {sesion} />

      <h2 class="sec">Hoja de puntuación</h2>
      {#if sesion.registro.length}
        <Hoja registro={sesion.registro} alEditar={(i) => (editando = i)} />
      {:else}
        <p class="t-body-s vacio">Todavía no hay rondas guardadas.</p>
      {/if}

      <Notas {sesion} alCambiar={() => estado.notas()} />

      {#if completa}
        <button type="button" class="btn lleno estado" onclick={() => estado.terminar()}
          ><Icono nombre="check" />Terminar y guardar</button
        >
      {:else}
        <button type="button" class="btn tonal estado" onclick={() => (confirmarTerminar = true)}
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
        class="btn contorno estado"
        disabled={!sesion.enCurso.length}
        onclick={() => estado.deshacer()}><Icono nombre="deshacer" />Deshacer</button
      >
      <button
        type="button"
        class="btn lleno estado crece"
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

<Dialogo
  bind:abierto={confirmarTerminar}
  titulo="¿Terminar la sesión?"
  texto="Se guarda con las rondas registradas hasta ahora. La ronda a medias también se guarda. Después las notas ya no se pueden cambiar."
  confirmar="Terminar"
  alConfirmar={() => estado.terminar()}
/>
<Dialogo
  bind:abierto={confirmarDescartar}
  titulo="¿Descartar la sesión?"
  texto="Se borran todas las flechas y notas de esta sesión. No se puede deshacer."
  confirmar="Descartar"
  peligro
  alConfirmar={() => estado.descartar()}
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
    background: var(--md-sys-color-surface-container);
    border-radius: var(--shape-xs);
    padding: 8px 0;
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.25);
    display: flex;
    flex-direction: column;
  }
  .menu button {
    height: 48px;
    padding: 0 12px;
    border: 0;
    background: none;
    text-align: left;
    font-size: 14px;
    cursor: pointer;
  }

  .pestanas {
    display: grid;
    grid-template-columns: 1fr 1fr;
    position: sticky;
    top: calc(env(safe-area-inset-top, 0px) + 64px);
    z-index: 4;
    background: var(--md-sys-color-surface);
    border-bottom: 1px solid var(--md-sys-color-surface-variant);
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
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.1px;
    color: var(--md-sys-color-on-surface-variant);
  }
  .pestanas button[aria-selected='true'] {
    color: var(--md-sys-color-primary);
  }
  /* Indicador: comparte ::after con la capa de estado (.estado), así que se fijan posición y opacidad */
  .pestanas button[aria-selected='true']::after {
    content: '';
    position: absolute;
    inset: auto auto 0 auto;
    opacity: 1;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 64px;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: var(--md-sys-color-primary);
  }
  .insignia {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: var(--shape-full);
    font-size: 11px;
    line-height: 20px;
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }

  .cuerpo {
    padding: 12px 16px 24px;
    min-height: 60dvh;
  }
  /* Deja sitio a la barra fija de acciones (80 px + borde) */
  .cuerpo.con-acciones {
    padding-bottom: 96px;
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
  .diana-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
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

  /* Ronda actual: flechas en fila y la suma a la derecha */
  .tira {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .flechas {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 6px;
  }
  .flechas.libre {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .libre .flecha {
    flex: none;
    width: 40px;
  }
  .flecha {
    aspect-ratio: 1;
    width: 100%;
    max-width: 40px;
    justify-self: center;
    border-radius: var(--shape-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 500;
  }
  .flecha.z-rojo {
    font-weight: 700;
  }
  .flecha.vacia {
    border: 1.5px dashed var(--md-sys-color-outline);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 13px;
    font-weight: 400;
  }
  .suma {
    min-width: 52px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .suma b {
    font-size: 24px;
    line-height: 28px;
    font-weight: 500;
  }
  .suma span {
    font-size: 11px;
    line-height: 14px;
    color: var(--md-sys-color-on-surface-variant);
  }

  /* Lo enfocado nunca queda debajo de la barra fija */
  :global(html:has(.acciones-fijas)) {
    scroll-padding-bottom: calc(176px + env(safe-area-inset-bottom, 0px));
  }
  .acciones-fijas {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    z-index: 9;
    padding: 12px 16px;
    background: var(--md-sys-color-surface);
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
  .dentro {
    max-width: 568px;
    margin: 0 auto;
    display: flex;
    gap: 12px;
  }
  .acciones-fijas .btn {
    height: 56px;
    font-size: 16px;
  }
  .acciones {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .crece {
    flex: 1;
  }
  .tarjeta p {
    margin: 0;
  }
</style>
