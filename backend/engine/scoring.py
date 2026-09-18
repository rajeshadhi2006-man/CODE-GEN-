from datetime import datetime, timezone
from typing import Optional, Tuple
import numpy as np
from ..models import Task, Employee, AllocationWeights, AllocationScore, ScoreBreakdown

DEFAULT_WEIGHTS = AllocationWeights(
    skill=30.0,
    sla=25.0,
    availability=15.0,
    workload=10.0,
    performance=10.0,
    location=5.0,
    business_impact=5.0
)

def validate_weights(weights: AllocationWeights) -> bool:
    total = (
        weights.skill +
        weights.sla +
        weights.availability +
        weights.workload +
        weights.performance +
        weights.location +
        weights.business_impact
    )
    return abs(total - 100.0) < 0.001

def score_skill_compatibility(task: Task, employee: Employee) -> float:
    if not task.required_skills:
        return 90.0
    
    total_score = 0.0
    matches = 0
    emp_skill_map = {s.skill_id: s.proficiency_pct for s in employee.skills}
    
    for req in task.required_skills:
        if req.skill_id not in emp_skill_map:
            total_score += 10.0
        else:
            matches += 1
            prof = emp_skill_map[req.skill_id]
            if prof >= req.min_proficiency:
                bonus = min(20.0, (prof - req.min_proficiency) * 0.5)
                total_score += min(100.0, 80.0 + bonus)
            else:
                ratio = prof / max(1.0, req.min_proficiency)
                total_score += round(ratio * 70.0)
                
    avg = total_score / len(task.required_skills)
    if matches == 0:
        return float(min(15.0, avg))
    return float(np.clip(round(avg), 0.0, 100.0))

def score_sla_protection(task: Task, employee: Employee, now_ms: Optional[float] = None) -> float:
    if employee.status != 'Available':
        return 10.0

    now = now_ms if now_ms is not None else datetime.now().timestamp() * 1000.0
    try:
        deadline_dt = datetime.fromisoformat(task.sla_deadline.replace("Z", "+00:00"))
        deadline_ms = deadline_dt.timestamp() * 1000.0
    except Exception:
        deadline_ms = now + (task.remaining_effort_min * 60.0 * 1000.0 * 1.5)

    remaining_minutes = (deadline_ms - now) / (1000.0 * 60.0)
    speed_factor = 0.8 + (employee.performance.on_time / 100.0) * 0.4
    effective_effort = task.remaining_effort_min / speed_factor
    safety_buffer = remaining_minutes - effective_effort

    if safety_buffer < -30.0:
        return 5.0
    elif safety_buffer < 0.0:
        return 25.0
    elif safety_buffer < 60.0:
        return 60.0
    elif safety_buffer < 180.0:
        return 85.0
    return 98.0

def score_availability(employee: Employee) -> float:
    if employee.status == 'Unavailable':
        return 0.0
    if employee.status == 'OnLeave':
        return 5.0
    raw = 100.0 - employee.utilization_pct
    return float(np.clip(round(raw), 0.0, 100.0))

def score_workload_balance(employee: Employee, avg_utilization: float = 75.0) -> float:
    if employee.utilization_pct > 95.0:
        return 5.0
    if employee.utilization_pct > 85.0:
        return 35.0
    deviation = abs(employee.utilization_pct - avg_utilization)
    score = 100.0 - (deviation * 1.5)
    return float(np.clip(round(score), 10.0, 100.0))

def score_performance(employee: Employee) -> float:
    combined = (employee.performance.on_time * 0.6) + (employee.performance.quality * 0.4)
    return float(np.clip(round(combined), 0.0, 100.0))

def score_location(task: Task, employee: Employee) -> float:
    # High score for primary delivery regions
    return 90.0

def score_business_impact(task: Task, employee: Employee) -> float:
    # High impact tasks matched with high performing engineers get maximum score
    if task.business_impact_score >= 80.0:
        if employee.performance.quality >= 90.0 and employee.performance.on_time >= 90.0:
            return 98.0
        return 70.0
    return 85.0

def compute_allocation_score(
    task: Task,
    employee: Employee,
    weights: Optional[AllocationWeights] = None,
    now_ms: Optional[float] = None
) -> AllocationScore:
    w = weights or DEFAULT_WEIGHTS
    
    skill_val = score_skill_compatibility(task, employee)
    sla_val = score_sla_protection(task, employee, now_ms)
    avail_val = score_availability(employee)
    workload_val = score_workload_balance(employee)
    perf_val = score_performance(employee)
    loc_val = score_location(task, employee)
    impact_val = score_business_impact(task, employee)

    breakdown = ScoreBreakdown(
        skill=round(skill_val, 1),
        sla=round(sla_val, 1),
        availability=round(avail_val, 1),
        workload=round(workload_val, 1),
        performance=round(perf_val, 1),
        location=round(loc_val, 1),
        business_impact=round(impact_val, 1)
    )

    total = (
        (breakdown.skill * w.skill) +
        (breakdown.sla * w.sla) +
        (breakdown.availability * w.availability) +
        (breakdown.workload * w.workload) +
        (breakdown.performance * w.performance) +
        (breakdown.location * w.location) +
        (breakdown.business_impact * w.business_impact)
    ) / 100.0

    return AllocationScore(
        id=f"score-{task.id}-{employee.id}",
        task_id=task.id,
        employee_id=employee.id,
        breakdown=breakdown,
        total_score=round(float(total), 1),
        computed_at=datetime.now(timezone.utc).isoformat()
    )
