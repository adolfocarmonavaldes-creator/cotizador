"use client";
import { useState, useEffect } from "react";
import { getProducts, createProductAction, updateProductAction, deleteProductAction } from "@/lib/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Package, Search } from "lucide-react";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const emptyForm = { name: "", description: "", price: "", tax: "16", category: "" };

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    const data = await getProducts();
    setProducts(data);
  }

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({ name: p.name, description: p.description || "", price: String(p.price), tax: String(p.tax), category: p.category || "" });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const data = { name: form.name, description: form.description, price: Number(form.price), tax: Number(form.tax), category: form.category };
    if (editing) {
      const { error } = await updateProductAction(editing.id, data);
      if (error) { toast({ title: "Error", description: error, variant: "destructive" }); }
      else { toast({ title: "Producto actualizado" }); setOpen(false); loadProducts(); }
    } else {
      const { error } = await createProductAction(data);
      if (error) { toast({ title: "Error", description: error, variant: "destructive" }); }
      else { toast({ title: "Producto creado" }); setOpen(false); loadProducts(); }
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    const { error } = await deleteProductAction(id);
    if (error) { toast({ title: "Error", description: error, variant: "destructive" }); }
    else { toast({ title: "Producto eliminado" }); loadProducts(); }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos y Servicios</h1>
          <p className="text-gray-500 mt-1">{products.length} ítems en catálogo</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nuevo producto</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar productos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>{products.length === 0 ? "No hay productos todavía." : "Sin resultados."}</p>
              {products.length === 0 && <Button onClick={openNew} className="mt-4" size="sm">Agregar primer producto</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      {p.description && <div className="text-xs text-gray-400 truncate max-w-xs">{p.description}</div>}
                    </TableCell>
                    <TableCell><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.category || "General"}</span></TableCell>
                    <TableCell className="font-medium">{formatCurrency(p.price)}</TableCell>
                    <TableCell className="text-gray-500">{p.tax}%</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto / servicio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pname">Nombre *</Label>
              <Input id="pname" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdesc">Descripción</Label>
              <Input id="pdesc" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label htmlFor="pprice">Precio *</Label>
                <Input id="pprice" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} required />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="ptax">IVA %</Label>
                <Input id="ptax" type="number" step="0.01" min="0" max="100" value={form.tax} onChange={e => setForm(f => ({...f, tax: e.target.value}))} />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="pcat">Categoría</Label>
                <Input id="pcat" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
