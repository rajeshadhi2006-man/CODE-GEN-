import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Employee } from '../../types/database';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Briefcase, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound,
  Users
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { signIn, signUp, resetPassword, authError, emailConfirmationRequired, setSimulatedEmployee } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up state
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState<'Americas' | 'EMEA' | 'APAC' | 'LATAM' | 'South Asia'>('Americas');
  const [location, setLocation] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Available employees in Supabase for Quick Connect
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    // Check if there are any existing employee records in Supabase to assist user selection
    const fetchExistingEmployees = async () => {
      try {
        const { data, error } = await supabase.from('employees').select('*').limit(20);
        if (!error && data) {
          setAvailableEmployees(data as Employee[]);
        }
      } catch (e) {
        console.log('No existing employees found:', e);
      }
    };
    fetchExistingEmployees();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFeedback({ type: 'error', message: 'Please enter both email and password.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    const res = await signIn(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Authentication failed.' });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !title) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    const res = await signUp({
      email,
      password,
      name,
      title,
      region,
      location: location || 'Remote HQ'
    });
    setIsSubmitting(false);

    if (res.confirmationSent) {
      setFeedback({
        type: 'info',
        message: 'Confirmation email sent! Please check your inbox to confirm your email before signing in.'
      });
    } else if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Sign up failed.' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setFeedback({ type: 'error', message: 'Please enter your account email address.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    const res = await resetPassword(email);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Password reset link sent to your email.' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to send reset link.' });
    }
  };

  const handleQuickEmployeeSelect = (emp: Employee) => {
    setSimulatedEmployee(emp);
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at 50% 10%, rgba(99, 102, 241, 0.18) 0%, #080c14 70%)'
      }}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem 2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow Accent Top */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: '25%',
            right: '25%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #6366f1, transparent)'
          }}
        />

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
            }}
          >
            <ShieldCheck size={26} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            NEXUS WORKFORCE
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Production Real-Time User Portal
          </p>
        </div>

        {/* Mode Navigation */}
        <div 
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '1.75rem',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('signin'); setFeedback(null); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'signin' ? 'var(--color-indigo)' : 'transparent',
              color: mode === 'signin' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setFeedback(null); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'signup' ? 'var(--color-indigo)' : 'transparent',
              color: mode === 'signup' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Messages */}
        {(feedback || authError || emailConfirmationRequired) && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.8125rem',
              background: (feedback?.type === 'success') 
                ? 'rgba(16, 185, 129, 0.12)' 
                : (feedback?.type === 'info' || emailConfirmationRequired) 
                ? 'rgba(99, 102, 241, 0.15)' 
                : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${
                (feedback?.type === 'success') 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : (feedback?.type === 'info' || emailConfirmationRequired) 
                  ? 'rgba(99, 102, 241, 0.3)' 
                  : 'rgba(244, 63, 94, 0.3)'
              }`,
              color: (feedback?.type === 'success') 
                ? '#34d399' 
                : (feedback?.type === 'info' || emailConfirmationRequired) 
                ? '#a5b4fc' 
                : '#fb7185'
            }}
          >
            {feedback?.type === 'success' ? (
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              {feedback?.message || authError || (emailConfirmationRequired && 'Email confirmation required. Please check your inbox.')}
            </div>
          </div>
        )}

        {/* Form: SIGN IN */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Corporate Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="employee@nexusworkforce.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-indigo)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              {isSubmitting ? 'Authenticating with Supabase...' : 'Sign In to Workspace'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Form: SIGN UP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Elena Rostova"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Job Title
              </label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Senior DevOps Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Region
                </label>
                <div style={{ position: 'relative' }}>
                  <Globe size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <select
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    value={region}
                    onChange={(e) => setRegion(e.target.value as any)}
                  >
                    <option value="Americas">Americas</option>
                    <option value="EMEA">EMEA</option>
                    <option value="APAC">APAC</option>
                    <option value="LATAM">LATAM</option>
                    <option value="South Asia">South Asia</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Location / HQ
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="New York, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Corporate Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="elena.r@nexusworkforce.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Password (min 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              {isSubmitting ? 'Registering with Supabase...' : 'Complete Profile & Register'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Form: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Enter the corporate email address linked to your account. Supabase Auth will send a secure password reset link.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Corporate Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="employee@nexusworkforce.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              <KeyRound size={16} />
              {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMode('signin')}
              style={{ width: '100%' }}
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* Quick Connect Section if employees exist in Supabase */}
        {availableEmployees.length > 0 && mode === 'signin' && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Users size={14} className="text-indigo-400" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Supabase Employees ({availableEmployees.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
              {availableEmployees.map((emp: Employee) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleQuickEmployeeSelect(emp)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{emp.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.title} • {emp.region}</div>
                  </div>
                  <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>
                    Connect
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Security & RLS notice */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            🔒 Secured by Supabase Row-Level Security & Postgres Realtime
          </p>
        </div>
      </div>
    </div>
  );
};
