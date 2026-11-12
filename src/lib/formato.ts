// Formatos de números y fechas compartidos por las pantallas (español).

const dec = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const conHora = new Intl.DateTimeFormat('es', { dateStyle: 'full', timeStyle: 'short' });
const lista = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const corta = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

/** Número con dos decimales: 8,25 */
export const dosDecimales = (v: number) => dec.format(v);
/** Fecha ISO completa con hora: «domingo, 4 de octubre de 2026, 11:30» */
export const fechaHora = (iso: string) => conHora.format(new Date(iso));
/** Fecha ISO para listas: «dom, 4 oct 2026» */
export const fechaLista = (iso: string) => lista.format(new Date(iso));
/** Fecha ISO para ejes de gráficos: «4 oct» */
export const fechaCorta = (iso: string) => corta.format(new Date(iso));
