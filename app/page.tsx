"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { FaTwitter, FaInstagram, FaFacebook, FaLinkedin, FaYoutube, FaTiktok } from "react-icons/fa";
import { Calendar, RefreshCw, Package, FastForward, Loader, LaptopMinimalCheck, FilePenLine, BarChart3, PlusCircle, Info, Brain, Wifi, Bell, CheckCircle2, PenTool, Wrench, File, ChevronLeft, ChevronRight } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabaseClient";

// === Helpers de style/rendu identiques à "Créer un post" ===
type NetworkKey = "x" | "instagram" | "facebook" | "linkedin" | "youtube" | "tiktok";

function renderNetIconForKey(k: NetworkKey, size = 16, col = "#fff") {
  if (k === "x")         return <FaTwitter size={size} color={col} />;
  if (k === "instagram") return <FaInstagram size={size} color={col} />;
  if (k === "facebook")  return <FaFacebook size={size} color={col} />;
  if (k === "linkedin")  return <FaLinkedin size={size} color={col} />;
  if (k === "youtube")   return <FaYoutube  size={size} color={col} />;
  if (k === "tiktok")    return <FaTiktok   size={size} color={col} />;
  return null;
}

function badgeStyleForKey(k: NetworkKey): React.CSSProperties {
  if (k === "x")         return { background: "#000000", border: "1px solid #FFFFFF" };
  if (k === "instagram") return { background: "linear-gradient(135deg, #E1306C, #F56040)" };
  if (k === "facebook")  return { background: "#1877F2" };
  if (k === "linkedin")  return { background: "#0A66C2" };
  if (k === "youtube")   return { background: "#FF0000" };
if (k === "tiktok")
  return {
    background: "linear-gradient(135deg, #25F4EE 0%, #FE2C55 100%)",
    boxShadow: "0 0 12px rgba(254,44,85,0.6)",
  };
  return {};
}

/**
 * DashboardPage (+ extensions)
 * - Style identique aux autres pages (fond bleu, encadrés, bordures, plaque de titre)
 * - Couleur accent : #1C4DD7 (fourni par l'utilisateur)
 * - Ajouts demandés : Résumé hebdomadaire, Réseaux connectés, Forfait utilisateur, Notifications
 */
export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("Utilisateur");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7" | "15" | "30">("7");
  const [perfModal, setPerfModal] = useState<any|null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (user) setUserName(user.user_metadata?.name || "Utilisateur");

      const { data } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      setPosts(data || []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => ({
    total: posts.length,
    published: posts.filter(p => p.status === "published").length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    drafts: posts.filter(p => p.status === "draft").length
  }), [posts]);

// Helper pour trouver une miniature
const getThumbSrc = (p:any) =>
  p.thumbnail_url || p.image_url || (p.media?.[0]?.url) || "";
// ---- Helpers Résumé dynamique ----
const countByDay = (items: any[], days: number) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1)); // inclut aujourd'hui
  const buckets = Array.from({ length: days }, () => 0);

  items.forEach((p) => {
    const d = new Date(p.created_at);
    if (d >= start && d <= now) {
      const diff = Math.floor((+new Date(d.toDateString()) - +new Date(start.toDateString())) / (24*3600*1000));
      if (diff >= 0 && diff < days) buckets[diff]++;
    }
  });
  return buckets;
};

const countByWeek4 = (items: any[]) => {
  // 4 semaines glissantes, bloc de 7 jours
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (7*4 - 1));
  const buckets = [0,0,0,0]; // S-3, S-2, S-1, S (courante)

  items.forEach((p) => {
    const d = new Date(p.created_at);
    if (d >= start && d <= now) {
      const diffDays = Math.floor((+new Date(d.toDateString()) - +new Date(start.toDateString())) / (24*3600*1000));
      const weekIdx = Math.min(3, Math.floor(diffDays / 7));
      buckets[weekIdx]++;
    }
  });
  return buckets;
};
// Score d'interactions simple pour classer les posts
const interactionScore = (p:any) => {
  const likes = p.likes || 0;
  const comments = p.comments || 0;
  const shares = p.shares || 0;
  const saves = p.saves || 0;
  const views = p.views || 0;
  return likes*1 + comments*3 + shares*4 + saves*2 + views*0.01;
};

