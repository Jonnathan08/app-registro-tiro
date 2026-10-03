<script lang="ts">
  import { etiqueta, zona } from '../lib/diana';
  import { ordenHoja, sumaRonda, type Ronda } from '../lib/modelo';

  let { registro }: { registro: Ronda[] } = $props();

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
      <thead><tr><th>Ronda</th><th>Flechas</th><th class="r">Pts</th><th class="r">Acum.</th></tr></thead>
      <tbody>
        {#each filas as f (f.n)}
          <tr>
            <td>{f.n}</td>
            <td><span class="mini">{#each f.flechas as fl, j (j)}<span class="z-{zona(fl.puntaje)}">{etiqueta(fl)}</span>{/each}</span></td>
            <td class="r">{f.pts}</td>
            <td class="r acum">{f.acum}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
