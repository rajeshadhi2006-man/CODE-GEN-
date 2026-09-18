import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserStoreProvider } from './context/UserStoreContext';
import { AuthModal } from './components/auth/AuthModal';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { ShieldCheck } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, employeeProfile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)'
        }}
      >
        <div 
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            animation: 'pulse-dot 2s infinite ease-in-out'
          }}
        >
          <ShieldCheck size={28} color="#fff" />
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Connecting to Supabase...
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Verifying session credentials and Realtime channels
        </p>
      </div>
    );
  }

  // If not authenticated and no employee profile selected, show Auth view
  if (!user && !employeeProfile) {
    return <AuthModal />;
  }

  return (
    <UserStoreProvider>
      <UserDashboard />
    </UserStoreProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
