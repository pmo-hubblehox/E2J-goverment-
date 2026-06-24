import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Building2, MapPin, Users, Briefcase, BookOpen, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { toAbsoluteDocUrl } from '../../services/uploadFile';

const PRIMARY = '#3F41D1';
const TEXT    = '#212121';
const SUB     = '#666666';
const BORDER  = '#E2E8F0';

interface ApplicationData {
  registeredName?: string; registeringAs?: string; industrySector?: string;
  organizationSize?: string; websiteUrl?: string; onlinePaymentLink?: string;
  houseNumber?: string; flatFloor?: string; country?: string; pinCode?: string;
  state?: string; district?: string; city?: string; taluka?: string;
  areaLocality?: string; landmark?: string;
  spocDetails?: { contactType?: string; contactPersonName?: string; emailAddress?: string; contactNumber?: string }[];
  pan?: string; taxId?: string; numberOfEmployees?: number; annualRevenue?: string;
  jobRolesAvailable?: string; employeeBenefits?: string[]; recruitmentVision?: string;
  trainingSectors?: string; trainingMethods?: string[]; trainingVision?: string;
  panDocUrl?: string; gstDocUrl?: string; tanDocUrl?: string; cinDocUrl?: string; brochureUrl?: string;
  applicationStatus?: string;
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', marginBottom: '16px', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} type="button"
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EEEEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={PRIMARY} />
        </div>
        <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: TEXT }}>{title}</span>
        {open ? <ChevronUp size={16} color={SUB} /> : <ChevronDown size={16} color={SUB} />}
      </button>
      {open && <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${BORDER}` }}>{children}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '11px', color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '14px', color: value ? TEXT : '#A3A3A3', fontWeight: value ? 400 : 300 }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px 32px', paddingTop: '16px' }}>{children}</div>;
}

function Chips({ items }: { items?: string[] }) {
  if (!items?.length) return <span style={{ fontSize: '14px', color: '#A3A3A3' }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' }}>
      {items.map(i => (
        <span key={i} style={{ padding: '4px 12px', background: '#EEEEFF', borderRadius: '100px', fontSize: '12px', color: PRIMARY, fontWeight: 500 }}>{i}</span>
      ))}
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:        { label: 'Draft',        color: '#666666', bg: '#F5F5F5' },
  SUBMITTED:    { label: 'Submitted',    color: '#1D4ED8', bg: '#DBEAFE' },
  UNDER_REVIEW: { label: 'Under Review', color: '#92400E', bg: '#FEF3C7' },
  APPROVED:     { label: 'Approved',     color: '#15803D', bg: '#DCFCE7' },
  REJECTED:     { label: 'Rejected',     color: '#B91C1C', bg: '#FEE2E2' },
};

export default function IndustryProfilePage() {
  const navigate = useNavigate();
  const [data, setData]     = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/industry-partner/application')
      .then(res => setData(res.data?.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '32px', color: SUB }}>Loading…</div>;
  if (!data)   return <div style={{ padding: '32px', color: '#E6393E' }}>Failed to load profile data.</div>;

  const status = STATUS_MAP[data.applicationStatus ?? 'DRAFT'] ?? STATUS_MAP.DRAFT;

  return (
    <div style={{ padding: '32px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: TEXT, margin: '0 0 4px', textTransform: 'capitalize' }}>Company Profile</h2>
          <p style={{ fontSize: '13px', color: SUB, margin: 0 }}>All information submitted during your onboarding.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ padding: '4px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: status.color, background: status.bg }}>
            {status.label}
          </span>
          <button onClick={() => navigate('/industry-partner/onboarding')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 18px', height: '36px', border: 'none', borderRadius: '100px', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            <Edit2 size={14} /> Edit
          </button>
        </div>
      </div>

      {/* Organization Information */}
      <Section icon={Building2} title="Organization Information">
        <Grid>
          <Row label="Registered Name"  value={data.registeredName} />
          <Row label="Registering As"   value={data.registeringAs} />
          <Row label="Industry Sector"  value={data.industrySector} />
          <Row label="Organization Size" value={data.organizationSize} />
          <Row label="Website URL"       value={data.websiteUrl} />
          <Row label="Online Payment Link" value={data.onlinePaymentLink} />
        </Grid>
      </Section>

      {/* Registered Address */}
      <Section icon={MapPin} title="Registered Address">
        <Grid>
          <Row label="House / Building"  value={data.houseNumber} />
          <Row label="Flat & Floor"      value={data.flatFloor} />
          <Row label="Country"           value={data.country} />
          <Row label="Pin Code"          value={data.pinCode} />
          <Row label="State"             value={data.state} />
          <Row label="District"          value={data.district} />
          <Row label="City"              value={data.city} />
          <Row label="Taluka"            value={data.taluka} />
          <Row label="Area / Locality"   value={data.areaLocality} />
          <Row label="Landmark"          value={data.landmark} />
        </Grid>
      </Section>

      {/* SPOC Details */}
      <Section icon={Users} title="SPOC Details">
        {!data.spocDetails?.length ? (
          <p style={{ fontSize: '14px', color: '#A3A3A3', paddingTop: '12px' }}>No SPOC contacts added.</p>
        ) : (
          <div style={{ paddingTop: '12px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Contact Type','Contact Person Name','Email Address','Contact Number'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.spocDetails.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 12px', color: TEXT }}>{r.contactType || '—'}</td>
                    <td style={{ padding: '10px 12px', color: TEXT }}>{r.contactPersonName || '—'}</td>
                    <td style={{ padding: '10px 12px', color: TEXT }}>{r.emailAddress || '—'}</td>
                    <td style={{ padding: '10px 12px', color: TEXT }}>{r.contactNumber || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Business Details */}
      <Section icon={Briefcase} title="Business Details">
        <Grid>
          <Row label="PAN"                value={data.pan} />
          <Row label="Tax Identification Number" value={data.taxId} />
          <Row label="Number Of Employees" value={data.numberOfEmployees} />
          <Row label="Annual Revenue (Rs)" value={data.annualRevenue} />
        </Grid>
      </Section>

      {/* Recruitment Partnership */}
      <Section icon={Briefcase} title="Recruitment Partnership Details">
        <Grid>
          <Row label="Job Roles Available" value={data.jobRolesAvailable} />
          <div>
            <span style={{ fontSize: '11px', color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>Employee Benefits</span>
            <Chips items={data.employeeBenefits} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '11px', color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Long Term Vision</span>
            <p style={{ fontSize: '14px', color: data.recruitmentVision ? TEXT : '#A3A3A3', margin: 0, lineHeight: 1.7 }}>
              {data.recruitmentVision || '—'}
            </p>
          </div>
        </Grid>
      </Section>

      {/* Training Partnership */}
      <Section icon={BookOpen} title="Training Partnership Details">
        <Grid>
          <Row label="Areas Of Expertise" value={data.trainingSectors} />
          <div>
            <span style={{ fontSize: '11px', color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>Training Mode</span>
            <Chips items={data.trainingMethods} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '11px', color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Long Term Vision</span>
            <p style={{ fontSize: '14px', color: data.trainingVision ? TEXT : '#A3A3A3', margin: 0, lineHeight: 1.7 }}>
              {data.trainingVision || '—'}
            </p>
          </div>
        </Grid>
      </Section>

      {/* Documents */}
      <Section icon={FileText} title="Documents">
        <Grid>
          {[
            { label: 'PAN',             value: data.panDocUrl },
            { label: 'GST',             value: data.gstDocUrl },
            { label: 'TAN',             value: data.tanDocUrl },
            { label: 'CIN',             value: data.cinDocUrl },
            { label: 'Company Brochure', value: data.brochureUrl },
          ].map(({ label, value }) => (
            <div key={label}>
              <span style={{ fontSize: '11px', color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, display: 'block', marginBottom: '4px' }}>{label}</span>
              {value
                ? <a href={toAbsoluteDocUrl(value)} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: PRIMARY, textDecoration: 'none', fontWeight: 500 }}>View Document →</a>
                : <span style={{ fontSize: '14px', color: '#A3A3A3' }}>Not uploaded</span>
              }
            </div>
          ))}
        </Grid>
      </Section>
    </div>
  );
}
