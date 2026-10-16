import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AlertCircle, Activity, Sparkles, ShieldAlert, Crosshair, ChevronRight } from 'lucide-react';

interface Biometric3DViewerProps {
  theme?: 'light' | 'dark';
  heartRate: number; // bpm
  spo2: number; // %
  radiationRate: number; // uSv/h
  status: 'NOMINAL' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
  painAreas?: string[];
  activeScenario?: string;
  className?: string;
  heightClassName?: string;
  title?: string;
  astronautName?: string;
}

// Module-scope camera interpolation targets
const _targetCameraPos = new THREE.Vector3(0, 1.25, 3.6);
const _targetLookAt = new THREE.Vector3(0, 1.0, 0);

// Clinical mitigation knowledge base for space medicine
const PAIN_MITIGATION_DATABASE: Record<
  string,
  {
    title: string;
    clinicalMechanism: string;
    aiMitigation: string;
    priority: 'ADVISORY' | 'WARNING' | 'CRITICAL';
  }
> = {
  'Spine / Lumbar': {
    title: 'Microgravity Spinal Elongation & Lumbar Tension',
    clinicalMechanism:
      'Absence of axial 1G gravitational load causes intervertebral discs to hyper-hydrate and expand up to 5-7cm, stretching paraspinal ligaments and inducing persistent morning lumbar ache.',
    aiMitigation:
      'Execute 15 minutes of knees-to-chest fetal stretching before beginning resistance training. Tighten sleeping sack axial bungee harness to 150N preload. Limit lumbar torque during ARED cycles.',
    priority: 'ADVISORY',
  },
  Head: {
    title: 'Cephalic Fluid Shift & Space Motion Syndrome / SANS',
    clinicalMechanism:
      'Cephalic migration of ~2 liters of vascular and interstitial fluid causes elevated intracranial pressure, facial engorgement, and sinus fullness without gravity-assisted venous drainage.',
    aiMitigation:
      'Elevate sleeping quarters head by 5 degrees if harness permits. Perform 20 minutes of Lower Body Negative Pressure (LBNP) session at -25 mmHg to redistribute venous pooling downward.',
    priority: 'ADVISORY',
  },
  Neck: {
    title: 'Cervical Spine Distraction & Microgravity Head Rest Strain',
    clinicalMechanism:
      'Continuous neutral body posture (NBP) floating angles place non-physiologic isometric load on posterior cervical extensors while viewing workstations.',
    aiMitigation:
      'Adjust console display height down by 12 degrees to neutral eye-line. Perform gentle chin tucks and isometric cervical contractions 3x daily. Apply topical thermal patch from medical locker.',
    priority: 'ADVISORY',
  },
  'Joints / Knees': {
    title: 'Joint Cartilage Microgravity Deconditioning',
    clinicalMechanism:
      'Reduced baseline articular joint compression combined with high peak loads during ARED eccentric repetitions causes patellofemoral and synovial inflammation.',
    aiMitigation:
      'Ensure knee alignment tracks second toe during squat cycle. Inspect footplate grip harness. Apply cryo-cuff cold therapy for 15 minutes post-exercise.',
    priority: 'ADVISORY',
  },
  Joints: {
    title: 'Articular Synovial Irritation & Harness Load',
    clinicalMechanism:
      'Microgravity fluid redistributions alter synovial joint lubricative fluid balance, exacerbated by tether harness friction.',
    aiMitigation:
      'Perform non-impact cycloid mobility drills for 10 minutes. Ensure 2.5L isotonic fluid balance is maintained to preserve synovial rheology.',
    priority: 'ADVISORY',
  },
  Shoulders: {
    title: 'Treadmill Harness Chafing & Acromioclavicular Impingement',
    clinicalMechanism:
      'T2 bungee shoulder straps exert high downward force across clavicular arches during countermeasure running cycles in microgravity.',
    aiMitigation:
      'Install viscoelastic shoulder padding buffers on T2 harness. Inspect skin for pressure erythema. Adjust bungee load vector by +5cm anteriorly.',
    priority: 'ADVISORY',
  },
  Eyes: {
    title: 'Spaceflight Associated Neuro-ocular Syndrome (SANS)',
    clinicalMechanism:
      'Chronic optic nerve sheath diameter expansion and mild posterior globe flattening induced by cephalad venous congestion.',
    aiMitigation:
      'Execute 20-20-20 visual hygiene protocol. Use prescribed SANS adjustable focal eyeglasses (+1.25D) for console work. Schedule optical coherence tomography (OCT) scan.',
    priority: 'WARNING',
  },
};

