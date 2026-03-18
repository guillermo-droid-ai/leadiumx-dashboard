"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────
interface AgentStat {
  id: string; label: string; calls: number; answered: number;
  booked: number; dnc: number; voicemail: number; noAnswer: number; sms: number;
}
interface Stats {
  kpis: { totalLeads: number; totalCalls: number; booked: number; dnc: number; totalSms: number; avgAttempts: string; ahCalls: number };
  statusBreakdown: Record<string, number>;
  agents: AgentStat[];
  fupDistribution: Record<string, number>;
  recentCalls: { phone: string; agent: string; status: string; attempts: number; summary: string; createdAt: string }[];
  smsTotal: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  no_answer:      "bg-yellow-500",
  voicemail:      "bg-orange-400",
  booked:         "bg-emerald-500",
  not_interested: "bg-gray-500",
  do_not_call:    "bg-red-600",
  location_sold:  "bg-blue-500",
  never_selling:  "bg-purple-500",
  calling:        "bg-cyan-500",
  unknown:        "bg-gray-700",
};
const STATUS_LABEL: Record<string, string> = {
  no_answer:      "No Answer",
  voicemail:      "Voicemail",
  booked:         "Booked ✅",
  not_interested: "Not Interested",
  do_not_call:    "DNC 🚫",
  location_sold:  "Property Sold",
  never_selling:  "Never Selling",
  calling:        "Calling...",
};

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className={`rounded-xl p-5 ${color || "bg-gray-800"} flex flex-col gap-1`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const bg = STATUS_COLOR[status] || "bg-gray-600";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${bg} text-white`}>{STATUS_LABEL[status] || status}</span>;
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-300 w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium w-8 text-right">{value}</span>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch("/api/stats");
      const d = await r.json();
      setStats(d);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400" />
    </div>
  );

  if (!stats) return <div className="flex items-center justify-center min-h-screen text-red-400">Error loading data</div>;

  const { kpis, statusBreakdown, agents, fupDistribution, recentCalls } = stats;
  const totalStatuses = Object.values(statusBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">LeadiumX — Operations Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">AI Agent Performance & Lead Tracking</p>
        </div>
        <div className="text-right">
          <button onClick={fetchStats} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
            🔄 Refresh
          </button>
          <p className="text-xs text-gray-500 mt-1">Last: {lastRefresh.toLocaleTimeString()}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KpiCard label="Total Leads" value={kpis.totalLeads} color="bg-gray-800" />
        <KpiCard label="Total Calls" value={kpis.totalCalls} color="bg-gray-800" />
        <KpiCard label="After Hours" value={kpis.ahCalls} color="bg-gray-800" />
        <KpiCard label="Booked" value={kpis.booked} color="bg-emerald-900" />
        <KpiCard label="DNC" value={kpis.dnc} color="bg-red-950" />
        <KpiCard label="SMS Sent" value={kpis.totalSms} color="bg-gray-800" />
        <KpiCard label="Avg Attempts" value={kpis.avgAttempts} sub="per lead" color="bg-gray-800" />
      </div>

      {/* Agent Performance */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Agent Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {agents.length === 0 ? (
            <div className="col-span-4 bg-gray-800 rounded-xl p-8 text-center text-gray-500">
              No call data yet — agents will appear here once calls are made
            </div>
          ) : agents.map(a => (
            <div key={a.id} className="bg-gray-800 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-sm text-gray-200">{a.label}</h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-700 rounded-lg p-2">
                  <p className="text-2xl font-bold">{a.calls}</p>
                  <p className="text-xs text-gray-400">Total Calls</p>
                </div>
                <div className="bg-emerald-900 rounded-lg p-2">
                  <p className="text-2xl font-bold text-emerald-300">{a.booked}</p>
                  <p className="text-xs text-gray-400">Booked</p>
                </div>
                <div className="bg-yellow-900 rounded-lg p-2">
                  <p className="text-2xl font-bold text-yellow-300">{a.noAnswer}</p>
                  <p className="text-xs text-gray-400">No Answer</p>
                </div>
                <div className="bg-orange-900 rounded-lg p-2">
                  <p className="text-2xl font-bold text-orange-300">{a.voicemail}</p>
                  <p className="text-xs text-gray-400">Voicemail</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 pt-1">
                <span>DNC: <span className="text-red-400 font-medium">{a.dnc}</span></span>
                <span>SMS: <span className="text-blue-400 font-medium">{a.sms}</span></span>
                <span>Answered: <span className="text-green-400 font-medium">{a.answered}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Breakdown + Follow-up Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Lead Status Breakdown</h2>
          {totalStatuses === 0 ? (
            <p className="text-gray-500 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusBreakdown)
                .sort(([,a],[,b]) => b - a)
                .map(([status, count]) => (
                  <BarRow key={status} label={STATUS_LABEL[status] || status}
                    value={count} max={totalStatuses}
                    color={STATUS_COLOR[status] || "bg-gray-500"} />
                ))}
            </div>
          )}
        </div>

        {/* Follow-up Distribution */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Follow-up Attempts Distribution</h2>
          {Object.values(fupDistribution).every(v => v === 0) ? (
            <p className="text-gray-500 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(fupDistribution).map(([bucket, count]) => (
                <BarRow key={bucket}
                  label={`${bucket} attempt${bucket === "1" ? "" : "s"}`}
                  value={count}
                  max={Math.max(...Object.values(fupDistribution))}
                  color="bg-blue-500" />
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-400">{kpis.avgAttempts}</p>
              <p className="text-xs text-gray-400">Avg attempts / lead</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{kpis.totalSms}</p>
              <p className="text-xs text-gray-400">Total SMS sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Calls */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recentCalls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No calls yet — data will appear here once agents start making calls</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
                  <th className="text-left py-2 pr-4">Phone</th>
                  <th className="text-left py-2 pr-4">Agent</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Attempts</th>
                  <th className="text-left py-2 pr-4">Summary</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentCalls.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-750 transition-colors">
                    <td className="py-2 pr-4 font-mono text-xs text-gray-300">{c.phone}</td>
                    <td className="py-2 pr-4 text-gray-300 text-xs">{c.agent}</td>
                    <td className="py-2 pr-4"><StatusPill status={c.status} /></td>
                    <td className="py-2 pr-4 text-center text-gray-300">{c.attempts ?? 0}</td>
                    <td className="py-2 pr-4 text-gray-400 text-xs max-w-xs truncate">{c.summary || "—"}</td>
                    <td className="py-2 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 pb-4">
        LeadiumX Operations Dashboard · Auto-refreshes every 60s · Data from Supabase
      </div>
    </div>
  );
}
