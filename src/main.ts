import './estilos/tema.css';
import './estilos/base.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { estado } from './lib/estado.svelte';
import { alCambiarSistema, aplicarTema, leerAjustes } from './lib/tema';

aplicarTema(leerAjustes());
alCambiarSistema(() => aplicarTema(leerAjustes()));

mount(App, { target: document.getElementById('app')! });
void estado.cargar();
