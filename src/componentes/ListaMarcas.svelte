<script lang="ts">
  import { fechaCorta, fechaLarga } from '../lib/formato';
  import { textoElevacion, type MarcaMira } from '../lib/mira';

  // Marcas de mira ordenadas por distancia; tocar una abre su editor
  let { marcas, alElegir }: { marcas: MarcaMira[]; alElegir: (distanciaM: number) => void } = $props();
</script>

<ul class="marcas" aria-label="Marcas de mira">
  {#each marcas as m (m.distanciaM)}
    <li>
      <button type="button" class="estado" data-distancia={m.distanciaM} onclick={() => alElegir(m.distanciaM)}>
        <span class="dist t-cifra-l"
          >{m.distanciaM}<small aria-hidden="true">m</small><span class="oculto"> metros</span></span
        >
        <span class="medio">
          {#if m.nota}<span class="nota">{m.nota}</span>{/if}
          <span class="fecha"
            ><span aria-hidden="true">{fechaCorta(m.actualizada)}</span><span class="oculto"
              >, cambiada el {fechaLarga(m.actualizada)}</span
            ></span
          >
        </span>
        <span class="elev t-cifra-l"><span class="oculto">elevación </span>{textoElevacion(m.elevacion)}</span>
      </button>
    </li>
  {/each}
</ul>

<style>
  .marcas {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  button {
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
  .dist {
    min-width: 58px;
  }
  .dist small {
    margin-left: 2px;
    font-size: 16px;
  }
  .medio {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .nota {
    font-size: 14px;
    line-height: 20px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fecha {
    font-size: 13px;
    line-height: 18px;
    color: var(--md-sys-color-on-surface-variant);
  }
  .elev {
    color: var(--md-sys-color-primary);
  }
</style>
