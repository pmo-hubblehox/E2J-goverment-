import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, Trash2, X } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER = '#A3A3A3';
const BORDER_LIGHT = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_OPTIONS = [
  '6:00 Am', '6:30 Am', '7:00 Am', '7:30 Am', '8:00 Am', '8:30 Am',
  '9:00 Am', '9:30 Am', '10:00 Am', '10:30 Am', '11:00 Am', '11:30 Am',
  '12:00 Pm', '12:30 Pm', '1:00 Pm', '1:30 Pm', '2:00 Pm', '2:30 Pm',
  '3:00 Pm', '3:30 Pm', '4:00 Pm', '4:30 Pm', '5:00 Pm', '5:30 Pm',
  '6:00 Pm', '6:30 Pm', '7:00 Pm', '7:30 Pm', '8:00 Pm',
];
const EXPERTISE_OPTIONS = [
  'UI Designing', 'UX Designing', 'User Research', 'Market Research', 'Product Management',
  'Web Development', 'Data Science', 'Machine Learning', 'Cyber Security', 'DevOps',
  'Cloud Computing', 'Mobile Development', 'Embedded Systems', 'Digital Marketing',
];
const MODE_OPTIONS = ['Online', 'Offline', 'Hybrid'];

interface TimeSlotRow { from: string; to: string; }

/* ── Floating-label field components ── */
function FloatInput({ label, required, ...rest }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  const active = focused || Boolean(rest.value);
  return (
    <div style={{ position: 'relative', height: '56px' }}>
      <label style={{
        position: 'absolute', left: '14px',
        top: active ? '-9px' : '17px',
        fontSize: active ? '11px' : '14px',
        color: focused ? PRIMARY : SUB,
        background: '#fff', padding: '0 4px',
        transition: 'all 0.15s ease', pointerEvents: 'none', zIndex: 1,
        fontWeight: active ? 500 : 400,
      }}>
        {label}{required && <span style={{ color: '#E6393E' }}> *</span>}
      </label>
      <input {...rest}
        onFocus={e => { setFocused(true); rest.onFocus?.(e as any); }}
        onBlur={e => { setFocused(false); rest.onBlur?.(e as any); }}
        style={{
          width: '100%', height: '56px', border: `1.5px solid ${focused ? PRIMARY : BORDER}`,
          borderRadius: '8px', padding: '0 14px', fontSize: '14px', outline: 'none',
          background: '#fff', boxSizing: 'border-box', color: TEXT, ...rest.style,
        }} />
    </div>
  );
}

function FloatSelect({ label, required, options, value, onChange }: {
  label: string; required?: boolean; options: string[];
  value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || Boolean(value);
  return (
    <div style={{ position: 'relative', height: '56px' }}>
      <label style={{
        position: 'absolute', left: '14px',
        top: active ? '-9px' : '17px',
        fontSize: active ? '11px' : '14px',
        color: focused ? PRIMARY : SUB,
        background: '#fff', padding: '0 4px',
        transition: 'all 0.15s ease', pointerEvents: 'none', zIndex: 1,
        fontWeight: active ? 500 : 400,
      }}>
        {label}{required && <span style={{ color: '#E6393E' }}> *</span>}
      </label>
      <div style={{ position: 'relative', height: '56px' }}>
        <select value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', height: '56px', border: `1.5px solid ${focused ? PRIMARY : BORDER}`,
            borderRadius: '8px', padding: '0 40px 0 14px', fontSize: '14px', outline: 'none',
            appearance: 'none', background: '#fff', color: TEXT, cursor: 'pointer',
          }}>
          <option value="" style={{ display: 'none' }} />
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: SUB }} />
      </div>
    </div>
  );
}

