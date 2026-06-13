export interface Agent {
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

export interface Task {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  status: 'In Progress' | 'Complete' | 'Waiting' | 'Failed';
  progress: string; // e.g., "3/5 exploits tried" or percentage
  progressPercent: number;
  priority: 'High' | 'Medium' | 'Low';
  assignedBy: 'User' | 'Morpheus' | string;
  startTime: string;
  estimatedEnd: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  agentName: string;
  action: string;
  status: 'Success' | 'Failure' | 'Warning' | 'Info';
  evidenceLink?: string;
  checkpointId?: string;
}

export interface CveEntry {
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

export type PhaseStatus = 'Complete' | 'Active' | 'Pending' | 'Failed';

export interface PipelinePhase {
  id: string;
  name: string;
  status: PhaseStatus;
  agentRole: string;
  completedAt?: string;
  updatedAt: string;
  findings: string[];
}

export interface MorpheusCommand {
  id: string;
  timestamp: string;
  command: string;
  initiatedBy: 'User' | 'Orchestrator';
  response: string;
  status: 'success' | 'executing' | 'error';
}

export type MorpheusState = 'Listening' | 'Processing' | 'Awaiting Handoff' | 'Escalated';
