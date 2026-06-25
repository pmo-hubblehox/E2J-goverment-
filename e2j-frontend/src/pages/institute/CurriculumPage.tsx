import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import type { Program } from '../../types';
import { Search, Download, Filter, ChevronDown, ChevronUp, MoreVertical, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadCSV } from '../../utils/csvExport';

// ── Design tokens ──────────────────────────────────────────────────────────────
const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#1E293B';
const SUB     = '#64748B';
const BG_ROW  = '#F8FAFC';

// ── Types ──────────────────────────────────────────────────────────────────────
interface CurriculumEntry {
  id: number; programId?: number; programId_: string; degree: string; name: string;
  major: string; duration: number; academicYear: string; lastUpdated: string; version: number;
  status: 'Yet To Start' | 'AI Processing' | 'AI Completed' | 'Sent for BOS Approval' |
          'Rejected by BOS' | 'Approved by BOS' | 'Sent for Final Approval' | 'Rejected' | 'Approved';
  rejectionRemarks?: string;
}

interface VersionEntry {
  id: number; version: number; status: string; createdAt: string;
}

interface SyllabusModule  { number: number; name: string; topics: string; hours: number; changed?: boolean; removed?: boolean; priority?: 'must_have' | 'good_to_have'; skills?: string[]; relevantRoles?: string[] }
interface SyllabusSubject { code: string; name: string; objectives: string[]; outcomes: string[]; modules: SyllabusModule[]; skills?: string[]; relevantRoles?: string[] }
interface SyllabusSemester{ name: string; subjects: SyllabusSubject[] }

interface CreditRow {
  semester: number; courseName: string; courseId: string;
  l: number; p: number; t: number; credits: number;
  t1: number; t2: number; ie: number; points: number; timeHrs: number;
  weightage: number; totalPoints: number;
}
interface TimetableRow { semester: number; date: string; time: string; courseId: string; courseName: string; faculty: string }
interface WeeklySlot    { day: string; startTime: string; endTime: string; courseCode: string; courseName: string; faculty: string; room: string }

interface AiChange {
  semester: string; subjectCode: string; subjectName: string;
  type: string; original: string | null; suggested: string; reason: string;
}
interface AiCurriculum { semesters: SyllabusSemester[]; changes: AiChange[]; targetRoles?: string[] }

// ── Helpers ────────────────────────────────────────────────────────────────────
const col:  React.CSSProperties = { padding: '12px 14px', fontSize: '13px', color: TEXT, borderBottom: `1px solid ${BORDER}` };
const hcol: React.CSSProperties = { padding: '10px 14px', fontSize: '11px', fontWeight: 600, color: SUB, background: BG_ROW, borderBottom: `1px solid ${BORDER}`, textAlign: 'left' as const, textTransform: 'uppercase' as const, letterSpacing: '0.04em' };

function statusBadge(s: CurriculumEntry['status']) {
  const map: Record<string, [string, string]> = {
    'Yet To Start':             ['#FEF3C7', '#D97706'],
    'AI Processing':            ['#FFF7ED', '#EA580C'],
    'AI Completed':             ['#DCFCE7', '#16A34A'],
    'Sent for BOS Approval':    ['#EEF2FF', '#3730A3'],
    'Rejected by BOS':          ['#FEE2E2', '#B91C1C'],
    'Approved by BOS':          ['#DCFCE7', '#15803D'],
    'Sent for Final Approval':  ['#F3E8FF', '#7E22CE'],
    'Rejected':                 ['#FEE2E2', '#B91C1C'],
    'Approved':                 ['#DCFCE7', '#15803D'],
  };
  const [bg, color] = map[s] ?? ['#F1F5F9', SUB];
  return <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: bg, color }}>{s}</span>;
}

