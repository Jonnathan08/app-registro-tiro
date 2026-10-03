<script lang="ts">
  import { etiqueta, zona } from '../lib/diana';
  import { ordenHoja, sumaRonda, type Ronda } from '../lib/modelo';
  import Icono from './Icono.svelte';

  let { registro, alEditar }: { registro: Ronda[]; alEditar?: (indice: number) => void } = $props();

  const filas = $derived.by(() => {
    let acum = 0;
    return registro.map((r, i) => {
      const pts = sumaRonda(r);
      acum += pts;
      return { n: i + 1, flechas: ordenHoja(r.flechas), pts, acum };
    });
  });
</script>

{#if filas.length}
  <div class="hoja">
    <table class="num">
      <thead><tr><th>Ronda</th><th>Flechas</th><th class="r">Pts</th><th class="r">Acum.</th>{#if alEditar}<th><span class="oculto">Editar</span></th>{/if}</tr></thead>
      <tbody>
        {#each filas as f (f.n)}
          <tr>
            <td>{f.n}</td>
            <td><span class="mini">{#each f.flechas as fl, j (j)}<span class="z-{zona(fl.puntaje)}" class:corregida={fl.corregida}>{etiqueta(fl)}</span>{/each}</span></td>
            <td class="r">{f.pts}</td>
            <td class="r acum">{f.acum}</td>
            {#if alEditar}
              <td class="lapiz"><button type="button" class="icbtn estado" aria-label="Editar ronda {f.n}" onclick={() => alEditar(f.n - 1)}><Icono nombre="editar" /></button></td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .lapiz { padding: 0 4px 0 0; width: 48px; }
  .oculto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .corregida { outline: 2px solid var(--md-sys-color-tertiary); outline-offset: 1px; }
</style>
