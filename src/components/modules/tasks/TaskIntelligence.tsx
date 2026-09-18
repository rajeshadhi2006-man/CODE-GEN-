import React, { useState } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  Sparkles,
  ArrowUpDown,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { TaskStatus } from '../../../data/types';

export const TaskIntelligence: React.FC = () => {
  const { tasks, employees, openExplainModal, optimizeTask, deleteTask } = useNexusStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');
  const [page, setPage] = useState(1);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; code: string; name: string } | null>(null);
  const pageSize = 20;

  const statuses: TaskStatus[] = [
    'Backlog', 'Ready', 'Assigned', 'InProgress', 'Blocked', 'AtRisk', 'Escalated', 'Completed'
  ];

  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (searchTerm && !t.code.toLowerCase().includes(searchTerm.toLowerCase()) && !t.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTasks.length / pageSize);
  const paginatedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-[16px] card-3d flex items-center justify-between select-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Global Work Order Registry
            </span>
            <Badge variant="neutral">{filteredTasks.length} Tasks Tracked</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Task Intelligence & Lifecycle Pipeline
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Full enterprise inventory across all delivery stages with business impact and dependency tracking.
          </p>
        </div>
      </div>

      {/* Filter & Pipeline Chips */}
      <div className="p-3.5 rounded-[14px] bg-[var(--bg-panel)] border border-[var(--hairline)] space-y-3 shadow-[inset_0_1px_2px_rgba(51,61,109,0.04)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by task code (T-104) or keywords..."
              className="w-full pl-9 pr-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--hairline)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
            <button
              onClick={() => { setStatusFilter('All'); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-mono-data transition-all shrink-0 ${
                statusFilter === 'All'
                  ? 'bg-gradient-to-r from-[#723EC3] to-[#874EE3] text-white shadow-[0_2px_6px_rgba(114,62,195,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] font-bold'
                  : 'bg-[var(--bg-elevated)] border border-[var(--hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#723EC3]/40 badge-3d'
              }`}
            >
              All ({tasks.length})
            </button>
            {statuses.map(st => {
              const count = tasks.filter(t => t.status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => { setStatusFilter(st); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-mono-data transition-all shrink-0 ${
                    statusFilter === st
                      ? 'bg-gradient-to-r from-[#723EC3] to-[#874EE3] text-white shadow-[0_2px_6px_rgba(114,62,195,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] font-bold'
                      : 'bg-[var(--bg-elevated)] border border-[var(--hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#723EC3]/40 badge-3d'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Virtualized/Paginated Table */}
      <div className="rounded-[16px] card-3d overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[var(--bg-panel)] border-b border-[var(--hairline)] text-[var(--text-secondary)] font-mono-data font-semibold">
                <th className="py-3 px-4 font-medium">Code</th>
                <th className="py-3 px-4 font-medium">Task Description</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Priority</th>
                <th className="py-3 px-4 font-medium">Impact Score</th>
                <th className="py-3 px-4 font-medium">Assignee</th>
                <th className="py-3 px-4 font-medium">Dependencies</th>
                <th className="py-3 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--text-secondary)]">
                    <CheckSquare size={24} className="text-[var(--accent)] mx-auto mb-2" />
                    <span className="block font-semibold text-[var(--text-primary)]">No Tasks Registered</span>
                    <span className="text-[11px] text-[var(--text-tertiary)]">Tasks added to Supabase will appear here in real time.</span>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((t) => {
                  const emp = employees.find(e => e.id === t.assigned_employee_id);
                  return (
                    <tr key={t.id} className="hover:bg-[var(--bg-panel)]/50 transition-colors">
                      <td className="py-3 px-4 font-mono-data font-bold text-[var(--text-primary)]">
                        {t.code}
                      </td>
                      <td className="py-3 px-4 max-w-[280px]">
                        <div className="font-semibold text-[var(--text-primary)] truncate">{t.name}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)] font-mono-data">
                          Effort: {t.remaining_effort_min}m remaining
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={t.status === 'AtRisk' ? 'critical' : t.status === 'Blocked' ? 'high' : t.status === 'InProgress' ? 'neutral' : 'subtle'}
                          size="sm"
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono-data">
                        <Badge 
                          variant={t.priority === 'Critical' ? 'critical' : t.priority === 'High' ? 'high' : 'neutral'}
                          size="sm"
                        >
                          {t.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono-data text-[var(--text-primary)] font-semibold">
                        {t.business_impact_score}/100
                      </td>
                      <td className="py-3 px-4 font-mono-data">
                        {emp ? (
                          <div className="flex items-center gap-2">
                            <img src={emp.avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-[var(--hairline)]" />
                            <span className="text-[var(--text-primary)] font-medium truncate max-w-[120px]">{emp.name}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--status-critical)] font-semibold">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono-data text-[var(--text-tertiary)]">
                        {t.dependency_ids?.length > 0 ? `${t.dependency_ids.length} blocks` : 'None'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openExplainModal(t.id)}
                            className="text-xs"
                          >
                            Explain
                          </Button>
                          <Button
                            variant="tinted"
                            size="sm"
                            icon={<Sparkles size={12} />}
                            onClick={() => optimizeTask(t.id)}
                            className="text-xs"
                          >
                            Reallocate
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={12} className="text-red-400 group-hover:text-red-300" />}
                            onClick={() => setTaskToDelete({ id: t.id, code: t.code, name: t.name })}
                            className="text-xs text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                            title="Delete Task"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-[var(--hairline)] bg-[var(--bg-panel)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span className="font-mono-data">
            {filteredTasks.length > 0 
              ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(filteredTasks.length, page * pageSize)} of ${filteredTasks.length} tasks`
              : '0 tasks tracked'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="bordered"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="font-mono-data px-2">Page {page} of {totalPages || 1}</span>
            <Button
              variant="bordered"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Task Confirmation Modal */}
      {taskToDelete && (
        <Modal
          isOpen={Boolean(taskToDelete)}
          onClose={() => setTaskToDelete(null)}
          title={`Delete Work Order ${taskToDelete.code}`}
          subtitle="Are you sure you want to permanently remove this task from the delivery pipeline?"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-white">
                  "{taskToDelete.name}"
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Deleting this task will remove it from Supabase, release assigned engineer capacity, and recalculate global SLA metrics in real time.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--hairline)]">
              <Button
                variant="bordered"
                size="sm"
                onClick={() => setTaskToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                icon={<Trash2 size={13} />}
                onClick={async () => {
                  if (taskToDelete) {
                    await deleteTask(taskToDelete.id);
                    setTaskToDelete(null);
                  }
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
