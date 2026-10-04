<script lang="ts">
  import type { Sesion } from '../lib/modelo';

  // Al terminar la sesión las notas quedan bloqueadas (solo lectura)
  let { sesion, alCambiar, bloqueadas = false }: { sesion: Sesion; alCambiar?: () => void; bloqueadas?: boolean } = $props();

  // Guarda medio segundo después de dejar de escribir
  let espera: ReturnType<typeof setTimeout>;
  function cambio() {
    clearTimeout(espera);
    espera = setTimeout(() => alCambiar?.(), 500);
  }
</script>

<section class="notas" aria-label="Notas">
  <h2 class="sec">Notas</h2>
  {#if bloqueadas}
    <div class="campo">
      <textarea id="notas-personales" readonly value={sesion.notasPersonales} placeholder="Sin notas"></textarea>
      <label for="notas-personales">Notas personales</label>
    </div>
    <div class="campo">
      <textarea id="notas-entrenador" readonly value={sesion.notasEntrenador} placeholder="Sin notas"></textarea>
      <label for="notas-entrenador">Notas del entrenador</label>
    </div>
  {:else}
    <div class="campo">
      <textarea id="notas-personales" bind:value={sesion.notasPersonales} oninput={cambio} onblur={() => alCambiar?.()} placeholder="Sensaciones, técnica, condiciones…"></textarea>
      <label for="notas-personales">Notas personales</label>
    </div>
    <div class="campo">
      <textarea id="notas-entrenador" bind:value={sesion.notasEntrenador} oninput={cambio} onblur={() => alCambiar?.()} placeholder="Correcciones y tareas del entrenador"></textarea>
      <label for="notas-entrenador">Notas del entrenador</label>
    </div>
  {/if}
</section>

<style>
  .notas { display: flex; flex-direction: column; gap: 20px; }
  textarea::placeholder { color: var(--md-sys-color-on-surface-variant); opacity: .7; }
  textarea[readonly] { border-style: dashed; resize: none; }
  textarea[readonly]:focus { border: 1px dashed var(--md-sys-color-outline); padding: 15px 16px; }
</style>
