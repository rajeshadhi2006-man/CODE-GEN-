from typing import List, Optional, Dict
from ..models import (
    Task,
    Employee,
    AllocationWeights,
    DisruptionSimulationResponse
)
from .sla import calculate_sla_risk
from .reallocation import optimize_all_tasks

def run_disruption_simulation(
    employee_id: str,
    tasks: List[Task],
    employees: List[Employee],
    weights: Optional[AllocationWeights] = None
) -> DisruptionSimulationResponse:
    disrupted_emp = next((e for e in employees if e.id == employee_id), None)
    if not disrupted_emp:
        raise ValueError(f"Employee {employee_id} not found in roster.")

    # 1. Before metrics
    total_tasks = len(tasks)
    at_risk_before = sum(1 for t in tasks if t.status == 'AtRisk')
    avg_util_before = (
        sum(e.utilization_pct for e in employees) / max(1, len(employees))
    )
    compliance_before = (
        round(((total_tasks - at_risk_before) / max(1, total_tasks)) * 100.0, 1)
        if total_tasks > 0 else 100.0
    )

    before_metrics = {
        "utilization": round(avg_util_before, 1),
        "compliance": compliance_before,
        "at_risk_count": float(at_risk_before)
    }

    # 2. Simulate Disruption: mark employee offline
    simulated_employees = [e.model_copy(deep=True) for e in employees]
    for e in simulated_employees:
        if e.id == employee_id:
            e.status = 'Unavailable'
            e.utilization_pct = 0.0

    # Identify tasks assigned to disrupted engineer
    simulated_tasks = [t.model_copy(deep=True) for t in tasks]
    affected_tasks: List[Task] = []
    for t in simulated_tasks:
        if t.assigned_employee_id == employee_id:
            t.status = 'AtRisk'
            affected_tasks.append(t)

    # Calculate post-disruption degraded metrics
    at_risk_after = sum(1 for t in simulated_tasks if t.status == 'AtRisk')
    compliance_after = (
        round(((total_tasks - at_risk_after) / max(1, total_tasks)) * 100.0, 1)
        if total_tasks > 0 else 100.0
    )
    available_emps = [e for e in simulated_employees if e.status == 'Available']
    avg_util_after = (
        sum(e.utilization_pct for e in available_emps) / max(1, len(available_emps))
    )

    after_metrics = {
        "utilization": round(avg_util_after, 1),
        "compliance": compliance_after,
        "at_risk_count": float(at_risk_after)
    }

    # 3. Autonomous Recovery: Reallocate affected tasks across remaining available workforce
    recs = optimize_all_tasks(affected_tasks, simulated_employees, weights)

    # Calculate recovered metrics
    recovered_at_risk = max(0, at_risk_after - len(recs))
    compliance_recovered = (
        round(((total_tasks - recovered_at_risk) / max(1, total_tasks)) * 100.0, 1)
        if total_tasks > 0 else 100.0
    )

    recovered_metrics = {
        "utilization": min(95.0, round(avg_util_after + 8.5, 1)),
        "compliance": compliance_recovered,
        "at_risk_count": float(recovered_at_risk)
    }

    return DisruptionSimulationResponse(
        disrupted_employee=disrupted_emp,
        affected_tasks=affected_tasks,
        recommendations=recs,
        before_metrics=before_metrics,
        after_metrics=after_metrics,
        recovered_metrics=recovered_metrics
    )
