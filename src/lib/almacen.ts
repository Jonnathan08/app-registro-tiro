// Almacenamiento local en IndexedDB. Nada sale del dispositivo.
import { openDB, type DBSchema } from 'idb';
import { migrar, type Sesion } from './modelo';

interface Esquema extends DBSchema {
  sesiones: { key: string; value: Sesion; indexes: { fecha: string } };
}

// Se abre al primer uso: si el navegador bloquea IndexedDB, el error llega a quien llama
let db: ReturnType<typeof abrir> | null = null;
function abrir() {
  return openDB<Esquema>('registro-tiro', 1, {
    upgrade(d) {
      const t = d.createObjectStore('sesiones', { keyPath: 'id' });
      t.createIndex('fecha', 'fecha');
    },
  });
}
function base() {
  db ??= abrir().catch((e) => {
    db = null;   // permite reintentar
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

/** Pide al navegador que no borre los datos cuando falte espacio. */
export async function pedirPersistencia(): Promise<boolean> {
  return (await navigator.storage?.persist?.()) ?? false;
}
