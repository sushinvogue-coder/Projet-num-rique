"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef, Suspense, useState } from "react";
import { GitCompare, Check, Eye, XCircle, ChevronDown, ChevronUp, Inbox, Headphones,
  Megaphone, Mail, Layers, Store, AppWindow, Zap, Link, FileBarChart2, Hourglass,
} from "lucide-react";

type Addon = {
  name: string;
  desc: string;
  Icon: any;
  features?: string[];
  since?: string;
  category?: "creators" | "commerce" | "marketing" | "services" | "enterprise";
  details?: string[];
};

export default function BoutiquePage() {
// ===== Filtre catégories =====
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  // ===== Données (exemples) =====
  const includedAddons: Addon[] = [
    {
      name: "Aperçus interactifs",
      desc: "Visualisations intégrées aux posts et rapports.",
      Icon: Zap,
      features: ["Aperçus illimités", "Formats sociaux natifs", "Chargement rapide"],
    },
    {
      name: "POS Light (non-TVA)",
      desc: "Encaissement rapide sans gestion de TVA.",
      Icon: Store,
      features: ["Tickets simples", "Exports basiques", "Suivi par point de vente"],
    },
    {
      name: "Media library de base",
      desc: "Bibliothèque pour stocker et réutiliser vos médias.",
      Icon: AppWindow,
      features: ["Dossiers", "Tags", "Quota standard"],
    },
  ];

const subscribedAddons: Addon[] = [
  {
    name: "IA écriture",
    desc: "Assistant de rédaction multi-ton et réécriture.",
    Icon: Zap,
    since: "depuis 03/2025",
    features: ["Génération de posts", "Reformulation", "Hashtags"],
    details: [
      "Optimise la lisibilité et le ton des messages",
      "Propose des variantes pour s’adapter à chaque réseau",
      "Idéal pour gagner du temps sur la rédaction quotidienne"
    ]
  },
  {
    name: "Traduction IA",
    desc: "Traductions instantanées multi-langues.",
    Icon: Mail,
    since: "depuis 07/2025",
    features: ["11 langues", "Détection automatique", "Glossaires"],
    details: [
      "Maintient la cohérence terminologique grâce aux glossaires",
      "Prend en charge automatiquement la langue source",
      "Améliore la portée internationale de vos publications"
    ]
  },
  {
    name: "Exports CSV",
    desc: "Export rapide des données opérationnelles.",
    Icon: FileBarChart2,
    since: "depuis 09/2025",
    features: ["Filtres", "Historique", "Téléchargement sécurisé"],
    details: [
      "Permet un suivi précis des performances sur la durée",
      "Compatible avec Excel, Google Sheets et outils BI",
      "Sécurise le partage et l’archivage de vos données"
    ]
  },
];


const availableAddons: Addon[] = [
  { name: "Inbox (messages)", desc: "Centralisez vos messages.", Icon: Inbox, category: "marketing" },
  { name: "Listening (veille)", desc: "Surveillez vos réseaux.", Icon: Headphones, category: "marketing" },
  { name: "Ads manager", desc: "Gérez vos publicités.", Icon: Megaphone, category: "marketing" },
  { name: "CRM / Email", desc: "Suivi client & campagnes email.", Icon: Mail, category: "marketing" },
  { name: "Multi-marques", desc: "Pilotez plusieurs marques.", Icon: Layers, category: "enterprise" },
  { name: "Marketplace", desc: "Diffusez vos offres partout.", Icon: Store, category: "commerce" },
  { name: "App native", desc: "Application mobile dédiée.", Icon: AppWindow, category: "enterprise" },
  { name: "Automations", desc: "Automatisez vos process.", Icon: Zap, category: "services" },
  { name: "Link previews", desc: "Aperçus enrichis de liens.", Icon: Link, category: "creators" },
  { name: "Exports avancés", desc: "Rapports détaillés exportables.", Icon: FileBarChart2, category: "commerce" },
];

type PlanKey = "STARTER" | "PRO" | "BUSINESS" | "ULTIMATE";

const [currentPlan, setCurrentPlan] = useState<PlanKey>("PRO");

// Hydrate depuis le stockage (si déjà choisi avant)
useEffect(() => {
  try {
    const saved = localStorage.getItem("currentPlan") as PlanKey | null;
    if (saved) setCurrentPlan(saved);
  } catch {}
}, []);


// AJOUT — état d’ouverture de la modale "Comparer"
const [compareOpen, setCompareOpen] = useState(false);

// AJOUT — données du tableau comparatif
const plansMeta = [
  { key: "STARTER",   label: "STARTER",   price: "19€" },
  { key: "PRO",       label: "PRO",       price: "49€" },
  { key: "BUSINESS",  label: "BUSINESS",  price: "99€" },
  { key: "ULTIMATE",  label: "ULTIMATE",  price: "149€" },
] as const;

type Row = { label: string; keys: Partial<Record<typeof plansMeta[number]['key'], boolean>>; hint?: string };

// On dérive des puces déjà visibles dans tes cartes
const compareRows: Row[] = [
  { label: "Multi-publication de base",         keys: { STARTER: true,  PRO: true,  BUSINESS: true,  ULTIMATE: true } },
  { label: "Calendrier & retours d’état",       keys: { STARTER: true,  PRO: true,  BUSINESS: true,  ULTIMATE: true } },
  { label: "Analytics basiques",                keys: { STARTER: true,  PRO: true,  BUSINESS: true,  ULTIMATE: true } },

  { label: "IA écriture & traduction",          keys: { PRO: true,      BUSINESS: true,             ULTIMATE: true } },
  { label: "Media library avancée",             keys: { PRO: true,      BUSINESS: true,             ULTIMATE: true } },

  { label: "Modules métiers",                   keys: {                 BUSINESS: true,             ULTIMATE: true } },
  { label: "POS Light (non-TVA)",               keys: {                 BUSINESS: true,             ULTIMATE: true } },
  { label: "Support prioritaire",               keys: {                 BUSINESS: true,             ULTIMATE: true } },

  { label: "Wallet de réinjection",             keys: {                                        ULTIMATE: true } },
  { label: "Aperçus interactifs illimités",     keys: {                                        ULTIMATE: true } },
  { label: "SLA & onboarding dédié",            keys: {                                        ULTIMATE: true } },
];


  // ===== Modale Voir Plus =====
  const [modal, setModal] = useState<null | "inclus" | "souscrits" | "disponibles">(null);

  // ===== Carrousel fluide (vrai ruban continu, sans à-coup) =====
const trackRef = useRef<HTMLDivElement>(null);
const groupRef = useRef<HTMLDivElement>(null);
const pausedRef = useRef(false); // ← NEW
const trackRef2 = useRef<HTMLDivElement>(null);
const groupRef2 = useRef<HTMLDivElement>(null);

// Ajoute ce state
const [openCard, setOpenCard] = useState<Record<string, boolean>>({});

// Petit helper
const toggleCard = (key: string) =>
  setOpenCard(prev => ({ ...prev, [key]: !prev[key] }));
// 🔽 AJOUT Stripe — détecte le retour du paiement (AU NIVEAU DU COMPOSANT)
// 🔽 AJOUT Stripe — statut paiement (sans useSearchParams ici)
const [checkoutStatus, setCheckoutStatus] = useState<null | 'success' | 'cancel'>(null);

function handleCheckoutSuccess() {
  try {
    const intended = localStorage.getItem("intendedPlan") as PlanKey | null;
    if (intended) {
      setCurrentPlan(intended);
      localStorage.setItem("currentPlan", intended);
    }
  } catch {}
  setCheckoutStatus('success');
  try { localStorage.removeItem("intendedPlan"); } catch {}
}

function handleCheckoutCancel() {
  setCheckoutStatus('cancel');
  try { localStorage.removeItem("intendedPlan"); } catch {}
}

function CheckoutWatcher({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const searchParams = useSearchParams();   // ✅ hook dans l’enfant
  const router = useRouter();

  useEffect(() => {
    const s = searchParams.get('checkout');
    if (s === 'success') {
      onSuccess();
      setTimeout(() => router.replace('/forfaits', { scroll: false }), 0);
    } else if (s === 'cancel') {
      onCancel();
      setTimeout(() => router.replace('/forfaits', { scroll: false }), 0);
    }
  }, [searchParams, router, onSuccess, onCancel]);

  return null; // composant “sentinelle”, pas d’UI
}

// 🔼 FIN AJOUT Stripe

useEffect(() => {
  let raf = 0;
  let last = performance.now();
  let x = 0;
  const speed = 40;

  const loop = (t: number) => {
    const dt = (t - last) / 1000;
    last = t;
    const track = trackRef.current;
    const group = groupRef.current;
    if (track && group) {
      const w = group.offsetWidth;
      if (!pausedRef.current) {
        x -= speed * dt;          // ← défilement gauche
        if (x <= -w) x += w;      // ← reset fluide
      }
      track.style.transform = `translateX(${x}px)`;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}, []);

const initR2 = useRef(false); // ← NEW

useEffect(() => {
  let raf = 0;
  let last = performance.now();
  let x = 0;
  const speed = 40; // px/sec

  const loop = (t: number) => {
    const dt = (t - last) / 1000;
    last = t;

    const track = trackRef2.current;
    const group = groupRef2.current;
    if (track && group) {
      const w = group.offsetWidth;

      // Prend en compte l'espace entre les deux groupes (évite le "trou")
      const cs = getComputedStyle(track);
      const gap = parseFloat(cs.gap || cs.columnGap || "0") || 0;
      const cycle = w + gap;

      // Démarre "hors champ" à gauche pour ne jamais voir du vide
      if (!initR2.current) {
        x = -cycle;
        track.style.transform = `translateX(${x}px)`;
        initR2.current = true;
      }

      if (!pausedRef.current) {
        x += speed * dt;          // ← gauche → droite (sens inverse de la rangée du haut)
        if (x >= 0) x -= cycle;   // boucle infinie fluide: revient à -cycle
      }

      track.style.transform = `translateX(${x}px)`;
    }

    raf = requestAnimationFrame(loop);
  };

  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}, []);

// AJOUT Stripe — helper front
async function goCheckout(priceId: string, planKey?: PlanKey) {
  const chosen = (planKey ?? "monthly") as PlanKey; // défaut sûr

  try {
    localStorage.setItem("intendedPlan", chosen); // on retient le forfait visé
  } catch {}

  const r = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }), // on n'envoie pas la période côté API
  });

  if (!r.ok) {
    alert(await r.text());
    return;
  }

  const { url } = await r.json();
  window.location.href = url;
}

