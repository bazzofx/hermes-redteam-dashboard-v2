import React, { useState } from 'react';
import { PipelinePhase, PhaseStatus } from '../types';
import { ShieldAlert, Play, Pause, RotateCcw, Send, CheckCircle2, AlertTriangle, Clock, Terminal, User, Users } from 'lucide-react';

interface PipelineFlowProps {
  phases: PipelinePhase[];
  onPhaseClick: (phase: PipelinePhase) => void;
  onDeployTarget: (target: string) => void;
  onStartPipeline: () => void;
  onPausePipeline: () => void;
  onResumePipeline: () => void;
  onResetPipeline: () => void;
  pipelineState: 'running' | 'paused' | 'stopped';
}

export default function PipelineFlow({
  phases,
  onPhaseClick,
  onDeployTarget,
  onStartPipeline,
  onPausePipeline,
  onResumePipeline,
  onResetPipeline,
  pipelineState
}: PipelineFlowProps) {
  const [targetInput, setTargetInput] = useState('');
  const [activeDetailsId, setActiveDetailsId] = useState<string | null>(phases[2]?.id || null); // Def to Breach

  const handleDeploySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) return;
    onDeployTarget(targetInput.trim());
    setTargetInput('');
  };

  const selectedPhaseObj = phases.find(p => p.id === activeDetailsId);

  const getStatusIconAndColor = (status: PhaseStatus) => {
    switch (status) {
      case 'Complete':
        return {
          icon: CheckCircle2,
          color: 'text-cyan-400 border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.15)] bg-cyan-950/20',
          line: 'bg-cyan-500/30'
        };
      case 'Active':
        return {
          icon: Terminal,
          color: 'text-red-400 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] bg-red-950/20 ring-1 ring-red-500/30 animate-pulse',
          line: 'bg-slate-800'
        };
      case 'Failed':
        return {
          icon: ShieldAlert,
          color: 'text-red-500 border-red-600 bg-red-950/30 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse',
          line: 'bg-slate-800'
        };
      case 'Pending':
        return {
          icon: Clock,
          color: 'text-slate-600 border-slate-800 bg-[#07080c]',
          line: 'bg-slate-900'
        };
    }
  };

  return (
    <div className="space-y-6" id="pipeline-visualization-flow">
      {/* SECTION 1: OPERATION FORM AND SYSTEM CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DEPLOY CAMPAIGN FROM PORT */}
        <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.1)] lg:col-span-2">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-red-500" /> DEPLOY NEW RED-TEAM ENGAGEMENT
          </h3>
          
          <form onSubmit={handleDeploySubmit} className="flex gap-2.5">
            <input
              type="text"
              id="input-deployment-target"
              placeholder="Enter endpoint address (e.g. demo.corp-gateway.net:8443)"
              value={targetInput}
              onChange={e => setTargetInput(e.target.value)}
              className="flex-1 bg-[#07080c] text-white border border-slate-800 rounded-lg px-4 py-2 text-xs font-mono outline-none focus:border-red-500 placeholder-slate-600"
            />
            <button
              type="submit"
              id="btn-deploy-target"
              className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white border border-red-500/30 hover:border-red-500/50 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.15)]"
              title="Launch Morpheus pipeline mapping this specific server domain"
            >
              <Send className="w-3.5 h-3.5" /> DEPLOY WORKLOAD
            </button>
          </form>
          <p className="text-[10px] font-mono text-slate-500 mt-2">
            * This executes automated OSINT, vulnerability matching, and sandbox payloads sequentially.
          </p>
        </div>

        {/* PIPELINE LIFE SYSTEM CONTROLS */}
        <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.1)] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Pipeline Control Console
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono font-semibold uppercase">STATE:</span>
              <span className={`text-xs font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                pipelineState === 'running' 
                  ? 'text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 animate-pulse' 
                  : pipelineState === 'paused' 
                    ? 'text-amber-500 bg-amber-950/10 border border-amber-500/20' 
                    : 'text-slate-500 bg-slate-900 border border-slate-800'
              }`}>
                {pipelineState}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-slate-900">
            {pipelineState !== 'running' ? (
              <button
                id="btn-trigger-play"
                onClick={pipelineState === 'paused' ? onResumePipeline : onStartPipeline}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-mono border border-cyan-500/30 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 rounded transition-all cursor-pointer font-bold"
                title="Initialize or resume the automated orchestrator crawl"
              >
                <Play className="w-3.5 h-3.5 fill-cyan-400/10" /> START/RESUME
              </button>
            ) : (
              <button
                id="btn-trigger-pause"
                onClick={onPausePipeline}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-mono border border-amber-500/30 text-amber-500 bg-amber-950/20 hover:bg-amber-950/40 rounded transition-all cursor-pointer font-bold"
                title="Temporarily lock all active scanner and payload actions"
              >
                <Pause className="w-3.5 h-3.5 fill-amber-500/10" /> PAUSE AGENTS
              </button>
            )}

            <button
              id="btn-trigger-reset"
              onClick={onResetPipeline}
              className="px-3 py-2 text-xs font-mono border border-slate-700 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded transition-all cursor-pointer"
              title="Reset target variables and restart logs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: MAP INTERACTIVE timeline FLOW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: THE FLOWCHART NODE GRAPH */}
        <div className="lg:col-span-2 bg-[#090b0f] border border-slate-800 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 mb-6">
            Cyber Attack Pipeline Phases Flowchart
          </h4>

          <div className="space-y-4 relative pl-3.5">
            {/* Horizontal or Vertical flow path connector lines */}
            <div className="absolute left-[34px] top-6 bottom-6 w-0.5 bg-slate-800/80 z-0" />

            {phases.map((phase, idx) => {
              const info = getStatusIconAndColor(phase.status);
              const IconComponent = info.icon;
              const isSelected = activeDetailsId === phase.id;

              return (
                <div key={phase.id} className="relative z-10">
                  <div
                    id={`pipeline-node-${phase.id}`}
                    onClick={() => {
                      setActiveDetailsId(phase.id);
                      onPhaseClick(phase);
                    }}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0f121a] border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.06)]'
                        : 'bg-[#07080d]/60 border-slate-850 hover:border-slate-800 hover:bg-[#0c0d13]/50'
                    }`}
                  >
                    {/* Circle identifier */}
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center select-none ${info.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Meta info labels */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                        <span>STAGE 0{idx + 1}</span>
                        <span className="uppercase text-[9px] tracking-widest font-semibold px-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
                          {phase.agentRole}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <h4 className="text-sm font-bold font-mono text-slate-100">{phase.name}</h4>
                        <span className={`text-[9px] px-1 rounded uppercase font-semibold border ${
                          phase.status === 'Complete' 
                            ? 'text-cyan-400 border-cyan-500/20 bg-cyan-950/10' 
                            : phase.status === 'Active' 
                              ? 'text-red-400 border-red-500/20 bg-red-950/10' 
                              : 'text-slate-500 border-slate-800 bg-slate-900/50'
                        }`}>
                          {phase.status}
                        </span>
                      </div>
                    </div>

                    {/* Click Indicator */}
                    <div className="text-[10px] font-mono text-slate-600 group-hover:text-slate-400 border-l border-slate-900 pl-3">
                      [VIEW INTEL]
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL INTEL DRAWER & EXPLOIT FINDINGS */}
        <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          {selectedPhaseObj ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-slate-900">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">CYBER ASSIGNMENT DETAIL PANEL</span>
                <h4 className="text-lg font-bold font-mono text-white mt-0.5">
                  {selectedPhaseObj.name}
                </h4>
                <div className="flex items-center justify-between mt-2.5 font-mono text-[10px]">
                  <span className="text-slate-400">DEPLOYED TO: <span className="text-cyan-400 uppercase">{selectedPhaseObj.agentRole} Unit</span></span>
                  <span className="text-slate-500">CYCLE: {selectedPhaseObj.completedAt ? 'FINISH' : 'MONITORING'}</span>
                </div>
              </div>

              {/* TIMESTAMPS */}
              <div className="p-3 bg-[#07080c] rounded border border-slate-900 font-mono text-[11px] space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>LAST ACTIVITY:</span>
                  <span className="text-slate-200 font-semibold">{new Date(selectedPhaseObj.updatedAt).toLocaleTimeString()}</span>
                </div>
                {selectedPhaseObj.completedAt && (
                  <div className="flex justify-between">
                    <span>COMPLETED AT:</span>
                    <span className="text-cyan-400 font-semibold">{new Date(selectedPhaseObj.completedAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* INTELLIGENCE AND FINDINGS KEYLIST */}
              <div className="space-y-2">
                <span className="text-slate-500 font-mono text-[10px] uppercase block">Dossier Discoveries ({selectedPhaseObj.findings.length}):</span>
                
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedPhaseObj.findings.map((finding, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-lg bg-[#0c0d12] border border-slate-850/80 text-xs text-slate-300 font-sans"
                    >
                      <div className="font-mono text-[9px] text-red-500 font-bold mb-1">DISCOVERY #{idx + 1}</div>
                      {finding}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 font-mono text-xs">
              CHOOSE A WORKFLOW NODE FROM THE LEFT FLOWCHART TO ANALYZE DISCOV PROTOCOLS.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
