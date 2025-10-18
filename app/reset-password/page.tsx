'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from "@/lib/supabaseClient";
const supabase = getSupabaseBrowser();

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Quand l'utilisateur arrive via le lien de l'email (type recovery),
  // Supabase authentifie la session automatiquement. On peut alors mettre à jour le mot de passe.
  useEffect(() => {
    (async () => {
      setErr(null);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setErr("Lien invalide ou expiré. Recommence la procédure de réinitialisation.");
      }
      setReady(true);
    })();
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    if (password.length < 6) {
      setErr('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setErr(error.message);
    else setMsg('Mot de passe mis à jour ✅ Tu peux te reconnecter.');
  }

  if (!ready) return <main style={{ padding: 24 }}>Chargement…</main>;

  return (
    <main style={{ maxWidth: 480, margin: '60px auto', fontFamily: 'system-ui' }}>
      <h1>Définir un nouveau mot de passe</h1>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {err && <p style={{ color: 'crimson' }}>Erreur : {err}</p>}

      <form onSubmit={handleUpdate} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
        />
        <button type="submit" style={{ padding: 10, borderRadius: 8 }}>Mettre à jour</button>
      </form>
    </main>
  );
}
