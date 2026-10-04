<script lang="ts">
  // Animación de entrada: dos flechas fallan el centro de una diana gris, la tercera acierta
  // y los colores se expanden anillo por anillo hacia afuera. Solo al abrir la app; un toque la salta.
  let visible = $state(!matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Del centro hacia afuera: el oro aparece primero
  const ANILLOS = [
    { r: 40, gris: '#c8c8c8', color: 'var(--diana-oro)' },
    { r: 80, gris: '#6a6a6a', color: 'var(--diana-rojo)' },
    { r: 120, gris: '#8a8a8a', color: 'var(--diana-azul)' },
    { r: 160, gris: '#2b2b2b', color: 'var(--diana-negro)' },
    { r: 200, gris: '#ffffff', color: 'var(--diana-blanco)' },
  ];
  const DE_AFUERA_A_ADENTRO = [...ANILLOS].reverse();

  // Tiempos en ms. Cada flecha cae más cerca: azul, rojo y oro.
  const VUELO = 380;
  const FLECHAS = [
    { x: 330, y: 190, angulo: 33, impacto: 480 },
    { x: 204, y: 283, angulo: 57, impacto: 1000 },
    { x: 256, y: 256, angulo: 48, impacto: 1520 },
  ];
  const ACIERTO = FLECHAS[FLECHAS.length - 1].impacto;
  const PASO_COLOR = 90;
  const SALIDA = 2450;

  function terminar() {
    visible = false;
  }

  $effect(() => {
    if (!visible) return;
    // Respaldo por si animationend no llega (pestaña en segundo plano, etc.)
    const t = setTimeout(terminar, SALIDA + 1500);
    addEventListener('keydown', terminar, { once: true });
    return () => {
      clearTimeout(t);
      removeEventListener('keydown', terminar);
    };
  });
</script>

{#if visible}
  <div
    class="entrada"
    aria-hidden="true"
    style:--salida="{SALIDA}ms"
    onpointerdown={terminar}
    onanimationend={(e) => e.target === e.currentTarget && terminar()}
  >
    <svg viewBox="-40 -40 592 592">
      <!-- Un grupo por flecha para que la diana se sacuda en cada impacto -->
      <g class="golpe" style:--t="{FLECHAS[0].impacto}ms">
        <g class="golpe" style:--t="{FLECHAS[1].impacto}ms">
          <g class="golpe" style:--t="{FLECHAS[2].impacto}ms">
            {#each DE_AFUERA_A_ADENTRO as a (a.r)}
              <circle cx="256" cy="256" r={a.r} fill={a.gris} />
            {/each}
            {#each DE_AFUERA_A_ADENTRO as a, i (a.r)}
              <circle
                cx="256" cy="256" r={a.r} fill={a.color} class="color"
                style:--t="{ACIERTO + (ANILLOS.length - 1 - i) * PASO_COLOR}ms"
              />
            {/each}
            <circle cx="256" cy="256" r="200" fill="none" class="borde" />
          </g>
        </g>
      </g>
      {#each FLECHAS as f, i (i)}
        <circle cx={f.x} cy={f.y} r="12" class="impacto" class:acierto={f.impacto === ACIERTO} style:--t="{f.impacto}ms" />
        <g transform="translate({f.x} {f.y}) rotate({f.angulo})">
          <g class="flecha" style:--t="{f.impacto - VUELO}ms" style:--vuelo="{VUELO}ms">
            <line x1="0" y1="0" x2="250" y2="0" class="asta" />
            <path d="M190 0 L240 -18 L262 -18 L218 0 L262 18 L240 18 Z" class="plumas" />
            <rect x="250" y="-5" width="14" height="10" rx="3" class="culatin" />
          </g>
        </g>
      {/each}
    </svg>
  </div>
{/if}

<style>
  .entrada {
    position: fixed; inset: 0; z-index: 30;
    display: flex; align-items: center; justify-content: center;
    background: var(--md-sys-color-surface);
    animation: salir 300ms ease-in var(--salida) forwards;
  }
  svg { width: min(60vw, 260px); overflow: visible; }
  .borde { stroke: var(--md-sys-color-outline-variant); stroke-width: 2; }

  /* Los tiempos (--t, --vuelo, --salida) vienen del script. La flecha es invisible
     hasta que despega, para que no se vea esperando en pantallas anchas. */
  .flecha { animation: vuelo var(--vuelo) cubic-bezier(.3, 0, .8, .15) var(--t) backwards; }
  .asta { stroke: var(--md-sys-color-on-surface); stroke-width: 7; stroke-linecap: round; }
  .plumas { fill: var(--md-sys-color-primary); }
  .culatin { fill: var(--md-sys-color-on-surface); }

  .golpe { transform-box: fill-box; transform-origin: center; animation: golpe 220ms ease-out var(--t); }
  .impacto {
    fill: none; stroke: var(--md-sys-color-on-surface); stroke-width: 4; opacity: 0;
    transform-box: fill-box; transform-origin: center;
    animation: onda 300ms ease-out var(--t);
  }
  .impacto.acierto { animation: onda-acierto 420ms ease-out var(--t); }

  /* Tras el acierto, los colores se expanden del centro hacia afuera */
  .color {
    transform-box: fill-box; transform-origin: center;
    animation: color 380ms cubic-bezier(.2, 0, 0, 1) var(--t) backwards;
  }

  @keyframes vuelo { from { transform: translateX(900px); opacity: 0; } 20% { opacity: 1; } }
  @keyframes golpe { 35% { transform: scale(.96); } }
  @keyframes onda { from { opacity: .5; transform: scale(1); } to { opacity: 0; transform: scale(2.5); } }
  @keyframes onda-acierto { from { opacity: .7; transform: scale(1); } to { opacity: 0; transform: scale(6); } }
  @keyframes color { from { transform: scale(0); } }
  @keyframes salir { to { opacity: 0; } }

  @media (prefers-reduced-motion: reduce) { .entrada { display: none; } }
</style>
