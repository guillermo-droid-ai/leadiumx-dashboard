'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import of charts (no SSR) to avoid recharts SSR issues
const WeeklyTrendChart = dynamic(() => import('./Charts').then(m => m.WeeklyTrendChart), { ssr: false, loading: () => <ChartSkeleton /> });
const OutcomesPieChart  = dynamic(() => import('./Charts').then(m => m.OutcomesPieChart),  { ssr: false, loading: () => <ChartSkeleton /> });
const AgentBarChart     = dynamic(() => import('./Charts').then(m => m.AgentBarChart),     { ssr: false, loading: () => <ChartSkeleton /> });
const HourBarChart      = dynamic(() => import('./Charts').then(m => m.HourBarChart),      { ssr: false, loading: () => <ChartSkeleton /> });

// ── Constants ────────────────────────────────────────────────────────────────
const GHL_BASE = 'https://app.gohighlevel.com/v2/location/4fJ871nY9iRQZaeghss5/contacts/detail';

const AGENT_OPTIONS = [
  { value: '', label: 'All Agents' },
  { value: 'agent_989c4ddee680266bc1ec669f70', label: 'Amy — New Leads' },
  { value: 'agent_9c1c9db02cde1c74f4f68ce368', label: 'Olivia — Follow-Up' },
  { value: 'agent_6d04e046d5904146beda8498af', label: 'Sofie — Long Term' },
  { value: 'agent_77096474763bfd669bf485c410', label: 'Amy — After Hours' },
  { value: 'agent_89847ed45169b8ad61aba152e8', label: 'Olivia — Inbound' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'booked', label: 'Booked' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'callback_requested', label: 'Callback Requested' },
  { value: 'interested_no_booking', label: 'Interested — No Booking' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'do_not_call', label: 'Do Not Call' },
  { value: 'call_dropped', label: 'Call Dropped' },
  { value: 'call_dropped_possible_lead', label: 'Dropped (Possible Lead)' },
  { value: 'exhausted', label: 'Exhausted' },
  { value: 'location_sold', label: 'Location Sold' },
  { value: 'never_selling', label: 'Never Selling' },
  { value: 'calling', label: 'Calling' },
  { value: 'pending', label: 'Pending' },
  { value: 'other', label: 'Other' },
];

const AGENT_LABELS: Record<string, string> = {
  agent_989c4ddee680266bc1ec669f70: 'Amy — New Leads',
  agent_9c1c9db02cde1c74f4f68ce368: 'Olivia — Follow-Up',
  agent_17bae54a0f2ec5d6b2ed5857:   'Olivia — Follow-Up',
  agent_6d04e046d5904146beda8498af: 'Sofie — Long Term',
  agent_77096474763bfd669bf485c410: 'Amy — After Hours',
  agent_89847ed45169b8ad61aba152e8: 'Olivia — Inbound',
};

// ── Types ────────────────────────────────────────────────────────────────────
interface Call {
  id: string;
  call_id: string;
  phone: string;
  agent_id: string;
  status: string;
  duration_seconds: number;
  created_at: string;
  transcript: string | null;
  recording_url: string | null;
  sf_lead_id: string | null;
  ghl_contact_id: string | null;
  ai_summary: string | null;
  agent_type: string | null;
  follow_up_count: number;
}

interface Stats {
  kpis: {
    totalLeads: number; totalCalls: number; booked: number; dnc: number;
    totalSms: number; avgAttempts: string; ahCalls: number;
    totalTalkMinutes: number; avgDuration: number;
  };
  statusBreakdownTop5: { status: string; count: number }[];
  weeklyTrend: { week: string; calls: number; booked: number }[];
  callsByHour: { hour: number; count: number }[];
  outcomesByAgent: { label: string; answered: number; voicemail: number; noAnswer: number; booked: number; total: number }[];
  avgDurationByAgent: Record<string, number>;
}

interface Filters {
  from: string;
  to: string;
  agentId: string;
  status: string;
  q: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function defaultFrom(days = 90) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}
function today() { return new Date().toISOString().split('T')[0]; }

