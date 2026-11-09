/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, Layers, HelpCircle, FileText, Settings, Download, RefreshCw, Languages, Globe } from 'lucide-react';
import { Language, TRANSLATIONS, RigType } from '../types';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  workflowStage: string;
  resetApp: () => void;
  onImportDemo: (type: RigType) => void;
}

export default function Header({ language, setLanguage, workflowStage, resetApp, onImportDemo }: HeaderProps) {
  const t = TRANSLATIONS[language];

  return (
    <header className="bg-[#121318] border-b border-[#252833] text-gray-200 px-4 py-2 flex items-center justify-between selection:bg-red-500 selection:text-white select-none z-50">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        {/* SVG Custom Logo: Lighthouse with bridge themes */}
        <div className="flex items-center space-x-2">
          <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2L15 15H25L20 2Z" fill="currentColor" opacity="0.8" />
            <rect x="17" y="15" width="6" height="15" fill="currentColor" />
            <path d="M12 30H28V33H12V30Z" fill="currentColor" />
            <path d="M4 33C14 30 26 36 36 33" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="5" r="2.5" className="animate-pulse fill-red-500" />
            <path d="M10 18L14 15M30 18L26 15" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wider text-white flex items-center gap-1.5 font-mono">
              LIGHTHOUSE <span className="bg-red-600 px-1 text-[11px] rounded font-sans text-xs">橋</span>
            </span>
            <span className="text-[10px] text-gray-400 font-mono tracking-widest leading-none">
              {t.title} STUDIO
            </span>
          </div>
        </div>

        <div className="h-6 w-[1-px] bg-[#2d313f] mx-2" />

        {/* Menu Bar (Maya Style dropdown headers) */}
        <nav className="hidden md:flex space-x-2.5 text-xs text-gray-300 font-sans">
          <div className="relative group">
            <button className="px-2.5 py-1 hover:bg-[#252833] rounded cursor-pointer transition">
              {t.menuFile}
            </button>
            <div className="absolute left-0 top-full mt-1 w-48 bg-[#181a22] border border-[#2d313f] rounded shadow-2xl py-1 hidden group-hover:block z-50">
              <button 
                onClick={() => onImportDemo('biped')}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-950/40 hover:text-cyan-400 text-xs transition block"
              >
                🚹 Load Humanoid Demo Mesh
              </button>
              <button 
                onClick={() => onImportDemo('quadruped')}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-950/40 hover:text-cyan-400 text-xs transition block"
              >
                🐈 Load Shiba Inu Mesh
              </button>
              <button 
                onClick={() => onImportDemo('robot')}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-950/40 hover:text-cyan-400 text-xs transition block"
              >
                🤖 Load Mecha Tripod Mesh
              </button>
              <button 
                onClick={() => onImportDemo('spider')}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-950/40 hover:text-cyan-400 text-xs transition block"
              >
                🕷️ Load Spider Lurker Mesh
              </button>
              <button 
                onClick={() => onImportDemo('tentacles')}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-950/40 hover:text-cyan-400 text-xs transition block"
              >
                🧬 Load Eldritch Tentacles
              </button>
              <div className="border-t border-[#252833] my-1" />
              <button 
                onClick={resetApp}
                className="w-full text-left px-3 py-1.5 hover:bg-red-950/40 hover:text-red-400 text-xs text-rose-300 transition flex items-center justify-between"
              >
                <span>Clear Workspace</span>
                <span className="text-[10px] text-gray-500">Ctrl+N</span>
              </button>
            </div>
          </div>

          <div className="relative group">
            <button className="px-2.5 py-1 hover:bg-[#252833] rounded cursor-pointer transition">
              {t.menuEdit}
            </button>
            <div className="absolute left-0 top-full mt-1 w-44 bg-[#181a22] border border-[#2d313f] rounded shadow-2xl py-1 hidden group-hover:block z-50">
              <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase font-mono tracking-wider">Transform</div>
              <button className="w-full text-left px-3 py-1 hover:bg-[#252833] text-xs transition">Undo (Ctrl+Z)</button>
              <button className="w-full text-left px-3 py-1 hover:bg-[#252833] text-xs transition">Redo (Ctrl+Y)</button>
              <div className="border-t border-[#252833] my-1" />
              <button className="w-full text-left px-3 py-1 hover:bg-[#252833] text-xs transition">Select All (Ctrl+A)</button>
              <button className="w-full text-left px-3 py-1 hover:bg-[#252833] text-xs transition">Reset Node Transforms</button>
            </div>
          </div>

          <div className="relative group">
            <button className="px-2.5 py-1 hover:bg-[#252833] rounded cursor-pointer transition">
              {t.menuRig}
            </button>
            <div className="absolute left-0 top-full mt-1 w-48 bg-[#181a22] border border-[#2d313f] rounded shadow-2xl py-1 hidden group-hover:block z-50">
              <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase font-mono">Neural Engine</div>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#252833] text-xs transition font-mono">Model: BNHEAD v3.2</button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#252833] text-xs transition font-mono">Model: BNHAND_RIG v1.1</button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#252833] text-xs transition font-mono">Model: BNEYE_AIM v0.9</button>
            </div>
          </div>

          <button className="px-2.5 py-1 hover:bg-[#252833] rounded transition">{t.menuSkeleton}</button>
          <button className="px-2.5 py-1 hover:bg-[#252833] rounded transition">{t.menuSkin}</button>
          <button className="px-2.5 py-1 hover:bg-[#252833] rounded transition">{t.menuExport}</button>
        </nav>
      </div>

      {/* Center Tagline */}
      <div className="hidden lg:flex items-center space-x-1.5 bg-[#1a1c24] border border-[#272a39]/60 px-3 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[11px] text-gray-400 font-sans tracking-wide">
          {t.tagline}
        </span>
      </div>

      {/* Right Controls: Dev Server, Guides, Languages */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Workflow Quick indicator */}
        <div className="hidden sm:flex items-center py-1 px-2.5 bg-[#1c2236] border border-cyan-900/40 rounded text-cyan-300 font-mono text-[10px]">
          STAGE: <span className="text-white ml-2 uppercase font-bold text-[10.5px]">{workflowStage}</span>
        </div>

        {/* Japanese / English Toggle Switch */}
        <div className="flex items-center bg-[#1c1d24] border border-[#2d313f] rounded-lg p-0.5 overflow-hidden">
          <button
            onClick={() => setLanguage('jp')}
            type="button"
            className={`cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
              language === 'jp'
                ? 'bg-cyan-500 font-bold text-gray-950 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>JP</span>
            <span className="text-[9px] opacity-80">日本語</span>
          </button>
          <button
            onClick={() => setLanguage('en')}
            type="button"
            className={`cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
              language === 'en'
                ? 'bg-cyan-500 font-bold text-gray-950 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>EN</span>
            <span className="text-[9px] opacity-80">English</span>
          </button>
        </div>

        {/* Clear workspace button */}
        <button
          onClick={resetApp}
          className="p-1.5 hover:bg-rose-950/20 text-rose-400 border border-[#44202d] rounded-lg cursor-pointer transition flex items-center gap-1 font-mono text-[11px]"
          title="Reset rigged workspace"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
}
