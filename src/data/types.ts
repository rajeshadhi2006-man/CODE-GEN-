export type UserRole = 
  | 'Super Admin' 
  | 'Workforce Manager' 
  | 'Project Manager' 
  | 'Team Lead' 
  | 'Employee' 
  | 'Executive';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  org_id: string;
  avatar: string;
  email: string;
}

export type EmployeeStatus = 'Available' | 'OnLeave' | 'Unavailable';

export interface PerformanceMetrics {
  quality: number; // 0-100
  on_time: number; // 0-100
  tasks_completed_30d: number;
}

export interface ShiftInfo {
  start: string; // "09:00"
  end: string;   // "18:00"
}

export interface EmployeeSkillProficiency {
  skill_id: string;
  proficiency_pct: number; // 0-100
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
  current_tasks: string[]; // Task IDs
  shift: ShiftInfo;
  certifications: string[];
  avatar: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'Cloud' | 'DevOps' | 'Data & AI' | 'Backend' | 'Frontend' | 'Security';
}

export interface Team {
  id: string;
  name: string;
  lead_id: string;
  member_ids: string[];
  region: string;
}

export interface LocationInfo {
  id: string;
  name: string;
  region: string;
  timezone: string;
  headcount: number;
}

export interface Client {
  id: string;
  name: string;
  tier: 'Enterprise Platinum' | 'Enterprise Gold' | 'Strategic Partner';
}

export interface Project {
  id: string;
  name: string;
  client_id: string;
  task_ids: string[];
  sla_target_pct: number;
  health: 'Healthy' | 'AtRisk' | 'Critical';
  region: string;
}

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

export interface Task {
  id: string;
  code: string; // e.g. "T-104"
  name: string;
  project_id: string;
  priority: TaskPriority;
  business_impact_score: number; // 0-100
  required_skills: { skill_id: string; min_proficiency: number }[];
  estimated_effort_min: number;
  remaining_effort_min: number;
  sla_deadline: string; // ISO String
  dependency_ids: string[];
  assigned_employee_id: string | null;
  status: TaskStatus;
  created_at: string;
}

export interface Assignment {
  id: string;
  task_id: string;
  employee_id: string;
  assigned_at: string;
  unassigned_at?: string;
  reason: string;
}

export interface SLAPolicy {
  priority_tier: TaskPriority;
  max_duration_min: number;
  critical_buffer_min: number;
  high_buffer_min: number;
}

export type SLARiskTier = 'Low' | 'Medium' | 'High' | 'Critical' | 'Breached';

export interface SLARiskMetrics {
  remaining_sla_min: number;
  estimated_completion_min: number;
  safety_buffer_min: number;
  risk_score: number; // 0-100
  risk_tier: SLARiskTier;
  explanation: string;
  projections: {
    now: number;
    plus15: number;
    plus30: number;
    plus60: number;
  };
}

export interface ScoreBreakdown {
  skill: number;           // 0-100
  sla: number;             // 0-100
  availability: number;    // 0-100
  workload: number;        // 0-100
  performance: number;     // 0-100
  location: number;        // 0-100
  business_impact: number; // 0-100
}

export interface AllocationWeights {
  skill: number;           // Default 30%
  sla: number;             // Default 25%
  availability: number;    // Default 15%
  workload: number;        // Default 10%
  performance: number;     // Default 10%
  location: number;        // Default 5%
  business_impact: number; // Default 5%
}

export interface AllocationScore {
  id: string;
  task_id: string;
  employee_id: string;
  breakdown: ScoreBreakdown;
  total_score: number; // 0-100
  computed_at: string;
  rank?: number;
  delta_reason?: string;
}

export interface CandidateAlternative {
  employee_id: string;
  employee_name: string;
  score: number;
  breakdown: ScoreBreakdown;
  reason: string;
}

export type ApprovalLevel = 'Auto' | 'Manager' | 'Executive';

export interface AIRecommendation {
  id: string;
  task_id: string;
  from_employee_id: string | null;
  to_employee_id: string;
  score: AllocationScore;
  reason: string;
  impact: {
    before_sla_risk: number;
    after_sla_risk: number;
    before_utilization: number;
    after_utilization: number;
  };
  alternatives: CandidateAlternative[];
  required_approval_level: ApprovalLevel;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  event_type: 'REALLOCATION' | 'DISRUPTION' | 'SLA_BREACH_PREVENTED' | 'MANUAL_OVERRIDE' | 'POLICY_CHANGE' | 'SIMULATION_APPLIED';
  task_id?: string;
  task_code?: string;
  before: string; // e.g. "Assigned to E-023 (Priya Nair)"
  after: string;  // e.g. "Reallocated to E-017 (Marcus Vance)"
  reason: string;
  score?: number;
  approval_outcome: 'AUTO_APPROVED' | 'MANAGER_APPROVED' | 'EXECUTIVE_APPROVED' | 'REJECTED';
}

export interface NotificationItem {
  id: string;
  category: 'Critical' | 'SLA' | 'Workforce' | 'AI Recommendation' | 'Approval' | 'System';
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'info' | 'success';
  created_at: string;
  read: boolean;
  action_link?: string;
}

export interface ScenarioSimulationParams {
  id: string;
  name: string;
  description: string;
  scenario_type: 'EMPLOYEE_UNAVAILABLE' | 'DEMAND_SPIKE' | 'SLA_REDUCTION' | 'SKILL_SHORTAGE' | 'REGIONAL_OUTAGE';
  target_employee_id?: string;
  affected_count?: number;
  sla_reduction_pct?: number;
}

export interface MetricSnapshot {
  sla_compliance_pct: number;
  average_utilization_pct: number;
  at_risk_tasks_count: number;
  critical_tasks_count: number;
  unassigned_count: number;
  breach_predicted_count: number;
}
