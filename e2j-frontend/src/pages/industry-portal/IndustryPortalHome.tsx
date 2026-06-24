import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Building2, BookOpen, Calendar, Clock, MapPin, Link2, CheckSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#1E293B';
const SUB     = '#64748B';
const BG      = '#F8FAFC';

const card: React.CSSProperties = { background: '#fff', borderRadius: '14px', border: `1px solid ${BORDER}`, padding: '20px' };

function InfoRow({ icon: Icon, value, truncate }: { icon: React.ElementType; value: string; truncate?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Icon size={12} color={PRIMARY} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: TEXT, overflow: truncate ? 'hidden' : undefined, textOverflow: truncate ? 'ellipsis' : undefined, whiteSpace: truncate ? 'nowrap' : undefined }}>{value}</span>
    </div>
  );
}

function EventCard({ id, name, sub, date, time, mode, link, round, person }: { id: string; name: string; sub: string; date: string; time: string; mode: string; link: string; round: string; person: string }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
      <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>{id}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT, marginBottom: '1px' }}>{name}</div>
      <div style={{ fontSize: '12px', color: SUB, marginBottom: '10px' }}>{sub}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 14px' }}>
        <InfoRow icon={Calendar} value={date} />
        <InfoRow icon={Clock} value={time} />
        <InfoRow icon={MapPin} value={mode} />
        <InfoRow icon={Link2} value={link} truncate />
        <InfoRow icon={CheckSquare} value={round} />
        <InfoRow icon={Users} value={person} />
      </div>
    </div>
  );
}

const SAMPLE_INTERVIEWS = [
  { id: 'JID 83650396', name: 'Arun Ahuja',   role: 'Software Engineer',    date: '28 Jun 2026', time: '10:00 - 11:00', mode: 'Online',  link: 'meet.google.com/ohs-mxp', round: 'Interview - Round 1', person: 'Mrs. Aparna Raut' },
  { id: 'JID 83650397', name: 'Kinjal Busa',  role: 'Data Analyst',         date: '28 Jun 2026', time: '12:00 - 13:00', mode: 'Online',  link: 'meet.google.com/yzk-qrt', round: 'Interview - Round 1', person: 'Mr. Abhinav Kumar' },
  { id: 'JID 83650398', name: 'Rohan Mehta',  role: 'AI/ML Engineer',       date: '30 Jun 2026', time: '14:00 - 15:00', mode: 'Offline', link: 'Sector 5, Andheri East',  round: 'Interview - Round 2', person: 'Ms. Priya Desai' },
];
const SAMPLE_CAMPUS = [
  { id: 'RQ 86446', name: 'Prestige Institute of Technology', program: 'Software Engineer · AI ML Engineer', date: '02 Jul 2026', time: '10:00 - 13:00', mode: 'Online',  link: 'meet.google.com/abc-def', round: 'Aptitude + Interview', person: 'Mrs. Aparna Raut' },
  { id: 'RQ 86447', name: 'NMIMS Mumbai',                     program: 'Data Analyst · Business Analyst',   date: '07 Jul 2026', time: '09:00 - 12:00', mode: 'Offline', link: 'NMIMS Campus, Vile Parle',  round: 'Group Discussion + HR', person: 'Mr. Abhinav Kumar' },
];
const SAMPLE_SME = [
  { id: 'ID 45673', name: 'Cloud Architecture Fundamentals', expert: 'Amrita Kapadia',  date: '29 Jun 2026', time: '13:00 - 14:00', mode: 'Online',  link: 'meet.google.com/xyz-smq', round: 'Session 1 of 3', person: 'Mrs. Aparna Raut' },
  { id: 'ID 45674', name: 'System Design for Interviews',    expert: 'Vikram Nair',     date: '01 Jul 2026', time: '15:00 - 16:00', mode: 'Online',  link: 'meet.google.com/pqr-tub', round: 'Session 2 of 4', person: 'Mr. Abhinav Kumar' },
  { id: 'ID 45675', name: 'DevOps & CI/CD Pipelines',        expert: 'Sonal Verma',     date: '03 Jul 2026', time: '11:00 - 12:00', mode: 'Offline', link: 'TechHub, Powai',          round: 'Session 1 of 2', person: 'Ms. Priya Desai' },
];
const SAMPLE_VENUES = [
  { id: 'VN 10234', institute: 'Prestige Institute of Technology', venue: 'Conference Hall A', date: '28 Jun 2026', time: '09:00 - 13:00', capacity: '80', status: 'Confirmed' },
  { id: 'VN 10235', institute: 'NMIMS Mumbai',                     venue: 'Seminar Room 2',   date: '30 Jun 2026', time: '10:00 - 12:00', capacity: '40', status: 'Pending'   },
  { id: 'VN 10236', institute: 'Symbiosis Institute',              venue: 'Auditorium',        date: '05 Jul 2026', time: '09:00 - 17:00', capacity: '300', status: 'Confirmed' },
];

