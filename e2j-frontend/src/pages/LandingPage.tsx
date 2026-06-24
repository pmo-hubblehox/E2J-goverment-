import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Star, Check, ArrowRight, Briefcase, Database, Users, Zap, ChevronRight, CalendarCheck, MessageSquare, TrendingUp, ShieldCheck } from 'lucide-react';

const ROLES = [
  { label: 'Student', loginPath: '/login/student', registerPath: '/register', icon: '🎓', active: true },
  { label: 'Institute', loginPath: '/login/institute', registerPath: '/register/institute', icon: '🏛️', active: true },
  { label: 'Industry', loginPath: '/login/industry', registerPath: '/register/industry', icon: '🏢', active: true },
  { label: 'Counsellor', loginPath: '/login/counsellor', registerPath: '/register/counsellor', icon: '🧑‍💼', active: true },
];

// ── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (path: string) => { setLoginOpen(false); navigate(path); };
  const handleSignup = (path: string) => { setSignupOpen(false); navigate(path); };

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="/logo-full.png.png" alt="HubbleHox" style={{ height: '40px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', gap: '28px' }}>
            {['Home', 'Students', 'Industry', 'Institutes', 'Counsellors', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{ fontSize: '14px', color: '#475569', textDecoration: 'none', fontWeight: 500 }}>{item}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>

            {/* Login dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setLoginOpen(p => !p); setSignupOpen(false); }}
                style={{ padding: '8px 20px', border: '1.5px solid #4F46E5', borderRadius: '24px', background: 'transparent', color: '#4F46E5', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >Login</button>
              {loginOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.13)', border: '1px solid #E2E8F0', minWidth: '200px', overflow: 'hidden', zIndex: 200 }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', padding: '12px 16px 6px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Login as</p>
                  {ROLES.map(r => (
                    <button key={r.label} onClick={() => r.active && r.loginPath && handleLogin(r.loginPath)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '11px 16px', border: 'none', background: 'transparent', cursor: r.active ? 'pointer' : 'not-allowed', fontSize: '14px', color: r.active ? '#1E293B' : '#CBD5E1', fontWeight: 500, textAlign: 'left' }}
                      onMouseEnter={e => { if (r.active) e.currentTarget.style.background = '#F1F5F9'; }}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: '18px' }}>{r.icon}</span> {r.label}
                      {!r.active && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#CBD5E1', fontWeight: 400 }}>Coming soon</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sign Up dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setSignupOpen(p => !p); setLoginOpen(false); }}
                style={{ padding: '8px 20px', border: 'none', borderRadius: '24px', background: '#EF4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >Sign Up</button>
              {signupOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.13)', border: '1px solid #E2E8F0', minWidth: '200px', overflow: 'hidden', zIndex: 200 }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', padding: '12px 16px 6px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sign up as</p>
                  {ROLES.map(r => (
                    <button key={r.label} onClick={() => r.active && r.registerPath && handleSignup(r.registerPath)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '11px 16px', border: 'none', background: 'transparent', cursor: r.active ? 'pointer' : 'not-allowed', fontSize: '14px', color: r.active ? '#1E293B' : '#CBD5E1', fontWeight: 500, textAlign: 'left' }}
                      onMouseEnter={e => { if (r.active) e.currentTarget.style.background = '#F1F5F9'; }}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: '18px' }}>{r.icon}</span> {r.label}
                      {!r.active && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#CBD5E1', fontWeight: 400 }}>Coming soon</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Click-outside overlay */}
      {(loginOpen || signupOpen) && (
        <div onClick={() => { setLoginOpen(false); setSignupOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
      )}
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate();
  return (
    <section style={{ paddingTop: '100px', paddingBottom: '60px', background: 'linear-gradient(180deg, #EEF2FF 0%, #F8FAFC 100%)', textAlign: 'center' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#1E293B', lineHeight: 1.25, margin: '0 0 16px' }}>
          Empowering Students, Enabling<br />Industry, Elevating Institutes
        </h1>
        <p style={{ fontSize: '18px', color: '#4F46E5', fontWeight: 500, margin: '0 0 40px' }}>
          The Smart Way To Learn And Hire
        </p>

        {/* 4 Role Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '48px' }}>
          {[
            { icon: '🎓', title: 'Student', desc: 'Launch Your Career With Personalised Learning Paths, Skill Tracking, And Direct Job Connections.', btn: 'Explore', anchor: 'students' },
            { icon: '🔍', title: 'Industry Partner', desc: 'Find Top Talent From Our Curated Pool Of Skilled, Job-Ready Students. Fast, Smart Hiring.', btn: 'Explore', anchor: 'industry' },
            { icon: '🏛️', title: 'Institute', desc: 'Empower Your Students With Career Tools, Track Placement Success, And Connect With Industry Leaders.', btn: 'Explore', anchor: 'institutes' },
            { icon: '🧑‍💼', title: 'Counsellor', desc: 'Share Your Expertise, Set Your Schedule, And Guide Students Toward Their Dream Careers.', btn: 'Explore', anchor: 'counsellors' },
          ].map(card => (
            <div key={card.title} style={{ background: '#fff', borderRadius: '16px', padding: '28px 20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{card.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 10px' }}>{card.title}</h3>
              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, margin: '0 0 20px' }}>{card.desc}</p>
              <button
                onClick={() => document.getElementById(card.anchor)?.scrollIntoView({ behavior: 'smooth' })}
                style={{ padding: '8px 24px', border: '1.5px solid #4F46E5', borderRadius: '24px', background: 'transparent', color: '#4F46E5', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                {card.btn}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── For Students ──────────────────────────────────────────────────────────────
function ForStudents() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Personalised Learning Curve', 'Skills Connection', 'Career Path'];

  return (
    <section id="students" style={{ padding: '72px 24px', background: '#fff' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B', textAlign: 'center', margin: '0 0 40px' }}>For Students</h2>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', background: '#F1F5F9', borderRadius: '12px', padding: '4px', width: 'fit-content', margin: '0 auto 40px' }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: activeTab === i ? '#fff' : 'transparent',
              color: activeTab === i ? '#4F46E5' : '#64748B',
              fontSize: '13px', fontWeight: activeTab === i ? 600 : 400,
              cursor: 'pointer', boxShadow: activeTab === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              whiteSpace: 'nowrap',
            }}>{t}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>
              {activeTab === 0 && 'Start Your Personalised Learning Journey'}
              {activeTab === 1 && 'Connect Your Skills To Opportunities'}
              {activeTab === 2 && 'Chart Your Dream Career Path'}
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7, margin: '0 0 24px' }}>
              {activeTab === 0 && 'Tailored to Your Goals. HubbleHox Analyses Your Background, Goals And Interests To Create A Learning Plan That Evolves With You.'}
              {activeTab === 1 && 'Bridge the gap between learning and earning. Our platform matches your skills with real industry demands and job opportunities.'}
              {activeTab === 2 && 'Visualise your journey from where you are to where you want to be. Get guided milestones and mentorship along the way.'}
            </p>
            {[
              activeTab === 0 ? ['Tailored Paths Aligned With Your Goals', 'Track Progress Any Time. Complete At Your Pace.', 'Get Full Access With Real Job Opportunities'] : [],
              activeTab === 1 ? ['Real-time skill gap analysis', 'Industry-aligned certifications', 'Direct employer connections'] : [],
              activeTab === 2 ? ['AI-powered career roadmaps', 'Mentorship from industry experts', 'Placement assistance & mock interviews'] : [],
            ][activeTab].map((pt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  <Check size={12} color="#4F46E5" strokeWidth={3} />
                </div>
                <span style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>{pt}</span>
              </div>
            ))}
          </div>

          {/* Right — visual card */}
          <div style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', borderRadius: '20px', padding: '32px', position: 'relative', minHeight: '280px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '12px', padding: '16px', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '48px' }}>🤖</span>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginTop: '60px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px' }}>Course Progress</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', margin: '0 0 10px' }}>The Complete AI Course Has Gained</p>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#FBBF24" color="#FBBF24" />)}
              </div>
              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '72%', height: '100%', background: '#4F46E5', borderRadius: '4px' }} />
              </div>
              <p style={{ fontSize: '11px', color: '#4F46E5', margin: '4px 0 0', fontWeight: 600 }}>72% Complete</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── For Industry Partner ──────────────────────────────────────────────────────
