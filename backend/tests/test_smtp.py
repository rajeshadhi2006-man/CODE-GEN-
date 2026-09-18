import unittest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from backend.main import app
from backend.models import (
    Task,
    Employee,
    EmployeeSkillProficiency,
    TaskSkillRequirement,
    AssignmentEmailRequest,
    ExpertMatchRequest
)
from backend.smtp_service import (
    generate_assignment_html,
    send_assignment_email,
    get_outbox,
    clear_outbox,
    match_top_expert
)

class TestSMTPAndExpertMatching(unittest.TestCase):
    def setUp(self):
        clear_outbox()
        self.client = TestClient(app)

        self.python_expert = Employee(
            id="emp_py_01",
            name="Guido Vance",
            email="guido.vance@company.io",
            title="Senior Python Architect",
            skills=[
                EmployeeSkillProficiency(skill_id="python", proficiency_pct=96.0),
                EmployeeSkillProficiency(skill_id="fastapi", proficiency_pct=92.0),
            ],
            capacity_hours=40.0,
            utilization_pct=30.0, # 28h remaining
            status="Available"
        )

        self.react_dev = Employee(
            id="emp_fe_02",
            name="Sarah Connor",
            email="sarah.c@company.io",
            title="Frontend Specialist",
            skills=[
                EmployeeSkillProficiency(skill_id="react", proficiency_pct=95.0),
                EmployeeSkillProficiency(skill_id="python", proficiency_pct=60.0), # below 70 threshold
            ],
            capacity_hours=40.0,
            utilization_pct=75.0,
            status="Available"
        )

        self.python_junior = Employee(
            id="emp_py_03",
            name="Alex Rivera",
            email="alex.r@company.io",
            title="Junior Backend Dev",
            skills=[
                EmployeeSkillProficiency(skill_id="python", proficiency_pct=75.0),
            ],
            capacity_hours=40.0,
            utilization_pct=85.0, # only 6h remaining
            status="Available"
        )

        self.sample_task = Task(
            id="task_py_101",
            code="TSK-9901",
            name="Build High-Performance Async Data Pipeline",
            priority="High",
            required_skills=[
                TaskSkillRequirement(skill_id="python", min_proficiency=80.0)
            ],
            estimated_effort_min=180.0,
            remaining_effort_min=180.0,
            sla_deadline=datetime.now(timezone.utc).isoformat(),
            status="Ready"
        )

    def test_generate_assignment_html(self):
        html = generate_assignment_html(
            task=self.sample_task,
            employee=self.python_expert,
            match_reason="Top Python Expert (96% proficiency)"
        )
        self.assertIn("NEXUS WORKFORCE OS | DIRECT ASSIGNMENT", html)
        self.assertIn(self.sample_task.code, html)
        self.assertIn(self.sample_task.name, html)
        self.assertIn(self.python_expert.name, html)
        self.assertIn(self.python_expert.email, html)
        self.assertIn("Confidential Direct Dispatch", html)
        self.assertIn("PYTHON", html)

    def test_single_recipient_isolation(self):
        req = AssignmentEmailRequest(
            task=self.sample_task,
            employee=self.python_expert,
            match_reason="Matched with 96% Python capability"
        )
        record = send_assignment_email(req)

        # Ensure single recipient matches exactly
        self.assertEqual(record.recipient_email, "guido.vance@company.io")
        self.assertEqual(record.recipient_name, "Guido Vance")
        self.assertIn("TSK-9901", record.subject)
        self.assertIn(record.status, [
            "Delivered via SMTP",
            "Simulated Dispatch (SMTP Unconfigured)"
        ])

        # Verify outbox tracking
        outbox = get_outbox()
        self.assertEqual(len(outbox), 1)
        self.assertEqual(outbox[0].recipient_email, "guido.vance@company.io")

    def test_expert_matching_finds_top_python_expert(self):
        req = ExpertMatchRequest(
            skill_id="python",
            min_proficiency=70.0,
            employees=[self.python_expert, self.react_dev, self.python_junior]
        )
        resp = match_top_expert(req)

        self.assertEqual(resp.skill_id, "python")
        self.assertIsNotNone(resp.top_match)
        # Sarah has 60% python (<70), so only Guido & Alex qualify
        self.assertEqual(resp.total_candidates, 2)
        # Guido has 96% prof and 28h remaining vs Alex 75% prof and 6h remaining
        self.assertEqual(resp.top_match.employee.id, "emp_py_01")
        self.assertEqual(resp.top_match.employee.name, "Guido Vance")
        self.assertTrue(resp.top_match.is_top_match)
        self.assertGreater(resp.top_match.overall_match_score, resp.candidates[1].overall_match_score)

    def test_api_endpoints(self):
        # 1. Test /api/match-expert
        match_payload = {
            "skill_id": "python",
            "min_proficiency": 70.0,
            "employees": [self.python_expert.model_dump(), self.python_junior.model_dump()]
        }
        res = self.client.post("/api/match-expert", json=match_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["top_match"]["employee"]["name"], "Guido Vance")

        # 2. Test /api/notifications/send-assignment-email
        email_payload = {
            "task": self.sample_task.model_dump(),
            "employee": self.python_expert.model_dump(),
            "match_reason": "Top Python Expert match"
        }
        res2 = self.client.post("/api/notifications/send-assignment-email", json=email_payload)
        self.assertEqual(res2.status_code, 200)
        email_record = res2.json()
        self.assertEqual(email_record["recipient_email"], "guido.vance@company.io")

        # 3. Test /api/notifications/outbox
        res3 = self.client.get("/api/notifications/outbox")
        self.assertEqual(res3.status_code, 200)
        outbox_list = res3.json()
        self.assertGreaterEqual(len(outbox_list), 1)

if __name__ == "__main__":
    unittest.main()
