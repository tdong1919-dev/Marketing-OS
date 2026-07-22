import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { signup } from "@/app/(auth)/actions";
import { LOGIN_DISABLED } from "@/lib/auth-mode";

export const metadata = { title: "Sign up · Jidoka Marketing Team OS" };

export default function SignupPage() {
  if (LOGIN_DISABLED) {
    redirect("/dashboard");
  }

  return <AuthForm mode="signup" action={signup} />;
}
