// js/main.js
import { Vector, PhysicsEngine } from './physics.js';
import { VisualEngine } from './visuals.js';
import { MatrixExplorer } from './explorer.js';

// --- State ---
let bodies = [];
let physics;
let visualEngine;
let explorer;
let isPaused = false;
let simulationSpeed = 1.0;
let animationId;

// --- Config ---
const INITIAL_CONFIG = [
    { pos: { x: -100, y: 0, z: 0 }, vel: { x: 0, y: 5, z: 0.5 }, mass: 20, color: 0x00f0ff, radius: 6 },
    { pos: { x: 100, y: 0, z: 0 }, vel: { x: 0, y: -5, z: -0.5 }, mass: 20, color: 0x7000ff, radius: 6 },
    { pos: { x: 0, y: -150, z: 50 }, vel: { x: 4, y: 0, z: 0 }, mass: 15, color: 0xff0055, radius: 5 }
];

function init() {
    visualEngine = new VisualEngine('simulationCheck');
    explorer = new MatrixExplorer('matrixGrid', loadConfig);

    // Bind UI
    document.getElementById('timeStep').addEventListener('input', (e) => simulationSpeed = parseFloat(e.target.value));

    document.getElementById('pauseBtn').addEventListener('click', () => {
        isPaused = !isPaused;
        document.getElementById('pauseBtn').innerText = isPaused ? "Resume" : "Pause";
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        loadConfig(INITIAL_CONFIG); // Reload default
    });

    document.getElementById('explorerBtn').addEventListener('click', () => {
        document.getElementById('mainUI').style.opacity = '0';
        document.getElementById('explorerOverlay').classList.remove('hidden');
        explorer.generateGrid(INITIAL_CONFIG);
        isPaused = true;
    });

    document.getElementById('closeExplorerBtn').addEventListener('click', () => {
        document.getElementById('mainUI').style.opacity = '1';
        document.getElementById('explorerOverlay').classList.add('hidden');
        isPaused = false;
    });

    loadConfig(INITIAL_CONFIG);
    animate();
}

function loadConfig(configData) {
    // Deep clone to avoid ref issues
    const data = JSON.parse(JSON.stringify(configData));

    // Convert plain data to objects
    bodies = data.map(d => ({
        pos: new Vector(d.pos.x, d.pos.y, d.pos.z),
        vel: new Vector(d.vel.x, d.vel.y, d.vel.z),
        mass: d.mass,
        color: d.color,
        radius: d.radius
    }));

    physics = new PhysicsEngine(bodies);
    visualEngine.initBodies(bodies);

    isPaused = false;
    document.getElementById('pauseBtn').innerText = "Pause";
    document.getElementById('mainUI').style.opacity = '1';
}

function animate() {
    requestAnimationFrame(animate);

    if (!isPaused && physics) {
        // Run physics steps multiple times per frame for smoothness/accuracy
        const subSteps = 4;
        const dt = (simulationSpeed * 0.1) / subSteps;

        for (let i = 0; i < subSteps; i++) {
            physics.step(dt);
        }

        // Update UI Stats
        document.getElementById('energyVal').innerText = physics.getTotalEnergy().toFixed(1);
    }

    if (physics) {
        visualEngine.update(physics.bodies);
    }
}

init();
