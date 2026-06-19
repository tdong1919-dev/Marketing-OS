/**
 * Publisher Agent
 * Replicates: SS F4 Publisher
 *
 * Checks all scheduled posts that are due, routes by platform,
 * publishes to IG Graph API (image, reel, carousel).
 * Multi-tenant: all users processed in one run.
 */

import { createServiceClient } from '@/lib/supabase/service'
import { publishToFacebook, type PublishResult } from './publish/facebook'
import { publishToX } from './publish/x'
import { publishToYouTube } from './publish/youtube'

interface PublisherResult {
  processed: number
  posted: number
  errors: number
}

export async function runPublisher(): Promise<PublisherResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any
  let processed = 0, posted = 0, errors = 0

  // All due scheduled posts across every user + platform.
  const { data: duePosts } = await supabase
    .from('content_queue')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_time', new Date().toISOString())
    .order('scheduled_time', { ascending: true })

  if (!duePosts?.length) return { processed: 0, posted: 0, errors: 0 }

  for (const post of duePosts) {
    processed++
    let result: PublishResult = { ok: false, error: `unsupported platform: ${post.platform}` }

    try {
      if (post.platform === 'instagram') {
        const meta = await getMetaAccount(supabase, post.user_id)
        if (!meta?.page_token || !meta?.ig_business_id) {
          result = { ok: false, error: 'Instagram not connected' }
        } else {
          result = await publishToInstagram(post, meta.ig_business_id, meta.page_token)
        }
      } else if (post.platform === 'facebook') {
        const meta = await getMetaAccount(supabase, post.user_id)
        if (!meta?.page_token || !meta?.page_id) {
          result = { ok: false, error: 'Facebook Page not connected' }
        } else {
          result = await publishToFacebook(post, meta.page_id, meta.page_token)
        }
      } else if (post.platform === 'x') {
        result = await publishToX(post)
      } else if (post.platform === 'youtube') {
        const yt = await getAccount(supabase, post.user_id, 'youtube')
        result = await publishToYouTube(post, yt?.page_token_encrypted ?? '')
      }
    } catch (err) {
      result = { ok: false, error: err instanceof Error ? err.message : 'publish error' }
    }

    if (result.ok) {
      await supabase
        .from('content_queue')
        .update({ status: 'posted', posted_at: new Date().toISOString(), ig_media_id: result.externalId ?? null })
        .eq('id', post.id)
      posted++
    } else {
      await supabase
        .from('content_queue')
        .update({ status: 'failed', schedule_reason: result.error ?? null })
        .eq('id', post.id)
      errors++
      console.error('[publisher]', post.platform, post.id, '→', result.error)
    }
  }

  return { processed, posted, errors }
}

/**
 * The Meta connection stores ONE social_accounts row (platform 'instagram')
 * that holds the Page token + page_id + IG business id. Both IG and FB
 * publishing read from it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getMetaAccount(supabase: any, userId: string) {
  const { data } = await supabase
    .from('social_accounts')
    .select('page_token_encrypted, page_id, external_account_id')
    .eq('user_id', userId)
    .not('page_token_encrypted', 'is', null)
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return { page_token: data.page_token_encrypted, page_id: data.page_id, ig_business_id: data.external_account_id }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAccount(supabase: any, userId: string, platform: string) {
  const { data } = await supabase
    .from('social_accounts')
    .select('page_token_encrypted, external_account_id')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('status', 'active')
    .maybeSingle()
  return data
}

const IG_GRAPH = 'https://graph.facebook.com/v23.0'

/** Publish the finished container, returning the new media id or an error. */
async function igPublish(igBusinessId: string, creationId: string, pageToken: string): Promise<PublishResult> {
  const res = await fetch(`${IG_GRAPH}/${igBusinessId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId, access_token: pageToken }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.id) return { ok: false, error: `IG publish: ${JSON.stringify(json.error ?? json)}` }
  return { ok: true, externalId: json.id }
}

/**
 * Poll a container's status_code until FINISHED. Video (Reels/carousel video
 * children) must finish processing before media_publish — a fixed wait races
 * and fails with "Media ID is not available". Images finish immediately.
 */
async function waitForContainer(creationId: string, pageToken: string): Promise<PublishResult> {
  const maxAttempts = 20 // ~2 min at 6s — within the route's 300s budget
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${IG_GRAPH}/${creationId}?fields=status_code&access_token=${pageToken}`)
    const json = await res.json().catch(() => ({}))
    const code = json.status_code
    if (code === 'FINISHED') return { ok: true }
    if (code === 'ERROR' || code === 'EXPIRED') return { ok: false, error: `IG media processing ${code}` }
    await sleep(6000)
  }
  return { ok: false, error: 'IG media still processing after timeout' }
}

