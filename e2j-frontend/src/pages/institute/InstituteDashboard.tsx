import { useEffect, useState } from 'react';
import { GraduationCap, Users, UserCheck, BookOpen, Calendar, Clock, Monitor, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#1E293B';
const SUB     = '#64748B';
const BG      = '#F8FAFC';

const card: React.CSSProperties = { background: '#fff', borderRadius: '14px', border: `1px solid ${BORDER}`, padding: '20px' };

function InfoRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: SUB }}>
      <Icon size={12} color={PRIMARY} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  );
}

const STATUS_COLORS: Record<string, [string, string]> = {
  RECEIVED: ['#FFF7ED', '#EA580C'],
  ACCEPTED: ['#DCFCE7', '#16A34A'],
  REJECTED: ['#FEE2E2', '#DC2626'],
};

export default function InstituteDashboard() {
  const user    = useAuthStore(s => s.user);
  const [data, setData]       = useState<Record<string, any>>({});
  const [programs, setPrograms] = useState<any[]>([]);
  const [drives, setDrives]   = useState<any[]>([]);
  const [labs, setLabs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/institute/dashboard'),
      api.get('/institute/programs'),
      api.get('/institute/recruitment'),
      api.get('/institute/lab-bookings').catch(() => ({ data: { data: [] } })),
    ]).then(([dashRes, progRes, driveRes, labRes]) => {
      setData(dashRes.data?.data ?? {});
      const allPrograms = progRes.data?.data?.content ?? progRes.data?.data ?? [];
      setPrograms(allPrograms.slice(0, 5));
      const allDrives = driveRes.data?.data?.content ?? driveRes.data?.data ?? [];
      setDrives(allDrives.slice(0, 3));
      const allLabs = labRes.data?.data?.content ?? labRes.data?.data ?? [];
      setLabs(Array.isArray(allLabs) ? allLabs.slice(0, 3) : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const SAMPLE_DRIVES = [
    { companyName: 'TCS',        driveDate: '28 Jun 2026', driveTime: '10:00 - 13:00', mode: 'Online',  status: 'ACCEPTED' },
    { companyName: 'Infosys',    driveDate: '02 Jul 2026', driveTime: '09:00 - 12:00', mode: 'Offline', status: 'RECEIVED' },
    { companyName: 'Wipro',      driveDate: '07 Jul 2026', driveTime: '11:00 - 14:00', mode: 'Online',  status: 'RECEIVED' },
    { companyName: 'Capgemini',  driveDate: '15 Jul 2026', driveTime: '10:00 - 13:00', mode: 'Offline', status: 'ACCEPTED' },
  ];
  const displayDrives = drives.length > 0 ? drives : SAMPLE_DRIVES;
  const drivesCount    = (data.totalDrives && data.totalDrives > 0) ? data.totalDrives : (drives.length > 0 ? drives.length : SAMPLE_DRIVES.length);
  const acceptedCount  = (data.acceptedDrives && data.acceptedDrives > 0) ? data.acceptedDrives : displayDrives.filter((d: any) => d.status === 'ACCEPTED').length;
  const pendingCount   = (data.receivedDrives && data.receivedDrives > 0) ? data.receivedDrives : displayDrives.filter((d: any) => d.status === 'RECEIVED').length;

  const stats = [
    { value: data.totalStudents ?? 0,  label: 'Students Uploaded', icon: GraduationCap, bg: '#EEF2FF', color: PRIMARY },
    { value: data.totalFaculty  ?? 0,  label: 'Faculty Profiles',  icon: Users,         bg: '#F0FDF4', color: '#16A34A' },
    { value: data.totalPrograms ?? 0,  label: 'Active Programs',   icon: BookOpen,      bg: '#FFF7ED', color: '#EA580C' },
    { value: drivesCount,              label: 'Campus Drives',     icon: UserCheck,     bg: '#FAF5FF', color: '#7C3AED' },
  ];

  const funnel: { stage: string; count: number }[] = data.placementFunnel ?? [];

  if (loading) return <div style={{ padding: 32, color: SUB, fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ padding: '24px 28px', background: BG, minHeight: '100%' }}>

      {/* Welcome */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>
          {user?.name ?? 'Institute'}
        </h2>
        <p style={{ fontSize: '13px', color: SUB, margin: 0 }}>Summary of your institute activity and placement data.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' }}>
        {stats.map(s => (
          <div key={s.label} style={card}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <s.icon size={20} color={s.color} />
            </div>
            <p style={{ fontSize: '26px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: SUB, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Funnel + Drives */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

        {/* Placement Funnel */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: 0 }}>Placement Funnel</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#16A34A', margin: 0 }}>{acceptedCount}</p>
                <p style={{ fontSize: '10px', color: SUB, margin: 0 }}>Accepted</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#EA580C', margin: 0 }}>{pendingCount}</p>
                <p style={{ fontSize: '10px', color: SUB, margin: 0 }}>Pending</p>
              </div>
            </div>
          </div>
          {funnel.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>No student data uploaded yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={funnel} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
                  <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                {funnel.slice(0, 2).map((f, i) => {
                  const pct = funnel[0]?.count > 0 ? Math.round((f.count / funnel[0].count) * 100) : 0;
                  const colors = [PRIMARY, '#22C55E'];
                  return (
                    <div key={f.stage} style={{ flex: 1, background: BG, borderRadius: '8px', padding: '8px 12px' }}>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: colors[i], margin: '0 0 2px' }}>{pct}%</p>
                      <p style={{ fontSize: '11px', color: SUB, margin: 0 }}>{f.stage}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Campus Drives */}
        <div style={card}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 14px' }}>Campus Recruitment Requests</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayDrives.map((d: any, i: number) => {
                const [bg, col] = STATUS_COLORS[d.status] ?? ['#F1F5F9', SUB];
                return (
                  <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: TEXT, margin: 0 }}>{d.companyName || d.title || '—'}</p>
                      <span style={{ background: bg, color: col, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>{d.status}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {d.driveDate && <InfoRow icon={Calendar} text={d.driveDate} />}
                      {d.driveTime && <InfoRow icon={Clock} text={d.driveTime} />}
                      {d.mode      && <InfoRow icon={Monitor} text={d.mode} />}
                      {d.venue     && <InfoRow icon={MapPin} text={d.venue} />}
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>

      {/* Programs + Lab Bookings */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

        {/* Programs */}
        <div style={card}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 16px' }}>Programs</p>
          {programs.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>No programs added yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Program', 'Degree', 'Intake', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#94A3B8', fontWeight: 500, fontSize: '12px', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {programs.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ padding: '10px', fontWeight: 600, color: TEXT, borderBottom: `1px solid #F8FAFC` }}>{p.name}</td>
                    <td style={{ padding: '10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{p.degree}</td>
                    <td style={{ padding: '10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{p.intakeCapacity ?? '—'}</td>
                    <td style={{ padding: '10px', borderBottom: `1px solid #F8FAFC` }}>
                      <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Lab Bookings */}
        <div style={card}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 14px' }}>Recent Lab Bookings</p>
          {labs.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>No lab bookings yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {labs.map((b: any, i: number) => {
                const accepted = b.status === 'ACCEPTED' || b.requestStatus === 'ACCEPTED';
                return (
                  <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, margin: 0 }}>{b.venueName ?? b.labName ?? `Lab ${i + 1}`}</p>
                      <span style={{ background: accepted ? '#DCFCE7' : '#FFF7ED', color: accepted ? '#16A34A' : '#EA580C', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>
                        {accepted ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: SUB, margin: 0 }}>{b.companyName ?? b.instituteName ?? '—'}{b.date ? ` · ${b.date}` : ''}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
