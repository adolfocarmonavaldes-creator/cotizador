"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getClients } from "@/lib/actions/clients";
import { getProducts } from "@/lib/actions/products";
import { createQuoteAction, QuoteItemInput } from "@/lib/actions/quotes";
import { getBusiness } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Client, Product, Business } from "@/types";
import { formatCurrency, calcLineItem } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface LineItem {
  id: string;
  product_id?: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  subtotal: number;
  total: number;
}

function newLine(): LineItem {
  return { id: crypto.randomUUID(), name: "", description: "", quantity: 1, unit_price: 0, discount: 0, tax: 16, subtotal: 0, total: 0 };
}

export default function NuevaCotizacionPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [items, setItems] = useState<LineItem[]>([newLine()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getClients(), getProducts(), getBusiness()]).then(([c, p, b]) => {
      setClients(c); setProducts(p); setBusiness(b);
      if (b?.terms) setTerms(b.terms);
    });
  }, []);

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      const { subtotal, total } = calcLineItem(
        field === "quantity" ? Number(value) : updated.quantity,
        field === "unit_price" ? Number(value) : updated.unit_price,
        field === "discount" ? Number(value) : updated.discount,
        field === "tax" ? Number(value) : updated.tax,
      );
      return { ...updated, subtotal, total };
    }));
  }

  function selectProduct(itemId: string, productId: string) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const { subtotal, total } = calcLineItem(item.quantity, product.price, item.discount, product.tax);
      return { ...item, product_id: product.id, name: product.name, description: product.description || "", unit_price: product.price, tax: product.tax, subtotal, total };
    }));
  }

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const taxTotal = items.reduce((s, i) => s + (i.total - i.subtotal), 0);
  const total = items.reduce((s, i) => s + i.total, 0);

  async function handleSave(draft: boolean) {
    setSaving(true);
    const itemInputs: QuoteItemInput[] = items.map((item, idx) => ({
      product_id: item.product_id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      tax: item.tax,
      subtotal: item.subtotal,
      total: item.total,
      sort_order: idx,
    }));
    const { error, data } = await createQuoteAction({
      client_id: clientId || undefined,
      notes, terms,
      expires_at: expiresAt || undefined,
      subtotal, tax_total: taxTotal, total,
      items: itemInputs,
    });
    if (error) { toast({ title: "Error", description: error, variant: "destructive" }); setSaving(false); return; }
    toast({ title: "Cotización creada" });
    router.push(`/cotizaciones/${data?.id}`);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild><Link href="/cotizaciones"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva cotización</h1>
          <p className="text-gray-500 mt-1">Completa los datos para generar la cotización</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client */}
          <Card>
            <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
            <CardContent>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clients.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  <Link href="/clientes" className="text-violet-600 hover:underline">Agrega clientes primero →</Link>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader><CardTitle>Productos / Servicios</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
                <div className="col-span-4">Descripción</div>
                <div className="col-span-2 text-right">Cant.</div>
                <div className="col-span-2 text-right">Precio</div>
                <div className="col-span-1 text-right">Desc%</div>
                <div className="col-span-1 text-right">IVA%</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              {items.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4 space-y-1">
                    {products.length > 0 && (
                      <Select onValueChange={v => selectProduct(item.id, v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Del catálogo..." /></SelectTrigger>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    <Input className="text-sm" placeholder="Nombre del ítem" value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} />
                    <Input className="text-xs text-gray-500" placeholder="Descripción opcional" value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="0" step="0.01" className="text-right text-sm" value={item.quantity} onChange={e => updateItem(item.id, "quantity", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="0" step="0.01" className="text-right text-sm" value={item.unit_price} onChange={e => updateItem(item.id, "unit_price", e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <Input type="number" min="0" max="100" step="0.01" className="text-right text-sm" value={item.discount} onChange={e => updateItem(item.id, "discount", e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <Input type="number" min="0" max="100" step="0.01" className="text-right text-sm" value={item.tax} onChange={e => updateItem(item.id, "tax", e.target.value)} />
                  </div>
                  <div className="col-span-1 pt-2 text-right text-sm font-medium">{formatCurrency(item.total)}</div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} disabled={items.length === 1}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={() => setItems(prev => [...prev, newLine()])}>
                <Plus className="w-3 h-3 mr-1" />Agregar ítem
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader><CardTitle>Notas y términos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notas para el cliente</Label>
                <Textarea placeholder="Instrucciones, condiciones especiales..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Términos y condiciones</Label>
                <Textarea placeholder="Términos generales de la cotización..." value={terms} onChange={e => setTerms(e.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IVA</span>
                <span>{formatCurrency(taxTotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Opciones</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fecha de vencimiento</Label>
                <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button className="w-full" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? "Guardando..." : "Crear cotización"}
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/cotizaciones">Cancelar</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
