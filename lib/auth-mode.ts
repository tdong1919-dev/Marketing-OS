const loginDisabledValue = (
  process.env.JIDOKA_LOGIN_DISABLED ?? process.env.BRKFREE_LOGIN_DISABLED
)
  ?.trim()
  .toLowerCase();

export const LOGIN_DISABLED = ["1", "true", "yes", "on"].includes(
  loginDisabledValue ?? "false",
);

export const DEMO_SESSION_ERROR =
  "Demo access is not available yet. Add SUPABASE_SERVICE_ROLE_KEY, set JIDOKA_DEMO_OWNER_ID or JIDOKA_DEMO_EMAIL, or set JIDOKA_LOGIN_DISABLED=0 to turn login back on.";
