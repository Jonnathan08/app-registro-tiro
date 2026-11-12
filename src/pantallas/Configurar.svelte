<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Segmentado from '../componentes/Segmentado.svelte';
  import { DIANAS, type TipoDiana } from '../lib/diana';
  import { estado } from '../lib/estado.svelte';
  import { CONTROL, LIMITES, type Configuracion, type Perfil } from '../lib/modelo';

  const c = $state<Configuracion>({ ...estado.config });

  // Distancias habituales en recurvo y la diana que suele usarse en cada una
  const DISTANCIAS: { m: number; diana: TipoDiana }[] = [
    { m: 18, diana: 40 },
    { m: 30, diana: 80 },
    { m: 50, diana: 80 },
    { m: 60, diana: 122 },
    { m: 70, diana: 122 },
  ];

  const rondas = $derived(c.perfil === 'control' ? CONTROL.rondas : c.rondas);
  const flechas = $derived(c.perfil === 'control' ? CONTROL.flechasPorRonda : c.flechasPorRonda);
  const D = LIMITES.distanciaM;
  const valida = $derived(
    c.distanciaM >= D.min && c.distanciaM <= D.max && (c.perfil === 'libre' || (rondas >= 1 && flechas >= 1)),
  );

  const FORMATO: { clave: 'rondas' | 'flechasPorRonda'; texto: string }[] = [
    { clave: 'rondas', texto: 'Rondas' },
    { clave: 'flechasPorRonda', texto: 'Flechas por ronda' },
  ];

  const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v) || min));
  const sumar = (k: 'rondas' | 'flechasPorRonda', d: number) =>
    (c[k] = limitar(c[k] + d, LIMITES[k].min, LIMITES[k].max));
</script>

<Barra titulo="Nueva sesión" />

<div class="cuerpo">
  <section class="grupo">
    <h2 class="sec">Perfil</h2>
    <Segmentado
      etiqueta="Perfil de sesión"
      bind:valor={c.perfil}
      opciones={[
        { valor: 'control' as Perfil, texto: 'Control' },
        { valor: 'abierto' as Perfil, texto: 'Abierto' },
        { valor: 'libre' as Perfil, texto: 'Libre' },
      ]}
    />
    <p class="t-body-s">
      {#if c.perfil === 'control'}
        Formato fijo de {CONTROL.rondas} rondas de {CONTROL.flechasPorRonda} flechas, como una ronda clasificatoria. Sirve
        para comparar sesiones entre sí.
      {:else if c.perfil === 'abierto'}
        Eliges el número de rondas y de flechas por ronda.
      {:else}
        Sin formato: tiras las rondas que quieras, cada una con las flechas que quieras, hasta terminar la sesión. Para
        calentar, practicar técnica o ajustar la mira.
      {/if}
    </p>
  </section>

  <section class="grupo">
    <h2 class="sec">Distancia</h2>
    <div class="campo">
      <input id="distancia" type="number" inputmode="numeric" min={D.min} max={D.max} bind:value={c.distanciaM} />
      <label for="distancia">Distancia de tiro</label>
      <span class="sufijo">m</span>
    </div>
    <div class="chips" role="group" aria-label="Distancias habituales">
      {#each DISTANCIAS as d (d.m)}
        <button
          type="button"
          class="chip estado num"
          aria-pressed={c.distanciaM === d.m}
          onclick={() => {
            c.distanciaM = d.m;
            c.dianaCm = d.diana;
          }}
        >
          {d.m} m
        </button>
      {/each}
    </div>
  </section>

  <section class="grupo">
    <h2 class="sec">Diana</h2>
    <Segmentado
      etiqueta="Tamaño de la diana"
      valor={String(c.dianaCm)}
      opciones={DIANAS.map((d) => ({ valor: String(d.cm), texto: d.nombre }))}
      alCambiar={(v) => (c.dianaCm = Number(v) as TipoDiana)}
    />
  </section>

  {#if c.perfil === 'abierto'}
    <section class="grupo">
      <h2 class="sec">Formato</h2>
      {#each FORMATO as campo (campo.clave)}
        <div class="contador">
          <span class="t-title-m">{campo.texto}</span>
          <button
            type="button"
            class="icbtn estado"
            aria-label="Menos {campo.texto.toLowerCase()}"
            onclick={() => sumar(campo.clave, -1)}><Icono nombre="menos" /></button
          >
          <span class="valor num" aria-live="polite">{c[campo.clave]}</span>
          <button
            type="button"
            class="icbtn estado"
            aria-label="Más {campo.texto.toLowerCase()}"
            onclick={() => sumar(campo.clave, 1)}><Icono nombre="sumar" /></button
          >
        </div>
      {/each}
    </section>
  {/if}

  <div class="pie">
    <p class="t-body-s num">
      {#if c.perfil === 'libre'}
        Rondas y flechas libres hasta que termines la sesión
      {:else}
        {rondas} rondas × {flechas} flechas = {rondas * flechas} flechas · máximo {rondas * flechas * 10} puntos
      {/if}
    </p>
    <button
      type="button"
      class="btn lleno estado ancho"
      disabled={!valida}
      onclick={() => estado.empezar({ ...c, distanciaM: limitar(c.distanciaM, D.min, D.max) })}
    >
      <Icono nombre="bandera" />Empezar sesión
    </button>
  </div>
</div>

<style>
  .cuerpo {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 8px 16px 24px;
  }
  .contador {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .contador .t-title-m {
    flex: 1;
  }
  .valor {
    min-width: 40px;
    text-align: center;
    font-size: 22px;
    line-height: 28px;
  }
  .pie {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .pie p {
    margin: 0;
    text-align: center;
  }
  .ancho {
    width: 100%;
    height: 48px;
  }
</style>
