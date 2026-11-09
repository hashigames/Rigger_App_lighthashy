/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as fflate from 'fflate';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Support binary FBX textures compressed formats
if (typeof window !== 'undefined') {
  (window as any).fflate = fflate;
}
import { 
  Maximize2, Move, RotateCw, Sparkles, Touchpad, EyeOff, Radio, Grid, Brush, CheckCircle, Crosshair, HelpCircle, AlertTriangle, Box, ZoomIn, ZoomOut, Activity
} from 'lucide-react';
import { Language, TRANSLATIONS, ViewportStyle, ToolbarTool, RiggingNode, RigType, MeshAsset, MaterialSlotsMap, MaterialSlotConfig } from '../types';

interface Viewport3DProps {
  language: Language;
  viewportStyle: ViewportStyle;
  activeTool: ToolbarTool;
  setActiveTool: (tool: ToolbarTool) => void;
  rigType: RigType;
  workflowStage: 'import' | 'analyzed' | 'synced' | 'skeleton' | 'rigged';
  setWorkflowStage: (stage: 'import' | 'analyzed' | 'synced' | 'skeleton' | 'rigged') => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  skeletonNodes: RiggingNode[];
  setSkeletonNodes: (nodes: RiggingNode[] | ((prev: RiggingNode[]) => RiggingNode[])) => void;
  updateNodePosition: (id: string, pos: [number, number, number]) => void;
  addCustomNode: (node: RiggingNode) => void;
  activeMesh: MeshAsset | null;
  jointSize: number;
  displayBoneNames: boolean;
  xrayMode: boolean;
  boneColorCoding: boolean;
  legCount: number;
  tailSegments: number;
  tailEnabled: boolean;
  clawsToes: boolean;
  materialSlots: MaterialSlotsMap;
  lightAmbientIntensity: number;
  lightMainIntensity: number;
  lightPreset: string;
  symmetryEnabled: boolean;
  setSymmetryEnabled: (v: boolean) => void;
  idleAnimationActive: boolean;
  setIdleAnimationActive: (v: boolean) => void;
}

