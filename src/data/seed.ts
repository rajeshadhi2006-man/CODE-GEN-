import { 
  Employee, 
  Task, 
  Project, 
  Skill, 
  Client, 
  LocationInfo, 
  AuditLog, 
  NotificationItem,
  User 
} from './types';

/**
 * Seeded pseudo-random number generator (Mulberry32)
 * Ensures 100% deterministic, reproducible data generation without Math.random()
 */
class SeededRNG {
  private s: number;

  constructor(seed: number = 428913) {
    this.s = seed;
  }

  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }
}

export const SKILLS_LIST: Skill[] = [
  { id: 'sk-k8s', name: 'Kubernetes & Service Mesh', category: 'DevOps' },
  { id: 'sk-aws', name: 'AWS Cloud Architecture', category: 'Cloud' },
  { id: 'sk-azure', name: 'Azure Cloud & DevOps', category: 'Cloud' },
  { id: 'sk-db', name: 'Distributed PostgreSQL & Sharding', category: 'Backend' },
  { id: 'sk-kafka', name: 'Kafka & Event Streaming', category: 'Data & AI' },
  { id: 'sk-sec', name: 'Zero-Trust Security & DevSecOps', category: 'Security' },
  { id: 'sk-tf', name: 'Terraform & Infrastructure-as-Code', category: 'DevOps' },
  { id: 'sk-go', name: 'Go Microservices Architecture', category: 'Backend' },
  { id: 'sk-python', name: 'Python Data Pipelines & ML Ops', category: 'Data & AI' },
  { id: 'sk-react', name: 'React & High-Density UI Architecture', category: 'Frontend' },
  { id: 'sk-obs', name: 'Observability & OpenTelemetry', category: 'DevOps' },
  { id: 'sk-net', name: 'SDN & Hybrid Cloud Networking', category: 'Cloud' },
];

export const CLIENTS_LIST: Client[] = [
  { id: 'cli-1', name: 'Global Financial Holdings', tier: 'Enterprise Platinum' },
  { id: 'cli-2', name: 'Vanguard Telecommunications', tier: 'Enterprise Platinum' },
  { id: 'cli-3', name: 'Aether Cloud Health', tier: 'Enterprise Gold' },
  { id: 'cli-4', name: 'Nordic Logistics Logistics Group', tier: 'Enterprise Gold' },
  { id: 'cli-5', name: 'Horizon Autonomous Mobility', tier: 'Strategic Partner' },
  { id: 'cli-6', name: 'Apex Retail Omnichannel', tier: 'Enterprise Gold' },
];

export const LOCATIONS_LIST: LocationInfo[] = [
  { id: 'loc-1', name: 'Singapore Hub', region: 'APAC', timezone: 'UTC+8', headcount: 85 },
  { id: 'loc-2', name: 'London Tech Center', region: 'EMEA', timezone: 'UTC+0', headcount: 95 },
  { id: 'loc-3', name: 'New York Delivery Center', region: 'Americas', timezone: 'UTC-5', headcount: 110 },
  { id: 'loc-4', name: 'Bengaluru Innovation Center', region: 'South Asia', timezone: 'UTC+5:30', headcount: 120 },
  { id: 'loc-5', name: 'São Paulo Cloud Office', region: 'LATAM', timezone: 'UTC-3', headcount: 65 },
];

const FIRST_NAMES = [
  'Marcus', 'Priya', 'Elena', 'David', 'Liam', 'Chen', 'Amara', 'Mateo', 'Aisha', 'Lucas',
  'Sofia', 'Alexander', 'Fatima', 'Kai', 'Zara', 'Julian', 'Mei', 'Gabriel', 'Ananya', 'Tariq',
  'Chloe', 'Sanjay', 'Viktor', 'Hannah', 'Kaito', 'Olivia', 'Rajesh', 'Leila', 'Felix', 'Maya'
];

const LAST_NAMES = [
  'Vance', 'Nair', 'Rostova', 'Kim', 'O\'Connor', 'Wei', 'Adeyemi', 'Silva', 'Al-Mansoor', 'Dubois',
  'Novak', 'Tanaka', 'Ibrahim', 'Berg', 'Patel', 'Larsen', 'Zhang', 'Castillo', 'Sharma', 'Haddad',
  'Mercer', 'Rao', 'Vogel', 'Lindqvist', 'Sato', 'Bennett', 'Verma', 'Gomez', 'Mendoza', 'Sorensen'
];

const TITLES = [
  'Staff Cloud Architect',
  'Senior Platform Engineer',
  'Principal SRE',
  'Lead Database Engineer',
  'Senior Distributed Systems Engineer',
  'SecOps Lead',
  'Senior DevOps Engineer',
  'Cloud Infrastructure Consultant',
  'Data Platform Engineer',
  'Principal Cloud Consultant'
];

