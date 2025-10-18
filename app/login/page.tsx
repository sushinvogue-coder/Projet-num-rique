'use client';
import { getSupabaseBrowser } from "@/lib/supabaseClient";
const supabase = getSupabaseBrowser();

export default function LoginPage() {
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');

    if (!email || !password) {
      alert('Entre ton email et ton mot de passe.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    window.location.href = '/posts';
  }

  return (
    <main style={{ maxWidth: 420, margin: '80px auto', fontFamily: 'system-ui' }}>
      <h1>Connexion</h1>
      <form onSubmit={handleLogin} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <input
          name="email" type="email" required placeholder="Email"
          autoComplete="email" autoCapitalize="none"
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
        />
        <input
          name="password" type="password" required placeholder="Mot de passe"
          autoComplete="current-password"
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
        />
        <button type="submit" style={{ padding: 10, borderRadius: 8 }}>Se connecter</button>
      </form>
      <p style={{ marginTop: 16 }}>
        Pas encore de compte ? <a href="/signup">Inscription</a>
      </p>
    </main>
  );
}
