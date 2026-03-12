import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { QuoteStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export const statusConfig: Record<
  QuoteStatus,
  { label: string; color: string; bg: string }
> = {
  borrador: {
    label: "Borrador",
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
  enviado: {
    label: "Enviado",
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  visto: {
    label: "Visto",
    color: "text-yellow-600",
    bg: "bg-yellow-100",
  },
  aceptado: {
    label: "Aceptado",
    color: "text-green-600",
    bg: "bg-green-100",
  },
  rechazado: {
    label: "Rechazado",
    color: "text-red-600",
    bg: "bg-red-100",
  },
  expirado: {
    label: "Expirado",
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
};

export function getPublicUrl(token: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/c/${token}`;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function calcLineItem(
  quantity: number,
  unitPrice: number,
  discount: number,
  tax: number
): { subtotal: number; total: number } {
  const subtotal = quantity * unitPrice * (1 - discount / 100);
  const total = subtotal * (1 + tax / 100);
  return { subtotal, total };
}
