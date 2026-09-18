import React from 'react';

export const MetricSkeleton: React.FC = () => (
  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="skeleton" style={{ width: '100px', height: '14px' }}></div>
      <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%' }}></div>
    </div>
    <div className="skeleton" style={{ width: '60px', height: '32px' }}></div>
    <div className="skeleton" style={{ width: '140px', height: '12px' }}></div>
  </div>
);

export const TaskSkeleton: React.FC = () => (
  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div className="skeleton" style={{ width: '80px', height: '18px' }}></div>
      <div className="skeleton" style={{ width: '60px', height: '18px', borderRadius: '999px' }}></div>
    </div>
    <div className="skeleton" style={{ width: '75%', height: '22px' }}></div>
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div className="skeleton" style={{ width: '120px', height: '14px' }}></div>
      <div className="skeleton" style={{ width: '100px', height: '14px' }}></div>
    </div>
  </div>
);
