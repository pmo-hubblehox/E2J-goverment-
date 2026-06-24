import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#1E293B';
const SUB     = '#64748B';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM – 9 PM
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_PX = 64; // height per hour in px
const LABEL_W = 56; // left time-label column width

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function fmtHour(h: number) {
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

export interface CalEvent {
  id: string | number;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:MM or HH:MM:SS
  endTime: string;
  title: string;
  subtitle?: string;
  color?: string;      // bg color
  textColor?: string;
  onClick?: () => void;
  subBlocks?: { startTime: string; endTime: string; label: string; color?: string }[];
}

interface Props {
  events: CalEvent[];
  initialDate?: Date;
}

export default function WeekCalendar({ events, initialDate }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(initialDate ?? new Date()));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd  = weekDays[6];

  const fmtRange = () => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${weekStart.getDate()} – ${weekEnd.toLocaleDateString('en-IN', opts)}`;
    }
    return `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-IN', opts)}`;
  };

  const today = toDateStr(new Date());

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));
  const goToday  = () => setWeekStart(getMonday(new Date()));

  const eventsByDate: Record<string, CalEvent[]> = {};
  events.forEach(e => {
    (eventsByDate[e.date] ??= []).push(e);
  });

  const totalH = HOURS.length * HOUR_PX;

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: TEXT }}>{fmtRange()}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={goToday}
            style={{ padding: '5px 14px', borderRadius: '20px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '12px', fontWeight: 600, color: SUB, cursor: 'pointer' }}>
            Today
          </button>
          <button onClick={prevWeek} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={16} color={SUB} />
          </button>
          <button onClick={nextWeek} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={16} color={SUB} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ background: '#F8FAFC' }} />
        {weekDays.map((d, i) => {
          const ds = toDateStr(d);
          const isToday = ds === today;
          return (
            <div key={i} style={{ padding: '10px 8px', textAlign: 'center', background: '#F8FAFC', borderLeft: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: SUB }}>{DAY_LABELS[i]}</div>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isToday ? PRIMARY : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 0' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: isToday ? '#fff' : TEXT }}>{d.getDate()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div style={{ overflowY: 'auto', maxHeight: '560px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`, position: 'relative' }}>
          {/* Hour labels */}
          <div style={{ position: 'relative', height: `${totalH}px` }}>
            {HOURS.map((h, i) => (
              <div key={h} style={{ position: 'absolute', top: `${i * HOUR_PX}px`, width: '100%', height: `${HOUR_PX}px`, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '8px', paddingTop: '4px' }}>
                <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>{fmtHour(h)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((d, di) => {
            const ds = toDateStr(d);
            const dayEvents = eventsByDate[ds] ?? [];
            return (
              <div key={di} style={{ position: 'relative', height: `${totalH}px`, borderLeft: `1px solid ${BORDER}` }}>
                {/* Hour grid lines */}
                {HOURS.map((_, hi) => (
                  <div key={hi} style={{ position: 'absolute', top: `${hi * HOUR_PX}px`, left: 0, right: 0, borderTop: `1px solid ${BORDER}`, pointerEvents: 'none' }} />
                ))}
                {/* Half-hour lines */}
                {HOURS.map((_, hi) => (
                  <div key={`h${hi}`} style={{ position: 'absolute', top: `${hi * HOUR_PX + HOUR_PX / 2}px`, left: 0, right: 0, borderTop: `1px dashed #F1F5F9`, pointerEvents: 'none' }} />
                ))}

                {/* Events */}
                {dayEvents.map(ev => {
                  const startMin = timeToMinutes(ev.startTime.slice(0, 5));
                  const endMin   = timeToMinutes(ev.endTime.slice(0, 5));
                  const top    = (startMin - HOURS[0] * 60) / 60 * HOUR_PX;
                  const height = Math.max((endMin - startMin) / 60 * HOUR_PX, 24);
                  const bg     = ev.color ?? '#EEF2FF';
                  const tc     = ev.textColor ?? PRIMARY;
                  return (
                    <div key={ev.id}
                      onClick={ev.onClick}
                      style={{ position: 'absolute', top: `${top}px`, left: '3px', right: '3px', height: `${height}px`, background: bg, borderLeft: `3px solid ${tc}`, borderRadius: '6px', padding: '4px 6px', cursor: ev.onClick ? 'pointer' : 'default', overflow: 'hidden', zIndex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: tc, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                      {ev.subtitle && height > 36 && (
                        <div style={{ fontSize: '10px', color: tc, opacity: 0.8, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{ev.subtitle}</div>
                      )}
                      {/* Sub-blocks (blocked time windows) */}
                      {(ev.subBlocks ?? []).map((sb, si) => {
                        const sbStart = timeToMinutes(sb.startTime.slice(0, 5));
                        const sbEnd   = timeToMinutes(sb.endTime.slice(0, 5));
                        const sbTop  = (sbStart - startMin) / 60 * HOUR_PX;
                        const sbH    = Math.max((sbEnd - sbStart) / 60 * HOUR_PX, 16);
                        return (
                          <div key={si} style={{ position: 'absolute', top: `${sbTop + 2}px`, left: '2px', right: '2px', height: `${sbH - 4}px`, background: sb.color ?? '#FEE2E2', borderLeft: `2px solid #DC2626`, borderRadius: '3px', padding: '2px 4px', overflow: 'hidden' }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#DC2626' }}>🔒 {sb.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
