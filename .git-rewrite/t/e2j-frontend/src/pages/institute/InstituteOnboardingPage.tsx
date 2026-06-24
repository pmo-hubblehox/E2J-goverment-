import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, ChevronDown, Upload, X, Check, Plus } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

// ─── State → City mapping ──────────────────────────────────────────────────────
const STATE_CITIES: Record<string, string[]> = {
  'Maharashtra':      ['Mumbai', 'Pune', 'Nanded', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Thane', 'Amravati'],
  'Karnataka':        ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi', 'Davangere', 'Ballari'],
  'Delhi':            ['New Delhi', 'Delhi'],
  'Tamil Nadu':       ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy', 'Tirunelveli', 'Vellore'],
  'Gujarat':          ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar'],
  'Rajasthan':        ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Bhilwara'],
  'Uttar Pradesh':    ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Noida', 'Ghaziabad', 'Meerut', 'Bareilly'],
  'Telangana':        ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam'],
  'Kerala':           ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kannur', 'Kollam'],
  'Punjab':           ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
  'Madhya Pradesh':   ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar'],
  'Andhra Pradesh':   ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool'],
  'West Bengal':      ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
  'Bihar':            ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'],
  'Odisha':           ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'],
  'Haryana':          ['Gurugram', 'Faridabad', 'Hisar', 'Rohtak', 'Panipat', 'Ambala'],
  'Jharkhand':        ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
  'Chhattisgarh':     ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
  'Uttarakhand':      ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu'],
  'Goa':              ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Assam':            ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Tezpur'],
};
const STATES = Object.keys(STATE_CITIES).sort();

// Validators
const isValidPincode   = (v: string) => /^\d{6}$/.test(v);
const isValidEmail     = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone     = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/[\s+\-]/g, ''));

// ─── Design tokens (company standard) ─────────────────────────────────────────
const PRIMARY = '#3F41D1';
const BG      = '#F4F5FF';
const BORDER  = '#E2E8F0';
const TEXT    = '#212121';
const SUB     = '#666666';

// ─── Shared styles ─────────────────────────────────────────────────────────────
const sectionBox: React.CSSProperties  = { border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px', marginBottom: '20px', background: '#fff' };
const sectionTitle: React.CSSProperties = { fontSize: '15px', fontWeight: 700, color: TEXT, margin: '0 0 16px' };
const rowStyle: React.CSSProperties   = { display: 'flex', flexWrap: 'wrap' as const, gap: '16px' };
const fieldWrap: React.CSSProperties  = { flex: '1 1 220px', minWidth: 0 };
const fieldFull: React.CSSProperties  = { flex: '1 1 100%', minWidth: 0 };
const labelSt: React.CSSProperties    = { display: 'block', fontSize: '13px', fontWeight: 500, color: SUB, marginBottom: '6px' };
const inputSt: React.CSSProperties    = { width: '100%', boxSizing: 'border-box' as const, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: TEXT, outline: 'none', background: '#fff' };
const selectSt: React.CSSProperties   = { ...inputSt, appearance: 'none' as const, paddingRight: '36px' };

// ─── Field components ──────────────────────────────────────────────────────────
function F({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div style={full ? fieldFull : fieldWrap}>
      <label style={labelSt}>{label}{required && <span style={{ color: '#E6393E' }}> *</span>}</label>
      {children}
    </div>
  );
}

function InputF({ label, required, full, value, onChange, placeholder, type, error }: { label: string; required?: boolean; full?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string }) {
  return (
    <F label={label} required={required} full={full}>
      <input type={type ?? 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? ''} style={{ ...inputSt, borderColor: error ? '#E6393E' : BORDER }} />
      {error && <span style={{ fontSize: '11px', color: '#E6393E', marginTop: '3px', display: 'block' }}>{error}</span>}
    </F>
  );
}

function SelectF({ label, required, full, value, onChange, options, error }: { label: string; required?: boolean; full?: boolean; value: string; onChange: (v: string) => void; options: string[]; error?: string }) {
  return (
    <F label={label} required={required} full={full}>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...selectSt, borderColor: error ? '#E6393E' : BORDER }}>
          {options.map(o => <option key={o} value={o}>{o || `Select ${label}`}</option>)}
        </select>
        <ChevronDown size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: SUB, pointerEvents: 'none' }} />
      </div>
      {error && <span style={{ fontSize: '11px', color: '#E6393E', marginTop: '3px', display: 'block' }}>{error}</span>}
    </F>
  );
}

