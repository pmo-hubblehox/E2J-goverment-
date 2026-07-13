import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, LayoutDashboard, Target, BookOpen, Briefcase, MessageCircle, User,
  Settings, LogOut, Bell, Layers, GraduationCap, MapPin, Users, BarChart2,
  FileText, ChevronDown, Menu, X, Trophy, Building2, ClipboardList, Mic,
  KeyRound, HelpCircle, CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ChangePasswordModal, HelpCenterModal } from '../components/ProfileModals';
import type { UserRole } from '../types';

interface SubItem { label: string; to: string }
interface NavItem { label: string; icon: React.ElementType; to: string; subItems?: SubItem[] }

const STUDENT_NAV: NavItem[] = [
  { label: 'Home', icon: Home, to: '/student' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/student/dashboard' },
  { label: 'My Aspir...', icon: Target, to: '/student/aspiration' },
  { label: 'Courses', icon: BookOpen, to: '/student/courses' },
  { label: 'Job Listing', icon: Briefcase, to: '/student/jobs' },
  { label: 'Counselli...', icon: MessageCircle, to: '/student/counselling' },
  { label: 'Interview', icon: Mic, to: '/student/interview' },
  { label: 'Workshops', icon: CalendarCheck, to: '/student/workshops' },
  { label: 'Profile', icon: User, to: '/student/profile' },
];

const INSTITUTE_NAV: NavItem[] = [
  { label: 'Home', icon: Home, to: '/institute' },
  {
    label: 'Program...', icon: Layers, to: '/institute/programs',
    subItems: [
      { label: 'Program Listing', to: '/institute/programs' },
      { label: 'Curriculum Management', to: '/institute/curriculum' },
    ],
  },
  { label: 'Student...', icon: GraduationCap, to: '/institute/students' },
  { label: 'Faculty M...', icon: Users, to: '/institute/faculty' },
  { label: 'Workshops', icon: CalendarCheck, to: '/institute/workshops' },
  { label: 'Book Lab', icon: MapPin, to: '/institute/venues' },
  { label: 'Campus...', icon: Trophy, to: '/institute/recruitment' },
  { label: 'Dashboard', icon: BarChart2, to: '/institute/dashboard' },
  { label: 'Profile', icon: User, to: '/institute/profile' },
  { label: 'Reports', icon: FileText, to: '/institute/reports' },
];

const VERIFIER_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/verifier' },
  { label: 'Reviews', icon: FileText, to: '/verifier/reviews' },
];

const INDUSTRY_PARTNER_NAV: NavItem[] = [
  { label: 'Home', icon: Home, to: '/industry-partner' },
  { label: 'Company', icon: Building2, to: '/industry-partner/profile' },
  { label: 'Status', icon: ClipboardList, to: '/industry-partner/status' },
];

const INSTITUTE_PENDING_NAV: NavItem[] = [
  { label: 'Home',      icon: Home,          to: '/institute/application-status' },
  { label: 'Institute', icon: Building2,      to: '/institute/pending/profile' },
  { label: 'Status',    icon: ClipboardList,  to: '/institute/pending/status' },
];

const NAV_MAP: Record<UserRole, NavItem[]> = {
  STUDENT: STUDENT_NAV,
  INSTITUTE: INSTITUTE_NAV,
  VERIFIER: VERIFIER_NAV,
  COUNSELLOR: [],
  HEAD_COUNSELLOR: [],
  INDUSTRY_PARTNER: INDUSTRY_PARTNER_NAV,
  BOS_MEMBER: [],
  SME: [],
};

