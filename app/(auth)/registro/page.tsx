"use client";
import { useState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailCheck } from "lucide-react";

export default function RegistroPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const result = await registerAction({
      email,
      password: fd.get("password") as string,
      company_name: fd.get("company_name") as string,
    });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.confirmEmail) {
      setConfirmedEmail(email);
    }
  }

  // ── Success: email confirmation required ──────────────────────────────────
  if (confirmedEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md text-center space-y-6 px-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 mx-auto">
            <MailCheck className="w-8 h-8 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revisa tu correo</h1>
            <p className="mt-2 text-sm text-gray-500">
              Te enviamos un enlace de confirmación a{" "}
              <span className="font-medium text-gray-800">{confirmedEmail}</span>
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Haz clic en el enlace del correo para activar tu cuenta y luego inicia sesión.
          </p>
          <Link href="/login">
            <Button className="w-full">Ir a iniciar sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 px-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600 mb-4">
            <span className="text-white font-bold text-lg">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="mt-2 text-sm text-gray-500">Empieza a generar cotizaciones profesionales</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Nombre de empresa</Label>
            <Input id="company_name" name="company_name" type="text" placeholder="Mi Empresa S.A." required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" placeholder="tu@empresa.com" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={8} autoComplete="new-password" />
            <p className="text-xs text-gray-400">Mínimo 8 caracteres</p>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-violet-600 hover:underline font-medium">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
