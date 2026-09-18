import { 
  Task, 
  Employee, 
  AllocationWeights, 
  AllocationScore, 
  ScoreBreakdown, 
  CandidateAlternative 
} from '../data/types';

export const DEFAULT_WEIGHTS: AllocationWeights = {
  skill: 30,
  sla: 25,
  availability: 15,
  workload: 10,
  performance: 10,
  location: 5,
  business_impact: 5,
};

/**
 * Validates that weights sum to exactly 100
 */
export function validateWeights(weights: AllocationWeights): boolean {
  const sum = 
    weights.skill + 
    weights.sla + 
    weights.availability + 
    weights.workload + 
    weights.performance + 
    weights.location + 
    weights.business_impact;
  return Math.abs(sum - 100) < 0.001;
}

/**
 * Evaluates skill compatibility between task requirements and employee proficiencies
 * Returns 0 - 100
 */
export function scoreSkillCompatibility(task: Task, employee: Employee): number {
  const reqSkills = Array.isArray(task?.required_skills) ? task.required_skills : [];
  if (reqSkills.length === 0) return 90;
  
  let totalScore = 0;
  let matches = 0;
  const empSkills = Array.isArray(employee?.skills) ? employee.skills : [];

  for (const req of reqSkills) {
    const empSkill = empSkills.find(s => s && s.skill_id === req.skill_id);
    if (!empSkill) {
      // Missing skill penalty
      totalScore += 10;
    } else {
      matches++;
      const prof = Number(empSkill.proficiency_pct) || 0;
      const minProf = Number(req.min_proficiency) || 0;
      if (prof >= minProf) {
        // Bonus for exceeding requirement
        const bonus = Math.min(20, (prof - minProf) * 0.5);
        totalScore += Math.min(100, 80 + bonus);
      } else {
        // Partial proficiency
        const ratio = prof / Math.max(1, minProf);
        totalScore += Math.round(ratio * 70);
      }
    }
  }

  const avg = totalScore / reqSkills.length;
  // If no required skills matched at all, clamp low
  if (matches === 0) return Math.min(15, avg);
  return Math.min(100, Math.max(0, Math.round(avg)));
}

/**
 * Evaluates SLA protection: can this employee finish the task safely before the deadline?
 * Considers employee effective completion rate (on_time history + speed)
 */
export function scoreSLAProtection(task: Task, employee: Employee, nowMs: number = Date.now()): number {
  if (employee.status !== 'Available') return 10;
  
  const deadlineMs = new Date(task.sla_deadline).getTime();
  const remainingMinutes = (deadlineMs - nowMs) / (1000 * 60);

  // Speed factor based on employee on_time score
  const onTime = Number(employee.performance?.on_time ?? 85);
  const speedFactor = 0.8 + (onTime / 100) * 0.4; // 0.8 to 1.2
  const effectiveEffortMin = (task.remaining_effort_min || 60) / speedFactor;
  const safetyBufferMin = remainingMinutes - effectiveEffortMin;

  if (safetyBufferMin < -30) return 5;
  if (safetyBufferMin < 0) return 25;
  if (safetyBufferMin < 60) return 60;
  if (safetyBufferMin < 180) return 85;
  return 98;
}

/**
 * Evaluates availability based on current utilization and working status
 */
export function scoreAvailability(employee: Employee): number {
  if (employee.status === 'Unavailable') return 0;
  if (employee.status === 'OnLeave') return 5;

  const rawAvailable = 100 - (Number(employee.utilization_pct) || 0);
  return Math.min(100, Math.max(0, Math.round(rawAvailable)));
}

/**
 * Evaluates workload balance: ideal utilization target is 65-80%
 * Harshly penalizes overburdened engineers (>85%)
 */
export function scoreWorkloadBalance(employee: Employee): number {
  if (employee.status !== 'Available') return 10;

  const u = Number(employee.utilization_pct) || 0;
  if (u > 95) return 5;
  if (u > 85) return 30;
  if (u > 80) return 60;
  if (u >= 60 && u <= 80) return 98; // Sweet spot
  if (u >= 40 && u < 60) return 88;
  return 75; // Low utilization is fine to pick up work
}

/**
 * Blended quality and on-time performance history
 */
