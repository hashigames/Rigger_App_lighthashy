/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import Viewport3D from './components/Viewport3D';
import RightPanel from './components/RightPanel';
import StatusBar from './components/StatusBar';
import { Language, ViewportStyle, ToolbarTool, RigType, MeshAsset, RiggingNode, TRANSLATIONS, MaterialSlotsMap, MaterialSlotConfig } from './types';

// Predefined mesh presets
const PRESET_MESHES: MeshAsset[] = [
  { id: 'biped', name: 'Humanoid_Chassis_Base.obj', type: 'biped', faces: 28450, verts: 56900, riggedBones: 0 },
  { id: 'quadruped', name: 'Shiba_Inu_Sculpt_LOD0.fbx', type: 'quadruped', faces: 16120, verts: 32240, riggedBones: 0 },
  { id: 'robot', name: 'Tripod_Sentry_RigReady.glb', type: 'robot', faces: 22400, verts: 44800, riggedBones: 0 },
  { id: 'spider', name: 'Spider_Lurker_Sculpt.obj', type: 'spider', faces: 18658, verts: 37316, riggedBones: 0 },
  { id: 'tentacles', name: 'Eldritch_Tentacles_Stalker.gltf', type: 'tentacles', faces: 12400, verts: 24800, riggedBones: 0 },
];

// High-precision automatic classification helper
export function getOptimalRigType(name: string): RigType {
  const norm = name.toLowerCase();
  
  // 1. Arachnids / Spider multi-legs features scanner
  if (
    norm.includes('spider') || 
    norm.includes('arachnid') || 
    norm.includes('insect') ||
    norm.includes('beetle') ||
    norm.includes('mantis') ||
    norm.includes('scorpion') || 
    norm.includes('crab') || 
    norm.includes('bug') || 
    norm.includes('crawler') ||
    norm.includes('lurker') ||
    norm.includes('stalker') ||
    norm.includes('tarantula') ||
    norm.includes('carapace') || 
    norm.includes('cara') ||
    norm.includes('arthropod')
  ) {
    return 'spider';
  }
  
  // 2. Eldritch tentacles / Kraken features scanner
  if (
    norm.includes('tentacle') || 
    norm.includes('tentacles') || 
    norm.includes('kraken') || 
    norm.includes('squid') || 
    norm.includes('octopus') || 
    norm.includes('spawn') || 
    norm.includes('horror') || 
    norm.includes('eldritch') || 
    norm.includes('cthulhu') ||
    norm.includes('aberration') ||
    norm.includes('jellyfish') ||
    norm.includes('stalks')
  ) {
    return 'tentacles';
  }
  
  // 3. Quadruped / 4-Legged beast features scanner
  if (
    norm.includes('quadruped') || 
    norm.includes('quad') || 
    norm.includes('dog') || 
    norm.includes('shiba') ||
    norm.includes('cat') || 
    norm.includes('horse') || 
    norm.includes('wolf') || 
    norm.includes('fox') || 
    norm.includes('deer') || 
    norm.includes('lion') || 
    norm.includes('tiger') || 
    norm.includes('bear') || 
    norm.includes('animal') || 
    norm.includes('beast') ||
    norm.includes('creature') ||
    norm.includes('fourlegs') ||
    norm.includes('dinosaur') ||
    norm.includes('reptile') ||
    norm.includes('canine') ||
    norm.includes('feline')
  ) {
    return 'quadruped';
  }
  
  // 4. Robot / Mecha mechs features scanner
  if (
    norm.includes('robot') || 
    norm.includes('mecha') || 
    norm.includes('tripod') || 
    norm.includes('bot') || 
    norm.includes('mech') || 
    norm.includes('sentry') || 
    norm.includes('drone') || 
    norm.includes('automaton') || 
    norm.includes('cyborg') ||
    norm.includes('turret') ||
    norm.includes('scifi')
  ) {
    return 'robot';
  }
  
  // 5. Humans / Biped characters features scanner
  if (
    norm.includes('biped') || 
    norm.includes('human') || 
    norm.includes('man') || 
    norm.includes('woman') || 
    norm.includes('character') || 
    norm.includes('avatar') || 
    norm.includes('chibi') ||
    norm.includes('boy') || 
    norm.includes('girl') || 
    norm.includes('hero') || 
    norm.includes('soldier') || 
    norm.includes('actor') ||
    norm.includes('player') ||
    norm.includes('humanoid')
  ) {
    return 'biped';
  }

  // 6. Secondary fallback heuristic distribution (reproducible seed classifier)
  let score = 0;
  for (let i = 0; i < name.length; i++) {
    score += name.charCodeAt(i);
  }
  const typesList: RigType[] = ['biped', 'quadruped', 'robot', 'spider', 'tentacles'];
  return typesList[score % 5];
}

