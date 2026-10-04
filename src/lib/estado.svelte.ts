import * as almacen from './almacen';
import type { TipoDiana } from './diana';
import { nuevaSesion, rondaLlena, todasGuardadas, type Configuracion, type Flecha, type Sesion } from './modelo';

export type Pantalla = 'sesion' | 'historial' | 'ajustes';

const CLAVE_CONFIG = 'registro-tiro:ultima-config';

function leerConfig(): Configuracion {
  const defecto: Configuracion = { perfil: 'control', distanciaM: 70, dianaCm: 122 as TipoDiana, rondas: 6, flechasPorRonda: 6 };
  try {
    return { ...defecto, ...JSON.parse(localStorage.getItem(CLAVE_CONFIG) ?? '{}') };
  } catch {
    return defecto;
  }
}

class Estado {
  pantalla = $state<Pantalla>('sesion');
  activa = $state<Sesion | null>(null);
  historial = $state<Sesion[]>([]);
  detalle = $state<Sesion | null>(null);   // sesión abierta desde el historial
  aviso = $state<{ texto: string; n: number } | null>(null);
  config = $state<Configuracion>(leerConfig());
  cargado = $state(false);

  async cargar() {
    const todas = await almacen.listar();
    this.activa = todas.find((s) => !s.terminada) ?? null;
    this.historial = todas.filter((s) => s.terminada);
    this.cargado = true;
  }

  avisar(texto: string) {
    this.aviso = { texto, n: (this.aviso?.n ?? 0) + 1 };
  }

  private async persistir() {
    if (this.activa) await almacen.guardar(this.activa);
  }

  async empezar(c: Configuracion) {
    try { localStorage.setItem(CLAVE_CONFIG, JSON.stringify(c)); } catch { /* opcional */ }
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
    if (!s || !rondaLlena(s)) return;
    const n = s.registro.length + 1;
    const pts = s.enCurso.reduce((a, f) => a + f.puntaje, 0);
    s.registro.push({ flechas: s.enCurso });
    s.enCurso = [];
    await this.persistir();
    this.avisar(`Ronda ${n} guardada · ${pts} puntos`);
  }

  /** Reemplaza las flechas de una ronda ya guardada (solo en la sesión en curso). */
  async editarRonda(indice: number, flechas: Flecha[]) {
    const s = this.activa;
    if (!s || !s.registro[indice] || flechas.length !== s.registro[indice].flechas.length) return;
    s.registro[indice] = { flechas };
    await this.persistir();
    this.avisar(`Ronda ${indice + 1} actualizada · ${flechas.reduce((a, f) => a + f.puntaje, 0)} puntos`);
  }

  async notas() {
    await this.persistir();
  }

  async terminar() {
    const s = this.activa;
    if (!s) return;
    // Una ronda a medias se guarda tal cual al terminar
    if (s.enCurso.length) { s.registro.push({ flechas: s.enCurso }); s.enCurso = []; }
    s.terminada = true;
    await this.persistir();
    const plano: Sesion = JSON.parse(JSON.stringify(s));
    this.historial = [plano, ...this.historial];
    this.activa = null;
    this.detalle = plano;
    this.pantalla = 'historial';
    this.avisar('Sesión guardada');
  }

  async descartar() {
    if (!this.activa) return;
    await almacen.borrar(this.activa.id);
    this.activa = null;
    this.avisar('Sesión descartada');
  }

  async borrarDetalle() {
    const s = this.detalle;
    if (!s) return;
    await almacen.borrar(s.id);
    this.historial = this.historial.filter((h) => h.id !== s.id);
    this.detalle = null;
    this.avisar('Sesión borrada');
  }
}

export const estado = new Estado();
