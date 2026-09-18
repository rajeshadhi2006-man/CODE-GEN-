import { 
  Task, 
  Employee, 
  AIRecommendation, 
  AllocationWeights, 
  ApprovalLevel 
} from '../data/types';
import { rankCandidates, DEFAULT_WEIGHTS } from './scoring';
import { calculateSLARisk } from './sla';

/**
 * Evaluates which approval level is required based on governance policy
 */
export function determineApprovalLevel(task: Task, beforeRisk: number, afterRisk: number): ApprovalLevel {
  if (task.priority === 'Critical' || beforeRisk >= 85 || task.business_impact_score >= 85) {
    return 'Executive';
  }
  if (task.priority === 'High' || beforeRisk >= 60 || task.business_impact_score >= 60) {
    return 'Manager';
  }
  // Low/Medium risk tasks with clear positive impact can be auto-approved
  if (beforeRisk < 60 && afterRisk < 35) {
    return 'Auto';
  }
  return 'Manager';
}

/**
 * Generates an AI Recommendation for an affected task
 */
export function createReallocationRecommendation(
  task: Task,
  employees: Employee[],
  currentAssigneeId: string | null,
  weights: AllocationWeights = DEFAULT_WEIGHTS,
  targetRegion?: string,
  nowMs: number = Date.now()
): AIRecommendation | null {
  const currentAssignee = employees.find(e => e.id === currentAssigneeId) || null;
  const beforeRiskMetrics = calculateSLARisk(task, currentAssignee, nowMs);

  // Exclude current assignee from candidate ranking
  const candidatePool = employees.filter(e => e.id !== currentAssigneeId && e.status !== 'Unavailable');
  if (candidatePool.length === 0) return null;

  const { topCandidate, alternatives } = rankCandidates(task, candidatePool, weights, targetRegion, 4, nowMs);
  const targetEmployee = employees.find(e => e.id === topCandidate.employee_id);
  if (!targetEmployee) return null;

  const afterRiskMetrics = calculateSLARisk(task, targetEmployee, nowMs);
  const approvalLevel = determineApprovalLevel(task, beforeRiskMetrics.risk_score, afterRiskMetrics.risk_score);

  // Generate plain-text analytical reason based on real math
  const skillMatch = topCandidate.breakdown.skill;
  const riskDelta = beforeRiskMetrics.risk_score - afterRiskMetrics.risk_score;
  const reason = `${targetEmployee.name} (${targetEmployee.id}) exhibits ${skillMatch}% skill fit and reduces SLA breach risk from ${beforeRiskMetrics.risk_score}% to ${afterRiskMetrics.risk_score}% (+${riskDelta} pts security buffer).`;

  const newUtilization = Math.min(100, targetEmployee.utilization_pct + Math.round((task.remaining_effort_min / 60 / targetEmployee.capacity_hours) * 100));

  return {
    id: `rec-${task.id}-${targetEmployee.id}-${nowMs}`,
    task_id: task.id,
    from_employee_id: currentAssigneeId,
    to_employee_id: targetEmployee.id,
    score: topCandidate,
    reason,
    impact: {
      before_sla_risk: beforeRiskMetrics.risk_score,
      after_sla_risk: afterRiskMetrics.risk_score,
      before_utilization: targetEmployee.utilization_pct,
      after_utilization: newUtilization,
    },
    alternatives,
    required_approval_level: approvalLevel,
    status: 'Pending',
    created_at: new Date(nowMs).toISOString(),
  };
}
