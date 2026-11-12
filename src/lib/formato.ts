// Formatos de números y fechas compartidos por las pantallas (español).

const dec = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const conHora = new Intl.DateTimeFormat('es', { dateStyle: 'full', timeStyle: 'short' });
const lista = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const corta = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });
const dia = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' });
const mes = new Intl.DateTimeFormat('es', { month: 'long' });
const larga = new Intl.DateTimeFormat('es', { dateStyle: 'full' });

/** Número con dos decimales: 8,25 */
export const dosDecimales = (v: number) => dec.format(v);
/** Fecha ISO completa con hora: «domingo, 4 de octubre de 2026, 11:30» */
export const fechaHora = (iso: string) => conHora.format(new Date(iso));
/** Fecha ISO para listas: «dom, 4 oct 2026» */
export const fechaLista = (iso: string) => lista.format(new Date(iso));
/** Fecha ISO para ejes de gráficos: «4 oct» */
export const fechaCorta = (iso: string) => corta.format(new Date(iso));
/** Fecha ISO sin año, para listas agrupadas por mes: «mié, 11 nov» */
export const fechaDia = (iso: string) => dia.format(new Date(iso));
/** Fecha ISO completa, para el lector de pantalla: «miércoles, 11 de noviembre de 2026» */
export const fechaLarga = (iso: string) => larga.format(new Date(iso));
/** Mes y año de una fecha ISO, para separadores: «Noviembre 2026» */
export function mesAnio(iso: string): string {
  const d = new Date(iso);
  const m = mes.format(d);
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${d.getFullYear()}`;
}
