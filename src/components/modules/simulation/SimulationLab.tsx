import React, { useState } from 'react';
import { 
  Cpu, 
  Play, 
  Sparkles, 
  RotateCcw, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { calculateSLARisk } from '../../../engine/sla';
import { rankCandidates } from '../../../engine/scoring';
import { Employee, Task } from '../../../data/types';

interface SimulationScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  apply: (emps: Employee[], ts: Task[]) => { emps: Employee[]; ts: Task[]; summary: string };
}

export const SimulationLab: React.FC = () => {
  const { employees, tasks, weights } = useNexusStore();

  const [selectedScenarioId, setSelectedScenarioId] = useState('sc-1');
  const [simulationState, setSimulationState] = useState<'idle' | 'simulated' | 'optimized'>('idle');
  const [clonedData, setClonedData] = useState<{
    before: { compliance: number; util: number; atRisk: number };
    after: { compliance: number; util: number; atRisk: number };
    optimized: { compliance: number; util: number; atRisk: number };
    affectedCount: number;
    summary: string;
  } | null>(null);

  const scenarios: SimulationScenario[] = [
    {
      id: 'sc-1',
      name: 'Unplanned Senior Architect Outage',
      category: 'Workforce Disruption',
      description: 'Simulates sudden unavailability of top 3 lead cloud architects (including Priya Nair E-023).',
      apply: (emps, ts) => {
        const targetIds = ['E-023', 'E-003', 'E-004'];
        const updatedEmps = emps.map(e => targetIds.includes(e.id) ? { ...e, status: 'Unavailable' as const, utilization_pct: 0 } : e);
        const affectedTasks = ts.filter(t => targetIds.includes(t.assigned_employee_id || ''));
        const updatedTasks = ts.map(t => targetIds.includes(t.assigned_employee_id || '') ? { ...t, status: 'AtRisk' as const } : t);
        return {
          emps: updatedEmps,
          ts: updatedTasks,
          summary: `3 senior leads marked unavailable; ${affectedTasks.length} high-priority tasks disrupted.`
        };
      }
    },
    {
      id: 'sc-2',
      name: 'Global Financial Regulatory Surge (+40 Tasks)',
      category: 'Demand Spike',
      description: 'Injects 40 sudden Critical/High compliance tasks requiring Kafka and PostgreSQL security audit.',
      apply: (emps, ts) => {
        const injectedTasks: Task[] = Array.from({ length: 40 }).map((_, i) => ({
          id: `sim-task-${i}`,
          code: `T-SIM-${i + 1}`,
          name: `Urgent Audit Ingestion Node ${i + 1}`,
          project_id: 'proj-1',
          priority: 'Critical' as const,
          business_impact_score: 95,
          required_skills: [{ skill_id: 'sk-db', min_proficiency: 80 }],
          estimated_effort_min: 180,
          remaining_effort_min: 180,
          sla_deadline: new Date(Date.now() + 180 * 60 * 1000).toISOString(),
          dependency_ids: [],
          assigned_employee_id: null,
          status: 'Ready' as const,
          created_at: new Date().toISOString()
        }));
        return {
          emps,
          ts: [...injectedTasks, ...ts],
          summary: '40 critical regulatory audit tasks added without prior resource booking.'
        };
      }
    },
    {
      id: 'sc-3',
      name: 'Executive SLA Contraction (-50% Deadline Buffers)',
      category: 'Policy Shift',
      description: 'Compresses remaining SLA deadlines on all In-Progress projects by 50% for expedited delivery.',
      apply: (emps, ts) => {
        const now = Date.now();
        const updatedTasks = ts.map(t => {
          const currentRemainingMs = Math.max(10 * 60 * 1000, new Date(t.sla_deadline).getTime() - now);
          const compressedDeadline = new Date(now + currentRemainingMs * 0.5).toISOString();
          return { ...t, sla_deadline: compressedDeadline };
        });
        return {
          emps,
          ts: updatedTasks,
          summary: 'All project SLA deadline buffers cut by 50% across 5 global regions.'
        };
      }
    }
  ];

  const currentScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  const runSimulation = () => {
    // 1. Deep clone current state
    const empsClone: Employee[] = JSON.parse(JSON.stringify(employees));
    const tasksClone: Task[] = JSON.parse(JSON.stringify(tasks));

    if (empsClone.length === 0 || tasksClone.length === 0) {
      setClonedData({
        before: { compliance: 0, util: 0, atRisk: 0 },
        after: { compliance: 0, util: 0, atRisk: 0 },
        optimized: { compliance: 0, util: 0, atRisk: 0 },
        affectedCount: 0,
        summary: 'No active workforce or tasks provisioned in memory to simulate.'
      });
      setSimulationState('simulated');
      return;
    }

    // Baseline calculation
    let baseAtRisk = 0;
    tasksClone.forEach(t => {
      const e = empsClone.find(emp => emp.id === t.assigned_employee_id);
      const r = calculateSLARisk(t, e);
      if (r.risk_tier === 'Critical' || r.risk_tier === 'High') baseAtRisk++;
    });

    const baseUtil = Number((empsClone.reduce((acc, e) => acc + e.utilization_pct, 0) / empsClone.length).toFixed(1));
    const baseCompliance = Number((((tasksClone.length - baseAtRisk) / tasksClone.length) * 100).toFixed(1));

    // 2. Apply scenario mutation
    const { emps: mutatedEmps, ts: mutatedTasks, summary } = currentScenario.apply(empsClone, tasksClone);

    // Compute Disrupted Metrics
    let disruptedAtRisk = 0;
    mutatedTasks.forEach(t => {
      const e = mutatedEmps.find(emp => emp.id === t.assigned_employee_id);
      const r = calculateSLARisk(t, e);
      if (r.risk_tier === 'Critical' || r.risk_tier === 'High' || !t.assigned_employee_id) disruptedAtRisk++;
    });

    const disruptedCompliance = mutatedTasks.length > 0 
      ? Number((((mutatedTasks.length - disruptedAtRisk) / mutatedTasks.length) * 100).toFixed(1))
      : 0;
    const disruptedUtil = mutatedEmps.length > 0
      ? Number((mutatedEmps.reduce((acc, e) => acc + e.utilization_pct, 0) / mutatedEmps.length).toFixed(1))
      : 0;

    // 3. Compute AI-Optimized run using pure scoring & ranking engine
    const availablePool = mutatedEmps.filter(e => e.status !== 'Unavailable');
    let optimizedAtRisk = 0;

    mutatedTasks.forEach(t => {
      if (!t.assigned_employee_id || t.status === 'AtRisk') {
        const { topCandidate } = rankCandidates(t, availablePool, weights);
        if (topCandidate) {
          const target = availablePool.find(e => e.id === topCandidate.employee_id);
          const r = calculateSLARisk(t, target);
          if (r.risk_tier === 'Critical') optimizedAtRisk++;
        }
      } else {
        const e = mutatedEmps.find(emp => emp.id === t.assigned_employee_id);
        const r = calculateSLARisk(t, e);
        if (r.risk_tier === 'Critical') optimizedAtRisk++;
      }
    });

    const optimizedCompliance = mutatedTasks.length > 0
      ? Number((((mutatedTasks.length - optimizedAtRisk) / mutatedTasks.length) * 100).toFixed(1))
      : 0;

    setClonedData({
      before: {
        compliance: baseCompliance,
        util: baseUtil,
        atRisk: baseAtRisk
      },
      after: {
        compliance: disruptedCompliance,
        util: disruptedUtil,
        atRisk: disruptedAtRisk
      },
      optimized: {
        compliance: optimizedCompliance,
        util: baseUtil,
        atRisk: optimizedAtRisk
      },
      affectedCount: Math.abs(disruptedAtRisk - baseAtRisk),
      summary
    });

    setSimulationState('simulated');
  };

  const optimizeScenario = () => {
    setSimulationState('optimized');
  };

  const resetSimulation = () => {
    setSimulationState('idle');
    setClonedData(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Digital Twin Simulation Lab
            </span>
            <Badge variant="accent">Deterministic Sandbox</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            What-If Scenario Stress Testing & Resilience Modelling
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Clones current enterprise state to model disruptions and compute autonomous recovery pathways.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {simulationState === 'idle' && (
            <Button
              variant="filled"
              size="md"
              icon={<Play size={15} />}
              onClick={runSimulation}
            >
              Run Simulation
            </Button>
          )}

          {simulationState === 'simulated' && (
            <>
              <Button
                variant="filled"
                size="md"
                icon={<Sparkles size={15} className="text-[var(--accent-glow)]" />}
                onClick={optimizeScenario}
              >
                Apply AI Optimization
              </Button>
              <Button variant="ghost" size="sm" onClick={resetSimulation}>
                Reset
              </Button>
            </>
          )}

          {simulationState === 'optimized' && (
            <Button
              variant="tinted"
              size="md"
              icon={<RotateCcw size={15} />}
              onClick={resetSimulation}
            >
              Reset Digital Twin
            </Button>
          )}
        </div>
      </div>

      {/* Scenario Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const isSelected = selectedScenarioId === sc.id;
          return (
            <div
              key={sc.id}
              onClick={() => {
                setSelectedScenarioId(sc.id);
                setSimulationState('idle');
                setClonedData(null);
              }}
              className={`p-4 rounded-[12px] border cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-[rgba(10,132,255,0.12)] border-[var(--accent)] shadow-md' 
                  : 'bg-[var(--bg-elevated)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-mono-data text-[var(--accent)] font-semibold">
                  {sc.category}
                </span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
              </div>
              <h4 className="text-sm font-semibold text-white mb-1.5">
                {sc.name}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {sc.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Comparative Results View (Before / After / Optimized) */}
      {clonedData && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)] flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">
              <strong>Simulated Condition:</strong> {clonedData.summary}
            </span>
            <Badge variant="neutral">{clonedData.affectedCount} Entities Impacted</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Baseline State */}
            <div className="p-5 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono-data block">
                1. Baseline Prior State
              </span>
              <div className="space-y-2 pt-2 border-t border-[var(--hairline)] font-mono-data">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">SLA Compliance:</span>
                  <span className="font-bold text-white">{clonedData.before.compliance}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Average Utilization:</span>
                  <span className="font-bold text-white">{clonedData.before.util}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">At-Risk Tasks:</span>
                  <span className="font-bold text-[#FFD60A]">{clonedData.before.atRisk}</span>
                </div>
              </div>
            </div>

            {/* 2. Disrupted State (Without AI) */}
            <div className="p-5 rounded-[14px] bg-[rgba(255,69,58,0.06)] border border-[#FF453A]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FF453A] font-mono-data block">
                  2. Disrupted (Without AI)
                </span>
                <AlertTriangle size={15} className="text-[#FF453A]" />
              </div>

              <div className="space-y-2 pt-2 border-t border-[#FF453A]/20 font-mono-data">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">SLA Compliance:</span>
                  <span className="font-bold text-[#FF453A]">{clonedData.after.compliance}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Average Utilization:</span>
                  <span className="font-bold text-white">{clonedData.after.util}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">At-Risk Tasks:</span>
                  <span className="font-bold text-[#FF453A]">{clonedData.after.atRisk}</span>
                </div>
              </div>
            </div>

            {/* 3. AI Optimized State (With AI) */}
            <div className={`p-5 rounded-[14px] border space-y-3 transition-all ${
              simulationState === 'optimized'
                ? 'bg-[rgba(48,209,88,0.08)] border-[#30D158]/40 shadow-lg shadow-green-500/10'
                : 'bg-[var(--bg-elevated)]/50 border-[var(--hairline)] opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#30D158] font-mono-data block">
                  3. Autonomous Rebalanced (With AI)
                </span>
                <ShieldCheck size={16} className="text-[#30D158]" />
              </div>

              <div className="space-y-2 pt-2 border-t border-[#30D158]/20 font-mono-data">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">SLA Compliance:</span>
                  <span className="font-bold text-[#30D158]">{clonedData.optimized.compliance}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Average Utilization:</span>
                  <span className="font-bold text-white">{clonedData.optimized.util}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">At-Risk Tasks:</span>
                  <span className="font-bold text-[#30D158]">{clonedData.optimized.atRisk}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
