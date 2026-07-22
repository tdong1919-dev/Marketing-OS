function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function withoutTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isSupabaseProjectUrl(value: string) {
  if (!value) return false;

  try {
    const hostname = new URL(value).hostname;
    return hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function decodeBase64Url(value: string) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  if (typeof globalThis.atob !== "function") return "";
  return globalThis.atob(normalized);
}

function projectRefFromLegacyJwt(value: string) {
  const payload = value.split(".")[1];
  if (!payload) return "";

  try {
    const decoded = JSON.parse(decodeBase64Url(payload)) as { ref?: unknown };
    return typeof decoded.ref === "string" ? decoded.ref : "";
  } catch {
    return "";
  }
}

export function supabaseUrl() {
  const explicitUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (isSupabaseProjectUrl(explicitUrl)) return withoutTrailingSlash(explicitUrl);

  const inferredProjectRef = projectRefFromLegacyJwt(supabaseAnonKey());
  if (inferredProjectRef) return `https://${inferredProjectRef}.supabase.co`;

  return withoutTrailingSlash(explicitUrl);
}

export function supabaseAnonKey() {
  return cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseServiceRoleKey() {
  return cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
