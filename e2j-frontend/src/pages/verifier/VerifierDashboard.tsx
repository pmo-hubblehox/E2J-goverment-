import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import api from '../../services/api';
import { toAbsoluteDocUrl } from '../../services/uploadFile';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SpocRow { contactType?: string; contactPersonName?: string; emailAddress?: string; contactNumber?: string; }
interface Application {
  id: number;
  registeredName?: string; registeringAs?: string; industrySector?: string; organizationSize?: string;
  websiteUrl?: string; onlinePaymentLink?: string;
  houseNumber?: string; flatFloor?: string; country?: string; pinCode?: string;
  state?: string; district?: string; city?: string; taluka?: string; areaLocality?: string; landmark?: string;
  spocDetails?: SpocRow[];
  pan?: string; taxId?: string; numberOfEmployees?: number; annualRevenue?: string;
  jobRolesAvailable?: string; employeeBenefits?: string[]; recruitmentVision?: string;
  trainingSectors?: string; trainingMethods?: string[]; trainingVision?: string;
  panDocUrl?: string; gstDocUrl?: string; tanDocUrl?: string; cinDocUrl?: string; brochureUrl?: string;
  applicationStatus?: string; submittedAt?: string; rejectionReason?: string;
}

// ── Tokens ────────────────────────────────────────────────────────────────────
const PRIMARY = '#3F41D1';
const TEXT    = '#212121';
const SUB     = '#666666';
const BORDER  = '#E2E8F0';

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  SUBMITTED:    { label: 'Submitted',    color: '#1D4ED8', bg: '#DBEAFE' },
  UNDER_REVIEW: { label: 'Under Review', color: '#92400E', bg: '#FEF3C7' },
  APPROVED:     { label: 'Approved',     color: '#15803D', bg: '#DCFCE7' },
  REJECTED:     { label: 'Rejected',     color: '#B91C1C', bg: '#FEE2E2' },
};

// ── Review Detail Panel ───────────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '10px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: '13px', color: value ? TEXT : '#A3A3A3' }}>{value ?? '—'}</span>
    </div>
  );
}

