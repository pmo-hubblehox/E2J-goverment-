import { useState, useEffect } from 'react';
import api from '../../services/api';

const TEXT    = '#212121';
const SUB     = '#666666';
const BORDER  = '#E2E8F0';
const PRIMARY = '#3F41D1';
const BACKEND = 'http://localhost:8081';

const docUrl = (url?: string | null) => url ? (url.startsWith('http') ? url : `${BACKEND}${url}`) : null;

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: SUB, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, color: value != null ? TEXT : '#A3A3A3' }}>{value ?? '—'}</span>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url?: string | null }) {
  const href = docUrl(url);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: SUB, fontWeight: 500 }}>{label}</span>
      {href ? <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: PRIMARY }}>View Document ↗</a>
             : <span style={{ fontSize: 14, color: '#A3A3A3' }}>—</span>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
      {children}
      <div style={{ height: 1, background: BORDER, margin: '20px 0 0' }} />
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px' }}>{children}</div>;
}

const TABS = [
  { key: 'profile',  label: 'Profile' },
  { key: 'programs', label: 'Programs' },
  { key: 'students', label: 'Students' },
  { key: 'faculty',  label: 'Faculty & BOS' },
  { key: 'infra',    label: 'Infra' },
] as const;

type Tab = typeof TABS[number]['key'];

