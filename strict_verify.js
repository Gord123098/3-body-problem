
// Mock Physics Engine with Integer Logic
class IntegerAccumulatorTest {
    constructor() {
        this.fixedStepUs = 10000; // 0.01s
        this.accumulatorUs = 0;
        this.stepsTaken = 0;
    }

    step(dt) {
        const dtUs = Math.round(dt * 1000000);
        this.accumulatorUs += dtUs;
        while (this.accumulatorUs >= this.fixedStepUs) {
            this.stepsTaken++;
            this.accumulatorUs -= this.fixedStepUs;
        }
    }
}

console.log("--- Testing Integer Accumulator (Microseconds) ---");

// Scenario 1: SLOW (dt = 0.15)
// Run for 1,000,000 simulation seconds
const targetTime = 10000.0;
const slowDt = 0.15;
const slowFrames = Math.ceil(targetTime / slowDt);

const slowSim = new IntegerAccumulatorTest();
for (let i = 0; i < slowFrames; i++) {
    slowSim.step(slowDt);
}

// Scenario 2: FAST (dt = 0.35 - messy float)
const fastDt = 0.35;
const fastFrames = Math.ceil(targetTime / fastDt);

const fastSim = new IntegerAccumulatorTest();
for (let i = 0; i < fastFrames; i++) {
    fastSim.step(fastDt);
}

console.log(`Target Time: ${targetTime}`);
console.log(`Slow Steps: ${slowSim.stepsTaken}`);
console.log(`Fast Steps: ${fastSim.stepsTaken}`);
console.log(`Difference: ${Math.abs(slowSim.stepsTaken - fastSim.stepsTaken)}`);

if (slowSim.stepsTaken !== fastSim.stepsTaken) {
    console.log("FAIL: Still drifting!");
} else {
    console.log("PASS: Perfect Determinism Achieved.");
}
