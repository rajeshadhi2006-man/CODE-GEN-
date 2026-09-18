import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Briefcase, Globe, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { SkillAnalyzerModal } from '../portfolio/SkillAnalyzerModal';

export const ProfileOnboardingModal: React.FC = () => {
  const { user, employeeProfile, isProfileLoading, createInitialProfile } = useAuth();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState<'Americas' | 'EMEA' | 'APAC' | 'LATAM' | 'South Asia'>('Americas');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);

  // If user is not authenticated or profile already loaded, don't show
  if (!user || employeeProfile || isProfileLoading) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title) {
      setError('Please provide your full name and job title.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createInitialProfile({
      email: user.email || '',
      password: '',
      name,
      title,
      region,
      location: location || 'Remote HQ'
    });

    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Failed to initialize employee profile.');
    }
  };

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 90
        }}
      >
        <div 
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '500px',
            padding: '2.5rem 2rem'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}
            >
              <ShieldCheck size={24} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Setup Your Employee Profile
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Your account ({user.email}) is authenticated. Complete your profile to link with Supabase.
            </p>
          </div>

          {/* Quick AI Ingestion CTA */}
          <div 
            style={{
              marginBottom: '1.25rem',
              padding: '0.875rem',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px dashed rgba(99, 102, 241, 0.35)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '0.4rem' }}>
              ⚡ Have a Resume, GitHub, CVE, or Certs?
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAnalyzerOpen(true)}
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.85rem',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                color: '#ffffff'
              }}
            >
              <Sparkles size={14} className="text-cyan-400" />
              Launch Real-Time Portfolio Analyzer
            </button>
          </div>

        {error && (
          <div 
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              color: '#fb7185',
              fontSize: '0.8125rem',
              marginBottom: '1rem'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Marcus Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Job Title / Discipline
            </label>
            <div style={{ position: 'relative' }}>
              <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Site Reliability Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
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
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Office / Location
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Singapore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isSubmitting ? 'Saving Profile in Supabase...' : 'Save & Enter Workspace'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>

    {/* Real-time Skill & Portfolio Analyzer Modal */}
    <SkillAnalyzerModal
      isOpen={isAnalyzerOpen}
      onClose={() => setIsAnalyzerOpen(false)}
      onSuccess={() => setIsAnalyzerOpen(false)}
    />
  </>
  );
};
