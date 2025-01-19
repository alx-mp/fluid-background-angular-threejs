# Fluid Background Generator: Real-Time Fluid Simulations with Three.js & Angular

![Fluid Background Animation](https://github.com/alx-mp/fluid-background-angular-threejs/blob/main/public/Fluid.gif?raw=true)

This project creates stunning fluid dynamics backgrounds using real-time simulations powered by [Three.js](https://threejs.org) and was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.1.

The app visualizes fluid motion through shaders, simplex noise, and WebGL render targets to create captivating animated backgrounds.

## Features

- **Real-Time Fluid Simulation**: Powered by custom shaders and physics to simulate fluid-like behavior in the background
- **Noise-Based Animation**: Smooth, noise-driven motion for an organic, flowing effect
- **Optimized for Performance**: Uses WebGL and Three.js for hardware-accelerated rendering
- **Angular Integration**: Built with Angular for easy configuration and scaling

## Setup & Installation

Follow these steps to run the project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/alx-mp/fluid-background-angular-threejs
   ```

2. Navigate to the project directory:
   ```bash
   cd fluid-background-angular-threejs
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Start the application:
   ```bash
   ng serve
   ```

5. Open your browser and navigate to `http://localhost:4200` to see the fluid background in action!

## Key Code Insights

### FluidSimulationService
This is the core of the fluid simulation. It leverages Three.js shaders for fluid advection, divergence, pressure calculation, and rendering.

### Custom Shaders
The project utilizes custom GLSL shaders (vertexShader, advectionShader, divergenceShader, etc.) to simulate fluid dynamics.

### Noise Integration
The movement of the fluid is driven by simplex noise, creating smooth and organic transitions.

### WebGL Render Targets
The simulation uses off-screen rendering (render targets) to separate velocity, density, pressure, and divergence calculations.

### Optimization
The use of requestAnimationFrame and careful management of render targets ensures smooth performance on modern devices.

## How to Contribute

If you'd like to contribute to this project, feel free to fork the repository and submit a pull request. Contributions are always welcome!

## Donate

If you enjoy the project and would like to support further development, feel free to donate. Your contributions help keep this project alive and evolving.

I would really appreciate your burger!

<div style="width: 100%;">
  <a href="https://buymeacoffee.com/alxmp26" target="_blank">
    <img src="https://raw.githubusercontent.com/alx-mp/deploy-linux-web-server/a41f81f0ecab92fa6820f3a5a9e5408922caec97/assets/button.svg" style="width: 60%;" alt="THANKS!">
  </a>
</div>

## License

This project is licensed under the MIT License - see the LICENSE file for details.
