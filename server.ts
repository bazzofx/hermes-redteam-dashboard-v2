import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Types definition matching /src/types.ts
interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  cpu: number;
  memory: number;
  uptime: string;
  status: 'Online' | 'Offline' | 'Busy';
  lastHeartbeat: string;
  avatarColor: string;
}

interface Task {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  status: 'In Progress' | 'Complete' | 'Waiting' | 'Failed';
  progress: string;
  progressPercent: number;
  priority: 'High' | 'Medium' | 'Low';
  assignedBy: 'User' | 'Morpheus' | string;
  startTime: string;
  estimatedEnd: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  agentName: string;
  action: string;
  status: 'Success' | 'Failure' | 'Warning' | 'Info';
  evidenceLink?: string;
  checkpointId?: string;
}

interface CveEntry {
  id: string;
  cveId: string;
  cvss: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  product: string;
  pocAvailable: 'Yes' | 'No' | 'In Progress';
  dateAdded: string;
  status: 'Researched' | 'Pending' | 'Exploit Attempted';
  description: string;
}

interface PipelinePhase {
  id: string;
  name: string;
  status: 'Complete' | 'Active' | 'Pending' | 'Failed';
  agentRole: string;
  completedAt?: string;
  updatedAt: string;
  findings: string[];
}

// 1. In-Memory State Broker
let agents: Agent[] = [
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

let tasks: Task[] = [
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

let logs: LogEntry[] = [
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

let cves: CveEntry[] = [
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

let pipelinePhases: PipelinePhase[] = [
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

let pipelineState: 'running' | 'paused' | 'stopped' = 'running';
let activeTarget = 'staging.target-banking-demo.com:4443';
let commandHistory: { id: string; timestamp: string; command: string; response: string; status: 'success' | 'error' }[] = [
  {
    id: 'ch-1',
    timestamp: '2026-06-13T05:10:00-07:00',
    command: '/status',
    response: 'SYSTEMS ONLINE: Recon (Online, 42% CPU) | Researcher (Online, 12% CPU) | Breach (Busy, 89% CPU) | Pivot (Online, 0% CPU) | Logbook (Online, 18% CPU) | Report Writer (Online, 5% CPU). Morpheus ready.',
    status: 'success'
  }
];

// Helper to update individual agent metric fluctuations
function fluctuateMetrics() {
  agents = agents.map(agent => {
    if (agent.status === 'Offline') {
      return { ...agent, cpu: 0, lastHeartbeat: 'Offline' };
    }
    const drift = Math.floor((Math.random() - 0.5) * 8);
    const newCpu = Math.max(5, Math.min(98, agent.cpu + drift));
    const memDrift = Math.floor((Math.random() - 0.5) * 4);
    const newMem = Math.max(10, Math.min(95, agent.memory + memDrift));
    return {
      ...agent,
      cpu: agent.status === 'Busy' ? Math.max(65, newCpu) : newCpu,
      memory: newMem,
      lastHeartbeat: 'Just now'
    };
  });
}

// 2. Setup the express App
const app = express();
app.use(express.json());

// Enable CORS for frontend flexibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server attached to '/ws/events'
const wss = new WebSocketServer({ server, path: '/ws/events' });

// Keep track of connected clients
const wsClients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  
  // Send initial data snapshot
  ws.send(JSON.stringify({
    type: 'INIT',
    agents,
    pipelineState,
    activeTarget,
    morpheusState: pipelineState === 'paused' ? 'Awaiting Handoff' : 'Listening'
  }));

  ws.on('close', () => {
    wsClients.delete(ws);
  });

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch {}
  });
});

// Broadcast changes to all WebSocket clients
function broadcast(payload: object) {
  const serialized = JSON.stringify(payload);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(serialized);
    }
  }
}

// Tick loop to fluctuate agent load every 4 seconds and broadcast updates
setInterval(() => {
  fluctuateMetrics();
  broadcast({
    type: 'METRIC_TICK',
    agents,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
  });
}, 4000);

// API Routes

// 1. GET /api/agents/status
app.get('/api/agents/status', (req, res) => {
  // If specific agent is specified (e.g. for Morpheus state)
  const agentQuery = req.query.agent;
  if (agentQuery === 'morpheus') {
    return res.json({
      name: 'Morpheus',
      state: pipelineState === 'paused' ? 'Awaiting Handoff' : pipelineState === 'stopped' ? 'Listening' : 'Processing',
      pipelineState
    });
  }
  res.json(agents);
});

// 2. GET /api/agents/tasks
app.get('/api/agents/tasks', (req, res) => {
  res.json(tasks);
});

