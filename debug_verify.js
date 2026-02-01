
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

console.log("--- Testing Integer Accumulator (Exact Multiples) ---");

// Test Case:
// Total Time = 3.0 seconds (3,000,000us)
// Fixed Step = 0.01s (10,000us)
// Expected Physics Steps = 300

// Scenario 1: SLOW (dt = 0.1s -> 100,000us)
// 30 frames * 100,000us = 3,000,000us
const slowSim = new IntegerAccumulatorTest();
for (let i = 0; i < 30; i++) {
    slowSim.step(0.1);
}

// Scenario 2: FAST (dt = 0.3s -> 300,000us)
// 10 frames * 300,000us = 3,000,000us
const fastSim = new IntegerAccumulatorTest();
for (let i = 0; i < 10; i++) {
    fastSim.step(0.3);
}

console.log(`Slow Steps (Expect 300): ${slowSim.stepsTaken}`);
console.log(`Fast Steps (Expect 300): ${fastSim.stepsTaken}`);
console.log(`Difference: ${Math.abs(slowSim.stepsTaken - fastSim.stepsTaken)}`);

if (slowSim.stepsTaken === fastSim.stepsTaken) {
    console.log("PASS: Multiples work perfectly.");
} else {
    console.log("FAIL: Logic is fundamentally broken.");
}
