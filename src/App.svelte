<script lang="ts">
  import Aviso from './componentes/Aviso.svelte';
  import Entrada from './componentes/Entrada.svelte';
  import Icono, { type NombreIcono } from './componentes/Icono.svelte';
  import { estado, type Pantalla } from './lib/estado.svelte';
  import Ajustes from './pantallas/Ajustes.svelte';
  import Configurar from './pantallas/Configurar.svelte';
  import Detalle from './pantallas/Detalle.svelte';
  import Historial from './pantallas/Historial.svelte';
  import Registro from './pantallas/Registro.svelte';

  const DESTINOS: { p: Pantalla; texto: string; icono: NombreIcono }[] = [
    { p: 'sesion', texto: 'Sesión', icono: 'diana' },
    { p: 'historial', texto: 'Historial', icono: 'historial' },
    { p: 'ajustes', texto: 'Ajustes', icono: 'ajustes' },
  ];

  function ir(p: Pantalla) {
    if (p === 'historial' && estado.pantalla === 'historial') estado.detalle = null;
    estado.pantalla = p;
    scrollTo(0, 0);
  }
</script>

<main>
  {#if estado.error}
    <div class="error" role="alert">
      <p class="t-title-m">No se pudieron abrir tus sesiones</p>
      <p class="t-body-s">{estado.error}</p>
      <button type="button" class="btn lleno estado" onclick={() => estado.cargar()}>Reintentar</button>
    </div>
  {:else if !estado.cargado}
    <p class="cargando t-body-s">Cargando…</p>
  {:else if estado.pantalla === 'sesion'}
    {#if estado.activa}
      <Registro sesion={estado.activa} />
    {:else}
      <Configurar />
    {/if}
  {:else if estado.pantalla === 'historial'}
    {#if estado.detalle}
      <Detalle sesion={estado.detalle} />
    {:else}
      <Historial />
    {/if}
  {:else}
    <Ajustes />
  {/if}
</main>

<Aviso />
<Entrada />

<nav aria-label="Navegación principal">
  {#each DESTINOS as d (d.p)}
    <button
      type="button"
      class="destino estado"
      aria-current={estado.pantalla === d.p ? 'page' : undefined}
      onclick={() => ir(d.p)}
    >
      <span class="recuadro"><Icono nombre={d.icono} /></span>
      <span class="etiqueta">{d.texto}</span>
    </button>
  {/each}
</nav>

<style>
  main {
    max-width: 600px;
    margin: 0 auto;
    padding-bottom: calc(var(--alto-nav) + 20px + env(safe-area-inset-bottom, 0px));
  }
  .cargando {
    text-align: center;
    padding: 48px 16px;
  }
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    padding: 48px 24px;
  }
  .error p {
    margin: 0;
    max-width: 40ch;
  }
  nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    height: calc(var(--alto-nav) + env(safe-area-inset-bottom, 0px));
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--md-sys-color-surface-container-lowest);
    border-top: 1px solid var(--md-sys-color-surface-container-highest);
  }
  .destino {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: none;
    border: 0;
    cursor: pointer;
    color: var(--md-sys-color-on-surface-variant);
  }
  .recuadro {
    width: 56px;
    height: 32px;
    border-radius: var(--shape-s);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .etiqueta {
    font-family: var(--font-marcador);
    font-size: 14px;
    line-height: 16px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }
  .destino[aria-current='page'] {
    color: var(--md-sys-color-primary);
  }
  .destino[aria-current='page'] .recuadro {
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
</style>
