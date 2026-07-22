import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import {
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type KeyReport = {
  present: boolean;
  length: number;
  fingerprint: string | null;
  format: "legacy-jwt" | "publishable" | "secret" | "unknown";
  jwtRef: string | null;
  jwtRole: string | null;
  jwtExpiresAt: string | null;
  decodeError?: string;
};

function projectRefFromUrl(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

function fingerprint(value: string) {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function decodeJwtPayload(value: string) {
  const payload = value.split(".")[1];
  if (!payload) throw new Error("Not a JWT");
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    ref?: string;
    role?: string;
    exp?: number;
  };
}

function inspectKey(value: string): KeyReport {
  const format = value.startsWith("eyJ")
    ? "legacy-jwt"
    : value.startsWith("sb_publishable_")
      ? "publishable"
      : value.startsWith("sb_secret_")
        ? "secret"
        : "unknown";
  const report: KeyReport = {
    present: Boolean(value),
    length: value.length,
    fingerprint: fingerprint(value),
    format,
    jwtRef: null,
    jwtRole: null,
    jwtExpiresAt: null,
  };

  if (format !== "legacy-jwt") return report;

  try {
    const payload = decodeJwtPayload(value);
    report.jwtRef = payload.ref ?? null;
    report.jwtRole = payload.role ?? null;
    report.jwtExpiresAt = payload.exp
      ? new Date(payload.exp * 1000).toISOString()
      : null;
  } catch (error) {
    report.decodeError = error instanceof Error ? error.message : "Could not decode";
  }

  return report;
}

async function checkRest(url: string, key: string) {
  if (!url || !key) {
    return { ok: false, status: null, statusText: "Missing URL or key" };
  }

  try {
    const res = await fetch(`${url}/rest/v1/marketing_os_clients?select=id&limit=1`, {
      method: "HEAD",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });
    return { ok: res.ok, status: res.status, statusText: res.statusText };
  } catch (error) {
    return {
      ok: false,
      status: null,
      statusText: error instanceof Error ? error.message : "Request failed",
    };
  }
}

async function checkAuthAdmin(url: string, key: string) {
  if (!url || !key) {
    return { ok: false, status: null, statusText: "Missing URL or key" };
  }

  try {
    const res = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });
    return { ok: res.ok, status: res.status, statusText: res.statusText };
  } catch (error) {
    return {
      ok: false,
      status: null,
      statusText: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export async function GET() {
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  const service = supabaseServiceRoleKey();
  const projectRef = projectRefFromUrl(url);
  const anonReport = inspectKey(anon);
  const serviceReport = inspectKey(service);

  return NextResponse.json({
    ok:
      Boolean(url) &&
      anonReport.present &&
      serviceReport.present &&
      anonReport.fingerprint !== serviceReport.fingerprint,
    project: {
      url,
      refFromUrl: projectRef,
    },
    anon: {
      ...anonReport,
      refMatchesUrl: anonReport.jwtRef ? anonReport.jwtRef === projectRef : null,
      roleIsAnon: anonReport.jwtRole ? anonReport.jwtRole === "anon" : null,
    },
    service: {
      ...serviceReport,
      refMatchesUrl: serviceReport.jwtRef ? serviceReport.jwtRef === projectRef : null,
      roleIsServiceRole: serviceReport.jwtRole
        ? serviceReport.jwtRole === "service_role"
        : null,
      sameAsAnon: serviceReport.fingerprint === anonReport.fingerprint,
    },
    checks: {
      anonRest: await checkRest(url, anon),
      serviceRest: await checkRest(url, service),
      serviceAuthAdmin: await checkAuthAdmin(url, service),
    },
  });
}
