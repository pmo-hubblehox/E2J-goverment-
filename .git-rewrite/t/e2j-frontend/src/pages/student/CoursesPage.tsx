import { useState, useEffect } from 'react';
import { Search, Star, Clock, BookOpen, X, Play, ExternalLink, Zap } from 'lucide-react';
import api from '../../services/api';

type Tab = 'all' | 'institute' | 'recommended';

interface Course {
  id: number;
  title: string;
  instructor: string;
  rating: number;
  students: number;
  duration: string;
  price: number | null;
  type: 'INSTITUTE' | 'EXTERNAL';
  category: string;
  skills: string[];
  targetRoles: string[];
  score: number;
  matchPct: number;
}

interface YTVideo {
  id: string;
  title: string;
  channel: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
  embedUrl: string;
}

interface SkillGapCourse {
  name: string;
  url: string;
  cluster: string;
  targetRole: string;
  origin: string;
}

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Courses' },
  { key: 'institute', label: 'Institute Courses' },
  { key: 'recommended', label: '✦ Recommended For You' },
];

const SKILL_TYPES = ['Technical', 'Soft', 'Knowledge'];

function originFromUrl(url: string): string {
  try {
    const d = new URL(url).hostname.replace('www.', '');
    if (d.includes('coursera')) return 'Coursera';
    if (d.includes('youtube') || d.includes('youtu.be')) return 'YouTube';
    if (d.includes('udemy')) return 'Udemy';
    if (d.includes('edx')) return 'edX';
    if (d.includes('linkedin')) return 'LinkedIn';
    if (d.includes('pluralsight')) return 'Pluralsight';
    return 'External';
  } catch { return 'External'; }
}

function extractSkillGapCourses(reportJson: string, targetRole: string): SkillGapCourse[] {
  try {
    const parsed = typeof reportJson === 'string' ? JSON.parse(reportJson) : reportJson;
    const recs = parsed.cluster_wise_course_recommendation ?? {};
    const courses: SkillGapCourse[] = [];
    for (const skillType of SKILL_TYPES) {
      const clusters = recs[skillType] ?? {};
      for (const [clusterKey, cd] of Object.entries(clusters as Record<string, unknown>)) {
        if (!cd || typeof cd !== 'object') continue;
        const clusterTitle = (cd as Record<string, unknown>).title as string ?? clusterKey;
        const coursesObj = (cd as Record<string, unknown>).courses ?? {};
        for (const [, list] of Object.entries(coursesObj as Record<string, unknown>)) {
          const items: [string, string][] = typeof list === 'string' ? [[list, list]]
            : Array.isArray(list) ? list.map((c: unknown) => Array.isArray(c) ? c as [string, string] : [String(c), String(c)])
            : typeof list === 'object' && list ? Object.entries(list as Record<string, string>)
            : [];
          for (const [name, url] of items) {
            if (!name || !url) continue;
            courses.push({ name, url, cluster: clusterTitle, targetRole, origin: originFromUrl(url) });
          }
        }
      }
    }
    return courses;
  } catch {
    return [];
  }
}

