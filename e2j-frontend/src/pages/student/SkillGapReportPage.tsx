import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// @ts-ignore
import ForceGraph2DRaw from 'react-force-graph-2d';
const ForceGraph2D = ForceGraph2DRaw as any;
// @ts-ignore
import { forceCollide } from 'd3-force';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, RotateCcw, ExternalLink, TrendingUp } from 'lucide-react';
import api from '../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SkillGapResult {
  skill_clusters_w_classification?: Record<string, Record<string, [string, number, boolean][]>>;
  cluster_wise_course_recommendation?: Record<string, Record<string, { title?: string; courses?: Record<string, unknown> | unknown[] }>>;
  [key: string]: unknown;
}

interface TrendingRole  { title: string; demand: number; category: string; }

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIMARY   = '#3F41D1';
const BORDER    = '#E2E8F0';
const TEXT      = '#1E293B';
const SUB       = '#64748B';
const BG        = '#F8FAFC';

const SKILL_TYPES = ['Technical', 'Soft', 'Knowledge'] as const;

const SECTION_CONFIG: Record<string, { label: string; bg: string; border: string }> = {
  Technical:  { label: 'Technical',  bg: '#EEF2FF', border: '#C7D2FE' },
  Knowledge:  { label: 'Knowledge',  bg: '#EEF2FF', border: '#C7D2FE' },
  Soft:       { label: 'Soft Skills',bg: '#FDF4FF', border: '#E9D5FF' },
};

// ── Helper ────────────────────────────────────────────────────────────────────

function originFromUrl(url: string): string {
  try {
    const d = new URL(url).hostname.replace('www.', '');
    if (d.includes('coursera'))   return 'Coursera';
    if (d.includes('youtube'))    return 'YouTube';
    if (d.includes('edx'))        return 'edX';
    if (d.includes('udemy'))      return 'Udemy';
    if (d.includes('pluralsight'))return 'Pluralsight';
    return d.split('.')[0].charAt(0).toUpperCase() + d.split('.')[0].slice(1);
  } catch { return 'Course'; }
}

// ── Network Graph (matches reference app exactly) ─────────────────────────────

