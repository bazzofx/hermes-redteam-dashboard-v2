import React, { useState } from 'react';
import { Task, Agent } from '../types';
import { Clock, Plus, Zap, CheckCircle2, AlertTriangle, Play, XCircle, Info, HelpCircle } from 'lucide-react';

interface AgentTasksProps {
  tasks: Task[];
  agents: Agent[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => void;
  onDeleteTask: (taskId: string) => void;
  currentPhaseName: string;
}

export default function AgentTasks({
  tasks,
  agents,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  currentPhaseName
}: AgentTasksProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || '');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const pipelinePhases = [
    { label: 'Recon', desc: 'OSINT Mapping' },
    { label: 'Researcher', desc: 'CVE Discovery' },
    { label: 'Breach', desc: 'Exploitation' },
    { label: 'Pivot', desc: 'Escalation' },
    { label: 'Logbook', desc: 'Audit Trail' },
    { label: 'Report Writer', desc: 'Summary Doc' }
  ];

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const matchedAgent = agents.find(a => a.id === selectedAgentId);
    if (!matchedAgent) return;

    onAddTask({
      agentId: matchedAgent.id,
      agentName: matchedAgent.name,
      title: newTitle,
      status: 'In Progress',
      progress: '0% initialized',
      progressPercent: 0,
      priority: newPriority,
      assignedBy: 'User',
      startTime: new Date().toISOString(),
      estimatedEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // +2 hours
    });

