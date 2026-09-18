import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_WEIGHTS, 
  validateWeights, 
  scoreSkillCompatibility, 
  scoreAvailability, 
  scoreWorkloadBalance, 
  computeAllocationScore,
  rankCandidates 
} from '../src/engine/scoring';
import { Task, Employee } from '../src/data/types';

describe('Scoring Engine', () => {
  it('should validate that default weights sum to 100', () => {
    expect(validateWeights(DEFAULT_WEIGHTS)).toBe(true);
  });

  it('should reject weights that do not sum to 100', () => {
    const invalid = { ...DEFAULT_WEIGHTS, skill: 40 };
    expect(validateWeights(invalid)).toBe(false);
  });

  const mockEmployee: Employee = {
    id: 'E-001',
    name: 'Sarah Connor',
    title: 'Senior Cloud Engineer',
    email: 'sarah@nexus.corp',
    location: 'Singapore',
    region: 'APAC',
    timezone: 'UTC+8',
    skills: [
      { skill_id: 's-k8s', proficiency_pct: 95 },
      { skill_id: 's-aws', proficiency_pct: 90 },
      { skill_id: 's-terraform', proficiency_pct: 80 }
    ],
    performance: { quality: 92, on_time: 96, tasks_completed_30d: 14 },
    capacity_hours: 40,
    utilization_pct: 70,
    status: 'Available',
    current_tasks: [],
    shift: { start: '09:00', end: '18:00' },
    certifications: ['AWS Solutions Architect Pro', 'CKA'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
  };

  const mockTask: Task = {
    id: 'task-1',
    code: 'T-101',
    name: 'Kubernetes Cluster Hardening',
    project_id: 'p-1',
    priority: 'Critical',
    business_impact_score: 90,
    required_skills: [
      { skill_id: 's-k8s', min_proficiency: 80 },
      { skill_id: 's-aws', min_proficiency: 75 }
    ],
    estimated_effort_min: 180,
    remaining_effort_min: 120,
    sla_deadline: new Date(Date.now() + 3600 * 4 * 1000).toISOString(),
    dependency_ids: [],
    assigned_employee_id: null,
    status: 'Ready',
    created_at: new Date().toISOString()
  };

  it('should score high skill compatibility when employee exceeds requirements', () => {
    const score = scoreSkillCompatibility(mockTask, mockEmployee);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should calculate availability correctly', () => {
    expect(scoreAvailability(mockEmployee)).toBe(30); // 100 - 70 = 30
    const unavailable = { ...mockEmployee, status: 'Unavailable' as const };
    expect(scoreAvailability(unavailable)).toBe(0);
  });

  it('should reward sweet spot workload balance and penalize overloaded engineer', () => {
    const balancedScore = scoreWorkloadBalance(mockEmployee); // 70% is sweet spot
    expect(balancedScore).toBe(98);

    const overloaded = { ...mockEmployee, utilization_pct: 96 };
    expect(scoreWorkloadBalance(overloaded)).toBe(5);
  });

  it('should compute allocation score between 0 and 100 with full breakdown', () => {
    const score = computeAllocationScore(mockTask, mockEmployee, DEFAULT_WEIGHTS, 'APAC');
    expect(score.total_score).toBeGreaterThan(50);
    expect(score.total_score).toBeLessThanOrEqual(100);
    expect(score.breakdown.skill).toBeDefined();
    expect(score.breakdown.sla).toBeDefined();
    expect(score.breakdown.availability).toBeDefined();
  });

  it('should rank top candidates correctly', () => {
    const juniorEmp: Employee = {
      ...mockEmployee,
      id: 'E-002',
      name: 'Junior Engineer',
      skills: [{ skill_id: 's-k8s', proficiency_pct: 30 }],
      performance: { quality: 60, on_time: 65, tasks_completed_30d: 3 },
      utilization_pct: 90
    };

    const { topCandidate, alternatives } = rankCandidates(mockTask, [mockEmployee, juniorEmp]);
    expect(topCandidate.employee_id).toBe('E-001');
    expect(alternatives.length).toBe(1);
    expect(alternatives[0].employee_id).toBe('E-002');
  });

  it('should safely score raw Supabase employees with missing current_tasks or skills without throwing', () => {
    const rawSupabaseEmp = {
      id: 'E-RAW',
      name: 'Cloud Engineer',
      title: 'Engineer',
      email: 'eng@nexus.corp',
      location: 'Remote',
      region: 'Americas',
      status: 'Available',
      // current_tasks, skills, performance intentionally omitted or undefined
    } as unknown as Employee;

    expect(() => scoreSkillCompatibility(mockTask, rawSupabaseEmp)).not.toThrow();
    const score = scoreSkillCompatibility(mockTask, rawSupabaseEmp);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
