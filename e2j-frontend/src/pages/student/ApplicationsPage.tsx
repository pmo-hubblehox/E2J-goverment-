import { useEffect, useState } from 'react';
import { FileText, MapPin, Briefcase } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#1E293B';
const SUB = '#64748B';

interface Application {
  id: number;
  jobId: number;
  jobRole: string;
  companyName: string;
  location: string;
  workMode: string;
  department: string;
  postingType: string;
  resumeFileName: string;
  stage: string;
  appliedAt: string;
}

const STAGE_STYLE: Record<string, { color: string; bg: string }> = {
  APPLIED:          { color: '#64748B', bg: '#F1F5F9' },
  SHORTLISTED:      { color: '#1D4ED8', bg: '#DBEAFE' },
  INTERVIEW_ROUND_1:{ color: '#7C3AED', bg: '#EDE9FE' },
  INTERVIEW_ROUND_2:{ color: '#C2410C', bg: '#FED7AA' },
  OFFERED:          { color: '#15803D', bg: '#DCFCE7' },
  REJECTED:         { color: '#B91C1C', bg: '#FEE2E2' },
};

function stageLabel(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? s;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/applications')
      .then(r => setApplications(r.data?.data ?? []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: TEXT, margin: '0 0 20px' }}>My Applications</h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px', height: '80px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '64px 24px', textAlign: 'center', color: SUB }}>
          <Briefcase size={40} strokeWidth={1.2} style={{ marginBottom: '12px', color: '#CBD5E1' }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '6px' }}>No applications yet</div>
          <div style={{ fontSize: '13px' }}>Start applying to jobs to track your progress here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {applications.map(app => {
            const st = STAGE_STYLE[app.stage] ?? STAGE_STYLE.APPLIED;
            return (
              <div key={app.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Briefcase size={20} color={PRIMARY} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '2px' }}>{app.jobRole}</div>
                    <div style={{ fontSize: '13px', color: SUB, marginBottom: '6px' }}>{app.companyName}</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: SUB }}>
                      {app.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} />{app.location}</span>}
                      {app.workMode && <span>{app.workMode}</span>}
                      {app.department && <span style={{ color: PRIMARY }}>{app.department}</span>}
                      {app.resumeFileName && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={12} />{app.resumeFileName}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: st.color, background: st.bg, padding: '4px 12px', borderRadius: '100px' }}>
                    {stageLabel(app.stage)}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
