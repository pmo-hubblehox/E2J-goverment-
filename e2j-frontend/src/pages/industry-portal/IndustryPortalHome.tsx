import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Link2, CheckSquare, Filter, ChevronDown } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';

interface Summary { upcomingInterviews: number; campusRecruitmentRequests: number; upcomingSmeSessions: number; totalJobs: number; totalInternships: number; totalSme: number; }

// Sample card data for each column
const SAMPLE_INTERVIEWS = [
  { id: 'JID 83650396', name: 'Arun Ahuja', role: 'Cyber Security Analyst', date: '24th April 2025', time: '13:00 - 14:00', mode: 'Online', link: 'Meet.Google.Com/Ohs-M...', round: 'Interview - Round 1', person: 'Mrs. Aparna Raut' },
  { id: 'JID 83650396', name: 'Kinjal Busa', role: 'Data Analyst', date: '24th April 2025', time: '13:00 - 14:00', mode: 'Offline', link: 'Interface 11, Malad', round: 'Interview - Round 1', person: 'Mr. Abhinav Kumar' },
];

const SAMPLE_CAMPUS = [
  { id: 'RQ 86446', name: 'NMIMS', program: 'Recruitment Drive April \'25', date: '24th April 2025', time: '13:00 - 14:00', mode: 'Online', link: 'Meet.Google.Com/Ohs-M...', round: 'Interview - Round 1', person: 'Mrs. Aparna Raut' },
  { id: 'RQ 86446', name: 'NMIMS', program: 'Recruitment Drive April \'25', date: '24th April 2025', time: '13:00 - 14:00', mode: 'Online', link: 'Meet.Google.Com/Ohs-M...', round: 'Interview - Round 1', person: 'Mrs. Aparna Raut' },
];

const SAMPLE_SME = [
  { id: 'ID 45673', name: 'UI Basics - Figma Edition', expert: 'Amrita Kapadia', date: '24th April 2025', time: '13:00 - 14:00', mode: 'Online', link: 'Meet.Google.Com/Ohs-M...', round: 'Interview - Round 1', person: 'Mrs. Aparna Raut' },
  { id: 'ID 45673', name: 'UI Basics - Figma Edition', expert: 'Amrita Kapadia', date: '24th April 2025', time: '13:00 - 14:00', mode: 'Online', link: 'Meet.Google.Com/Ohs-M...', round: 'Interview - Round 1', person: 'Mrs. Aparna Raut' },
];

function EventCard({ id, name, sub, date, time, mode, link, round, person }: { id: string; name: string; sub: string; date: string; time: string; mode: string; link: string; round: string; person: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: SUB, marginBottom: '2px' }}>{id}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT, marginBottom: '1px' }}>{name}</div>
      <div style={{ fontSize: '12px', color: SUB, marginBottom: '12px' }}>{sub}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
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

function InfoRow({ icon: Icon, value, truncate }: { icon: React.ElementType; value: string; truncate?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Icon size={13} color={SUB} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: TEXT, overflow: truncate ? 'hidden' : undefined, textOverflow: truncate ? 'ellipsis' : undefined, whiteSpace: truncate ? 'nowrap' : undefined }}>{value}</span>
    </div>
  );
}

function SummaryColumn({ title, count, items }: { title: string; count: number; items: typeof SAMPLE_INTERVIEWS }) {
  return (
    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#EEEEFF', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {count}
        </div>
        <span style={{ fontSize: '16px', fontWeight: 700, color: TEXT }}>{title}</span>
      </div>
      {items.length === 0
        ? <div style={{ textAlign: 'center', padding: '40px 16px', color: SUB, fontSize: '13px' }}>No upcoming {title.toLowerCase()}</div>
        : items.map((item, i) => (
          <EventCard key={i} id={item.id} name={item.name} sub={'sub' in item ? (item as { sub?: string }).sub ?? item.role ?? '' : (item as { role?: string }).role ?? (item as { program?: string }).program ?? (item as { expert?: string }).expert ?? ''} date={item.date} time={item.time} mode={item.mode} link={item.link} round={item.round} person={item.person} />
        ))
      }
    </div>
  );
}

export default function IndustryPortalHome() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get('/industry-portal/dashboard')
      .then(res => setSummary(res.data?.data))
      .catch(() => {});
  }, []);

  const interviewCount = summary?.upcomingInterviews ?? 0;
  const campusCount = summary?.campusRecruitmentRequests ?? 0;
  const smeCount = summary?.upcomingSmeSessions ?? 0;

  const interviewItems = interviewCount > 0 ? SAMPLE_INTERVIEWS : [];
  const campusItems = campusCount > 0 ? SAMPLE_CAMPUS : [];
  const smeItems = smeCount > 0 ? SAMPLE_SME : [];

  return (
    <div style={{ padding: '28px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: TEXT, margin: 0 }}>Summary</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', color: TEXT, cursor: 'pointer' }}>
            <Filter size={14} /> Filter
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', color: TEXT, cursor: 'pointer' }}>
            Current Month <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Three columns */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' as const }}>
        <SummaryColumn title="Upcoming Interviews" count={interviewCount} items={interviewItems} />
        <SummaryColumn title="Campus Recruitment Requests" count={campusCount} items={campusItems} />
        <SummaryColumn title="Upcoming SME Sessions" count={smeCount} items={smeItems} />
      </div>

      {/* Quick actions when all zero */}
      {interviewCount === 0 && campusCount === 0 && smeCount === 0 && (
        <div style={{ marginTop: '32px', padding: '24px', background: '#EEEEFF', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: SUB }}>Get started by posting a job or sending a campus recruitment invite.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/industry-portal/jobs/add')}
              style={{ padding: '10px 24px', borderRadius: '100px', background: PRIMARY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              + Post a Job
            </button>
            <button onClick={() => navigate('/industry-portal/campus/add')}
              style={{ padding: '10px 24px', borderRadius: '100px', background: '#fff', color: PRIMARY, border: `1px solid ${PRIMARY}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Request Campus Drive
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
