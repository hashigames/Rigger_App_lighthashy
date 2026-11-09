/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, Play, ShieldAlert, Cpu, CheckCircle, Zap, RefreshCw, Layers, Sliders, Eye } from 'lucide-react';
import { Language, TRANSLATIONS, RigType, MeshAsset } from '../types';

interface RightPanelProps {
  language: Language;
  rigType: RigType;
  setRigType: (type: RigType) => void;
  workflowStage: 'import' | 'analyzed' | 'synced' | 'skeleton' | 'rigged';
  activeMesh: MeshAsset | null;
  
  // Quadruped options
  longSpine: boolean;
  setLongSpine: (v: boolean) => void;
  shortestSpine: boolean;
  setShortestSpine: (v: boolean) => void;
  tailEnabled: boolean;
  setTailEnabled: (v: boolean) => void;
  clawsToes: boolean;
  setClawsToes: (v: boolean) => void;
  tailSegments: number;
  setTailSegments: (n: number) => void;

  // Biped options
  fullFingerRig: boolean;
  setFullFingerRig: (v: boolean) => void;
  eyeAim: boolean;
  setEyeAim: (v: boolean) => void;
  tongueJaw: boolean;
  setTongueJaw: (v: boolean) => void;
  fingerJoints: number;
  setFingerJoints: (n: number) => void;

  // Robot options
  legCount: number;
  setLegCount: (n: number) => void;
  symmetry: 'radial' | 'bilateral' | 'none';
  setSymmetry: (s: 'radial' | 'bilateral' | 'none') => void;
  jointType: 'hinge' | 'ball' | 'piston';
  setJointType: (j: 'hinge' | 'ball' | 'piston') => void;

  // Display options
  boneColorCoding: boolean;
  setBoneColorCoding: (v: boolean) => void;
  jointSize: number;
  setJointSize: (n: number) => void;
  displayBoneNames: boolean;
  setDisplayBoneNames: (v: boolean) => void;
  xrayMode: boolean;
  setXrayMode: (v: boolean) => void;

  // Tool Actions
  onAnalyzeMesh: () => void;
  onNeuralSync: () => void;
  onGenerateSkeleton: () => void;
  onRigSynchronization: () => void;
  onExportFBX: (format: 'fbx' | 'obj' | 'gltf') => void;
}

