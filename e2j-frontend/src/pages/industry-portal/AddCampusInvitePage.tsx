import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';

interface InstituteItem { id: number; name: string; city: string; state: string; type: string; }

const PRIMARY = '#3F41D1';
const BORDER = '#A3A3A3';
const BORDER_LIGHT = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';
const LIGHT_BG = '#EEEEFF';

/* ─── Floating-label primitives (same as AddSmePage) ─── */
function FloatInput({
  label, required, ...rest
}: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
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
      <input
        {...rest}
        onFocus={e => { setFocused(true); (rest.onFocus as any)?.(e); }}
        onBlur={e => { setFocused(false); (rest.onBlur as any)?.(e); }}
        style={{
          width: '100%', height: '56px',
          border: `1.5px solid ${focused ? PRIMARY : BORDER}`,
          borderRadius: '8px', padding: '0 14px', fontSize: '14px',
          outline: 'none', background: '#fff', boxSizing: 'border-box', color: TEXT,
          ...rest.style,
        }}
      />
    </div>
  );
}

function FloatSelect({
  label, required, options, value, onChange,
}: { label: string; required?: boolean; options: string[]; value: string; onChange: (v: string) => void }) {
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
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', height: '56px',
          border: `1.5px solid ${focused ? PRIMARY : BORDER}`,
          borderRadius: '8px', padding: '0 40px 0 14px', fontSize: '14px',
          outline: 'none', appearance: 'none', background: '#fff',
          color: TEXT, cursor: 'pointer',
        }}
      >
        <option value="" />
        {options.map(o => <option key={o} value={o} style={{ color: TEXT, background: '#fff' }}>{o}</option>)}
      </select>
      <ChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: SUB }} />
    </div>
  );
}