// ── 3-dot ActionMenu ──────────────────────────────────────────────────────────
function ActionMenu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (!dropRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const handleOpen = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    setOpen(o => !o);
  };
  return (
    <>
      <button ref={btnRef} onClick={handleOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: SUB, display: 'flex' }}><MoreVertical size={16} /></button>
      {open && (
        <div ref={dropRef} style={{ position: 'fixed', top: pos.top, right: pos.right, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 1000, minWidth: '210px', overflow: 'hidden' }}>
          {items.map(it => (
            <button key={it.label} onClick={() => { it.onClick(); setOpen(false); }}
              style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: '13px', color: it.danger ? '#DC2626' : '#374151', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ── Excel parsers ─────────────────────────────────────────────────────────────
async function fetchWorkbook(url: string): Promise<XLSX.WorkBook | null> {
  try {
    const path = url.startsWith('/api/') ? url.slice(4) : url;
    const res = await api.get(path, { responseType: 'arraybuffer' });
    return XLSX.read(res.data, { type: 'array' });
  } catch { return null; }
}

function parseSyllabus(wb: XLSX.WorkBook): SyllabusSemester[] {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rows.length < 2) return [];

  const semesters: SyllabusSemester[] = [];
  let curSem: SyllabusSemester | null = null;
  let curSub: SyllabusSubject | null  = null;

  for (let i = 1; i < rows.length; i++) {
    const [semRaw, code, name, modNo, modName, topics, hours, objRaw, outRaw] = rows[i];
    if (!modName && !modNo) continue;

    const semName = semRaw ? `Semester ${semRaw}` : (curSem?.name ?? 'Semester 1');
    if (!curSem || curSem.name !== semName) {
      curSem = { name: semName, subjects: [] };
      semesters.push(curSem);
      curSub = null;
    }

    const subCode = String(code || '').trim();
    const subName = String(name || '').trim();
    if (subCode && subCode !== (curSub?.code ?? '')) {
      const objectives = objRaw ? String(objRaw).split('\n').map(s => s.trim()).filter(Boolean) : [];
      const outcomes   = outRaw ? String(outRaw).split('\n').map(s => s.trim()).filter(Boolean) : [];
      curSub = { code: subCode, name: subName, objectives, outcomes, modules: [] };
      curSem.subjects.push(curSub);
    }

    if (curSub) {
      curSub.modules.push({
        number: Number(modNo) || curSub.modules.length + 1,
        name:   String(modName).trim(),
        topics: String(topics || '').trim(),
        hours:  Number(hours) || 0,
        changed: false,
      });
    }
  }
  return semesters;
}

function parseCreditStructure(wb: XLSX.WorkBook): { credits: CreditRow[]; timetable: TimetableRow[] } {
  const creditSheet    = wb.Sheets['Credit Structure']    ?? wb.Sheets[wb.SheetNames[0]];
  const timetableSheet = wb.Sheets['Program Timetable']  ?? wb.Sheets[wb.SheetNames[1]];

  const creditRows: CreditRow[] = [];
  if (creditSheet) {
    const rows: any[][] = XLSX.utils.sheet_to_json(creditSheet, { header: 1, defval: '' });
    for (let i = 1; i < rows.length; i++) {
      const [sem, name, id, l, p, t, cr, t1, t2, ie, pts, hrs, wt, tot] = rows[i];
      if (!id && !name) continue;
      creditRows.push({ semester: Number(sem)||1, courseName: String(name||''), courseId: String(id||''), l: Number(l)||0, p: Number(p)||0, t: Number(t)||0, credits: Number(cr)||0, t1: Number(t1)||0, t2: Number(t2)||0, ie: Number(ie)||0, points: Number(pts)||0, timeHrs: Number(hrs)||0, weightage: Number(wt)||0, totalPoints: Number(tot)||0 });
    }
  }

  const timetableRows: TimetableRow[] = [];
  if (timetableSheet) {
    const rows: any[][] = XLSX.utils.sheet_to_json(timetableSheet, { header: 1, defval: '' });
    for (let i = 1; i < rows.length; i++) {
      const [sem, date, time, id, name, faculty] = rows[i];
      if (!id && !name) continue;
      timetableRows.push({ semester: Number(sem)||1, date: String(date||''), time: String(time||''), courseId: String(id||''), courseName: String(name||''), faculty: String(faculty||'') });
    }
  }
  return { credits: creditRows, timetable: timetableRows };
}

function parseWeeklyTimetable(wb: XLSX.WorkBook): WeeklySlot[] {
  const ws = wb.Sheets['Weekly Timetable'] ?? wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const slots: WeeklySlot[] = [];
  for (let i = 1; i < rows.length; i++) {
    const [day, start, end, code, name, faculty, room] = rows[i];
    if (!day || !start) continue;
    slots.push({ day: String(day).trim(), startTime: String(start).trim(), endTime: String(end||'').trim(), courseCode: String(code||'').trim(), courseName: String(name||'').trim(), faculty: String(faculty||'').trim(), room: String(room||'').trim() });
  }
  return slots;
}

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ── Curriculum Tree ────────────────────────────────────────────────────────────
function CurriculumTree({ semesters, selectedSub, selectedMod, onSub, onMod, aiMode }:{
  semesters: SyllabusSemester[]; selectedSub: string|null; selectedMod: string|null;
  onSub:(s:string)=>void; onMod:(s:string,m:number)=>void; aiMode?: boolean;
}) {
  const [expSems, setExpSems] = useState<string[]>(() => semesters.map(s => s.name));
  const [expSubs, setExpSubs] = useState<string[]>([]);
  useEffect(() => { if (semesters.length) { setExpSems([semesters[0].name]); if (semesters[0].subjects.length) setExpSubs([semesters[0].subjects[0].code]); } }, [semesters]);
  const togSem = (n: string) => setExpSems(e => e.includes(n) ? e.filter(x => x !== n) : [...e, n]);
  const togSub = (c: string) => setExpSubs(e => e.includes(c) ? e.filter(x => x !== c) : [...e, c]);
  return (
    <div style={{ width: '250px', flexShrink: 0, borderRight: `1px solid ${BORDER}`, overflowY: 'auto' }}>
      {semesters.map(sem => (
        <div key={sem.name}>
          <div onClick={() => togSem(sem.name)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#EEF2FF', cursor: 'pointer', marginBottom: '1px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{sem.name}</span>
            {expSems.includes(sem.name) ? <ChevronUp size={13} color={SUB} /> : <ChevronDown size={13} color={SUB} />}
          </div>
          {expSems.includes(sem.name) && sem.subjects.map(sub => (
            <div key={sub.code}>
              <div onClick={() => { togSub(sub.code); onSub(sub.code); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', cursor: 'pointer' }}>
                {expSubs.includes(sub.code) ? <ChevronUp size={12} color={PRIMARY} /> : <ChevronDown size={12} color={SUB} />}
                <span style={{ fontSize: '12px', fontWeight: 500, color: selectedSub === sub.code ? PRIMARY : '#374151' }}>
                  {`Subject ${sem.subjects.indexOf(sub)+1} - ${sub.name}`}
                </span>
              </div>
              {expSubs.includes(sub.code) && sub.modules.map(mod => (
                <div key={mod.number} onClick={() => onMod(sub.code, mod.number)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px 7px 30px', cursor: 'pointer', background: selectedMod === `${sub.code}-${mod.number}` ? '#F1F5F9' : 'transparent' }}>
                  {aiMode && mod.changed && <div style={{ width: '3px', height: '14px', background: '#E04D8A', borderRadius: '2px', flexShrink: 0 }} />}
                  <span style={{ fontSize: '12px', color: selectedMod === `${sub.code}-${mod.number}` ? PRIMARY : '#374151', fontWeight: selectedMod === `${sub.code}-${mod.number}` ? 500 : 400 }}>
                    {`Module ${mod.number} - ${mod.name}`}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
      {semesters.length === 0 && <p style={{ padding: '16px', fontSize: '13px', color: '#A3A3A3' }}>No syllabus data.</p>}
    </div>
  );
}

// ── Detail Pane ────────────────────────────────────────────────────────────────
function SubjectDetail({ sub, aiSub, change }: { sub: SyllabusSubject; aiSub?: SyllabusSubject; change?: AiChange }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: TEXT }}>{sub.name}</h3>
        <span style={{ fontSize: '12px', color: SUB, background: '#EEF2FF', padding: '3px 10px', borderRadius: '12px' }}>{sub.code}</span>
      </div>
      {aiSub ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {(['objectives','outcomes'] as const).map(key => (
            <div key={key}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '10px', textTransform: 'capitalize' }}>
                {key === 'objectives' ? 'Course Objectives' : 'Expected Course Outcome'}
              </p>
              {sub[key].map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#374151', lineHeight: 1.7, marginBottom: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#374151', flexShrink: 0, marginTop: '7px' }} />{o}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          <Section title="Course Objectives" items={sub.objectives} />
          <Section title="Expected Course Outcome" items={sub.outcomes} />
        </>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: 700, color: TEXT, marginBottom: '10px' }}>{title}</h4>
      {items.length === 0 ? <p style={{ fontSize: '13px', color: '#A3A3A3' }}>None specified.</p> :
        items.map((o, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#374151', lineHeight: 1.7, marginBottom: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#374151', flexShrink: 0, marginTop: '7px' }} />{o}
          </div>
        ))
      }
    </div>
  );
}

function ModuleDetail({ mod, aiMod, change }: { mod: SyllabusModule; aiMod?: SyllabusModule; change?: AiChange }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: TEXT }}>Module {mod.number} – {mod.name}</h3>
        {mod.hours > 0 && <span style={{ fontSize: '12px', color: SUB }}>{mod.hours} hrs</span>}
      </div>
      {aiMod ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '8px' }}>Current Topics</p>
            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{mod.topics || '—'}</p>
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '8px' }}>AI Recommended Topics</p>
            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{aiMod.topics || mod.topics}</p>
            {aiMod.changed && change && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '8px' }}>Why AI Suggested The Change?</p>
                <div style={{ background: '#EEF2FF', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{change.reason}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '8px' }}>Topics Covered</p>
          <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{mod.topics || 'No topics listed.'}</p>
        </>
      )}
    </div>
  );
}

// ── Monthly Calendar ──────────────────────────────────────────────────────────
function MonthlyCalendar({ slots }: { slots: WeeklySlot[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const totalDays = lastDay.getDate();

  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const slotsForDay = (d: number) => {
    const dow = (new Date(year, month, d).getDay() + 6) % 7;
    const dayName = DAYS[dow];
    return slots.filter(s => s.day.toLowerCase() === dayName.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        <button onClick={() => setCurrentDate(new Date())} style={{ border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', padding: '5px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: TEXT }}>
          📍 Today
        </button>
        <span style={{ fontWeight: 700, fontSize: '16px', color: TEXT }}>{monthName}</span>
        <span style={{ fontSize: '13px', color: SUB }}>{currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button onClick={prev} style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', background: '#fff', padding: '5px 8px', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={14} /></button>
          <button onClick={next} style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', background: '#fff', padding: '5px 8px', cursor: 'pointer', display: 'flex' }}><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '0', marginBottom: '2px' }}>
        {SHORT.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: SUB, padding: '6px 0' }}>{d}</div>)}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: '1fr', gap: '1px', background: BORDER, overflow: 'auto' }}>
        {cells.map((d, i) => {
          const daySlots = d ? slotsForDay(d) : [];
          return (
            <div key={i} style={{ background: d && isToday(d) ? '#EEF2FF' : '#fff', minHeight: '80px', padding: '4px', position: 'relative', border: d && isToday(d) ? `2px solid ${PRIMARY}` : 'none' }}>
              {d && (
                <>
                  <span style={{ fontSize: '12px', fontWeight: d && isToday(d) ? 700 : 400, color: d && isToday(d) ? PRIMARY : TEXT }}>{d}</span>
                  {daySlots.slice(0, 2).map((s, si) => (
                    <div key={si} style={{ background: '#EEF2FF', borderRadius: '3px', padding: '2px 4px', marginTop: '2px', fontSize: '10px', color: PRIMARY, lineHeight: 1.3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {s.startTime} {s.courseName.split(' ').slice(0, 2).join(' ').toUpperCase()}
                    </div>
                  ))}
                  {daySlots.length > 2 && <div style={{ fontSize: '10px', color: SUB, marginTop: '2px' }}>+{daySlots.length - 2}</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
      {slots.length === 0 && <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: '13px', marginTop: '16px' }}>No timetable data. Upload the Program Calendar Excel to view the schedule.</p>}
    </div>
  );
}

// ── Credit Score Table ────────────────────────────────────────────────────────
function CreditScoreTab({ credits, timetable }: { credits: CreditRow[]; timetable: TimetableRow[] }) {
  if (credits.length === 0) return <p style={{ padding: '24px', color: '#A3A3A3', fontSize: '13px' }}>No credit structure data. Upload the Credit Structure Excel to view this tab.</p>;
  const semesters = [...new Set(credits.map(c => c.semester))].sort();
  return (
    <div style={{ padding: '16px', overflowY: 'auto', height: '100%' }}>
      {semesters.map(sem => (
        <div key={sem} style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '10px' }}>Semester {sem}</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${BORDER}` }}>
              <thead>
                <tr style={{ background: BG_ROW }}>
                  <th rowSpan={2} style={{ ...hcol, borderRight: `1px solid ${BORDER}` }}>Name Of Course</th>
                  <th rowSpan={2} style={{ ...hcol, borderRight: `1px solid ${BORDER}` }}>Course Id</th>
                  <th colSpan={3} style={{ ...hcol, borderRight: `1px solid ${BORDER}`, textAlign: 'center' }}>Course Plan Per Week (Hrs)</th>
                  <th rowSpan={2} style={{ ...hcol, borderRight: `1px solid ${BORDER}`, textAlign: 'center' }}>Credits</th>
                  <th colSpan={3} style={{ ...hcol, borderRight: `1px solid ${BORDER}`, textAlign: 'center' }}>In Semester Evaluation (Points)</th>
                  <th colSpan={2} style={{ ...hcol, borderRight: `1px solid ${BORDER}`, textAlign: 'center' }}>End Semester Evaluation (Points)</th>
                  <th rowSpan={2} style={{ ...hcol, borderRight: `1px solid ${BORDER}`, textAlign: 'center' }}>End Semester Weightage (%)</th>
                  <th rowSpan={2} style={{ ...hcol, textAlign: 'center' }}>Total Points</th>
                </tr>
                <tr style={{ background: BG_ROW }}>
                  {['L','P','T'].map(h => <th key={h} style={{ ...hcol, borderRight: `1px solid ${BORDER}`, textAlign: 'center', padding: '6px 10px' }}>{h}</th>)}
                  {['T-1','T-2','IE'].map(h => <th key={h} style={{ ...hcol, borderRight: `1px solid ${BORDER}`, textAlign: 'center', padding: '6px 10px' }}>{h}</th>)}
                  {['Points','Time (Hrs)'].map(h => <th key={h} style={{ ...hcol, borderRight: `1px solid ${BORDER}`, textAlign: 'center', padding: '6px 10px' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {credits.filter(c => c.semester === sem).map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ ...col, borderRight: `1px solid ${BORDER}`, fontWeight: 500 }}>{c.courseName}</td>
                    <td style={{ ...col, borderRight: `1px solid ${BORDER}`, color: SUB }}>{c.courseId}</td>
                    {[c.l, c.p, c.t].map((v, vi) => <td key={vi} style={{ ...col, borderRight: `1px solid ${BORDER}`, textAlign: 'center' }}>{v}</td>)}
                    <td style={{ ...col, borderRight: `1px solid ${BORDER}`, textAlign: 'center', fontWeight: 600 }}>{c.credits}</td>
                    {[c.t1, c.t2, c.ie].map((v, vi) => <td key={vi} style={{ ...col, borderRight: `1px solid ${BORDER}`, textAlign: 'center' }}>{v}</td>)}
                    {[c.points, c.timeHrs].map((v, vi) => <td key={vi} style={{ ...col, borderRight: `1px solid ${BORDER}`, textAlign: 'center' }}>{v}</td>)}
                    <td style={{ ...col, borderRight: `1px solid ${BORDER}`, textAlign: 'center' }}>{c.weightage}</td>
                    <td style={{ ...col, textAlign: 'center', fontWeight: 600 }}>{c.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {timetable.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '10px' }}>Program Timetable</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${BORDER}` }}>
            <thead>
              <tr style={{ background: BG_ROW }}>
                {['Semester','Date','Time','Course Id','Name Of Course','Faculty'].map(h => <th key={h} style={hcol}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {timetable.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={col}>{r.semester}</td>
                  <td style={col}>{r.date}</td>
                  <td style={col}>{r.time}</td>
                  <td style={{ ...col, color: SUB }}>{r.courseId}</td>
                  <td style={{ ...col, fontWeight: 500 }}>{r.courseName}</td>
                  <td style={col}>{r.faculty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Recommended side-by-side view ─────────────────────────────────────────────
function RecommendedView({ current, ai, onBack, onSendApproval }: {
  current: SyllabusSemester[]; ai: AiCurriculum; onBack: ()=>void; onSendApproval: ()=>void;
}) {
  const [expandMode, setExpandMode] = useState<'changes'|'all'>('changes');
  // track which subjects and modules are open: key = "semName|subCode" or "semName|subCode|modNum"
  const [openSubs, setOpenSubs] = useState<Set<string>>(new Set());
  const [openMods, setOpenMods] = useState<Set<string>>(new Set());

  const totalChanges = ai.changes?.length ?? 0;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const allSemNames = Array.from(new Set([
    ...current.map(s => s.name),
    ...ai.semesters.map(s => s.name),
  ]));

  // Recompute open sets whenever expandMode changes
  useEffect(() => {
    const newSubs = new Set<string>();
    const newMods = new Set<string>();
    allSemNames.forEach(semName => {
      const currSem = current.find(s => s.name === semName);
      const aiSem   = ai.semesters.find(s => s.name === semName);
      const subPairs = buildSubPairs(currSem, aiSem);
      subPairs.forEach(({ currSub, aiSub }) => {
        const code = currSub?.code ?? aiSub?.code ?? '';
        const subKey = `${semName}|${code}`;
        const hasChange = !!ai.changes?.find(c => c.semester === semName && c.subjectCode === code);
        if (expandMode === 'all' || hasChange) newSubs.add(subKey);
        const allMods = Array.from(new Set([
          ...(currSub?.modules.map(m => m.number) ?? []),
          ...(aiSub?.modules.map(m => m.number) ?? []),
        ]));
        allMods.forEach(mNum => {
          const aiMod = aiSub?.modules.find(m => m.number === mNum);
          const modKey = `${semName}|${code}|${mNum}`;
          if (expandMode === 'all' || aiMod?.changed) newMods.add(modKey);
        });
      });
    });
    setOpenSubs(newSubs);
    setOpenMods(newMods);
  }, [expandMode, ai, current]); // eslint-disable-line

  function buildSubPairs(currSem: SyllabusSemester | undefined, aiSem: SyllabusSemester | undefined) {
    type SubPair = { key: string; currSub: SyllabusSubject | undefined; aiSub: SyllabusSubject | undefined };
    const pairs: SubPair[] = [];
    const usedAiCodes = new Set<string>();
    for (const cs of currSem?.subjects ?? []) {
      let matched = aiSem?.subjects.find(a => a.code === cs.code);
      if (!matched) matched = aiSem?.subjects.find(a => norm(a.name) === norm(cs.name));
      pairs.push({ key: cs.code, currSub: cs, aiSub: matched });
      if (matched) usedAiCodes.add(matched.code);
    }
    for (const as of aiSem?.subjects ?? []) {
      if (!usedAiCodes.has(as.code)) pairs.push({ key: 'ai-' + as.code, currSub: undefined, aiSub: as });
    }
    return pairs;
  }

  function toggleSub(key: string) {
    setOpenSubs(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  }
  function toggleMod(key: string) {
    setOpenMods(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  }

  function renderBullets(items: string[]) {
    return items.map((o, i) => (
      <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#374151', lineHeight: 1.7, marginBottom: '4px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#374151', flexShrink: 0, marginTop: '8px' }} />{o}
      </div>
    ));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Curriculum tab */}
      <div style={{ padding: '0 24px', borderBottom: `1px solid ${BORDER}`, background: '#fff', display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0 }}>
        <button style={{ paddingBottom: '12px', paddingTop: '12px', fontSize: '14px', fontWeight: 600, color: PRIMARY, background: 'none', border: 'none', borderBottom: `2px solid ${PRIMARY}`, cursor: 'pointer' }}>Curriculum</button>
        <button style={{ paddingBottom: '12px', paddingTop: '12px', fontSize: '14px', fontWeight: 500, color: SUB, background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer' }}>Credit Score</button>
      </div>

      {/* Target roles banner */}
      {ai.targetRoles && ai.targetRoles.length > 0 && (
        <div style={{ padding: '10px 24px', background: '#EEF2FF', borderBottom: `1px solid #C7D2FE`, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: PRIMARY, whiteSpace: 'nowrap' }}>🎯 Optimised for:</span>
          {ai.targetRoles.map(role => (
            <span key={role} style={{ padding: '3px 10px', borderRadius: '100px', background: '#fff', border: `1px solid #C7D2FE`, fontSize: '11px', fontWeight: 600, color: PRIMARY }}>{role}</span>
          ))}
        </div>
      )}

      {/* Expand controls */}
      <div style={{ padding: '12px 24px', background: '#fff', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', border: `1px solid ${PRIMARY}`, borderRadius: '20px', overflow: 'hidden' }}>
          {(['changes','all'] as const).map(m => (
            <button key={m} onClick={() => setExpandMode(m)}
              style={{ padding: '6px 18px', fontSize: '13px', fontWeight: 500, background: expandMode === m ? 'transparent' : '#fff', color: PRIMARY, border: 'none', cursor: 'pointer', outline: expandMode === m ? `2px solid ${PRIMARY}` : 'none', borderRadius: '20px' }}>
              {m === 'changes' ? 'Expand Only Changes' : 'Expand All'}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: TEXT }}>Recommendation ({totalChanges})</span>
          <button onClick={() => setExpandMode('all')} style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', background: '#fff', padding: '4px 7px', cursor: 'pointer', display: 'flex' }}><ChevronDown size={13} /></button>
          <button onClick={() => setExpandMode('changes')} style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', background: '#fff', padding: '4px 7px', cursor: 'pointer', display: 'flex' }}><ChevronUp size={13} /></button>
        </div>
      </div>

      {/* Column labels */}
      <div style={{ display: 'flex', background: '#fff', flexShrink: 0 }}>
        <div style={{ flex: 1, padding: '10px 20px', borderRight: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, margin: 0 }}>Current</h3>
        </div>
        <div style={{ flex: 1, padding: '10px 20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, margin: 0 }}>AI Recommended</h3>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {allSemNames.map(semName => {
          const currSem = current.find(s => s.name === semName);
          const aiSem   = ai.semesters.find(s => s.name === semName);
          const subPairs = buildSubPairs(currSem, aiSem);

          return (
            <div key={semName}>
              {/* Semester row */}
              <div style={{ display: 'flex', background: '#F1F5F9', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
                {[0,1].map(col => (
                  <div key={col} style={{ flex: 1, padding: '10px 20px', borderRight: col === 0 ? `1px solid ${BORDER}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: TEXT }}>{semName}</span>
                    <ChevronUp size={16} color={SUB} />
                  </div>
                ))}
              </div>

              {subPairs.map(({ key: subKey, currSub, aiSub }) => {
                const subCode  = currSub?.code ?? aiSub?.code ?? subKey;
                const openKey  = `${semName}|${subCode}`;
                const isSubOpen = openSubs.has(openKey);

                const allModNums = Array.from(new Set([
                  ...(currSub?.modules.map(m => m.number) ?? []),
                  ...(aiSub?.modules.map(m => m.number) ?? []),
                ])).sort((a, b) => a - b);

                const subIdx = (subPairs.findIndex(p => p.key === subKey)) + 1;

                return (
                  <div key={subKey} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {/* Subject header — clickable, full width paired */}
                    <div style={{ display: 'flex', background: '#F8F9FF', cursor: 'pointer' }} onClick={() => toggleSub(openKey)}>
                      <div style={{ flex: 1, padding: '10px 20px', borderRight: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>
                          Subject {subIdx} - {currSub?.name ?? '—'}
                        </span>
                        {isSubOpen ? <ChevronUp size={16} color={PRIMARY} /> : <ChevronDown size={16} color={PRIMARY} />}
                      </div>
                      <div style={{ flex: 1, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>
                          Subject {subIdx} - {aiSub?.name ?? currSub?.name ?? '—'}
                        </span>
                        {isSubOpen ? <ChevronUp size={16} color={PRIMARY} /> : <ChevronDown size={16} color={PRIMARY} />}
                      </div>
                    </div>

                    {isSubOpen && (
                      <>
                        {/* Objectives + Outcomes */}
                        <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, background: '#fff' }}>
                          {/* Current objectives */}
                          <div style={{ flex: 1, padding: '16px 20px', borderRight: `1px solid ${BORDER}` }}>
                            {currSub ? (
                              <>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 10px' }}>Course Objectives</p>
                                {renderBullets(currSub.objectives)}
                                <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '14px 0 10px' }}>Expected Course Outcome</p>
                                {renderBullets(currSub.outcomes)}
                              </>
                            ) : <div style={{ height: '80px', background: '#F8FAFC', borderRadius: '8px', border: `1px dashed ${BORDER}` }} />}
                          </div>
                          {/* AI objectives */}
                          <div style={{ flex: 1, padding: '16px 20px' }}>
                            {aiSub ? (
                              <>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 10px' }}>Course Objectives</p>
                                {renderBullets(aiSub.objectives)}
                                <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '14px 0 10px' }}>Expected Course Outcome</p>
                                {renderBullets(aiSub.outcomes)}
                                {/* Skills add-on */}
                                {aiSub.skills && aiSub.skills.length > 0 && (
                                  <div style={{ marginTop: '14px', padding: '12px 14px', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#15803D', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💡 Skills students will gain</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                      {aiSub.skills.map(sk => <span key={sk} style={{ padding: '3px 10px', borderRadius: '100px', background: '#fff', border: '1px solid #BBF7D0', fontSize: '12px', fontWeight: 500, color: '#166534' }}>{sk}</span>)}
                                    </div>
                                  </div>
                                )}
                                {/* Roles add-on */}
                                {aiSub.relevantRoles && aiSub.relevantRoles.length > 0 && (
                                  <div style={{ marginTop: '10px', padding: '12px 14px', background: '#EEF2FF', borderRadius: '10px', border: '1px solid #C7D2FE' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: PRIMARY, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 Helps land these roles</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                      {aiSub.relevantRoles.map(role => <span key={role} style={{ padding: '3px 10px', borderRadius: '100px', background: '#fff', border: '1px solid #C7D2FE', fontSize: '12px', fontWeight: 500, color: PRIMARY }}>{role}</span>)}
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : <div style={{ height: '80px', background: '#F8FAFC', borderRadius: '8px', border: `1px dashed ${BORDER}` }} />}
                          </div>
                        </div>

                        {/* Module rows */}
                        {allModNums.map(mNum => {
                          const currMod = currSub?.modules.find(m => m.number === mNum);
                          const aiMod   = aiSub?.modules.find(m => m.number === mNum);
                          const modKey  = `${semName}|${subCode}|${mNum}`;
                          const isModOpen = openMods.has(modKey);
                          const modChange = ai.changes?.find(c =>
                            c.subjectCode === subCode && c.semester === semName &&
                            (
                              (typeof c.suggested === 'string' && c.suggested.includes(aiMod?.name ?? '~~')) ||
                              (typeof c.original === 'string' && c.original.includes(currMod?.name ?? '~~'))
                            )
                          );

                          const isRemoved  = aiMod?.removed === true;
                          const isNewMod   = !currMod && !!aiMod;
                          const isChanged  = !!aiMod?.changed && !isRemoved;
                          const priority   = aiMod?.priority;

                          // Header styling for AI side
                          const aiBg     = isRemoved ? '#FEF2F2' : isNewMod ? '#F0FDF4' : isChanged ? (priority === 'must_have' ? '#F0FDF4' : priority === 'good_to_have' ? '#FFFBEB' : '#FFF7ED') : '#F8F9FF';
                          const aiColor  = isRemoved ? '#B91C1C' : isNewMod ? '#15803D' : isChanged ? '#EA580C' : TEXT;

                          return (
                            <div key={mNum} style={{ borderTop: `1px solid ${BORDER}` }}>
                              {/* Module header row — both columns clickable together */}
                              <div style={{ display: 'flex', cursor: 'pointer' }} onClick={() => toggleMod(modKey)}>
                                {/* Current module header */}
                                <div style={{ flex: 1, padding: '10px 20px', background: '#F8F9FF', borderRight: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  {currMod ? (
                                    <>
                                      <span style={{ fontSize: '13px', fontWeight: 500, color: TEXT }}>{`Module ${currMod.number} - ${currMod.name}`}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {currMod.hours > 0 && <span style={{ fontSize: '12px', color: SUB }}>{currMod.hours} Hours</span>}
                                        {isModOpen ? <ChevronUp size={14} color={SUB} /> : <ChevronDown size={14} color={SUB} />}
                                      </div>
                                    </>
                                  ) : (
                                    /* blank current side for new AI module */
                                    <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>—</span>
                                  )}
                                </div>
                                {/* AI module header */}
                                <div style={{ flex: 1, padding: '10px 20px', background: aiBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  {aiMod ? (
                                    <>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 500, color: aiColor, textDecoration: isRemoved ? 'line-through' : 'none' }}>
                                          {`Module ${aiMod.number} - ${aiMod.name}`}
                                        </span>
                                        {isRemoved && <span style={{ padding: '2px 8px', borderRadius: '100px', background: '#FEE2E2', color: '#DC2626', fontSize: '10px', fontWeight: 700 }}>🔴 REMOVE</span>}
                                        {!isRemoved && priority === 'must_have'    && <span style={{ padding: '2px 8px', borderRadius: '100px', background: '#DCFCE7', color: '#15803D', fontSize: '10px', fontWeight: 700 }}>🟢 MUST HAVE</span>}
                                        {!isRemoved && priority === 'good_to_have' && <span style={{ padding: '2px 8px', borderRadius: '100px', background: '#FEF3C7', color: '#92400E', fontSize: '10px', fontWeight: 700 }}>🟡 GOOD TO HAVE</span>}
                                        {isNewMod && <span style={{ padding: '2px 8px', borderRadius: '100px', background: '#DCFCE7', color: '#15803D', fontSize: '10px', fontWeight: 700 }}>➕ NEW</span>}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                        {aiMod.hours > 0 && <span style={{ fontSize: '12px', color: isChanged ? '#EA580C' : SUB, fontWeight: isChanged ? 700 : 400 }}>{aiMod.hours} Hours</span>}
                                        {isModOpen ? <ChevronUp size={14} color={SUB} /> : <ChevronDown size={14} color={SUB} />}
                                      </div>
                                    </>
                                  ) : (
                                    /* Module exists in current but removed by AI */
                                    <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>Removed in AI recommendation</span>
                                  )}
                                </div>
                              </div>

                              {/* Module content — shown when expanded */}
                              {isModOpen && (
                                <div style={{ display: 'flex', background: '#fff', borderTop: `1px solid ${BORDER}` }}>
                                  {/* Current topics */}
                                  <div style={{ flex: 1, padding: '14px 20px', borderRight: `1px solid ${BORDER}` }}>
                                    {currMod?.topics
                                      ? <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.8, margin: 0 }}>{currMod.topics}</p>
                                      : <p style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>No topics listed.</p>
                                    }
                                  </div>
                                  {/* AI topics + why changed */}
                                  <div style={{ flex: 1, padding: '14px 20px' }}>
                                    {aiMod ? (
                                      <>
                                        {isRemoved ? (
                                          /* Removed module — show original topics crossed out */
                                          <>
                                            <p style={{ fontSize: '13px', color: '#DC2626', lineHeight: 1.8, margin: '0 0 12px', textDecoration: 'line-through', opacity: 0.7 }}>{aiMod.topics || currMod?.topics}</p>
                                            {modChange?.reason && (
                                              <>
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Why AI Suggested The Change?</p>
                                                <div style={{ background: '#EEF2FF', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{modChange.reason}</div>
                                              </>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            {/* Topics: original text + new highlighted additions */}
                                            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.8, margin: '0 0 12px' }}>
                                              {aiMod.topics || currMod?.topics || 'No topics listed.'}
                                              {isChanged && modChange?.suggested && typeof modChange.suggested === 'string' && !aiMod.topics?.includes(modChange.suggested) && (
                                                <span style={{ color: '#EA580C', fontWeight: 500 }}> {modChange.suggested}</span>
                                              )}
                                            </p>
                                            {/* Why AI changed */}
                                            {(isChanged || isNewMod) && modChange?.reason && (
                                              <>
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Why AI Suggested The Change?</p>
                                                <div style={{ background: '#EEF2FF', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{modChange.reason}</div>
                                              </>
                                            )}
                                            {/* Skills on module level */}
                                            {(isChanged || isNewMod) && aiMod.skills && aiMod.skills.length > 0 && (
                                              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803D' }}>Skills:</span>
                                                {aiMod.skills.map(s => <span key={s} style={{ padding: '3px 10px', borderRadius: '100px', background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: '12px', color: '#166534' }}>{s}</span>)}
                                              </div>
                                            )}
                                            {/* Roles on module level */}
                                            {(isChanged || isNewMod) && aiMod.relevantRoles && aiMod.relevantRoles.length > 0 && (
                                              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: PRIMARY }}>Jobs:</span>
                                                {aiMod.relevantRoles.map(r => <span key={r} style={{ padding: '3px 10px', borderRadius: '100px', background: '#EEF2FF', border: '1px solid #C7D2FE', fontSize: '12px', color: PRIMARY }}>{r}</span>)}
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      /* module present in current, removed by AI */
                                      <div style={{ background: '#FEF2F2', borderRadius: '8px', padding: '12px 14px' }}>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626', margin: '0 0 6px' }}>AI recommends removing this module</p>
                                        {modChange?.reason && <p style={{ fontSize: '13px', color: '#7F1D1D', lineHeight: 1.7, margin: 0 }}>{modChange.reason}</p>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 24px', borderTop: `1px solid ${BORDER}`, background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
        <button onClick={onBack} style={{ border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', padding: '10px 28px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: TEXT }}>Back</button>
        <button onClick={onSendApproval} style={{ border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', padding: '10px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Send For Approval</button>
      </div>
    </div>
  );
}

// ── Version History Panel ─────────────────────────────────────────────────────
function VersionHistoryPanel({ programId, programName, onClose, onViewVersion }: {
  programId: number; programName: string;
  onClose: () => void;
  onViewVersion: (v: VersionEntry) => void;
}) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get(`/institute/curriculum/versions/${programId}`)
      .then(r => {
        const data: any[] = r.data?.data ?? [];
        setVersions(data.map(v => ({
          id:        v.id,
          version:   v.version ?? 1,
          status:    v.status ?? 'YET_TO_START',
          createdAt: v.createdAt ?? '',
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [programId]);

  const statusLabel = (s: string) => {
    if (s === 'YET_TO_START')  return ['Yet To Start',  '#FEF3C7', '#D97706'];
    if (s === 'AI_PROCESSING') return ['AI Processing', '#FFF7ED', '#EA580C'];
    if (s === 'AI_COMPLETED')  return ['AI Completed',  '#DCFCE7', '#16A34A'];
    return ['Unknown', '#F1F5F9', SUB];
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.35)' }} />

      {/* Side drawer */}
      <div style={{ width: '380px', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: TEXT }}>Version History</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: SUB, lineHeight: 1 }}>✕</button>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: SUB }}>{programName}</p>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', marginTop: '32px' }}>Loading…</p>
          ) : versions.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', marginTop: '32px' }}>No versions found.</p>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Timeline line */}
              <div style={{ position: 'absolute', left: '19px', top: '20px', bottom: '20px', width: '2px', background: BORDER }} />

              {versions.map((v, i) => {
                const [label, bg, color] = statusLabel(v.status);
                const date = v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                const time = v.createdAt ? new Date(v.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
                const isLatest = i === 0;
                return (
                  <div key={v.id} style={{ display: 'flex', gap: '16px', marginBottom: '20px', position: 'relative' }}>
                    {/* Circle */}
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isLatest ? PRIMARY : '#EEF2FF', border: `2px solid ${isLatest ? PRIMARY : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: isLatest ? '#fff' : PRIMARY }}>v{v.version}</span>
                    </div>

                    {/* Card */}
                    <div style={{ flex: 1, border: `1px solid ${isLatest ? PRIMARY : BORDER}`, borderRadius: '8px', padding: '12px 14px', background: isLatest ? '#F8F9FF' : '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>Version {v.version}</span>
                          {isLatest && <span style={{ fontSize: '10px', fontWeight: 600, background: PRIMARY, color: '#fff', padding: '2px 7px', borderRadius: '8px' }}>LATEST</span>}
                        </div>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: bg, color }}>{label}</span>
                      </div>
                      <p style={{ margin: '0 0 10px', fontSize: '12px', color: SUB }}>{date}{time ? ` · ${time}` : ''}</p>
                      <button onClick={() => onViewVersion(v)}
                        style={{ fontSize: '12px', fontWeight: 600, color: PRIMARY, background: '#EEF2FF', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', width: '100%' }}>
                        View This Version
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type PageView = 'list' | 'detail' | 'recommended';

export default function CurriculumPage() {
  const location = useLocation();
  const navigate  = useNavigate();

  // list state
  const [tab,          setTab]          = useState<'current'|'upcoming'>('current');
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilter,   setShowFilter]   = useState(false);
  const [entries, setEntries] = useState<CurriculumEntry[]>([]);

  // detail state
  const [pageView,      setPageView]      = useState<PageView>('list');
  const [program,       setProgram]       = useState<Program | null>(null);
  const [currTab,       setCurrTab]       = useState<'curriculum'|'timetable'|'creditscore'>('curriculum');
  const [selectedSub,   setSelectedSub]   = useState<string|null>(null);
  const [selectedMod,   setSelectedMod]   = useState<string|null>(null);
  const [semesters,     setSemesters]     = useState<SyllabusSemester[]>([]);
  const [creditData,    setCreditData]    = useState<{ credits: CreditRow[]; timetable: TimetableRow[] } | null>(null);
  const [weeklySlots,   setWeeklySlots]   = useState<WeeklySlot[]>([]);
  const [loadingData,   setLoadingData]   = useState(false);

  // AI state
  const [isGenerating,  setIsGenerating]  = useState(false);
  const [showAiModal,       setShowAiModal]       = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [aiCurriculum,  setAiCurriculum]  = useState<AiCurriculum | null>(null);
  const [aiError,       setAiError]       = useState('');

  // version history panel
  const [versionPanelEntry, setVersionPanelEntry] = useState<CurriculumEntry | null>(null);

  // workbook cache — avoids re-downloading the same Excel file
  const wbCache = useRef<Map<string, XLSX.WorkBook>>(new Map());

  // pre-loaded programs list (for file URLs)
  const [programs, setPrograms] = useState<Program[]>([]);

  // approval type selection modal
  const [showApprovalTypeModal, setShowApprovalTypeModal] = useState(false);
  const [selectedApprovalType, setSelectedApprovalType] = useState<'ORIGINAL' | 'AI_GENERATED'>('ORIGINAL');

  // ── Load list ──────────────────────────────────────────────────────────────
  const loadEntries = useCallback(() => {
    api.get('/institute/curriculum')
      .then(r => {
        const content: any[] = r.data?.data?.content ?? r.data?.data ?? [];
        setEntries(content.map((c: any) => ({
          id:           c.id,
          programId:    c.programId,
          programId_:   c.programId_ ?? 'UG-' + c.id,
          degree:       c.degree ?? '',
          name:         c.programName ?? c.name ?? '',
          major:        c.major ?? '',
          duration:     c.duration ?? 4,
          academicYear: c.academicYear ?? '',
          version:      c.version ?? 1,
          lastUpdated:      c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
          status:           mapStatus(c.status),
          rejectionRemarks: c.rejectionRemarks ?? '',
        })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadEntries();
    api.get('/institute/programs', { params: { size: 100 } })
      .then(r => setPrograms(r.data?.data?.content ?? r.data?.data ?? []))
      .catch(() => {});
  }, [loadEntries]);

  // ── Navigate from ProgramsPage Done ───────────────────────────────────────
  useEffect(() => {
    const state = location.state as { program?: Program } | null;
    if (state?.program) {
      openDetail(state.program);
      window.history.replaceState({}, '');
    }
  }, []);

  function mapStatus(s: string): CurriculumEntry['status'] {
    if (s === 'YET_TO_START')               return 'Yet To Start';
    if (s === 'AI_PROCESSING')              return 'AI Processing';
    if (s === 'AI_COMPLETED')               return 'AI Completed';
    if (s === 'SENT_FOR_BOS_APPROVAL')      return 'Sent for BOS Approval';
    if (s === 'REJECTED_BY_BOS')            return 'Rejected by BOS';
    if (s === 'APPROVED_BY_BOS')            return 'Approved by BOS';
    if (s === 'SENT_FOR_VERIFIER_APPROVAL') return 'Sent for Final Approval';
    if (s === 'REJECTED_BY_VERIFIER')       return 'Rejected';
    if (s === 'APPROVED')                   return 'Approved';
    return 'Yet To Start';
  }

  const cachedFetchWorkbook = async (url: string): Promise<XLSX.WorkBook | null> => {
    if (wbCache.current.has(url)) return wbCache.current.get(url)!;
    const wb = await fetchWorkbook(url);
    if (wb) wbCache.current.set(url, wb);
    return wb;
  };

  // ── Open detail view for a program ────────────────────────────────────────
  async function openDetail(prog: Program) {
    // Always fetch the full program from API to ensure syllabusUrl is populated
    let fullProg = programs.find(p => p.id === prog.id) ?? prog;
    if (!fullProg.syllabusUrl) {
      try {
        const r = await api.get(`/institute/programs/${prog.id}`);
        const fetched = r.data?.data ?? r.data;
        if (fetched?.id) fullProg = fetched;
      } catch { /* fallback to existing */ }
    }
    setProgram(fullProg);
    setPageView('detail');
    setCurrTab('curriculum');
    setSelectedSub(null);
    setSelectedMod(null);
    setSemesters([]);
    setCreditData(null);
    setWeeklySlots([]);
    setAiCurriculum(null);
    setLoadingData(true);

    try {
      const entry = entries.find(e => e.programId === fullProg.id);
      const [syllWb, creditWb, calWb, currRes] = await Promise.all([
        fullProg.syllabusUrl        ? cachedFetchWorkbook(fullProg.syllabusUrl)        : Promise.resolve(null),
        fullProg.creditStructureUrl ? cachedFetchWorkbook(fullProg.creditStructureUrl) : Promise.resolve(null),
        fullProg.calendarUrl        ? cachedFetchWorkbook(fullProg.calendarUrl)        : Promise.resolve(null),
        entry ? api.get(`/institute/curriculum/entry/${entry.id}`).catch(() => null) : Promise.resolve(null),
      ]);

      if (syllWb)   setSemesters(parseSyllabus(syllWb));
      if (creditWb) setCreditData(parseCreditStructure(creditWb));
      if (calWb)    setWeeklySlots(parseWeeklyTimetable(calWb));

      // Restore AI curriculum if it was previously generated
      const curriculumJson = currRes?.data?.data?.curriculumJson;
      if (curriculumJson) {
        try {
          const parsed = JSON.parse(curriculumJson);
          if (parsed.semesters) setAiCurriculum({ semesters: parsed.semesters, changes: parsed.changes ?? [], targetRoles: parsed.targetRoles ?? [] });
        } catch {}
      }
    } finally {
      setLoadingData(false);
    }
  }

  // ── Generate AI curriculum ─────────────────────────────────────────────────
  async function handleGenAI() {
    if (!program) return;
    setIsGenerating(true);
    setShowAiModal(true);
    setAiError('');
    try {
      const res = await api.post(`/institute/programs/${program.id}/generate-curriculum`, { semesters });
      const data = res.data?.data;
      setAiCurriculum({ semesters: data.semesters ?? [], changes: data.changes ?? [], targetRoles: data.targetRoles ?? [] });
      // Update entry status in list
      setEntries(prev => prev.map(e => e.programId === program.id ? { ...e, status: 'AI Completed' } : e));
    } catch (e: any) {
      setAiError(e?.response?.data?.message ?? 'AI generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Derived selection ──────────────────────────────────────────────────────
  const curSub = selectedSub ? semesters.flatMap(s => s.subjects).find(s => s.code === selectedSub) ?? null : null;
  const curMod = selectedMod && curSub ? (() => { const [, n] = selectedMod.split('-'); return curSub.modules.find(m => m.number === Number(n)) ?? null; })() : null;

  const currentAcademicYear = (() => {
    const now = new Date();
    const y = now.getFullYear();
    // Academic year starts in July; if before July we're in previous year's cycle
    const startYear = now.getMonth() >= 6 ? y : y - 1;
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
  })();

  const display = entries.filter(e =>
    (tab === 'current' ? e.academicYear <= currentAcademicYear : e.academicYear > currentAcademicYear) &&
    (e.name.toLowerCase().includes(search.toLowerCase()) || e.major.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || e.status === statusFilter)
  );

  const handleCurriculumExport = () => {
    downloadCSV('curriculum.csv',
      ['Program ID', 'Degree', 'Name', 'Major', 'Duration', 'Academic Year', 'Version', 'Status'],
      display.map(e => [e.programId_ ?? '', e.degree, e.name, e.major, e.duration, e.academicYear, e.version ?? '', e.status ?? ''])
    );
  };

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (pageView === 'list') return (
    <div style={{ padding: '20px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
        <span>Program Management</span><span>›</span><span style={{ color: TEXT, fontWeight: 500 }}>Curriculum Management</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '32px', borderBottom: `2px solid ${BORDER}`, marginBottom: '20px' }}>
        {[{ key:'current', label:'Current Curriculum' }, { key:'upcoming', label:'Upcoming Curriculum' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ paddingBottom: '12px', fontSize: '14px', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? PRIMARY : SUB, background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? PRIMARY : 'transparent'}`, marginBottom: '-2px', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
              style={{ padding: '8px 12px 8px 30px', border: `1px solid ${BORDER}`, borderRadius: '20px', fontSize: '13px', outline: 'none', width: '200px' }} />
          </div>
          <button onClick={handleCurriculumExport} style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', padding: '8px 10px', cursor: 'pointer', color: SUB, display: 'flex', alignItems: 'center' }}><Download size={14} /></button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowFilter(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${showFilter || statusFilter ? PRIMARY : BORDER}`, borderRadius: '8px', background: showFilter || statusFilter ? '#EEF2FF' : '#fff', padding: '8px 14px', fontSize: '13px', color: showFilter || statusFilter ? PRIMARY : SUB, cursor: 'pointer' }}>
              <Filter size={13} /> Filter {statusFilter && `(${statusFilter.replace(/_/g,' ')})`}
            </button>
            {showFilter && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '12px', minWidth: '220px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: SUB, textTransform: 'uppercase', margin: '0 0 8px' }}>Status</p>
                {['', 'DRAFT', 'SENT_FOR_BOS_APPROVAL', 'APPROVED_BY_BOS', 'APPROVED', 'REJECTED_BY_BOS', 'REJECTED_BY_VERIFIER', 'AI_GENERATED'].map(s => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer', fontSize: '12px', color: '#1E293B' }}>
                    <input type="radio" name="currFilter" checked={statusFilter === s} onChange={() => { setStatusFilter(s); setShowFilter(false); }} style={{ accentColor: PRIMARY }} />
                    {s ? s.replace(/_/g, ' ') : 'All'}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Program Id ↑','Degree','Name Of Program','Major','Duration (Years)','Academic Year','Version','Last Updated On','Status','Action'].map(h => <th key={h} style={hcol}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {display.map(e => (
              <tr key={e.id}>
                <td style={{ ...col, color: SUB }}>{e.programId_}</td>
                <td style={col}>{e.degree}</td>
                <td style={col}>{e.name}</td>
                <td style={col}>{e.major}</td>
                <td style={col}>{e.duration}</td>
                <td style={col}>{e.academicYear}</td>
                <td style={col}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EEF2FF', color: PRIMARY, fontWeight: 700, fontSize: '12px', padding: '3px 10px', borderRadius: '10px' }}>
                    v{e.version}
                  </span>
                </td>
                <td style={col}>{e.lastUpdated}</td>
                <td style={col}>
                  {statusBadge(e.status)}
                  {e.rejectionRemarks && (e.status === 'Rejected by BOS' || e.status === 'Rejected') && (
                    <div style={{ fontSize: '11px', color: '#B91C1C', marginTop: '4px', maxWidth: '180px', lineHeight: 1.4 }}>
                      ↳ {e.rejectionRemarks}
                    </div>
                  )}
                </td>
                <td style={col}>
                  <ActionMenu items={[
                    {
                      label: 'View Current Curriculum', onClick: () => {
                        const prog = programs.find(p => p.id === e.programId);
                        openDetail(prog ?? { id: e.programId ?? 0, programId: e.programId_, degree: e.degree, name: e.name, majors: [e.major], duration: e.duration, totalFees: 0, intakeCapacity: 0, deadline: '', status: 'UPLOADED' } as Program);
                      }
                    },
                    e.status === 'AI Completed' ? { label: 'View Recommended Curriculum', onClick: () => {
                      const prog = programs.find(p => p.id === e.programId);
                      openDetail(prog ?? { id: e.programId ?? 0, programId: e.programId_, degree: e.degree, name: e.name, majors: [e.major], duration: e.duration, totalFees: 0, intakeCapacity: 0, deadline: '', status: 'UPLOADED' } as Program).then(() => setPageView('recommended'));
                    }} : null,
                    { label: 'Version History', onClick: () => setVersionPanelEntry(e) },
                    { label: 'Delete', danger: true, onClick: async () => {
                      if (!window.confirm('Delete this curriculum entry?')) return;
                      try {
                        await api.delete(`/institute/curriculum/${e.id}`);
                        setEntries(prev => prev.filter(x => x.id !== e.id));
                      } catch (err: any) {
                        alert(err?.response?.data?.message ?? 'Failed to delete. Please try again.');
                      }
                    }},
                  ].filter(Boolean) as any} />
                </td>
              </tr>
            ))}
            {display.length === 0 && (
              <tr><td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>No curriculum entries found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Version history drawer */}
      {versionPanelEntry && versionPanelEntry.programId != null && (
        <VersionHistoryPanel
          programId={versionPanelEntry.programId}
          programName={`${versionPanelEntry.degree} in ${versionPanelEntry.name}`}
          onClose={() => setVersionPanelEntry(null)}
          onViewVersion={async (v) => {
            setVersionPanelEntry(null);
            // Load the program from backend and open detail, noting the version
            if (versionPanelEntry.programId) {
              const r = await api.get(`/institute/programs`).catch(() => ({ data: { data: { content: [] } } }));
              const programs: Program[] = r.data?.data?.content ?? r.data?.data ?? [];
              const prog = programs.find((p: Program) => p.id === versionPanelEntry.programId);
              openDetail(prog ?? { id: versionPanelEntry.programId ?? 0, programId: versionPanelEntry.programId_, degree: versionPanelEntry.degree, name: versionPanelEntry.name, majors: [versionPanelEntry.major], duration: versionPanelEntry.duration, totalFees: 0, intakeCapacity: 0, deadline: '', status: 'UPLOADED' } as Program);
            }
          }}
        />
      )}
    </div>
  );

  // ── RECOMMENDED VIEW ───────────────────────────────────────────────────────
  if (pageView === 'recommended' && aiCurriculum) return (
    <>
      <RecommendedView
        current={semesters}
        ai={aiCurriculum}
        onBack={() => setPageView('detail')}
        onSendApproval={() => { setSelectedApprovalType('AI_GENERATED'); setShowApprovalTypeModal(true); }}
      />
      {/* Approval Type Modal — rendered outside RecommendedView so it sits on top */}
      {showApprovalTypeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>Select Curriculum to Submit</h3>
            <p style={{ fontSize: '13px', color: SUB, margin: '0 0 24px' }}>Choose which version to send for BOS approval. After HOD approves, this version becomes the final curriculum.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {([
                { key: 'ORIGINAL' as const, label: 'Original Curriculum', desc: 'The curriculum uploaded via the syllabus Excel file.', icon: '📄' },
                { key: 'AI_GENERATED' as const, label: 'AI Recommended Curriculum', desc: 'The AI-improved version with suggested changes.', icon: '🤖' },
              ]).map(opt => (
                <label key={opt.key} onClick={() => setSelectedApprovalType(opt.key)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', border: `2px solid ${selectedApprovalType === opt.key ? PRIMARY : BORDER}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', background: selectedApprovalType === opt.key ? '#EEF2FF' : '#FAFAFA' }}>
                  <input type="radio" name="approvalType2" value={opt.key} checked={selectedApprovalType === opt.key} onChange={() => setSelectedApprovalType(opt.key)} style={{ marginTop: '2px', accentColor: PRIMARY }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{opt.icon} {opt.label}</div>
                    <div style={{ fontSize: '12px', color: SUB, marginTop: '3px' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowApprovalTypeModal(false)} style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', padding: '10px', fontSize: '14px', cursor: 'pointer', color: TEXT }}>Cancel</button>
              <button onClick={async () => {
                const entry = entries.find(en => en.programId === program?.id) ?? entries.find(en => en.name === program?.name && en.major === program?.majors?.[0]);
                if (!entry) { alert('Could not find curriculum entry. Please go back and try again.'); return; }
                try {
                  await api.post(`/institute/curriculum/${entry.id}/send-for-approval`, { approvalType: selectedApprovalType });
                  setEntries(prev => prev.map(en => en.id === entry.id ? { ...en, status: 'Sent for BOS Approval' } : en));
                  setShowApprovalTypeModal(false);
                  setPageView('list');
                  loadEntries();
                } catch (err: any) { alert(err?.response?.data?.message ?? 'Failed to send for approval'); }
              }} style={{ flex: 1, border: 'none', borderRadius: '8px', background: '#E04D8A', color: '#fff', padding: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Send For Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb + title */}
      <div style={{ padding: '10px 24px 0', borderBottom: `1px solid ${BORDER}`, background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setPageView('list')}>Program Management</span>
          <span>›</span><span>Curriculum Management</span><span>›</span>
          <span style={{ color: TEXT }}>{program?.degree} In {program?.name} – {program?.majors?.[0]}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: TEXT }}>{program?.degree} In {program?.name} – {program?.majors?.[0]}</h2>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginTop: '8px' }}>
          <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
            {(['curriculum','timetable','creditscore'] as const).map(t => {
              const label = t === 'curriculum' ? 'Curriculum' : t === 'timetable' ? 'Timetable' : 'Credit Score';
              return (
                <button key={t} onClick={() => setCurrTab(t)}
                  style={{ paddingBottom: '10px', paddingTop: '4px', fontSize: '14px', fontWeight: currTab === t ? 600 : 400, color: currTab === t ? PRIMARY : SUB, background: 'none', border: 'none', borderBottom: `2px solid ${currTab === t ? PRIMARY : 'transparent'}`, cursor: 'pointer' }}>
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input placeholder="Search" style={{ padding: '7px 10px 7px 26px', border: `1px solid ${BORDER}`, borderRadius: '20px', fontSize: '12px', outline: 'none', width: '160px' }} />
            </div>
            <button onClick={handleGenAI} disabled={isGenerating} title="Based on Industry Demand"
              style={{ border: 'none', borderRadius: '20px', background: isGenerating ? '#A5B4FC' : PRIMARY, color: '#fff', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer' }}>
              {isGenerating ? 'Generating…' : 'Generate AI Recommended Curriculum'}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loadingData ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94A3B8', fontSize: '13px' }}>Loading document data…</div>
        ) : currTab === 'curriculum' ? (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <CurriculumTree semesters={semesters} selectedSub={selectedSub} selectedMod={selectedMod}
              onSub={c => { setSelectedSub(c); setSelectedMod(null); }}
              onMod={(c, n) => { setSelectedSub(c); setSelectedMod(`${c}-${n}`); }} />
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              {aiError && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{aiError}</div>}
              {curMod && curSub ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <button onClick={() => setSelectedMod(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, display: 'flex' }}><ArrowLeft size={18} /></button>
                  </div>
                  <ModuleDetail mod={curMod} />
                </div>
              ) : curSub ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <button onClick={() => setSelectedSub(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, display: 'flex' }}><ArrowLeft size={18} /></button>
                  </div>
                  <SubjectDetail sub={curSub} />
                </div>
              ) : (
                <p style={{ color: '#94A3B8', fontSize: '13px' }}>
                  {semesters.length === 0 ? 'Upload the Syllabus Excel in Programs to view curriculum content.' : 'Select a subject or module from the tree.'}
                </p>
              )}
            </div>
          </div>
        ) : currTab === 'timetable' ? (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <MonthlyCalendar slots={weeklySlots} />
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CreditScoreTab credits={creditData?.credits ?? []} timetable={creditData?.timetable ?? []} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 24px', borderTop: `1px solid ${BORDER}`, background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
        <button onClick={() => setPageView('list')} style={{ border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', padding: '10px 24px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Back</button>
        {aiCurriculum && (
          <button onClick={() => setPageView('recommended')} style={{ border: 'none', borderRadius: '20px', background: PRIMARY, color: '#fff', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            View AI Recommendations
          </button>
        )}
        {(() => {
          const entry = entries.find(e => e.programId === program?.id);
          const canSend = entry && !['Sent for BOS Approval','Approved by BOS','Approved','Sent for Final Approval'].includes(entry.status);
          return canSend ? (
            <button onClick={() => { setSelectedApprovalType('ORIGINAL'); setShowApprovalTypeModal(true); }}
              style={{ border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Send For Approval
            </button>
          ) : null;
        })()}
      </div>

      {/* Approval Type Selection Modal */}
      {showApprovalTypeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>Select Curriculum to Submit</h3>
            <p style={{ fontSize: '13px', color: SUB, margin: '0 0 24px' }}>Choose which version to send for BOS approval. After HOD approves, this version becomes the final curriculum.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {[
                { key: 'ORIGINAL' as const, label: 'Original Curriculum', desc: 'The curriculum uploaded via the syllabus Excel file.', icon: '📄' },
                { key: 'AI_GENERATED' as const, label: 'AI Recommended Curriculum', desc: 'The AI-improved version with suggested changes.', icon: '🤖', disabled: !aiCurriculum },
              ].map(opt => (
                <label key={opt.key} onClick={() => !opt.disabled && setSelectedApprovalType(opt.key)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', border: `2px solid ${selectedApprovalType === opt.key ? PRIMARY : BORDER}`, borderRadius: '12px', padding: '16px', cursor: opt.disabled ? 'not-allowed' : 'pointer', opacity: opt.disabled ? 0.45 : 1, background: selectedApprovalType === opt.key ? '#EEF2FF' : '#FAFAFA' }}>
                  <input type="radio" name="approvalType" value={opt.key} checked={selectedApprovalType === opt.key} disabled={opt.disabled} onChange={() => !opt.disabled && setSelectedApprovalType(opt.key)}
                    style={{ marginTop: '2px', accentColor: PRIMARY }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{opt.icon} {opt.label}</div>
                    <div style={{ fontSize: '12px', color: SUB, marginTop: '3px' }}>{opt.desc}</div>
                    {opt.disabled && <div style={{ fontSize: '11px', color: '#F59E0B', marginTop: '3px' }}>Generate AI curriculum first to enable this option.</div>}
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowApprovalTypeModal(false)}
                style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', padding: '10px', fontSize: '14px', cursor: 'pointer', color: TEXT }}>
                Cancel
              </button>
              <button onClick={async () => {
                const entry = entries.find(en => en.programId === program?.id) ?? entries.find(en => en.name === program?.name && en.major === program?.majors?.[0]);
                if (!entry) { alert('Could not find curriculum entry. Please go back and try again.'); return; }
                try {
                  await api.post(`/institute/curriculum/${entry.id}/send-for-approval`, { approvalType: selectedApprovalType });
                  setEntries(prev => prev.map(en => en.id === entry.id ? { ...en, status: 'Sent for BOS Approval' } : en));
                  setShowApprovalTypeModal(false);
                  setShowApprovalModal(true);
                } catch (err: any) {
                  alert(err?.response?.data?.message ?? 'Failed to send for approval');
                }
              }}
                style={{ flex: 1, border: 'none', borderRadius: '8px', background: '#E04D8A', color: '#fff', padding: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Send For Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send for Approval modal */}
      {showApprovalModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '40px 48px', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: `3px solid ${PRIMARY}`, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: PRIMARY }}>✓</div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: PRIMARY, margin: '0 0 24px', lineHeight: 1.5 }}>Curriculum Is Sent<br />For Approval</p>
            <button onClick={() => { setShowApprovalModal(false); setPageView('list'); loadEntries(); }}
              style={{ border: 'none', borderRadius: '20px', background: PRIMARY, color: '#fff', padding: '10px 40px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Ok</button>
          </div>
        </div>
      )}

      {/* AI Generation modal */}
      {showAiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '40px 48px', maxWidth: '420px', width: '90%', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FEF3C7', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>⏳</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>
              {isGenerating ? 'AI Curriculum Generation In Progress' : aiError ? 'Generation Failed' : 'AI Curriculum Ready!'}
            </h3>
            <p style={{ fontSize: '13px', color: SUB, margin: '0 0 28px', lineHeight: 1.6 }}>
              {isGenerating
                ? "Fetching top trending job roles for this program, then generating a curriculum that makes your students job-ready. This may take a moment…"
                : aiError ? aiError
                : 'Your AI-recommended curriculum has been generated. Click below to view it.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setShowAiModal(false)} style={{ border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', padding: '10px 24px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Close</button>
              {!isGenerating && !aiError && (
                <button onClick={() => { setShowAiModal(false); setPageView('recommended'); }}
                  style={{ border: 'none', borderRadius: '20px', background: PRIMARY, color: '#fff', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  View Recommendations
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
