import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  Sparkles, 
  Calendar, 
  ArrowRight,
  Info,
  Trash2
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { calculateSLARisk } from '../../../engine/sla';
import { Task } from '../../../data/types';

export const SlaRiskCenter: React.FC = () => {
  const { tasks, employees, openExplainModal, optimizeTask, deleteTask } = useNexusStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Calculate risk metrics for all tasks
  const tasksWithRisk = tasks.map(t => {
    const emp = employees.find(e => e.id === t.assigned_employee_id) || null;
    const risk = calculateSLARisk(t, emp);
    return { task: t, employee: emp, risk };
  });

  // Sort by risk descending
  tasksWithRisk.sort((a, b) => b.risk.risk_score - a.risk.risk_score);

  const selectedItem = tasksWithRisk.find(item => item.task.id === selectedTaskId) || tasksWithRisk[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Predictive SLA Analytics Engine
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-critical)] animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            SLA Risk Center & Predictive Breach Timeline
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Monitors delivery clocks and models probability of deadline breaches across future intervals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: At-Risk Tasks List */}
        <div className="lg:col-span-1 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] overflow-hidden flex flex-col h-[680px]">
          <div className="p-3.5 border-b border-[var(--hairline)] bg-[var(--bg-panel)] flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Ranked Risk Registry
            </span>
            <Badge variant="critical" size="sm">
              {tasksWithRisk.filter(i => i.risk.risk_score >= 50).length} High/Critical
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[var(--hairline)] custom-scroll">
            {tasksWithRisk.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Clock size={20} className="text-[var(--text-tertiary)] mx-auto" />
                <h4 className="text-xs font-semibold text-white">No Tasks Tracked</h4>
                <p className="text-[11px] text-[var(--text-secondary)]">The SLA queue is currently clear.</p>
              </div>
            ) : (
              tasksWithRisk.slice(0, 25).map(({ task, employee, risk }) => {
                const isSelected = selectedItem?.task.id === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-[rgba(10,132,255,0.12)] border-l-2 border-l-[var(--accent)]' 
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-data font-semibold text-white">{task.code}</span>
                        <Badge 
                          variant={risk.risk_score >= 80 ? 'critical' : risk.risk_score >= 50 ? 'high' : 'healthy'} 
                          size="sm"
                        >
                          {risk.risk_score}%
                        </Badge>
                      </div>
                      <span className="text-[10px] font-mono-data text-[var(--text-tertiary)]">
                        {risk.remaining_sla_min}m left
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] truncate mb-2">
                      {task.name}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono-data">
                      <span className="text-[var(--text-tertiary)]">
                        {employee ? employee.name : 'Unassigned'}
                      </span>
                      <span className={risk.safety_buffer_min < 0 ? 'text-[#FF453A] font-bold' : 'text-[#30D158]'}>
                        Buffer: {risk.safety_buffer_min > 0 ? `+${risk.safety_buffer_min}m` : `${risk.safety_buffer_min}m`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Task Detailed SLA & Predictive Breakdown */}
        {selectedItem ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Task Overview Card */}
            <div className="p-5 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono-data font-bold text-lg text-white">{selectedItem.task.code}</span>
                    <Badge variant={selectedItem.task.priority === 'Critical' ? 'critical' : 'high'}>
                      {selectedItem.task.priority} Priority
                    </Badge>
                    <Badge variant={selectedItem.risk.risk_tier === 'Critical' || selectedItem.risk.risk_tier === 'Breached' ? 'critical' : 'high'}>
                      {selectedItem.risk.risk_tier} Tier
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {selectedItem.task.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="tinted"
                    size="sm"
                    icon={<Sparkles size={14} className="text-[var(--accent-glow)]" />}
                    onClick={() => optimizeTask(selectedItem.task.id)}
                  >
                    Run AI Match
                  </Button>
                  <Button
                    variant="bordered"
                    size="sm"
                    onClick={() => openExplainModal(selectedItem.task.id)}
                  >
                    Explain Score
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={13} className="text-red-400" />}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-red-400 hover:bg-red-500/20 hover:text-red-300"
                    title="Delete Work Order"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Real-time Math Explanation String */}
              <div className="p-3.5 rounded-[10px] bg-[rgba(255,69,58,0.08)] border border-[var(--status-critical)]/20 flex items-start gap-3">
                <Info size={16} className="text-[#FF453A] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                  <strong>Telemetry Diagnosis:</strong> {selectedItem.risk.explanation}
                </p>
              </div>

              {/* 4 SLA Metrics Numbers */}
              <div className="grid grid-cols-4 gap-3 font-mono-data">
                <div className="p-3 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">Time Remaining</span>
                  <span className="text-lg font-bold text-white">{selectedItem.risk.remaining_sla_min}m</span>
                </div>
                <div className="p-3 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">Est. Completion</span>
                  <span className="text-lg font-bold text-white">{selectedItem.risk.estimated_completion_min}m</span>
                </div>
                <div className="p-3 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">Safety Buffer</span>
                  <span className={`text-lg font-bold ${selectedItem.risk.safety_buffer_min < 0 ? 'text-[#FF453A]' : 'text-[#30D158]'}`}>
                    {selectedItem.risk.safety_buffer_min > 0 ? `+${selectedItem.risk.safety_buffer_min}m` : `${selectedItem.risk.safety_buffer_min}m`}
                  </span>
                </div>
                <div className="p-3 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">Breach Probability</span>
                  <span className={`text-lg font-bold ${selectedItem.risk.risk_score >= 80 ? 'text-[#FF453A]' : 'text-[#FF9F0A]'}`}>
                    {selectedItem.risk.risk_score}%
                  </span>
                </div>
              </div>
            </div>

            {/* Predictive SLA Timeline Chart (Now / +15m / +30m / +60m) */}
            <div className="p-5 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Predictive Risk Trajectory
                  </h4>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Modelled probability degradation over next 60 minutes without intervention
                  </p>
                </div>
                <span className="text-xs font-mono-data text-[var(--text-tertiary)]">
                  Decay Model: Monotonic Pressure Function
                </span>
              </div>

              {/* Visual Interval Grid */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Now (t=0)', val: selectedItem.risk.projections.now, delta: 'Baseline' },
                  { label: '+15 Minutes', val: selectedItem.risk.projections.plus15, delta: `+${selectedItem.risk.projections.plus15 - selectedItem.risk.projections.now}%` },
                  { label: '+30 Minutes', val: selectedItem.risk.projections.plus30, delta: `+${selectedItem.risk.projections.plus30 - selectedItem.risk.projections.now}%` },
                  { label: '+60 Minutes', val: selectedItem.risk.projections.plus60, delta: `+${selectedItem.risk.projections.plus60 - selectedItem.risk.projections.now}%` },
                ].map((interval, idx) => (
                  <div key={idx} className="p-3.5 rounded-[12px] bg-[var(--bg-panel)] border border-[var(--hairline)] space-y-2">
                    <span className="text-[11px] font-mono-data text-[var(--text-secondary)] block">
                      {interval.label}
                    </span>
                    <div className="text-2xl font-mono-data font-bold text-white">
                      {interval.val}%
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${interval.val >= 80 ? 'bg-[#FF453A]' : interval.val >= 50 ? 'bg-[#FF9F0A]' : 'bg-[#30D158]'}`}
                        style={{ width: `${interval.val}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono-data text-[var(--text-tertiary)] block">
                      Change: {interval.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex flex-col items-center justify-center text-center space-y-3">
            <ShieldAlert size={28} className="text-[var(--text-tertiary)]" />
            <h3 className="text-base font-semibold text-white">No SLA Work Orders Selected</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm">
              Select an active work order from the left registry or create a work order to inspect predictive SLA decay curves.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {selectedItem && showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title={`Delete Work Order ${selectedItem.task.code}`}
          subtitle="Are you sure you want to permanently remove this work order?"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-white">
                  "{selectedItem.task.name}"
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Permanently deletes this task from Supabase, frees assigned engineer bandwidth, and updates real-time SLA metrics.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--hairline)]">
              <Button
                variant="bordered"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                icon={<Trash2 size={13} />}
                onClick={async () => {
                  const idToDelete = selectedItem.task.id;
                  setShowDeleteConfirm(false);
                  await deleteTask(idToDelete);
                }}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
