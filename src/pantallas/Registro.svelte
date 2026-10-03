<script lang="ts">
  import Diana from '../componentes/Diana.svelte';
  import Dialogo from '../componentes/Dialogo.svelte';
  import EditarRonda from '../componentes/EditarRonda.svelte';
  import Hoja from '../componentes/Hoja.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Notas from '../componentes/Notas.svelte';
  import Resumen from '../componentes/Resumen.svelte';
  import Segmentado from '../componentes/Segmentado.svelte';
  import { etiqueta, zona } from '../lib/diana';
  import { estado } from '../lib/estado.svelte';
  import { numeroRonda, rondaLlena, todasGuardadas, type Sesion } from '../lib/modelo';

  let { sesion }: { sesion: Sesion } = $props();

  let entrada = $state<'diana' | 'manual'>('diana');
  let menu = $state(false);
  let confirmarTerminar = $state(false);
  let confirmarDescartar = $state(false);
  let editando = $state<number | null>(null);

  const completa = $derived(todasGuardadas(sesion));
  const llena = $derived(rondaLlena(sesion));
  const anteriores = $derived(sesion.registro.flatMap((r) => r.flechas));
  const sumaActual = $derived(sesion.enCurso.reduce((a, f) => a + f.puntaje, 0));
  const perfil = $derived(sesion.perfil === 'control' ? 'Control' : 'Abierto');

  const TECLAS: { t: string; puntaje: number; x?: boolean }[] = [
    { t: 'X', puntaje: 10, x: true }, { t: '10', puntaje: 10 }, { t: '9', puntaje: 9 }, { t: '8', puntaje: 8 },
    { t: '7', puntaje: 7 }, { t: '6', puntaje: 6 }, { t: '5', puntaje: 5 }, { t: '4', puntaje: 4 },
    { t: '3', puntaje: 3 }, { t: '2', puntaje: 2 }, { t: '1', puntaje: 1 }, { t: 'M', puntaje: 0 },
  ];
</script>

