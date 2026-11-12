<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import DianaRonda from '../componentes/DianaRonda.svelte';
  import Dialogo from '../componentes/Dialogo.svelte';
  import Grafico from '../componentes/Grafico.svelte';
  import Hoja from '../componentes/Hoja.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Notas from '../componentes/Notas.svelte';
  import Resumen from '../componentes/Resumen.svelte';
  import { estado } from '../lib/estado.svelte';
  import { aCSV, compartir, idCorto, nombreArchivo } from '../lib/exportar';
  import { dosDecimales, fechaHora } from '../lib/formato';
  import { NOMBRE_PERFIL, sumaRonda, type Sesion } from '../lib/modelo';

  let { sesion }: { sesion: Sesion } = $props();
  let confirmarBorrar = $state(false);
  let ronda = $state<number | null>(null);   // ronda resaltada en la diana
  let dianaRonda = $state<DianaRonda>();

  const conPosiciones = $derived(sesion.registro.some((r) => r.flechas.some((f) => f.pos)));

  // Puntos por ronda; si las rondas tienen distinto número de flechas (perfil Libre), promedio por flecha
  const porFlecha = $derived(new Set(sesion.registro.map((r) => r.flechas.length)).size > 1);
  const porRonda = $derived(sesion.registro.map((r) => (porFlecha ? sumaRonda(r) / Math.max(1, r.flechas.length) : sumaRonda(r))));
  const fmtRonda = (v: number) => (porFlecha ? dosDecimales(v) : String(v));
  const unidad = $derived(porFlecha ? 'por flecha' : 'pts');

  async function exportar() {
    const r = await compartir(aCSV(sesion), nombreArchivo(sesion));
    if (r === 'descargado') estado.avisar('Archivo descargado');
  }
</script>

<Barra fija titulo="{sesion.distanciaM} m · {NOMBRE_PERFIL[sesion.perfil]}" subtitulo="{fechaHora(sesion.fecha)} · {idCorto(sesion)}">
  {#snippet inicio()}
    <button type="button" class="icbtn estado" aria-label="Volver al historial" onclick={() => (estado.detalle = null)}><Icono nombre="volver" /></button>
  {/snippet}
</Barra>

<div class="cuerpo">
  <Resumen {sesion} />

  <button type="button" class="btn lleno estado" onclick={exportar}><Icono nombre="compartir" />Compartir sesión (CSV)</button>

  {#if conPosiciones}
    <DianaRonda bind:this={dianaRonda} dianaCm={sesion.dianaCm} registro={sesion.registro} bind:ronda />
  {/if}

  {#if porRonda.length > 1}
    <section class="tarjeta-grafico" aria-labelledby="titulo-rondas">
      <div class="cabeza">
        <h2 id="titulo-rondas" class="sec">{porFlecha ? 'Promedio por flecha en cada ronda' : 'Puntos por ronda'}</h2>
        {#if ronda !== null && porRonda[ronda] !== undefined}
          <span class="lectura num">R{ronda + 1} · <b>{fmtRonda(porRonda[ronda])}</b> {unidad}</span>
        {/if}
      </div>
      <Grafico
        valores={porRonda}
        etiquetaX={(i) => `R${i + 1}`}
        nombrePunto={(i) => `Ronda ${i + 1}: ${fmtRonda(porRonda[i])} ${unidad}`}
        formato={fmtRonda}
        seleccionado={ronda}
        alElegir={(i) => (ronda = i)}
        descripcion={porFlecha ? 'Promedio por flecha en cada ronda' : 'Puntos por ronda'}
      />
    </section>
  {/if}

  <h2 class="sec">Hoja de puntuación</h2>
  <Hoja registro={sesion.registro} seleccionada={ronda} alSeleccionar={conPosiciones ? (i) => { ronda = i; if (i !== null) dianaRonda?.mostrar(); } : undefined} />

  <Notas {sesion} bloqueadas />

  <button type="button" class="btn texto peligro estado borrar" onclick={() => (confirmarBorrar = true)}><Icono nombre="borrar" />Borrar sesión</button>
</div>

<Dialogo bind:abierto={confirmarBorrar} titulo="¿Borrar la sesión?" texto="Se elimina de este teléfono. Si la exportaste, el archivo exportado no se borra." confirmar="Borrar" peligro alConfirmar={() => estado.borrarDetalle()} />

<style>
  .cuerpo { display: flex; flex-direction: column; gap: 16px; padding: 4px 16px 24px; }
  .borrar { align-self: flex-start; }
  .tarjeta-grafico { border-radius: var(--shape-m); background: var(--md-sys-color-surface-container-low); padding: 12px 12px 4px; }
  .cabeza { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
  .cabeza .sec { margin: 0; }
  .lectura { font-size: 12px; line-height: 16px; color: var(--md-sys-color-on-surface-variant); white-space: nowrap; }
  .lectura b { font-size: 14px; font-weight: 500; color: var(--md-sys-color-on-surface); }
</style>
