"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  Wrench,
  PlugZap,
  ShieldCheck,
  FolderOpen,
  Image as ImageIcon,
  Palette,
  Layers,
  Cpu,
  Bot,
  ChartBarBig,
  FileDown,
  Settings2,
  Bell,
  Link,
  Cloud,
  Database,
  Smartphone,
} from "lucide-react";

/**
 * OutilsPage v2
 * - Colonnes largeur unifiée (basée sur la plus large: "Gouvernance & innovation")
 * - 4 cartes visibles par colonne (scroll fluide, scroll-snap)
 * - Pastilles de progression plus visibles
 * - Prévention du chevauchement (hauteur slot augmentée, wrap texte, taille desc réduite)
 * - Respect strict: grands encadrés fond #230d02 + bordure orange, cartes blanches, texte noir, icônes noires.
 */
export default function OutilsPage() {
  return (
    <section className="o-outils">
      <div className="o-container">
<header className="o-header">
  <h1>
    <span className="o-titlePlate">
      <span className="o-title">OUTILS :</span>
      <span className="o-subtitle">Espace de configuration & utilitaires</span>
    </span>
  </h1>

  {/* Nouvelle barre réceptacle add-ons */}
  <AddonBar />
</header>


        <div className="o-grid o-five">
          {/* Colonne 1 — Modules & extensions */}
          <div className="o-col">
            <section className="o-card o-tone">
              <h2 className="o-tag">
                <Wrench size={20} /> Modules & extensions
              </h2>

              <ColumnScroller>
                <Tile>
                  <ToolTile
                    icon={<Layers />}
                    title="Add-ons & catégories"
                    desc="Activez, désactivez et regroupez vos modules métiers en un seul endroit."
                  />
                </Tile>
                <Tile>
                  <ToolTile
                    icon={<Cpu />}
                    title="Moteur IA associé"
                    desc="Définissez comment l’IA doit se comporter pour vos différents add-ons."
                  />
                </Tile>
                <Tile>
                  <ToolTile
                    icon={<ShieldCheck />}
                    title="Droits & accès"
                    desc="Contrôlez qui peut utiliser chaque add-on dans votre équipe."
                  />
                </Tile>
              </ColumnScroller>
<p className="o-hint">
  Paramétrez vos modules et utilisez vos Add-ons de gestion entreprise.
</p>
            </section>
          </div>

          {/* Colonne 2 — Marque & contenu */}
          <div className="o-col">
            <section className="o-card o-tone">
              <h2 className="o-tag">
                <FolderOpen size={20} /> Marque & contenu
              </h2>

              <ColumnScroller>
                <Tile>
                  <ToolTile
                    icon={<ImageIcon />}
                    title="Médias"
                    desc="Ajoutez vos fichiers : upload simple ou import en masse, selon vos besoins."
                  />
                </Tile>
                <Tile>
                  <ToolTile
                    icon={<Palette />}
                    title="Couleurs & logos"
                    desc="Stockez votre palette officielle et vos logos."
                  />
                </Tile>
                <Tile>
                  <ToolTile
                    icon={<Cpu />}
                    title="Fenêtres de publication"
                    desc="Définissez les heures ou jours autorisés pour publier vos contenus."
                  />
                </Tile>
                <Tile>
                  <ToolTile
                    icon={<Link />}
                    title="Liens suivis (UTM)"
                    desc="Ajoutez automatiquement des balises à vos liens pour savoir d’où vient votre trafic."
                  />
                </Tile>
                <Tile>
                  <ToolTile
                    icon={<Bell />}
                    title="Notifications"
                    desc="Recevez des alertes en cas d’échéance, d’erreur ou quand une validation est nécessaire."
                  />
                </Tile>
              </ColumnScroller>
<p className="o-hint">
  Centralisez vos médias, styles et contenus.
</p>
            </section>
          </div>

          {/* Colonne 3 — Intégrations & données */}
          <div className="o-col">
            <section className="o-card o-tone">
              <h2 className="o-tag">
                <PlugZap size={20} /> Intégrations & données
              </h2>

              <ColumnScroller variant="wide">
                <Tile>
                  <WideItem
                    icon={<Cloud />}
                    title="Intégrations cloud"
                    desc="Reliez vos espaces de fichiers (Drive, Dropbox, etc.)."
                  />
                </Tile>
                <Tile>
                  <WideItem
                    icon={<Database />}
                    title="Exports auto"
                    desc="Envoyez automatiquement vos données vers un bucket ou un webhook."
                  />
                </Tile>
                <Tile>
                  <WideItem
                    icon={<Database />}
                    title="Backups auto"
                    desc="Conservez des copies de vos posts et réglages pour éviter toute perte."
                  />
                </Tile>
                <Tile>
                  <WideItem
                    icon={<Database />}
                    title="Restauration simplifiée"
                    desc="Restaurez un post ou une configuration antérieure en un clic."
                  />
                </Tile>
              </ColumnScroller>
<p className="o-hint">
  Connectez vos sources de données et automatisez les échanges.
</p>
            </section>
          </div>

          {/* Colonne 4 — Gouvernance & innovation */}
          <div className="o-col">
            <section className="o-card o-tone">
              <h2 className="o-tag">
                <Settings2 size={20} /> Gouvernance & innovation
              </h2>

              <ColumnScroller>
                <Tile>
                  <ToolTile
                    icon={<Bell />}
                    title="Journal d’activité"
                    desc="Consultez l’historique des actions : qui a modifié, supprimé ou publié un contenu."
                  />
                </Tile>
                <Tile>
                  <ToolTile
                    icon={<Layers />}
                    title="Workflow collaboratif"
                    desc="Activez ou désactivez la validation des posts avant publication (option pour forfaits avancés)."
                  />
                </Tile>
                <Tile>
                  <ToolTile
                    icon={<Bot />}
                    title="A/B test de légendes"
                    desc="Testez deux variantes d’une même publication pour voir laquelle performe le mieux (à terme dans Créer un post)."
                  />
                </Tile>
              </ColumnScroller>
<p className="o-hint">
  Gérez les accès, contrôlez les droits et expérimentez de nouvelles idées.
</p>
            </section>
          </div>

          {/* Colonne 5 — Analyse & conformité */}
          <div className="o-col">
            <section className="o-card o-tone">
              <h2 className="o-tag">
                <ChartBarBig size={20} /> Analyse & conformité
              </h2>

              <ColumnScroller variant="wide">
                <Tile>
                  <WideItem
                    icon={<ChartBarBig />}
                    title="Performances par réseau"
                    desc="Voyez sur quels réseaux vos posts génèrent le plus d’engagement."
                  />
                </Tile>
                <Tile>
                  <WideItem
                    icon={<ChartBarBig />}
                    title="Comparaison campagnes"
                    desc="Comparez différentes périodes, formats ou types de contenus pour savoir ce qui marche le mieux."
                  />
                </Tile>
                <Tile>
                  <WideItem
                    icon={<FileDown />}
                    title="Exports CSV / PDF"
                    desc="Téléchargez vos statistiques ou programmez l’envoi automatique de rapports."
                  />
                </Tile>
                <Tile>
                  <WideItem
                    icon={<ShieldCheck />}
                    title="Vérificateur de conformité"
                    desc="Contrôlez que vos posts respectent les règles de chaque réseau (formats, dimensions, textes)."
                  />
                </Tile>
                <Tile>
                  <WideItem
                    icon={<ShieldCheck />}
                    title="Protection des données"
                    desc="Vos fichiers et contenus sont stockés de façon sécurisée, avec respect du RGPD."
                  />
                </Tile>
                <Tile>
                  <WideItem
                    icon={<ShieldCheck />}
                    title="Audit des accès"
                    desc="Gardez une trace des personnes et rôles qui accèdent ou modifient vos données."
                  />
                </Tile>
              </ColumnScroller>
<p className="o-hint">
  Suivez vos performances et assurez la conformité réglementaire.
</p>
            </section>
          </div>
        </div>
      </div>

      {/* ===== Styles ===== */}
      <style jsx>{`
.o-outils {
  color-scheme: dark;

  /* Dégradé (60%) + image */
  background-image:
linear-gradient(to bottom,
    rgba(0,0,0,0.25) 0%,   /* voile partout */
    rgba(0,0,0,0.25) 40%,  /* voile constant */
    rgba(0,0,0,0.7) 70%,
    #000 100%),
    url("/background/orange.jpg");
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  background-size: cover, cover;
  background-attachment: fixed, fixed;

  /* Couleur de secours si image absente */
  background-color: #1C1C1C;

  color: var(--text, #e6e8ec);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  --accent-orange: #EA580C;
  --border: var(--accent-orange);
  --card-bg: #230d02;
  --gap: 20px; /* espace entre cartes */
  --item-h: 184px; /* hauteur de base carte (anti-chevauchement) */
}

        .o-container { width: 100%; margin: 0 auto; padding: 16px 24px 44px; }
        .o-header { margin: 10px 0 20px; text-align: center; }
        .o-header h1 { margin: 0; font-size: 2rem; font-weight: 800; display: inline-flex; gap: 8px; align-items: baseline; flex-wrap: wrap; color: var(--text); }
        .o-title { color: var(--accent-orange); font-weight: 900; }

/* Plaque blanche translucide sous tout l’intitulé */
.o-titlePlate {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.60);   /* même opacité que les autres pages */
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(0,0,0,.28);
  backdrop-filter: blur(2px);
}

.o-header .o-title {
  color: var(--accent-orange);
  font-weight: 900;
}

.o-header .o-subtitle {
  color: #ffffff;
  font-weight: 700;
  opacity: .92;
}

        /* 5 colonnes unifiées (basé sur la plus large) + gouttières */
        .o-grid { display: grid; grid-template-columns: 1fr; gap: 16px; align-items: start; }
        .o-col { display: flex; flex-direction: column; gap: 16px; }
        @media (min-width: 1280px) {
          .o-grid.o-five {
            grid-template-columns: repeat(5, 360px); /* largeur unifiée */
            justify-content: space-between; /* espace entre colonnes */
            column-gap: 36px;
          }
        }

        /* Grands encadrés */
        .o-card { position: relative; background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px; padding: 18px 18px 22px 18px; min-width: 0; color: var(--text); }
        .o-tone::before { content: ""; position: absolute; inset: 0; border-radius: 14px; pointer-events: none; box-shadow: inset 0 0 0 2px var(--border); }
        .o-tag { display: inline-flex; gap: 8px; align-items: center; padding: 6px 12px; margin: 0 0 14px; border-radius: 999px; font-size: 1.20rem; font-weight: 800; line-height: 1; color: #fff; background: var(--accent-orange); white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }

        /* Scroller (4 cartes visibles, scroll-snap) */
/* Scroller (4 cartes visibles, scroll-snap) */
:global(.o-scrollerWrap) { position: static; }
:global(.o-scroller) {
  display: grid;
  grid-auto-rows: var(--item-h);
  gap: var(--gap);               /* ← maintenant pris en compte */
  overflow: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  padding-right: 16px;
  max-height: calc((var(--item-h) * 3) + (var(--gap) * 2));
  overscroll-behavior: contain;
}
:global(.o-scroller) > * { scroll-snap-align: start; box-sizing: border-box; }
:global(.o-scroller)::-webkit-scrollbar { width: 6px; }
:global(.o-scroller)::-webkit-scrollbar-thumb { background: #5a3413; border-radius: 6px; }
:global(.o-scroller) { scrollbar-width: thin; scrollbar-color: #5a3413 transparent; }

/* Indicateur de pastilles (plus visible) */
/* Pastilles en haut-droite, à l’extérieur du cadre */
:global(.o-dots) {
  position: absolute;
  top: 8px;          /* aligné en haut */
  left: -18px;      /* à l’EXTÉRIEUR du cadre */
  width: 10px;
  height: auto;
  display: flex;
  flex-direction: column;   /* vertical */
  align-items: center;
  gap: 8px;
  pointer-events: none;
  z-index: 5;
}


/* Style des points inchangé */
:global(.o-dot) {
  width: 10px; height: 10px; border-radius: 50%;
  background: #4d2a0c; box-shadow: 0 0 0 1px var(--border) inset;
  opacity: .75; transition: transform .18s ease, opacity .18s ease, background .18s ease;
}
:global(.o-dot.is-active) {
  background: var(--accent-orange); opacity: 1; transform: scale(1.18);
  box-shadow: 0 0 0 1px #000 inset, 0 0 10px rgba(245,158,11,.35);
}


:global(.o-item) { min-height: var(--item-h); box-sizing: border-box; }


        /* Wrap élégant dans les cartes blanches */
        .o-tileTitle, .o-wideTitle { word-break: break-word; }
.o-tileDesc, .o-wideDesc {
  word-break: break-word;
  overflow-wrap: anywhere;
  hyphens: auto;
  display: -webkit-box;
  -webkit-line-clamp: 3;          /* ← coupe à 3 lignes */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

   
`}</style>
    </section>
  );
}

