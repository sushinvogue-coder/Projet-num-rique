"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
const supabase = getSupabaseBrowser();

const LANGS = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "Anglais", flag: "🇬🇧" },
  { code: "es", label: "Espagnol", flag: "🇪🇸" },
  { code: "de", label: "Allemand", flag: "🇩🇪" },
  { code: "it", label: "Italien", flag: "🇮🇹" },
  { code: "pt", label: "Portugais", flag: "🇵🇹" },
  { code: "id", label: "Indonésien", flag: "🇮🇩" },
  { code: "tr", label: "Turc", flag: "🇹🇷" },
  { code: "el", label: "Grec", flag: "🇬🇷" },
];

export default function LanguageSwitch() {
  const [value, setValue] = useState("fr");

  useEffect(() => {
    setValue(localStorage.getItem("locale") || "fr");
  }, []);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
  const v = e.target.value;
  setValue(v);
  localStorage.setItem("locale", v);
  window.dispatchEvent(new Event("locale-change"));

    // Optionnel : persister aussi dans le profil Supabase si connecté
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (uid) {
        await supabase.from("profiles").update({ language: v }).eq("id", uid);
      }
    } catch {/* noop */}
  }

  return (
    <label className="topchip">
      <span className="topchip__label">Langue</span>
      <select className="topchip__select" value={value} onChange={onChange}>
  {LANGS.map(l => (
    <option key={l.code} value={l.code}>
      {l.flag} {l.label}
    </option>
  ))}
</select>


      <style jsx>{`
        .topchip{
          display:inline-flex; align-items:center; gap:8px;
          padding:6px 10px; border-radius:999px;
          border:1px solid var(--chip-bd,#dfe5f2);
          background:var(--chip-bg,#e9edf6);
          font-size:14px;
        }
        .topchip__label{ font-weight:600; }
        .topchip__select{
          appearance:auto; border:1px solid var(--chip-bd,#dfe5f2);
          background:#fff; border-radius:8px; padding:4px 8px; outline:none;
          color:inherit;
        }
        :global(html.dark) .topchip{
          border-color:#273148; background:#193049;
        }
        :global(html.dark) .topchip__select{
          background:#0b1220; border-color:#273148; color:var(--text,#e5e7eb);
        }
      `}</style>
    </label>
  );
}
