from datetime import datetime
from typing import Optional
from ..models import Task, Employee, SLARiskMetrics, SLARiskTier

def calculate_sla_risk(
    task: Task, 
    employee: Optional[Employee] = None, 
    now_ms: Optional[float] = None
) -> SLARiskMetrics:
    now = now_ms if now_ms is not None else datetime.now().timestamp() * 1000.0
    
    try:
        deadline_dt = datetime.fromisoformat(task.sla_deadline.replace("Z", "+00:00"))
        deadline_ms = deadline_dt.timestamp() * 1000.0
    except Exception:
        deadline_ms = now + (task.remaining_effort_min * 60.0 * 1000.0 * 1.5)

    remaining_sla_min = max(0.0, (deadline_ms - now) / 60000.0)

    # Estimate completion
    speed_factor = 1.0
    if employee:
        speed_factor = 0.8 + (employee.performance.on_time / 100.0) * 0.4
        if employee.status != 'Available':
            speed_factor *= 0.5

    estimated_completion_min = task.remaining_effort_min / speed_factor
    safety_buffer_min = remaining_sla_min - estimated_completion_min

    # Calculate risk score (0-100)
    if remaining_sla_min <= 0 or safety_buffer_min < -60.0:
        risk_score = 100.0
        risk_tier: SLARiskTier = 'Breached'
    elif safety_buffer_min < 0:
        risk_score = min(99.0, 80.0 + abs(safety_buffer_min) * 0.3)
        risk_tier = 'Critical'
    elif safety_buffer_min < 30.0:
        risk_score = 65.0 + (30.0 - safety_buffer_min) * 0.5
        risk_tier = 'High'
    elif safety_buffer_min < 120.0:
        risk_score = 30.0 + (120.0 - safety_buffer_min) * 0.3
        risk_tier = 'Medium'
    else:
        risk_score = max(5.0, 20.0 - (safety_buffer_min / 60.0))
        risk_tier = 'Low'

    explanation = (
        f"Deadline in {round(remaining_sla_min)}m, estimated completion in {round(estimated_completion_min)}m. "
        f"Safety buffer: {round(safety_buffer_min)}m ({risk_tier} risk)."
    )

    projections = {
        "now": round(risk_score, 1),
        "plus15": min(100.0, round(risk_score + 5.0, 1)),
        "plus30": min(100.0, round(risk_score + 12.0, 1)),
        "plus60": min(100.0, round(risk_score + 25.0, 1)),
    }

    return SLARiskMetrics(
        remaining_sla_min=round(remaining_sla_min, 1),
        estimated_completion_min=round(estimated_completion_min, 1),
        safety_buffer_min=round(safety_buffer_min, 1),
        risk_score=round(risk_score, 1),
        risk_tier=risk_tier,
        explanation=explanation,
        projections=projections
    )
