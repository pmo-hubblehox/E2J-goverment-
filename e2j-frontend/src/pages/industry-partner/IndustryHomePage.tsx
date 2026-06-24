import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ClipboardList, ArrowRight, CheckCircle, Clock, AlertCircle, XCircle, FileEdit } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const QUICK_LINKS = [
  { icon: Building2,    title: 'Company Profile',     description: 'View and manage your registered company information.', to: '/industry-partner/profile', color: '#4338CA', bg: '#EEF2FF' },
  { icon: ClipboardList, title: 'Application Status', description: 'Track the current status of your onboarding application.', to: '/industry-partner/status', color: '#0F766E', bg: '#F0FDFA' },
];

type StatusInfo = {
  dot: string; title: string; message: string;
  border: string; bg: string; titleColor: string; msgColor: string;
  icon: React.ElementType;
};

const STATUS_CONFIG: Record<string, StatusInfo> = {
  DRAFT: {
    dot: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0',
    titleColor: '#475569', msgColor: '#64748B', icon: FileEdit,
    title: 'Onboarding Incomplete',
    message: 'You have a draft application. Complete and submit it to begin the review process.',
  },
  SUBMITTED: {
    dot: '#F97316', bg: '#FFF7ED', border: '#FED7AA',
    titleColor: '#9A3412', msgColor: '#C2410C', icon: Clock,
    title: 'Application Submitted',
    message: 'Your application has been received and is awaiting review.',
  },
  UNDER_REVIEW: {
    dot: '#F97316', bg: '#FFF7ED', border: '#FED7AA',
    titleColor: '#9A3412', msgColor: '#C2410C', icon: Clock,
    title: 'Application Under Review',
    message: 'Our team is reviewing your application. You will be notified once a decision is made.',
  },
  APPROVED: {
    dot: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0',
    titleColor: '#15803D', msgColor: '#166534', icon: CheckCircle,
    title: 'Application Approved',
    message: 'Congratulations! Your application has been approved. You now have full platform access.',
  },
  REJECTED: {
    dot: '#DC2626', bg: '#FEF2F2', border: '#FECACA',
    titleColor: '#B91C1C', msgColor: '#991B1B', icon: XCircle,
    title: 'Application Rejected',
    message: 'Your application was not approved. Please review the feedback and resubmit.',
  },
};

export default function IndustryHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Partner';
  const [appStatus, setAppStatus] = useState<string | null>(null);

  useEffect(() => {
    api.get('/industry-partner/application/status')
      .then(res => {
        const status = res.data?.data?.applicationStatus ?? 'DRAFT';
        setAppStatus(status);
        if (status === 'APPROVED') navigate('/industry-portal', { replace: true });
      })
      .catch(() => setAppStatus('DRAFT'));
  }, []);

  const cfg: StatusInfo = STATUS_CONFIG[appStatus ?? 'DRAFT'] ?? STATUS_CONFIG.DRAFT;
  const Icon = cfg.icon ?? AlertCircle;

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>

      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg, #4338CA 0%, #7C3AED 100%)', borderRadius: '16px', padding: '32px 36px', marginBottom: '32px', color: '#fff' }}>
        <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 500, opacity: 0.8 }}>Welcome back,</p>
        <h1 style={{ margin: '0 0 10px', fontSize: '26px', fontWeight: 700 }}>{firstName}</h1>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.85, lineHeight: 1.6 }}>
          {appStatus === 'APPROVED'
            ? 'Your partnership with HubbleHox is active. Welcome to the platform!'
            : 'Thank you for partnering with HubbleHox. Complete your onboarding to unlock full platform access.'}
        </p>
      </div>

      {/* Quick links */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>Quick Access</h2>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const }}>
        {QUICK_LINKS.map(({ icon: CardIcon, title, description, to, color, bg }) => (
          <button key={to} onClick={() => navigate(to)}
            style={{ flex: '1 1 260px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px 22px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '16px' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CardIcon size={20} color={color} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{title}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>{description}</p>
            </div>
            <ArrowRight size={16} color="#94A3B8" style={{ marginTop: '2px', flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* Live status card */}
      {appStatus && (
        <div style={{ marginTop: '28px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px', padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{ marginTop: '1px', flexShrink: 0 }}>
            <Icon size={18} color={cfg.titleColor} />
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: cfg.titleColor }}>{cfg.title}</p>
            <p style={{ margin: 0, fontSize: '12px', color: cfg.msgColor }}>{cfg.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