export default function Viewport3D({
  language,
  viewportStyle,
  activeTool,
  setActiveTool,
  rigType,
  workflowStage,
  setWorkflowStage,
  selectedNodeId,
  setSelectedNodeId,
  skeletonNodes,
  setSkeletonNodes,
  updateNodePosition,
  addCustomNode,
  activeMesh,
  jointSize,
  displayBoneNames,
  xrayMode,
  boneColorCoding,
  legCount,
  tailSegments,
  tailEnabled,
  clawsToes,
  materialSlots,
  lightAmbientIntensity,
  lightMainIntensity,
  lightPreset,
  symmetryEnabled,
  setSymmetryEnabled,
  idleAnimationActive,
  setIdleAnimationActive,
}: Viewport3DProps) {
  const t = TRANSLATIONS[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const idleAnimationActiveRef = useRef(idleAnimationActive);
  useEffect(() => {
    idleAnimationActiveRef.current = idleAnimationActive;
  }, [idleAnimationActive]);

  const rigTypeRef = useRef(rigType);
  useEffect(() => {
    rigTypeRef.current = rigType;
  }, [rigType]);

  const workflowStageRef = useRef(workflowStage);
  useEffect(() => {
    workflowStageRef.current = workflowStage;
  }, [workflowStage]);

  // Viewport camera layout state: 'persp' | 'front' | 'side' | 'top' | 'quad'
  const [activeCamView, setActiveCamView] = useState<'persp' | 'front' | 'side' | 'top'>('persp');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [interactiveRotation, setInteractiveRotation] = useState<[number, number, number]>([0, 0, 0]); // custom limb rotations

  // Interactive Work Light states
  const [workLightColor, setWorkLightColor] = useState<string>('#eab308'); // gold work-light bulb
  const [workLightIntensity, setWorkLightIntensity] = useState<number>(2.0);
  const [workLightEnabled, setWorkLightEnabled] = useState<boolean>(true);
  const [workLightOrbit, setWorkLightOrbit] = useState<boolean>(true);
  const [workLightHeight, setWorkLightHeight] = useState<number>(3.5);

  // Wireframe overlays
  const [wireframeMeshMode, setWireframeMeshMode] = useState<boolean>(false);
  const [mayaBonesMode, setMayaBonesMode] = useState<boolean>(true);

  // States to hold actual custom imported mesh geometries
  const [loadedCustomMesh, setLoadedCustomMesh] = useState<THREE.Object3D | null>(null);
  const [isLoadingCustom, setIsLoadingCustom] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isScanningGeometry, setIsScanningGeometry] = useState<boolean>(false);

  // Effect to load 3D file Obj asynchronously whenever activeMesh changes
  useEffect(() => {
    if (!activeMesh || !activeMesh.fileObj) {
      setLoadedCustomMesh(null);
      setLoadingError(null);
      setIsLoadingCustom(false);
      return;
    }

    setLoadingError(null);
    setIsLoadingCustom(true);
    setLoadingProgress(0);

    const file = activeMesh.fileObj;
    const url = URL.createObjectURL(file);
    const extension = file.name.split('.').pop()?.toLowerCase();

    let active = true;
    let timeoutId: any = null;

    const cleanup = () => {
      active = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('error', handleGlobalError);
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    };

    const handleLoadError = (err: any) => {
      if (!active) return;
      console.error("3D File Upload Loader Error:", err);
      let errMsg = err?.message || String(err) || "Failed to parse 3D file formatting.";
      if (errMsg.toLowerCase().includes("ascii") || (err && typeof err === 'string' && err.toLowerCase().includes("ascii"))) {
        errMsg = "ASCII FBX format detected. Three.js FBXLoader only supports Binary FBX files. Please convert/re-export your model as 'Binary' FBX model from Blender or Maya before uploading.";
      }
      setLoadingError(errMsg);
      setIsLoadingCustom(false);
      cleanup();
    };

    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error) {
        handleLoadError(event.error);
      } else if (event.message) {
        handleLoadError(new Error(event.message));
      }
    };

    window.addEventListener('error', handleGlobalError);

    // Set safety fallback timeout: if local model parsing takes >5 seconds, release loading screen.
    timeoutId = setTimeout(() => {
      if (active) {
        handleLoadError(new Error("Loading timeout. The 3D model file took too long to parse. This is common if the FBX has deep nested dependencies, references external local image pathways we cannot access, or uses an incompatible ASCII/binary version. Try converting to GLB or general binary OBJ/FBX formats."));
      }
    }, 5000);

    const handleLoadSuccess = (object: THREE.Object3D) => {
      if (!active) return;
      try {
        // 1. Traverse to verify materials are shadows enabled
        object.traverse((child) => {
          if ((child as any).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // 2. Auto-scale and center the loaded model based ONLY on actual mesh components
        // This prevents armature helpers / extreme skeleton nodes from distorting true mesh size
        const box = new THREE.Box3();
        let hasMesh = false;
        
        object.traverse((child) => {
          if ((child as any).isMesh) {
            child.updateWorldMatrix(true, true);
            const tempBox = new THREE.Box3().setFromObject(child);
            if (!tempBox.isEmpty()) {
              if (!hasMesh) {
                box.copy(tempBox);
                hasMesh = true;
              } else {
                box.union(tempBox);
              }
            }
          }
        });

        if (!hasMesh) {
          box.setFromObject(object);
        }

        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Normalize scale factor based on actual heights
        const targetHeight = 2.2;
        let currentHeight = size.y;
        if (isNaN(currentHeight) || currentHeight <= 0 || !isFinite(currentHeight)) {
          currentHeight = 1.0;
        }
        const scaleFactor = targetHeight / currentHeight;
        object.scale.setScalar(scaleFactor);

        // Force scale update propagation to evaluate accurate geometry coordinates
        object.updateMatrixWorld(true);

        // Re-evaluate bounding box of scaled geometries to center them perfectly on current grid
        const scaledBox = new THREE.Box3();
        let hasScaledMesh = false;
        object.traverse((child) => {
          if ((child as any).isMesh) {
            child.updateWorldMatrix(true, true);
            const tempBox = new THREE.Box3().setFromObject(child);
            if (!tempBox.isEmpty()) {
              if (!hasScaledMesh) {
                scaledBox.copy(tempBox);
                hasScaledMesh = true;
              } else {
                scaledBox.union(tempBox);
              }
            }
          }
        });

        if (!hasScaledMesh) {
          scaledBox.setFromObject(object);
        }

        const scaledCenter = new THREE.Vector3();
        scaledBox.getCenter(scaledCenter);

        // Sits beautifully on ground (y = 0) and centered on x, z
        object.position.x = -scaledCenter.x;
        object.position.y = -scaledBox.min.y;
        object.position.z = -scaledCenter.z;

        setLoadedCustomMesh(object);
        setIsLoadingCustom(false);
        cleanup();
      } catch (ex) {
        handleLoadError(ex);
      }
    };

    const handleLoadProgress = (xhr: ProgressEvent) => {
      if (!active) return;
      if (xhr.total > 0) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        setLoadingProgress(pct);
      }
    };

    try {
      if (extension === 'gltf' || extension === 'glb') {
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
          try {
            handleLoadSuccess(gltf.scene);
          } catch (ex) {
            handleLoadError(ex);
          }
        }, handleLoadProgress, handleLoadError);
      } else if (extension === 'obj') {
        const loader = new OBJLoader();
        loader.load(url, (obj) => {
          try {
            handleLoadSuccess(obj);
          } catch (ex) {
            handleLoadError(ex);
          }
        }, handleLoadProgress, handleLoadError);
      } else if (extension === 'fbx') {
        const loader = new FBXLoader();
        loader.load(url, (fbx) => {
          try {
            handleLoadSuccess(fbx);
          } catch (ex) {
            handleLoadError(ex);
          }
        }, handleLoadProgress, handleLoadError);
      } else {
        setLoadingError("Supported files are: FBX, OBJ, GLTF, GLB");
        setIsLoadingCustom(false);
        cleanup();
      }
    } catch (e: any) {
      handleLoadError(e);
    }
  }, [activeMesh?.id]);

  // Custom light references
  const customPointLightRef = useRef<THREE.PointLight | null>(null);
  const customPointLightMeshRef = useRef<THREE.Mesh | null>(null);

  const workLightParamsRef = useRef({
    enabled: true,
    color: '#eab308',
    intensity: 2.0,
    orbit: true,
    height: 3.5,
  });

  // Keep ref in sync under state updates for lag-free rendering
  useEffect(() => {
    workLightParamsRef.current = {
      enabled: workLightEnabled,
      color: workLightColor,
      intensity: workLightIntensity,
      orbit: workLightOrbit,
      height: workLightHeight,
    };

    if (customPointLightRef.current) {
      customPointLightRef.current.intensity = workLightEnabled ? workLightIntensity : 0;
      customPointLightRef.current.color.setHex(parseInt(workLightColor.replace('#', '0x')));
    }
    if (customPointLightMeshRef.current) {
      customPointLightMeshRef.current.visible = workLightEnabled;
      if ('color' in (customPointLightMeshRef.current.material as any)) {
        (customPointLightMeshRef.current.material as any).color.setHex(parseInt(workLightColor.replace('#', '0x')));
      }
    }
  }, [workLightEnabled, workLightColor, workLightIntensity, workLightOrbit, workLightHeight]);

  // 3D Scene variables
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const rigGroupRef = useRef<THREE.Group | null>(null);

  // Scene light pointers
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const mainLightRef = useRef<THREE.DirectionalLight | null>(null);
  const secondaryLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);

  // Mouse interaction state for Orbit Camera
  const isMouseDownRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ phi: Math.PI / 4, theta: Math.PI / 4 }); // spherical coords
  const cameraRadiusRef = useRef(15);
  const cameraTargetRef = useRef(new THREE.Vector3(0, 1.5, 0));

  // Joint drag interaction state
  const isDraggingJoint = useRef(false);
  const activeDragAxisRef = useRef<'X' | 'Y' | 'Z' | 'screen'>('screen');

  // Paint weight simulation
  const [brushPosition, setBrushPosition] = useState<{ x: number; y: number } | null>(null);
  const [paintWeights, setPaintWeights] = useState<Record<string, number>>({});

  // 1. Initialize Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x15171d);
    sceneRef.current = scene;

    // Create Camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // Create Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Resize behavior
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };
    handleResize();

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    // Setup Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainLight.position.set(5, 12, 8);
    mainLight.castShadow = true;
    scene.add(mainLight);
    mainLightRef.current = mainLight;

    const secondaryLight = new THREE.DirectionalLight(0x06b6d4, 0.5); // soft futuristic tint
    secondaryLight.position.set(-8, 3, -5);
    scene.add(secondaryLight);
    secondaryLightRef.current = secondaryLight;

    const rimLight = new THREE.PointLight(0xffffff, 0.8, 30);
    rimLight.position.set(0, 6, -10);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Custom adjustable point light and visual bulb representation to interact with materials
    const customPointLight = new THREE.PointLight(0xeab308, 2.0, 50);
    customPointLight.position.set(2.5, 3.5, 2.5);
    customPointLight.castShadow = true;
    scene.add(customPointLight);
    customPointLightRef.current = customPointLight;

    const bulbGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const bulbMesh = new THREE.Mesh(bulbGeom, bulbMat);
    bulbMesh.position.copy(customPointLight.position);
    scene.add(bulbMesh);
    customPointLightMeshRef.current = bulbMesh;

    // Add Grid Helper
    const gridHelper = new THREE.GridHelper(24, 24, 0x3a3f55, 0x21232e);
    gridHelper.position.y = 0;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Groups for procedural entities
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    const rigGroup = new THREE.Group();
    scene.add(rigGroup);
    rigGroupRef.current = rigGroup;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Perform real-time work light orbit or update positions dynamically
      const params = workLightParamsRef.current;
      if (customPointLightRef.current && customPointLightMeshRef.current) {
        if (params.enabled) {
          if (params.orbit) {
            const time = Date.now() * 0.001; // speed factor
            const radius = 4.2;
            const x = Math.sin(time) * radius;
            const z = Math.cos(time) * radius;
            const y = params.height;
            customPointLightRef.current.position.set(x, y, z);
            customPointLightMeshRef.current.position.set(x, y, z);
          } else {
            const x = 2.5;
            const z = 2.5;
            const y = params.height;
            customPointLightRef.current.position.set(x, y, z);
            customPointLightMeshRef.current.position.set(x, y, z);
          }
        }
      }

      // Render standard scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // RUN IDLE ANIMATIONS IF ACTIVE
        const animActive = idleAnimationActiveRef.current;
        const rType = rigTypeRef.current;
        const stage = workflowStageRef.current;

        if (animActive && stage === 'rigged' && meshGroupRef.current) {
          const time = Date.now();
          
          // 1. Joint Nodes Wiggling/Motion Sync
          if (rigGroupRef.current) {
            rigGroupRef.current.children.forEach((child) => {
              if (child.position) {
                if (!child.userData.originalPos) {
                  child.userData.originalPos = child.position.clone();
                }
                const orig = child.userData.originalPos;
                
                if (rType === 'tentacles') {
                  const kTime = time * 0.0022;
                  if (child.name && child.name.includes("joint_Tentacle")) {
                    const parts = child.name.split("_");
                    const idx = parseInt(parts[2]) || 0;
                    const depth = child.name.toLowerCase().includes("tip") ? 2 : (child.name.toLowerCase().includes("mid") ? 1 : 0);
                    child.position.x = orig.x + Math.sin(kTime * 1.4 + idx * 1.35 + depth * 0.45) * 0.12;
                    child.position.z = orig.z + Math.cos(kTime * 1.1 + idx * 1.35 + depth * 0.45) * 0.12;
                  } else {
                    child.position.y = orig.y + Math.sin(kTime) * 0.05;
                  }
                } else if (rType === 'quadruped') {
                  const qTime = time * 0.005;
                  if (child.name && child.name.includes("Tail")) {
                    child.position.x = orig.x + Math.sin(qTime) * 0.18;
                  } else {
                    child.position.y = orig.y + Math.sin(qTime * 0.3) * 0.015;
                  }
                } else if (rType === 'robot') {
                  const robTime = time * 0.0028;
                  child.position.y = orig.y + Math.sin(robTime) * 0.08;
                } else if (rType === 'spider') {
                  const sTime = time * 0.003;
                  if (child.name && child.name.includes("Leg")) {
                    child.position.y = orig.y + Math.sin(sTime * 1.8) * 0.012;
                  } else {
                    child.position.y = orig.y + Math.sin(sTime) * 0.025;
                  }
                } else if (rType === 'biped') {
                  const bTime = time * 0.002;
                  child.position.y = orig.y + Math.sin(bTime * 1.8) * 0.025;
                  if (child.name && child.name.includes("Hand")) {
                    child.position.x = orig.x + Math.sin(bTime) * 0.08;
                  }
                }
              }
            });
          }

          // 2. Mesh Parts Wiggling/Motion Sync
          if (rType === 'tentacles') {
            const kTime = time * 0.0022;
            const kGroup = meshGroupRef.current.getObjectByName("kraken_group");
            if (kGroup) {
              kGroup.position.y = Math.sin(kTime) * 0.06;
            }
            meshGroupRef.current.traverse((child) => {
              if (child.name === "tentacle_segment_group" && child.userData.isTentacle) {
                const { index, depth } = child.userData;
                const waveX = Math.sin(kTime * 1.4 + index * 1.35 + depth * 0.45) * 0.16;
                const waveZ = Math.cos(kTime * 1.1 + index * 1.35 + depth * 0.45) * 0.12;
                if (child.children[0]) {
                  child.children[0].rotation.x = waveX;
                  child.children[0].rotation.z = waveZ;
                }
              }
            });
          } else if (rType === 'quadruped') {
            const qTime = time * 0.005;
            const tail = meshGroupRef.current.getObjectByName("quadruped_tail_root");
            const qHead = meshGroupRef.current.getObjectByName("quadruped_head");
            if (tail) {
              tail.rotation.y = Math.sin(qTime) * 0.42;
              tail.rotation.x = Math.cos(qTime * 0.5) * 0.08;
            }
            if (qHead) {
              qHead.rotation.y = Math.sin(qTime * 0.15) * 0.1;
              qHead.rotation.x = Math.max(-0.06, Math.cos(qTime * 0.2) * 0.05);
            }
          } else if (rType === 'robot') {
            const robTime = time * 0.0028;
            const rGroup = meshGroupRef.current.getObjectByName("robot_group") || meshGroupRef.current.children[0];
            if (rGroup) {
              rGroup.position.y = Math.sin(robTime) * 0.08;
              rGroup.traverse((child) => {
                if (child.name === "robot_leg_anchor_group") {
                  const { index } = child.userData;
                  child.rotation.x = Math.sin(robTime + index * 2.09) * 0.06;
                }
              });
            }
          } else if (rType === 'spider') {
            const sTime = time * 0.003;
            const sGroup = meshGroupRef.current.getObjectByName("spider_group") || meshGroupRef.current.children[0];
            if (sGroup) {
              sGroup.position.y = Math.sin(sTime) * 0.03;
              const abd = sGroup.getObjectByName("spider_abdomen");
              if (abd) {
                abd.position.y = 1.4 + Math.sin(sTime * 0.8) * 0.05;
              }
              sGroup.traverse((child) => {
                if (child.name === "spider_leg_root") {
                  const { index, isLeft } = child.userData;
                  child.rotation.z = (isLeft ? Math.PI : 0) + Math.sin(sTime * 1.5 + index * 0.8) * 0.04;
                }
              });
            }
          } else if (rType === 'biped') {
            const bTime = time * 0.002;
            const chest = meshGroupRef.current.getObjectByName("biped_chest");
            const head = meshGroupRef.current.getObjectByName("biped_head");
            const armL = meshGroupRef.current.getObjectByName("biped_arm_L");
            const armR = meshGroupRef.current.getObjectByName("biped_arm_R");
            if (chest) {
              chest.rotation.z = Math.sin(bTime) * 0.02;
              chest.position.y = 2.0 + Math.sin(bTime * 1.8) * 0.015;
            }
            if (head) {
              head.rotation.x = Math.sin(bTime * 0.8) * 0.03;
            }
            if (armL) {
              armL.rotation.z = -0.1 + Math.sin(bTime) * 0.06;
              armL.rotation.x = Math.cos(bTime) * 0.04;
            }
            if (armR) {
              armR.rotation.z = 0.1 - Math.sin(bTime) * 0.06;
              armR.rotation.x = -Math.cos(bTime) * 0.04;
            }
          }
        } else {
          // CLEANUP / RESET STATE TO BASE POSE WHEN RE-SET OR PAUSED OR EXITED STAGE
          if (meshGroupRef.current) {
            meshGroupRef.current.position.set(0, 0, 0);
            
            if (rType === 'tentacles') {
              meshGroupRef.current.traverse((child) => {
                if (child.name === "tentacle_segment_group") {
                  if (child.children[0]) {
                    child.children[0].rotation.set(0, 0, 0);
                  }
                }
              });
              const kGroup = meshGroupRef.current.getObjectByName("kraken_group");
              if (kGroup) kGroup.position.set(0, 0, 0);
            } else if (rType === 'quadruped') {
              const tail = meshGroupRef.current.getObjectByName("quadruped_tail_root");
              const qHead = meshGroupRef.current.getObjectByName("quadruped_head");
              if (tail) tail.rotation.set(0, 0, 0);
              if (qHead) qHead.rotation.set(0, 0, 0);
            } else if (rType === 'robot') {
              const rGroup = meshGroupRef.current.getObjectByName("robot_group") || meshGroupRef.current.children[0];
              if (rGroup) {
                rGroup.position.set(0, 0, 0);
                rGroup.traverse((child) => {
                  if (child.name === "robot_leg_anchor_group") {
                    child.rotation.set(0, 0, 0);
                  }
                });
              }
            } else if (rType === 'spider') {
              const sGroup = meshGroupRef.current.getObjectByName("spider_group") || meshGroupRef.current.children[0];
              if (sGroup) {
                sGroup.position.set(0, 0, 0);
                const abd = sGroup.getObjectByName("spider_abdomen");
                if (abd) abd.position.set(0, 1.4, -0.85 * Math.max(0.6, tailSegments / 5));
                sGroup.traverse((child) => {
                  if (child.name === "spider_leg_root") {
                    const { isLeft } = child.userData;
                    child.rotation.set(0, isLeft ? Math.PI : 0, 0);
                  }
                });
              }
            } else if (rType === 'biped') {
              const chest = meshGroupRef.current.getObjectByName("biped_chest");
              const head = meshGroupRef.current.getObjectByName("biped_head");
              const armL = meshGroupRef.current.getObjectByName("biped_arm_L");
              const armR = meshGroupRef.current.getObjectByName("biped_arm_R");
              if (chest) {
                chest.rotation.set(0, 0, 0);
                chest.position.set(0, 2.0, 0);
              }
              if (head) head.rotation.set(0, 0, 0);
              if (armL) armL.rotation.set(0, 0, 0);
              if (armR) armR.rotation.set(0, 0, 0);
            }
          }

          if (rigGroupRef.current) {
            rigGroupRef.current.children.forEach((child) => {
              if (child.userData && child.userData.originalPos) {
                child.position.copy(child.userData.originalPos);
              }
            });
          }
        }

        // Soft camera inertia
        updateCameraPosition();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  // Update camera coordinates based on user view tab & spherical orbit coords
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;

    if (activeCamView === 'persp') {
      const phi = cameraRotationRef.current.phi;
      const theta = cameraRotationRef.current.theta;
      const r = cameraRadiusRef.current;

      const x = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi) + cameraTargetRef.current.y;
      const z = r * Math.sin(phi) * Math.cos(theta);

      cameraRef.current.position.set(x, y, z);
      cameraRef.current.lookAt(cameraTargetRef.current);
    } else if (activeCamView === 'front') {
      cameraRef.current.position.set(0, cameraTargetRef.current.y, cameraRadiusRef.current);
      cameraRef.current.lookAt(cameraTargetRef.current);
    } else if (activeCamView === 'side') {
      cameraRef.current.position.set(cameraRadiusRef.current, cameraTargetRef.current.y, 0);
      cameraRef.current.lookAt(cameraTargetRef.current);
    } else if (activeCamView === 'top') {
      cameraRef.current.position.set(0, cameraRadiusRef.current + 3, 0);
      cameraRef.current.lookAt(new THREE.Vector3(0, 0, 0));
    }
  };

  // 2. Generate procedural 3D Meshes reactively when type or styling switches
  useEffect(() => {
    if (!sceneRef.current || !meshGroupRef.current) return;

    // Save interactive rotation ref for later skin deformation logic
    const scene = sceneRef.current;
    const meshGroup = meshGroupRef.current;

    // Clear previous mesh shapes
    while (meshGroup.children.length > 0) {
      meshGroup.remove(meshGroup.children[0]);
    }

    if (!activeMesh) return;

    // Helper to generate materials from slot states or viewport global overrides
    const parseSlotMat = (slot: MaterialSlotConfig) => {
      let mat: THREE.Material;
      if (viewportStyle === 'clay') {
        mat = new THREE.MeshStandardMaterial({
          color: 0x818a9c,
          roughness: 0.95,
          metalness: 0.02,
          flatShading: true,
        });
      } else if (viewportStyle === 'neon') {
        mat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          wireframe: true,
        });
      } else if (viewportStyle === 'holo') {
        mat = new THREE.MeshPhysicalMaterial({
          color: 0x0ea5e9,
          transparent: true,
          opacity: 0.22,
          roughness: 0.1,
          metalness: 0.8,
          clearcoat: 1.0,
        });
      } else if (viewportStyle === 'chrome') {
        mat = new THREE.MeshStandardMaterial({
          color: 0xddddff,
          roughness: 0.05,
          metalness: 0.95,
        });
      } else if (viewportStyle === 'wire') {
        mat = new THREE.MeshBasicMaterial({
          color: 0x475569,
          wireframe: true,
        });
      } else {
        // Default: parse matching custom slots
        const isGlow = slot.preset === 'glow' || slot.emissiveIntensity > 0;
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(slot.color),
          roughness: slot.roughness,
          metalness: slot.metalness,
          emissive: isGlow ? new THREE.Color(slot.emissive) : new THREE.Color(0x000000),
          emissiveIntensity: slot.emissiveIntensity,
        });
      }

      // If wireframe overlay mode is on, override wireframe property dynamically
      if (wireframeMeshMode && 'wireframe' in mat) {
        (mat as any).wireframe = true;
      }
      return mat;
    };

    const primaryMat = parseSlotMat(materialSlots.primary);
    const secondaryMat = parseSlotMat(materialSlots.secondary);
    const accentMat = parseSlotMat(materialSlots.accent);

    // Apply custom PBR texture maps to the primary material if they exist in activeMesh
    if (activeMesh.textures && primaryMat instanceof THREE.MeshStandardMaterial) {
      const loader = new THREE.TextureLoader();
      if (activeMesh.textures.baseColorFile) {
        try {
          const url = URL.createObjectURL(activeMesh.textures.baseColorFile);
          const tex = loader.load(url);
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          primaryMat.map = tex;
        } catch (e) {
          console.error("Error loading baseColorFile", e);
        }
      }
      if (activeMesh.textures.normalFile) {
        try {
          const url = URL.createObjectURL(activeMesh.textures.normalFile);
          const tex = loader.load(url);
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          primaryMat.normalMap = tex;
          primaryMat.normalScale.set(1.5, 1.5);
        } catch (e) {
          console.error("Error loading normalFile", e);
        }
      }
      if (activeMesh.textures.roughnessFile) {
        try {
          const url = URL.createObjectURL(activeMesh.textures.roughnessFile);
          const tex = loader.load(url);
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          primaryMat.roughnessMap = tex;
        } catch (e) {
          console.error("Error loading roughnessFile", e);
        }
      }
      if (activeMesh.textures.metalnessFile) {
        try {
          const url = URL.createObjectURL(activeMesh.textures.metalnessFile);
          const tex = loader.load(url);
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          primaryMat.metalnessMap = tex;
        } catch (e) {
          console.error("Error loading metalnessFile", e);
        }
      }
      if (activeMesh.textures.aoFile) {
        try {
          const url = URL.createObjectURL(activeMesh.textures.aoFile);
          const tex = loader.load(url);
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          primaryMat.aoMap = tex;
          primaryMat.aoMapIntensity = 1.0;
        } catch (e) {
          console.error("Error loading aoFile", e);
        }
      }
      primaryMat.needsUpdate = true;
    }

    // Generate Procedural model topology or display custom loaded 3D meshes
    if (activeMesh.fileObj) {
      if (loadedCustomMesh) {
        // Render custom loaded group directly to prevent breaking skeletal/skinned-mesh linkages!
        const modelToRender = loadedCustomMesh;

        // Dynamically apply selected shader/material slot profiles
        modelToRender.traverse((child) => {
          if ((child as any).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const nameLower = mesh.name.toLowerCase();
            if (nameLower.includes('eye') || nameLower.includes('lens') || nameLower.includes('glow') || nameLower.includes('accent')) {
              mesh.material = accentMat;
            } else if (nameLower.includes('limb') || nameLower.includes('leg') || nameLower.includes('arm') || nameLower.includes('joint') || nameLower.includes('wheel')) {
              mesh.material = secondaryMat;
            } else {
              mesh.material = primaryMat;
            }
          }
        });

        meshGroup.add(modelToRender);
      } else {
        // High-tech holographic scanning wireframe loading placeholder box
        const scanBoxGeom = new THREE.BoxGeometry(1.4, 2.2, 1.4);
        const scanBoxMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          wireframe: true,
          transparent: true,
          opacity: 0.28
        });
        const scanBox = new THREE.Mesh(scanBoxGeom, scanBoxMat);
        scanBox.position.set(0, 1.1, 0);
        meshGroup.add(scanBox);
      }
    } else if (rigType === 'biped') {
      // Humanoid structure
      // Left and right are colored nicely if selected bone color coding is active
      const bipedGroup = new THREE.Group();
      bipedGroup.name = "biped_group";

      // Torso/Pelvis
      const pelvicGeom = new THREE.SphereGeometry(0.5, 12, 10);
      const pelvis = new THREE.Mesh(pelvicGeom, primaryMat);
      pelvis.position.set(0, 1.2, 0);
      pelvis.castShadow = true;
      pelvis.name = "biped_pelvis";
      bipedGroup.add(pelvis);

      // Ribcage
      const chestGeom = new THREE.CylinderGeometry(0.55, 0.45, 0.8, 12);
      const chest = new THREE.Mesh(chestGeom, primaryMat);
      chest.position.set(0, 2.0, 0);
      // Skin rotation simulation: if bone is rotated, rotate chest
      chest.rotation.z = interactiveRotation[2];
      chest.rotation.y = interactiveRotation[1];
      chest.castShadow = true;
      chest.name = "biped_chest";
      bipedGroup.add(chest);

      // Head
      const headGeom = new THREE.SphereGeometry(0.35, 14, 12);
      const head = new THREE.Mesh(headGeom, accentMat);
      head.position.set(0, 2.7, 0);
      head.castShadow = true;
      head.name = "biped_head";
      bipedGroup.add(head);

      // Limbs: Segmented
      // Upper arm and forearm joints (Left & Right)
      const buildArm = (isLeft: boolean) => {
        const sideMult = isLeft ? -1 : 1;
        const armGroup = new THREE.Group();
        armGroup.position.set(sideMult * 0.7, 2.2, 0);
        armGroup.name = isLeft ? "biped_arm_L" : "biped_arm_R";

        const upperArmGeom = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 8);
        upperArmGeom.translate(0, -0.3, 0);
        const upper = new THREE.Mesh(upperArmGeom, secondaryMat);
        upper.name = "biped_upper_arm";
        
        // Deform arm if biped joints are adjusted/rotated
        if (workflowStage === 'rigged' && selectedNodeId?.includes(isLeft ? 'Left' : 'Right')) {
          upper.rotation.z = interactiveRotation[2] + (isLeft ? -0.4 : 0.4);
        }

        armGroup.add(upper);

        const lowerArmGeom = new THREE.CylinderGeometry(0.09, 0.08, 0.5, 8);
        lowerArmGeom.translate(0, -0.25, 0);
        const lower = new THREE.Mesh(lowerArmGeom, secondaryMat);
        lower.position.set(0, -0.6, 0);
        lower.name = "biped_lower_arm";
        armGroup.add(lower);

        return armGroup;
      };

      bipedGroup.add(buildArm(true));
      bipedGroup.add(buildArm(false));

      // Legs Left & Right
      const buildLeg = (isLeft: boolean) => {
        const sideMult = isLeft ? -1 : 1;
        const legGroup = new THREE.Group();
        legGroup.position.set(sideMult * 0.35, 1.1, 0);
        legGroup.name = isLeft ? "biped_leg_L" : "biped_leg_R";

        const thighGeom = new THREE.CylinderGeometry(0.16, 0.13, 0.8, 8);
        thighGeom.translate(0, -0.4, 0);
        const thigh = new THREE.Mesh(thighGeom, secondaryMat);
        thigh.name = "biped_thigh";
        
        if (workflowStage === 'rigged' && selectedNodeId?.includes(isLeft ? 'Left' : 'Right')) {
          thigh.rotation.x = interactiveRotation[0];
        }
        legGroup.add(thigh);

        const shinGeom = new THREE.CylinderGeometry(0.12, 0.09, 0.7, 8);
        shinGeom.translate(0, -0.35, 0);
        const shin = new THREE.Mesh(shinGeom, secondaryMat);
        shin.position.set(0, -0.8, 0);
        shin.name = "biped_shin";
        legGroup.add(shin);

        const footGeom = new THREE.BoxGeometry(0.18, 0.12, 0.3);
        footGeom.translate(0, -0.06, 0.08);
        const foot = new THREE.Mesh(footGeom, secondaryMat);
        foot.position.set(0, -1.5, 0);
        foot.name = "biped_foot";
        legGroup.add(foot);

        return legGroup;
      };

      bipedGroup.add(buildLeg(true));
      bipedGroup.add(buildLeg(false));

      meshGroup.add(bipedGroup);

    } else if (rigType === 'quadruped') {
      // Four legged creature (Shiba Inu)
      const quadGroup = new THREE.Group();
      quadGroup.name = "quadruped_group";

      // Horizontal central back torso
      const bodyGeom = new THREE.CylinderGeometry(0.48, 0.42, 1.8, 14);
      bodyGeom.rotateX(Math.PI / 2);
      const body = new THREE.Mesh(bodyGeom, primaryMat);
      body.position.set(0, 1.1, 0);
      body.castShadow = true;
      body.name = "quadruped_body";
      quadGroup.add(body);

      // Neck slant heading upward
      const neckGeom = new THREE.CylinderGeometry(0.24, 0.28, 0.7, 10);
      neckGeom.rotateX(Math.PI / 4);
      const neck = new THREE.Mesh(neckGeom, primaryMat);
      neck.position.set(0, 1.5, 0.8);
      neck.name = "quadruped_neck";
      quadGroup.add(neck);

      // Dog Head
      const headGeom = new THREE.SphereGeometry(0.32, 12, 10);
      const head = new THREE.Mesh(headGeom, accentMat);
      head.position.set(0, 1.8, 1.1);
      head.name = "quadruped_head";
      quadGroup.add(head);

      // Snout
      const snoutGeom = new THREE.BoxGeometry(0.2, 0.16, 0.24);
      const snout = new THREE.Mesh(snoutGeom, accentMat);
      snout.position.set(0, 1.74, 1.35);
      snout.name = "quadruped_snout";
      quadGroup.add(snout);

      // Dog ears (Optional)
      const buildEar = (isLeft: boolean) => {
        const sideMult = isLeft ? -1 : 1;
        const earGeom = new THREE.ConeGeometry(0.1, 0.25, 4);
        const ear = new THREE.Mesh(earGeom, accentMat);
        ear.position.set(sideMult * 0.16, 2.1, 1.05);
        ear.rotation.z = sideMult * -0.2;
        ear.name = isLeft ? "quadruped_ear_L" : "quadruped_ear_R";
        return ear;
      };
      quadGroup.add(buildEar(true));
      quadGroup.add(buildEar(false));

      // 4 Paws: Front-Left, Front-Right, Rear-Left, Rear-Right
      const pawGeom = new THREE.CylinderGeometry(0.12, 0.1, 0.9, 8);
      
      const buildPawLeg = (x: number, z: number, rotationApplied = false) => {
        const pawGroup = new THREE.Group();
        pawGroup.position.set(x, 1.0, z);
        pawGroup.name = `quadruped_paw_${x < 0 ? 'L' : 'R'}_${z > 0 ? 'F' : 'R'}`;

        const leg = new THREE.Mesh(pawGeom, secondaryMat);
        leg.position.set(0, -0.45, 0);
        if (rotationApplied) {
          leg.rotation.x = interactiveRotation[0] * 0.7;
        }
        leg.name = "quadruped_leg_segment";
        pawGroup.add(leg);

        const footBox = new THREE.BoxGeometry(0.18, 0.1, 0.22);
        const foot = new THREE.Mesh(footBox, secondaryMat);
        foot.position.set(0, -0.9, 0.05);
        foot.name = "quadruped_foot_segment";
        pawGroup.add(foot);

        return pawGroup;
      };

      quadGroup.add(buildPawLeg(-0.35, 0.75, true)); // FL
      quadGroup.add(buildPawLeg(0.35, 0.75, false));  // FR
      quadGroup.add(buildPawLeg(-0.32, -0.75, false)); // RL
      quadGroup.add(buildPawLeg(0.32, -0.75, true));  // RR

      // Segmented Tail based on tailSegments slider!
      const tailRoot = new THREE.Group();
      tailRoot.position.set(0, 1.4, -0.9);
      tailRoot.name = "quadruped_tail_root";
      
      let parentPart: THREE.Group | THREE.Mesh = tailRoot;
      for (let i = 0; i < tailEnabledSegments; i++) {
        const segmentGroup = new THREE.Group();
        segmentGroup.position.set(0, 0, -0.15);
        
        const segmentGeom = new THREE.CylinderGeometry(0.08 - (i * 0.005), 0.07 - (i * 0.005), 0.2, 6);
        segmentGeom.rotateX(Math.PI / 2);
        const tailSeg = new THREE.Mesh(segmentGeom, accentMat);
        tailSeg.position.set(0, 0, -0.1);
        
        // Bends automatically
        tailSeg.rotation.x = Math.sin(Date.now() * 0.002 + i) * 0.1 + 0.12;
        segmentGroup.add(tailSeg);
        
        parentPart.add(segmentGroup);
        parentPart = segmentGroup;
      }
      quadGroup.add(tailRoot);

      meshGroup.add(quadGroup);

    } else if (rigType === 'robot') {
      // Mechanical walker mecha (Radial or symmetric legs)
      const robotGroup = new THREE.Group();
      robotGroup.name = "robot_group";

      // Hexagonal Core Chassis
      const coreGeom = new THREE.CylinderGeometry(0.7, 0.8, 0.5, 6);
      const coreSegment = new THREE.Mesh(coreGeom, primaryMat);
      coreSegment.position.set(0, 1.4, 0);
      coreSegment.name = "robot_chassis";
      robotGroup.add(coreSegment);

      // Eye lens glow (neon sensor dome)
      const eyeGeom = new THREE.SphereGeometry(0.18, 12, 10);
      const eyeColor = viewportStyle === 'clay' ? 0x94a3b8 : (viewportStyle === 'neon' ? 0x06b6d4 : (new THREE.Color(materialSlots.accent.emissive).getHex()));
      const eyeMat = new THREE.MeshBasicMaterial({ 
        color: eyeColor,
      });
      const eyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
      eyeMesh.position.set(0, 1.5, 0.65);
      eyeMesh.name = "robot_eye";
      robotGroup.add(eyeMesh);

      // Dynamic Robot physical legs (determined by legCount slider/buttons!)
      const buildMechaLeg = (angleRad: number, index: number) => {
        const legAnchorGroup = new THREE.Group();
        legAnchorGroup.position.set(0, 1.3, 0);
        legAnchorGroup.name = "robot_leg_anchor_group";
        legAnchorGroup.userData = { index };

        // Calculate unit offset based on radial layout angles
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        // Rotates anchor outward
        legAnchorGroup.rotation.y = -angleRad;

        // Piston Joint 1
        const hipPistonBox = new THREE.BoxGeometry(0.2, 0.2, 0.4);
        hipPistonBox.translate(0, 0, 0.2);
        const hip = new THREE.Mesh(hipPistonBox, secondaryMat);
        hip.name = "robot_hip";
        legAnchorGroup.add(hip);

        // Leg Segment 1 (Knee mechanical hinge)
        const upperLegGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.8, 8);
        upperLegGeom.translate(0, -0.35, 0);
        const upperLeg = new THREE.Mesh(upperLegGeom, secondaryMat);
        upperLeg.position.set(0, 0, 0.4);
        upperLeg.name = "robot_upper_leg";
        
        // Bend based on controllers
        if (workflowStage === 'rigged') {
          upperLeg.rotation.x = 0.5 + interactiveRotation[0] * 0.3;
        } else {
          upperLeg.rotation.x = 0.5;
        }
        legAnchorGroup.add(upperLeg);

        // Leg Segment 2 (Ankle/Ground foot piston)
        const lowerLegGeom = new THREE.CylinderGeometry(0.05, 0.04, 0.9, 6);
        lowerLegGeom.translate(0, -0.45, 0);
        const lowerLeg = new THREE.Mesh(lowerLegGeom, secondaryMat);
        lowerLeg.position.set(0, -0.65, 0.7);
        lowerLeg.rotation.x = -0.9;
        lowerLeg.name = "robot_lower_leg";
        legAnchorGroup.add(lowerLeg);

        // Claw pad foot
        const clawPadGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 3);
        const claw = new THREE.Mesh(clawPadGeom, accentMat);
        claw.position.set(0, -1.3, 1.05);
        claw.rotation.y = Math.PI / 6;
        claw.name = "robot_claw_foot";
        legAnchorGroup.add(claw);

        return legAnchorGroup;
      };

      for (let i = 0; i < legCount; i++) {
        const angle = (2 * Math.PI / legCount) * i;
        robotGroup.add(buildMechaLeg(angle, i));
      }

      meshGroup.add(robotGroup);
    } else if (rigType === 'spider') {
      // Procedural Spider / Arachnid setup
      const spiderGroup = new THREE.Group();
      spiderGroup.name = "spider_group";

      // Cephalothorax (Combined Head and Thorax)
      const headThoraxGeom = new THREE.SphereGeometry(0.42, 16, 12);
      headThoraxGeom.scale(1, 0.8, 1.25); // Elongated in Z
      const cephalothorax = new THREE.Mesh(headThoraxGeom, primaryMat);
      cephalothorax.position.set(0, 1.3, 0.1);
      cephalothorax.castShadow = true;
      cephalothorax.name = "spider_cephalothorax";
      spiderGroup.add(cephalothorax);

      // Abdomen (Bulbous tail component)
      const abdomenScale = Math.max(0.6, tailSegments / 5);
      const abdomenGeom = new THREE.SphereGeometry(0.6 * abdomenScale, 16, 14);
      abdomenGeom.scale(1.0, 0.9, 1.5); // Bulbous and elongated
      const abdomen = new THREE.Mesh(abdomenGeom, primaryMat);
      // Connected behind cephalothorax and sloping slightly down/up
      abdomen.position.set(0, 1.4, -0.85 * abdomenScale);
      abdomen.castShadow = true;
      abdomen.name = "spider_abdomen";
      spiderGroup.add(abdomen);

      // Chelicerae / Fangs (Furious arachnid mouthparts)
      if (clawsToes) {
        const buildFang = (isLeft: boolean) => {
          const side = isLeft ? -1 : 1;
          const fangGroup = new THREE.Group();
          fangGroup.position.set(side * 0.14, 1.1, 0.65);
          fangGroup.name = isLeft ? "spider_fang_L" : "spider_fang_R";

          // Top thick segment of fang
          const upperFangGeom = new THREE.CylinderGeometry(0.06, 0.04, 0.18, 8);
          upperFangGeom.rotateX(Math.PI / 4);
          const upperFang = new THREE.Mesh(upperFangGeom, accentMat);
          upperFang.name = "spider_upper_fang";
          fangGroup.add(upperFang);

          // Pointy curved needle
          const needleGeom = new THREE.ConeGeometry(0.024, 0.16, 6);
          needleGeom.rotateX(Math.PI / 3);
          const needle = new THREE.Mesh(needleGeom, accentMat);
          needle.position.set(0, -0.08, 0.1);
          needle.name = "spider_fang_tip";
          fangGroup.add(needle);

          return fangGroup;
        };
        spiderGroup.add(buildFang(true));
        spiderGroup.add(buildFang(false));
      }

      // 8 Glowing Alien Spider Eyes (4 large central, 4 smaller peripheral)
      const eyeMat = new THREE.MeshBasicMaterial({
        color: viewportStyle === 'clay' ? 0x94a3b8 : (viewportStyle === 'neon' ? 0x06b6d4 : (new THREE.Color(materialSlots.accent.emissive).getHex())),
      });

      const eyeGeomLarge = new THREE.SphereGeometry(0.045, 8, 8);
      const eyeGeomSmall = new THREE.SphereGeometry(0.025, 8, 8);

      // Front cluster coordinates
      const eyeOffsets = [
        { g: eyeGeomLarge, pos: [-0.1, 1.48, 0.6] },  // Front Top L
        { g: eyeGeomLarge, pos: [0.1, 1.48, 0.6] },   // Front Top R
        { g: eyeGeomLarge, pos: [-0.22, 1.42, 0.55] }, // Front Middle L
        { g: eyeGeomLarge, pos: [0.22, 1.42, 0.55] },  // Front Middle R
        { g: eyeGeomSmall, pos: [-0.12, 1.32, 0.62] }, // Lower L
        { g: eyeGeomSmall, pos: [0.12, 1.32, 0.62] },  // Lower R
        { g: eyeGeomSmall, pos: [-0.28, 1.48, 0.48] }, // Side Upper L
        { g: eyeGeomSmall, pos: [0.28, 1.48, 0.48] },  // Side Upper R
      ];

      eyeOffsets.forEach((eyeSpec, index) => {
        const eyeMesh = new THREE.Mesh(eyeSpec.g, eyeMat);
        eyeMesh.position.set(eyeSpec.pos[0], eyeSpec.pos[1], eyeSpec.pos[2]);
        eyeMesh.name = `spider_eye_${index}`;
        spiderGroup.add(eyeMesh);
      });

      // Symmetric Biped-like distribute spider legs (from legCount)
      const legsPerSide = Math.ceil(legCount / 2);

      const buildSpiderLeg = (isLeft: boolean, index: number, total: number) => {
        const sideMult = isLeft ? -1 : 1;
        const legRoot = new THREE.Group();
        legRoot.name = "spider_leg_root";
        legRoot.userData = { isLeft, index };

        // Spread legs out along the body length from front to back
        const zOff = 0.35 - (index / Math.max(1, total - 1)) * 0.75;
        legRoot.position.set(sideMult * 0.34, 1.25, zOff);

        // Angle legs forward or backward depending on position to avoid crossing
        const indexRatio = index / Math.max(1, total - 1);
        const forwardAngle = (0.5 - indexRatio) * 0.7; // Front legs forward, back legs backward
        legRoot.rotation.y = (isLeft ? Math.PI : 0) + (sideMult * forwardAngle);

        // Segment 1: Coxa / Femur (Extends upward and outward)
        const femurGeom = new THREE.CylinderGeometry(0.05, 0.04, 0.65, 8);
        femurGeom.translate(0, 0.3, 0);
        const femur = new THREE.Mesh(femurGeom, secondaryMat);
        femur.rotation.z = -0.6; // slant upwards
        femur.name = "spider_femur";
        legRoot.add(femur);

        // Segment 2: Tibia (Extends downwards)
        const tibiaGroup = new THREE.Group();
        tibiaGroup.position.set(0.3, 0.55, 0);
        tibiaGroup.name = "spider_tibia_group";
        const tibiaGeom = new THREE.CylinderGeometry(0.04, 0.03, 0.75, 8);
        tibiaGeom.translate(0, -0.35, 0);
        const tibia = new THREE.Mesh(tibiaGeom, secondaryMat);
        tibia.rotation.z = 1.2; // slant downwards
        tibia.name = "spider_tibia";
        tibiaGroup.add(tibia);

        // Segment 3: Tarsus (Claw/Foot tip touching the ground)
        const tarsusGroup = new THREE.Group();
        tarsusGroup.position.set(0.3, -0.65, 0);
        tarsusGroup.name = "spider_tarsus_group";
        const tarsusGeom = new THREE.CylinderGeometry(0.025, 0.012, 0.6, 6);
        tarsusGeom.translate(0, -0.3, 0);
        const tarsus = new THREE.Mesh(tarsusGeom, accentMat);
        tarsus.rotation.z = -0.4; // steep slant to floor
        tarsus.name = "spider_tarsus";
        tarsusGroup.add(tarsus);

        tibiaGroup.add(tarsusGroup);
        legRoot.add(tibiaGroup);

        return legRoot;
      };

      // Add legs
      for (let j = 0; j < legsPerSide; j++) {
        spiderGroup.add(buildSpiderLeg(true, j, legsPerSide));
        spiderGroup.add(buildSpiderLeg(false, j, legsPerSide));
      }

      meshGroup.add(spiderGroup);

    } else if (rigType === 'tentacles') {
      // Procedural floating Eldritch Multi-Tentacle creature
      const krakenGroup = new THREE.Group();
      krakenGroup.name = "kraken_group";

      // Floating central core
      const coreGeom = new THREE.SphereGeometry(0.48, 18, 16);
      coreGeom.scale(1.2, 1.0, 1.0); // Slightly flat
      const coreMesh = new THREE.Mesh(coreGeom, primaryMat);
      coreMesh.position.set(0, 1.4, 0);
      coreMesh.castShadow = true;
      coreMesh.name = "kraken_core";
      krakenGroup.add(coreMesh);

      // Big cyclopean glowing eye at the front-center
      const eyeMat = new THREE.MeshBasicMaterial({
        color: viewportStyle === 'clay' ? 0x94a3b8 : (viewportStyle === 'neon' ? 0xed09ff : (new THREE.Color(materialSlots.accent.emissive).getHex())),
      });
      const eyeGeom = new THREE.SphereGeometry(0.18, 16, 16);
      const mainEye = new THREE.Mesh(eyeGeom, eyeMat);
      mainEye.position.set(0, 1.4, 0.42);
      mainEye.name = "kraken_eye";
      krakenGroup.add(mainEye);

      // Eye hood/rim curves
      const hoodGeom = new THREE.TorusGeometry(0.2, 0.05, 8, 24);
      const mainHood = new THREE.Mesh(hoodGeom, secondaryMat);
      mainHood.position.set(0, 1.4, 0.4);
      mainHood.name = "kraken_hood";
      krakenGroup.add(mainHood);

      // Small secondary observation sensors
      const subEyeGeom = new THREE.SphereGeometry(0.045, 8, 8);
      const subEyeOffset = [
        [-0.26, 1.7, 0.25],
        [0.26, 1.7, 0.25],
        [-0.32, 1.2, 0.3],
        [0.32, 1.2, 0.3],
      ];
      subEyeOffset.forEach((off, i) => {
        const eye = new THREE.Mesh(subEyeGeom, eyeMat);
        eye.position.set(off[0], off[1], off[2]);
        eye.name = `kraken_sub_eye_${i}`;
        krakenGroup.add(eye);
      });

      // Radially distributed snaking tentacles!
      const timeMs = Date.now();

      const buildTentacle = (angleRad: number, index: number) => {
        const tentacleRoot = new THREE.Group();
        tentacleRoot.name = `kraken_tentacle_root_${index}`;
        tentacleRoot.userData = { index };
        
        // Spawns from the underside of the floaty central body
        const spawnRadius = 0.32;
        tentacleRoot.position.set(
          Math.cos(angleRad) * spawnRadius,
          0.98,
          Math.sin(angleRad) * spawnRadius
        );

        // Face the tentacles outwards initially
        tentacleRoot.rotation.y = -angleRad - Math.PI / 2;

        let lastSegmentJoint: THREE.Group | THREE.Mesh = tentacleRoot;

        // Chain multiple segments to form a smooth organic spine
        const numSegs = tailEnabledSegments; // Segments user slider requested (4 - 15)
        for (let j = 0; j < numSegs; j++) {
          const segGroup = new THREE.Group();
          // Offset downwards
          segGroup.position.set(0, -0.16, 0);
          segGroup.name = "tentacle_segment_group";
          segGroup.userData = { isTentacle: true, index, depth: j };

          const factor = j / numSegs;
          const radiusTop = 0.075 * (1 - factor) + 0.015;
          const radiusBottom = 0.075 * (1 - (j + 1) / numSegs) + 0.015;

          const segGeom = new THREE.CylinderGeometry(radiusTop, radiusBottom, 0.18, 8);
          // Center cylinder mapping
          segGeom.translate(0, -0.09, 0);
          const segmentMesh = new THREE.Mesh(segGeom, secondaryMat);
          segmentMesh.castShadow = true;
          segmentMesh.name = "tentacle_segment_mesh";

          // Organic snaking motion simulation based on time clock sine equations!
          const wavePhase = timeMs * 0.0028 + index * 1.3 + j * 0.42;
          segmentMesh.rotation.x = Math.sin(wavePhase) * 0.16;
          segmentMesh.rotation.z = Math.cos(wavePhase * 0.8) * 0.12;

          segGroup.add(segmentMesh);

          // Add glowing bio-suckers!
          if (clawsToes && j % 2 === 0) {
            const suckerGeom = new THREE.SphereGeometry(radiusTop * 0.65, 6, 6);
            const suckerMat = new THREE.MeshBasicMaterial({
              color: viewportStyle === 'clay' ? 0x94a3b8 : 0x22c55e, // alien green bio glow
            });
            const sucker = new THREE.Mesh(suckerGeom, suckerMat);
            // Sicker sits on the inside/belly of the tentacle curving inwards
            sucker.position.set(0, -0.09, radiusTop * 1.1);
            sucker.name = "tentacle_sucker";
            segmentMesh.add(sucker);
          }

          lastSegmentJoint.add(segGroup);
          lastSegmentJoint = segGroup;
        }

        return tentacleRoot;
      };

      for (let k = 0; k < legCount; k++) {
        const radialAngle = (2 * Math.PI / legCount) * k;
        krakenGroup.add(buildTentacle(radialAngle, k));
      }

      meshGroup.add(krakenGroup);
    }

  }, [rigType, viewportStyle, activeMesh, legCount, tailSegments, clawsToes, interactiveRotation, workflowStage, materialSlots, wireframeMeshMode, loadedCustomMesh]);

  // 2.5 Hook to reactively tune scene lighting dynamically!
  useEffect(() => {
    if (!ambientLightRef.current || !mainLightRef.current || !secondaryLightRef.current || !rimLightRef.current) return;

    // Apply intensities direct parameters
    ambientLightRef.current.intensity = lightAmbientIntensity;
    mainLightRef.current.intensity = lightMainIntensity;

    if (lightPreset === 'sunset') {
      ambientLightRef.current.color.setHex(0xffedd5); // rich gold/warm amber
      mainLightRef.current.color.setHex(0xf97316);    // deep orange sun slant
      secondaryLightRef.current.color.setHex(0x7c3aed); // lavender fill light back
      rimLightRef.current.color.setHex(0xfef08a);    // golden rim flare
      rimLightRef.current.intensity = 1.6;
    } else if (lightPreset === 'midnight') {
      ambientLightRef.current.color.setHex(0x0f172a); // lunar dark slate
      mainLightRef.current.color.setHex(0x38bdf8);    // cyan moon rise
      secondaryLightRef.current.color.setHex(0x1e1b4b); // neon twilight
      rimLightRef.current.color.setHex(0xa5f3fc);    // electric ice rim light
      rimLightRef.current.intensity = 2.4;
    } else if (lightPreset === 'high_key') {
      ambientLightRef.current.color.setHex(0xffffff); // extreme full highkey workspace
      mainLightRef.current.color.setHex(0xffffff);
      secondaryLightRef.current.color.setHex(0xf8fafc);
      rimLightRef.current.color.setHex(0xffffff);
      rimLightRef.current.intensity = 2.0;
    } else { // 'neon' or standard
      ambientLightRef.current.color.setHex(0xffffff);
      mainLightRef.current.color.setHex(0xffffff);
      secondaryLightRef.current.color.setHex(0x06b6d4); // pristine cyan glow
      rimLightRef.current.color.setHex(0xff00ff);     // hot magenta back edge light
      rimLightRef.current.intensity = 1.0;
    }
  }, [lightAmbientIntensity, lightMainIntensity, lightPreset]);

  const tailEnabledSegments = tailEnabled ? tailSegments : 0;

  // 3. Render Skeleton Joints and Bones Overlay
  useEffect(() => {
    if (!sceneRef.current || !rigGroupRef.current) return;

    const rigGroup = rigGroupRef.current;
    while (rigGroup.children.length > 0) {
      rigGroup.remove(rigGroup.children[0]);
    }

    // Only render bones if skeleton is generated, rigged, or if we are in 'synced' alignment phase!
    if (workflowStage !== 'synced' && workflowStage !== 'skeleton' && workflowStage !== 'rigged') return;

    // Build skeletal geometry lines and interactive NURBS controllers
    // For every bone entry in skeletonNodes, trace line to parent if parent is found
    skeletonNodes.forEach((node) => {
      // Joint visual marker sphere
      const sphereGeom = new THREE.SphereGeometry(0.08 * jointSize, 12, 10);
      
      // Node color coding level based on boneColorCoding toggle
      let nodeColor = 0xffa500; // default orange
      if (boneColorCoding) {
        if (node.id.toLowerCase().includes('left')) {
          nodeColor = 0x06b6d4; // Cyan for Left side
        } else if (node.id.toLowerCase().includes('right')) {
          nodeColor = 0xec4899; // Pink for Right side
        } else {
          nodeColor = 0xeab308; // Yellow for Center spine/jaw/tail
        }
      }

      const isNodeSelected = selectedNodeId === node.id;
      if (isNodeSelected) {
        nodeColor = 0x22c55e; // highlighted green
      }

      const sphereMat = new THREE.MeshBasicMaterial({
        color: nodeColor,
        depthTest: !xrayMode, // XRay mode controls bone visibility through depth testing!
        transparent: true,
        opacity: 0.95,
      });

      const jointMesh = new THREE.Mesh(sphereGeom, sphereMat);
      jointMesh.position.set(node.position[0], node.position[1], node.position[2]);
      rigGroup.add(jointMesh);

      // 3.5 ADD SPACE AXIS TO EACH NODE TO ALLOW TO FIX THE LOCATION ON EACH SKIN
      // We will place beautiful native ArrowHelpers showing local X (Red), Y (Green), Z (Blue) axis vectors
      const spaceAxisLength = 0.28 * jointSize;
      const spaceHeadLength = 0.08 * jointSize;
      const spaceHeadWidth = 0.045 * jointSize;
      const originVec = new THREE.Vector3(node.position[0], node.position[1], node.position[2]);

      const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), originVec, spaceAxisLength, 0xef4444, spaceHeadLength, spaceHeadWidth);
      const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), originVec, spaceAxisLength, 0x22c55e, spaceHeadLength, spaceHeadWidth);
      const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), originVec, spaceAxisLength, 0x3b82f6, spaceHeadLength, spaceHeadWidth);

      // Handle transparent overlay Depth Testing with xrayMode
      if (arrowX.line.material) (arrowX.line.material as any).depthTest = !xrayMode;
      if (arrowX.cone.material) (arrowX.cone.material as any).depthTest = !xrayMode;
      if (arrowY.line.material) (arrowY.line.material as any).depthTest = !xrayMode;
      if (arrowY.cone.material) (arrowY.cone.material as any).depthTest = !xrayMode;
      if (arrowZ.line.material) (arrowZ.line.material as any).depthTest = !xrayMode;
      if (arrowZ.cone.material) (arrowZ.cone.material as any).depthTest = !xrayMode;

      rigGroup.add(arrowX);
      rigGroup.add(arrowY);
      rigGroup.add(arrowZ);

      // If this is the selected node, draw the beautiful 3D rotation circles around it!
      if (isNodeSelected) {
        const ringRadius = 0.32 * jointSize;
        const ringThick = 0.007 * jointSize;

        // X Ring (Red, parallel to YZ plane)
        const xRingGeom = new THREE.TorusGeometry(ringRadius, ringThick, 6, 32);
        xRingGeom.rotateY(Math.PI / 2);
        const xRingMat = new THREE.MeshBasicMaterial({ color: 0xef4444, depthTest: !xrayMode, transparent: true, opacity: 0.85 });
        const xRing = new THREE.Mesh(xRingGeom, xRingMat);
        xRing.position.copy(originVec);
        rigGroup.add(xRing);

        // Y Ring (Green, parallel to XZ plane)
        const yRingGeom = new THREE.TorusGeometry(ringRadius, ringThick, 6, 32);
        yRingGeom.rotateX(Math.PI / 2);
        const yRingMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, depthTest: !xrayMode, transparent: true, opacity: 0.85 });
        const yRing = new THREE.Mesh(yRingGeom, yRingMat);
        yRing.position.copy(originVec);
        rigGroup.add(yRing);

        // Z Ring (Blue, parallel to XY plane)
        const zRingGeom = new THREE.TorusGeometry(ringRadius, ringThick, 6, 32);
        const zRingMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, depthTest: !xrayMode, transparent: true, opacity: 0.85 });
        const zRing = new THREE.Mesh(zRingGeom, zRingMat);
        zRing.position.copy(originVec);
        rigGroup.add(zRing);
      }

      // Render Bone link: thick solid 3D octahedral bone if RIG_SYNCHRONIZATION (rigged state) is active, else thinner link line helper
      if (node.parent) {
        const parentNode = skeletonNodes.find((n) => n.id === node.parent);
        if (parentNode) {
          const pStart = new THREE.Vector3(parentNode.position[0], parentNode.position[1], parentNode.position[2]);
          const pEnd = new THREE.Vector3(node.position[0], node.position[1], node.position[2]);
          const direction = new THREE.Vector3().subVectors(pEnd, pStart);
          const distance = direction.length();

          if (distance > 0.001) {
            if (mayaBonesMode) {
              // --- AUTODESK MAYA BONES RIGGING STYLE ---
              // Classic Maya joint connections are tapered 4-sided pyramids (pointing parent -> child)
              // Base radius at parent is larger, tapering to a fine point at the child.
              const radiusBase = 0.045 * jointSize;
              const radiusTip = 0.004 * jointSize; // fine point at child joint
              
              // We construct a Cylinder representing the tapered bone connector
              const boneGeom = new THREE.CylinderGeometry(radiusTip, radiusBase, distance, 4, 1);
              // In Three.js, Cylinder is along Y. We translate it so the base is at Y=0 and the tip is at Y=distance
              boneGeom.translate(0, distance / 2, 0);

              // Color coding based on hierarchy / side (left/right)
              let boneColor = 0xeab308; // default gold-yellow
              const leftName = node.id.toLowerCase().includes('left') || node.parent.toLowerCase().includes('left');
              const rightName = node.id.toLowerCase().includes('right') || node.parent.toLowerCase().includes('right');

              if (boneColorCoding) {
                if (leftName) boneColor = 0x00f0ff; // Neon Teal/Cyan (Maya Left Side)
                else if (rightName) boneColor = 0xff00bb; // Neon Magenta/Pink (Maya Right Side)
                else boneColor = 0xffea00; // Neon Yellow/White for spine/center
              }

              // Selected node highlights bone green
              const isBoneConnectedSelected = selectedNodeId === node.id || selectedNodeId === node.parent;
              if (isBoneConnectedSelected) {
                boneColor = 0x39ff14; // Autodesk Maya's bright neon green selection highlight
              }

              // Semi-translucent material for that high-end CAD viewport look
              const boneMat = new THREE.MeshStandardMaterial({
                color: boneColor,
                roughness: 0.1,
                metalness: 0.8,
                transparent: true,
                opacity: 0.75,
                depthTest: !xrayMode,
                emissive: isBoneConnectedSelected ? 0x39ff14 : 0x000000,
                emissiveIntensity: isBoneConnectedSelected ? 0.45 : 0,
              });

              // Create a bright wireframe outline that draws over the solid bone
              const wireframeMat = new THREE.MeshBasicMaterial({
                color: isBoneConnectedSelected ? 0xffffff : boneColor,
                wireframe: true,
                transparent: true,
                opacity: 0.4,
                depthTest: !xrayMode
              });

              const boneGroup = new THREE.Group();
              const solidMesh = new THREE.Mesh(boneGeom, boneMat);
              const wireMesh = new THREE.Mesh(boneGeom, wireframeMat);
              
              boneGroup.add(solidMesh);
              boneGroup.add(wireMesh);
              
              boneGroup.position.copy(pStart);
              boneGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
              rigGroup.add(boneGroup);

            } else {
              // --- STANDARD / OTHER STYLE ---
              if (workflowStage === 'rigged') {
                const cone1Height = distance * 0.25;
                const cone1Geom = new THREE.ConeGeometry(0.045 * jointSize, cone1Height, 6);
                cone1Geom.translate(0, cone1Height / 2, 0);

                const cone2Height = distance * 0.75;
                const cone2Geom = new THREE.ConeGeometry(0.045 * jointSize, cone2Height, 6);
                cone2Geom.rotateX(Math.PI);
                cone2Geom.translate(0, cone1Height + cone2Height / 2, 0);

                const boneMat = new THREE.MeshStandardMaterial({
                  color: isNodeSelected ? 0x22c55e : (boneColorCoding ? 0x64748b : 0xeab308),
                  roughness: 0.35,
                  metalness: 0.25,
                  transparent: true,
                  opacity: 0.9,
                  depthTest: !xrayMode,
                  emissive: isNodeSelected ? 0x22c55e : 0x000000,
                  emissiveIntensity: isNodeSelected ? 0.35 : 0,
                });

                const boneGroup = new THREE.Group();
                boneGroup.add(new THREE.Mesh(cone1Geom, boneMat));
                boneGroup.add(new THREE.Mesh(cone2Geom, boneMat));
                boneGroup.position.copy(pStart);
                boneGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
                rigGroup.add(boneGroup);
              } else {
                const tubeGeom = new THREE.CylinderGeometry(0.015 * jointSize, 0.015 * jointSize, distance, 5);
                tubeGeom.translate(0, distance / 2, 0);

                const tubeMat = new THREE.MeshStandardMaterial({
                  color: isNodeSelected ? 0x22c55e : (boneColorCoding ? 0x64748b : 0xeab308),
                  roughness: 0.5,
                  metalness: 0.1,
                  transparent: true,
                  opacity: 0.65,
                  depthTest: !xrayMode,
                });

                const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
                tubeMesh.position.copy(pStart);
                tubeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
                rigGroup.add(tubeMesh);
              }
            }
          }
        }
      }

      // 4. Generate NURBS Controller rings if workflow stage is RIGGED!
      if (workflowStage === 'rigged') {
        const shouldHaveController = 
          node.id === 'Root/Hip' || node.id === 'Spine_01/Lower' || node.id === 'Neck_01' ||
          node.id.includes('Hand') || node.id.includes('Foot') || node.id.includes('Paw');

        if (shouldHaveController) {
          const circleGeom = new THREE.RingGeometry(0.24 * jointSize, 0.28 * jointSize, 16);
          circleGeom.rotateX(Math.PI / 2);
          const ringMat = new THREE.MeshBasicMaterial({
            color: isNodeSelected ? 0x22c55e : (node.id.includes('Left') ? 0x24ebd0 : 0xf90cf0),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
            depthTest: false,
          });
          const controllerRing = new THREE.Mesh(circleGeom, ringMat);
          controllerRing.position.set(node.position[0], node.position[1], node.position[2]);
          rigGroup.add(controllerRing);
        }
      }
    });

  }, [skeletonNodes, selectedNodeId, workflowStage, jointSize, xrayMode, boneColorCoding, mayaBonesMode]);

  // 5. Orbit control actions & mouse tracking
  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    // Selection raycasting simulation
    // If Select Q or Move W or Paint P tool is active, clicking on joints selects them directly!
    if (activeTool !== 'neural' && containerRef.current && cameraRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const clickY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Simple click-to-joint selection: calculate distance to each node projected in 3D
      let closestNode: RiggingNode | null = null;
      let minDistance = 0.4; // click range margin
      let selectedAxis: 'X' | 'Y' | 'Z' | 'screen' = 'screen';

      // 1. Raycast onto Arrow tips of the currently selected joint first
      if (selectedNodeId) {
        const activeNode = skeletonNodes.find((n) => n.id === selectedNodeId);
        if (activeNode) {
          const vNode = new THREE.Vector3(activeNode.position[0], activeNode.position[1], activeNode.position[2]);
          const spaceAxisLength = 0.5 * jointSize; // Longer gizmo selection target size
          
          const vX = vNode.clone().add(new THREE.Vector3(spaceAxisLength, 0, 0));
          const vY = vNode.clone().add(new THREE.Vector3(0, spaceAxisLength, 0));
          const vZ = vNode.clone().add(new THREE.Vector3(0, 0, spaceAxisLength));

          const screenNode = vNode.clone().project(cameraRef.current);
          const screenX = vX.clone().project(cameraRef.current);
          const screenY = vY.clone().project(cameraRef.current);
          const screenZ = vZ.clone().project(cameraRef.current);

          const dNode = Math.sqrt(Math.pow(clickX - screenNode.x, 2) + Math.pow(clickY - screenNode.y, 2));
          const dX = Math.sqrt(Math.pow(clickX - screenX.x, 2) + Math.pow(clickY - screenX.y, 2));
          const dY = Math.sqrt(Math.pow(clickX - screenY.x, 2) + Math.pow(clickY - screenY.y, 2));
          const dZ = Math.sqrt(Math.pow(clickX - screenZ.x, 2) + Math.pow(clickY - screenZ.y, 2));

          const handleTolerance = 0.14; // Comfortable, highly-responsive click target range
          
          let bestD = dNode;
          let bestAxis: 'X' | 'Y' | 'Z' | 'screen' = 'screen';

          if (dX < handleTolerance && dX < bestD) {
            bestD = dX;
            bestAxis = 'X';
          }
          if (dY < handleTolerance && dY < bestD) {
            bestD = dY;
            bestAxis = 'Y';
          }
          if (dZ < handleTolerance && dZ < bestD) {
            bestD = dZ;
            bestAxis = 'Z';
          }

          if (bestAxis !== 'screen') {
            closestNode = activeNode;
            selectedAxis = bestAxis;
            minDistance = bestD;
          }
        }
      }

      // 2. If no arrow tip handle was clicked, fall back to selecting any joint center sphere
      if (!closestNode) {
        skeletonNodes.forEach((node) => {
          const nodePos = new THREE.Vector3(node.position[0], node.position[1], node.position[2]);
          nodePos.project(cameraRef.current!);
          const dist = Math.sqrt(Math.pow(clickX - nodePos.x, 2) + Math.pow(clickY - nodePos.y, 2));
          if (dist < minDistance) {
            minDistance = dist;
            closestNode = node;
            selectedAxis = 'screen';
          }
        });
      }

      if (closestNode) {
        setSelectedNodeId((closestNode as RiggingNode).id);
        isDraggingJoint.current = true;
        activeDragAxisRef.current = selectedAxis;
      } else {
        // Did not click active joint
        setSelectedNodeId(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) {
      // Paint weight brush cursor coordinate updates
      if (activeTool === 'paint' && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setBrushPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      return;
    }

    const dx = e.clientX - prevMousePosRef.current.x;
    const dy = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    // Move Joint node position direct layout updating with perfect axis/camera alignment
    if (isDraggingJoint.current && selectedNodeId && (activeTool === 'move' || activeTool === 'select' || activeTool === 'rotate' || activeTool === 'scale')) {
      const activeNode = skeletonNodes.find((n) => n.id === selectedNodeId);
      if (activeNode && containerRef.current && cameraRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        
        // Convert screen mouse movement to normalized device Coordinate bounds [-2..2]
        const dxScreen = (dx / rect.width) * 2;
        const dyScreen = -(dy / rect.height) * 2;

        let newPos = [...activeNode.position] as [number, number, number];

        if (activeDragAxisRef.current === 'screen') {
          // Free movement in Camera projection space: moves in both horizontal and vertical of view plane
          const camera = cameraRef.current;
          
          // Get screen directions in world coordinates
          const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
          const upVec = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
          
          const scaleFactor = cameraRadiusRef.current * 0.5; // proportional to camera depth zoom
          const moveX = rightVec.x * dxScreen * scaleFactor + upVec.x * dyScreen * scaleFactor;
          const moveY = rightVec.y * dxScreen * scaleFactor + upVec.y * dyScreen * scaleFactor;
          const moveZ = rightVec.z * dxScreen * scaleFactor + upVec.z * dyScreen * scaleFactor;

          newPos[0] = parseFloat((activeNode.position[0] + moveX).toFixed(3));
          newPos[1] = parseFloat((activeNode.position[1] + moveY).toFixed(3));
          newPos[2] = parseFloat((activeNode.position[2] + moveZ).toFixed(3));
        } else {
          // Locked slider along specific axis: project mouse delta onto target axis screen projection!
          const camera = cameraRef.current;
          const vNode = new THREE.Vector3(activeNode.position[0], activeNode.position[1], activeNode.position[2]);
          
          let axisDir = new THREE.Vector3(1, 0, 0);
          let index = 0;
          if (activeDragAxisRef.current === 'Y') {
            axisDir.set(0, 1, 0);
            index = 1;
          } else if (activeDragAxisRef.current === 'Z') {
            axisDir.set(0, 0, 1);
            index = 2;
          }

          // Compute screen projection of 1 unit along world axis
          const vTip = vNode.clone().add(axisDir);
          const screenNode = vNode.clone().project(camera);
          const screenTip = vTip.project(camera);

          const axis2D = new THREE.Vector2(screenTip.x - screenNode.x, screenTip.y - screenNode.y);
          const lenSq = axis2D.lengthSq();

          if (lenSq > 0.0001) {
            const drag2D = new THREE.Vector2(dxScreen, dyScreen);
            const factor = drag2D.dot(axis2D) / lenSq;
            newPos[index] = parseFloat((activeNode.position[index] + factor).toFixed(3));
          }
        }

        // Apply boundary thresholds to keep node from flying away
        newPos[0] = Math.max(-5, Math.min(5, newPos[0]));
        newPos[1] = Math.max(0.01, Math.min(6, newPos[1]));
        newPos[2] = Math.max(-5, Math.min(5, newPos[2]));

        updateNodePosition(selectedNodeId, newPos);
      }
      return;
    }

    // Weight painting on drag
    if (activeTool === 'paint' && selectedNodeId) {
      setPaintWeights((prev) => ({
        ...prev,
        [selectedNodeId]: Math.min(1.0, (prev[selectedNodeId] || 0) + 0.04),
      }));
    }

    // Standard camera orbit rotation (with Alt key triggers or click-drag workspace defaults)
    const factor = 0.006;
    cameraRotationRef.current.phi = Math.max(
      0.1,
      Math.min(Math.PI - 0.1, cameraRotationRef.current.phi - dy * factor)
    );
    cameraRotationRef.current.theta -= dx * factor;
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    isDraggingJoint.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = 1.08;
    if (e.deltaY > 0) {
      cameraRadiusRef.current = Math.min(45, cameraRadiusRef.current * zoomFactor);
    } else if (e.deltaY < 0) {
      cameraRadiusRef.current = Math.max(3, cameraRadiusRef.current / zoomFactor);
    }
  };

  // Keyboard shortcut triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'q') setActiveTool('select');
      else if (key === 'w') setActiveTool('move');
      else if (key === 'e') setActiveTool('rotate');
      else if (key === 'r') setActiveTool('scale');
      else if (key === 'p') setActiveTool('paint');
      else if (key === 'n') setActiveTool('neural');
      else if (key === 'f') {
        // Reset camera focus
        cameraTargetRef.current.set(0, 1.4, 0);
        cameraRotationRef.current = { phi: Math.PI / 4, theta: Math.PI / 4 };
        cameraRadiusRef.current = 15;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool]);

  // Click handler to create random "neural joints" in viewport space
  const handleViewportClick = (e: React.MouseEvent) => {
    if (activeTool !== 'neural' || !containerRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Convert mouse coordinates into random local bone coords inside mesh
    const randomLocalX = parseFloat((x * 0.5).toFixed(2));
    const randomLocalY = parseFloat((1.3 + y * 0.5).toFixed(2));
    const randomLocalZ = parseFloat((Math.random() * 0.3 - 0.1).toFixed(2));

    const idSuffix = Math.floor(Math.random() * 100);
    const customJoint: RiggingNode = {
      id: `CustomNode_${idSuffix}`,
      name: `Custom Joint ${idSuffix}`,
      position: [randomLocalX, randomLocalY, randomLocalZ],
      parent: selectedNodeId || undefined,
    };

    addCustomNode(customJoint);
    setSelectedNodeId(customJoint.id);
  };

  const runAIGeometrySnapping = () => {
    setIsScanningGeometry(true);

    setTimeout(() => {
      // 1. Gather all vertices from the custom loaded mesh in world-space
      const vertices: THREE.Vector3[] = [];
      if (loadedCustomMesh) {
        loadedCustomMesh.updateMatrixWorld(true);
        loadedCustomMesh.traverse((child) => {
          if ((child as any).isMesh) {
            const mesh = child as THREE.Mesh;
            const geom = mesh.geometry;
            if (geom) {
              const positionAttr = geom.attributes.position;
              if (positionAttr) {
                const tempV = new THREE.Vector3();
                // Sample vertices to ensure real-time performance on complex high-poly models
                const sampleRate = Math.max(1, Math.floor(positionAttr.count / 800));
                for (let i = 0; i < positionAttr.count; i += sampleRate) {
                  tempV.fromBufferAttribute(positionAttr, i);
                  tempV.applyMatrix4(mesh.matrixWorld);
                  vertices.push(tempV.clone());
                }
              }
            }
          }
        });
      }

      // If we don't have enough vertices, fallback to generating/fitting standard procedural bounds
      let targetNodes: RiggingNode[] = [];
      const hasRealMesh = vertices.length > 20;

      // Determine height bounds
      let minY = 0.0, maxY = 2.2;
      let minX = -1.0, maxX = 1.0;
      let minZ = -1.0, maxZ = 1.0;

      if (hasRealMesh) {
        minY = Math.min(...vertices.map(v => v.y));
        maxY = Math.max(...vertices.map(v => v.y));
        minX = Math.min(...vertices.map(v => v.x));
        maxX = Math.max(...vertices.map(v => v.x));
        minZ = Math.min(...vertices.map(v => v.z));
        maxZ = Math.max(...vertices.map(v => v.z));
      }

      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const height = maxY - minY;
      const width = maxX - minX;
      const depth = maxZ - minZ;

      if (rigType === 'biped') {
        // --- 1. HI-FI BIPED GEOMETRY DETECTOR ---
        const spineX = centerX;
        const spineZ = centerZ;
        const chestY = minY + height * 0.72;
        const pelvisY = minY + height * 0.46;

        // Group left elements and right elements at feet levels (bottom 22% Y slice)
        const groundSlice = vertices.filter(v => v.y < minY + height * 0.22);
        const leftGround = groundSlice.filter(v => v.x < centerX - 0.05);
        const rightGround = groundSlice.filter(v => v.x > centerX + 0.05);

        let footL: THREE.Vector3;
        if (leftGround.length > 0) {
          const sum = leftGround.reduce((acc, v) => acc.add(v), new THREE.Vector3());
          footL = sum.divideScalar(leftGround.length);
          footL.y = minY + 0.12; 
        } else {
          footL = new THREE.Vector3(centerX - width * 0.22, minY + 0.12, centerZ + 0.1);
        }

        let footR: THREE.Vector3;
        if (rightGround.length > 0) {
          const sum = rightGround.reduce((acc, v) => acc.add(v), new THREE.Vector3());
          footR = sum.divideScalar(rightGround.length);
          footR.y = minY + 0.12;
        } else {
          footR = new THREE.Vector3(centerX + width * 0.22, minY + 0.12, centerZ + 0.1);
        }

        // Find hand extremes
        const armSlice = vertices.filter(v => v.y > minY + height * 0.45 && v.y < minY + height * 0.9);
        const farLeft = armSlice.filter(v => v.x < centerX - width * 0.2);
        const farRight = armSlice.filter(v => v.x > centerX + width * 0.2);

        let handLPos = new THREE.Vector3(centerX - width * 0.45, minY + height * 0.58, centerZ - 0.05);
        if (farLeft.length > 0) {
          let best = farLeft[0];
          farLeft.forEach(v => { if (v.x < best.x) best = v; });
          handLPos.copy(best);
        }

        let handRPos = new THREE.Vector3(centerX + width * 0.45, minY + height * 0.58, centerZ - 0.05);
        if (farRight.length > 0) {
          let best = farRight[0];
          farRight.forEach(v => { if (v.x > best.x) best = v; });
          handRPos.copy(best);
        }

        targetNodes = [
          { id: 'Root/Hip', name: 'Root Pelvis Joint', position: [spineX, pelvisY, spineZ] },
          { id: 'Spine_01/Lower', name: 'Lower Spine', position: [spineX, pelvisY + height * 0.12, spineZ + 0.01], parent: 'Root/Hip' },
          { id: 'Spine_02/Chest', name: 'Chest Joint', position: [spineX, chestY, spineZ - 0.01], parent: 'Spine_01/Lower' },
          { id: 'Neck_01', name: 'Neck Joint', position: [spineX, minY + height * 0.85, spineZ + 0.03], parent: 'Spine_02/Chest' },
          { id: 'Head', name: 'Head Tip', position: [spineX, maxY * 0.98, spineZ + 0.02], parent: 'Neck_01' },
          
          // Arm Left
          { id: 'Left_Clavicle', name: 'L Clavicle', position: [spineX - width * 0.12, chestY + 0.06, spineZ + 0.05], parent: 'Spine_02/Chest' },
          { id: 'Left_Shoulder', name: 'L Shoulder', position: [spineX - width * 0.22, chestY, spineZ], parent: 'Left_Clavicle' },
          { id: 'Left_Elbow', name: 'L Elbow', position: [parseFloat(((spineX - width * 0.22 + handLPos.x) / 2).toFixed(2)), parseFloat(((chestY + handLPos.y) / 2 - 0.1).toFixed(2)), parseFloat(((spineZ + handLPos.z) / 2 - 0.08).toFixed(2))], parent: 'Left_Shoulder' },
          { id: 'Left_Hand', name: 'L Wrist Hand', position: [parseFloat(handLPos.x.toFixed(2)), parseFloat(handLPos.y.toFixed(2)), parseFloat(handLPos.z.toFixed(2))], parent: 'Left_Elbow' },

          // Arm Right
          { id: 'Right_Clavicle', name: 'R Clavicle', position: [spineX + width * 0.12, chestY + 0.06, spineZ + 0.05], parent: 'Spine_02/Chest' },
          { id: 'Right_Shoulder', name: 'R Shoulder', position: [spineX + width * 0.22, chestY, spineZ], parent: 'Right_Clavicle' },
          { id: 'Right_Elbow', name: 'R Elbow', position: [parseFloat(((spineX + width * 0.22 + handRPos.x) / 2).toFixed(2)), parseFloat(((chestY + handRPos.y) / 2 - 0.1).toFixed(2)), parseFloat(((spineZ + handRPos.z) / 2 - 0.08).toFixed(2))], parent: 'Right_Shoulder' },
          { id: 'Right_Hand', name: 'R Wrist Hand', position: [parseFloat(handRPos.x.toFixed(2)), parseFloat(handRPos.y.toFixed(2)), parseFloat(handRPos.z.toFixed(2))], parent: 'Right_Elbow' },

          // Leg Left
          { id: 'Left_Hip', name: 'L Hip Joint', position: [spineX - width * 0.16, pelvisY, spineZ], parent: 'Root/Hip' },
          { id: 'Left_Knee', name: 'L Knee Joint', position: [spineX - width * 0.16, parseFloat(((pelvisY + footL.y) / 2 + 0.08).toFixed(2)), parseFloat(((spineZ + footL.z) / 2 + 0.06).toFixed(2))], parent: 'Left_Hip' },
          { id: 'Left_Foot', name: 'L Foot Ankle', position: [parseFloat(footL.x.toFixed(2)), parseFloat(footL.y.toFixed(2)), parseFloat(footL.z.toFixed(2))], parent: 'Left_Knee' },

          // Leg Right
          { id: 'Right_Hip', name: 'R Hip Joint', position: [spineX + width * 0.16, pelvisY, spineZ], parent: 'Root/Hip' },
          { id: 'Right_Knee', name: 'R Knee Joint', position: [spineX + width * 0.16, parseFloat(((pelvisY + footR.y) / 2 + 0.08).toFixed(2)), parseFloat(((spineZ + footR.z) / 2 + 0.06).toFixed(2))], parent: 'Right_Hip' },
          { id: 'Right_Foot', name: 'R Foot Ankle', position: [parseFloat(footR.x.toFixed(2)), parseFloat(footR.y.toFixed(2)), parseFloat(footR.z.toFixed(2))], parent: 'Right_Knee' },
        ];

      } else if (rigType === 'quadruped') {
        // --- 2. QUADRUPED GEOMETRY DETECTOR ---
        const spineY = minY + height * 0.62;
        const lowGroundSlice = vertices.filter(v => v.y < minY + height * 0.25);
        
        const qFL = lowGroundSlice.filter(v => v.x < centerX - 0.05 && v.z > centerZ + 0.05);
        const qFR = lowGroundSlice.filter(v => v.x > centerX + 0.05 && v.z > centerZ + 0.05);
        const qRL = lowGroundSlice.filter(v => v.x < centerX - 0.05 && v.z < centerZ - 0.05);
        const qRR = lowGroundSlice.filter(v => v.x > centerX + 0.05 && v.z < centerZ - 0.05);

        const getCentroidOrFallback = (points: THREE.Vector3[], fallbackX: number, fallbackZ: number) => {
          if (points.length > 0) {
            const sum = points.reduce((acc, v) => acc.add(v), new THREE.Vector3());
            const centroid = sum.divideScalar(points.length);
            centroid.y = minY + 0.12;
            return centroid;
          }
          return new THREE.Vector3(fallbackX, minY + 0.12, fallbackZ);
        };

        const pawFL = getCentroidOrFallback(qFL, centerX - width * 0.25, centerZ + depth * 0.35);
        const pawFR = getCentroidOrFallback(qFR, centerX + width * 0.25, centerZ + depth * 0.35);
        const pawRL = getCentroidOrFallback(qRL, centerX - width * 0.24, centerZ - depth * 0.35);
        const pawRR = getCentroidOrFallback(qRR, centerX + width * 0.24, centerZ - depth * 0.35);

        targetNodes = [
          { id: 'Root/Hip', name: 'Animal Pelvis', position: [centerX, parseFloat((spineY - 0.05).toFixed(2)), parseFloat((centerZ - depth * 0.3).toFixed(2))] },
          { id: 'Spine_01', name: 'Spine Middle', position: [centerX, parseFloat(spineY.toFixed(2)), parseFloat(centerZ.toFixed(2))], parent: 'Root/Hip' },
          { id: 'Spine_02', name: 'Spine Chest', position: [centerX, parseFloat((spineY + 0.02).toFixed(2)), parseFloat((centerZ + depth * 0.28).toFixed(2))], parent: 'Spine_01' },
          { id: 'Neck_01', name: 'Neck Joint', position: [centerX, parseFloat((spineY + height * 0.15).toFixed(2)), parseFloat((centerZ + depth * 0.4).toFixed(2))], parent: 'Spine_02' },
          { id: 'Head', name: 'Head Node', position: [centerX, parseFloat((spineY + height * 0.34).toFixed(2)), parseFloat((centerZ + depth * 0.52).toFixed(2))], parent: 'Neck_01' },

          // Front-Left
          { id: 'FrontLeft_Shoulder', name: 'Front Left Shoulder', position: [parseFloat((pawFL.x * 0.8).toFixed(2)), parseFloat((spineY - 0.08).toFixed(2)), parseFloat(pawFL.z.toFixed(2))], parent: 'Spine_02' },
          { id: 'FrontLeft_Paw', name: 'Front Left Paw', position: [parseFloat(pawFL.x.toFixed(2)), parseFloat(pawFL.y.toFixed(2)), parseFloat(pawFL.z.toFixed(2))], parent: 'FrontLeft_Shoulder' },

          // Front-Right
          { id: 'FrontRight_Shoulder', name: 'Front Right Shoulder', position: [parseFloat((pawFR.x * 0.8).toFixed(2)), parseFloat((spineY - 0.08).toFixed(2)), parseFloat(pawFR.z.toFixed(2))], parent: 'Spine_02' },
          { id: 'FrontRight_Paw', name: 'Front Right Paw', position: [parseFloat(pawFR.x.toFixed(2)), parseFloat(pawFR.y.toFixed(2)), parseFloat(pawFR.z.toFixed(2))], parent: 'FrontRight_Shoulder' },

          // Rear-Left
          { id: 'RearLeft_Leg', name: 'Rear Left Leg Hip', position: [parseFloat((pawRL.x * 0.85).toFixed(2)), parseFloat((spineY - 0.1).toFixed(2)), parseFloat(pawRL.z.toFixed(2))], parent: 'Root/Hip' },
          { id: 'RearLeft_Paw', name: 'Rear Left Paw', position: [parseFloat(pawRL.x.toFixed(2)), parseFloat(pawRL.y.toFixed(2)), parseFloat(pawRL.z.toFixed(2))], parent: 'RearLeft_Leg' },

          // Rear-Right
          { id: 'RearRight_Leg', name: 'Rear Right Leg Hip', position: [parseFloat((pawRR.x * 0.85).toFixed(2)), parseFloat((spineY - 0.1).toFixed(2)), parseFloat(pawRR.z.toFixed(2))], parent: 'Root/Hip' },
          { id: 'RearRight_Paw', name: 'Rear Right Paw', position: [parseFloat(pawRR.x.toFixed(2)), parseFloat(pawRR.y.toFixed(2)), parseFloat(pawRR.z.toFixed(2))], parent: 'RearRight_Leg' },

          // Tail
          { id: 'Tail_01', name: 'Tail Start', position: [centerX, parseFloat((spineY + 0.12).toFixed(2)), parseFloat((centerZ - depth * 0.42).toFixed(2))], parent: 'Root/Hip' },
          { id: 'Tail_02', name: 'Tail Link 2', position: [centerX, parseFloat((spineY + 0.24).toFixed(2)), parseFloat((centerZ - depth * 0.55).toFixed(2))], parent: 'Tail_01' },
        ];

      } else if (rigType === 'spider' || rigType === 'custom') {
        // --- 3. SPIDER / CUSTOM BEAST GEOMETRY DETECTOR ---
        const bodyCenterY = minY + height * 0.52;
        targetNodes = [
          { id: 'Cephalothorax', name: 'Cephalothorax Center', position: [centerX, parseFloat(bodyCenterY.toFixed(2)), centerZ] },
          { id: 'Abdomen', name: 'Abdomen Root', position: [centerX, parseFloat((bodyCenterY + height * 0.08).toFixed(2)), parseFloat((centerZ - depth * 0.35).toFixed(2))], parent: 'Cephalothorax' },
        ];

        const legsPerSide = Math.ceil(legCount / 2);
        const lowSpiderSlice = vertices.filter(v => v.y < minY + height * 0.35);

        const leftV = lowSpiderSlice.filter(v => v.x < centerX - 0.05);
        leftV.sort((a, b) => b.z - a.z); 

        const rightV = lowSpiderSlice.filter(v => v.x > centerX + 0.05);
        rightV.sort((a, b) => b.z - a.z);

        const getSliceCentroid = (slicePts: THREE.Vector3[], idx: number, left: boolean) => {
          if (slicePts.length > 5) {
            const chunkSize = Math.floor(slicePts.length / legsPerSide);
            const start = idx * chunkSize;
            const end = start + chunkSize;
            const chunk = slicePts.slice(start, end);
            
            let extremePt = chunk[0] || new THREE.Vector3();
            chunk.forEach(pt => {
              if (left) {
                if (pt.x < extremePt.x) extremePt = pt;
              } else {
                if (pt.x > extremePt.x) extremePt = pt;
              }
            });
            const exX = parseFloat(extremePt.x.toFixed(2));
            const exY = parseFloat((minY + 0.08).toFixed(2));
            const exZ = parseFloat(extremePt.z.toFixed(2));
            return new THREE.Vector3(exX, exY, exZ);
          }
          const angleFactor = (idx / Math.max(1, legsPerSide - 1)) * 0.8 - 0.4; 
          const xOffset = left ? -width * 0.48 : width * 0.48;
          const angX = parseFloat((centerX + xOffset).toFixed(2));
          const angY = parseFloat((minY + 0.08).toFixed(2));
          const angZ = parseFloat((centerZ + angleFactor * depth).toFixed(2));
          return new THREE.Vector3(angX, angY, angZ);
        };

        // Inject Left Legs Chain
        for (let i = 0; i < legsPerSide; i++) {
          const legIdx = i + 1;
          const tip = getSliceCentroid(leftV, i, true);
          const parentSpine = 'Cephalothorax';

          targetNodes.push({
            id: `L_Leg_${legIdx}_Hip`,
            name: `Left Leg ${legIdx} Hip`,
            position: [parseFloat((centerX - 0.15).toFixed(2)), parseFloat(bodyCenterY.toFixed(2)), parseFloat(tip.z.toFixed(2))],
            parent: parentSpine,
          });
          targetNodes.push({
            id: `L_Leg_${legIdx}_Knee`,
            name: `Left Leg ${legIdx} Knee`,
            position: [parseFloat((tip.x * 0.65).toFixed(2)), parseFloat((bodyCenterY + height * 0.18).toFixed(2)), parseFloat((tip.z + (leftV.length > 0 ? 0.02 : -0.05)).toFixed(2))],
            parent: `L_Leg_${legIdx}_Hip`,
          });
          targetNodes.push({
            id: `L_Leg_${legIdx}_Foot`,
            name: `Left Leg ${legIdx} Foot`,
            position: [parseFloat(tip.x.toFixed(2)), parseFloat(tip.y.toFixed(2)), parseFloat(tip.z.toFixed(2))],
            parent: `L_Leg_${legIdx}_Knee`,
          });
        }

        // Inject Right Legs Chain
        for (let i = 0; i < legsPerSide; i++) {
          const legIdx = i + 1;
          const tip = getSliceCentroid(rightV, i, false);
          const parentSpine = 'Cephalothorax';

          targetNodes.push({
            id: `R_Leg_${legIdx}_Hip`,
            name: `Right Leg ${legIdx} Hip`,
            position: [parseFloat((centerX + 0.15).toFixed(2)), parseFloat(bodyCenterY.toFixed(2)), parseFloat(tip.z.toFixed(2))],
            parent: parentSpine,
          });
          targetNodes.push({
            id: `R_Leg_${legIdx}_Knee`,
            name: `Right Leg ${legIdx} Knee`,
            position: [parseFloat((tip.x * 0.65).toFixed(2)), parseFloat((bodyCenterY + height * 0.18).toFixed(2)), parseFloat((tip.z + (rightV.length > 0 ? -0.02 : 0.05)).toFixed(2))],
            parent: `R_Leg_${legIdx}_Hip`,
          });
          targetNodes.push({
            id: `R_Leg_${legIdx}_Foot`,
            name: `Right Leg ${legIdx} Foot`,
            position: [parseFloat(tip.x.toFixed(2)), parseFloat(tip.y.toFixed(2)), parseFloat(tip.z.toFixed(2))],
            parent: `R_Leg_${legIdx}_Knee`,
          });
        }
      } else if (rigType === 'tentacles') {
        const coreY = minY + height * 0.55;
        targetNodes = [
          { id: 'EldritchCore', name: 'Core Nucleus', position: [centerX, parseFloat(coreY.toFixed(2)), centerZ] },
        ];

        for (let i = 0; i < legCount; i++) {
          const angle = (2 * Math.PI / legCount) * i;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          
          const endX = centerX + cos * width * 0.42;
          const endZ = centerZ + sin * depth * 0.42;

          targetNodes.push({
            id: `Tentacle_${i + 1}_Base`,
            name: `Tentacle ${i + 1} Base`,
            position: [parseFloat((centerX + cos * 0.15).toFixed(2)), parseFloat((coreY - 0.1).toFixed(2)), parseFloat((centerZ + sin * 0.15).toFixed(2))],
            parent: 'EldritchCore',
          });
          targetNodes.push({
            id: `Tentacle_${i + 1}_Mid`,
            name: `Tentacle ${i + 1} Mid-Link`,
            position: [parseFloat(((centerX + cos * 0.15 + endX) / 2).toFixed(2)), parseFloat((coreY * 0.48).toFixed(2)), parseFloat(((centerZ + sin * 0.15 + endZ) / 2).toFixed(2))],
            parent: `Tentacle_${i + 1}_Base`,
          });
          targetNodes.push({
            id: `Tentacle_${i + 1}_Tip`,
            name: `Tentacle ${i + 1} Tip`,
            position: [parseFloat(endX.toFixed(2)), parseFloat((minY + 0.1).toFixed(2)), parseFloat(endZ.toFixed(2))],
            parent: `Tentacle_${i + 1}_Mid`,
          });
        }
      } else {
        const coreY = minY + height * 0.55;
        targetNodes = [
          { id: 'CoreRoot', name: 'Chassis Central Body', position: [centerX, parseFloat(coreY.toFixed(2)), centerZ] },
        ];

        for (let i = 0; i < legCount; i++) {
          const angle = (2 * Math.PI / legCount) * i;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          
          targetNodes.push({
            id: `Leg_${i + 1}_Hip`,
            name: `Leg ${i + 1} Mechanical Hip`,
            position: [parseFloat((centerX + cos * width * 0.2).toFixed(2)), parseFloat((coreY - 0.05).toFixed(2)), parseFloat((centerZ + sin * depth * 0.2).toFixed(2))],
            parent: 'CoreRoot'
          });

          targetNodes.push({
            id: `Leg_${i + 1}_Foot`,
            name: `Leg ${i + 1} Foot Pad`,
            position: [parseFloat((centerX + cos * width * 0.4).toFixed(2)), parseFloat((minY + 0.1).toFixed(2)), parseFloat((centerZ + sin * depth * 0.4).toFixed(2))],
            parent: `Leg_${i + 1}_Hip`
          });
        }
      }

      setSkeletonNodes(targetNodes);
      setWorkflowStage('synced');
      setIsScanningGeometry(false);

      alert(
        language === 'jp'
          ? "【🧠 AI形状解析】メッシュオブジェクトの3Dトポロジー境界を自動検出！ボーン関節を関節肉厚の空間ボリューム中心へと完全フィットさせました。"
          : "【🧠 AI Auto-Rig Fitting】Scanned actual 3D mesh boundary shells instantly! Automatically snugged and centered joint coordinates inside computed 3D volume components."
      );
    }, 1800);
  };

  // Fine tune coordinate adjusting sliders
  const activeSelectedNode = skeletonNodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0f1115] overflow-hidden select-none relative">
      {/* Viewport bar options */}
      <div className="bg-[#121318] border-b border-[#252833] flex items-center justify-between px-3 py-1.5 text-xs text-gray-400 font-sans">
        <div className="flex items-center space-x-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-[11px] uppercase tracking-wider font-mono text-gray-300">
            Viewport View modes
          </span>
          <div className="flex items-center bg-[#171a22] border border-[#262c3a] rounded p-0.5 ml-2">
            {[
              { id: 'persp', label: t.vpPerspective },
              { id: 'front', label: t.vpFront },
              { id: 'side', label: t.vpSide },
              { id: 'top', label: t.vpTop }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveCamView(view.id as any)}
                className={`cursor-pointer px-2 py-0.5 rounded text-[10px] uppercase font-bold transition ${
                  activeCamView === view.id
                    ? 'bg-[#2a3043] text-cyan-300 border-l border-cyan-400'
                    : 'hover:text-white'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center space-x-3 text-[11.5px]">
          <label className="flex items-center space-x-1 px-1.5 cursor-pointer text-cyan-400" title="Toggle wireframe rendering mode">
            <input
              type="checkbox"
              checked={wireframeMeshMode}
              onChange={(e) => setWireframeMeshMode(e.target.checked)}
              className="rounded bg-[#121318] accent-cyan-500"
            />
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-[10.5px]">{language === 'jp' ? "ワイヤーフレーム" : "Wireframe Mode"}</span>
          </label>

          <div className="h-4 w-[1px] bg-gray-800" />

          {/* Bilateral Joint Symmetry Toggle Action */}
          <label className={`flex items-center space-x-1 px-1.5 cursor-pointer transition rounded ${symmetryEnabled ? 'text-emerald-400 font-extrabold' : 'text-gray-500 hover:text-gray-300'}`} title="Toggle Bilateral Joint Symmetry Matching Mode">
            <input
              type="checkbox"
              checked={symmetryEnabled}
              onChange={(e) => setSymmetryEnabled(e.target.checked)}
              className="rounded bg-[#121318] accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
            />
            <Radio className="w-3.5 h-3.5" />
            <span className="text-[10.5px]">{language === 'jp' ? "対称同期" : "Symmetry Match"}</span>
            <span className="text-[8px] bg-emerald-500/15 text-emerald-400 font-mono px-1 py-0.2 rounded font-black ml-0.5">
              {symmetryEnabled ? "ON" : "OFF"}
            </span>
          </label>

          <div className="h-4 w-[1px] bg-gray-800" />

          {/* Autodesk Maya Bones Rigging Toggle Action */}
          <label className={`flex items-center space-x-1 px-1.5 cursor-pointer transition rounded ${mayaBonesMode ? 'text-amber-400 font-extrabold font-sans' : 'text-gray-500 hover:text-gray-300'}`} title="Toggle Autodesk Maya tapered pyramidal bone links">
            <input
              type="checkbox"
              checked={mayaBonesMode}
              onChange={(e) => setMayaBonesMode(e.target.checked)}
              className="rounded bg-[#121318] accent-amber-500 w-3.5 h-3.5 cursor-pointer"
            />
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[10.5px]">{language === 'jp' ? "Mayaボーン表示" : "Maya Bones View"}</span>
            <span className="text-[8px] bg-amber-500/15 text-amber-400 font-mono px-1 py-0.2 rounded font-black ml-0.5">
              {mayaBonesMode ? "MAYA" : "OFF"}
            </span>
          </label>

          <div className="h-4 w-[1px] bg-gray-800" />

          <label className="flex items-center space-x-1 px-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => {
                setShowGrid(e.target.checked);
                if (gridHelperRef.current) gridHelperRef.current.visible = e.target.checked;
              }}
              className="rounded bg-[#121318]"
            />
            <Grid className="w-3.5 h-3.5" />
            <span className="text-gray-450 text-[10.5px]">Grid</span>
          </label>

          <div className="h-4 w-[1px] bg-gray-800" />

          <button
            onClick={() => {
              cameraTargetRef.current.set(0, 1.4, 0);
              cameraRadiusRef.current = 15;
              cameraRotationRef.current = { phi: Math.PI / 4, theta: Math.PI / 4 };
            }}
            className="cursor-pointer flex items-center gap-1.5 hover:text-white transition py-0.5 text-[10.5px] font-mono font-semibold"
            title="Focus camera (Hotkey F)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>F_ALIGN</span>
          </button>

          <div className="h-4 w-[1px] bg-gray-800" />

          <button
            onClick={() => {
              cameraRadiusRef.current = Math.max(3, cameraRadiusRef.current / 1.15);
            }}
            className="cursor-pointer flex items-center gap-1 hover:text-white transition py-0.5 text-[10.5px] font-mono font-semibold"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
            <span>ZOOM_IN</span>
          </button>

          <div className="h-4 w-[1px] bg-gray-800" />

          <button
            onClick={() => {
              cameraRadiusRef.current = Math.min(45, cameraRadiusRef.current * 1.15);
            }}
            className="cursor-pointer flex items-center gap-1 hover:text-white transition py-0.5 text-[10.5px] font-mono font-semibold"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5 text-cyan-400" />
            <span>ZOOM_OUT</span>
          </button>
        </div>
      </div>

      {/* Main 3D Interactive Rendering panel */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleViewportClick}
        className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden min-h-0"
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block absolute top-0 left-0"
        />

        {/* Live Active Translation Axis HUD Overlay */}
        {isDraggingJoint.current && selectedNodeId && (
          <div className="absolute top-4 right-4 bg-[#0d0f16]/90 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-[10px] font-mono shadow-2xl z-30 flex items-center space-x-2 backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${
              activeDragAxisRef.current === 'X' ? 'bg-red-550 shadow-[0_0_8px_#ef4444]' :
              activeDragAxisRef.current === 'Y' ? 'bg-green-550 shadow-[0_0_8px_#10b981]' :
              activeDragAxisRef.current === 'Z' ? 'bg-blue-550 shadow-[0_0_8px_#3b82f6]' : 'bg-emerald-450 animate-pulse'
            }`} />
            <div>
              <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider">
                {language === 'jp' ? "ドラッグ拘束軸" : "Locked Axis"}
              </p>
              <p className="text-zinc-200 font-extrabold text-[10.5px]">
                {activeDragAxisRef.current === 'X' ? (language === 'jp' ? "左右 X軸 スライド" : "X-Axis Only (Red Arrow)") :
                 activeDragAxisRef.current === 'Y' ? (language === 'jp' ? "上下 Y軸 スライド" : "Y-Axis Only (Green Arrow)") :
                 activeDragAxisRef.current === 'Z' ? (language === 'jp' ? "前後 Z軸 スライド" : "Z-Axis Only (Blue Arrow)") :
                 (language === 'jp' ? "カメラ視点 画面平行移動" : "Free Travel / Camera Viewplane")}
              </p>
            </div>
          </div>
        )}

        {/* Loading / Error States Overlays */}
        {isLoadingCustom && (
          <div className="absolute inset-0 bg-[#07070a]/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center pointer-events-none select-none">
            <div className="p-6 rounded-xl border border-cyan-500/30 bg-[#0e1017]/95 shadow-2xl flex flex-col items-center space-y-4 max-w-sm text-center">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10 border-t-cyan-400 animate-spin" />
                <Box className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white tracking-wide">
                  {language === 'jp' ? "3Dメッシュを読み込み中..." : "Loading Custom 3D Mesh..."}
                </h4>
                <p className="text-[11px] text-cyan-400 mt-1 font-mono font-medium">
                  {activeMesh ? activeMesh.name : ''}
                </p>
                {loadingProgress > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    {loadingProgress}%
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {loadingError && (
          <div className="absolute bottom-4 right-4 bg-rose-950/85 border border-rose-500/50 rounded-xl p-4 shadow-xl z-30 max-w-xs backdrop-blur-md">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                  {language === 'jp' ? "インポートエラー" : "Import Error"}
                </h5>
                <p className="text-xs text-rose-100 mt-1 leading-relaxed">
                  {loadingError}
                </p>
                <p className="text-[10px] text-rose-400 mt-2 font-mono leading-tight">
                  {language === 'jp' ? "※ OBJ, GLTF, GLB、または標準的なFBX形式を確認してください。" : "Verify file path is standard binary/ASCII OBJ, GLTF, GLB, or FBX."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI AUTO-RIG MESH GEOMETRY DETECTION DASHBOARD BUTTON */}
        <div className="absolute top-3 right-3 z-30 flex flex-col items-end space-y-2">
          <button
            onClick={runAIGeometrySnapping}
            disabled={isScanningGeometry}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl border font-sans font-semibold text-xs transition duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10 active:scale-95 ${
              isScanningGeometry 
                ? 'bg-[#141a29]/85 border-cyan-500/30 text-cyan-400 cursor-not-allowed animate-pulse'
                : 'bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-600 border-cyan-400/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isScanningGeometry ? 'animate-spin' : 'animate-bounce'}`} />
            <div className="text-left">
              <p className="font-extrabold tracking-wide uppercase text-[10.5px]">
                {language === 'jp' ? "🧠 AI骨格自動吸着" : "🧠 AI Auto-Rig Geometry"}
              </p>
              <p className="text-[8.5px] opacity-85 font-mono">
                {language === 'jp' ? "3D形状検出 ＆ ボーン調整" : "Detect 3D Mesh & Match Joints"}
              </p>
            </div>
          </button>
        </div>

        {/* Glowing 3D Scanner overlay when analyzing */}
        {isScanningGeometry && (
          <div className="absolute inset-0 bg-cyan-950/25 pointer-events-none z-35 flex flex-col justify-between overflow-hidden rounded-lg">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#06b6d4,0_0_40px_#06b6d4] animate-scanline" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px]">
              <div className="bg-[#090b11]/95 border border-cyan-500/50 p-4 rounded-xl shadow-[0_0_35px_rgba(6,182,212,0.25)] flex items-center space-x-3.5 max-w-sm text-xs animate-[pulse_1.5s_infinite]">
                <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                  <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                </div>
                <div>
                  <p className="font-extrabold text-cyan-300 font-sans tracking-wide text-[12px] uppercase">
                    {language === 'jp' ? "AI 3Dメッシュ形状解析中..." : "AI Calculating 3D Volumetric Mesh..."}
                  </p>
                  <p className="text-zinc-400 font-mono text-[10px] mt-0.5 leading-snug">
                    {language === 'jp' ? "骨格ジョイントをメッシュ肉厚の最適なボリューム中心へ自動吸着しています。" : "Snapping skeleton joint vectors exactly inside original 3D surface shells."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vertical Toolbar Panel Overlay (Left Side) */}
        <div className="absolute left-3 top-3 bg-[#11131a]/95 border border-[#282d3f] rounded-lg p-1.5 flex flex-col space-y-1.5 shadow-2xl z-20 backdrop-blur-md">
          {[
            { id: 'select', label: t.toolSelect, icon: '🖲', desc: "Q" },
            { id: 'move', label: t.toolMove, icon: '✥', desc: "W" },
            { id: 'rotate', label: t.toolRotate, icon: '⤷', desc: "E" },
            { id: 'scale', label: t.toolScale, icon: '⤨', desc: "R" },
            { id: 'paint', label: t.toolPaint, icon: '🖌', desc: "P" },
            { id: 'neural', label: t.toolNeural, icon: '🧠', desc: "N" },
          ].map((tool) => {
            const isToolActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as ToolbarTool)}
                className={`cursor-pointer w-10 h-10 rounded-lg flex flex-col items-center justify-center transition border ${
                  isToolActive
                    ? 'bg-cyan-500 border-cyan-300 text-gray-950 font-extrabold shadow-lg shadow-cyan-500/15'
                    : 'bg-[#181a24] border-[#252837] text-gray-400 hover:text-white hover:bg-[#202334] hover:border-[#383c52]'
                }`}
                title={tool.label}
              >
                <span className="text-sm">{tool.icon}</span>
                <span className="text-[9px] font-mono leading-none tracking-normal opacity-75">{tool.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Viewport Compass Gizmo (Top Right) */}
        <div className="absolute right-3 top-3 bg-slate-900/60 p-2 border border-slate-800/40 rounded-lg backdrop-blur-sm shadow z-20 text-[10px] font-mono text-gray-400 flex items-center space-x-1.5">
          <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
          <span>CAM: <span className="text-white uppercase font-bold">{activeCamView}</span></span>
        </div>

        {/* Floating Custom Work Light Controller Panel */}
        <div className="absolute right-3 top-12 bg-[#10121a]/95 border border-[#262c3e] rounded-xl p-3 shadow-2xl z-20 backdrop-blur-md text-xs font-sans text-gray-300 w-52 space-y-2">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
            <span className="font-bold flex items-center gap-1.5 text-amber-400">
              <span className="animate-pulse font-sans">💡</span> 
              {language === 'jp' ? "作業灯カスタム" : "3D WORK LIGHT"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={workLightEnabled} 
                onChange={(e) => setWorkLightEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-7 h-4 bg-gray-700 rounded-full peer peer-checked:bg-amber-500 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3"></div>
            </label>
          </div>

          {workLightEnabled && (
            <div className="space-y-2 animate-fadeIn text-[11px]">
              {/* Speed / Orbit toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-450 font-mono">{language === 'jp' ? "自動軌道周回" : "Orbit Rotation"}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={workLightOrbit}
                    onChange={(e) => setWorkLightOrbit(e.target.checked)}
                    className="rounded bg-gray-900 border-gray-700 text-amber-500 focus:ring-0 w-3 h-3" 
                  />
                  <span className="text-[9.5px] font-mono">{workLightOrbit ? "ON" : "OFF"}</span>
                </label>
              </div>

              {/* Color Picker */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-450 font-mono">{language === 'jp' ? "光のカラー" : "Light Color"}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-mono text-zinc-500">{workLightColor}</span>
                  <input 
                    type="color" 
                    value={workLightColor}
                    onChange={(e) => setWorkLightColor(e.target.value)}
                    className="w-5 h-4 bg-transparent border-0 cursor-pointer rounded-sm p-0" 
                  />
                </div>
              </div>

              {/* Intensity Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9.5px] text-gray-400 font-mono">
                  <span>{language === 'jp' ? "輝度 (Power)" : "Power"}</span>
                  <span className="text-amber-400 font-bold">{workLightIntensity.toFixed(1)}x</span>
                </div>
                <input 
                  type="range"
                  min="0.2"
                  max="5.0"
                  step="0.1"
                  value={workLightIntensity}
                  onChange={(e) => setWorkLightIntensity(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer" 
                />
              </div>

              {/* Height Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[9.5px] text-gray-400 font-mono">
                  <span>{language === 'jp' ? "高さ (Height)" : "Height"}</span>
                  <span className="text-amber-400 font-bold">{workLightHeight.toFixed(1)}m</span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  value={workLightHeight}
                  onChange={(e) => setWorkLightHeight(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer" 
                />
              </div>

              <div className="bg-[#151722] p-1.5 rounded text-[8.5px] text-zinc-400 font-mono leading-normal tracking-normal border border-zinc-800">
                {language === 'jp' ? 
                  "※ 3D空間内の黄色い電球球体がカスタマイズした光源です。マテリアルの光沢や金属質感の反射をご確認ください。" : 
                  "Notice: The gold sphere in the scene shows the customizable Point Light. Rotate camera to inspect reflections!"}
              </div>
            </div>
          )}
        </div>

        {/* Interactive weight painting floating circle (Cursor HUD decoration) */}
        {activeTool === 'paint' && brushPosition && (
          <div
            className="absolute border border-red-500 rounded-full w-12 h-12 pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2 bg-red-400/10 flex items-center justify-center animate-pulse"
            style={{ left: brushPosition.x, top: brushPosition.y }}
          >
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          </div>
        )}

        {/* No Mesh Imported State banner overlay */}
        {!activeMesh && (
          <div className="absolute inset-0 bg-[#121319]/90 z-20 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-[#171a24] border border-[#2e3448] max-w-md w-full p-6 pb-8 rounded-2xl shadow-3xl text-gray-300 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-900/10 rounded-full blur-2xl" />
              <div className="w-14 h-14 rounded-full bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Sparkles className="w-7 h-7 text-cyan-400" />
              </div>
              <h1 className="text-[17px] font-extrabold text-white mb-2 leading-tight">
                {language === 'jp' ? "灯リグ 3Dリギングスタジオへようこそ" : "Welcome to Tou-Rigu Studio"}
              </h1>
              <p className="text-xs text-gray-400 mb-6 font-sans leading-relaxed">
                {language === 'jp' ? 
                  "メッシュからアニメーション可能なボーン骨格に変換する最高品質のWeb rigging環境です。左アセットパネルよりデモプリセットをロードするか、独自のFBX/OBJ/gLTFファイルをダイレクトにインポートしてください。" : 
                  "An elite browser-based 3D workspace. Select a premium pre-built mesh from the Left Panel or drag-and-drop your custom character to initiate the rigging pipeline."}
              </p>
              
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono block">Load Standard Preset:</span>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-gray-200">
                  <button
                    onClick={() => addCustomNode({ id: 'dummy', name: 'dummy', position: [0,0,0] })} // placeholder to trigger first biped
                    className="cursor-pointer bg-cyan-950/20 hover:bg-cyan-900/40 border border-cyan-800/40 p-2.5 rounded-lg font-bold transition block text-cyan-300"
                  >
                    🚹 Biped
                  </button>
                  <button
                    onClick={() => addCustomNode({ id: 'dog', name: 'dog', position: [0,0,0] })} // placeholder trigger quadruped
                    className="cursor-pointer bg-cyan-950/20 hover:bg-cyan-900/40 border border-cyan-800/40 p-2.5 rounded-lg font-bold transition block text-cyan-300"
                  >
                    🐈 Shiba Inu
                  </button>
                  <button
                    onClick={() => addCustomNode({ id: 'mech', name: 'mech', position: [0,0,0] })} // placeholder trigger robot
                    className="cursor-pointer bg-cyan-950/20 hover:bg-cyan-900/40 border border-cyan-800/40 p-2.5 rounded-lg font-bold transition block text-cyan-300"
                  >
                    🤖 Tripod Bot
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Joint translocate and real-time symmetry guidance overlay */}
        {workflowStage === 'synced' && (
          <div className="absolute bottom-16 left-3 right-3 bg-[#0d0f16]/95 border border-cyan-500/40 rounded-lg p-3 shadow-2xl z-20 text-[11px] backdrop-blur-md flex items-center space-x-3">
            <span className="text-base text-cyan-400 animate-pulse">🎛️</span>
            <div>
              <p className="font-extrabold text-cyan-300 font-sans">
                {language === 'jp' ? "【骨格調整フェーズ】関節ノードの座標微調整 (Symmetry Snap)" : "【Joint Alignment Phase】Move Joint Nodes (Symmetry Match)"}
              </p>
              <p className="text-zinc-400 font-sans mt-0.5 leading-relaxed">
                {language === 'jp' ?
                  "関節マーカーを直接クリック＆ドラッグ、または下の X/Y/Z スライダーで移動可能。左右対称性(Bilateral Symmetry)により、反対側のノードも自動で正確に追従します！整ったら approval から皮付けを進めてください。" :
                  "Directly drag joint spheres in the 3D canvas, or use the sliders below. Smart Bilateral Symmetry is active: opposing limbs mirror perfectly! Ready? Click Step 3 in the Right Panel to bind skins."}
              </p>
            </div>
          </div>
        )}

        {/* Laser scanner effect (Analyzing / Simulating AI Synchronizations) */}
        {workflowStage === 'analyzed' && (
          <div className="absolute top-0 left-0 w-full h-full bg-cyan-950/10 pointer-events-none z-10 flex flex-col items-center justify-between">
            <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[pan_2s_linear_infinite] shadow-[0_0_15px_rgba(34,188,215,0.7)]" />
            <div className="bg-[#10121a]/85 border border-cyan-500/20 p-2.5 rounded-md m-3 font-mono text-[10.5px] text-cyan-400 animate-pulse text-center tracking-wider bg-black/45 shadow">
              [NEURAL SCANNER DIRECT ANALYSIS RUNNING...]
            </div>
            <style>{`
              @keyframes pan {
                0% { transform: translateY(0); }
                50% { transform: translateY(50vh); }
                100% { transform: translateY(100vh); }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Selected Node fine tuning coordinate sliders box overlay (Bottom Viewport margin) */}
      {activeSelectedNode && (
        <div className="p-3 bg-[#13151c] border-t border-[#252833] flex flex-col md:flex-row items-center gap-4 z-20 text-xs font-mono select-none">
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center space-x-2 bg-[#1b1d26] border border-[#2e3446] px-2 py-1 rounded-md">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-200 font-bold uppercase truncate max-w-[120px]" title={selectedNodeId || ''}>
                {selectedNodeId}
              </span>
            </div>

            {/* Bilateral Joint Symmetry Mode switch option */}
            <label className="flex items-center space-x-1 px-2 py-1 rounded bg-emerald-950/20 border border-emerald-500/30 font-sans font-bold cursor-pointer hover:bg-emerald-950/30 transition text-emerald-400 select-none">
              <input
                type="checkbox"
                checked={symmetryEnabled}
                onChange={(e) => setSymmetryEnabled(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="text-[10.5px]">Symmetry {symmetryEnabled ? "ON" : "OFF"}</span>
            </label>
          </div>

          {/* If Rigged stage, let them rotate using a direct slider slider! */}
          {workflowStage === 'rigged' ? (
            <div className="flex-1 flex flex-wrap gap-4 w-full">
              {/* FK/IK joints rotation slider */}
              <div className="flex-1 min-w-[200px] flex items-center space-x-2">
                <span className="text-amber-500 font-bold text-[10.5px]">JOINT ROT_Z:</span>
                <input
                  type="range"
                  min="-3.14"
                  max="3.14"
                  step="0.05"
                  value={interactiveRotation[2]}
                  onChange={(e) => {
                    const z = parseFloat(e.target.value);
                    setInteractiveRotation([interactiveRotation[0], interactiveRotation[1], z]);
                  }}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <span className="text-amber-400 font-bold w-12 text-right">{interactiveRotation[2].toFixed(2)} rad</span>
              </div>
              <div className="flex-1 min-w-[200px] flex items-center space-x-2">
                <span className="text-[#38bdf8] font-bold text-[10.5px]">IK DIST_X:</span>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.05"
                  value={interactiveRotation[0]}
                  onChange={(e) => {
                    const x = parseFloat(e.target.value);
                    setInteractiveRotation([x, interactiveRotation[1], interactiveRotation[2]]);
                  }}
                  className="flex-1 accent-[#38bdf8] cursor-pointer"
                />
                <span className="text-cyan-400 font-bold w-12 text-right">{interactiveRotation[0].toFixed(2)}x</span>
              </div>
            </div>
          ) : (
            /* Joint Coordinate Placement (Analyzed/Synced Stage) with triple-interaction support */
            <div className="flex-grow flex flex-col xl:flex-row items-center gap-3 w-full">
              {/* X coordinate entry */}
              <div className="flex items-center space-x-1.5 flex-1 w-full bg-[#171921] border border-red-500/10 p-1 px-2 rounded-lg">
                <span className="text-red-500 font-extrabold text-[11px] w-3 text-center">X</span>
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.01"
                  value={activeSelectedNode.position[0]}
                  onChange={(e) => updateNodePosition(selectedNodeId!, [parseFloat(e.target.value), activeSelectedNode.position[1], activeSelectedNode.position[2]])}
                  className="flex-1 accent-red-500 cursor-pointer h-1"
                />
                <div className="flex items-center space-x-0.5 shrink-0 bg-[#0f1115] border border-zinc-800 rounded px-1.5 py-0.5">
                  <button 
                    onClick={() => updateNodePosition(selectedNodeId!, [parseFloat((activeSelectedNode.position[0] - 0.05).toFixed(3)), activeSelectedNode.position[1], activeSelectedNode.position[2]])}
                    className="cursor-pointer font-mono font-bold text-red-500 hover:text-white hover:bg-red-500/20 px-1 rounded transition text-[11px]"
                    title="Move -0.05"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    className="w-12 bg-transparent text-center font-bold text-white focus:outline-none text-[11px]"
                    value={parseFloat(activeSelectedNode.position[0].toFixed(2))}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        updateNodePosition(selectedNodeId!, [val, activeSelectedNode.position[1], activeSelectedNode.position[2]]);
                      }
                    }}
                  />
                  <button 
                    onClick={() => updateNodePosition(selectedNodeId!, [parseFloat((activeSelectedNode.position[0] + 0.05).toFixed(3)), activeSelectedNode.position[1], activeSelectedNode.position[2]])}
                    className="cursor-pointer font-mono font-bold text-red-500 hover:text-white hover:bg-red-500/20 px-1 rounded transition text-[11px]"
                    title="Move +0.05"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Y coordinate entry */}
              <div className="flex items-center space-x-1.5 flex-1 w-full bg-[#171921] border border-green-500/10 p-1 px-2 rounded-lg">
                <span className="text-green-500 font-extrabold text-[11px] w-3 text-center">Y</span>
                <input
                  type="range"
                  min="0.01"
                  max="4.0"
                  step="0.01"
                  value={activeSelectedNode.position[1]}
                  onChange={(e) => updateNodePosition(selectedNodeId!, [activeSelectedNode.position[0], parseFloat(e.target.value), activeSelectedNode.position[2]])}
                  className="flex-1 accent-green-500 cursor-pointer h-1"
                />
                <div className="flex items-center space-x-0.5 shrink-0 bg-[#0f1115] border border-zinc-800 rounded px-1.5 py-0.5">
                  <button 
                    onClick={() => updateNodePosition(selectedNodeId!, [activeSelectedNode.position[0], parseFloat((activeSelectedNode.position[1] - 0.05).toFixed(3)), activeSelectedNode.position[2]])}
                    className="cursor-pointer font-mono font-bold text-green-500 hover:text-white hover:bg-green-500/20 px-1 rounded transition text-[11px]"
                    title="Move -0.05"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    className="w-12 bg-transparent text-center font-bold text-white focus:outline-none text-[11px]"
                    value={parseFloat(activeSelectedNode.position[1].toFixed(2))}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        updateNodePosition(selectedNodeId!, [activeSelectedNode.position[0], val, activeSelectedNode.position[2]]);
                      }
                    }}
                  />
                  <button 
                    onClick={() => updateNodePosition(selectedNodeId!, [activeSelectedNode.position[0], parseFloat((activeSelectedNode.position[1] + 0.05).toFixed(3)), activeSelectedNode.position[2]])}
                    className="cursor-pointer font-mono font-bold text-green-500 hover:text-white hover:bg-green-500/20 px-1 rounded transition text-[11px]"
                    title="Move +0.05"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Z coordinate entry */}
              <div className="flex items-center space-x-1.5 flex-1 w-full bg-[#171921] border border-blue-500/10 p-1 px-2 rounded-lg">
                <span className="text-blue-500 font-extrabold text-[11px] w-3 text-center">Z</span>
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.01"
                  value={activeSelectedNode.position[2]}
                  onChange={(e) => updateNodePosition(selectedNodeId!, [activeSelectedNode.position[0], activeSelectedNode.position[1], parseFloat(e.target.value)])}
                  className="flex-1 accent-blue-500 cursor-pointer h-1"
                />
                <div className="flex items-center space-x-0.5 shrink-0 bg-[#0f1115] border border-zinc-800 rounded px-1.5 py-0.5">
                  <button 
                    onClick={() => updateNodePosition(selectedNodeId!, [activeSelectedNode.position[0], activeSelectedNode.position[1], parseFloat((activeSelectedNode.position[2] - 0.05).toFixed(3))])}
                    className="cursor-pointer font-mono font-bold text-blue-500 hover:text-white hover:bg-blue-500/20 px-1 rounded transition text-[11px]"
                    title="Move -0.05"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    className="w-12 bg-transparent text-center font-bold text-white focus:outline-none text-[11px]"
                    value={parseFloat(activeSelectedNode.position[2].toFixed(2))}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        updateNodePosition(selectedNodeId!, [activeSelectedNode.position[0], activeSelectedNode.position[1], val]);
                      }
                    }}
                  />
                  <button 
                    onClick={() => updateNodePosition(selectedNodeId!, [activeSelectedNode.position[0], activeSelectedNode.position[1], parseFloat((activeSelectedNode.position[2] + 0.05).toFixed(3))])}
                    className="cursor-pointer font-mono font-bold text-blue-500 hover:text-white hover:bg-blue-500/20 px-1 rounded transition text-[11px]"
                    title="Move +0.05"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
