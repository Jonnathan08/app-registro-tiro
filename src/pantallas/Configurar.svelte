<script lang="ts">
  import Icono from '../componentes/Icono.svelte';
  import Segmentado from '../componentes/Segmentado.svelte';
  import { DIANAS, type TipoDiana } from '../lib/diana';
  import { estado } from '../lib/estado.svelte';
  import { CONTROL, type Configuracion, type Perfil } from '../lib/modelo';

  const c = $state<Configuracion>({ ...estado.config });

  // Distancias habituales en recurvo y la diana que suele usarse en cada una
  const DISTANCIAS: { m: number; diana: TipoDiana }[] = [
    { m: 18, diana: 40 }, { m: 30, diana: 80 }, { m: 50, diana: 80 }, { m: 60, diana: 122 }, { m: 70, diana: 122 },
  ];

  const rondas = $derived(c.perfil === 'control' ? CONTROL.rondas : c.rondas);
  const flechas = $derived(c.perfil === 'control' ? CONTROL.flechasPorRonda : c.flechasPorRonda);
  const valida = $derived(c.distanciaM >= 1 && c.distanciaM <= 150 && rondas >= 1 && flechas >= 1);

  const FORMATO: { clave: 'rondas' | 'flechasPorRonda'; texto: string; max: number }[] = [
    { clave: 'rondas', texto: 'Rondas', max: 36 },
    { clave: 'flechasPorRonda', texto: 'Flechas por ronda', max: 12 },
  ];

  const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v) || min));
</script>

<header class="barra">
  <h1 class="t-title-l">Nueva sesión</h1>
</header>

<div class="cuerpo">
  <section class="grupo">
    <h2 class="sec">Perfil</h2>
    <Segmentado
      etiqueta="Perfil de sesión"
      bind:valor={c.perfil}
      opciones={[{ valor: 'control' as Perfil, texto: 'Control' }, { valor: 'abierto' as Perfil, texto: 'Abierto' }]}
    />
    <p class="t-body-s">
      {#if c.perfil === 'control'}
        Formato fijo de {CONTROL.rondas} rondas de {CONTROL.flechasPorRonda} flechas, como una ronda clasificatoria. Sirve para comparar sesiones entre sí.
      {:else}
        Eliges el número de rondas y de flechas por ronda.
      {/if}
    </p>
  </section>

  <section class="grupo">
    <h2 class="sec">Distancia</h2>
    <div class="campo">
      <input id="distancia" type="number" inputmode="numeric" min="1" max="150" bind:value={c.distanciaM} />
      <label for="distancia">Distancia de tiro</label>
      <span class="sufijo">m</span>
    </div>
    <div class="chips" role="group" aria-label="Distancias habituales">
      {#each DISTANCIAS as d (d.m)}
        <button type="button" class="chip estado num" aria-pressed={c.distanciaM === d.m} onclick={() => { c.distanciaM = d.m; c.dianaCm = d.diana; }}>
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
          <button type="button" class="icbtn estado" aria-label="Menos {campo.texto.toLowerCase()}" onclick={() => (c[campo.clave] = limitar(c[campo.clave] - 1, 1, campo.max))}><Icono nombre="menos" /></button>
          <span class="valor num" aria-live="polite">{c[campo.clave]}</span>
          <button type="button" class="icbtn estado" aria-label="Más {campo.texto.toLowerCase()}" onclick={() => (c[campo.clave] = limitar(c[campo.clave] + 1, 1, campo.max))}><Icono nombre="sumar" /></button>
        </div>
      {/each}
    </section>
  {/if}

  <div class="pie">
    <p class="t-body-s num">{rondas} rondas × {flechas} flechas = {rondas * flechas} flechas · máximo {rondas * flechas * 10} puntos</p>
    <button type="button" class="btn lleno estado ancho" disabled={!valida} onclick={() => estado.empezar({ ...c, distanciaM: limitar(c.distanciaM, 1, 150) })}>
      <Icono nombre="bandera" />Empezar sesión
    </button>
  </div>
</div>

<style>
  .barra { height: 64px; display: flex; align-items: center; padding: 0 16px; }
  h1 { margin: 0; }
  .cuerpo { display: flex; flex-direction: column; gap: 24px; padding: 8px 16px 24px; }
  .grupo { display: flex; flex-direction: column; gap: 12px; }
  .grupo p { margin: 0; }
  .contador { display: flex; align-items: center; gap: 4px; }
  .contador .t-title-m { flex: 1; }
  .valor { min-width: 40px; text-align: center; font-size: 22px; line-height: 28px; }
  .pie { display: flex; flex-direction: column; gap: 12px; }
  .pie p { margin: 0; text-align: center; }
  .ancho { width: 100%; height: 48px; }
</style>