function ForIndustry() {
  const navigate = useNavigate();
  const offerings = [
    { icon: <Briefcase size={24} color="#4F46E5" />, title: 'Job Posting', desc: 'Post Jobs Directly To A Pool Of Skilled, Verified Students Ready To Join Your Team.' },
    { icon: <Database size={24} color="#4F46E5" />, title: 'Resume Database Access', desc: 'Search And Filter Thousands Of Candidate Profiles Matched To Your Requirements.' },
    { icon: <Users size={24} color="#4F46E5" />, title: 'Assisted Hiring', desc: 'Let Our Team Handle Sourcing, Screening And Shortlisting So You Focus On Interviews.' },
    { icon: <Zap size={24} color="#4F46E5" />, title: 'Career Pulse', desc: 'Get Real-time Insights On Talent Availability, Skill Trends, And Hiring Analytics.' },
  ];

  return (
    <section id="industry" style={{ padding: '72px 24px', background: '#F8FAFC' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B', textAlign: 'center', margin: '0 0 8px' }}>For Industry Partner</h2>
        <p style={{ fontSize: '15px', color: '#64748B', textAlign: 'center', margin: '0 0 48px', fontWeight: 500 }}>What We Offer</p>

        {/* 4 offering cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '48px' }}>
          {offerings.map(o => (
            <div key={o.title} style={{ background: '#fff', borderRadius: '16px', padding: '24px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                {o.icon}
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: '0 0 8px' }}>{o.title}</h4>
              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{o.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: '20px', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
              Accelerate Your Talent With Our All-In-One Hiring Tools!
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              From Job Postings To AI-Powered Matching, We Help You Build The Right Team Faster.
            </p>
          </div>
          <button
            onClick={() => navigate('/login/institute')}
            style={{ flexShrink: 0, marginLeft: '32px', padding: '12px 28px', background: '#fff', border: 'none', borderRadius: '24px', color: '#4F46E5', fontSize: '14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Explore Partnerships <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

// ── For Institutes ────────────────────────────────────────────────────────────
function ForInstitutes() {
  const features = [
    { icon: '📈', title: 'Empower Your Students With Future-Ready Skills & Initiatives' },
    { icon: '🎯', title: 'Improve Placement Outcomes With Actionable Insights' },
    { icon: '📊', title: 'Maximise Your Institute\'s Outcomes With Better Utilisation' },
    { icon: '🏆', title: 'Showcase Your Institute\'s Success Stories' },
    { icon: '👥', title: 'Build Student Onboarding' },
  ];

  return (
    <section id="institutes" style={{ padding: '72px 24px', background: '#fff' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B', textAlign: 'center', margin: '0 0 8px' }}>For Institutes</h2>
        <p style={{ fontSize: '15px', color: '#64748B', textAlign: 'center', margin: '0 0 48px' }}>Be the Benchmark Of Future-Ready Institutions</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: '#F8FAFC', borderRadius: '16px', padding: '28px 24px',
              border: '1px solid #E2E8F0', textAlign: 'center',
              gridColumn: i === 3 ? '1 / 2' : i === 4 ? '2 / 3' : 'auto',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>{f.icon}</div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', lineHeight: 1.5, margin: 0 }}>{f.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── For Counsellors ───────────────────────────────────────────────────────────
function ForCounsellors() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Manage Your Practice', 'Session Booking', 'Student Insights'];

  const features = [
    {
      icon: <CalendarCheck size={24} color="#4F46E5" />,
      title: 'Flexible Scheduling',
      desc: 'Set your available days, time slots, and session fees. Students book directly — no back-and-forth.',
    },
    {
      icon: <MessageSquare size={24} color="#4F46E5" />,
      title: 'Pre-Session Questionnaire',
      desc: 'Students answer 5 structured questions before every session so you walk in fully prepared.',
    },
    {
      icon: <TrendingUp size={24} color="#4F46E5" />,
      title: 'Build Your Reputation',
      desc: 'Showcase your education, work history, certifications, and speciality to attract the right students.',
    },
    {
      icon: <ShieldCheck size={24} color="#4F46E5" />,
      title: 'Verified Profile',
      desc: 'HubbleHox reviews and approves your profile, giving students confidence to book you with trust.',
    },
  ];

  const tabContent = [
    {
      heading: 'Run Your Counselling Practice Your Way',
      body: 'Create a complete professional profile — add your photo, speciality, years of experience, education, work history, and certifications. Set your session fee and availability once. Students discover you and book instantly.',
      points: ['Rich profile with photo, speciality & credentials', 'Set session fee & availability in minutes', 'Approved badge builds instant student trust'],
      visual: (
        <div style={{ background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)', borderRadius: '20px', padding: '28px', position: 'relative', minHeight: '260px', overflow: 'hidden' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>R</div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>Riya Sharma</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>Career & Tech Counsellor · 7 yrs</p>
              </div>
              <div style={{ marginLeft: 'auto', background: '#DCFCE7', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', color: '#16A34A', fontWeight: 600 }}>✓ Approved</div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
              {['AI/ML', 'Resume Review', 'Interview Prep'].map(s => <span key={s} style={{ fontSize: '10px', background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '20px', fontWeight: 500 }}>{s}</span>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Mon','Wed','Fri'].map(d => <div key={d} style={{ flex: 1, background: '#fff', borderRadius: '10px', padding: '10px 0', textAlign: 'center' as const, fontSize: '12px', fontWeight: 600, color: '#4F46E5', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>{d}</div>)}
          </div>
        </div>
      ),
    },
    {
      heading: 'Zero-Friction Booking For You And Students',
      body: 'Students browse your available slots and book directly — no email chains, no calendar juggling. You get a clean dashboard of upcoming sessions, each with the student\'s questionnaire answers ready to review.',
      points: ['Students pick date & time from your live slots', 'Auto-generated Google Meet link per session', 'View all bookings in one place'],
      visual: (
        <div style={{ background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', borderRadius: '20px', padding: '28px', minHeight: '260px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>UPCOMING SESSION</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>Arjun Mehta</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>Today · 3:00 PM – 4:00 PM</p>
              </div>
              <div style={{ background: '#EEF2FF', borderRadius: '8px', padding: '6px 14px', fontSize: '11px', fontWeight: 600, color: '#4F46E5', cursor: 'pointer' }}>Join Meet</div>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>PRE-SESSION QUESTIONNAIRE</p>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#1E293B' }}><b>Goal:</b> Transition from QA to Product role</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#1E293B' }}><b>Challenge:</b> Lacks product management experience</p>
          </div>
        </div>
      ),
    },
    {
      heading: 'Understand Every Student Before The Session',
      body: 'Before confirming their session, every student answers 5 questions about their interests, career goals, target industry, current skills, and biggest challenges. You arrive informed, sessions are focused, and students get more value.',
      points: ['5 structured pre-session questions answered by student', 'Review answers before the session starts', 'More productive, goal-oriented conversations'],
      visual: (
        <div style={{ background: 'linear-gradient(135deg,#FFF7ED,#FEF3C7)', borderRadius: '20px', padding: '28px', minHeight: '260px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>STUDENT ANSWERS</p>
            {[
              { q: 'Interests', a: 'Data Science, Product Strategy' },
              { q: 'Career Goal', a: 'Lead a product team at a tech startup' },
              { q: 'Target Industry', a: 'Fintech & SaaS' },
              { q: 'Current Skills', a: 'Python, SQL, Agile basics' },
              { q: 'Biggest Challenge', a: 'No PM work experience or portfolio' },
            ].map(({ q, a }) => (
              <div key={q} style={{ marginBottom: '10px' }}>
                <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' as const }}>{q}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#1E293B' }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const active = tabContent[activeTab];

  return (
    <section id="counsellors" style={{ padding: '72px 24px', background: '#F8FAFC' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B', textAlign: 'center', margin: '0 0 8px' }}>For Counsellors</h2>
        <p style={{ fontSize: '15px', color: '#64748B', textAlign: 'center', margin: '0 0 40px', fontWeight: 500 }}>Guide The Next Generation. On Your Terms.</p>

        {/* 4 feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '56px' }}>
          {features.map(f => (
            <div key={f.title} style={{ background: '#fff', borderRadius: '16px', padding: '24px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                {f.icon}
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: '0 0 8px' }}>{f.title}</h4>
              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', background: '#F1F5F9', borderRadius: '12px', padding: '4px', width: 'fit-content', margin: '0 auto 40px' }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: activeTab === i ? '#fff' : 'transparent',
              color: activeTab === i ? '#4F46E5' : '#64748B',
              fontSize: '13px', fontWeight: activeTab === i ? 600 : 400,
              cursor: 'pointer', boxShadow: activeTab === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              whiteSpace: 'nowrap' as const,
            }}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', marginBottom: '56px' }}>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>{active.heading}</h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7, margin: '0 0 24px' }}>{active.body}</p>
            {active.points.map((pt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  <Check size={12} color="#4F46E5" strokeWidth={3} />
                </div>
                <span style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>{pt}</span>
              </div>
            ))}
          </div>
          <div>{active.visual}</div>
        </div>

        {/* CTA banner */}
        <div style={{ background: 'linear-gradient(135deg, #3F41D1 0%, #7C3AED 100%)', borderRadius: '20px', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
              Ready To Start Your Counselling Journey?
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              Join HubbleHox, build your profile, set your schedule, and start making an impact today.
            </p>
          </div>
          <button
            onClick={() => navigate('/register/counsellor')}
            style={{ flexShrink: 0, marginLeft: '32px', padding: '12px 28px', background: '#fff', border: 'none', borderRadius: '24px', color: '#3F41D1', fontSize: '14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Join As Counsellor <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
function Testimonials() {
  const testimonials = [
    { text: 'The Platform Has Been An Incredible Tool For Us In Tracking Our Students\' Progress And Connecting Them With Relevant Industry Opportunities.', name: 'Aria Martinez', role: 'Institute Head', stars: 5 },
    { text: 'The Platform Has Been An Incredible App To Join In Connect With Top-Tier Graduates That Match Exactly What We\'re Looking For In Our Hiring.', name: 'Manas Jee', role: 'HR Manager', stars: 5 },
    { text: 'Growing With The Platform In The Of Industry Connections Has Been A Game-Changer For My Career Growth And Learning Journey.', name: 'Dr. Thomas Owen', role: 'Faculty Member', stars: 5 },
  ];

  return (
    <section style={{ padding: '72px 24px', background: '#F8FAFC' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B', textAlign: 'center', margin: '0 0 48px' }}>Testimonials</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
                {Array.from({ length: t.stars }).map((_, s) => <Star key={s} size={16} fill="#FBBF24" color="#FBBF24" />)}
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, margin: '0 0 20px', fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>
                  {t.name[0]}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', margin: 0 }}>{t.name}</p>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{ background: '#1E293B', padding: '56px 24px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '48px' }}>
          {/* Brand */}
          <div>
            <img src="/logo-full.png.png" alt="HubbleHox" style={{ height: '44px', objectFit: 'contain', marginBottom: '16px' }} />
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.7, margin: '0 0 20px', maxWidth: '280px' }}>
              Empowering students, enabling industry and elevating institutes through smart education-to-job pathways.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* Social icons */}
              {[
                { label: 'f', bg: '#1877F2' },
                { label: 'in', bg: '#0A66C2' },
                { label: 'yt', bg: '#FF0000' },
                { label: '📸', bg: '#E4405F' },
              ].map(s => (
                <div key={s.label} style={{ width: '32px', height: '32px', borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Who We Are */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Who We Are</h4>
            {['About Us', 'Our Team', 'Careers', 'Press', 'Contact'].map(l => (
              <p key={l} style={{ margin: '0 0 10px' }}>
                <a href="#" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}>{l}</a>
              </p>
            ))}
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Quick Links</h4>
            {['For Students', 'For Industry', 'For Institutes', 'Courses', 'Jobs'].map(l => (
              <p key={l} style={{ margin: '0 0 10px' }}>
                <a href="#" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}>{l}</a>
              </p>
            ))}
          </div>

          {/* Downloads */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Downloads</h4>
            {['App Store', 'Google Play', 'Brochure', 'Media Kit'].map(l => (
              <p key={l} style={{ margin: '0 0 10px' }}>
                <a href="#" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}>{l}</a>
              </p>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #334155', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Copyright 2026 © HubbleHox. All Rights Reserved.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy Policy', 'Terms of Service'].map(l => (
              <a key={l} href="#" style={{ fontSize: '12px', color: '#64748B', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Navbar />
      <Hero />
      <ForStudents />
      <ForIndustry />
      <ForInstitutes />
      <ForCounsellors />
      <Testimonials />
      <Footer />
    </div>
  );
}
