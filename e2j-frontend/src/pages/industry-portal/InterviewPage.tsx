import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Monitor, Users, CheckSquare, ChevronDown } from 'lucide-react';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';

const TABS = ['All Interviews (0)', 'To Be Scheduled (0)', 'Scheduled Interview (0)'];

export default function InterviewPage() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px' }}>
      {/* Tabs + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ padding: '8px 18px', borderRadius: '100px', border: `1px solid ${tab === i ? PRIMARY : BORDER}`, background: tab === i ? '#EEEEFF' : '#fff', color: tab === i ? PRIMARY : TEXT, fontSize: '13px', fontWeight: tab === i ? 600 : 400, cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT }}>
          Current Month <ChevronDown size={14} />
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT }}>
          Filter
        </button>
        <button onClick={() => navigate('/industry-portal/campus/add')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 20px', height: '36px', border: 'none', borderRadius: '100px', background: '#E91E8C', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          + Interview Drive
        </button>
      </div>

      {/* Empty state */}
      <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, padding: '80px 24px', textAlign: 'center' }}>
        <CheckSquare size={40} color="#CBD5E1" style={{ marginBottom: '16px' }} />
        <p style={{ fontSize: '15px', fontWeight: 600, color: TEXT, margin: '0 0 8px' }}>No interviews scheduled yet</p>
        <p style={{ fontSize: '13px', color: SUB, margin: '0 0 20px' }}>Once candidates are shortlisted from your job postings, interviews will appear here.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
          {[
            { icon: Clock, text: 'Track interview timing' },
            { icon: Monitor, text: 'Online & Offline modes' },
            { icon: Users, text: 'Individual & Panel types' },
          ].map(({ icon: Icon, text }) => (
            <span key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#F8FAFC', borderRadius: '100px', fontSize: '12px', color: SUB }}>
              <Icon size={13} /> {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
