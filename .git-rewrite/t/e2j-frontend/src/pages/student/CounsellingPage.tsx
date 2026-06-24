import React, { useState, useEffect } from 'react';
import { Search, Star, ChevronLeft, Clock, Calendar, CheckCircle, Loader2, Video, Briefcase, GraduationCap, Award, ExternalLink, MapPin, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#1E293B';
const SUB     = '#64748B';
const BG      = '#F8FAFC';

interface CounsellorCard {
  id: number;
  name: string;
  email: string;
  photoUrl: string | null;
  specialty: string | null;
  experienceYears: number | null;
  experienceMonths: number | null;
  skills: string[];
  languages: string[];
  feeAmount: number;
  feeType: string;
  rating: number;
}

interface CounsellorProfile extends CounsellorCard {
  linkedinUrl: string | null;
  city: string | null;
  state: string | null;
  education: { degree: string; schoolName: string; major: string; yearOfPassing: string }[];
  workExperience: { companyName: string; employmentType: string; fromDate: string; toDate: string; currentlyWorking: boolean; description: string }[];
  certifications: { certificateName: string; awardingInstitute: string; validTill: string }[];
}

interface SlotDay {
  date: string;
  dayLabel: string;
  times: string[];
}

interface BookingDetail {
  id: number;
  counsellorId: number;
  counsellorName: string;
  counsellorPhoto: string | null;
  specialty: string | null;
  sessionDate: string;
  sessionTime: string;
  feeAmount: number;
  status: string;
  meetLink: string;
  createdAt: string;
}

type View = 'browse' | 'profile' | 'payment' | 'confirmed' | 'my-bookings';

const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
];

