import { Agent, Task, LogEntry, CveEntry, PipelinePhase, MorpheusCommand, MorpheusState } from './types';

export const initialAgents: Agent[] = [
  {
    id: 'agent-recon',
    name: 'Recon',
    role: 'OSINT & Fingerprinting',
    description: 'Subdomain enumeration, attack surface mapping, technology footprint exploration.',
    cpu: 42,
    memory: 58,
    uptime: '14h 22m',
    status: 'Online',
    lastHeartbeat: 'Just now',
    avatarColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20'
  },
  {
    id: 'agent-researcher',
    name: 'Researcher',
    role: 'CVE & Intelligence',
    description: 'CVE discovery, exploit intelligence, PoC research, and vulnerability indexing.',
    cpu: 12,
    memory: 34,
    uptime: '17h 04m',
    status: 'Online',
    lastHeartbeat: '3s ago',
    avatarColor: 'text-amber-400 border-amber-500/30 bg-amber-950/20'
  },
  {
    id: 'agent-breach',
    name: 'Breach',
    role: 'Exploitation & Payloads',
    description: 'Vulnerability exploitation, payload crafting, initial foothold, and shell creation.',
    cpu: 89,
    memory: 76,
    uptime: '08h 12m',
    status: 'Busy',
    lastHeartbeat: '1s ago',
    avatarColor: 'text-red-400 border-red-500/30 bg-red-950/20'
  },
  {
    id: 'agent-pivot',
    name: 'Pivot',
    role: 'Lateral Movement',
    description: 'Pivoting, lateral movement, Active Directory exploitation, and privilege escalation.',
    cpu: 0,
    memory: 12,
    uptime: '22h 45m',
    status: 'Online',
    lastHeartbeat: '12s ago',
    avatarColor: 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/20'
  },
  {
    id: 'agent-logbook',
    name: 'Logbook',
    role: 'Evidence Keeper',
    description: 'Evidence recording, chain-of-custody tracking, log integrity, and system checkpoints.',
    cpu: 18,
    memory: 24,
    uptime: '2d 04h',
    status: 'Online',
    lastHeartbeat: '5s ago',
    avatarColor: 'text-teal-400 border-teal-500/30 bg-teal-950/20'
  },
  {
    id: 'agent-report-writer',
    name: 'Report Writer',
    role: 'Deliverables & Docs',
    description: 'Executive summary writing, impact mapping, remediation guides, and asset tracking.',
    cpu: 5,
    memory: 18,
    uptime: '2d 04h',
    status: 'Online',
    lastHeartbeat: '15s ago',
    avatarColor: 'text-slate-400 border-slate-500/30 bg-slate-950/20'
  }
];

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    agentId: 'agent-recon',
    agentName: 'Recon',
    title: 'Scan target staging environment ports',
    status: 'Complete',
    progress: '100% (4096 ports scanned)',
    progressPercent: 100,
    priority: 'High',
    assignedBy: 'Morpheus',
    startTime: '2026-06-13T03:00:00Z',
    estimatedEnd: '2026-06-13T03:30:00Z'
  },
  {
    id: 'task-2',
    agentId: 'agent-recon',
    agentName: 'Recon',
    title: 'Enumerate subdomains for target-banking.com',
    status: 'Complete',
    progress: '100% (214 nodes mapped)',
    progressPercent: 100,
    priority: 'High',
    assignedBy: 'User',
    startTime: '2026-06-13T03:15:00Z',
    estimatedEnd: '2026-06-13T03:45:00Z'
  },
  {
    id: 'task-3',
    agentId: 'agent-researcher',
    agentName: 'Researcher',
    title: 'Audit discovered software against ExploitDB / CVE lists',
    status: 'Complete',
    progress: '100% (3 match groups identified)',
    progressPercent: 100,
    priority: 'High',
    assignedBy: 'Morpheus',
    startTime: '2026-06-13T03:50:00Z',
    estimatedEnd: '2026-06-13T04:20:00Z'
  },
  {
    id: 'task-4',
    agentId: 'agent-breach',
    agentName: 'Breach',
    title: 'Exploit CVE-2024-44321 on staging-api-gateway',
    status: 'In Progress',
    progress: '3/5 stages completed',
    progressPercent: 60,
    priority: 'High',
    assignedBy: 'Morpheus',
    startTime: '2026-06-13T04:30:00Z',
    estimatedEnd: '2026-06-13T05:45:00Z'
  },
  {
    id: 'task-5',
    agentId: 'agent-pivot',
    agentName: 'Pivot',
    title: 'Prepare lateral movement options post-foothold',
    status: 'Waiting',
    progress: 'Waiting for Breach foothold',
    progressPercent: 0,
    priority: 'High',
    assignedBy: 'Morpheus',
    startTime: 'Awaiting launch',
    estimatedEnd: 'Pending'
  },
  {
    id: 'task-6',
    agentId: 'agent-logbook',
    agentName: 'Logbook',
    title: 'Compute cryptographic hashes on session logs',
    status: 'Complete',
    progress: 'Saved 14 verified snapshots',
    progressPercent: 100,
    priority: 'Medium',
    assignedBy: 'Orchestrator',
    startTime: '2026-06-13T03:00:00Z',
    estimatedEnd: 'Continuing'
  },
  {
    id: 'task-7',
    agentId: 'agent-report-writer',
    agentName: 'Report Writer',
    title: 'Compile executive summary of staging.target-banking-demo.com',
    status: 'In Progress',
    progress: 'Outline built (15%)',
    progressPercent: 15,
    priority: 'Low',
    assignedBy: 'User',
    startTime: '2026-06-13T04:00:00Z',
    estimatedEnd: '2026-06-13T07:00:00Z'
  }
];