/* Day multi-select with chip display */
function DaySelect({ selected, onChange }: { selected: string[]; onChange: (d: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const active = selected.length > 0;
  const toggle = (d: string) => onChange(selected.includes(d) ? selected.filter(x => x !== d) : [...selected, d]);
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ minHeight: '56px', border: `1.5px solid ${open ? PRIMARY : BORDER}`, borderRadius: '8px', padding: '8px 40px 8px 10px', background: '#fff', cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', position: 'relative' }}>
        <label style={{
          position: 'absolute', left: '14px',
          top: active || open ? '-9px' : '17px',
          fontSize: active || open ? '11px' : '14px',
          color: open ? PRIMARY : SUB, background: '#fff', padding: '0 4px',
          transition: 'all 0.15s', pointerEvents: 'none', zIndex: 1, fontWeight: active ? 500 : 400,
        }}>Day</label>
        {selected.map(d => (
          <span key={d} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: '#EEEEFF', borderRadius: '100px', fontSize: '12px', color: PRIMARY, fontWeight: 500 }}>
            {d}
            <button type="button" onClick={e => { e.stopPropagation(); toggle(d); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: PRIMARY, display: 'flex', alignItems: 'center' }}>
              <X size={12} />
            </button>
          </span>
        ))}
        <ChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, color: SUB, transition: 'transform 0.2s' }} />
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', background: '#fff', border: `1px solid ${BORDER_LIGHT}`, borderRadius: '8px', zIndex: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {DAY_OPTIONS.map(d => (
              <div key={d} onClick={() => toggle(d)}
                style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selected.includes(d) ? '#F5F5FF' : '#fff', fontSize: '14px', color: selected.includes(d) ? PRIMARY : TEXT }}>
                <div style={{ width: '16px', height: '16px', border: `2px solid ${selected.includes(d) ? PRIMARY : BORDER}`, borderRadius: '4px', background: selected.includes(d) ? PRIMARY : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selected.includes(d) && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                </div>
                {d}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* Expertise multi-select */
function ExpertiseSelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const active = selected.length > 0;
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  const addCustom = () => { if (custom.trim() && !selected.includes(custom.trim())) { onChange([...selected, custom.trim()]); setCustom(''); } };
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ minHeight: '56px', border: `1.5px solid ${open ? PRIMARY : BORDER}`, borderRadius: '8px', padding: '8px 40px 8px 10px', background: '#fff', cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', position: 'relative' }}
        onClick={() => setOpen(true)}>
        <label style={{
          position: 'absolute', left: '14px',
          top: active || open ? '-9px' : '17px',
          fontSize: active || open ? '11px' : '14px',
          color: open ? PRIMARY : SUB, background: '#fff', padding: '0 4px',
          transition: 'all 0.15s', pointerEvents: 'none', zIndex: 1, fontWeight: active ? 500 : 400,
        }}>Expertise Area</label>
        {selected.map(v => (
          <span key={v} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', background: '#EEEEFF', borderRadius: '100px', fontSize: '12px', color: PRIMARY, fontWeight: 500 }}>
            {v}
            <button type="button" onClick={e => { e.stopPropagation(); toggle(v); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: PRIMARY, display: 'flex', alignItems: 'center' }}>
              <X size={12} />
            </button>
          </span>
        ))}
        <ChevronDown size={18} style={{ position: 'absolute', right: '14px', top: selected.length === 0 ? '50%' : '14px', transform: selected.length === 0 ? 'translateY(-50%)' : 'none', color: SUB }} />
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', background: '#fff', border: `1px solid ${BORDER_LIGHT}`, borderRadius: '8px', zIndex: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '8px' }}>
              <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
                placeholder="Type custom skill + Enter"
                style={{ width: '100%', height: '36px', border: `1px solid ${BORDER_LIGHT}`, borderRadius: '6px', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {EXPERTISE_OPTIONS.map(v => (
                <div key={v} onClick={() => toggle(v)}
                  style={{ padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selected.includes(v) ? '#F5F5FF' : '#fff', fontSize: '13px', color: selected.includes(v) ? PRIMARY : TEXT }}>
                  <div style={{ width: '16px', height: '16px', border: `2px solid ${selected.includes(v) ? PRIMARY : BORDER}`, borderRadius: '4px', background: selected.includes(v) ? PRIMARY : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selected.includes(v) && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                  </div>
                  {v}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AddSmePage() {
  const navigate = useNavigate();
  const [smeName, setSmeName] = useState('');
  const [email, setEmail] = useState('');
  const [expertiseArea, setExpertiseArea] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [recurEvery, setRecurEvery] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotRow[]>([{ from: '', to: '' }]);
  const [mode, setMode] = useState('');
  const [locationName, setLocationName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const addTimeSlot = () => setTimeSlots(s => [...s, { from: '', to: '' }]);
  const removeTimeSlot = (i: number) => setTimeSlots(s => s.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, k: keyof TimeSlotRow, v: string) =>
    setTimeSlots(s => s.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const handleSubmit = async () => {
    if (!smeName) return alert('SME Name is required.');
    if (!email) return alert('Email is required.');
    setSaving(true);
    try {
      await api.post('/industry-portal/sme', {
        smeName,
        email,
        expertiseArea: JSON.stringify(expertiseArea),
        bio,
        availableFrom: availableFrom || null,
        availableTo: availableTo || null,
        recurEvery,
        days: JSON.stringify(selectedDays),
        timeSlots: JSON.stringify(timeSlots),
        mode,
        locationName,
        status: 'PUBLISHED',
      });
      setSuccess(true);
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>

      {/* SME Name */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', height: '56px' }}>
          <label style={{ position: 'absolute', left: '14px', top: smeName ? '-9px' : '17px', fontSize: smeName ? '11px' : '14px', color: SUB, background: '#fff', padding: '0 4px', transition: 'all 0.15s ease', pointerEvents: 'none', zIndex: 1, fontWeight: smeName ? 500 : 400 }}>
            SME Name <span style={{ color: '#E6393E' }}>*</span>
          </label>
          <input value={smeName} onChange={e => setSmeName(e.target.value)}
            onFocus={e => { e.currentTarget.previousElementSibling && ((e.currentTarget.previousElementSibling as HTMLElement).style.top = '-9px'); (e.currentTarget.previousElementSibling as HTMLElement).style.fontSize = '11px'; (e.currentTarget.previousElementSibling as HTMLElement).style.color = PRIMARY; }}
            onBlur={e => { if (!smeName) { (e.currentTarget.previousElementSibling as HTMLElement).style.top = '17px'; (e.currentTarget.previousElementSibling as HTMLElement).style.fontSize = '14px'; } (e.currentTarget.previousElementSibling as HTMLElement).style.color = SUB; }}
            placeholder=""
            style={{ width: '100%', height: '56px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '14px', outline: 'none', background: '#fff', color: TEXT, boxSizing: 'border-box' as const }} />
        </div>
      </div>

      {/* Email */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: SUB, marginBottom: '6px' }}>
          Email <span style={{ color: '#E6393E' }}>*</span> <span style={{ fontWeight: 400 }}>(used to create their login)</span>
        </label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email"
          style={{ width: '100%', height: '48px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '14px', outline: 'none', background: '#fff', color: TEXT, boxSizing: 'border-box' as const }} />
      </div>

      {/* Expertise Area */}
      <div style={{ marginBottom: '20px' }}>
        <ExpertiseSelect selected={expertiseArea} onChange={setExpertiseArea} />
      </div>

      {/* Bio */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '8px 12px', borderBottom: `1px solid ${BORDER_LIGHT}`, background: '#FAFAFA', flexWrap: 'wrap' as const }}>
            {[
              { label: 'B', style: { fontWeight: 700 } }, { label: 'I', style: { fontStyle: 'italic' } },
              { label: 'U', style: { textDecoration: 'underline' } }, { label: 'S', style: { textDecoration: 'line-through' } },
            ].map(b => (
              <button key={b.label} type="button"
                style={{ width: '28px', height: '28px', border: 'none', background: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', color: TEXT, ...b.style }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                {b.label}
              </button>
            ))}
            <div style={{ width: '1px', height: '20px', background: BORDER_LIGHT, margin: '0 4px' }} />
            {['≡', '•', '⊟', 'Ω', 'x₂', 'x²', '🔗', '🖼'].map(ic => (
              <button key={ic} type="button"
                style={{ width: '28px', height: '28px', border: 'none', background: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: TEXT }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                {ic}
              </button>
            ))}
          </div>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio"
            rows={4}
            style={{ width: '100%', border: 'none', outline: 'none', padding: '14px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', color: TEXT, boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Availability */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: TEXT }}>Availability</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* From date */}
          <div style={{ position: 'relative' }}>
            <label style={{ position: 'absolute', left: '14px', top: '-9px', fontSize: '11px', color: SUB, background: '#fff', padding: '0 4px', zIndex: 1, fontWeight: 500 }}>
              From <span style={{ color: '#E6393E' }}>*</span>
            </label>
            <input type="date" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)}
              style={{ width: '100%', height: '56px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: TEXT }} />
          </div>
          {/* To date */}
          <div style={{ position: 'relative' }}>
            <label style={{ position: 'absolute', left: '14px', top: '-9px', fontSize: '11px', color: SUB, background: '#fff', padding: '0 4px', zIndex: 1, fontWeight: 500 }}>
              To <span style={{ color: '#E6393E' }}>*</span>
            </label>
            <input type="date" value={availableTo} onChange={e => setAvailableTo(e.target.value)}
              style={{ width: '100%', height: '56px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: TEXT }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FloatInput label="Recur Every (Weeks)" required type="number" min="1" value={recurEvery}
            onChange={e => setRecurEvery(e.target.value)} />
          <DaySelect selected={selectedDays} onChange={setSelectedDays} />
        </div>
      </div>

      {/* Time Slot */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: TEXT }}>Time Slot</h3>
        {timeSlots.map((slot, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <FloatSelect label="From" required={i === 0} options={TIME_OPTIONS} value={slot.from} onChange={v => updateSlot(i, 'from', v)} />
            </div>
            <div style={{ flex: 1 }}>
              <FloatSelect label="To" required={i === 0} options={TIME_OPTIONS} value={slot.to} onChange={v => updateSlot(i, 'to', v)} />
            </div>
            <button type="button" onClick={() => removeTimeSlot(i)} disabled={timeSlots.length === 1}
              style={{ width: '40px', height: '40px', border: `1px solid ${BORDER_LIGHT}`, borderRadius: '50%', background: timeSlots.length === 1 ? '#F1F5F9' : '#EDE9FE', cursor: timeSlots.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: timeSlots.length === 1 ? '#CBD5E1' : '#7C3AED' }}>
              <Trash2 size={15} />
            </button>
            {i === timeSlots.length - 1 && (
              <button type="button" onClick={addTimeSlot}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer', fontSize: '13px', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                <Plus size={15} /> Add
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Delivery Mode */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: TEXT }}>Delivery Mode</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FloatSelect label="Mode" required options={MODE_OPTIONS} value={mode} onChange={setMode} />
          <FloatInput label="Location" required value={locationName} onChange={e => setLocationName(e.target.value)} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button type="button" onClick={() => navigate('/industry-portal/sme')}
          style={{ padding: '0 32px', height: '44px', borderRadius: '100px', border: `1.5px solid ${BORDER}`, background: '#fff', fontSize: '14px', cursor: 'pointer', color: TEXT, fontWeight: 500 }}>
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={saving}
          style={{ padding: '0 36px', height: '44px', borderRadius: '100px', border: 'none', background: '#E91E8C', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Submit'}
        </button>
      </div>

      {/* Success dialog */}
      {success && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '40px 48px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxWidth: '340px', width: '90%' }}>
            <p style={{ margin: '0 0 24px', fontSize: '16px', fontWeight: 700, color: PRIMARY }}>SME is Added Successfully!</p>
            <button onClick={() => navigate('/industry-portal/sme')}
              style={{ padding: '0 40px', height: '44px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