export function scorePerformance(employee: Employee): number {
  const q = Number(employee.performance?.quality ?? 85);
  const ot = Number(employee.performance?.on_time ?? 85);
  const blended = q * 0.45 + ot * 0.55;
  return Math.min(100, Math.max(0, Math.round(blended)));
}

/**
 * Evaluates timezone & geographic location alignment
 */
export function scoreLocationTimezone(task: Task, employee: Employee, targetRegion?: string): number {
  if (!targetRegion) return 85;
  if (employee.region === targetRegion) return 98;
  // Overlapping timezones
  const adjacentRegions: Record<string, string[]> = {
    'Americas': ['LATAM'],
    'LATAM': ['Americas'],
    'EMEA': ['South Asia'],
    'South Asia': ['EMEA', 'APAC'],
    'APAC': ['South Asia']
  };

  if (targetRegion && adjacentRegions[targetRegion]?.includes(employee.region)) {
    return 70;
  }
  return 45;
}

/**
 * Evaluates business impact alignment: critical tasks need top tier reliability
 */
export function scoreBusinessImpact(task: Task): number {
  const priorityWeights: Record<Task['priority'], number> = {
    'Critical': 100,
    'High': 80,
    'Medium': 55,
    'Low': 30
  };

  const pScore = priorityWeights[task.priority] || 60;
  const depBoost = Math.min(25, task.dependency_ids.length * 8);
  const blended = task.business_impact_score * 0.6 + pScore * 0.4 + depBoost;
  return Math.min(100, Math.max(0, Math.round(blended)));
}

/**
 * Computes deterministic allocation score with full 7-factor breakdown
 */
export function computeAllocationScore(
  task: Task, 
  employee: Employee, 
  weights: AllocationWeights = DEFAULT_WEIGHTS,
  targetRegion?: string,
  nowMs: number = Date.now()
): AllocationScore {
  const breakdown: ScoreBreakdown = {
    skill: scoreSkillCompatibility(task, employee),
    sla: scoreSLAProtection(task, employee, nowMs),
    availability: scoreAvailability(employee),
    workload: scoreWorkloadBalance(employee),
    performance: scorePerformance(employee),
    location: scoreLocationTimezone(task, employee, targetRegion),
    business_impact: scoreBusinessImpact(task),
  };

  const weightedSum = 
    (breakdown.skill * weights.skill) +
    (breakdown.sla * weights.sla) +
    (breakdown.availability * weights.availability) +
    (breakdown.workload * weights.workload) +
    (breakdown.performance * weights.performance) +
    (breakdown.location * weights.location) +
    (breakdown.business_impact * weights.business_impact);

  const total = Math.round(weightedSum / 100);

  return {
    id: `score-${task.id}-${employee.id}-${nowMs}`,
    task_id: task.id,
    employee_id: employee.id,
    breakdown,
    total_score: Math.min(100, Math.max(0, total)),
    computed_at: new Date(nowMs).toISOString(),
  };
}

/**
 * Ranks all candidate employees for a task and provides explanation reasons
 */
export function rankCandidates(
  task: Task,
  employees: Employee[],
  weights: AllocationWeights = DEFAULT_WEIGHTS,
  targetRegion?: string,
  topN: number = 5,
  nowMs: number = Date.now()
): { topCandidate: AllocationScore; alternatives: CandidateAlternative[]; allScores: AllocationScore[] } {
  // Filter out completely unavailable employees if possible, unless all are unavailable
  const availablePool = employees.filter(e => e.status !== 'Unavailable');
  const pool = availablePool.length > 0 ? availablePool : employees;

  const scores = pool.map(emp => {
    const score = computeAllocationScore(task, emp, weights, targetRegion, nowMs);
    return { emp, score };
  });

  scores.sort((a, b) => b.score.total_score - a.score.total_score);

  const rankedScores = scores.map((s, idx) => ({
    ...s.score,
    rank: idx + 1
  }));

  const top = scores[0];
  const alternatives: CandidateAlternative[] = scores.slice(1, topN).map(item => {
    const delta = top.score.total_score - item.score.total_score;
    let reason = '';
    
    if (item.score.breakdown.skill < top.score.breakdown.skill - 15) {
      reason = `Skill compatibility is ${top.score.breakdown.skill - item.score.breakdown.skill}% lower`;
    } else if (item.score.breakdown.workload < top.score.breakdown.workload - 15) {
      reason = `Higher utilization (${item.emp.utilization_pct}%) reduces scheduling safety`;
    } else if (item.score.breakdown.sla < top.score.breakdown.sla - 15) {
      reason = `Lower buffer protection for deadline`;
    } else if (item.score.breakdown.location < top.score.breakdown.location - 20) {
      reason = `Timezone shift mismatch with delivery region (${item.emp.region})`;
    } else {
      reason = `Overall blended score is ${delta} points behind primary`;
    }

    return {
      employee_id: item.emp.id,
      employee_name: item.emp.name,
      score: item.score.total_score,
      breakdown: item.score.breakdown,
      reason
    };
  });

  return {
    topCandidate: rankedScores[0],
    alternatives,
    allScores: rankedScores
  };
}