function FileF({ label, required, full, instituteName, docType, value, onChange }: {
  label: string; required?: boolean; full?: boolean;
  instituteName: string; docType: string;
  value: string; onChange: (url: string, name: string) => void;
}) {
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('userType', 'institute');
      fd.append('entityName', instituteName || 'default');
      fd.append('docType', docType);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.data?.url ?? '';
      setFileName(file.name);
      onChange(url, file.name);
    } catch { /* ignore */ }
    finally { setUploading(false); }
  };

  return (
    <F label={label} required={required} full={full}>
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', background: '#F8FAFC' }}>
          <span style={{ fontSize: '13px', color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName || 'Uploaded'}</span>
          <button onClick={() => { onChange('', ''); setFileName(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E6393E', display: 'flex' }}><X size={14} /></button>
        </div>
      ) : (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', background: '#F8FAFC' }}>
          <Upload size={14} color={SUB} />
          <span style={{ fontSize: '13px', color: uploading ? PRIMARY : SUB }}>{uploading ? 'Uploading…' : 'Browse'}</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: 'auto' }}>PDF, JPG, PNG (Max 1MB)</span>
        </label>
      )}
    </F>
  );
}

// ─── Step 1: Institute Information ─────────────────────────────────────────────
function StepInstituteInfo({ instituteName, entityId, onSave }: { instituteName: string; entityId: string; onSave: (data: any) => Promise<void> }) {
  const [name, setName]               = useState(instituteName);
  const [type, setType]               = useState('');
  const [website, setWebsite]         = useState('');
  const [building, setBuilding]       = useState('');
  const [room, setRoom]               = useState('');
  const [country, setCountry]         = useState('India');
  const [pincode, setPincode]         = useState('');
  const [state, setState]             = useState('');
  const [city, setCity]               = useState('');
  const [area, setArea]               = useState('');
  const [landmark, setLandmark]       = useState('');
  const [locationPin, setLocationPin] = useState('');
  const [contacts, setContacts]       = useState([{ name: '', email: '', phone: '' }]);
  const [accBody, setAccBody]         = useState('');
  const [accCertUrl, setAccCertUrl]   = useState('');
  const [uniCertUrl, setUniCertUrl]   = useState('');
  const [ratingUrl, setRatingUrl]     = useState('');
  const [ugcUrl, setUgcUrl]           = useState('');
  const [mouUrl, setMouUrl]           = useState('');
  const [saving, setSaving]           = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  const instName  = entityId;
  const cityOpts  = state ? ['', ...(STATE_CITIES[state] ?? [])] : [''];

  const handleStateChange = (v: string) => { setState(v); setCity(''); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())        e.name = 'Institute name is required';
    if (!type)               e.type = 'Type is required';
    if (!building.trim())    e.building = 'Building name is required';
    if (!room.trim())        e.room = 'Room/floor is required';
    if (!pincode)            e.pincode = 'Pincode is required';
    else if (!isValidPincode(pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    if (!state)              e.state = 'State is required';
    if (!city)               e.city = 'City is required';
    if (!locationPin.trim()) e.locationPin = 'Location pin is required';
    if (!accBody)            e.accBody = 'Accreditation body is required';
    if (!accCertUrl)         e.accCertUrl = 'Accreditation certificate is required';
    if (!uniCertUrl)         e.uniCertUrl = 'University certificate is required';
    if (!ugcUrl)             e.ugcUrl = 'UGC certificate is required';
    if (!mouUrl)             e.mouUrl = 'Signed MoU is required';
    contacts.forEach((c, i) => {
      if (!c.name.trim())          e[`c${i}name`]  = 'Name is required';
      if (!c.email.trim())         e[`c${i}email`] = 'Email is required';
      else if (!isValidEmail(c.email)) e[`c${i}email`] = 'Enter a valid email';
      if (!c.phone.trim())         e[`c${i}phone`] = 'Phone is required';
      else if (!isValidPhone(c.phone)) e[`c${i}phone`] = 'Enter a valid 10-digit mobile number';
    });
    return e;
  };

  const handleNext = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await onSave({
        name, type, websiteUrl: website, buildingName: building, roomFloor: room,
        country, pincode, state, city, area, landmark, locationPin,
        accreditationBody: accBody, accreditationCertUrl: accCertUrl,
        universityCertUrl: uniCertUrl, ratingDocUrl: ratingUrl,
        ugcCertUrl: ugcUrl, mouUrl,
        contactsJson: JSON.stringify(contacts),
      });
    } catch (e: any) {
      setErrors({ _form: e?.response?.data?.message ?? 'Failed to save. Try again.' });
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Institute Details */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <span style={sectionTitle}>Institute Details</span>
          <Info size={14} color="#94A3B8" />
        </div>
        <div style={rowStyle}>
          <InputF label="Name Of Institute" required value={name} onChange={setName} placeholder="e.g. ABC Engineering College" error={errors.name} />
          <SelectF label="Type Of Institute" required value={type} onChange={setType} options={['', 'Private', 'Government', 'Deemed', 'Autonomous']} error={errors.type} />
          <InputF label="Website URL" full value={website} onChange={setWebsite} placeholder="https://institute.edu.in" />
        </div>
      </div>

      {/* Registered Address */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <span style={sectionTitle}>Registered Address</span>
          <Info size={14} color="#94A3B8" />
        </div>
        <div style={rowStyle}>
          <InputF label="Building Name" required full value={building} onChange={setBuilding} placeholder="e.g. Main Building, A-Wing" error={errors.building} />
          <InputF label="Room Number, Floor" required full value={room} onChange={setRoom} placeholder="e.g. Room 101, Ground Floor" error={errors.room} />
          <SelectF label="Country" value={country} onChange={setCountry} options={['India']} />
          <InputF label="Pincode" required value={pincode} onChange={v => { if (/^\d{0,6}$/.test(v)) setPincode(v); }} placeholder="411001" error={errors.pincode} />
          <SelectF label="State" required value={state} onChange={handleStateChange} options={['', ...STATES]} error={errors.state} />
          <SelectF label="City" required value={city} onChange={setCity} options={state ? cityOpts : ['']} error={errors.city} />
          <InputF label="Area / Locality" value={area} onChange={setArea} placeholder="e.g. Hinjewadi" />
          <InputF label="Landmark" value={landmark} onChange={setLandmark} placeholder="e.g. Near Railway Station" />
          <InputF label="Location Pin (Google Maps URL)" required full value={locationPin} onChange={setLocationPin} placeholder="https://maps.google.com/..." error={errors.locationPin} />
        </div>
      </div>

      {/* Placement Officer Info */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <span style={sectionTitle}>Placement Officer Info</span>
          <Info size={14} color="#94A3B8" />
        </div>
        {contacts.map((c, i) => (
          <div key={i} style={{ ...rowStyle, marginBottom: i < contacts.length - 1 ? '16px' : 0, paddingBottom: i < contacts.length - 1 ? '16px' : 0, borderBottom: i < contacts.length - 1 ? `1px solid #F1F5F9` : 'none' }}>
            <InputF label="Contact Person Name" required value={c.name} onChange={v => setContacts(cs => cs.map((x, j) => j === i ? { ...x, name: v } : x))} placeholder="Full name" error={errors[`c${i}name`]} />
            <InputF label="Contact Person Email" required type="email" value={c.email} onChange={v => setContacts(cs => cs.map((x, j) => j === i ? { ...x, email: v } : x))} placeholder="email@institute.edu.in" error={errors[`c${i}email`]} />
            <InputF label="Contact Person Phone Number" required value={c.phone} onChange={v => setContacts(cs => cs.map((x, j) => j === i ? { ...x, phone: v } : x))} placeholder="9876543210" error={errors[`c${i}phone`]} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
          <button onClick={() => setContacts(c => [...c, { name: '', email: '', phone: '' }])}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: PRIMARY, border: 'none', borderRadius: '20px', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '8px 18px', cursor: 'pointer' }}>
            <Plus size={13} /> Add Contacts
          </button>
        </div>
      </div>

      {/* Documents */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <span style={sectionTitle}>Documents</span>
          <Info size={14} color="#94A3B8" />
        </div>
        <div style={rowStyle}>
          <SelectF label="Accreditation Body" required value={accBody} onChange={setAccBody} options={['', 'AICTE', 'UGC', 'NAAC', 'NBA']} error={errors.accBody} />
          <FileF label="Accreditation Certificate" required instituteName={instName} docType="accreditation-cert" value={accCertUrl} onChange={url => setAccCertUrl(url)} />
          {errors.accCertUrl && <span style={{ fontSize: '11px', color: '#E6393E', width: '100%' }}>{errors.accCertUrl}</span>}
          <FileF label="University Certificate" required instituteName={instName} docType="university-cert" value={uniCertUrl} onChange={url => setUniCertUrl(url)} />
          {errors.uniCertUrl && <span style={{ fontSize: '11px', color: '#E6393E', width: '100%' }}>{errors.uniCertUrl}</span>}
          <FileF label="Rating Document" instituteName={instName} docType="rating-doc" value={ratingUrl} onChange={url => setRatingUrl(url)} />
          <FileF label="UGC Certificate" required full instituteName={instName} docType="ugc-cert" value={ugcUrl} onChange={url => setUgcUrl(url)} />
          {errors.ugcUrl && <span style={{ fontSize: '11px', color: '#E6393E', width: '100%' }}>{errors.ugcUrl}</span>}
        </div>
      </div>

      {/* MoU */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ ...sectionTitle, margin: 0 }}>MoU</span>
            <Info size={14} color="#94A3B8" />
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: 500 }}>
            Download MoU Template
          </button>
        </div>
        <p style={{ fontSize: '13px', color: SUB, margin: '0 0 12px' }}>Upload Signed MoU <span style={{ color: '#E6393E' }}>*</span></p>
        {mouUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px dashed ${BORDER}`, borderRadius: '8px', padding: '16px', background: '#F8FAFC' }}>
            <span style={{ fontSize: '13px', color: TEXT, flex: 1 }}>MoU uploaded</span>
            <button onClick={() => setMouUrl('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E6393E' }}><X size={14} /></button>
          </div>
        ) : (
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${errors.mouUrl ? '#E6393E' : BORDER}`, borderRadius: '8px', padding: '32px', cursor: 'pointer', background: '#F8FAFC', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: SUB }}>Drag Your File Here Or <span style={{ color: PRIMARY, fontWeight: 600 }}>Browse File</span></span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Maximum File Size is 10MB</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={async e => {
              if (!e.target.files?.[0]) return;
              const file = e.target.files[0];
              const fd = new FormData();
              fd.append('file', file); fd.append('userType', 'institute');
              fd.append('entityName', instName); fd.append('docType', 'mou');
              try { const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setMouUrl(res.data?.data?.url ?? ''); } catch { /* ignore */ }
            }} />
          </label>
        )}
        {errors.mouUrl && <span style={{ fontSize: '11px', color: '#E6393E', marginTop: '4px', display: 'block' }}>{errors.mouUrl}</span>}
      </div>

      {errors._form && <p style={{ color: '#E6393E', fontSize: '13px', margin: '0 0 12px' }}>{errors._form}</p>}

      <button id="step1-next" onClick={handleNext} disabled={saving} style={{ display: 'none' }}>
        {saving ? 'Saving…' : 'Next'}
      </button>
    </div>
  );
}

