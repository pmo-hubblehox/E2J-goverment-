import { useState, useEffect } from 'react';
import { Search, Download, Users } from 'lucide-react';

function resolveUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/api/')) return `http://localhost:8081${raw}`;
  return '';
}
import api from '../../services/api';

const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';
const PRIMARY = '#3F41D1';

interface Applicant {
  applicationId: number;
  studentEmail: string;
  studentPhone: string;
  resumeUrl: string;
  resumeFileName: string;
  jobRole: string;
  stage: string;
}

export default function ResumeDatabasePage() {
  const [search, setSearch] = useState('');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/industry-portal/applicants')
      .then(r => setApplicants(r.data?.data ?? []))
      .catch(() => setApplicants([]))
      .finally(() => setLoading(false));
  }, []);

  // Deduplicate by studentEmail — one resume entry per student
  const seen = new Set<string>();
  const unique = applicants.filter(a => {
    if (!a.studentEmail || seen.has(a.studentEmail)) return false;
    seen.add(a.studentEmail); return true;
  });

  const filtered = unique.filter(a =>
    !search ||
    a.studentEmail?.toLowerCase().includes(search.toLowerCase()) ||
    a.resumeFileName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = () => {
    const rows = [['Email', 'Phone', 'Job Role', 'Resume']];
    filtered.forEach(a => rows.push([a.studentEmail ?? '', a.studentPhone ?? '', a.jobRole ?? '', a.resumeUrl ?? '']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'resume_database.csv'; a.click();
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: SUB }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or resume"
            style={{ paddingLeft: '32px', paddingRight: '12px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '100px', fontSize: '13px', outline: 'none', width: '240px' }} />
        </div>
        <button onClick={handleDownload}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 14px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', color: TEXT, fontSize: '13px' }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#F8FAFC' }}>
              {['Candidate', 'Contact Number', 'Applied For', 'Resume'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: SUB, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: SUB }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: SUB }}>
                  <Users size={36} color="#CBD5E1" style={{ marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '8px' }}>No resumes in database</div>
                  <div style={{ fontSize: '13px' }}>Candidate resumes from job applications will appear here.</div>
                </td>
              </tr>
            ) : filtered.map(a => (
              <tr key={a.applicationId} style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: PRIMARY, flexShrink: 0 }}>
                      {(a.studentEmail ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '13px', color: TEXT }}>{a.studentEmail}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: SUB, fontSize: '13px' }}>{a.studentPhone || '—'}</td>
                <td style={{ padding: '12px 16px', color: TEXT, fontSize: '13px' }}>{a.jobRole || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  {resolveUrl(a.resumeUrl) ? (
                    <a href={resolveUrl(a.resumeUrl)} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: PRIMARY, fontWeight: 500, textDecoration: 'none' }}>
                      {a.resumeFileName ?? 'View Resume'}
                    </a>
                  ) : <span style={{ fontSize: '13px', color: '#CBD5E1' }}>No resume</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
