"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Business } from "@/types";

export async function getBusiness(): Promise<Business | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("businesses").select("*").single();
  return data;
}

export async function updateBusinessAction(
  formData: Partial<Business>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update(formData)
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id);
  if (error) return { error: error.message };
  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  return {};
}

export async function uploadLogoAction(
  file: File
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const ext = file.name.split(".").pop();
  const filename = `${user.id}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(filename, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("logos")
    .getPublicUrl(filename);

  await supabase
    .from("businesses")
    .update({ logo_url: publicUrl })
    .eq("user_id", user.id);

  revalidatePath("/configuracion");
  return { url: publicUrl };
}
