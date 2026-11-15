import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  AlertCircle,
  Activity,
  ShieldAlert,
  Crosshair,
  CheckCircle2,
  Stethoscope,
  ClipboardPlus,
  X,
} from 'lucide-react';
import { ANATOMICAL_REGIONS, AnatomicalRegionInfo } from '../data/nasaHrpKnowledge';
import { computeSmartHazardTags } from '../data/nasaFiveHazards';
import { evaluateSpecificNasaRisks } from '../data/nasaHrpRisks';
import { SmartRiskPills } from './NasaRiskPillsAndModal';

interface Biometric3DViewerProps {
  theme?: 'light' | 'dark';
  heartRate: number; // bpm
  spo2: number; // %
  radiationRate: number; // uSv/h
  cumulativeDoseMsv?: number;
  status: 'NOMINAL' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
  painAreas?: string[];
  activeScenario?: string;
  className?: string;
  heightClassName?: string;
  title?: string;
  astronautName?: string;
  selectedRegionId?: string | null;
  regionFocusNonce?: number;
  cabinCO2?: number;
  sleepQuality?: number;
  mentalHealth?: string;
  overallFeeling?: string;
  habitsStrugglingWith?: string[];
  evaMode?: boolean;
  onRegionSelect?: (regionId: string | null) => void;
  onStartExamForRegion?: (regionId: string) => void;
}

// Map any clicked 3D mesh name to a canonical NASA HRP anatomical region
function resolveRegionFromMeshName(meshName: string): AnatomicalRegionInfo | null {
  for (const region of ANATOMICAL_REGIONS) {
    if (region.meshNames.includes(meshName)) {
      return region;
    }
  }
  if (meshName.startsWith('vertebra_')) {
    return ANATOMICAL_REGIONS.find((r) => r.id === 'spine_lumbar') || null;
  }
  return null;
}

