import uuid
from datetime import datetime, timezone
from typing import List, Optional
from ..models import (
    Task,
    Employee,
    AllocationWeights,
    AIRecommendation,
    AllocationScore,
    RecommendationImpact,
    CandidateAlternative
)
from .scoring import compute_allocation_score
from .sla import calculate_sla_risk

def generate_task_recommendation(
    task: Task,
    employees: List[Employee],
    weights: Optional[AllocationWeights] = None,
    now_ms: Optional[float] = None
) -> Optional[AIRecommendation]:
    if not employees:
        return None

    # Score all employees
    candidate_scores = []
    for emp in employees:
        score = compute_allocation_score(task, emp, weights, now_ms)
        candidate_scores.append((emp, score))

    # Sort descending by total_score
    candidate_scores.sort(key=lambda x: x[1].total_score, reverse=True)

    top_emp, top_score = candidate_scores[0]

    # Don't recommend if already assigned to the top candidate
    if task.assigned_employee_id == top_emp.id:
        return None

    # Build alternatives
    alternatives = []
    for emp, sc in candidate_scores[1:4]:
        alternatives.append(CandidateAlternative(
            employee_id=emp.id,
            employee_name=emp.name,
            score=sc.total_score,
            breakdown=sc.breakdown,
            reason=f"Scored {sc.total_score}% with {sc.breakdown.skill}% skill match."
        ))

    # Calculate impact
    current_emp = next((e for e in employees if e.id == task.assigned_employee_id), None)
    before_risk = calculate_sla_risk(task, current_emp, now_ms).risk_score
    after_risk = calculate_sla_risk(task, top_emp, now_ms).risk_score

    before_util = top_emp.utilization_pct
    added_util = round((task.remaining_effort_min / (top_emp.capacity_hours * 60.0)) * 100.0, 1)
    after_util = min(100.0, before_util + added_util)

    impact = RecommendationImpact(
        before_sla_risk=round(before_risk, 1),
        after_sla_risk=round(after_risk, 1),
        before_utilization=round(before_util, 1),
        after_utilization=round(after_util, 1)
    )

    # Determine approval level
    if task.priority == 'Critical' or impact.before_sla_risk >= 80.0:
        approval_level = 'Executive'
        requires_approval = True
    elif task.priority == 'High' or top_score.total_score < 75.0:
        approval_level = 'Manager'
        requires_approval = True
    else:
        approval_level = 'Auto'
        requires_approval = False

    rationale = (
        f"Autonomous optimization selected {top_emp.name} ({top_score.total_score}% match) "
        f"reducing SLA breach risk from {impact.before_sla_risk}% to {impact.after_sla_risk}%."
    )

    return AIRecommendation(
        id=f"rec-{uuid.uuid4().hex[:8]}",
        task_id=task.id,
        from_employee_id=task.assigned_employee_id,
        to_employee_id=top_emp.id,
        confidence_score=top_score.total_score,
        rationale=rationale,
        rule_id="RULE-DYNAMIC-7FACTOR-REBALANCE",
        approval_level=approval_level,
        requires_human_approval=requires_approval,
        status="Pending",
        created_at=datetime.now(timezone.utc).isoformat(),
        score=top_score,
        impact=impact,
        alternatives=alternatives
    )

def optimize_all_tasks(
    tasks: List[Task],
    employees: List[Employee],
    weights: Optional[AllocationWeights] = None,
    now_ms: Optional[float] = None
) -> List[AIRecommendation]:
    if not tasks or not employees:
        return []

    # Filter tasks requiring allocation or rebalancing
    target_tasks = []
    for t in tasks:
        if t.status in ['Completed', 'Blocked']:
            continue
        if not t.assigned_employee_id or t.status == 'AtRisk' or t.priority in ['Critical', 'High']:
            target_tasks.append(t)

    # Sort tasks by urgency: Critical first, then lowest remaining effort / closest deadline
    priority_order = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}
    target_tasks.sort(key=lambda t: (priority_order.get(t.priority, 4), t.remaining_effort_min))

    recommendations: List[AIRecommendation] = []
    
    # Clone employees to track capacity headroom during multi-task allocation
    simulated_employees = {
        e.id: e.model_copy(deep=True) for e in employees
    }

    for task in target_tasks:
        available_pool = [e for e in simulated_employees.values() if e.status == 'Available']
        if not available_pool:
            break

        rec = generate_task_recommendation(task, available_pool, weights, now_ms)
        if rec:
            recommendations.append(rec)
            # Update simulated utilization
            allocated_emp = simulated_employees.get(rec.to_employee_id)
            if allocated_emp:
                task_util = (task.remaining_effort_min / (allocated_emp.capacity_hours * 60.0)) * 100.0
                allocated_emp.utilization_pct = min(100.0, allocated_emp.utilization_pct + task_util)

    return recommendations