export default function CoursesPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [ytVideos, setYtVideos] = useState<YTVideo[]>([]);
  const [sgCourses, setSgCourses] = useState<SkillGapCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [aspirationFilter, setAspirationFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    setPlayingId(null);
    if (tab === 'all') {
      // All Courses = YouTube recommended videos
      api.get('/student/courses/youtube/recommended')
        .then(r => setYtVideos(r.data.data ?? []))
        .catch(() => setYtVideos([]))
        .finally(() => setLoading(false));
    } else if (tab === 'recommended') {
      // Recommended = courses from skill gap reports for ACTIVE aspirations only
      Promise.all([
        api.get('/student/skill-gap/reports'),
        api.get('/student/aspirations'),
      ])
        .then(async ([reportsRes, aspirationsRes]) => {
          const reports: { id: number; targetRole: string }[] = reportsRes.data?.data ?? [];
          const aspirations: { roleArea: string; goal: string }[] = aspirationsRes.data?.data ?? [];
          // Only keep roles that still have an active non-explore aspiration
          const activeRoles = new Set(
            aspirations
              .filter(a => a.goal !== 'explore')
              .map(a => a.roleArea)
          );
          const activeReports = reports.filter(rp => activeRoles.has(rp.targetRole));
          if (activeReports.length === 0) { setSgCourses([]); return; }
          const all: SkillGapCourse[] = [];
          await Promise.all(activeReports.slice(0, 5).map(async rp => {
            try {
              const detail = await api.get(`/student/skill-gap/reports/${rp.id}`);
              const json: string = detail.data?.data?.reportJson ?? '';
              if (json) all.push(...extractSkillGapCourses(json, rp.targetRole));
            } catch { /* skip */ }
          }));
          // deduplicate by URL
          const seen = new Set<string>();
          setSgCourses(all.filter(c => { if (seen.has(c.url)) return false; seen.add(c.url); return true; }));
        })
        .catch(() => setSgCourses([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tab]);

  const handleYTSearch = (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    api.get('/student/courses/youtube/search', { params: { q } })
      .then(r => setYtVideos(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const filteredYT = ytVideos.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.channel.toLowerCase().includes(search.toLowerCase())
  );

  const aspirationRoles = Array.from(new Set(sgCourses.map(c => c.targetRole)));

  const filteredSG = sgCourses.filter(c => {
    const matchRole = aspirationFilter === 'all' || c.targetRole === aspirationFilter;
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cluster.toLowerCase().includes(search.toLowerCase()) ||
      c.targetRole.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div style={{ padding: '24px', minHeight: '100%' }}>

      {/* placeholder for removed toast */}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Courses</h1>
        <span style={{ fontSize: '12px', color: '#64748B' }}>
          {tab === 'recommended' ? `${filteredSG.length} course${filteredSG.length !== 1 ? 's' : ''} found` : `${filteredYT.length} video${filteredYT.length !== 1 ? 's' : ''} found`}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', borderRadius: '12px', padding: '4px', width: 'fit-content', marginBottom: '20px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: tab === t.key ? '#fff' : 'transparent',
            color: tab === t.key ? '#4F46E5' : '#64748B',
            fontSize: '13px', fontWeight: tab === t.key ? 600 : 400,
            cursor: 'pointer',
            boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '560px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && tab === 'all') handleYTSearch(search); }}
            placeholder={tab === 'all' ? 'Search YouTube courses… (Enter to search)' : tab === 'recommended' ? 'Search by course name, cluster or role…' : 'Search…'}
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: '36px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px',
              border: '1px solid #E2E8F0', borderRadius: '10px',
              fontSize: '13px', color: '#1E293B', outline: 'none', background: '#fff',
            }}
          />
        </div>
        {tab === 'all' && (
          <button
            onClick={() => handleYTSearch(search)}
            style={{ padding: '10px 18px', background: '#4338CA', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Search
          </button>
        )}
      </div>

      {/* All Courses banner */}
      {tab === 'all' && !loading && (
        <div style={{ borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none" style={{ flexShrink: 0 }}>
            <rect width="28" height="20" rx="4" fill="white" fillOpacity="0.2"/>
            <path d="M11 6l8 4-8 4V6z" fill="white"/>
          </svg>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: '0 0 2px' }}>YouTube Courses — Powered By Your Profile</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: 0 }}>Videos matched to your skills and career goals. Click to watch inline or open on YouTube.</p>
          </div>
        </div>
      )}

      {/* Recommended banner + filter */}
      {tab === 'recommended' && !loading && (
        <>
          <div style={{ borderRadius: '14px', padding: '16px 20px', marginBottom: '16px', background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Zap size={24} color="#fff" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: '0 0 2px' }}>Skill Gap Recommendations — From Your Aspiration Analysis</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: 0 }}>Courses curated by AI based on your skill gap reports. Click to open the course.</p>
            </div>
          </div>

          {/* Aspiration filter pills */}
          {aspirationRoles.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Filter by aspiration:</span>
              <button onClick={() => setAspirationFilter('all')}
                style={{ padding: '5px 14px', borderRadius: '100px', border: `1.5px solid ${aspirationFilter === 'all' ? '#7C3AED' : '#E2E8F0'}`, background: aspirationFilter === 'all' ? '#7C3AED' : '#fff', color: aspirationFilter === 'all' ? '#fff' : '#64748B', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                All ({sgCourses.length})
              </button>
              {aspirationRoles.map(role => (
                <button key={role} onClick={() => setAspirationFilter(role)}
                  style={{ padding: '5px 14px', borderRadius: '100px', border: `1.5px solid ${aspirationFilter === role ? '#7C3AED' : '#E2E8F0'}`, background: aspirationFilter === role ? '#7C3AED' : '#fff', color: aspirationFilter === role ? '#fff' : '#64748B', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {role} ({sgCourses.filter(c => c.targetRole === role).length})
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: '260px', background: '#F1F5F9', borderRadius: '16px' }} />
          ))}
        </div>

      ) : tab === 'recommended' ? (
        /* ── Skill Gap courses grid ── */
        filteredSG.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '64px 0', textAlign: 'center' }}>
            <Zap size={44} color="#CBD5E1" strokeWidth={1.2} />
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>No recommendations yet</p>
            <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0, maxWidth: '320px' }}>Run a Skill Gap Analysis from your Aspiration page to get personalized course recommendations.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filteredSG.map((c, i) => (
              <SkillGapCourseCard key={`${c.url}-${i}`} course={c} gradient={GRADIENTS[i % GRADIENTS.length]} />
            ))}
          </div>
        )

      ) : tab === 'all' ? (
        /* ── YouTube grid ── */
        filteredYT.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '64px 0', textAlign: 'center' }}>
            <Play size={44} color="#CBD5E1" strokeWidth={1.2} />
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>No videos found</p>
            <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0, maxWidth: '320px' }}>Add your YouTube API key in application.yml, or complete your profile to get recommendations.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredYT.map(v => (
              <YouTubeCard key={v.id} video={v} playing={playingId === v.id} onPlay={() => setPlayingId(playingId === v.id ? null : v.id)} />
            ))}
          </div>
        )

      ) : (
        /* ── Institute tab placeholder ── */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '64px 0', textAlign: 'center' }}>
          <BookOpen size={44} color="#CBD5E1" strokeWidth={1.2} />
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>No institute courses available</p>
        </div>
      )}
    </div>
  );
}

