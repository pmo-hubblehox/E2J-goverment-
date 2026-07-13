import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom';
import {
  Home, Briefcase, Users, BookOpen, Trophy, GraduationCap,
  LayoutDashboard, User, FileText, Settings, LogOut,
  Bell, ChevronDown, ChevronRight, KeyRound, HelpCircle, Building2, CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ChangePasswordModal, HelpCenterModal } from '../components/ProfileModals';

const PRIMARY = '#3F41D1';
const ACTIVE_BG = '#4338CA';

interface SubItem { label: string; to: string }
interface NavItem { label: string; icon: React.ElementType; to: string; subItems?: SubItem[] }

const NAV: NavItem[] = [
  { label: 'Home', icon: Home, to: '/industry-portal' },
  {
    label: 'Job Mana...', icon: Briefcase, to: '/industry-portal/jobs',
    subItems: [
      { label: 'Job Listing', to: '/industry-portal/jobs' },
      { label: 'Interview', to: '/industry-portal/interviews' },
    ],
  },
  { label: 'Candidat...', icon: Users, to: '/industry-portal/candidates' },
  { label: 'Resume...', icon: BookOpen, to: '/industry-portal/resumes' },
  { label: 'Campus...', icon: Trophy, to: '/industry-portal/campus' },
  { label: 'SME Listing', icon: GraduationCap, to: '/industry-portal/sme' },
  { label: 'Workshops', icon: CalendarCheck, to: '/industry-portal/workshops' },
  { label: 'Venues', icon: Building2, to: '/industry-portal/venues' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/industry-portal/dashboard' },
  { label: 'Profile', icon: User, to: '/industry-portal/profile' },
  { label: 'Reports', icon: FileText, to: '/industry-portal/reports' },
];

const BREADCRUMB: Record<string, { parent: string; title: string }> = {
  '/industry-portal':               { parent: 'Home', title: 'Home' },
  '/industry-portal/jobs':          { parent: 'Home > Job Management', title: 'Job Listing' },
  '/industry-portal/jobs/add':      { parent: 'Home > Job Listing', title: 'Add Job' },
  '/industry-portal/internships/add': { parent: 'Home > Job Listing', title: 'Add Internship' },
  '/industry-portal/interviews':    { parent: 'Home > Job Management', title: 'Interview' },
  '/industry-portal/candidates':    { parent: 'Home', title: 'Candidate Management' },
  '/industry-portal/resumes':       { parent: 'Home', title: 'Resume Database' },
  '/industry-portal/campus':        { parent: 'Home', title: 'Campus Recruitment' },
  '/industry-portal/campus/add':    { parent: 'Home > Campus Recruitment', title: 'Send Invite' },
  '/industry-portal/sme':           { parent: 'Home > SME', title: 'SME' },
  '/industry-portal/sme/add':       { parent: 'Home > SME Listing', title: 'Add SME' },
  '/industry-portal/venues':        { parent: 'Home', title: 'Venue Management' },
  '/industry-portal/dashboard':     { parent: 'Home', title: 'Dashboard' },
  '/industry-portal/profile':       { parent: 'Home', title: 'Profile' },
  '/industry-portal/reports':       { parent: 'Home', title: 'Reports' },
};

export default function IndustryApprovedLayout() {
  const { isAuthenticated, user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [flyout, setFlyout] = useState<NavItem | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!isAuthenticated || !user) return <Navigate to="/" replace />;

  const initials = user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const firstName = user.name.split(' ')[0];

  // Find best breadcrumb match
  let crumb = BREADCRUMB[location.pathname] ?? { parent: 'Home', title: 'Page' };
  if (!BREADCRUMB[location.pathname]) {
    const match = Object.keys(BREADCRUMB)
      .filter(k => location.pathname.startsWith(k) && k !== '/industry-portal')
      .sort((a, b) => b.length - a.length)[0];
    if (match) crumb = BREADCRUMB[match];
  }

  const isNavActive = (item: NavItem): boolean => {
    if (item.subItems) return item.subItems.some(s => location.pathname.startsWith(s.to));
    if (item.to === '/industry-portal') return location.pathname === '/industry-portal';
    return location.pathname.startsWith(item.to);
  };

  const handleNav = (item: NavItem) => {
    if (item.subItems) {
      setFlyout(prev => prev?.to === item.to ? null : item);
    } else {
      setFlyout(null);
      navigate(item.to);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: '80px', height: '100%', background: '#fff', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 20 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px', borderBottom: '1px solid #E2E8F0' }}>
          <img src="/logo-icon.png.png" alt="HubbleHox" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          {NAV.map(item => {
            const active = isNavActive(item);
            return (
              <button key={item.to} onClick={() => handleNav(item)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '56px', padding: '8px 4px', borderRadius: '12px', background: active ? ACTIVE_BG : 'transparent', color: active ? '#fff' : '#64748B', border: 'none', cursor: 'pointer' }}>
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontSize: '9px', fontWeight: 500, marginTop: '3px', textAlign: 'center', lineHeight: 1.2, maxWidth: '52px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
                {item.subItems && <ChevronRight size={8} style={{ marginTop: '1px' }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid #E2E8F0', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <button onClick={() => navigate('/industry-portal/profile')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '56px', padding: '8px 4px', borderRadius: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Settings size={20} strokeWidth={1.8} />
            <span style={{ fontSize: '9px', fontWeight: 500, marginTop: '3px' }}>Setting</span>
          </button>
          <button onClick={() => { clearAuth(); navigate('/'); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '56px', padding: '8px 4px', borderRadius: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={20} strokeWidth={1.8} />
            <span style={{ fontSize: '9px', fontWeight: 500, marginTop: '3px' }}>Logout</span>
          </button>
        </div>
      </div>

      {/* Flyout submenu */}
      {flyout?.subItems && (
        <>
          <div onClick={() => setFlyout(null)} style={{ position: 'fixed', inset: 0, zIndex: 15 }} />
          <div style={{ position: 'fixed', left: '80px', top: 0, width: '200px', height: '100%', background: '#fff', borderRight: '1px solid #E2E8F0', padding: '12px 0', boxShadow: '4px 0 12px rgba(0,0,0,0.08)', zIndex: 18 }}>
            <div style={{ padding: '10px 16px 14px', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Job Management
            </div>
            {flyout.subItems.map(sub => {
              const isActive = location.pathname === sub.to || location.pathname.startsWith(sub.to + '/');
              return (
                <button key={sub.to} onClick={() => { navigate(sub.to); setFlyout(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 16px', background: isActive ? '#EEF2FF' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? PRIMARY : '#CBD5E1', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isActive ? PRIMARY : '#374151' }}>{sub.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', height: '60px', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px', flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{crumb.parent}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>{crumb.title}</div>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <Bell size={18} />
          </button>
          <div style={{ position: 'relative', width: '40px', height: '40px' }}>
            <svg style={{ position: 'absolute', inset: 0 }} width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke="#E2E8F0" strokeWidth="3" />
              <circle cx="20" cy="20" r="17" fill="none" stroke={PRIMARY} strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 17}`} strokeDashoffset={`${2 * Math.PI * 17 * 0.26}`}
                strokeLinecap="round" transform="rotate(-90 20 20)" />
            </svg>
            <div style={{ position: 'absolute', inset: '4px', borderRadius: '50%', background: '#EEEEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: PRIMARY }}>
              {initials}
            </div>
          </div>
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button onClick={() => setProfileOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '13px' }}>Hi, {firstName}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>CIO</div>
              </div>
              <ChevronDown size={14} color="#94A3B8" />
            </button>
            {profileOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '200px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>{user.name}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Industry Partner</div>
                </div>
                {[
                  { icon: User, label: 'My Account', action: () => { navigate('/industry-portal/profile'); setProfileOpen(false); } },
                  { icon: KeyRound, label: 'Change Password', action: () => { setShowChangePw(true); setProfileOpen(false); } },
                  { icon: HelpCircle, label: 'Help Center', action: () => { setShowHelp(true); setProfileOpen(false); } },
                ].map(({ icon: Icon, label, action }) => (
                  <button key={label} onClick={action} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#374151', textAlign: 'left' }}>
                    <Icon size={15} color="#64748B" /> {label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid #F1F5F9' }}>
                  <button onClick={() => { clearAuth(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#DC2626', textAlign: 'left' }}>
                    <LogOut size={15} color="#DC2626" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC' }}>
          <Outlet />
        </main>
      </div>
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
      {showHelp && <HelpCenterModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
