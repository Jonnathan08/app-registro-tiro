<script lang="ts">
  import { colorCalor, isolinea, NIVEL_CONTORNO, type Punto } from '../lib/calor';

  // Agrupación sobre una diana en grises: mapa de calor (canvas) o, con pocas flechas, los impactos.
  // Coordenadas en radios de diana (1 = borde del anillo 1), y hacia arriba.
  let {
    puntos,
    dens,
    n,
    centro,
    etiqueta,
  }: {
    puntos: Punto[];
    /** Densidad n×n (0 a 1) del mapa de calor; null para dibujar los impactos. */
    dens: Float32Array | null;
    n: number;
    centro: Punto | null;
    /** Nombre de la figura para el lector de pantalla. */
    etiqueta: string;
  } = $props();

  // Grises fijos por zona, de fuera adentro (blanco, negro, azul, rojo, oro): solo el mapa lleva color
  const ZONAS = ['#f4f5f6', '#a3a9ad', '#cdd2d5', '#b3b9bd', '#e3e6e8'];
  const TINTA = 'var(--diana-tinta)';

  let ancho = $state(0);
  let lienzo = $state<HTMLCanvasElement>();

  // Se redibuja solo si cambian los datos o el tamaño
  $effect(() => {
    if (!lienzo || !dens || !ancho) return;
    const lado = Math.round(ancho * (devicePixelRatio || 1));
    lienzo.width = lado;
    lienzo.height = lado;
    const aux = document.createElement('canvas');
    aux.width = n;
    aux.height = n;
    const ca = aux.getContext('2d');
    const ctx = lienzo.getContext('2d');
    if (!ca || !ctx) return;
    const img = ca.createImageData(n, n);
    for (let k = 0; k < dens.length; k++) img.data.set(colorCalor(dens[k]), k * 4);
    ca.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, lado, lado);
    ctx.save();
    ctx.beginPath();
    ctx.arc(lado / 2, lado / 2, lado / 2, 0, 2 * Math.PI);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(aux, 0, 0, lado, lado);
    // Contorno oscuro de la zona de más impactos: su blanco no se confunde con el centro claro de la diana
    ctx.strokeStyle = 'rgb(35 31 32 / 0.65)';
    ctx.lineWidth = 1.5 * (devicePixelRatio || 1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    const px = (p: Punto) => [((p.x + 1) / 2) * lado, ((1 - p.y) / 2) * lado] as const;
    for (const [a, b] of isolinea(dens, n, NIVEL_CONTORNO)) {
      ctx.moveTo(...px(a));
      ctx.lineTo(...px(b));
    }
    ctx.stroke();
    ctx.restore();
  });

  const c = 0.035; // medio lado de la ✕ del centro
</script>

<div class="marco" role="img" aria-label={etiqueta} bind:clientWidth={ancho}>
  <svg viewBox="-1 -1 2 2" aria-hidden="true">
    {#each ZONAS as color, i (i)}
      <circle r={1 - i * 0.2} fill={color} />
    {/each}
  </svg>
  {#if dens}<canvas bind:this={lienzo} aria-hidden="true"></canvas>{/if}
  <svg viewBox="-1 -1 2 2" aria-hidden="true">
    {#each { length: 10 }, i (i)}
      <circle class="linea" r={(i + 1) / 10} stroke={TINTA} />
    {/each}
    <circle class="linea" r="0.05" stroke={TINTA} />
    {#if !dens}
      {#each puntos as p, i (i)}
        <circle class="impacto" cx={p.x} cy={-p.y} r="0.025" fill={TINTA} />
      {/each}
    {/if}
    {#if centro}
      {@const d = `M${centro.x - c} ${-centro.y - c}L${centro.x + c} ${-centro.y + c}M${centro.x + c} ${-centro.y - c}L${centro.x - c} ${-centro.y + c}`}
      <path class="centro" {d} stroke={TINTA} stroke-width="0.03" />
      <path class="centro" {d} stroke="#fff" stroke-width="0.014" />
    {/if}
  </svg>
</div>

<style>
  .marco {
    position: relative;
    width: 100%;
    max-width: 360px;
    aspect-ratio: 1;
    margin: 0 auto;
    border-radius: 50%;
    border: 2px solid var(--md-sys-color-on-surface);
    overflow: hidden;
  }
  svg,
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .linea {
    fill: none;
    stroke-width: 0.004;
    stroke-opacity: 0.45;
  }
  /* Como las flechas de Diana: tinta con borde blanco, visibles sobre cualquiera de los grises */
  .impacto {
    stroke: #fff;
    stroke-width: 0.01;
  }
  .centro {
    fill: none;
    stroke-linecap: round;
  }
</style>