const BREADCRUMB_MAP: Record<string, { parent: string; title: string }> = {
  '/student': { parent: 'Home', title: 'Home' },
  '/student/dashboard': { parent: 'Home', title: 'Dashboard' },
  '/student/aspiration': { parent: 'Home', title: 'My Aspiration' },
  '/student/skill-gap': { parent: 'My Aspiration', title: 'Skill Gap Report' },
  '/student/courses': { parent: 'Course', title: 'Course' },
  '/student/jobs': { parent: 'Home > Job Listing', title: 'Job' },
  '/student/counselling': { parent: 'Home', title: 'Counselling' },
  '/student/workshops': { parent: 'Home', title: 'Workshops' },
  '/student/profile-view': { parent: 'Home', title: 'Profile' },
  '/institute': { parent: 'Home', title: 'Home' },
  '/institute/programs': { parent: 'Program Management', title: 'Program Listing' },
  '/institute/curriculum': { parent: 'Program Management', title: 'Curriculum Management' },
  '/institute/students': { parent: 'Home', title: 'Students' },
  '/institute/faculty': { parent: 'Home', title: 'Faculty' },
  '/institute/workshops': { parent: 'Workshops', title: 'Workshops' },
  '/institute/venues': { parent: 'Home', title: 'Book Lab / Classroom' },
  '/institute/recruitment': { parent: 'Home', title: 'Campus Drive' },
  '/institute/dashboard': { parent: 'Home', title: 'Dashboard Analytics' },
  '/institute/reports': { parent: 'Home', title: 'Reports' },
  '/institute/profile': { parent: 'Home', title: 'Profile' },
  '/verifier': { parent: 'Home', title: 'Dashboard' },
  '/verifier/reviews': { parent: 'Home', title: 'Reviews' },
  '/industry-partner': { parent: 'Home', title: 'Home' },
  '/industry-partner/profile': { parent: 'Home', title: 'Company Profile' },
  '/industry-partner/status': { parent: 'Home', title: 'Application Status' },
};

