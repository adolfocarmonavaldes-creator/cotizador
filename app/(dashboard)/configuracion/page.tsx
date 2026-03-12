"use client";
import { useState, useEffect, useRef } from "react";
import { getBusiness, updateBusinessAction, uploadLogoAction } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Business } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Upload, Palette } from "lucide-react";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#1f2937", "#64748b",
];

export default function ConfiguracionPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState<Partial<Business>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBusiness().then(b => { setBusiness(b); if (b) setForm(b); });
  }, []);

  function update(field: keyof Business, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateBusinessAction(form);
    if (error) { toast({ title: "Error", description: error, variant: "destructive" }); }
    else { toast({ title: "Configuración guardada" }); }
    setSaving(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { error, url } = await uploadLogoAction(file);
    if (error) { toast({ title: "Error al subir logo", description: error, variant: "destructive" }); }
    else { setForm(f => ({ ...f, logo_url: url })); toast({ title: "Logo actualizado" }); }
    setUploading(false);
  }

  if (!business) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración de marca</h1>
        <p className="text-gray-500 mt-1">Personaliza cómo aparece tu empresa en las cotizaciones</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader><CardTitle>Logo de empresa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="h-16 w-auto object-contain border rounded-lg p-2" />
              ) : (
                <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />{uploading ? "Subiendo..." : "Subir logo"}
                </Button>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG o SVG. Máx. 2MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand color */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-4 h-4" />Color de marca</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(color => (
                <button key={color} type="button" onClick={() => update("brand_color", color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${form.brand_color === color ? "border-gray-900 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: color }} />
              ))}
              <div className="flex items-center gap-2">
                <input type="color" value={form.brand_color || "#6366f1"} onChange={e => update("brand_color", e.target.value)} className="w-8 h-8 rounded-full border cursor-pointer" />
                <span className="text-sm text-gray-500 font-mono">{form.brand_color}</span>
              </div>
            </div>
            <div className="p-4 rounded-lg text-white text-sm font-medium text-center" style={{ backgroundColor: form.brand_color || "#6366f1" }}>
              Vista previa del color
            </div>
          </CardContent>
        </Card>

        {/* Company info */}
        <Card>
          <CardHeader><CardTitle>Información de empresa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de empresa *</Label>
                <Input value={form.name || ""} onChange={e => update("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email de contacto</Label>
                <Input type="email" value={form.email || ""} onChange={e => update("email", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={form.phone || ""} onChange={e => update("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sitio web</Label>
                <Input type="url" placeholder="https://..." value={form.website || ""} onChange={e => update("website", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input value={form.address || ""} onChange={e => update("address", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader><CardTitle>Términos y condiciones por defecto</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={form.terms || ""} onChange={e => update("terms", e.target.value)}
              placeholder="Estos términos se agregarán automáticamente a cada nueva cotización..."
              rows={6} />
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardHeader><CardTitle>Texto de pie de página (PDF)</CardTitle></CardHeader>
          <CardContent>
            <Input value={form.footer_text || ""} onChange={e => update("footer_text", e.target.value)}
              placeholder="Ej: Gracias por su preferencia. Esta cotización es válida por 30 días." />
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Guardando..." : "Guardar configuración"}
        </Button>
      </form>
    </div>
  );
}
