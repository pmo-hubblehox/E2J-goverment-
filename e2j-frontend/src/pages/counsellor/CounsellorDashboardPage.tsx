import { useState, useEffect } from 'react';
import api from '../../services/api';

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
  specializationMap: [],
  utilizationByDay: [],
};

export default function CounsellorDashboardPage() {
  const [data, setData] = useState<DashData>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/counsellor/dashboard')
      .then(r => setData({ ...FALLBACK, ...r.data?.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Session Available', value: data.totalSessionsAvailable },
    { label: 'Total Session Booked', value: data.totalSessionsBooked },
    { label: 'Total Session Completed', value: data.totalSessionsCompleted },
  ];

  const total = data.availability.available + data.availability.unavailable;
  const availPct = total > 0 ? Math.round((data.availability.available / total) * 100) : 0;
  const unavailPct = 100 - availPct;

  const donutR = 60;
  const donutC = 2 * Math.PI * donutR;
  const availableArc = (availPct / 100) * donutC;

  const specMax = Math.max(...data.specializationMap.map(s => s.sessions), 1);
  const utilMax = Math.max(...data.utilizationByDay.map(d => d.hours), 1);

  return (
    <div style={{ padding: '24px' }}>
      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 8px', fontWeight: 500 }}>{s.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B' }}>
                {loading ? '—' : s.value}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0' }}>Total count</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1.6fr', gap: '16px' }}>

        {/* Donut — Availability */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', margin: '0 0 20px' }}>Availability</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={donutR} fill="none" stroke="#FCA5A5" strokeWidth="20" />
                <circle cx="80" cy="80" r={donutR} fill="none" stroke="#22C55E" strokeWidth="20"
                  strokeDasharray={`${availableArc} ${donutC}`}
                  strokeLinecap="round" transform="rotate(-90 80 80)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#1E293B' }}>{availPct}%</span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Available</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
                <span style={{ color: '#64748B', flex: 1 }}>Available</span>
                <span style={{ fontWeight: 700, color: '#1E293B' }}>{availPct}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FCA5A5', flexShrink: 0 }} />
                <span style={{ color: '#64748B', flex: 1 }}>Unavailable</span>
                <span style={{ fontWeight: 700, color: '#1E293B' }}>{unavailPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal bar — Specializations */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', margin: '0 0 20px' }}>Specialization Coverage</p>
          {data.specializationMap.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>No specialization data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.specializationMap.map(s => {
                const pct = Math.round((s.sessions / specMax) * 100);
                return (
                  <div key={s.skill}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                      <span>{s.skill}</span>
                      <span style={{ fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#4F46E5', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vertical bar — Utilization */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', margin: '0 0 20px' }}>Session Utilization By Day</p>
          {data.utilizationByDay.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>No utilization data yet</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '160px', paddingBottom: '8px' }}>
              {data.utilizationByDay.map(d => {
                const barH = Math.round((d.hours / utilMax) * 120);
                return (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748B' }}>{d.hours}</span>
                    <div style={{ width: '100%', background: d.hours === utilMax ? '#4F46E5' : '#C7D2FE', borderRadius: '4px 4px 0 0', height: `${barH}px` }} />
                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>{d.day}</span>
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