function NetworkGraph({ clusterMap, courseSkillSet }: {
  clusterMap: Record<string, [string, number, boolean][]>;
  courseSkillSet: Set<string>;
}) {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 750 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDims({ w: Math.max(width, 400), h: 750 });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const ids = new Set<string>();
    const entries = Object.entries(clusterMap);
    if (!entries.length) return { nodes: [], links: [] };

    const weights: Record<string, number> = {};
    entries.forEach(([name, skills]) => {
      if (Array.isArray(skills))
        weights[name] = skills.filter(s => Array.isArray(s) && s.length >= 3).reduce((sum, s) => sum + (s[1] as number), 0);
    });
    const top = Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n]) => n);

    const clusterRingR = Math.max(100, top.length * 20);
    top.forEach((name, i) => {
      const angle = (i / top.length) * 2 * Math.PI;
      nodes.push({
        id: name, name,
        color: '#1976D2', size: 35,
        fx: clusterRingR * Math.cos(angle),
        fy: clusterRingR * Math.sin(angle),
      });
    });

    entries.forEach(([clusterName, skills]) => {
      if (!top.includes(clusterName) || !Array.isArray(skills)) return;
      const clusterNode = nodes.find(n => n.id === clusterName);
      const valid = skills.filter(s => Array.isArray(s) && s.length >= 3);
      valid.forEach((s, idx) => {
        const [sName, w, core] = s as [string, number, boolean];
        const inCurriculum = courseSkillSet.has(sName);
        const skillId = `${clusterName}__${sName}`;
        if (!ids.has(skillId)) {
          ids.add(skillId);
          const skillAngle = (idx / Math.max(valid.length, 1)) * 2 * Math.PI;
          const skillRadius = 65 + Math.min((w as number) * 1.5, 25);
          nodes.push({
            id: skillId, name: sName,
            color: (core as boolean) ? '#43A047' : inCurriculum ? '#F59E0B' : '#EF4444',
            size: Math.min(12 + (w as number) * 2.5, 22),
            x: clusterNode.fx + skillRadius * Math.cos(skillAngle),
            y: clusterNode.fy + skillRadius * Math.sin(skillAngle),
          });
        }
        links.push({ source: clusterName, target: skillId });
      });
    });

    return { nodes, links };
  }, [clusterMap, courseSkillSet]);

  if (!graphData.nodes.length) return (
    <div style={{ textAlign: 'center', padding: '40px', color: SUB }}>No network data available</div>
  );

  const btnStyle = (disabled?: boolean): React.CSSProperties => ({
    width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${BORDER}`,
    background: '#fff', color: TEXT, fontSize: '18px', fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1,
    lineHeight: 1,
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '750px', background: '#f9fafb', borderRadius: '8px', overflow: 'hidden', width: '100%' }}>
      {/* Zoom controls */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button style={btnStyle()} onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 300)}>+</button>
        <button style={btnStyle()} onClick={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.3, 300)}>−</button>
        <button style={{ ...btnStyle(), fontSize: '11px', fontWeight: 600 }} onClick={() => graphRef.current?.zoomToFit(300, 60)}>FIT</button>
      </div>
      <ForceGraph2D
        ref={graphRef as any}
        width={dims.w}
        height={dims.h}
        graphData={graphData}
        nodeColor="color"
        nodeVal="size"
        linkColor={() => 'rgba(156,163,175,0.35)'}
        linkWidth={1.5}
        backgroundColor="#f9fafb"
        cooldownTicks={200}
        d3AlphaDecay={0.022}
        d3VelocityDecay={0.3}
        warmupTicks={80}
        onEngineStop={() => {
          graphData.nodes.forEach((n: any) => { if (!n.id.includes('__')) { n.fx = null; n.fy = null; } });
          graphRef.current?.zoomToFit(400, 60);
        }}
        d3Force={(f: any) => {
          f('charge').strength((node: any) => !node.id.includes('__') ? -250 : -90);
          f('link').distance(60).strength(0.4);
          f('collide', forceCollide().radius((d: any) => (d.size || 10) + 8).strength(1));
          f('center').x(0).y(0).strength(0.03);
        }}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const fontSize = Math.max(10 / globalScale, 5);
          const r = (node.size || 10) / globalScale;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = node.color || '#999';
          ctx.fill();
          ctx.font = `600 ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = '#374151';
          ctx.fillText(node.name, node.x, node.y + r + 2);
        }}
      />
    </div>
  );
}

// Keep BubbleSection as alias so existing call-sites compile
function BubbleSection({ title, clusterMap, courseSkillSet, bg, border }: {
  title: string;
  clusterMap: Record<string, [string, number, boolean][]>;
  courseSkillSet: Set<string>;
  bg: string;
  border: string;
  isNarrow?: boolean;
}) {
  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '8px' }}>{title}</div>
      <NetworkGraph clusterMap={clusterMap} courseSkillSet={courseSkillSet} />
    </div>
  );
}

// ── Rank List ─────────────────────────────────────────────────────────────────

