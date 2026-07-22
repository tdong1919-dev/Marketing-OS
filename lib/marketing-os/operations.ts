export const OPS_MIGRATION_PATH =
  "supabase/migrations/0016_marketing_os_campaign_operations.sql";

export const WORKFLOW_STAGES = [
  "strategy",
  "work",
  "content",
  "approval",
  "publishing",
  "leads",
  "revenue",
  "insights",
  "improvement",
] as const;

export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export type DbError = {
  code?: string;
  message?: string;
  details?: string;
};

type DynamicResult = {
  data: unknown;
  error: DbError | null;
  count?: number | null;
};

type DynamicBuilder = PromiseLike<DynamicResult> & {
  select: (columns?: string, options?: Record<string, unknown>) => DynamicBuilder;
  insert: (
    values: Record<string, unknown> | Record<string, unknown>[],
  ) => DynamicBuilder;
  upsert: (
    values: Record<string, unknown> | Record<string, unknown>[],
    options?: Record<string, unknown>,
  ) => DynamicBuilder;
  update: (values: Record<string, unknown>) => DynamicBuilder;
  delete: () => DynamicBuilder;
  eq: (column: string, value: unknown) => DynamicBuilder;
  neq: (column: string, value: unknown) => DynamicBuilder;
  in: (column: string, values: unknown[]) => DynamicBuilder;
  is: (column: string, value: unknown) => DynamicBuilder;
  gte: (column: string, value: unknown) => DynamicBuilder;
  lte: (column: string, value: unknown) => DynamicBuilder;
  order: (column: string, options?: Record<string, unknown>) => DynamicBuilder;
  limit: (count: number) => DynamicBuilder;
  maybeSingle: () => Promise<DynamicResult>;
  single: () => Promise<DynamicResult>;
};

type DynamicSupabase = {
  from: (table: string) => DynamicBuilder;
};

export type CampaignRow = {
  id: string;
  owner_id: string;
  client_id: string | null;
  name: string;
  campaign_type: string;
  status: string;
  stage: WorkflowStage;
  health: string;
  priority: string;
  goal: string | null;
  primary_kpi: string | null;
  target_audience: string | null;
  owner_name: string | null;
  budget: number;
  actual_spend: number;
  expected_revenue: number;
  attributed_revenue: number;
  lead_goal: number;
  leads_count: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientOption = {
  id: string;
  name: string;
  industry?: string | null;
};

export type WorkItemRow = {
  id: string;
  campaign_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  work_type: string;
  status: string;
  priority: string;
  assignee_name: string | null;
  due_at: string | null;
  estimate_hours: number | null;
  actual_hours: number | null;
  created_at: string;
  updated_at: string;
};

export type ContentIdeaRow = {
  id: string;
  campaign_id: string | null;
  client_id: string | null;
  agent_id: string | null;
  title: string;
  description: string | null;
  source: string;
  format: string | null;
  platform: string | null;
  funnel_stage: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type LeadRow = {
  id: string;
  campaign_id: string | null;
  client_id: string | null;
  lead_name: string | null;
  email: string | null;
  status: string;
  estimated_value: number;
  actual_value: number;
  created_at: string;
};

export type RevenueEventRow = {
  id: string;
  campaign_id: string | null;
  client_id: string | null;
  amount: number;
  event_type: string;
  occurred_at: string;
};

export function opsTable(supabase: unknown, table: string): DynamicBuilder {
  return (supabase as DynamicSupabase).from(table);
}

export function isOpsSchemaMissing(error: DbError | null | undefined) {
  if (!error) return false;
  const text = [error.code, error.message, error.details]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    text.includes("42p01") ||
    text.includes("42703") ||
    text.includes("pgrst204") ||
    text.includes("pgrst205") ||
    text.includes("could not find") ||
    text.includes("does not exist") ||
    text.includes("schema cache")
  );
}

export function asRows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function asRow<T>(value: unknown): T | null {
  return value && typeof value === "object" ? (value as T) : null;
}

export function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function titleCase(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function progressPercent(done: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export function currentWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff)
    .toISOString()
    .slice(0, 10);
}
