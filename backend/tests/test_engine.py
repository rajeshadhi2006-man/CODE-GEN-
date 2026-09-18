import unittest
from datetime import datetime, timedelta
from backend.models import (
    Task,
    Employee,
    AllocationWeights,
    EmployeeSkillProficiency,
    TaskSkillRequirement,
    PerformanceMetrics,
    ShiftInfo
)
from backend.engine.scoring import (
    validate_weights,
    compute_allocation_score,
    score_skill_compatibility,
    DEFAULT_WEIGHTS
)
from backend.engine.sla import calculate_sla_risk
from backend.engine.reallocation import optimize_all_tasks, generate_task_recommendation
from backend.engine.simulation import run_disruption_simulation

class TestEngine(unittest.TestCase):
    def setUp(self):
        self.now = datetime.now()
        self.deadline = (self.now + timedelta(hours=4)).isoformat() + "Z"

        self.employee = Employee(
            id="E-001",
            name="Alice Smith",
            title="Senior Cloud Architect",
            skills=[
                EmployeeSkillProficiency(skill_id="SKILL-K8S", proficiency_pct=95.0),
                EmployeeSkillProficiency(skill_id="SKILL-AWS", proficiency_pct=90.0)
            ],
            performance=PerformanceMetrics(quality=92.0, on_time=94.0, tasks_completed_30d=15),
            capacity_hours=40.0,
            utilization_pct=60.0,
            status="Available",
            shift=ShiftInfo(start="09:00", end="18:00")
        )

        self.task = Task(
            id="T-001",
            code="T-101",
            name="Deploy Microservice Cluster",
            priority="High",
            business_impact_score=85.0,
            required_skills=[
                TaskSkillRequirement(skill_id="SKILL-K8S", min_proficiency=80.0)
            ],
            estimated_effort_min=90.0,
            remaining_effort_min=90.0,
            sla_deadline=self.deadline,
            status="Ready"
        )

    def test_weights_sum_to_100(self):
        self.assertTrue(validate_weights(DEFAULT_WEIGHTS))

    def test_skill_compatibility_scoring(self):
        score = score_skill_compatibility(self.task, self.employee)
        self.assertGreaterEqual(score, 80.0)
        self.assertLessEqual(score, 100.0)

    def test_allocation_score_computation(self):
        alloc_score = compute_allocation_score(self.task, self.employee)
        self.assertGreaterEqual(alloc_score.total_score, 0.0)
        self.assertLessEqual(alloc_score.total_score, 100.0)
        self.assertEqual(alloc_score.task_id, self.task.id)
        self.assertEqual(alloc_score.employee_id, self.employee.id)

    def test_sla_risk_calculation(self):
        risk = calculate_sla_risk(self.task, self.employee)
        self.assertGreater(risk.remaining_sla_min, 0.0)
        self.assertIn(risk.risk_tier, ['Low', 'Medium', 'High', 'Critical', 'Breached'])

    def test_reallocation_optimization(self):
        recs = optimize_all_tasks([self.task], [self.employee])
        self.assertEqual(len(recs), 1)
        self.assertEqual(recs[0].to_employee_id, self.employee.id)
        self.assertEqual(recs[0].task_id, self.task.id)

    def test_disruption_simulation(self):
        # Assign task to employee first
        self.task.assigned_employee_id = self.employee.id
        backup_employee = self.employee.model_copy(deep=True)
        backup_employee.id = "E-002"
        backup_employee.name = "Bob Jones"

        sim = run_disruption_simulation("E-001", [self.task], [self.employee, backup_employee])
        self.assertEqual(sim.disrupted_employee.id, "E-001")
        self.assertEqual(len(sim.affected_tasks), 1)
        self.assertGreaterEqual(len(sim.recommendations), 1)
        self.assertEqual(sim.recommendations[0].to_employee_id, "E-002")

if __name__ == "__main__":
    unittest.main()
