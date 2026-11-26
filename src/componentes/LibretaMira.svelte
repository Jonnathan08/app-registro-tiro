<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { capa } from '../lib/atras';
  import { estado } from '../lib/estado.svelte';
  import { fechaMedia } from '../lib/formato';
  import { DISTANCIAS_HABITUALES, marcaDe, textoElevacion } from '../lib/mira';
  import EditarMarca from './EditarMarca.svelte';
  import Icono from './Icono.svelte';
  import ListaMarcas from './ListaMarcas.svelte';

  // Libreta de marcas de mira en una hoja inferior. Desde Registro abre la lista, con la marca de la distancia de
  // la sesión destacada; desde Ajustes abre directamente el editor de una marca (o de una nueva).
  let {
    destacada,
    editar,
    alCerrar,
  }: {
    /** Distancia de la sesión en curso: su marca va arriba. */
    destacada?: number;
    /** Abre solo el editor: la distancia de una marca o «nueva». */
    editar?: number | 'nueva';
    alCerrar: () => void;
  } = $props();

  /** Distancia de una marca nueva sin otra indicación: la primera habitual sin marca. */
  const libre = () => DISTANCIAS_HABITUALES.find((d) => !marcaDe(estado.marcas, d)) ?? DISTANCIAS_HABITUALES[0];

  type Vista = { tipo: 'lista' } | { tipo: 'editor'; distancia: number | null; nueva: number };
  const id = $props.id();
  const soloEditor = untrack(() => editar !== undefined);
  let vista = $state<Vista>(
    untrack(() =>
      editar === undefined
        ? { tipo: 'lista' }
        : editar === 'nueva'
          ? { tipo: 'editor', distancia: null, nueva: libre() }
          : { tipo: 'editor', distancia: editar, nueva: editar },
    ),
  );

  const principal = $derived(destacada !== undefined ? marcaDe(estado.marcas, destacada) : undefined);
  const otras = $derived(estado.marcas.filter((m) => m.distanciaM !== destacada));

  let dlg: HTMLDialogElement;
  $effect(() => {
    dlg.showModal();
  });
  // El botón atrás de Android la cierra (en el editor, primero vuelve a la lista)
  $effect(() => capa(() => dlg.close()));

  /** Al volver a la lista, el foco a la fila de la marca o a «Agregar marca». */
  async function aLista(distancia: number | null) {
    vista = { tipo: 'lista' };
    await tick();
    const fila =
      distancia === null
        ? null
        : dlg.querySelector<HTMLElement>(
            distancia === destacada ? '[data-accion="ajustar"]' : `[data-distancia="${distancia}"]`,
          );
    (fila ?? dlg.querySelector<HTMLElement>('[data-accion="agregar"]'))?.focus();
  }

  function salir(hecho: 'guardada' | 'borrada' | null, distancia: number | null) {
    if (hecho) estado.avisar(hecho === 'guardada' ? 'Marca guardada' : 'Marca borrada');
    if (soloEditor) dlg.close();
    else void aLista(hecho === 'borrada' ? null : distancia);
  }
</script>

<dialog
  bind:this={dlg}
  class="hoja-inferior"
  aria-label="Marcas de mira"
  onclose={alCerrar}
  oncancel={(e) => {
    // Escape en el editor vuelve a la lista, como atrás
    if (vista.tipo === 'editor' && !soloEditor) {
      e.preventDefault();
      void aLista(vista.distancia ?? null);
    }
  }}
>
  {#if vista.tipo === 'editor'}
    {@const v = vista}
    {#key v.distancia ?? `nueva-${v.nueva}`}
      <EditarMarca
        marca={v.distancia === null ? undefined : marcaDe(estado.marcas, v.distancia)}
        distanciaInicial={v.nueva}
        marcas={estado.marcas}
        conCapa={!soloEditor}
        alGuardar={(m, anterior) => estado.guardarMarca(m, anterior)}
        alBorrar={(d) => estado.borrarMarca(d)}
        alSalir={(hecho) => salir(hecho, v.distancia ?? v.nueva)}
      />
    {/key}
  {:else}
    <div class="cab">
      <h2 class="t-titulo-tablero">Marcas de mira</h2>
      <button type="button" class="icbtn estado" aria-label="Cerrar" onclick={() => dlg.close()}
        ><Icono nombre="cerrar" /></button
      >
    </div>

    {#if destacada !== undefined}
      <section class="tarjeta destacada" aria-labelledby="{id}-destacada">
        {#if principal}
          <span class="t-rotulo" id="{id}-destacada"
            >Esta sesión · {destacada}<span aria-hidden="true"> m</span><span class="oculto"> metros</span></span
          >
          <span class="t-rotulo">Elevación</span>
          <span class="t-cifra-xl valor">{textoElevacion(principal.elevacion)}</span>
          {#if principal.nota}<p class="nota">{principal.nota}</p>{/if}
          <p class="t-body-s">Cambiada el {fechaMedia(principal.actualizada)}</p>
          <button
            type="button"
            class="btn lleno grande estado"
            data-accion="ajustar"
            onclick={() => (vista = { tipo: 'editor', distancia: destacada, nueva: destacada })}
            ><Icono nombre="editar" />Ajustar</button
          >
        {:else}
          <p class="t-title-m" id="{id}-destacada">Sin marca para {destacada} m</p>
          <button
            type="button"
            class="btn lleno grande estado"
            data-accion="ajustar"
            onclick={() => (vista = { tipo: 'editor', distancia: null, nueva: destacada })}
            ><Icono nombre="sumar" />Agregar marca de {destacada} m</button
          >
        {/if}
      </section>
      <h3 class="t-seccion">Otras distancias</h3>
    {/if}

    {#if otras.length}
      <ListaMarcas marcas={otras} alElegir={(d) => (vista = { tipo: 'editor', distancia: d, nueva: d })} />
    {:else}
      <p class="t-body-s">
        {destacada !== undefined ? 'No hay marcas de otras distancias.' : 'Todavía no hay marcas.'}
      </p>
    {/if}
    <button
      type="button"
      class="btn contorno estado ancho"
      data-accion="agregar"
      onclick={() => (vista = { tipo: 'editor', distancia: null, nueva: libre() })}
      ><Icono nombre="sumar" />Agregar marca</button
    >
  {/if}
</dialog>

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
  .destacada {
    border: 2px solid var(--md-sys-color-primary);
    gap: 4px;
  }
  .destacada .t-rotulo {
    color: var(--md-sys-color-on-surface-variant);
  }
  .valor {
    color: var(--md-sys-color-primary);
  }
  .nota {
    margin: 0;
    font-size: 14px;
    line-height: 20px;
  }
  .destacada p {
    margin: 0;
  }
  .destacada .btn {
    margin-top: 8px;
  }
  .t-seccion {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }
  .ancho {
    width: 100%;
  }
  p {
    margin: 0;
  }
</style>
