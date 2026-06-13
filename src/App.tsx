import React, { useState, useEffect, useRef } from 'react';
import { Agent, Task, LogEntry, CveEntry, PipelinePhase, MorpheusCommand, MorpheusState } from './types';
import SystemHealth from './components/SystemHealth';
import AgentTasks from './components/AgentTasks';
import LogViewer from './components/LogViewer';
import CveQueue from './components/CveQueue';
import PipelineFlow from './components/PipelineFlow';
import MorpheusCommandCenter from './components/MorpheusCommandCenter';
import { Shield, Radio, Clock, ShieldAlert, AlertTriangle, RefreshCw, BadgeInfo, Cpu, Terminal, GitBranch, Server, ListFilter, History, SearchCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Live Configuration
const API_BASE_URL = (window as any).API_BASE_URL || window.location.origin;

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'pipeline' | 'servers' | 'engagement' | 'logs' | 'cve' | 'morpheus'>('pipeline');

  // Core App State (Synchronized from backend API)
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cves, setCves] = useState<CveEntry[]>([]);
  const [pipelinePhases, setPipelinePhases] = useState<PipelinePhase[]>([]);
  const [morpheusCommands, setMorpheusCommands] = useState<MorpheusCommand[]>([]);
  const [morpheusState, setMorpheusState] = useState<MorpheusState>('Listening');

  // Diagnostic states
  const [activeTarget, setActiveTarget] = useState('staging.target-banking-demo.com:4443');
  const [pipelineState, setPipelineState] = useState<'running' | 'paused' | 'stopped'>('running');
  const [currentTime, setCurrentTime] = useState('00:00:00 UTC');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Toasts Manager
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'warn' | 'info' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'warn' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // 1. Fetch initial snapshot from real Express API endpoints
  const fetchAllData = async (isQuiet = false) => {
    if (!isQuiet) {
      setIsLoading(true);
      setIsError(false);
    }
    try {
      const [rAgents, rTasks, rLogs, rCves, rPipeline, rHistory] = await Promise.all([
        fetch(`${API_BASE_URL}/api/agents/status`).then(res => {
          if (!res.ok) throw new Error('Agents route failed');
          return res.json();
        }),
        fetch(`${API_BASE_URL}/api/agents/tasks`).then(res => {
          if (!res.ok) throw new Error('Tasks route failed');
          return res.json();
        }),
        fetch(`${API_BASE_URL}/api/logs`).then(res => {
          if (!res.ok) throw new Error('Logs route failed');
          return res.json();
        }),
        fetch(`${API_BASE_URL}/api/cve/queue`).then(res => {
          if (!res.ok) throw new Error('CVE queue route failed');
          return res.json();
        }),
        fetch(`${API_BASE_URL}/api/pipeline/status`).then(res => {
          if (!res.ok) throw new Error('Pipeline status route failed');
          return res.json();
        }),
        fetch(`${API_BASE_URL}/api/command/history`).then(res => {
          if (!res.ok) throw new Error('Command history route failed');
          return res.json();
        })
      ]);

      setAgents(rAgents);
      setTasks(rTasks);
      setLogs(rLogs);
      setCves(rCves);
      setPipelinePhases(rPipeline.phases);
      setPipelineState(rPipeline.state);
      setActiveTarget(rPipeline.activeTarget);
      setMorpheusCommands(rHistory);

      // Compute Morpheus Cognitive state based on running conditions
      if (rPipeline.state === 'paused') {
        setMorpheusState('Awaiting Handoff');
      } else {
        setMorpheusState('Listening');
      }

      setIsError(false);
    } catch (err) {
      console.error('Error fetching deep snapshot package payload:', err);
      if (!isQuiet) {
        setIsError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Persistent WebSocket Client with Exponential Backoff Reconnection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectDelay = 1000;
    const maxReconnectDelay = 30000;

    const establishWS = () => {
      setConnectionStatus('connecting');
      // Convert URL structure safely from config base (handling both ws:// & wss:// schemas)
      const parsedUrl = API_BASE_URL.replace(/^http/, 'ws');
      const wsTarget = `${parsedUrl}/ws/events`;
      console.log('Orchestrator WebSocket: attempting connection to ->', wsTarget);

      ws = new WebSocket(wsTarget);

      ws.onopen = () => {
        console.log('Orchestrator WebSocket status: ESTABLISHED. Realtime claims active.');
        setConnectionStatus('connected');
        reconnectDelay = 1000; // Reset reconnection delay state
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          switch (payload.type) {
            case 'INIT':
              if (payload.agents) setAgents(payload.agents);
              if (payload.pipelineState) setPipelineState(payload.pipelineState);
              if (payload.activeTarget) setActiveTarget(payload.activeTarget);
              break;
            case 'METRIC_TICK':
              // Dynamic CPU/Memory metrics updates (keeps interface pulsing realistically)
              if (payload.agents) setAgents(payload.agents);
              break;
            case 'AGENT_STATUS_CHANGED':
              // Sinks changes from agent reboots or manual overrides
              if (payload.agents) setAgents(payload.agents);
              if (payload.logs) setLogs(payload.logs);
              addToast(`Agent status updated.`, 'info');
              break;
            case 'TASK_MUTATED':
              // Sinks changes from subroutine completed or terminated
              if (payload.tasks) setTasks(payload.tasks);
              if (payload.logs) setLogs(payload.logs);
              break;
            case 'PIPELINE_MUTATED':
              // Sinks target redteam scanning changes, CVE dispatches, etc.
              if (payload.pipelineState) setPipelineState(payload.pipelineState);
              if (payload.activeTarget) setActiveTarget(payload.activeTarget);
              if (payload.pipelinePhases) setPipelinePhases(payload.pipelinePhases);
              if (payload.logs) setLogs(payload.logs);
              if (payload.cves) setCves(payload.cves);
              if (payload.agents) setAgents(payload.agents);
              if (payload.tasks) setTasks(payload.tasks);
              break;
            case 'RESET_TRIGGERED':
              // System wide parameters resets
              if (payload.pipelineState) setPipelineState(payload.pipelineState);
              if (payload.activeTarget) setActiveTarget(payload.activeTarget);
              if (payload.pipelinePhases) setPipelinePhases(payload.pipelinePhases);
              if (payload.logs) setLogs(payload.logs);
              addToast(`System variables successfully reset to staging defaults.`, 'warn');
              break;
            case 'NEW_LOG':
              if (payload.log) {
                setLogs(prev => {
                  if (prev.some(inner => inner.id === payload.log.id)) return prev;
                  return [payload.log, ...prev];
                });
              }
              break;
            default:
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket streaming frame:', err);
        }
      };

      ws.onclose = () => {
        console.warn('Orchestrator WebSocket: CLOSED. Activating retry backoff sequence.');
        setConnectionStatus('disconnected');
        reconnectDelay = Math.min(reconnectDelay * 1.5, maxReconnectDelay);
        reconnectTimeout = setTimeout(establishWS, reconnectDelay);
      };

      ws.onerror = (err) => {
        console.error('Orchestrator WebSocket error encountered:', err);
        ws?.close();
      };
    };

    establishWS();

    return () => {
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // 3. Fallback database syncer polling every 10 seconds & UTC Clock running every 1 second
  useEffect(() => {
    // Perform initial deep fetch
    fetchAllData();

    // UTC Clock
    const updateUtcClock = () => {
      const now = new Date();
      const hStr = String(now.getUTCHours()).padStart(2, '0');
      const mStr = String(now.getUTCMinutes()).padStart(2, '0');
      const sStr = String(now.getUTCSeconds()).padStart(2, '0');
      setCurrentTime(`${hStr}:${mStr}:${sStr} UTC`);
    };
    updateUtcClock();
    const clockInterval = setInterval(updateUtcClock, 1000);

    // 10 seconds query interval poller (secures backup states sync if WebSocket suffers proxy blockages)
    const syncInterval = setInterval(() => {
      fetchAllData(true);
    }, 10000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(syncInterval);
    };
  }, []);

  // --- BUSINESS ACTION HANDLERS ---

  // PUT /api/agent/{id}/status -> updates status cleanly
  const handleUpdateAgentStatus = async (agentId: string, statusText: 'Online' | 'Offline' | 'Busy') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/${agentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusText })
      });
      if (res.ok) {
        addToast(`Dispatched container state change directive: ${statusText}`, 'success');
      } else {
        addToast(`Failed to update agent status.`, 'error');
      }
    } catch {
      addToast(`Action failed: Network Error.`, 'error');
    }
  };

  // Local metric adjustments (Metrics ticks are broadcasted automatically from server, so this is left quiet)
  const handleModifyAgentStats = () => {};

  // POST /api/tasks -> injects new assignment
  const handleAddTask = async (newTask: Omit<Task, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: newTask.agentId,
          title: newTask.title,
          priority: newTask.priority,
          assignedBy: 'User Admin'
        })
      });
      if (res.ok) {
        addToast(`Subroutine successfully injected to queue.`, 'success');
      } else {
        addToast(`Failed to inject subroutine.`, 'error');
      }
    } catch {
      addToast(`Action failed. Check connections.`, 'error');
    }
  };

  // POST /api/task/{id}/complete or /terminate -> mutates database status
  const handleUpdateTaskStatus = async (taskId: string, statusValue: Task['status']) => {
    try {
      const uri = statusValue === 'Complete' ? 'complete' : 'terminate';
      const res = await fetch(`${API_BASE_URL}/api/task/${taskId}/${uri}`, {
        method: 'POST'
      });
      if (res.ok) {
        addToast(`Subroutine marked as ${statusValue}.`, 'success');
      } else {
        addToast(`Mutation rejected by server.`, 'error');
      }
    } catch {
      addToast(`Mutation failed. Network error.`, 'error');
    }
  };

  // Local filter purge fallback
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    addToast('Task record removed from localized layout view.', 'info');
  };

  // Tab 5: Triggering CVE exploitation -> dispatches '/breach use {cveId}' to Morpheus CLI
  const handleSendCveToBreach = async (cve: CveEntry) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `/breach use ${cve.cveId}` })
      });
      if (res.ok) {
        const payload = await res.json();
        addToast(`Dispatched trigger for ${cve.cveId} to Breach Agent!`, 'success');
        
        // Optimistically feed the Morpheus Commands console as well
        setMorpheusCommands(prev => [
          {
            id: `cmd-breach-${Date.now()}`,
            timestamp: new Date().toISOString(),
            command: `/breach use ${cve.cveId}`,
            initiatedBy: 'User',
            response: payload.text,
            status: payload.status === 'success' ? 'success' : 'error'
          },
          ...prev
        ]);
        if (payload.morpheusState) {
          setMorpheusState(payload.morpheusState);
        }
      } else {
        addToast(`Exploit trigger rejected by central command.`, 'error');
      }
    } catch {
      addToast(`Action failed. Network exception.`, 'error');
    }
  };

  // Tab 6: CLI Submit parser over POST /api/command
  const handleCommandSubmit = async (commandString: string) => {
    try {
      setMorpheusState('Processing');
      // Append temporary loading placeholder history entry
      const tempId = `cmd-user-${Date.now()}`;
      setMorpheusCommands(prev => [
        {
          id: tempId,
          timestamp: new Date().toISOString(),
          command: commandString,
          initiatedBy: 'User',
          response: 'ACQUIRING DIRECTIVES... PIPELINE TRANSLATION ACTIVE',
          status: 'success'
        },
        ...prev
      ]);

      const res = await fetch(`${API_BASE_URL}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandString })
      });

      if (res.ok) {
        const payload = await res.json();
        
        // Match the placeholder ID and compile actual responses
        setMorpheusCommands(prev => prev.map(cmd => {
          if (cmd.id === tempId) {
            return {
              ...cmd,
              response: payload.text,
              status: payload.status === 'success' ? 'success' : 'error'
            };
          }
          return cmd;
        }));

        if (payload.morpheusState) {
          setMorpheusState(payload.morpheusState);
        }
        addToast('Morpheus response synchronized', 'success');
      } else {
        addToast('Command execution rejected', 'error');
        setMorpheusState('Listening');
      }
    } catch {
      addToast('Morpheus routing failure.', 'error');
      setMorpheusState('Listening');
    }
  };

  // Tab 1: Pipeline Control callbacks over POST /api/command triggers
  const handleDeployTarget = async (hostUrl: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `/redteam scan ${hostUrl}` })
      });
      if (res.ok) {
        addToast(`Campaign routed targeting: http://${hostUrl}`, 'success');
        setActiveTab('pipeline');
      }
    } catch {
      addToast(`Failed to deploy target campaign.`, 'error');
    }
  };

  const handleStartPipeline = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `/resume` })
      });
      addToast('Payload progression started.', 'success');
    } catch {
      addToast('Action failed.', 'error');
    }
  };

  const handlePausePipeline = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `/pause` })
      });
      addToast('Orchestration loop PAUSED.', 'warn');
    } catch {
      addToast('Action failed.', 'error');
    }
  };

  const handleResumePipeline = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `/resume` })
      });
      addToast('Orchestration loop RESUMED.', 'success');
    } catch {
      addToast('Action failed.', 'error');
    }
  };

  const handleResetPipeline = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `/reset` })
      });
      addToast('Operational memories reset.', 'info');
    } catch {
      addToast('Action failed.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#e2e8f0] flex flex-col font-sans select-none antialiased">
      
      {/* 1. FIXED TOP NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0c0e14] border-b border-red-500/15 backdrop-blur-md px-6 flex items-center justify-between z-50">
        
        {/* LEFT SECTION: Brand Mark */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-violet-500/30 bg-violet-950/20 shadow-[0_0_8px_rgba(139,92,246,0.2)]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 select-none">
            <span className="text-sm font-black tracking-widest uppercase text-white font-mono">
              Hermes
            </span>
            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest tracking-tighter opacity-70">
              / ORCHESTRATOR
            </span>
          </div>
        </div>

        {/* CENTER SECTION: Tab Navigation Pill */}
        <div className="hidden lg:flex items-center gap-1 bg-[#07090d] border border-slate-800/65 rounded-full p-1 max-w-2xl">
          {[
            { id: 'pipeline', label: 'Assault Pipeline', icon: GitBranch },
            { id: 'servers', label: 'System Health', icon: Server },
            { id: 'engagement', label: 'Subroutines', icon: ListFilter },
            { id: 'logs', label: 'Audit Logs', icon: History },
            { id: 'cve', label: 'CVE Queue', icon: SearchCode },
            { id: 'morpheus', label: 'Morpheus', icon: Terminal }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                id={`nav-pill-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-medium tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-[#0a0c10] font-bold shadow-[0_2px_10px_rgba(255,255,255,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 bg-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT SECTION: Status Pill & Clock */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-[#090b0f] border border-slate-805/40 px-3.5 py-1.5 rounded-full text-xs font-mono select-none">
            <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_5px_rgba(16,185,129,0.7)] animate-ping-slow" />
            <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">All systems operational</span>
          </div>
          
          <div className="flex items-center gap-2 text-[#e2e8f0] font-mono text-xs font-semibold bg-[#111319] px-4 py-2 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span className="tracking-wide select-all">{currentTime}</span>
          </div>
        </div>
      </nav>

      {/* MOBILE TAB CONTROLLER SELECT BOX (Fallback for smaller devices) */}
      <div className="block lg:hidden mt-20 px-4">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as any)}
          className="w-full bg-[#0d0f15] text-[#e2e8f0] border border-slate-800 p-2.5 rounded font-mono text-xs uppercase"
        >
          <option value="pipeline">1. Assault Pipeline</option>
          <option value="servers">2. System Health</option>
          <option value="engagement">3. Active Subroutines</option>
          <option value="logs">4. Audit Logs Feed</option>
          <option value="cve">5. CVE Intelligence Queue</option>
          <option value="morpheus">6. Morpheus CLI Console</option>
        </select>
      </div>

      {/* 2. CORE VIEWPORTS SECTION */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:pt-24 mt-2 lg:mt-0 flex flex-col gap-6 relative">
        
        {/* CONNECTION LOST FLAG STATUS */}
        {connectionStatus !== 'connected' && (
          <div className="bg-red-950/20 border border-red-500/25 p-3 rounded-lg text-red-400 font-mono text-xs flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>WARNING: Lost active telemetry subscription to orchestrator. Retrying with backup backoff logic...</span>
            </span>
            <span className="text-[10px] font-bold bg-red-950/60 px-2 py-0.5 border border-red-500/30 rounded">RECONNECTING</span>
          </div>
        )}

        {/* LOADING STATE SKELETON DISPLAY */}
        {isLoading ? (
          <div className="space-y-6" id="app-loading-placeholder">
            <div className="h-10 bg-[#0c0e14] border border-slate-850 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="h-56 bg-[#0c0e14] rounded-xl border border-slate-900 p-5 space-y-4">
                  <div className="h-5 bg-slate-800 w-1/2 rounded animate-pulse" />
                  <div className="h-2 bg-slate-900 w-3/4 rounded animate-pulse" />
                  <div className="h-12 bg-slate-950/40 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="h-44 bg-[#0c0e14] border border-slate-900 rounded-xl animate-pulse" />
          </div>
        ) : isError ? (
          /* FAILURE CONTROL LAYER */
          <div className="p-12 text-center border border-dashed border-red-500/30 bg-red-950/10 rounded-xl space-y-4 font-mono max-w-lg mx-auto mt-12" id="app-error-display">
            <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-full w-fit mx-auto text-red-500">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Telemetry Server Unreachable
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Orchestrator failed to parse database snapshot. Verify local process bindings or port settings over server-side deployment logs.
            </p>
            <button
              onClick={() => fetchAllData()}
              className="px-5 py-2 text-xs font-bold font-mono tracking-widest uppercase border border-red-500/40 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition-all cursor-pointer"
            >
              [RETRY TELEMETRY CONNECTION]
            </button>
          </div>
        ) : (
          /* CORE TABS ROUTING CONDITIONAL DISPLAY */
          <section className="flex-1 w-full min-w-0" id="main-viewports-box">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.15 }}
                className="outline-none"
              >
                {activeTab === 'pipeline' && (
                  <PipelineFlow
                    phases={pipelinePhases}
                    onPhaseClick={(p) => addToast(`Examining intel files: ${p.name}`, 'info')}
                    onDeployTarget={handleDeployTarget}
                    onStartPipeline={handleStartPipeline}
                    onPausePipeline={handlePausePipeline}
                    onResumePipeline={handleResumePipeline}
                    onResetPipeline={handleResetPipeline}
                    pipelineState={pipelineState}
                  />
                )}

                {activeTab === 'servers' && (
                  <SystemHealth
                    agents={agents}
                    onUpdateAgentStatus={handleUpdateAgentStatus}
                    onModifyAgentStats={handleModifyAgentStats}
                  />
                )}

                {activeTab === 'engagement' && (
                  <AgentTasks
                    tasks={tasks}
                    agents={agents}
                    onAddTask={handleAddTask}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                    onDeleteTask={handleDeleteTask}
                    currentPhaseName={
                      pipelinePhases.find((p) => p.status === 'Active')?.name.replace(' / Foothold', '').replace(' / Pivot', '').split(' ')[0] || 'Breach'
                    }
                  />
                )}

                {activeTab === 'logs' && (
                  <LogViewer 
                    logs={logs} 
                    currentLocalTime={new Date().toISOString()} 
                  />
                )}

                {activeTab === 'cve' && (
                  <CveQueue 
                    cves={cves} 
                    onSendToBreach={handleSendCveToBreach} 
                    tasks={tasks} 
                  />
                )}

                {activeTab === 'morpheus' && (
                  <MorpheusCommandCenter
                    commands={morpheusCommands}
                    onCommandSubmit={handleCommandSubmit}
                    morpheusState={morpheusState}
                    setMorpheusState={async (st) => {
                      // Call /api/command with states
                      try {
                        const word = st === 'Awaiting Handoff' ? '/pause' : '/resume';
                        await fetch(`${API_BASE_URL}/api/command`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ command: word })
                        });
                        addToast(`Command parameters forced Morpheus to ${st}`, 'info');
                      } catch {
                        addToast('Status override failed.', 'error');
                      }
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        )}
      </main>

      {/* 3. FOOTER METADATA BRIEFING LEVEL INDICATORS */}
      <footer className="border-t border-slate-900 bg-[#07080c] px-6 py-4.5 mt-auto font-mono text-[10px] text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 grayscale opacity-55">
            <BadgeInfo className="w-3.5 h-3.5" />
            <span>HERMES REDTEAM SYSTEM ORCHESTRATOR DIAGNOSTIC CONTEXT CONSOLE [PRODUCTION LEVEL]</span>
          </div>
          <div className="flex items-center gap-4">
            <span>TARGET HOST: http://{activeTarget}</span>
            <span>CYCLE RATE: 60Hz</span>
            <span>DATA ENCRYPTION: SHA256/ECDSA-P384 ACTIVE</span>
          </div>
        </div>
      </footer>

      {/* 4. REALTIME TOAST ALERTS OVERLAY */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => {
            let containerStyles = 'border-cyan-500/30 bg-cyan-950/85 text-cyan-200';
            if (toast.type === 'success') containerStyles = 'border-[#10b981]/30 bg-teal-950/85 text-teal-200';
            if (toast.type === 'warn') containerStyles = 'border-amber-500/30 bg-amber-950/85 text-amber-200';
            if (toast.type === 'error') containerStyles = 'border-red-500/30 bg-red-950/85 text-red-200';
            
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 25, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 12, scale: 0.94 }}
                transition={{ duration: 0.15 }}
                className={`p-3.5 rounded-xl border shadow-2xl flex items-center justify-between gap-3 text-xs font-mono font-medium tracking-wide backdrop-blur-md ${containerStyles}`}
              >
                <span>{toast.message}</span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-[10px] text-slate-400 hover:text-slate-100 uppercase cursor-pointer pl-1 font-bold"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}
