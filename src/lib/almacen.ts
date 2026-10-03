// Almacenamiento local en IndexedDB. Nada sale del dispositivo.
import { openDB, type DBSchema } from 'idb';
import type { Sesion } from './modelo';

interface Esquema extends DBSchema {
  sesiones: { key: string; value: Sesion; indexes: { fecha: string } };
}

const db = openDB<Esquema>('registro-tiro', 1, {
  upgrade(d) {
    const t = d.createObjectStore('sesiones', { keyPath: 'id' });
    t.createIndex('fecha', 'fecha');
  },
});

export async function guardar(s: Sesion): Promise<void> {
  // Copia plana: quita los proxies reactivos de Svelte, que IndexedDB no puede clonar
  const copia: Sesion = JSON.parse(JSON.stringify({ ...s, actualizada: new Date().toISOString() }));
  await (await db).put('sesiones', copia);
}

export async function listar(): Promise<Sesion[]> {
  const todas = await (await db).getAllFromIndex('sesiones', 'fecha');
  return todas.reverse();
}

export async function borrar(id: string): Promise<void> {
  await (await db).delete('sesiones', id);
}

/** Pide al navegador que no borre los datos cuando falte espacio. */
export async function pedirPersistencia(): Promise<boolean> {
  return (await navigator.storage?.persist?.()) ?? false;
}
