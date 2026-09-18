import React, { useState } from 'react';
import { useUserStore } from '../../context/UserStoreContext';
import type { Task, TaskPriority, TaskStatus } from '../../types/database';
import { EmptyState } from '../ui/EmptyState';
import { TaskSkeleton } from '../ui/LoadingSkeleton';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Play, 
  AlertTriangle, 
  Clock, 
  Search, 
  Layers, 
  Timer
} from 'lucide-react';

export const UserTasksList: React.FC = () => {
  const { tasks, projects, isLoading, updateTaskStatus, requestReallocation } = useUserStore();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal for Request Reallocation / Blocked
  const [selectedTaskForBlock, setSelectedTaskForBlock] = useState<Task | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState<boolean>(false);

  // Modal for Effort Logging
  const [selectedTaskForEffort, setSelectedTaskForEffort] = useState<Task | null>(null);
  const [remainingMinutesInput, setRemainingMinutesInput] = useState<number>(0);
  const [isSubmittingEffort, setIsSubmittingEffort] = useState<boolean>(false);

  // Status Action handler
  const handleStartTask = async (task: Task) => {
    await updateTaskStatus(task.id, 'InProgress');
  };

  const handleCompleteTask = async (task: Task) => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 }
    });
    await updateTaskStatus(task.id, 'Completed', 0);
  };

  const handleOpenBlockModal = (task: Task) => {
    setSelectedTaskForBlock(task);
    setBlockReason('');
  };

  const handleSubmitBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForBlock || !blockReason.trim()) return;

    setIsSubmittingBlock(true);
    await requestReallocation(selectedTaskForBlock.id, blockReason.trim());
    setIsSubmittingBlock(false);
    setSelectedTaskForBlock(null);
  };

  const handleOpenEffortModal = (task: Task) => {
    setSelectedTaskForEffort(task);
    setRemainingMinutesInput(task.remaining_effort_min || 0);
  };

  const handleSubmitEffort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForEffort) return;

    setIsSubmittingEffort(true);
    await updateTaskStatus(selectedTaskForEffort.id, selectedTaskForEffort.status, Number(remainingMinutesInput));
    setIsSubmittingEffort(false);
    setSelectedTaskForEffort(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesFilter = filterStatus === 'All' 
      ? true 
      : filterStatus === 'Active' 
      ? t.status !== 'Completed' 
      : t.status === filterStatus;

    const matchesSearch = searchQuery.trim() === '' || 
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.project_id && projects[t.project_id]?.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Calculate SLA countdown and badge
  const renderSlaBadge = (deadlineIso: string, status: TaskStatus) => {
    if (status === 'Completed') {
      return (
        <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} /> SLA Met
        </span>
      );
    }

    const deadline = new Date(deadlineIso).getTime();
    const diffMin = Math.round((deadline - Date.now()) / 60000);

    if (diffMin < 0) {
      const overdueHours = Math.abs(Math.floor(diffMin / 60));
      const overdueMins = Math.abs(diffMin % 60);
      return (
        <span className="badge badge-critical" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={12} /> Breached ({overdueHours > 0 ? `${overdueHours}h ` : ''}${overdueMins}m ago)
        </span>
      );
    }

    if (diffMin <= 60) {
      return (
        <span className="badge badge-critical" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Timer size={12} /> Critical: {diffMin}m left
        </span>
      );
    }

    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return (
      <span className="badge badge-medium" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Clock size={12} /> {hours}h {mins}m left
      </span>
    );
  };

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      case 'Low':
      default: return 'badge-low';
    }
  };

  const getStatusBadgeStyle = (status: TaskStatus) => {
    switch (status) {
      case 'InProgress':
        return { background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)' };
      case 'Completed':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'Blocked':
      case 'AtRisk':
      case 'Escalated':
        return { background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' };
      case 'Assigned':
      case 'Ready':
      default:
        return { background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' };
    }
  };

  if (isLoading) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div className="skeleton" style={{ width: '200px', height: '24px' }}></div>
          <div className="skeleton" style={{ width: '300px', height: '36px' }}></div>
        </div>
        <TaskSkeleton />
        <TaskSkeleton />
        <TaskSkeleton />
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Header & Controls */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            My Assigned Tasks
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Real-time feed filtered to tasks assigned to your employee identity in Supabase
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '2rem', paddingRight: '0.5rem', height: '36px' }}
              placeholder="Search code or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div 
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '2px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {['All', 'Active', 'InProgress', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: filterStatus === tab ? 'var(--color-indigo)' : 'transparent',
                  color: filterStatus === tab ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab === 'InProgress' ? 'In Progress' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List or Zero-Data Empty State */}
      {tasks.length === 0 ? (
        <EmptyState
          title="No data available yet."
          message="You currently have no tasks assigned to your employee ID in the database. When an administrator assigns or allocates a task to you in Supabase, it will automatically appear here in real time."
          icon="database"
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks matching filter"
          message={`No tasks found matching "${searchQuery}" with status "${filterStatus}".`}
          icon="folder"
          action={{
            label: 'Clear Filters',
            onClick: () => { setFilterStatus('All'); setSearchQuery(''); }
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredTasks.map((task) => {
            const project = task.project_id ? projects[task.project_id] : undefined;
            const isCompleted = task.status === 'Completed';
            const isInProgress = task.status === 'InProgress';
            const isBlocked = task.status === 'Blocked';

            return (
              <div 
                key={task.id} 
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderLeft: `4px solid ${
                    task.priority === 'Critical' ? '#f43f5e' : 
                    task.priority === 'High' ? '#f59e0b' : 
                    task.priority === 'Medium' ? '#6366f1' : '#10b981'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {/* Task Meta Top */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span 
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: 'var(--color-cyan)',
                        background: 'rgba(6, 182, 212, 0.1)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(6, 182, 212, 0.25)'
                      }}
                    >
                      {task.code}
                    </span>
                    <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                      {task.priority} Priority
                    </span>
                    <span 
                      className="badge"
                      style={getStatusBadgeStyle(task.status)}
                    >
                      {task.status}
                    </span>
                    {project && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={13} /> {project.name} {project.client_tier && `(${project.client_tier})`}
                      </span>
                    )}
                  </div>

                  {/* SLA Countdown Badge */}
                  <div>
                    {renderSlaBadge(task.sla_deadline, task.status)}
                  </div>
                </div>

                {/* Task Name */}
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.75rem 0 0.5rem 0' }}>
                  {task.name}
                </h3>

                {/* Effort and Skills bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', margin: '0.75rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Estimated: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{task.estimated_effort_min} min</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Remaining: </span>
                      <strong style={{ color: isCompleted ? '#34d399' : '#a5b4fc' }}>
                        {isCompleted ? '0 min' : `${task.remaining_effort_min} min`}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Deadline: </span>
                      <span>{new Date(task.sla_deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Log remaining effort */}
                    {!isCompleted && (
                      <button
                        className="btn-secondary"
                        onClick={() => handleOpenEffortModal(task)}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                        title="Update remaining effort in Supabase"
                      >
                        <Timer size={14} /> Log Effort
                      </button>
                    )}

                    {/* Start Task if not in progress */}
                    {!isInProgress && !isCompleted && (
                      <button
                        className="btn-primary"
                        onClick={() => handleStartTask(task)}
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                      >
                        <Play size={14} /> Start Task
                      </button>
                    )}

                    {/* Complete Task */}
                    {!isCompleted && (
                      <button
                        className="btn-secondary"
                        onClick={() => handleCompleteTask(task)}
                        style={{ 
                          padding: '0.4rem 0.85rem', 
                          fontSize: '0.75rem',
                          background: 'rgba(16, 185, 129, 0.15)',
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                          color: '#34d399'
                        }}
                      >
                        <CheckCircle2 size={14} /> Complete
                      </button>
                    )}

                    {/* Flag Issue / Request Reassignment */}
                    {!isCompleted && !isBlocked && (
                      <button
                        className="btn-secondary"
                        onClick={() => handleOpenBlockModal(task)}
                        style={{ 
                          padding: '0.4rem 0.65rem', 
                          fontSize: '0.75rem',
                          color: '#fb7185',
                          borderColor: 'rgba(244, 63, 94, 0.3)'
                        }}
                        title="Flag as Blocked or Request Reassignment"
                      >
                        <AlertTriangle size={14} /> Flag Blocked
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {task.estimated_effort_min > 0 && (
                  <div 
                    style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                      marginTop: '0.5rem'
                    }}
                  >
                    <div 
                      style={{
                        height: '100%',
                        width: isCompleted 
                          ? '100%' 
                          : `${Math.min(100, Math.max(0, Math.round(((task.estimated_effort_min - task.remaining_effort_min) / task.estimated_effort_min) * 100)))}%`,
                        background: isCompleted 
                          ? '#10b981' 
                          : isInProgress 
                          ? 'linear-gradient(90deg, #6366f1, #06b6d4)' 
                          : '#6366f1',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Flag Task as Blocked / Request Reassignment */}
      {selectedTaskForBlock && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 60
          }}
        >
          <div 
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#fb7185' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Report Impediment / Flag Task
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              This will update <strong style={{ color: '#ffffff' }}>{selectedTaskForBlock.code}</strong> status to 
              <span className="badge badge-critical" style={{ margin: '0 4px' }}>Blocked</span> in Supabase and notify project leads.
            </p>
            <form onSubmit={handleSubmitBlock}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Reason for blocker or reallocation request:
                </label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '90px', resize: 'vertical' }}
                  placeholder="e.g. Awaiting database migration access from security team..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedTaskForBlock(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmittingBlock || !blockReason.trim()}
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
                >
                  {isSubmittingBlock ? 'Submitting to Supabase...' : 'Confirm Blocker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Remaining Effort */}
      {selectedTaskForEffort && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 60
          }}
        >
          <div 
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-cyan)' }}>
              <Timer size={24} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Log Remaining Effort
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Update remaining work minutes for <strong style={{ color: '#ffffff' }}>{selectedTaskForEffort.code}</strong>.
            </p>
            <form onSubmit={handleSubmitEffort}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Remaining Effort (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  className="input-field"
                  value={remainingMinutesInput}
                  onChange={(e) => setRemainingMinutesInput(Number(e.target.value))}
                  required
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Originally estimated: {selectedTaskForEffort.estimated_effort_min} min
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedTaskForEffort(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmittingEffort}
                >
                  {isSubmittingEffort ? 'Saving to Supabase...' : 'Save to Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
