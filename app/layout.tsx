// app/layout.tsx
"use client";

import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import {
  Home,
  FileText,
  Calendar,
  User,
  BadgeEuro,
  Wrench,
  LogOut,
  Globe,
  Building2,
  Bell,
Clock3,
  ChevronDown,
} from "lucide-react";

const inter = Inter({ subsets: ["latin"], display: "swap" });

/* ===== Listes ===== */
const LANGS = [
  { code: "fr", label: "Français 🇫🇷" },
  { code: "en", label: "Anglais 🇬🇧" },
  { code: "es", label: "Espagnol 🇪🇸" },
  { code: "de", label: "Allemand 🇩🇪" },
  { code: "it", label: "Italien 🇮🇹" },
  { code: "pt", label: "Portugais 🇵🇹" },
  { code: "tr", label: "Turc 🇹🇷" },
  { code: "id", label: "Indonésien 🇮🇩" },
  { code: "el", label: "Grec 🇬🇷" },
];

const ORGS = [
  { id: "org-1", name: "Entreprise A" },
  { id: "org-2", name: "Entreprise B" },
  { id: "org-3", name: "Entreprise C" },
];

const NAV_ITEMS = [
  { label: "Accueil", href: "/", icon: Home, exact: true },
  { label: "Créer un post", href: "/posts", icon: FileText },
  { label: "Planning", href: "/planning", icon: Calendar },
  { label: "Outils", href: "/outils", icon: Wrench },
  { label: "Boutique", href: "/forfaits", icon: BadgeEuro },
  { label: "Profil", href: "/profile", icon: User },
];

const TZ_OPTIONS = [
  { v: "Africa/Casablanca",  label: "Afrique/Casablanca (UTC+0/+1)" },
  { v: "America/Los_Angeles", label: "Amérique/Los Angeles (UTC-8/-7)" },
  { v: "America/New_York",   label: "Amérique/New York (UTC-5/-4)" },
  { v: "Asia/Jakarta",       label: "Asie/Jakarta (UTC+7)" },
  { v: "Asia/Jayapura",      label: "Asie/Jayapura (UTC+9)" },
  { v: "Asia/Makassar",      label: "Asie/Makassar (UTC+8)" },
  { v: "Asia/Shanghai",      label: "Asie/Shanghai (UTC+8)" },
  { v: "Asia/Tokyo",         label: "Asie/Tokyo (UTC+9)" },
  { v: "Europe/Athens",      label: "Europe/Athènes (UTC+2/+3)" },
  { v: "Europe/Berlin",      label: "Europe/Berlin (UTC+1/+2)" },
  { v: "Europe/Istanbul",    label: "Europe/Istanbul (UTC+3)" },
  { v: "Europe/Lisbon",      label: "Europe/Lisbonne (UTC+0/+1)" },
  { v: "Europe/London",      label: "Europe/Londres (UTC+0/+1)" },
  { v: "Europe/Madrid",      label: "Europe/Madrid (UTC+1/+2)" },
  { v: "Europe/Paris",       label: "Europe/Paris (UTC+1/+2)" },
  { v: "Europe/Rome",        label: "Europe/Rome (UTC+1/+2)" },
  { v: "Indian/Reunion",     label: "Océan Indien/La Réunion (UTC+4)" },
  { v: "UTC",                label: "UTC" },
];

const ICON_COLORS: Record<string, string> = {
  "/": "#1D4ED8",
  "/posts": "#7E22CE",
  "/planning": "#059669",
  "/outils": "#EA580C",
  "/forfaits": "#BE185D",
  "/profile": "#0891B2",
  "__logout": "#B91C1C",
};