export interface InitialDataset {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  currentUser: User;
}

export function generateSeededData(baseTimestamp?: number): InitialDataset {
  const rng = new SeededRNG(987654);
  const nowMs = baseTimestamp || Date.now();

  // 1. Generate 360 Employees
  const employees: Employee[] = [];

  // Anchor Key Employees for Section 9 Demo Script:
  // E-023: Priya Nair (Current assignee for critical task T-104)
  const employeeE023: Employee = {
    id: 'E-023',
    name: 'Priya Nair',
    title: 'Staff Cloud & DB Architect',
    email: 'priya.nair@nexus.corp',
    location: 'Bengaluru Innovation Center',
    region: 'South Asia',
    timezone: 'UTC+5:30',
    skills: [
      { skill_id: 'sk-db', proficiency_pct: 95 },
      { skill_id: 'sk-aws', proficiency_pct: 92 },
      { skill_id: 'sk-k8s', proficiency_pct: 88 },
      { skill_id: 'sk-tf', proficiency_pct: 85 }
    ],
    performance: { quality: 94, on_time: 96, tasks_completed_30d: 14 },
    capacity_hours: 40,
    utilization_pct: 88,
    status: 'Available', // Initially available, will be disrupted in demo
    current_tasks: ['task-104', 'task-208', 'task-312'],
    shift: { start: '09:00', end: '18:00' },
    certifications: ['AWS Solutions Architect Pro', 'PostgreSQL Certified Architect'],
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  };
  employees.push(employeeE023);

  // E-017: Marcus Vance (Prime AI alternative with high match, low utilization)
  const employeeE017: Employee = {
    id: 'E-017',
    name: 'Marcus Vance',
    title: 'Lead Distributed Systems Architect',
    email: 'marcus.vance@nexus.corp',
    location: 'London Tech Center',
    region: 'EMEA',
    timezone: 'UTC+0',
    skills: [
      { skill_id: 'sk-db', proficiency_pct: 97 },
      { skill_id: 'sk-aws', proficiency_pct: 94 },
      { skill_id: 'sk-k8s', proficiency_pct: 91 },
      { skill_id: 'sk-sec', proficiency_pct: 84 }
    ],
    performance: { quality: 98, on_time: 98, tasks_completed_30d: 18 },
    capacity_hours: 40,
    utilization_pct: 68, // Optimal capacity headroom
    status: 'Available',
    current_tasks: ['task-102'],
    shift: { start: '09:00', end: '18:00' },
    certifications: ['AWS Solutions Architect Pro', 'CKA', 'HashiCorp Vault Certified'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  };
  employees.push(employeeE017);

  // Remaining 358 employees
  const regions: ('Americas' | 'EMEA' | 'APAC' | 'LATAM' | 'South Asia')[] = [
    'Americas', 'EMEA', 'APAC', 'LATAM', 'South Asia'
  ];

  for (let i = 3; i <= 360; i++) {
    const id = `E-${i.toString().padStart(3, '0')}`;
    if (id === 'E-017' || id === 'E-023') continue;
    const firstName = rng.pick(FIRST_NAMES);
    const lastName = rng.pick(LAST_NAMES);
    const region = rng.pick(regions);
    const loc = LOCATIONS_LIST.find(l => l.region === region) || LOCATIONS_LIST[0];
    
    // Select 3 to 6 skills
    const numSkills = rng.range(3, 6);
    const empSkills: { skill_id: string; proficiency_pct: number }[] = [];
    const availableSkills = [...SKILLS_LIST];
    
    for (let s = 0; s < numSkills; s++) {
      const picked = rng.pick(availableSkills);
      empSkills.push({
        skill_id: picked.id,
        proficiency_pct: rng.range(50, 99)
      });
      const idx = availableSkills.indexOf(picked);
      if (idx > -1) availableSkills.splice(idx, 1);
    }

    // Realistic utilization: majority around 70-85%, handful near 95%
    const utilRoll = rng.next();
    let utilPct = 78;
    if (utilRoll < 0.12) utilPct = rng.range(40, 60); // underutilized
    else if (utilRoll < 0.80) utilPct = rng.range(70, 84); // normal
    else if (utilRoll < 0.94) utilPct = rng.range(85, 92); // high
    else utilPct = rng.range(93, 98); // overloaded

    const statusRoll = rng.next();
    let status: Employee['status'] = 'Available';
    if (statusRoll < 0.05) status = 'OnLeave';
    else if (statusRoll < 0.08) status = 'Unavailable';

    employees.push({
      id,
      name: `${firstName} ${lastName}`,
      title: rng.pick(TITLES),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@nexus.corp`,
      location: loc.name,
      region,
      timezone: loc.timezone,
      skills: empSkills,
      performance: {
        quality: rng.range(82, 99),
        on_time: rng.range(84, 99),
        tasks_completed_30d: rng.range(6, 22)
      },
      capacity_hours: 40,
      utilization_pct: utilPct,
      status,
      current_tasks: [],
      shift: { start: '09:00', end: '18:00' },
      certifications: ['Certified Cloud Practitioner'],
      avatar: `https://images.unsplash.com/photo-${1500000000000 + (i * 243217) % 90000000}?w=150`
    });
  }

  // 2. Generate 48 Projects
  const projects: Project[] = [];
  const projectNames = [
    'Global Payments Core Modernization',
    'Omnichannel Cloud Native Gateway',
    'Real-time Risk Ingestion Pipeline',
    'Zero Trust Perimeter Rollout',
    'Cross-Cloud Disaster Recovery Fabric',
    'Autonomous SRE Telemetry Lake',
    'AI Inference Scaling Cluster',
    'High-Throughput Kafka Broker Cluster',
    'Kubernetes Multi-Cluster Orchestration',
    'Multi-Tenant Auth & Token Service',
    'Distributed Database Sharding Phase II',
    'LATAM Cloud Migration Accelerator'
  ];

  for (let p = 1; p <= 48; p++) {
    const client = rng.pick(CLIENTS_LIST);
    const region = rng.pick(regions);
    const name = `${client.name.split(' ')[0]} ${rng.pick(projectNames)} ${p <= 12 ? '' : `Phase ${Math.floor(p / 12) + 1}`}`.trim();
    
    projects.push({
      id: `proj-${p}`,
      name,
      client_id: client.id,
      task_ids: [],
      sla_target_pct: rng.pick([95, 98, 99]),
      health: p % 8 === 0 ? 'AtRisk' : 'Healthy',
      region
    });
  }

  // 3. Generate 620 Tasks
  const tasks: Task[] = [];
  const taskNames = [
    'Database Failover Validation',
    'Canary Deployment Ingress Routing',
    'TLS Certificate Authority Rotation',
    'Kafka Partition Rebalancing',
    'Zero-Day Vulnerability Patching',
    'IAM Policy Least-Privilege Audit',
    'Multi-AZ Replication Health Check',
    'Redis Cache Shard Provisioning',
    'Terraform State Drift Remediation',
    'OpenTelemetry Collector Tuning',
    'Production DB Migration & Verification',
    'API Gateway Rate Limiter Calibration'
  ];

  // Anchor Demo Task T-104
  const taskT104: Task = {
    id: 'task-104',
    code: 'T-104',
    name: 'Production DB Migration & Zero-Downtime Cutover',
    project_id: 'proj-1',
    priority: 'Critical',
    business_impact_score: 95,
    required_skills: [
      { skill_id: 'sk-db', min_proficiency: 85 },
      { skill_id: 'sk-aws', min_proficiency: 80 }
    ],
    estimated_effort_min: 150,
    remaining_effort_min: 120,
    // 165 minutes remaining from now
    sla_deadline: new Date(nowMs + 165 * 60 * 1000).toISOString(),
    dependency_ids: ['task-101', 'task-102'],
    assigned_employee_id: 'E-023', // Priya Nair
    status: 'InProgress',
    created_at: new Date(nowMs - 180 * 60 * 1000).toISOString()
  };
  tasks.push(taskT104);

  // Demo Task T-208
  const taskT208: Task = {
    id: 'task-208',
    code: 'T-208',
    name: 'Replication Lag Stabilization & Verification',
    project_id: 'proj-1',
    priority: 'High',
    business_impact_score: 80,
    required_skills: [{ skill_id: 'sk-db', min_proficiency: 75 }],
    estimated_effort_min: 90,
    remaining_effort_min: 75,
    sla_deadline: new Date(nowMs + 240 * 60 * 1000).toISOString(),
    dependency_ids: ['task-104'],
    assigned_employee_id: 'E-023',
    status: 'Assigned',
    created_at: new Date(nowMs - 120 * 60 * 1000).toISOString()
  };
  tasks.push(taskT208);

  // Demo Task T-312
  const taskT312: Task = {
    id: 'task-312',
    code: 'T-312',
    name: 'Telemetry Ingress Buffer Patch',
    project_id: 'proj-2',
    priority: 'Medium',
    business_impact_score: 65,
    required_skills: [{ skill_id: 'sk-aws', min_proficiency: 70 }],
    estimated_effort_min: 60,
    remaining_effort_min: 50,
    sla_deadline: new Date(nowMs + 360 * 60 * 1000).toISOString(),
    dependency_ids: [],
    assigned_employee_id: 'E-023',
    status: 'Ready',
    created_at: new Date(nowMs - 60 * 60 * 1000).toISOString()
  };
  tasks.push(taskT312);

  // Remaining tasks
  const priorities: Task['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
  const statuses: Task['status'][] = [
    'Backlog', 'Ready', 'Assigned', 'InProgress', 'Blocked', 'AtRisk', 'Escalated', 'Completed'
  ];

  for (let t = 4; t <= 620; t++) {
    if (t === 104 || t === 208 || t === 312) continue;
    const code = `T-${t.toString().padStart(3, '0')}`;
    const project = rng.pick(projects);
    const priorityRoll = rng.next();
    let priority: Task['priority'] = 'Medium';
    if (priorityRoll < 0.12) priority = 'Critical';
    else if (priorityRoll < 0.35) priority = 'High';
    else if (priorityRoll < 0.75) priority = 'Medium';
    else priority = 'Low';

    const reqSkill = rng.pick(SKILLS_LIST);
    const effortMin = rng.range(45, 360);
    const remainingMin = Math.round(effortMin * rng.range(30, 95) / 100);

    // Deadline spread
    const deadlineHours = rng.range(2, 48);
    const slaDeadline = new Date(nowMs + deadlineHours * 60 * 60 * 1000).toISOString();

    // Assign to an employee or leave unassigned
    const isAssigned = rng.next() > 0.08;
    const assignedEmp = isAssigned ? rng.pick(employees) : null;

    let status: Task['status'] = 'InProgress';
    if (!assignedEmp) status = 'Ready';
    else if (rng.next() < 0.06) status = 'AtRisk';
    else if (rng.next() < 0.03) status = 'Blocked';

    // 15% dependencies
    const deps: string[] = [];
    if (rng.next() < 0.15 && t > 10) {
      deps.push(`task-${t - rng.range(1, 8)}`);
    }

    const taskObj: Task = {
      id: `task-${t}`,
      code,
      name: `${rng.pick(taskNames)} (${code})`,
      project_id: project.id,
      priority,
      business_impact_score: rng.range(40, 98),
      required_skills: [
        { skill_id: reqSkill.id, min_proficiency: rng.range(65, 85) }
      ],
      estimated_effort_min: effortMin,
      remaining_effort_min: remainingMin,
      sla_deadline: slaDeadline,
      dependency_ids: deps,
      assigned_employee_id: assignedEmp ? assignedEmp.id : null,
      status,
      created_at: new Date(nowMs - rng.range(1, 72) * 60 * 60 * 1000).toISOString()
    };

    tasks.push(taskObj);
    project.task_ids.push(taskObj.id);
    if (assignedEmp) {
      assignedEmp.current_tasks.push(taskObj.id);
    }
  }

  // 4. Initial Audit Logs
  const auditLogs: AuditLog[] = [
    {
      id: 'audit-001',
      timestamp: new Date(nowMs - 35 * 60 * 1000).toISOString(),
      actor: 'NEXUS Autonomous Engine',
      event_type: 'REALLOCATION',
      task_id: 'task-88',
      task_code: 'T-088',
      before: 'Assigned to E-042 (Elena Rostova)',
      after: 'Reallocated to E-105 (Amara Adeyemi)',
      reason: 'SLA safety buffer decay (-24 min); Amara has 94% AWS proficiency and 32% headroom.',
      score: 89,
      approval_outcome: 'AUTO_APPROVED'
    },
    {
      id: 'audit-002',
      timestamp: new Date(nowMs - 15 * 60 * 1000).toISOString(),
      actor: 'Workforce Manager (Sarah Jenkins)',
      event_type: 'MANUAL_OVERRIDE',
      task_id: 'task-54',
      task_code: 'T-054',
      before: 'Assigned to E-019 (Lucas Dubois)',
      after: 'Reassigned to E-077 (Mei Zhang)',
      reason: 'Client-requested SME alignment for Singapore financial regulator audit.',
      score: 84,
      approval_outcome: 'MANAGER_APPROVED'
    }
  ];

  // 5. Initial Notifications
  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      category: 'SLA',
      title: 'SLA Buffer Threshold Warning',
      message: 'APAC Task T-092 has dropped below 30m safety buffer.',
      severity: 'high',
      created_at: new Date(nowMs - 12 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: 'notif-2',
      category: 'AI Recommendation',
      title: 'Optimization Opportunity Identified',
      message: 'Autonomous engine identified 4 workload balancing reassignments across EMEA.',
      severity: 'info',
      created_at: new Date(nowMs - 22 * 60 * 1000).toISOString(),
      read: false
    }
  ];

  // 6. Current User (Default Super Admin with switcher available)
  const currentUser: User = {
    id: 'usr-admin-01',
    name: 'Devon Sterling',
    role: 'Super Admin',
    org_id: 'org-global-ops',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    email: 'devon.sterling@nexus.corp'
  };

  return {
    employees,
    projects,
    tasks,
    auditLogs,
    notifications,
    currentUser
  };
}
