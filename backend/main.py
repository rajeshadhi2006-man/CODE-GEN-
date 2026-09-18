import sys
from datetime import datetime, timezone
from typing import List, Optional
from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    save_recommendations_to_supabase,
    get_supabase_client
)
from .smtp_service import (
    send_assignment_email,
    get_outbox,
    match_top_expert
)

_processed_assignments = set()
_initial_sync_done = False

def find_best_skill_candidate(task: Task, employees: List[Employee]) -> Optional[Employee]:
    if not employees:
        return None
    req_skills = [r.skill_id.lower().replace("sk-", "") for r in (task.required_skills or [])]
    best_emp = None
    best_score = -1.0
    for emp in employees:
        skill_score = 15.0
        for s in (emp.skills or []):
            s_name = s.skill_id.lower().replace("sk-", "")
            if not req_skills or any(req in s_name or s_name in req for req in req_skills):
                if s.proficiency_pct > skill_score:
                    skill_score = s.proficiency_pct
        headroom = max(0.0, 100.0 - (emp.utilization_pct or 0.0))
        score = (skill_score * 0.6) + (headroom * 0.4)
        if score > best_score:
            best_score = score
            best_emp = emp
    return best_emp

async def supabase_assignment_watcher():
    """
    Continuous background monitor that observes Supabase for tasks.
    1. If an unassigned task arrives, automatically allocates it to the specialist with matching skills.
    2. When a task assignment is detected, dispatches the single-recipient SMTP notification immediately.
    """
    global _processed_assignments, _initial_sync_done
    await asyncio.sleep(2)
    print("[Supabase Watcher] Started continuous Supabase task assignment monitor.")

    while True:
        try:
            live_data = fetch_live_data_from_supabase()
            tasks = live_data.get("tasks", [])
            employees = {e.id: e for e in live_data.get("employees", [])}
            emp_list = list(employees.values())

            if not _initial_sync_done:
                for t in tasks:
                    if t.assigned_employee_id:
                        _processed_assignments.add((t.id, t.assigned_employee_id))
                _initial_sync_done = True
                print(f"[Supabase Watcher] Initialized with {len(_processed_assignments)} active assignments.")
            else:
                for t in tasks:
                    if t.assigned_employee_id:
                        key = (t.id, t.assigned_employee_id)
                        if key not in _processed_assignments:
                            emp = employees.get(t.assigned_employee_id)
                            if emp and emp.email:
                                print(f"[Supabase Watcher] New assignment detected: Task {t.code} -> {emp.name} ({emp.email}). Dispatching SMTP...")
                                try:
                                    send_assignment_email(AssignmentEmailRequest(
                                        task=t,
                                        employee=emp,
                                        custom_note="Autonomous system dispatch via Supabase real-time sync",
                                        match_reason="Task allocated in Nexus Workforce Registry"
                                    ))
                                except Exception as e:
                                    print(f"[Supabase Watcher] Email dispatch error: {e}")
                            _processed_assignments.add(key)
                    else:
                        # Unassigned task detected -> Autonomous AI Auto-Assignment by Skill
                        best_candidate = find_best_skill_candidate(t, emp_list)
                        if best_candidate:
                            print(f"[Supabase Watcher] 🤖 AI Auto-Assigning unassigned Task {t.code} to specialist {best_candidate.name} based on skills...")
                            client = get_supabase_client()
                            if client:
                                try:
                                    client.table('tasks').update({
                                        'assigned_employee_id': best_candidate.id,
                                        'status': 'InProgress'
                                    }).eq('id', t.id).execute()
                                except Exception as e:
                                    print(f"[Supabase Watcher] DB update error: {e}")
                            
                            t.assigned_employee_id = best_candidate.id
                            t.status = 'InProgress'
                            try:
                                send_assignment_email(AssignmentEmailRequest(
                                    task=t,
                                    employee=best_candidate,
                                    custom_note="Autonomous AI Skill Matcher allocation",
                                    match_reason=f"AI matched specialist skills for {t.code}"
                                ))
                            except Exception as e:
                                print(f"[Supabase Watcher] Email dispatch error: {e}")
                            _processed_assignments.add((t.id, best_candidate.id))
        except Exception as e:
            print(f"[Supabase Watcher] Loop warning: {e}")

        await asyncio.sleep(4)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background watcher
    watcher_task = asyncio.create_task(supabase_assignment_watcher())
    yield
    # Shutdown: cancel watcher
    watcher_task.cancel()
    try:
        await watcher_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="NEXUS WORKFORCE OS — AI Allocation & Optimization Engine",
    description="Deterministic 7-Factor Autonomous Resource Allocation, Dynamic SLA Risk Engine & Simulation Lab",
    version="2.4.0",
    lifespan=lifespan
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

class TestEmailRequest(BaseModel):
    recipient_email: str
    employee_name: Optional[str] = "Team Member"
    custom_note: Optional[str] = "Live SMTP Connection Test"

@app.post("/api/notifications/test-email", response_model=EmailDispatchRecord)
def send_test_email(req: TestEmailRequest):
    """
    Directly dispatches a test email via SMTP to verify live email delivery to any user or employee.
    """
    test_task = Task(
        id=f"test-{int(datetime.now(timezone.utc).timestamp())}",
        code="SYS-TEST",
        name="Verification of Real-Time Email Delivery Gateway",
        priority="High",
        estimated_effort_min=30,
        remaining_effort_min=30,
        sla_deadline=datetime.now(timezone.utc).isoformat(),
        business_impact_score=95
    )
    test_emp = Employee(
        id="emp-test",
        name=req.employee_name or "Team Member",
        email=req.recipient_email,
        title="Platform Engineer"
    )
    return send_assignment_email(AssignmentEmailRequest(
        task=test_task,
        employee=test_emp,
        custom_note=req.custom_note,
        match_reason="Automated Email Delivery Gateway Verification"
    ))

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


