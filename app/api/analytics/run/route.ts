/**
 * Analytics fetch trigger — POST to sync analytics for all active accounts.
 * Called by Vercel Cron (every 6 hours).
 */

import { NextRequest, NextResponse } from 'next/server'
import { runAnalyticsFetch } from '@/lib/agent/analytics-fetcher'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runAnalyticsFetch()
  return NextResponse.json({ success: true, ...result })
}

// Vercel Cron triggers endpoints with a GET request, so alias GET to the same
// handler. The CRON_SECRET bearer check inside still applies.
export const GET = POST
