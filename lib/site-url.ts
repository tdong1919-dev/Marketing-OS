function cleanOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getSiteOrigin(request: Request) {
  const jidokaUrl = process.env.JIDOKA_SITE_URL?.trim();
  if (jidokaUrl) return cleanOrigin(jidokaUrl);

  const legacyUrl = process.env.BRKFREE_SITE_URL?.trim();
  if (legacyUrl) return cleanOrigin(legacyUrl);

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return cleanOrigin(configured);

  return cleanOrigin(new URL(request.url).origin);
}