/* ===== Sidebar ===== */
function Sidebar() {
  const pathname = usePathname();

  // Initialisation cohérente (évite mismatch SSR/CSR)
  const [locale, setLocale] = useState<string>(() => {
    if (typeof window === "undefined") return "fr";
    return localStorage.getItem("locale") || "fr";
  });

  const [orgId, setOrgId] = useState<string>(() => {
    if (typeof window === "undefined") return ORGS[0].id;
    // on supporte encore une ancienne clé éventuelle "orgId"
    const legacy = typeof window !== "undefined" ? localStorage.getItem("orgId") : null;
    return localStorage.getItem("org.current") || legacy || ORGS[0].id;
  });

const [tz, setTz] = useState<string>(() => {
  if (typeof window === "undefined") return "Europe/Paris";
  return localStorage.getItem("site.tz") || "Europe/Paris";
});

// Préférences Notifications (stockées en localStorage)
const [notifEmail, setNotifEmail] = useState<boolean>(() => {
  if (typeof window === "undefined") return true;
  return (localStorage.getItem("notifEmail") ?? "1") === "1";
});
const [notifSecurity, setNotifSecurity] = useState<boolean>(() => {
  if (typeof window === "undefined") return true;
  return (localStorage.getItem("notifSecurity") ?? "1") === "1";
});
const [notifProduct, setNotifProduct] = useState<boolean>(() => {
  if (typeof window === "undefined") return false;
  return (localStorage.getItem("notifProduct") ?? "0") === "1";
});

function togglePref(key: string, next: boolean) {
  if (typeof window !== "undefined") localStorage.setItem(key, next ? "1" : "0");
}

  // Normalisation au montage : impose org.current + orgName
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedId = localStorage.getItem("org.current") || localStorage.getItem("orgId") || ORGS[0].id;
    const sel = ORGS.find((o) => o.id === savedId) ?? ORGS[0];
    setOrgId(sel.id);
    localStorage.setItem("org.current", sel.id);
    localStorage.setItem("orgId", sel.id); // compat
    localStorage.setItem("orgName", sel.name);
    window.dispatchEvent(new Event("org-change"));
  }, []);

  return (
    <aside className="sb" aria-label="Navigation principale">
      {/* Cartes compactes */}
<div className="sb-cards">
  {/* Entreprise (désormais en HAUT) */}
  <div className="card">
    <div className="card-title">
      <Building2 size={20} />
      <span>Entreprise</span>
    </div>
    <select
      className="field"
      value={orgId}
      onChange={(e) => {
        const nextId = e.target.value;
        const sel = ORGS.find((o) => o.id === nextId) ?? ORGS[0];
        setOrgId(sel.id);
        if (typeof window !== "undefined") {
          localStorage.setItem("org.current", sel.id);
          localStorage.setItem("orgId", sel.id); // compat
          localStorage.setItem("orgName", sel.name);
          window.dispatchEvent(new Event("org-change"));
        }
      }}
    >
      {ORGS.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  </div>

  {/* Langue (désormais en BAS de Entreprise) */}
  <div className="card">
    <div className="card-title">
      <Globe size={20} />
      <span>Langue</span>
    </div>
    <select
      className="field"
      value={locale}
      onChange={(e) => {
        const next = e.target.value;
        setLocale(next);
        if (typeof window !== "undefined") {
          localStorage.setItem("locale", next);
          window.dispatchEvent(new Event("locale-change"));
        }
      }}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  </div>

  {/* NOUVEL encadré : Fuseau horaire (3ᵉ carte) */}
  <div className="card">
    <div className="card-title">
      {/* On réutilise l’icône Globe pour rester dans tes icônes sobres */}
      <Clock3 size={20} />
      <span>Fuseau horaire</span>
    </div>
    <select
      className="field"
      value={tz}
      onChange={(e) => {
        const next = e.target.value;
        setTz(next);
        if (typeof window !== "undefined") {
          localStorage.setItem("site.tz", next);
          // Optionnel : prévenir le reste de l’app comme dans la navbar
          window.dispatchEvent(new CustomEvent("tz-change", { detail: next }));
        }
      }}
      aria-label="Sélection du fuseau horaire"
    >
      {TZ_OPTIONS.map((o) => (
        <option key={o.v} value={o.v}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
</div>


      {/* Menu */}
      <nav className="sb-nav">
        <ul className="menu">
          {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href} className="menu-item">
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`menu-link ${isActive ? "is-active" : ""}`}
                  style={
                    {
                      // couleurs dynamiques par entrée
                      ["--hover-color" as any]: `${ICON_COLORS[href]}33`,
                      ["--active-bg" as any]: `${ICON_COLORS[href]}26`,
                      ["--active-ring" as any]: ICON_COLORS[href],
                    } as React.CSSProperties
                  }
                >
                  <Icon size={40} color={ICON_COLORS[href]} />
                  <span className="menu-text">{label}</span>
                </Link>
                <div className="sep" />
{label === "Planning" ? <div className="sep strong" /> : <div className="sep" />}
              </li>
            );
          })}
        </ul>

        <div className="logout">
          <Link
            href="/login"
            className="menu-link"
            style={
              {
                ["--hover-color" as any]: `${ICON_COLORS["__logout"]}33`,
                ["--active-bg" as any]: `${ICON_COLORS["__logout"]}26`,
                ["--active-ring" as any]: ICON_COLORS["__logout"],
              } as React.CSSProperties
            }
          >
            <LogOut size={40} color={ICON_COLORS["__logout"]} />
            <span className="menu-text">Déconnexion</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}

