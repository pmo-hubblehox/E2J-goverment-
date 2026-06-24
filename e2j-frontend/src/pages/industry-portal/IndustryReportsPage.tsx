import { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronDown } from 'lucide-react';
import api from '../../services/api';

const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';
const PRIMARY = '#3F41D1';

const REPORT_TYPES = [
  'Job Opening Snapshot',
  'Internship Snapshot',
  'Job Opening Detailed Report',
  'Internship Detailed Report',
  'Delisted Report',
];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  Selected:  { color: '#15803D', bg: '#DCFCE7' },
  Scheduled: { color: '#7C3AED', bg: '#EDE9FE' },
  Pending:   { color: '#92400E', bg: '#FEF3C7' },
  Rejected:  { color: '#B91C1C', bg: '#FEE2E2' },
};

interface JobRow { id: number; jobRole: string; targetDate?: string; positions?: number; status?: string; postingType?: string; }

const PAGE_SIZE = 12;

export default function IndustryReportsPage() {
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [dropOpen, setDropOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    Promise.allSettled([
      api.get('/industry-portal/jobs'),
      api.get('/industry-portal/jobs?type=INTERNSHIP'),
    ]).then(([jobsRes, internRes]) => {
      const j = jobsRes.status === 'fulfilled' ? (jobsRes.value.data?.data ?? jobsRes.value.data ?? []) : [];
      const i = internRes.status === 'fulfilled' ? (internRes.value.data?.data ?? internRes.value.data ?? []) : [];
      setJobs([...j, ...i]);
    }).finally(() => setLoading(false));
  }, []);

  const cols = reportType.includes('Detailed')
    ? ['Job Title', 'Candidate Name', 'Candidate Application Date', 'CV Link', 'Status']
    : ['Job Title', 'Date', 'No. Of Openings', 'No. Of Applications', 'No. Selected', 'No. Scheduled', 'No. Rejected', 'Pending For Action'];

  return (
    <div style={{ padding: '24px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {/* Report type dropdown */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setDropOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', height: '40px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', minWidth: '240px', fontSize: '13px', color: TEXT }}>
            <div style={{ fontSize: '10px', color: SUB, position: 'absolute', top: '-8px', left: '12px', background: '#fff', padding: '0 4px' }}>Report</div>
            <span style={{ flex: 1 }}>{reportType}</span>
            <ChevronDown size={14} color={SUB} />
          </div>
          {dropOpen && (
            <>
              <div onClick={() => setDropOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
              <div style={{ position: 'absolute', left: 0, top: '44px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', zIndex: 20, minWidth: '240px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {REPORT_TYPES.map(r => (
                  <button key={r} onClick={() => { setReportType(r); setDropOpen(false); }}
                    style={{ display: 'block', width: '100%', padding: '10px 16px', background: r === reportType ? '#F8FAFC' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: r === reportType ? PRIMARY : TEXT }}>
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: SUB }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
            style={{ paddingLeft: '32px', paddingRight: '12px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '100px', fontSize: '13px', outline: 'none', width: '200px' }} />
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT }}>
          <Filter size={14} /> Filter
        </button>
        <button style={{ padding: '0 14px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', color: TEXT }}>
          <Download size={14} />
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {cols.map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: SUB, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={cols.length} style={{ padding: '60px', textAlign: 'center', color: SUB }}>Loading…</td></tr>
            ) : (() => {
              const isInternReport = reportType.toLowerCase().includes('internship');
              const isSnap = !reportType.includes('Detailed') && !reportType.includes('Delisted');
              const filtered2 = jobs.filter(j => {
                const matchType = isInternReport ? j.postingType === 'INTERNSHIP' : j.postingType !== 'INTERNSHIP';
                const matchDelist = reportType.includes('Delisted') ? j.status === 'UNPUBLISHED' : true;
                const matchSearch = !search || j.jobRole?.toLowerCase().includes(search.toLowerCase());
                return matchType && matchDelist && matchSearch;
              });
              const totalPages = Math.ceil(filtered2.length / PAGE_SIZE);
              const safePage = Math.min(page, Math.max(0, totalPages - 1));
              const paged = filtered2.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
              if (paged.length === 0) return (
                <tr><td colSpan={cols.length} style={{ padding: '60px', textAlign: 'center', color: SUB }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '8px' }}>No report data yet</div>
                  <div style={{ fontSize: '13px' }}>Reports will populate as you post jobs and receive applications.</div>
                </td></tr>
              );
              return paged.map(j => (
                <tr key={j.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '12px 16px', color: TEXT }}>{j.jobRole}</td>
                  {isSnap ? (
                    <>
                      <td style={{ padding: '12px 16px', color: SUB }}>{j.targetDate ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>{j.positions ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>0</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>0</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>0</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>0</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>0</td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 16px', color: SUB }}>—</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>—</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>—</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, ...(STATUS_STYLE[j.status ?? ''] ?? { color: SUB, bg: '#F1F5F9' }) }}>
                          {j.status ?? 'Pending'}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(() => {
        const isInternReport = reportType.toLowerCase().includes('internship');
        const filtered2 = jobs.filter(j => {
          const matchType = isInternReport ? j.postingType === 'INTERNSHIP' : j.postingType !== 'INTERNSHIP';
          const matchDelist = reportType.includes('Delisted') ? j.status === 'UNPUBLISHED' : true;
          const matchSearch = !search || j.jobRole?.toLowerCase().includes(search.toLowerCase());
          return matchType && matchDelist && matchSearch;
        });
        const totalPages = Math.ceil(filtered2.length / PAGE_SIZE);
        if (totalPages <= 1) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <div style={{ fontSize: '13px', color: SUB }}>{PAGE_SIZE} Per Page · {filtered2.length} total</div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '13px' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ padding: '6px 12px', border: `1px solid ${BORDER}`, borderRadius: '6px', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', color: page === 0 ? '#CBD5E1' : TEXT }}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', background: page === i ? PRIMARY : '#F1F5F9', color: page === i ? '#fff' : TEXT, cursor: 'pointer', fontWeight: page === i ? 600 : 400 }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ padding: '6px 12px', border: `1px solid ${BORDER}`, borderRadius: '6px', background: '#fff', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', color: page >= totalPages - 1 ? '#CBD5E1' : TEXT }}>Next →</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
