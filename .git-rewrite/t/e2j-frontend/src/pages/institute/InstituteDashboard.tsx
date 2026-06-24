import { useEffect, useState } from 'react';
import { GraduationCap, Users, UserCheck, Filter, ChevronDown, Calendar, Clock, Monitor, MapPin, X } from 'lucide-react';
import api from '../../services/api';

function InfoRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
      <Icon size={13} style={{ color: '#4338CA', flexShrink: 0 }} />
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
    </div>
  );
}

function SectionCard({ count, title, children }: { count: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ background: '#EEF2FF', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4338CA', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>{count}</div>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>{text}</p>;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function InstituteDashboard() {
  const [data, setData]     = useState<Record<string, any>>({});
  const [programs, setPrograms] = useState<any[]>([]);
  const [drives, setDrives]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Current Month');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const load = (month?: string) => {
    const params: Record<string, string> = {};
    if (month && month !== 'Current Month') params.month = month;
    Promise.all([
      api.get('/institute/dashboard', { params }),
      api.get('/institute/programs'),
      api.get('/institute/recruitment'),
    ]).then(([dashRes, progRes, driveRes]) => {
      setData(dashRes.data?.data ?? {});
      const allPrograms = progRes.data?.data?.content ?? progRes.data?.data ?? [];
      setPrograms(allPrograms.slice(0, 5));
      const allDrives = driveRes.data?.data?.content ?? driveRes.data?.data ?? [];
      const filtered = filterStatus ? allDrives.filter((d: any) => d.status === filterStatus) : allDrives;
      setDrives(filtered.slice(0, 2));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const summaryStats = [
    { value: data.totalFaculty  ?? 0, label: 'Faculty Profiles Added',      Icon: Users },
    { value: data.totalStudents ?? 0, label: 'Student Data Uploaded',        Icon: GraduationCap },
    { value: data.totalPrograms ?? 0, label: 'Programs',                     Icon: UserCheck },
  ];

  const funnel: { stage: string; count: number }[] = data.placementFunnel ?? [];

  if (loading) return <div style={{ padding: 32, color: '#666', fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ padding: '24px 28px', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Summary</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowFilterPanel(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${showFilterPanel || filterStatus ? '#3F41D1' : '#E2E8F0'}`, borderRadius: '20px', background: showFilterPanel || filterStatus ? '#EEF2FF' : '#fff', padding: '7px 14px', fontSize: '13px', color: showFilterPanel || filterStatus ? '#3F41D1' : '#64748B', cursor: 'pointer' }}>
              <Filter size={14} /> Filter {filterStatus && `(${filterStatus})`}
            </button>
            {showFilterPanel && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '12px', minWidth: '200px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', margin: '0 0 8px' }}>Recruitment Status</p>
                {['', 'RECEIVED', 'ACCEPTED', 'REJECTED'].map(s => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', fontSize: '13px', color: '#1E293B' }}>
                    <input type="radio" name="dashFilter" checked={filterStatus === s} onChange={() => { setFilterStatus(s); setShowFilterPanel(false); load(selectedMonth); }} style={{ accentColor: '#3F41D1' }} />
                    {s || 'All'}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMonthMenu(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', padding: '7px 14px', fontSize: '13px', color: '#64748B', cursor: 'pointer' }}>
              {selectedMonth} <ChevronDown size={14} />
            </button>
            {showMonthMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '160px', maxHeight: '240px', overflowY: 'auto' }}>
                {['Current Month', ...MONTHS].map(m => (
                  <div key={m} onClick={() => { setSelectedMonth(m); setShowMonthMenu(false); load(m); }}
                    style={{ padding: '9px 14px', fontSize: '13px', cursor: 'pointer', background: selectedMonth === m ? '#EEF2FF' : '#fff', color: selectedMonth === m ? '#3F41D1' : '#1E293B', fontWeight: selectedMonth === m ? 600 : 400 }}>
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {summaryStats.map(s => (
          <div key={s.label} style={{ flex: '1 1 200px', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.Icon size={20} style={{ color: '#64748B' }} />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3-column sections */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {/* Campus recruitment */}
        <SectionCard count={drives.length} title="Campus Recruitment Requests">
          {drives.length === 0
            ? <EmptyState text="No campus drives yet." />
            : drives.map((d: any, i: number) => (
                <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 2px' }}>{d.id}</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', margin: '0 0 8px' }}>{d.companyName || d.title || '—'}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {d.driveDate && <InfoRow icon={Calendar} text={d.driveDate} />}
                    {d.driveTime && <InfoRow icon={Clock} text={d.driveTime} />}
                    {d.mode && <InfoRow icon={Monitor} text={d.mode} />}
                    {d.venue && <InfoRow icon={MapPin} text={d.venue} />}
                  </div>
                </div>
              ))}
        </SectionCard>

        {/* Recruitment funnel */}
        <SectionCard count={data.totalStudents ?? 0} title="Placement Funnel">
          {funnel.length === 0
            ? <EmptyState text="No students uploaded yet." />
            : funnel.map((f, i) => {
                const pct = funnel[0].count > 0 ? Math.round((f.count / funnel[0].count) * 100) : 0;
                const colors = ['#4338CA', '#64748B', '#F59E0B', '#22C55E', '#10B981'];
                return (
                  <div key={f.stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                      <span>{f.stage}</span><span style={{ fontWeight: 600, color: '#1E293B' }}>{f.count}</span>
                    </div>
                    <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: colors[i % colors.length], borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
        </SectionCard>

        {/* Drives accepted */}
        <SectionCard count={data.acceptedDrives ?? 0} title="Accepted Drives">
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>Total Drives</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{data.totalDrives ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>Accepted</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>{data.acceptedDrives ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>Received</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>{data.receivedDrives ?? 0}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Program Progress */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px 24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 20px' }}>Programs</h3>
        {programs.length === 0
          ? <EmptyState text="No programs added yet." />
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {programs.map((p: any) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', width: '200px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <div style={{ flex: 1, height: '10px', background: '#E2E8F0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (p.intakeCapacity > 0 ? 70 : 0))}%`, height: '100%', background: '#22C55E', borderRadius: '5px' }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748B', width: '60px', textAlign: 'right', flexShrink: 0 }}>{p.degree}</span>
                </div>
              ))}
            </div>}
      </div>
    </div>
  );
}
