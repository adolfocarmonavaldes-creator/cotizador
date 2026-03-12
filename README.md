# QuoteFlow — Cotizador SaaS

Plataforma SaaS multi-tenant para generar cotizaciones profesionales. Diseñada para PYMEs que necesitan crear, enviar y dar seguimiento a cotizaciones de forma rápida y profesional.

## ✨ Características

- 🏢 **Multi-tenant** — Cada empresa tiene sus datos completamente aislados
- 🎨 **White-label** — Logo, color de marca, información de empresa personalizables
- 📄 **Generación de PDF** — Cotizaciones descargables con diseño profesional
- 📱 **Compartir fácil** — Enlace único, WhatsApp, Email
- ✅ **Seguimiento de estado** — Borrador → Enviado → Visto → Aceptado/Rechazado
- 📊 **Dashboard** — Estadísticas de cotizaciones e ingresos
- 🔒 **Seguro** — Autenticación con Supabase, RLS en todas las tablas

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| PDF | @react-pdf/renderer |
| Formularios | react-hook-form + zod |

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20+
- Docker Desktop (para Supabase local)
- Supabase CLI

### 1. Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# npm (alternativa)
npm install -g supabase
```

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

### 3. Iniciar Supabase local

```bash
supabase start
```

Copia la `anon key` del output y pégala en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Aplicar migraciones

```bash
supabase db reset
# o
supabase migration up
```

### 5. Instalar dependencias e iniciar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📂 Estructura del Proyecto

```
├── app/
│   ├── (auth)/           # Login y Registro
│   ├── (dashboard)/      # App protegida
│   │   ├── dashboard/    # Inicio con estadísticas
│   │   ├── cotizaciones/ # Lista, nueva, detalle
│   │   ├── clientes/     # Gestión de clientes
│   │   ├── productos/    # Catálogo de productos
│   │   └── configuracion/# Marca y ajustes
│   ├── c/[token]/        # Página pública del cliente
│   └── api/
│       └── quotes/[id]/
│           ├── pdf/      # Descarga PDF
│           └── accept/   # Aceptar/rechazar
├── components/
│   ├── ui/               # Componentes shadcn/ui
│   └── pdf/              # Template PDF
├── lib/
│   ├── actions/          # Server Actions
│   ├── supabase/         # Clientes Supabase
│   └── utils.ts
├── supabase/
│   └── migrations/       # Schema SQL
└── types/                # TypeScript types
```

## 🗄 Esquema de Base de Datos

```
businesses     ← Una por usuario (multi-tenant root)
clients        ← Clientes de cada empresa
products       ← Catálogo de productos/servicios
quotes         ← Cotizaciones con token único
quote_items    ← Líneas de cada cotización
```

Row Level Security (RLS) activo en todas las tablas.

## 🔒 Seguridad

- **RLS** en todas las tablas: los datos de cada empresa son completamente privados
- **JWT** de Supabase Auth para autenticación
- **Token hex** de 32 caracteres para páginas públicas de cotización (no el UUID)
- **Middleware** de Next.js para proteger rutas del dashboard

## 🚢 Deployment

### Vercel + Supabase Cloud

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar migraciones en la base de datos de producción
3. Conectar repo a Vercel
4. Configurar variables de entorno en Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   NEXT_PUBLIC_APP_URL=https://tu-dominio.com
   ```
5. Deploy

## 🎨 Personalización White-Label

1. Ir a **Configuración → Marca**
2. Subir logo de empresa
3. Seleccionar color de marca
4. Llenar información de contacto
5. Los cambios aplican automáticamente en:
   - Sidebar del dashboard
   - PDFs descargables
   - Página pública del cliente

## 📋 Flujo de Cotización

1. **Crear** → Nueva cotización con líneas de ítem
2. **Compartir** → Copiar enlace / WhatsApp / Email
3. **Cliente ve** → Página pública, status cambia a "Visto"
4. **Respuesta** → Cliente acepta o rechaza desde su página
5. **Tracking** → Status actualizado en tiempo real en el dashboard