// 3. GET /api/logs
app.get('/api/logs', (req, res) => {
  res.json(logs);
});

// 4. GET /api/logs/{id}/details
app.get('/api/logs/:id/details', (req, res) => {
  const { id } = req.params;
  const logItem = logs.find(l => l.id === id);
  if (!logItem) {
    return res.status(404).json({ error: `Log node identifier ${id} not found.` });
  }

  // Generate realistic cryptographic values deterministically/randomly based on Log ID
  const hashDigest = Buffer.from(`${id}-ev-buffer-${logItem.action}`).toString('hex');
  const sha256 = `8f4803716e25dc3f6e1fdf96efbe3ff868dbf9abed60${hashDigest.slice(0, 24)}`;
  const jwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyZWQtdGVhbS11bml0IiwiaWQiOiI2NzA4Iiwicm9sZSI6IiR7bG9nSXRlbS5hZ2VudE5hbWV9IiwidGFzayI6IiR7aWR9IiwiY2hlY2twb2ludCI6IiR7bG9nSXRlbS5jaGVja3BvaW50SWR9In0.jwt-signature-${id}`;
  
  // Produce a simulated high-fidelity hex byte buffer stream
  let hexBytes = '';
  for (let i = 0; i < 48; i++) {
    const byte = Math.floor(Math.sin(i + id.length) * 128 + 127).toString(16).padStart(2, '0');
    hexBytes += byte + ' ';
    if ((i + 1) % 8 === 0) hexBytes += '  ';
    if ((i + 1) % 16 === 0) hexBytes += '\n';
  }

  res.json({
    id,
    timestamp: logItem.timestamp,
    agentName: logItem.agentName,
    action: logItem.action,
    sha256,
    jwt,
    hex: hexBytes.trim()
  });
});

// 5. GET /api/engagement/active
app.get('/api/engagement/active', (req, res) => {
  res.json({
    target: activeTarget,
    operationName: 'HERMES_ASSAULT_RUN_BETA',
    startTime: '2026-06-13T03:00:00Z',
    activePhase: pipelinePhases.find(p => p.status === 'Active')?.name || 'None',
    logsCount: logs.length,
    threatLevel: 'Severity 9 (CRITICAL)'
  });
});

// 6. GET /api/cve/queue
app.get('/api/cve/queue', (req, res) => {
  res.json(cves);
});

// 7. GET /api/cve/report/{id}
app.get('/api/cve/report/:id', (req, res) => {
  const { id } = req.params;
  const cveItem = cves.find(c => c.id === id || c.cveId === id);
  if (!cveItem) {
    return res.status(404).json({ error: `CVE entry with identifier ${id} not found in intelligence registry.` });
  }
  res.json({
    ...cveItem,
    targetVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
    vulnerabilitySource: 'Mitre CVE Registry',
    affectedComponents: [
      'Spring Framework Web Integration API',
      'Tomcat Catalina class loader wrapper',
      'SpEL execution nodes'
    ],
    verifiedMitigation: 'Upgrade kernel/dependencies to version Spring Boot 3.2.2+ or install cloud WAF ruleset 942100.',
    reproductionPoC: `curl -H "X-Hermes-Payload: \${new java.lang.String(T(org.springframework.util.StreamUtils).copyToByteArray(...))}" http://${activeTarget}/validate`
  });
});

// 8. GET /api/pipeline/status
app.get('/api/pipeline/status', (req, res) => {
  res.json({
    state: pipelineState, // running | paused | stopped
    activeTarget,
    phases: pipelinePhases
  });
});

// 9. GET /api/pipeline/phase/{phase}
app.get('/api/pipeline/phase/:phase', (req, res) => {
  const { phase } = req.params;
  const selected = pipelinePhases.find(p => p.id === phase || p.id === `p-${phase.toLowerCase()}` || p.agentRole.toLowerCase() === phase.toLowerCase());
  if (!selected) {
    return res.status(404).json({ error: `Pipeline phase info for [${phase}] not found.` });
  }
  res.json(selected);
});

// 10. GET /api/logbook/summary
app.get('/api/logbook/summary', (req, res) => {
  const activeLogsCount = logs.length;
  res.json({
    totalLogsCount: activeLogsCount,
    verifiedCheckpoints: logs.filter(l => l.checkpointId).map(l => l.checkpointId),
    cryptographicHashesClaimed: activeLogsCount - 2,
    hasIntegrityAnomaly: false,
    checksumClaim: 'SHA-256-SIGNATURE-VERIFIED-CHAIN-OK-VALID',
    lastAuditTimestamp: new Date().toISOString()
  });
});

