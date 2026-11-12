<script lang="ts">
  import { dosDecimales } from '../lib/formato';
  import { resumen, type Sesion } from '../lib/modelo';

  let { sesion }: { sesion: Sesion } = $props();
  const r = $derived(resumen(sesion));
</script>

<section class="resumen" aria-label="Resumen de la sesión">
  <div>
    <div class="t-label">
      Total <span class="flechas num">· {r.flechas} {r.flechas === 1 ? 'flecha' : 'flechas'}</span>
    </div>
    <div class="t-display num">{r.total}<small> / {r.maximo}</small></div>
  </div>
  <div class="stats num">
    <div><b>{r.x}</b><span>X</span></div>
    <div><b>{r.dieces}</b><span>10+X</span></div>
    <div><b>{r.flechas ? dosDecimales(r.promedio) : '–'}</b><span>Prom.</span></div>
  </div>
</section>

<style>
  .resumen {
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    border-radius: var(--shape-l);
    padding: 16px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 4px 16px;
  }
  .flechas {
    font-weight: 400;
    opacity: 0.8;
  }
  small {
    font-size: 16px;
    line-height: 24px;
    opacity: 0.8;
  }
  .stats {
    display: flex;
    gap: 16px;
    text-align: right;
  }
  .stats div {
    display: flex;
    flex-direction: column;
  }
  .stats b {
    font-size: 22px;
    line-height: 28px;
    font-weight: 400;
  }
  .stats span {
    font-size: 11px;
    line-height: 16px;
    font-weight: 500;
    letter-spacing: 0.5px;
    opacity: 0.85;
  }
</style>