export const initialLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-06-13T03:01:12-07:00',
    agentName: 'Recon',
    action: 'Initialized fast-lookup scan on target cidr range 192.168.42.0/24',
    status: 'Info',
    evidenceLink: 'ev-recon-01',
    checkpointId: 'CP-1051'
  },
  {
    id: 'log-2',
    timestamp: '2026-06-13T03:15:34-07:00',
    agentName: 'Recon',
    action: 'Discovered open port: 4443/TCP hosting Spring API Gateway',
    status: 'Success',
    evidenceLink: 'ev-recon-02',
    checkpointId: 'CP-1052'
  },
  {
    id: 'log-3',
    timestamp: '2026-06-13T03:30:11-07:00',
    agentName: 'Recon',
    action: 'Technology fingerprint complete: Spring Boot 3.2.1, Kotlin, Apache Tomcat 10',
    status: 'Success',
    evidenceLink: 'ev-recon-03',
    checkpointId: 'CP-1053'
  },
  {
    id: 'log-4',
    timestamp: '2026-06-13T03:52:08-07:00',
    agentName: 'Researcher',
    action: 'Queried vulnerability databases for Spring Boot 3.2.1 components',
    status: 'Info',
    evidenceLink: 'ev-res-01',
    checkpointId: 'CP-1054'
  },
  {
    id: 'log-5',
    timestamp: '2026-06-13T04:02:45-07:00',
    agentName: 'Researcher',
    action: 'Identified critical CVE-2024-44321: Spring Expression Language (SpEL) injection',
    status: 'Warning',
    evidenceLink: 'ev-res-02',
    checkpointId: 'CP-1055'
  },
  {
    id: 'log-6',
    timestamp: '2026-06-13T04:15:00-07:00',
    agentName: 'Researcher',
    action: 'Verified PoC exploit logic and simulated payload headers in quarantine',
    status: 'Success',
    evidenceLink: 'ev-res-03',
    checkpointId: 'CP-1056'
  },
  {
    id: 'log-7',
    timestamp: '2026-06-13T04:31:12-07:00',
    agentName: 'Breach',
    action: 'Synthesizing SpEL injection payload targeting staging.target-banking-demo.com:4443',
    status: 'Info',
    evidenceLink: 'ev-bre-01',
    checkpointId: 'CP-1057'
  },
  {
    id: 'log-8',
    timestamp: '2026-06-13T04:45:30-07:00',
    agentName: 'Breach',
    action: 'Exploit attempt block 1: payload rejected by WAF firewall constraint. Adjusting signature.',
    status: 'Failure',
    evidenceLink: 'ev-bre-02',
    checkpointId: 'CP-1058'
  },
  {
    id: 'log-9',
    timestamp: '2026-06-13T05:01:21-07:00',
    agentName: 'Breach',
    action: 'Obfuscated character escape sequence crafted in base64. Bypassed first WAF filter.',
    status: 'Success',
    evidenceLink: 'ev-bre-03',
    checkpointId: 'CP-1059'
  },
  {
    id: 'log-10',
    timestamp: '2026-06-13T05:08:14-07:00',
    agentName: 'Logbook',
    action: 'Secure cryptographic checksum created for attack path logs CP-1051 to CP-1059',
    status: 'Success',
    evidenceLink: 'ev-log-01',
    checkpointId: 'CP-1060'
  }
];

