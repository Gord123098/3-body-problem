# 3-Body Problem Simulation

A specialized 3D simulation of the 3-Body Problem, featuring a stability heatmap explorer and Euler-Lagrange physics.

## Live Demo
[Run the Simulation](https://Gord123098.github.io/3-body-problem/)

## Features
- **Accurate Physics**: Uses RK4 integration with fixed timestep accumulator (0.01s) to ensure deterministic and stable orbits regardless of simulation speed.
- **Stability Explorer**: Interactive heatmap to find stable vs. unstable initial conditions.
- **3D Visualization**: Built with Three.js.
- **Portable**: Runs entirely in the browser.

## Technical Details
- **Integrator**: Runge-Kutta 4 (RK4)
- **Timestep**: Fixed 0.01 physics step, decoupled from frame rate.
- **Stack**: Vanilla JS, Three.js

## How to Run
Simply open `index.html` in your browser, or visit the live demo link above.
