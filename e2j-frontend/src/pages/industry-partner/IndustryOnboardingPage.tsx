import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Paperclip, X, Check, Info, Trash2, Plus } from 'lucide-react';
import api from '../../services/api';
import { uploadFile } from '../../services/uploadFile';
import { INDIA_STATE_CITIES, INDIA_STATE_LIST } from '../../utils/indiaCities';

// ── Design-standard tokens ────────────────────────────────────────────────────
const PRIMARY     = '#3F41D1';
const BORDER      = '#A3A3A3';
const TEXT_MAIN   = '#212121';
const TEXT_SUB    = '#666666';
const ACCENT_PINK = '#E91E8C';

// ── Layout ────────────────────────────────────────────────────────────────────
const row:   React.CSSProperties = { display: 'flex', flexWrap: 'wrap' as const, gap: '16px' };
const half:  React.CSSProperties = { flex: '1 1 calc(50% - 8px)', minWidth: '220px' };
const third: React.CSSProperties = { flex: '1 1 calc(33% - 11px)', minWidth: '160px' };
const full:  React.CSSProperties = { flex: '1 1 100%' };

// ── Field primitives ──────────────────────────────────────────────────────────
const labelSt: React.CSSProperties = {
  display: 'block', fontSize: '12px', color: TEXT_SUB,
  marginBottom: '6px', textTransform: 'capitalize' as const,
};
const inputSt: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box' as const, height: '44px',
  border: `1px solid ${BORDER}`, borderRadius: '4px',
  padding: '0 14px', fontSize: '14px', color: TEXT_MAIN, outline: 'none', background: '#fff',
};
const textareaSt: React.CSSProperties = {
  ...inputSt, height: 'auto', minHeight: '96px', padding: '12px 14px', resize: 'vertical' as const,
};

// ── Option data ───────────────────────────────────────────────────────────────
const INDUSTRY_SECTORS = ['Technology','Manufacturing','Healthcare','Finance','Education','Retail','Logistics','Automotive','Energy','Construction','Other'];
const ORG_SIZES        = ['1–10','11–50','51–200','200–500','500–1000','1000+'];
const INDIAN_STATES    = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu','Delhi','Ladakh','Lakshadweep','Puducherry'];
const JOB_ROLES        = ['Software Engineer','Data Analyst','HR','Sales','Operations','Finance','Marketing','Product Manager','Other'];
const EMP_BENEFITS     = ['Health Insurance','Provident Fund','Gratuity','Paid Leave','Stock Options','Flexible Hours','Remote Work','Transport Allowance'];
const TRAIN_SECTORS    = ['Software Development','Data Science','Cloud Computing','Embedded Systems','Electronics','Mechanical','Civil','Finance','Management','Other'];
const TRAIN_MODES      = ['Online','Offline','Hybrid'];
const CONTACT_TYPES    = ['Primary','Secondary','HR','Finance','Technical','Operations'];

// ── Reusable widgets ──────────────────────────────────────────────────────────
function Sel({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputSt, appearance: 'none' as const, paddingRight: '34px', cursor: 'pointer' }}>
        <option value="">{placeholder ?? 'Select'}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: TEXT_SUB, pointerEvents: 'none' }} />
    </div>
  );
}

