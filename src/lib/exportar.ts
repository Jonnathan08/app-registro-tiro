import { etiqueta } from './diana';
import type { MarcaMira } from './mira';
import { esLibre, resumen, type Sesion } from './modelo';

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Identificador corto de la sesión (primeros 8 caracteres del UUID). */
export const idCorto = (s: Sesion) => s.id.slice(0, 8);

/** Nombre de archivo: tiro_2026-10-04_70m_a1b2c3d4.csv */
export function nombreArchivo(s: Sesion): string {
  return `tiro_${s.fecha.slice(0, 10)}_${s.distanciaM}m_${idCorto(s)}.csv`;
}

/** Escapa un valor según RFC 4180: comillas si contiene coma, comillas o salto de línea. */
export function celda(v: string | number | boolean | null | undefined): string {
  const t = v === null || v === undefined ? '' : String(v);
  return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export const COLUMNAS = [
  'sesion_id',
  'fecha',
  'perfil',
  'distancia_m',
  'diana_cm',
  'rondas',
  'flechas_por_ronda',
  'total_sesion',
  'ronda',
  'flecha',
  'valor',
  'puntaje',
  'es_x',
  'x_mm',
  'y_mm',
  'corregida',
  'notas_personales',
  'notas_entrenador',
];

function filas(s: Sesion): string[] {
  const total = resumen(s).total;
  const out: string[] = [];
  s.registro.forEach((r, i) => {
    r.flechas.forEach((f, j) => {
      out.push(
        [
          // En Libre: rondas = las que se tiraron; flechas por ronda vacío porque varía
          s.id,
          s.fecha,
          s.perfil,
          s.distanciaM,
          s.dianaCm,
          esLibre(s) ? s.registro.length : s.rondas,
          esLibre(s) ? '' : s.flechasPorRonda,
          total,
          i + 1,
          j + 1,
          etiqueta(f),
          f.puntaje,
          f.x ? 1 : 0,
          f.pos ? r1(f.pos.x) : '',
          f.pos ? r1(f.pos.y) : '',
          f.corregida ? 1 : 0,
          s.notasPersonales,
          s.notasEntrenador,
        ]
          .map(celda)
          .join(','),
      );
    });
  });
  return out;
}

/**
 * Exportación completa en CSV: una fila por flecha. Los datos de la sesión
 * (incluidas las notas) se repiten en cada fila para que cualquier fila se entienda sola.
 */
export function aCSV(sesiones: Sesion | Sesion[]): string {
  const lista = Array.isArray(sesiones) ? sesiones : [sesiones];
  return [COLUMNAS.join(','), ...lista.flatMap(filas)].join('\n') + '\n';
}

/** Columnas del CSV de marcas de mira (archivo aparte: el de sesiones no cambia). */
export const COLUMNAS_MIRA = ['distancia_m', 'elevacion', 'nota', 'actualizada'];

/** Marcas de mira en CSV, una fila por distancia; la elevación con punto decimal, como x_mm. */
export function marcasACSV(marcas: MarcaMira[]): string {
  const filas = marcas.map((m) => [m.distanciaM, m.elevacion, m.nota, m.actualizada].map(celda).join(','));
  return [COLUMNAS_MIRA.join(','), ...filas].join('\n') + '\n';
}

/** Nombre de archivo: tiro_marcas_2026-11-26.csv */
export const nombreArchivoMira = (fecha = new Date()) => `tiro_marcas_${fecha.toISOString().slice(0, 10)}.csv`;

/**
 * Comparte uno o varios archivos con el menú del sistema (Drive, correo, etc.).
 * Si el navegador no permite compartirlos, los descarga.
 */
export async function compartirVarios(
  archivos: { contenido: string; nombre: string }[],
): Promise<'compartido' | 'descargado' | 'cancelado'> {
  const files = archivos.map((a) => new File([a.contenido], a.nombre, { type: 'text/csv' }));
  if (navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files, title: archivos[0].nombre });
      return 'compartido';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelado';
    }
  }
  for (const f of files) {
    const url = URL.createObjectURL(f);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return 'descargado';
}

/** Comparte un archivo (ver compartirVarios). */
export const compartir = (contenido: string, nombre: string) => compartirVarios([{ contenido, nombre }]);