    setNewTitle('');
    setShowAddForm(false);
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'All') return true;
    return task.status === filterStatus;
  });

  return (
    <div className="space-y-6" id="tasks-active-panel">
      {/* SECTION 1: TARGET PIPELINE PIPELINE STATUS */}
      <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" /> OPERATION PIPELINE PHASE PROGRESSION
        </h3>
        
        {/* Horizontal flow */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 relative">
          {pipelinePhases.map((phase, index) => {
            const isCompletedBefore = index < pipelinePhases.findIndex(p => p.label === currentPhaseName);
            const isActive = phase.label === currentPhaseName;
            
            let statusBadge = 'border-slate-800 bg-[#07080c] text-slate-500';
            if (isCompletedBefore) {
              statusBadge = 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]';
            } else if (isActive) {
              statusBadge = 'border-red-500 bg-red-950/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
            }

            return (
              <div 
                key={phase.label} 
                className={`p-3 rounded-lg border transition-all duration-300 relative ${statusBadge}`}
              >
                {/* Visual connectors */}
                {index < 5 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-slate-800 z-10" />
                )}

                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span>STEP 0{index + 1}</span>
                  {isCompletedBefore ? (
                    <span className="text-cyan-400 font-bold">DONE</span>
                  ) : isActive ? (
                    <span className="text-red-500 font-bold animate-pulse">ACTIVE</span>
                  ) : (
                    <span className="text-slate-600">PENDING</span>
                  )}
                </div>

                <div className="mt-1.5 text-sm font-bold tracking-tight text-white truncate font-mono">
                  {phase.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {phase.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: TASK QUEUE INTERACTIVE GRID */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-md font-bold text-white font-mono uppercase tracking-wide">
              Active Combat Queue ({tasks.length})
            </h2>
            
            {/* Status filters */}
            <div className="flex border border-slate-800 rounded bg-[#090b0f] overflow-hidden">
              {(['All', 'In Progress', 'Complete', 'Waiting', 'Failed'] as const).map(status => (
                <button
                  key={status}
                  id={`filter-task-${status.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2.5 py-1 text-[10px] font-mono hover:bg-slate-900 cursor-pointer ${filterStatus === status ? 'bg-red-500/20 text-red-400 border border-red-500/20 font-bold' : 'text-slate-400'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <button
            id="btn-spin-task-manager"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 bg-red-950/25 border border-red-500/40 hover:bg-red-950/40 font-mono uppercase rounded-md tracking-wider cursor-pointer"
            title="Inject an arbitrary red-team diagnostic assignment"
          >
            <Plus className="w-3.5 h-3.5" /> Inject New Assignment
          </button>
        </div>

        {/* Dynamic add form */}
        {showAddForm && (
          <form 
            onSubmit={handleTaskSubmit} 
            className="p-4 border border-slate-800 bg-[#0d0f15] rounded-xl mb-5 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Target Agent Unit</label>
                <select
                  value={selectedAgentId}
                  onChange={e => setSelectedAgentId(e.target.value)}
                  className="w-full bg-[#07080c] text-white border border-slate-700 px-3 py-2 rounded text-xs font-mono outline-none focus:border-red-500"
                >
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name} - {agent.role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Subroutine Priority</label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as any)}
                  className="w-full bg-[#07080c] text-white border border-slate-700 px-3 py-2 rounded text-xs font-mono outline-none focus:border-red-500"
                >
                  <option value="High">HIGH (Urgent Core Foils)</option>
                  <option value="Medium">MEDIUM (Standard Explores)</option>
                  <option value="Low">LOW (Doc/Metadata Audits)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Assignment Title</label>
                <input
                  type="text"
                  placeholder="e.g. Scrape public SSH host key directories"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-[#07080c] text-white border border-slate-700 px-3 py-2 rounded text-xs font-mono outline-none focus:border-red-500 placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-900">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 font-mono cursor-pointer"
              >
                [CANCEL]
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-red-600 text-white rounded font-mono font-bold uppercase cursor-pointer hover:bg-red-700"
              >
                Inject Subroutine
              </button>
            </div>
          </form>
        )}

        {/* Task cards list */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 font-mono text-xs">
              NO SUBROUTINES TRACKED UNDER SELECTION. OUTSIDE CAMPAIGN SCOPE.
            </div>
          ) : (
            filteredTasks.map(task => {
              let statusTextClass = 'text-cyan-400';
              let statusBg = 'bg-cyan-950/20 border-cyan-500/20';
              let IconComp = Clock;

              if (task.status === 'Complete') {
                statusTextClass = 'text-teal-400';
                statusBg = 'bg-teal-900/20 border-teal-500/20';
                IconComp = CheckCircle2;
              } else if (task.status === 'Failed') {
                statusTextClass = 'text-red-400';
                statusBg = 'bg-red-950/20 border-red-500/20 px';
                IconComp = XCircle;
              } else if (task.status === 'Waiting') {
                statusTextClass = 'text-amber-400';
                statusBg = 'bg-amber-950/20 border-amber-500/20';
                IconComp = AlertTriangle;
              }

              let priorityClass = 'text-slate-500';
              if (task.priority === 'High') priorityClass = 'text-red-500 font-bold';
              if (task.priority === 'Medium') priorityClass = 'text-amber-400 font-semibold';

              return (
                <div
                  key={task.id}
                  id={`task-item-${task.id}`}
                  className="p-4 rounded-xl border border-slate-800 bg-[#090b0f] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:border-slate-800/90 hover:bg-[#0c0e14]"
                >
                  {/* Left element: Title, Agent, Assignment */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                      <span className="px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-300 uppercase">
                        {task.agentName}
                      </span>
                      <span>Assigned by: <span className="text-amber-400 font-semibold">{task.assignedBy}</span></span>
                      <span>•</span>
                      <span className="text-slate-500">START: {task.startTime.includes('Z') ? new Date(task.startTime).toLocaleTimeString() : task.startTime}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 font-sans tracking-wide">
                      {task.title}
                    </h4>

                    {/* Progress indicators */}
                    <div className="flex items-center gap-3.5 pt-1.5">
                      <div className="w-24 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${task.status === 'Failed' ? 'bg-red-500' : 'bg-red-500'}`}
                          style={{ width: `${task.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {task.progress}
                      </span>
                    </div>
                  </div>

                  {/* Right element: Stats badge & administrative controls */}
                  <div className="flex items-center gap-4 flex-wrap self-start md:self-center">
                    <div className="text-right hidden sm:block font-mono text-[10px] text-slate-500">
                      <div>PREDICTEND:</div>
                      <span className="text-slate-300 font-semibold uppercase">{task.estimatedEnd.includes('Z') ? new Date(task.estimatedEnd).toLocaleTimeString() : task.estimatedEnd}</span>
                    </div>

                    <div className="font-mono text-xs">
                      <span className="text-[10px] text-slate-500 uppercase mr-1.5">PRIORITY:</span>
                      <span className={priorityClass}>{task.priority}</span>
                    </div>

                    <div className={`px-2.5 py-1 rounded text-xs border font-mono flex items-center gap-1.5 ${statusBg} ${statusTextClass}`}>
                      <IconComp className="w-3.5 h-3.5 stroke-[2]" />
                      <span>{task.status}</span>
                    </div>

                    {/* ACTIONS: SIMULATE UPDATE OR ABORT */}
                    <div className="flex items-center gap-1 border-l border-slate-950/40 pl-3">
                      {task.status === 'In Progress' && (
                        <>
                          <button
                            id={`btn-complete-${task.id}`}
                            onClick={() => onUpdateTaskStatus(task.id, 'Complete')}
                            className="p-1 text-teal-400 hover:text-teal-300 hover:bg-teal-950/20 rounded border border-transparent hover:border-teal-500/20 transition-all cursor-pointer"
                            title="Audit output and mark complete"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-fail-${task.id}`}
                            onClick={() => onUpdateTaskStatus(task.id, 'Failed')}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                            title="Signal failed execution signature"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {task.status !== 'In Progress' && (
                        <button
                          id={`btn-delete-${task.id}`}
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded border border-transparent hover:border-slate-700/20 transition-all cursor-pointer"
                          title="Purge logbook metadata entry"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