function Chips({ items }: { items?: string[] }) {
  if (!items?.length) return <span style={{ fontSize: '13px', color: '#A3A3A3' }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '5px' }}>
      {items.map(i => <span key={i} style={{ padding: '3px 10px', background: '#EEEEFF', borderRadius: '100px', fontSize: '11px', color: PRIMARY, fontWeight: 500 }}>{i}</span>)}
    </div>
  );
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#FAFAFA', border: 'none', cursor: 'pointer' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{title}</span>
        {open ? <ChevronUp size={14} color={SUB} /> : <ChevronDown size={14} color={SUB} />}
      </button>
      {open && (
        <div style={{ padding: '14px', borderTop: `1px solid ${BORDER}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px 20px' }}>{children}</div>;
}

function ReviewPanel({ app, onClose, onAction }: {
  app: Application;
  onClose: () => void;
  onAction: (id: number, action: 'approve' | 'reject' | 'under-review', reason?: string) => Promise<void>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const act = async (action: 'approve' | 'reject' | 'under-review') => {
    setLoading(true);
    await onAction(app.id, action, action === 'reject' ? reason : undefined);
    setLoading(false);
    onClose();
  };

  const status = STATUS_STYLES[app.applicationStatus ?? ''];
  const canAct = app.applicationStatus === 'SUBMITTED' || app.applicationStatus === 'UNDER_REVIEW';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%', maxWidth: '600px', height: '100%', background: '#fff', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: TEXT, margin: 0 }}>{app.registeredName || 'Unnamed Company'}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              {status && <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: status.color, background: status.bg }}>{status.label}</span>}
              {app.submittedAt && <span style={{ fontSize: '11px', color: SUB }}>Submitted {new Date(app.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, padding: '4px', display: 'flex' }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          <CollapsibleSection title="Organization Information">
            <Grid2>
              <DetailRow label="Registered Name"   value={app.registeredName} />
              <DetailRow label="Registering As"    value={app.registeringAs} />
              <DetailRow label="Industry Sector"   value={app.industrySector} />
              <DetailRow label="Organization Size" value={app.organizationSize} />
              <DetailRow label="Website"           value={app.websiteUrl} />
              <DetailRow label="Payment Link"      value={app.onlinePaymentLink} />
            </Grid2>
          </CollapsibleSection>

          <CollapsibleSection title="Registered Address">
            <Grid2>
              <DetailRow label="House / Building" value={app.houseNumber} />
              <DetailRow label="Flat & Floor"     value={app.flatFloor} />
              <DetailRow label="Pin Code"         value={app.pinCode} />
              <DetailRow label="State"            value={app.state} />
              <DetailRow label="City"             value={app.city} />
              <DetailRow label="District"         value={app.district} />
              <DetailRow label="Area / Locality"  value={app.areaLocality} />
              <DetailRow label="Landmark"         value={app.landmark} />
            </Grid2>
          </CollapsibleSection>

          {app.spocDetails?.length ? (
            <CollapsibleSection title="SPOC Details">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Contact Type','Person Name','Email','Number'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: SUB, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {app.spocDetails.map((r, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '8px 10px', color: TEXT }}>{r.contactType || '—'}</td>
                        <td style={{ padding: '8px 10px', color: TEXT }}>{r.contactPersonName || '—'}</td>
                        <td style={{ padding: '8px 10px', color: TEXT }}>{r.emailAddress || '—'}</td>
                        <td style={{ padding: '8px 10px', color: TEXT }}>{r.contactNumber || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>
          ) : null}

          <CollapsibleSection title="Business Details">
            <Grid2>
              <DetailRow label="PAN"               value={app.pan} />
              <DetailRow label="Tax ID"            value={app.taxId} />
              <DetailRow label="No. of Employees"  value={app.numberOfEmployees} />
              <DetailRow label="Annual Revenue"    value={app.annualRevenue ? `₹${app.annualRevenue}` : undefined} />
            </Grid2>
          </CollapsibleSection>

          <CollapsibleSection title="Recruitment Partnership">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DetailRow label="Job Roles Available" value={app.jobRolesAvailable} />
              <div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Employee Benefits</span>
                <Chips items={app.employeeBenefits} />
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>Long Term Vision</span>
                <p style={{ fontSize: '13px', color: app.recruitmentVision ? TEXT : '#A3A3A3', margin: 0, lineHeight: 1.6 }}>{app.recruitmentVision || '—'}</p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Training Partnership">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DetailRow label="Areas of Expertise" value={app.trainingSectors} />
              <div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Training Mode</span>
                <Chips items={app.trainingMethods} />
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>Long Term Vision</span>
                <p style={{ fontSize: '13px', color: app.trainingVision ? TEXT : '#A3A3A3', margin: 0, lineHeight: 1.6 }}>{app.trainingVision || '—'}</p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Documents">
            <Grid2>
              {[['PAN', app.panDocUrl],['GST', app.gstDocUrl],['TAN', app.tanDocUrl],['CIN', app.cinDocUrl],['Brochure', app.brochureUrl]].map(([label, url]) => (
                <div key={label}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>{label}</span>
                  {url
                    ? <a href={toAbsoluteDocUrl(url)} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: PRIMARY, fontWeight: 500 }}>View →</a>
                    : <span style={{ fontSize: '13px', color: '#A3A3A3' }}>Not uploaded</span>}
                </div>
              ))}
            </Grid2>
          </CollapsibleSection>

          {app.rejectionReason && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 14px', marginTop: '8px', display: 'flex', gap: '8px' }}>
              <Info size={14} color="#B91C1C" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#B91C1C', margin: '0 0 2px', textTransform: 'uppercase' }}>Rejection Reason</p>
                <p style={{ fontSize: '13px', color: '#7F1D1D', margin: 0 }}>{app.rejectionReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action footer */}
        {canAct && (
          <div style={{ borderTop: `1px solid ${BORDER}`, padding: '14px 20px', flexShrink: 0, background: '#FAFAFA' }}>
            {rejecting ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Enter rejection reason (optional)…"
                  style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: TEXT, outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setRejecting(false)} disabled={loading}
                    style={{ padding: '0 20px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '100px', background: '#fff', fontSize: '13px', fontWeight: 500, color: TEXT, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={() => act('reject')} disabled={loading}
                    style={{ padding: '0 20px', height: '36px', border: 'none', borderRadius: '100px', background: '#EF4444', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                    {loading ? 'Rejecting…' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                {app.applicationStatus === 'SUBMITTED' && (
                  <button onClick={() => act('under-review')} disabled={loading}
                    style={{ padding: '0 18px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '100px', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#92400E', cursor: loading ? 'not-allowed' : 'pointer' }}>
                    <Clock size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                    Mark Under Review
                  </button>
                )}
                <button onClick={() => setRejecting(true)} disabled={loading}
                  style={{ padding: '0 18px', height: '36px', border: '1px solid #FCA5A5', borderRadius: '100px', background: '#FEE2E2', fontSize: '13px', fontWeight: 500, color: '#B91C1C', cursor: 'pointer' }}>
                  <XCircle size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                  Reject
                </button>
                <button onClick={() => act('approve')} disabled={loading}
                  style={{ padding: '0 20px', height: '36px', border: 'none', borderRadius: '100px', background: '#16A34A', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                  <CheckCircle size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                  {loading ? 'Approving…' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Institute Types ────────────────────────────────────────────────────────────
interface InstituteApp {
  id: number; name?: string; type?: string; phone?: string; websiteUrl?: string;
  city?: string; state?: string; pincode?: string; country?: string;
  accreditationBody?: string; accreditationCertUrl?: string; universityCertUrl?: string;
  ratingDocUrl?: string; ugcCertUrl?: string; mouUrl?: string;
  paymentMethod?: string; paymentAmount?: number;
  status?: string; registrationDate?: string;
}

const BACKEND = 'http://localhost:8081';
const docUrl = (url?: string | null) => url ? (url.startsWith('http') ? url : `${BACKEND}${url}`) : null;

function InstituteReviewPanel({ app, onClose, onAction }: {
  app: InstituteApp;
  onClose: () => void;
  onAction: (id: number, action: 'approve' | 'reject' | 'under-review') => Promise<void>;
}) {
  const [actLoading, setActLoading] = useState(false);
  const [rejecting, setRejecting]   = useState(false);
  const [activeTab, setActiveTab]   = useState<'profile'|'programs'|'students'|'faculty'|'infra'>('profile');
  const [programs,  setPrograms]    = useState<any[]>([]);
  const [students,  setStudents]    = useState<any[]>([]);
  const [faculty,   setFaculty]     = useState<any[]>([]);
  const [bos,       setBos]         = useState<any[]>([]);
  const [infra,     setInfra]       = useState<any>(null);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'programs' && programs.length === 0) {
      setTabLoading(true);
      api.get(`/verifier/institutes/${app.id}/programs`).then(r => setPrograms(r.data?.data ?? [])).finally(() => setTabLoading(false));
    }
    if (activeTab === 'students' && students.length === 0) {
      setTabLoading(true);
      api.get(`/verifier/institutes/${app.id}/students`).then(r => setStudents(r.data?.data ?? [])).finally(() => setTabLoading(false));
    }
    if (activeTab === 'faculty' && faculty.length === 0) {
      setTabLoading(true);
      Promise.all([
        api.get(`/verifier/institutes/${app.id}/faculty`),
        api.get(`/verifier/institutes/${app.id}/bos`),
      ]).then(([fRes, bRes]) => { setFaculty(fRes.data?.data ?? []); setBos(bRes.data?.data ?? []); }).finally(() => setTabLoading(false));
    }
    if (activeTab === 'infra' && !infra) {
      setTabLoading(true);
      api.get(`/verifier/institutes/${app.id}/infra`).then(r => setInfra(r.data?.data ?? {})).finally(() => setTabLoading(false));
    }
  }, [activeTab]);

  const act = async (action: 'approve' | 'reject' | 'under-review') => {
    setActLoading(true);
    await onAction(app.id, action);
    setActLoading(false);
    onClose();
  };

  const st = STATUS_STYLES[app.status ?? ''];
  const canAct = app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW';
  const TABS = [
    { key: 'profile',  label: 'Profile' },
    { key: 'programs', label: 'Programs' },
    { key: 'students', label: 'Students' },
    { key: 'faculty',  label: 'Faculty & BOS' },
    { key: 'infra',    label: 'Infra' },
  ] as const;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%', maxWidth: '680px', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: TEXT, margin: 0 }}>{app.name || 'Unnamed Institute'}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              {st && <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg }}>{st.label}</span>}
              {app.registrationDate && <span style={{ fontSize: '11px', color: SUB }}>Registered {new Date(app.registrationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, padding: '4px', display: 'flex' }}><X size={20} /></button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', borderBottom: activeTab === t.key ? `2px solid ${PRIMARY}` : '2px solid transparent', color: activeTab === t.key ? PRIMARY : SUB, whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {tabLoading ? <p style={{ color: SUB }}>Loading…</p> : (
            <>
              {/* Profile tab */}
              {activeTab === 'profile' && (
                <>
                  <CollapsibleSection title="Basic Information">
                    <Grid2>
                      <DetailRow label="Institute Name" value={app.name} />
                      <DetailRow label="Type"           value={app.type} />
                      <DetailRow label="Phone"          value={app.phone} />
                      <DetailRow label="Website"        value={app.websiteUrl} />
                      <DetailRow label="City"           value={app.city} />
                      <DetailRow label="State"          value={app.state} />
                      <DetailRow label="Pincode"        value={app.pincode} />
                      <DetailRow label="Country"        value={app.country} />
                    </Grid2>
                  </CollapsibleSection>
                  <CollapsibleSection title="Accreditation & Documents">
                    <Grid2>
                      <DetailRow label="Accreditation Body" value={app.accreditationBody} />
                      {[['Accreditation Cert', app.accreditationCertUrl], ['University Cert', app.universityCertUrl], ['Rating Document', app.ratingDocUrl], ['UGC Certificate', app.ugcCertUrl], ['MOU Document', app.mouUrl]].map(([label, url]) => (
                        <div key={label as string}>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>{label as string}</span>
                          {docUrl(url as string) ? <a href={docUrl(url as string)!} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: PRIMARY, fontWeight: 500 }}>View →</a> : <span style={{ fontSize: '13px', color: '#A3A3A3' }}>Not uploaded</span>}
                        </div>
                      ))}
                    </Grid2>
                  </CollapsibleSection>
                  <CollapsibleSection title="Payment">
                    <Grid2>
                      <DetailRow label="Payment Method" value={app.paymentMethod} />
                      <DetailRow label="Amount" value={app.paymentAmount != null ? `₹${app.paymentAmount}` : undefined} />
                    </Grid2>
                  </CollapsibleSection>
                </>
              )}

              {/* Programs tab */}
              {activeTab === 'programs' && (
                tabLoading ? <p style={{ color: '#A3A3A3', fontSize: 13 }}>Loading…</p> :
                programs.length === 0 ? <p style={{ color: '#A3A3A3', fontSize: 13 }}>No programs found.</p> :
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {programs.map((p: any) => (
                    <div key={p.id} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ background: '#FAFAFA', padding: '10px 14px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: PRIMARY }}>{p.programId || '—'}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{p.name}</span>
                        <span style={{ fontSize: 12, color: SUB }}>{p.degree}</span>
                        <span style={{ fontSize: 12, color: SUB }}>{p.duration ? `${p.duration} yrs` : ''}</span>
                        <span style={{ fontSize: 12, color: SUB }}>{p.intakeCapacity ? `Intake: ${p.intakeCapacity}` : ''}</span>
                        <span style={{ fontSize: 12, color: SUB }}>{p.totalFees ? `₹${p.totalFees.toLocaleString()}` : ''}</span>
                      </div>
                      <div style={{ padding: '10px 14px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {[['Syllabus', p.syllabusUrl], ['Credit Structure', p.creditStructureUrl], ['Calendar', p.calendarUrl], ['Brochure', p.brochureUrl]].map(([label, url]) => (
                          <div key={label as string}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: SUB, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>{label as string}</span>
                            {docUrl(url as string)
                              ? <a href={docUrl(url as string)!} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: PRIMARY, fontWeight: 500 }}>View →</a>
                              : <span style={{ fontSize: 12, color: '#CBD5E1' }}>Not uploaded</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Students tab */}
              {activeTab === 'students' && (
                students.length === 0 ? <p style={{ color: '#A3A3A3', fontSize: 13 }}>No students found.</p> :
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
                    {['ID','Name','Email','Program','Year','CGPA','Status'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: SUB, textTransform: 'uppercase' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{students.map((s: any) => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '8px 12px', color: SUB }}>{s.studentId || '—'}</td>
                      <td style={{ padding: '8px 12px', color: TEXT, fontWeight: 500 }}>{s.name || '—'}</td>
                      <td style={{ padding: '8px 12px', color: SUB }}>{s.email || '—'}</td>
                      <td style={{ padding: '8px 12px', color: SUB }}>{s.program || '—'}</td>
                      <td style={{ padding: '8px 12px', color: SUB }}>{s.year || '—'}</td>
                      <td style={{ padding: '8px 12px', color: SUB }}>{s.cgpa ?? '—'}</td>
                      <td style={{ padding: '8px 12px', color: SUB }}>{s.status || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}

              {/* Faculty & BOS tab */}
              {activeTab === 'faculty' && (
                <>
                  <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 10px' }}>Faculty ({faculty.length})</p>
                  {faculty.length === 0 ? <p style={{ color: '#A3A3A3', fontSize: 13 }}>No faculty found.</p> :
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
                    <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
                      {['Name','Mode','Rating','Students Counselled'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: SUB, textTransform: 'uppercase' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{faculty.map((f: any) => (
                      <tr key={f.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '8px 12px', color: TEXT, fontWeight: 500 }}>{f.name || '—'}</td>
                        <td style={{ padding: '8px 12px', color: SUB }}>{f.mode || '—'}</td>
                        <td style={{ padding: '8px 12px', color: SUB }}>{f.rating ?? '—'}</td>
                        <td style={{ padding: '8px 12px', color: SUB }}>{f.studentsCounselled ?? '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>}
                  <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 10px' }}>BOS Members ({bos.length})</p>
                  {bos.length === 0 ? <p style={{ color: '#A3A3A3', fontSize: 13 }}>No BOS members found.</p> :
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
                      {['Name','Designation','Institution','Email'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: SUB, textTransform: 'uppercase' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{bos.map((b: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '8px 12px', color: TEXT, fontWeight: 500 }}>{b.name || '—'}</td>
                        <td style={{ padding: '8px 12px', color: SUB }}>{b.designation || '—'}</td>
                        <td style={{ padding: '8px 12px', color: SUB }}>{b.institution || '—'}</td>
                        <td style={{ padding: '8px 12px', color: SUB }}>{b.email || '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>}
                </>
              )}

              {/* Infra tab */}
              {activeTab === 'infra' && infra && (
                <>
                  <CollapsibleSection title="Basic Infra">
                    <Grid2>
                      <DetailRow label="Floors"        value={infra.numFloors} />
                      <DetailRow label="Land Area"     value={infra.landArea} />
                      <DetailRow label="Built-up Area" value={infra.builtUpArea} />
                      <DetailRow label="Land Owner"    value={infra.landOwnerName} />
                      <DetailRow label="Parking"       value={infra.parking != null ? (infra.parking ? 'Yes' : 'No') : undefined} />
                      <DetailRow label="PWD Access"    value={infra.pwd != null ? (infra.pwd ? 'Yes' : 'No') : undefined} />
                      <DetailRow label="Lifts"         value={infra.liftCount} />
                      <DetailRow label="CCTV"          value={infra.cctvAvailable != null ? (infra.cctvAvailable ? 'Yes' : 'No') : undefined} />
                      <DetailRow label="Drinking Water" value={infra.drinkingWater != null ? (infra.drinkingWater ? 'Yes' : 'No') : undefined} />
                      <DetailRow label="AC"            value={infra.acAvailable != null ? (infra.acAvailable ? 'Yes' : 'No') : undefined} />
                    </Grid2>
                  </CollapsibleSection>
                  <CollapsibleSection title="Safety">
                    <Grid2>
                      <DetailRow label="First Aid Kit"       value={infra.firstAidKit != null ? (infra.firstAidKit ? 'Yes' : 'No') : undefined} />
                      <DetailRow label="Fire Extinguishers"  value={infra.fireExtPerFloor != null ? (infra.fireExtPerFloor ? 'Per floor' : 'Not per floor') : undefined} />
                      <DetailRow label="Assembly Area"       value={infra.assemblyArea != null ? (infra.assemblyArea ? 'Yes' : 'No') : undefined} />
                      <DetailRow label="Safety Signs"        value={infra.safetySigns != null ? (infra.safetySigns ? 'Yes' : 'No') : undefined} />
                      <DetailRow label="Insurance"           value={infra.insurance != null ? (infra.insurance ? 'Yes' : 'No') : undefined} />
                    </Grid2>
                  </CollapsibleSection>
                  <CollapsibleSection title="Power">
                    <Grid2>
                      <DetailRow label="Genset"      value={infra.powerGenset != null ? (infra.powerGenset ? 'Yes' : 'No') : undefined} />
                      <DetailRow label="Genset Type" value={infra.gensetType} />
                      <DetailRow label="DG Capacity" value={infra.dgCapacity} />
                      <DetailRow label="UPS"         value={infra.upsAvailable != null ? (infra.upsAvailable ? 'Yes' : 'No') : undefined} />
                    </Grid2>
                  </CollapsibleSection>
                </>
              )}
            </>
          )}
        </div>

        {/* Action footer */}
        {canAct && (
          <div style={{ borderTop: `1px solid ${BORDER}`, padding: '14px 20px', flexShrink: 0, background: '#FAFAFA' }}>
            {rejecting ? (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setRejecting(false)} style={{ padding: '0 20px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '100px', background: '#fff', fontSize: '13px', fontWeight: 500, color: TEXT, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => act('reject')} disabled={actLoading} style={{ padding: '0 20px', height: '36px', border: 'none', borderRadius: '100px', background: '#EF4444', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Confirm Reject</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                {app.status === 'SUBMITTED' && (
                  <button onClick={() => act('under-review')} disabled={actLoading}
                    style={{ padding: '0 18px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '100px', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#92400E', cursor: 'pointer' }}>
                    <Clock size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />Mark Under Review
                  </button>
                )}
                <button onClick={() => setRejecting(true)} style={{ padding: '0 18px', height: '36px', border: '1px solid #FCA5A5', borderRadius: '100px', background: '#FEE2E2', fontSize: '13px', fontWeight: 500, color: '#B91C1C', cursor: 'pointer' }}>
                  <XCircle size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />Reject
                </button>
                <button onClick={() => act('approve')} disabled={actLoading} style={{ padding: '0 20px', height: '36px', border: 'none', borderRadius: '100px', background: '#16A34A', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                  <CheckCircle size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />{actLoading ? 'Approving…' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function VerifierDashboard() {
  const [tab, setTab]         = useState<'industry' | 'institute' | 'curriculum' | 'psychometric' | 'workshops'>('industry');
  // Psychometric tab state
  const [pqQuestions, setPqQuestions]       = useState<any[]>([]);
  const [pqLoading, setPqLoading]           = useState(false);
  const [pqUploading, setPqUploading]       = useState(false);
  const [pqUploadMsg, setPqUploadMsg]       = useState('');
  const [pqDeleting, setPqDeleting]         = useState<number | null>(null);
  // Workshops tab state
  const [workshops, setWorkshops]           = useState<any[]>([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(false);
  const [workshopActing, setWorkshopActing] = useState<number | null>(null);
  const [workshopRejectTarget, setWorkshopRejectTarget] = useState<any | null>(null);
  const [workshopRejectReason, setWorkshopRejectReason] = useState('');
  const [apps, setApps]       = useState<Application[]>([]);
  const [institutes, setInstitutes] = useState<InstituteApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [selectedInstitute, setSelectedInstitute] = useState<InstituteApp | null>(null);
  const [filter, setFilter]   = useState<string>('ALL');
  const [pendingCurricula, setPendingCurricula] = useState<any[]>([]);
  const [curriculumLoaded, setCurriculumLoaded] = useState(false);
  const [rejectTarget, setRejectTarget]   = useState<any | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/verifier/industry-partners')
      .then(res => setApps(res.data?.data ?? []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  };

  const loadInstitutes = () => {
    setLoading(true);
    api.get('/verifier/institutes')
      .then(res => setInstitutes(res.data?.data ?? []))
      .catch(() => setInstitutes([]))
      .finally(() => setLoading(false));
  };

  const loadCurricula = () => {
    api.get('/verifier/curriculum/pending')
      .then(res => { setPendingCurricula(res.data?.data ?? []); setCurriculumLoaded(true); })
      .catch(() => {});
  };

  const loadPsychometricQuestions = () => {
    setPqLoading(true);
    api.get('/verifier/psychometric/questions')
      .then(res => setPqQuestions(res.data?.data ?? []))
      .catch(() => setPqQuestions([]))
      .finally(() => setPqLoading(false));
  };

  const loadWorkshops = () => {
    setWorkshopsLoading(true);
    api.get('/verifier/workshops')
      .then(res => setWorkshops(res.data?.data ?? []))
      .catch(() => setWorkshops([]))
      .finally(() => setWorkshopsLoading(false));
  };

  const approveWorkshop = async (id: number) => {
    setWorkshopActing(id);
    try { await api.put(`/verifier/workshops/${id}/approve`); loadWorkshops(); }
    finally { setWorkshopActing(null); }
  };

  const rejectWorkshop = async () => {
    if (!workshopRejectTarget) return;
    setWorkshopActing(workshopRejectTarget.id);
    try {
      await api.put(`/verifier/workshops/${workshopRejectTarget.id}/reject`, { reason: workshopRejectReason });
      setWorkshopRejectTarget(null); setWorkshopRejectReason('');
      loadWorkshops();
    } finally { setWorkshopActing(null); }
  };

  useEffect(() => { load(); loadInstitutes(); loadCurricula(); loadWorkshops(); }, []);

  const handleIndustryAction = async (id: number, action: 'approve' | 'reject' | 'under-review', reason?: string) => {
    if (action === 'approve')     await api.put(`/verifier/industry-partners/${id}/approve`);
    else if (action === 'reject') await api.put(`/verifier/industry-partners/${id}/reject`, { reason });
    else                          await api.put(`/verifier/industry-partners/${id}/under-review`);
    load();
  };

  const handleInstituteAction = async (id: number, action: 'approve' | 'reject' | 'under-review') => {
    if (action === 'approve')     await api.put(`/verifier/institutes/${id}/approve`);
    else if (action === 'reject') await api.put(`/verifier/institutes/${id}/reject`, {});
    else                          await api.put(`/verifier/institutes/${id}/under-review`);
    loadInstitutes();
  };

  const industryCounts = {
    ALL: apps.length,
    SUBMITTED: apps.filter(a => a.applicationStatus === 'SUBMITTED').length,
    UNDER_REVIEW: apps.filter(a => a.applicationStatus === 'UNDER_REVIEW').length,
    APPROVED: apps.filter(a => a.applicationStatus === 'APPROVED').length,
    REJECTED: apps.filter(a => a.applicationStatus === 'REJECTED').length,
  };

  const instituteCounts = {
    ALL: institutes.length,
    SUBMITTED: institutes.filter(i => i.status === 'SUBMITTED').length,
    UNDER_REVIEW: institutes.filter(i => i.status === 'UNDER_REVIEW').length,
    APPROVED: institutes.filter(i => i.status === 'APPROVED').length,
    REJECTED: institutes.filter(i => i.status === 'REJECTED').length,
  };

  const counts = tab === 'industry' ? industryCounts : instituteCounts;

  const FILTERS = [
    { key: 'ALL',          label: 'All',          color: PRIMARY,   bg: '#EEEEFF' },
    { key: 'SUBMITTED',    label: 'Submitted',     color: '#1D4ED8', bg: '#DBEAFE' },
    { key: 'UNDER_REVIEW', label: 'Under Review',  color: '#92400E', bg: '#FEF3C7' },
    { key: 'APPROVED',     label: 'Approved',      color: '#15803D', bg: '#DCFCE7' },
    { key: 'REJECTED',     label: 'Rejected',      color: '#B91C1C', bg: '#FEE2E2' },
  ];

  const displayedIndustry  = filter === 'ALL' ? apps       : apps.filter(a => a.applicationStatus === filter);
  const displayedInstitutes = filter === 'ALL' ? institutes : institutes.filter(i => i.status === filter);

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1000px' }}>

      <h2 style={{ fontSize: '20px', fontWeight: 600, color: TEXT, margin: '0 0 4px' }}>Applications</h2>
      <p style={{ fontSize: '13px', color: SUB, margin: '0 0 20px' }}>Review and approve onboarding applications.</p>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '24px', borderBottom: `1px solid ${BORDER}` }}>
        {([
          ['industry',     'Industry Partners'],
          ['institute',    'Institutes'],
          ['curriculum',   `Curriculum Approvals${pendingCurricula.length > 0 ? ` (${pendingCurricula.length})` : ''}`],
          ['psychometric', 'Psychometric Questions'],
          ['workshops',    `Workshop Approvals${workshops.length > 0 ? ` (${workshops.length})` : ''}`],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => {
            setTab(key as typeof tab);
            setFilter('ALL');
            if (key === 'psychometric') loadPsychometricQuestions();
            if (key === 'workshops') loadWorkshops();
          }}
            style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', borderBottom: tab === key ? `2px solid ${PRIMARY}` : '2px solid transparent', color: tab === key ? PRIMARY : SUB, marginBottom: '-1px', whiteSpace: 'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Summary cards + filters — hidden on curriculum tab */}
      {tab !== 'curriculum' && tab !== 'psychometric' && tab !== 'workshops' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total',        value: counts.ALL,          color: PRIMARY,   bg: '#EEEEFF' },
              { label: 'Submitted',    value: counts.SUBMITTED,    color: '#1D4ED8', bg: '#DBEAFE' },
              { label: 'Under Review', value: counts.UNDER_REVIEW, color: '#92400E', bg: '#FEF3C7' },
              { label: 'Approved',     value: counts.APPROVED,     color: '#15803D', bg: '#DCFCE7' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</span>
                </div>
                <span style={{ fontSize: '13px', color: SUB }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: '5px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${filter === f.key ? f.color : BORDER}`, background: filter === f.key ? f.bg : '#fff', color: filter === f.key ? f.color : SUB }}>
                {f.label} ({counts[f.key as keyof typeof counts]})
              </button>
            ))}
          </div>
        </>
      )}

      {/* Industry table */}
      {tab === 'industry' && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: '32px', textAlign: 'center', color: SUB, margin: 0 }}>Loading…</p>
          ) : displayedIndustry.length === 0 ? (
            <p style={{ padding: '32px', textAlign: 'center', color: '#A3A3A3', margin: 0 }}>No applications found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
                  {['Company Name','Registering As','Submitted On','Status','Action'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedIndustry.map(app => {
                  const st = STATUS_STYLES[app.applicationStatus ?? ''];
                  return (
                    <tr key={app.id} style={{ borderBottom: `1px solid ${BORDER}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: TEXT }}>{app.registeredName || '—'}</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>{app.registeringAs || '—'}</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td style={{ padding: '12px 16px' }}>{st && <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg }}>{st.label}</span>}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => setSelected(app)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 14px', border: `1px solid ${BORDER}`, borderRadius: '100px', background: '#fff', fontSize: '12px', fontWeight: 500, color: PRIMARY, cursor: 'pointer' }}>
                          <Eye size={13} /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Institute table */}
      {tab === 'institute' && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: '32px', textAlign: 'center', color: SUB, margin: 0 }}>Loading…</p>
          ) : displayedInstitutes.length === 0 ? (
            <p style={{ padding: '32px', textAlign: 'center', color: '#A3A3A3', margin: 0 }}>No institute applications found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
                  {['Institute Name','Type','City','Status','Action'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedInstitutes.map(inst => {
                  const st = STATUS_STYLES[inst.status ?? ''];
                  return (
                    <tr key={inst.id} style={{ borderBottom: `1px solid ${BORDER}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: TEXT }}>{inst.name || '—'}</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>{inst.type || '—'}</td>
                      <td style={{ padding: '12px 16px', color: SUB }}>{inst.city || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>{st && <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg }}>{st.label}</span>}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => setSelectedInstitute(inst)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 14px', border: `1px solid ${BORDER}`, borderRadius: '100px', background: '#fff', fontSize: '12px', fontWeight: 500, color: PRIMARY, cursor: 'pointer' }}>
                          <Eye size={13} /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Curriculum Approvals Tab */}
      {tab === 'curriculum' && (
        <div>
          {pendingCurricula.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: SUB }}>No curricula awaiting final approval.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
              {pendingCurricula.map((c: any) => (
                <div key={c.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '4px' }}>
                      {c.programName}{c.major ? ` — ${c.major}` : ''}
                    </div>
                    <div style={{ fontSize: '12px', color: SUB }}>{c.degree} · {c.academicYear}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setRejectTarget(c); setRejectRemarks(''); }}
                      style={{ border: '1px solid #FCA5A5', borderRadius: '8px', background: '#FEF2F2', color: '#B91C1C', padding: '8px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      Reject
                    </button>
                    <button onClick={async () => {
                      await api.post(`/verifier/curriculum/${c.id}/approve`);
                      loadCurricula();
                    }} style={{ border: 'none', borderRadius: '8px', background: PRIMARY, color: '#fff', padding: '8px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && <ReviewPanel app={selected} onClose={() => setSelected(null)} onAction={handleIndustryAction} />}
      {selectedInstitute && <InstituteReviewPanel app={selectedInstitute} onClose={() => setSelectedInstitute(null)} onAction={handleInstituteAction} />}

      {/* Curriculum Reject Modal */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: '0 0 6px' }}>Reject Curriculum</h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 20px' }}>
              {rejectTarget.programName}{rejectTarget.major ? ` — ${rejectTarget.major}` : ''} · {rejectTarget.academicYear}
            </p>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '8px' }}>
              Reason for Rejection <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              value={rejectRemarks}
              onChange={e => setRejectRemarks(e.target.value)}
              placeholder="Explain why this curriculum is being rejected..."
              rows={4}
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' as const, outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setRejectTarget(null)}
                style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', padding: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: '#1E293B' }}>
                Cancel
              </button>
              <button
                disabled={!rejectRemarks.trim()}
                onClick={async () => {
                  await api.post(`/verifier/curriculum/${rejectTarget.id}/reject`, { remarks: rejectRemarks });
                  setRejectTarget(null);
                  loadCurricula();
                }}
                style={{ flex: 1, border: 'none', borderRadius: '8px', background: rejectRemarks.trim() ? '#B91C1C' : '#FCA5A5', color: '#fff', padding: '10px', fontSize: '14px', fontWeight: 600, cursor: rejectRemarks.trim() ? 'pointer' : 'not-allowed' }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Psychometric Questions Tab ── */}
      {tab === 'psychometric' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 700, color: TEXT }}>Question Bank</h3>
              <p style={{ margin: 0, fontSize: '13px', color: SUB }}>{pqQuestions.length} question{pqQuestions.length !== 1 ? 's' : ''} loaded</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="/api/verifier/psychometric/questions/sample" download
                style={{ padding: '9px 18px', borderRadius: '100px', border: `1.5px solid ${BORDER}`, background: '#fff', color: SUB, fontSize: '13px', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                ⬇ Sample Excel
              </a>
              <label style={{ padding: '9px 20px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {pqUploading ? '⏳ Uploading…' : '↑ Upload Excel'}
                <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={async e => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setPqUploading(true); setPqUploadMsg('');
                  const fd = new FormData(); fd.append('file', file);
                  try {
                    const res = await api.post('/verifier/psychometric/questions/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    setPqUploadMsg(res.data?.data ?? 'Uploaded successfully');
                    loadPsychometricQuestions();
                  } catch (err: any) {
                    setPqUploadMsg(err?.response?.data?.message ?? 'Upload failed');
                  } finally { setPqUploading(false); e.target.value = ''; }
                }} />
              </label>
            </div>
          </div>

          {pqUploadMsg && (
            <div style={{ background: pqUploadMsg.toLowerCase().includes('fail') ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${pqUploadMsg.toLowerCase().includes('fail') ? '#FECACA' : '#86EFAC'}`, borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', color: pqUploadMsg.toLowerCase().includes('fail') ? '#DC2626' : '#15803D' }}>
              {pqUploadMsg}
            </div>
          )}

          {pqLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: SUB, fontSize: '13px' }}>Loading questions…</div>
          ) : pqQuestions.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              No questions uploaded yet. Download the sample Excel, fill it in, and upload.
            </div>
          ) : (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${BORDER}` }}>
                    {['#', 'Question', 'Category', 'Profile Type', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: SUB, fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pqQuestions.map((q: any, idx: number) => (
                    <tr key={q.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', color: '#94A3B8', fontWeight: 500, width: '40px' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 14px', color: TEXT, maxWidth: '360px' }}>{q.questionText}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: '#EEF2FF', color: PRIMARY }}>{q.category}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: '#F1F5F9', color: '#475569' }}>{q.profileType}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: q.active ? '#DCFCE7' : '#FEF2F2', color: q.active ? '#16A34A' : '#DC2626' }}>
                          {q.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={async () => {
                          setPqDeleting(q.id);
                          try { await api.delete(`/verifier/psychometric/questions/${q.id}`); loadPsychometricQuestions(); }
                          catch { /* ignore */ } finally { setPqDeleting(null); }
                        }} disabled={pqDeleting === q.id}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: pqDeleting === q.id ? 'not-allowed' : 'pointer', opacity: pqDeleting === q.id ? 0.5 : 1, fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px' }}>
                          {pqDeleting === q.id ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'workshops' && (
        <div>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: TEXT }}>Pending Workshops</h3>
          {workshopsLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: SUB, fontSize: '13px' }}>Loading…</div>
          ) : workshops.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No workshops pending review.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {workshops.map((w: any) => (
                <div key={w.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{w.title}</div>
                      <div style={{ fontSize: '12px', color: SUB, marginTop: '2px' }}>{w.posterName} · {w.targetRole} · {w.trainerName ?? 'No trainer assigned'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: SUB, flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span>{w.mode === 'ONLINE' ? 'Online' : `${w.city}${w.state ? `, ${w.state}` : ''}`}</span>
                    <span>{w.sessionDate} {w.sessionTime}</span>
                    <span>{w.totalSeats} seats</span>
                    <span>{w.feeAmount ? `₹${w.feeAmount}` : 'Free'}</span>
                  </div>
                  {w.description && <p style={{ margin: '0 0 12px', fontSize: '13px', color: TEXT, lineHeight: 1.6 }}>{w.description}</p>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => approveWorkshop(w.id)} disabled={workshopActing === w.id}
                      style={{ padding: '8px 20px', borderRadius: '100px', border: 'none', background: '#16A34A', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: workshopActing === w.id ? 'not-allowed' : 'pointer', opacity: workshopActing === w.id ? 0.6 : 1 }}>
                      Approve
                    </button>
                    <button onClick={() => { setWorkshopRejectTarget(w); setWorkshopRejectReason(''); }} disabled={workshopActing === w.id}
                      style={{ padding: '8px 20px', borderRadius: '100px', border: '1px solid #FCA5A5', background: '#fff', color: '#B91C1C', fontSize: '12px', fontWeight: 600, cursor: workshopActing === w.id ? 'not-allowed' : 'pointer' }}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {workshopRejectTarget && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 700, color: TEXT }}>Reject "{workshopRejectTarget.title}"</h3>
                <textarea value={workshopRejectReason} onChange={e => setWorkshopRejectReason(e.target.value)} rows={3}
                  placeholder="Reason for rejection"
                  style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' as const }} />
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button onClick={() => setWorkshopRejectTarget(null)}
                    style={{ flex: 1, padding: '10px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={rejectWorkshop} disabled={workshopActing === workshopRejectTarget.id}
                    style={{ flex: 1, padding: '10px', borderRadius: '100px', border: 'none', background: '#DC2626', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
