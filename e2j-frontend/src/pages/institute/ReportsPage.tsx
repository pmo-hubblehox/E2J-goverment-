import { useState } from 'react';
import { Download, FileText, Filter, ChevronDown } from 'lucide-react';
import { downloadCSV } from '../../utils/csvExport';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const REPORT_TYPES = [
  { key: 'placement', label: 'Placement Report', icon: '📊' },
  { key: 'faculty', label: 'Faculty Utilization', icon: '👥' },
  { key: 'infra', label: 'Infrastructure Usage', icon: '🏢' },
  { key: 'skill', label: 'Skill Gap Report', icon: '📈' },
];

const PLACEMENT_DATA = [
  { month: 'Jan', placed: 12, target: 20 },
  { month: 'Feb', placed: 18, target: 20 },
  { month: 'Mar', placed: 25, target: 25 },
  { month: 'Apr', placed: 30, target: 30 },
  { month: 'May', placed: 28, target: 35 },
  { month: 'Jun', placed: 38, target: 35 },
];

const RECENT_REPORTS = [
  { name: 'Placement Report Q1 2025', date: 'Apr 1, 2025', size: '2.4 MB', type: 'PDF' },
  { name: 'Faculty Utilization March 2025', date: 'Mar 31, 2025', size: '1.1 MB', type: 'Excel' },
  { name: 'Infrastructure Usage Q1', date: 'Apr 1, 2025', size: '0.8 MB', type: 'PDF' },
  { name: 'Skill Gap Assessment 2025', date: 'Mar 15, 2025', size: '3.2 MB', type: 'PDF' },
];

const col: React.CSSProperties = { padding: '13px 16px', fontSize: '13px', color: '#1E293B', borderBottom: '1px solid #F1F5F9' };
const hcol: React.CSSProperties = { padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' as const };

const PERIODS = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'H1 2025', 'H2 2025', 'Full Year 2025'];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('placement');
  const [period, setPeriod] = useState('Q1 2025');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [reportTypeFilter, setReportTypeFilter] = useState('');

  const filteredChartData = PLACEMENT_DATA; // chart uses static data; filter applied via period label

  const handleDownload = () => {
    const label = REPORT_TYPES.find(r => r.key === activeReport)?.label ?? activeReport;
    downloadCSV(`${activeReport}_report_${period.replace(/\s+/g, '_')}.csv`,
      ['Month', 'Actual', 'Target'],
      filteredChartData.map(d => [d.month, d.placed, d.target])
    );
  };

  return (
    <div style={{ padding: '20px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
        <span>Home</span><span>›</span><span style={{ color: '#1E293B', fontWeight: 500 }}>Reports</span>
      </div>
      {/* Report type cards */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {REPORT_TYPES.map(r => (
          <button key={r.key} onClick={() => setActiveReport(r.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 180px', padding: '14px 18px', background: '#fff', border: `2px solid ${activeReport === r.key ? '#4F46E5' : '#E2E8F0'}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: '22px' }}>{r.icon}</span>
            <span style={{ fontSize: '13px', fontWeight: activeReport === r.key ? 700 : 500, color: activeReport === r.key ? '#4F46E5' : '#1E293B' }}>{r.label}</span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilterPanel(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${showFilterPanel || reportTypeFilter ? '#4F46E5' : '#E2E8F0'}`, borderRadius: '8px', background: showFilterPanel || reportTypeFilter ? '#EEF2FF' : '#fff', padding: '9px 14px', fontSize: '13px', color: showFilterPanel || reportTypeFilter ? '#4F46E5' : '#64748B', cursor: 'pointer' }}>
            <Filter size={13} /> Filter {reportTypeFilter && `(${reportTypeFilter})`}
          </button>
          {showFilterPanel && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '12px', minWidth: '200px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', margin: '0 0 8px' }}>Report Type</p>
              {[{ key: '', label: 'All' }, ...REPORT_TYPES.map(r => ({ key: r.key, label: r.label }))].map(r => (
                <label key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer', fontSize: '13px', color: '#1E293B' }}>
                  <input type="radio" name="reportFilter" checked={reportTypeFilter === r.key} onChange={() => { setReportTypeFilter(r.key); setActiveReport(r.key || 'placement'); setShowFilterPanel(false); }} style={{ accentColor: '#4F46E5' }} />
                  {r.label}
                </label>
              ))}
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowPeriodMenu(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', padding: '9px 14px', fontSize: '13px', color: '#1E293B', cursor: 'pointer', fontWeight: 500 }}>
            {period} <ChevronDown size={13} />
          </button>
          {showPeriodMenu && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '160px' }}>
              {PERIODS.map(p => (
                <div key={p} onClick={() => { setPeriod(p); setShowPeriodMenu(false); }}
                  style={{ padding: '9px 14px', fontSize: '13px', cursor: 'pointer', background: period === p ? '#EEF2FF' : '#fff', color: period === p ? '#4F46E5' : '#1E293B', fontWeight: period === p ? 600 : 400 }}>
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '20px', background: '#4F46E5', color: '#fff', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
          <Download size={14} /> Download Report
        </button>
      </div>

      {/* Chart */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 22px', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', margin: '0 0 16px' }}>
          {REPORT_TYPES.find(r => r.key === activeReport)?.label} — {period}
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={PLACEMENT_DATA}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="placed" fill="#4F46E5" name="Actual" radius={[4, 4, 0, 0]} />
            <Bar dataKey="target" fill="#E2E8F0" name="Target" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent reports table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E2E8F0' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Recent Reports</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Report Name', 'Generated On', 'Size', 'Format', ''].map(h => <th key={h} style={hcol}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {RECENT_REPORTS.map(r => (
              <tr key={r.name}>
                <td style={col}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} style={{ color: '#4F46E5', flexShrink: 0 }} />
                    <span style={{ fontWeight: 500 }}>{r.name}</span>
                  </div>
                </td>
                <td style={{ ...col, color: '#64748B' }}>{r.date}</td>
                <td style={{ ...col, color: '#64748B' }}>{r.size}</td>
                <td style={col}>
                  <span style={{ background: r.type === 'PDF' ? '#FEF3C7' : '#DCFCE7', color: r.type === 'PDF' ? '#D97706' : '#16A34A', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>{r.type}</span>
                </td>
                <td style={col}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: '12px', fontWeight: 500 }}>
                    <Download size={13} /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
