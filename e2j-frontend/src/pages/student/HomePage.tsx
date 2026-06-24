import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface CourseItem {
  id: number; title: string; instructor: string; progress: number;
  duration: string; rating: number; enrollmentDate?: string; startDate?: string;
}


const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [tab, setTab] = useState<'home' | 'calendar'>('home');
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    api.get('/student/courses/my')
      .then(r => setCourses(r.data.data ?? []))
      .catch(() => {});

    // Always check backend — localStorage alone can be stale after login
    api.get('/student/profile/full')
      .then(r => {
        const completed = r.data?.data?.profileCompleted;
        if (!completed) setShowProfileModal(true);
      })
      .catch(() => {
        // If no profile exists yet, show the modal
        setShowProfileModal(true);
      });
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  return (
    <div style={{ padding: '24px', minHeight: '100%' }}>

      {/* New user profile completion popup */}
      {showProfileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 36px', maxWidth: '440px', width: '90%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <button
              onClick={() => setShowProfileModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={18} />
            </button>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <UserCircle size={36} color="#4F46E5" strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: '0 0 8px' }}>Complete Your Profile</h2>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>
              Your profile is incomplete. Fill in your personal details, education, and experience to unlock job recommendations and aspiration tracking.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => { setShowProfileModal(false); navigate('/student/profile'); }}
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)', border: 'none', borderRadius: '24px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Complete Profile Now
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{ padding: '10px 24px', background: 'none', border: '1.5px solid #E2E8F0', borderRadius: '24px', color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Greeting + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
          Hi {firstName}, Welcome Back!
        </h1>
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '24px', padding: '3px', gap: '2px' }}>
          {(['home', 'calendar'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 20px', borderRadius: '20px', border: 'none',
              background: tab === t ? '#4F46E5' : 'transparent',
              color: tab === t ? '#fff' : '#64748B',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              textTransform: 'capitalize',
            }}>
              {t === 'home' ? 'Home' : 'My Calendar'}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Aspiration banner + stats card */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>

        {/* Aspiration Tracker */}
        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', minHeight: '180px', cursor: 'pointer' }}
          onClick={() => navigate('/student/aspiration')}>
          <img src="/aspiration-banner.png.png" alt="My Aspiration Tracker" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>

        {/* Stats card */}
        <div style={{
          width: '300px', background: '#fff', borderRadius: '16px',
          border: '1px solid #E2E8F0', padding: '20px', flexShrink: 0,
        }}>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#F97316', margin: '0 0 4px' }}>🔥 5 Day Streak</p>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Maintain The Streak For Next 2 Weeks To Become{' '}
              <span style={{ color: '#F97316', fontWeight: 700 }}>CONSISTENCY CHAMP</span>
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: '0 0 2px' }}>⚡ 58</p>
              <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Credit Points</p>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: '0 0 2px' }}>🏆 4</p>
              <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Skills Achieved</p>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 6px' }}>
            You're 75% Done! Just 4 Modules Left To Earn{' '}
            <span style={{ color: '#4F46E5', fontWeight: 600 }}>10 Points</span>
          </p>
          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '75%', height: '100%', background: '#22C55E', borderRadius: '4px' }} />
          </div>
        </div>
      </div>

      {/* Row 3: My Courses */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: 0 }}>My Courses</h2>
        <button onClick={() => navigate('/student/courses')} style={{
          background: 'none', border: 'none', color: '#4F46E5', fontSize: '13px',
          fontWeight: 500, cursor: 'pointer',
        }}>Browse More</button>
      </div>

      {courses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '13px' }}>
          No courses enrolled yet. <button onClick={() => navigate('/student/courses')} style={{ color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Browse courses →</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {courses.slice(0, 3).map((c, i) => (
          <div key={c.id} style={{
            background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0',
            overflow: 'hidden', cursor: 'pointer',
          }}>
            <div style={{
              height: '160px', background: GRADIENTS[i % 3],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', margin: '0 0 12px', lineHeight: 1.4 }}>{c.title}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '10px', fontSize: '11px', color: '#64748B' }}>
                <span>Enrolment Course</span>
                <span style={{ color: '#4F46E5', textAlign: 'right' }}>{c.enrollmentDate ?? '—'}</span>
                <span>Course Start</span>
                <span style={{ color: '#4F46E5', textAlign: 'right' }}>{c.startDate ?? '—'}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                  <span>Progress</span><span>{c.progress}%</span>
                </div>
                <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${c.progress}%`, height: '100%', background: '#22C55E', borderRadius: '4px' }} />
                </div>
              </div>
              <button style={{
                width: '100%', padding: '9px', border: '1.5px solid #4F46E5', borderRadius: '8px',
                background: 'transparent', color: '#4F46E5', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                {c.progress > 0 ? 'Continue' : 'Start Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
