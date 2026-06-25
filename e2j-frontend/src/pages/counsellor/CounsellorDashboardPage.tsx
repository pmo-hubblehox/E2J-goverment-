import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, Star } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#1E293B';
const SUB     = '#64748B';
const BG      = '#F8FAFC';

const card: React.CSSProperties = { background: '#fff', borderRadius: '14px', border: `1px solid ${BORDER}`, padding: '20px' };

interface DashData {
  totalSessionsAvailable: number;
  totalSessionsBooked: number;
  totalSessionsCompleted: number;
  availability: { available: number; unavailable: number };
  specializationMap: { skill: string; sessions: number }[];
  utilizationByDay: { day: string; hours: number }[];
}

const FALLBACK: DashData = {
  totalSessionsAvailable: 0, totalSessionsBooked: 0, totalSessionsCompleted: 0,
  availability: { available: 0, unavailable: 0 },
  specializationMap: [], utilizationByDay: [],
};

export default function CounsellorDashboardPage() {
  const user = useAuthStore(s => s.user);
  const [data, setData]         = useState<DashData>(FALLBACK);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/counsellor/dashboard'),
      api.get('/counsellor/bookings').catch(() => ({ data: { data: [] } })),
    ]).then(([dashRes, bookRes]) => {
      setData({ ...FALLBACK, ...dashRes.data?.data });
      const b = bookRes.data?.data?.content ?? bookRes.data?.data ?? [];
      setBookings(Array.isArray(b) ? b.slice(0, 5) : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Sessions Available', value: data.totalSessionsAvailable, icon: Calendar,     bg: '#EEF2FF', color: PRIMARY },
    { label: 'Sessions Booked',    value: data.totalSessionsBooked,    icon: Clock,        bg: '#FFF7ED', color: '#EA580C' },
    { label: 'Sessions Completed', value: data.totalSessionsCompleted, icon: CheckCircle,  bg: '#F0FDF4', color: '#16A34A' },
    { label: 'Avg. Rating',        value: '—',                         icon: Star,         bg: '#FAF5FF', color: '#7C3AED' },
  ];

  const total    = data.availability.available + data.availability.unavailable;
  const availPct = total > 0 ? Math.round((data.availability.available / total) * 100) : 0;
  const donutR = 52; const donutC = 2 * Math.PI * donutR;
  const availArc = (availPct / 100) * donutC;

  const specMax  = Math.max(...data.specializationMap.map(s => s.sessions), 1);
  const utilMax  = Math.max(...data.utilizationByDay.map(d => Number(d.hours)), 1);

  const STATUS_COLORS: Record<string, [string, string]> = {
    CONFIRMED:  ['#EEF2FF', PRIMARY],
    COMPLETED:  ['#DCFCE7', '#16A34A'],
    CANCELLED:  ['#FEE2E2', '#DC2626'],
    PENDING:    ['#FFF7ED', '#EA580C'],
  };

  if (loading) return <div style={{ padding: 32, color: SUB, fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ padding: '24px 28px', background: BG, minHeight: '100%' }}>

      {/* Welcome */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>
          {user?.name ?? 'Counsellor'} — Dashboard
        </h2>
        <p style={{ fontSize: '13px', color: SUB, margin: 0 }}>Overview of your sessions, availability, and student activity.</p>
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

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1.4fr', gap: '16px', marginBottom: '20px' }}>

        {/* Donut — Availability */}
        <div style={card}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 16px' }}>Availability</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg width="130" height="130" viewBox="0 0 130 130">
                <circle cx="65" cy="65" r={donutR} fill="none" stroke="#FCA5A5" strokeWidth="14" />
                <circle cx="65" cy="65" r={donutR} fill="none" stroke="#22C55E" strokeWidth="14"
                  strokeDasharray={`${availArc} ${donutC}`}
                  strokeLinecap="round" transform="rotate(-90 65 65)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: TEXT }}>{availPct}%</span>
                <span style={{ fontSize: '10px', color: SUB }}>Available</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              {[['#22C55E', 'Available', `${availPct}%`], ['#FCA5A5', 'Unavailable', `${100 - availPct}%`]].map(([col, lbl, val]) => (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: col as string, flexShrink: 0 }} />
                  <span style={{ color: SUB, flex: 1 }}>{lbl}</span>
                  <span style={{ fontWeight: 700, color: TEXT }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specialization bars */}
        <div style={card}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 14px' }}>Specialization Coverage</p>
          {data.specializationMap.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>No skills added to your profile yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.specializationMap.map(s => {
                const pct = Math.round((s.sessions / specMax) * 100);
                return (
                  <div key={s.skill}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: SUB, marginBottom: '4px' }}>
                      <span>{s.skill}</span><span style={{ fontWeight: 600, color: TEXT }}>{pct}%</span>
                    </div>
                    <div style={{ height: '6px', background: BORDER, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: PRIMARY, borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Utilization by day */}
        <div style={card}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 14px' }}>Sessions by Day</p>
          {data.utilizationByDay.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>No session data yet.</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px', paddingBottom: '4px' }}>
              {data.utilizationByDay.map(d => {
                const h = Number(d.hours);
                const barH = utilMax > 0 ? Math.round((h / utilMax) * 110) : 0;
                const isMax = h === utilMax && h > 0;
                return (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: SUB }}>{h > 0 ? h : ''}</span>
                    <div style={{ width: '100%', background: isMax ? PRIMARY : '#C7D2FE', borderRadius: '4px 4px 0 0', height: `${Math.max(barH, h > 0 ? 4 : 0)}px` }} />
                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={card}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 14px' }}>Recent Bookings</p>
        {bookings.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>No bookings yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Student', 'Date', 'Time', 'Mode', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#94A3B8', fontWeight: 500, fontSize: '12px', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any, i: number) => {
                const st = b.status ?? 'PENDING';
                const [bg, col] = STATUS_COLORS[st] ?? ['#F1F5F9', SUB];
                return (
                  <tr key={i}>
                    <td style={{ padding: '10px', fontWeight: 600, color: TEXT, borderBottom: `1px solid #F8FAFC` }}>{b.studentName ?? b.userName ?? '—'}</td>
                    <td style={{ padding: '10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{b.sessionDate ?? '—'}</td>
                    <td style={{ padding: '10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{b.startTime ? `${b.startTime} – ${b.endTime ?? ''}` : '—'}</td>
                    <td style={{ padding: '10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{b.mode ?? 'Online'}</td>
                    <td style={{ padding: '10px', borderBottom: `1px solid #F8FAFC` }}>
                      <span style={{ background: bg, color: col, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>{st}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
