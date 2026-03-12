"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getQuotes, deleteQuoteAction, duplicateQuoteAction, updateQuoteStatusAction } from "@/lib/actions/quotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, FileText, MoreHorizontal, Eye, Copy, Trash2, Send, ExternalLink } from "lucide-react";
import { Quote, QuoteStatus } from "@/types";
import { formatCurrency, formatDate, statusConfig, getPublicUrl } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function CotizacionesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  useEffect(() => { loadQuotes(); }, []);

  async function loadQuotes() {
    const data = await getQuotes();
    setQuotes(data);
  }

  async function handleDuplicate(id: string) {
    const { error, data } = await duplicateQuoteAction(id);
    if (error) { toast({ title: "Error", description: error, variant: "destructive" }); }
    else { toast({ title: "Cotización duplicada" }); loadQuotes(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta cotización?")) return;
    const { error } = await deleteQuoteAction(id);
    if (error) { toast({ title: "Error", description: error, variant: "destructive" }); }
    else { toast({ title: "Cotización eliminada" }); loadQuotes(); }
  }

  async function handleMarkSent(id: string) {
    await updateQuoteStatusAction(id, "enviado");
    loadQuotes();
    toast({ title: "Estado actualizado a Enviado" });
  }

  const statuses: { value: string; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "borrador", label: "Borradores" },
    { value: "enviado", label: "Enviadas" },
    { value: "visto", label: "Vistas" },
    { value: "aceptado", label: "Aceptadas" },
    { value: "rechazado", label: "Rechazadas" },
    { value: "expirado", label: "Expiradas" },
  ];

  const filtered = quotes.filter(q => {
    const matchSearch = (q as any).clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(q.number).includes(search);
    const matchStatus = filterStatus === "todos" || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-500 mt-1">{quotes.length} cotizaciones en total</p>
        </div>
        <Button asChild><Link href="/cotizaciones/nueva"><Plus className="w-4 h-4 mr-2" />Nueva cotización</Link></Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar por cliente o número..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {statuses.map(s => (
                <button key={s.value} onClick={() => setFilterStatus(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s.value ? "bg-violet-100 text-violet-700" : "text-gray-500 hover:bg-gray-100"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>{quotes.length === 0 ? "No hay cotizaciones todavía." : "Sin resultados."}</p>
              {quotes.length === 0 && <Button asChild className="mt-4" size="sm"><Link href="/cotizaciones/nueva">Crear primera cotización</Link></Button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(q => {
                  const status = statusConfig[q.status as QuoteStatus];
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-sm text-gray-500">#{q.number}</TableCell>
                      <TableCell className="font-medium">{(q as any).clients?.name || "Sin cliente"}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(q.total)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>{status.label}</span>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{q.expires_at ? formatDate(q.expires_at) : "—"}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{formatDate(q.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/cotizaciones/${q.id}`}><Eye className="w-4 h-4 mr-2" />Ver detalle</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(getPublicUrl(q.token)); toast({ title: "Enlace copiado" }); }}>
                              <ExternalLink className="w-4 h-4 mr-2" />Copiar enlace
                            </DropdownMenuItem>
                            {q.status === "borrador" && (
                              <DropdownMenuItem onClick={() => handleMarkSent(q.id)}>
                                <Send className="w-4 h-4 mr-2" />Marcar como enviada
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDuplicate(q.id)}>
                              <Copy className="w-4 h-4 mr-2" />Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(q.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
