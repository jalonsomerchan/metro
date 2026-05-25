import { bindTouchControls } from './input.js';
import { render, resizeCanvas } from './renderer.js';
import { tickSimulation } from './simulation.js';
import { createInitialState, setTool } from './state.js';

const canvas = document.querySelector('#gameCanvas');
const statusPill = document.querySelector('#statusPill');
const hintCard = document.querySelector('#hintCard');
const toolButtons = [...document.querySelectorAll('.tool-button')];
const state = createInitialState();
let lastFrameAt = performance.now();
let hintTimeout = 0;

function boot() {
  resizeCanvas(canvas, state);
  bindToolbar();
  bindTouchControls(canvas, state, setStatus);
  window.addEventListener('resize', () => resizeCanvas(canvas, state));
  window.addEventListener('orientationchange', () => setTimeout(() => resizeCanvas(canvas, state), 250));
  requestAnimationFrame(loop);
}

function loop(now) {
  const deltaMs = Math.min(now - lastFrameAt, 64);
  lastFrameAt = now;
  tickSimulation(state, now, deltaMs);
  render(canvas, state);
  requestAnimationFrame(loop);
}

function bindToolbar() {
  toolButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tool = button.dataset.tool;
      setTool(state, tool);
      updateToolbar(tool);
      setStatus(tool === 'pause' && state.paused ? 'Pausado' : labelForTool(tool));
    });
  });
}

function updateToolbar(tool) {
  toolButtons.forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setStatus(text = labelForTool(state.tool)) {
  statusPill.textContent = text;
  hintCard.textContent = helperForState(text);
  window.clearTimeout(hintTimeout);
  hintCard.classList.add('is-visible');
  hintTimeout = window.setTimeout(() => hintCard.classList.remove('is-visible'), 2600);
}

function labelForTool(tool) {
  if (tool === 'erase') return 'Borrador';
  if (tool === 'pause') return state.paused ? 'Pausado' : 'Pausa';
  return 'Línea nueva';
}

function helperForState(status) {
  if (status === 'Borrador') return 'Toca una estación o línea para eliminarla.';
  if (status === 'Pausado') return 'La simulación está detenida. Toca otra herramienta para continuar.';
  if (status === 'Línea seleccionada') return 'Toca un extremo para ampliarla o un nodo intermedio para moverlo.';
  if (status === 'Editando trazado') return 'Arrastra el punto de control. Los extremos amplían la línea.';
  return 'Arrastra entre estaciones para crear líneas y deja que los pasajeros hagan transbordo.';
}

boot();
