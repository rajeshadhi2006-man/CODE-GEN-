import React from 'react';
import { useUserStore } from '../../context/UserStoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Activity, 
  Layers 
} from 'lucide-react';
import { MetricSkeleton } from '../ui/LoadingSkeleton';

export const MetricOverview: React.FC = () => {
  const { metrics, isLoading, tasks } = useUserStore();
  const { employeeProfile } = useAuth();

  if (isLoading) {
    return (
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
    );
  }

  // Format remaining effort minutes into readable "Xh Ym"
  const formatEffort = (min: number) => {
    if (!min || min === 0) return '0 min';
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const capacityHours = Number(employeeProfile?.capacity_hours) || 40;

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}
    >
      {/* 1. Total Assigned Tasks */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Total Assigned Tasks
          </span>
          <div 
            style={{
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--color-indigo)'
            }}
          >
            <Layers size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          {metrics.totalAssigned}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          {metrics.totalAssigned === 0 ? 'No tasks assigned in Supabase' : `${tasks.filter(t => t.status !== 'Completed').length} active tasks`}
        </div>
      </div>

      {/* 2. In-Progress Tasks */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            In Progress
          </span>
          <div 
            style={{
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--color-cyan)'
            }}
          >
            <Activity size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          {metrics.inProgress}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          {metrics.inProgress === 0 ? '0 active work streams' : 'Currently being executed'}
        </div>
      </div>

      {/* 3. Completed Tasks */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Completed Tasks
          </span>
          <div 
            style={{
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--color-emerald)'
            }}
          >
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          {metrics.completed}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          {metrics.completed === 0 ? 'No completed tasks recorded' : 'Verified in Supabase'}
        </div>
      </div>

      {/* 4. Active Workload Remaining */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Remaining Workload
          </span>
          <div 
            style={{
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(168, 85, 247, 0.15)',
              color: 'var(--color-purple)'
            }}
          >
            <Clock size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          {formatEffort(metrics.totalRemainingEffortMin)}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          Against {capacityHours}h weekly capacity
        </div>
      </div>

      {/* 5. SLA Risk Alert */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            SLA Risk Alerts
          </span>
          <div 
            style={{
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              background: metrics.slaBreachRiskCount > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: metrics.slaBreachRiskCount > 0 ? '#fb7185' : 'var(--text-muted)'
            }}
          >
            <AlertOctagon size={18} />
          </div>
        </div>
        <div 
          style={{
            fontSize: '1.75rem', 
            fontWeight: 700, 
            color: metrics.slaBreachRiskCount > 0 ? '#fb7185' : 'var(--text-primary)', 
            letterSpacing: '-0.03em' 
          }}
        >
          {metrics.slaBreachRiskCount}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          {metrics.slaBreachRiskCount === 0 ? 'All deadlines healthy' : 'Tasks close to SLA deadline'}
        </div>
      </div>
    </div>
  );
};
