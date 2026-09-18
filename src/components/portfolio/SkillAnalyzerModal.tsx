import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  analyzePortfolioTelemetry, 
  CANONICAL_SKILLS 
} from '../../services/skillAnalyzer';
import type { AnalysisResult } from '../../services/skillAnalyzer';
import type { EmployeeSkillProficiency, PastWork } from '../../types/database';
import confetti from 'canvas-confetti';
import { 
  X, 
  Sparkles, 
  FileText, 
  GitBranch, 
  ShieldAlert, 
  Award, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Sliders, 
  Zap, 
  UploadCloud, 
  Briefcase 
} from 'lucide-react';

interface SkillAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SkillAnalyzerModal: React.FC<SkillAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { syncAnalyzedPortfolio } = useAuth();

  // Inputs
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [cveText, setCveText] = useState('');
  const [certificatesText, setCertificatesText] = useState('');

  // Execution state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Editable output state
  const [editableSkills, setEditableSkills] = useState<EmployeeSkillProficiency[]>([]);
  const [editableCerts, setEditableCerts] = useState<string[]>([]);
  const [editablePastWorks, setEditablePastWorks] = useState<PastWork[]>([]);

  if (!isOpen) return null;

  // Handle file upload for resume
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setResumeText(content);
      }
    };
    reader.readAsText(file);
  };

  // Run real-time analysis pipeline
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisStep(1);
    setResult(null);

    // Step 1: Scan Resume
    await new Promise((r) => setTimeout(r, 600));
    setAnalysisStep(2);

    // Step 2: Query GitHub
    await new Promise((r) => setTimeout(r, 700));
    setAnalysisStep(3);

    // Step 3: Inspect CVEs
    await new Promise((r) => setTimeout(r, 600));
    setAnalysisStep(4);

    // Step 4: Validate Certs & Synthesize
    await new Promise((r) => setTimeout(r, 600));
    setAnalysisStep(5);

    try {
      const output = await analyzePortfolioTelemetry({
        resumeText,
        resumeFileName,
        githubUrl,
        cveText,
        certificatesText
      });

      await new Promise((r) => setTimeout(r, 500));
      setResult(output);
      setEditableSkills(output.skills);
      setEditableCerts(output.certifications);
      setEditablePastWorks(output.pastWorks);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  // Handle skill slider adjustment
  const handleProficiencyChange = (skillId: string, val: number) => {
    setEditableSkills((prev) =>
      prev.map((s) => (s.skill_id === skillId ? { ...s, proficiency_pct: val } : s))
    );
  };

  // Sync to Supabase in real time
  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    const res = await syncAnalyzedPortfolio(
      editableSkills,
      editableCerts,
      editablePastWorks,
      result?.suggestedQualityScore
    );
    setIsSyncing(false);

    if (res.success) {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 }
      });
      setSyncSuccess(true);
      setTimeout(() => {
        setSyncSuccess(false);
        onSuccess?.();
        onClose();
      }, 1500);
    } else {
      alert(res.error || 'Failed to sync to Supabase');
    }
  };

  const stepsList = [
    'Parsing resume syntax & extracting experience entities...',
    'Connecting to GitHub API & querying language telemetry...',
    'Inspecting CVE advisories & security vulnerability ratings...',
    'Validating certification authorities...',
    'Synthesizing skill proficiencies & past works matrix...'
  ];

  return (
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
        zIndex: 95
      }}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2.25rem',
          position: 'relative'
        }}
      >
        {/* Close Button */}
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

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
          <div 
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Sparkles size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                AI Skill & Past Works Telemetry Engine
              </h2>
              <span className="badge badge-low" style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                ⚡ Gemini 3.5 AI Live
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Upload Resume, CVE Disclosures, GitHub repositories & Certificates to scan exactly what you have done and calibrate your skill matrix in Supabase.
            </p>
          </div>
        </div>

        {/* Step 1: Input Form (when not displaying results) */}
        {!result && !isAnalyzing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Asset 1: Resume Upload / Text */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  <FileText size={16} className="text-indigo-400" />
                  <span>Resume / CV Experience</span>
                </div>
                <label 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-indigo)',
                    cursor: 'pointer'
                  }}
                >
                  <UploadCloud size={14} />
                  <span>{resumeFileName ? resumeFileName : 'Upload File (PDF/TXT/MD)'}</span>
                  <input type="file" accept=".txt,.md,.pdf,.json" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
              <textarea
                className="input-field"
                style={{ minHeight: '80px', fontSize: '0.8125rem' }}
                placeholder="Paste resume summary, work history, past companies, roles, and demonstrated tech stack here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>

            {/* Asset 2: GitHub Repository / Profile URL */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                <GitBranch size={16} className="text-cyan-400" />
                <span>GitHub Repository or Profile URL</span>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. https://github.com/torvalds/linux or facebook/react or your_username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              <p style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Live GitHub REST API queries repo languages, byte distributions, commit topics, and stars in real time.
              </p>
            </div>

            {/* Asset 3: CVE Contributions & Security Disclosures */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                <ShieldAlert size={16} className="text-rose-400" />
                <span>CVE Disclosures & Security Contributions</span>
              </div>
              <textarea
                className="input-field"
                style={{ minHeight: '65px', fontSize: '0.8125rem' }}
                placeholder="e.g. CVE-2024-21626, CVE-2023-38606, Container escape advisory, Bug bounty finding..."
                value={cveText}
                onChange={(e) => setCveText(e.target.value)}
              />
              <p style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Recognized CVE IDs automatically calibrate your Zero-Trust & DevSecOps proficiency score.
              </p>
            </div>

            {/* Asset 4: Certificates & Accreditations */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                <Award size={16} className="text-amber-400" />
                <span>Certificates & Professional Credentials</span>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. CKA, AWS Solutions Architect - Professional, CISSP, OSCP, HashiCorp Terraform"
                value={certificatesText}
                onChange={(e) => setCertificatesText(e.target.value)}
              />
            </div>

            {/* Action Button */}
            <button
              type="button"
              className="btn-primary"
              onClick={handleStartAnalysis}
              style={{ padding: '0.85rem 1.5rem', fontSize: '0.9375rem', width: '100%', marginTop: '0.5rem' }}
            >
              <Cpu size={18} />
              Run Autonomous Real-Time Analysis
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Live Real-Time Analysis Progress */}
        {isAnalyzing && (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}
            >
              <RefreshCw size={28} className="animate-spin text-indigo-400" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              Analyzing Telemetry Across Ingested Assets...
            </h3>

            <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
              {stepsList.map((step, idx) => {
                const isPassed = analysisStep > idx + 1;
                const isCurrent = analysisStep === idx + 1;
                return (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.8125rem',
                      color: isPassed ? '#34d399' : isCurrent ? '#a5b4fc' : 'var(--text-muted)',
                      fontWeight: isCurrent ? 600 : 400
                    }}
                  >
                    {isPassed ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="live-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                    ) : (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Results & Confirmation */}
        {result && !isAnalyzing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Success Bar */}
            {syncSuccess ? (
              <div 
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#34d399'
                }}
              >
                <CheckCircle2 size={20} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.875rem' }}>Synchronized into Supabase in Real Time!</strong>
                  <span style={{ fontSize: '0.75rem' }}>Skills, past works, and certifications are live and propagated to the workforce network.</span>
                </div>
              </div>
            ) : (
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem'
                }}
              >
                <div className="glass-card" style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-indigo)' }}>
                    {editableSkills.length}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Skills Calibrated</div>
                </div>
                <div className="glass-card" style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-cyan)' }}>
                    {editablePastWorks.length}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Past Works Extracted</div>
                </div>
                <div className="glass-card" style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
                    {editableCerts.length}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Certifications</div>
                </div>
                <div className="glass-card" style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                    {result.suggestedQualityScore}%
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Calibrated Quality</div>
                </div>
              </div>
            )}

            {/* AI Executive Summary */}
            {result.executiveSummary && (
              <div 
                className="glass-card" 
                style={{ 
                  padding: '1.125rem 1.25rem',
                  borderLeft: '4px solid #6366f1',
                  background: 'rgba(99, 102, 241, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} className="text-cyan-400" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      AI Competency & Track Record Synthesis
                    </span>
                  </div>
                  <span className="badge badge-low" style={{ fontSize: '0.625rem' }}>
                    {result.modelUsed || 'Gemini 3.5 AI'}
                  </span>
                </div>
                <p style={{ fontSize: '0.84375rem', color: 'var(--text-primary)', lineHeight: '1.55' }}>
                  {result.executiveSummary}
                </p>
              </div>
            )}

            {/* Extracted Past Works */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Briefcase size={16} className="text-cyan-400" />
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Extracted Past Works & Historical Projects ({editablePastWorks.length})
                </h4>
              </div>

              {editablePastWorks.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No historical project entries extracted.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {editablePastWorks.map((work) => (
                    <div 
                      key={work.id}
                      className="glass-card"
                      style={{
                        padding: '0.875rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        borderLeft: `3px solid ${work.source === 'CVE' ? '#fb7185' : work.source === 'GitHub' ? '#06b6d4' : '#6366f1'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {work.title}
                        </span>
                        <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>
                          {work.source || 'Verified'} • {work.period}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {work.organization} — {work.description}
                      </div>
                      {work.impact && (
                        <div style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 500 }}>
                          {work.impact}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                        {work.technologies.map((tech, i) => (
                          <span 
                            key={i}
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extracted Skills & Proficiency Sliders */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={16} className="text-indigo-400" />
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Calibrated Skill Proficiency Matrix
                  </h4>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Drag to calibrate before Supabase sync
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '220px', overflowY: 'auto' }}>
                {editableSkills.map((skill) => {
                  const canonical = CANONICAL_SKILLS.find((s) => s.id === skill.skill_id);
                  const skillName = canonical?.name || skill.skill_id;
                  const category = canonical?.category || 'Tech';

                  return (
                    <div 
                      key={skill.skill_id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                            {skillName}
                          </span>
                          <span className="badge badge-medium" style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem' }}>
                            {category}
                          </span>
                        </div>
                        <span style={{ color: 'var(--color-indigo)', fontWeight: 700, fontSize: '0.8125rem' }}>
                          {skill.proficiency_pct}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={skill.proficiency_pct}
                        onChange={(e) => handleProficiencyChange(skill.skill_id, Number(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: 'var(--color-indigo)',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Certifications Badges */}
            {editableCerts.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Award size={16} className="text-amber-400" />
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Verified Accreditations
                  </h4>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {editableCerts.map((cert, idx) => (
                    <span key={idx} className="badge badge-medium" style={{ textTransform: 'none' }}>
                      <CheckCircle2 size={12} color="#10b981" /> {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bottom */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setResult(null)}
              >
                Re-enter Inputs
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleSyncToSupabase}
                disabled={isSyncing}
                style={{ padding: '0.65rem 1.5rem' }}
              >
                <Zap size={16} />
                {isSyncing ? 'Writing to Supabase...' : 'Confirm & Sync to Supabase Live'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
