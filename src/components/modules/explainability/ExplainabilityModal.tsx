import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  HelpCircle,
  UserCheck,
  Cpu
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { AIExplainerService, ExplanationResponse } from '../../../services/aiExplainer';
import { calculateSLARisk } from '../../../engine/sla';
import { computeAllocationScore, rankCandidates } from '../../../engine/scoring';

export const ExplainabilityModal: React.FC = () => {
  const { 
    selectedTaskIdForExplain, 
    selectedRecommendationId, 
    closeExplainModal, 
    tasks, 
    employees, 
    recommendations, 
    approveRecommendation,
    weights 
  } = useNexusStore();

  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);

  const task = tasks.find(t => t.id === selectedTaskIdForExplain);
  const rec = recommendations.find(r => r.id === selectedRecommendationId || r.task_id === task?.id);
  const currentAssignee = employees.find(e => e.id === task?.assigned_employee_id) || null;
  const targetEmployee = rec 
    ? employees.find(e => e.id === rec.to_employee_id) 
    : employees.find(e => e.id !== task?.assigned_employee_id && e.status === 'Available');

  const score = (task && targetEmployee) 
    ? (rec ? rec.score : computeAllocationScore(task, targetEmployee, weights))
    : null;
  const beforeRiskMetrics = (task) ? calculateSLARisk(task, currentAssignee) : null;
  const afterRiskMetrics = (task && targetEmployee) ? calculateSLARisk(task, targetEmployee) : null;

  useEffect(() => {
    if (!task || !targetEmployee || !score || !beforeRiskMetrics || !afterRiskMetrics) {
      setExplanation(null);
      return;
    }

    setIsLoadingGemini(true);
    const candidatePool = employees.filter(e => e.id !== task.assigned_employee_id && e.status !== 'Unavailable');
    const { alternatives } = rankCandidates(task, candidatePool, weights);

    AIExplainerService.generateAllocationExplanation(
      task,
      targetEmployee,
      score,
      rec?.alternatives || alternatives,
      beforeRiskMetrics.risk_score,
      afterRiskMetrics.risk_score
    ).then((res) => {
      setExplanation(res);
      setIsLoadingGemini(false);
    }).catch(() => {
      setIsLoadingGemini(false);
    });
  }, [task?.id, targetEmployee?.id]);

  if (!selectedTaskIdForExplain || !task || !targetEmployee || !score || !beforeRiskMetrics || !afterRiskMetrics) return null;

  const candidatePool = employees.filter(e => e.id !== task.assigned_employee_id && e.status !== 'Unavailable');
  const { alternatives } = rankCandidates(task, candidatePool, weights);

  const factorLabels: Record<string, { label: string; weight: number }> = {
    skill: { label: 'Skill Compatibility', weight: weights.skill },
    sla: { label: 'SLA Protection', weight: weights.sla },
    availability: { label: 'Schedule Headroom', weight: weights.availability },
    workload: { label: 'Workload Balance', weight: weights.workload },
    performance: { label: 'Historical On-Time & Quality', weight: weights.performance },
    location: { label: 'Region & Timezone Alignment', weight: weights.location },
    business_impact: { label: 'Strategic Client Priority', weight: weights.business_impact },
  };

  return (
    <Modal
      isOpen={Boolean(selectedTaskIdForExplain)}
      onClose={closeExplainModal}
      title={`AI Allocation Explainability: ${task.code}`}
      subtitle={`Deterministic Multi-Factor Scoring & Candidate Ranking Engine`}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] font-mono-data">
            <span>Engine: Deterministic v2.4</span>
            <span>•</span>
            <span>Policy: Sum=100% Guaranteed</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="bordered" size="sm" onClick={closeExplainModal}>
              Close
            </Button>
            {rec && rec.status === 'Pending' && (
              <Button
                variant="filled"
                size="sm"
                icon={<CheckCircle2 size={15} />}
                onClick={() => {
                  approveRecommendation(rec.id);
                  closeExplainModal();
                }}
              >
                Approve Reallocation
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-[12px] bg-[rgba(10,132,255,0.08)] border border-[var(--accent)]/20 flex items-start gap-3.5">
          <div className="p-2 rounded-[8px] bg-[var(--accent)]/20 text-[var(--accent-glow)] shrink-0 mt-0.5">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-semibold text-white">
                Recommendation: {targetEmployee.name} ({targetEmployee.id})
              </h4>
              <Badge variant="accent">Confidence: {score.total_score}/100</Badge>
              {explanation?.isLiveGemini && (
                <Badge variant="healthy" dot>
                  {explanation.modelUsed}
                </Badge>
              )}
            </div>
            {isLoadingGemini ? (
              <div className="flex items-center gap-2 text-xs text-[var(--accent-glow)] font-mono-data py-1">
                <Sparkles size={13} className="animate-spin" />
                <span>Running deep allocation analysis via Google Gemini API...</span>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {explanation?.summary}
              </p>
            )}
          </div>
        </div>

        {/* Before vs After Impact Diff */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3.5 rounded-[12px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
            <span className="text-xs text-[var(--text-tertiary)] block mb-1">Current State</span>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {currentAssignee ? `${currentAssignee.name} (${currentAssignee.id})` : 'Unassigned'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--hairline)]">
              <span className="text-[var(--text-secondary)]">SLA Breach Risk:</span>
              <span className="font-mono-data font-bold text-[#FF453A]">{beforeRiskMetrics.risk_score}%</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-[var(--text-secondary)]">Safety Buffer:</span>
              <span className="font-mono-data text-[var(--text-tertiary)]">{beforeRiskMetrics.safety_buffer_min}m</span>
            </div>
          </div>

          <div className="p-3.5 rounded-[12px] bg-[rgba(48,209,88,0.06)] border border-[#30D158]/30">
            <span className="text-xs text-[#30D158] font-semibold block mb-1">Projected Optimized State</span>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-semibold text-white">
                {targetEmployee.name} ({targetEmployee.id})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#30D158]/20">
              <span className="text-[var(--text-secondary)]">SLA Breach Risk:</span>
              <span className="font-mono-data font-bold text-[#30D158]">{afterRiskMetrics.risk_score}%</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-[var(--text-secondary)]">Safety Buffer:</span>
              <span className="font-mono-data text-[#30D158]">+{afterRiskMetrics.safety_buffer_min}m safe</span>
            </div>
          </div>
        </div>

        {/* 7-Factor Radar Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              7-Factor Algorithmic Score Breakdown
            </h5>
            <span className="text-xs font-mono-data text-[var(--text-tertiary)]">
              Total: {score.total_score}/100
            </span>
          </div>

          <div className="space-y-3 bg-[var(--bg-panel)]/60 p-4 rounded-[12px] border border-[var(--hairline)]">
            {Object.entries(score.breakdown).map(([factorKey, value]) => {
              const info = factorLabels[factorKey] || { label: factorKey, weight: 10 };
              return (
                <div key={factorKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-primary)]">{info.label}</span>
                    <div className="flex items-center gap-2 font-mono-data">
                      <span className="text-[var(--text-tertiary)] text-[10px]">({info.weight}% weight)</span>
                      <span className="font-semibold text-white">{value}/100</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-glow)]"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Runner-Up Alternatives Comparison */}
        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Evaluated Runner-Up Alternatives
          </h5>

          <div className="space-y-2">
            {(rec?.alternatives || alternatives).slice(0, 3).map((alt, idx) => (
              <div 
                key={alt.employee_id}
                className="p-3 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)] flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span className="font-mono-data text-[var(--text-tertiary)] font-bold mt-0.5">
                    #{idx + 2}
                  </span>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {alt.employee_name} <span className="font-mono-data text-[var(--text-tertiary)]">({alt.employee_id})</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {alt.reason}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono-data font-bold text-[var(--text-secondary)]">
                    {alt.score}/100
                  </span>
                  <span className="text-[10px] block text-[#FF9F0A] font-mono-data">
                    -{score.total_score - alt.score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
