// app/create-post/page.tsx
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Facebook, Instagram, Linkedin, Youtube, Tv2,
  Hash, Wand2, Mic, Home, Search, Plus, User, Languages, Image as ImageIcon, Video, Type, Link as LinkIcon, FileText, Replace, RefreshCcw,
  Send, Save, CalendarClock, Calendar, Clock, Upload, MessageSquare, MessageSquareOff, CheckCircle2, AlertTriangle, Eye, EyeOff,
  ThumbsUp, ThumbsDown, CornerUpRight, MessageCircle, MessageCircleMore, Share2, Scissors, Share, MoreHorizontal, Heart, Bookmark, Repeat2, VolumeX, Volume2
} from "lucide-react";
import { RiThumbUpLine, RiChat3Line, RiRepeat2Line, RiShareForwardLine, RiShareForwardFill, RiSendPlaneLine } from "react-icons/ri";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube, FaTiktok } from "react-icons/fa";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { CheckCircle, XCircle } from "lucide-react";

// ---- Types média (définition unique, portée module) ----
type MediaKind = "image" | "video" | "doc" | "other";

type MediaMeta = {
  kind: MediaKind;
  width?: number;
  height?: number;
  durationSec?: number; // durée vidéo en secondes
  sizeMB?: number;      // taille en Mo
  name?: string;        // nom de fichier
  bytes?: number;       // laissé optionnel (compat)
  mime?: string;
};

/** =====================================================
 *  Page "Créer un post" — version desktop (non responsive)
 *  - Ajout en-tête: "CREER UN POST" (violet) + "Rédiger, valider et publier efficacement" (blanc)
 *  - Mise en forme violette + fond sombre (dégradé + image)
 *  - Disposition 3 colonnes fixes (gauche = règles, centre = rédaction/médias/actions, droite = IA)
 *  - Tableau informatif des règles par réseau (icônes + pastilles)
 *  - Sélecteurs des réseaux, champ de saisie du post, ajout médias + prévisualisation
 *  - Bouton activer/désactiver commentaires, programmation (date/heure), boutons Publier/Brouillon/Programmer
 *  - Panneau IA avec boutons (générer texte, hashtags, reformuler, traduire, générer image/vidéo, micro vocal)
 *  =====================================================
 */
// ...vos imports

type NetworkKey = "x" | "instagram" | "facebook" | "linkedin" | "youtube" | "tiktok";

const NETWORKS: Record<NetworkKey, { label: string; icon: ReactNode; max: number; }> = {
  x:         { label: "X (Twitter)", icon: <FaTwitter size={16} color="currentColor" />,  max: 280 },
  instagram: { label: "Instagram",   icon: <Instagram size={16} />, max: 2200 },
  facebook:  { label: "Facebook",    icon: <Facebook size={16} />,  max: 63206 },
  linkedin:  { label: "LinkedIn",    icon: <Linkedin size={16} />,  max: 3000 },
  youtube:   { label: "YouTube",     icon: <Youtube size={16} />,   max: 5000 },
  tiktok:    { label: "TikTok",      icon: <Tv2 size={16} />,       max: 2200 },
};

const LIMITS: Record<NetworkKey, {
  imageMaxCount?: number;
  imageMaxSizeMB?: number;
  imageRecommended?: { w: number; h: number };
  videoMaxDurationSec?: number;
  videoMaxSizeMB?: number;
  docMaxSizeMB?: number;
}> = {
  x:         { imageMaxCount: 4,             videoMaxDurationSec: 140,  videoMaxSizeMB: 512 },
  instagram: { imageMaxCount: 10,            videoMaxDurationSec: 600 },
  facebook:  { imageMaxCount: 10, imageMaxSizeMB: 10,    videoMaxDurationSec: 14400 },
  linkedin:  { imageMaxCount: 9,  imageMaxSizeMB: 5,     videoMaxDurationSec: 600,   videoMaxSizeMB: 5120, docMaxSizeMB: 100 },
  youtube:   {                             videoMaxDurationSec: 43200, videoMaxSizeMB: 262144 }, // 12h, 256 Go
  tiktok:    { imageMaxCount: 35, imageRecommended: { w:1080, h:1920 }, videoMaxDurationSec: 600, videoMaxSizeMB: 4096 },
};

type Draft = {
  text: string;
  media: File[];
  allowComments: boolean;
  scheduledAt?: string | null;
  enabled: Record<NetworkKey, boolean>;
};

function renderNetIconForKey(k: NetworkKey, size = 22) {
  const col = "#FFFFFF";
  if (k === "x")         return <FaTwitter size={size} color={col} />;
  if (k === "instagram") return <FaInstagram size={size} color={col} />;
  if (k === "facebook")  return <FaFacebookF size={size} color={col} />;
  if (k === "linkedin")  return <FaLinkedinIn size={size} color={col} />;
  if (k === "youtube")   return <FaYoutube size={size} color={col} />;
  if (k === "tiktok")    return <FaTiktok size={size} color={col} />;
  return null;
}

