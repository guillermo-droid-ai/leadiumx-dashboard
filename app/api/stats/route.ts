import { NextResponse } from "next/server";

const SB_URL = "https://gbuwvtvnrsmlvthqyxkb.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_KEY!;

const AGENT_LABELS: Record<string, string> = {
  agent_989c4ddee680266bc1ec669f70: "Amy — New Leads",
  agent_9c1c9db02cde1c74f4f68ce368: "Olivia — Follow-Up",
  agent_17bae54a0f2ec5d6b2ed5857:   "Olivia — Follow-Up",
  agent_6d04e046d5904146beda8498af: "Sofie — Long Term",
  agent_77096474763bfd669bf485c410: "Amy — After Hours",
  agent_89847ed45169b8ad61aba152e8: "Olivia — Inbound",
};

async function sb(path: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    cache: "no-store",
  });
  return r.json();
}

// Get ISO week string like "2026-W10"
function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const year = thursday.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const week = Math.ceil(((thursday.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get("from") || "2025-01-01";
  const toDate = searchParams.get("to") || new Date().toISOString().split("T")[0];

  const dateFilter = `created_at=gte.${fromDate}T00:00:00Z&created_at=lte.${toDate}T23:59:59Z`;

  const [calls, smsLogs, ahCalls] = await Promise.all([
    sb(`calls?select=id,agent_id,agent_type,status,follow_up_count,duration_seconds,created_at,ai_summary,phone,ghl_contact_id,call_id&${dateFilter}&limit=5000&order=created_at.desc`),
    sb("sms_logs?select=id,phone,status,follow_up_count,sent_at,created_at"),
    sb("after_hours_calls?select=id,phone,status,created_at"),
  ]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalLeads = new Set(calls.map((c: any) => c.phone)).size;
  const totalCalls = calls.length;
  const booked     = calls.filter((c: any) => c.status === "booked").length
                   + ahCalls.filter((c: any) => c.status === "booked").length;
  const dnc        = calls.filter((c: any) => c.status === "do_not_call").length;
  const totalSms   = smsLogs.length;
  const avgAttempts = calls.length
    ? (calls.reduce((s: number, c: any) => s + (c.follow_up_count || 0), 0) / calls.length).toFixed(1)
    : "0";

  const totalTalkSeconds = calls.reduce((s: number, c: any) => s + (c.duration_seconds || 0), 0);
  const totalTalkMinutes = Math.round(totalTalkSeconds / 60);
  const avgDuration = calls.length
    ? Math.round(calls.filter((c: any) => (c.duration_seconds || 0) > 0)
        .reduce((s: number, c: any) => s + (c.duration_seconds || 0), 0)
      / Math.max(1, calls.filter((c: any) => (c.duration_seconds || 0) > 0).length))
    : 0;

  // ── Status breakdown ──────────────────────────────────────────────────────
  const statusMap: Record<string, number> = {};
  for (const c of calls) {
    const s = c.status || "unknown";
    statusMap[s] = (statusMap[s] || 0) + 1;
  }

  // Top 5 for pie chart
  const statusBreakdownTop5 = Object.entries(statusMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([status, count]) => ({ status, count }));

  // ── Per-agent stats ───────────────────────────────────────────────────────
  const agentMap: Record<string, { calls: number; answered: number; booked: number; dnc: number; voicemail: number; noAnswer: number; sms: number; totalDuration: number }> = {};
  for (const c of calls) {
    const aid = c.agent_id || "unknown";
    if (!agentMap[aid]) agentMap[aid] = { calls: 0, answered: 0, booked: 0, dnc: 0, voicemail: 0, noAnswer: 0, sms: 0, totalDuration: 0 };
    agentMap[aid].calls++;
    agentMap[aid].totalDuration += c.duration_seconds || 0;
    if (c.status === "booked")        agentMap[aid].booked++;
    if (c.status === "do_not_call")   agentMap[aid].dnc++;
    if (c.status === "voicemail")     agentMap[aid].voicemail++;
    if (c.status === "no_answer")     agentMap[aid].noAnswer++;
    if (!["no_answer","voicemail","calling"].includes(c.status)) agentMap[aid].answered++;
  }
  const phoneAgent: Record<string, string> = {};
  for (const c of calls) if (c.phone) phoneAgent[c.phone] = c.agent_id;
  for (const s of smsLogs) {
    const aid = phoneAgent[s.phone] || "unknown";
    if (agentMap[aid]) agentMap[aid].sms++;
  }
  const ahAgent = "agent_77096474763bfd669bf485c410";
  agentMap[ahAgent] = agentMap[ahAgent] || { calls: 0, answered: 0, booked: 0, dnc: 0, voicemail: 0, noAnswer: 0, sms: 0, totalDuration: 0 };
  agentMap[ahAgent].calls += ahCalls.length;
  agentMap[ahAgent].booked += ahCalls.filter((c: any) => c.status === "booked").length;

  const agents = Object.entries(agentMap)
    .filter(([id]) => AGENT_LABELS[id])
    .map(([id, stats]) => ({ id, label: AGENT_LABELS[id], ...stats }))
    .sort((a, b) => b.calls - a.calls);

  // ── Follow-up distribution ────────────────────────────────────────────────
  const fupBuckets = { "1": 0, "2-3": 0, "4-6": 0, "7-10": 0, "11+": 0 };
  for (const c of calls) {
    const n = c.follow_up_count || 0;
    if      (n <= 1)  fupBuckets["1"]++;
    else if (n <= 3)  fupBuckets["2-3"]++;
    else if (n <= 6)  fupBuckets["4-6"]++;
    else if (n <= 10) fupBuckets["7-10"]++;
    else              fupBuckets["11+"]++;
  }

  // ── Calls by month ────────────────────────────────────────────────────────
  const monthMap: Record<string, { count: number; booked: number }> = {};
  for (const c of calls) {
    if (!c.created_at) continue;
    const month = c.created_at.slice(0, 7);
    if (!monthMap[month]) monthMap[month] = { count: 0, booked: 0 };
    monthMap[month].count++;
    if (c.status === "booked") monthMap[month].booked++;
  }
  const callsByMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, stats]) => ({ month, ...stats }));

  // ── NEW: Calls by hour ────────────────────────────────────────────────────
  const hourMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourMap[h] = 0;
  for (const c of calls) {
    if (!c.created_at) continue;
    const h = new Date(c.created_at).getUTCHours();
    hourMap[h] = (hourMap[h] || 0) + 1;
  }
  const callsByHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap[h] || 0 }));

  // ── NEW: Weekly trend (last 12 weeks) ─────────────────────────────────────
  const weekMap: Record<string, { calls: number; booked: number }> = {};
  for (const c of calls) {
    if (!c.created_at) continue;
    const week = getISOWeek(c.created_at);
    if (!weekMap[week]) weekMap[week] = { calls: 0, booked: 0 };
    weekMap[week].calls++;
    if (c.status === "booked") weekMap[week].booked++;
  }
  const weeklyTrend = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, stats]) => ({ week, ...stats }));

  // ── NEW: Outcomes by agent ────────────────────────────────────────────────
  const outcomesByAgent = agents.map(a => ({
    label: a.label,
    answered: a.answered,
    voicemail: a.voicemail,
    noAnswer: a.noAnswer,
    booked: a.booked,
    total: a.calls,
  }));

  // ── NEW: Avg duration by agent ────────────────────────────────────────────
  const avgDurationByAgent: Record<string, number> = {};
  for (const a of agents) {
    const answeredCalls = a.calls - a.noAnswer - a.voicemail;
    avgDurationByAgent[a.label] = answeredCalls > 0
      ? Math.round(a.totalDuration / Math.max(answeredCalls, 1))
      : 0;
  }

  // ── Legacy count ──────────────────────────────────────────────────────────
  const legacyCount = calls.filter((c: any) => c.agent_type === "legacy_outbound").length;

  // ── Recent calls ─────────────────────────────────────────────────────────
  const recent = [...calls]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15)
    .map((c: any) => ({
      phone:     c.phone,
      agent:     AGENT_LABELS[c.agent_id] || c.agent_id,
      agentType: c.agent_type,
      status:    c.status,
      attempts:  c.follow_up_count,
      summary:   c.ai_summary?.slice(0, 80) || "",
      createdAt: c.created_at,
    }));

  return NextResponse.json({
    kpis: { totalLeads, totalCalls, booked, dnc, totalSms, avgAttempts, ahCalls: ahCalls.length, totalTalkMinutes, avgDuration },
    statusBreakdown: statusMap,
    statusBreakdownTop5,
    agents,
    fupDistribution: fupBuckets,
    recentCalls: recent,
    smsTotal: totalSms,
    callsByMonth,
    legacyCount,
    dateRange: { from: fromDate, to: toDate },
    // New V2 fields
    callsByHour,
    weeklyTrend,
    outcomesByAgent,
    avgDurationByAgent,
  });
}
