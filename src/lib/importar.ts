// Importación del CSV que genera exportar.ts, para restaurar sesiones (p. ej. en un teléfono nuevo).
import { DIANAS } from './diana';
import { COLUMNAS, COLUMNAS_MIRA } from './exportar';
import { validarMarca, type MarcaMira } from './mira';
import { PERFILES, VERSION_DATOS, type Flecha, type Perfil, type Sesion } from './modelo';

/** Separa un CSV (RFC 4180) en filas y celdas. Admite comillas, comas y saltos de línea dentro de una celda. */
export function leerCSV(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = '';
  let comillas = false;
  const t = texto.replace(/^\uFEFF/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (comillas) {
      if (c === '"' && t[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') {
      fila.push(celda);
      celda = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      fila.push(celda);
      celda = '';
      filas.push(fila);
      fila = [];
    } else celda += c;
  }
  if (celda || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas.filter((f) => f.some((c) => c !== ''));
}

type Columna = (typeof COLUMNAS)[number];

/**
 * Reconstruye las sesiones de un CSV exportado por la app. Lanza un Error con un mensaje
 * legible si el archivo no tiene el formato esperado. Las sesiones quedan como terminadas.
 */
export function deCSV(texto: string): Sesion[] {
  const [cabecera, ...filas] = leerCSV(texto);
  if (!cabecera) throw new Error('El archivo está vacío.');
  const faltan = COLUMNAS.filter((c) => !cabecera.includes(c));
  if (faltan.length === COLUMNAS.length) throw new Error('No es un CSV exportado por la app.');
  if (faltan.length) throw new Error(`Faltan las columnas ${faltan.join(', ')}.`);
  const idx = Object.fromEntries(COLUMNAS.map((c) => [c, cabecera.indexOf(c)])) as Record<Columna, number>;

  const sesiones = new Map<string, { s: Sesion; rondas: Map<number, Map<number, Flecha>> }>();
  filas.forEach((fila, i) => {
    const n = i + 2; // número de línea en el archivo (la 1 es la cabecera)
    const v = (c: Columna) => fila[idx[c]] ?? '';
    const num = (c: Columna, min: number, max: number) => {
      const x = Number(v(c));
      if (v(c) === '' || !Number.isFinite(x) || x < min || x > max)
        throw new Error(`Línea ${n}: valor no válido en ${c} («${v(c)}»).`);
      return x;
    };
    const opcional = (c: Columna) => (v(c) === '' ? null : num(c, -1e4, 1e4));

    const id = v('sesion_id');
    if (!id) throw new Error(`Línea ${n}: falta sesion_id.`);
    let g = sesiones.get(id);
    if (!g) {
      const perfil = v('perfil') as Perfil;
      if (!PERFILES.includes(perfil)) throw new Error(`Línea ${n}: perfil desconocido («${v('perfil')}»).`);
      const dianaCm = num('diana_cm', 0, 1000);
      const diana = DIANAS.find((d) => d.cm === dianaCm);
      if (!diana) throw new Error(`Línea ${n}: diana desconocida («${v('diana_cm')}»).`);
      if (Number.isNaN(Date.parse(v('fecha')))) throw new Error(`Línea ${n}: fecha no válida («${v('fecha')}»).`);
      const libre = perfil === 'libre';
      g = {
        s: {
          version: VERSION_DATOS,
          id,
          fecha: v('fecha'),
          perfil,
          distanciaM: num('distancia_m', 1, 1000),
          dianaCm: diana.cm,
          // En Libre el CSV trae las rondas tiradas, pero en la app se guardan como 0 (sin formato)
          rondas: libre ? 0 : num('rondas', 1, 1000),
          flechasPorRonda: libre ? 0 : num('flechas_por_ronda', 1, 1000),
          registro: [],
          enCurso: [],
          notasPersonales: v('notas_personales'),
          notasEntrenador: v('notas_entrenador'),
          terminada: true,
          actualizada: new Date().toISOString(),
        },
        rondas: new Map(),
      };
      sesiones.set(id, g);
    }

    const x = opcional('x_mm'),
      y = opcional('y_mm');
    const flecha: Flecha = {
      puntaje: num('puntaje', 0, 10),
      x: v('es_x') === '1',
      pos: x !== null && y !== null ? { x, y } : null,
    };
    if (v('corregida') === '1') flecha.corregida = true;
    const r = num('ronda', 1, 1e4),
      j = num('flecha', 1, 1e4);
    if (!g.rondas.has(r)) g.rondas.set(r, new Map());
    g.rondas.get(r)!.set(j, flecha);
  });

  // Rondas y flechas en orden por su número
  const ordenar = <T>(m: Map<number, T>) => [...m.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);
  return [...sesiones.values()].map(({ s, rondas }) => ({
    ...s,
    registro: ordenar(rondas).map((fl) => ({ flechas: ordenar(fl) })),
  }));
}

/** Qué exportación es un CSV, por su cabecera: las dos tienen distancia_m, solo la de sesiones sesion_id. */
export function tipoCSV(texto: string): 'sesiones' | 'marcas' {
  const [cabecera] = leerCSV(texto);
  if (!cabecera) throw new Error('El archivo está vacío.');
  if (cabecera.includes('sesion_id')) return 'sesiones';
  if (COLUMNAS_MIRA.every((c) => cabecera.includes(c))) return 'marcas';
  throw new Error('No es un CSV exportado por la app.');
}

/**
 * Marcas de mira de un CSV exportado por la app. Lanza un Error con la línea si una fila no es válida.
 * Si una distancia se repite, gana la de fecha más reciente.
 */
export function deCSVMira(texto: string): MarcaMira[] {
  const [cabecera, ...filas] = leerCSV(texto);
  if (!cabecera) throw new Error('El archivo está vacío.');
  const faltan = COLUMNAS_MIRA.filter((c) => !cabecera.includes(c));
  if (faltan.length) throw new Error(`Faltan las columnas ${faltan.join(', ')}.`);
  const i = (c: string) => cabecera.indexOf(c);
  const porDistancia = new Map<number, MarcaMira>();
  filas.forEach((fila, k) => {
    const n = k + 2;
    const num = (c: string) => (fila[i(c)] === undefined || fila[i(c)] === '' ? NaN : Number(fila[i(c)]));
    const m = validarMarca({
      distanciaM: num('distancia_m'),
      elevacion: num('elevacion'),
      nota: fila[i('nota')] ?? '',
      actualizada: fila[i('actualizada')] ?? '',
    });
    if (!m)
      throw new Error(
        `Línea ${n}: marca no válida (distancia «${fila[i('distancia_m')] ?? ''}», elevación «${fila[i('elevacion')] ?? ''}»).`,
      );
    const previa = porDistancia.get(m.distanciaM);
    if (!previa || Date.parse(m.actualizada) > Date.parse(previa.actualizada)) porDistancia.set(m.distanciaM, m);
  });
  return [...porDistancia.values()];
}

/** Sesiones o marcas de un CSV exportado por la app, según su cabecera. */
export function deArchivo(texto: string): { sesiones: Sesion[]; marcas: MarcaMira[] } {
  return tipoCSV(texto) === 'marcas'
    ? { sesiones: [], marcas: deCSVMira(texto) }
    : { sesiones: deCSV(texto), marcas: [] };
}
