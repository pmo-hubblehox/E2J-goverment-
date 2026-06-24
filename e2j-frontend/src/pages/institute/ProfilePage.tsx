import { useState, useEffect } from 'react';
import {
  Edit2, Save, X, Globe, Phone, MapPin, Building2, Mail, FileText,
  ExternalLink, ChevronDown, ChevronRight, Users, BookOpen, GraduationCap,
  Layers, UserCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const BACKEND = 'http://localhost:8081';
const docUrl  = (url?: string | null) => url ? (url.startsWith('http') ? url : `${BACKEND}${url}`) : null;

const PRIMARY = '#3F41D1';
const TEXT    = '#1E293B';
const SUB     = '#64748B';
const BORDER  = '#E2E8F0';
const BG      = '#F8FAFC';

const LABEL: React.CSSProperties = { fontSize: '11px', color: '#94A3B8', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' };
const VAL:   React.CSSProperties = { fontSize: '13px', color: TEXT, fontWeight: 500 };
const ROW:   React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${BG}` };

function Section({ title, icon: Icon, children, defaultOpen = true, badge }: {
  title: string; icon?: React.ElementType; children: React.ReactNode; defaultOpen?: boolean; badge?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', marginBottom: '16px', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {Icon && <Icon size={16} color={PRIMARY} />}
          <span style={{ fontSize: '15px', fontWeight: 700, color: TEXT }}>{title}</span>
          {badge !== undefined && badge > 0 && (
            <span style={{ background: '#EEF2FF', color: PRIMARY, fontSize: '11px', fontWeight: 600, borderRadius: '100px', padding: '2px 8px' }}>{badge}</span>
          )}
        </div>
        {open ? <ChevronDown size={16} color={SUB} /> : <ChevronRight size={16} color={SUB} />}
      </button>
      {open && <div style={{ padding: '0 20px 20px' }}>{children}</div>}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, editable, editValue, onEdit }: {
  icon: React.ElementType; label: string; value?: string | null;
  editable?: boolean; editValue?: string; onEdit?: (v: string) => void;
}) {
  return (
    <div style={ROW}>
      <Icon size={15} style={{ color: '#94A3B8', flexShrink: 0, marginTop: '14px' }} />
      <div style={{ flex: 1 }}>
        <p style={LABEL}>{label}</p>
        {editable && onEdit
          ? <input value={editValue ?? ''} onChange={e => onEdit(e.target.value)}
              style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box', color: TEXT }} />
          : <p style={VAL}>{value || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Not set</span>}</p>}
      </div>
    </div>
  );
}

function DocRow({ label, url }: { label: string; url?: string | null }) {
  const href = docUrl(url);
  if (!href) return null;
  const fileName = url?.split('/').pop() ?? label;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${BG}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={16} color="#EF4444" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: TEXT }}>{label}</p>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: SUB }}>{fileName}</p>
        </div>
      </div>
      <a href={href} target="_blank" rel="noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: PRIMARY, fontWeight: 500, textDecoration: 'none' }}>
        View <ExternalLink size={12} />
      </a>
    </div>
  );
}

function Chip({ label, color = PRIMARY, bg = '#EEF2FF' }: { label: string; color?: string; bg?: string }) {
  return <span style={{ background: bg, color, fontSize: '11px', fontWeight: 600, borderRadius: '100px', padding: '3px 10px', display: 'inline-block' }}>{label}</span>;
}

export default function InstituteProfilePage() {
  const { user } = useAuth();
  const [p,        setP]        = useState<Record<string, any>>({});
  const [faculty,  setFaculty]  = useState<any[]>([]);
  const [bos,      setBos]      = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [infra,    setInfra]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [editName,  setEditName]  = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWeb,   setEditWeb]   = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/institute/profile'),
      api.get('/institute/faculty').catch(() => ({ data: { data: [] } })),
      api.get('/institute/bos-members').catch(() => ({ data: { data: [] } })),
      api.get('/institute/programs').catch(() => ({ data: { data: { content: [] } } })),
      api.get('/institute/students').catch(() => ({ data: { data: { content: [] } } })),
      api.get('/institute/infra').catch(() => ({ data: { data: null } })),
    ]).then(([pRes, fRes, bRes, pgRes, stRes, irRes]) => {
      const d = pRes.data?.data ?? {};
      setP(d);
      setEditName(d.name ?? '');
      setEditPhone(d.phone ?? '');
      setEditWeb(d.websiteUrl ?? '');
      setFaculty(fRes.data?.data?.content ?? fRes.data?.data ?? []);
      setBos(bRes.data?.data ?? []);
      setPrograms(pgRes.data?.data?.content ?? pgRes.data?.data ?? []);
      setStudents(stRes.data?.data?.content ?? stRes.data?.data ?? []);
      setInfra(irRes.data?.data ?? null);
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await api.put('/institute/profile', { name: editName, phone: editPhone, website: editWeb }).catch(() => {});
    setP(prev => ({ ...prev, name: editName, phone: editPhone, websiteUrl: editWeb }));
    setSaving(false);
    setEditing(false);
  };

  const initials = (editName || user?.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  let contacts: any[] = [];
  try { if (p.contactsJson) contacts = JSON.parse(p.contactsJson); } catch {}

  const statusColors: Record<string, [string, string]> = {
    PENDING:      ['#FEF3C7', '#D97706'],
    SUBMITTED:    ['#DBEAFE', '#1D4ED8'],
    UNDER_REVIEW: ['#FEF3C7', '#92400E'],
    APPROVED:     ['#DCFCE7', '#15803D'],
    REJECTED:     ['#FEE2E2', '#B91C1C'],
  };
  const [statusBg, statusColor] = statusColors[p.status] ?? ['#F1F5F9', SUB];

  if (loading) return <div style={{ padding: 32, color: SUB }}>Loading…</div>;

  return (
    <div style={{ padding: '20px 28px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
        <span>Home</span><span>›</span><span style={{ color: TEXT, fontWeight: 500 }}>Profile</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: TEXT, margin: 0 }}>Institute Profile</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', padding: '8px 18px', fontSize: '13px', cursor: 'pointer', color: SUB }}>
                <X size={14} /> Cancel
              </button>
              <button onClick={save} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '20px', background: PRIMARY, color: '#fff', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', padding: '8px 18px', fontSize: '13px', cursor: 'pointer', color: SUB }}>
              <Edit2 size={14} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Identity card */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '14px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: PRIMARY, flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1 }}>
          {editing
            ? <input value={editName} onChange={e => setEditName(e.target.value)}
                style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '7px 10px', fontSize: '16px', fontWeight: 700, outline: 'none', color: TEXT, marginBottom: '4px', width: '100%', boxSizing: 'border-box' }} />
            : <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: TEXT }}>{editName || '—'}</h2>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Mail size={13} style={{ color: '#94A3B8' }} />
            <span style={{ fontSize: '13px', color: PRIMARY }}>{user?.email ?? '—'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            <Chip label="Institute" />
            {p.type && <Chip label={p.type} color="#7C3AED" bg="#F3E8FF" />}
            {p.accreditationBody && <Chip label={p.accreditationBody} color="#0369A1" bg="#E0F2FE" />}
            <span style={{ background: statusBg, color: statusColor, fontSize: '11px', fontWeight: 600, borderRadius: '100px', padding: '3px 10px' }}>{p.status ?? 'PENDING'}</span>
          </div>
        </div>
        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
          {[
            { label: 'Programs', value: programs.length, icon: BookOpen },
            { label: 'Students', value: students.length, icon: GraduationCap },
            { label: 'Faculty',  value: faculty.length,  icon: Users },
            { label: 'BOS',      value: bos.length,      icon: UserCheck },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ textAlign: 'center' as const }}>
              <Icon size={18} color={PRIMARY} style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '20px', fontWeight: 700, color: TEXT }}>{value}</div>
              <div style={{ fontSize: '11px', color: SUB }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Left column */}
        <div>
          <Section title="Institute Details" icon={Building2}>
            <InfoRow icon={Building2} label="Name Of Institute" value={editName}  editable={editing} editValue={editName}  onEdit={setEditName} />
            <InfoRow icon={Building2} label="Type Of Institute" value={p.type} />
            <InfoRow icon={Globe}     label="Website URL"       value={editWeb}   editable={editing} editValue={editWeb}   onEdit={setEditWeb} />
            <InfoRow icon={Phone}     label="Phone"             value={editPhone} editable={editing} editValue={editPhone} onEdit={setEditPhone} />
          </Section>

          <Section title="Registered Address" icon={MapPin}>
            <InfoRow icon={Building2} label="Building Name"   value={p.buildingName} />
            <InfoRow icon={Building2} label="Room / Floor"    value={p.roomFloor} />
            <InfoRow icon={MapPin}    label="Area / Locality" value={p.area} />
            <InfoRow icon={MapPin}    label="Landmark"        value={p.landmark} />
            <InfoRow icon={MapPin}    label="City"            value={p.city} />
            <InfoRow icon={MapPin}    label="State"           value={p.state} />
            <InfoRow icon={MapPin}    label="Pincode"         value={p.pincode} />
            <InfoRow icon={MapPin}    label="Country"         value={p.country} />
            {p.locationPin && (
              <div style={ROW}>
                <MapPin size={15} style={{ color: '#94A3B8', flexShrink: 0, marginTop: '14px' }} />
                <div style={{ flex: 1 }}>
                  <p style={LABEL}>Location Pin</p>
                  <a href={p.locationPin} target="_blank" rel="noreferrer"
                    style={{ fontSize: '13px', color: PRIMARY, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                    View On Google Maps <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </Section>

          {/* Programs */}
          <Section title="Programs" icon={BookOpen} badge={programs.length}>
            {programs.length === 0
              ? <p style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>No programs added yet</p>
              : programs.map((pg: any) => (
                <div key={pg.id} style={{ padding: '12px 0', borderBottom: `1px solid ${BG}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{pg.name}</span>
                    <Chip label={pg.degree ?? 'Degree'} color="#7C3AED" bg="#F3E8FF" />
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const }}>
                    {pg.department && <span style={{ fontSize: '12px', color: SUB }}>Dept: {pg.department}</span>}
                    {pg.duration   && <span style={{ fontSize: '12px', color: SUB }}>Duration: {pg.duration} yrs</span>}
                    {pg.totalSeats && <span style={{ fontSize: '12px', color: SUB }}>Seats: {pg.totalSeats}</span>}
                  </div>
                  {pg.majors?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginTop: '6px' }}>
                      {pg.majors.map((m: string) => <Chip key={m} label={m} color={SUB} bg="#F1F5F9" />)}
                    </div>
                  )}
                </div>
              ))}
          </Section>

          {/* Students */}
          <Section title="Students" icon={GraduationCap} badge={students.length} defaultOpen={false}>
            {students.length === 0
              ? <p style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>No students added yet</p>
              : (
                <div style={{ overflowX: 'auto' as const }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: BG }}>
                        {['Name', 'Roll No', 'Course', 'Year', 'Email'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left' as const, fontWeight: 600, color: SUB, whiteSpace: 'nowrap' as const }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 50).map((s: any, i: number) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${BG}` }}>
                          <td style={{ padding: '8px 12px', color: TEXT, fontWeight: 500 }}>{s.name ?? '—'}</td>
                          <td style={{ padding: '8px 12px', color: SUB }}>{s.rollNumber ?? s.rollNo ?? '—'}</td>
                          <td style={{ padding: '8px 12px', color: SUB }}>{s.course ?? s.program ?? '—'}</td>
                          <td style={{ padding: '8px 12px', color: SUB }}>{s.year ?? '—'}</td>
                          <td style={{ padding: '8px 12px', color: PRIMARY }}>{s.email ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length > 50 && <p style={{ fontSize: '12px', color: SUB, padding: '8px 0', margin: 0 }}>Showing 50 of {students.length}</p>}
                </div>
              )}
          </Section>
        </div>

        {/* Right column */}
        <div>
          {/* Placement officers */}
          {contacts.length > 0 && (
            <Section title="Placement Officers" icon={Users} badge={contacts.length}>
              {contacts.map((c: any, i: number) => (
                <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#D97706', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                    {(c.contactPersonName ?? c.name ?? '?')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 3px', fontSize: '14px', fontWeight: 600, color: TEXT }}>{c.contactPersonName ?? c.name}</p>
                    {c.contactType && <p style={{ margin: '0 0 4px', fontSize: '11px', color: SUB }}>{c.contactType}</p>}
                    {c.emailAddress && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <Mail size={12} style={{ color: '#94A3B8' }} /><span style={{ fontSize: '12px', color: PRIMARY }}>{c.emailAddress}</span>
                      </div>
                    )}
                    {c.contactNumber && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} style={{ color: '#94A3B8' }} /><span style={{ fontSize: '12px', color: SUB }}>{c.contactNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* Faculty */}
          <Section title="Faculty" icon={Users} badge={faculty.length} defaultOpen={false}>
            {faculty.length === 0
              ? <p style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>No faculty added yet</p>
              : faculty.map((f: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${BG}`, alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: PRIMARY, flexShrink: 0 }}>
                    {(f.name ?? '?')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{f.name}</p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                      {f.expertise && <span style={{ fontSize: '12px', color: SUB }}>{f.expertise}</span>}
                      {f.days      && <span style={{ fontSize: '12px', color: SUB }}>Days: {f.days}</span>}
                      {f.mode      && <Chip label={f.mode} color={SUB} bg="#F1F5F9" />}
                    </div>
                  </div>
                  {f.glStatus === true || f.glStatus === 'true' ? (
                    <Chip label="GL" color="#15803D" bg="#DCFCE7" />
                  ) : null}
                </div>
              ))}
          </Section>

          {/* BOS Members */}
          <Section title="BOS Members" icon={UserCheck} badge={bos.length} defaultOpen={false}>
            {bos.length === 0
              ? <p style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>No BOS members added yet</p>
              : bos.map((b: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${BG}`, alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#7C3AED', flexShrink: 0 }}>
                    {(b.name ?? '?')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{b.name}</p>
                    {b.designation   && <p style={{ margin: '0 0 2px', fontSize: '12px', color: SUB }}>{b.designation}{b.organization ? ` · ${b.organization}` : ''}</p>}
                    {b.expertise     && <p style={{ margin: '0 0 2px', fontSize: '12px', color: SUB }}>Expertise: {b.expertise}</p>}
                    {b.department    && <p style={{ margin: '0 0 2px', fontSize: '12px', color: SUB }}>Dept: {b.department}</p>}
                    {b.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <Mail size={12} style={{ color: '#94A3B8' }} /><span style={{ fontSize: '12px', color: PRIMARY }}>{b.email}</span>
                      </div>
                    )}
                    {b.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <Phone size={12} style={{ color: '#94A3B8' }} /><span style={{ fontSize: '12px', color: SUB }}>{b.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </Section>

          {/* Documents */}
          <Section title="Documents" icon={FileText}>
            {p.accreditationBody && (
              <div style={{ marginBottom: '12px' }}>
                <p style={LABEL}>Accreditation Body</p>
                <p style={VAL}>{p.accreditationBody}</p>
              </div>
            )}
            <DocRow label="Accreditation Certificate" url={p.accreditationCertUrl} />
            <DocRow label="University Certificate"    url={p.universityCertUrl} />
            <DocRow label="UGC Certificate"           url={p.ugcCertUrl} />
            <DocRow label="Rating Document"           url={p.ratingDocUrl} />
            <DocRow label="Signed MoU"                url={p.mouUrl} />
            {!p.accreditationCertUrl && !p.universityCertUrl && !p.ugcCertUrl && !p.ratingDocUrl && !p.mouUrl && (
              <p style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>No documents uploaded</p>
            )}
          </Section>

          {/* Services */}
          {(p.servicesAvail?.length > 0 || p.servicesOffer?.length > 0) && (
            <Section title="Services" icon={Layers}>
              {p.servicesAvail?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: SUB, margin: '0 0 8px' }}>Services Availed</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                    {p.servicesAvail.map((s: string) => <Chip key={s} label={s} color={PRIMARY} bg="#EEF2FF" />)}
                  </div>
                </div>
              )}
              {p.servicesOffer?.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: SUB, margin: '0 0 8px' }}>Services Offered</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                    {p.servicesOffer.map((s: string) => <Chip key={s} label={s} color="#15803D" bg="#DCFCE7" />)}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Infra summary */}
          {infra && (
            <Section title="Infrastructure" icon={Building2} defaultOpen={false}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[
                  { label: 'Total Area (sq ft)', value: infra.totalArea },
                  { label: 'Classrooms',          value: infra.numberOfClassrooms },
                  { label: 'Labs',                value: infra.numberOfLabs },
                  { label: 'Library',             value: infra.library ? 'Yes' : 'No' },
                  { label: 'Hostel',              value: infra.hostel ? 'Yes' : 'No' },
                  { label: 'PWD Accessible',      value: infra.pwd ? 'Yes' : 'No' },
                ].filter(r => r.value !== undefined && r.value !== null).map(r => (
                  <div key={r.label} style={{ background: BG, borderRadius: '8px', padding: '10px 12px' }}>
                    <p style={LABEL}>{r.label}</p>
                    <p style={{ ...VAL, margin: 0 }}>{String(r.value)}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