// 11. POST /api/command
app.post('/api/command', (req, res) => {
  const { command, initiatedBy } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Command string payload is missing.' });
  }

  const normalized = command.trim();
  let textResponse = '';
  let status: 'success' | 'error' = 'success';

  if (normalized.startsWith('/status')) {
    textResponse = `SYSTEMS ONLINE: Recon (${agents[0].status}) | Researcher (${agents[1].status}) | Breach (${agents[2].status}) | Pivot (${agents[3].status}) | Logbook (${agents[4].status}) | Report Writer (${agents[5].status}). Operating standard diagnostics now: 100% operational.`;
  } 
  else if (normalized.startsWith('/pause')) {
    pipelineState = 'paused';
    textResponse = 'Command processed: Pipeline execution workflow PAUSED. Morpheus orchestrator shifted to Awaiting Handoff state.';
    // Update Breach status to Online (idle) or keep busy
    broadcast({ type: 'PIPELINE_MUTATED', pipelineState, activeTarget });
  } 
  else if (normalized.startsWith('/resume')) {
    pipelineState = 'running';
    textResponse = 'Command processed: Pipeline execution workflow RESUMED. Flow resumed';
    broadcast({ type: 'PIPELINE_MUTATED', pipelineState, activeTarget });
  } 
  else if (normalized.startsWith('/logbook summary')) {
    textResponse = `CRYPTOGRAPHIC AUDIT COMPLETED. Chain of custody claims: ${logs.length} logged checkpoints validated successfully under SHA256 integrity trees. Status: APPROVED.`;
  } 
  else if (normalized.startsWith('/cve check ')) {
    const cveId = normalized.replace('/cve check ', '').trim();
    const match = cves.find(c => c.cveId.toLowerCase() === cveId.toLowerCase() || c.id === cveId);
    if (match) {
      textResponse = `VULNERABILITY INDEX FOUND: ${match.cveId} CVSS: ${match.cvss} Severity: ${match.severity}. Vulnerability target: ${match.product}. PoC Available: ${match.pocAvailable}.`;
    } else {
      textResponse = `Vulnerability matching "${cveId}" not verified in local Researcher index database. Try a standard active search.`;
      status = 'error';
    }
  } 
  else if (normalized.startsWith('/breach use ')) {
    const cveId = normalized.replace('/breach use ', '').trim();
    const match = cves.find(c => c.cveId.toLowerCase() === cveId.toLowerCase() || c.id === cveId);
    
    if (match) {
      // 1. Create automatic task in Breach agent if not already existing
      const taskExists = tasks.some(t => t.title.includes(match.cveId) && t.status === 'In Progress');
      if (!taskExists) {
        const breachTask: Task = {
          id: `task-cve-${Date.now()}`,
          agentId: 'agent-breach',
          agentName: 'Breach',
          title: `Automatic exploit for ${match.cveId} targeting ${activeTarget}`,
          status: 'In Progress',
          progress: 'Initiating exploit cycle (25%)',
          progressPercent: 25,
          priority: 'High',
          assignedBy: 'Morpheus Orchestration',
          startTime: new Date().toISOString(),
          estimatedEnd: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        };
        tasks.unshift(breachTask);
      }

      // 2. Mark CVE as Exploit Attempted
      cves = cves.map(c => (c.id === match.id || c.cveId === match.cveId) ? { ...c, status: 'Exploit Attempted' } : c);

      // 3. Create active log in Logbook/Breach of the action
      const l1: LogEntry = {
        id: `log-cve-b1-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agentName: 'Researcher',
        action: `Threat queue payload handoff for ${match.cveId}. Dispatching exploit instructions over encrypted tunnel.`,
        status: 'Info',
        checkpointId: `CP-${1201 + logs.length}`
      };
      const l2: LogEntry = {
        id: `log-cve-b2-${Date.now() + 5}`,
        timestamp: new Date().toISOString(),
        agentName: 'Breach',
        action: `Acquired threat vectors Spec for ${match.cveId}. Initiated automated RCE injection sequence on target ${activeTarget}`,
        status: 'Success',
        checkpointId: `CP-${1202 + logs.length}`
      };
      logs.unshift(l2);
      logs.unshift(l1);

      // 4. Update Breach phase in pipeline to be active or completed
      pipelinePhases = pipelinePhases.map((phase) => {
        if (phase.id === 'p-breach') {
          return {
            ...phase,
            status: 'Active',
            updatedAt: new Date().toISOString(),
            findings: [...phase.findings, `Initiated automated breach exploit payload targeting ${match.cveId}`]
          };
        }
        return phase;
      });

      textResponse = `[Morpheus LOG] Successfully dispatched payload instructions for ${match.cveId} to Breach agent. Started automated task. Proof-of-concept payload queued into pipeline.`;
      
      // Update all clients
      broadcast({
        type: 'PIPELINE_MUTATED',
        pipelineState,
        activeTarget,
        pipelinePhases,
        logs,
        cves,
        agents,
        tasks
      });
    } else {
      textResponse = `Vulnerability matching CVE identifier "${cveId}" not verified in local index database.`;
      status = 'error';
    }
  }
  else if (normalized.startsWith('/redteam ')) {
    const target = normalized.replace('/redteam ', '').trim();
    if (target) {
      activeTarget = target;
      pipelineState = 'running';
      
      // Inject logs to showcase a fresh target pipeline initiation
      const newLog: LogEntry = {
        id: `log-rt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agentName: 'Morpheus',
        action: `Deployed custom RedTeam pipeline flow targeting server [${target}]`,
        status: 'Info',
        checkpointId: `CP-${1030 + logs.length}`
      };
      logs.unshift(newLog);

      // Trigger automatic pipeline reset
      pipelinePhases = pipelinePhases.map((phase) => {
        if (phase.id === 'p-recon') {
          return { ...phase, status: 'Active', updatedAt: new Date().toISOString() };
        }
        return { ...phase, status: 'Pending', updatedAt: new Date().toISOString() };
      });

      textResponse = `Hermes deploy sequence initiated! Targeting endpoint: http://${target}. Initialized Reconnaissance scanners.`;
      broadcast({ type: 'PIPELINE_MUTATED', pipelineState, activeTarget, pipelinePhases, logs });
    } else {
      textResponse = 'Target identifier required for custom deployment. Use style: /redteam {IP/domain}';
      status = 'error';
    }
  } 
  else if (normalized === '/reset') {
    pipelineState = 'running';
    activeTarget = 'staging.target-banking-demo.com:4443';
    
    // Restore default systems & pipeline
    pipelinePhases = pipelinePhases.map((phase) => {
      if (phase.id === 'p-recon' || phase.id === 'p-research') {
        return { ...phase, status: 'Complete' };
      }
      if (phase.id === 'p-breach') {
        return { ...phase, status: 'Active' };
      }
      return { ...phase, status: 'Pending' };
    });

    const resetLog: LogEntry = {
      id: `log-reset-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agentName: 'Logbook',
      action: 'SYSTEM RESET: Manual orchestration command reset redteam environment variables to defaults.',
      status: 'Warning',
      checkpointId: `CP-${1034 + logs.length}`
    };
    logs.unshift(resetLog);

    textResponse = 'Hermes RedTeam Mission Dashboard variables reset to root staging presets.';
    broadcast({ type: 'RESET_TRIGGERED', pipelineState, activeTarget, pipelinePhases, logs });
  } 
  else {
    // Natural Language instruction handling by Morpheus
    textResponse = `Morpheus processed command: "${normalized}". Manual override accepted. Logging command output to active session sequence.`;
    
    // Log as a generic system log
    const genericLog: LogEntry = {
      id: `log-cmd-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agentName: 'Morpheus',
      action: `Executed command sequence: ${normalized}`,
      status: 'Info',
      checkpointId: `CP-${1020 + logs.length}`
    };
    logs.unshift(genericLog);
    broadcast({ type: 'NEW_LOG', log: genericLog });
  }

  // Record command history
  const historyItem = {
    id: `history-${Date.now()}`,
    timestamp: new Date().toISOString(),
    command,
    response: textResponse,
    status
  };
  commandHistory.unshift(historyItem);

  res.json({
    text: textResponse,
    status,
    timestamp: historyItem.timestamp,
    morpheusState: pipelineState === 'paused' ? 'Awaiting Handoff' : 'Listening'
  });
});

