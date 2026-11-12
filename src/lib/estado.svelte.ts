import * as almacen from './almacen';
import {
  nuevaSesion,
  rondaGuardable,
  suma,
  rondaLlena,
  todasGuardadas,
  validarConfig,
  type Configuracion,
  type Flecha,
  type Sesion,
} from './modelo';

export type Pantalla = 'sesion' | 'historial' | 'ajustes';

const CLAVE_CONFIG = 'registro-tiro:ultima-config';

function leerConfig(): Configuracion {
  try {
    return validarConfig(JSON.parse(localStorage.getItem(CLAVE_CONFIG) ?? '{}'));
  } catch {
    return validarConfig({});
  }
}

class Estado {
  pantalla = $state<Pantalla>('sesion');
  activa = $state<Sesion | null>(null);
  historial = $state<Sesion[]>([]);
  detalle = $state<Sesion | null>(null); // sesión abierta desde el historial
  aviso = $state<{ texto: string; n: number } | null>(null);
  config = $state<Configuracion>(leerConfig());
  cargado = $state(false);
  /** Error al abrir el almacenamiento: la app no puede funcionar sin él. */
  error = $state<string | null>(null);

  async cargar() {
    this.error = null;
    try {
      const todas = await almacen.listar();
      this.activa = todas.find((s) => !s.terminada) ?? null;
      this.historial = todas.filter((s) => s.terminada);
      this.cargado = true;
    } catch (e) {
      console.error(e);
      this.error =
        'No se pudo abrir el almacenamiento del navegador. Si estás en una ventana privada, abre la app en una normal; si no, revisa el espacio libre del teléfono.';
    }
  }

  avisar(texto: string) {
    this.aviso = { texto, n: (this.aviso?.n ?? 0) + 1 };
  }

  /** Guarda la sesión activa. Si falla, avisa y devuelve false (lo hecho sigue en pantalla). */
  private async persistir(): Promise<boolean> {
    if (!this.activa) return true;
    try {
      await almacen.guardar($state.snapshot(this.activa));
      return true;
    } catch (e) {
      console.error(e);
      this.avisar('No se pudo guardar. Revisa el espacio libre del teléfono.');
      return false;
    }
  }

  async empezar(c: Configuracion) {
    try {
      localStorage.setItem(CLAVE_CONFIG, JSON.stringify(c));
    } catch {
      /* opcional */
    }
    this.config = c;
    this.activa = nuevaSesion(c);
    await this.persistir();
    void almacen.pedirPersistencia();
  }

  async marcar(f: Flecha) {
    const s = this.activa;
    if (!s || rondaLlena(s) || todasGuardadas(s)) return;
    s.enCurso.push(f);
    await this.persistir();
  }

  async deshacer() {
    const s = this.activa;
    if (!s?.enCurso.length) return;
    s.enCurso.pop();
    await this.persistir();
  }

  async guardarRonda() {
    const s = this.activa;
    if (!s || !rondaGuardable(s)) return;
    const n = s.registro.length + 1;
    const pts = suma(s.enCurso);
    s.registro.push({ flechas: s.enCurso });
    s.enCurso = [];
    if (await this.persistir()) this.avisar(`Ronda ${n} guardada · ${pts} puntos`);
  }

  /** Reemplaza las flechas de una ronda ya guardada (solo en la sesión en curso). */
  async editarRonda(indice: number, flechas: Flecha[]) {
    const s = this.activa;
    if (!s || !s.registro[indice] || flechas.length !== s.registro[indice].flechas.length) return;
    s.registro[indice] = { flechas };
    if (await this.persistir()) this.avisar(`Ronda ${indice + 1} actualizada · ${suma(flechas)} puntos`);
  }

  async notas() {
    await this.persistir();
  }

  async terminar() {
    const s = this.activa;
    if (!s) return;
    // Una ronda a medias se guarda tal cual al terminar
    if (s.enCurso.length) {
      s.registro.push({ flechas: s.enCurso });
      s.enCurso = [];
    }
    s.terminada = true;
    if (!(await this.persistir())) {
      s.terminada = false;
      return;
    }
    const plano = $state.snapshot(s);
    this.historial = [plano, ...this.historial];
    this.activa = null;
    this.detalle = plano;
    this.pantalla = 'historial';
    this.avisar('Sesión guardada');
  }

  /**
   * Añade al historial las sesiones importadas que no estén ya en el teléfono (por id).
   * Devuelve cuántas se añadieron y cuántas ya estaban. Si no se pueden guardar, lanza el error.
   */
  async importar(sesiones: Sesion[]): Promise<{ nuevas: number; repetidas: number }> {
    const ids = new Set([...this.historial.map((s) => s.id), this.activa?.id]);
    const nuevas = sesiones.filter((s) => !ids.has(s.id));
    if (nuevas.length) {
      await almacen.guardarVarias(nuevas);
      this.historial = [...this.historial, ...nuevas].sort((a, b) => b.fecha.localeCompare(a.fecha));
    }
    return { nuevas: nuevas.length, repetidas: sesiones.length - nuevas.length };
  }

  /** Borra una sesión del almacenamiento; si falla, avisa y devuelve false. */
  private async borrar(id: string): Promise<boolean> {
    try {
      await almacen.borrar(id);
      return true;
    } catch (e) {
      console.error(e);
      this.avisar('No se pudo borrar la sesión. Inténtalo de nuevo.');
      return false;
    }
  }

  async descartar() {
    if (!this.activa || !(await this.borrar(this.activa.id))) return;
    this.activa = null;
    this.avisar('Sesión descartada');
  }

  async borrarDetalle() {
    const s = this.detalle;
    if (!s || !(await this.borrar(s.id))) return;
    this.historial = this.historial.filter((h) => h.id !== s.id);
    this.detalle = null;
    this.avisar('Sesión borrada');
  }
}

export const estado = new Estado();