async function publishToInstagram(
  post: Record<string, unknown>,
  igBusinessId: string,
  pageToken: string
): Promise<PublishResult> {
  const mediaUrl = String(post.media_url ?? '')
  const caption = String(post.caption ?? '')

  const isVideo = /\.(mp4|mov)$/i.test(mediaUrl)
  const isCarousel = Array.isArray(post.media_url) || (typeof mediaUrl === 'string' && mediaUrl.startsWith('['))

  if (isCarousel) {
    return publishCarousel(post, igBusinessId, pageToken)
  }

  const containerBody: Record<string, string> = { caption, access_token: pageToken }
  if (isVideo) {
    containerBody.media_type = 'REELS'
    containerBody.video_url = mediaUrl
  } else {
    containerBody.image_url = mediaUrl
  }

  const containerRes = await fetch(`${IG_GRAPH}/${igBusinessId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(containerBody),
  })
  const containerJson = await containerRes.json().catch(() => ({}))
  if (!containerRes.ok || !containerJson.id) {
    return { ok: false, error: `IG container: ${JSON.stringify(containerJson.error ?? containerJson)}` }
  }

  const ready = await waitForContainer(containerJson.id, pageToken)
  if (!ready.ok) return ready

  return igPublish(igBusinessId, containerJson.id, pageToken)
}

async function publishCarousel(
  post: Record<string, unknown>,
  igBusinessId: string,
  pageToken: string
): Promise<PublishResult> {
  let urls: string[]
  try {
    urls = typeof post.media_url === 'string' ? JSON.parse(post.media_url) : (post.media_url as string[])
  } catch {
    return { ok: false, error: 'IG carousel: invalid media_url' }
  }

  // Create + await each child container.
  const childIds: string[] = []
  for (const url of urls) {
    const isVideo = /\.(mp4|mov)$/i.test(url)
    const body: Record<string, string | boolean> = { is_carousel_item: true, access_token: pageToken }
    if (isVideo) {
      body.media_type = 'VIDEO'
      body.video_url = url
    } else {
      body.image_url = url
    }

    const res = await fetch(`${IG_GRAPH}/${igBusinessId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.id) return { ok: false, error: `IG carousel child: ${JSON.stringify(json.error ?? json)}` }
    const ready = await waitForContainer(json.id, pageToken)
    if (!ready.ok) return ready
    childIds.push(json.id)
  }

  const carouselRes = await fetch(`${IG_GRAPH}/${igBusinessId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: childIds.join(','),
      caption: String(post.caption ?? ''),
      access_token: pageToken,
    }),
  })
  const carouselJson = await carouselRes.json().catch(() => ({}))
  if (!carouselRes.ok || !carouselJson.id) {
    return { ok: false, error: `IG carousel container: ${JSON.stringify(carouselJson.error ?? carouselJson)}` }
  }

  const ready = await waitForContainer(carouselJson.id, pageToken)
  if (!ready.ok) return ready

  return igPublish(igBusinessId, carouselJson.id, pageToken)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
