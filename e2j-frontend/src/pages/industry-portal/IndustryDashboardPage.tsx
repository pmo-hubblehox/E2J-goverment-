import { useEffect, useState } from 'react';
import { Briefcase, GraduationCap, Users, Filter, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#212121';
const SUB     = '#666666';
const BG      = '#F8FAFC';

const TABS = ['Jobs', 'Candidates', 'SME'];

function StatCard({ icon: Icon, value, label, color = SUB }: { icon: React.ElementType; value: string | number; label: string; color?: string }) {
  return (
    <div style={{ flex: '1 1 200px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Icon size={28} color={color} strokeWidth={1.5} />
      <div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: TEXT }}>{value}</div>
        <div style={{ fontSize: '13px', color: SUB }}>{label}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{title}</span>
        {extra}
      </div>
      {children}
    </div>
  );
}

// ── Static sample data ─────────────────────────────────────────────────────

const TOP_JOBS = [
  { name: 'Software Engineer',  applications: 48 },
  { name: 'Data Analyst',       applications: 35 },
  { name: 'AI/ML Engineer',     applications: 29 },
  { name: 'Frontend Developer', applications: 22 },
  { name: 'DevOps Engineer',    applications: 14 },
];

const TOP_INTERNSHIPS = [
  { name: 'React Intern',         applications: 31 },
  { name: 'Data Science Intern',  applications: 27 },
  { name: 'Backend Intern',       applications: 19 },
  { name: 'UI/UX Intern',         applications: 15 },
  { name: 'QA Intern',            applications: 10 },
];

const FUNNEL_DATA = [
  { stage: 'Applied',      count: 148 },
  { stage: 'Shortlisted',  count: 62 },
  { stage: 'Interview R1', count: 34 },
  { stage: 'Interview R2', count: 18 },
  { stage: 'Offered',      count: 9  },
];

const APPS_OVER_TIME = [
  { month: 'Jan', applications: 18 },
  { month: 'Feb', applications: 24 },
  { month: 'Mar', applications: 31 },
  { month: 'Apr', applications: 27 },
  { month: 'May', applications: 42 },
  { month: 'Jun', applications: 38 },
];

const TOP_SKILLS = [
  { skill: 'React.js',     count: 42 },
  { skill: 'Python',       count: 38 },
  { skill: 'SQL',          count: 34 },
  { skill: 'Java',         count: 27 },
  { skill: 'Node.js',      count: 21 },
];

const GENDER_DATA = [
  { name: 'Male',   value: 62, color: PRIMARY },
  { name: 'Female', value: 35, color: '#EC4899' },
  { name: 'Other',  value: 3,  color: '#94A3B8' },
];

const RESUME_DATA = [
  { label: 'Excellent', pct: 18, color: '#16A34A' },
  { label: 'Good',      pct: 41, color: PRIMARY },
  { label: 'Average',   pct: 30, color: '#F59E0B' },
  { label: 'Weak',      pct: 11, color: '#EF4444' },
];

const SME_AVAILABILITY = [
  { name: 'Cloud Architecture', available: 3, booked: 2 },
  { name: 'System Design',      available: 4, booked: 4 },
  { name: 'DevOps & CI/CD',     available: 2, booked: 1 },
  { name: 'Frontend Mastery',   available: 5, booked: 3 },
];

const SESSION_STATUS = [
  { name: 'Completed', value: 14, color: '#16A34A' },
  { name: 'Upcoming',  value: 7,  color: PRIMARY },
  { name: 'Cancelled', value: 2,  color: '#EF4444' },
];

const SME_UTILIZATION = [
  { month: 'Jan', sessions: 3 },
  { month: 'Feb', sessions: 5 },
  { month: 'Mar', sessions: 4 },
  { month: 'Apr', sessions: 7 },
  { month: 'May', sessions: 6 },
  { month: 'Jun', sessions: 9 },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function IndustryDashboardPage() {
  const [tab, setTab]       = useState('Jobs');
  const [summary, setSummary] = useState<Record<string, any>>({});

  useEffect(() => {
    api.get('/industry-portal/dashboard')
      .then(res => setSummary(res.data?.data ?? {}))
      .catch(() => {});
  }, []);

  const totalJobs       = (summary.totalJobs        || summary.publishedJobs) || 8;
  const totalInterns    = summary.totalInternships   || 3;
  const campusInvites   = summary.totalCampusInvites || 2;
  const totalSme        = summary.totalSme           || SAMPLE_SME_COUNT;

  return (
    <div style={{ padding: '24px', background: BG, minHeight: '100%' }}>
      {/* Tab bar + filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: '100px', overflow: 'hidden', background: '#fff' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 24px', background: tab === t ? '#EEEEFF' : '#fff', color: tab === t ? PRIMARY : TEXT, border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? 600 : 400, borderRadius: tab === t ? '100px' : 0 }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT }}>
          <Filter size={14} /> Filter
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT }}>
          Current Month <ChevronDown size={14} />
        </button>
      </div>

      {/* ── JOBS TAB ── */}
      {tab === 'Jobs' && (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
            <StatCard icon={Briefcase}     value={totalJobs}     label="Jobs Posted"          color={PRIMARY} />
            <StatCard icon={GraduationCap} value={totalInterns}  label="Internships Posted"   color="#16A34A" />
            <StatCard icon={Users}         value={campusInvites} label="Campus Invites Sent"  color="#EA580C" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>

            <ChartCard title="Top 5 Jobs">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={TOP_JOBS} layout="vertical" barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: SUB }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
                  <Bar dataKey="applications" fill={PRIMARY} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top 5 Internships">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={TOP_INTERNSHIPS} layout="vertical" barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: SUB }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
                  <Bar dataKey="applications" fill="#16A34A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Recruitment Funnel">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={FUNNEL_DATA} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
                  <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Applications Over Time">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={APPS_OVER_TIME} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
                <Bar dataKey="applications" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}

      {/* ── CANDIDATES TAB ── */}
      {tab === 'Candidates' && (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
            <StatCard icon={Users} value={148}   label="Candidates Applied"               color={PRIMARY} />
            <StatCard icon={Users} value="1 : 3" label="Candidate Qualification Ratio"    color="#16A34A" />
            <StatCard icon={Users} value="0.74"  label="Skill Match Index"                color="#EA580C" />
          </div>

          <ChartCard title="Candidates Applied" extra={
            <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', border: `1px solid ${BORDER}`, borderRadius: '6px', background: '#fff', fontSize: '12px', cursor: 'pointer' }}>
              Location <ChevronDown size={12} />
            </button>
          }>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={APPS_OVER_TIME} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
                <Bar dataKey="applications" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>

            <ChartCard title="Top 5 Skills In Applicant Pool">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {TOP_SKILLS.map(s => (
                  <div key={s.skill}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: SUB, marginBottom: '4px' }}>
                      <span>{s.skill}</span><span style={{ fontWeight: 600, color: TEXT }}>{s.count}</span>
                    </div>
                    <div style={{ height: '6px', background: BORDER, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((s.count / 42) * 100)}%`, height: '100%', background: PRIMARY, borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Gender Ratio">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={GENDER_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {GENDER_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Resume Quality Spectrum">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                {RESUME_DATA.map(r => (
                  <div key={r.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: SUB, marginBottom: '4px' }}>
                      <span>{r.label}</span><span style={{ fontWeight: 600, color: TEXT }}>{r.pct}%</span>
                    </div>
                    <div style={{ height: '8px', background: BORDER, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </>
      )}

      {/* ── SME TAB ── */}
      {tab === 'SME' && (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
            <StatCard icon={GraduationCap} value={totalSme} label="Total SMEs"              color={PRIMARY} />
            <StatCard icon={Briefcase}     value={14}       label="Sessions Completed"      color="#16A34A" />
            <StatCard icon={Users}         value={7}        label="Upcoming Sessions"       color="#EA580C" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

            <ChartCard title="SME Availability">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={SME_AVAILABILITY} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
                  <Bar dataKey="available" fill="#C7D2FE" radius={[4, 4, 0, 0]} name="Available" />
                  <Bar dataKey="booked"    fill={PRIMARY} radius={[4, 4, 0, 0]} name="Booked" />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Session Status">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={SESSION_STATUS} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {SESSION_STATUS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="SME Utilization">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SME_UTILIZATION} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
                <Bar dataKey="sessions" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </div>
  );
}

const SAMPLE_SME_COUNT = 3;
