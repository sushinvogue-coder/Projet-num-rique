"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
const TZ_OPTIONS = [
  { v: "Europe/Paris",      label: "Europe/Paris (UTC+1/+2)" },
  { v: "UTC",               label: "UTC" },
  { v: "Europe/London",     label: "Europe/London (UTC+0/+1)" },
  { v: "America/New_York",  label: "America/New_York (UTC-5/-4)" },
  { v: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8/-7)" },
  { v: "Europe/Berlin",     label: "Europe/Berlin (UTC+1/+2)" },
  { v: "Europe/Madrid",     label: "Europe/Madrid (UTC+1/+2)" },
  { v: "Europe/Rome",       label: "Europe/Rome (UTC+1/+2)" },
  { v: "Europe/Lisbon",     label: "Europe/Lisbon (UTC+0/+1)" },
  { v: "Africa/Casablanca", label: "Africa/Casablanca (UTC+0/+1)" },
  { v: "Asia/Tokyo",        label: "Asia/Tokyo (UTC+9)" },
  { v: "Asia/Shanghai",     label: "Asia/Shanghai (UTC+8)" },
  { v: "Asia/Istanbul",     label: "Europe/Istanbul (UTC+3)" },
  { v: "Indian/Reunion",    label: "Indian/Reunion (UTC+4)" },
];

function useTimezoneSetting() {
  const [tz, setTz] = useState<string>(() => {
    if (typeof window === "undefined") return "Europe/Paris";
    return localStorage.getItem("site.tz") || "Europe/Paris";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("site.tz", tz);
    // avertit le reste de l’app (mieux que l’event 'storage' qui ne se déclenche pas dans l’onglet courant)
    window.dispatchEvent(new CustomEvent("tz-change", { detail: tz }));
  }, [tz]);

  return { tz, setTz };
}
import LanguageSwitch from "./LanguageSwitch"; // ← ajouté

type Org = { id: string; name: string };

export default function Navbar() {
  const { tz, setTz } = useTimezoneSetting();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const currentTheme = mounted ? (theme ?? resolvedTheme ?? "dark") : "dark";

  // ---------- Orgs (persistées localStorage) ----------
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("org.list");
      let list: Org[] =
        raw ? JSON.parse(raw) : [
          { id: "plomberie", name: "Entreprise Plomberie" },
          { id: "restauration", name: "Restaurant Le Gourmet" },
        ];
      if (!raw) localStorage.setItem("org.list", JSON.stringify(list));
      setOrgs(list);

      const cur = localStorage.getItem("org.current") || list[0]?.id || "";
      setOrgId(cur);
      if (!localStorage.getItem("org.current") && cur) {
        localStorage.setItem("org.current", cur);
      }
    } catch {}
  }, []);

  const changeOrg = (id: string) => {
    setOrgId(id);
    try { localStorage.setItem("org.current", id); } catch {}
    window.dispatchEvent(new Event("org-change"));
  };

  const links = [
    { href: "/", label: "Accueil" },
    { href: "/posts", label: "Mes posts" },
    { href: "/planning", label: "Planning des posts" }, // colonne plus large
    { href: "/mes-outils", label: "Mes outils" }, // ← ajouté
    { href: "/profile", label: "Profil" },
    { href: "/forfaits", label: "Boutique" },
  ];

  return (
    <header className="navRoot">
      <nav className="bar">
        {/* Liens centrés */}
        <ul className="links">
          {links.map(({ href, label }, i) => {
            const active = pathname === href;
            return (
              <li key={href} className={`cell ${i === 0 ? "first" : ""}`}>
                <Link href={href} className={`link ${active ? "active" : ""}`}>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Panneaux à droite */}
        <div className="right">
          <div className="panel">
            <span className="lab">Basculer</span>
            <select
              className="sel"
              value={orgId}
              onChange={(e) => changeOrg(e.target.value)}
              aria-label="Basculer de compte"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div className="panel">
            <span className="lab">Thème</span>
            <select
              aria-label="Choisir le thème"
              value={currentTheme}
              onChange={(e) => setTheme(e.target.value)}
              className="sel"
            >
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </select>
          </div>

<div className="panel">
  <span className="lab">Fuseau horaire</span>
  <select
    className="sel"
    value={tz}
    onChange={(e) => setTz(e.target.value)}
    aria-label="Sélection du fuseau horaire"
  >
    {TZ_OPTIONS.map((o) => (
      <option key={o.v} value={o.v}>{o.label}</option>
    ))}
  </select>
</div>

          <LanguageSwitch /> {/* ← ajouté */}
        </div>
      </nav>

      <style jsx>{`
        .navRoot {
          position: sticky; top: 0; z-index: 40;
          border-bottom: 1px solid var(--border, #cbd5e1);
          backdrop-filter: blur(6px);
          background: #eef2f7;
          box-shadow: 0 1px 0 rgba(2,6,23,0.10);
        }
        :global(html.dark) .navRoot {
          background: rgba(18,24,38,0.9);
          border-bottom-color: #273148;
          box-shadow: none;
        }

        .bar {
          max-width: 1200px; margin: 0 auto; padding: 10px 16px;
          display: grid; align-items: center; column-gap: 16px;
          grid-template-columns: 1fr minmax(720px, 1fr) auto; /* colonne centrale plus large */
          white-space: nowrap;
        }

        .links {
          grid-column: 2;
          display: grid;
          grid-template-columns: 1.5fr 1.5fr 2.5fr 1.5fr 1.5fr 2fr; /* ← ajouté "Mes outils" */
          align-items: stretch; justify-items: center;
          list-style: none; margin: 0; padding: 0;
          column-gap: 12px;
          --sep: #cbd5e1;
        }
        :global(html.dark) .links { --sep: #3a4a6a; }

        .cell {
          position: relative; display: flex; justify-content: center; align-items: center; width: 100%;
        }
        .cell:not(.first)::before {
          content: "";
          position: absolute;
          left: -6px;
          top: 50%; transform: translateY(-50%);
          width: 1px; height: 18px; background: var(--sep);
        }

        .link {
          display: inline-flex; justify-content: center; align-items: center;
          width: 100%;
          padding: 10px 16px;
          border-radius: 12px;
          color: var(--text);
          transition: background .2s ease, color .2s ease;
          white-space: nowrap;
        }
        .link:hover { background: rgba(0,0,0,0.06); }
        :global(html.dark) .link:hover { background: #1b2233; }
        .active { font-weight: 700; background: rgba(0,0,0,0.06); }
        :global(html.dark) .active { background: #1b2233; }

        .right { grid-column: 3; justify-self: end; display: inline-flex; gap: 10px; }
        .panel {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 8px 10px; border: 1px solid #cbd5e1;
          border-radius: 12px; background: #e7ecf4;
          box-shadow: inset 0 1px 0 rgba(0,0,0,0.03);
        }
        :global(html.dark) .panel {
          background: #0f1624; border-color: #273148;
          box-shadow: 0 0 0 1px rgba(39,49,72,0.35);
        }
        .lab { font-size: 12px; opacity: .9; }
        .sel { padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 10px; background: #ffffff; color: #0f172a; outline: none; }
        :global(html.dark) .sel option { color: #0f172a; background: #ffffff; }

        /* Zéro soulignement dans la navbar */
        .navRoot a, .navRoot a:link, .navRoot a:visited,
        .navRoot a:hover, .navRoot a:focus, .navRoot a:active {
          text-decoration: none !important;
          -webkit-text-decoration: none !important;
          border-bottom: 0 !important;
          text-decoration-color: transparent !important;
        }
      `}</style>
    </header>
  );
}
