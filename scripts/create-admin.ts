/**
 * Create Admin Account Script
 * Run ONCE after deploy to create your first login.
 *
 * Local:  npx tsx scripts/create-admin.ts
 *
 * Cloud:  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *         SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *         ADMIN_EMAIL=tu@empresa.com \
 *         ADMIN_PASSWORD=Password123! \
 *         ADMIN_COMPANY="Mi Empresa" \
 *         npx tsx scripts/create-admin.ts
 */
import { createClient } from "@supabase/supabase-js";

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL     || "http://127.0.0.1:54321";
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY    ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hj04zWl196z2-SBc0";
const EMAIL   = process.env.ADMIN_EMAIL    || "admin@quoteflow.com";
const PASS    = process.env.ADMIN_PASSWORD || "Admin123!";
const COMPANY = process.env.ADMIN_COMPANY  || "Mi Empresa";

const supabase = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log(`\n📧 Creating admin: ${EMAIL} | 🏢 ${COMPANY}\n`);
  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL, password: PASS, email_confirm: true,
    user_metadata: { company_name: COMPANY },
  });
  if (error) { console.error("❌", error.message); process.exit(1); }
  console.log("✅ Account created!");
  console.log(`   ID:       ${data.user?.id}`);
  console.log(`   Email:    ${EMAIL}`);
  console.log(`   Password: ${PASS}`);
  console.log("\n⚠️  Change your password after first login.\n");
}
main().catch(e => { console.error(e); process.exit(1); });
