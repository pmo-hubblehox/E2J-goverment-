import { useState } from 'react';
import { ChevronUp, ChevronDown, Edit2, Trash2, Info, Upload, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { uploadFile } from '../../services/uploadFile';

function FloatInput({ label, value, onChange, type = 'text', required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <label style={{
        position: 'absolute', top: '-9px', left: '10px', background: '#fff',
        padding: '0 4px', fontSize: '11px', color: '#94A3B8', fontWeight: 500, zIndex: 1, pointerEvents: 'none',
      }}>
        {label}{required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px',
          padding: '14px 12px 8px', fontSize: '13px', color: '#1E293B',
          outline: 'none', boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

function FloatSelect({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <label style={{
        position: 'absolute', top: '-9px', left: '10px', background: '#fff',
        padding: '0 4px', fontSize: '11px', color: '#94A3B8', fontWeight: 500, zIndex: 1,
      }}>
        {label}{required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px',
          padding: '14px 32px 8px 12px', fontSize: '13px', color: value ? '#1E293B' : '#94A3B8',
          outline: 'none', boxSizing: 'border-box', background: '#fff', appearance: 'none', fontFamily: 'inherit',
        }}
      >
        <option value="">- Select -</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} color="#94A3B8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  );
}

function Section({ title, filled, total, children, defaultOpen = true }: {
  title: string; filled: number; total: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '16px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{title}</span>
          <Info size={14} color="#94A3B8" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>{filled}/{total} Fields Filled</span>
          {open ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </div>
      </button>
      {open && <div style={{ padding: '0 20px 20px', borderTop: '1px solid #F1F5F9' }}>{children}</div>}
    </div>
  );
}

function ListRow({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px',
    }}>
      <span style={{ fontSize: '13px', color: '#1E293B' }}>{label}</span>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px' }}><Edit2 size={15} /></button>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px' }}><Trash2 size={15} /></button>
      </div>
    </div>
  );
}

interface ListItem { id: number; label: string }