// 12. POST /api/agent/{id}/status
app.post('/api/agent/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Online' | 'Offline' | 'Busy'

  if (!status || !['Online', 'Offline', 'Busy'].includes(status)) {
    return res.status(400).json({ error: 'Status parameter must be Online, Offline, or Busy.' });
  }

  let updated = false;
  agents = agents.map(agent => {
    if (agent.id === id) {
      updated = true;
      return {
        ...agent,
        status,
        cpu: status === 'Offline' ? 0 : agent.cpu,
        memory: status === 'Offline' ? 0 : agent.memory
      };
    }
    return agent;
  });

  if (!updated) {
    return res.status(404).json({ error: `Agent index [${id}] not registered.` });
  }

  const modifiedAgent = agents.find(a => a.id === id)!;

  // Add Log Entry
  const statusUpdateLog: LogEntry = {
    id: `log-status-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentName: 'Logbook',
    action: `Agent [${modifiedAgent.name}] updated to status: ${status}. Active diagnostic confirmed.`,
    status: status === 'Offline' ? 'Warning' : 'Success',
    checkpointId: `CP-${1090 + logs.length}`
  };
  logs.unshift(statusUpdateLog);

  broadcast({
    type: 'AGENT_STATUS_CHANGED',
    agentId: id,
    status,
    agents,
    logs
  });

  res.json({ success: true, agent: modifiedAgent });
});

// 13. POST /api/task/{id}/complete
app.post('/api/task/:id/complete', (req, res) => {
  const { id } = req.params;
  let matches = false;
  let taskName = '';
  let tName = '';

  tasks = tasks.map(t => {
    if (t.id === id) {
      matches = true;
      taskName = t.title;
      tName = t.agentName;
      return {
        ...t,
        status: 'Complete',
        progress: '100% completed by user trigger',
        progressPercent: 100
      };
    }
    return t;
  });

  if (!matches) {
    return res.status(404).json({ error: `Task id [${id}] not found in subroutine memory.` });
  }

  const taskLog: LogEntry = {
    id: `log-task-c-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentName: tName || 'Logbook',
    action: `Manual override complete flag raised for subtask: "${taskName}"`,
    status: 'Success',
    checkpointId: `CP-${1110 + logs.length}`
  };
  logs.unshift(taskLog);

  broadcast({
    type: 'TASK_MUTATED',
    tasks,
    logs
  });

  res.json({ success: true, taskId: id, message: 'Subroutine completed.' });
});