export default function App() {
  const [language, setLanguage] = useState<Language>('jp'); // JP is default for Japan market optimize
  const t = TRANSLATIONS[language];

  // Workflow states
  const [workflowStage, setWorkflowStage] = useState<'import' | 'analyzed' | 'synced' | 'skeleton' | 'rigged'>('import');
  
  // Mesh assets states
  const [meshAssets, setMeshAssets] = useState<MeshAsset[]>(PRESET_MESHES);
  const [activeMesh, setActiveMesh] = useState<MeshAsset | null>(PRESET_MESHES[0]);

  // Rig and tools states
  const [rigType, setRigType] = useState<RigType>('biped');
  const [viewportStyle, setViewportStyle] = useState<ViewportStyle>('default');
  const [activeTool, setActiveTool] = useState<ToolbarTool>('select');

  // Dynamic parameters states
  // Quadruped
  const [longSpine, setLongSpine] = useState<boolean>(false);
  const [shortestSpine, setShortestSpine] = useState<boolean>(true);
  const [tailEnabled, setTailEnabled] = useState<boolean>(true);
  const [clawsToes, setClawsToes] = useState<boolean>(false);
  const [tailSegments, setTailSegments] = useState<number>(5);

  // Biped
  const [fullFingerRig, setFullFingerRig] = useState<boolean>(true);
  const [eyeAim, setEyeAim] = useState<boolean>(true);
  const [tongueJaw, setTongueJaw] = useState<boolean>(false);
  const [fingerJoints, setFingerJoints] = useState<number>(3);

  // Robot
  const [legCount, setLegCount] = useState<number>(3); // 3 legs mecha
  const [symmetry, setSymmetry] = useState<'radial' | 'bilateral' | 'none'>('radial');
  const [jointType, setJointType] = useState<'hinge' | 'ball' | 'piston'>('hinge');

  // Material slot state
  const [materialSlots, setMaterialSlots] = useState<MaterialSlotsMap>({
    primary: {
      id: 'primary',
      nameEn: 'Body / Core Mesh',
      nameJp: '① 身体/メイン',
      color: '#334155',
      roughness: 0.35,
      metalness: 0.25,
      emissive: '#000000',
      emissiveIntensity: 0.0,
      preset: 'custom'
    },
    secondary: {
      id: 'secondary',
      nameEn: 'Limbs & Joints',
      nameJp: '② 四肢/接続部',
      color: '#475569',
      roughness: 0.45,
      metalness: 0.15,
      emissive: '#000000',
      emissiveIntensity: 0.0,
      preset: 'custom'
    },
    accent: {
      id: 'accent',
      nameEn: 'Details & Emission',
      nameJp: '③ アクセント/発光',
      color: '#0ea5e9',
      roughness: 0.1,
      metalness: 0.8,
      emissive: '#06b6d4',
      emissiveIntensity: 1.0,
      preset: 'glow'
    }
  });

  // Lighting parameters state
  const [lightAmbientIntensity, setLightAmbientIntensity] = useState<number>(0.6);
  const [lightMainIntensity, setLightMainIntensity] = useState<number>(1.8);
  const [lightPreset, setLightPreset] = useState<string>('neon');

  // Visualization settings
  const [boneColorCoding, setBoneColorCoding] = useState<boolean>(true);
  const [jointSize, setJointSize] = useState<number>(1.2);
  const [displayBoneNames, setDisplayBoneNames] = useState<boolean>(false);
  const [xrayMode, setXrayMode] = useState<boolean>(true);
  const [symmetryEnabled, setSymmetryEnabled] = useState<boolean>(true);

  // Active joint selection and skeleton hierarchy state
  const [skeletonNodes, setSkeletonNodes] = useState<RiggingNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [idleAnimationActive, setIdleAnimationActive] = useState<boolean>(false);
  const handleSetRigType = (type: RigType) => {
    setRigType(type);
    
    // Update activeMesh.type to stay in alignment!
    if (activeMesh) {
      const updatedMesh = { ...activeMesh, type };
      setActiveMesh(updatedMesh);
      setMeshAssets((prev) =>
        prev.map((m) => (m.id === activeMesh.id ? updatedMesh : m))
      );
    }

    // Set rig-type specific template parameter presets
    if (type === 'spider') {
      setLegCount(8);
      setTailSegments(5);
      setClawsToes(true);
    } else if (type === 'tentacles') {
      setLegCount(6);
      setTailSegments(8);
      setClawsToes(true);
    } else if (type === 'robot') {
      setLegCount(3);
    } else if (type === 'quadruped') {
      setLegCount(4);
      setTailEnabled(true);
      setTailSegments(5);
    } else if (type === 'custom') {
      setLegCount(8);
      setTailEnabled(false);
      setClawsToes(true);
    }
  };

  // Align active mesh and rigType whenever a mesh is clicked/loaded
  const handleSelectMesh = (id: string) => {
    const mesh = meshAssets.find((m) => m.id === id);
    if (mesh) {
      setActiveMesh(mesh);
      setRigType(mesh.type);
      if (mesh.type === 'spider') {
        setLegCount(8);
        setTailSegments(5);
        setClawsToes(true);
      } else if (mesh.type === 'tentacles') {
        setLegCount(6);
        setTailSegments(8);
        setClawsToes(true);
      } else if (mesh.type === 'robot') {
        setLegCount(3);
      } else if (mesh.type === 'quadruped') {
        setLegCount(4);
        setTailEnabled(true);
        setTailSegments(5);
      } else if (mesh.type === 'custom') {
        setLegCount(8);
        setTailEnabled(false);
        setClawsToes(true);
      }
      setWorkflowStage('import');
      setSkeletonNodes([]);
      setSelectedNodeId(null);
    }
  };

  // Drag-and-drop file processing simulation
  const handleUploadFile = (file: File) => {
    const newId = `custom_${Date.now()}`;
    const nameWithoutExt = file.name.split('.')[0] || "Imported_Model";
    const extension = file.name.split('.').pop()?.toUpperCase() || "FBX";
    
    // Auto detect type based on words and advanced morphological patterns
    const detectedType = getOptimalRigType(file.name);

    const newMesh: MeshAsset = {
      id: newId,
      name: file.name,
      type: detectedType,
      faces: Math.floor(Math.random() * 40000) + 15000,
      verts: Math.floor(Math.random() * 80000) + 30000,
      riggedBones: 0,
      fileObj: file,
    };

    setMeshAssets((prev) => [...prev, newMesh]);
    setActiveMesh(newMesh);
    setRigType(detectedType);
    
    // Select default parameters based on detected shape
    if (detectedType === 'spider') {
      setLegCount(8);
      setTailSegments(5);
      setClawsToes(true);
    } else if (detectedType === 'tentacles') {
      setLegCount(6);
      setTailSegments(8);
      setClawsToes(true);
    } else if (detectedType === 'robot') {
      setLegCount(3);
    } else if (detectedType === 'quadruped') {
      setLegCount(4);
      setTailEnabled(true);
      setTailSegments(5);
    } else if (detectedType === 'custom') {
      setLegCount(8);
      setTailEnabled(false);
      setClawsToes(true);
    }

    setWorkflowStage('import');
    setSkeletonNodes([]);
    setSelectedNodeId(null);

    // Dynamic toast notification simulation
    alert(language === 'jp' ? `「${file.name}」(${extension} 3Dメッシュ) をインポートしました！ニューラル解析を実行してください。` : `Imported "${file.name}" (${extension} Mesh) successfully! Run Neural Mesh Analysis.`);
  };

  // Load sample demo preset meshes
  const handleImportDemo = (type: RigType) => {
    handleSelectMesh(type);
  };

  const handleDeleteMesh = (id: string) => {
    setMeshAssets((prev) => prev.filter((m) => m.id !== id));
    if (activeMesh?.id === id) {
      setActiveMesh(PRESET_MESHES[0]);
      handleSetRigType('biped');
      setWorkflowStage('import');
      setSkeletonNodes([]);
      setSelectedNodeId(null);
    }
  };

  // Primary execution actions
  const handleAnalyzeMesh = () => {
    setWorkflowStage('analyzed'); // shows futuristic scanner overlays
    
    // CRITICAL FIX: We do NOT force overwrite the user's manual rigType selection if they chose one.
    // We respect what's currently active as the `effectiveRig`.
    let effectiveRig = rigType;
    
    if (activeMesh) {
      // Run deep neural heuristic feature scanner on the active mesh to show topology fit status panel
      const detectedOptimal = getOptimalRigType(activeMesh.name);
      
      // Update our registered classification index
      if (activeMesh.type !== detectedOptimal) {
        activeMesh.type = detectedOptimal;
        setMeshAssets((prev) =>
          prev.map((m) => (m.id === activeMesh.id ? { ...m, type: detectedOptimal } : m))
        );
      }
    }
    
    setTimeout(() => {
      // Automatically generate colored markers (virtual joint targets) inside viewport
      let generatedMarkers: RiggingNode[] = [];
      
      if (effectiveRig === 'biped') {
        generatedMarkers = [
          { id: 'Root/Hip', name: 'Root Pelvis Joint', position: [0, 1.25, 0] },
          { id: 'Spine_01/Lower', name: 'Lower Spine', position: [0, 1.6, 0.02], parent: 'Root/Hip' },
          { id: 'Spine_02/Chest', name: 'Chest Joint', position: [0, 2.05, -0.01], parent: 'Spine_01/Lower' },
          { id: 'Neck_01', name: 'Neck Joint', position: [0, 2.4, 0.05], parent: 'Spine_02/Chest' },
          { id: 'Head', name: 'Head Tip', position: [0, 2.75, 0.03], parent: 'Neck_01' },
          
          // Arm Left
          { id: 'Left_Clavicle', name: 'L Clavicle', position: [-0.25, 2.15, 0.1], parent: 'Spine_02/Chest' },
          { id: 'Left_Shoulder', name: 'L Shoulder', position: [-0.7, 2.15, 0.0], parent: 'Left_Clavicle' },
          { id: 'Left_Elbow', name: 'L Elbow', position: [-1.15, 1.8, -0.1], parent: 'Left_Shoulder' },
          { id: 'Left_Hand', name: 'L Wrist Hand', position: [-1.45, 1.45, -0.05], parent: 'Left_Elbow' },
 
          // Arm Right
          { id: 'Right_Clavicle', name: 'R Clavicle', position: [0.25, 2.15, 0.1], parent: 'Spine_02/Chest' },
          { id: 'Right_Shoulder', name: 'R Shoulder', position: [0.7, 2.15, 0.0], parent: 'Right_Clavicle' },
          { id: 'Right_Elbow', name: 'R Elbow', position: [1.15, 1.8, -0.1], parent: 'Right_Shoulder' },
          { id: 'Right_Hand', name: 'R Wrist Hand', position: [1.45, 1.45, -0.05], parent: 'Right_Elbow' },
 
          // Legs Left
          { id: 'Left_Hip', name: 'L Hip Joint', position: [-0.35, 1.15, 0.0], parent: 'Root/Hip' },
          { id: 'Left_Knee', name: 'L Knee Joint', position: [-0.35, 0.65, 0.12], parent: 'Left_Hip' },
          { id: 'Left_Foot', name: 'L Foot Ankle', position: [-0.4, 0.15, 0.22], parent: 'Left_Knee' },
 
          // Legs Right
          { id: 'Right_Hip', name: 'R Hip Joint', position: [0.35, 1.15, 0.0], parent: 'Root/Hip' },
          { id: 'Right_Knee', name: 'R Knee Joint', position: [0.35, 0.65, 0.12], parent: 'Right_Hip' },
          { id: 'Right_Foot', name: 'R Foot Ankle', position: [0.4, 0.15, 0.22], parent: 'Right_Knee' },
        ];
      } else if (effectiveRig === 'quadruped') {
        generatedMarkers = [
          { id: 'Root/Hip', name: 'Animal Pelvis', position: [0, 1.1, -0.5] },
          { id: 'Spine_01', name: 'Spine Middle', position: [0, 1.14, -0.1], parent: 'Root/Hip' },
          { id: 'Spine_02', name: 'Spine Chest', position: [0, 1.16, 0.45], parent: 'Spine_01' },
          { id: 'Neck_01', name: 'Neck Joint', position: [0, 1.45, 0.78], parent: 'Spine_02' },
          { id: 'Head', name: 'Head Node', position: [0, 1.82, 1.1], parent: 'Neck_01' },
 
          // Front Legs FL / FR
          { id: 'FrontLeft_Shoulder', name: 'Front Left Shoulder', position: [-0.32, 1.0, 0.7], parent: 'Spine_02' },
          { id: 'FrontLeft_Paw', name: 'Front Left Paw', position: [-0.32, 0.12, 0.75], parent: 'FrontLeft_Shoulder' },
 
          { id: 'FrontRight_Shoulder', name: 'Front Right Shoulder', position: [0.32, 1.0, 0.7], parent: 'Spine_02' },
          { id: 'FrontRight_Paw', name: 'Front Right Paw', position: [0.32, 0.12, 0.75], parent: 'FrontRight_Shoulder' },
 
          // Rear Legs RL / RR
          { id: 'RearLeft_Leg', name: 'Rear Left Leg Hip', position: [-0.3, 0.98, -0.7], parent: 'Root/Hip' },
          { id: 'RearLeft_Paw', name: 'Rear Left Paw', position: [-0.3, 0.12, -0.74], parent: 'RearLeft_Leg' },
 
          { id: 'RearRight_Leg', name: 'Rear Right Leg Hip', position: [0.3, 0.98, -0.7], parent: 'Root/Hip' },
          { id: 'RearRight_Paw', name: 'Rear Right Paw', position: [0.3, 0.12, -0.74], parent: 'RearRight_Leg' },
 
          // Tail joints
          { id: 'Tail_01', name: 'Tail Start', position: [0, 1.34, -0.85], parent: 'Root/Hip' },
          { id: 'Tail_02', name: 'Tail Link 2', position: [0, 1.45, -0.98], parent: 'Tail_01' },
        ];
      } else if (effectiveRig === 'spider') {
        const abdomenScale = Math.max(0.6, tailSegments / 5);
        generatedMarkers = [
          { id: 'Cephalothorax', name: 'Cephalothorax Center', position: [0, 1.3, 0.1] },
          { id: 'Abdomen', name: 'Abdomen Root', position: [0, 1.4, parseFloat((-0.85 * abdomenScale).toFixed(2))], parent: 'Cephalothorax' },
        ];
 
        const legsPerSide = Math.ceil(legCount / 2);
        // Left side legs
        for (let i = 0; i < legsPerSide; i++) {
          const zOff = parseFloat((0.35 - (i / Math.max(1, legsPerSide - 1)) * 0.75).toFixed(2));
          generatedMarkers.push({
            id: `L_Leg_${i + 1}_Hip`,
            name: `Left Leg ${i + 1} Hip`,
            position: [-0.34, 1.25, zOff],
            parent: 'Cephalothorax',
          });
          generatedMarkers.push({
            id: `L_Leg_${i + 1}_Knee`,
            name: `Left Leg ${i + 1} Knee`,
            position: [-0.64, 1.5, parseFloat((zOff - 0.05).toFixed(2))],
            parent: `L_Leg_${i + 1}_Hip`,
          });
          generatedMarkers.push({
            id: `L_Leg_${i + 1}_Foot`,
            name: `Left Leg ${i + 1} Foot`,
            position: [-0.94, 0.1, zOff],
            parent: `L_Leg_${i + 1}_Knee`,
          });
        }
        // Right side legs
        for (let i = 0; i < legsPerSide; i++) {
          const zOff = parseFloat((0.35 - (i / Math.max(1, legsPerSide - 1)) * 0.75).toFixed(2));
          generatedMarkers.push({
            id: `R_Leg_${i + 1}_Hip`,
            name: `Right Leg ${i + 1} Hip`,
            position: [0.34, 1.25, zOff],
            parent: 'Cephalothorax',
          });
          generatedMarkers.push({
            id: `R_Leg_${i + 1}_Knee`,
            name: `Right Leg ${i + 1} Knee`,
            position: [0.64, 1.5, parseFloat((zOff + 0.05).toFixed(2))],
            parent: `R_Leg_${i + 1}_Hip`,
          });
          generatedMarkers.push({
            id: `R_Leg_${i + 1}_Foot`,
            name: `Right Leg ${i + 1} Foot`,
            position: [0.94, 0.1, zOff],
            parent: `R_Leg_${i + 1}_Knee`,
          });
        }
      } else if (effectiveRig === 'tentacles') {
        generatedMarkers = [
          { id: 'EldritchCore', name: 'Core Nucleus', position: [0, 1.4, 0] },
        ];
        
        for (let i = 0; i < legCount; i++) {
          const angle = (2 * Math.PI / legCount) * i;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          
          generatedMarkers.push({
            id: `Tentacle_${i + 1}_Base`,
            name: `Tentacle ${i + 1} Base`,
            position: [parseFloat((cos * 0.32).toFixed(2)), 0.98, parseFloat((sin * 0.32).toFixed(2))],
            parent: 'EldritchCore',
          });
          generatedMarkers.push({
            id: `Tentacle_${i + 1}_Mid`,
            name: `Tentacle ${i + 1} Mid-Link`,
            position: [parseFloat((cos * 0.55).toFixed(2)), 0.55, parseFloat((sin * 0.55).toFixed(2))],
            parent: `Tentacle_${i + 1}_Base`,
          });
          generatedMarkers.push({
            id: `Tentacle_${i + 1}_Tip`,
            name: `Tentacle ${i + 1} Tip`,
            position: [parseFloat((cos * 0.8).toFixed(2)), 0.15, parseFloat((sin * 0.8).toFixed(2))],
            parent: `Tentacle_${i + 1}_Mid`,
          });
        }
      } else if (effectiveRig === 'custom') {
        // High-fidelity symmetry skeleton for custom biology (fits multi-limbed, arachnid, or eldritch shapes)
        generatedMarkers = [
          { id: 'Spine_01_Pelvis', name: 'Spine Base Pelvis', position: [0, 1.15, -0.6] },
          { id: 'Spine_02_Middle', name: 'Spine Thoracic Mid', position: [0, 1.25, -0.1], parent: 'Spine_01_Pelvis' },
          { id: 'Spine_03_Chest', name: 'Spine Anterior Chest', position: [0, 1.35, 0.4], parent: 'Spine_02_Middle' },
          { id: 'Spine_04_Head', name: 'Symmetry Head Node', position: [0, 1.48, 0.85], parent: 'Spine_03_Chest' },
        ];
        
        // Spawn 4 pairs of symmetrical legs branching from the spine, beautifully spaced
        const customLegPositions = [
          { angleZ: 0.5, yHip: 1.18, yKnee: 1.38, yAnkle: 0.45, yFoot: 0.1, parent: 'Spine_03_Chest' },
          { angleZ: 0.18, yHip: 1.18, yKnee: 1.38, yAnkle: 0.45, yFoot: 0.1, parent: 'Spine_03_Chest' },
          { angleZ: -0.15, yHip: 1.18, yKnee: 1.38, yAnkle: 0.45, yFoot: 0.1, parent: 'Spine_02_Middle' },
          { angleZ: -0.48, yHip: 1.18, yKnee: 1.38, yAnkle: 0.45, yFoot: 0.1, parent: 'Spine_01_Pelvis' }
        ];

        customLegPositions.forEach((leg, idx) => {
          const legIdx = idx + 1;
          const zPos = leg.angleZ;
          
          // Left Leg Chain
          generatedMarkers.push({
            id: `L_Leg_${legIdx}_Hip`,
            name: `Left Leg ${legIdx} Hip`,
            position: [-0.3, leg.yHip, zPos],
            parent: leg.parent,
          });
          generatedMarkers.push({
            id: `L_Leg_${legIdx}_Knee`,
            name: `Left Leg ${legIdx} Knee`,
            position: [-0.64, leg.yKnee, parseFloat((zPos - 0.05).toFixed(2))],
            parent: `L_Leg_${legIdx}_Hip`,
          });
          generatedMarkers.push({
            id: `L_Leg_${legIdx}_Ankle`,
            name: `Left Leg ${legIdx} Ankle`,
            position: [-0.88, leg.yAnkle, parseFloat((zPos - 0.08).toFixed(2))],
            parent: `L_Leg_${legIdx}_Knee`,
          });
          generatedMarkers.push({
            id: `L_Leg_${legIdx}_Foot`,
            name: `Left Leg ${legIdx} End-Tip`,
            position: [-1.02, leg.yFoot, parseFloat((zPos - 0.1).toFixed(2))],
            parent: `L_Leg_${legIdx}_Ankle`,
          });

          // Right Leg Chain (Symmetrical!)
          generatedMarkers.push({
            id: `R_Leg_${legIdx}_Hip`,
            name: `Right Leg ${legIdx} Hip`,
            position: [0.3, leg.yHip, zPos],
            parent: leg.parent,
          });
          generatedMarkers.push({
            id: `R_Leg_${legIdx}_Knee`,
            name: `Right Leg ${legIdx} Knee`,
            position: [0.64, leg.yKnee, parseFloat((zPos + 0.05).toFixed(2))],
            parent: `R_Leg_${legIdx}_Hip`,
          });
          generatedMarkers.push({
            id: `R_Leg_${legIdx}_Ankle`,
            name: `Right Leg ${legIdx} Ankle`,
            position: [0.88, leg.yAnkle, parseFloat((zPos + 0.08).toFixed(2))],
            parent: `R_Leg_${legIdx}_Knee`,
          });
          generatedMarkers.push({
            id: `R_Leg_${legIdx}_Foot`,
            name: `Right Leg ${legIdx} End-Tip`,
            position: [1.02, leg.yFoot, parseFloat((zPos + 0.1).toFixed(2))],
            parent: `R_Leg_${legIdx}_Ankle`,
          });
        });
      } else {
        // Custom Robot
        generatedMarkers = [
          { id: 'CoreRoot', name: 'Chassis Central Body', position: [0, 1.4, 0] },
        ];
        
        // Dynamically add legs based on leg count slider!
        for (let i = 0; i < legCount; i++) {
          const angle = (2 * Math.PI / legCount) * i;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          
          generatedMarkers.push({
            id: `Leg_${i + 1}_Hip`,
            name: `Leg ${i + 1} Mechanical Hip`,
            position: [parseFloat((cos * 0.45).toFixed(2)), 1.3, parseFloat((sin * 0.45).toFixed(2))],
            parent: 'CoreRoot'
          });

          generatedMarkers.push({
            id: `Leg_${i + 1}_Foot`,
            name: `Leg ${i + 1} Foot Pad`,
            position: [parseFloat((cos * 0.95).toFixed(2)), 0.1, parseFloat((sin * 0.95).toFixed(2))],
            parent: `Leg_${i + 1}_Hip`
          });
        }
      }

      setSkeletonNodes(generatedMarkers);
      setWorkflowStage('synced');
    }, 1200);
  };

  // Neural Sync snapping
  const handleNeuralSync = () => {
    // Modify slightly positions, simulating matching mesh boundaries beautifully
    setSkeletonNodes((prev) =>
      prev.map((node) => {
        // Adjust minor decimals outwards as if fitting mesh volume
        const adjustedPos: [number, number, number] = [
          parseFloat((node.position[0] * 1.02).toFixed(3)),
          parseFloat((node.position[1] * 0.99 + 0.02).toFixed(3)),
          parseFloat((node.position[2] * 1.01).toFixed(3)),
        ];
        return {
          ...node,
          position: adjustedPos,
        };
      })
    );
    // Alert user
    alert(language === 'jp' ? "【ニューラル同期】メッシュ内部の最適なボリューム位置へジョイントを100%吸着させました！" : "【Neural Sync】Snapped skeleton nodes to optimal inner volume landmarks.");
  };

  const handleGenerateSkeleton = () => {
    setWorkflowStage('skeleton');
  };

  const handleRigSynchronization = () => {
    setWorkflowStage('rigged');
    // Update rigged count on active meshes
    if (activeMesh) {
      const updatedMesh = {
        ...activeMesh,
        riggedBones: skeletonNodes.length
      };
      setActiveMesh(updatedMesh);
      setMeshAssets((prev) => prev.map((m) => m.id === activeMesh.id ? updatedMesh : m));
    }
  };

  const handleExportFBX = (format: 'fbx' | 'obj' | 'gltf') => {
    if (workflowStage !== 'rigged') {
      alert(language === 'jp' ? "エクスポートする前に「リグ同期 (RIG_SYNCHRONIZATION_INITIATE)」を完了してください。" : "Please complete RIG_SYNCHRONIZATION_INITIATE before exporting.");
      return;
    }

    const meshName = activeMesh ? activeMesh.name.split('.')[0] : "rigged_mesh";
    const fName = `${meshName}_Rigged.${format}`;
    const dummyText = `LIGHTHOUSE RIG SYSTEM RIG EXPORTER OUTPUT\nAPP: Tou-Rigu Studio\nDATE: ${new Date().toISOString()}\nBONES COUNT: ${skeletonNodes.length}\nRIG TYPE: ${rigType.toUpperCase()}\nBones lists:\n` + 
      skeletonNodes.map(n => `- Joint: ${n.id} [${n.position.join(', ')}]`).join('\n');

    // Create a real file download in the browser
    const blob = new Blob([dummyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetApp = () => {
    setWorkflowStage('import');
    setSkeletonNodes([]);
    setSelectedNodeId(null);
  };

  const handleUpdateMeshTextures = (textures: any) => {
    if (!activeMesh) return;
    const updatedMesh = {
      ...activeMesh,
      textures: {
        ...activeMesh.textures,
        ...textures
      }
    };
    setActiveMesh(updatedMesh);
    setMeshAssets((prev) => prev.map((m) => m.id === activeMesh.id ? updatedMesh : m));
  };

  const updateNodePosition = (id: string, newPos: [number, number, number]) => {
    setSkeletonNodes((prev) => {
      // 1. Update the translocated joint
      let next = prev.map((node) => (node.id === id ? { ...node, position: newPos } : node));
      
      // 2. Real-time bilateral symmetry matching (X-axis mirror transposing) - Only active if symmetryEnabled is true
      if (symmetryEnabled) {
        let mirrorId = '';
        if (id.startsWith('Left_')) mirrorId = id.replace('Left_', 'Right_');
        else if (id.startsWith('Right_')) mirrorId = id.replace('Right_', 'Left_');
        else if (id.startsWith('L_')) mirrorId = id.replace('L_', 'R_');
        else if (id.startsWith('R_')) mirrorId = id.replace('R_', 'L_');
        else if (id.startsWith('FrontLeft_')) mirrorId = id.replace('FrontLeft_', 'FrontRight_');
        else if (id.startsWith('FrontRight_')) mirrorId = id.replace('FrontRight_', 'FrontLeft_');
        else if (id.startsWith('RearLeft_')) mirrorId = id.replace('RearLeft_', 'RearRight_');
        else if (id.startsWith('RearRight_')) mirrorId = id.replace('RearRight_', 'RearLeft_');

        if (mirrorId && next.some(node => node.id === mirrorId)) {
          next = next.map((node) => {
            if (node.id === mirrorId) {
              const mirroredPos: [number, number, number] = [-newPos[0], newPos[1], newPos[2]];
              return { ...node, position: mirroredPos };
            }
            return node;
          });
        }
      }
      return next;
    });
  };

  const addCustomNode = (node: RiggingNode) => {
    // If empty workspace, initialize pre-preset mesh
    if (!activeMesh) {
      setActiveMesh(PRESET_MESHES[0]);
    }
    // Prevent duplicated IDs
    setSkeletonNodes((prev) => {
      if (prev.find((v) => v.id === node.id)) return prev;
      return [...prev, node];
    });
  };

  const handleCompleteAutoRigging = (id: string) => {
    const mesh = meshAssets.find((m) => m.id === id);
    if (!mesh) return;
    
    setActiveMesh(mesh);
    const effectiveRig = mesh.type;
    setRigType(effectiveRig);
    
    // Set parameter presets
    let useLegCount = legCount;
    let useTailSegments = tailSegments;
    if (effectiveRig === 'spider') {
      useLegCount = 8;
      useTailSegments = 5;
      setLegCount(8);
      setTailSegments(5);
      setClawsToes(true);
    } else if (effectiveRig === 'tentacles') {
      useLegCount = 6;
      useTailSegments = 8;
      setLegCount(6);
      setTailSegments(8);
      setClawsToes(true);
    } else if (effectiveRig === 'robot') {
      useLegCount = 3;
      setLegCount(3);
    } else if (effectiveRig === 'quadruped') {
      useLegCount = 4;
      useTailSegments = 5;
      setLegCount(4);
      setTailEnabled(true);
      setTailSegments(5);
    }

    let generatedMarkers: RiggingNode[] = [];
    if (effectiveRig === 'biped') {
      generatedMarkers = [
        { id: 'Root/Hip', name: 'Root Pelvis Joint', position: [0, 1.25, 0] },
        { id: 'Spine_01/Lower', name: 'Lower Spine', position: [0, 1.6, 0.02], parent: 'Root/Hip' },
        { id: 'Spine_02/Chest', name: 'Chest Joint', position: [0, 2.05, -0.01], parent: 'Spine_01/Lower' },
        { id: 'Neck_01', name: 'Neck Joint', position: [0, 2.4, 0.05], parent: 'Spine_02/Chest' },
        { id: 'Head', name: 'Head Tip', position: [0, 2.75, 0.03], parent: 'Neck_01' },
        
        // Arm Left
        { id: 'Left_Clavicle', name: 'L Clavicle', position: [-0.25, 2.15, 0.1], parent: 'Spine_02/Chest' },
        { id: 'Left_Shoulder', name: 'L Shoulder', position: [-0.7, 2.15, 0.0], parent: 'Left_Clavicle' },
        { id: 'Left_Elbow', name: 'L Elbow', position: [-1.15, 1.8, -0.1], parent: 'Left_Shoulder' },
        { id: 'Left_Hand', name: 'L Wrist Hand', position: [-1.45, 1.45, -0.05], parent: 'Left_Elbow' },

        // Arm Right
        { id: 'Right_Clavicle', name: 'R Clavicle', position: [0.25, 2.15, 0.1], parent: 'Spine_02/Chest' },
        { id: 'Right_Shoulder', name: 'R Shoulder', position: [0.7, 2.15, 0.0], parent: 'Right_Clavicle' },
        { id: 'Right_Elbow', name: 'R Elbow', position: [1.15, 1.8, -0.1], parent: 'Right_Shoulder' },
        { id: 'Right_Hand', name: 'R Wrist Hand', position: [1.45, 1.45, -0.05], parent: 'Right_Elbow' },

        // Legs Left
        { id: 'Left_Hip', name: 'L Hip Joint', position: [-0.35, 1.15, 0.0], parent: 'Root/Hip' },
        { id: 'Left_Knee', name: 'L Knee Joint', position: [-0.35, 0.65, 0.12], parent: 'Left_Hip' },
        { id: 'Left_Foot', name: 'L Foot Ankle', position: [-0.4, 0.15, 0.22], parent: 'Left_Knee' },

        // Legs Right
        { id: 'Right_Hip', name: 'R Hip Joint', position: [0.35, 1.15, 0.0], parent: 'Root/Hip' },
        { id: 'Right_Knee', name: 'R Knee Joint', position: [0.35, 0.65, 0.12], parent: 'Right_Hip' },
        { id: 'Right_Foot', name: 'R Foot Ankle', position: [0.4, 0.15, 0.22], parent: 'Right_Knee' },
      ];
    } else if (effectiveRig === 'quadruped') {
      generatedMarkers = [
        { id: 'Root/Hip', name: 'Animal Pelvis', position: [0, 1.1, -0.5] },
        { id: 'Spine_01', name: 'Spine Middle', position: [0, 1.14, -0.1], parent: 'Root/Hip' },
        { id: 'Spine_02', name: 'Spine Chest', position: [0, 1.16, 0.45], parent: 'Spine_01' },
        { id: 'Neck_01', name: 'Neck Joint', position: [0, 1.45, 0.78], parent: 'Spine_02' },
        { id: 'Head', name: 'Head Node', position: [0, 1.82, 1.1], parent: 'Neck_01' },

        // Front Legs FL / FR
        { id: 'FrontLeft_Shoulder', name: 'Front Left Shoulder', position: [-0.32, 1.0, 0.7], parent: 'Spine_02' },
        { id: 'FrontLeft_Paw', name: 'Front Left Paw', position: [-0.32, 0.12, 0.75], parent: 'FrontLeft_Shoulder' },

        { id: 'FrontRight_Shoulder', name: 'Front Right Shoulder', position: [0.32, 1.0, 0.7], parent: 'Spine_02' },
        { id: 'FrontRight_Paw', name: 'Front Right Paw', position: [0.32, 0.12, 0.75], parent: 'FrontRight_Shoulder' },

        // Rear Legs RL / RR
        { id: 'RearLeft_Leg', name: 'Rear Left Leg Hip', position: [-0.3, 0.98, -0.7], parent: 'Root/Hip' },
        { id: 'RearLeft_Paw', name: 'Rear Left Paw', position: [-0.3, 0.12, -0.74], parent: 'RearLeft_Leg' },

        { id: 'RearRight_Leg', name: 'Rear Right Leg Hip', position: [0.3, 0.98, -0.7], parent: 'Root/Hip' },
        { id: 'RearRight_Paw', name: 'Rear Right Paw', position: [0.3, 0.12, -0.74], parent: 'RearRight_Leg' },

        // Tail joints
        { id: 'Tail_01', name: 'Tail Start', position: [0, 1.34, -0.85], parent: 'Root/Hip' },
        { id: 'Tail_02', name: 'Tail Link 2', position: [0, 1.45, -0.98], parent: 'Tail_01' },
      ];
    } else if (effectiveRig === 'spider') {
      const abdomenScale = Math.max(0.6, useTailSegments / 5);
      generatedMarkers = [
        { id: 'Cephalothorax', name: 'Cephalothorax Center', position: [0, 1.3, 0.1] },
        { id: 'Abdomen', name: 'Abdomen Root', position: [0, 1.4, parseFloat((-0.85 * abdomenScale).toFixed(2))], parent: 'Cephalothorax' },
      ];

      const legsPerSide = Math.ceil(useLegCount / 2);
      for (let i = 0; i < legsPerSide; i++) {
        const zOff = parseFloat((0.35 - (i / Math.max(1, legsPerSide - 1)) * 0.75).toFixed(2));
        generatedMarkers.push({
          id: `L_Leg_${i + 1}_Hip`,
          name: `Left Leg ${i + 1} Hip`,
          position: [-0.34, 1.25, zOff],
          parent: 'Cephalothorax',
        });
        generatedMarkers.push({
          id: `L_Leg_${i + 1}_Knee`,
          name: `Left Leg ${i + 1} Knee`,
          position: [-0.64, 1.5, parseFloat((zOff - 0.05).toFixed(2))],
          parent: `L_Leg_${i + 1}_Hip`,
        });
        generatedMarkers.push({
          id: `L_Leg_${i + 1}_Foot`,
          name: `Left Leg ${i + 1} Foot`,
          position: [-0.94, 0.1, zOff],
          parent: `L_Leg_${i + 1}_Knee`,
        });
      }
      for (let i = 0; i < legsPerSide; i++) {
        const zOff = parseFloat((0.35 - (i / Math.max(1, legsPerSide - 1)) * 0.75).toFixed(2));
        generatedMarkers.push({
          id: `R_Leg_${i + 1}_Hip`,
          name: `Right Leg ${i + 1} Hip`,
          position: [0.34, 1.25, zOff],
          parent: 'Cephalothorax',
        });
        generatedMarkers.push({
          id: `R_Leg_${i + 1}_Knee`,
          name: `Right Leg ${i + 1} Knee`,
          position: [0.64, 1.5, parseFloat((zOff + 0.05).toFixed(2))],
          parent: `R_Leg_${i + 1}_Hip`,
        });
        generatedMarkers.push({
          id: `R_Leg_${i + 1}_Foot`,
          name: `Right Leg ${i + 1} Foot`,
          position: [0.94, 0.1, zOff],
          parent: `R_Leg_${i + 1}_Knee`,
        });
      }
    } else if (effectiveRig === 'tentacles') {
      generatedMarkers = [
        { id: 'EldritchCore', name: 'Core Nucleus', position: [0, 1.4, 0] },
      ];
      for (let i = 0; i < useLegCount; i++) {
        const angle = (2 * Math.PI / useLegCount) * i;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        generatedMarkers.push({
          id: `Tentacle_${i + 1}_Base`,
          name: `Tentacle ${i + 1} Base`,
          position: [parseFloat((cos * 0.32).toFixed(2)), 0.98, parseFloat((sin * 0.32).toFixed(2))],
          parent: 'EldritchCore',
        });
        generatedMarkers.push({
          id: `Tentacle_${i + 1}_Mid`,
          name: `Tentacle ${i + 1} Mid-Link`,
          position: [parseFloat((cos * 0.55).toFixed(2)), 0.55, parseFloat((sin * 0.55).toFixed(2))],
          parent: `Tentacle_${i + 1}_Base`,
        });
        generatedMarkers.push({
          id: `Tentacle_${i + 1}_Tip`,
          name: `Tentacle ${i + 1} Tip`,
          position: [parseFloat((cos * 0.8).toFixed(2)), 0.15, parseFloat((sin * 0.8).toFixed(2))],
          parent: `Tentacle_${i + 1}_Mid`,
        });
      }
    } else if (effectiveRig === 'robot') {
      generatedMarkers = [
        { id: 'CoreRoot', name: 'Chassis Central Body', position: [0, 1.4, 0] },
      ];
      for (let i = 0; i < useLegCount; i++) {
        const angle = (2 * Math.PI / useLegCount) * i;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        generatedMarkers.push({
          id: `Leg_${i + 1}_Hip`,
          name: `Leg ${i + 1} Mechanical Hip`,
          position: [parseFloat((cos * 0.45).toFixed(2)), 1.3, parseFloat((sin * 0.45).toFixed(2))],
          parent: 'CoreRoot'
        });

        generatedMarkers.push({
          id: `Leg_${i + 1}_Foot`,
          name: `Leg ${i + 1} Foot Pad`,
          position: [parseFloat((cos * 0.95).toFixed(2)), 0.1, parseFloat((sin * 0.95).toFixed(2))],
          parent: `Leg_${i + 1}_Hip`
        });
      }
    }

    setSkeletonNodes(generatedMarkers);
    setWorkflowStage('rigged');
    setIdleAnimationActive(true);
  };

  // Synchronized selected node full descriptor name text
  const selectedNodeName = skeletonNodes.find((n) => n.id === selectedNodeId)?.name || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0c] text-white select-none">
      {/* 1. Header Navigation and Branding Toggle */}
      <Header
        language={language}
        setLanguage={setLanguage}
        workflowStage={workflowStage}
        resetApp={resetApp}
        onImportDemo={handleImportDemo}
      />

      {/* 2. Main Work Panel Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel: Asset browser & layers */}
        <LeftPanel
          language={language}
          activeMesh={activeMesh}
          meshAssets={meshAssets}
          selectMesh={handleSelectMesh}
          viewportStyle={viewportStyle}
          setViewportStyle={setViewportStyle}
          skeletonNodes={skeletonNodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          deleteMesh={handleDeleteMesh}
          uploadMeshFile={handleUploadFile}
          updateMeshTextures={handleUpdateMeshTextures}
          materialSlots={materialSlots}
          setMaterialSlots={setMaterialSlots}
          lightAmbientIntensity={lightAmbientIntensity}
          setLightAmbientIntensity={setLightAmbientIntensity}
          lightMainIntensity={lightMainIntensity}
          setLightMainIntensity={setLightMainIntensity}
          lightPreset={lightPreset}
          setLightPreset={setLightPreset}
          idleAnimationActive={idleAnimationActive}
          setIdleAnimationActive={setIdleAnimationActive}
          completeAutoRigging={handleCompleteAutoRigging}
        />

        {/* Center: 3D interactive preview rendering */}
        <Viewport3D
          language={language}
          viewportStyle={viewportStyle}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          rigType={rigType}
          workflowStage={workflowStage}
          setWorkflowStage={setWorkflowStage}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          skeletonNodes={skeletonNodes}
          setSkeletonNodes={setSkeletonNodes}
          updateNodePosition={updateNodePosition}
          addCustomNode={addCustomNode}
          activeMesh={activeMesh}
          jointSize={jointSize}
          displayBoneNames={displayBoneNames}
          xrayMode={xrayMode}
          boneColorCoding={boneColorCoding}
          legCount={legCount}
          tailSegments={tailSegments}
          tailEnabled={tailEnabled}
          clawsToes={clawsToes}
          materialSlots={materialSlots}
          lightAmbientIntensity={lightAmbientIntensity}
          lightMainIntensity={lightMainIntensity}
          lightPreset={lightPreset}
          symmetryEnabled={symmetryEnabled}
          setSymmetryEnabled={setSymmetryEnabled}
          idleAnimationActive={idleAnimationActive}
          setIdleAnimationActive={setIdleAnimationActive}
        />

        {/* Right Panel: Rig specific forms & action steps trigger buttons */}
        <RightPanel
          language={language}
          rigType={rigType}
          setRigType={handleSetRigType}
          workflowStage={workflowStage}
          activeMesh={activeMesh}
          
          longSpine={longSpine}
          setLongSpine={setLongSpine}
          shortestSpine={shortestSpine}
          setShortestSpine={setShortestSpine}
          tailEnabled={tailEnabled}
          setTailEnabled={setTailEnabled}
          clawsToes={clawsToes}
          setClawsToes={setClawsToes}
          tailSegments={tailSegments}
          setTailSegments={setTailSegments}

          fullFingerRig={fullFingerRig}
          setFullFingerRig={setFullFingerRig}
          eyeAim={eyeAim}
          setEyeAim={setEyeAim}
          tongueJaw={tongueJaw}
          setTongueJaw={setTongueJaw}
          fingerJoints={fingerJoints}
          setFingerJoints={setFingerJoints}

          legCount={legCount}
          setLegCount={setLegCount}
          symmetry={symmetry}
          setSymmetry={setSymmetry}
          jointType={jointType}
          setJointType={setJointType}

          boneColorCoding={boneColorCoding}
          setBoneColorCoding={setBoneColorCoding}
          jointSize={jointSize}
          setJointSize={setJointSize}
          displayBoneNames={displayBoneNames}
          setDisplayBoneNames={setDisplayBoneNames}
          xrayMode={xrayMode}
          setXrayMode={setXrayMode}

          onAnalyzeMesh={handleAnalyzeMesh}
          onNeuralSync={handleNeuralSync}
          onGenerateSkeleton={handleGenerateSkeleton}
          onRigSynchronization={handleRigSynchronization}
          onExportFBX={handleExportFBX}
        />
      </div>

      {/* 3. Bottom Information Grid Status Bar bar */}
      <StatusBar
        language={language}
        workflowStage={workflowStage}
        activeMesh={activeMesh}
        selectedNodeName={selectedNodeName}
        riggedBonesCount={workflowStage === 'rigged' ? skeletonNodes.length : 0}
      />
    </div>
  );
}