export default function CounsellingPage() {
  const [view, setView] = useState<View>('browse');
  const [search, setSearch] = useState('');

  const [counsellors, setCounsellors]   = useState<CounsellorCard[]>([]);
  const [loadingList, setLoadingList]   = useState(true);

  const [selected, setSelected]         = useState<CounsellorCard | null>(null);
  const [profile, setProfile]           = useState<CounsellorProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeDay, setActiveDay]       = useState<SlotDay | null>(null);
  const [pickedTime, setPickedTime]     = useState<string | null>(null);

  // Inline slots per counsellor
  const [expandedId, setExpandedId]     = useState<number | null>(null);
  const [inlineSlots, setInlineSlots]   = useState<SlotDay[]>([]);
  const [loadingInline, setLoadingInline] = useState(false);
  const [slotDateOffset, setSlotDateOffset] = useState(0);

  // Filter sidebar state
  const [calMonth, setCalMonth]         = useState(new Date());
  const [selDateRange, setSelDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [timeFrom, setTimeFrom]         = useState('');
  const [timeTo, setTimeTo]             = useState('');
  const [sortBy, setSortBy]             = useState('Most Popular');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Top-bar filters
  const [ratingFilter, setRatingFilter]     = useState<number | null>(null);
  const [showRatingMenu, setShowRatingMenu] = useState(false);
  const [langFilter, setLangFilter]         = useState<string[]>([]);
  const [showLangMenu, setShowLangMenu]     = useState(false);

  // Applied filter — set when user clicks APPLY
  const [appliedFilter, setAppliedFilter] = useState<{ start: Date | null; end: Date | null; from: string; to: string } | null>(null);
  const [slotCache, setSlotCache]         = useState<Record<number, SlotDay[]>>({});
  const [applyingFilter, setApplyingFilter] = useState(false);

  const [paying, setPaying]             = useState(false);
  const [payError, setPayError]         = useState<string | null>(null);
  const [confirmed, setConfirmed]       = useState<BookingDetail | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [qAnswers, setQAnswers]         = useState({ q1: '', q2: '', q3: '', q4: '', q5: '' });
  const [submittingQ, setSubmittingQ]   = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);

  // My Bookings view state
  const [bookingTab, setBookingTab]     = useState<'calendar' | 'list'>('calendar');
  const [bookingSearch, setBookingSearch] = useState('');
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [feedbackPopup, setFeedbackPopup] = useState<number | null>(null);

  const [myBookings, setMyBookings]     = useState<BookingDetail[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    api.get('/student/counselling/counsellors')
      .then(r => setCounsellors(r.data?.data ?? []))
      .catch(() => setCounsellors([]))
      .finally(() => setLoadingList(false));
  }, []);

  const openProfile = (c: CounsellorCard) => {
    setSelected(c);
    setProfile(null);
    setView('profile');
    setLoadingProfile(true);
    api.get(`/student/counselling/counsellors/${c.id}/profile`)
      .then(r => setProfile(r.data?.data ?? null))
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
  };

  const toggleInlineSlots = (c: CounsellorCard) => {
    if (expandedId === c.id) { setExpandedId(null); return; }
    setSelected(c);
    setExpandedId(c.id);
    setActiveDay(null);
    setPickedTime(null);
    setSlotDateOffset(0);
    setLoadingInline(true);
    api.get(`/student/counselling/counsellors/${c.id}/slots`)
      .then(r => {
        const data: SlotDay[] = r.data?.data ?? [];
        setInlineSlots(data);
        if (data.length > 0) setActiveDay(data[0]);
      })
      .catch(() => setInlineSlots([]))
      .finally(() => setLoadingInline(false));
  };

  const loadMyBookings = () => {
    setView('my-bookings');
    setLoadingBookings(true);
    api.get('/student/counselling/bookings')
      .then(r => setMyBookings(r.data?.data ?? []))
      .catch(() => setMyBookings([]))
      .finally(() => setLoadingBookings(false));
  };

  const handlePay = () => {
    if (!selected || !activeDay || !pickedTime) {
      setPayError('Missing booking details. Please go back and select a date and time slot.');
      return;
    }
    setPaying(true);
    setPayError(null);
    api.post(`/student/counselling/counsellors/${selected.id}/book`, {
      sessionDate: activeDay.date,
      sessionTime: pickedTime,
      feeAmount: selected.feeAmount ?? 0,
    })
      .then(r => {
        // ApiResponse wraps in .data — try both shapes defensively
        const booking = r.data?.data ?? r.data ?? null;
        setConfirmed(booking);
        setQAnswers({ q1: '', q2: '', q3: '', q4: '', q5: '' });
        setShowQuestionnaire(true);
      })
      .catch(e => {
        const msg = e?.response?.data?.message ?? e?.message ?? 'Booking failed. Please try again.';
        setPayError(msg);
      })
      .finally(() => setPaying(false));
  };

  const handleSubmitQuestionnaire = () => {
    const { q1, q2, q3, q4, q5 } = qAnswers;
    if (!q1.trim() || !q2.trim() || !q3.trim() || !q4.trim() || !q5.trim()) {
      alert('Please answer all 5 questions before submitting.');
      return;
    }
    setSubmittingQ(true);
    // If booking ID is available, save answers; otherwise skip directly to success
    const savePromise = confirmed?.id
      ? api.put(`/student/counselling/bookings/${confirmed.id}/questionnaire`, { q1, q2, q3, q4, q5 })
      : Promise.resolve();
    savePromise
      .then(() => { setShowQuestionnaire(false); setShowSuccess(true); })
      .catch(e => alert(e?.response?.data?.message ?? 'Failed to save answers. Please try again.'))
      .finally(() => setSubmittingQ(false));
  };

  // Convert "HH:MM" string to minutes-since-midnight for comparison
  const toMinutes = (t: string) => {
    if (!t) return -1;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const handleApplyFilter = async () => {
    const hasDate = selDateRange.start !== null;
    const hasTime = timeFrom !== '' || timeTo !== '';
    if (!hasDate && !hasTime) { setAppliedFilter(null); return; }

    setApplyingFilter(true);
    // Fetch slots for any counsellor not yet in cache
    const toFetch = counsellors.filter(c => !(c.id in slotCache));
    const results = await Promise.allSettled(
      toFetch.map(c => api.get(`/student/counselling/counsellors/${c.id}/slots`).then(r => ({ id: c.id, slots: (r.data?.data ?? []) as SlotDay[] })))
    );
    const newCache = { ...slotCache };
    results.forEach(r => { if (r.status === 'fulfilled') newCache[r.value.id] = r.value.slots; });
    setSlotCache(newCache);
    setAppliedFilter({ start: selDateRange.start, end: selDateRange.end, from: timeFrom, to: timeTo });
    setApplyingFilter(false);
  };

  const handleClearFilter = () => {
    setSelDateRange({ start: null, end: null });
    setTimeFrom('');
    setTimeTo('');
    setAppliedFilter(null);
  };

  // Returns true if this counsellor has at least one slot matching the applied filter
  const passesFilter = (c: CounsellorCard): boolean => {
    if (!appliedFilter) return true;
    const { start, end, from, to } = appliedFilter;
    const slots = slotCache[c.id] ?? [];
    if (slots.length === 0) return false;
    const fromMin = toMinutes(from);
    const toMin   = toMinutes(to);
    return slots.some(day => {
      // Date check
      if (start) {
        const d = new Date(day.date);
        d.setHours(0, 0, 0, 0);
        const s = new Date(start); s.setHours(0, 0, 0, 0);
        const e = end ? new Date(end) : s; e.setHours(0, 0, 0, 0);
        if (d < s || d > e) return false;
      }
      // Time check
      if (fromMin >= 0 || toMin >= 0) {
        return day.times.some(t => {
          const m = toMinutes(t);
          if (m < 0) return false;
          if (fromMin >= 0 && m < fromMin) return false;
          if (toMin   >= 0 && m > toMin)   return false;
          return true;
        });
      }
      return true;
    });
  };

  const expLabel = (c: CounsellorCard) => {
    if (!c.experienceYears && !c.experienceMonths) return null;
    const y = c.experienceYears ?? 0;
    const m = c.experienceMonths ?? 0;
    return y > 0 ? `${y} Years Of Experience` : `${m} Months Of Experience`;
  };

  // Mini calendar helpers
  const calDays = (() => {
    const y = calMonth.getFullYear(), mo = calMonth.getMonth();
    const first = new Date(y, mo, 1).getDay(); // 0=Sun
    const startOffset = (first === 0 ? 6 : first - 1); // Monday-start
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const cells: (number | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  })();

  const isInRange = (day: number) => {
    if (!selDateRange.start || !day) return false;
    const d = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
    if (!selDateRange.end) return d.getTime() === selDateRange.start.getTime();
    return d >= selDateRange.start && d <= selDateRange.end;
  };

  const handleCalClick = (day: number) => {
    const d = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
    if (!selDateRange.start || (selDateRange.start && selDateRange.end)) {
      setSelDateRange({ start: d, end: null });
    } else {
      if (d < selDateRange.start) setSelDateRange({ start: d, end: selDateRange.start });
      else setSelDateRange({ start: selDateRange.start, end: d });
    }
  };

  // Collect all unique languages from loaded counsellors
  const allLanguages = Array.from(new Set(counsellors.flatMap(c => c.languages ?? []))).sort();

  const filtered = counsellors
    .filter(c => {
      const q = search.toLowerCase();
      const matchesSearch = c.name.toLowerCase().includes(q) ||
        (c.specialty ?? '').toLowerCase().includes(q) ||
        (c.skills ?? []).some(s => s.toLowerCase().includes(q));
      if (!matchesSearch) return false;
      if (ratingFilter !== null && (c.rating ?? 0) < ratingFilter) return false;
      if (langFilter.length > 0 && !langFilter.every(l => (c.languages ?? []).includes(l))) return false;
      return passesFilter(c);
    })
    .sort((a, b) => {
      if (sortBy === 'Lowest Fee')      return (a.feeAmount ?? 0) - (b.feeAmount ?? 0);
      if (sortBy === 'Highest Fee')     return (b.feeAmount ?? 0) - (a.feeAmount ?? 0);
      if (sortBy === 'Most Experienced') {
        const expA = (a.experienceYears ?? 0) * 12 + (a.experienceMonths ?? 0);
        const expB = (b.experienceYears ?? 0) * 12 + (b.experienceMonths ?? 0);
        return expB - expA;
      }
      if (sortBy === 'Top Rated')       return (b.rating ?? 0) - (a.rating ?? 0);
      return 0; // Most Popular — keep API order
    });

  const VISIBLE_DATES = 5;

  // ── Browse ──────────────────────────────────────────────────────────────────
  if (view === 'browse') return (
    <div style={{ display: 'flex', minHeight: '100%', background: BG, fontFamily: 'inherit' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Left Filter Sidebar ── */}
      <div style={{ width: '260px', flexShrink: 0, background: '#fff', borderRight: `1px solid ${BORDER}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Date Range */}
        <div>
          <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: TEXT, letterSpacing: '0.6px' }}>DATE RANGE</p>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, padding: '2px' }}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{calMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, padding: '2px' }}><ChevronRight size={16} /></button>
          </div>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '4px' }}>
            {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => <span key={d} style={{ textAlign: 'center', fontSize: '10px', color: SUB, fontWeight: 600 }}>{d}</span>)}
          </div>
          {/* Calendar cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
            {calDays.map((day, i) => {
              if (!day) return <span key={i} />;
              const inRange = isInRange(day);
              const d = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
              const isStart = selDateRange.start && d.getTime() === selDateRange.start.getTime();
              const isEnd = selDateRange.end && d.getTime() === selDateRange.end.getTime();
              const today = new Date(); today.setHours(0,0,0,0);
              const isToday = d.getTime() === today.getTime();
              return (
                <button key={i} onClick={() => handleCalClick(day)}
                  style={{ border: 'none', cursor: 'pointer', borderRadius: '50%', width: '28px', height: '28px', fontSize: '11px', fontWeight: isStart || isEnd ? 700 : 400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isStart || isEnd ? PRIMARY : inRange ? '#EEF2FF' : 'transparent',
                    color: isStart || isEnd ? '#fff' : isToday ? PRIMARY : TEXT,
                    outline: isToday && !isStart ? `1.5px solid ${PRIMARY}` : 'none',
                  }}>{day}</button>
              );
            })}
          </div>
        </div>

        {/* Time Range */}
        <div>
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: TEXT, letterSpacing: '0.6px' }}>TIME RANGE</p>
          {[{ label: 'From', val: timeFrom, set: setTimeFrom }, { label: 'To', val: timeTo, set: setTimeTo }].map(({ label, val, set }) => (
            <div key={label} style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 12px', marginBottom: '10px' }}>
              <p style={{ margin: '0 0 2px', fontSize: '10px', color: SUB }}>{label}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <input value={val} onChange={e => set(e.target.value)} placeholder="HH:MM" type="time"
                  style={{ border: 'none', outline: 'none', fontSize: '13px', color: TEXT, background: 'transparent', width: '100%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Active filter badge */}
        {appliedFilter && (
          <div style={{ background: '#EEF2FF', border: `1px solid #C7D2FE`, borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: PRIMARY, fontWeight: 600 }}>
            ✓ Filter active — {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <button onClick={handleClearFilter}
            style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontSize: '13px', fontWeight: 600, color: PRIMARY, cursor: 'pointer' }}>
            CLEAR FILTER
          </button>
          <button onClick={handleApplyFilter} disabled={applyingFilter}
            style={{ flex: 1, padding: '10px', border: 'none', background: applyingFilter ? '#94A3B8' : PRIMARY, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: applyingFilter ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {applyingFilter ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Applying…</> : 'APPLY'}
          </button>
        </div>
      </div>

      {/* ── Right Main Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, background: '#fff', flexWrap: 'wrap' as const, position: 'relative' as const }}>
          {/* Rating dropdown */}
          <div style={{ position: 'relative' as const }}>
            <button onClick={() => { setShowRatingMenu(p => !p); setShowLangMenu(false); setShowSortMenu(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${ratingFilter ? PRIMARY : BORDER}`, borderRadius: '8px', padding: '7px 12px', fontSize: '13px', color: ratingFilter ? PRIMARY : TEXT, cursor: 'pointer', background: ratingFilter ? '#EEF2FF' : '#fff', fontWeight: ratingFilter ? 600 : 400 }}>
              <Star size={13} color="#FBBF24" fill="#FBBF24" />
              {ratingFilter ? `${ratingFilter}+ Stars` : 'Rating'}
              <ChevronLeft size={13} style={{ transform: 'rotate(270deg)', color: SUB }} />
            </button>
            {showRatingMenu && (
              <div style={{ position: 'absolute' as const, top: 'calc(100% + 6px)', left: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: '160px', overflow: 'hidden' }}>
                {[null, 3, 3.5, 4, 4.5].map(v => (
                  <button key={String(v)} onClick={() => { setRatingFilter(v); setShowRatingMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', border: 'none', background: ratingFilter === v ? '#EEF2FF' : 'transparent', color: ratingFilter === v ? PRIMARY : TEXT, fontSize: '13px', cursor: 'pointer', fontWeight: ratingFilter === v ? 600 : 400 }}>
                    <Star size={13} color="#FBBF24" fill="#FBBF24" />
                    {v === null ? 'Any Rating' : `${v}+ Stars`}
                    {ratingFilter === v && <span style={{ marginLeft: 'auto' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language dropdown */}
          <div style={{ position: 'relative' as const }}>
            <button onClick={() => { setShowLangMenu(p => !p); setShowRatingMenu(false); setShowSortMenu(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${langFilter.length ? PRIMARY : BORDER}`, borderRadius: '8px', padding: '7px 12px', fontSize: '13px', color: langFilter.length ? PRIMARY : TEXT, cursor: 'pointer', background: langFilter.length ? '#EEF2FF' : '#fff', fontWeight: langFilter.length ? 600 : 400 }}>
              {langFilter.length ? `${langFilter.length} Language${langFilter.length > 1 ? 's' : ''}` : 'Language Preference'}
              <ChevronLeft size={13} style={{ transform: 'rotate(270deg)', color: SUB }} />
            </button>
            {showLangMenu && (
              <div style={{ position: 'absolute' as const, top: 'calc(100% + 6px)', left: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: '200px', overflow: 'hidden', maxHeight: '240px', overflowY: 'auto' as const }}>
                {allLanguages.length === 0 && (
                  <p style={{ padding: '12px 14px', margin: 0, fontSize: '12px', color: SUB }}>No languages set by counsellors yet</p>
                )}
                {langFilter.length > 0 && (
                  <button onClick={() => setLangFilter([])} style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', borderBottom: `1px solid ${BORDER}`, background: 'transparent', color: '#EF4444', fontSize: '12px', cursor: 'pointer', textAlign: 'left' as const, fontWeight: 600 }}>
                    Clear selection
                  </button>
                )}
                {allLanguages.map(lang => (
                  <button key={lang} onClick={() => setLangFilter(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', border: 'none', background: langFilter.includes(lang) ? '#EEF2FF' : 'transparent', color: langFilter.includes(lang) ? PRIMARY : TEXT, fontSize: '13px', cursor: 'pointer', fontWeight: langFilter.includes(lang) ? 600 : 400 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${langFilter.includes(lang) ? PRIMARY : BORDER}`, background: langFilter.includes(lang) ? PRIMARY : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {langFilter.includes(lang) && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>}
                    </div>
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${BORDER}`, borderRadius: '100px', padding: '7px 14px', background: '#fff', flex: 1, maxWidth: '320px' }}>
            <Search size={14} color={SUB} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
              style={{ border: 'none', outline: 'none', fontSize: '13px', color: TEXT, background: 'transparent', width: '100%' }} />
          </div>

          <button onClick={loadMyBookings} style={{ marginLeft: 'auto', padding: '8px 18px', borderRadius: '100px', border: `1.5px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            My Bookings
          </button>
        </div>

        {/* Close menus on outside click */}
        {(showRatingMenu || showLangMenu || showSortMenu) && (
          <div onClick={() => { setShowRatingMenu(false); setShowLangMenu(false); setShowSortMenu(false); }} style={{ position: 'fixed' as const, inset: 0, zIndex: 199 }} />
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Count + sort */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: TEXT }}><strong>{filtered.length}</strong> Consultant{filtered.length !== 1 ? 's' : ''}</span>
            <div style={{ position: 'relative' as const }}>
              <button onClick={() => { setShowSortMenu(p => !p); setShowRatingMenu(false); setShowLangMenu(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '7px 14px', background: '#fff', fontSize: '13px', color: TEXT, cursor: 'pointer' }}>
                {sortBy} <ChevronLeft size={13} style={{ transform: 'rotate(270deg)', color: SUB }} />
              </button>
              {showSortMenu && (
                <div style={{ position: 'absolute' as const, top: 'calc(100% + 6px)', right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: '180px', overflow: 'hidden' }}>
                  {['Most Popular', 'Top Rated', 'Most Experienced', 'Lowest Fee', 'Highest Fee'].map(opt => (
                    <button key={opt} onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', border: 'none', background: sortBy === opt ? '#EEF2FF' : 'transparent', color: sortBy === opt ? PRIMARY : TEXT, fontSize: '13px', cursor: 'pointer', fontWeight: sortBy === opt ? 600 : 400 }}>
                      {opt}
                      {sortBy === opt && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loadingList ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: SUB, fontSize: '13px', padding: '48px', justifyContent: 'center' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: SUB, fontSize: '14px' }}>No counsellors found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filtered.map(c => {
                const isExpanded = expandedId === c.id;
                const visibleSlots = inlineSlots.slice(slotDateOffset, slotDateOffset + VISIBLE_DATES);
                return (
                  <div key={c.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', overflow: 'hidden' }}>
                    {/* Counsellor row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '18px 20px', flexWrap: 'wrap' as const }}>
                      {/* Photo */}
                      <div style={{ width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0, background: '#EEF2FF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: PRIMARY }}>
                        {c.photoUrl ? <img src={c.photoUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: '160px' }}>
                        <button onClick={() => openProfile(c)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '15px', fontWeight: 700, color: PRIMARY, textDecoration: 'underline', display: 'block', marginBottom: '2px', textAlign: 'left' }}>
                          {c.name}
                        </button>
                        {c.specialty && <p style={{ margin: '0 0 2px', fontSize: '12px', color: TEXT }}>{c.specialty}</p>}
                        {expLabel(c) && <p style={{ margin: '0 0 6px', fontSize: '12px', color: TEXT }}>{expLabel(c)}</p>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Star size={13} color="#FBBF24" fill="#FBBF24" />
                          <span style={{ fontSize: '12px', color: TEXT, fontWeight: 600 }}>{c.rating > 0 ? `${c.rating}/5` : 'New'}</span>
                          <span style={{ color: BORDER }}>|</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>
                            {c.feeAmount ? `₹${c.feeAmount.toLocaleString()}/-` : 'Free'}
                          </span>
                        </div>
                      </div>

                      {/* Right side */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                        {(c.skills ?? []).length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: SUB }}>Available Days</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {c.skills.slice(0, 3).map(s => (
                                <span key={s} style={{ padding: '4px 10px', border: `1px solid ${BORDER}`, borderRadius: '6px', fontSize: '11px', color: TEXT, fontWeight: 500 }}>{s.substring(0, 3)}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <button onClick={() => toggleInlineSlots(c)}
                          style={{ padding: '10px 22px', borderRadius: '100px', border: 'none', background: '#E91E8C', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                          PROCEED WITH PAYMENT
                        </button>
                      </div>
                    </div>

                    {/* Inline booking section */}
                    {isExpanded && (
                      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '18px 20px', background: '#FAFBFF' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: TEXT }}>BOOK SESSION</p>
                        <p style={{ margin: '0 0 14px', fontSize: '11px', color: SUB }}>Choose Date And Time</p>

                        {loadingInline ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: SUB, fontSize: '13px', padding: '20px 0' }}>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading slots…
                          </div>
                        ) : inlineSlots.length === 0 ? (
                          <p style={{ color: SUB, fontSize: '13px' }}>No available slots in the next 30 days.</p>
                        ) : (
                          <>
                            {/* Date tabs with arrows */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                              <button onClick={() => setSlotDateOffset(o => Math.max(0, o - 1))} disabled={slotDateOffset === 0}
                                style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', cursor: slotDateOffset === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: slotDateOffset === 0 ? 0.4 : 1 }}>
                                <ChevronLeft size={14} />
                              </button>
                              <div style={{ display: 'flex', gap: '8px', flex: 1, overflow: 'hidden' }}>
                                {visibleSlots.map(day => (
                                  <button key={day.date} onClick={() => { setActiveDay(day); setPickedTime(null); }}
                                    style={{ flex: 1, padding: '10px 8px', border: `1.5px solid ${activeDay?.date === day.date ? PRIMARY : BORDER}`, borderRadius: '10px', background: activeDay?.date === day.date ? '#EEF2FF' : '#fff', color: activeDay?.date === day.date ? PRIMARY : TEXT, fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const, textAlign: 'center' as const }}>
                                    {day.dayLabel}
                                  </button>
                                ))}
                              </div>
                              <button onClick={() => setSlotDateOffset(o => Math.min(inlineSlots.length - VISIBLE_DATES, o + 1))} disabled={slotDateOffset + VISIBLE_DATES >= inlineSlots.length}
                                style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', cursor: slotDateOffset + VISIBLE_DATES >= inlineSlots.length ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: slotDateOffset + VISIBLE_DATES >= inlineSlots.length ? 0.4 : 1 }}>
                                <ChevronRight size={14} />
                              </button>
                            </div>

                            {/* Time slots grid */}
                            {activeDay && (
                              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(visibleSlots.length, VISIBLE_DATES)}, 1fr)`, gap: '8px', marginBottom: '16px' }}>
                                {visibleSlots.map(day => (
                                  <div key={day.date} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {day.times.map(t => (
                                      <button key={t} onClick={() => { setActiveDay(day); setPickedTime(t); }}
                                        style={{ padding: '9px 6px', border: `1.5px solid ${pickedTime === t && activeDay?.date === day.date ? PRIMARY : '#C7D2FE'}`, borderRadius: '8px', background: pickedTime === t && activeDay?.date === day.date ? '#EEF2FF' : '#fff', color: pickedTime === t && activeDay?.date === day.date ? PRIMARY : TEXT, fontSize: '12px', fontWeight: pickedTime === t && activeDay?.date === day.date ? 700 : 400, cursor: 'pointer', textAlign: 'center' as const }}>
                                        {t}
                                      </button>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}

                            <button onClick={() => setView('payment')} disabled={!pickedTime}
                              style={{ padding: '11px 32px', borderRadius: '100px', border: 'none', background: pickedTime ? '#E91E8C' : '#CBD5E1', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: pickedTime ? 'pointer' : 'not-allowed' }}>
                              PROCEED WITH PAYMENT
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Counsellor Profile ──────────────────────────────────────────────────────
  if (view === 'profile') return (
    <div style={{ padding: '24px', minHeight: '100%', background: BG }}>
      <button onClick={() => setView('browse')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: 0, marginBottom: '20px' }}>
        <ChevronLeft size={18} /> Back to Counsellors
      </button>

      {loadingProfile || !profile ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: SUB, fontSize: '13px', padding: '32px 0' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading profile…
        </div>
      ) : (
        <div style={{ maxWidth: '720px' }}>
          {/* Hero card */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ height: '100px', background: 'linear-gradient(135deg,#667eea,#764ba2)' }} />
            <div style={{ padding: '0 24px 24px', position: 'relative' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: '#fff', position: 'absolute', top: '-36px' }}>
                {profile.photoUrl ? <img src={profile.photoUrl} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : profile.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ paddingTop: '44px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: TEXT }}>{profile.name}</h2>
                  {profile.specialty && <p style={{ margin: '0 0 6px', fontSize: '13px', color: SUB }}>{profile.specialty}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {(profile.city || profile.state) && (
                      <span style={{ fontSize: '12px', color: SUB, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={12} /> {[profile.city, profile.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {(profile.experienceYears ?? 0) > 0 && (
                      <span style={{ fontSize: '12px', color: SUB, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Briefcase size={12} /> {profile.experienceYears} yr{profile.experienceYears !== 1 ? 's' : ''} experience
                      </span>
                    )}
                    {profile.linkedinUrl && (
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: '#0A66C2', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
                        <ExternalLink size={12} /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: 700, color: TEXT }}>
                    {profile.feeAmount ? `₹${profile.feeAmount.toLocaleString()}` : 'Free'}
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: '11px', color: SUB }}>{profile.feeType ?? 'per session'} · Online</p>
                  <button onClick={() => { setExpandedId(null); setView('browse'); setTimeout(() => toggleInlineSlots(profile), 50); }}
                    style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    Book Session →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {(profile.skills ?? []).length > 0 && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px', marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: TEXT }}>Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.skills.map(s => (
                  <span key={s} style={{ fontSize: '12px', background: '#EEF2FF', color: PRIMARY, padding: '4px 12px', borderRadius: '20px', fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {profile.workExperience.length > 0 && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px', marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={14} color={PRIMARY} /> Work Experience
              </h4>
              {profile.workExperience.map((w, i) => (
                <div key={i} style={{ paddingBottom: i < profile.workExperience.length - 1 ? '14px' : 0, marginBottom: i < profile.workExperience.length - 1 ? '14px' : 0, borderBottom: i < profile.workExperience.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{w.companyName}</p>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', color: SUB }}>{w.employmentType}</p>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} /> {w.fromDate} – {w.currentlyWorking ? 'Present' : w.toDate}
                  </p>
                  {w.description && <p style={{ margin: 0, fontSize: '12px', color: SUB, lineHeight: 1.5 }}>{w.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {profile.education.length > 0 && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px', marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GraduationCap size={14} color={PRIMARY} /> Education
              </h4>
              {profile.education.map((e, i) => (
                <div key={i} style={{ paddingBottom: i < profile.education.length - 1 ? '14px' : 0, marginBottom: i < profile.education.length - 1 ? '14px' : 0, borderBottom: i < profile.education.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{e.degree}{e.major ? ` — ${e.major}` : ''}</p>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', color: SUB }}>{e.schoolName}</p>
                  {e.yearOfPassing && <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{e.yearOfPassing}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {profile.certifications.length > 0 && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px', marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={14} color={PRIMARY} /> Certifications
              </h4>
              {profile.certifications.map((cert, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: i < profile.certifications.length - 1 ? '12px' : 0, marginBottom: i < profile.certifications.length - 1 ? '12px' : 0, borderBottom: i < profile.certifications.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{cert.certificateName}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: SUB }}>{cert.awardingInstitute}</p>
                  </div>
                  {cert.validTill && <span style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap' }}>Valid till {cert.validTill}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 700, color: TEXT }}>Ready to book with {profile.name.split(' ')[0]}?</p>
              <p style={{ margin: 0, fontSize: '12px', color: SUB }}>Online · {profile.feeAmount ? `₹${profile.feeAmount.toLocaleString()} ${profile.feeType ?? 'per session'}` : 'Free'}</p>
            </div>
            <button onClick={() => { setExpandedId(null); setView('browse'); setTimeout(() => toggleInlineSlots(profile), 50); }}
              style={{ padding: '11px 28px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              Book Session →
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Payment ─────────────────────────────────────────────────────────────────
  // ── Questionnaire Modal ──────────────────────────────────────────────────────
  if (showQuestionnaire) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
        <div style={{ marginBottom: '6px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: TEXT, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>BOOK SESSION</h2>
        </div>
        <p style={{ margin: '0 0 24px', fontSize: '12px', color: SUB }}>Help Us Get To Know You Better Before Your Counselling Session. Answer A Few Quick Questions To Make The Most Of Your Time With Our Expert!</p>
        {[
          { key: 'q1', label: '1. What Are Your Interests?' },
          { key: 'q2', label: '2. What Is Your Career Goal?' },
          { key: 'q3', label: '3. Which Industry Are You Most Interested In Working In?' },
          { key: 'q4', label: '4. What Skills Are You Interested In Acquiring?' },
          { key: 'q5', label: '5. What Challenges Are You Currently Facing In Your Career Journey?' },
        ].map(({ key, label }) => (
          <div key={key} style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{label}</p>
            <textarea value={qAnswers[key as keyof typeof qAnswers]}
              onChange={e => setQAnswers(prev => ({ ...prev, [key]: e.target.value }))}
              rows={4}
              style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: TEXT, resize: 'vertical' as const, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={handleSubmitQuestionnaire} disabled={submittingQ}
            style={{ padding: '10px 32px', borderRadius: '8px', border: 'none', background: submittingQ ? '#94A3B8' : PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: submittingQ ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>
            {submittingQ ? 'Submitting…' : 'SUBMIT'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Success Modal ────────────────────────────────────────────────────────────
  if (showSuccess) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '36px 28px', textAlign: 'center' as const }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: `3px solid ${PRIMARY}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={34} color={PRIMARY} />
        </div>
        <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 700, color: TEXT }}>Session booked successfully</h2>
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', textAlign: 'left' as const }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#92400E' }}>💡 To make the most of your session, here are a few quick tips:</p>
          <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#92400E', fontWeight: 600 }}>Before the Session:</p>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#92400E', lineHeight: 1.7 }}>
            <li>Log in at least 5 minutes early to avoid last-minute delays.</li>
            <li>Prepare your questions in advance – think about your career goals, doubts about courses, or industries you're curious about.</li>
            <li>Keep relevant documents ready (resume, certifications, etc.) in case your counselor wants to review them.</li>
          </ul>
        </div>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>💬</span>
            <div style={{ textAlign: 'left' as const }}>
              <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 700, color: TEXT }}>Facing Technical Issues?</p>
              <p style={{ margin: 0, fontSize: '11px', color: SUB }}>Email us at: admin@hubblehox.com</p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: SUB, whiteSpace: 'nowrap' as const }}>Call: +91-XXXXXXXXXX</p>
        </div>
        <button onClick={() => { setShowSuccess(false); setBookingTab('calendar'); setView('my-bookings'); loadMyBookings(); }}
          style={{ padding: '10px 40px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          Ok
        </button>
      </div>
    </div>
  );

  if (view === 'payment') return (
    <div style={{ padding: '24px', minHeight: '100%', background: BG }}>
      <button onClick={() => setView('browse')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: 0, marginBottom: '20px' }}>
        <ChevronLeft size={18} /> Back to Counsellors
      </button>

      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 20px' }}>Order Summary</h2>

        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: SUB }}>Counsellor</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{selected?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: SUB }}>Date</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{activeDay?.dayLabel}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: SUB }}>Time</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{pickedTime}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: SUB }}>Mode</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT, display: 'flex', alignItems: 'center', gap: '4px' }}><Video size={12} color={PRIMARY} /> Online</span>
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>Total</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: PRIMARY }}>
              {selected?.feeAmount ? `₹${selected.feeAmount.toLocaleString()}` : 'Free'}
            </span>
          </div>
        </div>

        {/* Mock payment notice */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '12px', color: '#92400E' }}>
          This is a demo payment. Click "Pay Now" to confirm your booking.
        </div>

        {payError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#DC2626', fontWeight: 500 }}>
            ⚠️ {payError}
          </div>
        )}

        {(!activeDay || !pickedTime) && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#DC2626' }}>
            ⚠️ No slot selected. <button onClick={() => setView('browse')} style={{ background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}>Go back</button> and pick a date & time.
          </div>
        )}

        <button onClick={handlePay} disabled={paying || !activeDay || !pickedTime}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: (!activeDay || !pickedTime) ? '#CBD5E1' : PRIMARY, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: (paying || !activeDay || !pickedTime) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: paying ? 0.7 : 1 }}>
          {paying ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : `Pay ${selected?.feeAmount ? `₹${selected.feeAmount.toLocaleString()}` : 'Free'} & Confirm`}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── My Bookings ─────────────────────────────────────────────────────────────
  if (view === 'my-bookings') {
    // Week range for calendar
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1 + calendarWeekOffset * 7); // Monday
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
    const weekLabel = `${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${weekDays[6].toLocaleString('default', { month: 'long' })} ${weekDays[6].getFullYear()}`;
    const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

    const parseHour = (time: string) => {
      if (!time) return -1;
      const [h, rest] = time.split(':');
      const isPM = time.toLowerCase().includes('pm');
      let hour = parseInt(h);
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      return hour;
    };

    const filteredBookings = myBookings.filter(b =>
      b.counsellorName.toLowerCase().includes(bookingSearch.toLowerCase())
    );

    // Map bookings to calendar: key = "YYYY-MM-DD|hour"
    const calendarMap: Record<string, BookingDetail[]> = {};
    filteredBookings.forEach(b => {
      const hour = parseHour(b.sessionTime);
      if (hour >= 0) {
        const key = `${b.sessionDate}|${hour}`;
        if (!calendarMap[key]) calendarMap[key] = [];
        calendarMap[key].push(b);
      }
    });

    const statusColor = (s: string) => s === 'CONFIRMED' ? { bg: '#EEF2FF', color: PRIMARY, label: 'Upcoming' }
      : s === 'COMPLETED' ? { bg: '#F3F4F6', color: '#374151', label: 'Completed' }
      : { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' };

    const tabBtn = (tab: 'calendar' | 'list', label: string) => (
      <button onClick={() => setBookingTab(tab)} style={{
        padding: '8px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1.5px solid #E5E7EB',
        borderRadius: tab === 'calendar' ? '100px 0 0 100px' : '0 100px 100px 0',
        background: bookingTab === tab ? PRIMARY : '#fff',
        color: bookingTab === tab ? '#fff' : TEXT,
      }}>{label}</button>
    );

    return (
      <div style={{ padding: '24px', minHeight: '100%', background: BG }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* Back + Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={() => setView('browse')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: 0, marginRight: '16px' }}>
            <ChevronLeft size={18} /> Find Counsellors
          </button>
        </div>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex' }}>
            {tabBtn('calendar', 'Calendar')}
            {tabBtn('list', 'List')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {bookingTab === 'list' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '100px', padding: '8px 14px' }}>
                <Search size={14} color={SUB} />
                <input value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} placeholder="Search"
                  style={{ border: 'none', outline: 'none', fontSize: '13px', color: TEXT, width: '180px', background: 'transparent' }} />
              </div>
            )}
            {bookingTab === 'calendar' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '7px 14px', fontSize: '13px', color: TEXT, fontWeight: 500 }}>
                  Current Week <ChevronLeft size={14} style={{ transform: 'rotate(270deg)' }} />
                </div>
              </>
            )}
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '7px 14px', fontSize: '13px', color: TEXT, cursor: 'pointer', fontWeight: 500 }}>
              🔽 Filter
            </button>
            {bookingTab === 'list' && (
              <button style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', cursor: 'pointer' }}>
                ↓
              </button>
            )}
          </div>
        </div>

        {loadingBookings ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: SUB, fontSize: '13px', padding: '40px', justifyContent: 'center' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
          </div>
        ) : bookingTab === 'list' ? (
          /* ── LIST VIEW ── */
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 1.2fr 1fr 0.5fr', padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, background: BG }}>
              {['Counselor Name ↑', 'Date ↑', 'Mode ↑', 'Link ↑', 'Feedback ↑', 'Status', 'Action'].map(h => (
                <span key={h} style={{ fontSize: '12px', fontWeight: 600, color: SUB }}>{h}</span>
              ))}
            </div>
            {filteredBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: SUB, fontSize: '13px' }}>
                No bookings found
                <br />
                <button onClick={() => setView('browse')} style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Book a Session</button>
              </div>
            ) : filteredBookings.map(b => {
              const sc = statusColor(b.status);
              const dateFormatted = b.sessionDate
                ? new Date(b.sessionDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
                : '--';
              const linkShort = b.meetLink ? b.meetLink.replace('https://', '').substring(0, 18) + '…' : '--';
              return (
                <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 1.2fr 1fr 0.5fr', padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{b.counsellorName}</span>
                  <span style={{ fontSize: '13px', color: TEXT }}>{dateFormatted}</span>
                  <span style={{ fontSize: '13px', color: TEXT }}>Online</span>
                  <span style={{ fontSize: '13px', color: b.meetLink ? PRIMARY : SUB }}>
                    {b.meetLink ? <a href={b.meetLink} target="_blank" rel="noreferrer" style={{ color: PRIMARY, textDecoration: 'none' }}>{linkShort}</a> : '--'}
                  </span>
                  <span style={{ fontSize: '13px' }}>
                    {b.status === 'COMPLETED' ? (
                      <span style={{ color: '#F59E0B', fontWeight: 600 }}>★ 3/5</span>
                    ) : b.status === 'CONFIRMED' ? (
                      <span style={{ color: PRIMARY, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>GIVE FEEDBACK</span>
                    ) : '--'}
                  </span>
                  <span>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </span>
                  <span style={{ fontSize: '18px', color: SUB, cursor: 'pointer', textAlign: 'center' }}>⋮</span>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── CALENDAR VIEW ── */
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
            {/* Week navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span style={{ fontSize: '18px', fontWeight: 700, color: TEXT }}>{weekLabel}</span>
                <span style={{ fontSize: '12px', color: SUB, marginLeft: '14px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', hour12: true })}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setCalendarWeekOffset(w => w - 1)}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setCalendarWeekOffset(w => w + 1)}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: `1px solid ${BORDER}` }}>
              <div />
              {weekDays.map((d, i) => (
                <div key={i} style={{ padding: '10px 8px', textAlign: 'center', borderLeft: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT }}>{DAY_NAMES[i]}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>{d.getDate()}</div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div style={{ overflowY: 'auto', maxHeight: '520px', position: 'relative' }}>
              {HOURS.map(hour => (
                <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', minHeight: '56px', borderBottom: `1px solid #F1F5F9` }}>
                  <div style={{ padding: '6px 8px 0', fontSize: '11px', color: SUB, textAlign: 'right' }}>
                    {hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  {weekDays.map((d, di) => {
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    const key = `${dateStr}|${hour}`;
                    const cellBookings = calendarMap[key] ?? [];
                    return (
                      <div key={di} style={{ borderLeft: `1px solid #F1F5F9`, padding: '2px', position: 'relative' }}>
                        {cellBookings.map(b => {
                          const isCancelled = b.status === 'CANCELLED';
                          const isCompleted = b.status === 'COMPLETED';
                          return (
                            <div key={b.id} onClick={() => setFeedbackPopup(feedbackPopup === b.id ? null : b.id)}
                              style={{
                                background: isCancelled ? '#FEE2E2' : isCompleted ? '#F3F4F6' : '#EEF2FF',
                                borderLeft: `3px solid ${isCancelled ? '#DC2626' : isCompleted ? '#9CA3AF' : PRIMARY}`,
                                borderRadius: '4px', padding: '4px 6px', marginBottom: '2px', cursor: 'pointer', position: 'relative'
                              }}>
                              {isCancelled ? (
                                <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#DC2626' }}>Cancelled</p>
                              ) : (
                                <>
                                  <p style={{ margin: '0 0 1px', fontSize: '11px', fontWeight: 700, color: TEXT }}>{b.counsellorName}</p>
                                  <p style={{ margin: 0, fontSize: '10px', color: SUB, textTransform: 'uppercase' }}>{b.specialty ?? 'Counsellor'}</p>
                                </>
                              )}

                              {/* Feedback popup */}
                              {feedbackPopup === b.id && !isCancelled && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', width: '200px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginTop: '4px' }}>
                                  <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: TEXT, textAlign: 'center' }}>We Value Your Feedback</p>
                                  <button style={{ width: '100%', padding: '8px', borderRadius: '100px', border: `1.5px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                    GIVE FEEDBACK
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