export const Biometric3DViewer: React.FC<Biometric3DViewerProps> = ({
  theme = 'dark',
  heartRate,
  spo2,
  radiationRate,
  status,
  painAreas = [],
  activeScenario,
  className,
  heightClassName,
  title,
  astronautName,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewLayer, setViewLayer] = useState<'skin' | 'skeleton' | 'biometric'>('skin');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'full' | 'spine' | 'chest' | 'head'>('full');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);

  // Dynamic telemetry ref for zero-GC animation loop
  const telemetryRef = useRef({ heartRate, spo2, radiationRate, status, painAreas, activeScenario });
  telemetryRef.current = { heartRate, spo2, radiationRate, status, painAreas, activeScenario };

  const layerRef = useRef(viewLayer);
  layerRef.current = viewLayer;

  const autoRotateRef = useRef(isRotating);
  autoRotateRef.current = isRotating;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    // Scene setup with adaptive background
    const scene = new THREE.Scene();
    const isLight = theme === 'light';
    const bgColor = isLight ? 0xf8fafc : 0x050811;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.1);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 1.25, 3.6);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.05 : 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-Point Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xffffff, isLight ? 2.0 : 2.5);
    keyLight.position.set(2.5, 4.0, 3.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x00f0ff, isLight ? 0xe2e8f0 : 0x0a1120, isLight ? 1.4 : 1.6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, isLight ? 1.6 : 2.8);
    rimLight.position.set(-3.0, 2.5, -2.5);
    scene.add(rimLight);

    // Soft Radial Ground Contact Shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 0, 128, 128, 115);
      grad.addColorStop(0, isLight ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(0.5, isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(0, 240, 255, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.01;
    scene.add(contactShadow);

    // Holographic Grid Floor
    const gridHelper = new THREE.GridHelper(
      6,
      24,
      isLight ? 0x0284c7 : 0x00f0ff,
      isLight ? 0xcbd5e1 : 0x0f2942
    );
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // ========================================================
    // Stylized Hologram Medical Mannequin Group
    // ========================================================
    const humanBodyGroup = new THREE.Group();
    humanBodyGroup.position.set(0, 0, 0);

    // Registry of named anatomical body parts for dynamic pain mapping
    const anatomicalMeshMap = new Map<string, THREE.Mesh>();

    // 1. Cool Holographic Cyan Base Material (#00f0ff)
    const baseHoloMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x004d66,
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.1,
      transmission: 0.65,
      transparent: true,
      opacity: 0.82,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      wireframe: false,
    });

    // 2. Glowing Joint Node Material (Spherical articulation nodes)
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.25,
      metalness: 0.4,
    });

    // Helper to instantiate, name, and register each proportioned segment
    const createAnatomicalMesh = (
      geo: THREE.BufferGeometry,
      name: string,
      pos: [number, number, number],
      rot?: [number, number, number],
      isJoint: boolean = false
    ): THREE.Mesh => {
      // Create independent clone of material so each mesh can pulse hazard red independently
      const mat = (isJoint ? jointMat : baseHoloMat).clone();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = name;
      mesh.position.set(...pos);
      if (rot) mesh.rotation.set(...rot);
      mesh.castShadow = true;
      humanBodyGroup.add(mesh);
      anatomicalMeshMap.set(name, mesh);
      return mesh;
    };

    // ----------------------------------------------------
    // Head & Neck (Proportioned smooth geometries)
    // ----------------------------------------------------
    const headGeo = new THREE.SphereGeometry(0.125, 32, 24);
    headGeo.scale(0.85, 1.15, 0.95);
    createAnatomicalMesh(headGeo, 'head', [0, 1.68, 0]);

    const neckGeo = new THREE.CylinderGeometry(0.05, 0.058, 0.12, 20);
    createAnatomicalMesh(neckGeo, 'neck', [0, 1.51, 0]);

    // ----------------------------------------------------
    // Torso (Two anatomical segments: Upper Chest & Abdomen/Pelvis)
    // ----------------------------------------------------
    // Upper Chest: Tapered curved cylinder
    const chestGeo = new THREE.CylinderGeometry(0.21, 0.165, 0.36, 24);
    chestGeo.scale(1.2, 1.0, 0.72);
    createAnatomicalMesh(chestGeo, 'chest', [0, 1.28, 0]);

    // Abdomen
    const abdomenGeo = new THREE.CylinderGeometry(0.165, 0.175, 0.24, 24);
    abdomenGeo.scale(1.1, 1.0, 0.7);
    createAnatomicalMesh(abdomenGeo, 'abdomen', [0, 1.0, 0]);

    // Pelvis / Lower Back
    const pelvisGeo = new THREE.CylinderGeometry(0.18, 0.155, 0.18, 20);
    pelvisGeo.scale(1.18, 1.0, 0.75);
    createAnatomicalMesh(pelvisGeo, 'lower_back', [0, 0.8, 0]);

    // ----------------------------------------------------
    // Joint Articulation Nodes (Shoulders, Elbows, Hips, Knees)
    // ----------------------------------------------------
    const shoulderNodeGeo = new THREE.SphereGeometry(0.055, 16, 16);
    createAnatomicalMesh(shoulderNodeGeo, 'left_shoulder', [-0.24, 1.4, 0], undefined, true);
    createAnatomicalMesh(shoulderNodeGeo, 'right_shoulder', [0.24, 1.4, 0], undefined, true);

    const elbowNodeGeo = new THREE.SphereGeometry(0.042, 16, 16);
    createAnatomicalMesh(elbowNodeGeo, 'left_elbow', [-0.28, 1.08, 0.02], undefined, true);
    createAnatomicalMesh(elbowNodeGeo, 'right_elbow', [0.28, 1.08, 0.02], undefined, true);

    const hipNodeGeo = new THREE.SphereGeometry(0.055, 16, 16);
    createAnatomicalMesh(hipNodeGeo, 'left_hip', [-0.11, 0.73, 0], undefined, true);
    createAnatomicalMesh(hipNodeGeo, 'right_hip', [0.11, 0.73, 0], undefined, true);

    const kneeNodeGeo = new THREE.SphereGeometry(0.048, 16, 16);
    createAnatomicalMesh(kneeNodeGeo, 'left_knee', [-0.11, 0.33, 0.02], undefined, true);
    createAnatomicalMesh(kneeNodeGeo, 'right_knee', [0.11, 0.33, 0.02], undefined, true);

    // ----------------------------------------------------
    // Limbs: Separated Upper & Lower Segments (Arms & Legs)
    // ----------------------------------------------------
    // Upper Arms
    const upperArmGeo = new THREE.CylinderGeometry(0.042, 0.038, 0.28, 16);
    createAnatomicalMesh(upperArmGeo, 'left_upper_arm', [-0.26, 1.23, 0.01], [0, 0, 0.12]);
    createAnatomicalMesh(upperArmGeo, 'right_upper_arm', [0.26, 1.23, 0.01], [0, 0, -0.12]);

    // Lower Arms (Forearms)
    const forearmGeo = new THREE.CylinderGeometry(0.036, 0.03, 0.26, 16);
    createAnatomicalMesh(forearmGeo, 'left_forearm', [-0.29, 0.93, 0.04], [0, 0, 0.08]);
    createAnatomicalMesh(forearmGeo, 'right_forearm', [0.29, 0.93, 0.04], [0, 0, -0.08]);

    // Hands
    const handGeo = new THREE.BoxGeometry(0.045, 0.08, 0.022);
    createAnatomicalMesh(handGeo, 'left_hand', [-0.3, 0.74, 0.05]);
    createAnatomicalMesh(handGeo, 'right_hand', [0.3, 0.74, 0.05]);

    // Thighs (Upper Legs)
    const thighGeo = new THREE.CylinderGeometry(0.072, 0.054, 0.38, 18);
    createAnatomicalMesh(thighGeo, 'left_thigh', [-0.11, 0.53, 0]);
    createAnatomicalMesh(thighGeo, 'right_thigh', [0.11, 0.53, 0]);

    // Calves (Lower Legs)
    const calfGeo = new THREE.CylinderGeometry(0.05, 0.038, 0.36, 18);
    createAnatomicalMesh(calfGeo, 'left_calf', [-0.11, 0.18, 0]);
    createAnatomicalMesh(calfGeo, 'right_calf', [0.11, 0.18, 0]);

    // Feet
    const footGeo = new THREE.BoxGeometry(0.07, 0.045, 0.16);
    createAnatomicalMesh(footGeo, 'left_foot', [-0.11, 0.03, 0.04]);
    createAnatomicalMesh(footGeo, 'right_foot', [0.11, 0.03, 0.04]);

    // ----------------------------------------------------
    // Internal Organs: Pulsing Heart Core & Resonant Lungs
    // ----------------------------------------------------
    const heartGeo = new THREE.SphereGeometry(0.065, 18, 18);
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.name = 'heart';
    heartMesh.position.set(0.035, 1.26, 0.05);
    humanBodyGroup.add(heartMesh);
    anatomicalMeshMap.set('heart', heartMesh);

    const heartLight = new THREE.PointLight(0xff3366, 1.8, 0.9);
    heartLight.position.set(0.035, 1.26, 0.06);
    humanBodyGroup.add(heartLight);

    // Lungs
    const lungGeo = new THREE.SphereGeometry(0.078, 16, 16);
    lungGeo.scale(0.8, 1.35, 0.7);
    const lungMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.5,
      roughness: 0.3,
    });
    const leftLung = new THREE.Mesh(lungGeo, lungMat);
    leftLung.name = 'left_lung';
    leftLung.position.set(-0.09, 1.25, 0.02);
    humanBodyGroup.add(leftLung);

    const rightLung = new THREE.Mesh(lungGeo, lungMat.clone());
    rightLung.name = 'right_lung';
    rightLung.position.set(0.12, 1.25, 0.02);
    humanBodyGroup.add(rightLung);

    // Brain Crown
    const brainGeo = new THREE.SphereGeometry(0.09, 16, 16);
    brainGeo.scale(0.9, 1.1, 1.15);
    const brainMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      wireframe: true,
    });
    const brainMesh = new THREE.Mesh(brainGeo, brainMat);
    brainMesh.name = 'brain';
    brainMesh.position.set(0, 1.68, 0.02);
    humanBodyGroup.add(brainMesh);

    // Vertebrae Spinal Column (14 anatomical segments)
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.3,
      metalness: 0.4,
    });
    const spineSegments: THREE.Mesh[] = [];
    for (let i = 0; i < 14; i++) {
      const vGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.028, 12);
      const vMesh = new THREE.Mesh(vGeo, spineMat.clone());
      vMesh.name = `vertebra_${i}`;
      const t = i / 13;
      const vy = 1.5 - t * 0.58;
      const vz = -0.06 + Math.sin(t * Math.PI) * 0.03;
      vMesh.position.set(0, vy, vz);
      vMesh.rotation.x = Math.PI / 2;
      humanBodyGroup.add(vMesh);
      spineSegments.push(vMesh);
    }

    // Outer Holographic Biometric Aura
    const auraGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.85, 24, 8, true);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.position.set(0, 0.95, 0);
    humanBodyGroup.add(auraMesh);

    scene.add(humanBodyGroup);

    // ========================================================
    // Interactive Raycasting (Click Mesh to view Biometric Details)
    // ========================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(humanBodyGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects.find((i) => i.object.name && !i.object.name.startsWith('vertebra_'));
        if (hit && hit.object.name) {
          setSelectedBodyPart(hit.object.name);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('click', handleCanvasClick);

    // Orbit Drag Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      humanBodyGroup.rotation.y += deltaX * 0.008;
      camera.position.y = Math.max(0.3, Math.min(2.5, camera.position.y - deltaY * 0.005));
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ========================================================
    // 60FPS Zero-GC Animation Loop
    // ========================================================
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      const { heartRate: hr, status: st, painAreas: pAreas } = telemetryRef.current;
      const layer = layerRef.current;
      const autoRotate = autoRotateRef.current;

      // Turntable smooth auto-rotation
      if (autoRotate && !isDragging) {
        humanBodyGroup.rotation.y += delta * 0.35;
      }

      // Live heart pulsation scaled by actual BPM
      const pulseRate = (hr || 72) / 60;
      const pulsePhase = Math.sin(elapsed * pulseRate * Math.PI * 2);
      const pulseScale = 1.0 + Math.max(0, pulsePhase) * 0.32;
      heartMesh.scale.set(pulseScale, pulseScale, pulseScale);
      heartLight.intensity = 1.4 + Math.max(0, pulsePhase) * 2.0;

      // Lungs breathing expansion
      const breathPhase = (Math.sin(elapsed * 1.3) + 1) * 0.5;
      const lungScale = 0.95 + breathPhase * 0.12;
      leftLung.scale.set(0.8 * lungScale, 1.35 * lungScale, 0.7 * lungScale);
      rightLung.scale.set(0.8 * lungScale, 1.35 * lungScale, 0.7 * lungScale);

      // ========================================================
      // Dynamic Pain Mapping: Red Hazard Spot Logic (#ff3366)
      // ========================================================
      const isSpineInPain = pAreas.some((a) => /spine|lumbar|back/i.test(a));
      const isHeadInPain = pAreas.some((a) => /head|brain/i.test(a));
      const isNeckInPain = pAreas.some((a) => /neck/i.test(a));
      const isJointsInPain = pAreas.some((a) => /joint|knee|hip|elbow/i.test(a));
      const isShouldersInPain = pAreas.some((a) => /shoulder/i.test(a));
      const isEyesInPain = pAreas.some((a) => /eye/i.test(a));

      const hazardPulse = (Math.sin(elapsed * 4.5) + 1) * 0.5; // Emissive pulse intensity

      // Evaluate every anatomical mesh in registry
      anatomicalMeshMap.forEach((mesh, name) => {
        const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
        let isHazard = false;

        if (name === 'lower_back' || name === 'abdomen') {
          isHazard = isSpineInPain;
        } else if (name === 'head') {
          isHazard = isHeadInPain || isEyesInPain;
        } else if (name === 'neck') {
          isHazard = isNeckInPain;
        } else if (name.includes('shoulder')) {
          isHazard = isShouldersInPain;
        } else if (name.includes('knee') || name.includes('elbow') || name.includes('hip')) {
          isHazard = isJointsInPain;
        }

        if (isHazard) {
          // Bright glowing medical hazard red (#ff3366) with emissive pulse
          mat.color.setHex(0xff3366);
          mat.emissive.setHex(0xff1744);
          mat.emissiveIntensity = 1.4 + hazardPulse * 1.2;
          if ('transmission' in mat) mat.transmission = 0.25;
        } else {
          // Cool holographic cyan (#00f0ff) with low opacity / translucent depth
          if (name.includes('shoulder') || name.includes('knee') || name.includes('elbow') || name.includes('hip')) {
            mat.color.setHex(0x38bdf8);
            mat.emissive.setHex(0x0284c7);
            mat.emissiveIntensity = 0.5;
          } else if (name !== 'heart') {
            mat.color.setHex(0x00f0ff);
            mat.emissive.setHex(0x004d66);
            mat.emissiveIntensity = 0.35;
            if ('transmission' in mat) mat.transmission = 0.65;
          }
        }
      });

      // Spine column glow
      spineSegments.forEach((vMesh) => {
        const sMat = vMesh.material as THREE.MeshStandardMaterial;
        if (isSpineInPain) {
          sMat.color.setHex(0xff3366);
          sMat.emissive.setHex(0xff1744);
          sMat.emissiveIntensity = 1.6 + hazardPulse * 1.4;
        } else {
          sMat.color.setHex(0xe2e8f0);
          sMat.emissive.setHex(0x000000);
          sMat.emissiveIntensity = 0;
        }
      });

      // Layer visibilities
      if (layer === 'skeleton') {
        anatomicalMeshMap.forEach((m, name) => {
          if (!name.includes('spine') && !name.includes('joint') && name !== 'lower_back') {
            m.visible = false;
          }
        });
        auraMesh.visible = false;
      } else if (layer === 'biometric') {
        anatomicalMeshMap.forEach((m) => (m.visible = true));
        baseHoloMat.opacity = 0.45;
        auraMesh.visible = true;
      } else {
        anatomicalMeshMap.forEach((m) => (m.visible = true));
        baseHoloMat.opacity = 0.82;
        auraMesh.visible = false;
      }

      // Smooth camera damping
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCameraPos.x, 3, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCameraPos.y, 3, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCameraPos.z, 3, delta);
      camera.lookAt(_targetLookAt);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('click', handleCanvasClick);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);

      // Clean disposals
      humanBodyGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTexture.dispose();
      renderer.dispose();

      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, [theme]);

  // Handle camera presets
  useEffect(() => {
    if (cameraPreset === 'full') {
      _targetCameraPos.set(0, 1.25, 3.6);
      _targetLookAt.set(0, 1.0, 0);
    } else if (cameraPreset === 'spine') {
      _targetCameraPos.set(0, 1.15, -2.2);
      _targetLookAt.set(0, 1.1, 0);
    } else if (cameraPreset === 'chest') {
      _targetCameraPos.set(0, 1.25, 1.8);
      _targetLookAt.set(0, 1.22, 0);
    } else if (cameraPreset === 'head') {
      _targetCameraPos.set(0, 1.68, 1.4);
      _targetLookAt.set(0, 1.66, 0);
    }
  }, [cameraPreset]);

  // Active pain detail card for the first reported pain or clicked body part
  const activePainKey = painAreas[0] || (selectedBodyPart ? selectedBodyPart.replace(/_/g, ' ') : null);
  const activeMitigation = activePainKey
    ? Object.entries(PAIN_MITIGATION_DATABASE).find(([k]) =>
        new RegExp(k.replace(/\s*\/\s*/g, '|'), 'i').test(activePainKey)
      )?.[1]
    : null;

  return (
    <div
      className={`relative w-full ${
        heightClassName || 'h-[480px] lg:h-[540px]'
      } bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between ${
        className || ''
      }`}
    >
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Top Overlay Header */}
      <div className="relative z-10 flex items-center justify-between p-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-cyan-400 flex items-center gap-2 shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold tracking-wide">
              {title || '3D ANATOMICAL HOLOGRAM MANNEQUIN'}
            </span>
          </div>
          {astronautName && (
            <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
              CREW: {astronautName}
            </div>
          )}
        </div>

        {/* Global Triage Pill */}
        <div
          className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tracking-wide backdrop-blur-md ${
            status === 'CRITICAL'
              ? 'bg-rose-950/90 border-rose-600 text-rose-300'
              : status === 'WARNING'
              ? 'bg-amber-950/90 border-amber-600 text-amber-300'
              : status === 'ADVISORY'
              ? 'bg-cyan-950/90 border-cyan-600 text-cyan-300'
              : 'bg-emerald-950/90 border-emerald-600 text-emerald-300'
          }`}
        >
          STATUS: {status}
        </div>
      </div>

      {/* Floating Dynamic Pain Info Card / AI Mitigation Overlay */}
      {painAreas.length > 0 && activeMitigation && (
        <div className="relative z-10 mx-4 max-w-sm pointer-events-auto">
          <div className="p-3.5 rounded-xl bg-slate-900/95 border border-rose-600/80 shadow-2xl backdrop-blur-md space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-rose-900/60 pb-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold font-mono">
                <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>RED HAZARD SPOT: {painAreas.join(', ')}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-950 border border-rose-700 text-rose-300 font-bold">
                {activeMitigation.priority}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-200 block">
                {activeMitigation.title}
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                {activeMitigation.clinicalMechanism}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-slate-200 text-[11px] leading-relaxed">
              <span className="text-cyan-300 font-semibold flex items-center gap-1 font-mono text-[10px] uppercase mb-0.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                AI Mitigation Protocol:
              </span>
              {activeMitigation.aiMitigation}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="relative z-10 p-4 flex flex-wrap items-center justify-between gap-3 text-xs pointer-events-auto">
        {/* Layer Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md font-mono text-[11px]">
          <span className="text-slate-400 px-2 uppercase">Layer:</span>
          {(['skin', 'skeleton', 'biometric'] as const).map((layer) => (
            <button
              key={layer}
              type="button"
              onClick={() => setViewLayer(layer)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                viewLayer === layer
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {layer.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Focus Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md font-mono text-[11px]">
          <span className="text-slate-400 px-2 uppercase">Focus:</span>
          {(['full', 'spine', 'chest', 'head'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setCameraPreset(preset)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                cameraPreset === preset
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {preset.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Turntable Rotation Switch */}
        <button
          type="button"
          onClick={() => setIsRotating(!isRotating)}
          className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-semibold border transition-colors cursor-pointer backdrop-blur-md ${
            isRotating
              ? 'bg-emerald-950/90 border-emerald-600 text-emerald-300'
              : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          {isRotating ? 'ROTATE: ON' : 'ROTATE: PAUSED'}
        </button>
      </div>
    </div>
  );
};
