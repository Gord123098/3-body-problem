// js/visuals.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class VisualEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);

        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050508);
        this.scene.fog = new THREE.FogExp2(0x050508, 0.0002);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.set(0, 500, 800);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Lights
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);

        this.bodyMeshes = [];
        this.trailLines = [];
        this.trailPositions = []; // To store history for updating buffers

        this.addStars();

        window.addEventListener('resize', () => this.onResize());
    }

    addStars() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 2000; i++) {
            vertices.push((Math.random() - 0.5) * 8000);
            vertices.push((Math.random() - 0.5) * 8000);
            vertices.push((Math.random() - 0.5) * 8000);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0.6 });
        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
    }

    initBodies(bodies) {
        // Clear previous
        this.bodyMeshes.forEach(m => this.scene.remove(m));
        this.trailLines.forEach(l => this.scene.remove(l));
        this.bodyMeshes = [];
        this.trailLines = [];
        this.trailPositions = [];

        bodies.forEach(b => {
            // Mesh
            const geometry = new THREE.SphereGeometry(b.radius, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                color: b.color,
                emissive: b.color,
                emissiveIntensity: 2,
                roughness: 0.1,
                metalness: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(b.pos.x, b.pos.y, b.pos.z);

            // Glow Sprite
            const spriteMat = new THREE.SpriteMaterial({
                map: this.createGlowTexture(b.color),
                color: b.color,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(b.radius * 6, b.radius * 6, 1);
            mesh.add(sprite);

            this.scene.add(mesh);
            this.bodyMeshes.push(mesh);

            // Trail Setup (BufferGeometry)
            const trailLen = 1000;
            const trailGeo = new THREE.BufferGeometry();
            const positions = new Float32Array(trailLen * 3); // predefined size
            trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            // Create gradient opacity using vertex colors? 
            // Simplified: Just use a single color Line for now, maybe upgrade later if requested.
            // Requirement was "longer brighter tracks".
            const trailMat = new THREE.LineBasicMaterial({
                color: b.color,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            }); // Basic line is faster

            const trail = new THREE.Line(trailGeo, trailMat);
            trail.frustumCulled = false; // Optim: don't cull always
            this.scene.add(trail);
            this.trailLines.push(trail);

            // Initialize trail history with current pos
            const history = new Array(trailLen).fill(b.pos);
            this.trailPositions.push(history);
        });
    }

    update(bodies) {
        bodies.forEach((b, i) => {
            // Update Mesh
            this.bodyMeshes[i].position.set(b.pos.x, b.pos.y, b.pos.z);

            // Update Trail
            const history = this.trailPositions[i];
            history.push(b.pos.clone());
            history.shift();

            const positions = this.trailLines[i].geometry.attributes.position.array;
            for (let j = 0; j < history.length; j++) {
                positions[j * 3] = history[j].x;
                positions[j * 3 + 1] = history[j].y;
                positions[j * 3 + 2] = history[j].z;
            }
            this.trailLines[i].geometry.attributes.position.needsUpdate = true;
        });

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    createGlowTexture(colorStr) {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
