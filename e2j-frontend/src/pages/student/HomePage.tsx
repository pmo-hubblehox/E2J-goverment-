import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const BORDER  = '#E2E8F0';
const TEXT    = '#1E293B';
const SUB     = '#64748B';
const COURSE_COLORS = ['#3F41D1', '#16A34A', '#EA580C', '#7C3AED', '#0891B2', '#D97706'];

function CircleProgress({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BORDER} strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: TEXT }}>
        {pct}%
      </div>
    </div>
  );
}

interface CourseItem {
  id: number; title: string; instructor: string; progress: number;
  duration: string; rating: number; enrollmentDate?: string; startDate?: string;
}


const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses]         = useState<CourseItem[]>([]);
  const [tab, setTab]                 = useState<'home' | 'calendar'>('home');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [weekOffset, setWeekOffset]   = useState(0);
  const [calBookings, setCalBookings] = useState<any[]>([]);

  useEffect(() => {
    api.get('/student/courses/my')
      .then(r => setCourses(r.data.data ?? []))
      .catch(() => {});

    api.get('/student/counselling/bookings').then(r => {
      const b = r.data?.data?.content ?? r.data?.data ?? [];
      setCalBookings(Array.isArray(b) ? b : []);
    }).catch(() => {});

    // Always check backend — localStorage alone can be stale after login
    api.get('/student/profile/full')
      .then(r => {
        const completed = r.data?.data?.profileCompleted;
        if (!completed) setShowProfileModal(true);
      })
      .catch(() => {
        // If no profile exists yet, show the modal
        setShowProfileModal(true);
      });
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const today = new Date();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM – 7 PM

  // Static dummy events keyed by weekday index (0=Mon…6=Sun) and hour
  const DUMMY_EVENTS: { dayIdx: number; hour: number; title: string; sub: string; color: string; textColor: string }[] = [
    { dayIdx: 0, hour: 10, title: 'TCS Assessment',          sub: 'Aptitude + Coding',          color: '#EEF2FF', textColor: '#3F41D1' },
    { dayIdx: 1, hour: 14, title: 'Infosys Hackathon',       sub: 'Online Round',               color: '#F0FDF4', textColor: '#16A34A' },
    { dayIdx: 2, hour: 9,  title: 'Resume Workshop',         sub: 'Placement Cell',             color: '#FFF7ED', textColor: '#EA580C' },
    { dayIdx: 2, hour: 15, title: 'HCL Tech Interview',      sub: 'Technical Round 1',          color: '#FEE2E2', textColor: '#DC2626' },
    { dayIdx: 3, hour: 11, title: 'Wipro Written Test',      sub: 'Pending Submission',         color: '#FAF5FF', textColor: '#7C3AED' },
    { dayIdx: 4, hour: 13, title: 'Campus Drive — Capgemini', sub: 'Group Discussion',          color: '#EEF2FF', textColor: '#3F41D1' },
    { dayIdx: 5, hour: 10, title: 'Mock Interview Practice', sub: 'HR + Technical',             color: '#F0FDF4', textColor: '#16A34A' },
  ];

  // Map counsellor bookings to calendar slots
  const bookingEvents = calBookings.map(b => {
    const d = b.sessionDate ? new Date(b.sessionDate) : null;
    if (!d) return null;
    const dayIdx = (d.getDay() + 6) % 7; // Mon=0
    const hour = b.startTime ? parseInt(b.startTime.split(':')[0], 10) : 10;
    return { dayIdx, hour, title: b.counsellorName ?? 'Counsellor Session', sub: b.specialization ?? 'Career Counselling', color: '#EEF2FF', textColor: '#3F41D1', isReal: true };
  }).filter(Boolean) as any[];

  return (
    <div style={{ padding: '24px', minHeight: '100%' }}>

      {/* New user profile completion popup */}
      {showProfileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 40px', maxWidth: '520px', width: '92%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <button
              onClick={() => setShowProfileModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={18} />
            </button>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', margin: '0 0 6px' }}>Welcome!</h2>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 4px' }}>Your career journey starts here.</p>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 20px' }}>Complete your profile in just 2 minutes to unlock</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', margin: '0 0 20px', textAlign: 'left' }}>
              <span style={{ fontSize: '13px', color: '#334155' }}>🎯 Personalized Career Roadmap</span>
              <span style={{ fontSize: '13px', color: '#334155' }}>✨ AI-Identified Skill Gaps</span>
              <span style={{ fontSize: '13px', color: '#334155' }}>📚 AI-Powered Learning Path</span>
              <span style={{ fontSize: '13px', color: '#334155' }}>⚡ Earn 100 Credit Points</span>
              <span style={{ fontSize: '13px', color: '#334155' }}>🔥 Start Your Daily Streak</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '0 0 20px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => { setShowProfileModal(false); navigate('/student/profile'); }}
                style={{ padding: '13px 24px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', border: 'none', borderRadius: '24px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Start My Career Journey
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{ padding: '8px 24px', background: 'none', border: 'none', color: '#94A3B8', fontSize: '13px', fontWeight: 400, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Greeting + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
          Hi {firstName}, Welcome Back!
        </h1>
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '24px', padding: '3px', gap: '2px' }}>
          {(['home', 'calendar'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 20px', borderRadius: '20px', border: 'none',
              background: tab === t ? '#4F46E5' : 'transparent',
              color: tab === t ? '#fff' : '#64748B',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              textTransform: 'capitalize',
            }}>
              {t === 'home' ? 'Home' : 'My Calendar'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'calendar' && (() => {
        const allEvents = [...DUMMY_EVENTS, ...bookingEvents];
        const rangeStart = weekDays[0];
        const rangeEnd   = weekDays[6];
        const fmt = (d: Date) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        const now = new Date();
        const nowHour = now.getHours();
        const todayDayIdx = (now.getDay() + 6) % 7;
        const isCurrentWeek = weekOffset === 0;

        return (
          <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span style={{ fontSize: '16px', fontWeight: 700, color: TEXT }}>{fmt(rangeStart)} – {fmt(rangeEnd).split(' ').slice(0).join(' ')}</span>
                <span style={{ marginLeft: '14px', fontSize: '12px', color: SUB }}>
                  {now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setWeekOffset(w => w - 1)} style={{ width: 32, height: 32, border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={16} color={SUB} />
                </button>
                <button onClick={() => setWeekOffset(w => w + 1)} style={{ width: 32, height: 32, border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={16} color={SUB} />
                </button>
              </div>
            </div>

            {/* Grid */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '900px' }}>
                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', borderBottom: `1px solid ${BORDER}` }}>
                  <div />
                  {weekDays.map((d, i) => {
                    const isToday = isCurrentWeek && i === todayDayIdx;
                    return (
                      <div key={i} style={{ padding: '10px 0', textAlign: 'center', borderLeft: `1px solid ${BORDER}` }}>
                        <div style={{ fontSize: '11px', color: isToday ? '#3F41D1' : SUB, fontWeight: 500 }}>{DAY_NAMES[i]}</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: isToday ? '#3F41D1' : TEXT, lineHeight: 1.3 }}>{d.getDate()}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Hour rows */}
                {HOURS.map(hour => {
                  const label = hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
                  const isCurrentHour = isCurrentWeek && hour === nowHour;
                  return (
                    <div key={hour} style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', borderBottom: `1px solid #F8FAFC`, minHeight: '56px', position: 'relative' }}>
                      <div style={{ padding: '4px 10px 0', fontSize: '11px', color: '#94A3B8', textAlign: 'right', paddingTop: '6px' }}>{label}</div>
                      {weekDays.map((_, di) => {
                        const cellEvents = allEvents.filter(e => e.dayIdx === di && e.hour === hour);
                        const isToday = isCurrentWeek && di === todayDayIdx;
                        return (
                          <div key={di} style={{ borderLeft: `1px solid ${BORDER}`, padding: '3px 4px', position: 'relative', background: isToday && isCurrentHour ? '#FAFBFF' : undefined, minHeight: '56px' }}>
                            {isToday && isCurrentHour && (
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#3F41D1' }} />
                            )}
                            {cellEvents.map((ev, ei) => (
                              <div key={ei} style={{ background: ev.color, borderLeft: `3px solid ${ev.textColor}`, borderRadius: '4px', padding: '4px 6px', marginBottom: '2px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: ev.textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                                <div style={{ fontSize: '10px', color: ev.textColor, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.sub}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {tab === 'home' && <>

      {/* Row 2: Aspiration banner + stats card */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>

        {/* Aspiration Tracker */}
        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', height: '240px', cursor: 'pointer' }}
          onClick={() => navigate('/student/aspiration')}>
          <img src="/aspiration_tracker.png" alt="My Aspiration Tracker" style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', borderRadius: '16px' }} />
        </div>

        {/* Stats card */}
        <div style={{
          width: '300px', height: '240px', background: '#fff', borderRadius: '16px',
          border: '1px solid #E2E8F0', padding: '20px', flexShrink: 0, boxSizing: 'border-box',
        }}>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#F97316', margin: '0 0 4px' }}>🔥 5 Day Streak</p>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Maintain The Streak For Next 2 Weeks To Become{' '}
              <span style={{ color: '#F97316', fontWeight: 700 }}>CONSISTENCY CHAMP</span>
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: '0 0 2px' }}>⚡ 58</p>
              <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Credit Points</p>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: '0 0 2px' }}>🏆 4</p>
              <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Skills Achieved</p>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 6px' }}>
            You're 75% Done! Just 4 Modules Left To Earn{' '}
            <span style={{ color: '#4F46E5', fontWeight: 600 }}>10 Points</span>
          </p>
          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '75%', height: '100%', background: '#22C55E', borderRadius: '4px' }} />
          </div>
        </div>
      </div>

      {/* Stats + Activity */}
      {(() => {
        const stats = [
          { label: 'Jobs Applied',        value: 12, bg: '#EEF2FF', color: '#3F41D1' },
          { label: 'Internships Applied', value: 4,  bg: '#F0FDF4', color: '#16A34A' },
          { label: 'Offers Received',     value: 2,  bg: '#DCFCE7', color: '#16A34A' },
          { label: 'Shortlisted',         value: 7,  bg: '#FFF7ED', color: '#EA580C' },
        ];
        const pipeline = [
          { stage: 'Applied', count: 16 },
          { stage: 'Shortlisted', count: 7 },
          { stage: 'Interviewed', count: 4 },
          { stage: 'Offered', count: 2 },
        ];
        const maxCount = 16;
        const recentApps = [
          { company: 'TCS',       role: 'Software Engineer',    date: '18 Jun 2025', stage: 'Shortlisted', stageBg: '#FFF7ED', stageCol: '#EA580C' },
          { company: 'Wipro',     role: 'Associate Engineer',   date: '15 Jun 2025', stage: 'Under Review', stageBg: '#EEF2FF', stageCol: '#3F41D1' },
          { company: 'Infosys',   role: 'Systems Engineer',     date: '10 Jun 2025', stage: 'Offered',      stageBg: '#DCFCE7', stageCol: '#16A34A' },
          { company: 'HCL Tech',  role: 'Full Stack Intern',    date: '05 Jun 2025', stage: 'Rejected',     stageBg: '#FEE2E2', stageCol: '#DC2626' },
        ];
        const pipelineColors = ['#3F41D1', '#6366F1', '#F59E0B', '#22C55E'];
        return (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
              {stats.map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px' }}>
                  <p style={{ fontSize: '26px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>{s.value}</p>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{s.label}</p>
                  <div style={{ marginTop: '10px', height: '3px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${(s.value / 16) * 100}%`, height: '100%', background: s.color, borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pipeline + Recent Apps */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '24px' }}>

              {/* Application Pipeline */}
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: '0 0 14px' }}>Application Pipeline</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pipeline.map((p, i) => (
                    <div key={p.stage}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                        <span>{p.stage}</span>
                        <span style={{ fontWeight: 600, color: '#1E293B' }}>{p.count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round((p.count / maxCount) * 100)}%`, height: '100%', background: pipelineColors[i], borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Applications */}
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: '0 0 14px' }}>Recent Applications</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      {['Company', 'Role', 'Applied On', 'Status'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#94A3B8', fontWeight: 500, fontSize: '11px', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentApps.map((a, i) => (
                      <tr key={i}>
                        <td style={{ padding: '9px 10px', fontWeight: 600, color: '#1E293B', borderBottom: '1px solid #F8FAFC' }}>{a.company}</td>
                        <td style={{ padding: '9px 10px', color: '#64748B', borderBottom: '1px solid #F8FAFC' }}>{a.role}</td>
                        <td style={{ padding: '9px 10px', color: '#64748B', borderBottom: '1px solid #F8FAFC' }}>{a.date}</td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid #F8FAFC' }}>
                          <span style={{ background: a.stageBg, color: a.stageCol, padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>{a.stage}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      })()}

      {/* Row 3: My Courses */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: 0 }}>My Courses</h2>
        <button onClick={() => navigate('/student/courses')} style={{
          background: 'none', border: 'none', color: '#4F46E5', fontSize: '13px',
          fontWeight: 500, cursor: 'pointer',
        }}>Browse More</button>
      </div>

      {(() => {
        const displayCourses = courses.length > 0 ? courses.slice(0, 3) : [
          { id: 1, title: 'Full Stack Web Development',     instructor: 'Rahul Sharma',   progress: 68, duration: '40 hrs', rating: 4.5, enrollmentDate: '01 Jan 2025', startDate: '10 Jan 2025' },
          { id: 2, title: 'Data Science with Python',       instructor: 'Anjali Mehta',   progress: 35, duration: '32 hrs', rating: 4.7, enrollmentDate: '15 Feb 2025', startDate: '20 Feb 2025' },
          { id: 3, title: 'System Design Fundamentals',     instructor: 'Vikram Nair',    progress: 10, duration: '24 hrs', rating: 4.3, enrollmentDate: '01 Mar 2025', startDate: '05 Mar 2025' },
        ] as CourseItem[];
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {displayCourses.map((c, i) => (
          <div key={c.id} style={{
            background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0',
            overflow: 'hidden', cursor: 'pointer',
          }}>
            <div style={{
              height: '160px', background: GRADIENTS[i % 3],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', margin: '0 0 12px', lineHeight: 1.4 }}>{c.title}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '10px', fontSize: '11px', color: '#64748B' }}>
                <span>Enrolment Course</span>
                <span style={{ color: '#4F46E5', textAlign: 'right' }}>{c.enrollmentDate ?? '—'}</span>
                <span>Course Start</span>
                <span style={{ color: '#4F46E5', textAlign: 'right' }}>{c.startDate ?? '—'}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                  <span>Progress</span><span>{c.progress}%</span>
                </div>
                <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${c.progress}%`, height: '100%', background: '#22C55E', borderRadius: '4px' }} />
                </div>
              </div>
              <button style={{
                width: '100%', padding: '9px', border: '1.5px solid #4F46E5', borderRadius: '8px',
                background: 'transparent', color: '#4F46E5', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                {c.progress > 0 ? 'Continue' : 'Start Now'}
              </button>
            </div>
          </div>
        ))}
          </div>
        );
      })()}

      {/* Course Progress */}
      {(() => {
        const subjects = [
          { code: 'CS601', name: 'Data Structures & Algorithms', credits: 4, semester: 'Sem 6', totalModules: 12 },
          { code: 'CS602', name: 'Database Management Systems',  credits: 3, semester: 'Sem 6', totalModules: 11 },
          { code: 'CS603', name: 'Computer Networks',            credits: 4, semester: 'Sem 6', totalModules: 10 },
          { code: 'CS604', name: 'Software Engineering',         credits: 3, semester: 'Sem 6', totalModules: 13 },
          { code: 'CS605', name: 'Operating Systems',            credits: 4, semester: 'Sem 6', totalModules: 12 },
          { code: 'CS606', name: 'Compiler Design',              credits: 3, semester: 'Sem 6', totalModules: 9  },
        ];
        const progressPcts = [0.75, 0.55, 0.20, 0.85, 1.0, 0.0];
        const statusMap: Record<string, [string, string]> = {
          'Completed':    ['#DCFCE7', '#16A34A'],
          'In Progress':  ['#EEF2FF', '#3F41D1'],
          'Just Started': ['#FFF7ED', '#EA580C'],
          'Not Started':  ['#F1F5F9', SUB],
        };
        return (
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: 0 }}>Course Progress</h2>
              <span style={{ fontSize: '12px', color: SUB }}>Current Semester</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
              {subjects.map((sub: any, i: number) => {
                const color = COURSE_COLORS[i % COURSE_COLORS.length];
                const totalModules = sub.totalModules ?? 8;
                const doneModules = Math.max(0, Math.round(totalModules * progressPcts[i % progressPcts.length]));
                const pct = totalModules > 0 ? Math.round((doneModules / totalModules) * 100) : 0;
                const statusLabel = pct === 100 ? 'Completed' : pct === 0 ? 'Not Started' : pct < 30 ? 'Just Started' : 'In Progress';
                const [sBg, sCol] = statusMap[statusLabel];
                return (
                  <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', position: 'relative', overflow: 'hidden', background: pct === 0 ? '#FAFAFA' : '#fff' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color, borderRadius: '12px 12px 0 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '.5px' }}>{sub.code ?? `SUBJ-${i + 1}`}</span>
                      <span style={{ background: sBg, color: sCol, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>{statusLabel}</span>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: pct === 0 ? '#94A3B8' : TEXT, margin: '0 0 2px', lineHeight: 1.3 }}>{sub.name}</p>
                    <p style={{ fontSize: '11px', color: SUB, margin: '0 0 12px' }}>{sub.credits ? `${sub.credits} Credits` : ''}{sub.semester ? ` · ${sub.semester}` : ''}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CircleProgress pct={pct} color={color} />
                      <div>
                        <p style={{ fontSize: '12px', color: SUB, margin: '0 0 2px' }}>{doneModules} / {totalModules} modules</p>
                        <p style={{ fontSize: '11px', color: pct === 100 ? '#16A34A' : color, fontWeight: 600, margin: 0 }}>
                          {pct === 100 ? 'All done' : `${totalModules - doneModules} pending`}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', height: '4px', background: BORDER, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      </>}
    </div>
  );
}
