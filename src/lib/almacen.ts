// Almacenamiento local en IndexedDB. Nada sale del dispositivo.
import { openDB, type DBSchema } from 'idb';
import { validarMarca, type MarcaMira } from './mira';
import { migrar, type Sesion } from './modelo';

interface Esquema extends DBSchema {
  sesiones: { key: string; value: Sesion; indexes: { fecha: string } };
  /** Libreta de marcas de mira: una por distancia (desde la v2). */
  marcas: { key: number; value: MarcaMira };
}

// Se abre al primer uso: si el navegador bloquea IndexedDB, el error llega a quien llama
let db: ReturnType<typeof abrir> | null = null;
function abrir() {
  return openDB<Esquema>('registro-tiro', 2, {
    // Solo se añade: nunca se borra ni se recrea un almacén con datos
    upgrade(d, viejo) {
      if (viejo < 1) {
        const t = d.createObjectStore('sesiones', { keyPath: 'id' });
        t.createIndex('fecha', 'fecha');
      }
      if (viejo < 2) d.createObjectStore('marcas', { keyPath: 'distanciaM' });
    },
    // Otra pestaña abierta con la versión anterior impide actualizar hasta que se cierre
    blocked() {
      console.error('IndexedDB: actualización bloqueada por otra pestaña de la app abierta');
    },
    // Si otra pestaña pide una versión nueva, esta cede la conexión y la reabre al siguiente uso
    blocking() {
      void db?.then((c) => c.close());
      db = null;
    },
    terminated() {
      db = null;
    },
  });
}
function base() {
  db ??= abrir().catch((e) => {
    db = null; // permite reintentar
    throw e;
  });
  return db;
}

/** Guarda una sesión. Debe ser un objeto plano (sin proxies de Svelte: usar $state.snapshot). */
export async function guardar(s: Sesion): Promise<void> {
  await (await base()).put('sesiones', { ...s, actualizada: new Date().toISOString() });
}

/** Guarda varias sesiones en una sola transacción: o se guardan todas o ninguna. */
export async function guardarVarias(ss: Sesion[]): Promise<void> {
  const tx = (await base()).transaction('sesiones', 'readwrite');
  await Promise.all([...ss.map((s) => tx.store.put(s)), tx.done]);
}

/** Todas las sesiones, de la más reciente a la más antigua. */
export async function listar(): Promise<Sesion[]> {
  const todas = await (await base()).getAllFromIndex('sesiones', 'fecha');
  return todas.reverse().map(migrar);
}

export async function borrar(id: string): Promise<void> {
  await (await base()).delete('sesiones', id);
}

/** Marcas de mira guardadas y válidas (las que no lo son se ignoran). */
export async function listarMarcas(): Promise<MarcaMira[]> {
  const todas = await (await base()).getAll('marcas');
  return todas.map((m) => validarMarca(m)).filter((m): m is MarcaMira => m !== null);
}

/** Guarda una marca; si cambió de distancia, quita la anterior en la misma transacción. */
export async function guardarMarca(m: MarcaMira, distanciaAnterior?: number): Promise<void> {
  const tx = (await base()).transaction('marcas', 'readwrite');
  const ops: Promise<unknown>[] = [tx.store.put(m), tx.done];
  if (distanciaAnterior !== undefined && distanciaAnterior !== m.distanciaM)
    ops.push(tx.store.delete(distanciaAnterior));
  await Promise.all(ops);
}

/** Guarda varias marcas en una sola transacción: o todas o ninguna. */
export async function guardarMarcas(ms: MarcaMira[]): Promise<void> {
  const tx = (await base()).transaction('marcas', 'readwrite');
  await Promise.all([...ms.map((m) => tx.store.put(m)), tx.done]);
}

export async function borrarMarca(distanciaM: number): Promise<void> {
  await (await base()).delete('marcas', distanciaM);
}

/** Pide al navegador que no borre los datos cuando falte espacio. */
export async function pedirPersistencia(): Promise<boolean> {
  return (await navigator.storage?.persist?.()) ?? false;
}
