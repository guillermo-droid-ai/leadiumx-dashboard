import { NextResponse } from "next/server";

const SB_URL = "https://gbuwvtvnrsmlvthqyxkb.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page      = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage   = Math.min(100, parseInt(searchParams.get("per_page") || "50"));
  const fromDate  = searchParams.get("from") || "2025-01-01";
  const toDate    = searchParams.get("to") || new Date().toISOString().split("T")[0];
  const agentId   = searchParams.get("agent_id") || "";
  const status    = searchParams.get("status") || "";
  const q         = searchParams.get("q") || "";

  const offset = (page - 1) * perPage;

  // Build query
  const params = new URLSearchParams({
    select: "id,call_id,phone,agent_id,status,duration_seconds,created_at,transcript,recording_url,sf_lead_id,ghl_contact_id,ai_summary,agent_type,follow_up_count",
    "created_at": `gte.${fromDate}T00:00:00Z`,
    order: "created_at.desc",
    limit: String(perPage),
    offset: String(offset),
  });

  // Additional filters
  const filterParts: string[] = [
    `created_at=gte.${fromDate}T00:00:00Z`,
    `created_at=lte.${toDate}T23:59:59Z`,
  ];
  if (agentId) filterParts.push(`agent_id=eq.${agentId}`);
  if (status)  filterParts.push(`status=eq.${status}`);
  if (q)       filterParts.push(`phone=ilike.*${encodeURIComponent(q)}*`);

  const queryString = [
    "select=id,call_id,phone,agent_id,status,duration_seconds,created_at,transcript,recording_url,sf_lead_id,ghl_contact_id,ai_summary,agent_type,follow_up_count",
    ...filterParts,
    "order=created_at.desc",
    `limit=${perPage}`,
    `offset=${offset}`,
  ].join("&");

  const res = await fetch(`${SB_URL}/rest/v1/calls?${queryString}`, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      Prefer: "count=exact",
    },
    cache: "no-store",
  });

  const calls = await res.json();

  // Parse total from Content-Range header: "0-49/20152"
  const contentRange = res.headers.get("content-range") || "";
  const total = parseInt(contentRange.split("/")[1] || "0") || 0;

  if (!Array.isArray(calls)) {
    return NextResponse.json({ calls: [], total: 0, error: calls });
  }

  return NextResponse.json({ calls, total });
}