function MultiChips({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o]);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px', padding: '6px 0' }}>
      {options.map(o => {
        const on = selected.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${on ? PRIMARY : BORDER}`, background: on ? '#EEEEFF' : '#fff', color: on ? PRIMARY : TEXT_SUB }}>
            {o}{on && <X size={11} />}
          </button>
        );
      })}
    </div>
  );
}

function FileField({ label, required, value, displayName, onChange, companyName, docType }: {
  label: string; required?: boolean; value: string; displayName?: string;
  onChange: (url: string, name: string) => void;
  companyName: string; docType: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (file.size > 1 * 1024 * 1024) { setError('File exceeds 1MB limit'); return; }
    setError('');
    setUploading(true);
    try {
      const { url, name } = await uploadFile(file, 'industry-partner', companyName || 'unknown', docType);
      onChange(url, name);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const fileName = displayName || (value ? value.split('/').pop() : '');

  return (
    <div>
      <label style={labelSt}>{label}{required && <span style={{ color: '#E6393E', marginLeft: '2px' }}>*</span>}</label>
      <div style={{ ...inputSt, display: 'flex', alignItems: 'center', padding: '0 14px', gap: '8px', height: '44px', borderColor: error ? '#E6393E' : BORDER }}>
        <span style={{ flex: 1, fontSize: '14px', color: fileName ? TEXT_MAIN : BORDER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {uploading ? 'Uploading…' : (fileName || 'Browse')}
        </span>
        {value && !uploading && (
          <button type="button" onClick={() => onChange('', '')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: BORDER, padding: 0, display: 'flex', flexShrink: 0 }}>
            <X size={13} />
          </button>
        )}
        <label style={{ cursor: uploading ? 'not-allowed' : 'pointer', color: TEXT_SUB, display: 'flex', flexShrink: 0 }}>
          <Paperclip size={15} />
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={uploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
        </label>
      </div>
      {error
        ? <p style={{ fontSize: '11px', color: '#E6393E', margin: '4px 0 0' }}>{error}</p>
        : <p style={{ fontSize: '11px', color: BORDER, margin: '4px 0 0' }}>PDF, JPG, JPEG, PNG (Max Size - 1MB)</p>}
    </div>
  );
}

function Section({ title, count, total, children }: { title: string; count: number; total: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 600, color: TEXT_MAIN, margin: 0 }}>
          {title} <Info size={14} style={{ color: BORDER }} />
        </h3>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: TEXT_SUB }}>
          {String(count).padStart(2, '0')}/{String(total).padStart(2, '0')} Fields Filled
          <ChevronDown size={14} />
        </span>
      </div>
      {children}
    </div>
  );
}

// ── Data types ────────────────────────────────────────────────────────────────
interface SpocRow { contactType: string; contactPersonName: string; emailAddress: string; contactNumber: string; }
interface S1 { registeredName: string; registeringAs: string; industrySector: string; organizationSize: string; websiteUrl: string; onlinePaymentLink: string; houseNumber: string; flatFloor: string; country: string; pinCode: string; state: string; district: string; city: string; taluka: string; areaLocality: string; landmark: string; spocDetails: SpocRow[]; }
interface S2 { pan: string; taxId: string; numberOfEmployees: string; annualRevenue: string; jobRolesAvailable: string; employeeBenefits: string[]; recruitmentVision: string; trainingSectors: string; trainingMethods: string[]; trainingVision: string; }
interface S3 {
  panDoc: string; panDocName: string;
  gstDoc: string; gstDocName: string;
  tanDoc: string; tanDocName: string;
  cinDoc: string; cinDocName: string;
  brochure: string; brochureName: string;
}

const blankSpoc = (): SpocRow => ({ contactType: '', contactPersonName: '', emailAddress: '', contactNumber: '' });
const f = (vals: (string | string[])[]) => vals.filter(v => Array.isArray(v) ? v.length > 0 : v.trim() !== '').length;

// ── Steps ─────────────────────────────────────────────────────────────────────
function StepCompany({ d, set }: { d: S1; set: (u: Partial<S1>) => void }) {
  const orgCount  = f([d.registeredName, d.registeringAs, d.industrySector, d.organizationSize, d.websiteUrl]);
  const addrCount = f([d.houseNumber, d.flatFloor, d.pinCode, d.state, d.district, d.city, d.taluka, d.areaLocality, d.landmark, d.country]);
  const spocCount = d.spocDetails.filter(r => r.contactType || r.contactPersonName || r.emailAddress || r.contactNumber).length;

  const updateSpoc = (i: number, patch: Partial<SpocRow>) =>
    set({ spocDetails: d.spocDetails.map((r, idx) => idx === i ? { ...r, ...patch } : r) });

  return (
    <>
      <Section title="Organization Information" count={orgCount} total={5}>
        <div style={row}>
          <div style={full}>
            <label style={labelSt}>Registered Name <span style={{ color: '#E6393E' }}>*</span></label>
            <input style={inputSt} value={d.registeredName} onChange={e => set({ registeredName: e.target.value })} placeholder="e.g. Acme Technologies Pvt. Ltd." />
          </div>
          <div style={full}>
            <label style={labelSt}>Registering As <span style={{ color: '#E6393E' }}>*</span></label>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' as const, padding: '8px 0' }}>
              {['Recruitment Partner', 'Training Partner', 'Both'].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: TEXT_MAIN }}>
                  <input type="radio" name="registeringAs" value={opt} checked={d.registeringAs === opt}
                    onChange={() => set({ registeringAs: opt })} style={{ accentColor: PRIMARY, width: '16px', height: '16px' }} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <div style={half}>
            <label style={labelSt}>Industry Sector</label>
            <Sel value={d.industrySector} onChange={v => set({ industrySector: v })} options={INDUSTRY_SECTORS} placeholder="Select Industry Sector" />
          </div>
          <div style={half}>
            <label style={labelSt}>Organization Size <span style={{ color: '#E6393E' }}>*</span></label>
            <Sel value={d.organizationSize} onChange={v => set({ organizationSize: v })} options={ORG_SIZES} placeholder="Select Organization Size" />
          </div>
          <div style={half}>
            <label style={labelSt}>Website URL</label>
            <input style={inputSt} value={d.websiteUrl} onChange={e => set({ websiteUrl: e.target.value })} placeholder="https://company.com" />
          </div>
          <div style={half}>
            <label style={labelSt}>Online Payment Link</label>
            <input style={inputSt} value={d.onlinePaymentLink} onChange={e => set({ onlinePaymentLink: e.target.value })} placeholder="https://pay.example.com" />
          </div>
        </div>
      </Section>

      <Section title="Registered Address" count={addrCount} total={10}>
        <div style={row}>
          <div style={full}>
            <label style={labelSt}>House Number / Building Name <span style={{ color: '#E6393E' }}>*</span></label>
            <input style={inputSt} value={d.houseNumber} onChange={e => set({ houseNumber: e.target.value })} placeholder="e.g. A-Wing, Tech Park" />
          </div>
          <div style={full}>
            <label style={labelSt}>Flat Number & Floor <span style={{ color: '#E6393E' }}>*</span></label>
            <input style={inputSt} value={d.flatFloor} onChange={e => set({ flatFloor: e.target.value })} placeholder="e.g. Office 402, 4th Floor" />
          </div>
          <div style={third}>
            <label style={labelSt}>Country</label>
            <input style={{ ...inputSt, background: '#F9F9F9', color: TEXT_SUB }} value={d.country} readOnly />
          </div>
          <div style={third}>
            <label style={labelSt}>Pin Code <span style={{ color: '#E6393E' }}>*</span></label>
            <input style={inputSt} inputMode="numeric" value={d.pinCode}
              onChange={e => set({ pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="e.g. 411001" />
          </div>
          <div style={third}>
            <label style={labelSt}>State <span style={{ color: '#E6393E' }}>*</span></label>
            <Sel value={d.state} onChange={v => set({ state: v, city: '' })} options={INDIA_STATE_LIST} placeholder="Select State" />
          </div>
          <div style={third}>
            <label style={labelSt}>City <span style={{ color: '#E6393E' }}>*</span></label>
            <Sel value={d.city} onChange={v => set({ city: v })} options={d.state ? (INDIA_STATE_CITIES[d.state] ?? []) : []} placeholder={d.state ? 'Select City' : 'Select State first'} />
          </div>
          <div style={third}>
            <label style={labelSt}>District <span style={{ color: '#E6393E' }}>*</span></label>
            <input style={inputSt} value={d.district} onChange={e => set({ district: e.target.value })} placeholder="e.g. Pune District" />
          </div>
          <div style={third}>
            <label style={labelSt}>Taluka</label>
            <input style={inputSt} value={d.taluka} onChange={e => set({ taluka: e.target.value })} placeholder="e.g. Haveli" />
          </div>
          <div style={half}>
            <label style={labelSt}>Area / Locality <span style={{ color: '#E6393E' }}>*</span></label>
            <input style={inputSt} value={d.areaLocality} onChange={e => set({ areaLocality: e.target.value })} placeholder="e.g. Hinjewadi" />
          </div>
          <div style={half}>
            <label style={labelSt}>Landmark <span style={{ color: '#E6393E' }}>*</span></label>
            <input style={inputSt} value={d.landmark} onChange={e => set({ landmark: e.target.value })} placeholder="e.g. Near Railway Station" />
          </div>
        </div>
      </Section>

      <Section title="SPOC Details" count={spocCount} total={4}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.4fr 1.2fr 40px', gap: '8px', marginBottom: '8px' }}>
          {['Contact Type','Contact Person Name','Email Address','Contact Number','Action'].map(h => (
            <span key={h} style={{ fontSize: '12px', fontWeight: 600, color: TEXT_SUB }}>{h}</span>
          ))}
        </div>
        {d.spocDetails.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.4fr 1.2fr 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <Sel value={r.contactType} onChange={v => updateSpoc(i, { contactType: v })} options={CONTACT_TYPES} placeholder="Select" />
            <input style={inputSt} value={r.contactPersonName} onChange={e => updateSpoc(i, { contactPersonName: e.target.value })} placeholder="Type" />
            <input style={inputSt} type="email" value={r.emailAddress} onChange={e => updateSpoc(i, { emailAddress: e.target.value })} placeholder="Type" />
            <input style={inputSt} inputMode="numeric" value={r.contactNumber}
              onChange={e => updateSpoc(i, { contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Type" />
            <button type="button" onClick={() => set({ spocDetails: d.spocDetails.filter((_, idx) => idx !== i) })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: BORDER, padding: '4px', display: 'flex', justifyContent: 'center' }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={() => set({ spocDetails: [...d.spocDetails, blankSpoc()] })}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 18px', background: PRIMARY, border: 'none', borderRadius: '100px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </Section>
    </>
  );
}

function StepBusiness({ d, set }: { d: S2; set: (u: Partial<S2>) => void }) {
  const bizCount   = f([d.pan, d.taxId, d.numberOfEmployees, d.annualRevenue]);
  const recCount   = f([d.jobRolesAvailable, d.employeeBenefits, d.recruitmentVision]);
  const trainCount = f([d.trainingSectors, d.trainingMethods, d.trainingVision]);

  return (
    <>
      <Section title="Business Details" count={bizCount} total={4}>
        <div style={row}>
          <div style={half}>
            <label style={labelSt}>PAN <span style={{ color: '#E6393E' }}>*</span></label>
            <input style={inputSt} value={d.pan} onChange={e => set({ pan: e.target.value.toUpperCase() })} placeholder="e.g. ABCDE1234F" maxLength={10} />
          </div>
          <div style={half}>
            <label style={labelSt}>Tax Identification Number</label>
            <input style={inputSt} value={d.taxId} onChange={e => set({ taxId: e.target.value })} placeholder="e.g. 27ABCDE1234F1Z5" />
          </div>
          <div style={half}>
            <label style={labelSt}>Number Of Employees</label>
            <input style={inputSt} inputMode="numeric" value={d.numberOfEmployees}
              onChange={e => set({ numberOfEmployees: e.target.value.replace(/\D/g, '') })} placeholder="e.g. 250" />
          </div>
          <div style={half}>
            <label style={labelSt}>Annual Revenue In Rs</label>
            <input style={inputSt} value={d.annualRevenue} onChange={e => set({ annualRevenue: e.target.value })} placeholder="e.g. 50000000" />
          </div>
        </div>
      </Section>

      <Section title="Recruitment Partnership Details" count={recCount} total={3}>
        <div style={row}>
          <div style={half}>
            <label style={labelSt}>Job Roles Available</label>
            <Sel value={d.jobRolesAvailable} onChange={v => set({ jobRolesAvailable: v })} options={JOB_ROLES} placeholder="Select Job Role" />
          </div>
          <div style={half}>
            <label style={labelSt}>Employee Benefit</label>
            <MultiChips options={EMP_BENEFITS} selected={d.employeeBenefits} onChange={v => set({ employeeBenefits: v })} />
          </div>
          <div style={full}>
            <label style={labelSt}>Long Term Vision For The Partnership</label>
            <textarea style={textareaSt} value={d.recruitmentVision} onChange={e => set({ recruitmentVision: e.target.value })} placeholder="Describe your long-term recruitment vision..." />
          </div>
        </div>
      </Section>

      <Section title="Training Partnership Details" count={trainCount} total={3}>
        <div style={row}>
          <div style={half}>
            <label style={labelSt}>Areas Of Expertise For SME Training Sessions</label>
            <Sel value={d.trainingSectors} onChange={v => set({ trainingSectors: v })} options={TRAIN_SECTORS} placeholder="Select Sector" />
          </div>
          <div style={half}>
            <label style={labelSt}>Training Mode</label>
            <MultiChips options={TRAIN_MODES} selected={d.trainingMethods} onChange={v => set({ trainingMethods: v })} />
          </div>
          <div style={full}>
            <label style={labelSt}>Long Term Vision For The Partnership</label>
            <textarea style={textareaSt} value={d.trainingVision} onChange={e => set({ trainingVision: e.target.value })} placeholder="Describe your training partnership vision..." />
          </div>
        </div>
      </Section>
    </>
  );
}

function StepDocuments({ d, set, confirmTrue, setConfirmTrue, acceptMou, setAcceptMou, companyName }: {
  d: S3; set: (u: Partial<S3>) => void;
  confirmTrue: boolean; setConfirmTrue: (v: boolean) => void;
  acceptMou: boolean; setAcceptMou: (v: boolean) => void;
  companyName: string;
}) {
  return (
    <>
      <div style={{ ...row, marginBottom: '24px' }}>
        <div style={half}><FileField label="PAN" required companyName={companyName} docType="PAN" value={d.panDoc} displayName={d.panDocName} onChange={(url, name) => set({ panDoc: url, panDocName: name })} /></div>
        <div style={half}><FileField label="GST" required companyName={companyName} docType="GST" value={d.gstDoc} displayName={d.gstDocName} onChange={(url, name) => set({ gstDoc: url, gstDocName: name })} /></div>
        <div style={half}><FileField label="TAN" required companyName={companyName} docType="TAN" value={d.tanDoc} displayName={d.tanDocName} onChange={(url, name) => set({ tanDoc: url, tanDocName: name })} /></div>
        <div style={half}><FileField label="CIN" required companyName={companyName} docType="CIN" value={d.cinDoc} displayName={d.cinDocName} onChange={(url, name) => set({ cinDoc: url, cinDocName: name })} /></div>
        <div style={full}><FileField label="Company Brochure" required companyName={companyName} docType="Brochure" value={d.brochure} displayName={d.brochureName} onChange={(url, name) => set({ brochure: url, brochureName: name })} /></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '14px', color: TEXT_MAIN, lineHeight: 1.6 }}>
          <input type="checkbox" checked={confirmTrue} onChange={e => setConfirmTrue(e.target.checked)}
            style={{ accentColor: PRIMARY, width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
          I Hereby Confirm That The <span style={{ color: PRIMARY, fontWeight: 500, textDecoration: 'underline', margin: '0 3px' }}>Information</span> Given Above Is True To My Knowledge And Belief.<span style={{ color: '#E6393E', marginLeft: '2px' }}>*</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '14px', color: TEXT_MAIN, lineHeight: 1.6 }}>
          <input type="checkbox" checked={acceptMou} onChange={e => setAcceptMou(e.target.checked)}
            style={{ accentColor: PRIMARY, width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
          I Hereby Accept The Terms &amp; Conditions Mentioned In <span style={{ color: PRIMARY, fontWeight: 500, textDecoration: 'underline', margin: '0 3px' }}>MoU</span>.<span style={{ color: '#E6393E', marginLeft: '2px' }}>*</span>
        </label>
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const STEPS = ['Company Information', 'Business Details', 'Document'];

export default function IndustryOnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep]   = useState(0);
  const [s1, setS1Raw]    = useState<S1>({
    registeredName: '', registeringAs: '', industrySector: '', organizationSize: '',
    websiteUrl: '', onlinePaymentLink: '',
    houseNumber: '', flatFloor: '', country: 'India',
    pinCode: '', state: '', district: '', city: '', taluka: '', areaLocality: '', landmark: '',
    spocDetails: [blankSpoc()],
  });
  const [s2, setS2Raw] = useState<S2>({
    pan: '', taxId: '', numberOfEmployees: '', annualRevenue: '',
    jobRolesAvailable: '', employeeBenefits: [], recruitmentVision: '',
    trainingSectors: '', trainingMethods: [], trainingVision: '',
  });
  const [s3, setS3Raw]  = useState<S3>({ panDoc: '', panDocName: '', gstDoc: '', gstDocName: '', tanDoc: '', tanDocName: '', cinDoc: '', cinDocName: '', brochure: '', brochureName: '' });
  const [confirmTrue, setConfirmTrue] = useState(false);
  const [acceptMou, setAcceptMou]     = useState(false);
  const [showDecl, setShowDecl]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState('');

  const setS1 = (u: Partial<S1>) => setS1Raw(p => ({ ...p, ...u }));
  const setS2 = (u: Partial<S2>) => setS2Raw(p => ({ ...p, ...u }));
  const setS3 = (u: Partial<S3>) => setS3Raw(p => ({ ...p, ...u }));

  // Pre-fill from backend
  useEffect(() => {
    api.get('/industry-partner/application').then(res => {
      const d = res.data?.data;
      if (!d) return;
      setS1Raw(p => ({
        ...p,
        registeredName: d.registeredName ?? '', registeringAs: d.registeringAs ?? '',
        industrySector: d.industrySector ?? '', organizationSize: d.organizationSize ?? '',
        websiteUrl: d.websiteUrl ?? '', onlinePaymentLink: d.onlinePaymentLink ?? '',
        houseNumber: d.houseNumber ?? '', flatFloor: d.flatFloor ?? '',
        country: d.country || 'India', pinCode: d.pinCode ?? '',
        state: d.state ?? '', district: d.district ?? '', city: d.city ?? '',
        taluka: d.taluka ?? '', areaLocality: d.areaLocality ?? '', landmark: d.landmark ?? '',
        spocDetails: d.spocDetails?.length ? d.spocDetails : [blankSpoc()],
      }));
      setS2Raw(p => ({
        ...p,
        pan: d.pan ?? '', taxId: d.taxId ?? '',
        numberOfEmployees: d.numberOfEmployees ? String(d.numberOfEmployees) : '',
        annualRevenue: d.annualRevenue ?? '', jobRolesAvailable: d.jobRolesAvailable ?? '',
        employeeBenefits: d.employeeBenefits ?? [], recruitmentVision: d.recruitmentVision ?? '',
        trainingSectors: d.trainingSectors ?? '', trainingMethods: d.trainingMethods ?? [],
        trainingVision: d.trainingVision ?? '',
      }));
      const lastName = (url: string) => url ? url.split('/').pop() ?? '' : '';
      setS3Raw(p => ({
        ...p,
        panDoc: d.panDocUrl ?? '',    panDocName: lastName(d.panDocUrl ?? ''),
        gstDoc: d.gstDocUrl ?? '',    gstDocName: lastName(d.gstDocUrl ?? ''),
        tanDoc: d.tanDocUrl ?? '',    tanDocName: lastName(d.tanDocUrl ?? ''),
        cinDoc: d.cinDocUrl ?? '',    cinDocName: lastName(d.cinDocUrl ?? ''),
        brochure: d.brochureUrl ?? '', brochureName: lastName(d.brochureUrl ?? ''),
      }));
    }).catch(() => {});
  }, []);

  const payload = () => ({
    registeredName: s1.registeredName, registeringAs: s1.registeringAs,
    industrySector: s1.industrySector, organizationSize: s1.organizationSize,
    websiteUrl: s1.websiteUrl, onlinePaymentLink: s1.onlinePaymentLink,
    houseNumber: s1.houseNumber, flatFloor: s1.flatFloor, country: s1.country,
    pinCode: s1.pinCode, state: s1.state, district: s1.district, city: s1.city,
    taluka: s1.taluka, areaLocality: s1.areaLocality, landmark: s1.landmark,
    spocDetails: s1.spocDetails.filter(r => r.contactType || r.contactPersonName),
    pan: s2.pan, taxId: s2.taxId,
    numberOfEmployees: s2.numberOfEmployees ? parseInt(s2.numberOfEmployees) : null,
    annualRevenue: s2.annualRevenue, jobRolesAvailable: s2.jobRolesAvailable,
    employeeBenefits: s2.employeeBenefits, recruitmentVision: s2.recruitmentVision,
    trainingSectors: s2.trainingSectors, trainingMethods: s2.trainingMethods,
    trainingVision: s2.trainingVision,
    panDocUrl: s3.panDoc, gstDocUrl: s3.gstDoc,
    tanDocUrl: s3.tanDoc, cinDocUrl: s3.cinDoc,
    brochureUrl: s3.brochure,
  });

  const saveAsDraft = async () => {
    setSaving(true); setError('');
    try {
      await api.put('/industry-partner/application', payload());
      navigate('/industry-partner');
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setShowDecl(false); setSubmitting(true); setError('');
    try {
      await api.put('/industry-partner/application', payload());
      await api.post('/industry-partner/application/submit');
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const requiredFieldsFilled =
    // Step 1 — Company Info
    s1.registeredName.trim() !== '' &&
    s1.registeringAs !== '' &&
    s1.organizationSize !== '' &&
    // Step 1 — Address
    s1.houseNumber.trim() !== '' &&
    s1.flatFloor.trim() !== '' &&
    s1.pinCode.trim() !== '' &&
    s1.state !== '' &&
    s1.city.trim() !== '' &&
    s1.district.trim() !== '' &&
    s1.areaLocality.trim() !== '' &&
    s1.landmark.trim() !== '' &&
    // Step 2 — Business
    s2.pan.trim() !== '' &&
    s2.taxId.trim() !== '' &&
    s2.numberOfEmployees.trim() !== '' &&
    s2.annualRevenue.trim() !== '' &&
    s2.jobRolesAvailable !== '' &&
    s2.recruitmentVision.trim() !== '';
  const docsFilled =
    s3.panDoc.trim() !== '' && s3.gstDoc.trim() !== '' &&
    s3.tanDoc.trim() !== '' && s3.cinDoc.trim() !== '' &&
    s3.brochure.trim() !== '';
  const canSubmit = step === 2 && confirmTrue && acceptMou && requiredFieldsFilled && docsFilled;

  const ghostBtn: React.CSSProperties = { padding: '0 24px', height: '40px', border: `1px solid ${BORDER}`, borderRadius: '100px', background: '#fff', fontSize: '14px', fontWeight: 500, color: TEXT_MAIN, cursor: 'pointer', textTransform: 'capitalize' as const };
  const pinkBtn:  React.CSSProperties = { padding: '0 32px', height: '40px', border: 'none', borderRadius: '100px', background: ACCENT_PINK, color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' as const };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '32px 32px 120px', boxSizing: 'border-box' as const }}>

        {/* Page header */}
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: TEXT_MAIN, margin: '0 0 8px', textTransform: 'capitalize' }}>Industry Partner Profile</h1>
        <p style={{ fontSize: '13px', color: TEXT_SUB, margin: '0 0 32px', lineHeight: 1.6 }}>
          "Kindly Fill In The Required Information Below To Complete Your Onboarding To The Portal. This Will Ensure A Smooth Setup And Enable Full Access To The Platform Features."
        </p>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          {STEPS.map((s, i) => {
            const done = i < step; const active = i === step;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: done || active ? PRIMARY : '#E2E8F0', color: done || active ? '#fff' : BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
                    {done ? <Check size={14} /> : i + 1}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: active || done ? PRIMARY : BORDER, whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: '2px', background: done ? PRIMARY : '#E2E8F0', margin: '0 16px' }} />}
              </div>
            );
          })}
        </div>

        {error && <p style={{ fontSize: '13px', color: '#E6393E', marginBottom: '16px' }}>{error}</p>}

        {step === 0 && <StepCompany d={s1} set={setS1} />}
        {step === 1 && <StepBusiness d={s2} set={setS2} />}
        {step === 2 && (
          <StepDocuments d={s3} set={setS3}
            confirmTrue={confirmTrue} setConfirmTrue={setConfirmTrue}
            acceptMou={acceptMou} setAcceptMou={setAcceptMou}
            companyName={s1.registeredName} />
        )}
      </div>

      {/* Fixed footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #E2E8F0', zIndex: 10 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 32px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          {step === 0
            ? <button onClick={() => navigate('/industry-partner')} style={ghostBtn}>Cancel</button>
            : <button onClick={() => setStep(s => s - 1)} style={ghostBtn}>Back</button>}
          <button onClick={saveAsDraft} disabled={saving} style={{ ...ghostBtn, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save As Draft'}
          </button>
          {step < 2 && (
            <button onClick={() => {
              if (step === 0) {
                if (!s1.registeredName.trim()) return setError('Registered Name is required.');
                if (!s1.registeringAs)         return setError('Please select Registering As.');
                if (!s1.organizationSize)      return setError('Organization Size is required.');
                if (!s1.houseNumber.trim())    return setError('House Number / Building Name is required.');
                if (!s1.pinCode.trim())        return setError('Pin Code is required.');
                if (!s1.state.trim())          return setError('State is required.');
                if (!s1.city.trim())           return setError('City is required.');
              }
              if (step === 1) {
                if (!s2.pan.trim()) return setError('PAN is required.');
              }
              setError('');
              setStep(s => s + 1);
            }} style={pinkBtn}>Next</button>
          )}
          {step === 2 && (
            <button disabled={!canSubmit || submitting} onClick={() => setShowDecl(true)}
              style={{ ...pinkBtn, opacity: canSubmit && !submitting ? 1 : 0.5, cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed' }}>
              {submitting ? 'Submitting…' : 'Submit For Approval'}
            </button>
          )}
        </div>
        <p style={{ textAlign: 'center', fontSize: '12px', color: TEXT_SUB, margin: '0 0 10px' }}>
          © 2024, Powered By <span style={{ color: PRIMARY, fontWeight: 600 }}>HubbleHox</span>
        </p>
      </div>

      {/* Declaration modal */}
      {showDecl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '36px', width: '100%', maxWidth: '480px', boxShadow: '4px 4px 7.5px rgba(76,78,100,0.15)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: TEXT_MAIN, margin: '0 0 16px', textTransform: 'capitalize' }}>Self Declaration</h3>
            <p style={{ fontSize: '14px', color: TEXT_SUB, lineHeight: 1.7, margin: '0 0 24px' }}>
              I hereby solemnly declare that all the information provided in this application form is true, correct, and complete to the best of my knowledge and belief. I understand that any misrepresentation or false information may lead to disqualification or termination of the partnership agreement.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDecl(false)} style={ghostBtn}>Disagree</button>
              <button onClick={handleSubmit} style={pinkBtn}>Agree &amp; Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {submitted && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '48px 40px', textAlign: 'center', width: '340px', boxShadow: '4px 4px 7.5px rgba(76,78,100,0.15)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: `3px solid ${PRIMARY}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={28} color={PRIMARY} />
            </div>
            <p style={{ fontSize: '20px', fontWeight: 500, color: PRIMARY, margin: '0 0 8px', textTransform: 'capitalize' }}>Application Submitted!</p>
            <p style={{ fontSize: '14px', color: TEXT_SUB, margin: '0 0 28px', lineHeight: 1.6 }}>
              Your application has been submitted for review. We'll notify you once it's approved.
            </p>
            <button onClick={() => navigate('/industry-partner')}
              style={{ ...pinkBtn, padding: '0 48px' }}>
              Go To Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
