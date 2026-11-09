/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layers, Database, Eye, Image, Box, Trash2, ChevronRight, Folder, FolderOpen, Sliders, Info, Palette, Sun, Sparkles } from 'lucide-react';
import { Language, TRANSLATIONS, MeshAsset, ViewportStyle, RiggingNode, MaterialSlotsMap, MaterialSlotConfig, TextureMaps } from '../types';
import { createProceduralEldritchFiles } from '../utils/procedural';

interface LeftPanelProps {
  language: Language;
  activeMesh: MeshAsset | null;
  meshAssets: MeshAsset[];
  selectMesh: (id: string) => void;
  viewportStyle: ViewportStyle;
  setViewportStyle: (style: ViewportStyle) => void;
  skeletonNodes: RiggingNode[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  deleteMesh: (id: string) => void;
  uploadMeshFile: (file: File) => void;
  updateMeshTextures: (textures: TextureMaps) => void;
  materialSlots: MaterialSlotsMap;
  setMaterialSlots: React.Dispatch<React.SetStateAction<MaterialSlotsMap>>;
  lightAmbientIntensity: number;
  setLightAmbientIntensity: (v: number) => void;
  lightMainIntensity: number;
  setLightMainIntensity: (v: number) => void;
  lightPreset: string;
  setLightPreset: (v: string) => void;
  idleAnimationActive: boolean;
  setIdleAnimationActive: (v: boolean) => void;
  completeAutoRigging: (id: string) => void;
}

export default function LeftPanel({
  language,
  activeMesh,
  meshAssets,
  selectMesh,
  viewportStyle,
  setViewportStyle,
  skeletonNodes,
  selectedNodeId,
  setSelectedNodeId,
  deleteMesh,
  uploadMeshFile,
  updateMeshTextures,
  materialSlots,
  setMaterialSlots,
  lightAmbientIntensity,
  setLightAmbientIntensity,
  lightMainIntensity,
  setLightMainIntensity,
  lightPreset,
  setLightPreset,
  idleAnimationActive,
  setIdleAnimationActive,
  completeAutoRigging,
}: LeftPanelProps) {
  const [activeSlotKey, setActiveSlotKey] = useState<'primary' | 'secondary' | 'accent'>('primary');

  const updateSlotField = (field: keyof MaterialSlotConfig, value: any) => {
    setMaterialSlots((prev) => ({
      ...prev,
      [activeSlotKey]: {
        ...prev[activeSlotKey],
        [field]: value
      }
    }));
  };

  const applyPreset = (presetName: MaterialSlotConfig['preset']) => {
    let roughness = 0.5;
    let metalness = 0.5;
    let color = materialSlots[activeSlotKey].color;
    let emissive = materialSlots[activeSlotKey].emissive;
    let emissiveIntensity = 0;

    switch (presetName) {
      case 'matte':
        roughness = 0.95;
        metalness = 0.05;
        emissiveIntensity = 0;
        break;
      case 'metal':
        roughness = 0.2;
        metalness = 0.9;
        emissiveIntensity = 0;
        break;
      case 'gold':
        roughness = 0.15;
        metalness = 1.0;
        color = '#eab308'; // beautiful gold
        emissiveIntensity = 0;
        break;
      case 'glow':
        roughness = 0.1;
        metalness = 0.8;
        emissive = '#06b6d4';
        emissiveIntensity = 1.2;
        break;
      case 'glass':
        roughness = 0.05;
        metalness = 0.1;
        emissiveIntensity = 0;
        break;
      case 'chrome':
        roughness = 0.02;
        metalness = 0.98;
        color = '#ddddff';
        emissiveIntensity = 0;
        break;
      case 'obsidian':
        roughness = 0.3;
        metalness = 0.15;
        color = '#0f172a';
        emissiveIntensity = 0;
        break;
    }

    setMaterialSlots((prev) => ({
      ...prev,
      [activeSlotKey]: {
        ...prev[activeSlotKey],
        preset: presetName,
        roughness,
        metalness,
        color,
        emissive,
        emissiveIntensity
      }
    }));
  };
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'browser' | 'hierarchy'>('browser');
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadMeshFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMeshFile(e.target.files[0]);
    }
  };

  // Hierarchy toggle
  const [hierarchyExpanded, setHierarchyExpanded] = useState<boolean>(true);

  return (
    <aside className="w-80 bg-[#121318] border-r border-[#252833] flex flex-col h-full select-none text-gray-300">
      {/* Tabs */}
      <div className="flex bg-[#191b22] border-b border-[#252833] p-1 font-sans">
        <button
          onClick={() => setActiveTab('browser')}
          className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 ${
            activeTab === 'browser'
              ? 'bg-[#252833] text-cyan-400 font-bold border border-[#393d4f]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{t.assetBrowser}</span>
        </button>
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 ${
            activeTab === 'hierarchy'
              ? 'bg-[#252833] text-cyan-400 font-bold border border-[#393d4f]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t.sceneHierarchy}</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'browser' ? (
          <>
            {/* Mesh list */}
            <div className="space-y-2">
              <h3 className="text-[11px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                {t.importedMeshes}
              </h3>
              <div className="space-y-1">
                {meshAssets.map((asset) => {
                  const isSelected = activeMesh?.id === asset.id;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => selectMesh(asset.id)}
                      className={`group flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300 shadow-[inset_0_0_8px_rgba(6,182,212,0.15)] font-medium'
                          : 'bg-[#171a22] border-[#252d3a]/40 text-gray-300 hover:bg-[#20232d] hover:border-[#383d4e]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Box className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-gray-500'}`} />
                        <div className="flex flex-col">
                          <span className="font-sans text-[11.5px] truncate max-w-[170px]">{asset.name}</span>
                          <span className="text-[9.5px] opacity-65 font-mono">
                            {asset.faces.toLocaleString()} {t.faces} | {asset.type.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Info badges or Delete (if custom uploaded) */}
                      {asset.id !== 'biped' && asset.id !== 'quadruped' && asset.id !== 'robot' && asset.id !== 'spider' && asset.id !== 'tentacles' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMesh(asset.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-950/45 text-rose-400 hover:text-rose-300 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => completeAutoRigging(asset.id)}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black px-1.5 py-0.5 rounded text-[8.5px] font-extrabold flex items-center gap-0.5 shadow-[0_0_6px_rgba(6,182,212,0.3)] transition shrink-0 uppercase tracking-widest hover:scale-[1.03] active:scale-95"
                            title={language === 'jp' ? "自動で骨格を検出して完全にリギングし、アイドル再生します" : "Click to auto-rig & start the idle animation simulation"}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{language === 'jp' ? "自動リグ" : "AUTO-RIG"}</span>
                          </button>
                          
                          {isSelected && skeletonNodes.length > 0 && (
                            <button
                              onClick={() => setIdleAnimationActive(!idleAnimationActive)}
                              className={`p-1 rounded cursor-pointer transition flex items-center justify-center border text-[9px] font-mono leading-none ${
                                idleAnimationActive
                                  ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border-rose-500/30'
                                  : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 border-emerald-500/30'
                              }`}
                              title={idleAnimationActive ? (language === 'jp' ? "アニメーションをポーズする" : "Stop animation") : (language === 'jp' ? "アニメーションを再生する" : "Start animation")}
                            >
                              {idleAnimationActive ? "STOP" : "PLAY"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drag & Drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-cyan-500 bg-cyan-950/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                  : 'border-[#2d313f] bg-[#171a22] hover:border-[#383d4e]'
              }`}
            >
              <label className="cursor-pointer block">
                <svg className="w-8 h-8 text-cyan-500/80 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-xs font-semibold text-gray-300 leading-tight block">
                  {language === 'jp' ? "ファイルをドラッグ＆ドロップ" : "Drag & Drop 3D File"}
                </span>
                <span className="text-[10px] text-gray-500 block mt-1 font-mono">
                  FBX, OBJ, GLB / GLTF up to 50MB
                </span>
                <input
                  type="file"
                  accept=".fbx,.obj,.gltf,.glb"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
              <div className="space-y-2 pt-2 border-t border-[#252833]">
                <h3 className="text-[11px] text-gray-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  {language === 'jp' ? "レンダリングシェーダー" : "Viewport Shader Shading"}
                </h3>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {[
                    { style: 'default', label: t.styleDefault, color: 'bg-emerald-500' },
                    { style: 'clay', label: t.styleClay, color: 'bg-gray-400' },
                    { style: 'neon', label: t.styleNeon, color: 'bg-[#06b6d4]' },
                    { style: 'holo', label: t.styleHolo, color: 'bg-[#0ea5e9]' },
                    { style: 'chrome', label: t.styleChrome, color: 'bg-yellow-100' },
                    { style: 'wire', label: t.styleWire, color: 'bg-white' },
                  ].map((item) => {
                    const isActive = viewportStyle === item.style;
                    return (
                      <button
                        key={item.style}
                        onClick={() => setViewportStyle(item.style as ViewportStyle)}
                        className={`cursor-pointer text-[10px] p-2 rounded-lg border text-left flex items-center space-x-2 transition ${
                          isActive
                            ? 'bg-[#1b2535] border-cyan-500 text-cyan-300 font-bold'
                            : 'bg-[#161821] border-[#20222a] text-gray-400 hover:bg-[#1d1f2a]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                        <span className="truncate leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Material Tuner Section */}
              <div className="space-y-3 pt-2.5 border-t border-[#252833]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-cyan-400" />
                    {t.materialTunerTitle}
                  </h3>
                  {viewportStyle !== 'default' && (
                    <span className="text-[9px] bg-amber-950/40 text-amber-300 px-1.5 py-0.5 rounded font-sans border border-amber-900/40">
                      {language === 'jp' ? "オーバーライド中" : "Style Active"}
                    </span>
                  )}
                </div>

                {/* Slots tabs */}
                <div className="grid grid-cols-3 gap-1 bg-[#10121a] p-1 rounded-lg border border-[#1e202b]">
                  {(['primary', 'secondary', 'accent'] as const).map((key) => {
                    const slot = materialSlots[key];
                    const active = activeSlotKey === key;
                    const label = language === 'jp' ? slot.nameJp : slot.nameEn;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveSlotKey(key)}
                        className={`cursor-pointer text-[9px] py-1 px-1 rounded font-medium transition text-center truncate ${
                          active
                            ? 'bg-[#222533] text-cyan-400 font-semibold border-b border-cyan-500/50'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        title={label}
                      >
                        {key === 'primary' ? '① Body' : key === 'secondary' ? '② Limbs' : '③ Detail'}
                      </button>
                    );
                  })}
                </div>

                {/* Editing area for the active slot */}
                <div className="bg-[#11131c] rounded-xl p-2.5 border border-[#1f212c] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400/90 font-medium">
                      {language === 'jp' ? materialSlots[activeSlotKey].nameJp : materialSlots[activeSlotKey].nameEn}
                    </span>
                    <span className="text-[9px] text-gray-500 uppercase font-mono">Slot: {activeSlotKey}</span>
                  </div>

                  {/* Preset Quick Buttons */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-sans block">{t.presetLabel}</span>
                    <div className="flex flex-wrap gap-1">
                      {(['matte', 'metal', 'gold', 'glow', 'glass', 'chrome', 'obsidian'] as const).map((pr) => {
                        const isPrActive = materialSlots[activeSlotKey].preset === pr;
                        return (
                          <button
                            key={pr}
                            onClick={() => applyPreset(pr)}
                            className={`cursor-pointer px-1.5 py-0.5 rounded text-[9.5px] font-mono transition border ${
                              isPrActive
                                ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/40 font-bold'
                                : 'bg-[#151722] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            {pr}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Surface sliders */}
                  <div className="space-y-2 pt-1 border-t border-[#1d1f2a]">
                    {/* Base color picker */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] text-zinc-300">{t.colorLabel}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9.5px] font-mono text-zinc-500">{materialSlots[activeSlotKey].color}</span>
                        <input
                          type="color"
                          value={materialSlots[activeSlotKey].color}
                          onChange={(e) => updateSlotField('color', e.target.value)}
                          className="cursor-pointer w-6 h-5 bg-transparent border-0 rounded cursor-pointer p-0"
                        />
                      </div>
                    </div>

                    {/* Roughness */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                        <span>{t.roughnessLabel}</span>
                        <span>{materialSlots[activeSlotKey].roughness.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={materialSlots[activeSlotKey].roughness}
                        onChange={(e) => updateSlotField('roughness', parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Metalness */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                        <span>{t.metalnessLabel}</span>
                        <span>{materialSlots[activeSlotKey].metalness.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={materialSlots[activeSlotKey].metalness}
                        onChange={(e) => updateSlotField('metalness', parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Glowing Emissive controls for Details Slot */}
                    <div className="space-y-1.5 pt-1.5 border-t border-[#1c1e29] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] text-zinc-300 font-sans flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          {t.emissionColor}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={materialSlots[activeSlotKey].emissive}
                            onChange={(e) => updateSlotField('emissive', e.target.value)}
                            className="cursor-pointer w-5 h-4 bg-transparent border-0 rounded cursor-pointer p-0"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                          <span>{language === 'jp' ? "発光輝度 (Glow Intensity)" : "Glow Emission Intensity"}</span>
                          <span>{materialSlots[activeSlotKey].emissiveIntensity.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="0.1"
                          value={materialSlots[activeSlotKey].emissiveIntensity}
                          onChange={(e) => {
                            updateSlotField('emissiveIntensity', parseFloat(e.target.value));
                            if (parseFloat(e.target.value) > 0 && materialSlots[activeSlotKey].preset === 'custom') {
                              updateSlotField('preset', 'glow');
                            }
                          }}
                          className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workspace Lighting Controller */}
              <div className="space-y-2.5 pt-2 border-t border-[#252833]">
                <h3 className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  {t.lightingLabel}
                </h3>

                <div className="bg-[#11131c] rounded-xl p-2.5 border border-[#1f212c] space-y-2.5">
                  {/* Preset Pills */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-sans block">{t.lightPreset}</span>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: 'neon', name: t.lightPresetDefault },
                        { id: 'sunset', name: t.lightPresetSunset },
                        { id: 'midnight', name: t.lightPresetMidnight },
                        { id: 'high_key', name: t.lightPresetHighKey },
                      ].map((lp) => {
                        const isPresetSelected = lightPreset === lp.id;
                        return (
                          <button
                            key={lp.id}
                            onClick={() => {
                              setLightPreset(lp.id);
                              if (lp.id === 'sunset') {
                                setLightAmbientIntensity(0.7);
                                setLightMainIntensity(1.6);
                              } else if (lp.id === 'midnight') {
                                setLightAmbientIntensity(0.25);
                                setLightMainIntensity(1.8);
                              } else if (lp.id === 'high_key') {
                                setLightAmbientIntensity(1.1);
                                setLightMainIntensity(3.0);
                              } else {
                                setLightAmbientIntensity(0.6);
                                setLightMainIntensity(1.8);
                              }
                            }}
                            className={`cursor-pointer py-1 px-1.5 rounded text-[9px] font-mono text-center transition border ${
                              isPresetSelected
                                ? 'bg-amber-950/40 text-amber-400 border-amber-500/40 font-bold'
                                : 'bg-[#151722] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            {lp.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-2">
                    {/* Ambient slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                        <span>{t.lightAmbient}</span>
                        <span>{lightAmbientIntensity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="2.5"
                        step="0.05"
                        value={lightAmbientIntensity}
                        onChange={(e) => setLightAmbientIntensity(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Main light slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                        <span>{t.lightMain}</span>
                        <span>{lightMainIntensity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="4.0"
                        step="0.05"
                        value={lightMainIntensity}
                        onChange={(e) => setLightMainIntensity(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

            {/* Texture Maps Manager (PBR Setup) */}
            <div className="space-y-1.5 pt-2 border-t border-[#252833]">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] text-gray-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                  {language === 'jp' ? "PBRテクスチャマップ管理" : "PBR Texture Maps Manager"}
                </h3>
              </div>

              {/* Preset Generator Buttons */}
              <button
                onClick={async () => {
                  try {
                    const proceduralMaps = await createProceduralEldritchFiles();
                    updateMeshTextures(proceduralMaps);
                    alert(
                      language === 'jp'
                        ? "【Eldritch Carapace】異形のバイオ甲殻テクスチャ（Albedo, Normal, Roughness, Metalness, AO 5マップ）を生成し、3Dメッシュへバインドしました！"
                        : "【Eldritch Carapace】Generated and bound procedural organic bone/carapace textures (Albedo, Normal, Roughness, Metalness, AO maps) onto the active 3D Mesh successfully!"
                    );
                  } catch (err) {
                    console.error(err);
                    alert("Failed to generate organic procedural textures.");
                  }
                }}
                className="cursor-pointer w-full text-left p-2 rounded-lg border border-pink-500/30 bg-pink-950/20 text-pink-300 hover:bg-pink-950/40 hover:text-white hover:border-pink-500 transition duration-155 flex items-center space-x-2 text-[10.5px] font-semibold"
              >
                <span>🧬 </span>
                <span className="truncate">
                  {language === 'jp' ? "「異形バイオ甲殻」5種のマップを一括生成" : "Generate Eldritch Carapace (5 Maps)"}
                </span>
              </button>

              <div className="bg-[#151720] border border-[#232734]/80 rounded-xl p-2.5 font-mono text-[10px] text-gray-405 space-y-2">
                {[
                  { key: 'baseColorFile', labelEn: 'Base Color / Albedo', labelJp: '① ベースカラー / アルベド' },
                  { key: 'normalFile', labelEn: 'Normal Map (Tangent)', labelJp: '② ノーマルマップ / 凹凸感' },
                  { key: 'roughnessFile', labelEn: 'Roughness Map', labelJp: '③ ラフネス / 表面荒さ' },
                  { key: 'metalnessFile', labelEn: 'Metalness Map', labelJp: '④ メタルネス / 金属度' },
                  { key: 'aoFile', labelEn: 'Ambient Occlusion', labelJp: '⑤ アンビエントオクルージョン' },
                ].map((slot) => {
                  const uploadedFile = activeMesh?.textures?.[slot.key as keyof TextureMaps] as File | undefined;
                  const label = language === 'jp' ? slot.labelJp : slot.labelEn;
                  
                  return (
                    <div key={slot.key} className="flex flex-col p-1.5 rounded bg-[#0d0f14] border border-[#1d202b] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-gray-300 truncate max-w-[170px]">{label}</span>
                        <span className={`text-[8.5px] px-1 py-0.2 rounded font-sans uppercase ${uploadedFile ? 'bg-emerald-950/60 text-emerald-405 border border-emerald-500/20' : 'bg-[#1b1c24] text-gray-500'}`}>
                          {uploadedFile ? 'BOUND' : 'EMPTY'}
                        </span>
                      </div>

                      {uploadedFile ? (
                        <div className="flex items-center justify-between text-[9px] bg-[#161a24] p-1 rounded border border-cyan-500/20 text-cyan-200">
                          <div className="flex items-center space-x-1.5 truncate max-w-[190px]">
                            <div className="w-5 h-5 bg-gray-800 rounded shrink-0 border border-gray-700 overflow-hidden flex items-center justify-center">
                              <img 
                                src={URL.createObjectURL(uploadedFile)} 
                                alt="Thumb" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="truncate">{uploadedFile.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              updateMeshTextures({ [slot.key]: null });
                            }}
                            className="cursor-pointer text-rose-400 hover:text-rose-355 hover:bg-rose-950/30 p-1 rounded transition"
                            title="Remove Texture Map"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer file-upload-trigger group flex items-center justify-center py-1.5 px-2 border border-dashed border-[#252836] hover:border-cyan-500/50 bg-[#12141a]/60 hover:bg-[#151924]/60 rounded text-[9px] text-gray-500 hover:text-cyan-400 transition-all">
                          <svg className="w-3 h-3 mr-1 text-gray-550 group-hover:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>{language === 'jp' ? "画像をアップロード..." : "Upload Map..."}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                updateMeshTextures({ [slot.key]: e.target.files[0] });
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Hierarchy Tree representation */
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Skeleton Tree
              </span>
              <span className="text-[10px] text-indigo-400 bg-indigo-950/30 border border-indigo-900/50 px-1.5 py-0.5 rounded">
                Root: Parent
              </span>
            </div>

            {skeletonNodes.length === 0 ? (
              <div className="bg-[#151720] border border-dashed border-[#2d313f] rounded-lg p-5 text-center text-gray-500">
                <Folder className="w-8 h-8 mx-auto mb-2 text-gray-650 opacity-60" />
                <p className="font-sans text-[11px] leading-relaxed">
                  {t.emptyHierarchy}
                </p>
                <p className="font-sans text-[10px] text-gray-650 mt-1">
                  Click 'GENERATE SKELETON' to build bone chains
                </p>
              </div>
            ) : (
              <div className="bg-[#151720] border border-[#232734] rounded-lg p-2 max-h-[350px] overflow-y-auto space-y-0.5">
                {/* Recursively represent bones inside hierarchy list */}
                <div className="flex items-center space-x-1 py-1 px-1.5 bg-slate-900/40 rounded text-amber-500 font-bold text-[11px] border-b border-gray-800">
                  <FolderOpen className="w-4 h-4" />
                  <span>Scene Root_Rig</span>
                </div>
                <div className="pl-3 border-l border-[#2e313f]/40 ml-2 space-y-1 py-1">
                  {skeletonNodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const idColor = node.id.includes('Left') ? 'text-teal-400' : node.id.includes('Right') ? 'text-pink-400' : 'text-amber-300';
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`flex items-center space-x-2 p-1 rounded cursor-pointer transition text-[11px] ${
                          isSelected
                            ? 'bg-cyan-950/40 text-cyan-300 border-l-2 border-cyan-400 pl-2 shadow-sm font-semibold'
                            : 'hover:bg-[#1a1c25] text-gray-300'
                        }`}
                      >
                        <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-cyan-400 rotate-90' : 'text-gray-500'}`} />
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-gray-600'}`} />
                        <span className={`truncate ${idColor}`}>{node.id}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shortcuts help inside Hierarchy tab */}
            <div className="p-3 bg-amber-950/10 border border-amber-900/30 rounded-lg space-y-2 mt-4 text-[10px] font-sans">
              <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-[11px]">
                <Info className="w-3.5 h-3.5" />
                <span>Hotkey Reference (ホットキー)</span>
              </div>
              <ul className="text-gray-400 space-y-1 font-mono text-[10px]">
                <li><kbd className="bg-gray-800 px-1 py-0.5 border border-gray-700 rounded text-gray-300">W</kbd> Move Tool (移動)</li>
                <li><kbd className="bg-gray-800 px-1 py-0.5 border border-gray-700 rounded text-gray-300">E</kbd> Rotate (回転)</li>
                <li><kbd className="bg-gray-800 px-1 py-0.5 border border-gray-700 rounded text-gray-300">N</kbd> Add Joint (追加)</li>
                <li><kbd className="bg-gray-800 px-1 py-0.5 border border-gray-700 rounded text-gray-300">F</kbd> Focus Viewport (密着)</li>
                <li><kbd className="bg-gray-800 px-1 py-0.5 border border-gray-700 rounded text-gray-300">Alt + LMB</kbd> Orbit Camera (回転)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