export default function InstitutePendingProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile,   setProfile]   = useState<Record<string, any>>({});
  const [programs,  setPrograms]  = useState<any[]>([]);
  const [students,  setStudents]  = useState<any[]>([]);
  const [faculty,   setFaculty]   = useState<any[]>([]);
  const [bos,       setBos]       = useState<any[]>([]);
  const [infra,     setInfra]     = useState<any>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get('/institute/profile').then(r => setProfile(r.data?.data ?? {})).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'programs' && programs.length === 0) {
      api.get('/institute/programs').then(r => setPrograms(r.data?.data?.content ?? r.data?.data ?? []));
    }
    if (activeTab === 'students' && students.length === 0) {
      api.get('/institute/students').then(r => setStudents(r.data?.data?.content ?? r.data?.data ?? []));
    }
    if (activeTab === 'faculty' && faculty.length === 0) {
      Promise.all([api.get('/institute/faculty'), api.get('/institute/bos-members')]).then(([fRes, bRes]) => {
        setFaculty(fRes.data?.data?.content ?? fRes.data?.data ?? []);
        setBos(bRes.data?.data ?? []);
      });
    }
    if (activeTab === 'infra' && !infra) {
      api.get('/institute/infra').then(r => setInfra(r.data?.data ?? {}));
    }
  }, [activeTab]);

  return (
    <div style={{ padding: '32px', maxWidth: '860px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: TEXT, margin: '0 0 4px' }}>Institute Profile</h2>
      <p style={{ fontSize: '13px', color: SUB, margin: '0 0 20px' }}>Your submitted onboarding information.</p>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '10px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', borderBottom: activeTab === t.key ? `2px solid ${PRIMARY}` : '2px solid transparent', color: activeTab === t.key ? PRIMARY : SUB, whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: SUB }}>Loading…</p> : (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Profile */}
          {activeTab === 'profile' && (
            <>
              <Section title="Basic Information">
                <Grid>
                  <Field label="Institute Name" value={profile.name} />
                  <Field label="Type"           value={profile.type} />
                  <Field label="Website"        value={profile.websiteUrl} />
                  <Field label="Phone"          value={profile.phone} />
                </Grid>
              </Section>
              <Section title="Address">
                <Grid>
                  <Field label="Building / Campus" value={profile.buildingName} />
                  <Field label="Room / Floor"      value={profile.roomFloor} />
                  <Field label="Area"              value={profile.area} />
                  <Field label="Landmark"          value={profile.landmark} />
                  <Field label="City"              value={profile.city} />
                  <Field label="State"             value={profile.state} />
                  <Field label="Pincode"           value={profile.pincode} />
                  <Field label="Country"           value={profile.country} />
                </Grid>
              </Section>
              {(profile.servicesAvail?.length > 0 || profile.servicesOffer?.length > 0) && (
                <Section title="Services">
                  <Grid>
                    <div>
                      <span style={{ fontSize: 12, color: SUB, fontWeight: 500, display: 'block', marginBottom: 6 }}>Available</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {profile.servicesAvail?.map((s: string) => <span key={s} style={{ background: '#EEF2FF', color: PRIMARY, borderRadius: 100, padding: '2px 10px', fontSize: 12 }}>{s}</span>)}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: SUB, fontWeight: 500, display: 'block', marginBottom: 6 }}>Offered</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {profile.servicesOffer?.map((s: string) => <span key={s} style={{ background: '#F0FDFA', color: '#0F766E', borderRadius: 100, padding: '2px 10px', fontSize: 12 }}>{s}</span>)}
                      </div>
                    </div>
                  </Grid>
                </Section>
              )}
              <Section title="Accreditation & Documents">
                <Grid>
                  <Field    label="Accreditation Body"      value={profile.accreditationBody} />
                  <DocLink  label="Accreditation Certificate" url={profile.accreditationCertUrl} />
                  <DocLink  label="University Certificate"    url={profile.universityCertUrl} />
                  <DocLink  label="Rating Document"           url={profile.ratingDocUrl} />
                  <DocLink  label="UGC Certificate"           url={profile.ugcCertUrl} />
                  <DocLink  label="MOU Document"              url={profile.mouUrl} />
                </Grid>
              </Section>
              <section>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment</h3>
                <Grid>
                  <Field label="Payment Method" value={profile.paymentMethod} />
                  <Field label="Amount"         value={profile.paymentAmount != null ? `₹${profile.paymentAmount}` : null} />
                </Grid>
              </section>
            </>
          )}

          {/* Programs */}
          {activeTab === 'programs' && (
            programs.length === 0
              ? <p style={{ color: '#A3A3A3', fontSize: 13 }}>No programs added.</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {programs.map((p: any) => (
                    <div key={p.id} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ background: '#FAFAFA', padding: '10px 14px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3F41D1' }}>{p.programId || '—'}</span>
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
                            {url
                              ? <a href={url.startsWith('http') ? url : `http://localhost:8081${url}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#3F41D1', fontWeight: 500 }}>View →</a>
                              : <span style={{ fontSize: 12, color: '#CBD5E1' }}>Not uploaded</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {/* Students */}
          {activeTab === 'students' && (
            students.length === 0
              ? <p style={{ color: '#A3A3A3', fontSize: 13 }}>No students added.</p>
              : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
                    {['ID','Name','Email','Program','Year','CGPA'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: SUB, textTransform: 'uppercase' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{students.map((s: any) => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '8px 12px', color: SUB }}>{s.studentId || '—'}</td>
                      <td style={{ padding: '8px 12px', color: TEXT, fontWeight: 500 }}>{s.name || '—'}</td>
                      <td style={{ padding: '8px 12px', color: SUB }}>{s.email || '—'}</td>
                      <td style={{ padding: '8px 12px', color: SUB }}>{s.program || '—'}</td>
                      <td style={{ padding: '8px 12px', color: SUB }}>{s.year || '—'}</td>
                      <td style={{ padding: '8px 12px', color: SUB }}>{s.cgpa ?? '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
          )}

          {/* Faculty & BOS */}
          {activeTab === 'faculty' && (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0 }}>Faculty ({faculty.length})</p>
              {faculty.length === 0 ? <p style={{ color: '#A3A3A3', fontSize: 13 }}>No faculty added.</p> :
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
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
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0 }}>BOS Members ({bos.length})</p>
              {bos.length === 0 ? <p style={{ color: '#A3A3A3', fontSize: 13 }}>No BOS members added.</p> :
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

          {/* Infra */}
          {activeTab === 'infra' && (
            !infra ? <p style={{ color: '#A3A3A3', fontSize: 13 }}>No infra details found.</p> : (
              <>
                <Section title="Basic">
                  <Grid>
                    <Field label="Floors"         value={infra.numFloors} />
                    <Field label="Land Area"       value={infra.landArea} />
                    <Field label="Built-up Area"   value={infra.builtUpArea} />
                    <Field label="Land Owner"      value={infra.landOwnerName} />
                    <Field label="Parking"         value={infra.parking != null ? (infra.parking ? 'Yes' : 'No') : null} />
                    <Field label="PWD Access"      value={infra.pwd != null ? (infra.pwd ? 'Yes' : 'No') : null} />
                    <Field label="Lifts"           value={infra.liftCount} />
                    <Field label="CCTV"            value={infra.cctvAvailable != null ? (infra.cctvAvailable ? 'Yes' : 'No') : null} />
                    <Field label="Drinking Water"  value={infra.drinkingWater != null ? (infra.drinkingWater ? 'Yes' : 'No') : null} />
                    <Field label="AC"              value={infra.acAvailable != null ? (infra.acAvailable ? 'Yes' : 'No') : null} />
                  </Grid>
                </Section>
                <Section title="Safety">
                  <Grid>
                    <Field label="First Aid Kit"      value={infra.firstAidKit != null ? (infra.firstAidKit ? 'Yes' : 'No') : null} />
                    <Field label="Fire Extinguishers" value={infra.fireExtPerFloor != null ? (infra.fireExtPerFloor ? 'Per floor' : 'Not per floor') : null} />
                    <Field label="Assembly Area"      value={infra.assemblyArea != null ? (infra.assemblyArea ? 'Yes' : 'No') : null} />
                    <Field label="Safety Signs"       value={infra.safetySigns != null ? (infra.safetySigns ? 'Yes' : 'No') : null} />
                    <Field label="Insurance"          value={infra.insurance != null ? (infra.insurance ? 'Yes' : 'No') : null} />
                  </Grid>
                </Section>
                <section>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Power</h3>
                  <Grid>
                    <Field label="Genset"      value={infra.powerGenset != null ? (infra.powerGenset ? 'Yes' : 'No') : null} />
                    <Field label="Genset Type" value={infra.gensetType} />
                    <Field label="DG Capacity" value={infra.dgCapacity} />
                    <Field label="UPS"         value={infra.upsAvailable != null ? (infra.upsAvailable ? 'Yes' : 'No') : null} />
                  </Grid>
                </section>
              </>
            )
          )}

        </div>
      )}
    </div>
  );
}