function YouTubeCard({ video: v, playing, onPlay }: { video: YTVideo; playing: boolean; onPlay: () => void }) {
  const publishedYear = v.publishedAt ? new Date(v.publishedAt).getFullYear() : '';
  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      {/* Thumbnail / embed */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000', cursor: 'pointer' }} onClick={onPlay}>
        {playing ? (
          <iframe
            src={`${v.embedUrl}?autoplay=1`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={v.title}
          />
        ) : (
          <>
            <img src={v.thumbnail} alt={v.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FF0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={20} color="#fff" fill="#fff" />
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '14px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', margin: '0 0 4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {v.title}
        </p>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 10px' }}>{v.channel}{publishedYear ? ` · ${publishedYear}` : ''}</p>
        <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 12px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {v.description}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onPlay}
            style={{ flex: 1, padding: '8px', background: '#FF0000', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
          >
            <Play size={12} fill="#fff" /> {playing ? 'Close' : 'Watch Now'}
          </button>
          <a
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 12px', background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#64748B', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          >
            <ExternalLink size={12} /> YouTube
          </a>
        </div>
      </div>
    </div>
  );
}

function SkillGapCourseCard({ course: c, gradient }: { course: SkillGapCourse; gradient: string }) {
  const originColor: Record<string, string> = {
    Coursera: '#0056D3', YouTube: '#FF0000', Udemy: '#A435F0',
    edX: '#02262B', LinkedIn: '#0A66C2', External: '#475569',
  };
  const color = originColor[c.origin] ?? '#475569';
  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ height: '120px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <BookOpen size={32} color="rgba(255,255,255,0.7)" strokeWidth={1.2} />
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: color, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px' }}>
          {c.origin}
        </div>
      </div>
      <div style={{ padding: '14px' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{c.cluster}</p>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', margin: '0 0 4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.name}</p>
        <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 12px' }}>For: {c.targetRole}</p>
        <a href={c.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', boxSizing: 'border-box', padding: '9px', background: '#4338CA', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
          <ExternalLink size={12} /> Open Course
        </a>
      </div>
    </div>
  );
}

function CourseCard({ course: c, gradient, showMatch, onEnroll }: {
  course: Course;
  gradient: string;
  showMatch: boolean;
  onEnroll: () => void;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}>
      {/* Thumbnail */}
      <div style={{ height: '140px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <BookOpen size={36} color="rgba(255,255,255,0.7)" strokeWidth={1.2} />

        {/* Type badge */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          background: c.type === 'INSTITUTE' ? 'rgba(79,70,229,0.9)' : 'rgba(15,118,110,0.9)',
          color: '#fff', fontSize: '10px', fontWeight: 600,
          padding: '3px 8px', borderRadius: '20px',
        }}>
          {c.type === 'INSTITUTE' ? 'Institute' : 'External'}
        </div>

        {/* Match % badge */}
        {showMatch && c.matchPct > 0 && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: c.matchPct >= 60 ? 'rgba(22,163,74,0.92)' : c.matchPct >= 30 ? 'rgba(245,158,11,0.92)' : 'rgba(100,116,139,0.85)',
            color: '#fff', fontSize: '11px', fontWeight: 700,
            padding: '4px 9px', borderRadius: '20px',
          }}>
            {c.matchPct}% match
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        {/* Category */}
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{c.category}</p>

        {/* Title */}
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', margin: '0 0 4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {c.title}
        </p>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 10px' }}>{c.instructor}</p>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
          <Star size={12} color="#FBBF24" fill="#FBBF24" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>{c.rating}</span>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>({c.students?.toLocaleString()})</span>
          <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Clock size={10} /> {c.duration}
          </span>
        </div>

        {/* Skill tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
          {c.skills.slice(0, 3).map(s => (
            <span key={s} style={{ fontSize: '10px', background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>
              {s}
            </span>
          ))}
          {c.skills.length > 3 && (
            <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: '20px' }}>
              +{c.skills.length - 3}
            </span>
          )}
        </div>

        {/* Price + Enroll */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: c.price ? '#1E293B' : '#16A34A' }}>
            {c.price ? `₹${c.price.toLocaleString()}` : 'Free'}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onEnroll(); }}
            style={{
              padding: '8px 20px', border: 'none', borderRadius: '24px',
              background: '#4338CA', color: '#fff',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
}