export default function DashboardLayout() {
  const { isAuthenticated, user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [flyoutItem, setFlyoutItem] = useState<NavItem | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
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

  const PENDING_INSTITUTE_PATHS = ['/institute/application-status', '/institute/pending/profile', '/institute/pending/status'];
  const isPendingInstitute = user.role === 'INSTITUTE' && PENDING_INSTITUTE_PATHS.includes(location.pathname);
  const nav = isPendingInstitute ? INSTITUTE_PENDING_NAV : (NAV_MAP[user.role] ?? []);
  const initials = user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const firstName = user.name.split(' ')[0];
  const breadcrumb = BREADCRUMB_MAP[location.pathname] ?? { parent: 'Home', title: 'Page' };

  const handleLogout = () => { clearAuth(); navigate('/'); };

  const EXACT_MATCH_ROOTS = ['/institute', '/student', '/industry-partner', '/verifier'];
  const isNavActive = (item: NavItem) => {
    if (item.subItems) return item.subItems.some(s => location.pathname.startsWith(s.to));
    if (EXACT_MATCH_ROOTS.includes(item.to)) return location.pathname === item.to;
    return location.pathname === item.to || location.pathname.startsWith(item.to);
  };

  const handleNavClick = (item: NavItem, onClose?: () => void) => {
    if (item.subItems) {
      setFlyoutItem(prev => prev?.to === item.to ? null : item);
    } else {
      setFlyoutItem(null);
      navigate(item.to);
      onClose?.();
    }
  };

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <aside style={{ width: '80px', height: '100%', background: '#fff', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', borderBottom: '1px solid #E2E8F0', position: 'relative' }}>
        <img src="/logo-icon.png.png" alt="HubbleHox" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
        {onClose && (
          <button onClick={onClose} style={{ position: 'absolute', top: '8px', right: '8px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
            <X size={16} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {nav.map(item => {
          const active = isNavActive(item);
          return (
            <button
              key={item.to}
              onClick={() => handleNavClick(item, onClose)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: '56px', padding: '8px 4px', borderRadius: '12px', marginBottom: '4px',
                background: active ? '#4F46E5' : 'transparent',
                color: active ? '#fff' : '#64748B',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: '9.5px', fontWeight: 500, textAlign: 'center', marginTop: '4px', lineHeight: 1.2, color: active ? '#fff' : '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '52px' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '10px 0', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <NavLink to="/settings" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '56px', padding: '8px 4px', borderRadius: '12px', marginBottom: '4px', textDecoration: 'none', color: '#64748B' }}>
          <Settings size={20} strokeWidth={1.8} />
          <span style={{ fontSize: '9.5px', fontWeight: 500, textAlign: 'center', marginTop: '4px' }}>Settings</span>
        </NavLink>
        <button onClick={handleLogout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '56px', padding: '8px 4px', borderRadius: '12px', fontSize: '9.5px', fontWeight: 500, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>
          <LogOut size={20} strokeWidth={1.8} />
          <span style={{ fontSize: '9.5px', fontWeight: 500, textAlign: 'center', marginTop: '4px' }}>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', overflow: 'hidden' }}>
      {/* Desktop sidebar + flyout */}
      <div style={{ height: '100%', display: 'flex', position: 'relative', zIndex: 20 }}>
        <SidebarContent />
        {/* Flyout submenu */}
        {flyoutItem?.subItems && (
          <div ref={flyoutRef} style={{ position: 'absolute', left: '80px', top: 0, width: '200px', height: '100%', background: '#fff', borderRight: '1px solid #E2E8F0', padding: '12px 0', boxShadow: '4px 0 12px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '10px 16px 14px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {flyoutItem.label.replace('...', ' Management')}
            </div>
            {flyoutItem.subItems.map(sub => {
              const isActive = location.pathname === sub.to || location.pathname.startsWith(sub.to + '/');
              return (
                <button key={sub.to} onClick={() => { navigate(sub.to); setFlyoutItem(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 16px', background: isActive ? '#EEF2FF' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '0' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#4F46E5' : '#CBD5E1', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isActive ? '#4F46E5' : '#374151' }}>{sub.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Overlay to close flyout */}
      {flyoutItem && (
        <div onClick={() => setFlyoutItem(null)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
      )}

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content — pushed right when flyout is open */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', marginLeft: flyoutItem?.subItems ? '200px' : '0', transition: 'margin-left 0.2s ease' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', height: '60px', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px', flexShrink: 0 }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', display: 'none' }}>
            <Menu size={20} />
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>{breadcrumb.parent}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>{breadcrumb.title}</div>
          </div>

          <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#64748B', flexShrink: 0 }}>
            <Bell size={18} />
          </button>

          <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
            <svg style={{ position: 'absolute', inset: 0 }} width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke="#E2E8F0" strokeWidth="3" />
              <circle cx="20" cy="20" r="17" fill="none" stroke="#4F46E5" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 17}`} strokeDashoffset={`${2 * Math.PI * 17 * 0.26}`}
                strokeLinecap="round" transform="rotate(-90 20 20)" />
            </svg>
            <div style={{ position: 'absolute', inset: '4px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#4F46E5' }}>
              {initials}
            </div>
          </div>

          <div ref={profileRef} style={{ position: 'relative' }}>
            <button onClick={() => setProfileOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '13px', whiteSpace: 'nowrap' }}>Hi, {firstName}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{user.designation ?? user.role}</div>
              </div>
              <ChevronDown size={14} color="#94A3B8" />
            </button>
            {profileOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '200px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>{user.name}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{user.designation ?? user.role}</div>
                </div>
                {[
                  { icon: User, label: 'My Account', action: () => { navigate(`/${user.role.toLowerCase().replace('_', '-')}/profile`); setProfileOpen(false); } },
                  { icon: KeyRound, label: 'Change Password', action: () => { setShowChangePw(true); setProfileOpen(false); } },
                  { icon: HelpCircle, label: 'Help Center', action: () => { setShowHelp(true); setProfileOpen(false); } },
                ].map(({ icon: Icon, label, action }) => (
                  <button key={label} onClick={action}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#374151', textAlign: 'left' }}>
                    <Icon size={15} color="#64748B" /> {label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid #F1F5F9' }}>
                  <button onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#DC2626', textAlign: 'left' }}>
                    <LogOut size={15} color="#DC2626" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC' }}>
          {flyoutItem?.subItems && !flyoutItem.subItems.some(s => location.pathname.startsWith(s.to))
            ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: '#94A3B8' }}>
                <flyoutItem.icon size={40} strokeWidth={1.2} />
                <p style={{ margin: 0, fontSize: '14px' }}>Select an option from the menu</p>
              </div>
            )
            : <Outlet />
          }
        </main>
      </div>
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
      {showHelp && <HelpCenterModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