// ─── Step 2: Services ──────────────────────────────────────────────────────────
function StepServices({ total, setTotal, onSave }: { total: number; setTotal: (n: number) => void; onSave: (data: any) => Promise<void> }) {
  const [skillGap, setSkillGap]       = useState(false);
  const [shareFaculty, setShareFaculty] = useState(true);
  const [shareInfra, setShareInfra]   = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const handleNext = async () => {
    setSaving(true); setError('');
    try {
      const avail = skillGap ? ['Student Skill Gap'] : [];
      const offer: string[] = [];
      if (shareFaculty) offer.push('Share Faculty For Tutoring Courses');
      if (shareInfra)   offer.push('Share Infrastructure For Tutoring Courses');
      await onSave({ servicesAvail: avail, servicesOffer: offer });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <span style={sectionTitle}>Services To Avail</span>
          <Info size={14} color="#94A3B8" />
        </div>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: TEXT, fontWeight: 500 }}>
            <input type="checkbox" checked={skillGap} onChange={e => { setSkillGap(e.target.checked); setTotal(e.target.checked ? 9000 : 0); }}
              style={{ width: '16px', height: '16px', accentColor: PRIMARY }} />
            Student Skill Gap
          </label>
          <span style={{ fontSize: '14px', color: SUB, fontWeight: 500 }}>₹ 9,000</span>
        </div>
      </div>

      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <span style={sectionTitle}>Services To Offer</span>
          <Info size={14} color="#94A3B8" />
        </div>
        {[
          { label: 'Share Faculty For Tutoring Courses', val: shareFaculty, set: setShareFaculty },
          { label: 'Share Infrastructure For Tutoring Courses', val: shareInfra, set: setShareInfra },
        ].map(s => (
          <div key={s.label} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: TEXT, fontWeight: 500 }}>
              <input type="checkbox" checked={s.val} onChange={e => s.set(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: PRIMARY }} />
              {s.label}
            </label>
            <span style={{ fontSize: '14px', color: SUB, fontWeight: 500 }}>₹ 0</span>
          </div>
        ))}
      </div>

      <div style={{ ...sectionBox, background: BG, border: `1px solid #C7D2FE` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: TEXT }}>Total Payable Amount </span>
            <span style={{ fontSize: '12px', color: SUB }}>(Including GST)</span>
          </div>
          <span style={{ fontSize: '22px', fontWeight: 700, color: PRIMARY }}>₹ {total.toLocaleString()}</span>
        </div>
      </div>

      {error && <p style={{ color: '#E6393E', fontSize: '13px' }}>{error}</p>}
      <button id="step2-next" onClick={handleNext} disabled={saving} style={{ display: 'none' }}>next</button>
    </div>
  );
}

