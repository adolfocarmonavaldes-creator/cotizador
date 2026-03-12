"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Client } from "@/types";

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .single();
  if (!business) return [];
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function createClientAction(formData: {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}): Promise<{ error?: string; data?: Client }> {
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .single();
  if (!business) return { error: "No se encontró el negocio" };

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...formData, business_id: business.id })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { data };
}

export async function updateClientAction(
  id: string,
  formData: Partial<Client>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update(formData)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return {};
}

export async function deleteClientAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return {};
}
