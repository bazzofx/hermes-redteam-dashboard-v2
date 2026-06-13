import React, { useState } from 'react';
import { LogEntry } from '../types';
import { Search, Filter, Calendar, FileCode, CheckCircle, HelpCircle, HardDrive, Shield } from 'lucide-react';

interface LogViewerProps {
  logs: LogEntry[];
  currentLocalTime: string; // "2026-06-13T05:09:41-07:00"
}

export default function LogViewer({ logs, currentLocalTime }: LogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [timePreset, setTimePreset] = useState<'All' | 'Last hour' | 'Today' | 'Last 7 days'>('All');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  const [details, setDetails] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  const fetchDetails = async (logId: string) => {
    if (details[logId] || loadingDetails[logId]) return;
    setLoadingDetails(prev => ({ ...prev, [logId]: true }));
    try {
      const apiBase = (window as any).API_BASE_URL || window.location.origin;
      const res = await fetch(`${apiBase}/api/logs/${logId}/details`);
      if (res.ok) {
        const data = await res.json();
        setDetails(prev => ({ ...prev, [logId]: data }));
      }
    } catch (e) {
      console.error('Error fetching log evidence details:', e);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [logId]: false }));
    }
  };

  const toggleExpand = (logId: string) => {
    if (expandedLogId === logId) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(logId);
      fetchDetails(logId);
    }
  };

  // Parse current timestamp for relative filters (Simulated based on 2026-06-13T05:09:41-07:00)
  const baseTimeObj = new Date('2026-06-13T05:09:41-07:00');

  // Filter logic
  const filteredLogs = logs.filter(log => {
    // 1. Text Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const matchText = (log.action + ' ' + log.agentName + ' ' + (log.checkpointId || '')).toLowerCase();
      if (!matchText.includes(query)) return false;
    }

    // 2. Agent Name
    if (selectedAgent !== 'All' && log.agentName !== selectedAgent) return false;

    // 3. Status Badge
    if (selectedStatus !== 'All' && log.status !== selectedStatus) return false;

    // 4. Time Presets
    if (timePreset !== 'All') {
      const logTime = new Date(log.timestamp);
      const diffMs = baseTimeObj.getTime() - logTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (timePreset === 'Last hour') {
        if (diffHours > 1) return false;
      } else if (timePreset === 'Today') {
        // Same day (June 13, 2026)
        if (logTime.getDate() !== baseTimeObj.getDate() || logTime.getMonth() !== baseTimeObj.getMonth()) {
          return false;
        }
      } else if (timePreset === 'Last 7 days') {
        if (diffHours > 168) return false; // 7 * 24 = 168 hours
      }
    }

    return true;
  });

  const getAgentColorBadge = (agent: string) => {
    switch (agent) {
      case 'Recon':
        return 'border-cyan-500/20 text-cyan-400 bg-cyan-950/20';
      case 'Researcher':
        return 'border-amber-500/20 text-amber-400 bg-amber-950/20';
      case 'Breach':
        return 'border-red-500/20 text-red-400 bg-red-950/20';
      case 'Pivot':
        return 'border-fuchsia-500/20 text-fuchsia-400 bg-fuchsia-950/20';
      case 'Logbook':
        return 'border-teal-500/20 text-teal-400 bg-teal-950/20';
      case 'Report Writer':
        return 'border-slate-500/20 text-slate-400 bg-slate-900/40';
      default:
        return 'border-slate-700 text-slate-400 bg-slate-900';
    }
  };

  const getStatusColorBadge = (status: LogEntry['status']) => {
    switch (status) {
      case 'Success':
        return 'text-teal-400 bg-teal-950/20 border-teal-500/30';
      case 'Failure':
        return 'text-red-400 bg-red-950/20 border-red-500/30';
      case 'Warning':
        return 'text-amber-400 bg-amber-950/20 border-amber-500/30';
      case 'Info':
        return 'text-cyan-400 bg-cyan-950/20 border-cyan-500/30';
    }
  };

  // Simulated hex dump payload for expanded log lines
  const getSimulatedLogPayload = (log: LogEntry) => {
    return {
      raw_buffer_stream: `0000  50 4f 53 54 20 2f 61 70   69 2f 76 31 2f 74 61 72  POST /api/v1/tar
0010  67 65 74 20 48 54 54 50   2f 31 2e 31 0d 0a 48 6f  get HTTP/1.1..Ho
0020  73 74 3a 20 73 74 61 67   69 6e 67 2e 74 61 72 67  st: staging.targ
0030  65 74 2e 63 6f 6d 0d 0a   55 73 65 72 2d 41 67 65  et.com..User-Age
0040  6e 74 3a 20 4d 6f 72 70   68 65 75 73 2f 43 6f 70  nt: Morpheus/Cop
0050  73 2d 52 65 64 54 65 61   6d 20 56 65 63 74 6f 12  s-RedTeam Vect12`,
      decrypted_claims: {
        checkpoint_integrity: `sha256:f1266b0aab..${(log.checkpointId || 'CP-9999')}`,
        agent_identity_hash: `ecc:p384:sig:${log.agentName.toUpperCase()}`,
        session_security_token: "jwt:auth_cops_admin_authorized_bypass_true"
      },
      evidence_path_resolves: `/proofs/red-team/${log.evidenceLink || 'ev-none'}.bin`
    };
  };

  return (
    <div className="space-y-4" id="logs-historical-panel">
      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-[#090b0f] border border-slate-800 rounded-xl p-4.5 space-y-4 shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Text Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              id="log-search-input"
              placeholder="Search action signatures, checkpoints, or keywords..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#07080c] text-white border border-slate-800 rounded-lg pl-9.5 pr-4 py-2 text-xs font-mono outline-none focus:border-red-500 placeholder-slate-600 transition-all font-medium"
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 bg-[#07080c] border border-slate-800/80 p-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            {(['All', 'Last hour', 'Today', 'Last 7 days'] as const).map(preset => (
              <button
                key={preset}
                id={`filter-time-${preset.replace(' ', '-').toLowerCase()}`}
                onClick={() => setTimePreset(preset)}
                className={`px-3 py-1 text-[10px] rounded cursor-pointer font-mono hover:text-slate-200 uppercase transition-all ${timePreset === preset ? 'bg-red-500/20 text-red-400 border border-red-500/20 font-bold' : 'text-slate-500'}`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3.5 border-t border-slate-900">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Filter by Agent</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <select
                id="select-filter-agent"
                value={selectedAgent}
                onChange={e => setSelectedAgent(e.target.value)}
                className="w-full bg-[#07080c] text-white border border-slate-800 rounded px-3 py-2 pl-9 text-xs font-mono outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="All">All Active Units</option>
                <option value="Recon">Recon Unit</option>
                <option value="Researcher">Researcher Unit</option>
                <option value="Breach">Breach Unit</option>
                <option value="Pivot">Pivot Unit</option>
                <option value="Logbook">Logbook Unit</option>
                <option value="Report Writer">Report Writer Unit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Filter by Status</label>
            <div className="relative">
              <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <select
                id="select-filter-status"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full bg-[#07080c] text-white border border-slate-800 rounded px-3 py-2 pl-9 text-xs font-mono outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="All">All Signatures</option>
                <option value="Success">Success (Trace Green)</option>
                <option value="Failure">Failure (Trace Red)</option>
                <option value="Warning">Warning (Trace Amber)</option>
                <option value="Info">Info (Trace Cyan)</option>
              </select>
            </div>
          </div>

          <div className="flex items-end text-right justify-end ml-auto font-mono text-[10px] text-slate-500">
            <span>RESULTS FILTERED: <span className="text-white font-bold">{filteredLogs.length}</span> / {logs.length} RECORDS</span>
          </div>
        </div>
      </div>

      {/* CORE LOGS TABLE */}
      <div className="bg-[#090b0f] border border-slate-800 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="bg-[#0e1017] border-b border-slate-800 text-slate-500 select-none">
                <th className="py-3 px-4 text-left font-semibold tracking-wider text-[10px]">TIMESTAMP (UTC-7)</th>
                <th className="py-3 px-4 text-left font-semibold tracking-wider text-[10px]">AGENT UNIT</th>
                <th className="py-3 px-4 text-left font-semibold tracking-wider text-[10px]">ACTION LOGS STREAM</th>
                <th className="py-3 px-4 text-center font-semibold tracking-wider text-[10px]">TRACE STATUS</th>
                <th className="py-3 px-4 text-center font-semibold tracking-wider text-[10px]">CHECKPOINT</th>
                <th className="py-3 px-4 text-center font-semibold tracking-wider text-[10px]">EVIDENCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    NO CYBER EVIDENCE TO DISPLAY SPECIFIED FOR THIS FILTER CLUSTER.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  const logDate = new Date(log.timestamp);
                  const timeStr = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <React.Fragment key={log.id}>
                      {/* Standard Log Line Row */}
                      <tr
                        id={`log-row-${log.id}`}
                        onClick={() => toggleExpand(log.id)}
                        className={`hover:bg-[#0e1017] transition-colors cursor-pointer ${isExpanded ? 'bg-[#0f111a]' : ''}`}
                      >
                        {/* TIMESTAMP */}
                        <td className="py-3.5 px-4 text-slate-400 select-all font-mono whitespace-nowrap">
                          {timeStr}
                        </td>

                        {/* AGENT BADGE */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] border font-semibold ${getAgentColorBadge(log.agentName)}`}>
                            {log.agentName}
                          </span>
                        </td>

                        {/* ACTION ACTION */}
                        <td className="py-3.5 px-4 text-slate-200 max-w-sm md:max-w-md lg:max-w-lg truncate">
                          {log.action}
                        </td>

                        {/* STATUS BADGE */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] border tracking-wider font-semibold ${getStatusColorBadge(log.status)}`}>
                            {log.status.toUpperCase()}
                          </span>
                        </td>

                        {/* CHECKPOINT */}
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                          {log.checkpointId || 'N/A'}
                        </td>

                        {/* EVIDENCE KEY */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-red-400 hover:text-red-300 transition-colors font-semibold" title="View cryptographic bundle proof">
                            {log.evidenceLink || '--'}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Claim Block Drawer */}
                      {isExpanded && (
                        <tr className="bg-[#0b0c12]">
                          <td colSpan={6} className="p-4 border-t border-slate-900">
                            {loadingDetails[log.id] ? (
                              <div className="py-6 text-center text-xs font-mono text-cyan-400/80 animate-pulse">
                                ACQUIRING SECURE EVIDENCE BLOCK CRYPTOGRAPHY [0x{log.id.slice(-4) || 'FFFF'}]...
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                                {/* Left Column: HEX Buffer Stream */}
                                <div className="space-y-1.5">
                                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest font-mono">
                                    <FileCode className="w-3.5 h-3.5 text-red-500" /> RAW BUFFER PAYLOAD ACQUISITION
                                  </span>
                                  <pre className="p-3 bg-[#050608] rounded border border-slate-900 text-[10px] text-cyan-400/80 leading-relaxed overflow-x-auto select-all max-h-[140px] font-mono whitespace-pre text-wrap sm:text-nowrap select-all">
                                    {details[log.id]?.hex || "0000  50 4f 53 54 20 2f 61 70   69 2f 76 31 2f 74 61 72\n0010  67 65 74 20 48 54 54 50   2f 31 2e 31 0d"}
                                  </pre>
                                </div>

                                {/* Right Column: DECRYPTED CLAIMS */}
                                <div className="space-y-1.5 flex flex-col justify-between">
                                  <div>
                                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest font-mono mb-2">
                                      <Shield className="w-3.5 h-3.5 text-amber-500" /> VERIFIED ORCHESTRATOR PATH CLAIMS
                                    </span>
                                    <div className="space-y-2 text-[11px] font-mono">
                                      <div className="flex justify-between items-center gap-1.5">
                                        <span className="text-slate-500">CHAIN CHECKSUM:</span>
                                        <span className="text-slate-300 select-all font-bold text-[9px] truncate break-all leading-none">
                                          {details[log.id]?.sha256 ? `sha256:${details[log.id].sha256}` : `sha256:f1266b0aab..${log.checkpointId || 'CP-9999'}`}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center gap-1.5">
                                        <span className="text-slate-500">OPERATIONAL KEYS:</span>
                                        <span className="text-slate-300 font-bold bg-slate-900 px-1 text-[9px] truncate break-all leading-none">
                                          {details[log.id]?.jwt ? `jwt:${details[log.id].jwt.slice(0, 30)}...` : `ecc:p384:sig:${log.agentName.toUpperCase()}`}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center gap-1.5 text-right">
                                        <span className="text-slate-500">INTELLIGENCE PROOFS:</span>
                                        <span className="text-red-400 font-bold underline select-all break-all text-[10px]">
                                          /proofs/red-team/{log.evidenceLink || `ev-${log.id.slice(-4)}.bin`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right text-[10px] text-slate-500 pt-2 border-t border-slate-900/60 mt-2">
                                    <span>LOG RECORD STAMPED: {new Date(log.timestamp).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