export const Biometric3DViewer: React.FC<Biometric3DViewerProps> = ({
  theme = 'dark',
  heartRate,
  spo2,
  radiationRate,
  cumulativeDoseMsv = 94.2,
  status,
  painAreas = [],
  activeScenario,
  className,
  heightClassName,
  title,
  astronautName,
  selectedRegionId: controlledRegionId,
  regionFocusNonce = 0,
  cabinCO2 = 2.3,
  sleepQuality = 8,
  mentalHealth = '',
  overallFeeling = '',
  habitsStrugglingWith = [],
  evaMode = false,
  onRegionSelect,
  onStartExamForRegion,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewLayer, setViewLayer] = useState<'skin' | 'skeleton' | 'biometric'>('skin');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'full' | 'spine' | 'chest' | 'head'>('full');
  const [internalRegionId, setInternalRegionId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [hoveredRegionLabel, setHoveredRegionLabel] = useState<string | null>(null);
  const [cursorPointer, setCursorPointer] = useState<boolean>(false);

  // Per-instance camera damping targets (prevents multiple 3D viewers from fighting)
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.25, 3.6));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.0, 0));
  const worldPosTmpRef = useRef<THREE.Vector3>(new THREE.Vector3());

  const selectedRegionId =
    controlledRegionId !== undefined ? controlledRegionId : internalRegionId;

  // When an external component (like OSDR Testbench or Routine check) explicitly selects a region, open the inspector
  useEffect(() => {
    if (controlledRegionId) {
      setIsInspectorOpen(true);
      const region = ANATOMICAL_REGIONS.find((r) => r.id === controlledRegionId);
      if (region) {
        setCameraPreset(region.cameraPreset);
      }
    }
  }, [controlledRegionId, regionFocusNonce]);

  const selectRegion = (regionId: string | null) => {
    setInternalRegionId(regionId);
    onRegionSelect?.(regionId);
    if (regionId) {
      setIsInspectorOpen(true);
      const region = ANATOMICAL_REGIONS.find((r) => r.id === regionId);
      if (region) {
        setCameraPreset(region.cameraPreset);
      }
    } else {
      setIsInspectorOpen(false);
      setCameraPreset('full');
    }
  };

  // Refs synced to 60fps loop without recreating WebGL context
  const telemetryRef = useRef({ heartRate, spo2, radiationRate, status, painAreas, activeScenario });
  telemetryRef.current = { heartRate, spo2, radiationRate, status, painAreas, activeScenario };

  const layerRef = useRef(viewLayer);
  layerRef.current = viewLayer;

  const autoRotateRef = useRef(isRotating);
  autoRotateRef.current = isRotating;

  const selectedRegionRef = useRef<string | null>(selectedRegionId);
  selectedRegionRef.current = selectedRegionId;

  const hoveredMeshRef = useRef<string | null>(null);

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
    scene.fog = new THREE.FogExp2(bgColor, 0.09);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 1.25, 3.6);

    // Software WebGL guard per Three.js production standard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.05 : 1.35;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-Point Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xffffff, isLight ? 2.0 : 2.5);
    keyLight.position.set(2.5, 4.0, 3.0);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(
      0x00f0ff,
      isLight ? 0xe2e8f0 : 0x0a1120,
      isLight ? 1.4 : 1.6
    );
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
    shadowTexture.colorSpace = THREE.SRGBColorSpace;
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
    // Interactive 3D Anatomical Mannequin Group
    // ========================================================
    const humanBodyGroup = new THREE.Group();
    humanBodyGroup.position.set(0, 0, 0);

    const anatomicalMeshMap = new Map<string, THREE.Mesh>();
    const clickableMeshes: THREE.Mesh[] = [];

    const baseHoloMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x004d66,
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.1,
      transmission: isSoftwareGl ? 0 : 0.65,
      transparent: true,
      opacity: 0.82,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.25,
      metalness: 0.4,
    });

    const createAnatomicalMesh = (
      geo: THREE.BufferGeometry,
      name: string,
      pos: [number, number, number],
      rot?: [number, number, number],
      isJoint = false
    ): THREE.Mesh => {
      const mat = (isJoint ? jointMat : baseHoloMat).clone();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = name;
      mesh.position.set(...pos);
      if (rot) mesh.rotation.set(...rot);
      mesh.castShadow = !isSoftwareGl;
      humanBodyGroup.add(mesh);
      anatomicalMeshMap.set(name, mesh);
      clickableMeshes.push(mesh);
      return mesh;
    };

    // Head & Neck
    const headGeo = new THREE.SphereGeometry(0.125, 32, 24);
    headGeo.scale(0.85, 1.15, 0.95);
    createAnatomicalMesh(headGeo, 'head', [0, 1.68, 0]);

    const neckGeo = new THREE.CylinderGeometry(0.05, 0.058, 0.12, 20);
    createAnatomicalMesh(neckGeo, 'neck', [0, 1.51, 0]);

    // Eyes / Optic Nerve Targets (Clickable SANS targets)
    const eyeGeo = new THREE.SphereGeometry(0.022, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.1,
      roughness: 0.15,
    });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.name = 'left_eye';
    leftEye.position.set(-0.042, 1.7, 0.098);
    humanBodyGroup.add(leftEye);
    anatomicalMeshMap.set('left_eye', leftEye);
    clickableMeshes.push(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    rightEye.name = 'right_eye';
    rightEye.position.set(0.042, 1.7, 0.098);
    humanBodyGroup.add(rightEye);
    anatomicalMeshMap.set('right_eye', rightEye);
    clickableMeshes.push(rightEye);

    // Torso (Chest, Abdomen, Pelvis / Lower Back)
    const chestGeo = new THREE.CylinderGeometry(0.21, 0.165, 0.36, 24);
    chestGeo.scale(1.2, 1.0, 0.72);
    createAnatomicalMesh(chestGeo, 'chest', [0, 1.28, 0]);

    const abdomenGeo = new THREE.CylinderGeometry(0.165, 0.175, 0.24, 24);
    abdomenGeo.scale(1.1, 1.0, 0.7);
    createAnatomicalMesh(abdomenGeo, 'abdomen', [0, 1.0, 0]);

    const pelvisGeo = new THREE.CylinderGeometry(0.18, 0.155, 0.18, 20);
    pelvisGeo.scale(1.18, 1.0, 0.75);
    createAnatomicalMesh(pelvisGeo, 'lower_back', [0, 0.8, 0]);

    // Joint Articulation Nodes
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

    // Upper & Lower Limbs
    const upperArmGeo = new THREE.CylinderGeometry(0.042, 0.038, 0.28, 16);
    createAnatomicalMesh(upperArmGeo, 'left_upper_arm', [-0.26, 1.23, 0.01], [0, 0, 0.12]);
    createAnatomicalMesh(upperArmGeo, 'right_upper_arm', [0.26, 1.23, 0.01], [0, 0, -0.12]);

    const forearmGeo = new THREE.CylinderGeometry(0.036, 0.03, 0.26, 16);
    createAnatomicalMesh(forearmGeo, 'left_forearm', [-0.29, 0.93, 0.04], [0, 0, 0.08]);
    createAnatomicalMesh(forearmGeo, 'right_forearm', [0.29, 0.93, 0.04], [0, 0, -0.08]);

    const handGeo = new THREE.BoxGeometry(0.045, 0.08, 0.022);
    createAnatomicalMesh(handGeo, 'left_hand', [-0.3, 0.74, 0.05]);
    createAnatomicalMesh(handGeo, 'right_hand', [0.3, 0.74, 0.05]);

    const thighGeo = new THREE.CylinderGeometry(0.072, 0.054, 0.38, 18);
    createAnatomicalMesh(thighGeo, 'left_thigh', [-0.11, 0.53, 0]);
    createAnatomicalMesh(thighGeo, 'right_thigh', [0.11, 0.53, 0]);

    const calfGeo = new THREE.CylinderGeometry(0.05, 0.038, 0.36, 18);
    createAnatomicalMesh(calfGeo, 'left_calf', [-0.11, 0.18, 0]);
    createAnatomicalMesh(calfGeo, 'right_calf', [0.11, 0.18, 0]);

    const footGeo = new THREE.BoxGeometry(0.07, 0.045, 0.16);
    createAnatomicalMesh(footGeo, 'left_foot', [-0.11, 0.03, 0.04]);
    createAnatomicalMesh(footGeo, 'right_foot', [0.11, 0.03, 0.04]);

    // Internal Organs: Pulsing Heart Core & Resonant Lungs
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
    clickableMeshes.push(heartMesh);

    const heartLight = new THREE.PointLight(0xff3366, 1.8, 0.9);
    heartLight.position.set(0.035, 1.26, 0.06);
    humanBodyGroup.add(heartLight);

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
    anatomicalMeshMap.set('left_lung', leftLung);
    clickableMeshes.push(leftLung);

    const rightLung = new THREE.Mesh(lungGeo, lungMat.clone());
    rightLung.name = 'right_lung';
    rightLung.position.set(0.12, 1.25, 0.02);
    humanBodyGroup.add(rightLung);
    anatomicalMeshMap.set('right_lung', rightLung);
    clickableMeshes.push(rightLung);

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
    anatomicalMeshMap.set('brain', brainMesh);
    clickableMeshes.push(brainMesh);

    // Vertebrae Spinal Column (14 clickable anatomical segments)
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
      clickableMeshes.push(vMesh);
    }

    // Internal Femur & Ribcage hints for Skeleton Mode
    const skeletonBones: THREE.Mesh[] = [];
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.35,
      metalness: 0.25,
    });
    const femurGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.36, 12);
    const leftFemur = new THREE.Mesh(femurGeo, boneMat);
    leftFemur.position.set(-0.11, 0.53, 0);
    humanBodyGroup.add(leftFemur);
    skeletonBones.push(leftFemur);

    const rightFemur = new THREE.Mesh(femurGeo, boneMat.clone());
    rightFemur.position.set(0.11, 0.53, 0);
    humanBodyGroup.add(rightFemur);
    skeletonBones.push(rightFemur);

    for (let r = 0; r < 5; r++) {
      const ribGeo = new THREE.TorusGeometry(0.14 - r * 0.008, 0.009, 8, 20, Math.PI * 1.45);
      const ribMesh = new THREE.Mesh(ribGeo, boneMat.clone());
      ribMesh.position.set(0, 1.38 - r * 0.055, -0.01);
      ribMesh.rotation.x = Math.PI / 2;
      ribMesh.rotation.z = -Math.PI * 0.22;
      humanBodyGroup.add(ribMesh);
      skeletonBones.push(ribMesh);
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

    // Animated Selection Target Ring around clicked body region
    const selectionRingGeo = new THREE.TorusGeometry(0.22, 0.008, 12, 36);
    const selectionRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.9,
    });
    const selectionRing = new THREE.Mesh(selectionRingGeo, selectionRingMat);
    selectionRing.rotation.x = Math.PI / 2;
    selectionRing.visible = false;
    humanBodyGroup.add(selectionRing);

    scene.add(humanBodyGroup);

    // ========================================================
    // Interactive Raycasting (Click + Throttled Hover)
    // ========================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let pointerDownPos = { x: 0, y: 0 };
    let prevMouseX = 0;
    let prevMouseY = 0;
    let lastHoverCheck = 0;

    const handlePointerDown = (e: MouseEvent) => {
      if (e.target !== renderer.domElement) return;
      isDragging = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        humanBodyGroup.rotation.y += deltaX * 0.008;
        targetCameraPosRef.current.y = Math.max(
          0.35,
          Math.min(2.4, targetCameraPosRef.current.y - deltaY * 0.004)
        );
        return;
      }

      // Throttled hover raycasting (~20fps max)
      const now = Date.now();
      if (now - lastHoverCheck < 50) return;
      lastHoverCheck = now;

      const rect = renderer.domElement.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom ||
        e.target !== renderer.domElement
      ) {
        hoveredMeshRef.current = null;
        setHoveredRegionLabel(null);
        setCursorPointer(false);
        return;
      }

      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableMeshes, false);

      if (intersects.length > 0) {
        const hitName = intersects[0].object.name;
        const region = resolveRegionFromMeshName(hitName);
        hoveredMeshRef.current = hitName;
        setHoveredRegionLabel(region ? region.shortLabel : hitName.replace(/_/g, ' '));
        setCursorPointer(true);
      } else {
        hoveredMeshRef.current = null;
        setHoveredRegionLabel(null);
        setCursorPointer(false);
      }
    };

    const handlePointerUp = (e: MouseEvent) => {
      // Only handle pointer-up if the interaction actually started on the 3D WebGL canvas
      if (!isDragging) return;
      isDragging = false;

      const movedDist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );

      // Treat short click (<6px drag) directly on canvas as anatomical part selection
      if (movedDist < 6) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableMeshes, false);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const region = resolveRegionFromMeshName(hit.name);
          if (region) {
            selectRegion(region.id);
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

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

      const { heartRate: hr, painAreas: pAreas } = telemetryRef.current;
      const layer = layerRef.current;
      const autoRotate = autoRotateRef.current;
      const activeRegId = selectedRegionRef.current;
      const hoveredMesh = hoveredMeshRef.current;

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

      // Pain & scenario hazard evaluation
      const isSpineInPain = pAreas.some((a) => /spine|lumbar|back/i.test(a));
      const isAbdomenInPain = pAreas.some((a) => /abdomen|stomach|kidney|renal|nausea|gi/i.test(a));
      const isHeadInPain = pAreas.some((a) => /head|brain/i.test(a));
      const isNeckInPain = pAreas.some((a) => /neck/i.test(a));
      const isJointsInPain = pAreas.some((a) => /joint|knee|hip|elbow/i.test(a));
      const isShouldersInPain = pAreas.some((a) => /shoulder/i.test(a));
      const isEyesInPain = pAreas.some((a) => /eye/i.test(a));
      const isHeartInPain = pAreas.some((a) => /chest|heart|cardiac/i.test(a));
      const activeScenarioId = telemetryRef.current.activeScenario;

      const hazardPulse = (Math.sin(elapsed * 4.5) + 1) * 0.5;
      const activeRegionObj = activeRegId
        ? ANATOMICAL_REGIONS.find((r) => r.id === activeRegId)
        : null;

      // Position Selection Ring around selected region
      if (activeRegionObj && activeRegionObj.meshNames.length > 0) {
        const anchorMesh = anatomicalMeshMap.get(activeRegionObj.meshNames[0]);
        if (anchorMesh) {
          selectionRing.visible = true;
          worldPosTmpRef.current.copy(anchorMesh.position);
          selectionRing.position.set(0, worldPosTmpRef.current.y, 0);
          const ringScale =
            activeRegionObj.id === 'head_brain' || activeRegionObj.id === 'eyes_ocular'
              ? 0.75
              : 1.0 + Math.sin(elapsed * 3.5) * 0.08;
          selectionRing.scale.set(ringScale, ringScale, 1);
          selectionRing.rotation.z = elapsed * 0.8;
        }
      } else {
        selectionRing.visible = false;
      }

      // Color & Material state across all anatomical meshes
      anatomicalMeshMap.forEach((mesh, name) => {
        const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
        let isHazard = false;

        if (name === 'lower_back') {
          isHazard = isSpineInPain;
        } else if (name === 'abdomen') {
          isHazard = isAbdomenInPain || activeScenarioId === 'osdr-511-test' || activeScenarioId === 'osdr-102-test';
        } else if (name === 'head') {
          isHazard =
            isHeadInPain ||
            activeScenarioId === 'osdr-352-test' ||
            activeScenarioId === 'demo-co2-headache' ||
            activeScenarioId === 'demo-solar-radiation' ||
            activeScenarioId === 'demo-sleep-fatigue' ||
            activeScenarioId === 'scenario-hypercapnia' ||
            activeScenarioId === 'scenario-radiation';
        } else if (name === 'left_eye' || name === 'right_eye') {
          isHazard =
            isEyesInPain ||
            activeScenarioId === 'osdr-484-test' ||
            activeScenarioId === 'demo-co2-headache';
        } else if (name === 'left_lung' || name === 'right_lung') {
          isHazard =
            activeScenarioId === 'osdr-630-test' ||
            activeScenarioId === 'scenario-decompression';
        } else if (name === 'heart') {
          isHazard =
            isHeartInPain ||
            activeScenarioId === 'demo-chest-discomfort' ||
            activeScenarioId === 'scenario-cardiac' ||
            hr > 105;
        } else if (name === 'neck') {
          isHazard = isNeckInPain || activeScenarioId === 'demo-sleep-fatigue';
        } else if (name.includes('shoulder')) {
          isHazard = isShouldersInPain;
        } else if (name.includes('knee') || name.includes('elbow') || name.includes('hip')) {
          isHazard = isJointsInPain;
        }

        const isSelectedMesh = activeRegionObj ? activeRegionObj.meshNames.includes(name) : false;
        const isHoveredMesh = hoveredMesh === name;

        if (isHazard) {
          mat.color.setHex(0xff3366);
          mat.emissive.setHex(0xff1744);
          mat.emissiveIntensity = 1.4 + hazardPulse * 1.2;
          if ('transmission' in mat) mat.transmission = isSoftwareGl ? 0 : 0.25;
        } else if (isSelectedMesh) {
          mat.color.setHex(0xfbbf24);
          mat.emissive.setHex(0xd97706);
          mat.emissiveIntensity = 1.15;
          if ('transmission' in mat) mat.transmission = isSoftwareGl ? 0 : 0.35;
        } else if (isHoveredMesh) {
          mat.color.setHex(0x67e8f9);
          mat.emissive.setHex(0x06b6d4);
          mat.emissiveIntensity = 0.95;
        } else {
          if (
            name.includes('shoulder') ||
            name.includes('knee') ||
            name.includes('elbow') ||
            name.includes('hip')
          ) {
            mat.color.setHex(0x38bdf8);
            mat.emissive.setHex(0x0284c7);
            mat.emissiveIntensity = 0.5;
          } else if (name === 'left_eye' || name === 'right_eye') {
            mat.color.setHex(0x38bdf8);
            mat.emissive.setHex(0x0ea5e9);
            mat.emissiveIntensity = 1.0;
          } else if (name === 'heart') {
            mat.color.setHex(0xfb7185);
            mat.emissive.setHex(0xe11d48);
            mat.emissiveIntensity = 0.7;
          } else {
            mat.color.setHex(0x00f0ff);
            mat.emissive.setHex(0x004d66);
            mat.emissiveIntensity = 0.35;
            if ('transmission' in mat) mat.transmission = isSoftwareGl ? 0 : 0.65;
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
        } else if (activeRegionObj?.id === 'spine_lumbar') {
          sMat.color.setHex(0xfbbf24);
          sMat.emissive.setHex(0xd97706);
          sMat.emissiveIntensity = 1.0;
        } else {
          sMat.color.setHex(0xe2e8f0);
          sMat.emissive.setHex(0x000000);
          sMat.emissiveIntensity = 0;
        }
      });

      // Layer visibility states
      if (layer === 'skeleton') {
        anatomicalMeshMap.forEach((m, name) => {
          const isBoneOrJoint =
            name.includes('shoulder') ||
            name.includes('knee') ||
            name.includes('elbow') ||
            name.includes('hip') ||
            name === 'lower_back' ||
            name === 'head';
          m.visible = isBoneOrJoint;
          if (name === 'head') {
            (m.material as THREE.MeshPhysicalMaterial).opacity = 0.25;
          }
        });
        skeletonBones.forEach((b) => (b.visible = true));
        auraMesh.visible = false;
      } else if (layer === 'biometric') {
        anatomicalMeshMap.forEach((m) => {
          m.visible = true;
          if (m.material instanceof THREE.MeshPhysicalMaterial) {
            m.material.opacity = 0.42;
          }
        });
        skeletonBones.forEach((b) => (b.visible = true));
        auraMesh.visible = true;
      } else {
        anatomicalMeshMap.forEach((m) => {
          m.visible = true;
          if (m.material instanceof THREE.MeshPhysicalMaterial) {
            m.material.opacity = 0.82;
          }
        });
        skeletonBones.forEach((b) => (b.visible = false));
        auraMesh.visible = false;
      }

      // Smooth camera damping
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCameraPosRef.current.x, 3.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCameraPosRef.current.y, 3.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCameraPosRef.current.z, 3.5, delta);
      camera.lookAt(targetLookAtRef.current);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('resize', handleResize);

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

  // Camera presets
  useEffect(() => {
    if (cameraPreset === 'full') {
      targetCameraPosRef.current.set(0, 1.25, 3.6);
      targetLookAtRef.current.set(0, 1.0, 0);
    } else if (cameraPreset === 'spine') {
      targetCameraPosRef.current.set(0, 1.15, -2.2);
      targetLookAtRef.current.set(0, 1.05, 0);
    } else if (cameraPreset === 'chest') {
      targetCameraPosRef.current.set(0, 1.25, 1.85);
      targetLookAtRef.current.set(0, 1.22, 0);
    } else if (cameraPreset === 'head') {
      targetCameraPosRef.current.set(0, 1.72, 1.35);
      targetLookAtRef.current.set(0, 1.66, 0);
    }
  }, [cameraPreset]);

  // Only show the floating inspector card when explicitly open (via clicking 3D body or quick strip)
  const selectedRegion: AnatomicalRegionInfo | null =
    isInspectorOpen && selectedRegionId
      ? ANATOMICAL_REGIONS.find((r) => r.id === selectedRegionId) || null
      : null;

  const isRegionInPain = selectedRegion
    ? painAreas.some((area) => selectedRegion.painAreaMatch.test(area))
    : false;

  // Dynamic live status evaluation for the selected region
  const getRegionLiveStatus = (region: AnatomicalRegionInfo): { label: string; colorClass: string } => {
    if (activeScenario === 'demo-co2-headache' && (region.id === 'head_brain' || region.id === 'eyes_ocular')) {
      return {
        label: 'ELEVATED CO₂ (0.8%) · HEADACHE',
        colorClass: 'bg-amber-950 border-amber-500 text-amber-200',
      };
    }
    if (activeScenario === 'demo-chest-discomfort' && region.id === 'heart_cardio') {
      return {
        label: 'CHEST DISCOMFORT · HR SPIKE',
        colorClass: 'bg-rose-950 border-rose-500 text-rose-200',
      };
    }
    if (activeScenario === 'demo-solar-radiation' && region.id === 'head_brain') {
      return {
        label: 'SOLAR RADIATION SPIKE ALERT',
        colorClass: 'bg-rose-950 border-rose-500 text-rose-200',
      };
    }
    if (activeScenario === 'demo-sleep-fatigue' && region.id === 'head_brain') {
      return {
        label: 'SLEEP DEPRIVATION & FATIGUE',
        colorClass: 'bg-amber-950 border-amber-500 text-amber-200',
      };
    }
    if (activeScenario === 'osdr-511-test' && (region.id === 'abdomen_renal' || region.id === 'heart_cardio')) {
      return {
        label: 'OSD-511: METABOLIC DRIFT (WATCH)',
        colorClass: 'bg-amber-950 border-amber-600 text-amber-300',
      };
    }
    if (activeScenario === 'osdr-484-test' && region.id === 'eyes_ocular') {
      return {
        label: 'OSD-484: SANS NERVE SWELLING',
        colorClass: 'bg-rose-950 border-rose-600 text-rose-300',
      };
    }
    if (activeScenario === 'osdr-352-test' && region.id === 'head_brain') {
      return {
        label: 'OSD-352: SOLAR RADIATION ALERT',
        colorClass: 'bg-rose-950 border-rose-600 text-rose-300',
      };
    }
    if (activeScenario === 'osdr-630-test' && region.id === 'lungs_respiratory') {
      return {
        label: 'OSD-630: DUST / LOW O2 ALERT',
        colorClass: 'bg-rose-950 border-rose-600 text-rose-300',
      };
    }
    if (activeScenario === 'osdr-102-test' && (region.id === 'spine_lumbar' || region.id === 'abdomen_renal')) {
      return {
        label: 'OSD-102: DEHYDRATION / STONE RISK',
        colorClass: 'bg-amber-950 border-amber-600 text-amber-300',
      };
    }
    if (painAreas.some((a) => region.painAreaMatch.test(a))) {
      return {
        label: 'PAIN HAZARD REPORTED',
        colorClass: 'bg-rose-950 border-rose-600 text-rose-300',
      };
    }
    if (region.id === 'heart_cardio' && (heartRate > 94 || heartRate < 50)) {
      return {
        label: 'ELEVATED CARDIAC STRAIN',
        colorClass: 'bg-amber-950 border-amber-600 text-amber-300',
      };
    }
    if (region.id === 'lungs_respiratory' && spo2 < 94) {
      return {
        label: 'HYPOXIA / SPO2 ALERT',
        colorClass: 'bg-rose-950 border-rose-600 text-rose-300',
      };
    }
    if (radiationRate > 50) {
      return {
        label: 'SPE RADIATION EXPOSURE',
        colorClass: 'bg-amber-950 border-amber-600 text-amber-300',
      };
    }
    return {
      label: 'NOMINAL FUNCTION',
      colorClass: 'bg-emerald-950 border-emerald-600 text-emerald-300',
    };
  };

  return (
    <div className="space-y-3">
      {/* Main 3D Viewport Container */}
      <div
        className={`relative w-full ${
          heightClassName || 'h-[480px] lg:h-[540px]'
        } bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between ${
          className || ''
        }`}
      >
        <div
          ref={mountRef}
          className={`absolute inset-0 ${
            cursorPointer ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
          }`}
        />

        {/* Top Overlay Header (Solid/Semi-opaque without backdrop-blur per WebGL perf guidelines) */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-4 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/95 border border-slate-700 text-xs font-mono text-cyan-400 flex items-center gap-2 shadow-lg">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold tracking-wide">
                {title || 'CLICKABLE 3D ANATOMICAL DIAGNOSTIC TWIN'}
              </span>
            </div>
            {astronautName && (
              <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/95 border border-slate-800 text-[11px] font-mono text-slate-300">
                CREW: {astronautName}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hoveredRegionLabel && (
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-cyan-600/80 text-[11px] font-mono text-cyan-300">
                Target: {hoveredRegionLabel} (Click to Inspect)
              </div>
            )}

            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tracking-wide ${
                status === 'CRITICAL'
                  ? 'bg-rose-950/95 border-rose-600 text-rose-300'
                  : status === 'WARNING'
                  ? 'bg-amber-950/95 border-amber-600 text-amber-300'
                  : status === 'ADVISORY'
                  ? 'bg-cyan-950/95 border-cyan-600 text-cyan-300'
                  : 'bg-emerald-950/95 border-emerald-600 text-emerald-300'
              }`}
            >
              STATUS: {status}
            </div>
          </div>
        </div>

        {/* Clickable Body Part Inspector Card (Renders for ANY clicked region OR pain spot) */}
        {selectedRegion && (
          <div className="relative z-10 mx-4 max-w-md pointer-events-auto my-auto">
            <div
              className={`p-4 rounded-xl bg-slate-900/95 border shadow-2xl space-y-2.5 text-xs ${
                isRegionInPain ? 'border-rose-500' : 'border-cyan-600/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                    <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedRegion.system}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mt-0.5">{selectedRegion.label}</h4>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      getRegionLiveStatus(selectedRegion).colorClass
                    }`}
                  >
                    {getRegionLiveStatus(selectedRegion).label}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectRegion(null)}
                    className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    title="Close anatomical inspector"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold block">
                    Physiological Function:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedRegion.normalFunction}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold block">
                    Spaceflight Hazard Impact:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedRegion.spaceflightHazards}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold block">
                    NASA-STD-3001 Actionable Countermeasure:
                  </span>
                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    {selectedRegion.preventativeActions[0]}
                  </p>
                </div>

                {/* Smart NASA 5 Hazards Tagging */}
                {(() => {
                  const smartTags = computeSmartHazardTags({
                    painAreas,
                    sleepQuality,
                    mentalHealth,
                    ambientCO2: cabinCO2,
                    spo2,
                    radiationRate,
                    activeScenarioId: activeScenario,
                    regionId: selectedRegion.id,
                  });
                  const { activeRisks } = evaluateSpecificNasaRisks({
                    heartRate,
                    spo2,
                    radiationRate,
                    cumulativeDoseMsv,
                    ambientCO2: cabinCO2,
                    painAreas,
                    sleepQuality,
                    mentalHealth,
                    overallFeeling,
                    habitsStrugglingWith,
                    evaMode,
                    activeScenarioId: activeScenario,
                    selectedRegionId: selectedRegion.id,
                  });
                  const regionRisks = activeRisks.filter(
                    (r) => !r.spec.linkedRegionId || r.spec.linkedRegionId === selectedRegion.id
                  );

                  return (
                    <div className="space-y-2">
                      {regionRisks.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          <SmartRiskPills
                            compact
                            title={`NASA HRP Specific Risks · ${selectedRegion.shortLabel}`}
                            risks={regionRisks}
                          />
                        </div>
                      )}

                      {smartTags.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold block">
                            NASA HRP Hazard Match:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {smartTags.map((tag) => (
                              <span
                                key={tag.hazardId}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                  tag.status === 'RED'
                                    ? 'bg-rose-950 border-rose-600 text-rose-300'
                                    : tag.status === 'AMBER'
                                    ? 'bg-amber-950 border-amber-600 text-amber-300'
                                    : 'bg-emerald-950 border-emerald-700 text-emerald-300'
                                }`}
                              >
                                [{tag.tagLabel}]
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {onStartExamForRegion && (
                <button
                  type="button"
                  onClick={() => onStartExamForRegion(selectedRegion.id)}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ClipboardPlus className="w-3.5 h-3.5" />
                  <span>Enter Exam Indicator for {selectedRegion.shortLabel}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Floating Control Dock */}
        <div className="relative z-10 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 text-xs pointer-events-auto">
          {/* Layer Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/95 border border-slate-800 font-mono text-[11px]">
            <span className="text-slate-400 px-2 uppercase">Layer:</span>
            {(['skin', 'skeleton', 'biometric'] as const).map((layer) => (
              <button
                key={layer}
                type="button"
                onClick={() => setViewLayer(layer)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/95 border border-slate-800 font-mono text-[11px]">
            <span className="text-slate-400 px-2 uppercase">Focus:</span>
            {(['full', 'spine', 'chest', 'head'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setCameraPreset(preset)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
            className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isRotating
                ? 'bg-emerald-950/95 border-emerald-600 text-emerald-300'
                : 'bg-slate-900/95 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isRotating ? 'ROTATE: ON' : 'ROTATE: PAUSED'}
          </button>
        </div>
      </div>

      {/* Clickable Body Part Quick-Select Strip (Accessible Keyboard/Mouse Fallback + Visual Map) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Click any region on the 3D body or select below to inspect function &amp; status:
          </span>
          {selectedRegion && (
            <button
              type="button"
              onClick={() => selectRegion(null)}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              Reset View
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ANATOMICAL_REGIONS.map((reg) => {
            const isSelected = selectedRegion?.id === reg.id;
            const hasPain = painAreas.some((a) => reg.painAreaMatch.test(a));
            return (
              <button
                key={reg.id}
                type="button"
                onClick={() => selectRegion(isSelected ? null : reg.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1.5 border whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-amber-950/90 border-amber-500 text-amber-200 font-bold'
                    : hasPain
                    ? 'bg-rose-950/80 border-rose-600/80 text-rose-300 hover:border-rose-400'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-600/70 hover:text-cyan-300'
                }`}
              >
                {hasPain ? (
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                ) : isSelected ? (
                  <Activity className="w-3 h-3 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                )}
                <span>{reg.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Anomaly NASA HRP Specific Risk Badges Strip */}
      {(() => {
        const { activeRisks } = evaluateSpecificNasaRisks({
          heartRate,
          spo2,
          radiationRate,
          cumulativeDoseMsv,
          ambientCO2: cabinCO2,
          painAreas,
          sleepQuality,
          mentalHealth,
          overallFeeling,
          habitsStrugglingWith,
          evaMode,
          activeScenarioId: activeScenario,
          selectedRegionId,
        });
        if (activeRisks.length === 0) return null;
        return (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <SmartRiskPills
              title="Active NASA HRP Specific Risk Alerts (Click Pill to Expand)"
              risks={activeRisks}
              onInspectRegion={(regId) => selectRegion(regId)}
            />
          </div>
        );
      })()}
    </div>
  );
};
