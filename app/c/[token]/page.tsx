import { getQuoteByToken } from "@/lib/actions/quotes";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, statusConfig } from "@/lib/utils";
import { notFound } from "next/navigation";
import { QuoteStatus } from "@/types";
import PublicQuoteActions from "./actions";

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quote = await getQuoteByToken(token);

  if (!quote) notFound();

  // Mark as viewed if first time
  if (!quote.viewed_at && quote.status === "enviado") {
    const supabase = await createClient();
    await supabase.from("quotes").update({ status: "visto", viewed_at: new Date().toISOString() }).eq("token", token);
  }

  const business = (quote as any).businesses;
  const client = quote.clients;
  const items = quote.quote_items || [];
  const brandColor = business?.brand_color || "#6366f1";
  const status = statusConfig[quote.status as QuoteStatus];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          {business?.logo_url ? (
            <img src={business.logo_url} alt={business.name} className="h-8 w-auto object-contain" />
          ) : (
            <div className="font-bold text-lg text-gray-900" style={{ color: brandColor }}>{business?.name || "QuoteFlow"}</div>
          )}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>{status.label}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Quote header */}
          <div className="p-8 border-b border-gray-100" style={{ backgroundColor: brandColor + "10" }}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">COTIZACIÓN</h1>
                <div className="text-gray-500 mt-1 font-mono">#{quote.number}</div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>Fecha: {formatDate(quote.created_at)}</div>
                {quote.expires_at && <div className="font-medium text-orange-600">Vence: {formatDate(quote.expires_at)}</div>}
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* From / To */}
            <div className="grid grid-cols-2 gap-8">
              {business && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase mb-2">De</div>
                  <div className="font-semibold text-gray-900">{business.name}</div>
                  {business.email && <div className="text-sm text-gray-500">{business.email}</div>}
                  {business.phone && <div className="text-sm text-gray-500">{business.phone}</div>}
                  {business.address && <div className="text-sm text-gray-500">{business.address}</div>}
                </div>
              )}
              {client && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Para</div>
                  <div className="font-semibold text-gray-900">{client.name}</div>
                  {client.company && <div className="text-sm text-gray-600">{client.company}</div>}
                  {client.email && <div className="text-sm text-gray-500">{client.email}</div>}
                  {client.address && <div className="text-sm text-gray-500">{client.address}</div>}
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 font-semibold text-gray-700">Descripción</th>
                    <th className="text-right py-3 font-semibold text-gray-700">Cant.</th>
                    <th className="text-right py-3 font-semibold text-gray-700">Precio</th>
                    <th className="text-right py-3 font-semibold text-gray-700">IVA</th>
                    <th className="text-right py-3 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                      </td>
                      <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-4 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                      <td className="py-4 text-right text-gray-600">{item.tax}%</td>
                      <td className="py-4 text-right font-semibold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(quote.subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">IVA</span><span>{formatCurrency(quote.tax_total)}</span></div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span><span style={{ color: brandColor }}>{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Notas</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</div>
              </div>
            )}

            {/* Accept / Reject */}
            {(quote.status === "enviado" || quote.status === "visto") && (
              <PublicQuoteActions quoteId={quote.id} brandColor={brandColor} />
            )}

            {quote.status === "aceptado" && (
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="text-green-600 font-semibold text-lg">✓ Cotización aceptada</div>
                <div className="text-green-500 text-sm mt-1">Gracias por tu confirmación. Nos pondremos en contacto contigo pronto.</div>
              </div>
            )}

            {quote.status === "rechazado" && (
              <div className="text-center p-6 bg-red-50 rounded-xl">
                <div className="text-red-600 font-semibold">Cotización rechazada</div>
              </div>
            )}

            {/* Terms */}
            {quote.terms && (
              <div className="text-xs text-gray-400 whitespace-pre-wrap border-t pt-6">
                <div className="font-semibold uppercase mb-1">Términos y condiciones</div>
                {quote.terms}
              </div>
            )}

            {/* Download */}
            <div className="flex justify-center pt-4 border-t">
              <a href={`/api/quotes/${quote.id}/pdf`} target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                ↓ Descargar PDF
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        {business?.footer_text && (
          <p className="text-center text-sm text-gray-400 mt-6">{business.footer_text}</p>
        )}
      </main>
    </div>
  );
}
