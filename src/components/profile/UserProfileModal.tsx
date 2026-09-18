import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { EmployeeStatus } from '../../types/database';
import { 
  X, 
  User as UserIcon, 
  Clock, 
  Award, 
  Zap, 
  Save, 
  CheckCircle2,
  Globe,
  Sparkles,
  Briefcase
} from 'lucide-react';
import { SkillAnalyzerModal } from '../portfolio/SkillAnalyzerModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { employeeProfile, updateEmployeeProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [locationInput, setLocationInput] = useState(employeeProfile?.location || '');
  const [statusInput, setStatusInput] = useState<EmployeeStatus>(employeeProfile?.status || 'Available');
  const [shiftStartInput, setShiftStartInput] = useState(employeeProfile?.shift?.start || '09:00');
  const [shiftEndInput, setShiftEndInput] = useState(employeeProfile?.shift?.end || '18:00');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const res = await updateEmployeeProfile({
      location: locationInput,
      status: statusInput,
      shift: {
        start: shiftStartInput,
        end: shiftEndInput
      }
    });

    setIsSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setIsEditing(false);
    }
  };

  const skills = employeeProfile?.skills || [];
  const certs = employeeProfile?.certifications || [];
  const performance = employeeProfile?.performance;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        zIndex: 70
      }}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
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

        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            {employeeProfile?.name ? employeeProfile.name.charAt(0) : <UserIcon size={32} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {employeeProfile?.name || 'Authenticated Employee'}
              </h2>
              <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>
                ID: {employeeProfile?.id || '—'}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {employeeProfile?.title || 'Workforce Specialist'} • {employeeProfile?.email}
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div 
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#34d399',
              fontSize: '0.8125rem',
              marginBottom: '1.5rem'
            }}
          >
            <CheckCircle2 size={16} /> Changes saved to Supabase successfully.
          </div>
        )}

        {/* View / Edit / AI Telemetry Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsAnalyzerOpen(true)}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
          >
            <Sparkles size={14} /> AI Portfolio Analyzer (Resume / GitHub / CVE / Certs)
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsEditing(!isEditing)}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile Settings'}
          </button>
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Availability Status
                </label>
                <select
                  className="input-field"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as any)}
                >
                  <option value="Available">Available</option>
                  <option value="OnLeave">OnLeave</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Location / Office
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. London, UK"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Shift Start Time
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={shiftStartInput}
                  onChange={(e) => setShiftStartInput(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Shift End Time
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={shiftEndInput}
                  onChange={(e) => setShiftEndInput(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving}
              style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}
            >
              <Save size={16} />
              {isSaving ? 'Updating Supabase...' : 'Save Profile Changes'}
            </button>
          </form>
        ) : null}

        {/* Profile Attributes Grid */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}
        >
          <div className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
              <Globe size={14} /> Region & Location
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              {employeeProfile?.region || 'Global'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {employeeProfile?.location || 'Remote'}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
              <Clock size={14} /> Shift & Timezone
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              {employeeProfile?.shift?.start || '09:00'} - {employeeProfile?.shift?.end || '18:00'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {employeeProfile?.timezone || 'UTC+0'}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
              <Zap size={14} /> Capacity & Utilization
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              {employeeProfile?.capacity_hours || 40} hrs/week
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {employeeProfile?.utilization_pct || 0}% recorded in DB
            </div>
          </div>
        </div>

        {/* Performance Metrics if present in Supabase */}
        {performance && (
          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quality & Delivery Telemetry
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="glass-card" style={{ textAlign: 'center', padding: '0.875rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                  {performance.quality || 0}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quality Rating</div>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', padding: '0.875rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6366f1' }}>
                  {performance.on_time || 0}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On-Time SLA</div>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', padding: '0.875rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#06b6d4' }}>
                  {performance.tasks_completed_30d || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasks (30d)</div>
              </div>
            </div>
          </div>
        )}

        {/* Skills & Proficiencies */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Registered Skills & Proficiencies
          </h4>
          {skills.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No skills registered in Supabase yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {skills.map((skill, idx) => (
                <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{skill.skill_id}</span>
                    <span style={{ color: 'var(--color-indigo)', fontWeight: 600 }}>{skill.proficiency_pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${skill.proficiency_pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Extracted Past Works & Historical Projects */}
        {performance?.past_works && performance.past_works.length > 0 && (
          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={15} className="text-cyan-400" /> Extracted Past Works & Projects ({performance.past_works.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
              {performance.past_works.map((work) => (
                <div 
                  key={work.id}
                  className="glass-card"
                  style={{
                    padding: '0.875rem 1rem',
                    borderLeft: `3px solid ${work.source === 'CVE' ? '#fb7185' : work.source === 'GitHub' ? '#06b6d4' : '#6366f1'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {work.title}
                    </span>
                    <span className="badge badge-medium" style={{ fontSize: '0.625rem' }}>
                      {work.source || 'Verified'} • {work.period}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {work.organization} — {work.description}
                  </div>
                  {work.impact && (
                    <div style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 500, marginTop: '0.2rem' }}>
                      {work.impact}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                    {work.technologies.map((t, idx) => (
                      <span key={idx} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Certifications
          </h4>
          {certs.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No certifications on record.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {certs.map((c, i) => (
                <span key={i} className="badge badge-medium" style={{ textTransform: 'none' }}>
                  <Award size={13} /> {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Skill & Portfolio Analyzer Modal */}
      <SkillAnalyzerModal
        isOpen={isAnalyzerOpen}
        onClose={() => setIsAnalyzerOpen(false)}
      />
    </div>
  );
};
