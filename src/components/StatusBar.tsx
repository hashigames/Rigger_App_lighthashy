/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, HelpCircle, HardDrive, Database, Bone } from 'lucide-react';
import { Language, TRANSLATIONS, MeshAsset } from '../types';

interface StatusBarProps {
  language: Language;
  workflowStage: 'import' | 'analyzed' | 'synced' | 'skeleton' | 'rigged';
  activeMesh: MeshAsset | null;
  selectedNodeName: string | null;
  riggedBonesCount: number;
}

export default function StatusBar({
  language,
  workflowStage,
  activeMesh,
  selectedNodeName,
  riggedBonesCount,
}: StatusBarProps) {
  const t = TRANSLATIONS[language];

  // Derive workflow step instruction
  const getStepInstruction = () => {
    switch (workflowStage) {
      case 'import':
        return t.step1Import;
      case 'analyzed':
        return t.step3Analyze;
      case 'synced':
        return t.step4Adjust;
      case 'skeleton':
        return t.step5Generate;
      case 'rigged':
        return t.step7Ready;
      default:
        return t.step2Select;
    }
  };

  // Default counts if no mesh
  const faceCount = activeMesh ? activeMesh.faces : 0;
  const vertCount = activeMesh ? activeMesh.verts : 0;
  const meshName = activeMesh ? activeMesh.name : "none";

  // Simulate some system memories
  const memUsage = activeMesh 
    ? `${((faceCount * 12 + vertCount * 24) / (1024 * 1024)).toFixed(2)} MB`
    : "0.00 MB";

  return (
    <footer className="bg-[#121318] border-t border-[#252833] text-gray-400 text-xs px-4 py-2 flex flex-col md:flex-row items-center md:justify-between space-y-2 md:space-y-0 select-none z-30 font-mono">
      {/* Step Instruction Indicator. High priority! */}
      <div className="flex items-center space-x-2 text-left self-start md:self-center max-w-full md:max-w-xl">
        <span className="relative flex h-2 w-2 mr-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
        </span>
        <p className="text-[11px] font-sans text-cyan-100 font-medium leading-normal tracking-wide line-clamp-1">
          {getStepInstruction()}
        </p>
      </div>

      {/* Numerical statistics and system stats */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400 justify-end w-full md:w-auto">
        {/* Selected mesh */}
        <div className="flex items-center space-x-1.5 bg-[#171921] px-2 py-0.5 rounded border border-[#232735]">
          <Database className="w-3.5 h-3.5 text-[#8c91a8]" />
          <span>MESH: <span className="text-white font-semibold">{meshName}</span></span>
        </div>

        {/* Polygons and vertices details */}
        <div className="flex items-center space-x-1 bg-[#171921] px-2 py-0.5 rounded border border-[#232735]">
          <span>{t.polyCount}:</span>
          <span className="text-cyan-400 font-bold">{faceCount.toLocaleString()} {t.faces}</span>
          <span className="text-gray-650">|</span>
          <span className="text-gray-300">{vertCount.toLocaleString()} {t.verts}</span>
        </div>

        {/* Rigged bones */}
        <div className="flex items-center space-x-1.5 bg-[#171921] px-2 py-0.5 rounded border border-[#232735]">
          <Bone className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>{t.riggedBonesCount}: <span className="text-[#fdba74] font-bold">{riggedBonesCount}</span></span>
        </div>

        {/* Active Node */}
        <div className="flex items-center space-x-1.5 bg-[#171921] px-2 py-0.5 rounded border border-[#232735]">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>{t.activeNode}: <span className="text-medium text-purple-300 font-bold">{selectedNodeName || t.noneText}</span></span>
        </div>

        {/* Memory usage */}
        <div className="hidden lg:flex items-center space-x-1 text-gray-500">
          <HardDrive className="w-3 h-3" />
          <span>{memUsage} VRAM</span>
        </div>
      </div>
    </footer>
  );
}
