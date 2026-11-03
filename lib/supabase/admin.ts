import { createClient } from "@supabase/supabase-js";

// Cliente con privilegios administrativos (service_role)
// ⚠️ ESTE CLIENTE SOLO DEBE EJECUTARSE EN EL SERVIDOR (Tools del agente y API Routes protegidas)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-service-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