function badgeStyleForKey(k: NetworkKey): React.CSSProperties {
  if (k === "x")         return { background: "#000000", border: "1px solid #FFFFFF" };
  if (k === "instagram") return { background: "linear-gradient(135deg, #E1306C, #F56040)" };
  if (k === "facebook")  return { background: "#1877F2" };
  if (k === "linkedin")  return { background: "linear-gradient(135deg, #0A66C2, #000000)" };
  if (k === "youtube")   return { background: "#FF0000" };
  if (k === "tiktok")    return { background: "linear-gradient(135deg, #69C9D0, #EE1D52)" };
  return { background: "#2b2b2b", border: "1px solid rgba(255,255,255,.24)" };
}
/* --- AJOUT ICI : la fonction déplacée --- */
function isPlayableInBrowser(file: File): boolean {
  const t = (file.type || "").toLowerCase();
  const ext = (file.name || "").toLowerCase().split(".").pop() || "";
  const v = document.createElement("video");
  const byMime = !!t && v.canPlayType(t) !== "";
  const byExt = ["mp4","m4v","webm","ogg","ogv"].includes(ext);
  return byMime || byExt || t === "video/mp4" || t === "video/webm" || t === "video/ogg";
}
export default function CreatePostPageDesktop() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [draft, setDraft] = useState<Draft>({
    text: "",
    media: [],
    allowComments: true,
    scheduledAt: null,
    enabled: { x: false, instagram: false, facebook: false, linkedin: false, youtube: false, tiktok: false },
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState("");
const [ytMuted, setYtMuted] = useState(true);
  function addTag() {
    const val = tagInput.trim();
    if (!val) return;
    if (tags.includes(val)) {
      setTagError("Ce tag est déjà présent.");
      return;
    }
    setTagError("");
    const next = [...tags, val].sort((a, b) => a.localeCompare(b));
    setTags(next);
    setTagInput("");
  }

  function removeTag(idx: number) {
    setTags((prev) => prev.filter((_, i) => i !== idx));
  }

// Previews for selected media
const [previews, setPreviews] = useState<string[]>([]);
useEffect(() => {
  const urls = draft.media.map((f) => URL.createObjectURL(f));
  setPreviews(urls);
  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}, [draft.media]);

const [mediaMeta, setMediaMeta] = useState<MediaMeta[]>([]);
const [virtualFormats, setVirtualFormats] = useState<
  { url: string; type: string; ratio: string }[]
>([]);

useEffect(() => {
  let cancelled = false;
  async function loadMeta() {
    const out: MediaMeta[] = await Promise.all(
      draft.media.map(async (f) => {
        const base = {
          sizeMB: (f.size || 0) / (1024 * 1024),
          name: f.name || "",
        };
        if (isDocFile(f)) return { ...base, kind: "doc" } as MediaMeta;
        if (f.type?.startsWith("image/")) {
          const url = URL.createObjectURL(f);
          const dim = await new Promise<{ w: number; h: number }>((res) => {
            const img = new Image();
            img.onload = () => {
              res({ w: img.naturalWidth || 0, h: img.naturalHeight || 0 });
              URL.revokeObjectURL(url);
            };
            img.src = url;
          });
          return { ...base, kind: "image", width: dim.w, height: dim.h } as MediaMeta;
        }
        if (f.type?.startsWith("video/")) {
          const url = URL.createObjectURL(f);
          const meta = await new Promise<{ w: number; h: number; d: number }>((res) => {
            const v = document.createElement("video");
            v.preload = "metadata";
            v.onloadedmetadata = () => {
              res({ w: v.videoWidth || 0, h: v.videoHeight || 0, d: v.duration || 0 });
              URL.revokeObjectURL(url);
            };
            v.src = url;
          });
          return { ...base, kind: "video", width: meta.w, height: meta.h, durationSec: meta.d } as MediaMeta;
        }
        return { ...base, kind: "other" } as MediaMeta;
      })
    );
    if (!cancelled) setMediaMeta(out);
  }
  loadMeta();
  return () => {
    cancelled = true;
  };
}, [draft.media]);

// Toggle global des miniatures (œil maître)
const [showThumbs, setShowThumbs] = useState(false);
// — Pas d'heures/minutes pour la programmation
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINS_15 = ["00", "15", "30", "45"];

// — États de programmation
const [progDate, setProgDate] = useState<string>("");
const [progHour, setProgHour] = useState<string>("");
const [progMin, setProgMin] = useState<string>("");
const [progTime, setProgTime] = useState<string>(""); // ← manquant, nécessaire pour les useEffect

// Si l'utilisateur remplit les 2, on alimente draft.scheduledAt (format local "YYYY-MM-DDTHH:MM")
// Recalcule HH:MM dès que l'une des deux parties change
useEffect(() => {
  const t = (progHour && progMin) ? `${progHour}:${progMin}` : "";
  setProgTime(t);
}, [progHour, progMin]);

// Alimente scheduledAt si on a date + heure complète
useEffect(() => {
  setDraft(d => ({
    ...d,
    scheduledAt: (progDate && progTime) ? `${progDate}T${progTime}` : ""
  }));
}, [progDate, progTime]);

// Init depuis un scheduledAt déjà présent (au montage)
useEffect(() => {
  if (draft.scheduledAt) {
    const [d, t] = draft.scheduledAt.split("T");
    if (d) setProgDate(d);
    if (t) {
      const [h, m] = t.slice(0,5).split(":");
      if (h) setProgHour(h);
      if (m) setProgMin(m);
      setProgTime(`${h}:${m}`);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const charCounts = useMemo(() => {
    const base = draft.text.length;
    const per: Partial<Record<NetworkKey, number>> = {};
    (Object.keys(NETWORKS) as NetworkKey[]).forEach((k) => {
      if (!draft.enabled[k]) return;
      per[k] = base;
    });
    return { base, per };
  }, [draft.text, draft.enabled]);

  function chooseFiles(files: FileList | null) {
    if (!files) return;
    setDraft((d) => ({ ...d, media: [...d.media, ...Array.from(files)] }));
  }
  function removeMedia(idx: number) {
    setDraft((d) => {
      const next = [...d.media];
      next.splice(idx, 1);
      return { ...d, media: next };
    });
  }

  function toggleNet(k: NetworkKey) {
    setDraft((d) => ({ ...d, enabled: { ...d.enabled, [k]: !d.enabled[k] } }));
  }

// --- AJOUT : écriture minimale dans la table `posts`
async function persistPost(
  kind: "draft" | "schedule" | "publish",
  draft: Draft
) {
  const ws =
    typeof window !== "undefined"
      ? localStorage.getItem("currentWorkspaceId") ||
        localStorage.getItem("workspace_id")
      : null;

  const now = new Date().toISOString();
  const row: any = {
    workspace_id: ws,
    body: draft?.text || "",
    status:
      kind === "publish" ? "published" : kind === "schedule" ? "scheduled" : "draft",
    created_at: now,
  };

  if (kind === "publish") row.published_at = now;
if (kind === "schedule") {
  const when = draft?.scheduledAt ? new Date(draft.scheduledAt).toISOString() : now;
  row.scheduled_at = when;
}
  const channels = (Object.keys(draft.enabled) as NetworkKey[]).filter(k => draft.enabled[k]);
  row.channels = channels;
  row.allow_comments = draft.allowComments;
  await supabase.from("posts").insert(row);
}

async function submit(kind: "publish" | "draft" | "schedule") {
  // Réseaux cochés
  const selected = (Object.keys(NETWORKS) as NetworkKey[]).filter(k => draft.enabled[k]);

  // Cas "brouillon" : succès direct + PERSISTENCE
  if (kind === "draft") {
    // --- AJOUT : on enregistre le brouillon dans Supabase
    await persistPost("draft", draft);

    setPubModal({
      open: true,
      kind,
      success: true,
      failing: [],
      ok: [],
    });
    return;
  }

  // Contrôle par réseau (logique existante)
  const flags = inferAllFlags(draft);
  const failing: { key: NetworkKey; messages: string[] }[] = [];
  const ok: NetworkKey[] = [];

  selected.forEach((k) => {
    const res = evaluateNetworkStatusDetailed(k, flags, mediaMeta);
    if (res.messages.length) {
      failing.push({ key: k, messages: res.messages });
    } else {
      ok.push(k);
    }
  });

  // --- AJOUT : si succès total pour schedule/publish, on persiste
  if (failing.length === 0) {
    await persistPost(kind, draft);
  }

  // Ouvre le modal dans tous les cas (succès complet vs échecs partiels)
  setPubModal({
    open: true,
    kind,
    success: failing.length === 0,
    failing,
    ok,
  });
}

const [primaryIdx, setPrimaryIdx] = useState<number>(-1);
// --- Aperçu avant publication ---
const [activePreview, setActivePreview] = useState<NetworkKey>("facebook");
const [pubModal, setPubModal] = useState<{
  open: boolean;
  kind: "publish" | "schedule" | "draft" | null;
  success: boolean; // tout OK
  failing: { key: NetworkKey; messages: string[] }[]; // réseaux en échec
  ok: NetworkKey[]; // réseaux OK
}>({
  open: false,
  kind: null,
  success: false,
  failing: [],
  ok: [],
});


const [fixModal, setFixModal] = useState<{
  open: boolean;
  auto: string[];
  manual: { key: NetworkKey; messages: string[] }[];
}>({ open: false, auto: [], manual: [] });
function firstEnabledNetwork(): NetworkKey {
  const order: NetworkKey[] = ["facebook","instagram","linkedin","x","youtube","tiktok"];
  const f = order.find(k => draft.enabled[k]);
  return f ?? "facebook";
}

// Si l’onglet actif n’est plus sélectionné en réseau, basculer vers le premier réseau actif
useEffect(() => {
  // Ne force le changement que si le réseau actif a été désactivé manuellement
  if (!draft.enabled[activePreview] && activePreview !== "youtube" && activePreview !== "tiktok") {
    setActivePreview(firstEnabledNetwork());
  }
}, [draft.enabled]);

function moveMediaUp(i: number) {
  if (i <= 0) return;
  setDraft(d => {
    const next = [...d.media];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    return { ...d, media: next };
  });
  if (primaryIdx === i) setPrimaryIdx(i - 1);
  else if (primaryIdx === i - 1) setPrimaryIdx(i);
}
function moveMediaDown(i: number) {
  setDraft(d => {
    if (i >= d.media.length - 1) return d;
    const next = [...d.media];
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    const newPrimary =
      primaryIdx === i ? i + 1 : primaryIdx === i + 1 ? i : primaryIdx;
    return { ...d, media: next };
  });
}
function setPrimary(i: number) {
  setPrimaryIdx(i);
}
function formatShort(k: NetworkKey, msg: string): string {
  const s = msg.toLowerCase();
  // 🔹 Spécifique YouTube et contenus non supportés
  if (k === "youtube" && s.includes("nécessite une vidéo")) return "Vidéo requise";
  if (k === "youtube" && s.includes("image non supportée")) return "Image non supportée";
  if (k === "youtube" && s.includes("documents non supportés")) return "Doc non supporté";

  const mbMatch  = msg.match(/>\s*([\d]+)\s*mo/i);
  const dimMatch = msg.match(/(\d+)[×x](\d+)\s*px/i);
  const minMatch = msg.match(/limite\s+(\d+)\s+min/i);
  const carMatch = msg.match(/\/(\d+)\s*car/i);

  const mb     = mbMatch  ? mbMatch[1] : null;
  const dim    = dimMatch ? dimMatch[0] : null;
  const limMin = minMatch ? minMatch[1] : null;
  const limCar = carMatch ? carMatch[1] : null;

  if (s.includes("image") && s.includes("trop lourde"))           return "Image trop lourde — ≤ " + (mb || "N") + " Mo";
  if (s.includes("dimensions recommandées"))                      return ("Image trop grande — " + (dim || "")).trim();
  if (s.includes("vidéo trop longue"))                            return "Vidéo trop longue — ≤ " + (limMin || "N") + " min";
  if (s.includes("vidéo") && s.includes("trop lourde"))           return "Vidéo trop lourde — ≤ " + (mb || "N") + " Mo";
  if (s.includes("document") && s.includes("trop lourd"))         return "Doc trop lourd — ≤ " + (mb || "N") + " Mo";
  if (s.includes("documents non supportés"))                      return "Doc. non supporté";
  if (s.includes("lien non cliquable"))                           return "Lien non cliquable sauf en bio";
  if (s.includes("désactivation des commentaires non supportée")) return "Com. off non supporté";
  if (s.includes("commentaires off non support"))                 return "Com. off non supporté";
  if (s.includes("texte") && s.includes("limite dépassée"))       return "Texte trop long — ≤ " + (limCar || "N") + " car.";
  if (s.includes("youtube") && s.includes("nécessite une vidéo")) return "Vidéo requise";

  return msg.replace(/[\.。]\s*$/, "");
}
function cleanNetworkPrefix(text: string) {
  // Liste de labels présents dans NETWORKS + alias fréquents
  const labels = [
    ...Object.values(NETWORKS).map(n => n.label), // ex. "Instagram", "YouTube", "XTwitter", ...
    // alias/variantes utiles
    "twitter","xtwitter","x-twitter","x twitter","x", 
    "youtube","you tube",
    "tiktok","tik tok",
    "instagram","insta",
    "linkedin","linkdin","linke d in"
  ];

  // échappe pour regex
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // variantes compactes pour chaque label (sans espace, tiret, underscore)
  const variants = labels.flatMap(l => {
    const base = l.trim();
    const compact = base.replace(/\s+/g, "");
    return [base, compact, compact.replace(/twitter/i,"twitter")];
  });

  // Regex qui enlève au début : éventuel point, label (ou alias),
  // éventuelle numérotation "2" ou "2.1", puis : / - / — / espace
  const re = new RegExp(
    String.raw`^\s*\.?\s*(?:${variants.map(esc).join("|")})\s*(?:\d+(?:\.\d+)*)?\s*[:\-\u2013\u2014]?\s*`,
    "i"
  );

  return text.replace(re, "").trim();
}

async function fixAll() {
  const d = draft;

  // Choix du ratio d'aperçu visuel en fonction des réseaux sélectionnés (priorité simple)
  const pickRatio = (): string => {
    if (d.enabled?.tiktok)    return "9/16";
    if (d.enabled?.instagram) return "1/1";
    if (d.enabled?.linkedin)  return "1.91/1";
    if (d.enabled?.facebook)  return "1.91/1";
    if (d.enabled?.youtube)   return "16/9";
    if (d.enabled?.x)         return "16/9";
    return "16/9";
  };

  const ratio = pickRatio();

  // IMPORTANT: Non destructif — on n'altère PAS d.media (pas de redimensionnement réel)
  const previewFormats = (d.media || []).map((f: File) => ({
    url: URL.createObjectURL(f),
    type: (f as any).type || "",
    ratio,
  }));

  // Reset/recalc virtuel pour la prévisualisation
  setMediaMeta([]);            // force recalcul des metas au besoin (inchangé ailleurs)
  setVirtualFormats(previewFormats);
  // ⬇️ Conversion réelle uniquement si le navigateur ne peut pas lire le format
  const converted = await Promise.all(
    (d.media || []).map(async (f) => {
      if (f.type?.startsWith("video/") && !isPlayableInBrowser(f)) {
        try {
          const out = await convertToMp4WebReady(f); // nécessite /api/convert côté serveur
          return out;
        } catch {
          return f; // en cas d’échec, on laisse le fichier d’origine
        }
      }
      return f;
    })
  );
  // Remplace les médias par les versions converties si besoin
  setDraft(prev => ({ ...prev, media: converted }));

  // Petits messages "auto" uniquement indicatifs
  const auto: string[] = [];
  const imgCount = (d.media || []).filter((f: File) => (((f as any).type || "").startsWith("image/"))).length;
  const vidCount = (d.media || []).filter((f: File) => (((f as any).type || "").startsWith("video/"))).length;
  if (imgCount) auto.push(`Images adaptées visuellement : ${imgCount}`);
  if (vidCount) auto.push(`Vidéos adaptées visuellement : ${vidCount}`);

  // Évaluation des problèmes par réseau (sur le draft original, sans toucher aux fichiers)
  const selected = (Object.keys(NETWORKS) as NetworkKey[]).filter(k => d.enabled?.[k]);
  const flags2 = inferAllFlags(d);
  const failing2: { key: NetworkKey; messages: string[] }[] = [];
  selected.forEach((k) => {
    const res2 = evaluateNetworkStatusDetailed(k, flags2, mediaMeta);
    if (res2.messages.length) {
      const clean = res2.messages.map(m => formatShort(k, cleanNetworkPrefix(m)));
      failing2.push({ key: k, messages: clean });
    }
  });

  setFixModal({ open: true, auto, manual: failing2 });
}
// ——— Conversion vidéo automatique vers MP4 web-ready ———
async function convertToMp4WebReady(file: File): Promise<File> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/convert", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Conversion failed");
  const blob = await res.blob();
  const name = file.name.replace(/\.[^.]+$/, "") + "_converted.mp4";
  return new File([blob], name, { type: "video/mp4" });
}

  return (
    <section className="create">
      {/* ===== Page header ===== */}
      <header className="pageHeader">
        <h1 className="h1">
          <span className="titlePlate">
            <span className="title">CREER UN POST</span>
            <span className="subtitle">: Rédiger, valider et publier efficacement</span>
          </span>
        </h1>
      </header>

      <div className="wrap">
        {/* Colonne gauche : Règles réseaux */}
        <aside className="left">
          <div className="panel rulesPanel">
            <h3 className="panelTitle">Règles par réseau</h3>

            {/* Tableau informatif */}
            <div className="tableWrap">
              <table className="rules">
                <colgroup>
                  <col className="col-net" />
                  <col className="col-cap" />
                  <col className="col-cap" />
                  <col className="col-cap" />
                  <col className="col-cap" />
                  <col className="col-cap" />
                  <col className="col-cap" />
                </colgroup>
<thead>
  <tr>
    <th colSpan={7}>
      <div className="rulesHeaderRow">
        <span className="label">Réseaux</span>
        <span title="Texte"><Type className="icon" size={30} /></span>
        <span title="Image"><ImageIcon className="icon" size={30} /></span>
        <span title="Vidéo"><Video className="icon" size={30} /></span>
        <span title="Lien"><LinkIcon className="icon" size={30} /></span>
        <span title="Document"><FileText className="icon" size={30} /></span>
        <span title="Commentaires désactivables"><MessageSquareOff className="icon" size={30} /></span>
      </div>
    </th>
  </tr>
</thead>


                <tbody>
                  {renderRow("x",         { text: "good", image: "good", video: "good", link: "good", doc: "bad", comments:"bad" })}
                  {renderRow("instagram", { text: "good", image: "good", video: "good", link: "warn", doc: "bad", comments:"good" })}
                  {renderRow("facebook",  { text: "good", image: "good", video: "good", link: "good", doc: "warn", comments:"warn" })}
                  {renderRow("linkedin",  { text: "good", image: "good", video: "good", link: "good", doc: "good", comments:"good" })}
                  {renderRow("youtube",   { text: "good", image: "bad", video: "good", link: "good", doc: "bad", comments:"good" })}
                  {renderRow("tiktok",    { text: "good", image: "good", video: "good", link: "warn", doc: "bad", comments:"good" })}
                </tbody>
              </table>
              <div className="legend">
                <span><i className="dot good" /> Autorisé</span>
                <span><span className="dot bad" /> Non supporté</span>
		<span><span className="dot warn" /> Particularité</span>
              </div>

</div>
            
          </div>

<div className="panel">
  <div className="panelHead">
    <h3 className="panelTitle">État avant publication</h3>
<button
  type="button"
  className="btn small"
  onClick={fixAll}
>
  Corriger tout
</button>
  </div>
  <ul className="statusList twoCols">
  {!Object.values(draft.enabled).some(Boolean) && (
    <li className="warn">Aucun réseau sélectionné</li>
  )}
  {!draft.text && <li className="warn">Texte manquant</li>}
  {!draft.media.length && <li className="warn">Aucun média choisi</li>}
  {!draft.scheduledAt && <li className="warn">Programmation non définie</li>}
</ul>

<ul className="statusList">
  {(Object.keys(NETWORKS) as NetworkKey[])
    .filter(k => draft.enabled[k])
    .map((k) => {
      const flags = inferAllFlags(draft);
      const res = evaluateNetworkStatusDetailed(k, flags, mediaMeta);
      const cls = res.level === "ok" ? "ok" : res.level === "warn" ? "warn" : "block";
const withShort = res.messages.map((m) => formatShort(k, cleanNetworkPrefix(m)));
const text = withShort.length ? withShort.join(" • ") : "OK";
      return (
        <li key={k} className={cls}>
          <strong>{NETWORKS[k].label} :</strong>&nbsp;{text}
        </li>
      );
    })}
</ul>

</div>
</aside>
        {/* Colonne centre : Rédaction, Médias, Options, Actions */}
        <main className="center">
{/* Panel 1 — Réseaux ciblés (séparé) */}
<div className="panel">
  <h3 className="panelTitle">Réseaux ciblés</h3>
  <div className="netsGrid">
    {(Object.keys(NETWORKS) as NetworkKey[]).map((k) => {
      const flags  = inferAllFlags(draft);
      const status = evaluateNetworkStatus(k, flags);
      const showAlert = status.level !== "ok";
      const reason = status.message;

      return (
        <div
          key={k}
          className={`netBadge ${draft.enabled[k] ? "on" : "off"}`}
          title={reason}
        >
          <span className="badgeIcon" style={badgeStyleForKey(k)}>
            {renderNetIconForKey(k)}
          </span>
          <span className="badgeTxt">{NETWORKS[k].label}</span>

          <input
            type="checkbox"
            checked={draft.enabled[k]}
            onChange={() => toggleNet(k)}
            className="netCheckbox"
          />
        </div>
      );
    })}
  </div>
</div>

{/* Panel 2 — Rédaction du post (séparé) */}
<div className="panel">
  <h3 className="panelTitle">Rédaction du post</h3>

  <textarea
    className="input textarea"
    rows={10}
    placeholder="Écris ici ton post :"
    value={draft.text}
    onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
  />
  <div className="mini">
    Longueur : <strong>{charCounts.base}</strong> caractères
  </div>

  {/* Toggle commentaires */}
  <div className="commentToggleWrap" role="group" aria-label="Commentaires">
    <span
      className={`commentState ${draft.allowComments ? "on" : "off"}`}
      aria-live="polite"
    >
      {draft.allowComments ? "Commentaire activé" : "Commentaire désactivé"}
    </span>

    <button
      type="button"
      className={`commentSwitch ${draft.allowComments ? "on" : "off"}`}
      onClick={() => setDraft(d => ({ ...d, allowComments: !d.allowComments }))}
      aria-pressed={draft.allowComments}
      aria-label={draft.allowComments ? "Désactiver les commentaires" : "Activer les commentaires"}
    >
      <span className="switchTrack" />
      <span className="switchThumb" />
    </button>
  </div>
</div>


          <div className="panel">
<h3 className="panelTitle">Insertion de médias, Hashtags & Mentions</h3>

{/* Ligne de 3 boutons */}
<div className="btnRow">
  <button type="button" className="btn" onClick={() => alert("Bibliothèque : à brancher")}>
    Importer depuis la bibliothèque
  </button>

  {/* Import local — garde le handler existant */}
  <label className="btn btn-file" style={{ cursor: "pointer" }}>
    Importer depuis l'ordinateur
    <input type="file" multiple accept="image/*,video/*" hidden onChange={(e) => chooseFiles(e.target.files)} />
  </label>

  <button type="button" className="btn" onClick={() => alert("Hashtags & @mentions : à brancher")}>
    Choisir hashtags & mentions
  </button>
</div>

{/* Gestion compacte des médias sélectionnés */}
<div className="mini" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
  <span>Médias sélectionnés ({draft.media.length})</span>
  <button
    type="button"
    onClick={() => setShowThumbs(v => !v)}
    aria-pressed={showThumbs}
    aria-label={showThumbs ? "Masquer les miniatures" : "Afficher les miniatures"}
    title={showThumbs ? "Masquer les miniatures" : "Afficher les miniatures"}
    className="iconButton"
  >
    {showThumbs ? <Eye size={22} /> : <EyeOff size={22} />}
  </button>
</div>


<ul className="mediaList">
  {draft.media.map((f, i) => (
<li key={i} className={showThumbs ? "hasThumb" : undefined}>
  {showThumbs && previews[i] && (
    <span className="thumb" aria-hidden="true">
      {f.type?.startsWith("video/")
        ? <video src={previews[i]} muted playsInline />
        : <img src={previews[i]} alt="" />}
    </span>
  )}

  <span className="mName" title={f.name}>
    {f.name} {f.size ? `· ${(f.size/1024).toFixed(0)} Ko` : ""}
  </span>

  <span className="mActions">
    <button className="linkish" onClick={() => removeMedia(i)}>Retirer</button>
    <button className="linkish" onClick={() => moveMediaUp(i)}>Monter</button>
    <button className="linkish" onClick={() => moveMediaDown(i)}>Descendre</button>
    <button
      className="linkish"
      onClick={() => setPrimary(i)}
      aria-pressed={primaryIdx === i}
      title="Définir comme principal"
    >
      {primaryIdx === i ? "Principal ✓" : "Définir comme principal"}
    </button>
  </span>
</li>

  ))}
</ul>

<div className="mini"><i>A savoir : Le média défini comme “principal” sera le premier visible dans l’aperçu par défaut</i></div>

          </div>

<div className="panel">
  {/* Pastille SANS icône */}
  <h3 className="panelTitle">Programmation</h3>

  {/* Deux petites cartes blanches : Date + Heure, icônes à côté, puis bouton Programmer en fin de ligne */}
  <div className="inlineRow">
    <div className="inputGroup">
      <Calendar size={18} aria-hidden="true" />
      <input
        id="progDate"
        type="date"
        value={progDate}
        onChange={(e) => setProgDate(e.target.value)}
        className="input half"
        aria-label="Choisir la date"
      />
    </div>

<div className="inputGroup">
  <Clock size={18} aria-hidden="true" />
  <select
    id="progHour"
    value={progHour}
    onChange={(e) => setProgHour(e.target.value)}
    className="input third"
    aria-label="Choisir l’heure (HH)"
  >
    <option value="" disabled>— HH —</option>
    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
  </select>

  <select
    id="progMin"
    value={progMin}
    onChange={(e) => setProgMin(e.target.value)}
    className="input third"
    aria-label="Choisir les minutes (MM)"
  >
    <option value="" disabled>— MM —</option>
    {MINS_15.map(m => <option key={m} value={m}>{m}</option>)}
  </select>
</div>


    <button className="btn" onClick={() => submit("schedule")}>
      <CalendarClock size={16} /> Programmer
    </button>
  </div>

  <div className="btnRow" style={{ marginTop: 12 }}>
    <button className="btn" onClick={() => submit("draft")}><Save size={16} /> Créer un brouillon</button>
    <button className="btn" onClick={() => submit("publish")}><Send size={16} /> Publier maintenant</button>
  </div>
</div>

          {/* Contrôles rapides */}
          <div className="checks">
            {renderWarnings(charCounts)}
          </div>
        </main>

        {/* Colonne droite : Outils IA */}
        <aside className="right">
          <div className="panel">
            <h3 className="panelTitle">Outils IA</h3>
<div className="iaGrid iaGridRounds">
  <div className="iaItem">
    <button className="iaRound" onClick={() => alert("Générer un texte : à brancher")}>
      <FileText />
    </button>
    <span className="iaCap">Générer texte</span>
  </div>

  <div className="iaItem">
    <button className="iaRound" onClick={() => alert("Générer hashtags : à brancher")}>
      <Hash />
    </button>
    <span className="iaCap">Hashtags</span>
  </div>

  <div className="iaItem">
    <button className="iaRound" onClick={() => alert("Reformuler : à brancher")}>
      <RefreshCcw />
    </button>
    <span className="iaCap">Reformuler</span>
  </div>

  <div className="iaItem">
    <button className="iaRound" onClick={() => alert("Traduire : à brancher")}>
      <Languages />
    </button>
    <span className="iaCap">Traduire</span>
  </div>

  <div className="iaItem">
    <button className="iaRound" onClick={() => alert("Générer image : à brancher")}>
      <ImageIcon />
    </button>
    <span className="iaCap">Générer image</span>
  </div>

  <div className="iaItem">
    <button className="iaRound" onClick={() => alert("Générer vidéo : à brancher")}>
      <Video />
    </button>
    <span className="iaCap">Générer vidéo</span>
  </div>

  <div className="iaItem">
    <button className="iaRound" onClick={() => alert("Micro (dictée) : à brancher")}>
      <Mic />
    </button>
    <span className="iaCap">Dictée</span>
  </div>
</div>

<div className="mini iaHelp">
  Utilise les assistants IA pour t'aider dans tes rédactions.
</div>
</div>
<div className="panel">
  <h3 className="panelTitle">Aperçu avant publication</h3>

  {/* Onglets réseaux (n'affiche que les réseaux cochés) */}
<div className="tabs">
  {(["facebook","instagram","linkedin","x","youtube","tiktok"] as NetworkKey[]).map(k => (
    <button
      key={k}
      type="button"
      className={`tab ${activePreview === k ? "active" : ""} tab-${k}`}
      onClick={() => setActivePreview(k)}
      title={NETWORKS[k].label}
      aria-label={NETWORKS[k].label}
    >
      <span className="tabIcon">{renderNetIconForKey(k, 20)}</span>
    </button>
  ))}
</div>

  {/* Fenêtre de prévisualisation */}
<div className={`previewFrame ${activePreview}`}>
{renderPreviewMock(
  activePreview,
  { draft, previews, primaryIdx, ytMuted, toggleYtMuted: () => setYtMuted(m => !m), virtualFormats }
)}
</div>

</div>

        </aside>
      </div>
{/* ===== Modal de publication / programmation ===== */}
{pubModal.open && (
  <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Résultat de publication">
    <div className="modalCard">
      <div className="modalHeader">
        {pubModal.success ? "Publication réussie" :
          (pubModal.kind === "publish" ? "Certaines publications risquent l'échec" : "Certaines programmations ont échoué")}
      </div>

<div className="modalBody">
  {pubModal.success ? (
    <p>
      Votre {pubModal.kind === "publish" ? "publication" : pubModal.kind === "schedule" ? "programmation" : "brouillon"} a bien été effectuée.
    </p>
  ) : (
    <>
      {/* Bloc 1 — Réseaux non conformes */}
      <div className="modalSection">
        <h4 className="modalTitle bad">Réseaux non conformes :</h4>
        {pubModal.failing.length ? (
          <ul className="modalList">
{pubModal.failing.map(({ key, messages }) => (
  <li key={key} className="modalFailItem">
    <strong className="networkTitle">{NETWORKS[key].label}</strong>
    {messages.map((m, i) => (
      <div key={i} className="errLine">{cleanNetworkPrefix(m)}</div>
    ))}
  </li>
))}

          </ul>
        ) : (
          <p className="modalHint">Aucun.</p>
        )}
      </div>

      {/* Bloc 2 — Réseaux conformes */}
      {pubModal.ok.length > 0 && (
        <div className="modalSection">
          <h4 className="modalTitle ok">Réseaux conformes :</h4>
          <p className="modalGoodLine">
            {pubModal.ok.map(k => NETWORKS[k].label).join(", ")}
          </p>
        </div>
      )}
    </>
  )}
</div>


      <div className="modalActions">
        {/* Fermer */}
        <button className="btn" onClick={() => setPubModal(m => ({ ...m, open: false }))}>
          Fermer & modifier les paramètres
        </button>

        {!pubModal.success && (
          <>
            {/* Forcer = on valide quand même les réseaux problématiques (ils iront en ÉCHEC dans Planning côté back) */}
            <button
              className="btn"
              onClick={() => {
                // Ici tu pousseras la requête “forcer” côté back si besoin.
                // Front : on ferme et on peut afficher un toast si tu veux.
                setPubModal(m => ({ ...m, open: false }));
                alert("Forçage demandé : les réseaux en erreur seront marqués en échec dans Planning.");
              }}
            >
              Forcer quand même la publication
            </button>
          </>
        )}
      </div>
    </div>
  </div>
)}

      
{/* ===== Modal "Résultat des corrections" ===== */}
{fixModal.open && (
  <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Résultat des corrections">
    <div className="modalCard">
      <div className="modalHeader">Résultat des corrections</div>
      <div className="modalBody">
        <div className="modalSection">
          <h4 className="modalTitle ok">Corrections automatiques :</h4>
          {fixModal.auto.length ? (
            <ul className="modalList">
              {fixModal.auto.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          ) : (<p className="modalHint">Aucune correction automatique effectuée.</p>)}
        </div>
        <div className="modalSection">
          <h4 className="modalTitle bad">À corriger manuellement :</h4>
          {fixModal.manual.length ? (
            <ul className="modalList">
              {fixModal.manual.map(({ key, messages }) => (
                <li key={key} className="modalFailItem">
                  <strong className="networkTitle">{NETWORKS[key].label}</strong>
                  {messages.map((m, i) => (<div key={i} className="errLine">{m}</div>))}
                </li>
              ))}
            </ul>
          ) : (<p className="modalHint">Rien à corriger manuellement.</p>)}
        </div>
      </div>
      <div className="modalActions">
        <button className="btn" onClick={() => setFixModal(m => ({ ...m, open: false }))}>Fermer</button>
      </div>
    </div>
  </div>
)}
{/* ===== Styles (desktop only) ===== */}
      <style jsx>{`
.create {
  color-scheme: dark;
  background-image:
    linear-gradient(
      to bottom,
      rgba(0,0,0,0.20) 0%,
      rgba(0,0,0,0.35) 40%,
      rgba(0,0,0,0.65) 70%,
      #000 100%
    ),
    url("/background/violet.jpg");
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  background-size: cover, cover;
  background-attachment: fixed, fixed;
  background-color: #1C1C1C;
  color: #e6e8ec;
  min-height: 100vh;
  --accent: #7E22CE;
  --border: var(--accent);
}
/* laisser .create avec color-scheme: dark si tu veux le thème sombre global */
.netBadge input[type="checkbox"] { 
  color-scheme: light;  /* ✅ case blanche décochée, coche native conservée */
}

.pageHeader {
  text-align: center;
  padding: 16px 24px 8px;
}
.h1 {
  margin: 0;
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  justify-content: center;
}
.h1 .title {
  color: #7E22CE; /* violet accent */
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: .3px;

}
.h1 .subtitle {
  color: #ffffff;
  font-size: 2rem;
  font-weight: 700;
  opacity: .92;
}

/* Plaque blanche translucide sous tout l'intitulé */
.titlePlate{
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(0,0,0,.28);
  backdrop-filter: blur(2px);
}

/* Optionnel : resserrer l'écart externe du H1, la plaque gère déjà le “bloc” */
.h1{
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

:global(.btn), .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #2a0f3b;
  color: #e6e8ec;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.05rem;   /* + homogène, aligné sur le label */
  font-family: inherit;
}
:global(button), :global(input), :global(select), :global(textarea) { font-family: inherit; }

.btn-file { 
  /* force le même rendu “réel” que les autres */
  font-weight: 700;   /* 700 est un poids natif fréquent => homogène visuellement */
  line-height: 1.2; 
}
.btn.small { padding: 7px 10px; font-size: .95rem; }
.btn.block { width: 100%; justify-content: flex-start; }
.iconButton { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border); background: #111; color: #e6e8ec; }

.input, .textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #ffffff;
  color: #000;
  outline: none;
  font-size: 14px;  /* taille exacte du champ date */
  font-family: "Segoe UI", sans-serif;
}
.textarea { min-height: 180px; resize: vertical; }
.inline { display: inline-flex; gap: 8px; align-items: center; }

.wrap {
  --accent: #7E22CE;
  --border: var(--accent);
  --card-bg: #151015;
  --chip-on: #2a1a35;
  --chip-off: #0f0b13;
  --left: 700px;
  --right: 560px;
  --rowH: 600px;
  width: 100%;
  max-width: 1900px;
  margin: 0 auto;
  transform: translateX(-100px);
  padding: 10px 24px 40px;

  /* largeur d'origine (pas de “rétrécissement” du centre) */
  display: grid;
  grid-template-columns: var(--left) 1fr var(--right);
  gap: 16px;
  align-items: start;
}

/* colonnes = flex col pour tuer tout effondrement de marge */
.wrap > .left,
.wrap > .center,
.wrap > .right {
  display: flex;           /* ✅ plus robuste que flow-root */
  flex-direction: column;
  align-items: stretch;
  min-width: 0;            /* évite tout débordement horizontal */
}

/* sécurité : pas de marge supérieure “fantôme” sur le 1er panel */
.wrap > .left   > .panel:first-child,
.wrap > .center > .panel:first-child,
.wrap > .right  > .panel:first-child { margin-top: 0 !important; }

.panel {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}
.panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 14px;
  pointer-events: none;
  box-shadow: inset 0 0 0 2px var(--border);
}
.panelTitle {
  margin: 0 0 10px 0;
  font-size: 1.20rem;
  font-weight: 900;
  color: #fff;
  background: var(--accent);
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  line-height: 1;
}

.panelHead{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.panelHead .panelTitle{ margin: 0; } /* annule le margin-bottom du titre dans la rangée */

.nets {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 14px;
}
.chip {
  display: grid;
  grid-template-columns: 18px 22px 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  user-select: none;
  cursor: pointer;
}
.chip input { margin: 0; }
.chip.on  { background: var(--chip-on); }
.chip.off { background: var(--chip-off); opacity: .75; }
.chip .icon { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border: 1px solid var(--border); border-radius: 6px; background: #eee; color: #111; }
.chip .txt  { font-weight: 700; }

/* ====== Tableau "Règles par réseau" — REPLACEMENT START ====== */
.tableWrap {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #0f0b13;
}

/* Table en 7 colonnes fixes */
.rules {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* fige les largeurs des colonnes */
}
.rules col.col-net { width: 230px; }       /* 1ère colonne : Réseau */
.rules col.col-cap { width: auto; }        /* 6 colonnes capacités */

/* En-tête */
.rules thead th {
  padding: 12px 10px !important; /* petit padding à gauche pour l’air */
  background: rgba(126,34,206,.2);
  font-weight: 900;
  vertical-align: middle;
}

.rules thead tr { text-align: center; }

/* Corps */
.rules tbody tr { height: 68px !important; }
.rules th, .rules td {
  vertical-align: middle;
  padding: 18px 0 !important;             /* padding symétrique */
}

/* Alignements par colonne */
.rules thead th:first-child { text-align: left; padding-left: 10px !important; }
.rules tbody td:first-child { padding-left: 10px !important; }
.rules tbody td:nth-child(n+2) {
  text-align: left !important;
}

/* En-tête : centre les SVG comme les pastilles, au pixel près */
.rules thead th:nth-child(n+2) { 
  padding-left: 0 !important; 
  padding-right: 0 !important; 
}
.rules thead th:nth-child(n+2) :global(svg) {
  display: block;            /* plus “inline” */
  margin: 0 auto;            /* centre exact, comme .dot */
}

/* Pastilles centrées quelles que soient les autres règles */
.rules td:nth-child(n+2) .dot {
  display: block !important;
  margin: 0 auto !important;
}

/* Ligne Réseau : badge + texte */
.rules .netCell{
  display: flex;
  align-items: center;
  gap: 16px;
  font-weight: 800;
  flex-direction: row !important;  /* icône à gauche, texte à droite */
  flex-wrap: nowrap !important;    /* interdit de passer à la ligne */
  white-space: nowrap;             /* le texte ne casse pas */
}
.rules .badgeIcon{
  width: 48px; height: 48px; flex: 0 0 48px;
  border-radius: 8px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.22);
  box-shadow: 0 1px 0 rgba(0,0,0,.25) inset;
}
.rules .badgeIcon :global(svg){ width: 28px; height: 28px; }

.rules tbody tr:hover { background: rgba(126,34,206,.10); }

/* Légende */
.legend {
  display: flex;
  justify-content: center; /* ✅ centre tout le groupe horizontalement */
  align-items: center;
  gap: 80px;
  padding: 20px;
  font-size: 18px;
  opacity: .9;
  background: #251038;
  text-align: center; /* sécurité */
}
/* Pastilles (table + légende) */
.tableWrap :global(.dot) {
  display: inline-block !important;
  width: 20px; height: 20px; min-width: 14px; min-height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.18);
  box-shadow: 0 0 0 1px rgba(0,0,0,.35) inset;
  vertical-align: middle;
}
:global(.dot.good){ background-color:#10B981 !important; }
:global(.dot.warn){ background-color:#F59E0B !important; }
:global(.dot.bad) { background-color:#EF4444 !important; }
/* ====== Tableau "Règles par réseau" — REPLACEMENT END ====== */

.previews { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; margin-top: 12px; }
.preview { display: grid; grid-template-columns: 110px 1fr 28px; gap: 8px; align-items: center; border: 1px solid var(--border); border-radius: 10px; padding: 6px 8px; background: #21172a; }
.thumb { width: 110px; height: 80px; overflow: hidden; border-radius: 8px; background: #000; display: flex; align-items: center; justify-content: center; }
.thumb img, .thumb video { width: 100%; height: 100%; object-fit: cover; }
.mediaList li.hasThumb{
  grid-template-columns: 110px 1fr auto;
}

.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px; }

.btnRow {
  display: flex;
  justify-content: center; /* centre horizontalement la rangée */
  align-items: center;
  gap: 10px;               /* espace entre les boutons */
  width: 100%;
}

.btnRow .btn {
  flex: 1;                 /* chaque bouton prend la même place */
  max-width: 50%;          /* chacun 50% de la largeur totale */
  text-align: center;
}

.mediaList{
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #21172a;
}
.mediaList li{
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255,255,255,.12);
}
.mediaList li:last-child{ border-bottom: 0; }
.mName{ font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mActions{ display: inline-flex; gap: 12px; }
.linkish{
  background: none; border: none; color: #e6e8ec; cursor: pointer; padding: 0;
  text-decoration: underline; text-underline-offset: 2px;
}

.toggle { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; }
.mini { margin-top: 6px; font-size: 1rem; opacity: .9; }

.checks { margin-top: 10px; display: grid; gap: 6px; }
.checkOk { display: inline-flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid #059669; background: rgba(5,150,105,.18); }
.checkWarn { display: inline-flex; gap: 8px; align-items: center; border: 1px solid #B91C1C; background: rgba(185,28,28,.18); padding: 8px 10px; border-radius: 10px; }

.subTitle { margin: 10px 0 6px; font-weight: 900; opacity: .95; }
.selectNetworks { margin-bottom: 12px; }
     
.netsGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.netBadge.on  { box-shadow: 0 0 0 1px var(--border) inset; }
.netBadge.off { opacity: .8; }

.netBadge {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 34px 8px 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #0f0b13;
  cursor: pointer;
  user-select: none;
  min-height: 48px;
}

.netBadge input[type="checkbox"] {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  margin: 0;
  width: 22px;
  height: 22px;
  accent-color: var(--accent);
}
/* ✅ Fond BLANC quand décoché, sans toucher à l'apparence native */
.netBadge input[type="checkbox"]:not(:checked) {
  background-color: #fff;                 /* utile sur WebKit */
  box-shadow: inset 0 0 0 999px #fff;     /* “peint” l’intérieur (OK Firefox) */
}

.badgeIcon {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,.22);
  box-shadow: 0 1px 0 rgba(0,0,0,.25) inset;
}

.badgeTxt {
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tagList {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 8px;
  padding: 0;
  list-style: none;
}
.tagList li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 4px;
  background: #21172a;
  font-weight: 600;
}
.tagList li button {
  background: none;
  border: none;
  color: #f87171;
  cursor: pointer;
}

.rulesHeaderRow{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:28px;
  padding:12px;            /* garde la hauteur de la bande */
  background: transparent; /* même violet que l’en-tête */
}

.rulesHeaderRow span {
  font-size: 1.2rem;  /* ajuste la taille ici */
  font-weight: 700;   /* gras si tu veux */
  color: #fff;        /* couleur si besoin */
}

/* Bande violette en grille alignée sur les 7 colonnes du tableau */
.rulesHeaderRow{
  display:grid;
  grid-template-columns: 165px repeat(6, 45px);
  align-items:center;
  gap:27px;
  padding:10px 10px;
  background: transparent;
}

/* “Réseaux” aligné à gauche comme l’icône Twitter */
.rulesHeaderRow .label{
  justify-self:start;
  padding-left: 10px;      /* même recul que les cellules 1 */
  font-weight: 900;
}

/* Icônes centrées pile sur chaque colonne de pastilles */
.rulesHeaderRow .icon{
  justify-self:center;
}

/* ===== Toggle Commentaires (sous la zone blanche) ===== */
.commentToggleWrap{
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.commentState{
  font-weight: 800;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #0f0b13;
}
.commentState.on  { color: #10B981; border-color: #10B981; }
.commentState.off { color: #EF4444; border-color: #EF4444; }

/* Bouton slide */
.commentSwitch{
  --h: 28px;
  --w: 58px;
  position: relative;
  width: var(--w);
  height: var(--h);
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #190f24;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.commentSwitch .switchTrack{
  position: absolute;
  inset: 3px;
  border-radius: 999px;
  background: rgba(126,34,206,.25);
  pointer-events: none;
}
.commentSwitch .switchThumb{
  position: absolute;
  top: 50%;
  left: calc(100% - 3px - 22px);   /* OFF = par défaut à droite */
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #fff;
  transform: translateY(-50%);
  box-shadow: 0 1px 3px rgba(0,0,0,.35);
  transition: left .18s ease;
}
.commentSwitch.off .switchThumb{
  left: 3px;                        /* ON = à gauche */
}

/* ====== Encadré État avant publication ====== */
.statusList { 
  list-style: none; 
  padding: 0; 
  margin: 0; 
  display: grid; 
  gap: 6px; 
}
.statusList.twoCols{
  grid-template-columns: repeat(2, minmax(0,1fr));
}

.statusList li { 
  padding: 8px 10px; 
  border-radius: 10px; 
  font-weight: 800; 
}
.statusList.twoCols + .statusList {
  margin-top: 6px;
}
.statusList li.ok { 
  border: 1px solid #059669; 
  background: rgba(5,150,105,.18); 
}
.statusList li.warn { 
  border: 1px solid #B91C1C; 
  background: rgba(185,28,28,.18); 
}
.statusList li.block { border: 1px solid #B91C1C; background: rgba(185,28,28,.18); }
.inlineRow{
  display: flex;
  align-items: center;
  justify-content: space-between; /* ✅ répartit les blocs sur toute la largeur */
  gap: 14px;
  width: 100%;
}

.inlineRow .inputGroup,
.inlineRow .btn {
  flex: 1;                   /* ✅ chaque élément prend une largeur égale */
  text-align: center;
}

.btnRow {
  display: flex;
  justify-content: space-between; /* ✅ même alignement pour la ligne du dessous */
  align-items: center;
  gap: 14px;
  width: 100%;
}

.btnRow .btn {
  flex: 1;
  text-align: center;
}


.input.half {
  width: 50% !important;
  margin-top: 0px;   /* remonte légèrement pour aligner */
}

.inputGroup{
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.input.half {
  width: 240px !important;  /* “petite carte blanche” */
  margin-top: 0px;
}
.inputGroup{
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.input.half{           /* “petite carte blanche” pour la date */
  width: 240px !important;
  margin-top: 0;
}

.input.third{          /* selects HH et MM compacts */
  width: 120px !important;
  margin-top: 0;
}
select.input.third,
select.input.half {
  font-family: "Segoe UI", sans-serif;   /* même police que le calendrier */
  font-size: 14px;        /* texte plus grand */
  font-weight: 500;       /* un peu plus marqué pour la lisibilité */
  color: #000;            /* texte noir pour contraste sur fond blanc */
}
/* Ajuste uniquement la hauteur de l'encadré "État avant publication" */
/* Même plancher que les autres panels de la rangée */
.left .panel:nth-of-type(2) {
  min-height: 368px; /* 🔽 réduction légère pour réaligner visuellement */
}
.center .panel:last-of-type {
  min-height: 520px; /* 🔄 homogène avec la colonne gauche */
}


/* ===== Outils IA — gros boutons ronds 4 + 3 ===== */
.iaGridRounds{
  display: flex;
  flex-wrap: wrap;
  gap: 22px 22px;           /* lignes + colonnes */
  justify-content: center;  /* centre chaque rangée incomplète */
}
.iaGridRounds .iaItem{
  width: 110px;             /* même largeur que .iaRound */
}

.iaItem{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.iaRound{
  width: 90px;
  height: 90px;
  border-radius: 999px;
  border: 2px solid var(--border);
  background:
    radial-gradient(120px 120px at 30% 30%, rgba(126,34,206,.25), transparent 60%),
    #0f0b13;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 0 1px rgba(255,255,255,.06) inset,
    0 8px 22px rgba(0,0,0,.45);
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
}

.iaRound:hover{
  transform: translateY(-2px);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.10) inset,
    0 12px 28px rgba(0,0,0,.55);
  background:
    radial-gradient(120px 120px at 30% 30%, rgba(126,34,206,.35), transparent 60%),
    #120a19;
}

.iaRound:active{
  transform: translateY(0);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.12) inset,
    0 6px 16px rgba(0,0,0,.45);
}

.iaRound :global(svg){
  width: 40px;
  height: 40px;
  color: #fff; /* icônes blanches */
}

.iaCap{
  font-weight: 800;
  font-size: .95rem;
  text-align: center;
  opacity: .95;
}

.iaHelp {
  /* espacement par rapport aux boutons */
  margin-top: 20px;

  /* bandeau plein bord-à-bord à l'intérieur du panel */
  margin-left: -14px;   /* égale au padding du .panel */
  margin-right: -14px;  /* idem */
  margin-bottom: -14px; /* vient toucher le bord du panel en bas (plus de bande noire) */

  padding: 14px 16px;   /* garde de l’air pour le texte */
  background: #251038;  /* même violet foncé que la zone “légende” du tableau */

  /* aucun trait/bordure, seulement le fond */
  border: none;

  /* épouse la forme de l'encadré en bas */
  border-radius: 0 0 14px 14px; /* même rayon que .panel (14px) côté bas */

  text-align: center;
  font-weight: 700;
  color: #fff;
  width: auto; /* pas de calc(), on laisse la largeur se gérer avec les marges */
}

/* ===== Aperçu avant publication ===== */
.tabs{
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.tab{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  background: #0f0b13;
  border-radius: 999px;
  font-weight: 800;
  cursor: pointer;
  opacity: .9;
}
.tab.active{
  background: #251038;   /* ton violet sombre */
  box-shadow: inset 0 0 0 1px var(--border);
  opacity: 1;
}
.tab .tabIcon :global(svg){ width:18px; height:18px; }
.tab .tabTxt{ white-space: nowrap; }

/* Carte de post générique */
/* Carte de post générique — global pour que l’aperçu reçoive bien les styles */
:global(.pvCard){
  background: #151015;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;
  overflow: hidden;
}
:global(.pvHeader){ display:flex; align-items:center; gap:10px; padding:12px 12px 6px; }
:global(.pvAvatar){
  width:36px; height:36px; border-radius:999px;
  background:linear-gradient(135deg,#7E22CE,#3b1664);
  border:1px solid rgba(255,255,255,.25);
  box-shadow:0 0 0 1px rgba(0,0,0,.35) inset;
}
:global(.pvMeta){ line-height:1.15; }
:global(.pvName){ font-weight:900; }
:global(.pvTime){ opacity:.8; font-size:.9rem; }

:global(.pvText){ padding:8px 12px 0; font-size:1rem; }
:global(.pvText p){ margin:0 0 8px; word-break:break-word; }

:global(.pvMediaWrap){ padding:6px 12px 12px; }
:global(.pvMedia){
  width:100%; height:auto; border-radius:10px;
  display:block; background:#000;
}

:global(.pvFooter){
  border-top:1px solid rgba(255,255,255,.08);
  padding:10px 12px; font-weight:700; display:flex; align-items:center; gap:8px;
}

/* Variantes légères par réseau — global */
:global(.pv-facebook){ background:#fff; color:#111; }
:global(.pv-facebook .pvHeader){ background:#1877F2; color:#fff; }
:global(.pv-facebook .pvAvatar){ background:#fff; border-color:rgba(0,0,0,.08); }
:global(.pv-facebook .pvName){ font-weight:800; }
:global(.pv-facebook .pvText){ padding:12px 16px; }
:global(.pv-facebook .pvFooter){ border-top:1px solid #e5e7eb; color:#374151; }

:global(.pv-instagram){ background:#000; color:#fff; }
:global(.pv-instagram .pvHeader){ background:linear-gradient(135deg,#E1306C,#F56040); color:#fff; }
:global(.pv-instagram .pvMedia){ border-radius:14px; }
:global(.pv-instagram .pvFooter){ border-top:1px solid rgba(255,255,255,.12); opacity:.9; }

:global(.pv-linkedin){ background:#fff; color:#1f2937; }
:global(.pv-linkedin .pvHeader){ background:#0A66C2; color:#fff; }
:global(.pv-linkedin .pvName){ color:#fff; }
:global(.pv-linkedin .pvFooter){ border-top:1px solid #e5e7eb; color:#374151; }

:global(.pv-x){ background:#000; color:#e6e8eb; }
:global(.pv-x .pvHeader){ background:#111; }
:global(.pv-x .pvFooter){ border-top:1px solid #1f2937; opacity:.9; }

:global(.pv-youtube){ background:#fff; color:#111; }
:global(.pv-youtube .pvHeader){ background:#FF0000; color:#fff; }
:global(.pv-youtube .pvMediaWrap){ padding:0; }
:global(.pv-youtube .pvMedia){ display:block; width:100%; height:auto; aspect-ratio:16/9; border-radius:0; }
:global(.pv-youtube .pvFooter){
  background:#fff;
  border-top:none;
  padding:6px 12px 6px;   /* top = 0 : pas d’air superflu au-dessus */
  margin-top: 8px;         /* ⬅️ clé : annule le margin-top:auto générique */
  color:#374151;
}

:global(.pv-tiktok){ background:#000; color:#fafafa; }
:global(.pv-tiktok .pvHeader){ background:#0a0a0a; }
:global(.pv-tiktok .pvFooter){ border-top:1px solid #111; opacity:.95; }

/* Nettoyage générique */
:global(.pvCard){ border:0; border-radius:12px; overflow:hidden; }


/* Colonne droite en colonne flex pour que l'aperçu prenne la place et s'aligne en bas */
.right { display: flex; flex-direction: column; }
.right .panel:last-child {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 595px;   /* plancher commun */
}

.right .panel:last-child > .previewFrame {
  flex: 1;
  min-height: 0;  /* ⚠️ clé en flexbox pour permettre l’expansion à 100% */
}

/* Onglets : icônes seulement, carte collée sans espace */
.tabs{ display:flex; flex-wrap:wrap; gap:8px; margin:0; }        /* margin-bottom -> 0 */
.tab{
  display:inline-flex; align-items:center; justify-content:center;
  width:42px; height:42px; border-radius:999px; padding:0;
  border:1px solid var(--border); background:#0f0b13; cursor:pointer; opacity:.9;
}
.tab.active{ box-shadow: inset 0 0 0 1px var(--border); opacity:1; }
.tab .tabIcon :global(svg){ width:20px; height:20px; }

/* Couleurs d'onglet par réseau (apport de couleur) */
.tab-facebook { background:#1877F2; }
.tab-instagram{ background:linear-gradient(135deg,#E1306C,#F56040); }
.tab-linkedin { background:linear-gradient(135deg,#0A66C2,#000000); }
.tab-x        { background:#000; }
.tab-youtube  { background:#FF0000; }
.tab-tiktok   { background:linear-gradient(135deg,#69C9D0,#EE1D52); }

/* Carte collée aux onglets */
/* Carte collée aux onglets */
.previewFrame{
  border:1px solid var(--border);
  border-radius:12px;
  padding:0;
  margin-top:8px;
  background:transparent;
  display:flex;
  flex-direction:column;
  flex:1;
  min-height: 468px;
}

.previewFrame > :global(.pvCard){
  flex: 1;                      /* ✅ les aperçus FB/IG/LI/X reprennent une hauteur normale */
  display: flex;
  flex-direction: column;
}

/* Exception YouTube seulement (ta previewFrame a déjà la classe du réseau actif) */
.previewFrame.youtube > :global(.pvCard){
  flex: 0;                      /* ✅ on garde le comportement compact pour YouTube */
}


/* Carte générique : on nettoie et on laisse les variantes teinter */
.pvCard{ border:0; border-radius:12px; overflow:hidden; }

/* Aligne les 3 colonnes principales (left, center, right) en bas */
.wrap {
  align-items: start; /* ✅ force l’alignement vertical bas */
}

/* Carte = layout colonne, occupe toute la hauteur pour coller le footer en bas */
:global(.pvCard){
  display: flex;
  flex-direction: column;
  min-height: 100%;
height: 100%;
}

/* Le contenu prend la place, le footer reste collé en bas */
:global(.pvText), :global(.pvMediaWrap){ padding: 12px 12px 0; }
:global(.pvFooter){ margin-top: auto; }

/* Barre d’actions générique */
:global(.pvActions){
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  font-weight: 700;
}
:global(.pvAct){
  background: transparent;
  border: 0;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: default; /* déco — pas cliquable en aperçu */
}
:global(.pvAct:hover){ background: rgba(0,0,0,.06); }
:global(.pvMetrics){ opacity: .85; font-weight: 600; }

/* Variantes réseaux pour la barre (couleurs et contrastes) */
:global(.pv-facebook .pvFooter){ background: #fff; border-top: 1px solid #e5e7eb; }
:global(.pv-facebook .pvActions){ color: #374151; }
:global(.pv-facebook .pvAct){ color: #374151; }

:global(.pv-instagram .pvFooter){ background: #000; border-top: 1px solid rgba(255,255,255,.12); }
:global(.pv-instagram .pvActions){ color: #fff; }

:global(.pv-linkedin .pvFooter){ background: #fff; border-top: 1px solid #e5e7eb; }
:global(.pv-linkedin .pvActions){ color: #374151; }

:global(.pv-x .pvFooter){ background: #0a0a0a; border-top: 1px solid #1f2937; }
:global(.pv-x .pvActions){ color: #e6e8eb; }
:global(.pv-youtube .pvActions){ color: #374151; }
:global(.pv-tiktok .pvFooter){ background: #0a0a0a; border-top: 1px solid #111; }
:global(.pv-tiktok .pvActions){ color: #fafafa; }

/* Petits ronds décoratifs façon “icône” FB */
:global(.pvDot){
  display:inline-block; width:14px; height:14px; border-radius:50%;
  margin-right:8px; vertical-align: -2px; background:#9CA3AF;
}
:global(.pvDot.like){ background:#1877F2; } /* bleu FB pour “J’aime” */

/* ===== Facebook : ligne stats + actions ===== */
:global(.pv-facebook .pvFooter){
  padding: 8px 12px 10px;            /* un peu d’air autour */
  background: #fff;
  border-top: 1px solid #e5e7eb;
  color: #374151;
  display: block;                    /* on empile nos deux lignes */
}

/* Ligne 1 : stats */
:global(.pvStats){
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: .95rem;
}
:global(.pvStats .left){ opacity: .95; }
:global(.pvStats .right){ opacity: .85; }

/* Séparateur fin */
:global(.pvSeparator){
  margin: 8px 0;
  border-top: 1px solid #e5e7eb;
}

/* Ligne 2 : actions centrées */
:global(.pvBtnRow){
  display: flex;
  align-items: center;
  justify-content: space-around;   /* 3 boutons espacés, centrés */
  gap: 4px;
}
:global(.pvBtn){
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 0;
  background: transparent;
  color: #374151;
  font-weight: 700;
  cursor: default;                 /* aperçu non cliquable */
}
:global(.pvBtn:hover){ background: #f3f4f6; }
:global(.pvBtn svg){ width: 18px; height: 18px; }

/* ===== Instagram: barre d’actions (♥︎, bulle, avion, signet à droite) ===== */
:global(.pv-instagram .pvFooter){
  background: #000;
  border-top: 1px solid rgba(255,255,255,.12);
  padding: 8px 12px;
  color: #fff;
}

:global(.igActionsBar){
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

:global(.igLeft){
  display: inline-flex;
  align-items: center;
  gap: 14px; /* espacement entre ♥︎, bulle, avion */
}

:global(.igIcon){
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  border: 0;
  background: transparent;
  color: #fff;
  border-radius: 8px;
  cursor: default;               /* aperçu non cliquable */
}
:global(.igIcon:hover){
  background: rgba(255,255,255,.06);
}
:global(.igIcon svg){
  width: 20px; height: 20px;
}

:global(.igLeft){ display:inline-flex; align-items:center; gap:14px; }
:global(.igSave){ margin-left:auto; }  /* pousse le signet complètement à droite */

/* Barre d’actions LinkedIn (icônes + libellés) */
:global(.pv-linkedin .pvFooter){ background:#fff; border-top:1px solid #e5e7eb; color:#374151; }
:global(.liRow){ display:flex; align-items:center; justify-content:space-evenly; gap:8px; width:100%; }
:global(.liBtn){
  display:inline-flex; align-items:center; gap:8px;
  padding:8px 10px; border:0; background:transparent;
  border-radius:8px; font-weight:700; color:#374151; cursor:default;
}
:global(.liBtn:hover){ background:#f3f4f6; }
:global(.liBtn svg){ width:18px; height:18px; }

/* LinkedIn : en-tête neutre (plus de bande bleue) */
:global(.pv-linkedin .pvHeader){
  background: transparent;
  color: #111;
  border-bottom: 1px solid #e5e7eb;
}
:global(.pv-linkedin .pvName){ color:#111; }

/* “…” aligné à droite */
:global(.pvMore){
  margin-left:auto;
  padding: 4px 6px;
  border-radius: 6px;
  line-height: 1;
  opacity:.85;
}
:global(.pvMore:hover){ background: rgba(0,0,0,.06); }

/* Ligne métriques + séparateur */
/* LinkedIn : footer en pile (métriques, séparateur, actions) */
:global(.pv-linkedin .pvFooter){
  background:#fff;
  border-top:1px solid #e5e7eb;
  color:#374151;
  display:block;                /* ⬅️ clé : empile les lignes */
  padding: 8px 12px 10px;       /* même confort que Facebook */
}

:global(.liMetrics){
  display:flex; align-items:center; justify-content:space-between;
  padding:6px 0; font-weight:600; font-size:.95rem;
}
:global(.pvSeparator){ border-top:1px solid #e5e7eb; margin:6px 0 8px; }

/* Trois petits ronds à gauche (simulent les réactions) */
:global(.liDots){ display:inline-flex; align-items:center; margin-right:8px; }
:global(.dot){
  width:14px; height:14px; border-radius:50%;
  border:2px solid #fff; margin-left:-6px;
  box-shadow: 0 0 0 1px rgba(0,0,0,.05);
}
:global(.dot.d1){ background:#0a66c2; } /* bleu */
:global(.dot.d2){ background:#e03; }    /* rouge */
:global(.dot.d3){ background:#2ca24c; } /* vert */
:global(.liCount){ margin-left:4px; }

/* Actions centrées (si pas déjà en place) */
:global(.liRow){ display:flex; align-items:center; justify-content:space-evenly; gap:8px; width:100%; }
:global(.liBtn){
  display:inline-flex; align-items:center; gap:8px;
  padding:8px 10px; border:0; background:transparent;
  border-radius:8px; font-weight:700; color:#374151; cursor:default;
}
:global(.liBtn:hover){ background:#f3f4f6; }
:global(.liBtn svg){ width:18px; height:18px; }

/* ——— Carte X (fond sombre unique) ——— */
:global(.pvCard.pv-x){
  background:#181818;
  color:#e6e9ea;
  border:1px solid #2f3336;
}

/* En-tête : neutre, pas de séparateur interne */
:global(.pv-x .pvHeader){
  background:transparent;
  border-bottom:none;
  color:#e6e9ea;
}
:global(.pv-x .pvName){ color:#e6e9ea; }
:global(.pv-x .pvTime){ color:#8b98a5; }

/* Footer : pas de barre au-dessus, layout en “ligne d’actions” seulement */
:global(.pv-x .pvFooter){
  background:transparent;
  border-top:none;                 /* ⬅️ pas de séparateur */
  padding:8px 12px 10px;
}

/* Rangée d’actions X (alignée comme sur X, pas centrée au milieu) */
:global(.xRow){
  display:flex;
  align-items:center;
  justify-content:space-between;   /* 4 items répartis sur la largeur */
  gap:8px;
}
:global(.xBtn){
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:6px 8px;
  border:0;
  background:transparent;
  color:#fff;                      /* ⬅️ blanc pour icônes + chiffres */
  border-radius:999px;
  cursor:default;
}
:global(.xBtn:hover){
  background:rgba(239,243,244,.06);
  color:#fff;                      /* ⬅️ reste blanc au survol */
}

:global(.xBtn svg){ width:26px; height:26px; }

:global(.xBtn span){
  font-size:1.1rem;   /* ⬅️ plus grand */
  font-weight:400;    /* ⬅️ plus fort */
  line-height:1;      /* compacité */
}
:global(.pv-youtube .pvHeader){ display:none; }

/* —— YouTube preview —— */
:global(.pvCard.pv-youtube){ background:#0f0f0f; border:1px solid #2a2a2a; color:#e8eaed; }

:global(.ytVideoWrap){ position:relative; background:#000; }
:global(.ytVideo){ width:100%; height:297px; object-fit:cover; display:block; }
:global(.ytMute){
  position:absolute; top:8px; right:8px;
  background:rgba(0,0,0,.6);
  border:0; color:#fff; border-radius:999px;
  width:42px; height:42px;                 /* ↑ taille du bouton */
  display:flex; align-items:center; justify-content:center;
}

:global(.ytMute:hover){ background:rgba(0,0,0,.75); }
:global(.ytFooter){ padding:0px 10px 6px 6px; display:block; }
:global(.ytHeadRow){ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; }
:global(.ytChan){ display:flex; flex-direction:row; align-items:center; gap:6px; }

:global(.ytAvatar){ width:21px; height:21px; border-radius:999px; background:#222; border:1px solid #333; margin-left:-2px; }

:global(.ytTitleBar){
  font-weight:700;
  font-size:.9rem;
  line-height:1;
  padding:1px 0 1px;   /* très peu d’air */
  margin:0 0 2px;      /* colle presque la ligne avatar/actions */
}
:global(.ytSub){
  white-space:nowrap;        /* “78 abonnés” reste sur 1 ligne */
  font-size:.80rem;
  line-height:1.05;
  color:#9aa0a6;
}
:global(.ytSubscribe){ height: 28px; padding: 0 10px; font-size: .80rem; margin-left:0.5px; background:#fff; color:#0f0f0f; border:0; border-radius:18px; font-weight:800; white-space:nowrap; }

:global(.ytActions){ margin-left:auto; display:flex; align-items:center; gap:6px; flex-wrap:nowrap; }

:global(.ytBtn){
  display:inline-flex; align-items:center; gap:6px;
  height:30px;                    /* ← hauteur unifiée */
  padding:0 9px;                  /* ← compense la hauteur fixe */
  border-radius:18px;
  border:1px solid #303134; background:#171717; color:#e8eaed;
  white-space:nowrap; line-height:1;
}

:global(.ytDesc){ background:#1a1a1a; border:1px solid #303134; border-radius:12px; padding:10px 12px; }
:global(.ytDescTop){ color:#cbd0d4; margin-bottom:6px; font-weight:600; }
:global(.ytDescText){ color:#e8eaed; }
:global(.ytMore){ color:#8ab4f8; }

/* — YouTube : groupement like/dislike + bouton … — */
:global(.ytLikeGroup){ gap:10px; }
:global(.ytSep){
  display:inline-block; width:1px; height:12px;   /* ← ne force plus la hauteur */
  background:#303134; margin:0 4px; align-self:center;
}

/* bouton “…” rond (même hauteur que les autres) */
:global(.ytIconOnly){
  width:30px; height:30px;                                /* ⬅️ bouton “…” plus petit */
  padding:0; display:inline-flex; align-items:center; justify-content:center;
}
:global(.ytBtn svg){ width:12px; height:12px; }           /* ⬅️ icônes -2px */
:global(.ytBtn span){ font-size:.75rem; font-weight:500; }
:global(.ytTopBar){ display:flex; align-items:center; gap:8px; width:100%; }
:global(.ytLeft){ display:flex; align-items:center; gap:4px; min-width:0; } /* ou 4px */
:global(.ytMeta){
  display:flex;
  flex-direction:column;    /* ⬅ empile sur 2 lignes */
  align-items:flex-start;   /* ⬅ à gauche, à DROITE de l’avatar */
  gap:2px;
  min-width:0;
}

:global(.ytTitle){
  white-space:nowrap;        /* “Votre page” reste sur 1 ligne */
  font-weight:800;
  font-size:.90rem;          /* compacte un peu */
  line-height:1.05;
  overflow:hidden; text-overflow:ellipsis;  /* au cas où le nom serait long */
}

/* —— TikTok (bloc unique, FINAL) —— */
.previewFrame.tiktok { --ttNavH: 58px; display:flex; justify-content:center; align-items:center; }
.previewFrame.tiktok > :global(.pvCard){ position:relative !important; width:260px; height:460px; border-radius:24px; overflow:hidden; background:#000; border:1px solid rgba(255,255,255,.15); }
:global(.pv-tiktok .pvMedia){ width:100%; height:100%; object-fit:cover; border-radius:0; }

/* Légende TikTok : au-dessus de la barre noire */
:global(.pvTextTikTok){
  position:absolute; left:0; right:0; bottom: var(--ttNavH);
  padding:14px 16px; font-size:.9rem; font-weight:600; color:#fff;
  background: transparent;
}

/* Barre noire du bas */
.ttBottomBar{
  position:absolute; left:0; right:0; bottom:0 !important; z-index:10;
  height: var(--ttNavH); background:#000; border-top:1px solid #111;
  display:flex; align-items:center; justify-content:space-around; padding:0 8px;
}

/* Reset agressif des boutons pour enlever tout fond/encadré */
/* Ne touche pas au pilule blanche .ttPlus */
/* Reset seulement pour les 4 boutons icône */
.ttBottomBar .ttIcon,
.ttBottomBar .ttIcon *{
  background:transparent !important;
  background-color:transparent !important;
  border:0 !important; box-shadow:none !important; outline:none !important;
  -webkit-appearance:none !important; appearance:none !important;
}

/* Icônes simples */
.ttIcon{
  width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center;
  padding:0 !important; margin:0 !important;
  background:transparent !important; background-color:transparent !important;
  border:0 !important; border-radius:0 !important; box-shadow:none !important;
  color:#e5e5e5; opacity:.95; cursor:default;
}
.ttIcon:hover{ background:transparent !important; }
.ttIcon svg{ width:24px; height:24px; }

/* Bouton central “+” */
.ttPlusWrap{
  position:relative; width:72px; height:40px; border:0; background:transparent !important; box-shadow:none !important;
  -webkit-appearance:none; appearance:none; outline:none; padding:0;
  display:inline-flex; align-items:center; justify-content:center; cursor:default;
}
.ttPlus{
  position:relative;
  z-index:1;
  width:52px;
  height:30px;
  border-radius:10px;
  background:#fff !important;                 /* re-force le fond blanc */
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 0 0 1px rgba(255,255,255,.9) inset !important;
  overflow:hidden;                             /* pour couper net les filets */
}

/* filets internes façon TikTok */
.ttPlus::before,
.ttPlus::after{
  content:"";
  position:absolute;
  top:0; bottom:0;
  width:6px;                                   /* épaisseur du filet */
}

.ttPlus::before{ left:0;  background:#69C9D0; }/* bleu TikTok */
.ttPlus::after { right:0; background:#EE1D52; }/* rose TikTok */

.ttPlus svg{ width:22px; height:22px; } /* “+” blanc géré dans le JSX */
.ttPlusBadge{ position:absolute; inset:0; border-radius:12px; background:#000; }
.ttPlusWrap::before, .ttPlusWrap::after{ content:""; position:absolute; inset:0; border-radius:12px; filter:blur(.3px); }
.ttPlusWrap::before{ transform:translateX(-8px); background:#69C9D0; z-index:0; }
.ttPlusWrap::after { transform:translateX(8px);  background:#EE1D52; z-index:0; }

/* Placeholder si aucun média n'est choisi (9:16 plein écran) */
.ttPlaceholder{
  width: 100%;
  aspect-ratio: 9/16;
  background:
    repeating-linear-gradient(
      45deg,
      #0b0b0b 0 14px,
      #121212 14px 28px
    );
}
.pvActions-tt{ display:none !important; }

/* Sécurité TikTok : aucun style navigateur sur les boutons de la preview */
.previewFrame.tiktok :global(button):not(.ttPlusWrap){
  background: transparent !important;
  background-color: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
}

/* S’assure que la barre reste en bas même si un autre style s’applique */
.previewFrame.tiktok :global(.ttBottomBar){
  position: absolute !important;
  left: 0; right: 0; bottom: 0 !important;
  z-index: 10;
}
/* ✅ Correctif final : on peint la pilule directement sur le bouton central.
   Spécificité + !important => surclasse le reset .previewFrame.tiktok :global(button){…} */
.previewFrame.tiktok :global(.ttBottomBar .ttPlusWrap){
  width: 40px !important;
  height: 22px !important;
  border-radius: 4px !important;
  padding: 0 !important;

  background:
    linear-gradient(
      90deg,
      #69C9D0 0 1px,                    /* filet bleu gauche (8px) */
      #ffffff 8px calc(100% - 8px),    /* cœur blanc */
      #EE1D52 calc(100% - 1px) 100%    /* filet rose droit (8px) */
    ) !important;
}

/* On neutralise le fond du span interne pour éviter les conflits visuels */
.previewFrame.tiktok :global(.ttBottomBar .ttPlusWrap .ttPlus){
  background: transparent !important;
  box-shadow: none !important;
}

/* === TikTok — Répartition pleine largeur, définitif === */
.previewFrame.tiktok :global(.ttBottomBar){
  display: flex !important;
  justify-content: space-between !important; /* pousse 1er à gauche, dernier à droite */
  align-items: center !important;
  padding: 0 18px !important;               /* marge latérale comme l'app */
  gap: 0 !important;                        /* aucune “cassure” parasite */
  left: 0; right: 0; bottom: 0;             /* pleine largeur du card */
}

.previewFrame.tiktok :global(.ttBottomBar > *){
  flex: 0 0 auto !important;                /* chaque icône garde sa largeur */
}

.previewFrame.tiktok :global(.ttBottomBar .ttIcon){
  width: 36px !important; height: 36px !important;
}

.previewFrame.tiktok :global(.ttBottomBar .ttPlusWrap){
  width: 36px !important; height: 24px !important; /* pilule centrale */
}

/* —— TikTok right rail (avatar + compteurs + logo) —— */
.previewFrame.tiktok :global(.ttRightRail){
  position: absolute;
  top: 60%;
  right: 10px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  z-index: 12;              /* > 10 (barre du bas) */
  pointer-events: none;     /* aperçu non interactif */
}

/* Avatar + pastille + */
.previewFrame.tiktok :global(.ttProfile){
  position: relative;
  width: 30px; height: 30px;
}
.previewFrame.tiktok :global(.ttAvatar){
  width: 30px; height: 30px;
  border-radius: 999px;
  background: linear-gradient(135deg,#7E22CE,#3b1664);
  border: 1px solid rgba(255,255,255,.25);
  box-shadow: 0 0 0 1px rgba(0,0,0,.35) inset;
}
.previewFrame.tiktok :global(.ttPlusBadge){
  position: absolute;
  right: -2px; bottom: -2px;
  width: 18px; height: 18px;
  border-radius: 999px;
  background: #EE1D52;      /* rouge TikTok */
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 2px #000;  /* petit trait noir autour */
}

/* Boutons cœur / commentaire / partage */
.previewFrame.tiktok :global(.ttRailBtn){
  pointer-events: none;       /* pas cliquable en preview */
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #fff;
  background: transparent;
  border: 0;
}
/* Icônes raille droite : cœur, bulle, flèche */
.previewFrame.tiktok :global(.ttRailBtn svg){
  width: 24px;
  height: 24px;
  color: #fff; /* contours blancs */
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.6));
  transition: transform 0.2s ease;
}

/* Cœur rempli en blanc (style TikTok) */
.previewFrame.tiktok :global(.ttRailBtn.heart svg){
  fill: #fff;
  stroke: #fff;
}

/* Compteurs sous les icônes */
.previewFrame.tiktok :global(.ttCount){
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.7);
}

/* Disque logo TikTok */
.previewFrame.tiktok :global(.ttDisc){
  width: 36px; height: 36px;
  border-radius: 999px;
  background: #090909;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid rgba(255,255,255,.15);
  color: #fff;
}
.previewFrame.tiktok :global(.ttDisc svg){
  width: 20px; height: 20px;
}

.previewFrame.tiktok :global(.pv-tiktok .pvMedia){
  border-radius: 20px;  /* ← coins arrondis */
  overflow: hidden;
}

.previewFrame.tiktok :global(.ttBottomBar){
  background: #000 !important;   /* ← fond noir opaque */
  opacity: 1 !important;         /* pas transparent */
}

.previewFrame.tiktok :global(.ttTopBar){
  position:absolute;
  top:50px;
  left:0;
  right:0;
  display:flex;
  justify-content:center;
  align-items:center;
  gap:6px;
  color:#fff;
  font-weight:700;
  font-size:0.9rem;
  z-index:12;
}

.previewFrame.tiktok :global(.ttFollowing){ color:#aaa; }
.previewFrame.tiktok :global(.ttForYou){ color:#fff; }
.previewFrame.tiktok :global(.ttDot){
  width:6px; height:6px;
  border-radius:50%;
  background:#EE1D52;
}
/* ===== Modal publication ===== */
.modalOverlay{
  position: fixed; inset: 0; background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.modalCard{
  position: relative;              /* pour la pseudo-bordure */
  width: min(663px, 94vw);         /* un peu plus large */
  background: #151015;
  border-radius: 16px;
  padding: 22px;                   /* plus d’espace interne */
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
}
.modalCard::before{
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  box-shadow: inset 0 0 0 3px var(--accent); /* bordure violette épaisse */
  pointer-events: none;
}
.modalHeader{
  font-weight: 900;
  font-size: 1.25rem;
  background: var(--accent);
  color: #fff;
  display: inline-block;
  padding: 6px 30px;
  border-radius: 999px;
  display: block;
  text-align: center;
  margin: 0 auto 10px auto;
}
.modalBody{ margin-top: 12px; }
.modalList{ margin: 8px 0 0; padding-left: 18px; }
.modalHint{ font-size: .95rem; opacity: .9; }
.modalInfo{ margin-top: 8px; opacity: .9; }
.modalActions{
  display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; justify-content: left;
}
/* — titres & sections du modal — */
.modalSection { margin-top: 10px; }
.modalTitle{
  margin: 0 0 6px 0;
  font-size: 1.05rem;
  font-weight: 900;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #251038;           /* même famille violet foncé */
  color: #fff;
}

.modalGoodLine{
  margin: 4px 0 0 0;
  font-weight: 800;
  opacity: .95;
}

/* — bordure violette identique aux panels — */
.modalCard{
  border: 1px solid var(--border);
}

/* — boutons bien alignés, sans wrap — */
.modalActions{
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 30px;
  flex-wrap: nowrap;            /* pas de retour à la ligne */
}
.modalActions .btn{
  /* on laisse le fond hériter de .btn (violet sombre) */
  border-color: var(--border);      /* fine bordure violette */
  font-weight: 700;                 /* cohérent avec .btn globale */
}

.modalActions .btn:hover{
  /* léger accent sans inverser totalement les couleurs */
  box-shadow: inset 0 0 0 1px var(--border);
  filter: brightness(1.05);
}
.modalFailItem { margin: 6px 0; }
.errLine { margin: 2px 0; line-height: 1.35; }
.networkTitle {
  display: block;
  margin-bottom: 4px;
  color: var(--accent);
  font-weight: 800;
}
.btn:hover {
  background: #431d69;        /* violet plus clair au survol */
  box-shadow: 0 0 8px rgba(126,34,206,0.45);
  transition: all 0.15s ease;
  transform: translateY(-1px); /* <<< micro-mouvement comme Outils IA */
}

:global(.previewFrame .pvMediaWrap){
  position: relative;
  width: 100%;
  /* hauteur régie par aspect-ratio inline */
  overflow: hidden;
  border-radius: 10px;
  background: #111;
}

:global(.previewFrame .pvMedia){
  width: 100%;
  height: 100%;
  object-fit: cover; /* pas de déformation : crop centré */
  display: block;
}
/* ==== Anti-troncature des images en preview (fit non destructif) ==== */
:global(img.pvMedia){
  object-fit: contain !important;   /* pas de crop */
  background: #000;                 /* letter/pillarbox propre */
}

/* Les vidéos gardent un rendu “cover” (remplissage) */
:global(video.pvMedia){
  object-fit: cover;
}
/* TikTok : pas de cadre autour de la vidéo */
.previewFrame.tiktok :global(.pvMediaWrap){
  padding: 0 !important;      /* supprime la bordure visuelle */
  background: #000 !important;/* fond 100% noir */
  border-radius: 0 !important;/* pas d’arrondi parasite */
}
.left, .center, .right { 
  align-self: start;
  display: flow-root;        /* ✅ coupe l’effondrement de marge */
}
.center > .panel:first-child { margin-top: 0 !important; }












`}</style>
    </section>
  );
}

function renderRow(
  k: NetworkKey,
  caps: {
    text: "good" | "warn" | "bad";
    image: "good" | "warn" | "bad";
    video: "good" | "warn" | "bad";
    link: "good" | "warn" | "bad";
    doc: "good" | "warn" | "bad";
    comments: "good" | "warn" | "bad";
  }
) {
  const meta = NETWORKS[k];
  const cellStyle: React.CSSProperties = {
    paddingTop: 10,
    paddingBottom: 10,
    verticalAlign: "middle",
  };

  const badgeBox: React.CSSProperties = {
    ...badgeStyleForKey(k),
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.22)",
    boxShadow: "inset 0 1px 0 rgba(0,0,0,.25)",
    overflow: "hidden",
    flex: "0 0 48px",
    marginLeft: 8,
  };

  return (
    <tr>
      <td style={cellStyle}>
        <span className="netCell" style={{display:"inline-flex",alignItems:"center",gap:12,whiteSpace:"nowrap"}}>
<span 
  className="badgeIcon" 
  style={badgeBox}
>
  {renderNetIconForKey(k, 26)}
</span>
{meta.label}

        </span>
      </td>
      <td style={cellStyle}><span className={`dot ${caps.text}`} /></td>
      <td style={cellStyle}><span className={`dot ${caps.image}`} /></td>
      <td style={cellStyle}><span className={`dot ${caps.video}`} /></td>
      <td style={cellStyle}><span className={`dot ${caps.link}`} /></td>
      <td style={cellStyle}><span className={`dot ${caps.doc}`} /></td>
      <td style={cellStyle}><span className={`dot ${caps.comments}`} /></td>
    </tr>
  );
}

function renderWarnings(charCounts: { base: number; per: Partial<Record<NetworkKey, number>>; }) {
  const warnings: string[] = [];
  (Object.keys(NETWORKS) as NetworkKey[]).forEach((k) => {
    const len = charCounts.base;
    const max = NETWORKS[k].max;
    if (len > max) warnings.push(`${NETWORKS[k].label} dépasse la limite (${len}/${max}).`);
    if (k === "x" && len > 260) warnings.push(`X : vous approchez de la limite, pensez à condenser.`);
    if (k === "instagram" && len > 2000) warnings.push(`Instagram : texte long, envisagez de réduire ou déplacer en commentaire.`);
  });

if (warnings.length === 0) {
  return <></>; // ne rien afficher quand tout est OK
}

  return (
    <>
      {warnings.map((w, i) => (
        <div key={i} className="checkWarn">
          <AlertTriangle size={16} /> {w}
        </div>
      ))}
    </>
  );
}

// ⬇️ Ajoute ceci à côté de renderPreviewMock
function renderNetworkActions(k: NetworkKey) {
  // Petites stats factices pour le rendu (tu peux les brancher plus tard)
  const stats = { likes: 128, comments: 14, shares: 7, reposts: 5, views: 1023 };

if (k === "facebook") {
  return (
    <>
      {/* Ligne 1 : stats (comme FB) */}
      <div className="pvStats pvStats-fb">
        <div className="left"><span>{stats.likes} j’aime</span></div>
        <div className="right">
          <span>{stats.comments} commentaires</span> · <span>{stats.shares} partages</span>
        </div>
      </div>

      {/* Séparateur fin */}
      <div className="pvSeparator pvSeparator-fb" />

      {/* Ligne 2 : actions centrées avec icônes Lucide */}
      <div className="pvBtnRow pvBtnRow-fb">
        <button className="pvBtn" aria-label="J’aime">
          <ThumbsUp size={18} /> <span>J’aime</span>
        </button>
        <button className="pvBtn" aria-label="Commenter">
          <MessageSquare size={18} /> <span>Commenter</span>
        </button>
        <button className="pvBtn" aria-label="Partager">
          <Share size={18} /> <span>Partager</span>
        </button>
      </div>
    </>
  );
}

if (k === "instagram") {
  return (
    <div className="igActionsBar">
      <div className="igLeft">
        <button className="igIcon" aria-label="J’aime"><Heart size={20} /></button>
        <button className="igIcon" aria-label="Commenter"><MessageCircle size={20} /></button>
        <button className="igIcon" aria-label="Partager"><Send size={20} /></button>
      </div>
      <button className="igIcon igSave" aria-label="Enregistrer"><Bookmark size={20} /></button>
    </div>
  );
}

if (k === "linkedin") {
  return (
    <>
      <div className="liMetrics">
        <div className="left">
          <span className="liDots">
            <i className="dot d1" /><i className="dot d2" /><i className="dot d3" />
          </span>
          <span className="liCount">{stats.likes}</span>
        </div>
        <div className="right">{stats.shares} republications</div>
      </div>

      <div className="pvSeparator" />

      <div className="liRow">
        <button className="liBtn"><RiThumbUpLine size={18}/><span>J’aime</span></button>
        <button className="liBtn"><RiChat3Line size={18}/><span>Commenter</span></button>
        <button className="liBtn"><RiRepeat2Line size={18}/><span>Republier</span></button>
        <button className="liBtn"><RiSendPlaneLine size={18}/><span>Envoyer</span></button>
      </div>
    </>
  );
}


if (k === "x") {
  return (
    <div className="xRow">
      <button className="xBtn" aria-label="j'aime">
        <Heart size={18} /><span>168</span>
      </button>
      <button className="xBtn" aria-label="Répondre">
        <MessageCircle size={18} /><span>19</span>
      </button>
      <button className="xBtn" aria-label="Reposter">
        <Repeat2 size={18} /><span>7</span>
      </button>
      <button className="xBtn" aria-label="Partager">
        <Send size={18} /><span>32</span>
      </button>
    </div>
  );
}

if (k === "youtube") {
  return (
    <div className="ytFooter">
<div className="ytTitleBar">Titre de la vidéo</div>
      <div className="ytTopBar">
        <div className="ytLeft">
          <div className="ytChan">
            <div className="ytAvatar" />
            <div className="ytMeta">
              <div className="ytTitle">Votre page</div>
              <div className="ytSub">78 abonnés</div>
            </div>
          </div>
          <button className="ytSubscribe">S’abonner</button>
        </div>

        <div className="ytActions">
          <button className="ytBtn ytLikeGroup" aria-label="Réactions">
            <ThumbsUp size={18} /><span>1 k</span>
            <span className="ytSep" aria-hidden />
            <ThumbsDown size={18} />
          </button>

          <button className="ytBtn" aria-label="Partager">
            <RiShareForwardLine size={18} /><span>Partager</span>
          </button>

          <button className="ytBtn" aria-label="Clip">
            <Scissors size={18} /><span>Clip</span>
          </button>

          <button className="ytBtn ytIconOnly" aria-label="Plus d’actions">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

if (k === "tiktok") return null; // ⬅️ plus rien dans le footer TikTok

  return null;
}
// Icônes TikTok style (stroke arrondi, épaisseur ~1.8)
const TTIconHome = ({ size=22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
       aria-hidden="true">
    {/* maison PLEINE */}
    <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"
          fill="currentColor" />
  </svg>
);

const TTIconSearch = ({ size=22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.8-3.8" />
  </svg>
);

const TTIconChat = ({ size=22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {/* bulle rectangulaire douce + “queue” */}
    <path d="M21 7.5v7A2.5 2.5 0 0 1 18.5 17H9l-6 4V7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5z"/>
  </svg>
);

const TTIconUser = ({ size=22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20a8 8 0 0 1 16 0"/>
  </svg>
);
// Ratios d’aperçu par réseau (virtuel, non destructif)
const ASPECT: Record<NetworkKey, string> = {
  facebook: "1.91/1",
  linkedin: "1.91/1",
  instagram: "1/1",
  x: "16/9",
  youtube: "16/9",
  tiktok: "9/16",
};

function renderPreviewMock(
  k: NetworkKey,
  ctx: {
    draft: Draft;
    previews: string[];
    primaryIdx: number;
    ytMuted: boolean;
    toggleYtMuted: () => void;
    virtualFormats: { url: string; type: string; ratio: string }[];
  }
) {
const { draft, previews, primaryIdx, ytMuted, toggleYtMuted, virtualFormats } = ctx;

  // ⬇️ ajoute cette ligne :
  const stats = { views: 1023 }; // valeurs factices pour l’aperçu

  // Texte du post
  const text = (

    <div className="pvText">
      {(draft.text || "Votre texte apparaîtra ici…")
        .split("\n")
        .map((l, i) => <p key={i}>{l || "\u00A0"}</p>)}
    </div>
  );

  // Médias (priorité au “principal”, sinon 1er)
  const items = draft.media;
  const primary = (primaryIdx >= 0 && primaryIdx < items.length) ? primaryIdx : 0;

let media: ReactNode | null = null;
  if (items.length) {
    const first = previews[primary] ?? previews[0];
    const file  = items[primary] ?? items[0];
    if (file?.type?.startsWith("video/")) {
      media = <video className="pvMedia" src={first} controls playsInline />;
    } else {
const virt = virtualFormats[primary];
const style = virt ? { aspectRatio: virt.ratio } : {};

if (file?.type?.startsWith("video/")) {
  media = <video className="pvMedia" style={style} src={first} controls playsInline />;
} else {
  media = <img className="pvMedia" style={style} src={first} alt="" />;
}

    }
  }

  return (
<div className={`pvCard pv-${k}`}>
  {/* Supprime l'en-tête pour TikTok */}
  {k !== "tiktok" && (
    <div className="pvHeader">
      <div className="pvAvatar" />
      <div className="pvMeta">
        <div className="pvName">Votre Page</div>
        <div className="pvTime">Simulation de l'aperçu</div>
      </div>
      {(k === "linkedin" || k === "x") && <span className="pvMore" aria-hidden>…</span>}
    </div>
  )}

  {/* Le texte va en bas seulement pour TikTok */}
  {k !== "youtube" && k !== "tiktok" && text}
{k !== "youtube" && k !== "tiktok" && media && (
    <div className="pvMediaWrap" style={{ aspectRatio: ASPECT[k] }}>
      {media}
    </div>
  )}
{ k === "tiktok" && (
  <>
    <div className="pvMediaWrap">
{/* Barre du haut TikTok */}
<div className="ttTopBar">
  <span className="ttFollowing">Following</span>
  <span className="ttDot" />
  <span className="ttForYou">For You</span>
</div>

      {media ? media : <div className="ttPlaceholder" aria-hidden="true" />}
    </div>

    {/* ➕ Right rail TikTok (avatar + compteurs + logo) */}
    <div className="ttRightRail" aria-hidden="true">
      {/* Avatar + pastille + */}
      <div className="ttProfile">
        <div className="ttAvatar" />
        <span className="ttPlusBadge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </div>

      {/* Cœur */}
<button className="ttRailBtn heart" type="button">
  <Heart strokeWidth={2.2} />
  <span className="ttCount">673.1k</span>
</button>

{/* Commentaires : bulle remplie blanche + 3 points noirs */}
<button className="ttRailBtn" type="button" aria-label="Commentaires">
  <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">

    <path d="M21 7.5v7A2.5 2.5 0 0 1 18.5 17H9l-6 4V7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5z"
          fill="#fff"/>

    <circle cx="9.25" cy="11.5" r="1.25" fill="#000"/>
    <circle cx="12.00" cy="11.5" r="1.25" fill="#000"/>
    <circle cx="14.75" cy="11.5" r="1.25" fill="#000"/>
  </svg>
  <span className="ttCount">856</span>
</button>

{/* Partager : flèche courbée remplie blanche (même famille que YouTube) */}
<button className="ttRailBtn" type="button" aria-label="Partager">
  <RiShareForwardFill size={28} color="#fff" />
  <span className="ttCount">43</span>
</button>

      {/* Logo TikTok (disque) */}
      <div className="ttDisc">
        <FaTiktok />
      </div>
    </div>

    {/* Légende TikTok : au-dessus de la barre noire */}
    <div className="pvTextTikTok">

  {(draft.text || "Votre texte apparaîtra ici…")
    .split("\n")
    .map((l, i) => <p key={i}>{l || "\u00A0"}</p>)}
</div>

    {/* Barre de navigation TikTok (icônes en bas) */}
<div
  className="ttBottomBar"
  role="navigation"
  aria-label="TikTok bottom bar"
  style={{ position:"absolute", left:0, right:0, bottom:0, zIndex:10 }}
>

<button className="ttIcon" aria-label="Accueil"
  style={{ background:"transparent", border:0, boxShadow:"none", borderRadius:0, padding:0 }}>
  <TTIconHome />
</button>

<button className="ttIcon" aria-label="Recherche"
  style={{ background:"transparent", border:0, boxShadow:"none", borderRadius:0, padding:0 }}>
  <TTIconSearch />
</button>

<button className="ttPlusWrap" aria-label="Créer"
  style={{ background:"transparent", border:0, boxShadow:"none", borderRadius:0, padding:0 }}>
  <span className="ttPlus" aria-hidden="true">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
     stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 5v14M5 12h14" />
</svg>
  </span>
</button>

<button className="ttIcon" aria-label="Message"
  style={{ background:"transparent", border:0, boxShadow:"none", borderRadius:0, padding:0 }}>
  <TTIconChat />
</button>
<button className="ttIcon" aria-label="Profil"
  style={{ background:"transparent", border:0, boxShadow:"none", borderRadius:0, padding:0 }}>
  <TTIconUser />
</button>

    </div>
  </>
)}

{ k === "youtube" && (
  <div
    className="ytVideoWrap"
    style={{
      aspectRatio: "16/9",
      width: "100%",
      borderRadius: 12,
      background: "#0b0b0b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      border: "1px solid #303134"
    }}
  >
    {(() => {
      const file = items[primary] ?? items[0];
      if (!file?.type?.startsWith("video/")) {
        // aucun média vidéo sélectionné → message placeholder
        return (
          <div style={{ color:"#9aa0a6", fontWeight:700, textAlign:"center", padding:16 }}>
            Sélectionnez une vidéo pour l’aperçu YouTube.
          </div>
        );
      }
      if (!isPlayableInBrowser(file)) {
        // vidéo non lisible → message conversion
        return (
          <div style={{ color:"#9aa0a6", fontWeight:700, textAlign:"center", padding:16 }}>
            Format vidéo non lisible par le navigateur (ex : WMV). Conversion requise.
          </div>
        );
      }
      const src = previews[primary] ?? previews[0] ?? "";
      return (
        <video
          className="ytVideo"
          src={src}
          autoPlay
          loop
          muted={ytMuted}
          playsInline
          controls
          style={{ width:"100%", height:"100%", objectFit:"cover" }}
        />
      );
    })()}
  </div>
)}


{ k !== "tiktok" && (
  <div className="pvFooter">
    {renderNetworkActions(k)}
  </div>
)}
{ k === "youtube" && (
  <div className="ytDesc">
    <div className="ytDescTop">
      <span>{stats.views} vues</span> · <span>il y a 2 ans</span>
    </div>
    <p className="ytDescText">
      {(draft.text || "Votre texte d’apparaître ici")} <span className="ytMore">…afficher plus</span>
    </p>
  </div>
)}

    </div>
  );
}


// ——— Détection du contenu courant
const DOC_EXTS = ["pdf","doc","docx","ppt","pptx","xls","xlsx"];

function isDocFile(f: File): boolean {
  const t = f.type || "";
  if (t.startsWith("image/") || t.startsWith("video/")) return false;
  const name = (f.name || "").toLowerCase();
  const byExt = DOC_EXTS.some(ext => name.endsWith("." + ext));
  // Si pas d’extension reconnue : tout ce qui n’est ni image ni vidéo est considéré “doc”
  return byExt || (!t || (!t.startsWith("image/") && !t.startsWith("video/")));
}

function inferAllFlags(d: Draft) {
  const textLen  = (d.text || "").length;
  const hasLink  = /\bhttps?:\/\/\S+/i.test(d.text || "");
  const hasImage = d.media.some(f => f.type?.startsWith("image/"));
  const hasVideo = d.media.some(f => f.type?.startsWith("video/"));
  const hasDoc   = d.media.some(isDocFile);
  const commentsOff = !d.allowComments;
  return { textLen, hasLink, hasImage, hasVideo, hasDoc, commentsOff };
}

// ——— Règles simplifiées par réseau
const LINK_RULE: Record<NetworkKey, "good"|"warn"|"bad"> = {
  x: "good", instagram: "warn", facebook: "good", linkedin: "good", youtube: "good", tiktok: "warn",
};
const DOC_RULE: Record<NetworkKey, "good"|"warn"|"bad"> = {
  x: "bad", instagram: "bad", facebook: "warn", linkedin: "good", youtube: "bad", tiktok: "bad",
};
const COMMENTS_OFF_SUPPORTED: Record<NetworkKey, boolean> = {
  x: false, instagram: true, facebook: true, linkedin: true, youtube: true, tiktok: true,
};
const VIDEO_RULE: Record<NetworkKey, "good"|"warn"|"bad"> = {
  x: "warn", instagram: "good", facebook: "good", linkedin: "good", youtube: "good", tiktok: "good",
};
const IMAGE_RULE: Record<NetworkKey, "good"|"warn"|"bad"> = {
  x: "good", instagram: "good", facebook: "good", linkedin: "good", youtube: "warn", tiktok: "warn",
};
const TEXT_SENSITIVITY: Record<NetworkKey, "good"|"warn"> = {
  x: "good", instagram: "warn", facebook: "good", linkedin: "good", youtube: "warn", tiktok: "warn",
};

// ——— Évaluation d’un réseau (OK / WARN / BLOCK) + message court
function evaluateNetworkStatus(
  k: NetworkKey,
  flags: ReturnType<typeof inferAllFlags>
): { level: "ok" | "warn" | "block"; message: string } {
  const warn: string[] = [];
  const block: string[] = [];

  // 1) Longueur texte
  const max = NETWORKS[k].max;
  if (flags.textLen > max) {
    block.push(`Texte ${flags.textLen}/${max} : au-delà de la limite`);
  } else {
    const near = Math.round(max * 0.9);
    if (flags.textLen >= near || TEXT_SENSITIVITY[k] === "warn") {
      if (flags.textLen >= near) warn.push(`Texte ${flags.textLen}/${max} : proche de la limite`);
    }
  }

  // 2) Documents
  if (flags.hasDoc) {
    const r = DOC_RULE[k];
    if (r === "bad") block.push("Document non supporté");
    if (r === "warn") warn.push("Document sous condition");
  }

  // 3) Liens
  if (flags.hasLink) {
    const r = LINK_RULE[k];
    if (r === "bad") block.push("Lien non supporté");
    if (r === "warn") warn.push("Lien cliquable limité");
  }

  // 4) Vidéo / Image
  if (flags.hasVideo && VIDEO_RULE[k] === "warn") {
    warn.push("Vidéo : contraintes possibles");
  }
  if (flags.hasImage && IMAGE_RULE[k] === "warn") {
    warn.push("Image : contraintes possibles");
  }
  // YouTube sans vidéo → quasi sûr
if (k === "youtube" && flags.hasImage && !flags.hasVideo) {
  block.push("YouTube : nécessite une vidéo");
}

  // 5) Commentaires
  if (flags.commentsOff && !COMMENTS_OFF_SUPPORTED[k]) {
    block.push("Com. off non supporté");
  }

  if (block.length) return { level: "block", message: block[0] + (warn[0] ? ` • ${warn[0]}` : "") };
  if (warn.length)  return { level: "warn",  message: warn[0] };
  return { level: "ok", message: "OK" };
}

function extraNetworkChecks(
  k: NetworkKey,
  meta: MediaMeta[],
): { level: "ok" | "warn" | "block"; messages: string[] } {
  const L = LIMITS[k] || {};
  const images = meta.filter(m => m.kind === "image");
  const videos = meta.filter(m => m.kind === "video");
  const docs   = meta.filter(m => m.kind === "doc");

  const warn: string[] = [];
  const block: string[] = [];

  // Comptages
  if (L.imageMaxCount && images.length > L.imageMaxCount) {
    block.push(`Images : ${images.length}/${L.imageMaxCount} (au-delà de la limite)`);
  }

  // Poids images
  if (L.imageMaxSizeMB) {
    images.forEach((im) => {
if (((im as any).sizeMB || 0) > L.imageMaxSizeMB!) {
        block.push(`Image trop lourde (> ${L.imageMaxSizeMB} Mo)`);
      }
    });
  }

  // Dimensions recommandées (TikTok)
  if (L.imageRecommended && images.length) {
    const { w, h } = L.imageRecommended;
    const bad = images.some(im => (im.width && im.height) && !(im.width === w && im.height === h));
    if (bad) warn.push(`Images : recommandé ${w}×${h}px`);
  }

  // Vidéos : durée / poids
  if (videos.length) {
    if (L.videoMaxDurationSec) {
      const badDur = videos.find(v => ((((v as any).durationSec ?? (v as any).duration ?? 0)) > L.videoMaxDurationSec!));
      if (badDur) block.push(`Vidéo trop longue (> ${Math.round(L.videoMaxDurationSec/60)} min)`);
    }
    if (L.videoMaxSizeMB) {
      const badSz = (videos as Array<MediaMeta & { sizeMB?: number; sizeBytes?: number }>).find(v => ((v.sizeMB ?? (v.sizeBytes ? v.sizeBytes / 1_000_000 : 0)) > (L.videoMaxSizeMB || 0)));
      if (badSz) block.push(`Vidéo trop lourde (> ${L.videoMaxSizeMB} Mo)`);
    }
  }

  // Documents (LinkedIn tolère, autres souvent non)
  if (docs.length && L.docMaxSizeMB) {
    const badDoc = docs.find(d => (d.sizeMB || 0) > L.docMaxSizeMB!);
    if (badDoc) block.push(`Document trop lourd (> ${L.docMaxSizeMB} Mo)`);
  }

  if (block.length) return { level: "block", messages: block.concat(warn) };
  if (warn.length)  return { level: "warn",  messages: warn };
  return { level: "ok", messages: [] };
}

function evaluateNetworkStatusDetailed(
  k: NetworkKey,
  flags: ReturnType<typeof inferAllFlags>,
  meta: MediaMeta[],
): { level: "ok" | "warn" | "block"; messages: string[] } {
  const L = LIMITS[k] || {};
  const images = meta.filter(m => m.kind === "image");
  const videos = meta.filter(m => m.kind === "video");
  const docs   = meta.filter(m => m.kind === "doc");
  const messages: string[] = [];
if (k === "youtube" && !flags.hasVideo) messages.push(`${NETWORKS[k].label} : Vidéo requise`);
if (k === "youtube" && flags.hasImage)  messages.push(`${NETWORKS[k].label} : Image non supportée`);

  // --- TEXTE ---
  const max = NETWORKS[k].max;
  if (flags.textLen > max) {
    messages.push(`${NETWORKS[k].label} : texte ${flags.textLen}/${max} caractères (limite dépassée)`);
  }

  // --- IMAGES ---
  if (L.imageMaxCount && images.length > L.imageMaxCount) {
    messages.push(`${NETWORKS[k].label} : ${images.length} images – limite ${L.imageMaxCount} max`);
  }
  if (L.imageMaxSizeMB) {
    const badImg = images.find(im => (im.sizeMB || 0) > L.imageMaxSizeMB!);
    if (badImg) messages.push(`${NETWORKS[k].label} : image "${badImg.name}" trop lourde (> ${L.imageMaxSizeMB} Mo)`);
  }
  if (L.imageRecommended && images.length) {
    const { w, h } = L.imageRecommended;
    const badDim = images.find(im => im.width && im.height && (im.width !== w || im.height !== h));
    if (badDim) messages.push(`${NETWORKS[k].label} : dimensions recommandées ${w}×${h}px`);
  }

  // --- VIDÉOS ---
  if (videos.length) {
    if (L.videoMaxDurationSec) {
      const badDur = videos.find(v => ((((v as any).durationSec ?? (v as any).duration ?? 0)) > L.videoMaxDurationSec!));
      if (badDur) {
        const maxMin = Math.round(L.videoMaxDurationSec! / 60);
        messages.push(`${NETWORKS[k].label} : vidéo trop longue (${Math.round(badDur.durationSec!/60)} min / limite ${maxMin} min)`);
      }
    }
    if (L.videoMaxSizeMB) {
      const badSz = (videos as Array<MediaMeta & { sizeMB?: number; sizeBytes?: number }>).find(v => ((v.sizeMB ?? (v.sizeBytes ? v.sizeBytes / 1_000_000 : 0)) > (L.videoMaxSizeMB || 0)));
      if (badSz) messages.push(`${NETWORKS[k].label} : vidéo "${badSz.name}" trop lourde (> ${L.videoMaxSizeMB} Mo)`);
    }
  }

  // --- DOCUMENTS ---
  if (docs.length && L.docMaxSizeMB) {
    const badDoc = docs.find(d => (d.sizeMB || 0) > L.docMaxSizeMB!);
    if (badDoc) messages.push(`${NETWORKS[k].label} : document "${badDoc.name}" trop lourd (> ${L.docMaxSizeMB} Mo)`);
  }
  if (flags.hasDoc && !L.docMaxSizeMB && DOC_RULE[k] === "bad") {
    messages.push(`${NETWORKS[k].label} : Documents non supportés sur ce réseau`);
  }

  // --- LIENS ---
  if (flags.hasLink && LINK_RULE[k] === "warn") {
    if (k === "instagram") messages.push("Lien non cliquable sauf en bio");
    if (k === "tiktok") messages.push("Lien non cliquable sauf en bio");
  }

  // --- COMMENTAIRES ---
  if (flags.commentsOff && !COMMENTS_OFF_SUPPORTED[k]) {
    messages.push(`${NETWORKS[k].label} : Com. off non supporté`);
  }

// --- CAS PARTICULIERS EXPLICITES ---
if (k === "facebook" && flags.hasDoc) {
  messages.push("Doc. importable dans les groupes seulement.");
}

if (k === "facebook" && flags.commentsOff) {
  messages.push("Com. off dans les groupes seulement.");
}

if (k === "tiktok" && flags.hasLink) {
  messages.push("Lien accessible en compte Business spécifique.");
}

  // Niveau global
  const level: "ok"|"warn"|"block" = messages.length ? "block" : "ok";
  return { level, messages };
}

