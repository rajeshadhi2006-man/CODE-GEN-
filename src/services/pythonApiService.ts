import { 
  Task, 
  Employee, 
  AllocationWeights, 
  AllocationScore, 
  SLARiskMetrics, 
  AIRecommendation 
} from '../data/types';

export const PYTHON_API_BASE_URL = 'http://127.0.0.1:8000';

export interface PythonHealthResponse {
  status: string;
  version: string;
  python_version: string;
  supabase_connected: boolean;
  supabase_url: string;
  engine: string;
  timestamp: string;
}

export interface DisruptionSimulationResponse {
  disrupted_employee: Employee;
  affected_tasks: Task[];
  recommendations: AIRecommendation[];
  before_metrics: {
    utilization: number;
    compliance: number;
    at_risk_count: number;
  };
  after_metrics: {
    utilization: number;
    compliance: number;
    at_risk_count: number;
  };
  recovered_metrics: {
    utilization: number;
    compliance: number;
    at_risk_count: number;
  };
}

/**
 * Check if the Python AI Optimization backend is currently online and healthy.
 */
export async function checkPythonHealth(): Promise<{ online: boolean; data?: PythonHealthResponse }> {
  try {
    const res = await fetch(`${PYTHON_API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return { online: false };
    const data: PythonHealthResponse = await res.json();
    return { online: true, data };
  } catch {
    return { online: false };
  }
}

/**
 * Run multi-task Hungarian / deterministic optimization on the Python backend.
 */
export async function optimizeWithPython(
  tasks: Task[], 
  employees: Employee[], 
  weights?: AllocationWeights
): Promise<AIRecommendation[] | null> {
  try {
    const res = await fetch(`${PYTHON_API_BASE_URL}/api/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks, employees, weights }),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[Python API] Optimize fallback to client:', err);
    return null;
  }
}

/**
 * Compute 7-factor deterministic score using Python numpy engine.
 */
export async function calculatePythonScore(
  task: Task, 
  employee: Employee, 
  weights?: AllocationWeights
): Promise<AllocationScore | null> {
  try {
    const res = await fetch(`${PYTHON_API_BASE_URL}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, employee, weights }),
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Compute live dynamic SLA risk metrics using Python SLA engine.
 */
export async function evaluatePythonSLARisk(
  task: Task, 
  employee?: Employee
): Promise<SLARiskMetrics | null> {
  try {
    const res = await fetch(`${PYTHON_API_BASE_URL}/api/sla-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, employee }),
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Run outage blast radius simulation on the Python backend.
 */
export async function simulateDisruptionWithPython(
  employeeId: string, 
  tasks: Task[], 
  employees: Employee[], 
  weights?: AllocationWeights
): Promise<DisruptionSimulationResponse | null> {
  try {
    const res = await fetch(`${PYTHON_API_BASE_URL}/api/simulate-disruption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: employeeId, tasks, employees, weights }),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[Python API] Simulation fallback to client:', err);
    return null;
  }
}

export interface EmailDispatchRecord {
  id: string;
  task_id: string;
  task_name: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  status: 'Delivered via SMTP' | 'Simulated Dispatch (SMTP Unconfigured)' | 'Failed';
  timestamp: string;
  smtp_host?: string;
  error_message?: string;
  html_preview?: string;
}

export interface ExpertMatchCandidate {
  employee: Employee;
  skill_proficiency: number;
  capacity_remaining_hours: number;
  on_time_rate: number;
  overall_match_score: number;
  is_top_match: boolean;
  match_reasons: string[];
}

export interface ExpertMatchResponse {
  skill_id: string;
  total_candidates: number;
  top_match?: ExpertMatchCandidate;
  candidates: ExpertMatchCandidate[];
  message: string;
}

/**
 * Dispatch automated task assignment email via Python SMTP service.
 * Strictly single-recipient isolation.
 */
export async function sendAssignmentEmail(
  task: Task,
  employee: Employee,
  customNote?: string,
  matchReason?: string
): Promise<EmailDispatchRecord | null> {
  try {
    const res = await fetch(`${PYTHON_API_BASE_URL}/api/notifications/send-assignment-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task,
        employee,
        custom_note: customNote,
        match_reason: matchReason
      }),
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) {
      console.warn('[Python API] Email dispatch returned non-200:', res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('[Python API] Email dispatch fetch error:', err);
    return null;
  }
}

/**
 * Retrieve recent email dispatch audit log from Python backend outbox.
 */
export async function getNotificationOutbox(limit = 50): Promise<EmailDispatchRecord[]> {
  try {
    const res = await fetch(`${PYTHON_API_BASE_URL}/api/notifications/outbox?limit=${limit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Real-time expert talent matching query (e.g. find top Python specialist).
 */
export async function findBestExpert(
  skillId: string,
  employees: Employee[],
  minProficiency = 70.0,
  taskId?: string,
  taskName?: string
): Promise<ExpertMatchResponse | null> {
  try {
    const res = await fetch(`${PYTHON_API_BASE_URL}/api/match-expert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skill_id: skillId,
        min_proficiency: minProficiency,
        task_id: taskId,
        task_name: taskName,
        employees
      }),
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[Python API] Expert match failed:', err);
    return null;
  }
}

