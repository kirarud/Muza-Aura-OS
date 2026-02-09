
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ConsciousnessState, AiStatus, HSVColor, EmotionType } from '../../core/types';
import { EMOTION_COLOR_MAP } from '../../core/state';

interface Avatar3DProps {
    consciousness: ConsciousnessState;
    aiStatus: AiStatus;
}

// Convert HSV to Hex string for Three.js
const hsvToHex = (hsv: HSVColor): number => {
    const { h, s, v } = hsv;
    const c = new THREE.Color();
    c.setHSL(h / 360, s, v);
    return c.getHex();
};

const Avatar3D: React.FC<Avatar3DProps> = ({ consciousness, aiStatus }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const headGroupRef = useRef<THREE.Group | null>(null);
    const coreRef = useRef<THREE.Mesh | null>(null);
    const ringsRef = useRef<THREE.Group | null>(null);
    
    // Animation Refs
    const mousePos = useRef({ x: 0, y: 0 });
    const targetRotation = useRef({ x: 0, y: 0 });
    const frameId = useRef(0);

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. Setup Scene
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        // Transparent background
        
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.z = 6;
        camera.position.y = 0.5;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // 2. Create Geometry (The Construct)
        const group = new THREE.Group();
        
        // A. The Skull (Wireframe Icosahedron)
        const skullGeo = new THREE.IcosahedronGeometry(1.2, 1);
        const skullMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.3 
        });
        const skull = new THREE.Mesh(skullGeo, skullMat);
        group.add(skull);

        // B. The Face Mask (Partial Sphere)
        const faceGeo = new THREE.SphereGeometry(1.0, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.35); // Cut sphere
        const faceMat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            shininess: 100,
            flatShading: true
        });
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.rotation.x = -Math.PI / 2;
        face.position.z = 0.2;
        group.add(face);

        // C. The Core (Glowing Octahedron - The "Brain")
        const coreGeo = new THREE.OctahedronGeometry(0.5, 0);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: false });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);
        coreRef.current = core;

        // D. Eyes (Glowing Spheres)
        const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.4, 0.2, 0.9);
        rightEye.position.set(0.4, 0.2, 0.9);
        group.add(leftEye);
        group.add(rightEye);

        // E. Neck / Shoulders (Abstract)
        const neckGeo = new THREE.CylinderGeometry(0.3, 0.6, 1.5, 8, 1, true);
        const neckMat = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true, transparent: true, opacity: 0.2 });
        const neck = new THREE.Mesh(neckGeo, neckMat);
        neck.position.y = -1.8;
        group.add(neck);

        scene.add(group);
        headGroupRef.current = group;

        // F. Halo Rings (Floating data streams)
        const ringsGroup = new THREE.Group();
        const ringGeo = new THREE.TorusGeometry(2, 0.02, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.2 });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.rotation.x = Math.PI / 2;
        ringsGroup.add(ring1);
        ringsGroup.add(ring2);
        scene.add(ringsGroup);
        ringsRef.current = ringsGroup;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 2);
        scene.add(directionalLight);
        const pointLight = new THREE.PointLight(0x00ffff, 1, 10);
        pointLight.position.set(0, 0, 2);
        scene.add(pointLight);

        // Store refs
        rendererRef.current = renderer;
        sceneRef.current = scene;
        cameraRef.current = camera;

        // 3. Event Listeners
        const handleMouseMove = (e: MouseEvent) => {
            // Normalize mouse pos -1 to 1
            mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const handleResize = () => {
            if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            cameraRef.current.aspect = w / h;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        // 4. Animation Loop
        const animate = () => {
            if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

            const time = Date.now() * 0.001;
            
            // Smooth look-at
            targetRotation.current.x = mousePos.current.y * 0.3; // Look up/down
            targetRotation.current.y = mousePos.current.x * 0.3; // Look left/right

            if (headGroupRef.current) {
                headGroupRef.current.rotation.x += (targetRotation.current.x - headGroupRef.current.rotation.x) * 0.1;
                headGroupRef.current.rotation.y += (targetRotation.current.y - headGroupRef.current.rotation.y) * 0.1;
                
                // Idle Float
                headGroupRef.current.position.y = Math.sin(time) * 0.1;
            }

            if (ringsRef.current) {
                ringsRef.current.rotation.x += 0.002;
                ringsRef.current.rotation.y += 0.005;
                ringsRef.current.rotation.z = Math.sin(time * 0.5) * 0.2;
            }

            // Core Pulse (Speaking/Processing)
            if (coreRef.current) {
                const baseScale = 0.5;
                let pulse = 0;
                
                if (aiStatus.isAiSpeaking) {
                    pulse = Math.sin(time * 20) * 0.2; // Fast pulse
                } else if (aiStatus.isAiListening) {
                    pulse = Math.sin(time * 5) * 0.1; // Medium pulse
                } else {
                    pulse = Math.sin(time) * 0.05; // Slow breathing
                }
                
                coreRef.current.scale.setScalar(1 + pulse);
                coreRef.current.rotation.y += 0.02;
                coreRef.current.rotation.z += 0.01;
            }

            rendererRef.current.render(sceneRef.current, cameraRef.current);
            frameId.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameId.current);
            if (rendererRef.current && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
                rendererRef.current.dispose();
            }
        };
    }, []);

    // 5. Update Colors/State based on Props
    useEffect(() => {
        if (!coreRef.current || !headGroupRef.current) return;

        const emotionColor = EMOTION_COLOR_MAP[consciousness.activeEmotion];
        const hexColor = hsvToHex(emotionColor);

        // Update core color
        (coreRef.current.material as THREE.MeshBasicMaterial).color.setHex(hexColor);
        
        // Update eyes
        headGroupRef.current.children.forEach(child => {
            if ((child as THREE.Mesh).geometry instanceof THREE.SphereGeometry && child !== coreRef.current) {
                // Approximate check for eyes based on geometry type
                // Actually, I added face (Sphere) and Eyes (Sphere). Need to distinguish.
                // Eyes are small.
                const mesh = child as THREE.Mesh;
                if ((mesh.geometry as THREE.SphereGeometry).parameters.radius < 0.2) {
                     (mesh.material as THREE.MeshBasicMaterial).color.setHex(hexColor);
                }
            }
        });

    }, [consciousness.activeEmotion]);

    return <div ref={containerRef} className="absolute inset-0 pointer-events-none z-0 opacity-80" />;
};

export default Avatar3D;
