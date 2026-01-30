// js/explorer.js
import { PhysicsEngine, Vector } from './physics.js';

export class MatrixExplorer {
    constructor(containerId, onSelectConfig) {
        this.container = document.getElementById(containerId);
        this.onSelectConfig = onSelectConfig;
    }

    generateGrid(baseConfig) {
        this.container.innerHTML = ''; // basic clear

        // Generate variations. 
        // Logic: Vary Body 3 (the disturber) X and Y velocity slightly
        const steps = 15; // 15 variations?
        const rows = 3;
        const cols = 5;

        const variations = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Clone base config deep copy
                const config = JSON.parse(JSON.stringify(baseConfig));

                // Modify Body 2's velocity approx based on grid pos
                // Base V is approx 4. Let's vary by +/- 0.5
                const dvx = (c - Math.floor(cols / 2)) * 0.4;
                const dvy = (r - Math.floor(rows / 2)) * 0.4;

                config[2].vel.x += dvx; // Modifying the red body
                config[2].vel.y += dvy;

                variations.push({
                    config: config,
                    label: `dV: [${dvx.toFixed(1)}, ${dvy.toFixed(1)}]`,
                    id: variations.length
                });
            }
        }

        // Render each variation
        variations.forEach(v => {
            this.createMiniSim(v);
        });
    }

    createMiniSim(variation) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';

        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        cell.appendChild(canvas);

        const badge = document.createElement('div');
        badge.className = 'status-badge';
        badge.innerText = 'Calculating...';
        cell.appendChild(badge);

        cell.addEventListener('click', () => {
            this.onSelectConfig(variation.config);
            document.getElementById('explorerOverlay').classList.add('hidden');
        });

        this.container.appendChild(cell);

        // Run Sim (Non-blocking if possible? doing it sync for now but small steps)
        // Convert config to Objects
        const bodies = variation.config.map(b => ({
            pos: new Vector(b.pos.x, b.pos.y, b.pos.z),
            vel: new Vector(b.vel.x, b.vel.y, b.vel.z),
            mass: b.mass
        }));

        const physics = new PhysicsEngine(bodies, 1000, 5); // same G constants
        const simSteps = 800;
        const ctx = canvas.getContext('2d');
        const scale = 0.3; // Zoom out to see orbit
        const center = { x: 100, y: 100 };

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 200, 200);

        let stable = true;

        ctx.beginPath();
        for (let i = 0; i < simSteps; i++) {
            physics.step(0.1);

            // Quick draw dots every 10 steps
            if (i % 10 === 0) {
                bodies.forEach((b, idx) => {
                    const x = (b.pos.x - 0) * scale + center.x; // naive center at 0,0 world
                    const y = (b.pos.y - 0) * scale + center.y;

                    ctx.fillStyle = idx === 0 ? 'cyan' : idx === 1 ? 'purple' : 'red';
                    ctx.fillRect(x, y, 1, 1);
                });
            }

            if (physics.isUnstable(3000)) {
                stable = false;
                break;
            }
        }

        badge.innerText = stable ? 'STABLE' : 'UNSTABLE';
        badge.classList.add(stable ? 'status-stable' : 'status-unstable');
    }
}