export const initialCves: CveEntry[] = [
  {
    id: 'cve-1',
    cveId: 'CVE-2024-44321',
    cvss: 9.8,
    severity: 'Critical',
    product: 'VMware Tanzu Spring Framework (Expression Injection)',
    pocAvailable: 'Yes',
    dateAdded: '2026-06-10',
    status: 'Exploit Attempted',
    description: 'An unauthenticated attacker can trigger remote code execution by sending a specially crafted SpEL header component request.'
  },
  {
    id: 'cve-2',
    cveId: 'CVE-2024-3094',
    cvss: 10.0,
    severity: 'Critical',
    product: 'XZ Utils backdoor (liblzma context hijacking)',
    pocAvailable: 'Yes',
    dateAdded: '2026-06-11',
    status: 'Pending',
    description: 'Malicious code injected via complex makefiles yields unauthorized SSH key certificate authentication overrides.'
  },
  {
    id: 'cve-3',
    cveId: 'CVE-2025-0192',
    cvss: 8.8,
    severity: 'High',
    product: 'Apache Tomcat Session Management deserialization',
    pocAvailable: 'In Progress',
    dateAdded: '2026-06-12',
    status: 'Researched',
    description: 'Flaw in default clustering deserialization allows remote execution of payloads on internal non-boundary application servers.'
  },
  {
    id: 'cve-4',
    cveId: 'CVE-2024-21626',
    cvss: 8.6,
    severity: 'High',
    product: 'runc container escape (file descriptor leak)',
    pocAvailable: 'Yes',
    dateAdded: '2026-06-08',
    status: 'Pending',
    description: 'An attacker in a running container can escape to the host filesystem using leaking file descriptors of the launching runtime process.'
  },
  {
    id: 'cve-5',
    cveId: 'CVE-2024-47575',
    cvss: 9.8,
    severity: 'Critical',
    product: 'Fortinet FortiManager RCE',
    pocAvailable: 'Yes',
    dateAdded: '2026-06-04',
    status: 'Researched',
    description: 'Missing authentication for critical function in FortiGate control daemon allows remote execution commands via custom headers.'
  }
];

export const initialPipelinePhases: PipelinePhase[] = [
  {
    id: 'p-recon',
    name: 'Reconnaissance',
    status: 'Complete',
    agentRole: 'Recon',
    completedAt: '2026-06-13T03:30:00Z',
    updatedAt: '2026-06-13T03:30:00Z',
    findings: [
      'Discovered 4 hostnames actively routing traffic',
      'Mapped target subdomains: staging-api, internal-admin, main-client',
      'Port 4443 found exposed on staging environment'
    ]
  },
  {
    id: 'p-research',
    name: 'Researching',
    status: 'Complete',
    agentRole: 'Researcher',
    completedAt: '2026-06-13T04:20:00Z',
    updatedAt: '2026-06-13T04:20:00Z',
    findings: [
      'Identified Spring Boot 3.2.1 in production sandbox',
      'Matched critical vulnerability CVE-2024-44321 with high exploitability index',
      'Acquired functional Proof of Concept code and loaded into operational variables'
    ]
  },
  {
    id: 'p-breach',
    name: 'Breach / Foothold',
    status: 'Active',
    agentRole: 'Breach',
    updatedAt: '2026-06-13T05:01:21Z',
    findings: [
      'Crafted custom Base64 obfuscated SpEL injection statement',
      'Attempted initial deploy (BLOCKED by FortiWeb WAF)',
      'Adjusted header signatures; bypassed sandbox filter limits successfully'
    ]
  },
  {
    id: 'p-pivot',
    name: 'Lateral / Pivot',
    status: 'Pending',
    agentRole: 'Pivot',
    updatedAt: '2026-06-13T05:00:00Z',
    findings: [
      'Prerequisites: Active reverse shell container must be stabilized first',
      'Awaiting network bridge diagnostic reports from Breeder Agent container'
    ]
  },
  {
    id: 'p-logbook',
    name: 'Audit Trail',
    status: 'Pending',
    agentRole: 'Logbook',
    updatedAt: '2026-06-13T05:00:00Z',
    findings: [
      'Tracking active sessions to log cryptographic integrity indicators and timestamps',
      'Active verification token configured'
    ]
  },
  {
    id: 'p-report',
    name: 'Reporting',
    status: 'Pending',
    agentRole: 'Report Writer',
    updatedAt: '2026-06-13T05:00:00Z',
    findings: [
      'Awaiting compilation of breach indicators and pivoting checkpoints',
      'Remediation guide ready: Recommended patch level is Spring Boot 3.2.2+'
    ]
  }
];

