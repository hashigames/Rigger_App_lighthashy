/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'jp' | 'en';

export interface RiggingNode {
  id: string;
  name: string;
  position: [number, number, number]; // x, y, z
  parent?: string;
  isActive?: boolean;
}

export type ViewportStyle = 'default' | 'clay' | 'neon' | 'holo' | 'chrome' | 'wire';
export type ToolbarTool = 'select' | 'move' | 'rotate' | 'scale' | 'paint' | 'neural';
export type RigType = 'quadruped' | 'biped' | 'robot' | 'spider' | 'tentacles' | 'custom';

export interface TextureMaps {
  baseColorFile?: File;
  normalFile?: File;
  roughnessFile?: File;
  metalnessFile?: File;
  aoFile?: File;
}

export interface MeshAsset {
  id: string;
  name: string;
  type: RigType;
  faces: number;
  verts: number;
  riggedBones: number;
  fileObj?: File;
  textures?: TextureMaps;
}

export interface MaterialSlotConfig {
  id: string;
  nameEn: string;
  nameJp: string;
  color: string;
  roughness: number;
  metalness: number;
  emissive: string;
  emissiveIntensity: number;
  preset: 'custom' | 'matte' | 'metal' | 'gold' | 'glow' | 'glass' | 'chrome' | 'obsidian';
}

export interface MaterialSlotsMap {
  primary: MaterialSlotConfig;
  secondary: MaterialSlotConfig;
  accent: MaterialSlotConfig;
}

