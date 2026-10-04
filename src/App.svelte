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
  {#if !estado.cargado}
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
    <button type="button" class="destino" aria-current={estado.pantalla === d.p ? 'page' : undefined} onclick={() => ir(d.p)}>
      <span class="pill estado"><Icono nombre={d.icono} /></span>
      <span class="t-label">{d.texto}</span>
    </button>
  {/each}
</nav>

<style>
  main { max-width: 600px; margin: 0 auto; padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
  .cargando { text-align: center; padding: 48px 16px; }
  nav {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 10;
    display: grid; grid-template-columns: repeat(3, 1fr);
    background: var(--md-sys-color-surface-container);
    padding: 12px 0 calc(16px + env(safe-area-inset-bottom, 0px));
  }
  .destino { display: flex; flex-direction: column; align-items: center; gap: 4px; background: none; border: 0; cursor: pointer; color: var(--md-sys-color-on-surface-variant); }
  .pill { width: 64px; height: 32px; border-radius: var(--shape-full); display: flex; align-items: center; justify-content: center; }
  .destino[aria-current="page"] { color: var(--md-sys-color-on-surface); }
  .destino[aria-current="page"] .pill { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
</style>
