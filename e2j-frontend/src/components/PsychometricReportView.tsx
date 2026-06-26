import { useState } from 'react';
import { Download } from 'lucide-react';
import api from '../services/api';

const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#212121';
const SUB     = '#666666';
const BG      = '#F8F9FA';

export const CATEGORY_NAMES: Record<string, string> = {
  R: 'Realistic', I: 'Investigative', A: 'Artistic',
  S: 'Social',    E: 'Enterprising',  C: 'Conventional',
};
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  R: { bg: '#EFF6FF', text: '#1D4ED8', bar: '#3B82F6' },
  I: { bg: '#EEF2FF', text: '#3730A3', bar: '#3F41D1' },
  A: { bg: '#FDF4FF', text: '#7E22CE', bar: '#A855F7' },
  S: { bg: '#F0FDF4', text: '#15803D', bar: '#22C55E' },
  E: { bg: '#FFF7ED', text: '#C2410C', bar: '#F97316' },
  C: { bg: '#F8FAFC', text: '#475569', bar: '#94A3B8' },
};

const CATEGORY_DETAIL: Record<string, { trait: string; emoji: string; strength: string; ifYouChoose: string }> = {
  R: { trait: 'The Builder', emoji: '🔧', strength: 'You like working with your hands, tools, machines, or the outdoors. You are practical, grounded, and prefer concrete results over abstract concepts.', ifYouChoose: 'You will work on real, tangible things — hardware, infrastructure, or physical systems. Your work has immediate, visible impact.' },
  I: { trait: 'The Thinker', emoji: '🔬', strength: 'You are drawn to analysing, researching, and solving complex problems. You enjoy understanding how and why things work, and you prefer logic over intuition.', ifYouChoose: 'You will spend your days deep in data, code, or research. You will be respected for your analytical depth and your ability to make sense of complexity.' },
  A: { trait: 'The Creator', emoji: '🎨', strength: 'You have a strong aesthetic sensibility and imagination. You think differently, connect unrelated ideas, and thrive when given creative freedom.', ifYouChoose: 'Your work will involve shaping experiences, building brands, or designing products. Your uniqueness will be your competitive edge.' },
  S: { trait: 'The Helper', emoji: '🤝', strength: 'You are energised by people. You communicate well, empathise easily, and you want your work to have a positive impact on others.', ifYouChoose: 'You will be the bridge between people and technology or between teams. You will thrive in roles where relationship-building is a core skill.' },
  E: { trait: 'The Leader', emoji: '🚀', strength: 'You are persuasive, ambitious, and goal-oriented. You enjoy starting things, influencing others, and taking on challenges that others avoid.', ifYouChoose: 'You will gravitate toward leadership, business development, or growth roles. Your drive will take you further than technical skill alone.' },
  C: { trait: 'The Organiser', emoji: '📊', strength: 'You excel at structure, accuracy, and following through on processes. You are reliable, detail-oriented, and you bring order to complexity.', ifYouChoose: 'You will be the person who ensures things are done right. Systems, data integrity, and process improvement will be your domain.' },
};

