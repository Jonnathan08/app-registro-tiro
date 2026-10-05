<script lang="ts">
  import Diana from '../componentes/Diana.svelte';
  import Dialogo from '../componentes/Dialogo.svelte';
  import Hoja from '../componentes/Hoja.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Notas from '../componentes/Notas.svelte';
  import Resumen from '../componentes/Resumen.svelte';
  import { estado } from '../lib/estado.svelte';
  import { aCSV, compartir, idCorto, nombreArchivo } from '../lib/exportar';
  import { NOMBRE_PERFIL, type Sesion } from '../lib/modelo';

  let { sesion }: { sesion: Sesion } = $props();
  let confirmarBorrar = $state(false);

  const fecha = new Intl.DateTimeFormat('es', { dateStyle: 'full', timeStyle: 'short' });
  const flechas = $derived(sesion.registro.flatMap((r) => r.flechas));

  async function exportar() {
    const r = await compartir(aCSV(sesion), nombreArchivo(sesion));
    if (r === 'descargado') estado.avisar('Archivo descargado');
  }
</script>

<header class="barra">
  <button type="button" class="icbtn estado" aria-label="Volver al historial" onclick={() => (estado.detalle = null)}><Icono nombre="volver" /></button>
  <div class="titulo">
    <h1 class="t-title-l">{sesion.distanciaM} m · {NOMBRE_PERFIL[sesion.perfil]}</h1>
    <small>{fecha.format(new Date(sesion.fecha))} · {idCorto(sesion)}</small>
  </div>
</header>

<div class="cuerpo">
  <Resumen {sesion} />

  <button type="button" class="btn lleno estado" onclick={exportar}><Icono nombre="compartir" />Compartir sesión (CSV)</button>

  {#if flechas.some((f) => f.pos)}
    <Diana dianaCm={sesion.dianaCm} anteriores={flechas} />
  {/if}

  <h2 class="sec">Hoja de puntuación</h2>
  <Hoja registro={sesion.registro} />

  <Notas {sesion} bloqueadas />

  <button type="button" class="btn texto peligro estado borrar" onclick={() => (confirmarBorrar = true)}><Icono nombre="borrar" />Borrar sesión</button>
</div>

<Dialogo bind:abierto={confirmarBorrar} titulo="¿Borrar la sesión?" texto="Se elimina de este teléfono. Si la exportaste, el archivo exportado no se borra." confirmar="Borrar" peligro alConfirmar={() => estado.borrarDetalle()} />

<style>
  .barra {
    height: 64px; display: flex; align-items: center; gap: 4px; padding: 0 16px 0 4px;
    position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--md-sys-color-surface);
  }
  .titulo { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  h1 { margin: 0; }
  small { font-size: 12px; line-height: 16px; letter-spacing: .4px; color: var(--md-sys-color-on-surface-variant); }
  .cuerpo { display: flex; flex-direction: column; gap: 16px; padding: 4px 16px 24px; }
  .borrar { align-self: flex-start; }
</style>
