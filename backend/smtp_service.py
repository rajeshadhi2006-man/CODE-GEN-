"""
SMTP Email Notification & Real-Time Expert Matching Service
Nexus Workforce OS
"""
import uuid
import smtplib
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate
from typing import List, Optional
import logging

from backend.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    SMTP_USE_TLS
)
from backend.models import (
    AssignmentEmailRequest,
    EmailDispatchRecord,
    ExpertMatchRequest,
    ExpertMatchResponse,
    ExpertMatchCandidate,
    Employee,
    Task
)

logger = logging.getLogger("nexus.smtp")

# In-memory audit log of dispatched assignment emails
_outbox_log: List[EmailDispatchRecord] = []

def generate_assignment_html(
    task: Task,
    employee: Employee,
    custom_note: Optional[str] = None,
    match_reason: Optional[str] = None
) -> str:
    """
    Generates a high-fidelity, cyber-executive responsive HTML email template
    styled to match the Dark Blue / Cyber theme.
    """
    priority_colors = {
        'Critical': '#ef4444',
        'High': '#f97316',
        'Medium': '#38bdf8',
        'Low': '#10b981'
    }
    p_color = priority_colors.get(task.priority, '#38bdf8')

    # Format skills required
    skills_badges = ""
    for req in task.required_skills:
        skills_badges += f"""
        <span style="display:inline-block; padding:3px 10px; margin:2px 4px; background:#1e293b; border:1px solid #334155; border-radius:12px; font-size:11px; color:#94a3b8;">
            {req.skill_id.upper()} ({req.min_proficiency:.0f}%)
        </span>
        """
    if not skills_badges:
        skills_badges = '<span style="color:#64748b; font-size:12px;">General Engineering</span>'

    match_html = ""
    if match_reason:
        match_html = f"""
        <div style="margin-top:16px; padding:12px 16px; background:rgba(56, 189, 248, 0.08); border-left:3px solid #38bdf8; border-radius:4px;">
            <p style="margin:0 0 4px 0; font-size:11px; font-weight:700; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em;">
                Nexus Real-Time Skill Matching Intelligence
            </p>
            <p style="margin:0; font-size:13px; color:#cbd5e1; line-height:1.4;">
                {match_reason}
            </p>
        </div>
        """

    note_html = ""
    if custom_note:
        note_html = f"""
        <div style="margin-top:14px; padding:12px 16px; background:#1e293b; border-radius:6px; border:1px solid #334155;">
            <p style="margin:0 0 4px 0; font-size:11px; color:#94a3b8; font-weight:600;">Assignment Dispatcher Note:</p>
            <p style="margin:0; font-size:13px; color:#e2e8f0; font-style:italic;">"{custom_note}"</p>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Assigned: {task.code} - {task.name}</title>
</head>
<body style="margin:0; padding:0; background-color:#0b1120; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b1120; padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px; background-color:#0f172a; border:1px solid #1e293b; border-radius:12px; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg, #0b1120 0%, #1e1b4b 100%); padding:28px 32px; border-bottom:1px solid #1e293b;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td>
                                        <div style="font-size:11px; font-weight:800; letter-spacing:0.15em; color:#38bdf8; text-transform:uppercase; margin-bottom:6px;">
                                            ⚡ NEXUS WORKFORCE OS | DIRECT ASSIGNMENT
                                        </div>
                                        <h1 style="margin:0; font-size:22px; font-weight:700; color:#ffffff; line-height:1.2;">
                                            New Mission Assigned: {task.name}
                                        </h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Single Recipient Confidential Notice -->
                    <tr>
                        <td style="padding:12px 32px; background:#0d1527; border-bottom:1px solid #1e293b; font-size:11px; color:#64748b;">
                            🔒 <strong style="color:#94a3b8;">Confidential Direct Dispatch:</strong> Routed strictly to <span style="color:#38bdf8;">{employee.name}</span> (&lt;{employee.email}&gt;). Not broadcast to general staff.
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding:28px 32px;">
                            <p style="margin:0 0 16px 0; font-size:15px; color:#e2e8f0; line-height:1.5;">
                                Hello <strong style="color:#ffffff;">{employee.name}</strong>,
                            </p>
                            <p style="margin:0 0 20px 0; font-size:14px; color:#94a3b8; line-height:1.5;">
                                You have been selected and allocated to execute the following work item based on your real-time skill proficiency, current capacity headroom, and optimal SLA trajectory.
                            </p>

                            <!-- Task Details Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#131c31; border:1px solid #1e293b; border-radius:8px; margin-bottom:20px;">
                                <tr>
                                    <td style="padding:16px 20px; border-bottom:1px solid #1e293b;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <span style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase;">Task Reference</span>
                                                    <div style="font-size:16px; font-weight:700; color:#f8fafc; margin-top:2px;">{task.code} &mdash; {task.name}</div>
                                                </td>
                                                <td align="right" valign="top">
                                                    <span style="display:inline-block; padding:4px 10px; font-size:11px; font-weight:700; color:{p_color}; background:rgba(255,255,255,0.05); border:1px solid {p_color}; border-radius:6px; text-transform:uppercase;">
                                                        {task.priority} Priority
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:16px 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="50%" style="padding-bottom:12px;">
                                                    <div style="font-size:11px; color:#64748b; text-transform:uppercase;">Estimated Effort</div>
                                                    <div style="font-size:14px; font-weight:600; color:#e2e8f0; margin-top:2px;">{task.estimated_effort_min:.0f} Minutes ({task.estimated_effort_min/60:.1f} hrs)</div>
                                                </td>
                                                <td width="50%" style="padding-bottom:12px;">
                                                    <div style="font-size:11px; color:#64748b; text-transform:uppercase;">SLA Target Deadline</div>
                                                    <div style="font-size:14px; font-weight:600; color:#e2e8f0; margin-top:2px;">{task.sla_deadline}</div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="2">
                                                    <div style="font-size:11px; color:#64748b; text-transform:uppercase; margin-bottom:6px;">Required Capabilities</div>
                                                    <div>{skills_badges}</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            {match_html}
                            {note_html}

                            <!-- CTA Button -->
                            <div style="margin-top:28px; text-align:center;">
                                <a href="https://nexus-workforce-user.vercel.app/" target="_blank" style="display:inline-block; padding:12px 28px; background:linear-gradient(135deg, #0284c7 0%, #4f46e5 100%); color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; border-radius:8px; box-shadow:0 4px 12px rgba(2, 132, 199, 0.4); letter-spacing:0.02em;">
                                    Open Task in Nexus Workspace &rarr;
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 32px; background-color:#0b1120; border-top:1px solid #1e293b; text-align:center;">
                            <p style="margin:0 0 6px 0; font-size:11px; color:#64748b;">
                                Nexus Workforce OS &bull; Automated Real-Time Allocation Engine
                            </p>
                            <p style="margin:0; font-size:10px; color:#475569;">
                                Dispatched at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} via SMTP Gateway.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    return html


def send_assignment_email(req: AssignmentEmailRequest) -> EmailDispatchRecord:
    """
    Constructs and dispatches the task assignment email strictly to the single assigned employee.
    If live SMTP credentials are configured, sends via smtplib.
    If unconfigured or in testing mode, performs a simulated dispatch and records into the live outbox.
    """
    task = req.task
    emp = req.employee

    # Ensure recipient email exists
    recipient_email = emp.email.strip() if emp.email else ""
    if not recipient_email:
        sanitized_name = emp.name.lower().replace(" ", ".")
        recipient_email = f"{sanitized_name}@nexusworkforce.internal"

    subject = f"⚡ [Assigned] {task.code}: {task.name} ({task.priority} Priority)"
    html_content = generate_assignment_html(
        task=task,
        employee=emp,
        custom_note=req.custom_note,
        match_reason=req.match_reason
    )

    record_id = f"eml_{uuid.uuid4().hex[:10]}"
    timestamp = datetime.now(timezone.utc).isoformat()

    # Build MIME message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = f"{emp.name} <{recipient_email}>"
    msg["Date"] = formatdate(localtime=True)
    msg["X-Nexus-Task-ID"] = task.id
    msg["X-Nexus-Employee-ID"] = emp.id

    # Text fallback
    text_fallback = (
        f"Hello {emp.name},\n\n"
        f"You have been assigned to: {task.code} - {task.name}\n"
        f"Priority: {task.priority}\n"
        f"Estimated Effort: {task.estimated_effort_min} mins\n"
        f"SLA Deadline: {task.sla_deadline}\n"
        f"Match Reason: {req.match_reason or 'Direct assignment'}\n\n"
        f"View task in your employee portal.\n"
    )
    msg.attach(MIMEText(text_fallback, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    status = "Simulated Dispatch (SMTP Unconfigured)"
    error_msg: Optional[str] = None

    # Check if live SMTP credentials are provided
    has_smtp_creds = bool(
        SMTP_USER and 
        SMTP_PASSWORD and 
        SMTP_USER != "your_smtp_user" and 
        SMTP_PASSWORD != "your_smtp_password"
    )

    if has_smtp_creds:
        try:
            logger.info(f"Connecting to SMTP server {SMTP_HOST}:{SMTP_PORT} for recipient {recipient_email}...")
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12) as server:
                server.ehlo()
                if SMTP_USE_TLS:
                    server.starttls()
                    server.ehlo()
                server.login(SMTP_USER, SMTP_PASSWORD)
                # STRICT SINGLE-RECIPIENT ISOLATION: [recipient_email] only!
                server.sendmail(SMTP_FROM_EMAIL, [recipient_email], msg.as_string())
            status = "Delivered via SMTP"
            logger.info(f"Email successfully delivered to {recipient_email} via {SMTP_HOST}")
        except Exception as e:
            logger.error(f"SMTP delivery error to {recipient_email}: {e}")
            status = "Failed"
            error_msg = str(e)
    else:
        logger.info(f"[SIMULATED SMTP DISPATCH] Task {task.code} assigned to {emp.name} <{recipient_email}>. Live SMTP creds not set in .env.")

    record = EmailDispatchRecord(
        id=record_id,
        task_id=task.id,
        task_name=task.name,
        recipient_email=recipient_email,
        recipient_name=emp.name,
        subject=subject,
        status=status,
        timestamp=timestamp,
        smtp_host=SMTP_HOST if has_smtp_creds else "Simulated / Outbox",
        error_message=error_msg,
        html_preview=html_content[:300] + "..."
    )

    # Prepend to in-memory outbox audit log
    _outbox_log.insert(0, record)
    if len(_outbox_log) > 100:
        _outbox_log.pop()

    return record


def get_outbox(limit: int = 50) -> List[EmailDispatchRecord]:
    """Returns recent sent emails from outbox audit log."""
    return _outbox_log[:limit]


def clear_outbox() -> None:
    """Clears outbox records (used for test setup)."""
    global _outbox_log
    _outbox_log = []


def match_top_expert(req: ExpertMatchRequest) -> ExpertMatchResponse:
    """
    Real-time expert matching engine.
    Finds and ranks all candidates for a required skill (e.g. 'python'),
    evaluating proficiency, capacity headroom, and on-time performance.
    """
    query_skill = req.skill_id.strip().lower()
    min_prof = req.min_proficiency
    employees = req.employees

    candidates: List[ExpertMatchCandidate] = []

    for emp in employees:
        # Check if employee has the skill
        matched_skill = None
        for s in emp.skills:
            if query_skill in s.skill_id.lower() or s.skill_id.lower() in query_skill:
                if s.proficiency_pct >= min_prof:
                    matched_skill = s
                    break
        
        if not matched_skill:
            continue

        # Calculate metrics
        prof = matched_skill.proficiency_pct
        rem_capacity = max(0.0, emp.capacity_hours * (1.0 - (emp.utilization_pct / 100.0)))
        on_time = emp.performance.on_time

        # Scoring weights:
        # - Skill proficiency: 50%
        # - Capacity headroom: 30% (normalized up to 40h)
        # - On-time history: 20%
        prof_score = (prof / 100.0) * 50.0
        cap_score = min(1.0, rem_capacity / 30.0) * 30.0
        on_time_score = (on_time / 100.0) * 20.0
        total_score = prof_score + cap_score + on_time_score

        # Multiplier penalty if not Available
        if emp.status != "Available":
            total_score *= 0.6

        total_score = round(min(100.0, max(0.0, total_score)), 1)

        # Generate reasons
        reasons = []
        if prof >= 90:
            reasons.append(f"Top-tier {matched_skill.skill_id.upper()} Specialist ({prof:.0f}% proficiency)")
        else:
            reasons.append(f"{prof:.0f}% {matched_skill.skill_id.upper()} proficiency meets requirements")

        if rem_capacity >= 15:
            reasons.append(f"High availability ({rem_capacity:.1f}h available bandwidth)")
        elif rem_capacity > 5:
            reasons.append(f"Adequate bandwidth ({rem_capacity:.1f}h available)")
        else:
            reasons.append(f"High workload constraint ({emp.utilization_pct:.0f}% utilized)")

        if on_time >= 90:
            reasons.append(f"Exceptional SLA track record ({on_time:.0f}% on-time completion)")

        candidates.append(ExpertMatchCandidate(
            employee=emp,
            skill_proficiency=prof,
            capacity_remaining_hours=round(rem_capacity, 1),
            on_time_rate=on_time,
            overall_match_score=total_score,
            is_top_match=False,
            match_reasons=reasons
        ))

    # Sort descending by overall match score
    candidates.sort(key=lambda c: c.overall_match_score, reverse=True)

    top_match = None
    if candidates:
        candidates[0].is_top_match = True
        top_match = candidates[0]
        msg = f"Found {len(candidates)} qualified candidate(s). Top match: {top_match.employee.name} ({top_match.overall_match_score}% match score)."
    else:
        msg = f"No candidates meet the minimum {min_prof}% proficiency threshold for '{req.skill_id}'."

    return ExpertMatchResponse(
        skill_id=req.skill_id,
        total_candidates=len(candidates),
        top_match=top_match,
        candidates=candidates,
        message=msg
    )
