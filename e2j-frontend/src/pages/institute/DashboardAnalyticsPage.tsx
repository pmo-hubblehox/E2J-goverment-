import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const TABS = ['Jobs', 'Students', 'Skill Gap', 'SME'] as const;
type Tab = typeof TABS[number];

const JOBS_BAR = [
  { name: 'Jan', applied: 40, offered: 20 },
  { name: 'Feb', applied: 65, offered: 35 },
  { name: 'Mar', applied: 50, offered: 28 },
  { name: 'Apr', applied: 80, offered: 45 },
  { name: 'May', applied: 72, offered: 38 },
  { name: 'Jun', applied: 90, offered: 52 },
];

const TOP_JOBS = [
  { name: 'Software Eng.', count: 92 },
  { name: 'Data Analyst', count: 78 },
  { name: 'Cloud Eng.', count: 64 },
  { name: 'DevOps', count: 55 },
  { name: 'AI/ML Eng.', count: 48 },
];

const FUNNEL = [
  { stage: 'Applied', value: 458, color: '#4F46E5' },
  { stage: 'Shortlisted', value: 312, color: '#7C3AED' },
  { stage: 'Interviewed', value: 185, color: '#0891B2' },
  { stage: 'Selected', value: 94, color: '#059669' },
  { stage: 'Offered', value: 72, color: '#16A34A' },
];

const STUDENTS_LINE = [
  { month: 'Jan', placed: 12, active: 45 },
  { month: 'Feb', placed: 18, active: 52 },
  { month: 'Mar', placed: 24, active: 48 },
  { month: 'Apr', placed: 30, active: 60 },
  { month: 'May', placed: 28, active: 55 },
  { month: 'Jun', placed: 38, active: 72 },
];

const PROGRAM_DIST = [
  { name: 'B.Tech CSE', value: 45, color: '#4F46E5' },
  { name: 'MBA', value: 20, color: '#0891B2' },
  { name: 'B.Tech ECE', value: 18, color: '#059669' },
  { name: 'Others', value: 17, color: '#D97706' },
];

const SKILL_GAP_DATA = [
  { skill: 'React', gap: 35, available: 65 },
  { skill: 'Python', gap: 25, available: 75 },
  { skill: 'Cloud', gap: 50, available: 50 },
  { skill: 'SQL', gap: 20, available: 80 },
  { skill: 'Java', gap: 40, available: 60 },
];

const SME_BAR = [
  { name: 'Jan', sessions: 4, students: 80 },
  { name: 'Feb', sessions: 6, students: 120 },
  { name: 'Mar', sessions: 5, students: 95 },
  { name: 'Apr', sessions: 8, students: 160 },
  { name: 'May', sessions: 7, students: 145 },
  { name: 'Jun', sessions: 10, students: 200 },
];

const SME_CATEGORY = [
  { name: 'Technical', value: 55, color: '#4F46E5' },
  { name: 'Soft Skills', value: 25, color: '#0891B2' },
  { name: 'Domain', value: 20, color: '#059669' },
];

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px 20px', flex: '1 1 160px' }}>
      <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, color: color ?? '#1E293B', margin: '0 0 2px' }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 22px' }}>
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', margin: '0 0 16px' }}>{title}</p>
      {children}
    </div>
  );
}

export default function DashboardAnalyticsPage() {
  const [tab, setTab] = useState<Tab>('Jobs');

  return (
    <div style={{ padding: '20px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
        <span>Home</span><span>›</span><span style={{ color: '#1E293B', fontWeight: 500 }}>Dashboard Analytics</span>
      </div>
      {/* Tab pills */}
      <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', borderRadius: '20px', padding: '3px', width: 'fit-content', marginBottom: '20px' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '7px 22px', borderRadius: '16px', fontSize: '13px', fontWeight: tab === t ? 600 : 400, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#1E293B' : '#64748B', border: 'none', cursor: 'pointer', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Jobs' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <StatCard label="Jobs Applied" value="458" sub="This academic year" />
            <StatCard label="Internships Applied" value="150" sub="This academic year" />
            <StatCard label="Offers Received" value="94" sub="This academic year" color="#16A34A" />
            <StatCard label="Placement Rate" value="72%" sub="vs 65% last year" color="#4F46E5" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <ChartCard title="Top 5 Jobs Applied">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={TOP_JOBS} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Applications Over Time">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={JOBS_BAR}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="applied" stroke="#4F46E5" strokeWidth={2} dot={false} name="Applied" />
                  <Line type="monotone" dataKey="offered" stroke="#059669" strokeWidth={2} dot={false} name="Offered" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <ChartCard title="Recruitment Funnel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px' }}>
              {FUNNEL.map(f => (
                <div key={f.stage} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '100px', fontSize: '13px', color: '#64748B', flexShrink: 0 }}>{f.stage}</span>
                  <div style={{ flex: 1, height: '28px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${(f.value / 458) * 100}%`, height: '100%', background: f.color, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>{f.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </>
      )}

      {tab === 'Students' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <StatCard label="Total Students" value="4,580" sub="Enrolled" />
            <StatCard label="Active Seekers" value="1,240" sub="Job hunting" />
            <StatCard label="Placed" value="320" sub="This year" color="#16A34A" />
            <StatCard label="Profile Completion" value="68%" sub="Avg. completeness" color="#4F46E5" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <ChartCard title="Placement Trend">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={STUDENTS_LINE}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="placed" stroke="#4F46E5" strokeWidth={2} name="Placed" />
                  <Line type="monotone" dataKey="active" stroke="#0891B2" strokeWidth={2} name="Active Seekers" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Students by Program">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={PROGRAM_DIST} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {PROGRAM_DIST.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {tab === 'Skill Gap' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <StatCard label="Skills Assessed" value="24" sub="Across programs" />
            <StatCard label="Avg. Gap Score" value="38%" sub="Industry benchmark" color="#DC2626" />
            <StatCard label="Improving Skills" value="15" sub="Month-on-month" color="#16A34A" />
            <StatCard label="Students Enrolled" value="890" sub="In skill programs" color="#4F46E5" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <ChartCard title="Skill Gap vs Availability">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={SKILL_GAP_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="available" stackId="a" fill="#4F46E5" name="Available %" />
                  <Bar dataKey="gap" stackId="a" fill="#FCA5A5" name="Gap %" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Top Skill Gaps">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
                {SKILL_GAP_DATA.map(s => (
                  <div key={s.skill} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '70px', fontSize: '13px', color: '#64748B', flexShrink: 0 }}>{s.skill}</span>
                    <div style={{ flex: 1, height: '10px', background: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${s.gap}%`, height: '100%', background: '#4F46E5', borderRadius: '5px' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748B', width: '32px', flexShrink: 0, textAlign: 'right' }}>{s.gap}%</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </>
      )}

      {tab === 'SME' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <StatCard label="SME Sessions" value="40" sub="This year" />
            <StatCard label="Students Reached" value="800" sub="Total" />
            <StatCard label="Avg. Rating" value="4.7★" sub="Out of 5" color="#D97706" />
            <StatCard label="Expert Faculty" value="18" sub="Active SMEs" color="#4F46E5" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <ChartCard title="Sessions Over Time">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={SME_BAR}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sessions" fill="#4F46E5" name="Sessions" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="students" fill="#0891B2" name="Students" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Sessions by Category">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={SME_CATEGORY} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {SME_CATEGORY.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
