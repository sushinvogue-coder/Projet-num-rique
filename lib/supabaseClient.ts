import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Instanciation paresseuse pour éviter les erreurs au build/prérender
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // En SSR/prérender, si les vars manquent, on ne crashe pas le build :
  if (!url || !anon) {
    if (typeof window === "undefined") {
      // renvoyer un client factice évite l’exécution côté serveur pendant le prérender
      throw new Error("Supabase (browser) indisponible côté serveur sans variables publiques.");
    }
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes.");
  }

  browserClient = createClient(url, anon);
  return browserClient;
}