function FloatTextarea({ label, required, value, onChange }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || Boolean(value);
  return (
    <div style={{ position: 'relative' }}>
      <label style={{
        position: 'absolute', left: '14px',
        top: active ? '-9px' : '16px',
        fontSize: active ? '11px' : '14px',
        color: focused ? PRIMARY : SUB,
        background: '#fff', padding: '0 4px',
        transition: 'all 0.15s ease', pointerEvents: 'none', zIndex: 1,
        fontWeight: active ? 500 : 400,
      }}>
        {label}{required && <span style={{ color: '#E6393E' }}> *</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={3}
        style={{
          width: '100%', border: `1.5px solid ${focused ? PRIMARY : BORDER}`,
          borderRadius: '8px', padding: '18px 14px 10px',
          fontSize: '14px', outline: 'none', resize: 'vertical',
          fontFamily: 'inherit', color: TEXT, boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

/* ─── Collapsible section card (same as AddJobPage) ─── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: `1px solid ${BORDER_LIGHT}`, borderRadius: '10px', marginBottom: '24px', overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: LIGHT_BG, border: 'none', padding: '14px 20px', cursor: 'pointer', borderRadius: open ? '10px 10px 0 0' : '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{title}</span>
        {open ? <ChevronUp size={16} color={SUB} /> : <ChevronDown size={16} color={SUB} />}
      </button>
      {open && <div style={{ padding: '24px 20px', background: '#fff' }}>{children}</div>}
    </div>
  );
}

const G2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' };
const G3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' };

interface RoleRow { role: string; positions: number; ctc: string; }

export default function AddCampusInvitePage() {
  const navigate = useNavigate();

  /* Institute selection */
  const [institutes, setInstitutes] = useState<InstituteItem[]>([]);
  const [selectedInstituteId, setSelectedInstituteId] = useState<number | null>(null);
  const [instituteSearch, setInstituteSearch] = useState('');

  useEffect(() => {
    api.get('/industry-portal/campus/institutes')
      .then(res => setInstitutes(res.data?.data ?? []))
      .catch(() => setInstitutes([]));
  }, []);

  const filteredInstitutes = institutes.filter(i =>
    i.name?.toLowerCase().includes(instituteSearch.toLowerCase()) ||
    i.city?.toLowerCase().includes(instituteSearch.toLowerCase())
  );
  const selectedInstitute = institutes.find(i => i.id === selectedInstituteId);

  /* Program Details */
  const [programName, setProgramName] = useState('');
  const [stream, setStream] = useState('');
  const [areaOfSpec, setAreaOfSpec] = useState('');
  const [naac, setNaac] = useState('');
  const [rating, setRating] = useState('');
  const [instituteContact, setInstituteContact] = useState('');
  const [instituteEmail, setInstituteEmail] = useState('');

  /* Recruitment Details */
  const [roles, setRoles] = useState<RoleRow[]>([{ role: '', positions: 1, ctc: '' }]);
  const [employmentType, setEmploymentType] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [eligibilityCriteria, setEligibilityCriteria] = useState('');

  /* Campus Drive Details */
  const [driveDate, setDriveDate] = useState('');
  const [driveMode, setDriveMode] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  /* Message */
  const [message, setMessage] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const addRole = () => setRoles(r => [...r, { role: '', positions: 1, ctc: '' }]);
  const removeRole = (i: number) => setRoles(r => r.filter((_, idx) => idx !== i));
  const updateRole = (i: number, k: keyof RoleRow, v: string | number) =>
    setRoles(r => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const handleSubmit = async () => {
    if (!selectedInstituteId || !programName) return alert('Select an institute and enter Program Name.');
    setSaving(true);
    try {
      await api.post('/industry-portal/campus', {
        instituteId: selectedInstituteId,
        programName,
        stream,
        areaOfSpecialization: areaOfSpec,
        naacAccreditation: naac,
        rating: rating ? parseInt(rating) : null,
        employmentType,
        targetDate: targetDate || null,
        eligibilityCriteria,
        jobRoles: JSON.stringify(roles.filter(r => r.role.trim())),
        driveDate: driveDate || null,
        driveMode,
        venueAddress,
        meetingLink,
        contactPerson,
        contactNumber,
        message,
      });
      setSuccess(true);
    } catch {
      alert('Failed to send invite. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '32px' }}>

      {/* ── 1. Select Institute ── */}
      <SectionCard title="Select Institute *">
        {selectedInstitute ? (
          /* Selected — show chip inside search bar, hide dropdown */
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: `1.5px solid #4F46E5`, borderRadius: '8px', padding: '8px 14px', background: '#EEF2FF', minHeight: '44px' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, color: '#4F46E5', fontSize: '14px' }}>{selectedInstitute.name}</span>
              <span style={{ fontSize: '12px', color: '#6366F1', marginLeft: '8px' }}>{selectedInstitute.city}, {selectedInstitute.state} · {selectedInstitute.type}</span>
            </div>
            <button type="button" onClick={() => { setSelectedInstituteId(null); setInstituteSearch(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '20px', padding: '2px 6px', lineHeight: 1 }}>×</button>
          </div>
        ) : (
          /* Not selected — show search + dropdown */
          <>
            <div style={{ marginBottom: '12px' }}>
              <input
                placeholder="Search institute by name or city..."
                value={instituteSearch}
                onChange={e => setInstituteSearch(e.target.value)}
                style={{ width: '100%', height: '44px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ maxHeight: '240px', overflowY: 'auto', border: `1px solid ${BORDER_LIGHT}`, borderRadius: '8px' }}>
              {filteredInstitutes.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: SUB, fontSize: '13px' }}>No approved institutes found</div>
              ) : filteredInstitutes.map(inst => (
                <div key={inst.id} onClick={() => { setSelectedInstituteId(inst.id); setInstituteSearch(''); }}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${BORDER_LIGHT}`, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: TEXT }}>{inst.name}</div>
                    <div style={{ fontSize: '11px', color: SUB, marginTop: '2px' }}>{inst.city}, {inst.state} · {inst.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      {/* ── 2. Program Details ── */}
      <SectionCard title="Program Details *">
        <div style={{ ...G3, marginBottom: '24px' }}>
          <FloatInput label="Program Name" required value={programName} onChange={e => setProgramName(e.target.value)} />
          <FloatSelect label="Stream" required
            options={['Engineering', 'Management', 'Technology', 'Science', 'Commerce', 'Arts', 'Law', 'Medical']}
            value={stream} onChange={setStream} />
          <FloatInput label="Area of Specialization" value={areaOfSpec} onChange={e => setAreaOfSpec(e.target.value)} />
          <FloatSelect label="NAAC Accreditation"
            options={['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'Not Accredited']}
            value={naac} onChange={setNaac} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 500, color: SUB }}>Rating</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(String(n))}
                  style={{ flex: 1, height: '44px', border: `1.5px solid ${rating === String(n) ? PRIMARY : BORDER}`, borderRadius: '8px', background: rating === String(n) ? LIGHT_BG : '#fff', color: rating === String(n) ? PRIMARY : TEXT, fontSize: '15px', fontWeight: rating === String(n) ? 700 : 400, cursor: 'pointer' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── 2. Recruitment Details ── */}
      <SectionCard title="Recruitment Details *">
        {/* Roles table */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>Job Roles &amp; Positions</span>
          <div style={{ border: `1px solid ${BORDER_LIGHT}`, borderRadius: '8px', overflow: 'hidden', marginTop: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Sr No', 'Job Role *', 'No. of Positions', 'CTC / Stipend', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: SUB, borderBottom: `1px solid ${BORDER_LIGHT}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER_LIGHT}` }}>
                    <td style={{ padding: '10px 14px', color: SUB, fontSize: '13px' }}>{String(i + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <input value={r.role} onChange={e => updateRole(i, 'role', e.target.value)}
                        placeholder="e.g. Software Engineer"
                        style={{ width: '100%', height: '38px', border: `1.5px solid ${BORDER}`, borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button type="button" onClick={() => updateRole(i, 'positions', Math.max(1, r.positions - 1))}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
                        <span style={{ fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>{String(r.positions).padStart(2, '0')}</span>
                        <button type="button" onClick={() => updateRole(i, 'positions', r.positions + 1)}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input value={r.ctc} onChange={e => updateRole(i, 'ctc', e.target.value)}
                        placeholder="e.g. ₹6 LPA or ₹15,000/mo"
                        style={{ width: '100%', height: '38px', border: `1.5px solid ${BORDER}`, borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <button type="button" onClick={() => removeRole(i)} disabled={roles.length === 1}
                        style={{ padding: '6px', background: 'none', border: 'none', cursor: roles.length === 1 ? 'not-allowed' : 'pointer', color: roles.length === 1 ? '#CBD5E1' : '#94A3B8' }}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={addRole}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '100px', background: PRIMARY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} /> Add Role
            </button>
          </div>
        </div>

        <div style={{ ...G3, marginBottom: '24px' }}>
          <FloatSelect label="Employment Type" required
            options={['Full Time', 'Part Time', 'Internship', 'Contract']}
            value={employmentType} onChange={setEmploymentType} />
          <FloatInput label="Target Drive Date" required type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
        </div>

        <FloatTextarea label="Eligibility Criteria" value={eligibilityCriteria} onChange={setEligibilityCriteria} />
      </SectionCard>

      {/* ── 3. Campus Drive Details ── */}
      <SectionCard title="Campus Drive Details">
        <div style={{ ...G3, marginBottom: '24px' }}>
          <FloatInput label="Drive Date" type="date" value={driveDate} onChange={e => setDriveDate(e.target.value)} />
          <FloatSelect label="Drive Mode"
            options={['Online', 'Offline', 'Hybrid']}
            value={driveMode} onChange={setDriveMode} />
        </div>

        <div style={{ ...G2, marginBottom: '24px' }}>
          <FloatInput label="Venue Address" value={venueAddress} onChange={e => setVenueAddress(e.target.value)} />
          <FloatInput label="Meeting / Video Link" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} />
        </div>

        <div style={G2}>
          <FloatInput label="Contact Person (Recruiter Name)" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
          <FloatInput label="Contact Number" type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
        </div>
      </SectionCard>

      {/* ── 4. Message to Institute ── */}
      <SectionCard title="Message to Institute">
        <FloatTextarea label="Write a message or note for the institute…" value={message} onChange={setMessage} />
      </SectionCard>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '4px' }}>
        <button type="button" onClick={() => navigate('/industry-portal/campus')}
          style={{ padding: '0 32px', height: '44px', borderRadius: '100px', border: `1.5px solid ${BORDER}`, background: '#fff', fontSize: '14px', cursor: 'pointer', color: TEXT, fontWeight: 500 }}>
          Cancel
        </button>
        <button type="button" onClick={() => handleSubmit()} disabled={saving}
          style={{ padding: '0 36px', height: '44px', borderRadius: '100px', border: 'none', background: '#E91E8C', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Sending…' : 'Send Invite'}
        </button>
      </div>

      {/* Success dialog */}
      {success && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '40px 52px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxWidth: '360px', width: '90%' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span style={{ fontSize: '24px' }}>✓</span>
            </div>
            <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: TEXT }}>Invite Sent Successfully!</p>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: SUB }}>The campus recruitment invite has been sent to the institute.</p>
            <button onClick={() => navigate('/industry-portal/campus')}
              style={{ padding: '0 40px', height: '44px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
