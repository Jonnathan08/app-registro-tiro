<script lang="ts">
  import { etiqueta, zona } from '../lib/diana';
  import { ordenHoja, sumaRonda, type Ronda } from '../lib/modelo';
  import Icono from './Icono.svelte';

  let {
    registro,
    alEditar,
    seleccionada = null,
    alSeleccionar,
  }: {
    registro: Ronda[];
    alEditar?: (indice: number) => void;
    /** Índice de la ronda resaltada en la diana. */
    seleccionada?: number | null;
    /** Si se pasa, tocar una fila la selecciona (o la deselecciona si ya lo estaba). */
    alSeleccionar?: (indice: number | null) => void;
  } = $props();

  const filas = $derived.by(() => {
    let acum = 0;
    return registro.map((r, i) => {
      const pts = sumaRonda(r);
      acum += pts;
      return { n: i + 1, flechas: ordenHoja(r.flechas), pts, acum };
    });
  });

  const elegir = (i: number) => alSeleccionar?.(seleccionada === i ? null : i);
</script>

{#if filas.length}
  <div class="hoja">
    <table class="num">
      <thead
        ><tr
          ><th><span aria-hidden="true">R</span><span class="oculto">Ronda</span></th><th>Flechas</th><th class="r"
            ><span aria-hidden="true">Pts</span><span class="oculto">Puntos</span></th
          ><th class="r"><span aria-hidden="true">Acum.</span><span class="oculto">Acumulado</span></th
          >{#if alEditar}<th><span class="oculto">Editar</span></th>{/if}</tr
        ></thead
      >
      <tbody>
        {#each filas as f (f.n)}
          <!-- La fila entera se puede tocar; el botón de la primera celda da el acceso por teclado y lector de pantalla -->
          <tr
            class:elegible={alSeleccionar}
            class:activa={seleccionada === f.n - 1}
            onclick={alSeleccionar ? () => elegir(f.n - 1) : undefined}
          >
            <td>
              {#if alSeleccionar}
                <button
                  type="button"
                  class="n"
                  aria-pressed={seleccionada === f.n - 1}
                  aria-label="Ver ronda {f.n} en la diana"
                  onclick={(e) => {
                    e.stopPropagation();
                    elegir(f.n - 1);
                  }}>{f.n}</button
                >
              {:else}
                {f.n}
              {/if}
            </td>
            <td
              ><span class="mini"
                >{#each f.flechas as fl, j (j)}<span class="z-{zona(fl.puntaje)}" class:corregida={fl.corregida}
                    >{etiqueta(fl)}</span
                  >{/each}</span
              ></td
            >
            <td class="r">{f.pts}</td>
            <td class="r acum">{f.acum}</td>
            {#if alEditar}
              <td class="lapiz"
                ><button
                  type="button"
                  class="icbtn estado"
                  aria-label="Editar ronda {f.n}"
                  onclick={(e) => {
                    e.stopPropagation();
                    alEditar(f.n - 1);
                  }}><Icono nombre="editar" /></button
                ></td
              >
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .lapiz {
    padding: 0 4px 0 0;
    width: 48px;
  }
  .corregida {
    outline: 2px solid var(--md-sys-color-tertiary);
    outline-offset: 1px;
  }
  .elegible {
    cursor: pointer;
  }
  /* Ronda elegida (Detalle): fondo amarillo de la diana y marca a la izquierda */
  .activa {
    background: color-mix(in srgb, var(--diana-oro) 45%, var(--md-sys-color-surface-container-lowest));
    color: var(--md-sys-color-on-surface);
    box-shadow: inset 4px 0 0 var(--md-sys-color-primary);
  }
  :global(html[class^='dark']) .activa {
    color: var(--diana-tinta);
  }
  :global(html[class^='dark']) .activa .acum {
    color: var(--diana-tinta);
  }
  td:first-child {
    width: 40px;
    text-align: center;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 18px;
  }
  .activa td:first-child {
    color: inherit;
  }
  .n {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 48px;
    cursor: pointer;
  }
  .n:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
    border-radius: 4px;
  }
</style>