<header class="barra">
  <div class="titulo">
    <h1 class="t-title-l">{completa ? 'Rondas completas' : `Ronda ${numeroRonda(sesion)} de ${sesion.rondas}`}</h1>
    <small class="num">{sesion.distanciaM} m · Diana {sesion.dianaCm} cm · {perfil}</small>
  </div>
  <div class="menu-ancla">
    <button type="button" class="icbtn estado" aria-label="Opciones de la sesión" aria-expanded={menu} onclick={() => (menu = !menu)}><Icono nombre="mas" /></button>
    {#if menu}
      <div class="menu" role="menu">
        <button type="button" role="menuitem" class="estado" onclick={() => { menu = false; confirmarTerminar = true; }}>Terminar sesión ahora</button>
        <button type="button" role="menuitem" class="estado" onclick={() => { menu = false; confirmarDescartar = true; }}>Descartar sesión</button>
      </div>
    {/if}
  </div>
</header>

<div class="cuerpo">
  <Resumen {sesion} />

  {#if !completa}
    <Segmentado
      etiqueta="Forma de registro"
      bind:valor={entrada}
      opciones={[{ valor: 'diana' as const, texto: 'Diana' }, { valor: 'manual' as const, texto: 'Manual' }]}
    />

    {#if entrada === 'diana'}
      <div class="diana-wrap">
        <Diana dianaCm={sesion.dianaCm} {anteriores} actuales={sesion.enCurso} interactiva={!llena} alMarcar={(f) => estado.marcar(f)} />
        <p class="ayuda">
          <span>Mantén presionado, ajusta con la lupa y suelta.</span>
          <span class="leyenda"><i class="tenue"></i>Rondas anteriores <i class="cruz">×</i>Centro del grupo</span>
        </p>
      </div>
    {:else}
      <div class="teclado">
        {#each TECLAS as k (k.t)}
          <button type="button" class="tecla estado num z-{zona(k.puntaje)}" disabled={llena} onclick={() => estado.marcar({ puntaje: k.puntaje, x: !!k.x, pos: null })}>{k.t}</button>
        {/each}
      </div>
    {/if}

    <section class="tarjeta contorno" aria-label="Ronda actual">
      <div class="cab">
        <span class="t-title-m">Ronda {numeroRonda(sesion)}</span>
        <span class="t-body-s num">{sumaActual} pts</span>
      </div>
      <div class="flechas num" style:--cols={Math.min(sesion.flechasPorRonda, 6)}>
        {#each { length: sesion.flechasPorRonda } as _, i (i)}
          {@const f = sesion.enCurso[i]}
          {#if f}
            <span class="flecha z-{zona(f.puntaje)}">{etiqueta(f)}</span>
          {:else}
            <span class="flecha vacia">{i + 1}</span>
          {/if}
        {/each}
      </div>
      <div class="acciones">
        <button type="button" class="btn tonal estado" disabled={!sesion.enCurso.length} onclick={() => estado.deshacer()}><Icono nombre="deshacer" />Deshacer</button>
        <button type="button" class="btn lleno estado crece" disabled={!llena} onclick={() => estado.guardarRonda()}><Icono nombre="check" />Guardar ronda</button>
      </div>
    </section>
  {:else}
    <section class="tarjeta relleno">
      <span class="t-title-m">Terminaste las {sesion.rondas} rondas</span>
      <p class="t-body-s">Agrega las notas y guarda la sesión. Después podrás exportarla desde el historial.</p>
      <button type="button" class="btn lleno estado" onclick={() => estado.terminar()}><Icono nombre="check" />Terminar y guardar</button>
    </section>
  {/if}

  {#if sesion.registro.length}
    <h2 class="sec">Hoja de puntuación</h2>
    <Hoja registro={sesion.registro} alEditar={(i) => (editando = i)} />
  {/if}

  <Notas {sesion} alCambiar={() => estado.notas()} />
</div>

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

<Dialogo bind:abierto={confirmarTerminar} titulo="¿Terminar la sesión?" texto="Se guarda con las rondas registradas hasta ahora. La ronda a medias también se guarda." confirmar="Terminar" alConfirmar={() => estado.terminar()} />
<Dialogo bind:abierto={confirmarDescartar} titulo="¿Descartar la sesión?" texto="Se borran todas las flechas y notas de esta sesión. No se puede deshacer." confirmar="Descartar" peligro alConfirmar={() => estado.descartar()} />

<style>
  .barra {
    height: 64px; display: flex; align-items: center; gap: 4px; padding: 0 4px 0 16px;
    position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5;
    background: var(--md-sys-color-surface);
  }
  .titulo { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  h1 { margin: 0; }
  small { font-size: 12px; line-height: 16px; letter-spacing: .4px; color: var(--md-sys-color-on-surface-variant); }
  .menu-ancla { position: relative; }
  .menu {
    position: absolute; right: 4px; top: 48px; min-width: 220px; z-index: 10;
    background: var(--md-sys-color-surface-container); border-radius: var(--shape-xs);
    padding: 8px 0; box-shadow: 0 2px 6px rgb(0 0 0 / .25);
    display: flex; flex-direction: column;
  }
  .menu button { height: 48px; padding: 0 12px; border: 0; background: none; text-align: left; font-size: 14px; cursor: pointer; }

  .cuerpo { display: flex; flex-direction: column; gap: 16px; padding: 4px 16px 24px; }
  .diana-wrap { display: flex; flex-direction: column; gap: 8px; }
  .ayuda { margin: 0; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; font-size: 12px; line-height: 16px; letter-spacing: .4px; color: var(--md-sys-color-on-surface-variant); }
  .leyenda { display: inline-flex; align-items: center; gap: 6px; }
  .tenue { width: 10px; height: 10px; border-radius: 50%; background: #231f20; opacity: .35; display: inline-block; }
  .cruz { font-style: normal; font-weight: 700; font-size: 18px; color: var(--md-sys-color-tertiary); margin-left: 6px; }

  .teclado { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .tecla { height: 56px; border-radius: var(--shape-m); border: 0; font-size: 22px; font-weight: 500; cursor: pointer; }
  .tecla:disabled { opacity: .38; cursor: default; }

  .cab { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .flechas { display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 6px; }
  .flecha {
    aspect-ratio: 1; width: 100%; max-width: 56px; justify-self: center;
    border-radius: var(--shape-full); display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 500;
  }
  .flecha.vacia { border: 1px dashed var(--md-sys-color-outline); color: var(--md-sys-color-outline); font-weight: 400; }
  .acciones { display: flex; gap: 8px; flex-wrap: wrap; }
  .crece { flex: 1; }
  .tarjeta p { margin: 0; }
</style>