const CAREER_DETAIL: Record<string, { why: string; dayInLife: string; growth: string }> = {
  'Data Scientist':             { why: 'Your investigative mindset and enterprising drive make you perfect for data science — where you need both the curiosity to find insights and the confidence to act on them.', dayInLife: 'You will clean and analyse datasets, build predictive models, create visualisations, and present findings to stakeholders to drive business decisions.', growth: 'Data Analyst → Data Scientist → Senior Data Scientist → Lead / Head of Data.' },
  'AI/ML Engineer':             { why: 'Your investigative depth and enterprising ambition are exactly what AI/ML engineering demands — you need to understand complex systems and push them forward.', dayInLife: 'You will design and train machine learning models, evaluate their performance, integrate them into products, and continuously optimise for accuracy and speed.', growth: 'ML Engineer → Senior ML Engineer → ML Lead → AI Research Scientist / Director of AI.' },
  'Product Manager':            { why: 'Combining your investigative analytical side with enterprising leadership, you have the rare ability to understand both the technical and business dimensions of a product.', dayInLife: 'You will define product strategy, write user stories, prioritise features, work closely with engineering and design, and measure success through metrics.', growth: 'Associate PM → Product Manager → Senior PM → Group PM → VP of Product.' },
  'Software Architect':         { why: 'Your analytical investigative mindset and enterprising drive to lead solutions make you a natural software architect — someone who thinks in systems, not just code.', dayInLife: 'You will define technical standards, review architecture decisions, guide engineering teams on design patterns, and ensure systems scale reliably.', growth: 'Senior Developer → Tech Lead → Software Architect → Principal Architect → CTO.' },
  'Technical Founder':          { why: 'You combine deep technical investigation with the enterprising drive to build something from scratch — the exact combination that great technical founders share.', dayInLife: 'You will build your product\'s core systems, make critical technology choices, hire early engineers, raise capital, and grow a company from zero.', growth: 'Technical Founder → CTO → Serial Entrepreneur / Investor.' },
  'UI/UX Designer':             { why: 'Your artistic sensibility blended with investigative curiosity about human behaviour makes you a strong UX designer — you design with empathy and validate with data.', dayInLife: 'You will conduct user research, create wireframes and prototypes, run usability tests, and collaborate with engineers to deliver great digital experiences.', growth: 'Junior Designer → UI/UX Designer → Senior Designer → Design Lead → Head of Design.' },
  'Frontend Developer':         { why: 'The combination of your artistic eye for visual detail and investigative drive to understand how browsers and code work makes you an ideal frontend developer.', dayInLife: 'You will build responsive, performant web interfaces using HTML, CSS, and JavaScript frameworks. You\'ll collaborate with designers and backend engineers daily.', growth: 'Junior Dev → Frontend Developer → Senior Frontend → Frontend Architect / Tech Lead.' },
  'Creative Technologist':      { why: 'Your artistic imagination combined with investigative technical depth lets you sit at the intersection of creativity and engineering — a rare and valuable combination.', dayInLife: 'You will prototype interactive experiences, experiment with emerging technologies, collaborate with creatives and engineers, and push the boundaries of what\'s possible.', growth: 'Creative Technologist → Senior Creative Technologist → Director of Innovation / Chief Creative Officer.' },
  'Game Developer':             { why: 'Your artistic creativity and investigative technical ability converge perfectly in game development — you need both to build worlds that are immersive and technically robust.', dayInLife: 'You will design game mechanics, write game logic, implement visual effects, optimise performance, and work with artists and designers to ship great experiences.', growth: 'Junior Game Dev → Game Developer → Senior Game Developer → Lead Designer → Studio Director.' },
  'Multimedia Engineer':        { why: 'Blending artistic creativity with investigative technical problem-solving, you are built for multimedia engineering where you create and optimise rich digital media experiences.', dayInLife: 'You will build streaming systems, implement video/audio processing, work with codecs and compression, and integrate media pipelines into products.', growth: 'Multimedia Developer → Multimedia Engineer → Senior Engineer → Media Platform Lead.' },
  'Database Administrator':     { why: 'Your investigative analytical mind and conventional preference for structure and accuracy make database administration a natural fit.', dayInLife: 'You will design and maintain databases, optimise query performance, manage backups, monitor health, and ensure data integrity across systems.', growth: 'Junior DBA → Database Administrator → Senior DBA → Data Platform Engineer → Data Architect.' },
  'Software Tester/QA Engineer':{ why: 'Your investigative curiosity to understand how things break, combined with your conventional need for thoroughness and process, makes you an excellent QA engineer.', dayInLife: 'You will write and execute test cases, file and track bugs, build automated test suites, and work with developers to ship higher-quality software.', growth: 'Manual Tester → Automation Engineer → QA Lead → SDET → Engineering Manager.' },
  'Systems Analyst':            { why: 'Combining investigative analytical thinking with conventional attention to structured processes, you are a natural systems analyst who bridges business needs and technical solutions.', dayInLife: 'You will gather requirements, map business processes, model data flows, recommend system improvements, and help teams implement new technology solutions.', growth: 'Junior Analyst → Systems Analyst → Senior Analyst → IT Manager → Enterprise Architect.' },
  'IT Auditor':                 { why: 'Your investigative eye for detail and conventional preference for standards, compliance, and accuracy make you well-suited for IT auditing.', dayInLife: 'You will review IT controls, assess security policies, test for compliance, document findings, and recommend improvements to reduce risk.', growth: 'IT Auditor → Senior Auditor → IT Audit Manager → Director of Risk & Compliance → CISO.' },
  'Compliance Analyst':         { why: 'Combining your investigative approach to understanding complex regulations and your conventional precision in applying them makes compliance analysis a natural strength.', dayInLife: 'You will review company policies against regulatory requirements, document gaps, propose remediation plans, and train teams on compliance obligations.', growth: 'Compliance Analyst → Senior Analyst → Compliance Manager → Chief Compliance Officer.' },
  'Creative Director':          { why: 'Your artistic vision combined with your enterprising drive to lead teams and influence outcomes makes you a natural creative director.', dayInLife: 'You will set the creative vision for campaigns and products, direct designers, review and critique creative outputs, and align creative with business strategy.', growth: 'Designer → Art Director → Creative Director → VP of Creative / Chief Creative Officer.' },
  'Brand Strategist':           { why: 'Blending artistic sensibility with enterprising business acumen, you understand both the emotional power of a brand and how it drives commercial results.', dayInLife: 'You will develop brand identities, conduct market research, define brand voice and messaging, and align branding with business objectives.', growth: 'Brand Coordinator → Brand Strategist → Brand Manager → Head of Brand → CMO.' },
  'Marketing Technologist':     { why: 'Your artistic creativity and enterprising drive to generate results make you a strong marketing technologist who can both create compelling campaigns and measure their impact.', dayInLife: 'You will manage marketing tools and automation, build campaigns, analyse performance data, optimise funnels, and drive growth through data-backed creativity.', growth: 'Marketing Analyst → Marketing Technologist → Marketing Manager → VP Marketing → CMO.' },
  'UX Strategist':              { why: 'The combination of artistic design thinking and enterprising business orientation makes you a UX strategist who connects user needs to business outcomes.', dayInLife: 'You will conduct user research, define UX strategy, align design direction with business goals, and bridge the gap between product design and company growth.', growth: 'UX Researcher → UX Strategist → Senior UX Lead → Director of UX.' },
  'Growth Hacker':              { why: 'Your artistic creative thinking combined with an enterprising hunger for results makes you an effective growth hacker — someone who experiments fast and scales what works.', dayInLife: 'You will run A/B tests, analyse user funnels, design viral loops, optimise onboarding, and experiment across channels to drive user acquisition and retention.', growth: 'Growth Analyst → Growth Hacker → Growth Lead → VP Growth.' },
  'Project Manager':            { why: 'Your enterprising leadership drive and conventional love of structure make you a strong project manager — you set ambitious goals and ensure they are delivered on time.', dayInLife: 'You will plan project timelines, coordinate teams, track milestones, manage risks, and communicate progress to stakeholders across the organisation.', growth: 'Project Coordinator → Project Manager → Senior PM → Programme Manager → PMO Lead.' },
  'Operations Manager':         { why: 'Combining enterprising goal-orientation with conventional process discipline, you are built for operations management — achieving business outcomes through structured execution.', dayInLife: 'You will oversee day-to-day operations, manage teams and vendors, optimise processes, and report on performance metrics to leadership.', growth: 'Operations Analyst → Operations Manager → Senior Ops Manager → VP Operations → COO.' },
  'IT Manager':                 { why: 'Your enterprising confidence and conventional love of structure make you an effective IT manager who can lead technical teams while ensuring systems run reliably.', dayInLife: 'You will manage IT infrastructure, lead a team of engineers, set technology standards, handle vendor relationships, and plan IT strategy.', growth: 'IT Support → Systems Administrator → IT Manager → IT Director → CTO.' },
  'Business Analyst':           { why: 'Your enterprising ability to understand the big picture combined with your conventional analytical precision makes you an excellent business analyst.', dayInLife: 'You will gather requirements, map processes, build business cases, analyse data, and work with technology teams to deliver solutions that drive business value.', growth: 'Junior BA → Business Analyst → Senior BA → Product Manager / Strategy Lead.' },
  'Finance Technology Analyst': { why: 'Combining enterprising commercial instincts with conventional financial precision, you can translate between the worlds of finance and technology — a rare and valuable skill.', dayInLife: 'You will analyse financial data, build models, work with fintech systems, support business decisions, and bridge finance teams and technology teams.', growth: 'Finance Analyst → FinTech Analyst → Finance Technology Manager → CFO / FinTech Lead.' },
  'IT Support Engineer':        { why: 'Your social empathy and conventional systematic problem-solving make you a great IT support engineer — someone who is patient, methodical, and genuinely helpful.', dayInLife: 'You will troubleshoot hardware and software issues, answer helpdesk queries, escalate complex problems, maintain assets, and document solutions.', growth: 'IT Support Specialist → IT Support Engineer → Senior Support → IT Manager.' },
  'Technical Trainer':          { why: 'Combining social communication strength with conventional love of structured learning, you are a natural trainer who can take complex technical topics and make them accessible.', dayInLife: 'You will design training programmes, deliver workshops and webinars, create learning materials, and assess learner progress across technical topics.', growth: 'Trainer → Senior Trainer → Training Manager → Learning & Development Director.' },
  'Customer Success Manager':   { why: 'Your social relationship-building skills and conventional ability to manage processes and follow-ups make you an excellent customer success manager.', dayInLife: 'You will onboard new customers, run business reviews, track health metrics, handle escalations, and work with product teams to ensure customers achieve their goals.', growth: 'CSM → Senior CSM → CS Team Lead → VP Customer Success.' },
  'ERP Consultant':             { why: 'Combining social client-facing confidence with conventional systems thinking, you can understand complex business processes and translate them into ERP configurations.', dayInLife: 'You will gather client requirements, configure ERP modules, train end users, manage go-lives, and provide post-implementation support.', growth: 'ERP Analyst → ERP Consultant → Senior Consultant → ERP Project Manager → Practice Lead.' },
  'Help Desk Manager':          { why: 'Your social leadership ability and conventional preference for process and SLA management make you a strong help desk manager who builds reliable support operations.', dayInLife: 'You will manage a team of support agents, set SLAs, monitor ticket queues, escalate issues, report on KPIs, and continuously improve support processes.', growth: 'Help Desk Agent → Senior Agent → Help Desk Manager → IT Operations Manager.' },
  'Network Engineer':           { why: 'Your realistic hands-on ability and conventional attention to structured configuration and documentation make you well-suited for network engineering.', dayInLife: 'You will design and configure routers, switches, and firewalls; monitor network performance; troubleshoot connectivity issues; and plan capacity upgrades.', growth: 'Network Technician → Network Engineer → Senior Network Engineer → Network Architect.' },
  'IT Systems Administrator':   { why: 'Your realistic technical mindset and conventional preference for maintaining stable, well-documented systems make you a natural systems administrator.', dayInLife: 'You will maintain servers, manage user accounts, handle backups, apply patches, monitor system health, and respond to infrastructure incidents.', growth: 'Junior SysAdmin → IT Systems Administrator → Senior SysAdmin → Infrastructure Engineer → IT Manager.' },
  'Cloud Support Associate':    { why: 'Combining realistic technical ability with conventional process discipline, you excel at understanding cloud infrastructure and helping teams use it effectively.', dayInLife: 'You will troubleshoot cloud workloads, assist teams with deployments, write documentation, manage access policies, and monitor cloud cost and usage.', growth: 'Cloud Support Associate → Cloud Engineer → Senior Cloud Engineer → Cloud Architect.' },
  'Automation Engineer':        { why: 'Combining realistic systems thinking with conventional preference for process repeatability, you are built for automation engineering.', dayInLife: 'You will build automation scripts and frameworks, reduce manual toil, implement CI/CD tools, and maintain infrastructure-as-code.', growth: 'QA/DevOps Engineer → Automation Engineer → Senior Automation Engineer → Principal Engineer.' },
  'Security Analyst':           { why: 'Your realistic, hands-on mindset and conventional attention to structured protocols are the two pillars of a great security analyst.', dayInLife: 'You will monitor systems for threats, analyse security logs, investigate incidents, patch vulnerabilities, and help build a stronger security posture.', growth: 'Security Analyst → Senior Analyst → Security Engineer → CISO / Head of Security.' },
  'Technical Support Engineer': { why: 'Bridging social communication with realistic technical depth, you are someone who both understands the problem and can fix it.', dayInLife: 'You will diagnose technical issues for customers, reproduce bugs, work with engineering teams, and guide users through complex technical resolutions.', growth: 'Support Engineer → Senior Support Engineer → Technical Account Manager → Engineering Manager.' },
  'Field Application Engineer': { why: 'Your social confidence and hands-on technical ability make you ideal for field application engineering, where you bring technology to life for customers.', dayInLife: 'You will demonstrate products at customer sites, provide technical guidance during integration, and support sales with technical expertise.', growth: 'Application Engineer → Field Application Engineer → Senior FAE → Technical Sales Director.' },
  'IT Consultant':              { why: 'Your social skills enable you to understand client needs clearly, while your technical foundations allow you to propose solutions that actually work.', dayInLife: 'You will assess client IT environments, recommend solutions, manage technology projects, and ensure implementations meet business objectives.', growth: 'IT Analyst → IT Consultant → Senior Consultant → IT Director / Practice Lead.' },
  'Systems Integrator':         { why: 'Combining social collaboration skills with realistic systems thinking, you are equipped to connect disparate technologies into cohesive solutions.', dayInLife: 'You will design integration architectures, connect APIs and data sources, test end-to-end workflows, and support clients through deployment.', growth: 'Integration Developer → Systems Integrator → Senior Integrator → Solutions Architect.' },
};