export interface SkillMatchResult {
  employee: Employee;
  score: number;
  matchedSkill: string;
  proficiency: number;
  reason: string;
}

/**
 * Autonomous AI Skill Matching Engine.
 * Automatically identifies the single best employee whose specialized skills match
 * the task requirements, factoring in skill proficiency, availability, and capacity headroom.
 */
export function findBestSkillMatch(task: Task, employees: Employee[]): SkillMatchResult | null {
  if (!employees || employees.length === 0) return null;

  const reqSkills = task.required_skills || [];
  let bestCandidate: Employee | null = null;
  let highestScore = -1;
  let bestSkillName = 'General Engineering';
  let bestProf = 80;
  let bestReason = '';

  // Filter available employees first, fallback to all if none
  const pool = employees.filter(e => e.status !== 'Unavailable');
  const candidatePool = pool.length > 0 ? pool : employees;

  for (const emp of candidatePool) {
    let skillScore = 0;
    let currentMatchedSkill = '';
    let currentProf = 0;

    if (reqSkills.length === 0) {
      skillScore = 75;
      currentMatchedSkill = 'General Engineering';
      currentProf = 75;
    } else {
      const empSkills = Array.isArray(emp.skills) ? emp.skills : [];
      for (const req of reqSkills) {
        const reqSkillId = (req && req.skill_id) ? String(req.skill_id) : '';
        const reqClean = reqSkillId.toLowerCase().replace(/^sk-/, '');
        if (!reqClean) continue;

        const empSkill = empSkills.find(s => {
          if (!s || !s.skill_id) return false;
          const sClean = String(s.skill_id).toLowerCase().replace(/^sk-/, '');
          return sClean === reqClean || sClean.includes(reqClean) || reqClean.includes(sClean);
        });

        if (empSkill) {
          const prof = Number(empSkill.proficiency_pct) || 0;
          if (prof > skillScore) {
            skillScore = prof;
            currentMatchedSkill = reqSkillId.replace(/^sk-/, '').toUpperCase();
            currentProf = prof;
          }
        }
      }
    }

    // Unmatched penalty
    if (skillScore === 0) {
      skillScore = 15;
    }

    // Capacity headroom (100 - util)
    const capacityHeadroom = Math.max(0, 100 - (emp.utilization_pct || 0));
    const onTimeScore = emp.performance?.on_time || 85;

    // AI Allocation Formula: Skill Proficiency 60%, Capacity Headroom 25%, On-Time SLA 15%
    const compositeScore = Math.round((skillScore * 0.60) + (capacityHeadroom * 0.25) + (onTimeScore * 0.15));

    if (compositeScore > highestScore) {
      highestScore = compositeScore;
      bestCandidate = emp;
      bestSkillName = currentMatchedSkill || 'General';
      bestProf = currentProf || skillScore;
      bestReason = currentMatchedSkill
        ? `Autonomous AI Skill Match: ${emp.name} has ${bestProf}% ${bestSkillName} proficiency with ${capacityHeadroom}% capacity headroom.`
        : `Autonomous AI Capacity Match: ${emp.name} selected based on ${capacityHeadroom}% bandwidth and ${onTimeScore}% on-time rate.`;
    }
  }

  if (bestCandidate) {
    return {
      employee: bestCandidate,
      score: highestScore,
      matchedSkill: bestSkillName,
      proficiency: bestProf,
      reason: bestReason
    };
  }

  return null;
}

