<script lang="ts">
  import { untrack } from 'svelte';
  import { etiqueta, zona, type TipoDiana } from '../lib/diana';
  import { corregir, suma, type Flecha } from '../lib/modelo';
  import Diana from './Diana.svelte';
  import Icono from './Icono.svelte';
  import Segmentado from './Segmentado.svelte';
  import Teclado from './Teclado.svelte';

  let {
    numero,
    flechas,
    dianaCm,
    alGuardar,
    alCerrar,
  }: {
    numero: number;
    flechas: Flecha[];
    dianaCm: TipoDiana;
    alGuardar: (f: Flecha[]) => void;
    alCerrar: () => void;
  } = $props();

  // Se trabaja sobre una copia; nada cambia hasta "Guardar cambios"
  const original = untrack(() => $state.snapshot(flechas));
  let copia = $state<Flecha[]>(structuredClone(original));
  let sel = $state(0);
  let modo = $state<'teclado' | 'diana'>('teclado');
  const cambiada = $derived(JSON.stringify(copia) !== JSON.stringify(original));
  const puntos = $derived(suma(copia));

  function tecla(puntaje: number, x: boolean) {
    copia[sel] = corregir(copia[sel], puntaje, x);
    if (sel < copia.length - 1) sel++;
  }

  let dlg: HTMLDialogElement;
  $effect(() => {
    dlg.showModal();
  });
</script>

<dialog bind:this={dlg} class="hoja-inferior" aria-labelledby="editar-titulo" onclose={alCerrar}>
  <div class="cab">
    <h2 id="editar-titulo" class="t-title-l">Editar ronda {numero}</h2>
    <span class="t-body-s num">{puntos} pts</span>
    <button type="button" class="icbtn estado" aria-label="Cerrar sin guardar" onclick={() => dlg.close()}
      ><Icono nombre="cerrar" /></button
    >
  </div>

  <div class="flechas num" role="radiogroup" aria-label="Flecha a corregir" style:--cols={Math.min(copia.length, 6)}>
    {#each copia as f, i (i)}
      <button
        type="button"
        role="radio"
        aria-checked={i === sel}
        aria-label="Flecha {i + 1}: {etiqueta(f)}"
        class="flecha estado z-{zona(f.puntaje)}"
        class:sel={i === sel}
        class:corregida={f.corregida}
        onclick={() => (sel = i)}>{etiqueta(f)}<small>{i + 1}</small></button
      >
    {/each}
  </div>

  <Segmentado
    etiqueta="Forma de corregir"
    bind:valor={modo}
    opciones={[
      { valor: 'teclado' as const, texto: 'Teclado' },
      { valor: 'diana' as const, texto: 'Diana' },
    ]}
  />

  {#if modo === 'teclado'}
    <Teclado compacto alTocar={tecla} />
    {#if copia[sel].pos}
      <p class="aviso">
        Corregir con el teclado quita la flecha {sel + 1} de la diana. Para conservar su posición, márcala de nuevo en
        <b>Diana</b>.
      </p>
    {:else}
      <p class="t-body-s">Cambia el valor de la flecha {sel + 1}.</p>
    {/if}
  {:else}
    <Diana {dianaCm} actuales={copia} seleccionada={sel} interactiva ampliable alMarcar={(f) => (copia[sel] = f)} />
    <p class="t-body-s">Marca de nuevo la flecha {sel + 1}: reemplaza su posición y su valor.</p>
  {/if}

  <div class="acciones">
    <button type="button" class="btn texto estado" onclick={() => dlg.close()}>Cancelar</button>
    <button
      type="button"
      class="btn lleno estado"
      disabled={!cambiada}
      onclick={() => {
        alGuardar($state.snapshot(copia));
        dlg.close();
      }}
    >
      <Icono nombre="check" />Guardar cambios
    </button>
  </div>
</dialog>

<style>
  .hoja-inferior {
    margin: auto auto 0;
    width: 100%;
    max-width: 600px;
    max-height: 92dvh;
    overflow-y: auto;
    border: 0;
    border-radius: var(--shape-xl) var(--shape-xl) 0 0;
    padding: 8px 16px calc(16px + env(safe-area-inset-bottom, 0px));
    background: var(--md-sys-color-surface-container-low);
    color: var(--md-sys-color-on-surface);
    --fondo-campo: var(--md-sys-color-surface-container-low);
  }
  .hoja-inferior[open] {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .hoja-inferior::backdrop {
    background: rgb(0 0 0 / 0.32);
  }
  .hoja-inferior::before {
    content: '';
    align-self: center;
    width: 32px;
    height: 4px;
    border-radius: 2px;
    margin-top: 8px;
    background: var(--md-sys-color-on-surface-variant);
    opacity: 0.4;
  }
  .cab {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cab h2 {
    margin: 0;
    flex: 1;
  }
  .flechas {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 8px;
  }
  .flecha {
    aspect-ratio: 1;
    width: 100%;
    max-width: 56px;
    justify-self: center;
    border: 0;
    border-radius: var(--shape-full);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 500;
    line-height: 18px;
  }
  .flecha small {
    font-size: 10px;
    line-height: 12px;
    opacity: 0.7;
  }
  .flecha.sel {
    outline: 3px solid var(--md-sys-color-primary);
    outline-offset: 3px;
  }
  .flecha.corregida:not(.sel) {
    outline: 2px solid var(--md-sys-color-tertiary);
    outline-offset: 1px;
  }
  p {
    margin: 0;
  }
  .aviso {
    font-size: 14px;
    line-height: 20px;
    padding: 12px 16px;
    border-radius: var(--shape-m);
    background: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
  }
  .acciones {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
