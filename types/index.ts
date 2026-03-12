export type QuoteStatus =
  | "borrador"
  | "enviado"
  | "visto"
  | "aceptado"
  | "rechazado"
  | "expirado";

export interface Business {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  brand_color: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  terms: string | null;
  footer_text: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  business_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  tax: number;
  category: string | null;
  created_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  subtotal: number;
  total: number;
  sort_order: number;
}

export interface Quote {
  id: string;
  business_id: string;
  client_id: string | null;
  token: string;
  number: number;
  status: QuoteStatus;
  subtotal: number;
  tax_total: number;
  total: number;
  notes: string | null;
  terms: string | null;
  expires_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  clients?: Client;
  quote_items?: QuoteItem[];
}

export interface QuoteWithDetails extends Quote {
  clients: Client;
  quote_items: QuoteItem[];
  businesses?: Business;
}

export interface DashboardStats {
  total: number;
  aceptadas: number;
  pendientes: number;
  ingresos: number;
}
