import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    <div
      style={{
        background: 'rgba(244, 63, 94, 0.12)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        margin: '1rem 0'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertTriangle size={20} className="text-rose-400" style={{ color: '#fb7185', flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fecdd3' }}>Supabase Connection Notice</h4>
          <p style={{ fontSize: '0.8125rem', color: '#fda4af' }}>{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          className="btn-secondary"
          onClick={onRetry}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem', borderColor: 'rgba(244, 63, 94, 0.4)' }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
};
