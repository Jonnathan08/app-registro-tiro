// Botón «atrás» de Android: cierra la capa abierta (menú, diálogo, editor, detalle) en vez de salir de la app.
// Mientras haya capas se mantiene una sola entrada propia en el historial; al pulsar atrás se consume,
// se cierra la capa de arriba y, si quedan más, se vuelve a poner. Sin capas, atrás sale de la app.

interface Capa {
  cerrar: () => void;
}

const pila: Capa[] = [];
let enHistorial = false; // hay una entrada propia encima de la de la app
let ignorar = 0; // retrocesos hechos por la app, no por el usuario
let iniciado = false;

function iniciar() {
  if (iniciado) return;
  iniciado = true;
  // Al cerrar una capa no debe saltar el desplazamiento de la página
  history.scrollRestoration = 'manual';
  addEventListener('popstate', alVolver);
}

function alVolver(e: PopStateEvent) {
  if (ignorar) {
    ignorar--;
    return;
  }
  // «Adelante» (en escritorio) lleva a una entrada propia ya gastada: no hay capa que cerrar
  if (e.state?.capa) {
    enHistorial = true;
    return;
  }
  enHistorial = false;
  pila.pop()?.cerrar();
  if (pila.length) poner();
}

function poner() {
  history.pushState({ capa: true }, '');
  enHistorial = true;
}

// Se revisa después del cambio en curso: al pasar del menú a un diálogo la pila queda vacía
// solo un instante, y la entrada se reutiliza en vez de quitarla y ponerla otra vez.
// Si se abre una capa entre este back() y su popstate, `ignorar` se gasta igual y la cuenta de entradas
// sigue cuadrando (las entradas no llevan datos); la ventana es de milisegundos.
function revisar() {
  if (pila.length || !enHistorial) return;
  enHistorial = false;
  ignorar++;
  history.back();
}

/**
 * Registra una capa abierta; `cerrar` se llama si el usuario pulsa atrás.
 * Devuelve la función que la da por cerrada (pensada como limpieza de un `$effect`).
 */
export function capa(cerrar: () => void): () => void {
  iniciar();
  const c: Capa = { cerrar };
  pila.push(c);
  if (!enHistorial) poner();
  return () => {
    const i = pila.indexOf(c);
    if (i < 0) return; // ya la cerró el botón atrás
    pila.splice(i, 1);
    setTimeout(revisar);
  };
}
