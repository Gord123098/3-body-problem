// js/physics.js

export class Vector {
    constructor(x, y, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(v) { return new Vector(this.x + v.x, this.y + v.y, this.z + v.z); }
    sub(v) { return new Vector(this.x - v.x, this.y - v.y, this.z - v.z); }
    mult(s) { return new Vector(this.x * s, this.y * s, this.z * s); }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
    dist(v) {
        return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2);
    }
    clone() { return new Vector(this.x, this.y, this.z); }
}

export class PhysicsEngine {
    constructor(bodies, G = 1000, softening = 5) {
        this.bodies = bodies; // bodies should be { pos: Vector, vel: Vector, mass: number }
        this.G = G;
        this.softening = softening;
    }

    getAccelerations(state) {
        const n = state.length;
        const acc = new Array(n).fill(0).map(() => new Vector(0, 0, 0));

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const rVec = state[j].pos.sub(state[i].pos);
                const rMag = rVec.mag();
                const distSq = rMag * rMag + this.softening * this.softening;

                const fVal = this.G * state[i].mass * state[j].mass / distSq;
                const fVec = rVec.mult(fVal / rMag);

                acc[i] = acc[i].add(fVec.mult(1 / state[i].mass));
                acc[j] = acc[j].sub(fVec.mult(1 / state[j].mass));
            }
        }
        return acc;
    }

    step(dt) {
        const state = this.bodies.map(b => ({
            pos: b.pos.clone(),
            vel: b.vel.clone(),
            mass: b.mass
        }));

        // RK4 Integration
        const a1 = this.getAccelerations(state);
        const v1 = state.map(s => s.vel);

        const state2 = state.map((s, i) => ({
            pos: s.pos.add(v1[i].mult(dt * 0.5)),
            vel: s.vel.add(a1[i].mult(dt * 0.5)),
            mass: s.mass
        }));
        const a2 = this.getAccelerations(state2);
        const v2 = state2.map(s => s.vel);

        const state3 = state.map((s, i) => ({
            pos: s.pos.add(v2[i].mult(dt * 0.5)),
            vel: s.vel.add(a2[i].mult(dt * 0.5)),
            mass: s.mass
        }));
        const a3 = this.getAccelerations(state3);
        const v3 = state3.map(s => s.vel);

        const state4 = state.map((s, i) => ({
            pos: s.pos.add(v3[i].mult(dt)),
            vel: s.vel.add(a3[i].mult(dt)),
            mass: s.mass
        }));
        const a4 = this.getAccelerations(state4);
        const v4 = state4.map(s => s.vel);

        // Update Original Bodies
        for (let i = 0; i < this.bodies.length; i++) {
            const dv = a1[i].add(a2[i].mult(2)).add(a3[i].mult(2)).add(a4[i]).mult(dt / 6);
            const dx = v1[i].add(v2[i].mult(2)).add(v3[i].mult(2)).add(v4[i]).mult(dt / 6);

            this.bodies[i].vel = this.bodies[i].vel.add(dv);
            this.bodies[i].pos = this.bodies[i].pos.add(dx);
        }
    }

    getTotalEnergy() {
        let ke = 0;
        let pe = 0;
        for (let i = 0; i < this.bodies.length; i++) {
            ke += 0.5 * this.bodies[i].mass * (this.bodies[i].vel.mag() ** 2);
            for (let j = i + 1; j < this.bodies.length; j++) {
                const dist = this.bodies[i].pos.dist(this.bodies[j].pos);
                pe -= (this.G * this.bodies[i].mass * this.bodies[j].mass) / dist;
            }
        }
        return ke + pe;
    }

    // Check if system is likely unstable (any body too far)
    isUnstable(threshold = 5000) {
        for (let b of this.bodies) {
            if (b.pos.mag() > threshold) return true;
        }
        return false;
    }
}
