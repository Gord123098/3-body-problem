/**
 * 3-Body Problem Simulation (Final Stable Build)
 * Features: 3D Visualization, RK4 Integrator, Advanced Matrix Explorer (Zoom/Pan).
 */

// ==========================================
// UTILS
// ==========================================
class Vector {
    constructor(x, y, z = 0) {
        this.x = x; this.y = y; this.z = z;
    }
    add(v) { return new Vector(this.x + v.x, this.y + v.y, this.z + v.z); }
    sub(v) { return new Vector(this.x - v.x, this.y - v.y, this.z - v.z); }
    mult(s) { return new Vector(this.x * s, this.y * s, this.z * s); }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
    dist(v) { return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2); }
    clone() { return new Vector(this.x, this.y, this.z); }
}

// ==========================================
// PHYSICS ENGINE
// ==========================================
class PhysicsEngine {
    constructor() {
        this.bodies = [];
        this.G = 1000;
        this.softening = 5;
        this.dt = 0.15; // Visual speed multiplier
        this.fixedDt = 0.01; // Physics always steps by this amount
        this.accumulator = 0;
    }

    loadConfig(config) {
        this.bodies = config.map(c => ({
            pos: new Vector(c.pos.x, c.pos.y, c.pos.z),
            vel: new Vector(c.vel.x, c.vel.y, c.vel.z),
            mass: c.mass,
            radius: c.radius || 5,
            color: c.color || 0xffffff
        }));
    }

    getAccelerations(state) {
        const n = state.length;
        const acc = new Array(n).fill(0).map(() => new Vector(0, 0, 0));
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const rVec = state[j].pos.sub(state[i].pos);
                const rMag = rVec.mag();
                const distSq = rMag * rMag + this.softening ** 2;
                const fVal = (this.G * state[i].mass * state[j].mass) / distSq;
                const fVec = rVec.mult(fVal / rMag);
                acc[i] = acc[i].add(fVec.mult(1 / state[i].mass));
                acc[j] = acc[j].sub(fVec.mult(1 / state[j].mass));
            }
        }
        return acc;
    }

    integrate(dt) {
        const state = this.bodies.map(b => ({ pos: b.pos.clone(), vel: b.vel.clone(), mass: b.mass }));

        // RK4
        const a1 = this.getAccelerations(state);
        const v1 = state.map(s => s.vel);

        const s2 = state.map((s, i) => ({ pos: s.pos.add(v1[i].mult(dt * 0.5)), vel: s.vel.add(a1[i].mult(dt * 0.5)), mass: s.mass }));
        const a2 = this.getAccelerations(s2);
        const v2 = s2.map(s => s.vel);

        const s3 = state.map((s, i) => ({ pos: s.pos.add(v2[i].mult(dt * 0.5)), vel: s.vel.add(a2[i].mult(dt * 0.5)), mass: s.mass }));
        const a3 = this.getAccelerations(s3);
        const v3 = s3.map(s => s.vel);

        const s4 = state.map((s, i) => ({ pos: s.pos.add(v3[i].mult(dt)), vel: s.vel.add(a3[i].mult(dt)), mass: s.mass }));
        const a4 = this.getAccelerations(s4);
        const v4 = s4.map(s => s.vel);

        for (let i = 0; i < this.bodies.length; i++) {
            const dv = a1[i].add(a2[i].mult(2)).add(a3[i].mult(2)).add(a4[i]).mult(dt / 6);
            const dx = v1[i].add(v2[i].mult(2)).add(v3[i].mult(2)).add(v4[i]).mult(dt / 6);
            this.bodies[i].vel = this.bodies[i].vel.add(dv);
            this.bodies[i].pos = this.bodies[i].pos.add(dx);
        }
    }

    step() {
        this.accumulator += this.dt;
        while (this.accumulator >= this.fixedDt) {
            this.integrate(this.fixedDt);
            this.accumulator -= this.fixedDt;
        }
    }

    getTotalEnergy() {
        let ke = 0, pe = 0;
        for (let i = 0; i < this.bodies.length; i++) {
            ke += 0.5 * this.bodies[i].mass * (this.bodies[i].vel.mag() ** 2);
            for (let j = i + 1; j < this.bodies.length; j++) {
                pe -= (this.G * this.bodies[i].mass * this.bodies[j].mass) / this.bodies[i].pos.dist(this.bodies[j].pos);
            }
        }
        return ke + pe;
    }
}

