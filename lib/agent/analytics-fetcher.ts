/**
 * Analytics Fetcher
 *
 * For every connected account, pulls account-level followers plus recent-post
 * engagement (reach, impressions, likes, comments, shares, saves) and stores
 * normalized rows in platform_analytics. Multi-tenant: all users in one run.
 *
 * Routing:
 *  - instagram account row → Instagram AND Facebook (the Meta connection holds
 *    one row with the Page token + page_id + ig_business_id, serving both).
 *  - youtube account row   → YouTube Data API (refresh token in page_token).
 *  - x account row         → X API v2 (OAuth2 user token in page_token).
 *
 * Every platform is wrapped in try/catch so one failure never blocks the rest.
 */

import { createServiceClient } from '@/lib/supabase/service'

interface AnalyticsResult {
  accounts_processed: number
  rows_stored: number
  errors: number
}

const GRAPH = 'https://graph.facebook.com/v23.0'

// ─── Shared storage helper ─────────────────────────────────────────────────────

interface MetricRow {
  userId: string
  socialAccountId: string
  platform: string
  accountName: string | null
  postId: string
  postedTime?: string | null
  caption?: string | null
  mediaType?: string | null
  totalFollowers?: number
  reach?: number
  impressions?: number
  views?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertRow(svc: any, r: MetricRow): Promise<boolean> {
  const posted = r.postedTime ? new Date(r.postedTime) : null
  const likes = r.likes ?? 0
  const comments = r.comments ?? 0
  const shares = r.shares ?? 0
  const engagement = likes + comments + shares + (r.saves ?? 0)

  const { error } = await svc.from('platform_analytics').upsert(
    {
      user_id: r.userId,
      social_account_id: r.socialAccountId,
      platform: r.platform,
      account_name: r.accountName,
      post_id: r.postId,
      posted_time: r.postedTime ?? null,
      date: posted ? posted.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      hour: posted ? String(posted.getHours()) : null,
      day_of_week: posted ? posted.toLocaleDateString('en-US', { weekday: 'long' }) : null,
      caption: r.caption ?? '',
      media_type: r.mediaType ?? '',
      total_followers: r.totalFollowers ?? 0,
      reach: r.reach ?? 0,
      impressions: r.impressions ?? 0,
      views: r.views ?? 0,
      likes,
      comments,
      shares,
      saves: r.saves ?? 0,
      engagement_score: engagement,
      performance_score: engagement,
      raw_metrics: r.raw ? JSON.stringify(r.raw) : null,
    },
    { onConflict: 'user_id,platform,post_id' }
  )
  return !error
}

/** Daily account-level snapshot row so followers show even with no recent posts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function snapshot(svc: any, userId: string, socialAccountId: string, platform: string, accountName: string | null, totalFollowers: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10)
  return upsertRow(svc, {
    userId, socialAccountId, platform, accountName,
    postId: `__account__${day}`,
    postedTime: new Date().toISOString(),
    mediaType: 'account_snapshot',
    totalFollowers,
  })
}

// ─── Runner ─────────────────────────────────────────────────────────────────────

export async function runAnalyticsFetch(): Promise<AnalyticsResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any
  let accounts_processed = 0, rows_stored = 0, errors = 0

  const { data: accounts } = await svc
    .from('social_accounts')
    .select('id, user_id, external_account_id, page_id, page_token_encrypted, username, platform')
    .eq('status', 'active')
    .not('page_token_encrypted', 'is', null) as {
      data: Array<{
        id: string; user_id: string; external_account_id: string | null;
        page_id: string | null; page_token_encrypted: string | null;
        username: string | null; platform: string
      }> | null
    }

  if (!accounts?.length) return { accounts_processed: 0, rows_stored: 0, errors: 0 }

  for (const a of accounts) {
    accounts_processed++
    const token = a.page_token_encrypted!
    try {
      if (a.platform === 'instagram') {
        // The Meta row serves both Instagram and the linked Facebook Page.
        if (a.external_account_id) {
          rows_stored += await fetchInstagram(svc, a.user_id, a.id, a.external_account_id, token)
        }
        if (a.page_id) {
          rows_stored += await fetchFacebook(svc, a.user_id, a.id, a.page_id, token)
        }
      } else if (a.platform === 'youtube') {
        rows_stored += await fetchYouTube(svc, a.user_id, a.id, token)
      } else if (a.platform === 'x') {
        rows_stored += await fetchX(svc, a.user_id, a.id, token)
      }
    } catch (err) {
      errors++
      console.error('[analytics]', a.platform, a.id, '→', err instanceof Error ? err.message : err)
    }
  }

  return { accounts_processed, rows_stored, errors }
}

// ─── Instagram ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchInstagram(svc: any, userId: string, accountId: string, igBusinessId: string, pageToken: string): Promise<number> {
  let followers = 0, username: string | null = null
  const acctRes = await fetch(`${GRAPH}/${igBusinessId}?fields=followers_count,username&access_token=${pageToken}`)
  if (acctRes.ok) {
    const j = await acctRes.json()
    followers = j.followers_count ?? 0
    username = j.username ?? null
  }

  let count = 0
  if (await snapshot(svc, userId, accountId, 'instagram', username, followers)) count++

  const mediaRes = await fetch(
    `${GRAPH}/${igBusinessId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count&access_token=${pageToken}&limit=25`
  )
  if (!mediaRes.ok) return count
  const { data: posts } = await mediaRes.json()
  if (!Array.isArray(posts)) return count

  for (const post of posts) {
    // Insights metric names differ by media type; request a safe set and read
    // whatever comes back (reach is the most reliable across types).
    let reach = 0, impressions = 0, saves = 0, shares = 0
    const metric = post.media_type === 'VIDEO' ? 'reach,saved,shares' : 'reach,saved'
    const insRes = await fetch(`${GRAPH}/${post.id}/insights?metric=${metric}&access_token=${pageToken}`)
    if (insRes.ok) {
      const { data } = await insRes.json()
      for (const m of data ?? []) {
        const v = m.values?.[0]?.value ?? 0
        if (m.name === 'reach') reach = v
        else if (m.name === 'impressions') impressions = v
        else if (m.name === 'saved') saves = v
        else if (m.name === 'shares') shares = v
      }
    }
    if (await upsertRow(svc, {
      userId, socialAccountId: accountId, platform: 'instagram', accountName: username,
      postId: post.id, postedTime: post.timestamp, caption: post.caption, mediaType: post.media_type,
      totalFollowers: followers, reach, impressions, saves, shares,
      likes: post.like_count ?? 0, comments: post.comments_count ?? 0, raw: post,
    })) count++
  }
  return count
}

// ─── Facebook Page ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchFacebook(svc: any, userId: string, accountId: string, pageId: string, pageToken: string): Promise<number> {
  let followers = 0, name: string | null = null
  const acctRes = await fetch(`${GRAPH}/${pageId}?fields=followers_count,fan_count,name&access_token=${pageToken}`)
  if (acctRes.ok) {
    const j = await acctRes.json()
    followers = j.followers_count ?? j.fan_count ?? 0
    name = j.name ?? null
  }

  let count = 0
  if (await snapshot(svc, userId, accountId, 'facebook', name, followers)) count++

  const postsRes = await fetch(
    `${GRAPH}/${pageId}/posts?fields=id,message,created_time,reactions.summary(true),comments.summary(true),shares&access_token=${pageToken}&limit=25`
  )
  if (!postsRes.ok) return count
  const { data: posts } = await postsRes.json()
  if (!Array.isArray(posts)) return count

  for (const post of posts) {
    let reach = 0, impressions = 0
    const insRes = await fetch(`${GRAPH}/${post.id}/insights?metric=post_impressions_unique,post_impressions&access_token=${pageToken}`)
    if (insRes.ok) {
      const { data } = await insRes.json()
      for (const m of data ?? []) {
        const v = m.values?.[0]?.value ?? 0
        if (m.name === 'post_impressions_unique') reach = v
        else if (m.name === 'post_impressions') impressions = v
      }
    }
    if (await upsertRow(svc, {
      userId, socialAccountId: accountId, platform: 'facebook', accountName: name,
      postId: post.id, postedTime: post.created_time, caption: post.message, mediaType: 'post',
      totalFollowers: followers, reach, impressions,
      likes: post.reactions?.summary?.total_count ?? 0,
      comments: post.comments?.summary?.total_count ?? 0,
      shares: post.shares?.count ?? 0, raw: post,
    })) count++
  }
  return count
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchYouTube(svc: any, userId: string, accountId: string, refreshToken: string): Promise<number> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return 0

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const tokenJson = await tokenRes.json()
  if (!tokenRes.ok || !tokenJson.access_token) return 0
  const accessToken = tokenJson.access_token

  // Channel-level stats: subscribers + recent uploads playlist.
  const chRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&mine=true',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!chRes.ok) return 0
  const chJson = await chRes.json()
  const channel = chJson.items?.[0]
  if (!channel) return 0

  const followers = Number(channel.statistics?.subscriberCount ?? 0)
  const name = channel.snippet?.title ?? null
  const uploadsPlaylist = channel.contentDetails?.relatedPlaylists?.uploads

  let count = 0
  if (await snapshot(svc, userId, accountId, 'youtube', name, followers)) count++

  if (!uploadsPlaylist) return count

  // Recent uploads → video ids → per-video statistics.
  const plRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=25&playlistId=${uploadsPlaylist}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!plRes.ok) return count
  const plJson = await plRes.json()
  const ids: string[] = (plJson.items ?? []).map((i: { contentDetails?: { videoId?: string } }) => i.contentDetails?.videoId).filter(Boolean)
  if (!ids.length) return count

  const vidRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids.join(',')}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!vidRes.ok) return count
  const vidJson = await vidRes.json()
  for (const v of vidJson.items ?? []) {
    if (await upsertRow(svc, {
      userId, socialAccountId: accountId, platform: 'youtube', accountName: name,
      postId: v.id, postedTime: v.snippet?.publishedAt, caption: v.snippet?.title, mediaType: 'video',
      totalFollowers: followers,
      views: Number(v.statistics?.viewCount ?? 0),
      likes: Number(v.statistics?.likeCount ?? 0),
      comments: Number(v.statistics?.commentCount ?? 0),
      raw: v.statistics,
    })) count++
  }
  return count
}

// ─── X (Twitter) ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchX(svc: any, userId: string, accountId: string, token: string): Promise<number> {
  // The X connect flow stores `accessToken||refreshToken` (OAuth2 user context).
  const accessToken = token.split('||')[0]
  if (!accessToken) return 0

  const meRes = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=public_metrics,username,name',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!meRes.ok) return 0
  const me = (await meRes.json()).data
  if (!me) return 0

  const followers = me.public_metrics?.followers_count ?? 0
  const name = me.name ?? me.username ?? null

  let count = 0
  if (await snapshot(svc, userId, accountId, 'x', name, followers)) count++

  const tweetsRes = await fetch(
    `https://api.twitter.com/2/users/${me.id}/tweets?max_results=25&tweet.fields=public_metrics,created_at`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!tweetsRes.ok) return count
  const tweets = (await tweetsRes.json()).data
  if (!Array.isArray(tweets)) return count

  for (const t of tweets) {
    const pm = t.public_metrics ?? {}
    if (await upsertRow(svc, {
      userId, socialAccountId: accountId, platform: 'x', accountName: name,
      postId: t.id, postedTime: t.created_at, caption: t.text, mediaType: 'tweet',
      totalFollowers: followers,
      impressions: pm.impression_count ?? 0,
      likes: pm.like_count ?? 0,
      comments: pm.reply_count ?? 0,
      shares: (pm.retweet_count ?? 0) + (pm.quote_count ?? 0),
      raw: pm,
    })) count++
  }
  return count
}
