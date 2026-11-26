<script lang="ts">
  import { untrack } from 'svelte';
  import { capa } from '../lib/atras';
  import { fechaMedia } from '../lib/formato';
  import {
    acotar,
    crearMarca,
    ELEVACION,
    leerElevacion,
    masCercana,
    MAX_NOTA_MIRA,
    textoElevacion,
    type MarcaMira,
  } from '../lib/mira';
  import { LIMITES } from '../lib/modelo';
  import Dialogo from './Dialogo.svelte';
  import Icono from './Icono.svelte';
  import Perilla from './Perilla.svelte';

  // Editor de una marca de mira (sin el diálogo que lo contiene). Se trabaja sobre una copia: nada cambia hasta
  // «Guardar». alSalir recibe si se guardó o se borró algo.
  let {
    marca,
    distanciaInicial,
    marcas,
    conCapa,
    alGuardar,
    alBorrar,
    alSalir,
  }: {
    /** La marca que se edita; sin ella, una nueva. */
    marca?: MarcaMira;
    /** Distancia de una marca nueva. */
    distanciaInicial: number;
    /** Todas las marcas: para la distancia repetida y para partir de la más cercana. */
    marcas: MarcaMira[];
    /** Registra su propia capa (atrás vuelve a la lista sin guardar). */
    conCapa: boolean;
    alGuardar: (m: MarcaMira, distanciaAnterior?: number) => Promise<boolean>;
    alBorrar: (distanciaM: number) => Promise<boolean>;
    alSalir: (hecho: 'guardada' | 'borrada' | null) => void;
  } = $props();

  const D = LIMITES.distanciaM;
  const DISTANCIAS = [18, 30, 50, 60, 70];
  const id = $props.id();

  const base = untrack(() => marca);
  const partida = untrack(() => (marca ? undefined : masCercana(marcas, distanciaInicial)));
  let distancia = $state(untrack(() => marca?.distanciaM ?? distanciaInicial));
  let elevacion = $state(untrack(() => marca?.elevacion ?? partida?.elevacion ?? ELEVACION.min));
  let nota = $state(untrack(() => marca?.nota ?? ''));
  // El campo de texto de la elevación: se reescribe al girar la perilla, salvo mientras se escribe en él
  let textoElev = $state(untrack(() => textoElevacion(elevacion)));
  let escribiendo = false;
  $effect(() => {
    const v = elevacion;
    if (!escribiendo) textoElev = textoElevacion(v);
  });

  const distanciaValida = $derived(Number.isInteger(distancia) && distancia >= D.min && distancia <= D.max);
  const repetida = $derived(
    distanciaValida && distancia !== base?.distanciaM && marcas.some((m) => m.distanciaM === distancia),
  );
  const leida = $derived(leerElevacion(textoElev));
  const elevacionValida = $derived(leida !== null && leida >= ELEVACION.min && leida <= ELEVACION.max);
  const cambiada = $derived(
    !base || base.distanciaM !== distancia || base.elevacion !== elevacion || base.nota !== nota.trim(),
  );
  let guardando = $state(false);
  const puedeGuardar = $derived(distanciaValida && !repetida && elevacionValida && cambiada && !guardando);
  const diferencia = $derived(base ? Math.round((elevacion - base.elevacion) * 10) / 10 : 0);

  function escribir(t: string) {
    escribiendo = true;
    textoElev = t;
    const v = leerElevacion(t);
    if (v !== null && v >= ELEVACION.min && v <= ELEVACION.max) elevacion = acotar(v);
  }
  function terminarDeEscribir() {
    escribiendo = false;
    if (elevacionValida) textoElev = textoElevacion(elevacion);
  }

  async function guardar() {
    if (!puedeGuardar) return;
    guardando = true;
    const ok = await alGuardar(crearMarca(distancia, elevacion, nota), base?.distanciaM);
    guardando = false;
    if (ok) alSalir('guardada');
  }

  let confirmarBorrar = $state(false);
  let titulo: HTMLHeadingElement;
  $effect(() => titulo.focus());
  // El botón atrás de Android vuelve a la lista sin guardar
  $effect(() => {
    if (conCapa) return capa(() => alSalir(null));
  });
</script>

<div class="cab">
  <h2 id="{id}-titulo" class="t-titulo-tablero" tabindex="-1" bind:this={titulo}>
    {base ? `Marca de ${base.distanciaM} m` : 'Nueva marca'}
  </h2>
  <button type="button" class="icbtn estado" aria-label="Cerrar sin guardar" onclick={() => alSalir(null)}
    ><Icono nombre="cerrar" /></button
  >
</div>

