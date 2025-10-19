'use client';

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { useState, useMemo } from 'react'; // ✅ ajout de useMemo ici

export default function SignupPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');

    if (!email || !password) {
      setError('Email et mot de passe requis.');
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setMsg("Compte créé ✅ Vérifiez votre boîte mail et cliquez sur le lien pour le confirmer.");
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '80px auto', fontFamily: 'system-ui' }}>
      <h1>Créer un compte</h1>
      <form onSubmit={handleSignup} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          autoCapitalize="none"
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Mot de passe"
          autoComplete="new-password"
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
        />
        <button type="submit" style={{ padding: 10, borderRadius: 8 }}>S’inscrire</button>
      </form>

      {msg && <p style={{ marginTop: 12, color: 'green' }}>{msg}</p>}
      {error && <p style={{ marginTop: 12, color: 'crimson' }}>Erreur : {error}</p>}

      <p style={{ marginTop: 16 }}>
        Déjà un compte ? <a href="/login">Connexion</a>
      </p>
    </main>
  );
}
