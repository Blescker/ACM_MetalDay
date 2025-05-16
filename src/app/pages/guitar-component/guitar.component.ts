import {
  Component,
  AfterViewInit,
  NgZone,
  ElementRef,
  ViewChild,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

@Component({
  standalone: true,
  selector: 'app-guitar',
  imports: [CommonModule],
  templateUrl: './guitar.component.html',
})
export class GuitarComponent implements AfterViewInit {
  @ViewChild('guitarCanvasContainer', { static: true }) containerRef!: ElementRef;
  @Input() volumen: number = 0; // 👈 volumen recibido desde el Main

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => this.init3D());
  }

  private init3D() {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 🎥 Escena y cámara
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 100);
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 💡 Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // 🎮 Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.0, 0);
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.update();

    // 📦 Cargar modelo
    const loader = new GLTFLoader();
    loader.load('modelos/guitarV.glb', (gltf: any) => {
      console.log('Modelo cargado:', gltf);

      const model = gltf.scene;
      model.scale.set(3, 3, 3);
      model.position.y = 1;
      model.rotation.y = Math.PI;
      model.rotation.x = 0;
      model.rotation.z = 0;

      scene.add(model);

      const clock = new THREE.Clock();

      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        model.rotation.y += delta * 0.5;

        // 💥 Efecto de vibración al gritar fuerte
        if (this.volumen > 80) {
          const vibracion = 3 + Math.sin(Date.now() * 0.1) * 0.1;
          model.scale.set(vibracion, vibracion, vibracion);
        } else {
          model.scale.set(3, 3, 3);
        }

        controls.update();
        renderer.render(scene, camera);
      };

      animate();
    });
  }
}