export default function IndustryPortalHome() {
  const navigate  = useNavigate();
  const user      = useAuthStore(s => s.user);
  const [summary, setSummary]       = useState<Record<string, any>>({});
  const [jobs, setJobs]             = useState<any[]>([]);
  const [campusInvites, setCampus]  = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/industry-portal/dashboard'),
      api.get('/industry-portal/jobs').catch(() => ({ data: { data: [] } })),
      api.get('/industry-portal/campus').catch(() => ({ data: { data: [] } })),
    ]).then(([dashRes, jobRes, campusRes]) => {
      setSummary(dashRes.data?.data ?? {});
      const j = jobRes.data?.data?.content ?? jobRes.data?.data ?? [];
      setJobs(Array.isArray(j) ? j.slice(0, 4) : []);
      const c = campusRes.data?.data?.content ?? campusRes.data?.data ?? [];
      setCampus(Array.isArray(c) ? c.slice(0, 3) : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Active Jobs',    value: (summary.publishedJobs    || summary.totalJobs)    || 8,  icon: Briefcase, bg: '#EEF2FF', color: PRIMARY },
    { label: 'Internships',    value: summary.totalInternships  || 3,                           icon: BookOpen,  bg: '#F0FDF4', color: '#16A34A' },
    { label: 'Campus Invites', value: summary.totalCampusInvites || SAMPLE_CAMPUS.length,       icon: Building2, bg: '#FFF7ED', color: '#EA580C' },
    { label: 'SME Sessions',   value: summary.totalSme          || SAMPLE_SME.length,           icon: Users,     bg: '#FAF5FF', color: '#7C3AED' },
  ];

  const SAMPLE_JOBS = [
    { jobRole: 'Software Engineer',   postingType: 'Full Time',   location: 'Mumbai',    status: 'PUBLISHED' },
    { jobRole: 'Data Analyst',        postingType: 'Full Time',   location: 'Bangalore', status: 'PUBLISHED' },
    { jobRole: 'AI/ML Engineer',      postingType: 'Full Time',   location: 'Hyderabad', status: 'PUBLISHED' },
    { jobRole: 'Frontend Developer',  postingType: 'Internship',  location: 'Remote',    status: 'PUBLISHED' },
  ];
  const displayJobs = jobs.length > 0 ? jobs : SAMPLE_JOBS;

  const driveData = [
    { stage: 'Sent',      count: SAMPLE_CAMPUS.length },
    { stage: 'Accepted',  count: 1 },
    { stage: 'Scheduled', count: 1 },
    { stage: 'Completed', count: 0 },
  ];

  if (loading) return <div style={{ padding: 32, color: SUB, fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ padding: '24px 28px', background: BG, minHeight: '100%' }}>

      {/* Welcome */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>
          {user?.name ?? 'Industry Partner'} — Dashboard
        </h2>
        <p style={{ fontSize: '13px', color: SUB, margin: 0 }}>Overview of your jobs, campus drives, and upcoming activity.</p>
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

      {/* Jobs + Campus drive pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>

        {/* Active Jobs */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: 0 }}>Active Job Postings</p>
            <button onClick={() => navigate('/industry-portal/jobs')}
              style={{ border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', padding: '5px 14px', fontSize: '12px', color: SUB, cursor: 'pointer' }}>
              View All
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Role', 'Type', 'Location', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#94A3B8', fontWeight: 500, fontSize: '12px', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayJobs.map((j: any, i: number) => (
                  <tr key={i}>
                    <td style={{ padding: '10px', fontWeight: 600, color: TEXT, borderBottom: `1px solid #F8FAFC` }}>{j.jobRole ?? j.title ?? '—'}</td>
                    <td style={{ padding: '10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{j.postingType ?? j.type ?? '—'}</td>
                    <td style={{ padding: '10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{j.location ?? j.city ?? '—'}</td>
                    <td style={{ padding: '10px', borderBottom: `1px solid #F8FAFC` }}>
                      <span style={{ background: j.status === 'PUBLISHED' ? '#DCFCE7' : '#FFF7ED', color: j.status === 'PUBLISHED' ? '#16A34A' : '#EA580C', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>
                        {j.status ?? 'DRAFT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>

        {/* Campus Drive Pipeline */}
        <div style={card}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 14px' }}>Campus Drive Pipeline</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={driveData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
              <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Three event columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '20px' }}>

        {/* Upcoming Interviews */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{SAMPLE_INTERVIEWS.length}</div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: 0 }}>Upcoming Interviews</p>
          </div>
          {SAMPLE_INTERVIEWS.map((item, i) => (
            <EventCard key={i} id={item.id} name={item.name} sub={item.role} date={item.date} time={item.time} mode={item.mode} link={item.link} round={item.round} person={item.person} />
          ))}
        </div>

        {/* Campus Recruitment */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{SAMPLE_CAMPUS.length}</div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: 0 }}>Campus Recruitment</p>
          </div>
          {SAMPLE_CAMPUS.map((item, i) => (
            <EventCard key={i} id={item.id} name={item.name} sub={item.program} date={item.date} time={item.time} mode={item.mode} link={item.link} round={item.round} person={item.person} />
          ))}
        </div>

        {/* SME Sessions */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{SAMPLE_SME.length}</div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: 0 }}>Upcoming SME Sessions</p>
          </div>
          {SAMPLE_SME.map((item, i) => (
            <EventCard key={i} id={item.id} name={item.name} sub={item.expert} date={item.date} time={item.time} mode={item.mode} link={item.link} round={item.round} person={item.person} />
          ))}
        </div>

      </div>

      {/* Venue Bookings */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: 0 }}>Venue Bookings</p>
          <span style={{ fontSize: '12px', color: SUB }}>{SAMPLE_VENUES.length} bookings</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {['Booking ID', 'Institute', 'Venue', 'Date', 'Time', 'Capacity', 'Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#94A3B8', fontWeight: 500, fontSize: '11px', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_VENUES.map((v, i) => (
              <tr key={i}>
                <td style={{ padding: '9px 10px', color: SUB, fontSize: '11px', borderBottom: `1px solid #F8FAFC` }}>{v.id}</td>
                <td style={{ padding: '9px 10px', fontWeight: 600, color: TEXT, borderBottom: `1px solid #F8FAFC` }}>{v.institute}</td>
                <td style={{ padding: '9px 10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{v.venue}</td>
                <td style={{ padding: '9px 10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{v.date}</td>
                <td style={{ padding: '9px 10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{v.time}</td>
                <td style={{ padding: '9px 10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{v.capacity} seats</td>
                <td style={{ padding: '9px 10px', borderBottom: `1px solid #F8FAFC` }}>
                  <span style={{ background: v.status === 'Confirmed' ? '#DCFCE7' : '#FFF7ED', color: v.status === 'Confirmed' ? '#16A34A' : '#EA580C', padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>{v.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