// ─── Step 3: Payments ──────────────────────────────────────────────────────────
function StepPayments({ total, onPay }: { total: number; onPay: (data: any) => Promise<void> }) {
  const [payMethod, setPayMethod] = useState<'cheque' | 'upi' | 'cash'>('cheque');
  const [isManual, setIsManual]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const gst       = Math.round(total * 0.09);
  const grandTotal = total + gst * 2;

  const handlePay = async () => {
    setSaving(true); setError('');
    try { await onPay({ paymentMethod: payMethod, paymentAmount: grandTotal }); }
    catch (e: any) { setError(e?.response?.data?.message ?? 'Failed to record payment.'); setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Left */}
      <div style={{ flex: '1 1 560px' }}>
        <div style={sectionBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={sectionTitle}>Billing Address</span>
            <button style={{ border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', padding: '6px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: TEXT }}>Change Address</button>
          </div>
          <p style={{ fontSize: '13px', color: PRIMARY, margin: '0 0 2px', fontWeight: 600 }}>Institute Admin</p>
          <p style={{ fontSize: '13px', color: SUB, margin: 0 }}>Registered Address</p>
        </div>

        <div style={sectionBox}>
          <span style={sectionTitle}>Your Order Summary</span>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Sr.', 'Item Name', 'Unit Price (₹)', 'Qty', 'UOM', 'Taxable Amt', 'Tax Type', 'Rate', 'Tax Amt (₹)'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: SUB, fontWeight: 500, whiteSpace: 'nowrap', borderBottom: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {total > 0 ? (
                  <>
                    <tr>
                      <td style={{ padding: '10px 12px' }}>1</td>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>Student Skill Gap</td>
                      <td style={{ padding: '10px 12px' }}>₹{total.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px' }}>1</td>
                      <td style={{ padding: '10px 12px' }}>Number</td>
                      <td style={{ padding: '10px 12px' }}>₹{total.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px' }}>CGST</td>
                      <td style={{ padding: '10px 12px' }}>4.5%</td>
                      <td style={{ padding: '10px 12px' }}>₹{gst}</td>
                    </tr>
                    <tr>
                      <td colSpan={6} />
                      <td style={{ padding: '10px 12px', color: SUB }}>SGST</td>
                      <td style={{ padding: '10px 12px', color: SUB }}>4.5%</td>
                      <td style={{ padding: '10px 12px', color: SUB }}>₹{gst}</td>
                    </tr>
                  </>
                ) : (
                  <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>No services selected</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '16px', background: BG, borderRadius: '8px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>Total Payable Amount </span>
              <span style={{ fontSize: '12px', color: SUB }}>(Including GST)</span>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, color: PRIMARY }}>₹ {grandTotal.toLocaleString()}.00</span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ flex: '0 0 280px' }}>
        <div style={sectionBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={sectionTitle}>Select Payment Method</span>
          </div>
          <p style={{ fontSize: '13px', color: SUB, margin: '0 0 16px' }}>VH | Global Education Foundation</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: TEXT, cursor: 'pointer', marginBottom: '16px', fontWeight: 500 }}>
            <input type="checkbox" checked={isManual} onChange={e => setIsManual(e.target.checked)} style={{ accentColor: PRIMARY, width: '15px', height: '15px' }} />
            Is Manual Receipt?
          </label>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: SUB, marginBottom: '6px' }}>Amount</label>
          <input value={`₹ ${grandTotal.toLocaleString()}.00`} readOnly style={{ ...inputSt, fontWeight: 600, color: PRIMARY, marginBottom: '16px', background: '#F8FAFC' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[{ id: 'cheque', label: 'Cheque (CDC/PDC/DD)' }, { id: 'upi', label: 'UPI' }, { id: 'cash', label: 'Cash' }].map(m => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: TEXT, padding: '10px 14px', border: `1.5px solid ${payMethod === m.id ? PRIMARY : BORDER}`, borderRadius: '8px', background: payMethod === m.id ? BG : '#fff' }}>
                <input type="radio" name="payMethod" checked={payMethod === m.id} onChange={() => setPayMethod(m.id as any)} style={{ accentColor: PRIMARY, width: '15px', height: '15px' }} />
                <span style={{ fontWeight: payMethod === m.id ? 600 : 400 }}>{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && <p style={{ color: '#E6393E', fontSize: '13px', width: '100%' }}>{error}</p>}
      <button id="step3-pay" onClick={handlePay} disabled={saving} style={{ display: 'none' }}>pay</button>
    </div>
  );
}

