<script lang="ts">
  import { resumen, type Sesion } from '../lib/modelo';

  let { sesion }: { sesion: Sesion } = $props();
  const r = $derived(resumen(sesion));
  const fmt = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<section class="resumen" aria-label="Resumen de la sesión">
  <div>
    <div class="t-label">Total</div>
    <div class="t-display num">{r.total}<small> / {r.maximo}</small></div>
  </div>
  <div class="stats num">
    <div><b>{r.x}</b><span>X</span></div>
    <div><b>{r.dieces}</b><span>10+X</span></div>
    <div><b>{r.flechas ? fmt.format(r.promedio) : '–'}</b><span>Prom.</span></div>
  </div>
</section>

<style>
  .resumen {
    background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);
    border-radius: var(--shape-l); padding: 16px;
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 4px 16px;
  }
  small { font-size: 16px; line-height: 24px; opacity: .8; }
  .stats { display: flex; gap: 16px; text-align: right; }
  .stats div { display: flex; flex-direction: column; }
  .stats b { font-size: 22px; line-height: 28px; font-weight: 400; }
  .stats span { font-size: 11px; line-height: 16px; font-weight: 500; letter-spacing: .5px; opacity: .85; }
</style>
