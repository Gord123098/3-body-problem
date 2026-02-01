
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

class PhysicsEngine {
    constructor() {
        this.bodies = [];
        this.G = 1000;
        this.softening = 5;
        this.dt = 0.15;
        this.fixedDt = 0.01;
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

    getTotalState() {
        // Return a hash or sum of all positions to easily compare states
        let sum = 0;
        this.bodies.forEach(b => {
            sum += b.pos.x + b.pos.y + b.pos.z;
        });
        return sum;
    }
}

const INITIAL_CONFIG = [
    { pos: { x: -100, y: 0, z: 0 }, vel: { x: 0, y: 5, z: 0.5 }, mass: 20 },
    { pos: { x: 100, y: 0, z: 0 }, vel: { x: 0, y: -5, z: -0.5 }, mass: 20 },
    { pos: { x: 0, y: -150, z: 50 }, vel: { x: 4, y: 0, z: 0 }, mass: 15 }
];

// --- Simulation 1: SLOW (High Frame Rate) ---
// dt = 0.15 (1x speed), Run for 100 frames. Total Time passed = 15.0
const sim1 = new PhysicsEngine();
sim1.loadConfig(INITIAL_CONFIG);
sim1.dt = 0.15;
for (let i = 0; i < 100; i++) {
    sim1.step();
}

// --- Simulation 2: FAST (Low Frame Rate) ---
// dt = 0.30 (2x speed), Run for 50 frames. Total Time passed = 15.0
const sim2 = new PhysicsEngine();
sim2.loadConfig(INITIAL_CONFIG);
sim2.dt = 0.30;
for (let i = 0; i < 50; i++) {
    sim2.step();
}

const state1 = sim1.getTotalState();
const state2 = sim2.getTotalState();
const diff = Math.abs(state1 - state2);

console.log(`Slow Run State Sum: ${state1.toFixed(6)}`);
console.log(`Fast Run State Sum: ${state2.toFixed(6)}`);
console.log(`Difference: ${diff.toExponential(4)}`);

if (diff < 1e-5) {
    console.log("SUCCESS: Determinism Confirmed");
} else {
    console.log("FAILURE: Physics diverge at different speeds");
}
