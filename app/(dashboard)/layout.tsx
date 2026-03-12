import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/actions/auth";
import { LayoutDashboard, FileText, Users, Package, Settings, LogOut, Zap } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/productos", label: "Productos", icon: Package },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("name, logo_url, brand_color")
    .single();

  const brandColor = business?.brand_color || "#6366f1";

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          {business?.logo_url ? (
            <img src={business.logo_url} alt={business?.name} className="h-8 w-auto object-contain max-w-[160px]" />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: brandColor }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900 truncate">{business?.name || "QuoteFlow"}</span>
            </div>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <link.icon className="w-4 h-4 flex-shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-3 space-y-1">
          <Link href="/configuracion" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <Settings className="w-4 h-4" />
            Configuración
          </Link>
          <div className="px-3 py-2">
            <p className="text-xs text-gray-400 truncate mb-1">{user.email}</p>
            <form action={logoutAction}>
              <button type="submit" className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 transition-colors">
                <LogOut className="w-3 h-3" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
