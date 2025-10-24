"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { LogIn, UserPlus, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: email.split("@")[0] || "Utilisateur" } },
        });
        if (error) throw error;
        // tentative d’auto-login (si confirmation off)
        await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
      }
      router.replace("/");
    } catch (e: any) {
      setErr(e?.message || "Une erreur est survenue.");
      setLoading(false);
    }
  };

  return (
    <section className="lg-wrap">
      {/* Colonne gauche : Auth + CTA Souscrire */}
      <aside className="lg-left">
        <div className="lg-card">
          <div className="lg-tabs">
            <button
              className={`lg-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
              aria-pressed={mode === "login"}
            >
              <LogIn size={18} /> Se connecter
            </button>
            <button
              className={`lg-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => setMode("register")}
              aria-pressed={mode === "register"}
            >
              <UserPlus size={18} /> Créer un compte
            </button>
          </div>

          <form className="lg-form" onSubmit={onSubmit}>
            <label className="lg-label">
              Email
              <input
                className="lg-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@domaine.com"
                required
                autoComplete="email"
              />
            </label>

            <label className="lg-label">
              Mot de passe
              <input
                className="lg-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={6}
              />
            </label>

            {err && <p className="lg-error">{err}</p>}

            <button className="lg-btn" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
              {mode === "login" ? "Entrer" : "Créer mon compte"}
            </button>
          </form>

          <a href="/forfaits" className="lg-subscribe">
            Souscrire à l’abonnement
          </a>
        </div>
      </aside>

      {/* Colonne droite : Marketing / Screens */}
      <main className="lg-right">
        <div className="mk-hero">
          <h1>Gérez tous vos réseaux depuis un seul tableau de bord</h1>
          <p>Multi-publication, planning, aperçus interactifs, IA rédaction & traduction, analytics…</p>
        </div>

        <div className="mk-grid">
          <figure className="mk-card">
            <img src="/marketing/screen-planning.png" alt="Planning des publications" />
            <figcaption>Planning visuel : glissez-déposez vos posts.</figcaption>
          </figure>
          <figure className="mk-card">
            <img src="/marketing/screen-create.png" alt="Création de post avec IA" />
            <figcaption>Éditeur assisté par IA (rédaction & traduction).</figcaption>
          </figure>
          <figure className="mk-card">
            <img src="/marketing/screen-analytics.png" alt="Analytics de base" />
            <figcaption>Analytics clairs pour suivre votre progression.</figcaption>
          </figure>
        </div>

        <ul className="mk-bullets">
          <li>✅ Multi-réseaux illimité</li>
          <li>✅ Aperçus interactifs par plateforme</li>
          <li>✅ POS light & wallet de réinjection</li>
          <li>✅ Prix clair, sans surprise</li>
        </ul>
      </main>

      <style jsx>{`
        :root { color-scheme: dark; }
        .lg-wrap{
          min-height:100vh;
          display:grid;
          grid-template-columns: 420px 1fr; /* gauche étroit, droite large */
          background-image:
            linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.7) 70%, #000 100%),
            url("/background/bleu.jpg");
          background-position:center; background-size:cover; background-attachment:fixed;
        }

        /* Colonne gauche (auth) */
        .lg-left{
          display:flex; align-items:center; justify-content:center;
          padding:24px;
          backdrop-filter: blur(2px);
        }
        .lg-card{
          width:min(380px, 92%);
          background:#0a0e1a; border:1px solid #1C4DD7; border-radius:14px;
          box-shadow:0 8px 30px rgba(0,0,0,.45); padding:18px; color:#e6e8ec;
        }
        .lg-tabs{ display:flex; gap:8px; margin-bottom:12px; }
        .lg-tab{
          flex:1; display:inline-flex; align-items:center; justify-content:center; gap:8px;
          background:rgba(255,255,255,0.08); border:1px solid #1C4DD7; color:#fff;
          border-radius:10px; padding:10px 12px; font-weight:700; cursor:pointer;
          transition:transform .06s ease, background .2s ease, border-color .2s ease;
        }
        .lg-tab:hover{ background:rgba(255,255,255,0.15); transform:translateY(-1px); }
        .lg-tab.active{ background:#1C4DD7; border-color:#fff; }

        .lg-form{ display:flex; flex-direction:column; gap:12px; margin-top:8px; }
        .lg-label{ display:flex; flex-direction:column; gap:6px; font-weight:700; color:#fff; }
        .lg-input{
          background:#fff; color:#111;
          border:1px solid #1C4DD7; border-radius:10px;
          padding:12px 14px; font-size:16px; font-weight:600; outline:none;
        }
        .lg-input:focus{ box-shadow:0 0 0 3px rgba(28,77,215,.35); }

        .lg-error{ color:#ff9090; font-weight:700; }
        .lg-btn{
          margin-top:4px;
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          background:#1C4DD7; color:#fff; border-radius:10px; padding:12px 14px;
          font-weight:800; width:100%; border:1px solid #1C4DD7;
          transition:background .2s, transform .06s;
        }
        .lg-btn:hover{ background:#1a44bd; transform:translateY(-1px); }
        .spin{ animation:spin .8s linear infinite; }
        @keyframes spin { to{ transform: rotate(360deg); } }

        .lg-subscribe{
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          width:100%; margin-top:10px; padding:10px 12px;
          border:1px dashed #1C4DD7; border-radius:10px; color:#fff; text-decoration:none;
        }

        /* Colonne droite (marketing) */
        .lg-right{
          padding:34px 32px 44px; color:#e6e8ec; overflow:auto;
        }
        .mk-hero h1{ margin:0 0 6px; font-size:32px; font-weight:900; color:#fff; }
        .mk-hero p{ margin:0 0 18px; color:#cfd3da; font-size:18px; }

        .mk-grid{
          display:grid; gap:16px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }
        .mk-card{
          background:#0a0e1a; border:1px solid #1C4DD7; border-radius:14px; overflow:hidden;
          box-shadow:0 8px 30px rgba(0,0,0,.35);
        }
        .mk-card img{ display:block; width:100%; height:220px; object-fit:cover; background:#0e1322; }
        .mk-card figcaption{ padding:10px 12px; color:#cfd3da; }

        .mk-bullets{ margin:18px 0 0; padding-left:18px; color:#cfd3da; line-height:1.6; }

        /* Responsive */
        @media (max-width: 980px){
          .lg-wrap{ grid-template-columns: 1fr; }
          .lg-right{ order: -1; } /* marketing en haut sur mobile */
        }
      `}</style>
    </section>
  );
}
