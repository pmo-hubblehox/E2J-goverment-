import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Search, Filter, Download, Plus, Eye, Edit2, Trash2, Upload } from 'lucide-react';
import api from '../../services/api';
import { downloadCSV } from '../../utils/csvExport';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';

interface Posting {
  id: number; jobId: string; postingType: string; jobRole: string; department: string;
  location: string; positions: number; createdAt: string; status: string;
  internshipRole?: string;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PUBLISHED:   { color: '#15803D', bg: '#DCFCE7' },
  UNPUBLISHED: { color: '#B91C1C', bg: '#FEE2E2' },
  DRAFT:       { color: '#64748B', bg: '#F1F5F9' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT;
  return (
    <span style={{ padding: '3px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: s.color, background: s.bg }}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function ActionMenu({ id, status, tab, onDelete, onStatus }: { id: number; status: string; tab: 'JOB' | 'INTERNSHIP'; onDelete: () => void; onStatus: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: SUB, borderRadius: '4px' }}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{ position: 'absolute', right: 0, top: '28px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 20, minWidth: '160px', overflow: 'hidden' }}>
            {[
              { label: 'View', icon: Eye, action: () => { navigate(tab === 'JOB' ? `/industry-portal/jobs/${id}` : `/industry-portal/internships/${id}`); setOpen(false); } },
              { label: 'Edit', icon: Edit2, action: () => { navigate(tab === 'JOB' ? `/industry-portal/jobs/${id}/edit` : `/industry-portal/internships/${id}/edit`); setOpen(false); } },
              {
                label: status === 'PUBLISHED' ? 'Unpublish' : 'Publish',
                icon: Plus,
                action: () => { onStatus(status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED'); setOpen(false); },
              },
              { label: 'Delete', icon: Trash2, action: () => { onDelete(); setOpen(false); } },
            ].map(({ label, icon: Icon, action }) => (
              <button key={label} onClick={action}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: label === 'Delete' ? '#DC2626' : TEXT, textAlign: 'left' }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function JobListingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'JOB' | 'INTERNSHIP'>('JOB');
  const [postings, setPostings] = useState<Posting[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');
  const bulkRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    api.get(`/industry-portal/jobs?type=${tab}`)
      .then(res => setPostings(res.data?.data ?? []))
      .catch(() => setPostings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBulkUploading(true); setBulkMsg('');
    const form = new FormData(); form.append('file', file);
    try {
      const res = await api.post('/industry-portal/jobs/bulk', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBulkMsg(`✓ ${res.data?.message ?? 'Uploaded successfully'}`);
      load();
    } catch (err: any) {
      setBulkMsg(`✗ ${err?.response?.data?.message ?? 'Upload failed'}`);
    } finally {
      setBulkUploading(false);
      if (bulkRef.current) bulkRef.current.value = '';
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm('Delete this posting?')) return;
    api.delete(`/industry-portal/jobs/${id}`).then(load);
  };

  const handleStatus = (id: number, status: string) => {
    api.patch(`/industry-portal/jobs/${id}/status`, { status }).then(load);
  };

  const [statusFilter, setStatusFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const filtered = postings.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = (p.jobRole ?? '').toLowerCase().includes(q) || (p.department ?? '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    downloadCSV(`${tab.toLowerCase()}s.csv`,
      ['Job ID', 'Role', 'Department', 'Location', 'Positions', 'Created Date', 'Status'],
      filtered.map(p => [p.jobId, p.jobRole ?? p.internshipRole ?? '', p.department, p.location, p.positions, p.createdAt, p.status])
    );
  };

  const isJob = tab === 'JOB';

  return (
    <div style={{ padding: '24px' }}>
      {/* Tabs + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: '100px', overflow: 'hidden' }}>
          {(['JOB', 'INTERNSHIP'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 24px', background: tab === t ? PRIMARY : '#fff', color: tab === t ? '#fff' : TEXT, border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? 600 : 400 }}>
              {t === 'JOB' ? 'Jobs' : 'Internship'}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: SUB }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
            style={{ paddingLeft: '32px', paddingRight: '12px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '100px', fontSize: '13px', outline: 'none', width: '220px' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilter(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '36px', border: `1px solid ${showFilter || statusFilter ? PRIMARY : BORDER}`, borderRadius: '8px', background: showFilter || statusFilter ? '#EEF2FF' : '#fff', fontSize: '13px', cursor: 'pointer', color: showFilter || statusFilter ? PRIMARY : TEXT }}>
            <Filter size={14} /> Filter {statusFilter && `(${statusFilter})`}
          </button>
          {showFilter && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '12px', minWidth: '180px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: SUB, textTransform: 'uppercase', margin: '0 0 8px' }}>Status</p>
              {['', 'PUBLISHED', 'UNPUBLISHED', 'DRAFT'].map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer', fontSize: '13px', color: TEXT }}>
                  <input type="radio" name="jobFilter" checked={statusFilter === s} onChange={() => { setStatusFilter(s); setShowFilter(false); }} style={{ accentColor: PRIMARY }} />
                  {s || 'All'}
                </label>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 14px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', color: TEXT, fontSize: '13px' }}>
          <Download size={14} /> Export
        </button>
        <input ref={bulkRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleBulkUpload} />
        <button onClick={() => api.get('/industry-portal/jobs/bulk/sample', { responseType: 'blob' }).then(r => { const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = 'sample_jobs.xlsx'; a.click(); })}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 14px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', color: TEXT, fontSize: '13px' }}>
          <Download size={14} /> Sample
        </button>
        <button onClick={() => bulkRef.current?.click()} disabled={bulkUploading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '36px', border: `1px solid ${PRIMARY}`, borderRadius: '8px', background: '#EEF2FF', color: PRIMARY, fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: bulkUploading ? 0.6 : 1 }}>
          <Upload size={14} /> {bulkUploading ? 'Uploading…' : 'Bulk Upload'}
        </button>
        <button onClick={() => navigate(isJob ? '/industry-portal/jobs/add' : '/industry-portal/internships/add')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 20px', height: '36px', border: 'none', borderRadius: '100px', background: '#E91E8C', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add
        </button>
      </div>
      {bulkMsg && <p style={{ fontSize: '13px', color: bulkMsg.startsWith('✓') ? '#16A34A' : '#DC2626', margin: '8px 0 0' }}>{bulkMsg}</p>}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {(isJob
                ? ['Job ID', 'Job Role', 'Department', 'Location', 'Positions', 'Created Date', 'Status', 'Action']
                : ['Internship Id', 'Internship Role', 'Department', 'Location', 'Positions', 'Created Date', 'Status', 'Action']
              ).map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: SUB, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: SUB }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: SUB }}>
                No {isJob ? 'jobs' : 'internships'} yet. Click "+ Add" to post one.
              </td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td style={{ padding: '12px 16px', color: SUB }}>{p.jobId}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: TEXT }}>{p.jobRole || '—'}</td>
                <td style={{ padding: '12px 16px', color: TEXT }}>{p.department || '—'}</td>
                <td style={{ padding: '12px 16px', color: TEXT }}>{p.location || '—'}</td>
                <td style={{ padding: '12px 16px', color: TEXT }}>{p.positions ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: TEXT }}>
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}><StatusBadge status={p.status} /></td>
                <td style={{ padding: '12px 16px' }}>
                  <ActionMenu id={p.id} status={p.status} tab={tab} onDelete={() => handleDelete(p.id)} onStatus={(s) => handleStatus(p.id, s)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
