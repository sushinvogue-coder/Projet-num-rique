'use server';
import { createClient } from '@supabase/supabase-js';

export async function getOrCreateProfile(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Vérifie si le profil existe déjà
  const { data: existing } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  // Sinon, en crée un
  if (!existing) {
    await supabase.from('profiles').insert({ user_id: userId, locale: 'fr' });
  }
}
