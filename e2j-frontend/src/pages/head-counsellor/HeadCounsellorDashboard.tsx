import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle, XCircle, Clock, User, BookOpen, Briefcase, Award, Zap } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface CounsellorRecord {
  id: number;
  user: { id: number; name: string; email: string };
  phone: string; city: string; state: string;
  area: string; pincode: string; country: string;
  houseNumber: string; flatNumber: string; landmark: string;
  experienceCategory: string; experienceYears: number; experienceMonths: number;
  skills: string[];
  languages: string[];
  linkedinUrl: string; githubUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  onboardingCompleted: boolean;
  pendingProfileUpdate: boolean;
  pendingData?: string;
}

interface EduRow { id: number; degree: string; schoolName: string; major: string; yearOfPassing: string; percentageValue: number }
interface WorkRow { id: number; companyName: string; employmentType: string; location: string; locationType: string; fromDate: string; toDate: string; currentlyWorking: boolean }
interface CertRow { id: number; certificateId: string; certificateName: string; awardingInstitute: string; validTill: string }

interface ProfileData {
  counsellor: CounsellorRecord;
  education: EduRow[];
  workExperience: WorkRow[];
  certifications: CertRow[];
}

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:  { bg: '#FEF9C3', color: '#CA8A04', label: 'Pending' },
  APPROVED: { bg: '#F0FDF4', color: '#16A34A', label: 'Approved' },
  REJECTED: { bg: '#FEF2F2', color: '#DC2626', label: 'Rejected' },
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ flex: '1 1 180px' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>{value ?? '—'}</div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} color="#4F46E5" />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  phone: 'Phone', houseNumber: 'House / Building', flatNumber: 'Flat / Floor',
  country: 'Country', pincode: 'Pincode', state: 'State', city: 'City',
  area: 'Area', landmark: 'Landmark', linkedinUrl: 'LinkedIn URL', githubUrl: 'GitHub URL',
  experienceCategory: 'Experience Category', experienceYears: 'Experience Years',
  experienceMonths: 'Experience Months', skills: 'Skills', languages: 'Languages',
};

