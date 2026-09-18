from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

# Core Enums
UserRole = Literal[
    'Super Admin',
    'Workforce Manager',
    'Project Manager',
    'Team Lead',
    'Employee',
    'Executive'
]

EmployeeStatus = Literal['Available', 'OnLeave', 'Unavailable']
TaskPriority = Literal['Low', 'Medium', 'High', 'Critical']
TaskStatus = Literal[
    'Backlog',
    'Ready',
    'Assigned',
    'InProgress',
    'Blocked',
    'AtRisk',
    'Escalated',
    'Completed'
]
SLARiskTier = Literal['Low', 'Medium', 'High', 'Critical', 'Breached']

# Sub-models
class PerformanceMetrics(BaseModel):
    quality: float = 85.0
    on_time: float = 90.0
    tasks_completed_30d: int = 0

class ShiftInfo(BaseModel):
    start: str = "09:00"
    end: str = "18:00"

class EmployeeSkillProficiency(BaseModel):
    skill_id: str
    proficiency_pct: float

class TaskSkillRequirement(BaseModel):
    skill_id: str
    min_proficiency: float

# Primary Entity Models
class Employee(BaseModel):
    id: str
    name: str
    title: str = "Engineer"
    email: str = ""
    location: str = "Global Delivery Hub"
    region: Literal['Americas', 'EMEA', 'APAC', 'LATAM', 'South Asia'] = "Americas"
    timezone: str = "UTC"
    skills: List[EmployeeSkillProficiency] = []
    performance: PerformanceMetrics = PerformanceMetrics()
    capacity_hours: float = 40.0
    utilization_pct: float = 0.0
    status: EmployeeStatus = "Available"
    current_tasks: List[str] = []
    shift: ShiftInfo = ShiftInfo()
    certifications: List[str] = []
    avatar: str = ""

class Task(BaseModel):
    id: str
    code: str
    name: str
    project_id: str = ""
    priority: TaskPriority = "Medium"
    business_impact_score: float = 50.0
    required_skills: List[TaskSkillRequirement] = []
    estimated_effort_min: float = 60.0
    remaining_effort_min: float = 60.0
    sla_deadline: str
    dependency_ids: List[str] = []
    assigned_employee_id: Optional[str] = None
    status: TaskStatus = "Backlog"
    created_at: Optional[str] = None

class Project(BaseModel):
    id: str
    name: str
    client_id: str = ""
    task_ids: List[str] = []
    sla_target_pct: float = 95.0
    health: Literal['Healthy', 'AtRisk', 'Critical'] = "Healthy"
    region: str = "Americas"

class AllocationWeights(BaseModel):
    skill: float = 30.0
    sla: float = 25.0
    availability: float = 15.0
    workload: float = 10.0
    performance: float = 10.0
    location: float = 5.0
    business_impact: float = 5.0

class ScoreBreakdown(BaseModel):
    skill: float
    sla: float
    availability: float
    workload: float
    performance: float
    location: float
    business_impact: float

class AllocationScore(BaseModel):
    id: str
    task_id: str
    employee_id: str
    breakdown: ScoreBreakdown
    total_score: float
    computed_at: str
    rank: Optional[int] = None
    delta_reason: Optional[str] = None

class CandidateAlternative(BaseModel):
    employee_id: str
    employee_name: str
    score: float
    breakdown: ScoreBreakdown
    reason: str

class RecommendationImpact(BaseModel):
    before_sla_risk: float
    after_sla_risk: float
    before_utilization: float
    after_utilization: float

class AIRecommendation(BaseModel):
    id: str
    task_id: str
    from_employee_id: Optional[str] = None
    to_employee_id: str
    confidence_score: float
    rationale: str
    rule_id: str
    approval_level: Literal['Auto', 'Manager', 'Executive']
    requires_human_approval: bool
    status: Literal['Pending', 'Approved', 'Rejected'] = 'Pending'
    created_at: str
    score: AllocationScore
    impact: RecommendationImpact
    alternatives: List[CandidateAlternative] = []

class SLARiskMetrics(BaseModel):
    remaining_sla_min: float
    estimated_completion_min: float
    safety_buffer_min: float
    risk_score: float
    risk_tier: SLARiskTier
    explanation: str
    projections: Dict[str, float]

# Request/Response payloads
class ScoreRequest(BaseModel):
    task: Task
    employee: Employee
    weights: Optional[AllocationWeights] = None

class SLARiskRequest(BaseModel):
    task: Task
    employee: Optional[Employee] = None

class OptimizeRequest(BaseModel):
    tasks: List[Task]
    employees: List[Employee]
    weights: Optional[AllocationWeights] = None

class DisruptionSimulationRequest(BaseModel):
    employee_id: str
    tasks: List[Task]
    employees: List[Employee]
    weights: Optional[AllocationWeights] = None

class DisruptionSimulationResponse(BaseModel):
    disrupted_employee: Employee
    affected_tasks: List[Task]
    recommendations: List[AIRecommendation]
    before_metrics: Dict[str, float]
    after_metrics: Dict[str, float]
    recovered_metrics: Dict[str, float]

# SMTP Notification & Expert Matching Models
class AssignmentEmailRequest(BaseModel):
    task: Task
    employee: Employee
    custom_note: Optional[str] = None
    match_reason: Optional[str] = None

class EmailDispatchRecord(BaseModel):
    id: str
    task_id: str
    task_name: str
    recipient_email: str
    recipient_name: str
    subject: str
    status: Literal['Delivered via SMTP', 'Simulated Dispatch (SMTP Unconfigured)', 'Failed']
    timestamp: str
    smtp_host: Optional[str] = None
    error_message: Optional[str] = None
    html_preview: Optional[str] = None

class ExpertMatchCandidate(BaseModel):
    employee: Employee
    skill_proficiency: float
    capacity_remaining_hours: float
    on_time_rate: float
    overall_match_score: float
    is_top_match: bool = False
    match_reasons: List[str] = []

class ExpertMatchRequest(BaseModel):
    skill_id: str
    min_proficiency: float = 70.0
    task_id: Optional[str] = None
    task_name: Optional[str] = None
    employees: List[Employee]

class ExpertMatchResponse(BaseModel):
    skill_id: str
    total_candidates: int
    top_match: Optional[ExpertMatchCandidate] = None
    candidates: List[ExpertMatchCandidate] = []
    message: str

