<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Icono from '../componentes/Icono.svelte';
  import LibretaMira from '../componentes/LibretaMira.svelte';
  import Marcador from '../componentes/Marcador.svelte';
  import Segmentado from '../componentes/Segmentado.svelte';
  import { estado } from '../lib/estado.svelte';
  import { totalesHistorial } from '../lib/modelo';
  import { aCSV, compartirVarios, marcasACSV, nombreArchivoMira } from '../lib/exportar';
  import { deArchivo } from '../lib/importar';
  import type { MarcaMira } from '../lib/mira';
  import type { Sesion } from '../lib/modelo';
  import {
    aplicarTema,
    guardarAjustes,
    leerAjustes,
    PALETAS,
    type Contraste,
    type Modo,
    type Paleta,
  } from '../lib/tema';

  const ajustes = $state(leerAjustes());
  const paletas = (Object.keys(PALETAS) as Paleta[]).map((p) => ({
    valor: p,
    texto: PALETAS[p].nombre,
    muestra: `var(--paleta-muestra-${p})`,
  }));
  const totales = $derived(totalesHistorial(estado.historial));
  function cambiar() {
    guardarAjustes(ajustes);
    aplicarTema(ajustes);
  }

  // ---- Marcas de mira: un resumen; la libreta completa se abre en la misma hoja que en la sesión ----
  let libreta = $state(false);
  const nMarcas = $derived(estado.marcas.length);
  const distancias = $derived(estado.marcas.map((m) => m.distanciaM));
  const listaY = new Intl.ListFormat('es', { type: 'conjunction' });

  async function exportarTodo() {
    const hoy = new Date().toISOString().slice(0, 10);
    const archivos = [];
    if (estado.historial.length) archivos.push({ contenido: aCSV(estado.historial), nombre: `tiro_todo_${hoy}.csv` });
    if (estado.marcas.length) archivos.push({ contenido: marcasACSV(estado.marcas), nombre: nombreArchivoMira() });
    const r = await compartirVarios(archivos);
    if (r === 'descargado') estado.avisar(archivos.length > 1 ? 'Archivos descargados' : 'Archivo descargado');
  }

  let archivo: HTMLInputElement;
  let importando = $state(false);
  async function importar() {
    const lista = [...(archivo.files ?? [])];
    archivo.value = ''; // permite volver a elegir el mismo archivo
    if (!lista.length) return;
    importando = true;
    try {
      const sesiones: Sesion[] = [],
        marcas: MarcaMira[] = [];
      for (const a of lista) {
        const r = deArchivo(await a.text());
        sesiones.push(...r.sesiones);
        marcas.push(...r.marcas);
      }
      const partes: string[] = [];
      if (sesiones.length || !marcas.length) {
        const { nuevas, repetidas } = await estado.importar(sesiones);
        const ya = repetidas ? ` (${repetidas} ya estaba${repetidas === 1 ? '' : 'n'})` : '';
        partes.push(
          nuevas
            ? `${nuevas} ${nuevas === 1 ? 'sesión importada' : 'sesiones importadas'}${ya}`
            : `No hay sesiones nuevas${ya}`,
        );
      }
      if (marcas.length) {
        // Aparte: si las marcas fallan, las sesiones ya importadas se dicen igual
        try {
          const { nuevas, actualizadas } = await estado.importarMarcas(marcas);
          const n = nuevas + actualizadas;
          partes.push(n ? `${n} ${n === 1 ? 'marca actualizada' : 'marcas actualizadas'}` : 'No hay marcas nuevas');
        } catch (e) {
          console.error(e);
          partes.push('las marcas no se pudieron guardar');
        }
      }
      estado.avisar(partes.join(' · '));
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
    <h2 class="sec" id="titulo-marcas">Marcas de mira</h2>
    <button
      type="button"
      class="resumen estado"
      aria-haspopup="dialog"
      aria-labelledby="titulo-marcas resumen-marcas"
      onclick={() => (libreta = true)}
    >
      <span class="txt" id="resumen-marcas">
        <span class="t-title-m"
          >{nMarcas === 0 ? 'Sin marcas' : nMarcas === 1 ? '1 distancia' : `${nMarcas} distancias`}</span
        >
        {#if nMarcas === 0}
          <span class="t-body-s linea">Guarda la elevación de cada distancia</span>
        {:else}
          <span class="t-body-s linea" aria-hidden="true">{distancias.join(' · ')} m</span>
          <span class="oculto">{listaY.format(distancias.map(String))} metros</span>
        {/if}
      </span>
      <Icono nombre="flecha" />
    </button>
  </section>

  <section class="grupo">
    <h2 class="sec">Apariencia</h2>
    <span class="rotulo" aria-hidden="true">Color</span>
    <Segmentado etiqueta="Color" bind:valor={ajustes.paleta} alCambiar={cambiar} columnas={2} opciones={paletas} />
    <p class="t-body-s">Los colores de la diana no cambian.</p>
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
    <button
      type="button"
      class="btn contorno estado ancho"
      disabled={!estado.historial.length && !estado.marcas.length}
      onclick={exportarTodo}><Icono nombre="compartir" />Exportar sesiones y marcas</button
    >
    <button type="button" class="btn contorno estado ancho" disabled={importando} onclick={() => archivo.click()}
      ><Icono nombre="importar" />Importar copia (CSV)</button
    >
    <input bind:this={archivo} type="file" accept=".csv,text/csv" multiple hidden onchange={importar} />
    <p class="t-body-s">
      La app no se conecta a ningún servidor: para llevar tus sesiones a Drive, compártelas desde aquí o desde cada
      sesión.
    </p>
    <p class="t-body-s">
      Para recuperarlas (por ejemplo, en un teléfono nuevo), importa un CSV exportado por la app. Las sesiones que ya
      están no se duplican; de las marcas se queda la más reciente de cada distancia.
    </p>
  </section>

  <p class="t-rotulo version">Versión {__VERSION__}</p>
</div>

{#if libreta}
  <LibretaMira alCerrar={() => (libreta = false)} />
{/if}

<style>
  /* Resumen de las marcas de mira: como una fila de la libreta, con chevron */
  .resumen {
    position: relative;
    width: 100%;
    min-height: 64px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--shape-s);
    background: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    text-align: left;
    cursor: pointer;
  }
  .resumen .txt {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .resumen .linea {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .resumen :global(svg) {
    color: var(--md-sys-color-on-surface-variant);
  }
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
