import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { login } from "@/app/(auth)/actions";
import { LOGIN_DISABLED } from "@/lib/auth-mode";

export const metadata = { title: "Sign in · Jidoka Marketing Team OS" };

export default function LoginPage() {
  if (LOGIN_DISABLED) {
    redirect("/dashboard");
  }

  return <AuthForm mode="login" action={login} />;
}
