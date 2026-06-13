import React, { useState, useEffect, useRef } from 'react';
import { MorpheusCommand, MorpheusState } from '../types';
import { Terminal, Send, Clock, PlayCircle, HelpCircle, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

interface MorpheusCommandCenterProps {
  commands: MorpheusCommand[];
  onCommandSubmit: (cmdText: string) => void;
  morpheusState: MorpheusState;
  setMorpheusState: (state: MorpheusState) => void;
}

export default function MorpheusCommandCenter({
  commands,
  onCommandSubmit,
  morpheusState,
  setMorpheusState
}: MorpheusCommandCenterProps) {
  const [inputText, setInputText] = useState('');
  const [suggestedCommands, setSuggestedCommands] = useState([
    { trigger: '/redteam scan target.corp', desc: 'Scan target network structure' },
    { trigger: '/redteam exploit target:4443', desc: 'Deploy CVE exploit parameters to Breach' },
    { trigger: '/cve check CVE-2024-44321', desc: 'Fetch latest CVE threat report index' },
    { trigger: '/status', desc: 'Print active infrastructure nodes' },
    { trigger: '/logbook summary', desc: 'Request Logbook checksum auditing metrics' },
    { trigger: '/pause', desc: 'Freeze pipeline events' }
  ]);

  const outputRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of command history
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [commands]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onCommandSubmit(inputText.trim());
    setInputText('');
  };

  const handleSuggestedClick = (commandText: string) => {
    setInputText(commandText);
  };

  const getStateColor = (state: MorpheusState) => {
    switch (state) {
      case 'Listening':
        return 'text-cyan-400 bg-cyan-950/20 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]';
      case 'Processing':
        return 'text-amber-550 bg-amber-950/20 border-amber-500/40 animate-pulse';
      case 'Awaiting Handoff':
        return 'text-fuchsia-400 bg-fuchsia-950/20 border-fuchsia-500/30';
      case 'Escalated':
        return 'text-red-500 bg-red-950/20 border-red-500/30 font-bold shadow-[0_0_12px_rgba(239,68,68,0.2)] animate-bounce';
    }
  };

  return (
    <div className="space-y-6" id="morpheus-console-range">
      {/* MORPHEUS METADATA AND STATE CHANGER */}
      <div className="p-4.5 bg-[#090b0f] border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/40 text-red-500">
            <Cpu className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-slate-500">
              COORDINATING COGNITIVE LAYER
            </h3>
            <h2 className="text-md font-extrabold font-mono text-white mt-0.5">
              MORPHEUS-9000 ORCHESTRATOR
            </h2>
          </div>
        </div>

        {/* STATE INDICATOR CONTROLS */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase">CORECT STATE MACHINE:</span>
          
          <div className="flex border border-slate-800 rounded overflow-hidden p-0.5">
            {(['Listening', 'Processing', 'Awaiting Handoff', 'Escalated'] as const).map(state => {
              const isActive = morpheusState === state;
              const displayStyle = isActive 
                ? getStateColor(state)
                : 'text-slate-500 hover:text-slate-300';

              return (
                <button
                  key={state}
                  id={`morpheus-state-selector-${state.toLowerCase().replace(' ', '-')}`}
                  className={`px-3 py-1 text-[10px] font-mono transition-all rounded uppercase cursor-pointer ${displayStyle}`}
                  onClick={() => setMorpheusState(state)}
                  title={`Manually transition Morpheus State to ${state}`}
                >
                  {state}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLOURED CLI TERMINAL BOX */}
        <div className="lg:col-span-2 bg-[#050608] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[480px]">
          {/* CLI Top title bar */}
          <div className="bg-[#090a0f] border-b border-slate-850 px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 select-none">
            <span className="flex items-center gap-1 text-slate-400 font-semibold uppercase">
              <Terminal className="w-3.5 h-3.5 text-red-500" /> morpheus@cops-orchestrator:~
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="w-2 h-2 rounded-full bg-teal-500" />
            </div>
          </div>

          {/* Terminal Command logs outputs */}
          <div 
            ref={outputRef}
            className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs select-text text-slate-300 leading-relaxed scrollbar-thin"
          >
            <div className="text-slate-500 border-b border-slate-900/40 pb-2 text-[10px] uppercase">
              COPS Red-Team Sandbox Pipeline active. Type "/status" or click recommendations.
            </div>

            {commands.map((cmd) => {
              const cmdDate = cmd.timestamp.includes('T') ? new Date(cmd.timestamp) : new Date();
              const formattedTime = cmdDate.toLocaleTimeString();

              return (
                <div key={cmd.id} className="space-y-1.5" id={`terminal-cmd-${cmd.id}`}>
                  {/* Prompt Line */}
                  <div className="flex items-start gap-2 select-none">
                    <span className="text-red-500 font-bold">$</span>
                    <span className="text-cyan-400 font-semibold">{cmd.command}</span>
                    <span className="text-[10px] text-slate-600 ml-auto font-normal">
                      {formattedTime}
                    </span>
                  </div>

                  {/* Response Text block */}
                  <div className="pl-4 border-l border-slate-800 text-slate-300 whitespace-pre-wrap select-all font-mono leading-relaxed pb-2 text-xs bg-[#090a10]/20 p-2.5 rounded border border-slate-900/30">
                    {cmd.response}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CLI Input Form */}
          <form 
            onSubmit={handleFormSubmit} 
            className="border-t border-slate-850 bg-[#090a10] px-4 py-3 flex gap-2"
          >
            <span className="text-red-500 font-bold self-center font-mono font-extrabold select-none pl-1">$</span>
            <input
              type="text"
              id="cli-command-input"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Query Morpheus or trigger preset triggers (e.g. /status)..."
              className="flex-1 bg-transparent text-white border-none outline-none font-mono text-xs select-all placeholder-slate-700"
            />
            <button
              type="submit"
              id="cli-command-btn"
              className="p-1 px-3 bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 text-red-400 hover:text-red-300 rounded font-mono text-xs uppercase font-bold cursor-pointer transition-all"
            >
              Execute
            </button>
          </form>
        </div>

        {/* CLIC RECOMMEND WORKSHOP PANEL */}
        <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.15)] flex flex-col h-[480px] justify-between">
          <div>
            <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 pb-3 border-b border-slate-900 flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-cyan-400" /> Presets commands
            </h4>

            <div className="space-y-2 mt-4 max-h-[340px] overflow-y-auto pr-1">
              {suggestedCommands.map((item, idx) => (
                <button
                  key={idx}
                  id={`preset-cmd-${idx}`}
                  onClick={() => handleSuggestedClick(item.trigger)}
                  className="w-full text-left p-2.5 rounded-lg bg-[#07080c] hover:bg-[#0c0d13] border border-slate-850/80 hover:border-slate-800 transition-all font-mono select-none cursor-pointer flex flex-col group"
                >
                  <div className="text-[11px] text-cyan-400 font-bold group-hover:text-red-400 transition-colors">
                    {item.trigger}
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-900 text-[10px] font-mono text-slate-500 flex items-center gap-1.5 justify-center">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Interactive Morpheus API Interface</span>
          </div>
        </div>
      </div>
    </div>
  );
}