// ─── Main Wizard ───────────────────────────────────────────────────────────────
const STEPS = ['Institute Information', 'Services', 'Payments'];

export default function InstituteOnboardingPage() {
  const navigate     = useNavigate();
  const user         = useAuthStore(s => s.user);
  const [step, setStep]       = useState(0);
  const [total, setTotal]     = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entityId, setEntityId] = useState('institute');

  // fetch canonical name from DB on mount so the upload folder is always consistent
  useEffect(() => {
    api.get('/institute/profile').then(r => {
      const savedName: string = r.data?.data?.name ?? '';
      if (savedName) setEntityId(savedName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, ''));
    }).catch(() => {});
  }, []);

  const instName  = user?.name ?? 'institute';

  const saveInfo = async (data: any) => {
    await api.put('/institute/onboarding/info', data);
    setStep(1);
  };

  const saveServices = async (data: any) => {
    await api.put('/institute/onboarding/services', data);
    setStep(2);
  };

  const savePayment = async (data: any) => {
    setLoading(true);
    await api.post('/institute/onboarding/payment', data);
    setLoading(false);
    setSubmitted(true);
  };

  const triggerNext = () => {
    if (step === 0) document.getElementById('step1-next')?.click();
    else if (step === 1) document.getElementById('step2-next')?.click();
    else document.getElementById('step3-pay')?.click();
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '32px 32px 120px', boxSizing: 'border-box' }}>
        {/* Header */}
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Institute Registration</h1>
        <p style={{ fontSize: '13px', color: SUB, margin: '0 0 28px', lineHeight: 1.6 }}>
          "Kindly Fill In The Required Information Below To Complete Your Onboarding To The Portal. This Will Ensure A Smooth Setup And Enable Full Access To The Platform Features."
        </p>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: done || active ? PRIMARY : '#E2E8F0', color: done || active ? '#fff' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                    {done ? <Check size={15} /> : i + 1}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? PRIMARY : done ? PRIMARY : '#94A3B8', whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: '2px', background: done ? PRIMARY : '#E2E8F0', margin: '0 16px' }} />}
              </div>
            );
          })}
        </div>

        <div style={{ display: step === 0 ? 'block' : 'none' }}><StepInstituteInfo instituteName={instName} entityId={entityId} onSave={saveInfo} /></div>
        <div style={{ display: step === 1 ? 'block' : 'none' }}><StepServices total={total} setTotal={setTotal} onSave={saveServices} /></div>
        <div style={{ display: step === 2 ? 'block' : 'none' }}><StepPayments total={total} onPay={savePayment} /></div>
      </div>

      {/* Fixed footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${BORDER}`, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <p style={{ fontSize: '12px', color: SUB, margin: 0 }}>© 2024, Powered By <span style={{ color: PRIMARY, fontWeight: 600 }}>HubbleHox</span></p>
        <div style={{ display: 'flex', gap: '12px' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ padding: '10px 28px', border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', fontSize: '14px', fontWeight: 500, color: TEXT, cursor: 'pointer' }}>
              Back
            </button>
          )}
          {step === 0 && (
            <button onClick={() => navigate('/')}
              style={{ padding: '10px 28px', border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', fontSize: '14px', fontWeight: 500, color: TEXT, cursor: 'pointer' }}>
              Cancel
            </button>
          )}
          <button onClick={triggerNext} disabled={loading}
            style={{ padding: '10px 32px', border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Processing…' : step === 2 ? 'Pay Now' : 'Next'}
          </button>
        </div>
      </div>

      {/* Success modal */}
      {submitted && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '48px 40px', textAlign: 'center', width: '360px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={30} color={PRIMARY} />
            </div>
            <p style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>Payment Recorded!</p>
            <p style={{ fontSize: '13px', color: SUB, margin: '0 0 24px' }}>Now complete your institute setup — add programs, students, faculty, and infrastructure details.</p>
            <button onClick={() => navigate('/institute/setup')}
              style={{ background: PRIMARY, border: 'none', borderRadius: '24px', color: '#fff', fontSize: '15px', fontWeight: 600, padding: '12px 48px', cursor: 'pointer' }}>
              Continue Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