function formatDuration(secs: number): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTalkTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    booked:                    'background:#22c55e;color:#fff',
    voicemail:                 'background:#f59e0b;color:#000',
    no_answer:                 'background:#475569;color:#fff',
    do_not_call:               'background:#ef4444;color:#fff',
    not_interested:            'background:#ef4444;color:#fff',
    calling:                   'background:#3b82f6;color:#fff',
    callback_requested:        'background:#6366f1;color:#fff',
    interested_no_booking:     'background:#6366f1;color:#fff',
    call_dropped:              'background:#dc2626;color:#fff',
    call_dropped_possible_lead:'background:#f97316;color:#fff',
    exhausted:                 'background:#78716c;color:#fff',
    location_sold:             'background:#0ea5e9;color:#fff',
    never_selling:             'background:#7c3aed;color:#fff',
    pending:                   'background:#334155;color:#aaa',
    other:                     'background:#334155;color:#aaa',
  };
  const style = styles[status] || 'background:#334155;color:#aaa';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <span style={{ ...parseStyle(style), padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function parseStyle(s: string): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const part of s.split(';')) {
    const [k, v] = part.split(':');
    if (k && v) obj[k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v.trim();
  }
  return obj;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: '#1a1d27', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4, borderLeft: accent ? `3px solid ${accent}` : undefined }}>
      <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: accent || '#e2e8f0', margin: 0, lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{sub}</p>}
    </div>
  );
}

// ── Chart Skeleton ────────────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
      Loading chart…
    </div>
  );
}