export const initialMorpheusCommands: MorpheusCommand[] = [
  {
    id: 'cmd-1',
    timestamp: '2026-06-13T03:00:00-07:00',
    command: '/redteam scan staging.target-banking-demo.com',
    initiatedBy: 'User',
    response: '[Morpheus LOG] Task assigned to Recon. Spinning up parallel subdomain mapping subroutines and port inspection routines (4096 targeted). Completed in 30 minutes.',
    status: 'success'
  },
  {
    id: 'cmd-2',
    timestamp: '2026-06-13T03:45:00-07:00',
    command: '/status',
    initiatedBy: 'User',
    response: '[Morpheus LOG] System: Online. Target: staging.target-banking-demo.com. Recon stage complete, 1 exposed endpoint found: port 4443 (Spring Boot 3.2.1). Moving pipeline to CVE Intelligence.',
    status: 'success'
  },
  {
    id: 'cmd-3',
    timestamp: '2026-06-13T03:50:00-07:00',
    command: 'Morpheus, cross-reference port 4443 fingerprint with exploit databases',
    initiatedBy: 'User',
    response: '[Morpheus LOG] Understood. Triggering CVE discovery algorithms for Researcher Agent. Matching payloads... Discovered high-confidence exploit vectors associated with Spring SpEL (CVE-2024-44321).',
    status: 'success'
  },
  {
    id: 'cmd-4',
    timestamp: '2026-06-13T04:30:00-07:00',
    command: '/redteam exploit staging.target-banking-demo.com:4443',
    initiatedBy: 'User',
    response: '[Morpheus LOG] Deploying Breach Agent! Crafting payloads and testing firewall responsiveness. Real-time logging streaming in Logs Tab.',
    status: 'executing'
  }
];

export function generateSlightVariations(
  agents: Agent[],
  tasks: Task[],
  logs: LogEntry[],
  cves: CveEntry[],
  pipeline: PipelinePhase[],
  morpheusState: MorpheusState
) {
  // Alter CPU percentages slightly (+/- 5%) and some small random changes
  const updatedAgents = agents.map(agent => {
    if (agent.status === 'Offline') return agent;
    const cpuDelta = Math.floor(Math.random() * 11) - 5; // -5 to +5
    const memDelta = Math.floor(Math.random() * 7) - 3; // -3 to +3
    const newCpu = Math.max(0, Math.min(100, agent.cpu + cpuDelta));
    const newMem = Math.max(10, Math.min(95, agent.memory + memDelta));
    return {
      ...agent,
      cpu: newCpu,
      memory: newMem,
      lastHeartbeat: 'Just now'
    };
  });

  // Alter tasks progress randomly if in progress
  const updatedTasks = tasks.map(task => {
    if (task.status === 'In Progress') {
      if (task.progressPercent < 95) {
        const percentDelta = Math.floor(Math.random() * 6) + 1; // +1% to +5%
        const newPercent = Math.min(98, task.progressPercent + percentDelta);
        let updatedProgress = task.progress;
        if (task.id === 'task-4') {
          // Breach exploit stages
          const currentStage = Math.min(5, Math.floor(newPercent / 20) + 1);
          updatedProgress = `${currentStage}/5 stages completed`;
        } else if (task.id === 'task-7') {
          updatedProgress = `Outline built (${newPercent}%)`;
        }
        return {
          ...task,
          progressPercent: newPercent,
          progress: updatedProgress
        };
      }
    }
    return task;
  });

  // Randomly add a log entry to make it feel super dynamic!
  const logPrompts = [
    { agent: 'Breach', action: 'Honeypot scan bypass: analyzed tcp-retransmission anomalies', status: 'Info' },
    { agent: 'Logbook', action: 'Secured state transaction ledger block with valid cryptographic chain key', status: 'Success' },
    { agent: 'Recon', action: 'Scraped WHOIS records and sub-node registry profiles for auxiliary networks', status: 'Info' },
    { agent: 'Researcher', action: 'Identified minor warning regarding Docker daemon socket exposures', status: 'Warning' }
  ];

  const pickLog = logPrompts[Math.floor(Math.random() * logPrompts.length)];
  const dateFormatted = new Date().toISOString();
  const newLogId = `log-dynamic-${Date.now()}`;
  const nextCheckpointNum = 1060 + logs.length;

  const newLog: LogEntry = {
    id: newLogId,
    timestamp: dateFormatted,
    agentName: pickLog.agent,
    action: pickLog.action,
    status: pickLog.status as any,
    evidenceLink: `ev-dyn-${Date.now().toString().slice(-4)}`,
    checkpointId: `CP-${nextCheckpointNum}`
  };

  const updatedLogs = [newLog, ...logs];

  return {
    agents: updatedAgents,
    tasks: updatedTasks,
    logs: updatedLogs,
    cves,
    pipeline,
    time: new Date().toLocaleTimeString()
  };
}
