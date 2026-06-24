import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../services/api';

type GateStatus = 'loading' | 'onboarding' | 'setup' | 'pending' | 'approved';

export default function InstituteGate() {
  const [gate, setGate] = useState<GateStatus>('loading');

  useEffect(() => {
    api.get('/institute/application/status')
      .then(res => {
        const d = res.data?.data;
        if (!d?.onboardingComplete)                        setGate('onboarding');
        else if (!d?.setupComplete)                        setGate('setup');
        else if (d?.status === 'APPROVED')                 setGate('approved');
        else                                               setGate('pending');
      })
      .catch(() => setGate('onboarding'));
  }, []);

  if (gate === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '14px', color: '#666' }}>
      Loading…
    </div>
  );

  if (gate === 'onboarding') return <Navigate to="/institute/onboarding" replace />;
  if (gate === 'setup')      return <Navigate to="/institute/setup" replace />;
  if (gate === 'pending')    return <Navigate to="/institute/application-status" replace />;

  // approved — render the actual institute dashboard
  return <Outlet />;
}
