import { describe, it, expect } from 'vitest';
import { calculateSLARisk, getEmployeeEffectiveRate } from '../src/engine/sla';
import { Task, Employee } from '../src/data/types';

describe('SLA Risk Engine', () => {
  const baseTask: Task = {
    id: 'task-104',
    code: 'T-104',
    name: 'Production DB Migration',
    project_id: 'proj-1',
    priority: 'Critical',
    business_impact_score: 95,
    required_skills: [{ skill_id: 's-db', min_proficiency: 80 }],
    estimated_effort_min: 120,
    remaining_effort_min: 120,
    sla_deadline: new Date(Date.now() + 180 * 60 * 1000).toISOString(), // 180 min left
    dependency_ids: ['task-100', 'task-101'],
    assigned_employee_id: 'E-023',
    status: 'InProgress',
    created_at: new Date().toISOString()
  };

  const fastEmployee: Employee = {
    id: 'E-017',
    name: 'Marcus Vance',
    title: 'Lead Database Architect',
    email: 'marcus@nexus.corp',
    location: 'London',
    region: 'EMEA',
    timezone: 'UTC+0',
    skills: [{ skill_id: 's-db', proficiency_pct: 98 }],
    performance: { quality: 98, on_time: 98, tasks_completed_30d: 19 },
    capacity_hours: 40,
    utilization_pct: 68,
    status: 'Available',
    current_tasks: [],
    shift: { start: '09:00', end: '18:00' },
    certifications: ['Oracle Certified Master'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
  };

  const unavailableEmployee: Employee = {
    ...fastEmployee,
    id: 'E-023',
    name: 'Priya Nair',
    status: 'Unavailable'
  };

  it('should compute high effective rate for available high-performing engineer', () => {
    const rate = getEmployeeEffectiveRate(fastEmployee);
    expect(rate).toBeGreaterThan(1.0);
  });

  it('should penalize effective rate for unavailable engineer', () => {
    const rate = getEmployeeEffectiveRate(unavailableEmployee);
    expect(rate).toBeLessThan(0.5);
  });

  it('should show high SLA risk when task assigned to unavailable engineer', () => {
    const now = Date.now();
    const risk = calculateSLARisk(baseTask, unavailableEmployee, now);
    expect(risk.risk_score).toBeGreaterThanOrEqual(80);
    expect(risk.risk_tier).toMatch(/Critical|Breached|High/);
  });

  it('should show low or medium SLA risk when reassigned to available fast engineer', () => {
    const now = Date.now();
    const risk = calculateSLARisk(baseTask, fastEmployee, now);
    expect(risk.risk_score).toBeLessThan(55);
    expect(risk.safety_buffer_min).toBeGreaterThan(0);
  });

  it('should project increasing risk over +15, +30, +60 intervals', () => {
    const risk = calculateSLARisk(baseTask, unavailableEmployee);
    expect(risk.projections.plus60).toBeGreaterThanOrEqual(risk.projections.now);
  });
});