return (
  <Suspense fallback={null}>
    <CheckoutWatcher
      onSuccess={handleCheckoutSuccess}
      onCancel={handleCheckoutCancel}
    />
    <section className="boutique">
      <div className="container">
        {/* ===== En-tête ===== */}
<header className="header">
  <h1>
    <span className="titlePlate">
      <span className="title">BOUTIQUE :</span>
      <span className="subtitle">Forfaits & Add-ons</span>
    </span>
  </h1>
</header>

        <div className="cardsGrid">
          {/* ===== Bloc FORFAITS ===== */}
          <div className="card tone-pink span2">
            <h2 className="tag tag-forfaits">Forfaits</h2>

            {/* Bouton comparer en haut à droite du bloc */}
            <div className="cardActions">
<button className="btn small pink" onClick={() => setCompareOpen(true)} aria-haspopup="dialog" aria-expanded={compareOpen}>
  <GitCompare size={16} />
  <span>Comparer</span>
</button>

            </div>

            {/* Grille des 4 forfaits en carrés */}
            <div className="planGrid">
              {/* STARTER */}
<div className="planCard">
  <div className="planHead">
    <span className="planName">- STARTER -</span>
    {currentPlan === "STARTER" && <span className="planBadge">✔</span>}
  </div>
                <div className="price">
                  <span className="amount">19€</span>
                  <span className="per">/ mois / entreprise</span>
                </div>
                <ul className="featList">
                  <li><Check size={16} aria-hidden /> Multi-publication de base</li>
                  <li><Check size={16} aria-hidden /> Calendrier & retours d’état</li>
                  <li><Check size={16} aria-hidden /> Analytics basiques</li>
                </ul>
{currentPlan !== "STARTER" && (
  <div className="planCTA">
    <button
      className="btn pink"
onClick={() => goCheckout("price_1SIYmvKhKf5eqe6eRPxPMezP", "STARTER")}
    >
      Choisir ce forfait
    </button>
  </div>
)}

              </div>

              {/* PRO — meilleur choix */}
<div className="planCard planBest">
  <div className="planHead">
    <span className="planName">- PRO -</span>
    {currentPlan === "PRO" && <span className="planBadge">✔</span>}
  </div>

                <div className="price">
                  <span className="amount">49€</span>
                  <span className="per">/ mois / entreprise</span>
                </div>
                <ul className="featList">
                  <li><Check size={16} aria-hidden /> Tout Starter</li>
                  <li><Check size={16} aria-hidden /> IA écriture & traduction</li>
                  <li><Check size={16} aria-hidden /> Media library avancée</li>
                </ul>
{currentPlan !== "PRO" && (
  <div className="planCTA">
    <button
      className="btn pink"
onClick={() => goCheckout("price_1SIZteKhKf5eqe6eCNdUg4xu", "PRO")}
    >
      Choisir ce forfait
    </button>
  </div>
)}
              </div>

              {/* BUSINESS */}
<div className="planCard">
  <div className="planHead">
    <span className="planName">- BUSINESS -</span>
    {currentPlan === "BUSINESS" && <span className="planBadge">✔</span>}
  </div>
                <div className="price">
                  <span className="amount">99€</span>
                  <span className="per">/ mois / entreprise</span>
                </div>
                <ul className="featList">
                  <li><Check size={16} aria-hidden /> Modules métiers</li>
                  <li><Check size={16} aria-hidden /> POS Light (non-TVA)</li>
                  <li><Check size={16} aria-hidden /> Support prioritaire</li>
                </ul>
{currentPlan !== "BUSINESS" && (
  <div className="planCTA">
    <button
      className="btn pink"
onClick={() => goCheckout("price_1SIZu4KhKf5eqe6er4BjwLlc", "BUSINESS")}
    >
      Choisir ce forfait
    </button>
  </div>
)}
              </div>

              {/* ENTERPRISE */}
<div className="planCard">
  <div className="planHead">
    <span className="planName">- ULTIMATE -</span>
    {currentPlan === "ULTIMATE" && <span className="planBadge">✔</span>}
  </div>
                <div className="price">
                  <span className="amount">149€</span>
                  <span className="per">/ mois / entreprise</span>
                </div>
                <ul className="featList">
                  <li><Check size={16} aria-hidden /> Wallet de réinjection</li>
                  <li><Check size={16} aria-hidden /> Aperçus interactifs illimités</li>
                  <li><Check size={16} aria-hidden /> SLA & onboarding dédié</li>
                </ul>
{currentPlan !== "ULTIMATE" && (
  <div className="planCTA">
    <button
      className="btn pink"
onClick={() => goCheckout("price_1SIZuNKhKf5eqe6euyYmvZtI", "ULTIMATE")}
    >
      Choisir ce forfait
    </button>
  </div>
)}
              </div>
            </div>
          </div>

          {/* ===== Bloc 3 colonnes Add-ons ===== */}
          <div className="card tone-pink span2">
            <h2 className="tag tag-addons">Gestion des add-ons</h2>

            <div className="subsGrid">
              {/* Colonne 1 — Inclus (cartes larges identiques à Souscrits) */}
              <div className="subsCol">
                <h3 className="subsTitle">Inclus</h3>
                <div className="listWide">
                  {includedAddons.map((a) => (
<div className="wideItem" key={a.name}>
{/* Inclus : carte compacte + chevron */}
<div className="wideHead">
  <div className="wideIcon"><a.Icon size={24} aria-hidden /></div>
  <div className="wideName">{a.name}</div>
</div>

<p className="wideDesc">{a.desc}</p>

{/* 3 premières fonctionnalités */}
{a.features?.length ? (
  <ul className="featMiniList">
    {a.features.slice(0, 3).map((f) => <li key={f}>{f}</li>)}
  </ul>
) : null}

</div>

                  ))}
                </div>
<button className="btn pink small whiteBorder seeMore" onClick={() => setModal("inclus")}>
  <span>Voir plus</span>
</button>

              </div>

              {/* Colonne 2 — Souscrits (même présentation) */}
              <div className="subsCol">
                <h3 className="subsTitle">Souscrits</h3>
                <div className="listWide">
                  {subscribedAddons.map((a) => (
<div className="wideItem" key={a.name}>
{/* Souscrits : carte compacte + chevron */}
<div className="wideHead">
  <div className="wideIcon"><a.Icon size={24} aria-hidden /></div>
  <div className="wideName">{a.name}</div>
</div>

<p className="wideDesc">{a.desc}</p>

{/* 3 premières fonctionnalités */}
{a.features?.length ? (
  <ul className="featMiniList">
    {a.features.slice(0, 3).map((f) => <li key={f}>{f}</li>)}
  </ul>
) : null}

{(() => {
  const key = `sub-${a.name.toLowerCase().replace(/\s+/g, "-")}`;
  const extraFeatures = (a.features || []).slice(3);
  const extraDetails  = a.details || [];
  const hasMore = extraFeatures.length + extraDetails.length > 0;

  return (
    <>
      <div
        className={`extra ${openCard[key] ? "open" : ""}`}
        id={`extra-${key}`}
      >
        {extraFeatures.length ? (
          <ul className="featMiniList">
            {extraFeatures.map((f) => <li key={`xf-${f}`}>{f}</li>)}
          </ul>
        ) : null}

        {extraDetails.length ? (
          <ul className="featMiniList">
            {extraDetails.map((d) => <li key={`xd-${d}`}>{d}</li>)}
          </ul>
        ) : null}
      </div>

      {hasMore && (
<button
  className={`chevronBtn ${openCard[key] ? "open" : ""}`}
  aria-expanded={!!openCard[key]}
  aria-controls={`extra-${key}`}
  onClick={() => toggleCard(key)}
  title={openCard[key] ? "Réduire" : "Voir plus"}
>
{openCard[key] ? (
  <ChevronUp className="chevIcon" size={22} strokeWidth={2.5} aria-hidden />
) : (
  <ChevronDown className="chevIcon" size={22} strokeWidth={2.5} aria-hidden />
)}
</button>

      )}
    </>
  );
})()}

</div>

                  ))}
                </div>
<button className="btn pink small whiteBorder seeMore" onClick={() => setModal("souscrits")}>
  <span>Gérer</span>
</button>

              </div>

              {/* Colonne 3 — Disponibles (carrousel ruban continu + voir plus) */}
              <div className="subsCol">
<h3 className="subsTitle">Disponibles</h3>

<div
  className="carouselViewport"
  onMouseEnter={() => (pausedRef.current = true)}
  onMouseLeave={() => (pausedRef.current = false)}
>
  <div className="carouselTrack" ref={trackRef}>
    {/* Groupe A */}
    <div className="carouselGroup" ref={groupRef}>
      {availableAddons.map((a) => (
<div className="carouselItem" key={`A-${a.name}`}>
  {/* Pastille catégorie */}
  {a.category && (
    <span className={`catBadge ${a.category}`}>
      {a.category === "creators" ? "Créateurs" :
       a.category === "commerce" ? "Commerce" :
       a.category === "marketing" ? "Marketing" :
       a.category === "services" ? "Services" :
       "Entreprise"}
    </span>
  )}

  <div className="carouselIcon"><a.Icon size={28} /></div>
  <div className="addonName">{a.name}</div>
  <div className="addonSmallDesc">{a.desc}</div>
  
</div>

      ))}
    </div>
    {/* Groupe B (duplication pour la boucle) */}
    <div className="carouselGroup">
      {availableAddons.map((a) => (
<div className="carouselItem" key={`B-${a.name}`}>
  {a.category && (
    <span className={`catBadge ${a.category}`}>
      {a.category === "creators" ? "Créateurs" :
       a.category === "commerce" ? "Commerce" :
       a.category === "marketing" ? "Marketing" :
       a.category === "services" ? "Services" :
       "Entreprise"}
    </span>
  )}

  <div className="carouselIcon"><a.Icon size={28} /></div>
  <div className="addonName">{a.name}</div>
  <div className="addonSmallDesc">{a.desc}</div>
  
</div>

      ))}
    </div>
  </div>
</div>

{/* Rangée 2 — sens inverse */}
<div
  className="carouselViewport"
  onMouseEnter={() => (pausedRef.current = true)}
  onMouseLeave={() => (pausedRef.current = false)}
>
  <div className="carouselTrack" ref={trackRef2}>
    {/* Groupe A (rangée 2) */}
    <div className="carouselGroup" ref={groupRef2}>
      {availableAddons.map((a) => (
<div className="carouselItem" key={`A2-${a.name}`}>
  {a.category && (
    <span className={`catBadge ${a.category}`}>
      {a.category === "creators" ? "Créateurs" :
       a.category === "commerce" ? "Commerce" :
       a.category === "marketing" ? "Marketing" :
       a.category === "services" ? "Services" :
       "Entreprise"}
    </span>
  )}

  <div className="carouselIcon"><a.Icon size={28} /></div>
  <div className="addonName">{a.name}</div>
  <div className="addonSmallDesc">{a.desc}</div>
  
</div>

      ))}
    </div>
    {/* Groupe B (duplication) */}
    <div className="carouselGroup">
      {availableAddons.map((a) => (
<div className="carouselItem" key={`B2-${a.name}`}>
  {a.category && (
    <span className={`catBadge ${a.category}`}>
      {a.category === "creators" ? "Créateurs" :
       a.category === "commerce" ? "Commerce" :
       a.category === "marketing" ? "Marketing" :
       a.category === "services" ? "Services" :
       "Entreprise"}
    </span>
  )}

  <div className="carouselIcon"><a.Icon size={28} /></div>
  <div className="addonName">{a.name}</div>
  <div className="addonSmallDesc">{a.desc}</div>
  
</div>

      ))}
    </div>
  </div>
</div>

<button
  className="btn pink whiteBorder tryCta"
  onClick={() => setModal("disponibles")}
  aria-label="Testez gratuitement votre futur atout pendant 7 jours"
>
<Hourglass size={30} aria-hidden className="tryIconLarge" />
  <span className="tryText">Testez gratuitement votre futur atout pendant 7 jours</span>
</button>

              </div>
            </div>
          </div>
        </div>
      </div>

{/* ===== Modale COMPARER FORFAITS ===== */}
{compareOpen && (
  <div className="modalOverlay" onClick={() => setCompareOpen(false)}>
    <div className="modalBox compareBox" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Comparer les forfaits">
      <div className="modalHeader">
        <h3 className="modalTitle">Comparer les forfaits</h3>
        <button className="btn small pink" onClick={() => setCompareOpen(false)}>Fermer</button>
      </div>

      <div className="modalContent">
        <div className="compareLegend">
          <span className="legendItem"><Check size={16} aria-hidden /> Inclus</span>
          <span className="legendItem"><XCircle size={16} aria-hidden /> Non inclus</span>
        </div>

        <div className="compareTableWrap" role="region" aria-label="Tableau comparatif des fonctionnalités par forfait">
          <table className="compareTable">
            <thead>
              <tr>
                <th className="featCol">Fonctionnalité</th>
                {plansMeta.map(p => (
                  <th key={p.key} className="planCol">
                    <div className="planHeadCell">
                      <div className="planHeadName">{p.label}</div>
                      <div className="planHeadPrice">{p.price}<span className="per"> / mois</span></div>
                      {currentPlan === p.key && <span className="currentBadge">✔</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row.label}>
                  <td className="featCell">
                    <div className="featLabel">{row.label}</div>
                    {row.hint && <div className="featHint">{row.hint}</div>}
                  </td>
                  {plansMeta.map(p => {
                    const val = !!row.keys[p.key];
                    return (
                      <td key={p.key} className="valCell" data-yes={val ? "1" : undefined}>
                        {val ? <Check size={18} aria-label="Inclus" /> : <XCircle size={18} aria-label="Non inclus" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="compareActions">
          <a href="/forfaits" className="btn pink">Aller à la page Forfaits</a>
        </div>
      </div>
    </div>
  </div>
)}

      {/* ===== Modale Voir Plus (cartes larges) ===== */}
      {modal && (
  <div className="modalOverlay" onClick={() => setModal(null)}>
    <div
      className="modalBox"
      data-modal={modal || undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modalHeader">

  <h3 className="modalTitle">
    Aperçu — {modal === "inclus" ? "Inclus" : modal === "souscrits" ? "Souscrits" : "Disponibles"}
  </h3>

  {modal === "disponibles" && (
    <div className="filterBar">
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
      >
        <option value="all">Toutes les catégories</option>
        <option value="creators">Créateurs</option>
        <option value="commerce">Commerce</option>
        <option value="marketing">Marketing</option>
        <option value="services">Services</option>
        <option value="enterprise">Entreprise</option>
      </select>
    </div>
  )}
</div>

<div className="modalContent">
  <div className="listWide modalList">

{(modal === "inclus"
  ? includedAddons
  : modal === "souscrits"
  ? subscribedAddons
  : availableAddons.filter((a) => categoryFilter === "all" || a.category === categoryFilter)
).map((a) => (
  <div
    className={`wideItem ${modal === "disponibles" ? "modalTwoCols" : ""}`}
    key={`M-${a.name}`}
  >

  {/* Icône à gauche (garde le badge vert si présent) */}
  <div className="wideIcon">
    <a.Icon size={24} aria-hidden />
    {(modal === "disponibles") &&
      (includedAddons.some(i => i.name === a.name) ||
       subscribedAddons.some(s => s.name === a.name)) && (
      <span className="checkBadge">✔</span>
    )}
  </div>

  {/* Corps en 2 colonnes : gauche = infos / droite = description */}
  <div className="wideBody">
    <div className="wideGrid">
      {/* Colonne gauche : titre, date, features, actions */}
      <div className="infoCol">
        <div className="wideHead">
          <div className="wideName">{a.name}</div>
          {a.since && <span className="since">{a.since}</span>}

          {modal === "souscrits" && (
            <div className="wideActions">
              <button className="btn danger small">
                <XCircle size={16} /> Résilier
              </button>
            </div>
          )}
        </div>

{modal === "disponibles" && !(
  includedAddons.some(i => i.name === a.name) ||
  subscribedAddons.some(s => s.name === a.name)
) && (
  <div className="wideActions">
    <button
      className="btn pink small"
onClick={() => goCheckout("price_xxx_remplace_moi")}
    >
      Souscrire
    </button>
  </div>
)}

      </div>

      {/* Colonne droite : description seule */}
      <div className="descCol">
        <p className="wideDesc">{a.desc}</p>
        {(a.features?.length || a.details?.length) ? (
          <ul className="featMiniList">
            {[...(a.features || []), ...(a.details || [])].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  </div>
</div>

                ))}
              </div>
            </div>
            <div className="modalFooter">
              <button className="btn pink small" onClick={() => setModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
  {/* 🔽 AJOUT Stripe — Modal de résultat paiement (version harmonisée) */}
  {checkoutStatus && (
    <div className="modalOverlay" onClick={() => setCheckoutStatus(null)}>
      <div
        className={`modalBox resultBox ${checkoutStatus === 'success' ? 'success' : 'cancel'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Résultat du paiement"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <h3 className="modalTitle">
            {checkoutStatus === 'success'
              ? 'Votre achat a été effectué avec succès'
              : 'Paiement annulé'}
          </h3>
        </div>

        <div className="modalContent">
          <p>
            {checkoutStatus === 'success'
              ? 'Votre abonnement est bien pris en compte.'
              : 'Aucun débit n’a été effectué. Vous pouvez réessayer.'}
          </p>
        </div>

<div className="modalFooter">
  <button className="btn pink" onClick={() => setCheckoutStatus(null)}>
    Fermer
  </button>
</div>

      </div>
    </div>
  )}

      {/* ============ Styles locaux ============ */}
      <style jsx>{`
        /* ===== Fond général identique Profil ===== */
.boutique {
  color-scheme: dark;

  /* 1) Dégradé par-dessus  2) Image en dessous */
  background-image:
  linear-gradient(to bottom,
    rgba(0,0,0,0.25) 0%,   /* voile partout */
    rgba(0,0,0,0.25) 40%,  /* voile constant */
    rgba(0,0,0,0.7) 70%,
    #000 100%),
    url("/background/rose.jpg");
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  background-size: cover, cover;
  background-attachment: fixed, fixed; /* garde l’effet "fixe" */

  /* Couleur de secours si l’image ne charge pas */
  background-color: #1C1C1C;
  color: var(--text, #000000);
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  --accent-pink: #ec4899;
  --border: var(--accent-pink);
  --card-bg: #1B0A0F;
}


.container {
  width: 100%;
  max-width: none;   /* neutralise la limite héritée */
  margin: 0;         /* évite le recentrage contraint */
  padding: 16px 24px 44px;
  flex: 1 1 auto;    /* s’étend correctement dans .boutique (flex) */
}

        /* ===== Header ===== */
        .header { margin: 10px 0 20px 0; text-align: center; }
        .header h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 800;
          display: inline-flex;
          gap: 8px;
          align-items: baseline;
          flex-wrap: wrap;
          color: var(--text, #e6e8ec);
        }
        .header .title { color: var(--accent-pink); font-weight: 900; }

        /* ===== Grille principale ===== */
        .cardsGrid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }
        @media (min-width: 1024px) {
          .cardsGrid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
        }
        .span2 { grid-column: 1 / -1; }

        /* ===== Cards génériques ===== */
        .card {
          position: relative;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px;
          min-width: 0;
          color: var(--text);
        }
        .tone-pink::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 14px;
          pointer-events: none;
          box-shadow: inset 0 0 0 2px var(--border);
        }

        .tag {
          display: inline-block;
          padding: 6px 12px;
          margin: 0 0 14px 0;
          border-radius: 999px;
          font-size: 1.05rem;
          font-weight: 800;
          line-height: 1;
          color: #fff;
          background: var(--accent-pink);
        }
        .tag .muted { opacity: .9; font-weight: 700; }

        /* Bouton comparer en haut à droite du bloc */
        .cardActions {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 8px;
        }

        /* ===== Plans (carrés) ===== */
        .planGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }
        .planCard {
	  position: relative;
          background: #ffffff;
  color: #111;  
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .planCard.planBest { box-shadow: 0 0 0 2px color-mix(in oklab, var(--accent-pink) 55%, transparent); }

        .planHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
/* Bande grise derrière le texte du titre (Starter/Pro/Business/Ultimate) */
.planGrid .planName {
  font-weight: 900;
  font-size: 2rem;
  background: #949494;       /* gris demandé (extrait de ton échantillon) */
  color: #000;               /* lisibilité sur fond gris */
  display: inline-block;     /* la bande suit la largeur du texte seulement */
  line-height: 1.1;
  padding: 4px 10px;         /* épaisseur de la bande */
  border-radius: 6px;        /* optionnel, arrondis discrets */
}

        .badge.best {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: color-mix(in oklab, var(--accent-pink) 18%, transparent);
          border: 1px solid var(--accent-pink);
          font-size: .82rem;
          font-weight: 800;
          color: var(--text);
        }

        .price { display: flex; align-items: baseline; gap: 8px; }
        .amount { font-size: 2rem; font-weight: 900; }
        .per { opacity: .85; font-weight: 700; }

        .featList {
          margin: 4px 0 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 6px;
        }
        .featList li {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          opacity: .95;
        }

        .planCTA { margin-top: auto; }
        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: #111;
          color: var(--text);
          text-decoration: none; cursor: pointer;
          font-weight: 800;
        }
        .btn.small { padding: 6px 10px; font-weight: 700; }
        .btn.ghost { background: transparent; }
        .btn.pink {
          background: var(--accent-pink);
          border-color: var(--accent-pink);
          color: #fff;
        }
        .btn.danger {
          background: #dc2626;
          border-color: #dc2626;
          color: #fff;
        }

        /* ===== Bloc Gestion Add-ons : grille 3 colonnes (égales) ===== */
.subsGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
@media (min-width: 1024px) {
  .subsGrid {
    /* autorise chaque colonne à rétrécir sans faire déborder le parent */
    grid-template-columns: minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);
  }
}

        .subsCol {
          background: #949494;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px;
          min-height: 220px;
          display: flex;
          flex-direction: column;
          gap: 12px;
min-width: 0;
        }
        .subsTitle {
          margin: 0 0 6px 0;
          font-size: 1.1rem;
          font-weight: 900;
        }

        /* ===== Cartes larges (Inclus & Souscrits & Modale) ===== */
/* Base : une colonne par défaut */
.listWide {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

/* Inclus & Souscrits : passer en 2 colonnes dans les encadrés */
.subsCol .listWide {
  grid-template-columns: 1fr;
}

/* Aligne-toi sur ton breakpoint existant (subsGrid passe à 3 colonnes à ≥1024px) */
@media (min-width: 1024px) {
  .subsCol .listWide {
    grid-template-columns: 1fr 1fr;
  }
}

/* Modale : rester en 1 colonne (ne pas casser l’aperçu) */
.modalList {
  grid-template-columns: 1fr !important;
}
/* ==== Modale : deux colonnes avec description à droite ==== */
.modalList .wideItem.modalTwoCols {
  /* icône + corps */
  grid-template-columns: 40px 1fr; /* élargit la colonne de l'icône */
}

/* Grille interne (corps) en 2 colonnes */
.wideGrid {
  display: grid;
  grid-template-columns: 0.7fr 2fr;
  gap: 12px;
  align-items: start;
}

/* Colonne gauche : infos */
.infoCol { display: grid; gap: 8px; }

/* Colonne droite : description, avec légère séparation visuelle */
.descCol {
  border-left: 1px solid var(--border);
  padding-left: 12px;
}

/* ---- Souscrits : afficher le corps en 1 colonne ---- */
.modalBox[data-modal="souscrits"] .wideGrid {
  grid-template-columns: 1fr;
}
.modalBox[data-modal="souscrits"] .descCol {
  border-left: 0;
  padding-left: 0;
}

/* Responsive : repasse en 1 colonne sous 720px pour ne pas casser la lecture */
@media (max-width: 720px) {
  .wideGrid { grid-template-columns: 1fr; }
  .descCol { border-left: 0; padding-left: 0; }
}

.wideItem {
  background: #fff;
  color: #111;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: start;
  text-align: start;
  gap: 6px;
}

.wideIcon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 10px rgba(0,0,0,0.1); /* halo léger */
}
        .wideBody { display: grid; gap: 6px; }
        .wideHead { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .wideName { font-weight: 900; font-size: 1.10rem; margin-top: 6px; margin-bottom: 1px; }
        .since { font-weight: 700; opacity: .8; }
        .wideDesc { font-weight: 700; color: #000; font-size: 1rem; margin-bottom: 4px; margin-top: 4px; }
        .featMiniList { margin: 0; padding-left: 22px; display: grid; gap: 2px; }
        .featMiniList li { font-weight: 400; opacity: .90; font-size: 15px }
        .wideActions { margin-top: 4px; }

.checkBadge {
  position: absolute;
  top: -6px;
  left: -6px;
  background: #22c55e;   /* vert */
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 3px rgba(0,0,0,0.6);
}

.planBadge {
  background: #22c55e;  /* vert vif */
  color: #fff;
  font-size: 1.9rem;
  font-weight: 900;
  border-radius: 999px;
  padding: 2px 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;      /* espace avec le titre */
}


        .seeMore {
          margin-top: auto;
          background: transparent;
          border: none;
          color: var(--accent-pink);
          font-weight: 700;
	  font-size: 18px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* ===== Carrousel (ruban continu, zéro à-coup) ===== */
        .carouselViewport {
          overflow: hidden;
          width: 100%;
	}
	.carouselViewport + .carouselViewport { margin-top: 10px; }

        .carouselTrack {
          display: inline-flex;
          will-change: transform;
	  gap: 12px;
        }
        .carouselGroup {
          display: inline-flex;
          gap: 12px;
        }
        .carouselItem {
	  position: relative;
          flex: 0 0 auto;
          width: 180px;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }
.carouselIcon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 1px solid var(--border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  color: #000;            /* ← le SVG Lucide hérite et devient bien lisible */
}
        .addonName { font-weight: 900; font-size: 1.05rem; color: #000; }
.addonSmallDesc {
  font-size: .8rem;
  line-height: 1rem;
  color: #000;
  opacity: 1;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

        /* ===== Modale ===== */
        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modalBox {
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          max-width: 720px;
          width: 92%;
          color: #111;
        }
        .modalTitle { margin: 0 0 8px 0; font-weight: 900; }
        .modalContent {
          max-height: 60vh;
          overflow: auto;
          padding-right: 6px;
        }
        .modalList .wideItem { background: #fff; }
        .modalFooter { margin-top: 12px; display: flex; justify-content: flex-end; }

.catBadge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  color: #fff;
}
.carouselItem { position: relative; }

/* Couleurs par catégorie */
.catBadge.creators { background: #9333ea; }   /* violet */
.catBadge.commerce { background: #f59e0b; }   /* orange */
.catBadge.marketing { background: #10b981; }  /* vert */
.catBadge.services { background: #3b82f6; }   /* bleu */
.catBadge.enterprise { background: #ef4444; } /* rouge */

.tryNote {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.85rem;
  opacity: 0.85;
  margin: 8px 0;
  color: #444;
}

.tryCta {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 34px auto 6px auto;
  padding: 24px 18px;       /* plus gros encadré */
  border-radius: 14px;
}

.tryCta .tryIconLarge {
  color: #fff;
}

.tryCta .tryText {
  font-size: 1.15rem;  /* ≈ 17-18px, taille du texte seulement */
  font-weight: 700;
  text-align: center;
  padding: -1px 18px;
}



.tryBox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  margin: 12px auto 0 auto;
  border-radius: 10px;
  background: var(--accent-pink);
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
}

.tryBox .tryIcon {
  color: #fff; /* icône en blanc pour bien ressortir */
}

.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.filterBar select {
  background: #111;
  color: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  font-weight: 700;
  cursor: pointer;
}

.detailList {
  margin: 6px 0 0 0;
  padding-left: 20px;
  list-style: disc;
  color: #333;
  font-size: 0.9rem;
  line-height: 1.3rem;
}
.detailList li {
  margin-bottom: 4px;
}

/* Couleurs en surbrillance */
.filterBar option[value="creators"] { background: #9333ea; color: #fff; }
.filterBar option[value="commerce"] { background: #f59e0b; color: #fff; }
.filterBar option[value="marketing"] { background: #10b981; color: #fff; }
.filterBar option[value="services"] { background: #3b82f6; color: #fff; }
.filterBar option[value="enterprise"] { background: #ef4444; color: #fff; }

.wideHead {
  display: flex;
  align-items: center;
  justify-content: space-between; /* 👈 espace entre titre/date et bouton */
  flex-wrap: wrap;
  gap: 8px;
}

.btn.whiteBorder {
  border: 1px solid #fff !important;
}

.btn-resilier {
  margin-left: auto;  /* pousse le bouton à droite */
  padding: 4px 8px;
  font-size: 0.8rem;
}

/* ===== Modale Comparer : dimensions & thème cohérent ===== */
.compareBox {
  max-width: 960px;
  width: 96%;
}

/* Bandeau “forfait en cours” dans l’en-tête des colonnes */
.currentBadge {
  background: #22c55e;
  color: #fff;
  font-weight: 900;
  border-radius: 999px;
  padding: 2px 8px;
  margin-left: 8px;
  font-size: 0.9rem;
}

/* Légende check/cross */
.compareLegend {
  display: flex;
  gap: 12px;
  align-items: center;
  font-weight: 700;
  color: #333;
  margin-bottom: 10px;
}
.legendItem { display: inline-flex; gap: 6px; align-items: center; }

/* Table */
.compareTableWrap { overflow: auto; border: 1px solid var(--border); border-radius: 10px; }
.compareTable { width: 100%; border-collapse: separate; border-spacing: 0; background: #fff; color: #111; }
.compareTable thead th {
  position: sticky; top: 0;
  background: #f8f8f8; z-index: 1;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  padding: 12px;
}
.compareTable tbody td { padding: 10px 12px; border-top: 1px solid #f0f0f0; }
.compareTable tr:nth-child(odd) td { background: #ffffff; }
.compareTable tr:nth-child(even) td { background: #fafafa; }

.featCol { min-width: 280px; width: 38%; }
.planCol { text-align: center; min-width: 140px; }
.planHeadCell { display: grid; gap: 4px; place-items: center; }
.planHeadName { font-weight: 900; font-size: 1.05rem; }
.planHeadPrice { font-weight: 800; }
.planHeadPrice .per { opacity: .8; font-weight: 700; }

.featCell .featLabel { font-weight: 700; }
.featCell .featHint  { font-size: .85rem; opacity: .8; }

.valCell { text-align: center; }
.valCell svg { vertical-align: middle; }
.valCell[data-yes="1"] { color: #16a34a; }      /* vert */
.valCell:not([data-yes]) { color: #ef4444; }    /* rouge */

.compareActions {
  display: flex; justify-content: flex-end; margin-top: 12px;
}

/* Positionnement pour le bouton chevron */
.wideItem { position: relative; }

/* Bloc extensible */
.extra {
  max-height: 0;
  overflow: hidden;
  transition: max-height 280ms ease;
  margin-top: 6px;
}
.extra.open {
  /* Choisis une valeur assez grande pour couvrir le contenu étendu */
  max-height: 600px;
}

/* Bouton chevron */
/* Bouton chevron — icon-only, rose, sans fond ni bordure */
/* Bouton chevron — icon-only, rose, sans fond ni bordure */
.chevronBtn {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: transparent;   /* aucun fond */
  border: none;              /* aucune bordure */
  color: var(--accent-pink); /* chevron rose */
  cursor: pointer;
  line-height: 0;            /* évite un éventuel cadrage vertical */
}

/* 👉 Cible FORT le SVG du chevron, au-dessus d'un éventuel .lucide global */
:global(.chevronBtn .chevIcon) {
  width: 26px !important;   /* ↑ taille visible */
  height: 26px !important;
  stroke-width: 2.5;         /* trait plus épais */
  stroke: currentColor;      /* garde le rose via le parent */
  fill: none;
}
:global(.chevronBtn .chevIcon) {
  width: 30px !important;   /* ↑ taille visible */
  height: 30px !important;
  stroke-width: 3;         /* trait plus épais */
  stroke: currentColor;      /* garde le rose via le parent */
  fill: none;
}

/* Pas de fond au hover */
.chevronBtn:hover { color: color-mix(in oklab, var(--accent-pink) 90%, white 10%); }

/* Plaque blanche translucide sous tout l’intitulé */
.titlePlate {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.65);   /* transparence : augmente ↓ pour moins transparent */
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(0,0,0,.28);
  backdrop-filter: blur(2px);
}

.header .subtitle {
  color: #ffffff;
  font-weight: 700;
  opacity: .92;
}
/* ===== Modal résultat paiement ===== */
.resultBox { max-width: 560px; border: 1px solid var(--border); }
.resultBox.success .modalTitle { color: #16a34a; }   /* vert */
.resultBox.cancel  .modalTitle { color: #ef4444; }   /* rouge */


      `}</style>
    </section>
  </Suspense>
  );
}
