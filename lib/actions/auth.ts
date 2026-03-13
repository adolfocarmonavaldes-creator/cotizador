"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(formData: {
  email: string;
  password: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(formData);
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function registerAction(formData: {
  email: string;
  password: string;
  company_name?: string;
}): Promise<{ error?: string; confirmEmail?: boolean }> {
  const supabase = await createClient();
  const { email, password, company_name } = formData;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { company_name },
    },
  });
  if (error) return { error: error.message };
  // Session is null when email confirmation is required
  if (!data.session) return { confirmEmail: true };
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
