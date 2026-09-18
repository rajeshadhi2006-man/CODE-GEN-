import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  ShieldAlert,
  ArrowRight,
  Info 
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

import { SKILLS_LIST } from '../../../data/seed';
import { calculateSLARisk } from '../../../engine/sla';

export const AnalyticsView: React.FC = () => {
  const { metrics, employees, tasks, auditLogs, setActiveTab, currentTimestamp } = useNexusStore();
  const [timeHorizon, setTimeHorizon] = useState<'7d' | '30d' | 'quarter'>('30d');

  // Compute skill demand and supply purely from live active tasks & workforce
  const topSkills = SKILLS_LIST.slice(0, 6);
  const skillDemandSupply = topSkills.map(skill => {
    const demand = tasks.filter(t => t.required_skills?.some(s => s.skill_id === skill.id)).length;
    const supply = employees.filter(e => e.skills?.some(s => s.skill_id === skill.id)).length;
    const delta = supply - demand;
    const action = delta < 0 
      ? `Cross-train / surge allocate for ${skill.name}` 
      : delta > 4 
      ? 'Optimal buffer capability' 
      : 'Balanced competency';

    return {
      skill: skill.name,
      demand,
      supply,
      delta,
      action
    };
  });

  const reallocationsCount = auditLogs.filter(a => a.event_type.includes('REALLOCATION') || a.event_type.includes('DISRUPTION')).length;

  const validBuffers = tasks.map(t => {
    const emp = employees.find(e => e.id === t.assigned_employee_id);
    return calculateSLARisk(t, emp, currentTimestamp).safety_buffer_min;
  });

  const meanBuffer = validBuffers.length > 0 
    ? Math.round(validBuffers.reduce((acc, b) => acc + b, 0) / validBuffers.length) 
    : 0;

  const approvedCount = auditLogs.filter(a => a.approval_outcome && a.approval_outcome !== 'REJECTED').length;
  const totalDecisions = auditLogs.filter(a => Boolean(a.approval_outcome)).length;
  const aiAcceptanceRate = totalDecisions > 0 ? Number(((approvedCount / totalDecisions) * 100).toFixed(1)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Predictive Workforce Analytics & Forecasting
            </span>
            <Badge variant="accent">Forward Horizon: {timeHorizon.toUpperCase()}</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Capacity Forecasting, Skill Supply-Demand & AI Accuracy
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Live delivery intelligence modeling headcount requirements and autonomous efficiency gains.
          </p>
        </div>

        <SegmentedControl
          size="sm"
          value={timeHorizon}
          onChange={(val) => setTimeHorizon(val as any)}
          options={[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: 'quarter', label: 'Quarter' },
          ]}
        />
      </div>

      {/* Plain-Language Capacity Shortage Warning & Recommendations */}
      <div className="p-4 rounded-[14px] bg-[rgba(255,159,10,0.08)] border border-[#FF9F0A]/30 flex items-start gap-3">
        <AlertTriangle size={18} className="text-[#FF9F0A] shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-semibold text-white mb-1">
            Capacity & Telemetry Advisory ({timeHorizon.toUpperCase()} Outlook)
          </h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Live tracking <strong>{employees.length} active personnel</strong> across <strong>{tasks.length} active delivery tasks</strong>. 
            {skillDemandSupply.some(s => s.delta < 0) 
              ? ` Deficits detected in ${skillDemandSupply.filter(s => s.delta < 0).map(s => s.skill).join(', ')}. Autonomous rebalancing is proactively protecting delivery deadlines.` 
              : employees.length === 0 
              ? ' No active personnel provisioned yet. Metrics will automatically calculate once workforce data is inserted.'
              : ' Skill allocation across delivery pods is currently balanced within safe operational boundaries.'}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono-data">
        <div className="p-4 rounded-[12px] bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-1">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">AI Acceptance Rate</span>
          <div className="text-2xl font-bold text-[#30D158]">{aiAcceptanceRate}%</div>
          <span className="text-[11px] text-[var(--text-secondary)]">Human-in-the-loop approvals</span>
        </div>

        <div className="p-4 rounded-[12px] bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-1">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">SLA Compliance</span>
          <div className="text-2xl font-bold text-[var(--accent-glow)]">{metrics.sla_compliance_pct}%</div>
          <span className="text-[11px] text-[var(--text-secondary)]">Active perimeter rating</span>
        </div>

        <div className="p-4 rounded-[12px] bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-1">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">Live Reallocations</span>
          <div className="text-2xl font-bold text-white">{reallocationsCount}</div>
          <span className="text-[11px] text-[var(--text-secondary)]">Audited state transitions</span>
        </div>

        <div className="p-4 rounded-[12px] bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-1">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">Mean SLA Safety Buffer</span>
          <div className={`text-2xl font-bold ${meanBuffer < 0 ? 'text-[#FF453A]' : 'text-[#30D158]'}`}>
            {meanBuffer >= 60 ? `+${Math.floor(meanBuffer / 60)}h ${meanBuffer % 60}m` : meanBuffer >= 0 ? `+${meanBuffer}m` : `${meanBuffer}m`}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)]">Across active work orders</span>
        </div>
      </div>

      {/* Skill Demand vs Supply Breakdown Table */}
      <div className="rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-[var(--hairline)] bg-[var(--bg-panel)] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
            Core Competency Supply vs Demand Projections
          </span>
          <span className="text-xs font-mono-data text-[var(--text-tertiary)]">Units in FTE Equivalents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-[var(--text-secondary)] font-mono-data bg-[var(--bg-panel)]/50">
                <th className="py-3 px-4 font-medium">Competency</th>
                <th className="py-3 px-3 font-medium">Projected Demand</th>
                <th className="py-3 px-3 font-medium">Current Supply</th>
                <th className="py-3 px-3 font-medium">Net Delta</th>
                <th className="py-3 px-4 font-medium">Strategic Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)] font-mono-data">
              {skillDemandSupply.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    {item.skill}
                  </td>
                  <td className="py-3 px-3 text-white">
                    {item.demand} FTE
                  </td>
                  <td className="py-3 px-3 text-[var(--text-secondary)]">
                    {item.supply} FTE
                  </td>
                  <td className="py-3 px-3 font-bold">
                    <span className={item.delta < 0 ? 'text-[#FF453A]' : 'text-[#30D158]'}>
                      {item.delta > 0 ? `+${item.delta}` : item.delta} FTE
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-xs text-[var(--text-secondary)]">
                    {item.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
