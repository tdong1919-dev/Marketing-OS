import { redirect } from "next/navigation";

import { LOGIN_DISABLED } from "@/lib/auth-mode";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  if (LOGIN_DISABLED) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
