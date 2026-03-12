"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getQuote, updateQuoteStatusAction, deleteQuoteAction, duplicateQuoteAction } from "@/lib/actions/quotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Send, Copy, ExternalLink, Trash2, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { QuoteWithDetails, QuoteStatus } from "@/types";
import { formatCurrency, formatDate, statusConfig, getPublicUrl, getWhatsAppUrl } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function CotizacionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadQuote(); }, [id]);

  async function loadQuote() {
    const data = await getQuote(id);
    setQuote(data);
    setLoading(false);
  }

  async function handleStatus(status: QuoteStatus) {
    await updateQuoteStatusAction(id, status);
    loadQuote();
    toast({ title: `Estado actualizado: ${statusConfig[status].label}` });
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar esta cotización? Esta acción no se puede deshacer.")) return;
    await deleteQuoteAction(id);
    router.push("/cotizaciones");
  }

  async function handleDuplicate() {
    const { error, data } = await duplicateQuoteAction(id);
    if (error) { toast({ title: "Error", description: error, variant: "destructive" }); return; }
    toast({ title: "Cotización duplicada" });
    router.push(`/cotizaciones/${data?.id}`);
  }

  function copyLink() {
    if (!quote) return;
    navigator.clipboard.writeText(getPublicUrl(quote.token));
    toast({ title: "Enlace copiado al portapapeles" });
  }

  function sendWhatsApp() {
    if (!quote) return;
    const phone = quote.clients?.phone || "";
    const msg = `Hola ${quote.clients?.name}, te comparto la cotización #${quote.number}: ${getPublicUrl(quote.token)}`;
    const url = phone ? getWhatsAppUrl(phone, msg) : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  function sendEmail() {
    if (!quote) return;
    const to = quote.clients?.email || "";
    const subject = `Cotización #${quote.number}`;
    const body = `Hola ${quote.clients?.name},\n\nAdjunto el enlace a tu cotización:\n${getPublicUrl(quote.token)}\n\nQuedamos a tus órdenes.`;
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    handleStatus("enviado");
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  if (!quote) return <div className="p-8 text-center text-gray-400">Cotización no encontrada.</div>;

  const status = statusConfig[quote.status as QuoteStatus];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/cotizaciones"><ArrowLeft className="w-4 h-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cotización #{quote.number}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>{status.label}</span>
              <span className="text-gray-400 text-sm">Creada {formatDate(quote.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={copyLink}><ExternalLink className="w-4 h-4 mr-1" />Copiar enlace</Button>
          <Button variant="outline" size="sm" onClick={sendWhatsApp}><MessageCircle className="w-4 h-4 mr-1" />WhatsApp</Button>
          <Button variant="outline" size="sm" onClick={sendEmail}><Send className="w-4 h-4 mr-1" />Email</Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, "_blank")}><Download className="w-4 h-4 mr-1" />PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quote document preview */}
          <Card>
            <CardContent className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="text-2xl font-bold text-gray-900">COTIZACIÓN</div>
                  <div className="text-gray-400 text-sm mt-1">#{quote.number}</div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>Fecha: {formatDate(quote.created_at)}</div>
                  {quote.expires_at && <div>Vence: {formatDate(quote.expires_at)}</div>}
                </div>
              </div>

              {/* Client info */}
              {quote.clients && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-400 uppercase mb-2">Para</div>
                  <div className="font-semibold text-gray-900">{quote.clients.name}</div>
                  {quote.clients.company && <div className="text-sm text-gray-600">{quote.clients.company}</div>}
                  {quote.clients.email && <div className="text-sm text-gray-500">{quote.clients.email}</div>}
                  {quote.clients.address && <div className="text-sm text-gray-500">{quote.clients.address}</div>}
                </div>
              )}

              {/* Items table */}
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Descripción</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Cant.</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Precio</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Desc.</th>
                    <th className="text-right py-2 text-gray-500 font-medium">IVA</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(quote.quote_items || []).map(item => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.description && <div className="text-xs text-gray-400">{item.description}</div>}
                      </td>
                      <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 text-right text-gray-600">{item.discount > 0 ? `${item.discount}%` : "—"}</td>
                      <td className="py-3 text-right text-gray-600">{item.tax}%</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(quote.subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">IVA</span><span>{formatCurrency(quote.tax_total)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(quote.total)}</span></div>
                </div>
              </div>

              {/* Notes */}
              {quote.notes && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-400 uppercase mb-2">Notas</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</div>
                </div>
              )}
              {quote.terms && (
                <div className="mt-4">
                  <div className="text-xs font-medium text-gray-400 uppercase mb-2">Términos y condiciones</div>
                  <div className="text-xs text-gray-500 whitespace-pre-wrap">{quote.terms}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {quote.status === "borrador" && (
                <Button className="w-full" onClick={sendEmail}><Send className="w-4 h-4 mr-2" />Enviar al cliente</Button>
              )}
              {(quote.status === "enviado" || quote.status === "visto") && (
                <>
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleStatus("aceptado")}><CheckCircle className="w-4 h-4 mr-2" />Marcar aceptada</Button>
                  <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatus("rechazado")}><XCircle className="w-4 h-4 mr-2" />Marcar rechazada</Button>
                </>
              )}
              <Button variant="outline" className="w-full" onClick={handleDuplicate}><Copy className="w-4 h-4 mr-2" />Duplicar</Button>
              <Button variant="outline" className="w-full text-red-600 hover:text-red-700" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Eliminar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Compartir</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="p-2 bg-gray-50 rounded text-xs text-gray-500 break-all">{getPublicUrl(quote.token)}</div>
              <Button variant="outline" className="w-full" size="sm" onClick={copyLink}><ExternalLink className="w-4 h-4 mr-2" />Copiar enlace</Button>
              <Button variant="outline" className="w-full" size="sm" onClick={sendWhatsApp}><MessageCircle className="w-4 h-4 mr-2" />Enviar por WhatsApp</Button>
              <Button variant="outline" className="w-full" size="sm" onClick={sendEmail}><Send className="w-4 h-4 mr-2" />Enviar por Email</Button>
            </CardContent>
          </Card>

          {quote.viewed_at && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500">Visto el {formatDate(quote.viewed_at)}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