export default function StudentProfilePage() {
  const { user } = useAuth();
  const nameParts = (user?.name ?? '').split(' ');

  const [personal, setPersonal] = useState({
    title: '', firstName: nameParts[0] ?? '', middleName: '-',
    lastName: nameParts.slice(1).join(' ') ?? '',
    dob: '', gender: '', nationality: '', maritalStatus: '',
    physicallyDisabled: 'No', remark: '', mobile: '', mobileAlt: '',
    email: user?.email ?? '',
  });
  const [educations, setEducations] = useState<ListItem[]>([
    { id: 1, label: 'B.Tech (Information Technology)' },
    { id: 2, label: 'HSC' },
    { id: 3, label: 'SSC' },
  ]);
  const [experiences, setExperiences] = useState<ListItem[]>([]);
  const [skills, setSkills] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoStoredUrl, setPhotoStoredUrl] = useState('');

  const set = (k: keyof typeof personal) => (v: string) => setPersonal(p => ({ ...p, [k]: v }));
  const personalFilled = Object.values(personal).filter(v => v !== '').length;

  const save = async () => {
    setSaving(true);
    await api.put('/student/profile', { ...personal, educations, experiences, photoUrl: photoStoredUrl || undefined }).catch(() => {});
    setSaving(false);
  };

  return (
    <div style={{ padding: '20px 24px', maxWidth: '900px' }}>
      <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>
        Note : Please Fill In All The Required Fields Marked With An Asterisk (*).
      </p>

      {/* Personal Information */}
      <Section title="Personal Information" filled={personalFilled} total={18}>
        <div style={{ display: 'flex', gap: '28px', paddingTop: '16px' }}>
          {/* Photo */}
          <div style={{ width: '120px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Add Profile Photo</span>
            <div style={{
              width: '100px', height: '100px', borderRadius: '12px',
              border: '1.5px dashed #CBD5E1', background: '#F8FAFC',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {photoUrl
                ? <img src={photoUrl} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Upload size={24} color="#CBD5E1" />}
            </div>
            <label style={{
              padding: '7px 20px', border: '1.5px solid #4F46E5', borderRadius: '20px',
              fontSize: '12px', color: '#4F46E5', cursor: 'pointer', fontWeight: 500,
            }}>
              Upload
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                setPhotoUrl(URL.createObjectURL(f));
                try {
                  const studentName = `${personal.firstName}_${personal.lastName}`.trim() || 'unknown';
                  const { url } = await uploadFile(f, 'student', studentName, 'Photo');
                  setPhotoStoredUrl(url);
                } catch {}
                e.target.value = '';
              }} />
            </label>
          </div>

          {/* Grid */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <FloatSelect label="Title" value={personal.title} onChange={set('title')} options={['Mr.', 'Ms.', 'Mrs.', 'Dr.']} required />
            <FloatInput label="First Name" value={personal.firstName} onChange={set('firstName')} required />
            <FloatInput label="Middle Name" value={personal.middleName} onChange={set('middleName')} placeholder="-" />
            <FloatInput label="Last Name" value={personal.lastName} onChange={set('lastName')} required />
            <FloatInput label="DOB" value={personal.dob} onChange={set('dob')} type="date" required />
            <FloatSelect label="Candidate Gender" value={personal.gender} onChange={set('gender')} options={['Male', 'Female', 'Other', 'Prefer not to say']} required />
            <FloatInput label="Nationality" value={personal.nationality} onChange={set('nationality')} required placeholder="Indian" />
            <FloatSelect label="Marital Status" value={personal.maritalStatus} onChange={set('maritalStatus')} options={['Unmarried', 'Married', 'Divorced', 'Widowed']} />
            <FloatSelect label="Is Physically Challenged" value={personal.physicallyDisabled} onChange={set('physicallyDisabled')} options={['No', 'Yes']} />
            <FloatInput label="Remark" value={personal.remark} onChange={set('remark')} placeholder="Enter Remark" />

            {/* Mobile Primary */}
            <div style={{ position: 'relative' }}>
              <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#94A3B8', fontWeight: 500, zIndex: 1 }}>
                Mobile Number (Primary)<span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 10px', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <span style={{ fontSize: '14px' }}>🇮🇳</span>
                  <span style={{ fontSize: '12px', color: '#1E293B' }}>+91</span>
                  <ChevronDown size={11} color="#94A3B8" />
                </div>
                <span style={{ alignSelf: 'center', color: '#E2E8F0', fontSize: '18px', padding: '0 2px' }}>|</span>
                <input type="tel" value={personal.mobile} onChange={e => set('mobile')(e.target.value)} placeholder="00000000000"
                  style={{ flex: 1, border: 'none', padding: '10px 8px', fontSize: '13px', color: '#1E293B', outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            {/* Mobile Alternate */}
            <div style={{ position: 'relative' }}>
              <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#94A3B8', fontWeight: 500, zIndex: 1 }}>
                Mobile Number (Alternate)
              </label>
              <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 10px', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <span style={{ fontSize: '14px' }}>🇮🇳</span>
                  <span style={{ fontSize: '12px', color: '#1E293B' }}>+91</span>
                  <ChevronDown size={11} color="#94A3B8" />
                </div>
                <span style={{ alignSelf: 'center', color: '#E2E8F0', fontSize: '18px', padding: '0 2px' }}>|</span>
                <input type="tel" value={personal.mobileAlt} onChange={e => set('mobileAlt')(e.target.value)} placeholder="00000000000"
                  style={{ flex: 1, border: 'none', padding: '10px 8px', fontSize: '13px', color: '#1E293B', outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <FloatInput label="Email" value={personal.email} onChange={set('email')} type="email" required />
            </div>
          </div>
        </div>
      </Section>

      {/* Education Details */}
      <Section title="Education Details" filled={educations.length} total={educations.length + 1}>
        <div style={{ paddingTop: '12px' }}>
          {educations.map(e => (
            <ListRow key={e.id} label={e.label} onEdit={() => {}} onDelete={() => setEducations(p => p.filter(x => x.id !== e.id))} />
          ))}
          <button
            onClick={() => setEducations(p => [...p, { id: Date.now(), label: 'New Education Entry' }])}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#4F46E5', fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginTop: '4px' }}
          >
            <Plus size={14} /> Add Another Education
          </button>
        </div>
      </Section>

      {/* Total Experience */}
      <Section title="Total Experience" filled={experiences.length} total={Math.max(experiences.length, 1)}>
        <div style={{ paddingTop: '12px' }}>
          {experiences.length === 0 && (
            <p style={{ fontSize: '13px', color: '#CBD5E1', fontStyle: 'italic', marginBottom: '8px' }}>No experience added yet</p>
          )}
          {experiences.map(e => (
            <ListRow key={e.id} label={e.label} onEdit={() => {}} onDelete={() => setExperiences(p => p.filter(x => x.id !== e.id))} />
          ))}
          <button
            onClick={() => setExperiences(p => [...p, { id: Date.now(), label: 'Company Name' }])}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#4F46E5', fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginTop: '4px' }}
          >
            <Plus size={14} /> Add Another Experience
          </button>
        </div>
      </Section>

      {/* Key Skills */}
      <Section title="Key Skills" filled={skills ? 1 : 0} total={1} defaultOpen={false}>
        <div style={{ paddingTop: '12px' }}>
          <FloatInput label="Skills (comma separated)" value={skills} onChange={setSkills} placeholder="e.g. Python, React, SQL" />
          {skills && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                <span key={s} style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingBottom: '32px' }}>
        <button style={{ padding: '10px 28px', border: '1.5px solid #E2E8F0', borderRadius: '24px', background: '#fff', color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
          Back
        </button>
        <button
          onClick={save} disabled={saving}
          style={{ padding: '10px 32px', border: 'none', borderRadius: '24px', background: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