function PendingChanges({ counsellor }: { counsellor: CounsellorRecord }) {
  if (!counsellor.pendingData) return null;
  let pending: Record<string, unknown> = {};
  try { pending = JSON.parse(counsellor.pendingData); } catch { return null; }

  const getOldVal = (key: string): string => {
    const v = (counsellor as unknown as Record<string, unknown>)[key];
    if (Array.isArray(v)) return v.join(', ') || '—';
    return v != null && v !== '' ? String(v) : '—';
  };
  const getNewVal = (v: unknown): string => {
    if (Array.isArray(v)) return v.join(', ') || '—';
    return v != null && v !== '' ? String(v) : '—';
  };

  const changes = Object.entries(pending).filter(([key]) => FIELD_LABELS[key]);
  if (changes.length === 0) return null;

  return (
    <div style={{ margin: '0 0 20px', border: '2px solid #C4B5FD', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ background: '#7C3AED', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>⏳</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Pending Changes — awaiting your approval</span>
      </div>
      <div style={{ background: '#FAF5FF', padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0', fontSize: '11px', fontWeight: 700, color: '#7C3AED', padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span>Field</span><span>Current Value</span><span>Proposed Value</span>
        </div>
        {changes.map(([key, newVal]) => {
          const oldStr = getOldVal(key);
          const newStr = getNewVal(newVal);
          const changed = oldStr !== newStr;
          return (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0', padding: '8px', borderRadius: '6px', background: changed ? '#fff' : 'transparent', marginBottom: '4px', border: changed ? '1px solid #E9D5FF' : 'none' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>{FIELD_LABELS[key]}</span>
              <span style={{ fontSize: '12px', color: changed ? '#DC2626' : '#64748B', textDecoration: changed ? 'line-through' : 'none', padding: '0 8px' }}>{oldStr}</span>
              <span style={{ fontSize: '12px', color: changed ? '#16A34A' : '#64748B', fontWeight: changed ? 700 : 400, padding: '0 8px' }}>{newStr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileModal({ data, loading, onClose, onApprove, onApproveUpdate, onReject, actionId }: {
  data: ProfileData | null; loading: boolean;
  onClose: () => void; onApprove: (id: number) => void; onApproveUpdate: (id: number) => void; onReject: (c: CounsellorRecord) => void;
  actionId: number | null;
}) {
  const c = data?.counsellor;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 64px rgba(0,0,0,0.2)' }}>
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>Counsellor Profile</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#94A3B8', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        {/* Modal body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
          {loading && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Loading profile…</div>
          )}

          {!loading && c && (
            <>
              {/* Hero */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: '12px', padding: '20px 24px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {c.user?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{c.user?.name}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{c.user?.email}</div>
                </div>
                <span style={{ background: STATUS_COLOR[c.status]?.bg, color: STATUS_COLOR[c.status]?.color, borderRadius: '20px', padding: '4px 14px', fontSize: '12px', fontWeight: 700 }}>
                  {STATUS_COLOR[c.status]?.label}
                </span>
              </div>

              {/* Pending Changes diff */}
              {c.pendingProfileUpdate && <PendingChanges counsellor={c} />}

              {/* Personal Details */}
              <Section icon={User} title="Personal Details">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 24px' }}>
                  <Field label="Phone" value={c.phone} />
                  <Field label="City" value={c.city} />
                  <Field label="State" value={c.state} />
                  <Field label="Area" value={c.area} />
                  <Field label="Pincode" value={c.pincode} />
                  <Field label="Country" value={c.country} />
                  <Field label="House / Building" value={c.houseNumber} />
                  <Field label="Flat / Floor" value={c.flatNumber} />
                  <Field label="Landmark" value={c.landmark} />
                </div>
              </Section>

              {/* Experience */}
              <Section icon={Briefcase} title="Experience">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 24px' }}>
                  <Field label="Category" value={c.experienceCategory} />
                  <Field label="Years" value={c.experienceYears != null ? `${c.experienceYears}y ${c.experienceMonths ?? 0}m` : undefined} />
                </div>
              </Section>

              {/* Skills */}
              {(c.skills ?? []).length > 0 && (
                <Section icon={Zap} title="Skills">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {c.skills.map(s => (
                      <span key={s} style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: '#4F46E5', fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Education */}
              <Section icon={BookOpen} title="Education Qualification">
                {(!data?.education || data.education.length === 0) ? (
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>No education records added.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          {['Degree', 'School / University', 'Major', 'Year', 'Score'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748B', fontWeight: 600, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.education.map((e, i) => (
                          <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>{e.degree}</td>
                            <td style={{ padding: '10px 12px', color: '#475569' }}>{e.schoolName}</td>
                            <td style={{ padding: '10px 12px', color: '#475569' }}>{e.major}</td>
                            <td style={{ padding: '10px 12px', color: '#1E293B' }}>{e.yearOfPassing}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>{e.percentageValue ?? '—'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              {/* Work Experience */}
              <Section icon={Briefcase} title="Work Experience">
                {(!data?.workExperience || data.workExperience.length === 0) ? (
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>{c.experienceCategory === 'Fresher' ? 'Fresher — no work experience.' : 'No work experience records added.'}</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          {['Company', 'Type', 'Location', 'Mode', 'From', 'To'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748B', fontWeight: 600, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.workExperience.map((w, i) => (
                          <tr key={w.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>{w.companyName}</td>
                            <td style={{ padding: '10px 12px', color: '#475569' }}>{w.employmentType}</td>
                            <td style={{ padding: '10px 12px', color: '#475569' }}>{w.location}</td>
                            <td style={{ padding: '10px 12px', color: '#475569' }}>{w.locationType}</td>
                            <td style={{ padding: '10px 12px', color: '#1E293B' }}>{w.fromDate}</td>
                            <td style={{ padding: '10px 12px' }}>
                              {w.currentlyWorking
                                ? <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>Present</span>
                                : <span style={{ color: '#1E293B' }}>{w.toDate ?? '—'}</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              {/* Certifications */}
              <Section icon={Award} title="Certifications">
                {(!data?.certifications || data.certifications.length === 0) ? (
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>No certifications added.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          {['Certificate ID', 'Certificate Name', 'Awarding Institute', 'Valid Till'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748B', fontWeight: 600, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.certifications.map((cert, i) => (
                          <tr key={cert.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                            <td style={{ padding: '10px 12px', fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>{cert.certificateId}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>{cert.certificateName}</td>
                            <td style={{ padding: '10px 12px', color: '#475569' }}>{cert.awardingInstitute}</td>
                            <td style={{ padding: '10px 12px', color: '#64748B' }}>{cert.validTill}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            </>
          )}
        </div>

        {/* Footer actions */}
        {!loading && c && (
          <>
            {c.pendingProfileUpdate && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 24px', borderTop: '2px solid #C4B5FD', flexShrink: 0, background: '#FAF5FF' }}>
                <button onClick={onClose} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', color: '#64748B', padding: '9px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Close
                </button>
                <button onClick={() => onApproveUpdate(c.id)} disabled={actionId === c.id}
                  style={{ border: 'none', borderRadius: '20px', background: '#7C3AED', color: '#fff', padding: '9px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: actionId === c.id ? 0.6 : 1 }}>
                  {actionId === c.id ? 'Approving…' : 'Approve Update'}
                </button>
              </div>
            )}
            {c.status === 'PENDING' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
                <button onClick={() => onReject(c)} style={{ border: '1px solid #FECACA', borderRadius: '20px', background: '#FEF2F2', color: '#DC2626', padding: '9px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Reject
                </button>
                <button onClick={() => onApprove(c.id)} disabled={actionId === c.id} style={{ border: 'none', borderRadius: '20px', background: '#16A34A', color: '#fff', padding: '9px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: actionId === c.id ? 0.6 : 1 }}>
                  {actionId === c.id ? 'Approving…' : 'Approve'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function HeadCounsellorDashboard() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'pending' | 'approved' | 'updates'>('pending');
  const [pending, setPending] = useState<CounsellorRecord[]>([]);
  const [approved, setApproved] = useState<CounsellorRecord[]>([]);
  const [profileUpdates, setProfileUpdates] = useState<CounsellorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<CounsellorRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, uRes] = await Promise.all([
        api.get('/head-counsellor/pending'),
        api.get('/head-counsellor/all'),
        api.get('/head-counsellor/profile-updates'),
      ]);
      setPending(pRes.data.data ?? []);
      setApproved(aRes.data.data ?? []);
      setProfileUpdates(uRes.data.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openProfile = async (c: CounsellorRecord) => {
    setProfileLoading(true);
    setProfileData(null);
    try {
      const res = await api.get(`/head-counsellor/${c.id}/profile`);
      setProfileData(res.data.data);
    } catch {
      setProfileData({ counsellor: c, education: [], workExperience: [], certifications: [] });
    }
    setProfileLoading(false);
  };

  const closeProfile = () => { setProfileData(null); setProfileLoading(false); };

  const approve = async (id: number) => {
    setActionId(id);
    await api.put(`/head-counsellor/${id}/approve`).catch(() => {});
    setActionId(null);
    closeProfile();
    await load();
  };

  const approveUpdate = async (id: number) => {
    setActionId(id);
    try {
      await api.put(`/head-counsellor/${id}/approve-profile-update`);
    } catch (e: any) {
      alert('Failed to approve update: ' + (e?.response?.data?.message ?? e?.message ?? 'Unknown error'));
    }
    setActionId(null);
    closeProfile();
    await load();
  };

  const openReject = (c: CounsellorRecord) => {
    setRejectTarget(c);
    setRejectReason('');
    setRejectError('');
    closeProfile();
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) { setRejectError('Please provide a reason for rejection.'); return; }
    if (!rejectTarget) return;
    setActionId(rejectTarget.id);
    await api.put(`/head-counsellor/${rejectTarget.id}/reject`, { reason: rejectReason }).catch(() => {});
    setActionId(null);
    setRejectTarget(null);
    await load();
  };

  const list = tab === 'pending' ? pending : tab === 'updates' ? profileUpdates : approved;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo-full.png.png" alt="HubbleHox" style={{ height: '32px', objectFit: 'contain' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4F46E5', borderLeft: '1px solid #E2E8F0', paddingLeft: '12px' }}>Head of Counsellors</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{user?.name}</span>
          <button onClick={() => { clearAuth(); navigate('/login/counsellor'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '7px 16px', fontSize: '13px', color: '#64748B', cursor: 'pointer' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      <div style={{ flex: 1, padding: '28px 32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Pending Approval', value: pending.length, icon: Clock, color: '#CA8A04', bg: '#FEF9C3' },
            { label: 'Profile Updates', value: profileUpdates.length, icon: User, color: '#7C3AED', bg: '#F3E8FF' },
            { label: 'Approved', value: approved.length, icon: CheckCircle, color: '#16A34A', bg: '#F0FDF4' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={22} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B' }}>{s.value}</div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginBottom: '20px' }}>
          {([
            ['pending', `Pending Approval (${pending.length})`],
            ['updates', `Profile Updates${profileUpdates.length > 0 ? ` (${profileUpdates.length})` : ''}`],
            ['approved', `Approved Counsellors (${approved.length})`],
          ] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: tab === t ? '#4F46E5' : '#64748B', borderBottom: tab === t ? '2px solid #4F46E5' : '2px solid transparent', marginBottom: '-2px', position: 'relative' }}>
              {label}
              {t === 'updates' && profileUpdates.length > 0 && (
                <span style={{ position: 'absolute', top: '6px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#7C3AED' }} />
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Loading…</div>
          ) : list.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
              {tab === 'pending' ? 'No counsellors pending approval.' : 'No approved counsellors yet.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Name', 'Email', 'City', 'Experience', 'Skills', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(c => {
                  const st = STATUS_COLOR[c.status] ?? STATUS_COLOR.PENDING;
                  const exp = c.experienceYears != null ? `${c.experienceYears}y ${c.experienceMonths ?? 0}m` : '—';
                  return (
                    <tr key={c.id} onClick={() => openProfile(c)} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={15} color="#4F46E5" />
                          </div>
                          <span style={{ fontWeight: 600, color: '#4F46E5', fontSize: '13px' }}>{c.user?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#64748B' }}>{c.user?.email ?? '—'}</td>
                      <td style={{ padding: '13px 16px', color: '#374151' }}>{c.city ? `${c.city}, ${c.state}` : '—'}</td>
                      <td style={{ padding: '13px 16px', color: '#374151' }}>{exp}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(c.skills ?? []).slice(0, 2).map(s => (
                            <span key={s} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '2px 7px', fontSize: '11px', color: '#374151' }}>{s}</span>
                          ))}
                          {(c.skills ?? []).length > 2 && <span style={{ fontSize: '11px', color: '#94A3B8' }}>+{c.skills.length - 2}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ background: st.bg, color: st.color, borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 600 }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '13px 16px' }} onClick={e => e.stopPropagation()}>
                        {tab === 'updates' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openProfile(c)} style={{ background: 'none', border: '1px solid #C4B5FD', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', color: '#7C3AED', cursor: 'pointer', fontWeight: 500 }}>
                              Review
                            </button>
                            <button onClick={() => approveUpdate(c.id)} disabled={actionId === c.id}
                              style={{ border: 'none', borderRadius: '20px', background: '#7C3AED', color: '#fff', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: actionId === c.id ? 0.6 : 1 }}>
                              {actionId === c.id ? '…' : 'Approve'}
                            </button>
                          </div>
                        ) : c.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => approve(c.id)} disabled={actionId === c.id}
                              style={{ border: 'none', borderRadius: '20px', background: '#16A34A', color: '#fff', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: actionId === c.id ? 0.6 : 1 }}>
                              Approve
                            </button>
                            <button onClick={() => openReject(c)}
                              style={{ border: '1px solid #FECACA', borderRadius: '20px', background: '#FEF2F2', color: '#DC2626', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => openProfile(c)} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', color: '#4F46E5', cursor: 'pointer', fontWeight: 500 }}>
                            View Profile
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {(profileLoading || profileData) && (
        <ProfileModal
          data={profileData}
          loading={profileLoading}
          onClose={closeProfile}
          onApprove={approve}
          onApproveUpdate={approveUpdate}
          onReject={openReject}
          actionId={actionId}
        />
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '480px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Reject Profile</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748B' }}>
              Provide a reason for rejecting <strong>{rejectTarget.user?.name}</strong>'s profile. This will be shared with the counsellor so they can make corrections and resubmit.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => { setRejectReason(e.target.value); setRejectError(''); }}
              placeholder="e.g. Incomplete work experience details. Please add company name and employment dates for all positions."
              rows={5}
              style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${rejectError ? '#EF4444' : '#CBD5E1'}`, borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#1E293B', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
            {rejectError && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{rejectError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setRejectTarget(null)} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={submitReject} disabled={actionId === rejectTarget.id}
                style={{ padding: '10px 24px', border: 'none', borderRadius: '24px', background: '#DC2626', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: actionId === rejectTarget.id ? 0.6 : 1 }}>
                {actionId === rejectTarget.id ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