// ==========================================
// VISUAL ENGINE
// ==========================================
class VisualEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050508);
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.set(0, 500, 800);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);

        this.bodyMeshes = [];
        this.trailLines = [];
        this.trailPositions = [];

        this.addStars();
        window.addEventListener('resize', () => this.onResize());
    }

    addStars() {
        const geo = new THREE.BufferGeometry();
        const verts = [];
        for (let i = 0; i < 2000; i++) {
            verts.push((Math.random() - 0.5) * 8000, (Math.random() - 0.5) * 8000, (Math.random() - 0.5) * 8000);
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0.6 });
        this.scene.add(new THREE.Points(geo, mat));
    }

    initBodies(bodies) {
        this.bodyMeshes.forEach(m => this.scene.remove(m));
        this.trailLines.forEach(l => this.scene.remove(l));
        this.bodyMeshes = []; this.trailLines = []; this.trailPositions = [];

        bodies.forEach(b => {
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(b.radius, 32, 32),
                new THREE.MeshStandardMaterial({ color: b.color, emissive: b.color, emissiveIntensity: 2 })
            );
            mesh.position.set(b.pos.x, b.pos.y, b.pos.z);
            this.scene.add(mesh);
            this.bodyMeshes.push(mesh);

            const trailGeo = new THREE.BufferGeometry();
            trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(1000 * 3), 3));
            const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: b.color, transparent: true, opacity: 0.6 }));
            trail.frustumCulled = false;
            this.scene.add(trail);
            this.trailLines.push(trail);
            this.trailPositions.push(new Array(1000).fill(b.pos));
        });
    }

    update(bodies) {
        bodies.forEach((b, i) => {
            this.bodyMeshes[i].position.set(b.pos.x, b.pos.y, b.pos.z);
            const history = this.trailPositions[i];
            history.push(b.pos);
            if (history.length > 1000) history.shift();

            const posAttr = this.trailLines[i].geometry.attributes.position.array;
            for (let j = 0; j < history.length; j++) {
                posAttr[j * 3] = history[j].x;
                posAttr[j * 3 + 1] = history[j].y;
                posAttr[j * 3 + 2] = history[j].z;
            }
            this.trailLines[i].geometry.attributes.position.needsUpdate = true;
        });
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// ==========================================
// HEATMAP EXPLORER (Stabilized)
// ==========================================
class HeatmapExplorer {
    constructor(canvasId, onSelectConfig) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.onSelectConfig = onSelectConfig;
        this.progressBar = document.getElementById('heatmapProgress');
        this.statusText = document.getElementById('heatmapStatus');

        this.res = 200;
        this.pixelSize = this.canvas.width / this.res;
        this.centerX = 0; this.centerY = 0; this.zoom = 1.0;
        this.baseRange = 8.0;
        this.xAxis = 'vel_x_3'; this.yAxis = 'vel_y_3';

        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
        this.baseConfig = null;
        this.animationFrame = null;

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('xAxisParam').addEventListener('change', (e) => { this.xAxis = e.target.value; this.generateMap(this.baseConfig); });
        document.getElementById('yAxisParam').addEventListener('change', (e) => { this.yAxis = e.target.value; this.generateMap(this.baseConfig); });
        document.getElementById('resetViewBtn').addEventListener('click', () => { this.centerX = 0; this.centerY = 0; this.zoom = 1.0; this.generateMap(this.baseConfig); });

        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => { this.isDragging = true; this.lastMouse = { x: e.clientX, y: e.clientY }; });
        window.addEventListener('mouseup', () => { if (this.isDragging) { this.isDragging = false; this.generateMap(this.baseConfig); } });
        this.canvas.addEventListener('click', (e) => { if (!this.isDragging) this.onClick(e); });
        this.canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom *= e.deltaY > 0 ? 0.9 : 1.1; this.generateMap(this.baseConfig); });
    }

    generateMap(baseConfig) {
        if (!baseConfig) return;
        this.baseConfig = baseConfig;
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let x = 0;
        const step = () => {
            if (x >= this.res) { this.progressBar.style.width = '100%'; this.drawLabels(); return; }
            for (let y = 0; y < this.res; y++) {
                const stability = this.simStability(x, y);
                this.drawPixel(x, y, stability);
            }
            x++;
            this.progressBar.style.width = `${(x / this.res) * 100}%`;
            this.animationFrame = requestAnimationFrame(step);
        };
        this.animationFrame = requestAnimationFrame(step);
    }

    simStability(gridX, gridY) {
        const range = this.baseRange / this.zoom;
        const valX = this.centerX + ((gridX / this.res) - 0.5) * 2 * range;
        const valY = this.centerY + ((gridY / this.res) - 0.5) * 2 * range;
        const bodies = JSON.parse(JSON.stringify(this.baseConfig));
        this.applyParam(bodies, this.xAxis, valX);
        this.applyParam(bodies, this.yAxis, valY);

        const steps = 1000, dt = 0.2, G = 1000, esc = 6000 * 6000;
        for (let i = 0; i < steps; i++) {
            for (let a = 0; a < 3; a++) {
                let ax = 0, ay = 0, az = 0;
                for (let b = 0; b < 3; b++) {
                    if (a === b) continue;
                    const dx = bodies[b].pos.x - bodies[a].pos.x, dy = bodies[b].pos.y - bodies[a].pos.y, dz = bodies[b].pos.z - bodies[a].pos.z;
                    const d2 = dx * dx + dy * dy + dz * dz + 25, d = Math.sqrt(d2);
                    const f = (G * bodies[b].mass) / d2;
                    ax += f * (dx / d); ay += f * (dy / d); az += f * (dz / d);
                }
                bodies[a].vel.x += ax * dt; bodies[a].vel.y += ay * dt; bodies[a].vel.z += az * dt;
            }
            let maxD2 = 0;
            for (let a = 0; a < 3; a++) {
                bodies[a].pos.x += bodies[a].vel.x * dt; bodies[a].pos.y += bodies[a].vel.y * dt; bodies[a].pos.z += bodies[a].vel.z * dt;
                maxD2 = Math.max(maxD2, bodies[a].pos.x ** 2 + bodies[a].pos.y ** 2 + bodies[a].pos.z ** 2);
            }
            if (maxD2 > esc) return i / steps;
        }
        return 1.0;
    }

    applyParam(bodies, type, val) {
        const p = type.split('_');
        if (p[0] === 'mass') bodies[parseInt(p[1]) - 1].mass += val;
        else bodies[parseInt(p[2]) - 1][p[0]][p[1]] += val;
    }

    drawPixel(x, y, score) {
        const r = score < 0.5 ? 255 : Math.floor((1 - score) * 510);
        const g = score < 0.5 ? Math.floor(score * 510) : 255;
        this.ctx.fillStyle = `rgb(${r},${g},0)`;
        this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
    }

    drawLabels() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)'; this.ctx.fillRect(0, 0, 150, 60);
        this.ctx.fillStyle = '#fff'; this.ctx.font = '10px monospace';
        this.ctx.fillText(`Center: ${this.centerX.toFixed(2)}, ${this.centerY.toFixed(2)}`, 5, 15);
        this.ctx.fillText(`Zoom: ${this.zoom.toFixed(2)}`, 5, 30);
        this.ctx.fillText(`X: ${this.xAxis} | Y: ${this.yAxis}`, 5, 45);
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        if (this.isDragging) {
            const range = this.baseRange / this.zoom;
            this.centerX -= ((e.clientX - this.lastMouse.x) * (range * 2)) / this.canvas.width;
            this.centerY -= ((e.clientY - this.lastMouse.y) * (range * 2)) / this.canvas.height;
            this.lastMouse = { x: e.clientX, y: e.clientY };
            return;
        }
        const range = this.baseRange / this.zoom;
        const vx = this.centerX + ((mx / this.canvas.width) - 0.5) * 2 * range;
        const vy = this.centerY + ((my / this.canvas.height) - 0.5) * 2 * range;
        this.statusText.innerText = `X: ${vx.toFixed(3)}, Y: ${vy.toFixed(3)}`;
    }

    onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const range = this.baseRange / this.zoom;
        const vx = this.centerX + (((e.clientX - rect.left) / this.canvas.width) - 0.5) * 2 * range;
        const vy = this.centerY + (((e.clientY - rect.top) / this.canvas.height) - 0.5) * 2 * range;
        const cfg = JSON.parse(JSON.stringify(this.baseConfig));
        this.applyParam(cfg, this.xAxis, vx);
        this.applyParam(cfg, this.yAxis, vy);
        this.onSelectConfig(cfg);
        document.getElementById('explorerOverlay').classList.add('hidden');
    }
}