export interface PsychReport {
  id?: number;
  topInterests: string;
  topCareerMatch: string;
  totalScore: number;
  scores: Record<string, number>;
  recommendedPaths: string[];
  createdAt?: string;
  counsellorComment?: string;
  counsellorName?: string;
  commentedAt?: string;
}

interface Props {
  report: PsychReport;
  /** bookingId — if provided, shows counsellor comment box */
  bookingId?: number;
  /** If true the current user IS the counsellor and can write comments */
  isCounsellor?: boolean;
  /** Called after a comment is saved so parent can refresh */
  onCommentSaved?: () => void;
}

export default function PsychometricReportView({ report, bookingId, isCounsellor, onCommentSaved }: Props) {
  const r = report;
  const scores = r.scores ?? {};
  const paths: string[] = r.recommendedPaths ?? [];
  const sortedCats = Object.entries(scores).sort(([, a], [, b]) => (b as number) - (a as number));
  const [[top1Cat, top1Score], [top2Cat, top2Score]] = sortedCats.length >= 2 ? sortedCats : [['I', 0], ['E', 0]];
  const totalPossible = Object.keys(scores).length * 25;
  const pct = totalPossible > 0 ? Math.round(((r.totalScore ?? 0) / totalPossible) * 100) : 0;
  const top1Detail  = CATEGORY_DETAIL[top1Cat as string];
  const top2Detail  = CATEGORY_DETAIL[top2Cat as string];
  const top1Color   = CATEGORY_COLORS[top1Cat as string] ?? CATEGORY_COLORS['I'];
  const top2Color   = CATEGORY_COLORS[top2Cat as string] ?? CATEGORY_COLORS['C'];

  const [comment, setComment] = useState(r.counsellorComment ?? '');
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const saveComment = async () => {
    if (!bookingId || !comment.trim()) return;
    setSaving(true); setSaveMsg('');
    try {
      await api.post(`/counsellor/bookings/${bookingId}/report-comment`, { comment });
      setSaveMsg('Comment saved and emailed to student.');
      onCommentSaved?.();
    } catch {
      setSaveMsg('Failed to save comment.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>Career Interest Report</h2>
          <p style={{ fontSize: '13px', color: SUB }}>Score: {r.totalScore} / {totalPossible} &nbsp;·&nbsp; {pct >= 80 ? '🔥 Excellent clarity' : pct >= 60 ? '✨ Good clarity' : '📊 Building clarity'}
            {r.createdAt && <> &nbsp;·&nbsp; {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
          </p>
        </div>
        <button onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: `1px solid ${BORDER}`, borderRadius: '100px', background: '#fff', color: SUB, fontSize: '12px', cursor: 'pointer' }}>
          <Download size={13} /> Print / Download
        </button>
      </div>

      {/* Scores + Paths */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '4px' }}>Interest Scores</div>
          <div style={{ fontSize: '11.5px', color: SUB, marginBottom: '18px' }}>Your score across the 6 RIASEC interest categories</div>
          {sortedCats.map(([cat, score], idx) => {
            const col = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['C'];
            const s = score as number;
            const p2 = Math.round((s / 25) * 100);
            const lvl = s >= 20 ? 'Very Strong' : s >= 16 ? 'Strong' : s >= 12 ? 'Moderate' : 'Developing';
            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '108px', fontSize: '12px', fontWeight: 600, color: TEXT, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {CATEGORY_NAMES[cat]}{idx < 2 && <span style={{ fontSize: '10px' }}>⭐</span>}
                </div>
                <div style={{ flex: 1, background: '#F1F5F9', borderRadius: '100px', height: '8px' }}>
                  <div style={{ width: `${p2}%`, height: '8px', borderRadius: '100px', background: col.bar }} />
                </div>
                <div style={{ width: '40px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: col.bar, flexShrink: 0 }}>{s}/25</div>
                <div style={{ width: '72px', textAlign: 'right', fontSize: '10px', fontWeight: 600, color: idx < 2 ? col.bar : '#94A3B8', flexShrink: 0 }}>{lvl}</div>
              </div>
            );
          })}
          <div style={{ fontSize: '11px', color: SUB, marginTop: '6px', paddingTop: '14px', borderTop: `1px solid ${BORDER}` }}>⭐ marks your top interest categories.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '12px' }}>Strongest Areas</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {r.topInterests?.split(',').map((t: string) => {
                const cat = Object.entries(CATEGORY_NAMES).find(([, v]) => v === t.trim())?.[0] ?? 'I';
                const col = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['I'];
                return <span key={t} style={{ padding: '5px 14px', borderRadius: '100px', background: col.bg, color: col.text, fontSize: '12px', fontWeight: 600, border: `1.5px solid ${col.bar}33` }}>{t.trim()}</span>;
              })}
            </div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '20px', flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '12px' }}>Recommended Paths</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paths.map((p, i) => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: BG, borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{p}</span>
                  {i === 0 && <span style={{ fontSize: '10px', color: PRIMARY, fontWeight: 700, background: '#EEF2FF', padding: '2px 8px', borderRadius: '100px' }}>Top Match</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* What your top 2 traits say about you */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '14px' }}>What your results say about you</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {[{ cat: top1Cat, detail: top1Detail, color: top1Color, score: top1Score as number, rank: 1 },
            { cat: top2Cat, detail: top2Detail, color: top2Color, score: top2Score as number, rank: 2 }].map(({ cat, detail, color, score: s, rank }) => detail ? (
            <div key={cat} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{detail.emoji}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>#{rank} — {detail.trait}</div>
                  <div style={{ fontSize: '11px', color: color.bar, fontWeight: 600 }}>{CATEGORY_NAMES[cat as string]} · {s}/25</div>
                </div>
              </div>
              <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.7, margin: '0 0 10px' }}>{detail.strength}</p>
              <div style={{ background: color.bg, borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: color.text, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>If you pursue this path</div>
                <p style={{ fontSize: '12px', color: color.text, margin: 0, lineHeight: 1.6, opacity: 0.9 }}>{detail.ifYouChoose}</p>
              </div>
            </div>
          ) : null)}
        </div>
      </div>

      {/* Why each career path */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '14px' }}>Why these careers were recommended for you</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paths.map((path, i) => {
            const det = CAREER_DETAIL[path];
            const col = i === 0 ? top1Color : CATEGORY_COLORS['C'];
            return (
              <div key={path} style={{ background: '#fff', border: `1px solid ${i === 0 ? top1Color.bar + '55' : BORDER}`, borderRadius: '14px', padding: '20px', position: 'relative' }}>
                {i === 0 && (
                  <div style={{ position: 'absolute', top: '14px', right: '14px', background: '#EEF2FF', color: PRIMARY, fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px' }}>⭐ Top Match</div>
                )}
                <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT, marginBottom: '12px', paddingRight: i === 0 ? '80px' : '0' }}>{path}</div>
                {det ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Why it matches you</div>
                      <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.65, margin: 0 }}>{det.why}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>A day in the life</div>
                      <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.65, margin: 0 }}>{det.dayInLife}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Growth path</div>
                      <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.65, margin: 0 }}>{det.growth}</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '12.5px', color: SUB, margin: 0 }}>This path aligns with your strongest interest areas: {CATEGORY_NAMES[top1Cat as string]} and {CATEGORY_NAMES[top2Cat as string]}.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Score breakdown narrative */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '12px' }}>How we calculated your results</div>
        <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.7, margin: 0 }}>
          You answered 30 questions across 6 RIASEC interest categories (5 questions per category, max score 25 each).
          Your top two categories — <strong>{CATEGORY_NAMES[top1Cat as string]}</strong> ({top1Score as number}/25) and <strong>{CATEGORY_NAMES[top2Cat as string]}</strong> ({top2Score as number}/25) — were combined to identify the most fitting career cluster.
          {pct >= 80 ? ' Your overall score indicates strong, well-defined interests which means the recommendations above are highly reliable.' :
            pct >= 60 ? ' Your overall score indicates good self-awareness. The recommendations are reliable, though a counsellor can help you refine further.' :
              ' Your score suggests your interests are still forming — which is completely normal. A counsellor can help you explore which areas resonate most deeply.'}
        </p>
      </div>

      {/* ── Counsellor Comment Section ── */}
      {isCounsellor && bookingId ? (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '22px', marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>Add Your Review Comments</div>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: SUB }}>
            Your comments will be saved to this report and emailed to the student. They can view it anytime from their profile.
          </p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={5}
            placeholder={`e.g. Based on your results, I recommend focusing on ${paths[0] ?? 'your top match'}. Your scores suggest you thrive in analytical environments...`}
            style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: TEXT, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
          {saveMsg && (
            <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, background: saveMsg.includes('Failed') ? '#FEF2F2' : '#DCFCE7', color: saveMsg.includes('Failed') ? '#DC2626' : '#16A34A' }}>
              {saveMsg}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button onClick={saveComment} disabled={saving || !comment.trim()}
              style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: saving ? '#94A3B8' : PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Save & Send to Student'}
            </button>
          </div>
        </div>
      ) : r.counsellorComment ? (
        /* Student view — show counsellor comment if one exists */
        <div style={{ background: '#EEF2FF', border: `1.5px solid #C7D2FE`, borderRadius: '14px', padding: '22px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>💬</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>Counsellor Review</div>
              <div style={{ fontSize: '11px', color: SUB }}>
                {r.counsellorName ?? 'Your counsellor'}{r.commentedAt ? ` · ${new Date(r.commentedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#1E3A8A', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{r.counsellorComment}</p>
        </div>
      ) : null}
    </div>
  );
}
