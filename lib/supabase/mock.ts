/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Mock Supabase client for local development without a running Supabase instance.
 * Activated by DEV_BYPASS=true in .env.local.
 *
 * Behaviour:
 *  - auth.getUser()  → returns a hard-coded dev user
 *  - businesses      → always returns a mock business (so action guards pass)
 *  - inserts         → return the inserted payload + a fake id/timestamps
 *  - selects         → return [] (empty list; data won't persist between reloads)
 *  - updates/deletes → no-op success
 */

export const MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "dev@local.test",
  user_metadata: { company_name: "Dev Mode" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

export const MOCK_BUSINESS = {
  id: "00000000-0000-0000-0000-000000000002",
  user_id: MOCK_USER.id,
  name: "Dev Mode",
  brand_color: "#6366f1",
  logo_url: null,
  address: null,
  phone: null,
  website: null,
  email: null,
  tax_id: null,
  currency: "MXN",
  quote_prefix: "COT",
  quote_footer: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function fakeId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Builds a chainable Supabase query mock for a given table.
 * - businesses → .single() returns MOCK_BUSINESS
 * - any table  → .insert(payload).select().single() returns payload + fake id
 * - any table  → awaited directly / .order() / .eq() returns { data: [], error: null }
 */
function makeQueryChain(table: string): any {
  let pendingInsert: Record<string, unknown> | null = null;

  const chain: any = new Proxy(
    {},
    {
      get(_target, prop: string) {
        // ── Awaitable: resolve with list result ──────────────────────────────
        if (prop === "then") {
          const rows =
            table === "businesses" ? [MOCK_BUSINESS] : [];
          return (resolve: (v: unknown) => unknown) =>
            Promise.resolve({ data: rows, error: null, count: rows.length }).then(resolve);
        }

        // ── .single() / .maybeSingle() ───────────────────────────────────────
        if (prop === "single" || prop === "maybeSingle") {
          return () => {
            if (table === "businesses") {
              return Promise.resolve({ data: MOCK_BUSINESS, error: null });
            }
            if (pendingInsert) {
              const record = {
                ...pendingInsert,
                id: fakeId(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              pendingInsert = null;
              return Promise.resolve({ data: record, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          };
        }

        // ── .insert(data) — capture payload for later .single() ──────────────
        if (prop === "insert") {
          return (payload: Record<string, unknown> | Record<string, unknown>[]) => {
            pendingInsert = Array.isArray(payload) ? payload[0] : payload;
            return chain;
          };
        }

        // ── All other chainable methods (.select, .eq, .order, .update, …) ───
        return () => chain;
      },
    }
  );

  return chain;
}

export function createMockClient(): any {
  return {
    auth: {
      getUser: async () => ({ data: { user: MOCK_USER }, error: null }),
      getSession: async () => ({
        data: { session: { user: MOCK_USER } },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: null,
        error: { message: "DEV_BYPASS activo — ve directo a /dashboard" },
      }),
      signUp: async () => ({
        data: null,
        error: { message: "DEV_BYPASS activo — ve directo a /dashboard" },
      }),
    },
    from: (table: string) => makeQueryChain(table),
    storage: {
      from: (_bucket: string) => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: (_path: string) => ({ data: { publicUrl: "" } }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
    rpc: async () => ({ data: null, error: null }),
  };
}
