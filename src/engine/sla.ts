import { Task, Employee, SLARiskMetrics, SLARiskTier } from '../data/types';

/**
 * Priority weighting multipliers for SLA risk
 */
const PRIORITY_RISK_MULTIPLIERS: Record<Task['priority'], number> = {
  'Critical': 1.4,
  'High': 1.2,
  'Medium': 1.0,
  'Low': 0.8
};

/**
 * Computes the effective rate of work based on assignee history
 */
export function getEmployeeEffectiveRate(employee?: Employee | null): number {
  if (!employee) return 0.5; // Unassigned task moves at zero/penalized rate
  if (employee.status !== 'Available') return 0.2; // Unavailable engineer stalls task
  
  // Rate based on on-time rating and current load
  const loadFactor = employee.utilization_pct > 90 ? 0.75 : 1.0;
  const onTimeFactor = 0.8 + (employee.performance.on_time / 100) * 0.4; // 0.8 to 1.2
  return onTimeFactor * loadFactor;
}

/**
 * Evaluates SLA Risk metrics for a specific task
 */
export function calculateSLARisk(
  task: Task, 
  assignedEmployee?: Employee | null, 
  nowMs: number = Date.now()
): SLARiskMetrics {
  const deadlineMs = new Date(task.sla_deadline).getTime();
  const remainingSlaMin = Math.round((deadlineMs - nowMs) / (1000 * 60));

  const effectiveRate = getEmployeeEffectiveRate(assignedEmployee);
  const estimatedCompletionMin = Math.round(task.remaining_effort_min / Math.max(0.1, effectiveRate));
  const safetyBufferMin = remainingSlaMin - estimatedCompletionMin;

  // Compute 0-100 risk score
  let baseRisk = 0;
  if (remainingSlaMin <= 0 || safetyBufferMin < -60) {
    baseRisk = 99; // Breached or catastrophic
  } else if (safetyBufferMin < 0) {
    // Already projected to finish late
    const latenessRatio = Math.min(1, Math.abs(safetyBufferMin) / Math.max(1, remainingSlaMin));
    baseRisk = 75 + latenessRatio * 20;
  } else if (safetyBufferMin < 30) {
    baseRisk = 50 + (30 - safetyBufferMin) * 0.8;
  } else if (safetyBufferMin < 60) {
    baseRisk = 30 + (60 - safetyBufferMin) * 0.6;
  } else if (safetyBufferMin < 120) {
    baseRisk = 15 + (120 - safetyBufferMin) * 0.25;
  } else {
    baseRisk = Math.max(5, 15 - (safetyBufferMin - 120) * 0.05);
  }

  // Multiply by priority and dependency pressure
  const priorityMult = PRIORITY_RISK_MULTIPLIERS[task.priority] || 1.0;
  const depPressure = Math.min(15, task.dependency_ids.length * 5);
  const unassignedPenalty = assignedEmployee ? 0 : 25;

  const rawScore = (baseRisk * priorityMult) + depPressure + unassignedPenalty;
  const riskScore = Math.min(100, Math.max(1, Math.round(rawScore)));

  // Determine Risk Tier
  let riskTier: SLARiskTier = 'Low';
  if (remainingSlaMin <= 0 || safetyBufferMin < -10) {
    riskTier = 'Breached';
  } else if (riskScore >= 80) {
    riskTier = 'Critical';
  } else if (riskScore >= 55) {
    riskTier = 'High';
  } else if (riskScore >= 30) {
    riskTier = 'Medium';
  } else {
    riskTier = 'Low';
  }

  // Formulate mathematical plain-language explanation
  let explanation = '';
  if (remainingSlaMin <= 0) {
    explanation = `SLA breached by ${Math.abs(remainingSlaMin)} minutes. Immediate escalation required.`;
  } else if (safetyBufferMin < 0) {
    explanation = `Projected completion exceeds SLA deadline by ${Math.abs(safetyBufferMin)} minutes under current resource rate (${Math.round(effectiveRate * 100)}%).`;
  } else if (safetyBufferMin < 45) {
    explanation = `Tight safety buffer of only ${safetyBufferMin}m remaining. High risk of breach if blockers occur.`;
  } else if (!assignedEmployee) {
    explanation = `Task is currently unassigned with ${remainingSlaMin}m to deadline. Risk compounding rapidly.`;
  } else {
    explanation = `SLA safe with ${safetyBufferMin}m buffer. Projected completion in ${estimatedCompletionMin}m.`;
  }

  // Predictive timeline at now, +15, +30, +60 minutes
  const projections = {
    now: riskScore,
    plus15: Math.min(100, Math.round(riskScore + (safetyBufferMin < 30 ? 6 : 1))),
    plus30: Math.min(100, Math.round(riskScore + (safetyBufferMin < 30 ? 14 : 3))),
    plus60: Math.min(100, Math.round(riskScore + (safetyBufferMin < 30 ? 25 : 5))),
  };

  return {
    remaining_sla_min: remainingSlaMin,
    estimated_completion_min: estimatedCompletionMin,
    safety_buffer_min: safetyBufferMin,
    risk_score: riskScore,
    risk_tier: riskTier,
    explanation,
    projections,
  };
}
