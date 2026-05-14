import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export type PlatformRow = {
  date: string
  platform: string
  account_name: string
  followers: number
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
  posts: number
  video_views: number
}

// ─── Stable mock fallback ──────────────────────────────────────────────────────

function buildMockData(): PlatformRow[] {
  const specs = [
    { name: 'instagram', account: '@autom8.socials', reach: 8400, impressions: 12000, likes: 380, comments: 45, shares: 62, saves: 93, posts: 2, views: 0 },
    { name: 'facebook',  account: 'Autom8',          reach: 3200, impressions: 5400,  likes: 120, comments: 28, shares: 35, saves: 0,  posts: 2, views: 0 },
    { name: 'x',         account: '@autom8hq',        reach: 2100, impressions: 6800,  likes: 89,  comments: 22, shares: 45, saves: 0,  posts: 3, views: 0 },
    { name: 'youtube',   account: 'Autom8',           reach: 1800, impressions: 4200,  likes: 145, comments: 38, shares: 22, saves: 0,  posts: 1, views: 1200 },
  ]

  const noise = [
    [0.98, 1.02, 0.97, 1.05], [1.01, 0.96, 1.03, 0.99],
    [0.99, 1.04, 1.01, 0.97], [1.03, 0.98, 0.96, 1.02],
    [0.96, 1.01, 1.04, 1.00], [1.02, 0.99, 0.98, 1.03],
    [1.00, 1.03, 1.02, 0.96], [0.97, 0.97, 1.00, 1.04],
    [1.04, 1.02, 0.99, 0.98], [1.01, 0.95, 1.03, 1.01],
    [0.98, 1.00, 0.97, 1.02], [1.03, 1.04, 1.01, 0.99],
    [0.99, 0.98, 1.02, 1.03], [1.02, 1.01, 0.98, 1.00],
  ]

  const base = new Date('2026-05-12')
  const rows: PlatformRow[] = []

  for (let d = 13; d >= 0; d--) {
    const dt = new Date(base)
    dt.setDate(dt.getDate() - d)
    const dateStr = dt.toISOString().split('T')[0]
    const dayIndex = 13 - d

    specs.forEach((p, pi) => {
      const n = noise[dayIndex][pi]
      const likes = Math.round(p.likes * n)
      const comments = Math.round(p.comments * n)
      const shares = Math.round(p.shares * n)
      const impressions = Math.round(p.impressions * n)
      const engagement_rate = impressions > 0
        ? Math.round(((likes + comments + shares) / impressions) * 1000) / 10
        : 0

      rows.push({
        date: dateStr,
        platform: p.name,
        account_name: p.account,
        followers: 0,
        reach: Math.round(p.reach * n),
        impressions,
        likes,
        comments,
        shares,
        saves: Math.round(p.saves * n),
        engagement_rate,
        posts: p.posts,
        video_views: Math.round(p.views * n),
      })
    })
  }

  return rows
}

// ─── Supabase row shape ────────────────────────────────────────────────────────

type SupabaseRow = {
  date: string | null
  fetched_at: string | null
  platform: string | null
  account_name: string | null
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  saves: number
  views: number
  total_followers: number | null
}

function aggregateRows(rows: SupabaseRow[]): PlatformRow[] {
  const byKey: Record<string, {
    platform: string
    account_name: string
    reach: number
    impressions: number
    likes: number
    comments: number
    shares: number
    saves: number
    views: number
    posts: number
    total_followers: number
  }> = {}  // keyed by date__platform

  for (const r of rows) {
    if (!r.platform) continue
    // Fall back to fetched_at date if date is null (e.g. Instagram Insights rows)
    const effectiveDate = r.date || (r.fetched_at ? r.fetched_at.split('T')[0] : 'unknown')
    const key = `${effectiveDate}__${r.platform}`
    if (!byKey[key]) {
      byKey[key] = {
        platform: r.platform,
        account_name: r.account_name || r.platform,
        reach: 0, impressions: 0, likes: 0, comments: 0,
        shares: 0, saves: 0, views: 0, posts: 0,
        total_followers: r.total_followers || 0,
      }
    }
    const a = byKey[key]
    a.reach      += r.reach      || 0
    a.impressions += r.impressions || 0
    a.likes      += r.likes      || 0
    a.comments   += r.comments   || 0
    a.shares     += r.shares     || 0
    a.saves      += r.saves      || 0
    a.views      += r.views      || 0
    a.posts      += 1
    a.total_followers = Math.max(a.total_followers, r.total_followers || 0)
  }

  return Object.entries(byKey).map(([key, a]) => {
    const date = key.split('__')[0]
    const totalEngagement = a.likes + a.comments + a.shares
    const denominator = a.reach > 0 ? a.reach : a.impressions
    const engagement_rate = denominator > 0
      ? Math.round((totalEngagement / denominator) * 1000) / 10
      : 0

    return {
      date,
      platform: a.platform,
      account_name: a.account_name,
      followers: a.total_followers,
      reach: a.reach,
      impressions: a.impressions,
      likes: a.likes,
      comments: a.comments,
      shares: a.shares,
      saves: a.saves,
      engagement_rate,
      posts: a.posts,
      video_views: a.views,
    }
  })
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ data: buildMockData(), source: 'mock' })
  }

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/platform_analytics` +
      `?select=date,fetched_at,platform,account_name,reach,impressions,likes,comments,shares,saves,views,total_followers` +
      `&platform=not.is.null` +
      `&order=fetched_at.asc`

    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ data: buildMockData(), source: 'mock', error: `Supabase ${res.status}` })
    }

    const rows: SupabaseRow[] = await res.json()

    if (!rows.length) {
      return NextResponse.json({ data: buildMockData(), source: 'mock', error: 'No data in range' })
    }

    return NextResponse.json({ data: aggregateRows(rows), source: 'supabase' })
  } catch (err) {
    return NextResponse.json({ data: buildMockData(), source: 'mock', error: String(err) })
  }
}
