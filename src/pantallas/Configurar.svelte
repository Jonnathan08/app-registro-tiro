<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Marcador, { type Cifra } from '../componentes/Marcador.svelte';
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

  const distanciaValida = $derived(c.distanciaM >= D.min && c.distanciaM <= D.max);
  // Tablero: el formato que se va a tirar, al día con lo que se elige
  const cifras = $derived<Cifra[]>(
    c.perfil === 'libre'
      ? [
          { rotulo: 'Formato', valor: 'Libre' },
          distanciaValida
            ? { rotulo: 'Distancia', valor: c.distanciaM, sufijo: ' m', sufijoLeido: ' metros' }
            : { rotulo: 'Distancia', valor: '–', leido: 'sin definir' },
          { rotulo: 'Diana', valor: c.dianaCm, sufijo: ' cm', sufijoLeido: ' centímetros' },
        ]
      : valida
        ? [
            { rotulo: 'Formato', valor: rondas, sufijo: `×${flechas}`, sufijoLeido: ` rondas de ${flechas} flechas` },
            { rotulo: 'Flechas', valor: rondas * flechas },
            { rotulo: 'Máximo', valor: rondas * flechas * 10, leido: `${rondas * flechas * 10} puntos`, acento: true },
          ]
        : [
            { rotulo: 'Formato', valor: '–', leido: 'sin definir' },
            { rotulo: 'Flechas', valor: '–', leido: 'sin definir' },
            { rotulo: 'Máximo', valor: '–', leido: 'sin definir', acento: true },
          ],
  );

  const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v) || min));
  const sumar = (k: 'rondas' | 'flechasPorRonda', d: number) =>
    (c[k] = limitar(c[k] + d, LIMITES[k].min, LIMITES[k].max));
</script>

<Barra titulo="Nueva sesión" />
<Marcador {cifras} etiqueta="Formato de la sesión" />

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
    <label class="caja-cifra" class:error={!distanciaValida}>
      <span class="texto">Distancia de tiro<span class="oculto"> en metros</span></span>
      <input
        id="distancia"
        type="number"
        inputmode="numeric"
        min={D.min}
        max={D.max}
        bind:value={c.distanciaM}
        aria-invalid={!distanciaValida}
        aria-describedby={distanciaValida ? undefined : 'error-distancia'}
      />
      <span class="unidad" aria-hidden="true">m</span>
    </label>
    {#if !distanciaValida}
      <p id="error-distancia" class="t-body-s error-texto">Escribe una distancia entre {D.min} y {D.max} m.</p>
    {/if}
    <div class="chips" role="group" aria-label="Distancias habituales">
      {#each DISTANCIAS as d (d.m)}
        <button
          type="button"
          class="chip estado"
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
          <span class="nombre">{campo.texto}</span>
          <button
            type="button"
            class="paso estado"
            aria-label="Menos {campo.texto.toLowerCase()}"
            onclick={() => sumar(campo.clave, -1)}><Icono nombre="menos" /></button
          >
          <span class="valor t-cifra-l" aria-live="polite">{c[campo.clave]}</span>
          <button
            type="button"
            class="paso estado"
            aria-label="Más {campo.texto.toLowerCase()}"
            onclick={() => sumar(campo.clave, 1)}><Icono nombre="sumar" /></button
          >
        </div>
      {/each}
    </section>
  {/if}

  <div class="pie">
    <button
      type="button"
      class="btn lleno grande estado ancho"
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
    gap: 20px;
    padding: 18px 16px 0;
  }
  .grupo h2 {
    margin: 0;
  }
  .error-texto {
    color: var(--md-sys-color-error);
  }
  .contador {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .nombre {
    flex: 1;
    font-size: 16px;
  }
  .paso {
    width: 48px;
    height: 48px;
    border: 2px solid var(--md-sys-color-outline-variant);
    border-radius: var(--shape-s);
    background: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .valor {
    min-width: 44px;
    text-align: center;
  }
  /* «Empezar sesión» siempre a mano, justo encima de la navegación */
  .pie {
    position: sticky;
    bottom: calc(var(--alto-nav) + env(safe-area-inset-bottom, 0px));
    padding: 12px 0 14px;
    background: var(--md-sys-color-surface);
  }
  .ancho {
    width: 100%;
  }
</style>
