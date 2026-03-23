import { NextResponse } from "next/server";

const SB_URL = "https://gbuwvtvnrsmlvthqyxkb.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_KEY!;

const AGENT_LABELS: Record<string, string> = {
  agent_989c4ddee680266bc1ec669f70: "Amy — New Leads",
  agent_9c1c9db02cde1c74f4f68ce368: "Olivia — Follow-Up",
  agent_6d04e046d5904146beda8498af: "Sofie — Long Term",
  agent_77096474763bfd669bf485c410: "Amy — After Hours",
};

async function sb(path: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    cache: "no-store",
  });
  return r.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get("from") || "2025-01-01";
  const toDate = searchParams.get("to") || new Date().toISOString().split("T")[0];

  // Date filter for calls
  const dateFilter = `created_at=gte.${fromDate}T00:00:00Z&created_at=lte.${toDate}T23:59:59Z`;

  const [calls, smsLogs, ahCalls] = await Promise.all([
    sb(`calls?select=id,agent_id,agent_type,status,follow_up_count,duration_seconds,created_at,ai_summary,phone,ghl_contact_id,call_id&${dateFilter}&limit=2000`),
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

  // Total talk time
  const totalTalkSeconds = calls.reduce((s: number, c: any) => s + (c.duration_seconds || 0), 0);
  const totalTalkMinutes = Math.round(totalTalkSeconds / 60);

  // ── Status breakdown ──────────────────────────────────────────────────────
  const statusMap: Record<string, number> = {};
  for (const c of calls) {
    const s = c.status || "unknown";
    statusMap[s] = (statusMap[s] || 0) + 1;
  }

  // ── Per-agent stats ───────────────────────────────────────────────────────
  const agentMap: Record<string, { calls: number; answered: number; booked: number; dnc: number; voicemail: number; noAnswer: number; sms: number }> = {};
  for (const c of calls) {
    const aid = c.agent_id || "unknown";
    if (!agentMap[aid]) agentMap[aid] = { calls: 0, answered: 0, booked: 0, dnc: 0, voicemail: 0, noAnswer: 0, sms: 0 };
    agentMap[aid].calls++;
    if (c.status === "booked")        agentMap[aid].booked++;
    if (c.status === "do_not_call")   agentMap[aid].dnc++;
    if (c.status === "voicemail")     agentMap[aid].voicemail++;
    if (c.status === "no_answer")     agentMap[aid].noAnswer++;
    if (!["no_answer","voicemail","calling"].includes(c.status)) agentMap[aid].answered++;
  }
  // Map phone → agent for SMS attribution
  const phoneAgent: Record<string, string> = {};
  for (const c of calls) if (c.phone) phoneAgent[c.phone] = c.agent_id;
  for (const s of smsLogs) {
    const aid = phoneAgent[s.phone] || "unknown";
    if (agentMap[aid]) agentMap[aid].sms++;
  }
  // Amy After Hours
  const ahAgent = "agent_77096474763bfd669bf485c410";
  agentMap[ahAgent] = agentMap[ahAgent] || { calls: 0, answered: 0, booked: 0, dnc: 0, voicemail: 0, noAnswer: 0, sms: 0 };
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
    const month = c.created_at.slice(0, 7); // "2026-03"
    if (!monthMap[month]) monthMap[month] = { count: 0, booked: 0 };
    monthMap[month].count++;
    if (c.status === "booked") monthMap[month].booked++;
  }
  const callsByMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, stats]) => ({ month, ...stats }));

  // ── Legacy (pre-2026) count ──────────────────────────────────────────────
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
    kpis: { totalLeads, totalCalls, booked, dnc, totalSms, avgAttempts, ahCalls: ahCalls.length, totalTalkMinutes },
    statusBreakdown: statusMap,
    agents,
    fupDistribution: fupBuckets,
    recentCalls: recent,
    smsTotal: totalSms,
    callsByMonth,
    legacyCount,
    dateRange: { from: fromDate, to: toDate },
  });
}
