import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, CalendarCheck, User, Settings, LogOut, Bell, ChevronDown, AlertCircle, X, Lock, KeyRound, HelpCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { ChangePasswordModal, HelpCenterModal } from '../components/ProfileModals';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/counsellor' },
  { label: 'Booked\nSession', icon: CalendarCheck, to: '/counsellor/sessions' },
  { label: 'Profile', icon: User, to: '/counsellor/profile' },
];

const ALLOWED_WHEN_LOCKED = ['/counsellor/profile', '/counsellor/onboarding'];

export default function CounsellorLayout() {
  const { isAuthenticated, user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    api.get('/counsellor/onboarding/status').then(r => {
      const { onboardingCompleted, status, pendingProfileUpdate } = r.data?.data ?? {};
      // Approved counsellors (even with pending profile update) should NOT be locked out
      setIsApproved(status === 'APPROVED' || pendingProfileUpdate === true);
      const dismissed = sessionStorage.getItem('counsellor_profile_popup_dismissed');
      if (!dismissed && !onboardingCompleted) setShowProfilePopup(true);
    }).catch(() => setIsApproved(false));
  }, []);

  const dismissPopup = () => {
    sessionStorage.setItem('counsellor_profile_popup_dismissed', '1');
    setShowProfilePopup(false);
  };

  if (!isAuthenticated || !user || user.role !== 'COUNSELLOR') return <Navigate to="/" replace />;

  // Redirect locked routes to profile
  const locked = isApproved === false;
  if (locked && !ALLOWED_WHEN_LOCKED.some(p => location.pathname.startsWith(p))) {
    return <Navigate to="/counsellor/profile" replace />;
  }

  const initials = user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const firstName = user.name.split(' ')[0];

  const breadcrumbs: Record<string, string> = {
    '/counsellor': 'Dashboard',
    '/counsellor/sessions': 'Booked Session',
    '/counsellor/profile': 'My Profile',
  };
  const pageTitle = breadcrumbs[location.pathname] ?? 'Page';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: '80px', height: '100%', background: '#fff', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', borderBottom: '1px solid #E2E8F0' }}>
          <img src="/logo-icon.png.png" alt="HubbleHox" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
        </div>

        <nav style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {NAV.map(item => {
            const active = location.pathname === item.to;
            const isLocked = locked && item.to !== '/counsellor/profile';
            return (
              <div key={item.to} style={{ position: 'relative' }} title={isLocked ? 'Available after approval' : undefined}>
                <button
                  onClick={() => { if (!isLocked) navigate(item.to); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    width: '56px', padding: '8px 4px', borderRadius: '12px', marginBottom: '4px',
                    background: active ? '#4F46E5' : 'transparent',
                    color: isLocked ? '#CBD5E1' : active ? '#fff' : '#64748B',
                    border: 'none', cursor: isLocked ? 'not-allowed' : 'pointer',
                    opacity: isLocked ? 0.5 : 1,
                  }}>
                  <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  <span style={{ fontSize: '9px', fontWeight: 500, marginTop: '4px', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{item.label}</span>
                </button>
                {isLocked && (
                  <div style={{ position: 'absolute', top: '2px', right: '2px', pointerEvents: 'none' }}>
                    <Lock size={10} color="#94A3B8" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: '10px 0', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative' }} title={locked ? 'Available after approval' : undefined}>
            <button
              onClick={() => { if (!locked) navigate('/counsellor/settings'); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '56px', padding: '8px 4px', borderRadius: '12px', marginBottom: '4px', background: 'none', border: 'none', cursor: locked ? 'not-allowed' : 'pointer', color: locked ? '#CBD5E1' : '#64748B', opacity: locked ? 0.5 : 1 }}>
              <Settings size={20} strokeWidth={1.8} />
              <span style={{ fontSize: '9px', fontWeight: 500, marginTop: '4px' }}>Setting</span>
            </button>
            {locked && <div style={{ position: 'absolute', top: '2px', right: '2px', pointerEvents: 'none' }}><Lock size={10} color="#94A3B8" /></div>}
          </div>
          <button onClick={() => { clearAuth(); navigate('/login/counsellor'); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '56px', padding: '8px 4px', borderRadius: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <LogOut size={20} strokeWidth={1.8} />
            <span style={{ fontSize: '9px', fontWeight: 500, marginTop: '4px' }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', height: '60px', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px', flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Home › {pageTitle}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>{pageTitle}</div>
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
                <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '13px' }}>Hi, {firstName}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Counsellor</div>
              </div>
              <ChevronDown size={14} color="#94A3B8" />
            </button>
            {profileOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '200px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>{user.name}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Counsellor</div>
                </div>
                {[
                  { icon: User, label: 'My Account', action: () => { navigate('/counsellor/profile'); setProfileOpen(false); } },
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

      {/* Complete profile popup */}
      {showProfilePopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 36px', width: '440px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', textAlign: 'center', position: 'relative' }}>
            <button onClick={dismissPopup} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
              <X size={18} />
            </button>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertCircle size={30} color="#F97316" strokeWidth={1.8} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: '0 0 10px' }}>Complete Your Profile</h2>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7, margin: '0 0 28px' }}>
              Your counsellor profile is incomplete. Please fill in your details to get full access to the platform and be listed for student sessions.
            </p>
            <button
              onClick={() => { dismissPopup(); navigate('/counsellor/onboarding'); }}
              style={{ width: '100%', padding: '13px', background: '#4338CA', border: 'none', borderRadius: '24px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '10px' }}>
              Complete Profile Now
            </button>
            <button onClick={dismissPopup}
              style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid #E2E8F0', borderRadius: '24px', color: '#64748B', fontSize: '14px', cursor: 'pointer' }}>
              Remind Me Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
