import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUserStore } from '../../context/UserStoreContext';
import { Navbar } from '../layout/Navbar';
import { MetricOverview } from './MetricOverview';
import { UserTasksList } from '../tasks/UserTasksList';
import { UserProfileModal } from '../profile/UserProfileModal';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { ProfileOnboardingModal } from '../profile/ProfileOnboardingModal';
import { SkillAnalyzerModal } from '../portfolio/SkillAnalyzerModal';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Sparkles } from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { employeeProfile } = useAuth();
  const { error, refreshData, recommendations, auditLogs } = useUserStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSkillAnalyzerOpen, setIsSkillAnalyzerOpen] = useState(false);

  const notificationCount = recommendations.length + auditLogs.length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <Navbar
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSkillAnalyzer={() => setIsSkillAnalyzerOpen(true)}
        notificationCount={notificationCount}
      />

      {/* Main Container */}
      <main 
        style={{
          flex: 1,
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem'
        }}
      >
        {/* Welcome Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                Welcome back, {employeeProfile?.name || 'Team Member'}
              </h1>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Connected to Supabase. Monitoring assigned work streams, remaining effort, and live SLA deadlines.
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={() => setIsSkillAnalyzerOpen(true)}
            style={{ padding: '0.55rem 1.15rem', fontSize: '0.8125rem' }}
          >
            <Sparkles size={16} />
            AI Skill & Past Works Analyzer
          </button>
        </div>

        {/* Error Banner if Supabase query failed */}
        {error && (
          <ErrorBanner message={error} onRetry={refreshData} />
        )}

        {/* Metrics Grid (Calculated strictly from live Supabase tasks) */}
        <MetricOverview />

        {/* Assigned Tasks Feed */}
        <UserTasksList />
      </main>

      {/* Footer */}
      <footer 
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.5rem 2rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}
      >
        NEXUS WORKFORCE OS • Autonomous Workforce Intelligence & Real-Time Sync • Single Source of Truth: Supabase
      </footer>

      {/* Modals & Drawers */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <ProfileOnboardingModal />

      <SkillAnalyzerModal
        isOpen={isSkillAnalyzerOpen}
        onClose={() => setIsSkillAnalyzerOpen(false)}
      />
    </div>
  );
};