/* ========= Scroller + pastilles ========= */
function ColumnScroller({ children }: { children: React.ReactNode; variant?: "wide" | "default" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const items = useMemo(() => React.Children.toArray(children), [children]);
  const pages = Math.max(1, Math.ceil(items.length / 3));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const h = el.clientHeight; // hauteur fenêtre (3 items)
        const pos = el.scrollTop;
        const page = Math.min(pages - 1, Math.round(pos / (h + 0.0001)));
        setActive(page);
        ticking = false;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll as any);
  }, [pages]);

  return (
    <div className="o-scrollerWrap">
      <div ref={ref} className="o-scroller">
        {items.map((child, i) => (
          <div className="o-item" key={i}>{child}</div>
        ))}
      </div>
      {pages > 1 && (
        <div className="o-dots" aria-hidden>
          {Array.from({ length: pages }).map((_, i) => (
            <span key={i} className={`o-dot ${i === active ? "is-active" : ""}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/* Enveloppe utilitaire pour la cohérence visuelle */
function Tile({ children }: { children: React.ReactNode }) {
  return <div style={{ height: "100%" }}>{children}</div>;
}

/* ========= Composants cartes ========= */
function ToolTile({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  const tileStyle: React.CSSProperties = {
    background: "#ffffff",
    color: "#000000",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 14,
    minHeight: "100%",
    display: "grid",
    gridTemplateColumns: "48px 1fr",
    gap: 12,
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,.25)",
  };
  const iconWrap: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 10px rgba(0,0,0,.12)",
    color: "#000",
  };
  const titleStyle: React.CSSProperties = {
    margin: "0 0 8px 0",
    fontWeight: 900,
    fontSize: 20,
    lineHeight: 1.2,
    color: "#000",
  };
  const descStyle: React.CSSProperties = {
    margin: 0,
    color: "#000",
    fontSize: 15,
    lineHeight: 1.35,
  };

  return (
    <div className="o-tile" style={tileStyle}>
      <div className="o-tileIcon" style={iconWrap}>
        {/* @ts-ignore */}
        {icon}
      </div>
      <div>
        <h3 className="o-tileTitle" style={titleStyle}>
          {title}
        </h3>
        <p className="o-tileDesc" style={descStyle}>
          {desc}
        </p>
      </div>
    </div>
  );
}

function WideItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    color: "#000000",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 14,
    minHeight: "100%",
    display: "grid",
    gridTemplateColumns: "48px 1fr",
    gap: 12,
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,.25)",
  };
  const iconWrap: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 10px rgba(0,0,0,.12)",
    color: "#000",
  };
  const titleStyle: React.CSSProperties = {
    margin: "0 0 8px 0",
    fontWeight: 900,
    fontSize: 20,
    lineHeight: 1.2,
    color: "#000",
  };
  const descStyle: React.CSSProperties = {
    margin: 0,
    color: "#000",
    fontSize: 15,
    lineHeight: 1.35,
  };

  return (
    <div className="o-wideItem" style={cardStyle}>
      <div className="o-wideIcon" style={iconWrap}>
        {/* @ts-ignore */}
        {icon}
      </div>
      <div>
        <h3 className="o-wideTitle" style={titleStyle}>
          {title}
        </h3>
        <p className="o-wideDesc" style={descStyle}>
          {desc}
        </p>
      </div>
    </div>
  );
}
/* ===== Barre réceptacle Add-ons ===== */
function AddonBar() {
  return (
<div className="o-addonBar">
  <div className="o-chip o-fixed">
    <div className="o-fixedContent">
      <span className="o-icon"><Smartphone /></span>
      <span className="o-line">Applications</span>
      <span className="o-line">Actives</span>
    </div>
  </div>

<div className="o-separator">-</div>

<p className="o-emptyMsg">Aucune application en cours d’utilisation</p>

      {/* Icônes d’add-ons apparaîtront ici quand actifs */}
      <style jsx>{`
        .o-addonBar {
          width: 100%;
          min-height: 120px; /* hauteur visible même vide */
          background: #0b0b0b;
          border: 2px solid #EA580C;
          border-radius: 14px;
          margin: 16px auto 0;
        }

.o-addonBar {
  position: relative;   /* ← ajoute cette ligne */
  width: 100%;
  min-height: 120px;
  background: #0b0b0b;
  border: 2px solid #EA580C;
  border-radius: 14px;
  margin: 16px auto 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
}


.o-chip.o-fixed {
  background: #EA580C;
  color: #000;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  min-width: 100px;
  min-height: 100%;  /* prend toute la hauteur de la barre */
}

.o-fixedContent {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
}

.o-icon svg {
  width: 28px;
  height: 28px;
  margin-bottom: 4px;
}

.o-line {
  font-size: 15px; /* un peu plus gros que normal */
  font-weight: 800;
}

.o-separator {
  color: #EA580C;      /* orange */
  font-size: 22px;     /* un peu plus gros pour être visible */
  font-weight: 900;    /* bien épais */
  margin: 0 8px;       /* espace autour pour respirer */
  display: flex;
  align-items: center; /* aligné verticalement au centre */
}

/* Hints sous chaque colonne – portée page (fonctionne partout) */
:global(.o-hint){
  margin-top:25px;
  font-size:18px;    /* ← mets la taille que tu veux ici */
  line-height:1.35;
  color:#a3a3a3;
}

/* Pour que les pastilles à l’extérieur ne soient pas coupées */
.o-card { overflow: visible; }

.o-emptyMsg {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);  /* centre parfaitement */
  color: #9ca3af;
  font-size: 20px;
  font-style: italic;
  font-weight: 400;
  margin: 0;
  pointer-events: none;         /* ne bloque pas les clics */
}

      `}</style>
    </div>
  );
}

