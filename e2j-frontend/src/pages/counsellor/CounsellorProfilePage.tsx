import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, MapPin, Phone, Mail, Calendar, Award, Briefcase, BookOpen, Zap, User, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';


function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color="#4F46E5" />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 1 200px', minWidth: 0 }}>
      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500, wordBreak: 'break-word' }}>{value || '—'}</span>
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 32px' }}>{children}</div>;
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '16px 0' }} />;
}

interface ProfileData {
  phone?: string; city?: string; state?: string; houseNumber?: string; flatNumber?: string;
  area?: string; landmark?: string; pincode?: string; country?: string;
  experienceYears?: number; experienceMonths?: number; experienceCategory?: string;
  skills?: string[];
}
interface EduRow { id: number; degree: string; schoolName: string; major: string; yearOfPassing: string; percentageValue: number | null }
interface WorkRow { id: number; companyName: string; employmentType: string; location: string; locationType: string; fromDate: string; toDate: string | null; currentlyWorking: boolean }
interface CertRow { id: number; certificateId: string; certificateName: string; awardingInstitute: string; validTill: string }

export default function CounsellorProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData>({});
  const [education, setEducation] = useState<EduRow[]>([]);
  const [work, setWork] = useState<WorkRow[]>([]);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    api.get('/counsellor/onboarding/status').then(r => {
      const { onboardingCompleted, status, rejectionReason: reason } = r.data?.data ?? {};
      if (!onboardingCompleted) { navigate('/counsellor/onboarding', { replace: true }); return; }
      setApprovalStatus(status ?? 'PENDING');
      setRejectionReason(reason ?? '');
      Promise.all([
        api.get('/counsellor/profile').then(r2 => setProfile(r2.data?.data ?? {})).catch(() => {}),
        api.get('/counsellor/education').then(r2 => setEducation(r2.data?.data?.content ?? r2.data?.data ?? [])).catch(() => {}),
        api.get('/counsellor/work-experience').then(r2 => setWork(r2.data?.data?.content ?? r2.data?.data ?? [])).catch(() => {}),
        api.get('/counsellor/certifications').then(r2 => setCerts(r2.data?.data?.content ?? r2.data?.data ?? [])).catch(() => {}),
      ]).finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  const name = (user as any)?.name ?? 'Counsellor';
  const email = (user as any)?.email ?? '';
  const initials = name.split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const skills = profile.skills ?? [];

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
        Loading profile…
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>

      {/* Approval status banner */}
      {approvalStatus === 'PENDING' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
          <Clock size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400E', marginBottom: '2px' }}>Profile Under Review</div>
            <div style={{ fontSize: '13px', color: '#B45309', lineHeight: 1.6 }}>Your profile has been submitted and is being reviewed by the Head of Counsellors. You'll receive full access once approved.</div>
          </div>
        </div>
      )}

      {approvalStatus === 'REJECTED' && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: rejectionReason ? '10px' : '12px' }}>
            <XCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#991B1B' }}>Profile Rejected</div>
          </div>
          {rejectionReason && (
            <div style={{ display: 'flex', gap: '8px', background: '#fff', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
              <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: '#7F1D1D', lineHeight: 1.7 }}>{rejectionReason}</p>
            </div>
          )}
          <button onClick={() => navigate('/counsellor/onboarding')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 20px', background: '#DC2626', border: 'none', borderRadius: '20px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <Pencil size={13} /> Fix &amp; Resubmit Profile
          </button>
        </div>
      )}

      {/* Hero card */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ height: '100px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }} />

        <div style={{ padding: '0 24px 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #fff', marginTop: '-40px', flexShrink: 0, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 2px 12px rgba(79,70,229,0.15)' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#4F46E5' }}>{initials}</span>
            </div>
            <div style={{ paddingBottom: '4px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>{name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748B' }}>
                  <Mail size={12} /> {email}
                </span>
                {profile.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748B' }}>
                    <Phone size={12} /> {profile.phone}
                  </span>
                )}
                {profile.city && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748B' }}>
                    <MapPin size={12} /> {profile.city}{profile.state ? `, ${profile.state}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/counsellor/onboarding')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', border: '1.5px solid #4F46E5', borderRadius: '24px', background: '#fff', color: '#4F46E5', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <Pencil size={13} /> Edit Profile
          </button>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'flex', borderTop: '1px solid #F1F5F9' }}>
          {[
            { label: 'Experience', value: profile.experienceYears != null ? `${profile.experienceYears}y ${profile.experienceMonths ?? 0}m` : '—' },
            { label: 'Education', value: `${education.length} Qualifications` },
            { label: 'Certifications', value: `${certs.length} Certificates` },
            { label: 'Skills', value: `${skills.length} Skills` },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '14px', textAlign: 'center', borderRight: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#4F46E5' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Details */}
      <SectionCard icon={User} title="Personal Details">
        <InfoGrid>
          <InfoRow label="Full Name" value={name} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="Phone" value={profile.phone ?? ''} />
        </InfoGrid>
        <Divider />
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Registered Address</div>
        <InfoGrid>
          <InfoRow label="House / Building" value={profile.houseNumber ?? ''} />
          <InfoRow label="Flat / Floor" value={profile.flatNumber ?? ''} />
          <InfoRow label="Area / Locality" value={profile.area ?? ''} />
          <InfoRow label="Landmark" value={profile.landmark ?? ''} />
          <InfoRow label="City" value={profile.city ?? ''} />
          <InfoRow label="State" value={profile.state ?? ''} />
          <InfoRow label="Pin Code" value={profile.pincode ?? ''} />
          <InfoRow label="Country" value={profile.country ?? ''} />
        </InfoGrid>
      </SectionCard>

      {/* Education */}
      <SectionCard icon={BookOpen} title="Education Qualification">
        {education.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No education records added yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Degree / Qualification', 'School / University', 'Major / Specialization', 'Year', 'Score'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {education.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>{e.degree}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{e.schoolName}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{e.major}</td>
                    <td style={{ padding: '12px 14px', color: '#1E293B' }}>{e.yearOfPassing}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                        {e.percentageValue ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Work Experience */}
      <SectionCard icon={Briefcase} title="Work Experience">
        <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '14px 20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Calendar size={16} color="#16A34A" />
            <div>
              <div style={{ fontSize: '11px', color: '#4ADE80', fontWeight: 500 }}>Total Experience</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#15803D' }}>
                {profile.experienceYears ?? 0}y {profile.experienceMonths ?? 0}m
              </div>
            </div>
          </div>
        </div>

        {work.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No work experience records added yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['#', 'Company', 'Type', 'Location', 'Mode', 'From', 'To'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {work.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', color: '#94A3B8' }}>0{i + 1}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>{r.companyName}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>{r.employmentType}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{r.location}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{r.locationType}</td>
                    <td style={{ padding: '12px 14px', color: '#1E293B' }}>{r.fromDate}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {r.currentlyWorking
                        ? <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Currently Working</span>
                        : <span style={{ color: '#1E293B' }}>{r.toDate ?? '—'}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Certifications */}
      <SectionCard icon={Award} title="Certifications">
        {certs.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No certifications added yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Certificate ID', 'Certificate Name', 'Awarding Institute', 'Valid Till'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certs.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>{c.certificateId}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>{c.certificateName}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{c.awardingInstitute}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '12px' }}>
                        <Calendar size={12} /> {c.validTill}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Skills */}
      <SectionCard icon={Zap} title="Key Skills">
        {skills.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>No skills added yet.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skills.map(s => (
              <span key={s} style={{ border: '1.5px solid #4F46E5', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', color: '#4F46E5', fontWeight: 500, background: '#F5F3FF' }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  );
}