export default function RightPanel({
  language,
  rigType,
  setRigType,
  workflowStage,
  activeMesh,
  
  longSpine,
  setLongSpine,
  shortestSpine,
  setShortestSpine,
  tailEnabled,
  setTailEnabled,
  clawsToes,
  setClawsToes,
  tailSegments,
  setTailSegments,

  fullFingerRig,
  setFullFingerRig,
  eyeAim,
  setEyeAim,
  tongueJaw,
  setTongueJaw,
  fingerJoints,
  setFingerJoints,

  legCount,
  setLegCount,
  symmetry,
  setSymmetry,
  jointType,
  setJointType,

  boneColorCoding,
  setBoneColorCoding,
  jointSize,
  setJointSize,
  displayBoneNames,
  setDisplayBoneNames,
  xrayMode,
  setXrayMode,

  onAnalyzeMesh,
  onNeuralSync,
  onGenerateSkeleton,
  onRigSynchronization,
  onExportFBX,
}: RightPanelProps) {
  const t = TRANSLATIONS[language];

  return (
    <aside className="w-80 bg-[#121318] border-l border-[#252833] flex flex-col h-full overflow-y-auto p-4 space-y-4 text-gray-300 select-none selection:bg-red-500 selection:text-white">
      {/* Title */}
      <div className="flex items-center space-x-2 border-b border-[#252833] pb-2">
        <Sliders className="w-4 h-4 text-cyan-400" />
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-white font-mono">
          Rigging Parameters
        </h2>
      </div>

      {/* Rig Type Selection */}
      <div className="space-y-2">
        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">
          {t.rigTypeSelect}
        </label>
        <div className="grid grid-cols-1 gap-1.5 font-sans">
          {[
            { id: 'biped' as RigType, label: t.biped, icon: "🚹" },
            { id: 'quadruped' as RigType, label: t.quadruped, icon: "🐈" },
            { id: 'robot' as RigType, label: t.robot, icon: "🤖" },
            { id: 'spider' as RigType, label: t.spider, icon: "🕷️" },
            { id: 'tentacles' as RigType, label: t.tentacles, icon: "🧬" },
            { id: 'custom' as RigType, label: t.custom, icon: "🎨" },
          ].map((type) => {
            const isSelected = rigType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setRigType(type.id)}
                className={`cursor-pointer w-full text-left p-2.5 rounded-lg border text-xs flex items-center space-x-2.5 transition ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500 text-cyan-300 font-bold shadow-[inset_0_0_8px_rgba(6,182,212,0.15)]'
                    : 'bg-[#161821] border-[#252a36] text-gray-400 hover:bg-[#1a1c27] hover:text-white hover:border-[#3a3f55]'
                }`}
              >
                <span className="text-sm">{type.icon}</span>
                <span className="truncate">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Alignment Scanner */}
      {activeMesh && (
        <div className="bg-[#151924]/60 border border-[#232b3f] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">
              AI Neural Sync Status
            </span>
            <span className="flex items-center gap-1 text-[9.5px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/40">
              <Cpu className="w-2.5 h-2.5 animate-pulse text-cyan-400" />
              ONLINE
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-gray-400 flex justify-between">
              <span>{language === 'jp' ? "対象3Dメッシュ:" : "Selected Mesh:"}</span>
              <span className="text-white font-medium max-w-[140px] truncate">{activeMesh.name}</span>
            </div>
            
            <div className="text-[11px] text-gray-400 flex justify-between">
              <span>{language === 'jp' ? "AI検出トポロジー:" : "Topology Fit:"}</span>
              <span className="text-cyan-400 uppercase font-bold font-mono text-[10.5px]">
                {activeMesh.type === 'biped' && '🚹 Biped'}
                {activeMesh.type === 'quadruped' && '🐈 Quadruped'}
                {activeMesh.type === 'spider' && '🕷️ Spider'}
                {activeMesh.type === 'tentacles' && '🧬 tentacles'}
                {activeMesh.type === 'robot' && '🤖 mecha'}
                {activeMesh.type === 'custom' && '🎨 Custom Organic'}
              </span>
            </div>
          </div>

          {/* Mismatch / Match Notification alerts */}
          {rigType === activeMesh.type ? (
            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900/40 flex items-start gap-1.5 text-[11px] text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{language === 'jp' ? "AIリグ同期：完全合致" : "Rig Aligned Successfully"}</p>
                <p className="text-[10px] text-emerald-400/80">
                  {language === 'jp' ? "スケルトンテンプレートがメッシュ構造と一致しています。" : "AI verified skeleton matches 3D volume topology."}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded bg-amber-950/35 border border-amber-800/50 flex flex-col gap-2 text-[11px] text-amber-200">
              <div className="flex items-start gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300">{language === 'jp' ? "スケルトン不整合を検知" : "Skeletal Mismatch!"}</p>
                  <p className="text-[10px] text-amber-300/80">
                    {language === 'jp' ? "選択リグが3Dモデル形状と合いません。骨格の歪みを防ぐため自動最適化してください。" : "Rig style does not match selected mesh topology structure. Correct it to prevent bone distortions."}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setRigType(activeMesh.type);
                  // Trigger preset parameter presets matching:
                  if (activeMesh.type === 'spider') {
                    setLegCount(8);
                    setTailSegments(5);
                    setClawsToes(true);
                  } else if (activeMesh.type === 'tentacles') {
                    setLegCount(6);
                    setTailSegments(8);
                    setClawsToes(true);
                  } else if (activeMesh.type === 'robot') {
                    setLegCount(3);
                  } else if (activeMesh.type === 'quadruped') {
                    setLegCount(4);
                  } else if (activeMesh.type === 'custom') {
                    setLegCount(8);
                  }
                }}
                className="cursor-pointer w-full mt-1 bg-amber-500 hover:bg-amber-400 text-black py-1 px-2 rounded font-bold text-[10.5px] uppercase font-mono tracking-wider flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
              >
                <Zap className="w-3.5 h-3.5 text-black animate-bounce" />
                {language === 'jp' ? "AI最適リグに自動整合" : "Auto-Align Rig Template"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Options based on RigType */}
      <div className="bg-[#171a23] border border-[#232734]/80 rounded-xl p-3 space-y-3 font-sans">
        <h3 className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider font-mono border-b border-[#292d3c] pb-1.5 flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5" />
          {rigType === 'quadruped' && t.optionsQuadruped}
          {rigType === 'biped' && t.optionsBiped}
          {rigType === 'robot' && t.optionsRobot}
          {rigType === 'spider' && (language === 'jp' ? "多脚スパイダー設定" : "Spider Parameters")}
          {rigType === 'tentacles' && (language === 'jp' ? "触手＆エルドリッチ設定" : "Eldritch Tentacle Parameters")}
        </h3>

        {/* Quadruped Options */}
        {rigType === 'quadruped' && (
          <div className="space-y-2 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={longSpine}
                onChange={(e) => {
                  setLongSpine(e.target.checked);
                  if (e.target.checked) setShortestSpine(false);
                }}
                className="rounded border-[#3c4155] text-cyan-500 bg-[#121318]"
              />
              <span className="text-gray-300">{t.longSpine}</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={shortestSpine}
                onChange={(e) => {
                  setShortestSpine(e.target.checked);
                  if (e.target.checked) setLongSpine(false);
                }}
                className="rounded border-[#3c4155] text-cyan-500 bg-[#121318]"
              />
              <span className="text-gray-300">{t.shortSpine}</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={tailEnabled}
                onChange={(e) => setTailEnabled(e.target.checked)}
                className="rounded border-[#3c4155] text-cyan-500 bg-[#121318]"
              />
              <span className="text-gray-300">{t.tailEnabled}</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={clawsToes}
                onChange={(e) => setClawsToes(e.target.checked)}
                className="rounded border-[#3c4155] text-cyan-500 bg-[#121318]"
              />
              <span className="text-gray-300">{t.clawsToes}</span>
            </label>

            {tailEnabled && (
              <div className="space-y-1.5 pt-1.5 border-t border-[#292d3c]">
                <div className="flex justify-between text-[11px] font-mono text-gray-400">
                  <span>{t.tailSegments}</span>
                  <span className="text-cyan-400 font-bold">{tailSegments}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={tailSegments}
                  onChange={(e) => setTailSegments(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Biped Options */}
        {rigType === 'biped' && (
          <div className="space-y-2 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={fullFingerRig}
                onChange={(e) => setFullFingerRig(e.target.checked)}
                className="rounded border-[#3c4155] text-cyan-500 bg-[#121318]"
              />
              <span className="text-gray-300">{t.fullFingerRig}</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={eyeAim}
                onChange={(e) => setEyeAim(e.target.checked)}
                className="rounded border-[#3c4155] text-cyan-500 bg-[#121318]"
              />
              <span className="text-gray-300">{t.eyeAim}</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={tongueJaw}
                onChange={(e) => setTongueJaw(e.target.checked)}
                className="rounded border-[#3c4155] text-cyan-500 bg-[#121318]"
              />
              <span className="text-gray-300">{t.tongueJaw}</span>
            </label>

            {fullFingerRig && (
              <div className="space-y-1.5 pt-1.5 border-t border-[#292d3c]">
                <div className="flex justify-between text-[11px] font-mono text-gray-400">
                  <span>{t.fingerJoints}</span>
                  <span className="text-cyan-400 font-bold">{fingerJoints}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={fingerJoints}
                  onChange={(e) => setFingerJoints(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Robot Options */}
        {rigType === 'robot' && (
          <div className="space-y-3.5 text-xs">
            {/* Leg Count controls */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300">{t.legCount}</span>
              <div className="flex items-center space-x-1.5 bg-[#121318] border border-[#2d313f] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setLegCount(Math.max(2, legCount - 1))}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded bg-[#1c1d25] border border-[#2d313f]/40 font-bold"
                >
                  -
                </button>
                <span className="w-6 text-center text-cyan-400 font-mono font-bold">{legCount}</span>
                <button
                  type="button"
                  onClick={() => setLegCount(Math.min(8, legCount + 1))}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded bg-[#1c1d25] border border-[#2d313f]/40 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Symmetry options */}
            <div className="space-y-1.5">
              <span className="text-gray-400 text-[10.5px] uppercase font-mono tracking-wider">{t.symmetry}</span>
              <div className="grid grid-cols-3 gap-1 bg-[#121318] p-0.5 border border-[#2d313f] rounded-lg">
                {(['radial', 'bilateral', 'none'] as const).map((sym) => {
                  const isSelect = symmetry === sym;
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setSymmetry(sym)}
                      className={`cursor-pointer py-1 px-1 rounded text-[10px] capitalize font-medium transition ${
                        isSelect
                          ? 'bg-cyan-500 font-bold text-gray-950'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {sym === 'radial' ? t.radial : sym === 'bilateral' ? t.bilateral : t.none}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Joint Type */}
            <div className="space-y-1">
              <span className="text-gray-400 text-[10.5px] uppercase font-mono tracking-wider">{t.jointType}</span>
              <select
                value={jointType}
                onChange={(e) => setJointType(e.target.value as 'hinge' | 'ball' | 'piston')}
                className="w-full bg-[#121318] border border-[#2d313f] rounded-lg py-1 px-2 text-xs text-gray-200 outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="hinge">{t.jointHinge}</option>
                <option value="ball">{t.jointBall}</option>
                <option value="piston">{t.jointPiston}</option>
              </select>
            </div>
          </div>
        )}

        {/* Spider Options */}
        {rigType === 'spider' && (
          <div className="space-y-3.5 text-xs">
            {/* Leg Count controls */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300">{language === 'jp' ? "脚の数 (4-12脚)" : "Spanning Legs (4-12)"}</span>
              <div className="flex items-center space-x-1.5 bg-[#121318] border border-[#2d313f] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setLegCount(Math.max(4, legCount - 2))}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded bg-[#1c1d25] border border-[#2d313f]/40 font-bold"
                >
                  -
                </button>
                <span className="w-10 text-center text-cyan-400 font-mono font-bold">{legCount < 4 ? 8 : (legCount > 12 ? 12 : legCount)}</span>
                <button
                  type="button"
                  onClick={() => setLegCount(Math.min(12, legCount + 2))}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded bg-[#1c1d25] border border-[#2d313f]/40 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Chelicerae / Fangs */}
            <label className="flex items-center space-x-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={clawsToes}
                onChange={(e) => setClawsToes(e.target.checked)}
                className="rounded border-[#3c4155] text-cyan-500 bg-[#121318]"
              />
              <span className="text-gray-300">{language === 'jp' ? "牙 / 鋏角（はさみ角）の生成" : "Generate Chelicerae / Fangs"}</span>
            </label>

            {/* Abdomen Size */}
            <div className="space-y-1.5 pt-1.5 border-t border-[#292d3c]">
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>{language === 'jp' ? "腹部（アブドメン）の大きさ" : "Abdomen Bulb Scale"}</span>
                <span className="text-cyan-400 font-bold">{tailSegments}</span>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                value={tailSegments}
                onChange={(e) => setTailSegments(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Tentacles Options */}
        {rigType === 'tentacles' && (
          <div className="space-y-3.5 text-xs">
            {/* Tentacle Count controls */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300">{language === 'jp' ? "触手の数 (3-12本)" : "Tentacle Count (3-12)"}</span>
              <div className="flex items-center space-x-1.5 bg-[#121318] border border-[#2d313f] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setLegCount(Math.max(3, legCount - 1))}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded bg-[#1c1d25] border border-[#2d313f]/40 font-bold"
                >
                  -
                </button>
                <span className="w-10 text-center text-cyan-400 font-mono font-bold">{legCount < 3 ? 6 : (legCount > 12 ? 12 : legCount)}</span>
                <button
                  type="button"
                  onClick={() => setLegCount(Math.min(12, legCount + 1))}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded bg-[#1c1d25] border border-[#2d313f]/40 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Bioluminescent Suckers */}
            <label className="flex items-center space-x-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={clawsToes}
                onChange={(e) => setClawsToes(e.target.checked)}
                className="rounded border-[#3c4155] text-cyan-500 bg-[#121318]"
              />
              <span className="text-gray-300">{language === 'jp' ? "発光吸盤の追加 (Bioluminescent Suckers)" : "Bioluminescent Glowing Suckers"}</span>
            </label>

            {/* Tentacles segments */}
            <div className="space-y-1.5 pt-1.5 border-t border-[#292d3c]">
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>{language === 'jp' ? "触手のセグメント解像度" : "Segments per Tentacle"}</span>
                <span className="text-cyan-400 font-bold">{tailSegments}</span>
              </div>
              <input
                type="range"
                min="4"
                max="15"
                value={tailSegments}
                onChange={(e) => setTailSegments(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* HIGH-FIDELITY TENTACLES RIGGING ANATOMY GUIDE */}
            <div className="bg-[#090b11]/90 border border-cyan-500/20 p-2.5 rounded-lg mt-3 space-y-2.5 font-sans">
              <div className="flex items-center space-x-1 text-[10.5px] font-bold text-cyan-400 uppercase tracking-wide">
                <span>🧬</span>
                <span>{language === 'jp' ? "触手骨格の構造設計ガイド" : "Tentacle Rigging Blueprint"}</span>
              </div>
              
              <p className="text-[10px] text-zinc-400 leading-normal">
                {language === 'jp' 
                  ? "滑らかで自然にうねる「触手ボーン（Spline Joint Chain）」は、中心核から末端にむかって直列的に連結・配置されます。これにより、高度な物理シミュレーションとIK制御(逆運動学)を実現します。" 
                  : "Smooth, organics multi-joint chains are structured strictly sequentially from core nucleus to outer tips. This layout optimized dynamic sine curvature & direct IK solver target precision."}
              </p>

              {/* Schematic hierarchy map diagram */}
              <div className="bg-[#12141d] border border-[#2d313e] rounded p-2 text-[9.5px] space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-yellow-500 font-extrabold pb-1 border-b border-zinc-900">
                  <span>{language === 'jp' ? "ジョイント階層構造" : "Skeleton Joint Chain"}</span>
                  <span className="text-[8.5px] px-1 rounded bg-yellow-950/40 border border-yellow-700/20">ROOT PARENT</span>
                </div>
                
                <div className="space-y-1 text-zinc-300">
                  <div className="flex items-center space-x-1">
                    <span className="text-amber-500">◆</span>
                    <span className="font-bold">EldritchCore</span>
                    <span className="text-[8px] text-zinc-500">(Core parent nucleus)</span>
                  </div>
                  <div className="pl-3 border-l border-zinc-800 ml-1.5 space-y-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-cyan-400">↳ ◇</span>
                      <span className="font-bold text-cyan-300">Tentacle_X_Base</span>
                      <span className="text-[8px] text-zinc-500">({language === 'jp' ? "本体の接続根元" : "Root anchor"})</span>
                    </div>
                    <div className="pl-3 border-l border-zinc-800 ml-1.5 space-y-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-purple-400">↳ ◇</span>
                        <span className="font-bold text-purple-300">Tentacle_X_Mid</span>
                        <span className="text-[8px] text-zinc-500">({language === 'jp' ? "うねり用中継点" : "Spline Joint"})</span>
                      </div>
                      <div className="pl-3 border-l border-zinc-800 ml-1.5">
                        <div className="flex items-center space-x-1 text-emerald-400">
                          <span>↳ ◆</span>
                          <span className="font-bold">Tentacle_X_Tip</span>
                          <span className="text-[8px] text-zinc-500">({language === 'jp' ? "末端 IK/物性制御" : "IK Endpoint"})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Anatomy Tips */}
              <div className="grid grid-cols-2 gap-1.5 text-[9px] text-zinc-400">
                <div className="bg-[#12141d]/50 p-1.5 rounded border border-[#232734]">
                  <p className="font-semibold text-zinc-300">1. {language === 'jp' ? "肉厚の等比縮小" : "Radius Taper"}</p>
                  <p className="text-[8.5px] mt-0.5 opacity-80">{language === 'jp' ? "ボーンは先端にむかって自動で細くなり極小の制御精度を保ちます。" : "Maya-mode auto tappers base joints slightly thicker than tip joints."}</p>
                </div>
                <div className="bg-[#12141d]/50 p-1.5 rounded border border-[#232734]">
                  <p className="font-semibold text-zinc-300">2. {language === 'jp' ? "IK-コントロール" : "IK Handling"}</p>
                  <p className="text-[8.5px] mt-0.5 opacity-80">{language === 'jp' ? "黄色のリングコントローラで先端をドラッグすることで全体が変形を維持します。" : "Drag outer yellow NURBS rigs to run real-time sine wave deformations."}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Display configuration */}
      <div className="bg-[#171a23] border border-[#232734]/80 rounded-xl p-3 space-y-2.5 font-sans">
        <h3 className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono border-b border-[#292d3c] pb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {t.skeletonVisualization}
          </span>
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
        </h3>

        <div className="space-y-2 text-xs">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">{t.boneColorCoding}</span>
            <input
              type="checkbox"
              checked={boneColorCoding}
              onChange={(e) => setBoneColorCoding(e.target.checked)}
              className="rounded border-[#3c4155] text-cyan-500 bg-[#121318] accent-cyan-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">{t.displayBoneNames}</span>
            <input
              type="checkbox"
              checked={displayBoneNames}
              onChange={(e) => setDisplayBoneNames(e.target.checked)}
              className="rounded border-[#3c4155] text-cyan-500 bg-[#121318] accent-cyan-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">{t.xrayMode}</span>
            <input
              type="checkbox"
              checked={xrayMode}
              onChange={(e) => setXrayMode(e.target.checked)}
              className="rounded border-[#3c4155] text-cyan-500 bg-[#121318] accent-cyan-400 cursor-pointer"
            />
          </label>

          <div className="space-y-1 pt-1.5 border-t border-[#292d3c]">
            <div className="flex justify-between text-[11px] font-mono text-gray-400">
              <span>{t.jointSize}</span>
              <span className="text-green-400 font-bold">{jointSize.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={jointSize}
              onChange={(e) => setJointSize(parseFloat(e.target.value))}
              className="w-full accent-green-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Core Rig actions. Designed beautifully with states */}
      <div className="space-y-2 pt-2 border-t border-[#252833] font-sans">
        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono block">
          Execution Pipieline
        </label>

        {/* Step 3 Action: ANALYZE MESH */}
        <button
          onClick={onAnalyzeMesh}
          className={`cursor-pointer w-full text-xs font-bold p-3 rounded-lg border flex items-center justify-between transition-all ${
            workflowStage === 'import'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-cyan-400 text-white shadow-lg animate-pulse shadow-cyan-500/15'
              : 'bg-[#1b212f]/40 border-cyan-900/30 text-cyan-500 hover:bg-[#1a233b]/60'
          }`}
        >
          <span className="flex items-center gap-1.5 uppercase font-mono">
            <Zap className="w-4 h-4 text-cyan-300" />
            1. {t.analyzeMesh}
          </span>
          <span className="text-[9.5px] font-normal px-1.5 py-0.5 rounded bg-black/30 text-cyan-300">
            {workflowStage !== 'import' ? 'DONE ✓' : 'RUN'}
          </span>
        </button>

        {/* Step 4 Action: NEURAL SYNC */}
        <button
          onClick={onNeuralSync}
          disabled={workflowStage === 'import'}
          className={`cursor-pointer w-full text-xs font-bold p-3 rounded-lg border flex items-center justify-between transition-all ${
            workflowStage === 'analyzed'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-purple-400 text-white shadow-lg animate-pulse'
              : workflowStage === 'import'
              ? 'bg-gray-900 border-gray-950 text-gray-600 cursor-not-allowed'
              : 'bg-[#231a31]/40 border-purple-900/30 text-purple-400 hover:bg-[#2c1d3f]'
          }`}
        >
          <span className="flex items-center gap-1.5 uppercase font-mono">
            <Cpu className="w-4 h-4 text-purple-300" />
            2. {t.neuralSync}
          </span>
          <span className="text-[9.5px] font-normal px-1.5 py-0.5 rounded bg-black/30">
            {workflowStage === 'import' || workflowStage === 'analyzed' ? 'READY' : 'SYNCED ✓'}
          </span>
        </button>

        {/* Step 5 Action: GENERATE SKELETON */}
        <button
          onClick={onGenerateSkeleton}
          disabled={workflowStage === 'import' || workflowStage === 'analyzed'}
          className={`cursor-pointer w-full text-xs font-bold p-3 rounded-lg border flex items-center justify-between transition-all ${
            workflowStage === 'synced'
              ? 'bg-gradient-to-r from-[#e11d48] to-[#be123c] hover:from-[#f43f5e] hover:to-[#be123c] border-pink-400 text-white shadow-lg shadow-pink-500/10'
              : workflowStage === 'import' || workflowStage === 'analyzed'
              ? 'bg-gray-900 border-gray-950 text-gray-600 cursor-not-allowed'
              : 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400 hover:bg-emerald-950/40'
          }`}
        >
          <span className="flex items-center gap-1.5 uppercase font-mono">
            <Layers className="w-4 h-4" />
            3. {t.generateSkeleton}
          </span>
          <span className="text-[9.5px] font-normal px-1.5 py-0.5 rounded bg-black/30">
            {workflowStage === 'skeleton' || workflowStage === 'rigged' ? 'ACTIVE' : 'WAIT'}
          </span>
        </button>

        {/* Step 6 Action: RIG SYNCHRONIZATION (RIG_SYNCHRONIZATION_INITIATE) */}
        <button
          id="RIG_SYNCHRONIZATION_INITIATE"
          onClick={onRigSynchronization}
          disabled={workflowStage === 'import' || workflowStage === 'analyzed' || workflowStage === 'synced'}
          className={`cursor-pointer w-full text-xs font-bold p-3 rounded-lg border flex items-center justify-between transition-all ${
            workflowStage === 'skeleton'
              ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-950 border-yellow-200 shadow-xl shadow-yellow-500/20 font-extrabold animate-pulse'
              : workflowStage === 'rigged'
              ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-lg font-bold'
              : 'bg-gray-900 border-gray-950 text-gray-600 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center gap-1.5 uppercase font-mono">
            <CheckCircle className="w-4 h-4" />
            4. {t.rigSync}
          </span>
          <span className="text-[9.5px] font-normal px-1.5 py-0.5 rounded bg-black/30">
            {workflowStage === 'rigged' ? 'BOUND ☄' : 'INIT'}
          </span>
        </button>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={() => onExportFBX('fbx')}
            className="cursor-pointer bg-[#20222e] border border-[#303348] hover:border-cyan-500 hover:text-cyan-400 text-white text-[11px] font-bold p-2.5 rounded-lg transition text-center uppercase font-mono shadow-md"
          >
            Export FBX
          </button>
          <button
            onClick={() => onExportFBX('gltf')}
            className="cursor-pointer bg-[#20222e] border border-[#303348] hover:border-cyan-500 hover:text-cyan-400 text-white text-[11px] font-bold p-2.5 rounded-lg transition text-center uppercase font-mono shadow-md"
          >
            Export GLB
          </button>
        </div>
      </div>

      {/* Neural Models Directory */}
      <div className="bg-[#101217] border border-[#1b1c25]/80 rounded-xl p-3 space-y-2 font-mono text-[10.5px]">
        <div className="text-gray-400 font-bold uppercase tracking-wider text-[10px] flex items-center justify-between border-b border-[#212433] pb-1 cursor-pointer">
          <span>{t.neuralRepository}</span>
          <span className="text-[10px] text-cyan-400 bg-cyan-950/40 px-1.5 py-0.2 rounded">7 Trained</span>
        </div>
        <div className="space-y-1.5 text-gray-400">
          <div className="flex justify-between items-center bg-[#151720] px-2 py-1 rounded">
            <span className="text-cyan-300 font-bold">BNHEAD.model</span>
            <span className="text-[9px] text-green-400">Ready</span>
          </div>
          <div className="flex justify-between items-center bg-[#151720] px-2 py-1 rounded">
            <span className="text-cyan-300 font-bold">BNHANDR.model</span>
            <span className="text-[9px] text-green-400">Ready</span>
          </div>
          <div className="flex justify-between items-center bg-[#151720] px-2 py-1 rounded">
            <span className="text-cyan-300 font-bold">BNEYER/L.model</span>
            <span className="text-[9px] text-green-400">Ready</span>
          </div>
          <div className="flex justify-between items-center bg-[#151720] px-2 py-1 rounded">
            <span className="text-cyan-300 font-bold">Mecha_Pack.model</span>
            <span className="text-[10px] text-yellow-500 font-bold">Tuned</span>
          </div>
        </div>
        <button
          onClick={() => alert(t.uploadSuccess)}
          className="cursor-pointer w-full bg-[#1c2236] text-cyan-300 border border-cyan-900/60 p-2 rounded text-[9.5px] hover:bg-cyan-950/40 hover:text-cyan-400 transition"
        >
          + {t.customTraining}
        </button>
      </div>
    </aside>
  );
}
