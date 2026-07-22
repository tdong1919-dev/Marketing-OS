const MAILCHIMP_AUTH_BASE = "https://login.mailchimp.com/oauth2";

function getMailchimpClientId() {
  return process.env.MAILCHIMP_CLIENT_ID?.trim() ?? "";
}

function getMailchimpClientSecret() {
  return process.env.MAILCHIMP_CLIENT_SECRET?.trim() ?? "";
}

async function readJson(res: Response) {
  const text = await res.text();
  const data = text ? JSON.parse(text) as Record<string, unknown> : {};
  if (!res.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : typeof data.error_description === "string"
          ? data.error_description
          : typeof data.error === "string"
            ? data.error
            : "Mailchimp request failed";
    throw new Error(detail);
  }
  return data;
}

export function isMailchimpOAuthConfigured() {
  return Boolean(getMailchimpClientId() && getMailchimpClientSecret());
}

export function getMailchimpOAuthUrl({
  redirectUri,
  state,
}: {
  redirectUri: string;
  state: string;
}) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: getMailchimpClientId(),
    redirect_uri: redirectUri,
    state,
  });

  return `${MAILCHIMP_AUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeMailchimpCodeForToken({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}) {
  const clientId = getMailchimpClientId();
  const clientSecret = getMailchimpClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("MAILCHIMP_CLIENT_ID and MAILCHIMP_CLIENT_SECRET are required.");
  }

  const res = await fetch(`${MAILCHIMP_AUTH_BASE}/token`, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });
  const data = await readJson(res);
  if (typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("Mailchimp did not return an access token.");
  }
  return data.access_token;
}

export async function fetchMailchimpMetadata(accessToken: string) {
  const res = await fetch(`${MAILCHIMP_AUTH_BASE}/metadata`, {
    headers: { Authorization: `OAuth ${accessToken}` },
  });
  const data = await readJson(res);
  const dc = typeof data.dc === "string" ? data.dc : "";
  if (!dc) throw new Error("Mailchimp did not return an account data center.");

  return {
    dc,
    login:
      typeof data.login === "string"
        ? data.login
        : typeof data.username === "string"
          ? data.username
          : null,
    userId:
      typeof data.user_id === "string" || typeof data.user_id === "number"
        ? String(data.user_id)
        : null,
    raw: data,
  };
}

export async function fetchMailchimpAccountProfile({
  accessToken,
  dc,
}: {
  accessToken: string;
  dc: string;
}) {
  const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await readJson(res);

  return {
    accountId:
      typeof data.account_id === "string" || typeof data.account_id === "number"
        ? String(data.account_id)
        : null,
    accountName:
      typeof data.account_name === "string"
        ? data.account_name
        : typeof data.email === "string"
          ? data.email
          : null,
    email: typeof data.email === "string" ? data.email : null,
    raw: data,
  };
}