// ==========================================
// INIT
// ==========================================
const INITIAL_CONFIG = [
    { pos: { x: -100, y: 0, z: 0 }, vel: { x: 0, y: 5, z: 0.5 }, mass: 20, color: 0x00f0ff, radius: 6 },
    { pos: { x: 100, y: 0, z: 0 }, vel: { x: 0, y: -5, z: -0.5 }, mass: 20, color: 0x7000ff, radius: 6 },
    { pos: { x: 0, y: -150, z: 50 }, vel: { x: 4, y: 0, z: 0 }, mass: 15, color: 0xff0055, radius: 5 }
];

function init() {
    const physics = new PhysicsEngine(), visuals = new VisualEngine('simulationCheck');
    let isRunning = true, config = JSON.parse(JSON.stringify(INITIAL_CONFIG));

    const reset = () => { physics.loadConfig(config); visuals.initBodies(physics.bodies); };
    reset();

    const explorer = new HeatmapExplorer('heatmapCanvas', (newCfg) => { config = newCfg; reset(); isRunning = true; });

    document.getElementById('explorerBtn').addEventListener('click', () => { document.getElementById('explorerOverlay').classList.remove('hidden'); explorer.generateMap(config); isRunning = false; });
    document.getElementById('closeExplorerBtn').addEventListener('click', () => { document.getElementById('explorerOverlay').classList.add('hidden'); isRunning = true; });
    document.getElementById('resetBtn').addEventListener('click', () => { config = JSON.parse(JSON.stringify(INITIAL_CONFIG)); reset(); });
    document.getElementById('pauseBtn').addEventListener('click', () => { isRunning = !isRunning; document.getElementById('pauseBtn').innerText = isRunning ? 'Pause' : 'Resume'; });
    document.getElementById('timeStep').addEventListener('input', (e) => { physics.dt = parseFloat(e.target.value) * 0.15; });

    function loop() {
        if (isRunning) { physics.step(); visuals.update(physics.bodies); document.getElementById('energyVal').innerText = physics.getTotalEnergy().toFixed(1); }
        requestAnimationFrame(loop);
    }
    loop();
}

if (window.THREE) init();
else window.addEventListener('load', init);
