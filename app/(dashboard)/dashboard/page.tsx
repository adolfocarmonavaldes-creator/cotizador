import Link from "next/link";
import { getDashboardStats, getQuotes } from "@/lib/actions/quotes";
import { getBusiness } from "@/lib/actions/settings";
import { formatCurrency, formatDate, statusConfig } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, CheckCircle, Clock, TrendingUp, Plus } from "lucide-react";
import { QuoteStatus } from "@/types";

export default async function DashboardPage() {
  const [stats, quotes, business] = await Promise.all([
    getDashboardStats(),
    getQuotes(),
    getBusiness(),
  ]);
  const recentQuotes = quotes.slice(0, 10);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {business?.name || "QuoteFlow"}</h1>
          <p className="text-gray-500 mt-1">Aquí tienes un resumen de tu actividad</p>
        </div>
        <Button asChild>
          <Link href="/cotizaciones/nueva"><Plus className="w-4 h-4 mr-2" />Nueva cotización</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total cotizaciones</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Aceptadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{stats.aceptadas}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-yellow-600">{stats.pendientes}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ingresos aprobados</CardTitle>
            <TrendingUp className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-violet-600">{formatCurrency(stats.ingresos)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cotizaciones recientes</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link href="/cotizaciones">Ver todas →</Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentQuotes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No hay cotizaciones todavía.</p>
              <Button asChild className="mt-4" size="sm"><Link href="/cotizaciones/nueva">Crear primera cotización</Link></Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentQuotes.map((quote) => {
                  const status = statusConfig[quote.status as QuoteStatus];
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-mono text-sm text-gray-500">#{quote.number}</TableCell>
                      <TableCell className="font-medium">{(quote as any).clients?.name || "Sin cliente"}</TableCell>
                      <TableCell>{formatCurrency(quote.total)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>{status.label}</span>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{formatDate(quote.created_at)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild><Link href={`/cotizaciones/${quote.id}`}>Ver</Link></Button>
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
