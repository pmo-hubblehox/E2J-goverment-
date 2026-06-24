import { useEffect, useState } from 'react';
import { Briefcase, GraduationCap, Users, Filter, ChevronDown } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';

const TABS = ['Jobs', 'Candidates', 'SME'];

interface Summary { totalJobs: number; publishedJobs: number; totalInternships: number; totalSme: number; totalCampusInvites: number; }

function NoData() {
  return <div style={{ padding: '40px', textAlign: 'center', color: '#CBD5E1', fontSize: '13px' }}>No data yet</div>;
}

function StatCard({ icon: Icon, value, label, trend }: { icon: React.ElementType; value: string | number; label: string; trend?: string }) {
  return (
    <div style={{ flex: '1 1 200px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Icon size={28} color={SUB} strokeWidth={1.5} />
      <div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: TEXT }}>{value}</div>
        <div style={{ fontSize: '13px', color: SUB }}>{label}</div>
        {trend && <div style={{ fontSize: '12px', color: PRIMARY, fontWeight: 500, marginTop: '2px' }}>{trend}</div>}
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

export default function IndustryDashboardPage() {
  const [tab, setTab] = useState('Jobs');
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get('/industry-portal/dashboard')
      .then(res => setSummary(res.data?.data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: '100px', overflow: 'hidden' }}>
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

      {/* Jobs tab */}
      {tab === 'Jobs' && (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
            <StatCard icon={Briefcase} value={summary?.totalJobs ?? 0} label="Jobs Posted" trend={undefined} />
            <StatCard icon={GraduationCap} value={summary?.totalInternships ?? 0} label="Internships Posted" trend={undefined} />
            <StatCard icon={Users} value={summary?.totalCampusInvites ?? 0} label="Campus Invites Sent" trend={undefined} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <ChartCard title="Top 5 Jobs"><NoData /></ChartCard>
            <ChartCard title="Top 5 Internships"><NoData /></ChartCard>
            <ChartCard title="Recruitment Funnel"><NoData /></ChartCard>
          </div>
          <ChartCard title="Applications Over Time"><NoData /></ChartCard>
        </>
      )}

      {/* Candidates tab */}
      {tab === 'Candidates' && (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
            <StatCard icon={Users} value="0" label="Candidates Applied" trend={undefined} />
            <StatCard icon={Users} value="1:3" label="Candidate Qualification Ratio" trend={undefined} />
            <StatCard icon={Users} value="0.6" label="Skill Match Index" trend={undefined} />
          </div>
          <ChartCard title="Candidates Applied" extra={
            <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', border: `1px solid ${BORDER}`, borderRadius: '6px', background: '#fff', fontSize: '12px', cursor: 'pointer' }}>
              Location <ChevronDown size={12} />
            </button>
          }>
            <div style={{ padding: '40px', textAlign: 'center', color: SUB, fontSize: '13px' }}>
              Candidate application data will appear here once candidates start applying to your jobs.
            </div>
          </ChartCard>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <ChartCard title="Top 5 Skills In Applicant Pool">
              <div style={{ padding: '20px', textAlign: 'center', color: '#CBD5E1', fontSize: '13px' }}>No data yet</div>
            </ChartCard>
            <ChartCard title="Gender Ratio"><NoData /></ChartCard>
            <ChartCard title="Resume Quality Spectrum">
              <div style={{ padding: '20px', textAlign: 'center', color: '#CBD5E1', fontSize: '13px' }}>No data yet</div>
            </ChartCard>
          </div>
        </>
      )}

      {/* SME tab */}
      {tab === 'SME' && (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
            <StatCard icon={GraduationCap} value={summary?.totalSme ?? 0} label="Total SME's" trend={undefined} />
            <StatCard icon={Briefcase} value="0" label="Total Sessions Completed" trend={undefined} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <ChartCard title="SME Availability"><NoData /></ChartCard>
            <ChartCard title="Session Status"><NoData /></ChartCard>
          </div>
          <ChartCard title="SME Utilization"><NoData /></ChartCard>
        </>
      )}
    </div>
  );
}
