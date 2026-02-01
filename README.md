# 3-Body Problem Simulation

A specialized 3D simulation of the 3-Body Problem, featuring a stability heatmap explorer and Euler-Lagrange physics.

## 🚀 Live Demo
**[Run the Simulation](https://Gord123098.github.io/3-body-problem/)**

## ✨ Features
- **Accurate Physics**: Uses RK4 integration with adaptive sub-stepping to ensure stability even at high simulation speeds.
- **Stability Explorer**: Interactive heatmap to find stable vs. unstable initial conditions (Chaos Theory).
- **3D Visualization**: Built with Three.js for smooth orbiting camera and orbital trails.
- **Portable**: Runs entirely in the browser.

## 🛠️ Technical Details
- **Integrator**: Runge-Kutta 4 (RK4)
- **Sub-stepping**: Adaptive physics steps per frame for numerical stability.
- **Stack**: Vanilla JS, Three.js

## 📦 How to Run
Simply open `index.html` in your browser, or visit the live demo link above.
