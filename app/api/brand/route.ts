import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BrandProfile, BrandProfileInsert } from '@/lib/types/database'

// GET /api/brand — fetch the authenticated user's brand profile
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: replace mock with real Supabase query
  // const { data, error } = await supabase
  //   .from('brand_profiles')
  //   .select('*, services(*)')
  //   .eq('user_id', user.id)
  //   .maybeSingle()
  // if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mock: Partial<BrandProfile> = {
    id: 'mock-brand-id',
    user_id: user.id,
    business_name: 'Acme Beauty Studio',
    industry: 'Beauty',
    website_url: 'https://acme.example.com',
    description: 'Premium skincare & beauty services.',
    tone: ['Friendly', 'Luxe'],
    cta_keywords: ['price', 'booking'],
    escalation_rules: 'Do not reply to complaints about staff.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return NextResponse.json({ data: mock })
}

// POST /api/brand — create or update (upsert) the brand profile
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: Partial<BrandProfileInsert> = await request.json()

  // TODO: validate with Zod schema
  // TODO: upsert into brand_profiles table
  // const { data, error } = await supabase
  //   .from('brand_profiles')
  //   .upsert({ ...body, user_id: user.id }, { onConflict: 'user_id' })
  //   .select()
  //   .single()
  // if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mock: Partial<BrandProfile> = {
    ...body,
    id: 'mock-brand-id',
    user_id: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return NextResponse.json({ data: mock }, { status: 200 })
}

// PUT /api/brand — alias for POST (upsert semantics)
export const PUT = POST
