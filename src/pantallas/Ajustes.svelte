<script lang="ts">
  import Icono from '../componentes/Icono.svelte';
  import Segmentado from '../componentes/Segmentado.svelte';
  import { estado } from '../lib/estado.svelte';
  import { aCSV, compartir } from '../lib/exportar';
  import { aplicarTema, guardarAjustes, leerAjustes, type Contraste, type Modo } from '../lib/tema';

  const ajustes = $state(leerAjustes());
  function cambiar() {
    guardarAjustes(ajustes);
    aplicarTema(ajustes);
  }

  async function exportarTodo() {
    const r = await compartir(aCSV(estado.historial), `tiro_todo_${new Date().toISOString().slice(0, 10)}.csv`);
    if (r === 'descargado') estado.avisar('Archivo descargado');
  }
</script>

<header class="barra"><h1 class="t-title-l">Ajustes</h1></header>

<div class="cuerpo">
  <section class="grupo">
    <h2 class="sec">Apariencia</h2>
    <Segmentado etiqueta="Modo" bind:valor={ajustes.modo} alCambiar={cambiar}
      opciones={[{ valor: 'sistema' as Modo, texto: 'Sistema' }, { valor: 'claro' as Modo, texto: 'Claro' }, { valor: 'oscuro' as Modo, texto: 'Oscuro' }]} />
    <Segmentado etiqueta="Contraste" bind:valor={ajustes.contraste} alCambiar={cambiar}
      opciones={[{ valor: 'estandar' as Contraste, texto: 'Estándar' }, { valor: 'medio' as Contraste, texto: 'Medio' }, { valor: 'alto' as Contraste, texto: 'Alto' }]} />
    <p class="t-body-s">Al aire libre, con sol, el contraste alto se lee mejor.</p>
  </section>

  <section class="grupo">
    <h2 class="sec">Datos</h2>
    <button type="button" class="btn contorno estado" disabled={!estado.historial.length} onclick={exportarTodo}><Icono nombre="compartir" />Exportar todas las sesiones</button>
    <p class="t-body-s">Tus sesiones se guardan solo en este teléfono. La app no se conecta a ningún servidor: para llevarlas a Drive, compártelas desde aquí o desde cada sesión.</p>
  </section>

  <p class="t-body-s version num">Versión {__VERSION__}</p>
</div>

<style>
  .barra { height: 64px; display: flex; align-items: center; padding: 0 16px; }
  h1 { margin: 0; }
  .cuerpo { display: flex; flex-direction: column; gap: 24px; padding: 8px 16px 24px; }
  .grupo { display: flex; flex-direction: column; gap: 12px; }
  .grupo p { margin: 0; }
  .version { margin: 0; text-align: center; }
</style>
