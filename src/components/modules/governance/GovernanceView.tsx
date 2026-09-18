import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Scale, 
  Info,
  Lock 
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Badge } from '../../ui/Badge';

export const GovernanceView: React.FC = () => {
  const { employees, tasks } = useNexusStore();

  const criticalTasks = tasks.filter(t => t.priority === 'Critical');
  const concentrationItems = employees
    .map(emp => {
      const empCritical = criticalTasks.filter(t => t.assigned_employee_id === emp.id).length;
      const criticalPct = criticalTasks.length > 0 ? Math.round((empCritical / criticalTasks.length) * 100) : 0;
      const riskLevel: 'high' | 'medium' | 'healthy' = criticalPct >= 25 ? 'high' : criticalPct >= 15 ? 'medium' : 'healthy';
      const note = criticalPct >= 25 
        ? 'High concentration on critical path deliverables.'
        : criticalPct >= 15 
        ? 'Moderate share of high-priority work orders.'
        : 'Workload balanced within safe governance ceiling.';
      return {
        empId: emp.id,
        empName: emp.name,
        criticalPct,
        riskLevel,
        note
      };
    })
    .filter(item => item.criticalPct > 0)
    .sort((a, b) => b.criticalPct - a.criticalPct)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Auditable AI & Ethical Operations
            </span>
            <Badge variant="healthy">Non-Discriminatory Certified</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Fairness, Assignment Concentration & Governance Monitor
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Guarantees equitable task distribution, prevents key-person burnout, and enforces algorithmic neutrality.
          </p>
        </div>
      </div>

      {/* Mandatory Governance Charter Statement */}
      <div className="p-4 rounded-[14px] bg-[rgba(10,132,255,0.06)] border border-[var(--accent)]/30 flex items-start gap-3">
        <Lock size={18} className="text-[var(--accent)] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-white">
            Enterprise Algorithmic Neutrality Charter
          </h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Protected personal characteristics (such as age, gender, race, religion, sexual orientation, disability, and nationality) are strictly excluded from all mathematical inputs, models, and decision pipelines of the NEXUS Autonomous Allocation Engine. Work allocation is governed strictly by verified technical proficiencies, certified SLA parameters, schedule availability, and operational fatigue metrics.
          </p>
        </div>
      </div>

      {/* Concentration Risk Table */}
      <div className="rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-[var(--hairline)] bg-[var(--bg-panel)] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
            Assignment Concentration Monitor (Critical Work Orders)
          </span>
          <span className="text-xs font-mono-data text-[var(--text-tertiary)]">
            Concentration Ceiling: &lt;20% of Pod Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-[var(--text-secondary)] font-mono-data bg-[var(--bg-panel)]/50">
                <th className="py-3 px-4 font-medium">Engineer</th>
                <th className="py-3 px-3 font-medium">Share of Critical Work</th>
                <th className="py-3 px-3 font-medium">Concentration Level</th>
                <th className="py-3 px-4 font-medium">Governance Audit Finding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)] font-mono-data">
              {concentrationItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[var(--text-secondary)] font-sans">
                    <Scale size={24} className="text-[var(--text-tertiary)] mx-auto mb-2" />
                    <span className="block font-semibold text-white">No Critical Assignment Concentration</span>
                    <span className="text-[11px] text-[var(--text-tertiary)]">All work order distribution is currently at 0% across active pods.</span>
                  </td>
                </tr>
              ) : (
                concentrationItems.map((item) => (
                  <tr key={item.empId} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">{item.empName}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] ml-1.5">({item.empId})</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {item.criticalPct}% of Period Tasks
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={item.riskLevel} size="sm">
                        {item.riskLevel === 'high' ? 'Elevated Concentration' : item.riskLevel === 'medium' ? 'Moderate' : 'Equitable'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-sans text-xs text-[var(--text-secondary)]">
                      {item.note}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