// ── Side Drawer ───────────────────────────────────────────────────────────────
function Drawer({ call, onClose }: { call: Call; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyPhone() {
    navigator.clipboard.writeText(call.phone || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
      />
      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '95vw',
        background: '#1a1d27', zIndex: 50, overflowY: 'auto',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#64748b', fontSize: 13 }}>Call Details</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Phone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{call.phone || 'N/A'}</span>
          <button
            onClick={copyPhone}
            style={{ background: '#2d3148', border: 'none', color: copied ? '#22c55e' : '#94a3b8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>

        {/* Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#0f1117', borderRadius: 8, padding: '10px 14px' }}>
            <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 4px' }}>AGENT</p>
            <p style={{ color: '#e2e8f0', fontSize: 13, margin: 0 }}>{AGENT_LABELS[call.agent_id] || call.agent_id || '—'}</p>
          </div>
          <div style={{ background: '#0f1117', borderRadius: 8, padding: '10px 14px' }}>
            <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 4px' }}>STATUS</p>
            <StatusBadge status={call.status} />
          </div>
          <div style={{ background: '#0f1117', borderRadius: 8, padding: '10px 14px' }}>
            <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 4px' }}>DATE</p>
            <p style={{ color: '#e2e8f0', fontSize: 13, margin: 0 }}>
              {call.created_at ? new Date(call.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
          <div style={{ background: '#0f1117', borderRadius: 8, padding: '10px 14px' }}>
            <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 4px' }}>DURATION</p>
            <p style={{ color: '#e2e8f0', fontSize: 13, margin: 0 }}>{formatDuration(call.duration_seconds)}</p>
          </div>
        </div>

        {/* Recording */}
        <div>
          <p style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Recording</p>
          {call.recording_url ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <audio controls src={call.recording_url} style={{ width: '100%', borderRadius: 8 }} />
              <a
                href={call.recording_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', background: '#2d3148', color: '#94a3b8', borderRadius: 6, padding: '6px 12px', fontSize: 12, textDecoration: 'none', textAlign: 'center' }}
              >
                ⬇ Download Recording
              </a>
            </div>
          ) : (
            <p style={{ color: '#475569', fontSize: 13, fontStyle: 'italic' }}>No recording available</p>
          )}
        </div>

        {/* AI Summary */}
        {call.ai_summary && (
          <div>
            <p style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>AI Summary</p>
            <div style={{ background: '#0f1117', borderRadius: 8, padding: 14, fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
              {call.ai_summary}
            </div>
          </div>
        )}

        {/* Transcript */}
        {call.transcript && (
          <div>
            <p style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Transcript</p>
            <div style={{
              background: '#0f1117', borderRadius: 8, padding: 14, fontSize: 12, color: '#94a3b8',
              maxHeight: 300, overflowY: 'auto', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {call.transcript}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
          {call.ghl_contact_id && (
            <a
              href={`${GHL_BASE}/${call.ghl_contact_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, background: '#6366f1', color: '#fff', borderRadius: 8, padding: '10px 0',
                textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 600,
              }}
            >
              🔗 Open in GHL
            </a>
          )}
          <button
            onClick={copyPhone}
            style={{
              flex: 1, background: '#2d3148', border: 'none', color: '#e2e8f0', borderRadius: 8, padding: '10px 0',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy Phone'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Select & Input helpers ────────────────────────────────────────────────────
const selectStyle: React.CSSProperties = {
  background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 8, color: '#e2e8f0',
  padding: '8px 12px', fontSize: 13, outline: 'none', cursor: 'pointer',
};
const inputStyle: React.CSSProperties = {
  ...selectStyle, minWidth: 180,
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardV2() {
  // Filters
  const [filters, setFilters] = useState<Filters>({
    from: defaultFrom(90), to: today(), agentId: '', status: '', q: '',
  });

  // Stats
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Calls table
  const [calls, setCalls] = useState<Call[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [callsLoading, setCallsLoading] = useState(true);
  const PER_PAGE = 50;

  // Drawer
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  // ── Fetch stats ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const p = new URLSearchParams({ from: filters.from, to: filters.to });
      if (filters.agentId) p.set('agent_id', filters.agentId);
      const r = await fetch(`/api/stats?${p}`);
      setStats(await r.json());
    } catch (e) { console.error(e); }
    finally { setStatsLoading(false); }
  }, [filters.from, filters.to, filters.agentId]);

  // ── Fetch calls ──────────────────────────────────────────────────────────
  const fetchCalls = useCallback(async (pg: number) => {
    setCallsLoading(true);
    try {
      const p = new URLSearchParams({
        page: String(pg), per_page: String(PER_PAGE),
        from: filters.from, to: filters.to,
      });
      if (filters.agentId) p.set('agent_id', filters.agentId);
      if (filters.status)  p.set('status', filters.status);
      if (filters.q)       p.set('q', filters.q);
      const r = await fetch(`/api/calls?${p}`);
      const d = await r.json();
      setCalls(d.calls || []);
      setTotal(d.total || 0);
    } catch (e) { console.error(e); }
    finally { setCallsLoading(false); }
  }, [filters]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); fetchCalls(1); }, [fetchCalls]);

  function setQuickRange(days: number | null) {
    if (days === null) {
      setFilters(f => ({ ...f, from: '2025-01-01', to: today() }));
    } else {
      setFilters(f => ({ ...f, from: defaultFrom(days), to: today() }));
    }
  }

  const kpis = stats?.kpis;
  const bookingRate = kpis && kpis.totalCalls > 0
    ? ((kpis.booked / kpis.totalCalls) * 100).toFixed(1)
    : '0';

  const from = (page - 1) * PER_PAGE + 1;
  const to_   = Math.min(page * PER_PAGE, total);
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div style={{ background: '#0f1117', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
              <span style={{ color: '#6366f1' }}>LeadiumX</span> AI Dashboard
            </h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>AI Agent Performance & Call Intelligence · V2</p>
          </div>
          <button
            onClick={() => { fetchStats(); fetchCalls(page); }}
            style={{ background: '#1a1d27', border: '1px solid #2d3148', color: '#94a3b8', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* ── Filters Bar ───────────────────────────────────────────────── */}
        <div style={{ background: '#1a1d27', borderRadius: 12, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>From</span>
            <input type="date" value={filters.from} style={inputStyle}
              onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>To</span>
            <input type="date" value={filters.to} style={inputStyle}
              onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
          </div>

          {/* Quick ranges */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setQuickRange(d)}
                style={{ background: '#2d3148', border: 'none', color: '#94a3b8', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>
                {d}d
              </button>
            ))}
            <button onClick={() => setQuickRange(365)}
              style={{ background: '#2d3148', border: 'none', color: '#94a3b8', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>
              1Y
            </button>
            <button onClick={() => setQuickRange(null)}
              style={{ background: '#2d3148', border: 'none', color: '#94a3b8', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>
              All
            </button>
          </div>

          {/* Agent filter */}
          <select value={filters.agentId} onChange={e => setFilters(f => ({ ...f, agentId: e.target.value }))} style={selectStyle}>
            {AGENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Status filter */}
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Phone search */}
          <input
            type="text"
            placeholder="🔍 Search phone…"
            value={filters.q}
            style={inputStyle}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
          />
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        {statsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: '#1a1d27', borderRadius: 12, height: 90, opacity: 0.4 }} />
            ))}
          </div>
        ) : kpis && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <KpiCard label="Total Calls" value={kpis.totalCalls.toLocaleString()} accent="#6366f1" />
            <KpiCard label="Unique Leads" value={kpis.totalLeads.toLocaleString()} />
            <KpiCard label="Booked" value={kpis.booked.toLocaleString()} accent="#22c55e" />
            <KpiCard label="Booking Rate" value={`${bookingRate}%`} accent="#22c55e" sub="of total calls" />
            <KpiCard label="Avg Duration" value={formatDuration(kpis.avgDuration)} sub="connected calls" />
            <KpiCard label="Total Talk Time" value={formatTalkTime(kpis.totalTalkMinutes)} accent="#06b6d4" />
          </div>
        )}

        {/* ── Charts Row 1 ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
          <div style={{ background: '#1a1d27', borderRadius: 12, padding: '20px 24px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: '#e2e8f0' }}>📈 Weekly Call Trend</h2>
            <WeeklyTrendChart data={stats?.weeklyTrend || []} />
          </div>
          <div style={{ background: '#1a1d27', borderRadius: 12, padding: '20px 24px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: '#e2e8f0' }}>🥧 Call Outcomes</h2>
            <OutcomesPieChart data={stats?.statusBreakdownTop5 || []} />
          </div>
        </div>

        {/* ── Charts Row 2 ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
          <div style={{ background: '#1a1d27', borderRadius: 12, padding: '20px 24px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: '#e2e8f0' }}>👤 Calls by Agent</h2>
            <AgentBarChart data={stats?.outcomesByAgent || []} />
          </div>
          <div style={{ background: '#1a1d27', borderRadius: 12, padding: '20px 24px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: '#e2e8f0' }}>🕐 Calls by Hour of Day</h2>
            <HourBarChart data={stats?.callsByHour || []} />
          </div>
        </div>

        {/* ── Calls Table ───────────────────────────────────────────────── */}
        <div style={{ background: '#1a1d27', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #2d3148', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#e2e8f0' }}>📋 Call Log</h2>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {callsLoading ? 'Loading…' : `Showing ${from}–${to_} of ${total.toLocaleString()} calls`}
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2d3148' }}>
                  {['Date', 'Phone', 'Agent', 'Status', 'Duration', 'Summary'].map(col => (
                    <th key={col} style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {callsLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} style={{ padding: '12px 16px' }}>
                          <div style={{ background: '#2d3148', borderRadius: 4, height: 14, width: j === 4 ? 60 : j === 5 ? 120 : 80, opacity: 0.5 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : calls.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>
                      No calls found matching your filters
                    </td>
                  </tr>
                ) : calls.map((c, i) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCall(c)}
                    style={{
                      borderBottom: '1px solid #1e2235', cursor: 'pointer',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2d3148')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                  >
                    <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                      {c.phone || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#94a3b8', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {AGENT_LABELS[c.agent_id] || c.agent_id || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatDuration(c.duration_seconds)}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#64748b', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.ai_summary || c.transcript?.slice(0, 80) || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid #2d3148', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                disabled={page === 1}
                onClick={() => { const p = page - 1; setPage(p); fetchCalls(p); }}
                style={{ background: '#2d3148', border: 'none', color: page === 1 ? '#475569' : '#94a3b8', borderRadius: 6, padding: '6px 14px', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13 }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 13, color: '#64748b' }}>Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => { const p = page + 1; setPage(p); fetchCalls(p); }}
                style={{ background: '#2d3148', border: 'none', color: page >= totalPages ? '#475569' : '#94a3b8', borderRadius: 6, padding: '6px 14px', cursor: page >= totalPages ? 'default' : 'pointer', fontSize: 13 }}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#334155', paddingBottom: 16 }}>
          LeadiumX AI Dashboard V2 · Powered by Supabase · {new Date().getFullYear()}
        </p>
      </div>

      {/* Side Drawer */}
      {selectedCall && <Drawer call={selectedCall} onClose={() => setSelectedCall(null)} />}
    </div>
  );
}
