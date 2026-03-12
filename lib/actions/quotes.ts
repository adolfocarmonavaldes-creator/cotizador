"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Quote, QuoteItem, QuoteStatus, QuoteWithDetails } from "@/types";

export async function getQuotes(): Promise<Quote[]> {
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .single();
  if (!business) return [];
  const { data } = await supabase
    .from("quotes")
    .select("*, clients(name, company, email)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  return (data as Quote[]) || [];
}

export async function getQuote(id: string): Promise<QuoteWithDetails | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("*, clients(*), quote_items(*)")
    .eq("id", id)
    .single();
  if (!data) return null;
  const quote = data as QuoteWithDetails;
  quote.quote_items = (quote.quote_items || []).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  return quote;
}

export async function getQuoteByToken(
  token: string
): Promise<QuoteWithDetails | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("*, clients(*), quote_items(*), businesses(*)")
    .eq("token", token)
    .single();
  if (!data) return null;
  const quote = data as QuoteWithDetails;
  quote.quote_items = (quote.quote_items || []).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  return quote;
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .single();
  if (!business)
    return { total: 0, aceptadas: 0, pendientes: 0, ingresos: 0 };

  const { data: quotes } = await supabase
    .from("quotes")
    .select("status, total")
    .eq("business_id", business.id);

  if (!quotes) return { total: 0, aceptadas: 0, pendientes: 0, ingresos: 0 };

  const total = quotes.length;
  const aceptadas = quotes.filter((q: { status: string }) => q.status === "aceptado").length;
  const pendientes = quotes.filter(
    (q: { status: string }) => q.status === "enviado" || q.status === "visto"
  ).length;
  const ingresos = quotes
    .filter((q: { status: string }) => q.status === "aceptado")
    .reduce((sum: number, q: { total: number }) => sum + Number(q.total), 0);

  return { total, aceptadas, pendientes, ingresos };
}

export interface QuoteItemInput {
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  subtotal: number;
  total: number;
  sort_order: number;
}

export async function createQuoteAction(formData: {
  client_id?: string;
  notes?: string;
  terms?: string;
  expires_at?: string;
  subtotal: number;
  tax_total: number;
  total: number;
  items: QuoteItemInput[];
}): Promise<{ error?: string; data?: Quote }> {
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, terms")
    .single();
  if (!business) return { error: "No se encontró el negocio" };

  const { items, ...quoteData } = formData;

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      ...quoteData,
      business_id: business.id,
      terms: formData.terms || business.terms,
    })
    .select()
    .single();

  if (quoteError || !quote) return { error: quoteError?.message };

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("quote_items").insert(
      items.map((item) => ({ ...item, quote_id: quote.id }))
    );
    if (itemsError) return { error: itemsError.message };
  }

  revalidatePath("/cotizaciones");
  return { data: quote as Quote };
}

export async function updateQuoteAction(
  id: string,
  formData: {
    client_id?: string;
    notes?: string;
    terms?: string;
    expires_at?: string;
    subtotal: number;
    tax_total: number;
    total: number;
    items: QuoteItemInput[];
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { items, ...quoteData } = formData;

  const { error: quoteError } = await supabase
    .from("quotes")
    .update({ ...quoteData, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (quoteError) return { error: quoteError.message };

  // Replace all items
  await supabase.from("quote_items").delete().eq("quote_id", id);
  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("quote_items").insert(
      items.map((item) => ({ ...item, quote_id: id }))
    );
    if (itemsError) return { error: itemsError.message };
  }

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${id}`);
  return {};
}

export async function updateQuoteStatusAction(
  id: string,
  status: QuoteStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${id}`);
  return {};
}

export async function deleteQuoteAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cotizaciones");
  return {};
}

export async function duplicateQuoteAction(id: string): Promise<{ error?: string; data?: Quote }> {
  const supabase = await createClient();
  const quote = await getQuote(id);
  if (!quote) return { error: "Cotización no encontrada" };

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .single();
  if (!business) return { error: "No se encontró el negocio" };

  const { data: newQuote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      business_id: business.id,
      client_id: quote.client_id,
      status: "borrador",
      subtotal: quote.subtotal,
      tax_total: quote.tax_total,
      total: quote.total,
      notes: quote.notes,
      terms: quote.terms,
      expires_at: quote.expires_at,
    })
    .select()
    .single();

  if (quoteError || !newQuote) return { error: quoteError?.message };

  if (quote.quote_items && quote.quote_items.length > 0) {
    await supabase.from("quote_items").insert(
      quote.quote_items.map(({ id: _, quote_id: __, ...item }) => ({
        ...item,
        quote_id: newQuote.id,
      }))
    );
  }

  revalidatePath("/cotizaciones");
  return { data: newQuote as Quote };
}