/* ===== Root layout ===== */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      {/* On interdit le scroll global (une seule scrollbar dans .main) */}
      <body className={inter.className} style={{ overflow: "hidden", background: "var(--bg-main)" }}>
        <div className="shell">
          <Sidebar />
          <main className="main" role="main">
            {children}
          </main>
        </div>

        {/* Styles layout (scopés au layout) */}
        <style jsx global>{`
          /* Reset critique */
          html,
          body {
            height: 100%;
            margin: 0;
            background: var(--bg-main);
            color: var(--text);
          }
          *,
          *::before,
          *::after {
            box-sizing: border-box;
          }

          /* Conteneur app : plein écran, pas de scroll */
          .shell {
            position: fixed;
            inset: 0;
            display: flex;
            width: 100vw;
            height: 100dvh;
            overflow: hidden;
            background: var(--bg-main);
          }

          /* Sidebar */
          .sb {
            display: flex;
            flex-direction: column;
            width: 216px;
            height: 100%;
            flex-shrink: 0;
            background: #000;
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.04);
          }
          .sb-cards {
            padding: 10px;
          }
          .card {
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: #1c1c1c;
            border-radius: 12px;
            padding: 10px;
            margin-bottom: 10px;
            backdrop-filter: blur(2px);
          }
          .card-title {
            display: flex;
            align-items: center;
            gap: 8px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 14px;
            color: #a1a1aa;
            margin-bottom: 5px;
          }
          .field {
            width: 100%;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: #111;
            color: #fafafa;
            padding: 9px 12px;
            font-size: 16px;
            outline: none;
          }
          .field:focus {
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
          }

          /* Navigation */
          .sb-nav {
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;
            min-height: 0;
          }
          .menu {
            list-style: none;
            margin: 0;
            padding: 6px 10px;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          .menu-item {
            list-style: none;
margin-bottom: 10px
          }
          .menu-link {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            text-align: center;
            padding: 10px 12px;
            border-radius: 14px;
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #d4d4d8;
            text-decoration: none;
            transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
          }
          .menu-link:hover {
            background: var(--hover-color);
            color: #fafafa;
          }
          .menu-link.is-active {
            background: var(--active-bg);
            color: #fff;
            box-shadow: 0 0 0 1px var(--active-ring) inset;
          }
          .menu-text {
            display: block;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .logout {
            margin-top: auto;
            padding: 0 10px 10px;
          }

          /* Main : seule zone scrollable */
          .main {
            flex: 1;
            min-width: 0;
            height: 100%;
            overflow-y: auto; /* unique scrollbar */
            overflow-x: hidden;
            background: var(--bg-main);
            padding: 0;
          }
.stack { display: flex; flex-direction: column; gap: 8px; }
.check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #e5e7eb; }
.check input { width: 14px; height: 14px; }
.card-disclosure summary { 
  list-style: none; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  gap: 8px;
}
.card-disclosure summary::-webkit-details-marker { display: none; }
.card-disclosure .title-left { display: inline-flex; align-items: center; gap: 10px; }
.chev { transition: transform .15s ease; }
.card-disclosure[open] .chev { transform: rotate(180deg); }
.card-disclosure .stack { padding-top: 8px; }

.field {
  width: 100%;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #333;
  background: #111;
  color: #eee;
  font-size: 16px;

  /* AJOUT pour uniformiser la hauteur */
  min-height: 36px;  /* tu peux tester 38px ou 40px si tu veux plus aéré */
  line-height: 1.4;
}
        `}</style>
      </body>
    </html>
  );
}
