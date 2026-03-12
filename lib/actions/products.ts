"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Product } from "@/types";

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .single();
  if (!business) return [];
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function createProductAction(formData: {
  name: string;
  description?: string;
  price: number;
  tax: number;
  category?: string;
}): Promise<{ error?: string; data?: Product }> {
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .single();
  if (!business) return { error: "No se encontró el negocio" };

  const { data, error } = await supabase
    .from("products")
    .insert({ ...formData, business_id: business.id })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/productos");
  return { data };
}

export async function updateProductAction(
  id: string,
  formData: Partial<Product>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(formData)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/productos");
  return {};
}

export async function deleteProductAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/productos");
  return {};
}
