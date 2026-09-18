import React from 'react';
import { useUserStore } from '../../context/UserStoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Bell, 
  Clock 
} from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { recommendations, auditLogs } = useUserStore();
  const { employeeProfile } = useAuth();

  if (!isOpen) return null;

  // Combine recommendations and audit logs into notification items
  const items: Array<{
    id: string;
    type: 'recommendation' | 'audit';
    title: string;
    description: string;
    timestamp: string;
    badge: string;
  }> = [];

  recommendations.forEach((rec) => {
    const isTarget = rec.target_employee_id === employeeProfile?.id;
    items.push({
      id: rec.id,
      type: 'recommendation',
      title: isTarget ? 'Task Reallocation Proposal' : 'Task Reassignment Initiated',
      description: isTarget 
        ? `Nexus AI proposed reallocating task ${rec.task_id} to you (Confidence: ${Math.round((rec.confidence || 0.8) * 100)}%).` 
        : `Task ${rec.task_id} has been proposed for reassignment.`,
      timestamp: rec.created_at || new Date().toISOString(),
      badge: rec.status
    });
  });

  auditLogs.forEach((log) => {
    items.push({
      id: log.id,
      type: 'audit',
      title: log.event_type.replace(/_/g, ' '),
      description: log.reason || `${log.before || ''} → ${log.after || ''}`,
      timestamp: log.timestamp || new Date().toISOString(),
      badge: log.approval_outcome || 'VERIFIED'
    });
  });

  // Sort newest first
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 80
      }}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          borderRadius: 0,
          borderLeft: '1px solid var(--border-subtle)',
          borderRight: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-indigo)'
              }}
            >
              <Bell size={18} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Notifications & Activity
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* List or Empty State */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {items.length === 0 ? (
            <EmptyState
              title="No notifications yet."
              message="When tasks are assigned, reallocated, or updated in Supabase, live notifications will appear here."
              icon="inbox"
            />
          ) : (
            items.map((item) => (
              <div 
                key={item.id} 
                className="glass-card"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  borderLeft: `3px solid ${item.type === 'recommendation' ? '#6366f1' : '#06b6d4'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.title}
                  </span>
                  <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>
                    {item.badge}
                  </span>
                </div>
                <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {item.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  <Clock size={12} />
                  {new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