export const TRANSLATIONS = {
  jp: {
    title: "灯リグ",
    subtitle: "灯台ブリッジ・リグスタジオ",
    tagline: "メッシュとモーションの架け橋となる",
    brandFullName: "LIGHTHOUSE 橋 (ライトハウスブリッジ)",
    
    // Material Slot Labels
    materialPrimary: "① 身体/メイン (Body / Core)",
    materialSecondary: "② 四肢/接続部 (Limbs / Legs)",
    materialAccent: "③ アクセント/発光 (Details / Emissive)",
    colorLabel: "ベースカラー",
    roughnessLabel: "表面の荒さ (Roughness)",
    metalnessLabel: "金属度 (Metalness)",
    emissionColor: "発光カラー (Glow)",
    presetLabel: "材質プリセット",
    lightingLabel: "3D シーン照明設定",
    lightAmbient: "環境光の強度 (Ambient)",
    lightMain: "メイン太陽光 (Sun Position)",
    lightPreset: "照明プリセット",
    lightPresetDefault: "スタジオ・ネオン",
    lightPresetSunset: "トワイライト・暖色",
    lightPresetMidnight: "ルナ・ミッドナイト",
    lightPresetHighKey: "ハイキー全照明 (超高輝度)",
    materialTunerTitle: "マルチ・マテリアル チューナー",
    
    // Header Menus
    menuFile: "ファイル (F)",
    menuEdit: "編集 (E)",
    menuRig: "リグ (R)",
    menuSkeleton: "骨格 (S)",
    menuSkin: "スキン (K)",
    menuExport: "エクスポート (X)",
    
    // Panels
    assetBrowser: "アセットブラウザ",
    importedMeshes: "インポート済みのメッシュ",
    materialSlots: "マテリアルスロット",
    uvManager: "UVセットマネージャー",
    sceneHierarchy: "シーン階層",
    emptyHierarchy: "スケルトン未生成",
    
    // Toolbar
    toolSelect: "選択 (Q)",
    toolMove: "移動 (W)",
    toolRotate: "回転 (E)",
    toolScale: "スケール (R)",
    toolPaint: "ウェイトペイント (P)",
    toolNeural: "ニューラルジョイント追加 (N)",
    
    // Viewport Mode
    vpPerspective: "パースペクティブ",
    vpFront: "フロント",
    vpSide: "サイド",
    vpTop: "トップ",
    vpSingle: "シングル/分割 切替",
    
    // Render modes
    styleDefault: "デフォルト (PBR)",
    styleClay: "クレイ (シルエット)",
    styleNeon: "ネオン (リグ強調)",
    styleHolo: "ホロ (ブループリント)",
    styleChrome: "クローム (反射率)",
    styleWire: "ワイヤーフレーム",
    
    // Rigging Control Panel
    rigTypeSelect: "リグタイプ選択",
    quadruped: "四足歩行 (Quadruped)",
    biped: "二足人間 (Biped Human)",
    robot: "カスタムロボット (Robot)",
    spider: "多脚蜘蛛 (Spider/Arachnid)",
    tentacles: "異形触手 (Multi-Tentacles)",
    custom: "カスタム・自由骨格 (Custom Organic)",
    
    // Options
    optionsQuadruped: "四足歩行のオプション",
    longSpine: "長い背骨 (ウマ/ラクダ)",
    shortSpine: "短い背骨 (イヌ/ネコ)",
    tailEnabled: "尻尾(テール)を有効化",
    clawsToes: "爪/つま先を生成",
    tailSegments: "テールセグメント数",
    
    optionsBiped: "二足歩行のオプション",
    fullFingerRig: "指フルリギング (5本指)",
    eyeAim: "瞳のエイムターゲット",
    tongueJaw: "舌と顎のボーン",
    fingerJoints: "指の関節数",
    
    optionsRobot: "ロボットのオプション",
    legCount: "脚の数 (2-8脚)",
    symmetry: "対称性",
    radial: "放射対称 (Radial)",
    bilateral: "左右対称 (Bilateral)",
    none: "なし (None)",
    jointType: "関節タイプ",
    jointHinge: "ヒンジ (回転1軸)",
    jointBall: "ボールジョイント (多軸)",
    jointPiston: "ピストン/シリンダー",
    
    // Skeleton Controls
    skeletonVisualization: "スケルトン表示設定",
    boneColorCoding: "階層別ボーン色分け",
    jointSize: "関節マーカーサイズ",
    displayBoneNames: "ボーン名表示",
    xrayMode: "ボーンX線透過モード (X-Ray)",
    
    // Actions
    analyzeMesh: "AIメッシュ解析 (Analyze Skin Mesh)",
    generateSkeleton: "ボーン接続 (Connect Joint Links)",
    neuralSync: "境界ボリューム吸着 (Neural Snap Link)",
    rigSync: "配置承認＆リグ同期実行 (APPROVE & BIND SKIN)",
    exportFBX: "FBXエクスポート (Download)",
    
    // Status Bar
    polyCount: "ポリゴン数",
    faces: "面",
    verts: "頂点",
    riggedBonesCount: "連動ボーン数",
    memUsage: "GPUメモリ使用量",
    activeNode: "選択ボーン",
    noneText: "なし",
    
    // Notifications & Workflow Steps
    step1Import: "[ステップ1] 3Dメッシュをドロップするか選択してください。モデルがビューポートに表示されます。",
    step2Select: "[ステップ2] リグタイプ (二足/四足/ロボ) を選択し、パラメータを調整します。",
    step3Analyze: "[ステップ3] 「メッシュ解析」を実行してニューラル検出点(関節マーカー)を展開します。",
    step4Adjust: "[ステップ4] 関節マーカーを動かすか、[N]キーで仮想マーカーを追加します。その後、「ニューラル同期」で吸着させます。",
    step5Generate: "[ステップ5] 「スケルトン生成」をクリックして、メッシュ内部にリグ構造を接続します。",
    step6Sync: "[ステップ6] 「リグ同期実行」を押すと、メッシュとボーンがスキンバインドされ、Maya品質の動的コントローラーが生成されます！",
    step7Ready: "リグ同期完了！ビューポート内の黄色・水色のコントローラーリングをドラッグして、リアルタイムな変形をテストできます。気に入ったらエクスポートしてください！",
    
    // Neural Repository
    neuralRepository: "ニューラル・リポジトリ",
    customTraining: "カスタム学習モデルの送信",
    uploadSuccess: "リグテンプレートの読み込み成功",
    helpPrompt: "プロンプトで操作 (ヘルプ)",
    dropZoneText: "ここにFBX/OBJ/GLBをドラッグ＆ドロップしてください (Drag & Drop here)"
  },
  en: {
    title: "Tou-Rigu Studio",
    subtitle: "Lighthouse Bridge Rig Studio",
    tagline: "Bridge the gap between mesh and motion",
    brandFullName: "LIGHTHOUSE 橋",
    
    // Material Slot Labels
    materialPrimary: "① Body / Core Mesh",
    materialSecondary: "② Limbs & Joints",
    materialAccent: "③ Details & Emission",
    colorLabel: "Base Color",
    roughnessLabel: "Surface Roughness",
    metalnessLabel: "Metalness Degree",
    emissionColor: "Emission Glow",
    presetLabel: "Material preset",
    lightingLabel: "3D Workspace Lights",
    lightAmbient: "Ambient Intensity",
    lightMain: "Sun Position Light",
    lightPreset: "Lighting Preset Setup",
    lightPresetDefault: "Studio Cyan Neon",
    lightPresetSunset: "Mellow Dusk Sunset",
    lightPresetMidnight: "Lunar Midnight",
    lightPresetHighKey: "High-Key Oversaturated",
    materialTunerTitle: "Multi-Material Tuner",
    
    // Header Menus
    menuFile: "File (F)",
    menuEdit: "Edit (E)",
    menuRig: "Rig (R)",
    menuSkeleton: "Skeleton (S)",
    menuSkin: "Skin (K)",
    menuExport: "Export (X)",
    
    // Panels
    assetBrowser: "Asset Browser",
    importedMeshes: "Imported Meshes",
    materialSlots: "Material Slots",
    uvManager: "UV Set Manager",
    sceneHierarchy: "Scene Hierarchy",
    emptyHierarchy: "No Bones Generated",
    
    // Toolbar
    toolSelect: "Select (Q)",
    toolMove: "Move (W)",
    toolRotate: "Rotate (E)",
    toolScale: "Scale (R)",
    toolPaint: "Paint Weight (P)",
    toolNeural: "Add Neural Joint (N)",
    
    // Viewport Mode
    vpPerspective: "Perspective",
    vpFront: "Front",
    vpSide: "Side",
    vpTop: "Top",
    vpSingle: "Toggle Multi/Single View",
    
    // Render modes
    styleDefault: "Default (PBR)",
    styleClay: "Clay (Silhouette)",
    styleNeon: "Neon (Rig Highlights)",
    styleHolo: "Holo (Blueprint)",
    styleChrome: "Chrome (Reflection)",
    styleWire: "Wireframe",
    
    // Rigging Control Panel
    rigTypeSelect: "Select Rig Type",
    quadruped: "Quadruped (4-Legged)",
    biped: "Biped Human (Standard)",
    robot: "Custom Robot (Mecha)",
    spider: "Arachnid Spider (Multi-Legs)",
    tentacles: "Eldritch Tentacles (Multi-Bones)",
    custom: "Custom Organic (Symmetry-Fit)",
    
    // Options
    optionsQuadruped: "Quadruped Options",
    longSpine: "Long Spine (Horse/Camel)",
    shortSpine: "Short Spine (Dog/Cat)",
    tailEnabled: "Tail Enabled",
    clawsToes: "Claws/Toes Included",
    tailSegments: "Tail Segments",
    
    optionsBiped: "Biped Options",
    fullFingerRig: "Full Finger Rig (5 Fingers)",
    eyeAim: "Eye Aim Target",
    tongueJaw: "Tongue & Jaw Bones",
    fingerJoints: "Finger Joints",
    
    optionsRobot: "Robot Options",
    legCount: "Leg Count (2-8)",
    symmetry: "Symmetry",
    radial: "Radial",
    bilateral: "Bilateral",
    none: "None",
    jointType: "Joint Type",
    jointHinge: "Hinge (1-Axis)",
    jointBall: "Ball & Socket (Multi-Axis)",
    jointPiston: "Piston & Cylinder",
    
    // Skeleton Controls
    skeletonVisualization: "Skeleton Display",
    boneColorCoding: "Level Color Coding",
    jointSize: "Joint Size",
    displayBoneNames: "Display Bone Names",
    xrayMode: "Bone X-Ray Mode",
    
    // Actions
    analyzeMesh: "AI Skin Mesh Analyzer",
    generateSkeleton: "Connect Joint Bones",
    neuralSync: "Neural Boundary Snap",
    rigSync: "Approve Placements & Auto-Rig Skin",
    exportFBX: "Download FBX Model",
    
    // Status Bar
    polyCount: "Polygons",
    faces: "Faces",
    verts: "Verts",
    riggedBonesCount: "Rigged Bones",
    memUsage: "GPU VRAM Dev",
    activeNode: "Selected Bone",
    noneText: "none",
    
    // Notifications & Workflow Steps
    step1Import: "[Step 1] Drag & drop a 3D Mesh (FBX/OBJ/gLTF) or click one in the browser list to show it in the scene.",
    step2Select: "[Step 2] Select Biped, Quadruped, or Custom Robot from the panel, then adjust spine or finger sliders.",
    step3Analyze: "[Step 3] Click \"Analyze Mesh\" to distribute neural markers automatically on joints.",
    step4Adjust: "[Step 4] Position joints as needed, or press [N] to add neural joints. Use \"Neural Sync\" to snap bones.",
    step5Generate: "[Step 5] Click \"Generate Skeleton\" to generate bone lines linking custom controllers.",
    step6Sync: "[Step 6] Click \"RIG_SYNCHRONIZATION_INITIATE\" to auto-bind vertices and spawn rich Maya NURBS curves.",
    step7Ready: "Rig setup completed successfully! Interact with controller loops, deform meshes, and export!",
    
    // Neural Repository
    neuralRepository: "Neural Repo",
    customTraining: "Contribute Custom Rigs",
    uploadSuccess: "Rig Template applied successfully",
    helpPrompt: "Command Console Guide",
    dropZoneText: "Drag & Drop FBX/OBJ/GLB files here"
  }
};
