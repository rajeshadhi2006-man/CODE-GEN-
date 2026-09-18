import sys
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS, SUPABASE_URL
from .models import (
    Task,
    Employee,
    AllocationScore,
    SLARiskMetrics,
    AIRecommendation,
    ScoreRequest,
    SLARiskRequest,
    OptimizeRequest,
    DisruptionSimulationRequest,
    DisruptionSimulationResponse,
    AssignmentEmailRequest,
    EmailDispatchRecord,
    ExpertMatchRequest,
    ExpertMatchResponse
)
from .engine.scoring import compute_allocation_score, DEFAULT_WEIGHTS
from .engine.sla import calculate_sla_risk
from .engine.reallocation import optimize_all_tasks, generate_task_recommendation
from .engine.simulation import run_disruption_simulation
from .supabase_service import (
    test_supabase_connection,
    fetch_live_data_from_supabase,
    save_recommendations_to_supabase
)
from .smtp_service import (
    send_assignment_email,
    get_outbox,
    match_top_expert
)

app = FastAPI(
    title="NEXUS WORKFORCE OS — AI Allocation & Optimization Engine",
    description="Deterministic 7-Factor Autonomous Resource Allocation, Dynamic SLA Risk Engine & Simulation Lab",
    version="2.4.0"
)

# Enable CORS for the React/Vite web application
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "NEXUS WORKFORCE OS Backend",
        "engine": "FastAPI + Python 3.12 AI Optimization Engine",
        "status": "operational",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/health")
def health_check():
    supabase_status = test_supabase_connection()
    return {
        "status": "healthy",
        "version": "2.4.0",
        "python_version": sys.version.split()[0],
        "supabase_connected": supabase_status.get("success", False),
        "supabase_url": SUPABASE_URL,
        "engine": "7-Factor Deterministic Scoring + Hungarian Optimization",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/api/score", response_model=AllocationScore)
def calculate_score(req: ScoreRequest):
    """
    Computes the 7-factor deterministic score for a (Task, Employee) pair.
    """
    return compute_allocation_score(req.task, req.employee, req.weights)

@app.post("/api/sla-risk", response_model=SLARiskMetrics)
def evaluate_sla_risk(req: SLARiskRequest):
    """
    Evaluates dynamic SLA remaining buffer, countdown, and breach risk tier.
    """
    return calculate_sla_risk(req.task, req.employee)

@app.post("/api/optimize", response_model=List[AIRecommendation])
def optimize_allocation(req: OptimizeRequest, background_tasks: BackgroundTasks):
    """
    Autonomous multi-task allocation optimizer.
    Finds optimal task-employee matches, generates AI proposals with rationale and audit logs.
    """
    recs = optimize_all_tasks(req.tasks, req.employees, req.weights)
    
    # Asynchronously push recommendations to Supabase if connected
    if recs:
        background_tasks.add_task(save_recommendations_to_supabase, recs)

    return recs

@app.post("/api/simulate-disruption", response_model=DisruptionSimulationResponse)
def simulate_disruption(req: DisruptionSimulationRequest):
    """
    Monte Carlo style sudden employee outage simulation and autonomous recovery lab.
    """
    try:
        return run_disruption_simulation(req.employee_id, req.tasks, req.employees, req.weights)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sync/pull")
def sync_pull():
    """
    Fetches latest live workforce, task, and project records directly from Supabase.
    """
    data = fetch_live_data_from_supabase()
    return {
        "status": "success",
        "counts": {
            "employees": len(data["employees"]),
            "tasks": len(data["tasks"]),
            "projects": len(data["projects"])
        },
        "data": data
    }

# --- SMTP Email Notifications & Talent Matching ---

@app.post("/api/notifications/send-assignment-email", response_model=EmailDispatchRecord)
def dispatch_task_assignment_email(req: AssignmentEmailRequest):
    """
    Automated direct assignment email dispatch via SMTP.
    Strictly isolated to the single assigned employee's email.
    """
    try:
        record = send_assignment_email(req)
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email dispatch error: {str(e)}")

@app.get("/api/notifications/outbox", response_model=List[EmailDispatchRecord])
def get_notification_outbox(limit: int = 50):
    """
    Returns recent assignment email dispatches and live delivery statuses.
    """
    return get_outbox(limit=limit)

@app.post("/api/match-expert", response_model=ExpertMatchResponse)
def match_expert(req: ExpertMatchRequest):
    """
    Real-time expert matching engine.
    Finds and ranks candidates by skill proficiency, capacity headroom, and on-time performance.
    """
    try:
        return match_top_expert(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Expert matching error: {str(e)}")

