import React, { useState } from 'react';
import { Agent } from '../types';
import { Cpu, HardDrive, ShieldCheck, ShieldAlert, Heart, Zap, RefreshCw, Layers, Server, Clock, Terminal, Activity } from 'lucide-react';

interface SystemHealthProps {
  agents: Agent[];
  vpsHealth: any;
  sessions: any;
  cronJobs: any[];
  kanbanTasks: any[];
  onUpdateAgentStatus: (agentId: string, newStatus: 'Online' | 'Offline' | 'Busy') => void;
  onModifyAgentStats: (agentId: string, stats: { cpu: number; memory: number }) => void;
}

export default function SystemHealth({
  agents,
  vpsHealth,
  sessions,
  cronJobs,
  kanbanTasks,
  onUpdateAgentStatus,
  onModifyAgentStats
}: SystemHealthProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState<string | null>(null);

  // Computed indicator of overall health
  const busyCount = agents.filter(a => a.status === 'Busy').length;
  const offlineCount = agents.filter(a => a.status === 'Offline').length;
  const onlineCount = agents.filter(a => a.status === 'Online').length;

  let overallHealth: 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD';
  let healthText = 'ALL COPS SYSTEMS OPTIMAL';
  let healthColorClass = 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20';

  if (offlineCount >= 2) {
    overallHealth = 'CRITICAL';
    healthText = 'CRITICAL SHIELD EXPANSION LOST';
    healthColorClass = 'text-red-400 border-red-500/30 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse';
  } else if (offlineCount > 0 || busyCount >= 3) {
    overallHealth = 'WARNING';
    healthText = 'DEGRADED PERFORMANCE - AGENT RE-DEPLOY REQUIRED';
    healthColorClass = 'text-amber-400 border-amber-500/30 bg-amber-950/20';
  }

  const handleReboot = (agent: Agent) => {
    setIsDiagnosticRunning(agent.id);
    setSelectedAgent(null);
    onUpdateAgentStatus(agent.id, 'Offline');
    
    setTimeout(() => {
      onModifyAgentStats(agent.id, { cpu: 95, memory: 80 });
      onUpdateAgentStatus(agent.id, 'Busy');
      setTimeout(() => {
        onModifyAgentStats(agent.id, { cpu: 15, memory: 35 });
        onUpdateAgentStatus(agent.id, 'Online');
        setIsDiagnosticRunning(null);
      }, 1500);
    }, 1200);
  };

  const handleStatusToggle = (agent: Agent, nextStatus: 'Online' | 'Offline' | 'Busy') => {
    onUpdateAgentStatus(agent.id, nextStatus);
    if (selectedAgent?.id === agent.id) {
      setSelectedAgent({ ...selectedAgent, status: nextStatus });
    }
  };

  return (
    <div className="space-y-6" id="system-health-panel">
      {/* GLOBAL SYSTEM HEALTH BANNER */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${healthColorClass}`}>
        <div className="flex items-center gap-3">
          {overallHealth === 'GOOD' ? (
            <div className="p-2 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="h-6 w-6 stroke-[1.5]" />
            </div>
          ) : (
            <div className={`p-2 rounded-full bg-red-950 border border-red-500/40 text-red-500 ${overallHealth === 'CRITICAL' ? 'animate-bounce' : ''}`}>
              <ShieldAlert className="h-6 w-6 stroke-[1.5]" />
            </div>
          )}
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 font-mono font-bold">
              ORCHESTRATOR DIAGNOSTIC LAYER
            </h2>
            <p className="text-sm font-bold font-mono tracking-tight text-white mt-0.5">
              {healthText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
            <span className="text-slate-400">ONLINE: {onlineCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse" />
            <span className="text-slate-400">BUSY: {busyCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
            <span className="text-slate-400">OFFLINE: {offlineCount}</span>
          </div>
        </div>
      </div>

      {/* REAL VPS HEALTH METRICS */}
      {vpsHealth && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU */}
          <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400">VPS CPU</h4>
            </div>
            <div className="text-3xl font-mono font-bold text-white">{vpsHealth.cpu_percent ?? '--'}%</div>
            <div className="mt-2 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (vpsHealth.cpu_percent ?? 0) > 75 ? 'bg-red-500' : (vpsHealth.cpu_percent ?? 0) > 40 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${vpsHealth.cpu_percent ?? 0}%` }}
              />
            </div>
          </div>

          {/* RAM */}
          <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-4 h-4 text-fuchsia-400" />
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400">VPS RAM</h4>
            </div>
            {vpsHealth.ram ? (
              <>
                <div className="text-3xl font-mono font-bold text-white">{vpsHealth.ram.percent}%</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  {vpsHealth.ram.used_mb}MB / {vpsHealth.ram.total_mb}MB ({vpsHealth.ram.available_mb}MB free)
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      vpsHealth.ram.percent > 80 ? 'bg-red-500' : vpsHealth.ram.percent > 50 ? 'bg-amber-400' : 'bg-fuchsia-400'
                    }`}
                    style={{ width: `${vpsHealth.ram.percent}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="text-lg font-mono text-slate-500">No data</div>
            )}
          </div>

          {/* DISK */}
          <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400">VPS DISK</h4>
            </div>
            {vpsHealth.disk ? (
              <>
                <div className="text-3xl font-mono font-bold text-white">{vpsHealth.disk.percent}%</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  {vpsHealth.disk.used_gb}GB / {vpsHealth.disk.total_gb}GB ({vpsHealth.disk.available_gb}GB free)
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      vpsHealth.disk.percent > 85 ? 'bg-red-500' : vpsHealth.disk.percent > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${vpsHealth.disk.percent}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="text-lg font-mono text-slate-500">No data</div>
            )}
          </div>
        </div>
      )}

      {/* SESSIONS & CRON & KANBAN SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sessions */}
        <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Sessions</h4>
          </div>
          {sessions ? (
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total sessions</span>
                <span className="text-white font-bold">{sessions.session_count}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total messages</span>
                <span className="text-white font-bold">{sessions.message_count}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Input tokens</span>
                <span className="text-cyan-400 font-bold">{sessions.tokens?.input?.toLocaleString() ?? 0}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Output tokens</span>
                <span className="text-amber-400 font-bold">{sessions.tokens?.output?.toLocaleString() ?? 0}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm font-mono text-slate-500">Loading...</div>
          )}
        </div>

        {/* Cron Jobs */}
        <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Cron Jobs ({cronJobs.length})</h4>
          </div>
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
            {cronJobs.length === 0 ? (
              <div className="text-xs font-mono text-slate-500">No cron jobs found</div>
            ) : (
              cronJobs.slice(0, 5).map((job, i) => (
                <div key={i} className="text-[10px] font-mono">
                  <span className="text-cyan-400">{job.schedule}</span>
                  <span className="text-slate-500 ml-1 truncate block">{job.command?.slice(0, 60)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kanban */}
        <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Kanban ({kanbanTasks.length})</h4>
          </div>
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
            {kanbanTasks.length === 0 ? (
              <div className="text-xs font-mono text-slate-500">No kanban tasks</div>
            ) : (
              kanbanTasks.slice(0, 5).map((task, i) => (
                <div key={i} className="text-[10px] font-mono flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    task.status === 'done' ? 'bg-cyan-400' : task.status === 'in_progress' ? 'bg-amber-400' : 'bg-slate-600'
                  }`} />
                  <span className="text-slate-300 truncate">{task.title?.slice(0, 50)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CORE INFRASTRUCTURE BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map(agent => {
          const isSelected = selectedAgent?.id === agent.id;
          const isRebooting = isDiagnosticRunning === agent.id;
          
          let statusBadgeClass = 'text-cyan-400 bg-cyan-950/40 border-cyan-500/20';
          if (agent.status === 'Busy') statusBadgeClass = 'text-amber-400 bg-amber-950/40 border-amber-500/20';
          if (agent.status === 'Offline') statusBadgeClass = 'text-red-400 bg-red-950/40 border-red-500/20';

          return (
            <div
              key={agent.id}
              id={`agent-card-${agent.id}`}
              onClick={() => {
                if (!isRebooting) {
                  setSelectedAgent(agent === selectedAgent ? null : agent);
                }
              }}
              className={`group relative p-5 rounded-xl bg-[#090b0f] border transition-all duration-300 cursor-pointer flex flex-col justify-between h-[230px] select-none hover:-translate-y-0.5 ${
                isSelected 
                  ? 'border-red-500/60 shadow-[0_4px_20px_rgba(239,68,68,0.08)] bg-[#0c0f16]' 
                  : 'border-slate-800 hover:border-slate-700/80 hover:shadow-[0_4px_15px_rgba(6,182,212,0.03)]'
              }`}
            >
              {/* TOP STRIP */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-mono tracking-wide text-white group-hover:text-red-400 transition-colors">
                      {agent.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 font-normal">
                      ID: {agent.id.replace('agent-', '')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 italic line-clamp-1 mt-0.5">
                    {agent.role}
                  </p>
                </div>

                <div className={`px-2 py-0.5 rounded text-[10px] font-mono border tracking-wider uppercase ${statusBadgeClass}`}>
                  {isRebooting ? (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> REBOOTING...
                    </span>
                  ) : (
                    agent.status
                  )}
                </div>
              </div>

              {/* CORE METRICS */}
              <div className="space-y-3.5 my-4">
                {/* CPU PROGRESS bar */}
                <div>
                  <div className="flex items-center justify-between font-mono text-[10px] mb-1 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-slate-500" /> CPU USAGE
                    </span>
                    <span className={agent.cpu > 75 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                      {agent.cpu}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        agent.cpu > 75 
                          ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]' 
                          : agent.cpu > 40 
                            ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                            : 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]'
                      }`}
                      style={{ width: `${agent.cpu}%` }}
                    />
                  </div>
                </div>

                {/* MEMORY PROGRESS bar */}
                <div>
                  <div className="flex items-center justify-between font-mono text-[10px] mb-1 text-slate-400">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-500" /> RAM COMMITTED
                    </span>
                    <span className={agent.memory > 80 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                      {agent.memory}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        agent.memory > 80 
                          ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]' 
                          : agent.memory > 50 
                            ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                            : 'bg-fuchsia-400 shadow-[0_0_6px_rgba(217,70,239,0.5)]'
                      }`}
                      style={{ width: `${agent.memory}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER VALUES */}
              <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-900">
                <div className="flex items-center gap-1">
                  <span className="text-slate-600">UP:</span>
                  <span className="text-slate-400">{agent.uptime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className={`w-3.5 h-3.5 text-center transition-colors duration-300 ${agent.status === 'Offline' ? 'text-slate-700' : 'text-red-500 fill-red-500/20 text-center scale-100 animate-pulse'}`} />
                  <span className="text-slate-400 italic">{agent.lastHeartbeat}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK DRAWER FOR SELECTED AGENT */}
      {selectedAgent && (
        <div className="p-5 rounded-xl border border-red-500/20 bg-[#0d0f15] shadow-2xl relative transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          {/* Close button */}
          <button
            onClick={() => setSelectedAgent(null)}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 text-sm font-mono cursor-pointer"
          >
            [CLOSE]
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1 md:max-w-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <h4 className="text-lg font-bold font-mono tracking-wide text-white">
                  Agent Console Control: <span className="text-red-400">{selectedAgent.name}</span>
                </h4>
              </div>
              <p className="text-sm text-slate-400">
                {selectedAgent.description}
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-2 flex flex-wrap gap-4">
                <span>VIRTUAL CHASSES ID: <span className="text-cyan-400">0x{selectedAgent.id.charCodeAt(6).toString(16).toUpperCase()}..</span></span>
                <span>STATUS CODE: <span className="text-slate-300 uppercase">{selectedAgent.status}</span></span>
                <span>UPTIME VALUE: <span className="text-slate-300">{selectedAgent.uptime}</span></span>
                {selectedAgent.model && <span>MODEL: <span className="text-amber-400">{selectedAgent.model}</span></span>}
                {selectedAgent.totalLogs != null && <span>LOGS: <span className="text-cyan-400">{selectedAgent.totalLogs}</span> (<span className="text-teal-400">{selectedAgent.completed}C</span>/<span className="text-red-400">{selectedAgent.failed}F</span>)</span>}
                {selectedAgent.lastTask && <span className="block w-full mt-1 text-slate-400 italic truncate">LAST: {selectedAgent.lastTask}</span>}
              </div>
            </div>

            {/* ACTION TRIGGERS */}
            <div className="flex items-center gap-3.5 flex-wrap">
              <button
                onClick={() => handleReboot(selectedAgent)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase border border-amber-500/40 text-amber-500 bg-amber-950/20 hover:bg-amber-950/40 rounded transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                title="Restart this virtual agent process completely"
              >
                <RefreshCw className="w-3.5 h-3.5" /> REBOOT CONTAINER
              </button>

              <div className="flex border border-slate-700/80 rounded overflow-hidden">
                {(['Online', 'Busy', 'Offline'] as const).map(badge => {
                  const isActive = selectedAgent.status === badge;
                  let colorClass = 'bg-[#0d1017] text-slate-500';
                  if (isActive) {
                    if (badge === 'Online') colorClass = 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30';
                    if (badge === 'Busy') colorClass = 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30';
                    if (badge === 'Offline') colorClass = 'bg-red-500/20 text-red-400 font-bold border border-red-500/30';
                  }

                  return (
                    <button
                      key={badge}
                      id={`agent-state-${selectedAgent.id}-${badge.toLowerCase()}`}
                      onClick={() => handleStatusToggle(selectedAgent, badge)}
                      className={`px-3.5 py-1.5 text-xs font-mono transition-all uppercase cursor-pointer ${colorClass}`}
                      title={`Manually set virtual agent status to ${badge}`}
                    >
                      {badge}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