<label class="caja-cifra" class:error={!distanciaValida || repetida}>
  <span class="texto">Distancia<span class="oculto"> en metros</span></span>
  <input
    type="number"
    inputmode="numeric"
    min={D.min}
    max={D.max}
    bind:value={distancia}
    aria-invalid={!distanciaValida || repetida}
    aria-describedby={!distanciaValida || repetida ? `${id}-error-dist` : undefined}
  />
  <span class="unidad" aria-hidden="true">m</span>
</label>
{#if !distanciaValida}
  <p id="{id}-error-dist" class="t-body-s error-texto">Escribe una distancia entre {D.min} y {D.max} m.</p>
{:else if repetida}
  <p id="{id}-error-dist" class="t-body-s error-texto">
    Ya hay una marca para {distancia} m. Cierra y edítala desde la lista.
  </p>
{/if}
<div class="chips" role="group" aria-label="Distancias habituales">
  {#each DISTANCIAS as d (d)}
    <button type="button" class="chip estado" aria-pressed={distancia === d} onclick={() => (distancia = d)}
      >{d} m</button
    >
  {/each}
</div>

<div class="elevacion">
  <label for="{id}-elev" class="t-rotulo">Elevación</label>
  <input
    id="{id}-elev"
    class="valor"
    class:error={!elevacionValida}
    type="text"
    inputmode="decimal"
    autocomplete="off"
    value={textoElev}
    oninput={(e) => escribir(e.currentTarget.value)}
    onblur={terminarDeEscribir}
    aria-invalid={!elevacionValida}
    aria-describedby={elevacionValida ? undefined : `${id}-error-elev`}
  />
  {#if !elevacionValida}
    <p id="{id}-error-elev" class="t-body-s error-texto">
      Escribe una elevación entre {ELEVACION.min} y {ELEVACION.max}.
    </p>
  {:else if base && diferencia !== 0}
    <p class="t-body-s centrado num">
      Guardada: {textoElevacion(base.elevacion)} · {diferencia > 0 ? '+' : '−'}{textoElevacion(Math.abs(diferencia))}
    </p>
  {:else if partida}
    <p class="t-body-s centrado">Parte de la marca de {partida.distanciaM} m.</p>
  {/if}
</div>

<Perilla bind:valor={elevacion} />

<div class="campo">
  <textarea
    id="{id}-nota"
    rows="2"
    maxlength={MAX_NOTA_MIRA}
    placeholder="Ej.: con viento de izquierda, +0,2"
    bind:value={nota}></textarea>
  <label for="{id}-nota">Nota (opcional)</label>
</div>
{#if base}
  <p class="t-body-s">Cambiada el {fechaMedia(base.actualizada)}</p>
{/if}

<div class="acciones">
  {#if base}
    <button type="button" class="btn texto peligro estado" onclick={() => (confirmarBorrar = true)}
      ><Icono nombre="borrar" />Borrar</button
    >
  {/if}
  <span class="derecha">
    <button type="button" class="btn texto estado" onclick={() => alSalir(null)}>Cancelar</button>
    <button type="button" class="btn lleno estado" disabled={!puedeGuardar} onclick={guardar}
      ><Icono nombre="check" />Guardar</button
    >
  </span>
</div>

{#if base}
  <Dialogo
    bind:abierto={confirmarBorrar}
    titulo="¿Borrar la marca de {base.distanciaM} m?"
    texto="Se borran la elevación y la nota de esta distancia. No se puede deshacer."
    confirmar="Borrar"
    peligro
    alConfirmar={async () => {
      if (await alBorrar(base.distanciaM)) alSalir('borrada');
    }}
  />
{/if}

<style>
  .cab {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cab h2 {
    margin: 0;
    flex: 1;
  }
  .cab h2:focus {
    outline: none;
  }
  .error-texto {
    margin: -8px 0 0;
    color: var(--md-sys-color-error);
  }
  .elevacion {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .elevacion label {
    color: var(--md-sys-color-on-surface-variant);
  }
  .valor {
    width: 100%;
    height: 64px;
    border: 2px solid var(--md-sys-color-outline-variant);
    border-radius: var(--shape-s);
    background: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    text-align: center;
    font-family: var(--font-marcador);
    font-size: 48px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .valor:focus {
    outline: none;
    border-color: var(--md-sys-color-primary);
  }
  .valor.error {
    border-color: var(--md-sys-color-error);
  }
  .elevacion .error-texto {
    margin: 0;
  }
  .centrado {
    margin: 0;
    text-align: center;
  }
  .campo textarea {
    min-height: 72px;
  }
  p {
    margin: 0;
  }
  .acciones {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    flex-wrap: wrap;
  }
  .derecha {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }
</style>
