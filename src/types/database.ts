export type EmployeeStatus = 'Available' | 'OnLeave' | 'Unavailable';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TaskStatus = 
  | 'Backlog' 
  | 'Ready' 
  | 'Assigned' 
  | 'InProgress' 
  | 'Blocked' 
  | 'AtRisk' 
  | 'Escalated' 
  | 'Completed';

export interface PastWork {
  id: string;
  title: string;
  organization: string;
  period?: string;
  description: string;
  technologies: string[];
  impact?: string;
  source?: 'Resume' | 'GitHub' | 'CVE' | 'Certificate';
}

export interface PerformanceMetrics {
  quality: number;
  on_time: number;
  tasks_completed_30d: number;
  past_works?: PastWork[];
}

export interface ShiftInfo {
  start: string;
  end: string;
}

export interface EmployeeSkillProficiency {
  skill_id: string;
  proficiency_pct: number;
}

export interface Employee {
  id: string;
  name: string;
  title: string;
  email: string;
  location: string;
  region: 'Americas' | 'EMEA' | 'APAC' | 'LATAM' | 'South Asia';
  timezone: string;
  skills: EmployeeSkillProficiency[];
  performance: PerformanceMetrics;
  capacity_hours: number;
  utilization_pct: number;
  status: EmployeeStatus;
  shift: ShiftInfo;
  certifications: string[];
  avatar?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  client_id?: string;
  client_name?: string;
  client_tier?: string;
  sla_target_pct?: number;
  health: 'Healthy' | 'AtRisk' | 'Critical';
  region?: string;
  created_at?: string;
}

export interface Task {
  id: string;
  code: string;
  name: string;
  project_id?: string;
  priority: TaskPriority;
  business_impact_score?: number;
  required_skills?: { skill_id: string; min_proficiency: number }[];
  estimated_effort_min: number;
  remaining_effort_min: number;
  sla_deadline: string;
  dependency_ids?: string[];
  assigned_employee_id?: string | null;
  status: TaskStatus;
  created_at?: string;
}

export interface AIRecommendation {
  id: string;
  task_id: string;
  source_employee_id?: string;
  target_employee_id?: string;
  score?: number;
  confidence?: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  reasoning_factors?: Record<string, any>;
  sla_recovery_min?: number;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  event_type: string;
  before?: string;
  after?: string;
  reason?: string;
  approval_outcome?: string;
}

export interface AllocationWeights {
  id: string;
  skill: number;
  sla: number;
  availability: number;
  workload: number;
  performance: number;
  updated_at?: string;
}
