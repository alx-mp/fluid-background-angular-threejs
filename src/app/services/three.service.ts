import { Injectable, ElementRef, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { vertexShader, advectionShader, divergenceShader, pressureShader, gradientShader, splatShader, displayShader } from '../shaders/shaders';
import { createNoise2D } from 'simplex-noise';

@Injectable({
  providedIn: 'root'
})
export class FluidSimulationService implements OnDestroy {
  private noise: ReturnType<typeof createNoise2D> | undefined; // Generador de ruido

  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private renderTargets!: {
    velocity: THREE.WebGLRenderTarget[];
    density: THREE.WebGLRenderTarget[];
    pressure: THREE.WebGLRenderTarget[];
    divergence: THREE.WebGLRenderTarget;
  };
  
  private materials!: {
    advection: THREE.ShaderMaterial;
    divergence: THREE.ShaderMaterial;
    pressure: THREE.ShaderMaterial;
    gradient: THREE.ShaderMaterial;
    splat: THREE.ShaderMaterial;
    display: THREE.ShaderMaterial;
  };

  private mesh!: THREE.Mesh;
  private point: THREE.Vector2;
  private lastPoint: THREE.Vector2;
  private pointVelocity: THREE.Vector2;
  private animationFrameId!: number;
  private time: number = 0;
  private dt: number = 1.0 / 60.0;
  private moved: boolean = true;

  constructor() {
    this.scene = new THREE.Scene();
    this.point = new THREE.Vector2(0.5, 0.5);
    this.lastPoint = new THREE.Vector2(0.5, 0.5);
    this.pointVelocity = new THREE.Vector2();
    this.noise = createNoise2D();
  }

  initialize(canvas: ElementRef<HTMLCanvasElement>) {
    this.setupRenderer(canvas);
    this.setupCamera();
    this.setupRenderTargets();
    this.setupMaterials();
    this.setupMesh();
    this.animate();
  }

  private setupRenderer(canvas: ElementRef<HTMLCanvasElement>) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas.nativeElement,
      alpha: true,
      precision: 'highp',
      preserveDrawingBuffer: true, // Mantener el contenido del buffer para persistencia
    });
    this.renderer.autoClear = true; // Desactivar limpieza automática del buffer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
}

  private setupCamera() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  private setupRenderTargets() {
    const width = Math.round(window.innerWidth / 2);
    const height = Math.round(window.innerHeight / 2);
    
    this.renderTargets = {
      velocity: [
        this.createRenderTarget(width, height),
        this.createRenderTarget(width, height)
      ],
      density: [
        this.createRenderTarget(width, height),
        this.createRenderTarget(width, height)
      ],
      pressure: [
        this.createRenderTarget(width, height),
        this.createRenderTarget(width, height)
      ],
      divergence: this.createRenderTarget(width, height)
    };
  }

  private createRenderTarget(width: number, height: number): THREE.WebGLRenderTarget {
    return new THREE.WebGLRenderTarget(width, height, {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    });
  }

  private setupMaterials() {
    const texelSize = new THREE.Vector2(
      1.0 / window.innerWidth,
      1.0 / window.innerHeight
    );

    this.materials = {
      advection: new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: advectionShader,
        uniforms: {
          ['u_velocity_texture']: { value: null },
          ['u_input_texture']: { value: null },
          ['u_texel']: { value: texelSize },
          ['u_dt']: { value: this.dt }
        }
      }),
      
      divergence: new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: divergenceShader,
        uniforms: {
          ['u_velocity_texture']: { value: null },
          ['u_texel']: { value: texelSize }
        }
      }),

      pressure: new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: pressureShader,
        uniforms: {
          ['u_pressure_texture']: { value: null },
          ['u_divergence_texture']: { value: null },
          ['u_texel']: { value: texelSize }
        }
      }),

      gradient: new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: gradientShader,
        uniforms: {
          ['u_pressure_texture']: { value: null },
          ['u_velocity_texture']: { value: null },
          ['u_texel']: { value: texelSize }
        }
      }),

      splat: new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: splatShader,
        uniforms: {
          ['u_input_texture']: { value: null },
          ['u_ratio']: { value: window.innerWidth / window.innerHeight },
          ['u_point_value']: { value: new THREE.Vector3() },
          ['u_point']: { value: new THREE.Vector2() },
          ['u_point_size']: { value: 0.003 }
        }
      }),

      display: new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: displayShader,
        uniforms: {
          ['u_texture']: { value: null }
        }
      })
    };
  }

  private setupMesh() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.materials.display);
    this.scene.add(this.mesh);
  }


  private updatePoint(t: number) {
    this.lastPoint.copy(this.point);

    // Configuración para el ruido y el movimiento
    const noiseSpeed = 0.00023; // Velocidad del movimiento más lenta 0.00025
    const scale = 0.75;       // Aumenta la escala para un área de movimiento más amplia

    // Movimiento fluido basado en ruido simplex
    const noise = this.noise ?? ((x: number, y: number) => 0);
    this.point.set(
      0.5 + scale * noise(t * noiseSpeed, 0), // Movimiento en X basado en ruido
      0.5 + scale * noise(0, t * noiseSpeed)  // Movimiento en Y basado en ruido
    );

    // Clamping extendido: Permitir movimiento fuera de [0, 1] para un rango mayor
    this.point.x = THREE.MathUtils.clamp(this.point.x, -0.5, 1.5); 
    this.point.y = THREE.MathUtils.clamp(this.point.y, -0.5, 1.5);

    // Calcula la velocidad del punto en función del cambio de posición
    this.pointVelocity.subVectors(this.point, this.lastPoint).multiplyScalar(60);
}

  private animate = (t?: number) => {
    this.time = t || 0;
    this.updatePoint(this.time);

    if (this.moved) {
      // Aplicar splat a velocidad
      this.mesh.material = this.materials.splat;
      this.materials.splat.uniforms['u_input_texture'].value = this.renderTargets.velocity[0].texture;
      this.materials.splat.uniforms['u_point'].value.copy(this.point);
      this.materials.splat.uniforms['u_point_value'].value.set(
        this.pointVelocity.x * 15,
        this.pointVelocity.y * 15,
        1.0
      );
      this.renderer.setRenderTarget(this.renderTargets.velocity[1]);
      this.renderer.render(this.scene, this.camera);
      this.swapBuffers('velocity');

      // Aplicar splat a densidad
      this.materials.splat.uniforms['u_input_texture'].value = this.renderTargets.density[0].texture;
      this.materials.splat.uniforms['u_point_value'].value.set(0x00 / 255, 0xdc / 255, 0x4d / 255); // HEX: #00dc4d
      this.renderer.setRenderTarget(this.renderTargets.density[1]);
      this.renderer.render(this.scene, this.camera);
      this.swapBuffers('density');
    }

    // Calcular divergencia
    this.mesh.material = this.materials.divergence;
    this.materials.divergence.uniforms['u_velocity_texture'].value = this.renderTargets.velocity[0].texture;
    this.renderer.setRenderTarget(this.renderTargets.divergence);
    this.renderer.render(this.scene, this.camera);

    // Calcular presión
    this.mesh.material = this.materials.pressure;
    for (let i = 0; i < 20; i++) {
      this.materials.pressure.uniforms['u_divergence_texture'].value = this.renderTargets.divergence.texture;
      this.materials.pressure.uniforms['u_pressure_texture'].value = this.renderTargets.pressure[0].texture;
      this.renderer.setRenderTarget(this.renderTargets.pressure[1]);
      this.renderer.render(this.scene, this.camera);
      this.swapBuffers('pressure');
    }

    // Aplicar gradiente
    this.mesh.material = this.materials.gradient;
    this.materials.gradient.uniforms['u_pressure_texture'].value = this.renderTargets.pressure[0].texture;
    this.materials.gradient.uniforms['u_velocity_texture'].value = this.renderTargets.velocity[0].texture;
    this.renderer.setRenderTarget(this.renderTargets.velocity[1]);
    this.renderer.render(this.scene, this.camera);
    this.swapBuffers('velocity');

    // Advección de densidad
    this.mesh.material = this.materials.advection;
    this.materials.advection.uniforms['u_velocity_texture'].value = this.renderTargets.velocity[0].texture;
    this.materials.advection.uniforms['u_input_texture'].value = this.renderTargets.density[0].texture;
    this.renderer.setRenderTarget(this.renderTargets.density[1]);
    this.renderer.render(this.scene, this.camera);
    this.swapBuffers('density');

    // Render final
    this.mesh.material = this.materials.display;
    this.materials.display.uniforms['u_texture'].value = this.renderTargets.density[0].texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.animate);
}

  private swapBuffers(type: 'velocity' | 'density' | 'pressure') {
    const temp = this.renderTargets[type][0];
    this.renderTargets[type][0] = this.renderTargets[type][1];
    this.renderTargets[type][1] = temp;
  }

  private onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.renderer.setSize(width, height);
    const texelSize = new THREE.Vector2(1.0 / width, 1.0 / height);
    
    Object.values(this.materials).forEach(material => {
      if (material.uniforms['u_texel']) {
        material.uniforms['u_texel'].value = texelSize;
      }
    });
    
    this.materials.splat.uniforms['u_ratio'].value = width / height;
    
    this.setupRenderTargets();
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.mesh.geometry.dispose();
    Object.values(this.materials).forEach(material => material.dispose());
    Object.values(this.renderTargets).forEach(target => {
      if (Array.isArray(target)) {
        target.forEach(t => t.dispose());
      } else {
        target.dispose();
      }
    });
    this.renderer?.dispose();
  }
}