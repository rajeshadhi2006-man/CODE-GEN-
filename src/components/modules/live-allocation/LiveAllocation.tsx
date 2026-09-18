import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Search, 
  Filter, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  RotateCw
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { calculateSLARisk } from '../../../engine/sla';
import { TaskPriority } from '../../../data/types';

export const LiveAllocation: React.FC = () => {
  const { 
    tasks, 
    employees, 
    recommendations, 
    optimizeAll, 
    optimizeTask, 
    approveRecommendation, 
    rejectRecommendation, 
    openExplainModal,
    isAIOptimizing,
    selectedRegion,
    currentTimestamp,
    toggleCreateTaskModal
  } = useNexusStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [viewScope, setViewScope] = useState<'all' | 'at-risk' | 'recommended'>('all');

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    // Search
    if (searchTerm && !t.code.toLowerCase().includes(searchTerm.toLowerCase()) && !t.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Priority
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) {
      return false;
    }
    // Region
    if (selectedRegion !== 'All') {
      const emp = employees.find(e => e.id === t.assigned_employee_id);
      if (emp && emp.region !== selectedRegion) return false;
    }
    // View Scope
    if (viewScope === 'at-risk') {
      const emp = employees.find(e => e.id === t.assigned_employee_id);
      const risk = calculateSLARisk(t, emp);
      return risk.risk_tier === 'Critical' || risk.risk_tier === 'High' || t.status === 'AtRisk';
    }
    if (viewScope === 'recommended') {
      return recommendations.some(r => r.task_id === t.id);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[16px] card-3d select-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Dynamic Resource Allocation Engine
            </span>
            <Badge variant="accent" size="sm">{filteredTasks.length} Active Tasks</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Live Allocation & Continuous Rebalancing
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time algorithmic resource matching based on 7-factor deterministic scoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="tinted"
            size="md"
            onClick={() => toggleCreateTaskModal(true)}
          >
            + Create Work Order
          </Button>

          <Button
            variant="filled"
            size="md"
            icon={<Sparkles size={15} className="text-white" />}
            loading={isAIOptimizing}
            onClick={() => optimizeAll()}
          >
            Optimize All Tasks
          </Button>
        </div>
      </div>

      {/* Control Bar: Search & Filter Segmented Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-panel)] p-3.5 rounded-[14px] border border-[var(--hairline)] shadow-[inset_0_1px_2px_rgba(51,61,109,0.04)]">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by task code (T-104) or name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--hairline)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Scope Segmented Control */}
          <SegmentedControl
            size="sm"
            value={viewScope}
            onChange={(val) => setViewScope(val as any)}
            options={[
              { value: 'all', label: 'All Tasks' },
              { value: 'at-risk', label: 'At Risk Only', badge: tasks.filter(t => t.status === 'AtRisk').length },
              { value: 'recommended', label: 'AI Proposals', badge: recommendations.length }
            ]}
          />
        </div>
      </div>

      {/* Dense Operational Table */}
      <div className="rounded-[16px] card-3d overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[var(--bg-panel)] border-b border-[var(--hairline)] text-[var(--text-secondary)] font-mono-data font-semibold">
                <th className="py-3 px-4 font-medium">Task Code</th>
                <th className="py-3 px-4 font-medium">Task Name</th>
                <th className="py-3 px-4 font-medium">Priority</th>
                <th className="py-3 px-4 font-medium">SLA Remaining</th>
                <th className="py-3 px-4 font-medium">Current Resource</th>
                <th className="py-3 px-4 font-medium">AI Recommendation</th>
                <th className="py-3 px-4 font-medium">Confidence</th>
                <th className="py-3 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] mx-auto">
                        <Clock size={20} />
                      </div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">No Active Tasks in Real-Time Queue</h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Add a real task with custom SLA requirements, or stream a live team workload batch.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button variant="filled" size="sm" onClick={() => toggleCreateTaskModal(true)}>
                          + Add Real Work Order
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.slice(0, 30).map((task) => {
                  const currentEmp = employees.find(e => e.id === task.assigned_employee_id) || null;
                  const rec = recommendations.find(r => r.task_id === task.id);
                  const recommendedEmp = rec ? employees.find(e => e.id === rec.to_employee_id) : null;
                  const risk = calculateSLARisk(task, currentEmp, currentTimestamp);

                  const deadlineMs = new Date(task.sla_deadline).getTime();
                  const diffSec = Math.max(0, Math.floor((deadlineMs - currentTimestamp) / 1000));
                  const hrs = Math.floor(diffSec / 3600);
                  const mins = Math.floor((diffSec % 3600) / 60);
                  const secs = diffSec % 60;
                  const countdownStr = `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;

                  return (
                    <tr 
                      key={task.id} 
                      className={`transition-colors hover:bg-[var(--bg-panel)]/60 ${
                        rec ? 'bg-[var(--accent)]/5' : ''
                      }`}
                    >
                      {/* Task Code */}
                      <td className="py-3 px-4 font-mono-data font-bold text-[var(--text-primary)]">
                        {task.code}
                      </td>

                      {/* Task Name */}
                      <td className="py-3 px-4 max-w-[240px]">
                        <div className="truncate font-medium text-[var(--text-primary)]">
                          {task.name}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)] font-mono-data">
                          Effort: {task.remaining_effort_min}m remaining
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <Badge 
                          variant={task.priority === 'Critical' ? 'critical' : task.priority === 'High' ? 'high' : 'medium'}
                          size="sm"
                        >
                          {task.priority}
                        </Badge>
                      </td>

                      {/* Live SLA Countdown */}
                      <td className="py-3 px-4 font-mono-data">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className={risk.remaining_sla_min < 120 ? "text-[#FF453A]" : "text-[var(--text-tertiary)]"} />
                          <span className={risk.remaining_sla_min < 120 ? "text-[#FF453A] font-semibold" : "text-[var(--text-secondary)]"}>
                            {countdownStr}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          Buffer: {risk.safety_buffer_min > 0 ? `+${risk.safety_buffer_min}m` : `${risk.safety_buffer_min}m`}
                        </div>
                      </td>

                    {/* Current Resource */}
                    <td className="py-3 px-4">
                      {currentEmp ? (
                        <div className="flex items-center gap-2">
                          <img 
                            src={currentEmp.avatar} 
                            alt={currentEmp.name} 
                            className="w-6 h-6 rounded-full object-cover border border-white/10" 
                          />
                          <div>
                            <div className="font-medium text-[var(--text-primary)] truncate max-w-[130px]">
                              {currentEmp.name}
                            </div>
                            <div className="text-[10px] font-mono-data text-[var(--text-tertiary)]">
                              {currentEmp.id} • {currentEmp.utilization_pct}% util
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#FF9F0A] font-mono-data font-medium">Unassigned</span>
                      )}
                    </td>

                    {/* AI Recommendation */}
                    <td className="py-3 px-4">
                      {rec && recommendedEmp ? (
                        <div className="flex items-center gap-2">
                          <img 
                            src={recommendedEmp.avatar} 
                            alt={recommendedEmp.name} 
                            className="w-6 h-6 rounded-full object-cover border border-[var(--accent)]/50" 
                          />
                          <div>
                            <div className="font-semibold text-[var(--accent)] truncate max-w-[130px]">
                              {recommendedEmp.name}
                            </div>
                            <div className="text-[10px] font-mono-data text-[#1E9E4A] font-semibold">
                              Risk: {rec.impact.before_sla_risk}% → {rec.impact.after_sla_risk}%
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)] font-mono-data text-[11px]">—</span>
                      )}
                    </td>

                    {/* Confidence Score */}
                    <td className="py-3 px-4 font-mono-data">
                      {rec ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[var(--text-primary)]">{rec.score.total_score}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">/100</span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rec ? (
                          <>
                            <Button
                              variant="filled"
                              size="sm"
                              icon={<CheckCircle2 size={13} />}
                              onClick={() => approveRecommendation(rec.id)}
                              className="text-xs py-1"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => rejectRecommendation(rec.id)}
                              className="text-[#FF453A] hover:bg-[#FF453A]/15"
                            >
                              <XCircle size={15} />
                            </Button>
                            <Button
                              variant="tinted"
                              size="sm"
                              icon={<HelpCircle size={13} />}
                              onClick={() => openExplainModal(task.id, rec.id)}
                              className="text-xs py-1"
                            >
                              Why?
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="tinted"
                              size="sm"
                              onClick={() => optimizeTask(task.id)}
                              icon={<Sparkles size={12} />}
                              className="text-xs py-1"
                            >
                              Reallocate
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openExplainModal(task.id)}
                              className="text-xs py-1 text-[var(--text-tertiary)] hover:text-white"
                            >
                              Inspect
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
