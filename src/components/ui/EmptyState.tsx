import React from 'react';
import { Database, FolderOpen, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: 'database' | 'folder' | 'inbox';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data available yet.',
  message = 'The connected Supabase database currently has no records matching your user profile.',
  icon = 'database',
  action
}) => {
  const renderIcon = () => {
    switch (icon) {
      case 'folder':
        return <FolderOpen size={42} className="text-indigo-400/60" />;
      case 'inbox':
        return <Inbox size={42} className="text-indigo-400/60" />;
      case 'database':
      default:
        return <Database size={42} className="text-indigo-400/60" />;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', margin: '1.5rem 0' }}>
      <div 
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}
      >
        {renderIcon()}
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto', fontSize: '0.875rem', lineHeight: '1.5' }}>
        {message}
      </p>
      {action && (
        <div style={{ marginTop: '1.5rem' }}>
          <button className="btn-secondary" onClick={action.onClick}>
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};
