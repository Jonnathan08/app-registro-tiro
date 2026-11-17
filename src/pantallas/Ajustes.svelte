<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Marcador from '../componentes/Marcador.svelte';
  import Segmentado from '../componentes/Segmentado.svelte';
  import { estado } from '../lib/estado.svelte';
  import { totalesHistorial } from '../lib/modelo';
  import { aCSV, compartir } from '../lib/exportar';
  import { deCSV } from '../lib/importar';
  import { aplicarTema, guardarAjustes, leerAjustes, type Contraste, type Modo } from '../lib/tema';

  const ajustes = $state(leerAjustes());
  const totales = $derived(totalesHistorial(estado.historial));
  function cambiar() {
    guardarAjustes(ajustes);
    aplicarTema(ajustes);
  }

  async function exportarTodo() {
    const r = await compartir(aCSV(estado.historial), `tiro_todo_${new Date().toISOString().slice(0, 10)}.csv`);
    if (r === 'descargado') estado.avisar('Archivo descargado');
  }

  let archivo: HTMLInputElement;
  let importando = $state(false);
  async function importar() {
    const a = archivo.files?.[0];
    archivo.value = ''; // permite volver a elegir el mismo archivo
    if (!a) return;
    importando = true;
    try {
      const { nuevas, repetidas } = await estado.importar(deCSV(await a.text()));
      const ya = repetidas ? ` (${repetidas} ya estaba${repetidas === 1 ? '' : 'n'})` : '';
      estado.avisar(
        nuevas
          ? `${nuevas} ${nuevas === 1 ? 'sesión importada' : 'sesiones importadas'}${ya}`
          : `No hay sesiones nuevas${ya}`,
      );
    } catch (e) {
      console.error(e);
      estado.avisar(
        e instanceof Error && e.message ? `No se pudo importar: ${e.message}` : 'No se pudo importar el archivo.',
      );
    } finally {
      importando = false;
    }
  }
</script>

<Barra titulo="Ajustes" />
<Marcador
  etiqueta="Datos guardados"
  cifras={[
    { rotulo: 'Sesiones', valor: totales.sesiones },
    { rotulo: 'Flechas', valor: totales.flechas },
  ]}
>
  <p class="aviso-local">Guardadas solo en este teléfono.</p>
</Marcador>

<div class="cuerpo">
  <section class="grupo">
    <h2 class="sec">Apariencia</h2>
    <span class="rotulo" aria-hidden="true">Modo</span>
    <Segmentado
      etiqueta="Modo"
      bind:valor={ajustes.modo}
      alCambiar={cambiar}
      opciones={[
        { valor: 'sistema' as Modo, texto: 'Sistema' },
        { valor: 'claro' as Modo, texto: 'Claro' },
        { valor: 'oscuro' as Modo, texto: 'Oscuro' },
      ]}
    />
    <span class="rotulo" aria-hidden="true">Contraste</span>
    <Segmentado
      etiqueta="Contraste"
      bind:valor={ajustes.contraste}
      alCambiar={cambiar}
      opciones={[
        { valor: 'estandar' as Contraste, texto: 'Estándar' },
        { valor: 'medio' as Contraste, texto: 'Medio' },
        { valor: 'alto' as Contraste, texto: 'Alto' },
      ]}
    />
    <p class="t-body-s">Al aire libre, con sol, el contraste alto se lee mejor.</p>
  </section>

  <section class="grupo">
    <h2 class="sec">Datos</h2>
    <button type="button" class="btn contorno estado ancho" disabled={!estado.historial.length} onclick={exportarTodo}
      ><Icono nombre="compartir" />Exportar todas las sesiones</button
    >
    <button type="button" class="btn contorno estado ancho" disabled={importando} onclick={() => archivo.click()}
      ><Icono nombre="importar" />Importar sesiones (CSV)</button
    >
    <input bind:this={archivo} type="file" accept=".csv,text/csv" hidden onchange={importar} />
    <p class="t-body-s">
      La app no se conecta a ningún servidor: para llevar tus sesiones a Drive, compártelas desde aquí o desde cada
      sesión.
    </p>
    <p class="t-body-s">
      Para recuperarlas (por ejemplo, en un teléfono nuevo), importa un CSV exportado por la app. Las sesiones que ya
      están no se duplican.
    </p>
  </section>

  <p class="t-rotulo version">Versión {__VERSION__}</p>
</div>

<style>
  .cuerpo {
    display: flex;
    flex-direction: column;
    gap: 22px;
    padding: 18px 16px 24px;
  }
  .grupo h2 {
    margin: 0;
  }
  .rotulo {
    font-size: 13px;
    line-height: 18px;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
  }
  .ancho {
    width: 100%;
    min-height: 52px;
  }
  .aviso-local {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 16px;
    color: var(--tablero-tenue);
  }
  .version {
    margin: 0;
    text-align: center;
    color: var(--md-sys-color-on-surface-variant);
  }
</style>
