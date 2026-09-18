import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUserStore } from '../../context/UserStoreContext';
import type { EmployeeStatus } from '../../types/database';
import { 
  ShieldCheck, 
  Bell, 
  LogOut, 
  User as UserIcon, 
  CheckCircle2, 
  Coffee, 
  Clock, 
  ChevronDown,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onOpenSkillAnalyzer?: () => void;
  notificationCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenProfile,
  onOpenNotifications,
  onOpenSkillAnalyzer,
  notificationCount
}) => {
  const { employeeProfile, signOut, updateEmployeeProfile } = useAuth();
  const { isRealtimeConnected, refreshData, isLoading } = useUserStore();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const currentStatus: EmployeeStatus = employeeProfile?.status || 'Available';

  const handleStatusChange = async (newStatus: EmployeeStatus) => {
    setIsStatusMenuOpen(false);
    setIsUpdatingStatus(true);
    await updateEmployeeProfile({ status: newStatus });
    setIsUpdatingStatus(false);
  };

  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case 'Available':
        return '#10b981';
      case 'OnLeave':
        return '#f59e0b';
      case 'Unavailable':
      default:
        return '#f43f5e';
    }
  };

  return (
    <header 
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(8, 12, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.875rem 2rem'
      }}
    >
      <div 
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem'
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
          >
            <ShieldCheck size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
                NEXUS
              </span>
              <span 
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}
              >
                Employee Space
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Workforce Intelligence & Task Terminal
            </div>
          </div>
        </div>

        {/* Real-Time Status & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Live Realtime Indicator */}
          <div 
            onClick={() => refreshData()}
            title={isRealtimeConnected ? 'Supabase Realtime WebSocket Active. Click to force instant sync.' : 'Connecting to Supabase Realtime channel. Click to retry sync.'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              background: isRealtimeConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isRealtimeConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              fontSize: '0.75rem',
              fontWeight: 500,
              color: isRealtimeConnected ? '#34d399' : '#fbbf24',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <span 
              className={isRealtimeConnected ? 'live-pulse' : ''} 
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isRealtimeConnected ? '#10b981' : '#f59e0b'
              }}
            />
            <span>{isRealtimeConnected ? 'Supabase Realtime Live' : 'Connecting Realtime...'}</span>
          </div>

          {/* Manual Refresh button */}
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
            title="Sync latest state from Supabase"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span style={{ display: 'none', minWidth: '0' }} className="md:inline">Sync</span>
          </button>

          {/* AI Skill & Portfolio Analyzer button */}
          {onOpenSkillAnalyzer && (
            <button
              onClick={onOpenSkillAnalyzer}
              className="btn-secondary"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.75rem',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#c7d2fe'
              }}
              title="Analyze Resume, GitHub, CVE & Certs in Real Time"
            >
              <Sparkles size={14} className="text-cyan-400" />
              <span style={{ display: 'none', minWidth: '0' }} className="md:inline">Analyze Skills</span>
            </button>
          )}

          {/* Status Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
              disabled={isUpdatingStatus}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span 
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getStatusColor(currentStatus)
                }}
              />
              <span>{currentStatus}</span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </button>

            {isStatusMenuOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '180px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--glass-shadow)',
                  padding: '0.5rem',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', padding: '0.25rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Set Live Status
                </div>
                <button
                  onClick={() => handleStatusChange('Available')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: currentStatus === 'Available' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    border: 'none',
                    color: '#34d399',
                    fontSize: '0.8125rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={14} /> Available
                </button>
                <button
                  onClick={() => handleStatusChange('OnLeave')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: currentStatus === 'OnLeave' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    border: 'none',
                    color: '#fbbf24',
                    fontSize: '0.8125rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <Coffee size={14} /> On Leave
                </button>
                <button
                  onClick={() => handleStatusChange('Unavailable')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: currentStatus === 'Unavailable' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
                    border: 'none',
                    color: '#fb7185',
                    fontSize: '0.8125rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <Clock size={14} /> Unavailable
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            style={{
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-primary)'
                }}
              >
                {notificationCount}
              </span>
            )}
          </button>

          {/* User Profile Pill */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingLeft: '0.5rem',
              borderLeft: '1px solid var(--border-subtle)'
            }}
          >
            <button
              onClick={onOpenProfile}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  border: '2px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {employeeProfile?.name ? employeeProfile.name.charAt(0) : <UserIcon size={18} />}
              </div>
              <div style={{ display: 'none', minWidth: '0' }} className="sm:block">
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {employeeProfile?.name || 'Authenticated User'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {employeeProfile?.title || 'Team Member'}
                </div>
              </div>
            </button>

            {/* Logout button */}
            <button
              onClick={() => signOut()}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
