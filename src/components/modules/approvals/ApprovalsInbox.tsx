import React from 'react';
import { 
  Inbox, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ShieldAlert, 
  Clock, 
  ArrowRight,
  Sparkles 
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

export const ApprovalsInbox: React.FC = () => {
  const { 
    recommendations, 
    tasks, 
    employees, 
    approveRecommendation, 
    rejectRecommendation, 
    openExplainModal,
    currentUser 
  } = useNexusStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Governance & Delegation Gate
            </span>
            <Badge variant="accent">{recommendations.length} Pending Actions</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Human-in-the-Loop Approvals Inbox
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Role-gated verification queue for high-impact autonomous reallocation proposals.
          </p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="p-12 text-center rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[var(--text-tertiary)] mx-auto">
            <CheckCircle2 size={24} className="text-[#30D158]" />
          </div>
          <h3 className="text-base font-semibold text-white">Approvals Queue is Clear</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            All autonomous reallocations have been processed. The workforce is operating within target equilibrium.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const task = tasks.find(t => t.id === rec.task_id);
            const fromEmp = employees.find(e => e.id === rec.from_employee_id);
            const toEmp = employees.find(e => e.id === rec.to_employee_id);
            if (!task || !toEmp) return null;

            return (
              <div
                key={rec.id}
                className="p-5 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-4 shadow-sm hover:border-[var(--hairline-strong)] transition-all"
              >
                {/* Proposal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--hairline)] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-data font-bold text-white">{task.code}</span>
                    <Badge variant={task.priority === 'Critical' ? 'critical' : 'high'}>
                      {task.priority} Priority
                    </Badge>
                    <Badge variant="accent">
                      {rec.required_approval_level} Approval Required
                    </Badge>
                  </div>

                  <span className="text-[11px] font-mono-data text-[var(--text-tertiary)]">
                    Generated: {new Date(rec.created_at).toLocaleTimeString()}
                  </span>
                </div>

                {/* Task Name & Reason */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">{task.name}</h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {rec.reason}
                  </p>
                </div>

                {/* Diff Comparison (Before vs After) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono-data">
                  {/* From */}
                  <div className="p-3 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">Current Assignee</span>
                      <span className="font-semibold text-[var(--text-secondary)]">
                        {fromEmp ? `${fromEmp.name} (${fromEmp.id})` : 'Unassigned'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">SLA Risk</span>
                      <span className="font-bold text-[#FF453A]">{rec.impact.before_sla_risk}%</span>
                    </div>
                  </div>

                  {/* To */}
                  <div className="p-3 rounded-[10px] bg-[rgba(48,209,88,0.06)] border border-[#30D158]/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-[#30D158] uppercase font-bold block">Proposed Resource</span>
                      <span className="font-semibold text-white">
                        {toEmp.name} ({toEmp.id})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">Projected Risk</span>
                      <span className="font-bold text-[#30D158]">{rec.impact.after_sla_risk}%</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--hairline)]">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<HelpCircle size={14} />}
                    onClick={() => openExplainModal(task.id, rec.id)}
                    className="text-xs"
                  >
                    View 7-Factor Score & Alternatives
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      icon={<XCircle size={14} />}
                      onClick={() => rejectRecommendation(rec.id)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="filled"
                      size="sm"
                      icon={<CheckCircle2 size={14} />}
                      onClick={() => approveRecommendation(rec.id)}
                    >
                      Approve Reallocation
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