// Top posts publiés par score (fallback sur date si pas de métriques)
const topPerformers = useMemo(() => {
  const published = posts.filter(p => p.status === "published");
  if (!published.length) return [];
  const withScore = published.map(p => ({ ...p, __score: interactionScore(p) }));
  withScore.sort(
    (a,b) => (b.__score - a.__score) || (+new Date(b.created_at) - +new Date(a.created_at))
  );
  return withScore.slice(0, 10);
}, [posts]);

// Carousel avec flèches + placeholder même sans posts
const PostCarousel = ({ items, onItemClick }: { items: any[], onItemClick?: (p:any)=>void }) => {
  const isEmpty = !items || items.length === 0;
  // s'il n'y a aucun post, on crée un slide factice pour afficher le carrousel
  const list = isEmpty ? [null] : items;
  const [idx, setIdx] = useState(0);

  const safeIdx = ((idx % list.length) + list.length) % list.length;
  const current = list[safeIdx] as any;
  const src = current ? (current.thumbnail_url || current.image_url || (current.media?.[0]?.url) || "") : "";

  const prev = () => setIdx((v) => v - 1);
  const next = () => setIdx((v) => v + 1);

  return (
    <div className={`d-carousel${isEmpty ? " d-carousel--empty" : ""}`}>
<button
  type="button"
  className="d-carArrow d-left"
  onClick={prev}
  aria-label="Précédent"
>
  <ChevronLeft size={28} />
</button>

{src ? (
  <button
    type="button"
    className="d-carClick"
    onClick={() => current && onItemClick?.(current)}
    aria-label="Ouvrir le détail du post"
  >
    <img src={src} alt="" className="d-carImg" />
  </button>
) : (
  <div className="d-carPlaceholder">
    {isEmpty && <div className="d-carEmptyMsg">aucune publication</div>}
  </div>
)}

<button
  type="button"
  className="d-carArrow d-right"
  onClick={next}
  aria-label="Suivant"
>
  <ChevronRight size={28} />
</button>

      {/* points : 1 point si placeholder, N points si posts */}
      <div className="d-carDots">
        {(isEmpty ? [0] : list).map((_, i) => (
          <span key={i} className={`d-dot${i === safeIdx ? " d-dot--active" : ""}`} />
        ))}
      </div>
    </div>
  );
};

  const connected: Record<NetworkKey, boolean> = {
    facebook:  true,
    instagram: true,
    linkedin:  true,
    x:         false,
    youtube:   false,
    tiktok:    true,
  };
  const order: NetworkKey[] = ["facebook", "instagram", "linkedin", "x", "youtube", "tiktok"];
  const missing = order.filter(k => !connected[k]);

  return (
    <section className="d-dashboard">
      <div className="d-container">
        <header className="d-header">
          <h1>
            <span className="d-titlePlate">
              <span className="d-title">ACCUEIL :</span>
              <span className="d-subtitle">Vue d’ensemble et suivi de l’activité</span>
            </span>
          </h1>
        </header>

        {/* Ligne 1 - Prioritaire */}
        <div className="d-grid d-four">
          {/* (1) Actions rapides — remplace "Total de posts" */}
          <div className="d-card d-tone">
            <h2 className="d-tag"><FastForward size={20}/> Actions rapides</h2>
<div className="d-actions">
  <a href="/posts" className="d-btn d-violet"><PenTool size={22}/> Créer un post</a>
  <a href="/planning" className="d-btn d-green"><Calendar size={22}/> Voir le planning</a>
  <a href="/profile" className="d-btn d-turquoise"><Wifi size={22}/> Gérer mes réseaux</a>
  <a href="/outils" className="d-btn d-orange"><Wrench size={22}/> Utiliser mes APP</a>
</div>
          </div>

          {/* (2) Publiés */}
          <div className="d-card d-tone">
<h2 className="d-tag"><LaptopMinimalCheck size={20}/> Posts publiés</h2>
<div className="d-split">
  <div className="d-leftBox">
    <p className="d-num">{stats.published}</p>
  </div>
  <PostCarousel items={posts.filter(p => p.status === "published")} />
</div>
          </div>

          {/* (3) Programmés */}
          <div className="d-card d-tone">
<h2 className="d-tag"><Loader size={20}/>Posts programmés</h2>
<div className="d-split">
  <div className="d-leftBox">
    <p className="d-num">{stats.scheduled}</p>
  </div>
  <PostCarousel items={posts.filter(p => p.status === "scheduled")} />
</div>

          </div>

          {/* (4) Brouillons */}
          <div className="d-card d-tone">
<h2 className="d-tag"><File size={20}/>Brouillons</h2>
<div className="d-split">
  <div className="d-leftBox">
    <p className="d-num">{stats.drafts}</p>
  </div>
  <PostCarousel items={posts.filter(p => p.status === "draft")} />
</div>

          </div>
        </div>

{/* Ligne 2 - Résumé hebdomadaire & Performances récentes (50/50) */}
<div className="d-grid d-two">
<div className="d-card d-tone">
  <div className="d-cardHead">
    <h2 className="d-tag"><FilePenLine size={20}/> Résumé</h2>
    <div className="d-periodBtns">
      {[
        {k:"7", label:"7 jours"},
        {k:"15", label:"15 jours"},
        {k:"30", label:"30 jours"},
      ].map(({k,label}) => (
        <button
          key={k}
          className={`d-periodBtn ${period===k ? "active" : ""}`}
          onClick={()=>setPeriod(k as "7"|"15"|"30")}
          aria-pressed={period===k}
        >
          {label}
        </button>
      ))}
    </div>
  </div>

  {/* Données & rendu des barres */}
  <div className="d-miniChart">
    {(() => {
      let data:number[] = [];
      let unit = "jour";
      let caption = "";

      if (period === "7") {
        data = countByDay(posts, 7);
        unit = "jour";
        caption = "Publications par jour — 7 derniers jours";
      } else if (period === "15") {
        data = countByDay(posts, 15);
        unit = "jour";
        caption = "Publications par jour — 15 derniers jours";
} else {
  data = countByDay(posts, 30);
  unit = "jour";
  caption = "Publications par jour — 30 derniers jours";
}

      const max = Math.max(1, ...data);
      return (
        <>
          <div
            className="d-bars"
            style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
          >
            {data.map((v, i) => (
              <span
                key={i}
                style={{ height: `${Math.round((v / max) * 100)}%` }}
                title={`${v} ${v>1 ? "publications" : "publication"} / ${unit}`}
              />
            ))}
          </div>
          <p className="d-textMuted">{caption}</p>
        </>
      );
    })()}
  </div>
</div>
  <div className="d-card d-tone">
    <h2 className="d-tag"><BarChart3 size={20}/> Performances récentes</h2>

    {/* Carousel des meilleurs posts (interactions) */}
    <PostCarousel
      items={topPerformers}
      onItemClick={(p) => setPerfModal(p)}
    />

    <p className="d-textMuted" style={{marginTop: 8}}>
      Vos publications qui génèrent le plus de réactions
    </p>
  </div>
</div>

{/* Activité récente + Suggestions IA + Réseaux connectés (3 colonnes alignées) */}
<div className="d-grid d-four">
  <div className="d-card d-tone">
    <h2 className="d-tag"><Calendar size={20}/> Activité récente</h2>
{loading ? (
  <p className="d-textMuted">Chargement…</p>
) : posts.length === 0 ? (
  <div className="d-emptyCenter">
    <p className="d-textMuted">Aucune publication.</p>
  </div>
) : (
  <ul className="d-list">
    {posts.slice(0, 6).map((p) => (
      <li key={p.id}>
        <strong>{p.title || "(Sans titre)"}</strong>
        <span>{new Date(p.created_at).toLocaleString()}</span>
      </li>
    ))}
  </ul>
)}
  </div>

  <div className="d-card d-tone">
    <h2 className="d-tag"><Brain size={20}/> Suggestions IA</h2>
<div className="d-listIcons" role="list">
  <div className="d-line" role="listitem"><RefreshCw size={20}/> Republie ton dernier post sur LinkedIn pour maximiser sa portée.</div>
  <div className="d-line" role="listitem"><Calendar  size={20}/> Programme ton prochain post entre 18h et 20h.</div>
  <div className="d-line" role="listitem"><PenTool   size={20}/> Utilise le module “IA rédaction” pour booster ton engagement.</div>
</div>
  </div>

  <div className="d-card d-tone">
    <h2 className="d-tag"><Wifi size={20}/> Réseaux connectés</h2>
<div className="cn-card-body">
  <div className="cn-grid">
{order.map((k) => {
  const ok = connected[k];
  return (
    <div key={k} className="cn-cell">
      <div className="cn-item" style={badgeStyleForKey(k)}>
        <span className="cn-icon">{renderNetIconForKey(k, 26, "#fff")}</span>
      </div>
      <span className="cn-dots">
        {/* haut = rouge, bas = vert */}
        <span className={`cn-dot ${ok ? "cn-dot--off" : "cn-dot--red"}`} />
        <span className={`cn-dot ${ok ? "cn-dot--green" : "cn-dot--off"}`} />
      </span>
    </div>
  );
})}

  </div>

  <div className="cn-footer">
    <span className="cn-status">
      {missing.length === 0
        ? "Tous les réseaux sont opérationnels."
        : `Réseaux à connecter : ${missing.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")}.`}
    </span>
<a
  href="/profile"
  className="cn-btn cn-btn--square"
  title={missing.length === 0 ? "Gérer mes connexions" : "Connecter les réseaux manquants"}
>
  <Wifi size={32} />
  <span className="cn-btnText">
    {missing.length === 0 ? "Gérer" : "Gérer les"}<br />réseaux
  </span>
</a>

  </div>
</div>

  </div>
</div>


{/* Alertes + Notifications + Forfait utilisateur (3 colonnes alignées) */}
<div className="d-grid d-four">
  <div className="d-card d-tone">
    <h2 className="d-tag"><Bell size={20}/> Alertes</h2>
<div className="d-emptyCenter">
<div className="d-emptyCenter">
  <p className="d-textMuted">Aucune alerte récente.</p>
</div>

</div>

  </div>

  <div className="d-card d-tone">
    <h2 className="d-tag"><Info size={20}/> Notifications</h2>
<div className="d-emptyCenter">
  <span className="d-textMuted">Aucune notification.</span>
</div>

  </div>

  <div className="d-card d-tone">
<h2 className="d-tag"><Package size={20}/> Forfait utilisateur</h2>
<div className="d-planGrid">
  {/* Colonne gauche : mini carte blanche */}
  <div className="d-planLeft">
    <div className="d-miniCard">
      <span className="d-miniTop">PRO</span>
<span className="d-miniBottom">
  <small>mensuel</small>
  <strong>29,90 €</strong>
</span>

    </div>
  </div>

  {/* Colonne milieu : petite liste des options */}
  <ul className="d-planList">
    <li>Multi-réseaux illimité</li>
    <li>IA rédaction & traduction</li>
    <li>POS light & wallet</li>
    <li>Analytics basiques</li>
  </ul>

  {/* Colonne droite : bouton identique à “Réseaux connectés” */}
  <div className="d-planCta">
    <a
      href="/forfaits"
      className="cn-btn cn-btn--square"
      title="Changer de forfait"
    >
      <Wrench size={32} />
      <span className="cn-btnText">Changer<br/>de forfait</span>
    </a>
  </div>
</div>

  </div>
</div>

      </div>
{/* Modal Performances */}
{perfModal && (
  <div className="d-modalOverlay" onClick={() => setPerfModal(null)}>
    <div className="d-modal" onClick={(e)=>e.stopPropagation()}>
      <div className="d-modalImgWrap">
        <img
          src={getThumbSrc(perfModal)}
          alt=""
          className="d-modalImg"
        />
      </div>
      <div className="d-modalBody">
        <h3 className="d-modalTitle">{perfModal.title || "(Sans titre)"}</h3>
        <p className="d-textMuted">
          Publié le {new Date(perfModal.created_at).toLocaleString()}
        </p>
        {/* Placeholders: tu rempliras avec tes vraies métriques */}
        <ul className="d-modalList">
          <li>👍 Likes : {perfModal.likes ?? 0}</li>
          <li>💬 Commentaires : {perfModal.comments ?? 0}</li>
          <li>🔁 Partages : {perfModal.shares ?? 0}</li>
          <li>👁️ Vues : {perfModal.views ?? 0}</li>
        </ul>
        <button className="d-btn" onClick={() => setPerfModal(null)}>Fermer</button>
      </div>
    </div>
  </div>
)}
      <style jsx>{`
.d-dashboard {
  color-scheme: dark;
  background-image:
    linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.7) 70%, #000 100%),
    url("/background/bleu.jpg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: fixed;
  background-color: #0d0d14;
  color: #e6e8ec;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  --accent-blue: #1C4DD7;
  --border: var(--accent-blue);
  --card-bg: #0a0e1a;
}
.d-container { width: 100%; margin: 0 auto; padding: 24px 28px 44px; }
.d-header { margin: 10px 0 24px; text-align: center; }
.d-titlePlate {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 10px 16px; background: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 14px; box-shadow: 0 4px 18px rgba(0,0,0,.28);
  backdrop-filter: blur(2px);
}
.d-title { color: var(--accent-blue); font-weight: 900; }
.d-subtitle { color: #ffffff; font-weight: 700; opacity: .92; }
.d-grid { display: grid; gap: 20px; margin-bottom: 24px; }
.d-grid.d-one { grid-template-columns: minmax(320px, 1fr); }
.d-grid.d-four { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.d-grid.d-two { grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); }
.d-grid.d-two > .d-card { height: 100%; }
.d-card {
  position: relative; background: var(--card-bg);
  border: 1px solid var(--border); border-radius: 14px;
  padding: 20px; color: #eaeaea; box-shadow: 0 4px 12px rgba(0,0,0,.3);
}
.d-tone::before { content: ""; position: absolute; inset: 0; border-radius: 14px;
  pointer-events: none; box-shadow: inset 0 0 0 2px var(--border); }
.d-tag {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px; margin: 0 0 14px; border-radius: 999px;
  font-size: 18px; font-weight: 800; color: #fff;
  background: var(--accent-blue);
}
.d-num { font-size: 2rem; font-weight: 800; color: #fff; }
.d-list li { margin-bottom: 6px; font-size: 14px; }
.d-list li span { display: block; color: #aaa; font-size: 17px; }
.d-listSmall li { margin-bottom: 8px; font-size: 17px; color: #d0d0d0; }
.d-placeholder {
  background: rgba(255,255,255,0.05);
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  color: #999;
  font-style: italic;
}
.d-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.d-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--accent-blue);
  color: #fff;
  border-radius: 10px;
  padding: 8px 14px;
  font-weight: 600;
  transition: background .2s, transform .05s;
}
.d-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(150px, 1fr));
  justify-items: stretch;
  gap: 12px 10px; /* espace horizontal + vertical */
}

.d-btn {
  justify-content: center;
  min-width: 130px;
  text-align: center;
  font-weight: 600;
  border-radius: 10px;
  padding: 12px 14px;
  width: 100%;
}

.d-btn.d-violet { background: #8A2BE2; }
.d-btn.d-green { background: #00966A; }
.d-btn.d-turquoise { background: #008CBA; }
.d-btn.d-orange { background: #F15A00; }
.d-btn.d-violet:hover { background: #8A2BE2; }
.d-btn.d-green:hover { background: #00966A; }
.d-btn.d-turquoise:hover { background: #008CBA; }
.d-btn.d-orange:hover { background: #F15A00; }

.d-btn:hover { background: #1a44bd; }
.d-btn:active { transform: translateY(1px); }
.d-textMuted { color: #9ca3af; font-size: 17px; }

/* Résumé hebdo (mini chart) */
.d-miniChart { padding: 34px 4px 2px; }
.d-bars {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;
  align-items: end; height: 90px; margin: 6px 0 6px;
}
.d-bars span {
  display: block; width: 100%; background: linear-gradient(180deg, #5f83ff 0%, #1C4DD7 100%);
  border: 1px solid var(--border); border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,.25);
}

/* Réseaux connectés — nouvelle grille d’icônes + point d’état */
.cn-card-body{ display:flex; flex-direction:column; gap:16px; }

.cn-grid{
  display:grid;
  grid-template-columns: repeat(6, 70px); /* un peu plus large */
  gap:12px;
  margin-top: 15px;
}

.cn-cell{
  display:flex;
  align-items:center;
  gap:8px;               /* espace entre la box colorée et les pastilles */
}

.cn-item{
  width:48px; height:48px;              /* pastille un peu plus grosse */
  border-radius:12px;
  display:flex; align-items:center; justify-content:space-between;
  padding:0 6px;                         /* espace pour la colonne de points */
  box-shadow: 0 1px 0 rgba(255,255,255,.15) inset, 0 1px 2px rgba(0,0,0,.15);
}

.cn-icon{ display:inline-flex; margin-left: 5px; }

.cn-dots{
  display:flex;
  flex-direction:column;     /* une en haut, une en bas */
  gap:6px;
  align-items:center;
  justify-content:center;
  /* pas de position absolute => elles sont BIEN à l'extérieur de la box colorée */
}

.cn-dot{
  width:12px; height:12px;
  border-radius:50%;
  border:none;
  background:#9ca3af;        /* gris par défaut */
  opacity:.45;               /* pastille "grisée" (OFF) */
}

/* états actifs */
.cn-dot--red   { background:#ef4444; opacity:1; }
.cn-dot--green { background:#22c55e; opacity:1; }

/* état neutralisé explicitement */
.cn-dot--off   { background:#9ca3af; opacity:.45; }


.cn-footer{
  display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
}
.cn-card-body {
  position: static;
}

.cn-status {
  font-size: 17px;   /* au lieu de 14px */
  font-weight: 600;  /* (optionnel) pour le rendre plus lisible */
  opacity: .9;
}

.cn-btn{
  display:inline-flex; align-items:center; justify-content:center;
  padding:10px 14px; font-weight:700; border-radius:10px;
  background:#1C4DD7; color:#fff; text-decoration:none;
  box-shadow: 0 4px 14px rgba(28,77,215,.25);
  transition: transform .08s ease, box-shadow .08s ease, opacity .08s ease;
  white-space:nowrap;
}
.cn-btn:hover{ transform: translateY(-1px); box-shadow: 0 6px 18px rgba(28,77,215,.35); }

@media (max-width: 720px){
  .cn-grid{ grid-template-columns: repeat(3, 48px); }
}

/* Forfait */
.d-plan { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.d-planName { font-size: 20px; font-weight: 800; color: #fff; }

/* Bande de miniatures défilante */
.d-thumbStrip {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}
.d-thumbStrip::-webkit-scrollbar { height: 6px; }
.d-thumbStrip::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.25);
  border-radius: 999px;
}

.d-thumb {
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 6px rgba(0,0,0,.25);
}

/* Si pas d’image dispo */
.d-thumb--placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #9ca3af;
  background: rgba(255,255,255,0.07);
}
/* Deux colonnes dans les cartes : gauche étroite (compteur), droite large (carousel) */
.d-split {
  display: grid;
  grid-template-columns: 130px 1fr; /* droite plus large */
  gap: 12px;
  align-items: center;
}
.d-leftBox { display:flex; align-items:center; justify-content:center; min-height: 150px; border:none; border-radius:10px; background: rgba(255,255,255,0.03); }

/* Carousel — passer en global pour cibler le composant enfant PostCarousel */
:global(.d-carousel) {
  position: relative;
  width: 100%;
  height: 150px;
  background: #ffffff;             /* carte blanche */
  border: 1px solid #111;          /* léger trait pour tenir sur fond sombre */
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,.20);
}
:global(.d-carousel--empty) {
  display: flex;
  align-items: center;
  justify-content: center;
}
:global(.d-carEmptyMsg) {
  font-size: 15px;
  color: #111;                     /* texte noir */
  opacity: 1;
  font-weight: 600;
}

/* Image / placeholder */
:global(.d-carImg) { width: 100%; height: 100%; object-fit: cover; }
:global(.d-carPlaceholder) {
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
:global(.d-carPlaceholder::after) { content: none; }

/* Flèches nues (pas d'encadré, pas de fond) */
:global(.d-carArrow) {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  color: #111;                     /* icônes noires */
  cursor: pointer;
  user-select: none;
  z-index: 2;
}
:global(.d-carArrow:hover) { transform: translateY(-50%) scale(1.06); }
:global(.d-left) { left: 12px; }
:global(.d-right) { right: 12px; }

/* Points d’état */
:global(.d-carDots) { display: none; }
:global(.d-dot) {
  width: 8px; height: 8px; border-radius: 999px;
  background: rgba(255,255,255,0.35);
  border: 1px solid rgba(255,255,255,0.55);
}
:global(.d-dot--active) { background: var(--accent-blue); border-color: #fff; }
.d-periodBtns {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.d-periodBtn:hover {
  background: rgba(255,255,255,0.15);
}
.d-periodBtn.active {
  background: var(--accent-blue);
  border-color: #fff;
}
/* En-tête carte: pastille à gauche, boutons à droite */
.d-cardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

/* Boutons de période */
.d-periodBtns { display: flex; gap: 8px; }
.d-periodBtn {
  background: rgba(255,255,255,0.08);
  border: 1px solid var(--border);
  color: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: transform .06s ease, background .2s ease, border-color .2s ease;
}
.d-periodBtn:hover { background: rgba(255,255,255,0.15); transform: translateY(-1px); }
.d-periodBtn.active { background: var(--accent-blue); border-color: #fff; }

/* clique sur image du carousel */
:global(.d-carClick){
  display:block;
  width: calc(100% - 80px);
  margin: 0 auto;
  height:100%;
  padding:0;
  border:none;
  background:transparent;
  cursor:pointer;
  z-index: 1;
}

/* Modal */
.d-modalOverlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.6);
  display: flex; align-items: center; justify-content: center; z-index: 60;
}
.d-modal {
  width: min(920px, 92vw);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,.45);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.d-modalImgWrap { background: rgba(255,255,255,0.03); }
.d-modalImg { width: 100%; height: 100%; object-fit: cover; display:block; }
.d-modalBody { padding: 18px; display:flex; flex-direction:column; gap:12px; }
.d-modalTitle { font-size: 1.1rem; font-weight: 800; color:#fff; margin:0; }
.d-modalList { margin: 4px 0 12px; padding-left: 18px; color:#e6e8ec; }
@media (max-width: 780px){
  .d-modal{ grid-template-columns: 1fr; }
}
.cn-btn--square {
  position: absolute;
  top: 42px;             /* aligné en haut de l’encadré général */
  right: 16px;           /* collé visuellement au bord droit de la carte */
  background: rgba(28, 77, 215, 0.4); /* même bleu (#1C4DD7) avec 70% d’opacité */
  backdrop-filter: blur(3px);         /* optionnel : léger flou pour un effet "verre" */
  z-index: 1;            /* passe au-dessus de la grille quand nécessaire */
border: 2px solid #1C4DD7;
  flex-direction: column;
  width: 120px;
  height: 120px;
  padding: 8px;
  gap: 6px;
  line-height: 1.1;
  justify-content: center;
  align-items: center;
}

.cn-btn--square .cn-btnText {
  font-size: 17px;
  text-align: center;
  color: #fff;
}
.cn-footer {
  padding-right: 140px;  /* largeur du bouton (120) + marge */
}
.d-emptyCenter{
  display:flex;
  align-items:center;
  justify-content:center;
  min-height:120px;        /* ↓ moins haut qu’avant (ça réduit la carte) */
  text-align:center;
  transform: translateY(-10px); /* ↑ remonte légèrement le bloc sous la pastille */
}
.d-emptyCenter > * { margin: 0; }

.d-listIcons { display:flex; flex-direction:column; gap:8px; margin-top: 12px; }
.d-line { display:flex; align-items:center; gap:8px; }

/* === Forfait utilisateur : grille 3 colonnes ajustée === */
.d-planGrid {
  display: grid;
  grid-template-columns: 1.3fr 2.2fr 0.8fr; /* gauche un peu plus large, droite pile pour le bouton */
  gap: 20px;
  align-items: center;
}

/* Carte blanche agrandie */
.d-miniCard {
  position: relative;
  min-height: 120px;
  background: #fff;
  color: #111;
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.d-miniTop {
  position: absolute;
  top: 10px;
  left: 12px;
  font-weight: 800;
  font-size: 26px;
}
.d-miniBottom {
  position: absolute;
  right: 12px;
  bottom: 10px;
  text-align: right;
  line-height: 1.2;
}
.d-miniBottom small {
  display: block;
  font-size: 18px;
  font-weight: 600;
}
.d-miniBottom strong {
  display: block;
  font-size: 26px;
  font-weight: 800;
}

/* Liste centrale décalée légèrement à droite */
.d-planList {
  margin: 0;
  padding: 0 0 0 24px;
  display: grid;
  align-content: center;
  gap: 8px;
  color: #d0d0d0;
  font-size: 16px;
}

/* Colonne droite : bouton un peu plus haut et bien collé à droite */
.d-planCta {
  position: relative;
  min-height: 120px;
}
.d-planCta .cn-btn--square {
  top: -24px;
  right: 0;
}


/* Responsive */
@media (max-width: 900px){
  .d-planGrid{ grid-template-columns: 1fr; }
  .d-planCta{ min-height: 120px; }
}













      `}</style>
    </section>
  );
}