// 14. POST /api/task/{id}/terminate
app.post('/api/task/:id/terminate', (req, res) => {
  const { id } = req.params;
  let matches = false;
  let taskName = '';
  let tName = '';

  tasks = tasks.map(t => {
    if (t.id === id) {
      matches = true;
      taskName = t.title;
      tName = t.agentName;
      return {
        ...t,
        status: 'Failed',
        progress: 'Terminated immediately by administrator command',
        progressPercent: 0
      };
    }
    return t;
  });

  if (!matches) {
    return res.status(404).json({ error: `Task id [${id}] not registered.` });
  }

  const taskLog: LogEntry = {
    id: `log-task-t-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentName: tName || 'Logbook',
    action: `MANUAL FORCE TERMINATION: Assignment killed: "${taskName}"`,
    status: 'Failure',
    checkpointId: `CP-${1120 + logs.length}`
  };
  logs.unshift(taskLog);

  broadcast({
    type: 'TASK_MUTATED',
    tasks,
    logs
  });

  res.json({ success: true, taskId: id, message: 'Subroutine terminated.' });
});

// 15. POST /api/tasks (To match Subroutines Injector Form)
app.post('/api/tasks', (req, res) => {
  const { agentId, title, priority, assignedBy } = req.body;
  if (!agentId || !title) {
    return res.status(400).json({ error: 'Agent destination and task description required.' });
  }

  const targetAgent = agents.find(a => a.id === agentId || a.name.toLowerCase() === agentId.toLowerCase());
  if (!targetAgent) {
    return res.status(404).json({ error: `Destination agent role [${agentId}] is invalid.` });
  }

  const newTask: Task = {
    id: `task-gen-${Date.now()}`,
    agentId: targetAgent.id,
    agentName: targetAgent.name,
    title,
    status: 'In Progress',
    progress: '0% initialized',
    progressPercent: 0,
    priority: priority || 'Medium',
    assignedBy: assignedBy || 'User',
    startTime: new Date().toISOString(),
    estimatedEnd: 'Calculated dynamically'
  };

  tasks.unshift(newTask);

  const injectLog: LogEntry = {
    id: `log-task-i-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentName: targetAgent.name,
    action: `Manual subroutine inject sequence triggered: "${title}" (Priority: ${priority})`,
    status: 'Info',
    checkpointId: `CP-${1150 + logs.length}`
  };
  logs.unshift(injectLog);

  broadcast({
    type: 'TASK_MUTATED',
    tasks,
    logs
  });

  res.json(newTask);
});

// 16. POST /api/command/history (To clear or retrieve command history)
app.get('/api/command/history', (req, res) => {
  res.json(commandHistory);
});


// 3. Vite middleware for development vs static serve for production
if (process.env.NODE_ENV !== 'production') {
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Fallback for everything else
    app.use('*', (req, res, next) => {
      vite.middlewares(req, res, next);
    });
  });
} else {
  // Static pathing for built files
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  // SPA routing fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Listen on strict hardcoded port 3000
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Hermes System Server running at: http://0.0.0.0:${PORT}]`);
});
