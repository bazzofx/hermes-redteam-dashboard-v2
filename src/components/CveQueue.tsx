import React, { useState } from 'react';
import { CveEntry } from '../types';
import { AlertTriangle, ShieldCheck, Flame, Send, Eye, ShieldAlert, BadgeInfo } from 'lucide-react';

interface CveQueueProps {
  cves: CveEntry[];
  onSendToBreach: (cve: CveEntry) => void;
  tasks: any[]; // Used to check if this cve is already sent/active
}

export default function CveQueue({ cves, onSendToBreach, tasks }: CveQueueProps) {
  const [selectedCve, setSelectedCve] = useState<CveEntry | null>(null);
  const [sentCveId, setSentCveId] = useState<string | null>(null);

  const getSeverityBadgeClass = (severity: CveEntry['severity']) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-950/40 text-red-400 border-red-500/40 font-bold shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse';
      case 'High':
        return 'bg-amber-950/40 text-amber-500 border-amber-500/30';
      case 'Medium':
        return 'bg-yellow-950/30 text-yellow-500 border-yellow-500/25';
      case 'Low':
        return 'bg-cyan-950/30 text-cyan-500 border-cyan-500/20';
    }
  };

  const getStatusBadgeClass = (status: CveEntry['status']) => {
    switch (status) {
      case 'Exploit Attempted':
        return 'text-red-400 border-red-500/30 bg-red-950/10 font-bold';
      case 'Researched':
        return 'text-teal-400 border-teal-500/30 bg-teal-950/10';
      case 'Pending':
        return 'text-slate-400 border-slate-700 bg-slate-900/50';
    }
  };

  const handleSendToBreachClick = (cve: CveEntry) => {
    setSentCveId(cve.id);
    onSendToBreach(cve);
    
    // Simulate a cool flashing feedback
    setTimeout(() => {
      setSentCveId(null);
    }, 1500);
  };

  // Helper to check if a task for this CVE already exists
  const isAlreadyInCombat = (cveId: string) => {
    return tasks.some(t => t.title.includes(cveId) && t.status === 'In Progress');
  };

  return (
    <div className="space-y-6" id="cve-intelligence-range">
      {/* EXPLANATORY HEADER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#090b0f] border border-slate-800 p-4.5 rounded-xl flex items-start gap-3">
          <Flame className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Total Vulnerability Queue</h4>
            <div className="text-2xl font-mono font-bold text-slate-100 mt-1">{cves.length} CVEs</div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Evaluated endpoints matched</p>
          </div>
        </div>

        <div className="bg-[#090b0f] border border-slate-800 p-4.5 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Critical Threats Defined</h4>
            <div className="text-2xl font-mono font-bold text-red-400 mt-1">
              {cves.filter(c => c.severity === 'Critical').length} CRIT
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">CVSS &gt;= 9.0 vector severity</p>
          </div>
        </div>

        <div className="bg-[#090b0f] border border-slate-800 p-4.5 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">PoC Verification Ratio</h4>
            <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
              {cves.filter(c => c.pocAvailable === 'Yes').length} / {cves.length}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Exploit codes verified and loaded</p>
          </div>
        </div>
      </div>

      {/* CVE QUEUE CORE LIST */}
      <div className="bg-[#090b0f] border border-slate-800 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div className="p-4 border-b border-slate-850 bg-[#0c1017]">
          <h3 className="text-xs uppercase font-mono tracking-widest font-bold text-slate-400">
            Threat Intelligence Queue (Evaluated CVE Database)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="bg-[#0c1017]/50 border-b border-slate-800 text-slate-500">
                <th className="py-3.5 px-4 font-semibold text-[10px]">CVE IDENTIFIER</th>
                <th className="py-3.5 px-4 font-semibold text-[10px]">AFFECTED PRODUCT / SUBSYSTEM</th>
                <th className="py-3.5 px-4 text-center font-semibold text-[10px]">CVSS SCORE</th>
                <th className="py-3.5 px-4 text-center font-semibold text-[10px]">POC CODE STATUS</th>
                <th className="py-3.5 px-4 text-center font-semibold text-[10px]">DATE RECONNED</th>
                <th className="py-3.5 px-4 text-center font-semibold text-[10px]">STAGE STATUS</th>
                <th className="py-3.5 px-4 text-right font-semibold text-[10px]">EXPLOIT ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {cves.map(cve => {
                const alreadyCombating = isAlreadyInCombat(cve.cveId);
                const isSentThisTurn = sentCveId === cve.id;

                return (
                  <tr 
                    key={cve.id} 
                    id={`cve-row-${cve.id}`}
                    className="hover:bg-[#0c1017]/30 transition-colors"
                  >
                    {/* CVE ID */}
                    <td className="py-3.5 px-4 font-bold text-slate-100 font-mono whitespace-nowrap">
                      {cve.cveId}
                    </td>

                    {/* PRODUCT */}
                    <td className="py-3.5 px-4 text-slate-300 font-sans max-w-xs md:max-w-sm truncate text-xs">
                      {cve.product}
                    </td>

                    {/* CVSS & SEVERITY */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1.5 justify-center">
                        <span className="font-bold text-white text-xs">{cve.cvss.toFixed(1)}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] border font-semibold select-none ${getSeverityBadgeClass(cve.severity)}`}>
                          {cve.severity.toUpperCase()}
                        </span>
                      </div>
                    </td>

                    {/* POC AVAILABLE */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${
                        cve.pocAvailable === 'Yes' 
                          ? 'text-cyan-400 bg-cyan-950/20 border-cyan-500/25' 
                          : cve.pocAvailable === 'In Progress' 
                            ? 'text-amber-500 bg-amber-950/10 border-amber-500/20 animate-pulse' 
                            : 'text-slate-500 bg-slate-900 border-slate-700/50'
                      }`}>
                        {cve.pocAvailable.toUpperCase()}
                      </span>
                    </td>

                    {/* DATE ADDED */}
                    <td className="py-3.5 px-4 text-center text-slate-400 select-all whitespace-nowrap">
                      {cve.dateAdded}
                    </td>

                    {/* PIPELINE STATUS */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] border font-semibold ${getStatusBadgeClass(cve.status)}`}>
                        {cve.status.toUpperCase()}
                      </span>
                    </td>

                    {/* ACTION BUTTONS */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          id={`btn-view-cve-${cve.id}`}
                          onClick={() => setSelectedCve(cve)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-all tracking-wider font-mono uppercase cursor-pointer"
                          title="View detailed CVE exploits report"
                        >
                          <Eye className="w-3 h-3" /> Report
                        </button>

                        <button
                          id={`btn-breach-cve-${cve.id}`}
                          onClick={() => handleSendToBreachClick(cve)}
                          disabled={alreadyCombating || isSentThisTurn}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] rounded transition-all tracking-wider font-mono uppercase cursor-pointer text-white ${
                            alreadyCombating 
                              ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed' 
                              : isSentThisTurn 
                                ? 'bg-cyan-500/40 text-cyan-200 border border-cyan-500/50 animate-pulse' 
                                : 'bg-red-700 hover:bg-red-600 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.1)]'
                          }`}
                          title={alreadyCombating ? 'Already assigned to Breach' : 'Deploy exploit parameters to Breach Agent!'}
                        >
                          <Send className={`w-3 h-3 ${isSentThisTurn ? 'animate-bounce' : ''}`} />
                          <span>{alreadyCombating ? 'Active' : isSentThisTurn ? 'Sent!' : 'Breach'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CVE THREAT ANALYSIS REPORT (DRAWER/MODAL) */}
      {selectedCve && (
        <div className="p-5 border border-red-500/20 bg-[#0d0f15] rounded-xl shadow-2xl relative transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={() => setSelectedCve(null)}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 font-mono text-xs cursor-pointer hover:underline"
          >
            [DISMISS REPORT]
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-red-500 font-mono">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <h4 className="text-md font-bold uppercase tracking-wider">
                Threat Briefing dossier: <span className="text-white hover:underline">{selectedCve.cveId}</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#07080c] p-4 rounded-lg border border-slate-900 text-xs text-slate-400 font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">TARGET SUBSYSTEM:</span>
                <span className="text-white font-bold">{selectedCve.product}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SEVERITY INDEX:</span>
                <span className="text-red-400 font-bold">{selectedCve.severity.toUpperCase()} (CVSS {selectedCve.cvss.toFixed(1)})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">POC CODE PATH:</span>
                <span className="text-cyan-400 font-bold uppercase">{selectedCve.pocAvailable === 'Yes' ? 'Loaded in Core Vault' : 'Searching repositories'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Technical Overviews & Vulnerability Mechanics:</span>
              <p className="text-sm font-sans text-slate-300 leading-relaxed max-w-4xl">
                {selectedCve.description} The vulnerability compromises memory or inputs parsing functions on production configurations. An orchestrator can command Breach to dispatch a character escape sequences block in Base64 encoding. Doing so will bypass existing firewall policies and initialize localized kernel bindings.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <BadgeInfo className="w-3.5 h-3.5 text-slate-500" />
                Dossier updated automatically by OSINT pipeline
              </span>
              <span className="text-slate-400 select-all">INTELLIGENCE CHECKSUM: md5:{selectedCve.cveId.slice(-4)}{selectedCve.cvss.toString().replace('.', '')}..</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