function RankList({ title, items, colorDot }: {
  title: string;
  items: { label: string; pct: number }[];
  colorDot?: string;
}) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px', marginBottom: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT, marginBottom: '14px' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: BG, borderRadius: '10px', border: `1px solid ${BORDER}` }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i < 3 ? 'transparent' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: i < 3 ? '18px' : '12px', fontWeight: 700, color: '#64748B' }}>
              {i < 3 ? medals[i] : i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.label}</div>
              <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.pct}%`, background: colorDot ?? PRIMARY, borderRadius: '100px', transition: 'width 0.8s ease' }} />
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: colorDot ?? PRIMARY, flexShrink: 0 }}>{Math.round(item.pct)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trending Roles ────────────────────────────────────────────────────────────

function TrendingRoles({ targetRole }: { targetRole: string }) {
  const [roles, setRoles]     = useState<TrendingRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/student/skill-gap/trending-roles?targetRole=${encodeURIComponent(targetRole)}`)
      .then(res => setRoles(res.data.data ?? []))
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
  }, [targetRole]);

  const catColor: Record<string, string> = {
    Knowledge:     '#3F41D1',
    Practical:     '#0EA5E9',
    'Soft Skills': '#8B5CF6',
  };
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <TrendingUp size={16} color={PRIMARY} />
        <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>Top 5 Trending Job Roles</div>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: SUB }}>Fetching from AI…</div>
      ) : roles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: SUB }}>No data available.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {roles.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: BG, borderRadius: '10px', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: i < 3 ? '18px' : '13px', fontWeight: 700, color: '#64748B', flexShrink: 0, width: '24px', textAlign: 'center' as const }}>
                {i < 3 ? medals[i] : i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.title}</div>
                <div style={{ marginTop: '4px', height: '4px', background: '#E2E8F0', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.demand}%`, background: catColor[r.category] ?? PRIMARY, borderRadius: '100px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: catColor[r.category] ?? PRIMARY }}>{r.demand}%</span>
                <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '100px', background: '#EEF2FF', color: catColor[r.category] ?? PRIMARY, fontWeight: 600 }}>{r.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SkillGapReportPage() {
  const { state } = useLocation() as { state?: { targetRole?: string; reportId?: number; viewSaved?: boolean } };
  const navigate  = useNavigate();

  // If page is refreshed, state is lost — redirect to aspiration instead of starting a new analysis
  useEffect(() => {
    if (!state) navigate('/student/aspiration', { replace: true });
  }, []);

  const targetRole  = state?.targetRole ?? 'Software Developer';
  const viewSaved   = state?.viewSaved === true;
  const savedReportId = state?.reportId;

  type Phase = 'generating' | 'report' | 'saved-report';

  const [phase, setPhase]               = useState<Phase>(viewSaved ? 'saved-report' : 'generating');
  const [progress, setProgress]         = useState(0);
  const [statusMsg, setStatusMsg]       = useState('Starting analysis...');
  const [result, setResult]             = useState<SkillGapResult | null>(null);
  const [resultRaw, setResultRaw]       = useState('');
  const [saved, setSaved]               = useState(false);
  const [viewingReport, setViewingReport] = useState<SkillGapResult | null>(null);
  const [viewingRole, setViewingRole]   = useState(viewSaved ? targetRole : '');
  const [genError, setGenError]         = useState('');
  const [showCourses, setShowCourses]   = useState(false);
  const [activeTab, setActiveTab]       = useState<string>('Technical');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  const TASK_KEY = 'skillgap_running_task';

  const fetchResult = useCallback(async (tid: string) => {
    try {
      const res = await api.get(`/student/skill-gap/result/${tid}`);
      const raw = typeof res.data.data === 'string' ? res.data.data : JSON.stringify(res.data.data);
      setResultRaw(raw);
      let parsed: SkillGapResult = {};
      try { parsed = JSON.parse(raw); } catch { parsed = res.data.data ?? {}; }
      setResult(parsed);
      setPhase('report');
      localStorage.removeItem(TASK_KEY);
      api.post('/student/skill-gap/save', {
        targetRole,   // always use the original role from state — ensures upsert hits the same record
        curriculum: (parsed as any).curriculum ?? '',
        resultJson: raw,
      }).then(() => setSaved(true)).catch(() => {});
    } catch {
      setGenError('Failed to fetch report result. Please try again.');
      setPhase('generating'); setProgress(0);
    }
  }, [targetRole]);

  const startPolling = useCallback((tid: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/student/skill-gap/status/${tid}`);
        const { status, progress: prog, message } = res.data.data;
        setProgress(prog ?? 0); setStatusMsg(message ?? status);
        if (['completed', 'COMPLETED', 'finished'].includes(status)) { stopPolling(); await fetchResult(tid); }
        else if (['failed', 'FAILED', 'stopped', 'canceled'].includes(status)) {
          stopPolling(); localStorage.removeItem(TASK_KEY); setGenError(message ?? 'Analysis failed.');
        }
      } catch {}
    }, 3000);
  }, [fetchResult]);

  useEffect(() => {
    if (viewSaved && savedReportId) {
      api.get(`/student/skill-gap/reports/${savedReportId}`)
        .then(res => {
          let parsed: SkillGapResult = {};
          try { parsed = typeof res.data.data.reportJson === 'string' ? JSON.parse(res.data.data.reportJson) : res.data.data.reportJson; } catch {}
          setViewingReport(parsed);
          setViewingRole(res.data.data.targetRole ?? targetRole);
        })
        .catch(() => setGenError('Failed to load saved report.'));
      return;
    }
    let cancelled = false;

    // Resume existing task if one is already running for this role
    try {
      const stored = localStorage.getItem(TASK_KEY);
      if (stored) {
        const task = JSON.parse(stored);
        if (task.targetRole === targetRole && task.taskId) {
          setStatusMsg('Resuming analysis...');
          if (!cancelled) startPolling(task.taskId);
          return () => { cancelled = true; stopPolling(); };
        }
      }
    } catch { /* ignore */ }

    // No existing task — start fresh
    api.post('/student/skill-gap/analyze', { targetRole })
      .then(res => {
        if (!cancelled) {
          const tid = res.data.data.taskId;
          localStorage.setItem(TASK_KEY, JSON.stringify({ taskId: tid, targetRole }));
          setStatusMsg('Analysis in progress...');
          startPolling(tid);
        }
      })
      .catch(e => { if (!cancelled) setGenError(e?.response?.data?.message ?? 'Failed to start analysis.'); });
    // On unmount: stop local polling but DON'T cancel backend — it keeps running
    return () => { cancelled = true; stopPolling(); };
  }, [viewSaved, savedReportId, targetRole, startPolling]);


  const handleRetry = () => {
    stopPolling(); setGenError(''); setProgress(0); setStatusMsg('Starting analysis...'); setPhase('generating');
    api.post('/student/skill-gap/analyze', { targetRole })
      .then(res => startPolling(res.data.data.taskId))
      .catch(e => setGenError(e?.response?.data?.message ?? 'Failed to start analysis.'));
  };

  const handleCancel = () => {
    stopPolling();
    try {
      const stored = localStorage.getItem(TASK_KEY);
      if (stored) {
        const task = JSON.parse(stored);
        if (task.taskId) {
          api.delete(`/student/skill-gap/analyze/${task.taskId}`).catch(() => {});
        }
      }
    } catch { /* ignore */ }
    localStorage.removeItem(TASK_KEY);
    navigate('/student/aspiration');
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const reportData = phase === 'saved-report' ? viewingReport : result;
  const reportRole = phase === 'saved-report' ? viewingRole  : targetRole;

  // Build set of skills covered in curriculum (have course recommendations)
  const courseSkillSet = useMemo((): Set<string> => {
    if (!reportData?.cluster_wise_course_recommendation) return new Set();
    const out = new Set<string>();
    for (const type of SKILL_TYPES) {
      const clusters = reportData.cluster_wise_course_recommendation[type] ?? {};
      Object.keys(clusters).forEach(k => out.add(k));
    }
    return out;
  }, [reportData]);

  // Flat skill list with type/cluster metadata
  const allSkills = useMemo(() => {
    if (!reportData?.skill_clusters_w_classification) return [];
    const rows: { skill: string; weight: number; acquired: boolean; type: string }[] = [];
    for (const type of SKILL_TYPES) {
      const clusters = reportData.skill_clusters_w_classification[type] ?? {};
      for (const skills of Object.values(clusters)) {
        if (Array.isArray(skills)) {
          skills.forEach(s => Array.isArray(s) && s.length >= 3 && rows.push({ skill: s[0], weight: s[1], acquired: s[2], type }));
        }
      }
    }
    return rows;
  }, [reportData]);

  const maxWeight = useMemo(() => Math.max(1, ...allSkills.map(s => s.weight)), [allSkills]);

  const topDemanding = useMemo(() => {
    const seen = new Set<string>();
    return [...allSkills]
      .sort((a, b) => b.weight - a.weight)
      .filter(s => { if (seen.has(s.skill)) return false; seen.add(s.skill); return true; })
      .slice(0, 8)
      .map(s => ({ label: s.skill, pct: (s.weight / maxWeight) * 100 }));
  }, [allSkills, maxWeight]);

  const myTopSkills = useMemo(() => {
    const seen = new Set<string>();
    return [...allSkills]
      .filter(s => s.acquired)
      .sort((a, b) => b.weight - a.weight)
      .filter(s => { if (seen.has(s.skill)) return false; seen.add(s.skill); return true; })
      .slice(0, 8)
      .map(s => ({ label: s.skill, pct: (s.weight / maxWeight) * 100 }));
  }, [allSkills, maxWeight]);

  const availableTypes = useMemo(() =>
    SKILL_TYPES.filter(t => Object.keys(reportData?.skill_clusters_w_classification?.[t] ?? {}).length > 0),
    [reportData]);

  const courseList = useMemo(() => {
    if (!reportData?.cluster_wise_course_recommendation) return [];
    const out: { clusterName: string; category: string; name: string; url: string }[] = [];
    for (const type of SKILL_TYPES) {
      const clusters = reportData.cluster_wise_course_recommendation[type] ?? {};
      for (const [clusterKey, cd] of Object.entries(clusters)) {
        if (typeof cd !== 'object' || !cd) continue;
        const courses = (cd as any).courses ?? {};
        for (const [category, list] of Object.entries(courses)) {
          const items: [string, string][] = typeof list === 'string' ? [[category, list]]
            : Array.isArray(list) ? list.map((c: unknown) => Array.isArray(c) ? c as [string, string] : [String(c), String(c)])
            : typeof list === 'object' && list ? Object.entries(list as Record<string, string>)
            : [];
          items.forEach(([name, url]) => out.push({ clusterName: (cd as any).title ?? clusterKey, category, name, url }));
        }
      }
    }
    return out;
  }, [reportData]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px', minHeight: '100%', background: BG }}>
      <style>{`@keyframes pulse{from{opacity:.3;transform:scale(.8)}to{opacity:1;transform:scale(1.1)}}`}</style>

      <button onClick={() => {
        stopPolling();
        navigate('/student/aspiration');
      }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: 0, marginBottom: '20px' }}>
        <ChevronLeft size={18} /> Back to Aspiration
      </button>

      {/* ── Generating ── */}
      {phase === 'generating' && (
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ fontSize: '36px' }}>🧠</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: TEXT, marginBottom: '8px' }}>Generating Your Skill Gap Report</h2>
          <p style={{ fontSize: '13px', color: SUB, marginBottom: '32px' }}>
            Analysing your resume against <strong style={{ color: PRIMARY }}>{targetRole}</strong> requirements. This may take 1–3 minutes.
          </p>
          {genError ? (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <AlertCircle size={24} color="#EF4444" style={{ margin: '0 auto 8px', display: 'block' }} />
              <p style={{ fontSize: '13px', color: '#DC2626', margin: '0 0 16px' }}>{genError}</p>
              <button onClick={handleRetry} style={{ padding: '10px 24px', background: PRIMARY, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={14} /> Try Again
              </button>
            </div>
          ) : (
            <>
              <div style={{ background: '#E2E8F0', borderRadius: '100px', height: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '100px', background: `linear-gradient(90deg,${PRIMARY},#818CF8)`, width: `${Math.max(5, progress)}%`, transition: 'width 0.5s ease' }} />
              </div>
              <p style={{ fontSize: '12px', color: SUB, marginBottom: '24px' }}>{progress}% — {statusMsg}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '28px' }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: PRIMARY, animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite alternate`, opacity: 0.5 }} />)}
              </div>
              <button onClick={handleCancel}
                style={{ padding: '9px 24px', borderRadius: '100px', border: `1.5px solid #EF4444`, background: '#fff', color: '#EF4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel Analysis
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Report ── */}
      {(phase === 'report' || phase === 'saved-report') && reportData && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Banner */}
          <div style={{ background: `linear-gradient(135deg,${PRIMARY} 0%,#818CF8 100%)`, borderRadius: '16px', padding: '24px 28px', marginBottom: '20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '11px', opacity: 0.8, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Skill Readiness Report</p>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>{reportRole}</h2>
              {phase === 'report' && saved && <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '20px', marginTop: '6px', display: 'inline-block' }}>✓ Auto-saved</span>}
            </div>
            {courseList.length > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Skill Analysis', 'Courses'].map(tab => {
                  const active = tab === 'Courses' ? showCourses : !showCourses;
                  return (
                    <button key={tab} onClick={() => setShowCourses(tab === 'Courses')}
                      style={{ padding: '8px 18px', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.5)', background: active ? '#fff' : 'transparent', color: active ? PRIMARY : '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      {tab}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Skill Analysis ── */}
          {!showCourses && (
            <div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '14px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>Skill Readiness</span>
                {[
                  { color: '#43A047', label: 'Skills Acquired' },
                  { color: '#F59E0B', label: 'Required And Covered In Curriculum' },
                  { color: '#EF4444', label: 'Not Acquired' },
                  { color: '#1976D2', label: 'Skill Cluster' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: SUB }}>{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {availableTypes.map(type => {
                  const cfg = SECTION_CONFIG[type] ?? SECTION_CONFIG.Technical;
                  const active = activeTab === type;
                  return (
                    <button key={type} onClick={() => setActiveTab(type)}
                      style={{ padding: '8px 20px', borderRadius: '8px', border: `1.5px solid ${active ? PRIMARY : BORDER}`, background: active ? PRIMARY : '#fff', color: active ? '#fff' : TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Network graph for active tab */}
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '16px' }}>
                <NetworkGraph
                  clusterMap={reportData.skill_clusters_w_classification![activeTab] ?? {}}
                  courseSkillSet={courseSkillSet}
                />
              </div>

              {/* Rankings below */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' as const }}>
                {topDemanding.length > 0 && (
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <RankList title="Top Demanding Skills For Role" items={topDemanding} />
                  </div>
                )}
                {myTopSkills.length > 0 && (
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <RankList title="Top Skills I Have" items={myTopSkills} colorDot="#22C55E" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <TrendingRoles targetRole={reportRole} />
                </div>
              </div>
            </div>
          )}

          {/* ── Courses ── */}
          {showCourses && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '22px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: '0 0 18px' }}>Course Recommendations ({courseList.length})</h3>
              {courseList.length === 0 ? (
                <p style={{ color: '#94A3B8', textAlign: 'center', padding: '32px 0', margin: 0 }}>No course recommendations available.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
                  {courseList.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: '14px', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '14px', background: BG }}>
                      <div style={{ width: '54px', height: '54px', borderRadius: '8px', background: 'linear-gradient(135deg,#EEF2FF,#C7D2FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '24px' }}>📚</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: TEXT, lineHeight: 1.4 }}>{c.name}</h4>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: '#F1F5F9', color: SUB, whiteSpace: 'nowrap', flexShrink: 0 }}>{originFromUrl(c.url)}</span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 8px' }}>{c.clusterName} · {c.category}</p>
                        <a href={c.url} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: PRIMARY, borderRadius: '20px', color: '#fff', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                          View <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
