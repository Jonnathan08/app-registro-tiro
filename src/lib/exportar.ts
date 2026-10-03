import { etiqueta } from './diana';
import type { Sesion } from './modelo';

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Nombre de archivo: tiro_2026-10-04_70m.json */
export function nombreArchivo(s: Sesion, ext: 'json' | 'csv'): string {
  return `tiro_${s.fecha.slice(0, 10)}_${s.distanciaM}m.${ext}`;
}

export function aJSON(s: Sesion): string {
  return JSON.stringify(s, null, 2);
}

/** Una fila por flecha. Las notas van solo en el JSON. */
export function aCSV(s: Sesion): string {
  const cab = ['sesion_id', 'fecha', 'perfil', 'distancia_m', 'diana_cm', 'ronda', 'flecha', 'valor', 'puntaje', 'es_x', 'x_mm', 'y_mm'];
  const filas = [cab.join(',')];
  s.registro.forEach((r, i) => {
    r.flechas.forEach((f, j) => {
      filas.push([
        s.id, s.fecha, s.perfil, s.distanciaM, s.dianaCm, i + 1, j + 1,
        etiqueta(f), f.puntaje, f.x ? 1 : 0,
        f.pos ? r1(f.pos.x) : '', f.pos ? r1(f.pos.y) : '',
      ].join(','));
    });
  });
  return filas.join('\n') + '\n';
}

/**
 * Comparte el archivo con el menú del sistema (Drive, correo, etc.).
 * Si el navegador no permite compartir archivos, lo descarga.
 */
export async function compartir(contenido: string, nombre: string, tipo: string): Promise<'compartido' | 'descargado' | 'cancelado'> {
  const archivo = new File([contenido], nombre, { type: tipo });
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: nombre });
      return 'compartido';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelado';
    }
  }
  const url = URL.createObjectURL(archivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'descargado';
}
