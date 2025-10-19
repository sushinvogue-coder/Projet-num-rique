import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !anon) {
    if (typeof window === "undefined") {
      // ⚠️ En SSR/prérendu: ne PAS crasher le build.
      // On renvoie un placeholder inoffensif (jamais utilisé côté serveur).
      return {} as unknown as SupabaseClient;
    }
    // Côté navigateur: erreur claire si l'app est mal configurée.
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes.");
  }

  browserClient = createClient(url, anon);
  return browserClient;
}

