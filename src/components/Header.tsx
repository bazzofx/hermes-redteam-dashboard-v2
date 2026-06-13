import React, { useState } from 'react';
import { Shield, RefreshCw, Clock, Radio, Power } from 'lucide-react';

interface HeaderProps {
  activeEngagement: string;
  missionStatus: 'ACTIVE' | 'PAUSED' | 'COMPLETE';
  setMissionStatus: (status: 'ACTIVE' | 'PAUSED' | 'COMPLETE') => void;
  lastUpdated: string;
  onRefresh: () => void;
}

export default function Header({
  activeEngagement,
  missionStatus,
  setMissionStatus,
  lastUpdated,
  onRefresh
}: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="border-b border-red-500/20 bg-[#08090d]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-50 shadow-[0_1px_15px_rgba(239,68,68,0.05)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* LOGO & TITLE */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-red-600 via-amber-500 to-cyan-500 opacity-60 blur animate-pulse" />
            <div className="relative flex items-center justify-center p-2 rounded-lg bg-[#0a0c10] border border-red-500/40 text-red-500">
              <Shield className="h-6 w-6 stroke-[1.5]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wider text-slate-100 font-mono">
                AISTUDIO <span className="text-red-500">RED-TEAM</span>
              </h1>
              <span className="text-[10px] tracking-widest px-1.5 py-0.5 rounded border border-red-500/30 bg-red-950/20 text-red-400 font-mono font-semibold animate-pulse">
                v2.1.0-COPS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              COORDINATED BY ORCHESTRATOR <span className="text-amber-400 font-semibold">"MORPHEUS"</span>
            </p>
          </div>
        </div>

        {/* MID-PORT: TARGET DETAIL */}
        <div className="flex flex-wrap items-center gap-4 bg-[#0d0e14] border border-slate-800/80 px-4 py-2.5 rounded-lg select-all">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-400 font-bold animate-ping-slow" />
            <span className="text-xs uppercase text-slate-400 font-mono font-medium">Active Engagement:</span>
          </div>
          <span className="text-sm text-cyan-400 font-mono font-bold tracking-tight">
            {activeEngagement}
          </span>
        </div>

        {/* RIGHT ACTION ROW */}
        <div className="flex items-center flex-wrap gap-3.5">
          {/* CAMPAIGN STATUS CONTROL */}
          <div className="flex items-center gap-1.5 bg-[#0d0e14] border border-slate-800/80 p-1 rounded-md">
            {(['ACTIVE', 'PAUSED', 'COMPLETE'] as const).map(status => {
              const isActive = missionStatus === status;
              let style = 'text-slate-500 hover:text-slate-300';
              if (isActive) {
                if (status === 'ACTIVE') style = 'bg-red-950/40 border border-red-500/40 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)] font-bold';
                if (status === 'PAUSED') style = 'bg-amber-950/40 border border-amber-500/40 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)] font-bold';
                if (status === 'COMPLETE') style = 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)] font-bold';
              }
              return (
                <button
                  key={status}
                  id={`status-badge-${status.toLowerCase()}`}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono transition-all uppercase tracking-wider cursor-pointer ${style}`}
                  onClick={() => setMissionStatus(status)}
                  title={`Set status to ${status}`}
                >
                  {status}
                </button>
              );
            })}
          </div>

          {/* TIMESTAMP */}
          <div className="flex items-center gap-2 text-slate-400 font-mono text-xs bg-[#0d0e14] px-3 py-2 rounded-lg border border-slate-800/80">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">CYCLE:</span>
            <span className="text-slate-300 font-mono">{lastUpdated}</span>
          </div>

          {/* INTERACTIVE MANUAL REFRESH */}
          <button
            id="global-payload-refresh"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 bg-red-950/20 active:bg-red-950/40 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-all font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50"
            title="Slightly mutate operational variables and feed simulation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>MUTATE STATE</span>
          </button>
        </div>
      </div>
    </header>
  );
}
