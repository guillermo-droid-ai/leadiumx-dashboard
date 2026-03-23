'use client';

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

interface WeeklyPoint { week: string; calls: number; booked: number; }
interface HourPoint   { hour: number; count: number; }
interface AgentOutcome { label: string; answered: number; voicemail: number; noAnswer: number; booked: number; total: number; }
interface StatusPie   { status: string; count: number; }

// ── Weekly Trend ─────────────────────────────────────────────────────────────
export function WeeklyTrendChart({ data }: { data: WeeklyPoint[] }) {
  if (!data?.length) return <EmptyChart msg="No weekly data" />;
  const formatted = data.map(d => ({ ...d, week: d.week.replace(/^\d{4}-/, '') }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
        <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 8, color: '#e2e8f0' }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        <Line type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} dot={false} name="Total Calls" />
        <Line type="monotone" dataKey="booked" stroke="#22c55e" strokeWidth={2} dot={false} name="Booked" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Call Outcomes Pie ─────────────────────────────────────────────────────────
export function OutcomesPieChart({ data }: { data: StatusPie[] }) {
  if (!data?.length) return <EmptyChart msg="No outcome data" />;
  const CUSTOM_COLORS: Record<string, string> = {
    booked: '#22c55e',
    voicemail: '#f59e0b',
    no_answer: '#64748b',
    do_not_call: '#ef4444',
    not_interested: '#ef4444',
    calling: '#3b82f6',
    callback_requested: '#6366f1',
    interested_no_booking: '#6366f1',
  };
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          label={({ percent }: { percent?: number }) =>
            (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''
          }
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={entry.status} fill={CUSTOM_COLORS[entry.status] || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: unknown) => [String(value ?? '')]}
          contentStyle={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 8, color: '#e2e8f0' }}
        />
        <Legend
          wrapperStyle={{ color: '#94a3b8', fontSize: 11 }}
          formatter={(value) => value.replace(/_/g, ' ')}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Calls by Agent Bar ────────────────────────────────────────────────────────
export function AgentBarChart({ data }: { data: AgentOutcome[] }) {
  if (!data?.length) return <EmptyChart msg="No agent data" />;
  const formatted = data.map(d => ({
    ...d,
    label: d.label.split('—')[1]?.trim() || d.label,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 8, color: '#e2e8f0' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
        <Bar dataKey="answered" name="Answered" stackId="a" fill="#6366f1" />
        <Bar dataKey="voicemail" name="Voicemail" stackId="a" fill="#f59e0b" />
        <Bar dataKey="noAnswer" name="No Answer" stackId="a" fill="#64748b" />
        <Bar dataKey="booked" name="Booked" stackId="a" fill="#22c55e" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Calls by Hour Bar ─────────────────────────────────────────────────────────
export function HourBarChart({ data }: { data: HourPoint[] }) {
  if (!data?.length) return <EmptyChart msg="No hourly data" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
        <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={(h) => `${h}h`} interval={3} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 8, color: '#e2e8f0' }}
          labelFormatter={(h) => `Hour: ${h}:00`}
        />
        <Bar dataKey="count" name="Calls" fill="#06b6d4" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center h-[220px] text-sm" style={{ color: '#64748b' }}>
      {msg}
    </div>
  );
}
