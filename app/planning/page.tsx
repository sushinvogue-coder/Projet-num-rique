// app/planning/page.tsx
"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { ThumbsUp, X, ChevronLeft, ChevronRight, CalendarClock, Target, CalendarDays, Clock } from "lucide-react";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube, FaTiktok } from "react-icons/fa";

/* ============ Utils dates (sans lib) ============ */
const pad = (n: number) => String(n).padStart(2, "0");
const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fmtNum = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}`;
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth   = (d: Date) => new Date(d.getFullYear(), d.getMonth()+1, 0);
const startOfWeek  = (d: Date) => { const c=new Date(d); const day=(c.getDay()+6)%7; c.setDate(c.getDate()-day); c.setHours(0,0,0,0); return c; };
const endOfWeek    = (d: Date) => { const s=startOfWeek(d); const e=new Date(s); e.setDate(s.getDate()+6); return e; };
function isoWeek(d0: Date): [number, number] {
  const d = new Date(Date.UTC(d0.getFullYear(), d0.getMonth(), d0.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return [d.getUTCFullYear(), weekNo];
}
const toWeekValue = (d: Date) => { const [y,w]=isoWeek(d); return `${y}-W${pad(w)}`; };
function mondayOfISOWeek(y: number, w: number) {
  const simple = new Date(Date.UTC(y, 0, 1 + (w - 1) * 7));
  const dow = simple.getUTCDay() || 7;
  simple.setUTCDate(simple.getUTCDate() - (dow - 1));
  return simple;
}
function parseWeekValue(val: string) {
  const m = /^(\d{4})-W(\d{2})$/.exec(val);
  if (!m) return new Date();
  const y = Number(m[1]), w = Number(m[2]);
  const mon = mondayOfISOWeek(y, w);
  return new Date(Date.UTC(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate()));
}

/* ============ Types ============ */
type Post = {
  id: string;
  body: string | null;
  status: "draft"|"scheduled"|"published"|"failed"|string;
  scheduled_at: string | null;
  published_at?: string | null;
  created_at: string;
  channels?: string[] | null;
  image_url?: string | null;
  video_url?: string | null;
  doc_url?: string | null;
};

// Suggestion type (créneaux proposés)
type Suggestion = { iso: string; dateKey: string; label: string; networks: string[] };

const MONTHS = [
  { v: 1, label: "Janvier (01)" }, { v: 2, label: "Février (02)" },
  { v: 3, label: "Mars (03)" },    { v: 4, label: "Avril (04)" },
  { v: 5, label: "Mai (05)" },     { v: 6, label: "Juin (06)" },
  { v: 7, label: "Juillet (07)" }, { v: 8, label: "Août (08)" },
  { v: 9, label: "Septembre (09)"},{ v:10, label: "Octobre (10)" },
  { v:11, label: "Novembre (11)" },{ v:12, label: "Décembre (12)" },
];
// === Carousel carte blanche + chevrons (identique à Accueil) ===
const PostCarousel = ({ items, onItemClick }: { items: any[], onItemClick?: (p:any)=>void }) => {
  const isEmpty = !items || items.length === 0;
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

      <div className="d-carDots">
        {(isEmpty ? [0] : list).map((_, i) => (
          <span key={i} className={`d-dot${i === safeIdx ? " d-dot--active" : ""}`} />
        ))}
      </div>
    </div>
  );
};

/* ============ Page ============ */
export default function PlanningPage() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [anchor, setAnchor] = useState<Date>(new Date());

  // --- Réseaux "toujours visibles" + helpers ---
  const KNOWN_NETWORKS = ["X", "Instagram", "Facebook", "LinkedIn", "YouTube", "TikTok"];

  function normNet(name: string) { return name.trim().toLowerCase(); }
  function prettyNet(name: string) {
    const n = normNet(name);
    if (n.includes("facebook") || n === "fb") return "Facebook";
    if (n.includes("linkedin")) return "LinkedIn";
    if (n === "x" || n.includes("twitter")) return "X";
    if (n.includes("instagram") || n === "ig") return "Instagram";
    if (n.includes("youtube") || n === "yt") return "YouTube";
    if (n.includes("tiktok")) return "TikTok";
    return name;
  }

  function getConnectedNetworks(): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("connectedNetworks");
      if (!raw) return new Set();
      const arr = JSON.parse(raw) as string[];
      return new Set(arr.map(prettyNet));
    } catch { return new Set(); }
  }
  const CONNECTED = getConnectedNetworks();
  function isConnected(netName: string) { return CONNECTED.has(prettyNet(netName)); }

  function badgeStyleFor(name: string): CSSProperties {
    const n = normNet(name);
    if (n === "x" || n.includes("twitter"))  return { background: "#000000", border: "1px solid #FFFFFF" };
    if (n.includes("instagram"))             return { background: "linear-gradient(135deg, #E1306C, #F56040)" };
    if (n.includes("facebook"))              return { background: "#1877F2" };
    if (n.includes("linkedin"))              return { background: "linear-gradient(135deg, #0A66C2, #000000)" };
    if (n.includes("youtube"))               return { background: "#FF0000" };
    if (n.includes("tiktok"))                return { background: "linear-gradient(135deg, #69C9D0, #EE1D52)" };
    return { background: "#2b2b2b", border: "1px solid rgba(255,255,255,.24)" };
  }

  function renderNetIcon(name: string) {
    const n = normNet(name); const col = "#FFFFFF"; const size = 26;
    if (n === "x" || n.includes("twitter")) return <FaTwitter size={size} color={col} />;
    if (n.includes("instagram"))            return <FaInstagram size={size} color={col} />;
    if (n.includes("facebook"))             return <FaFacebookF size={size} color={col} />;
    if (n.includes("linkedin"))             return <FaLinkedinIn size={size} color={col} />;
    if (n.includes("youtube"))              return <FaYoutube size={size} color={col} />;
    if (n.includes("tiktok"))               return <FaTiktok size={size} color={col} />;
    return <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>{name.charAt(0).toUpperCase()}</span>;
  }

  // Période affichée + bornes ISO [start, end[
  const { start, end, label } = useMemo(() => {
    const s = startOfMonth(anchor);
    const e = endOfMonth(anchor);
    const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
    const lbl = `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    return { start: s, end: e, label: lbl };
  }, [anchor]);

  const { startISO, endISO } = useMemo(() => {
    const s = new Date(start); s.setHours(0,0,0,0);
    const e = new Date(end);   e.setHours(23,59,59,999);
    return { startISO: s.toISOString(), endISO: new Date(e.getTime()+1).toISOString() };
  }, [start, end]);

  // Données
  const [scheduled, setScheduled] = useState<Post[]>([]);
  const [published, setPublished] = useState<Post[]>([]);
  const [failed,    setFailed]    = useState<Post[]>([]);
  const [drafts,    setDrafts]    = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  // Filtres
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all"|"scheduled"|"published"|"failed"|"draft">("all");
  const [networks, setNetworks] = useState<Record<string, boolean>>({});
  const [netLayers, setNetLayers] = useState<Record<string, boolean>>({});
  const [audMode, setAudMode] = useState<'pro'|'divert'>('divert');

  const PALETTE = ["#10b981","#60a5fa","#f59e0b","#ef4444","#a855f7","#22d3ee","#84cc16","#fb7185","#eab308","#06b6d4"];
  function hashColor(name: string) {
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
  }
// Canonicalisation de noms de réseaux -> clés internes
function canonicalNet(name: string) {
  const n = normNet(name);
  if (n==='x' || n.includes('twitter')) return 'x';
  if (n.includes('instagram')) return 'instagram';
  if (n.includes('facebook')) return 'facebook';
  if (n.includes('linkedin')) return 'linkedin';
  if (n.includes('youtube')) return 'youtube';
  if (n.includes('tiktok')) return 'tiktok';
  return n;
}

// Couleurs pour les mini-icônes
const NET_COLORS: Record<string, string> = {
  facebook:  '#1877F2',
  instagram: '#E1306C',
  tiktok:    '#69C9D0',
  youtube:   '#FF0000',
  x:         '#FFFFFF', // on gère une bordure foncée en CSS
  linkedin:  '#0A66C2',
};

// Icônes (on réutilise react-icons déjà importés)
const NET_ICONS: Record<string, React.ComponentType<any>> = {
  facebook:  (props)=> <FaFacebookF {...props} />,
  instagram: (props)=> <FaInstagram {...props} />,
  tiktok:    (props)=> <FaTiktok {...props} />,
  youtube:   (props)=> <FaYoutube {...props} />,
  x:         (props)=> <FaTwitter {...props} />,  // X (Twitter)
  linkedin:  (props)=> <FaLinkedinIn {...props} />,
};

// Jours par mode
const DAYS_BY_MODE: Record<'pro'|'divert', number[]> = {
  pro:    [2, 3, 4],        // mardi, jeudi
  divert: [5, 6, 0],     // vendredi, samedi, dimanche
};

// Heures utilisées (2 lignes : 12:30 / 19:00)
type Hour = { h:number; m:number };
const HOURS_DEFAULT: Hour[] = [ {h:12,m:30}, {h:19,m:0} ];

  // Sélection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const clearSelection = () => setSelectedIds(new Set());

  // Navigation période
  const goPrev = () => { const d=new Date(anchor); d.setMonth(d.getMonth()-1); setAnchor(d); };
  const goNext = () => { const d=new Date(anchor); d.setMonth(d.getMonth()+1); setAnchor(d); };
  const goToday = () => setAnchor(new Date());

  // Chargement
  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null); clearSelection();

      // Workspace
      let ws: string | null = typeof window!=="undefined"
        ? (localStorage.getItem("currentWorkspaceId") || localStorage.getItem("workspace_id") || null)
        : null;

      if (!ws) {
        const { data, error } = await supabase.from("workspaces").select("id").order("created_at",{ascending:true}).limit(1).maybeSingle();
        if (error) { setErr(error.message); setLoading(false); return; }
        ws = data?.id ?? null;
        if (ws && typeof window!=="undefined") localStorage.setItem("currentWorkspaceId", ws);
      }
      if (!ws) { setScheduled([]); setPublished([]); setFailed([]); setDrafts([]); setLoading(false); return; }

      const posts = supabase.from("posts").select("*").eq("workspace_id", ws);
      const [sch, pub, fail, dr] = await Promise.all([
        posts.eq("status","scheduled").gte("scheduled_at", startISO).lt("scheduled_at", endISO).order("scheduled_at",{ascending:true}),
        posts.eq("status","published").gte("published_at", startISO).lt("published_at", endISO).order("published_at",{ascending:false}),
        posts.eq("status","failed").gte("created_at", startISO).lt("created_at", endISO).order("created_at",{ascending:false}),
        posts.eq("status","draft").gte("created_at", startISO).lt("created_at", endISO).order("created_at",{ascending:false}),
      ]);
      const anyErr = sch.error || pub.error || fail.error || dr.error;
      if (anyErr) { setErr(anyErr.message); setLoading(false); return; }

      setScheduled((sch.data as Post[])||[]);
      setPublished((pub.data as Post[])||[]);
      setFailed((fail.data as Post[])||[]);
      setDrafts((dr.data as Post[])||[]);
      setLoading(false);
    })();
  }, [startISO, endISO]);

  // Nouveaux états
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [chosenHour, setChosenHour] = useState("12:30");
  const SITE_TZ = "Europe/Paris";
  const RECO_SLOTS = new Set(["12:30", "19:00"]);

  const halfHourOptions = useMemo(() => {
    const out: string[] = [];
    for (let h = 0; h < 24; h++) {
      const hh = String(h).padStart(2, "0");
      out.push(`${hh}:00`);
      out.push(`${hh}:30`);
    }
    return out;
  }, []);

  function getParts(d: Date, tz = SITE_TZ) {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(d);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type === "year") map.y = Number(p.value);
      if (p.type === "month") map.m = Number(p.value);
      if (p.type === "day") map.d = Number(p.value);
      if (p.type === "hour") map.hh = Number(p.value);
      if (p.type === "minute") map.mm = Number(p.value);
    }
    return map as { y:number; m:number; d:number; hh:number; mm:number };
  }
  function cmpYMD(a:{y:number;m:number;d:number}, b:{y:number;m:number;d:number}) {
    if (a.y !== b.y) return a.y - b.y;
    if (a.m !== b.m) return a.m - b.m;
    return a.d - b.d;
  }
  function isPastDay(d: Date) {
    const now = getParts(new Date(), SITE_TZ);
    const dd  = getParts(d, SITE_TZ);
    return cmpYMD({ y: dd.y, m: dd.m, d: dd.d }, { y: now.y, m: now.m, d: now.d }) < 0;
  }
  function isPastSlotForSelectedDay(slotHHMM: string) {
    if (!selectedDay) return true;
    const now = getParts(new Date(), SITE_TZ);
    const sel = getParts(selectedDay, SITE_TZ);
    const dCmp = cmpYMD({y: sel.y, m: sel.m, d: sel.d}, {y: now.y, m: now.m, d: now.d});
    if (dCmp < 0) return true;
    if (dCmp > 0) return false;
    const [sh, sm] = slotHHMM.split(":").map(Number);
    if (sh < now.hh) return true;
    if (sh > now.hh) return false;
    return sm <= now.mm - 1;
  }

  const allNetworks = useMemo(() => KNOWN_NETWORKS, []);
  useEffect(() => {
    if (allNetworks.length && Object.keys(networks).length===0) {
      const init: Record<string, boolean> = {};
      allNetworks.forEach(n => init[n] = true);
      setNetworks(init);
    }
  }, [allNetworks]);

useEffect(() => {
  if (allNetworks.length && Object.keys(networks).length===0) {
    const init: Record<string, boolean> = {};
    allNetworks.forEach(n => {
      const connected = isConnected(n);
      init[n] = connected; // cochés si connecté, sinon décochés
    });
    setNetworks(init);
  }
}, [allNetworks]);

  const toggleNetwork = (name: string) => setNetworks(prev => ({ ...prev, [name]: !prev[name] }));

  const matchesFilters = (p: Post) => {
    if (status !== "all" && p.status !== status) return false;
    if (query) {
      const hay = `${p.body||""}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    const on = Object.entries(networks).filter(([,v])=>v).map(([k])=>k);
    if (on.length && p.channels?.length) {
      if (!p.channels.some(c => on.includes(c))) return false;
    }
    return true;
  };

  const calendarPosts = useMemo(() => {
    const pool = [...scheduled, ...published];
    return pool.filter(matchesFilters);
  }, [scheduled, published, status, query, networks]);

  function keyForDay(d: Date) { return toISODate(d); }
  function groupByDay(list: Post[]) {
    const map = new Map<string, Post[]>();
    list.forEach(p => {
      const when = p.scheduled_at || p.published_at || p.created_at;
      const d = new Date(when);
      const k = toISODate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    });
    return map;
  }
  const byDay = useMemo(()=>groupByDay(calendarPosts), [calendarPosts]);

  const byDayByNet = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    const base = [...scheduled, ...published];
    base.forEach(p => {
      const when = p.scheduled_at || p.published_at || p.created_at;
      if (!when) return;
      const d = new Date(when);
      const k = toISODate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      const chans = p.channels || [];
      if (!map.has(k)) map.set(k, {});
      const obj = map.get(k)!;
      chans.forEach(c => {
        const key = prettyNet(c);
        obj[key] = (obj[key] || 0) + 1;
      });
    });
    return map;
  }, [scheduled, published]);

  // ====== Module "Meilleure période daudience" ======
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
const slotKey = (iso:string, net?:string) => `${iso}__${(net||'all').toLowerCase()}`;
const timeOf  = (iso:string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function generateSuggestions(mode: 'pro'|'divert', nets: string[] = []) {
  const out: Suggestion[] = [];

  // Bornes du mois affiché
  const startD = new Date(start);
  const endD   = new Date(end);

  // Point de départ : aujourd’hui si le mois affiché == mois courant
  const now = new Date();
  const sameMonth =
    startD.getFullYear() === now.getFullYear() &&
    startD.getMonth()    === now.getMonth();
  const loopStart = new Date(
    sameMonth ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : startD
  );

  const netsCanon = nets.map(canonicalNet);
  for (let d = new Date(loopStart); d <= endD; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (!DAYS_BY_MODE[mode].includes(wd)) continue;

    for (const net of netsCanon) {
      for (const {h,m} of HOURS_DEFAULT) { // 2 lignes : 12:30 / 19:00
        const slot = new Date(d);
        slot.setHours(h, m, 0, 0);
        const iso = slot.toISOString();
        out.push({
          iso,
          dateKey: toISODate(slot),
          label: `${fmtNum(slot)} ${pad(slot.getHours())}:${pad(slot.getMinutes())}`,
          networks: [net], // 1 réseau par suggestion
        });
      }
    }
  }
  return out;
}
function regenSuggestions() {
  const chosenNets = Object.entries(networks)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const gen = generateSuggestions(audMode, chosenNets);
  setSuggestions(gen);
  // Par défaut : aucune case cochée
  setChecked(new Set());
}

  const suggestionsByDay = useMemo(() => {
    const map = new Map<string, Suggestion[]>();
    suggestions.forEach(s => {
      if (!map.has(s.dateKey)) map.set(s.dateKey, []);
      map.get(s.dateKey)!.push(s);
    });
    return map;
  }, [suggestions]);

const toggleCheck = (iso: string, net?: string) => setChecked(prev => {
  const k = slotKey(iso, net);
  const n = new Set(prev);
  n.has(k) ? n.delete(k) : n.add(k);
  return n;
});

const openAdvisor = () => {
  const chosenNets = Object.entries(networks).filter(([,v])=>v).map(([k])=>k);
  const gen = generateSuggestions(audMode, chosenNets);
  setSuggestions(gen);
  // Par défaut : aucune case cochée
  setChecked(new Set());
  setAdvisorOpen(true);
};
const closeAdvisor = () => {
  setAdvisorOpen(false);
  setSuggestions([]);      // vide la liste -> plus de pastilles/clignotements dans le calendrier
  setChecked(new Set());   // réinitialise la sélection
};

useEffect(() => {
  if (!advisorOpen) return;  // on ne régénère que tiroir ouvert
  regenSuggestions();        // bascule immédiate Pro/Divert + synchro liste
}, [audMode, networks, anchor, advisorOpen]);

const createDrafts = () => {
  // réseaux cochés (on canonise comme partout)
  const chosenNetworks = Object.entries(networks)
    .filter(([, v]) => v)
    .map(([k]) => canonicalNet(k));

  if (!selectedDay) { alert("Choisis une date."); return; }
  const h = chosenHour || "12:30";
  const [hh, mm] = h.split(":").map(Number);

  const dt = new Date(selectedDay);
  dt.setHours(hh, mm, 0, 0);

  // Un seul objet (ISO + réseaux)
  const payloadObj = [{ iso: dt.toISOString(), networks: chosenNetworks }];
  const payload = encodeURIComponent(JSON.stringify(payloadObj));

  window.location.href = `/posts?slots=${payload}`;
};


  // Grilles
  const monthCells = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const startCell = startOfWeek(first);
    return Array.from({length:42}).map((_,i)=>{ const d=new Date(startCell); d.setDate(startCell.getDate()+i); return d; });
  }, [anchor]);

  const weekDays = useMemo(() => {
    const s = startOfWeek(anchor);
    return Array.from({length:7}).map((_,i)=>{ const d=new Date(s); d.setDate(s.getDate()+i); return d; });
  }, [anchor]);

  // Preview modal (médias)
  const [preview, setPreview] = useState<Preview | null>(null);
  const openImage = (url: string) => setPreview({ kind:"image", url });
  const openVideo = (url: string) => setPreview({ kind:"video", url });
  const openDoc   = (url: string) => setPreview({ kind:"doc", url, isPdf: (()=>{ try{ return new URL(url).pathname.toLowerCase().endsWith(".pdf"); } catch { return url.toLowerCase().includes(".pdf"); }})() });
  const closePreview = () => setPreview(null);
  // ---- Modal "Consulter" par statut ----
type ModalKind = "scheduled" | "published" | "failed" | "draft";
const [activeModal, setActiveModal] = useState<{ kind: ModalKind; ids: string[] } | null>(null);

function getDateFor(p: Post, kind: ModalKind) {
  if (kind === "scheduled") return p.scheduled_at;
  if (kind === "published") return p.published_at ?? null;
  return p.created_at; // failed & draft
}

function openStatusModal(kind: ModalKind) {
  const base =
    kind === "scheduled" ? scheduled.filter(matchesFilters)
  : kind === "published" ? published.filter(matchesFilters)
  : kind === "failed"    ? failed.filter(matchesFilters)
  :                        drafts.filter(matchesFilters);

  // Si des cases sont cochées, on limite au sous-ensemble choisi
  const picked = selectedIds.size
    ? base.filter(p => selectedIds.has(p.id))
    : base;

  setActiveModal({ kind, ids: picked.map(p => p.id) });
}

function closeStatusModal() { setActiveModal(null); }

  // Sélecteurs date
  const yearOptions = useMemo(() => {
    const start = 2025, end = new Date().getFullYear(), max = Math.max(end, start);
    const out:number[]=[]; for (let y=max;y>=start;y--) out.push(y); return out;
  }, []);
  const currentYear  = anchor.getFullYear();
  const currentMonth = anchor.getMonth()+1;

  return (
    <section className="planning">
      <div className="container">
        {/* ======= Titre ======= */}
<header className="header">
  <h1>
    <span className="titlePlate">
      <span className="title">PLANNING</span>
      <span className="subtitle">: Planification des posts</span>
    </span>
  </h1>
</header>


        {/* ======= Grille principale : barre (col 1) + calendrier (col 1) + droite (col 2) ======= */}
        <div className="mainGrid">
<div className="leftCol">
          {/* BARRE EN COLONNE 1 */}
          <section className="card tone-green compact filtersCard inGrid">
            {/* Rangée du haut */}
            <div className="row topbar">
              <div className="ctrl">
                <div className="inline">
                  <select
                    className="control sm"
                    value={currentMonth}
                    onChange={(e)=>setAnchor(new Date(currentYear, Number(e.target.value)-1, 1))}
                  >
                    {MONTHS.map(m => <option key={m.v} value={m.v}>{m.label}</option>)}
                  </select>
                  <select
                    className="control sm year"
                    value={currentYear}
                    onChange={(e)=>setAnchor(new Date(Number(e.target.value), currentMonth-1, 1))}
                  >
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="ctrl nav">
                <button className="btn sm" onClick={goPrev}>« Préc.</button>
                <button className="btn sm" onClick={goToday}>Ce mois-ci</button>
                <button className="btn sm" onClick={goNext}>Suiv. »</button>
              </div>

              <div className="ctrl right">
                <button
                  className={
                    "btn accent ctaStandalone" +
                    (selectedDay && !isPastDay(selectedDay) ? " activePulse" : " disabled")
                  }
                  disabled={!selectedDay || (selectedDay && isPastDay(selectedDay))}
                  title={
                    selectedDay && isPastDay(selectedDay)
                      ? "Création indisponible sur une date passée"
                      : undefined
                  }
                  onClick={() => {
                    if (!selectedDay || isPastDay(selectedDay)) return;
                    if (!chosenHour) {
                      const prefer = ["12:30", "19:00"];
                      let pick = prefer.find(t => !isPastSlotForSelectedDay(t));
                      if (!pick) pick = halfHourOptions.find(t => !isPastSlotForSelectedDay(t)) || "12:30";
                      setChosenHour(pick);
                    }
                    setShowPopup(true);
                  }}
                >
                  Créer un post daprès une date calendaire
                </button>
              </div>
            </div>

            {/* Rangée du bas */}
            <div className="row filters">
              <div className="ctrl">
                <label>Statut</label>
                <select className="control" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
                  <option value="all">Tous</option>
                  <option value="scheduled">Programmés</option>
                  <option value="published">Publiés</option>
                  <option value="failed">checs</option>
                  <option value="draft">Brouillons</option>
                </select>
              </div>
              <div className="ctrl grow">
                <input className="control w100" placeholder="Rechercher (texte du post)..." value={query} onChange={(e)=>setQuery(e.target.value)} />
              </div>
            </div>
          </section>

          {/* CALENDRIER  colonne 1, sous la barre */}
          <section className="card tone-green calendar">
            {err && <p className="empty error">Erreur : {err}</p>}
            {loading && !err && <p className="empty">Chargement</p>}

            {!loading && !err && (
              <>
                <div className="dow">
                  {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d=>(
                    <div key={d} className="dowCell">{d}</div>
                  ))}
                </div>

                <div className="grid">
{monthCells.map((d, idx) => {
  const k = keyForDay(d);
  const items = byDay.get(k) || [];
  const isOtherMonth = d.getMonth() !== anchor.getMonth();
  const suggs = suggestionsByDay.get(k) || [];
  const isToday = d.toDateString() === new Date().toDateString();
  const isPast = isPastDay(d);
  const isFuture = !isPast; //  ajout
  return (
    <div
      key={idx}
      className={
        "cell" +
        (isOtherMonth ? " dim" : "") +
        (isToday ? " today" : "") +
        (isPast ? " past" : "") +
        (isFuture ? " future" : "") + //  ajout
        (selectedDay?.toDateString() === d.toDateString() ? " selected" : "")
      }
      title={isPast ? "Jour passé : consultation seulement" : undefined}
      onClick={() => setSelectedDay(d)}
    >

                        <div className="cellHead">
                          <span className="num">{d.getDate()}</span>
                          {items.length>0 && <span className="badge accent">{items.length}</span>}
                        </div>

                        {/* Suggestions */}
{suggs.length>0 && (
  <div className="slotRow">
    {/* LIGNE 1 : 12:30 */}
    <div className="slotLine">
      {suggs.filter(s => timeOf(s.iso)==='12:30').map(s => {
        const net = canonicalNet(s.networks?.[0]||'');
        const Icon = NET_ICONS[net];
        if (!Icon) return null;
        const k = slotKey(s.iso, net);
        const active = checked.has(k);
        return (
          <button
            key={k}
            type="button"
            className={"netIcon net-"+net + (active ? " is-active" : "")}
            title={`${prettyNet(net)} • 12:30`}
            onClick={()=>toggleCheck(s.iso, net)}
            aria-pressed={active}
          >
            <Icon size={12} color={NET_COLORS[net]}/>
            <span className="halo" aria-hidden/>
          </button>
        );
      })}
    </div>

    {/* LIGNE 2 : 19:00 */}
    <div className="slotLine">
      {suggs.filter(s => timeOf(s.iso)==='19:00').map(s => {
        const net = canonicalNet(s.networks?.[0]||'');
        const Icon = NET_ICONS[net];
        if (!Icon) return null;
        const k = slotKey(s.iso, net);
        const active = checked.has(k);
        return (
          <button
            key={k}
            type="button"
            className={"netIcon net-"+net + (active ? " is-active" : "")}
            title={`${prettyNet(net)} • 19:00`}
            onClick={()=>toggleCheck(s.iso, net)}
            aria-pressed={active}
          >
            <Icon size={12} color={NET_COLORS[net]}/>
            <span className="halo" aria-hidden/>
          </button>
        );
      })}
    </div>
  </div>
)}


                        {/* Pastilles réseaux */}
                        {(() => {
                          const netCounts = byDayByNet.get(k) || {};
                          const visibles = Object.entries(netCounts).filter(([name]) => netLayers[name]);
                          if (!visibles.length) return null;
                          return (
                            <div className="netDotsRow" title="Publications par réseau (pastilles)">
                              {visibles.slice(0, 10).map(([name, count]) => (
                                <span
                                  key={name}
                                  className="netDot"
                                  style={{ background: hashColor(name) }}
                                  title={`${name} : ${count} publication(s)`}
                                />
                              ))}
                              {visibles.length > 10 && <span className="suggMore">+{visibles.length - 10}</span>}
                            </div>
                          );
                        })()}

                        <ul className="miniList">
                          {items.slice(0,3).map(p=>(
                            <li key={p.id} className="miniItem">
                              <span className={"status s-"+p.status} />
                              <span className="miniText">{(p.body||"").slice(0,54) || "(Sans texte)"}</span>
                            </li>
                          ))}
                          {items.length>3 && <li className="miniMore">+{items.length-3} de plus</li>}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
</div>

          {/* COLONNE DROITE  remonte en face de la barre */}
          <div className="rightCol">
            <aside className="sidePanel">
              <div className="listsCol">
<div className="block">
  <div className="blockHead">
    <strong>Programmés</strong>
  </div>

  <div className="p-split">
    <div className="p-left">
      <div className="p-leftBox">
        <p className="p-num">{scheduled.filter(matchesFilters).length}</p>
      </div>

      <button
        className="btn accent ctaStandalone mini p-consult"
        onClick={()=>openStatusModal("scheduled")}
      >
        Consulter
      </button>
    </div>

    <div className="p-right">
      <PostCarousel items={scheduled.filter(matchesFilters)} />
    </div>
  </div>
</div>

<div className="block">
  <div className="blockHead">
    <strong>Publiés</strong>
  </div>

  <div className="p-split">
    <div className="p-left">
      <div className="p-leftBox">
        <p className="p-num">{published.filter(matchesFilters).length}</p>
      </div>
      <button
        className="btn accent ctaStandalone mini p-consult"
        onClick={()=>openStatusModal("published")}
      >
        Consulter
      </button>
    </div>

    <div className="p-right">
      <PostCarousel items={published.filter(matchesFilters)} />
    </div>
  </div>
</div>

<div className="block">
  <div className="blockHead">
    <strong>Echecs</strong>
  </div>

  <div className="p-split">
    <div className="p-left">
      <div className="p-leftBox">
        <p className="p-num">{failed.filter(matchesFilters).length}</p>
      </div>
      <button
        className="btn accent ctaStandalone mini p-consult"
        onClick={()=>openStatusModal("failed")}
      >
        Consulter
      </button>
    </div>

    <div className="p-right">
      <PostCarousel items={failed.filter(matchesFilters)} />
    </div>
  </div>
</div>

<div className="block">
  <div className="blockHead">
    <strong>Brouillons</strong>
  </div>

  <div className="p-split">
    <div className="p-left">
      <div className="p-leftBox">
        <p className="p-num">{drafts.filter(matchesFilters).length}</p>
      </div>
      <button
        className="btn accent ctaStandalone mini p-consult"
        onClick={()=>openStatusModal("draft")}
      >
        Consulter
      </button>
    </div>

    <div className="p-right">
      <PostCarousel items={drafts.filter(matchesFilters)} />
    </div>
  </div>
</div>

              </div>
            </aside>

            {/* Encadrés 50/50 */}
            <div className="microGrid">

<section className="card tone-green successCard">
  <div className="blockHead successHead">
    <ThumbsUp size={130} />
  </div>

                <div className="center">
                  <button
                    className="btn accent ctaStandalone"
                    onClick={() => alert("Ouverture du module Publications   succès (  implémenter)")}
                  >
                    Voir vos posts les plus performants en cliquant ici
                  </button>
                </div>
              </section>

              <section className="card tone-green advisorCard">
                <div className="blockHead advisorHead">
                  <CalendarClock size={130} />
                </div>

                <div className="center">
                  <button className="btn accent ctaStandalone" onClick={openAdvisor}>
                    Voir les créneaux pour publier à la meilleure période
                  </button>
                </div>

              </section>
            </div>

            <section className="card tone-green netLegendCard">
              <div className="blockHead">
                <strong>Voir vos publications planifiées selon les réseaux</strong>
              </div>

              <ul className="legendList">
                {allNetworks.map((n) => {
                  const connected = isConnected(n);
                  return (
                    <li key={n} className={"legendItem" + (connected ? "" : " disabled")}>
                      <span className="legendBadge" style={badgeStyleFor(n)} title={n} aria-label={n}>
                        {renderNetIcon(n)}
                      </span>

                      <span className="legendName" data-net={n}>{n}</span>

                      <label className="legendToggle" title={connected ? "Afficher/masquer sur le calendrier" : "Réseau non connecté"}>
                        <input
                          type="checkbox"
                          disabled={!connected}
                          checked={connected && !!netLayers[n]}
                          onChange={() => {
                            if (!connected) return;
                            setNetLayers(prev => ({ ...prev, [n]: !prev[n] }));
                          }}
                        />
                        <span>{connected ? "Afficher" : "Non connecté"}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>

        {/* ===== Preview média ===== */}
        {preview && (
          <div className="modalBackdrop" onClick={closePreview}>
            <div className="modalBody createModal small" onClick={(e)=>e.stopPropagation()}>
              <button className="modalClose" onClick={closePreview} aria-label="Fermer"></button>
              {preview.kind==="image" && (<img src={preview.url} alt="aperçu image" className="modalMedia" />)}
              {preview.kind==="video" && (<video src={preview.url} className="modalMedia" controls autoPlay />)}
              {preview.kind==="doc" && (preview.isPdf
                ? <iframe className="modalIframe" src={preview.url} title="aperçu document PDF" />
                : <div className="docBox"><p>Document :</p><a href={preview.url} target="_blank" rel="noreferrer" className="btn">Ouvrir</a></div>
              )}
            </div>
          </div>
        )}
{/* ===== Modal "Consulter" (par statut) ===== */}
{activeModal && (
  <div className="modalBackdrop" onClick={closeStatusModal}>
    <div className="modalBody createModal small card tone-green consultModal" onClick={(e)=>e.stopPropagation()}>
      <button className="modalClose xBtn" onClick={closeStatusModal} aria-label="Fermer">
        <X size={18} aria-hidden="true" />
      </button>
      <h2 style={{marginTop:0}}>
        {activeModal.kind === "scheduled" && "Posts programmés"}
        {activeModal.kind === "published" && "Posts publiés"}
        {activeModal.kind === "failed"    && "Échecs de publication"}
        {activeModal.kind === "draft"     && "Brouillons"}
      </h2>

      <ul style={{listStyle:"none",margin:0,padding:0, display:"flex", flexDirection:"column", gap:12}}>
        {activeModal.ids.map(id => {
          const p =
            scheduled.find(x=>x.id===id) ||
            published.find(x=>x.id===id) ||
            failed.find(x=>x.id===id)    ||
            drafts.find(x=>x.id===id);
          if (!p) return null;

          const dateStr = getDateFor(p, activeModal.kind);
          const intent =
            activeModal.kind === "scheduled" ? "edit" :
            activeModal.kind === "published" ? "repost" :
            activeModal.kind === "failed"    ? "fix" :
                                               "schedule";

          const href = `/posts?from=${p.id}&intent=${intent}`;

          return (
            <li key={p.id} style={{display:"grid", gridTemplateColumns:"72px 1fr auto", gap:10, alignItems:"center"}}>
              {/* Miniature */}
              <div>
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt=""
                    style={{width:72,height:72,objectFit:"cover",borderRadius:8,cursor:"pointer"}}
                    onClick={()=>setPreview({kind:"image", url:p.image_url!})}
                  />
                ) : p.video_url ? (
                  <video
                    src={p.video_url}
                    style={{width:72,height:72,objectFit:"cover",borderRadius:8,cursor:"pointer"}}
                    onClick={()=>setPreview({kind:"video", url:p.video_url!})}
                  />
                ) : p.doc_url ? (
                  <a className="btn small" href={p.doc_url} target="_blank" rel="noreferrer">Doc</a>
                ) : (
                  <div style={{width:72,height:72,borderRadius:8,background:"#111",display:"grid",placeItems:"center",opacity:.6}}><span>—</span></div>
                )}
              </div>

              {/* Texte + date */}
              <div style={{minWidth:0}}>
                <div style={{whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{p.body || <i>(Sans texte)</i>}</div>
                <div style={{opacity:.8, marginTop:4,fontSize:14}}>
                  {dateStr ? `Date : ${fmtNum(new Date(dateStr))}` : ""}
                </div>

                {/* Placeholder raisons d’échec (aucun champ dédié dans ton type Post) */}
                {activeModal.kind==="failed" && (
                  <div style={{marginTop:6, fontSize:14, opacity:.9}}>
                    <strong>Raisons :</strong> <em>(Aucun détail stocké pour l’instant)</em>
                  </div>
                )}
              </div>

              {/* Action */}
              <div>
                {activeModal.kind === "scheduled" && <Link href={href} className="btn small">Modifier</Link>}
                {activeModal.kind === "published" && <Link href={href} className="btn small">Re-publier</Link>}
                {activeModal.kind === "failed"    && <Link href={href} className="btn small">Modifier</Link>}
                {activeModal.kind === "draft"     && <Link href={href} className="btn small">Programmer</Link>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  </div>
)}

        {/* ===== Modal latéral  Meilleure période ===== */}
        {advisorOpen && (
<div className="drawerBackdrop" onClick={closeAdvisor}>
            <aside className="drawer" onClick={(e)=>e.stopPropagation()} aria-label="Meilleure période daudience">
              <div className="drawerHead">
                <div style={{display:"flex",alignItems:"center",gap:8}}><Target size={18}/><strong>Meilleure période daudience</strong></div>
<button className="modalClose" onClick={closeAdvisor} aria-label="Fermer"></button>
              </div>
<div className="modeRow">
  <button
    type="button"
    onClick={()=>setAudMode('pro')}
    className={"btn modeBtn" + (audMode==='pro' ? " active" : "")}
    aria-pressed={audMode==='pro'}
    title="Contenu professionnel"
  >
    Entreprise
  </button>

  <button
    type="button"
    onClick={()=>setAudMode('divert')}
    className={"btn modeBtn" + (audMode==='divert' ? " active" : "")}
    aria-pressed={audMode==='divert'}
    title="Divertissement / grand public"
  >
    Grand public
  </button>
</div>

<div className="hr"/>

{/* --- Encadré : Sélection des réseaux --- */}
<div className="drawerBody">
  <label className="lbl">Afficher les créneaux pour :</label>

  <ul className="netPickList">
    {allNetworks.map((n) => {
      const connected = isConnected(n);
      const checked = !!networks[n];

      return (
<li key={n} data-net={n} className={"netPickItem" + (connected ? "" : " disabled")} title={connected ? n : "Connecter ce réseau pour l’utiliser"}>
<span
  className={
    "netPickBadge" +
    (connected && checked ? " active" : "")
  }
  aria-label={n}
>
  {renderNetIcon(n)}
</span>


          {/* Icône seule : pas de nom de réseau, comme demandé */}

          <label className="netPickCheck" aria-label={connected ? `Inclure ${n}` : `Non connecté : ${n}`}>
            <input
              type="checkbox"
              disabled={!connected}
              checked={connected && checked}
              onChange={() => {
                if (!connected) return;
                toggleNetwork(n);
              }}
            />
            <span className="checkFake" aria-hidden="true" />
          </label>
        </li>
      );
    })}
  </ul>
</div>
<div className="hr"/>

              <div className="drawerBody">
{/* --- Nouveau : Choisir la date --- */}
<div className="drawerBody">
  <label className="lbl">Choisir la date</label>
  <div className="pickBlock">
    <div className="pickIcon"><CalendarDays size={42} /></div>

    {/* Jours disponibles = jours présents dans suggestionsByDay */}
    <div className="pickGrid">
      {Array.from(suggestionsByDay.keys()).sort().map((dk) => {
        const d = new Date(dk);
        const isActive = selectedDay && toISODate(selectedDay) === dk;
        const disabled = isPastDay(d);
        return (
          <button
            key={dk}
            type="button"
            className={"pickDay" + (isActive ? " active" : "")}
            disabled={disabled}
            title={fmtNum(d)}
            onClick={() => setSelectedDay(d)}
          >
            <span className="dayNum">{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  </div>

  <div className="hr" />
  <div className="hr" />

  {/* --- Nouveau : Choisir l’heure --- */}
  <label className="lbl">Choisir l'heure</label>
  <div className="pickBlock">
    <div className="pickIcon"><Clock size={42} /></div>
    <div className="hourRow">
      {["12:30", "19:00"].map((h) => {
        const disabled = isPastSlotForSelectedDay(h);
        const active = chosenHour === h;
        return (
          <button
            key={h}
            type="button"
            className={"hourBtn" + (active ? " active" : "")}
            disabled={disabled}
            onClick={() => setChosenHour(h)}
            title={disabled ? "Créneau passé pour ce jour" : `Choisir ${h}`}
          >
            {h}
          </button>
        );
      })}
    </div>
  </div>
</div>

              </div>

<div className="drawerFoot">
  <button
    className="btn accent ctaStandalone"
    style={{ width: "100%" }}
    onClick={createDrafts}
  >
    Basculer vers la création de votre post
  </button>
</div>

            </aside>
          </div>
        )}
      </div>

      {/* ============ Styles ============ */}
      <style jsx>{`
.planning {
  --car-h: 150px;
  color-scheme: dark;

  /* Voile global + dégradé bas (PRO C) */
  background-image:
    linear-gradient(
      to bottom,
      rgba(0,0,0,0.25) 0%,
      rgba(0,0,0,0.25) 40%,
      rgba(0,0,0,0.7) 70%,
      #000 100%
    ),
    url("/background/vert.jpg");
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  background-size: cover, cover;
  background-attachment: fixed, fixed;

  /* fallback si image absente */
  background-color: #1C1C1C;

  color: var(--text, #e6e8ec);
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  /* Palette et rythme global */
  --accent-green: #059669;
  --border: var(--accent-green);
  --card-bg: #011610;

  /* Rythme + colonnes synchronisées */
  --gap: 12px;
  --gap-lg: 16px;
  --pad: 14px;
  --colA: 1.6fr; /* colonne calendrier / barre de tri */
  --colB: 1fr;   /* colonne droite */
  --right-nudge-y: -6px;

}.container {
  width: 100%;
  max-width: none;      /* ← annule un éventuel .container global */
  margin: 0;            /* ← évite le recentrage contraint */
  padding: 16px 24px 44px;
  flex: 1 1 auto;       /* ← s’étend correctement dans .planning (flex) */
}

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
        .header .title { color: var(--accent-green); font-weight: 900; }

        .card {
          position: relative;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: var(--pad);
          min-width: 0;
        }
        .tone-green::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 14px;
          pointer-events: none;
          box-shadow: inset 0 0 0 2px var(--border);
        }

        /* Colonnes alignées haut/bas (mêmes fractions et même gap) */
        /* .topRow supprimée (inutile) */
        .mainGrid { display: grid; grid-template-columns: minmax(0, var(--colA)) minmax(0, var(--colB)); gap: var(--gap-lg); align-items: start; }
        .mainGrid > * { align-self: start; }
        @media (max-width: 1120px) { .mainGrid { grid-template-columns: 1fr; } }

        .row { display: flex; gap: var(--gap); align-items: center; flex-wrap: wrap; }
        .row.end { justify-content: flex-end; }
        .filters { margin-top: var(--gap); }
        .ctrl { display: flex; gap: 8px; align-items: center; }
        .ctrl.grow { flex: 1 1 auto; }
        .ctrl.right { margin-left: auto; }
        .inline { display: inline-flex; gap: 8px; }
        .range { opacity: .9; }

.control {
  padding: 8px 10px;
  border: 1px solid #d1d5db;  /* gris clair adapté au fond blanc */
  border-radius: 10px;
  background: #ffffff;        /*  fond blanc */
  color: #111827;             /* texte sombre */
  outline: none;
  font-size: 18px;
}

        .control.w100 { width: 100%; }
        .control.year { width: 120px; }

        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,.18); background: #1f2937; color: #f9fafb; text-decoration: none; cursor: pointer; }
        .btn.small { font-size: 13px; padding: 6px 10px; }
        .btn.danger { background: #dc2626; border-color: #dc2626; color: #fff; }

        /* Calendrier */
        .calendar { padding: 12px; }
        .empty { opacity: .9; text-align: center; margin: 6px 0 10px; }
	.block .empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
}

        .empty.error { color: #ef4444; }

        .dow { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin: 0 0 8px; }
        .dowCell { text-align: center; font-weight: 700; font-size: 20px; opacity: .9; padding: 6px 0; border-radius: 8px; background: rgba(255,255,255,0.06); }

        .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .cell { min-height: 120px; border: 1px solid #059669; border-radius: 10px; padding: 8px; background: rgba(255,255,255,0.03); cursor: pointer; }
        .cell.dim { opacity: .15; }
        .cellHead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .cellHead .num { font-weight: 600; font-size: 20px; }
        .badge { display: inline-flex; align-items: center; justify-content: center; font-size: 18px; padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,.22); }
        .badge.accent { border-color: var(--accent-green); color: var(--accent-green); background: transparent; }

        .miniList { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .miniItem { display: flex; gap: 8px; align-items: center; font-size: 13px; }
        .miniText { opacity: .95; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .miniMore, .miniEmpty { opacity: .8; font-style: italic; }

        /* Colonne droite homogénéisée et positionnée en colonne 2 */
        .rightCol { display: flex; flex-direction: column; gap: var(--gap); grid-column: 2 / 3; grid-row: 1; align-self: start; }
        .rightCol > .card:first-child { margin-top: 0; }
        @media (max-width: 1120px) { .rightCol { grid-column: 1 / -1; grid-row: auto; } }

        .listsCol {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 2 colonnes */
  gap: var(--gap-lg);             /* espace entre les cartes */
  max-height: none;               /* retire la contrainte de hauteur */
  overflow: visible;
  padding-right: 0;
}

.block {
  border: 3px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  background: var(--card-bg);  /* même plaque sombre que le reste */
  color: #e6e8ec;
  font-size: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 260px;
  overflow: hidden;
}

        .blockHead { display: flex; align-items: center; justify-content: space-between; }
        .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.item {
  width: 100%;
  border: 1px solid rgba(0,0,0,.14);
  border-radius: 12px;
  padding: 10px;
  background: #ffffff;  /*  Fond blanc */
  display: flex;
  flex-direction: column;
  gap: 8px;
}

        .nets { display: flex; gap: 8px; flex-wrap: wrap; }
        .netPill { display: inline-flex; gap: 6px; align-items: center; border: 1px solid rgba(255,255,255,.14); border-radius: 999px; padding: 6px 10px; background: #0f0f0f; color: #f9fafb; cursor: pointer; user-select: none; }
        .netPill input { display: none; }
        .netPill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-green); display: inline-block; }
        .netPill.on { border-color: var(--accent-green); box-shadow: 0 0 0 1px var(--accent-green) inset; }

        .status { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .status.s-scheduled { background: var(--accent-green); }
        .status.s-published { background: #60a5fa; }
        .status.s-failed    { background: #ef4444; }
        .status.s-draft     { background: #9ca3af; }

        /* Suggestions calendrier */
        .suggRow { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .suggDot { width: 10px; height: 10px; border-radius: 50%; background: #9b87f5; border: 0; cursor: pointer; animation: pulse 1.6s infinite; outline: 0; }
        .suggDot.on { box-shadow: 0 0 0 2px #9b87f5aa; }
        .suggMore { font-size: 12px; opacity: .7; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(155,135,245,0.6); }
          70% { box-shadow: 0 0 0 8px rgba(155,135,245,0); }
          100% { box-shadow: 0 0 0 0 rgba(155,135,245,0); }
        }
/* Mini-icônes réseau (2 lignes) — AJOUT */
.slotRow { display:flex; flex-direction:column; gap:4px; margin: 4px 0; }
.slotLine { display:flex; gap:6px; flex-wrap:wrap; }

.netIcon {
  position: relative;
  width:18px; height:18px;
  display:inline-flex; align-items:center; justify-content:center;
  border-radius:999px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.18);
  outline: none;
  cursor: pointer;
}
.netIcon.is-active { box-shadow: 0 0 0 2px rgba(255,255,255,0.18); }

.netIcon .halo {
  position:absolute; inset:-2px;
  border-radius:999px;
  box-shadow: 0 0 0 0 rgba(255,255,255,0.0);
  animation: haloPulse 1.8s ease-in-out infinite;
}
@keyframes haloPulse {
  0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.0); }
  50%{ box-shadow: 0 0 8px 2px rgba(255,255,255,0.25); }
  100%{ box-shadow: 0 0 0 0 rgba(255,255,255,0.0); }
}

/* Lisibilité de X en dark mode */
.net-x { border-color:#222; background:#111; }

        /* Micro-encadrés 50/50 */
        .microGrid { display: flex; gap: var(--gap); }
        .successCard, .advisorCard {
          width: 50%;
          min-height: 190px;
          display: flex;
          flex-direction: column;
        }
.successCard > .center,
.advisorCard > .blockHead + .center {
  margin-top: 21px; /* au lieu de auto */
}

        .advisorCard > .center.mt-sm { margin-top: 8px; padding-bottom: 12px; }

        @media (max-width: 1120px) {
          .microGrid { flex-direction: column; }
          .successCard, .advisorCard { width: 100%; }
        }

        .center { text-align: center; }
        .mt-sm { margin-top: 8px; }

        /* Drawer */
        .drawerBackdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 60; display: flex; justify-content: flex-end; }
        .drawer {
          width: min(420px, 95vw);
          max-height: 700px;
          background: #1C1C1C;
          border-left: 1px solid rgba(255,255,255,.18);
          padding: 12px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .drawerHead { display: flex; align-items: center; justify-content: space-between; }
        .drawerBody { display: flex; flex-direction: column; gap: 10px; overflow: auto; }
        .drawerFoot { margin-top: auto; display: flex; justify-content: flex-end; }
        .lbl { font-size: 18px; opacity: .9; margin-bottom: 4px; display: block; }
        .hr { height: 1px; background: rgba(255,255,255,.14); margin: 8px 0; }
        .suggList { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 730px; overflow: auto; }
        .suggCheck { display: flex; align-items: center; gap: 8px; }

/* === Boutons Pro / Divertissement (50/50) === */
.drawer .modeRow {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 50/50 */
  gap: 10px;
}

/* Réglages centralisés : largeur, hauteur, police, padding */
.drawer .modeBtn {
  width: 100%;
  min-height: 48px;        /* ← hauteur du bouton */
  padding: 12px 14px;      /* ← épaisseur du bouton */
  font-size: 18px;         /* ← taille de police à l’intérieur */
  font-weight: 800;
  border-radius: 12px;
  text-transform: none;
}

/* États visuels (garde ton vert d'accent) */
.drawer .modeBtn.active {
  background: var(--accent-green);
  border-color: var(--accent-green);
  color: #ffffff;
}

        /* Modale média */
        .modalBackdrop { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
        .modalBody { position: relative; width: min(100%, 500px); max-height: 90vh; background: #1C1C1C; border-radius: 14px; padding: 14px; overflow: auto; border: 1px solid rgba(255,255,255,.18); }
        .modalClose { border: 0; background: #111827; color: #e5e7eb; border-radius: 8px; padding: 6px 10px; cursor: pointer; }
        .modalClose { position: absolute; top: 8px; right: 8px; }
        .modalMedia { display: block; width: 100%; height: auto; border-radius: 10px; }
        .modalIframe { width: 100%; height: 80vh; border: 0; border-radius: 10px; }

        /* ---- Compact bar (existant) ---- */
        .card.compact { padding: 12px; }
        .card.compact .row { gap: 12px; }
        .card.compact .topbar { gap: 12px; padding: 10px 0; }
        .card.compact .control.sm { padding: 8px 10px; font-size: 18px; line-height: 1.2; }
        .card.compact .btn.sm { padding: 8px 10px; font-size: 18px; line-height: 1.2; }
        .card.compact .filters { margin-top: var(--gap); padding-bottom: 10px; }
        .range.small { opacity: .7; font-size: 18px; }

        /* Bouton accent harmonisé */
        :global(.btn.accent.ctaStandalone) {
          background: #023a27;
          border-color: var(--accent-green);
          color: #ffffff;
          font-weight: 700;
          font-size: 17px;
          padding: 10px 18px;
          white-space: normal;
          text-align: center;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }
        :global(a.btn.accent.ctaStandalone:hover) { filter: brightness(1.05); }

        @keyframes pulseBtn {
          0% { box-shadow: 0 0 0 0 rgba(5,150,105,0.7); }
          70% { box-shadow: 0 0 0 12px rgba(5,150,105,0); }
          100% { box-shadow: 0 0 0 0 rgba(5,150,105,0); }
        }
        .btn.disabled { opacity: 0.5; cursor: not-allowed; }
        .btn.activePulse { animation: pulseBtn 1.2s infinite; }

        /* Sélections / états calendrier */
        .cell.today {
          outline: 2px solid var(--accent-green, #10b981);
          background: rgba(16,185,129,.06);
          outline-offset: -2px;
          border-radius: 10px;
        }
.cell.selected {
  outline: 3px solid #00ffb3;                   /* vert pur et lumineux */
  outline-offset: -2px;

  /* 🌟 fond intensément clair et saturé */
  background: linear-gradient(
    135deg,
    rgba(0,255,179,0.85),
    rgba(0,200,130,0.85)
  );
  background-color: rgba(255,255,255,0.18);     /* éclaire le fond */
  background-blend-mode: screen;                /* fusionne le blanc et le vert */

  box-shadow:
    0 0 20px rgba(0,255,179,0.9),               /* halo externe fort */
    inset 0 0 12px rgba(255,255,255,0.25);      /* légère lueur interne blanche */

  transition: none;
}
.cell.selected .num {
  color: #ffffff;
  font-weight: 900;
  text-shadow:
    0 0 12px rgba(255,255,255,0.95),
    0 0 24px rgba(0,255,179,0.9);
}
        .cell.past { opacity: .40; background: rgba(0,0,0,0.2); }
        .cell.past .cellHead .num::after { content: " "; font-size: 18px; opacity: .9; }

        /* Pastilles réseaux */
        .netDotsRow { display: flex; align-items: center; gap: 6px; margin: 4px 0 2px; flex-wrap: wrap; }
        .netDot { width: 8px; height: 8px; border-radius: 50%; border: 1px solid rgba(255,255,255,.25); }

        /* Légende réseaux */
        .netLegendCard { }
	.netLegendCard .blockHead strong {
  font-size: 18px;      /*  plus gros titre */
  font-weight: 700;
  margin-bottom: 14px;  /*  espace supplémentaire avec les cartes en dessous */
  display: block;       /*  pour que le margin-bottom sapplique */
}
        .legendList { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--gap) var(--gap-lg); }
        .legendItem { display: flex; align-items: center; gap: 12px; border: 1px solid #059669; border-radius: 10px; padding: 8px; background: #0f0f0f; }
        .legendItem.disabled { opacity: .5; }
        .legendName { flex: 1; opacity: .95; font-size: 18px; }
        .legendToggle { display: inline-flex; align-items: center; gap: 8px; }
	.legendToggle span { font-size: 18px; }
        .legendToggle input { width: 25px; height: 25px; }
        .legendToggle input:disabled { cursor: not-allowed; }
        .legendBadge { width: 45.5px; height: 45.5px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.24); box-shadow: 0 1px 0 rgba(0,0,0,.25) inset; flex-shrink: 0; }

        /* Popup créer */
        .createModal { background: #0f0f0f; max-width: 480px; width: 100%; }
        .createModal.small { padding: 16px; }
        .createModal h2 { font-size: 18px; margin: 0 0 8px 0; }
        .createModal .lbl.big { font-size: 16px; font-weight: 700; margin: 8px 0 6px 0; }
        .createModal .control.bigSelect { font-size: 18px; line-height: 1.35; padding: 10px 12px; }

        .successHead .titleWrap strong,
        .advisorHead .titleWrap strong {
          font-size: 20px;
          font-weight: 800;
          text-align: center;
          display: block;
          line-height: 1.3;
	  max-width: fit-content;
        }

        .filters label {
          font-size: 18px;
          font-weight: 600;
        }

.leftCol {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
  grid-column: 1 / 2; /* Colonne de gauche */
}

input[type="checkbox"] {
  appearance: none;         /* on neutralise le style par défaut */
  width: 16px;
  height: 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #ffffff;      /*  fond blanc */
  cursor: pointer;
}

/* garde le style de base, on ajoute juste position pour le pseudo-élément */
input[type="checkbox"] {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #ffffff;      /* fond blanc, y compris quand coché */
  cursor: pointer;
  position: relative;       /* ← nécessaire pour ::after */
}

/* par défaut, rien à l’intérieur */
input[type="checkbox"]::after {
  content: "";
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 13px;
  line-height: 1;
  color: #059669;           /* couleur du symbole */
  font-weight: 900;
}

/* quand coché : on NE remplit plus en vert, on garde fond blanc */
input[type="checkbox"]:checked {
  border-color: #059669;    /* juste la bordure en vert */
}

/* …et on affiche un petit V (✓). Remplace par "×" si tu préfères une croix. */
input[type="checkbox"]:checked::after {
  content: "✓";             /* ou "×" */
}


.legendName[data-net="X"]::after {
  content: " (Twitter)";
  margin-left: 4px;
  opacity: .9;
  font-weight: 500;
}

.cell.future {
  background: rgba(16,185,129,0.12); /* vert clair translucide */
  box-shadow: 0 0 8px rgba(16,185,129,0.5); /* halo vert */
}
.cell.future .num {
  color: #10b981; /* accentue le chiffre */
  font-weight: 700;
}

.cell.today .num {
  color: #ffffff;   /* blanc vif */
  font-weight: 800; /* plus épais */
  text-shadow: 0 0 20px rgba(16,185,129,9); /* halo vert lumineux */
}
/* Assure que 'selected' gagne sur 'future' et 'today' */
.cell.future.selected,
.cell.today.selected {
  background: linear-gradient(
    135deg,
    rgba(0,255,179,0.85),
    rgba(0,200,130,0.85)
  );
  background-color: rgba(255,255,255,0.18);
  background-blend-mode: screen;
  box-shadow:
    0 0 20px rgba(0,255,179,0.9),
    inset 0 0 12px rgba(255,255,255,0.25);
}

:global(.btn.accent.ctaStandalone.mini) {
  font-size: 15px;
  padding: 6px 12px;
  min-height: 32px;   /* plus compact que 44px */
}

/* Plaque blanche translucide sous l’intitulé */
.titlePlate {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.55);  /* transparence lisible */
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 14px;                 
  box-shadow: 0 4px 18px rgba(0,0,0,.28);
  backdrop-filter: blur(2px);          /* léger verre dépoli */
}

.header .title {
  color: var(--accent-green); /* garde ton accent vert */
  font-weight: 900;
}

.header .subtitle {
  color: #ffffff;
  font-weight: 700;
  opacity: .92;
}
.netPickList {
  display: grid;
  grid-template-columns: repeat(6, 1fr); /* 6 icônes sur une ligne */
  gap: 10px;
  margin: 6px 0 2px;
  padding: 0;
  list-style: none;
}

.netPickItem {
  display: grid;
  grid-template-rows: auto auto; /* icône puis case */
  justify-items: center;
  align-items: center;
  gap: 6px;
  padding: 10px 6px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 10px;
  background: rgba(255,255,255,.03);
}

.netPickItem.disabled {
  opacity: .45;
  filter: grayscale(0.3);
  cursor: not-allowed;
}

.netPickBadge {
  display: inline-flex;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,.06);
}

.netPickCheck {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Petite case blanche, sobre */
.netPickCheck input {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1.5px solid #fff;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  position: relative;
}

.netPickItem.disabled .netPickCheck input {
  cursor: not-allowed;
}

.netPickCheck input:checked::after {
  content: "";
  position: absolute;
  inset: 3px;
  background: var(--accent-green, #2ecc71);
  border-radius: 2px;
}
.netPickBadge.active {
  background: rgba(255,255,255,.12);
  filter: none;
}

/* L’icône active hérite et on force la couleur (écrase le inline du renderNetIcon) */
.netPickBadge.active svg { color: inherit !important; }

/* Couleurs par réseau via l’attribut data-net du <li> */
.netPickItem[data-net="Facebook"] .netPickBadge.active svg { color: #1877f2 !important; }
.netPickItem[data-net="Instagram"] .netPickBadge.active svg { color: #e1306c !important; }
.netPickItem[data-net="YouTube"]   .netPickBadge.active svg { color: #ff0000 !important; }
.netPickItem[data-net="LinkedIn"]  .netPickBadge.active svg { color: #0a66c2 !important; }
.netPickItem[data-net="TikTok"]    .netPickBadge.active svg { color: #69c9d0 !important; }
.netPickItem[data-net="X"]         .netPickBadge.active svg { color: #ffffff !important; } /* X en blanc */
/* Dé-scope le svg pour que la règle s’applique malgré styled-jsx */
:global(.netPickBadge.active svg) { color: inherit !important; }

/* Couleurs par réseau (global pour toucher le <svg> de react-icons) */
:global(.netPickItem[data-net="Facebook"] .netPickBadge.active svg) { color: #1877f2 !important; }
:global(.netPickItem[data-net="Instagram"] .netPickBadge.active svg) { color: #e1306c !important; }
:global(.netPickItem[data-net="YouTube"]   .netPickBadge.active svg) { color: #ff0000 !important; }
:global(.netPickItem[data-net="LinkedIn"]  .netPickBadge.active svg) { color: #0a66c2 !important; }
:global(.netPickItem[data-net="TikTok"]    .netPickBadge.active svg) { color: #69c9d0 !important; }
:global(.netPickItem[data-net="X"]         .netPickBadge.active svg) { color: #ffffff !important; }

/* Blocs de picking */
.pickBlock { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: center; }
.pickIcon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 12px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.14); }

/* Grille de jours (6 colonnes) */
.pickGrid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.pickDay {
  height: 40px; border-radius: 10px; border: 1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.04); color: #fff; font-weight: 800; cursor: pointer;
}
.pickDay .dayNum { font-size: 18px; }
.pickDay:hover { filter: brightness(1.06); }
.pickDay.active {
  outline: 3px solid #00ffb3; outline-offset: -2px;
  background: linear-gradient(135deg, rgba(0,255,179,.85), rgba(0,200,130,.85));
  background-color: rgba(255,255,255,.18); background-blend-mode: screen;
  box-shadow: 0 0 18px rgba(0,255,179,.85), inset 0 0 10px rgba(255,255,255,.25);
}
.pickDay:disabled { opacity: .35; cursor: not-allowed; }

/* Heures */
.hourRow { display: flex; gap: 10px; flex-wrap: wrap; }
.hourBtn {
  min-width: 100px; height: 44px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.04);
  color: #fff; font-weight: 800; font-size: 18px; cursor: pointer;
}
.hourBtn:hover { filter: brightness(1.06); }
.hourBtn.active {
  background: var(--accent-green); border-color: var(--accent-green);
  box-shadow: 0 0 0 2px rgba(255,255,255,.12) inset, 0 0 14px rgba(5,150,105,.65);
}
.hourBtn:disabled { opacity: .45; cursor: not-allowed; }

/* Ajout pour uniformiser le style des boutons (effet vert) */
.btn {
  border: 1px solid var(--accent-green, #059669); /* liseré vert fin */
  background: #1f2937;
  transition: all 0.15s ease;
}
.btn:hover {
  background: #047857; /* vert plus sombre au survol */
  box-shadow: 0 0 8px rgba(5, 150, 105, 0.45); /* halo vert doux */
  transform: translateY(-1px);
}
/* === Carousel (identique Accueil) === */
:global(.d-carousel) {
  position: relative;
  width: 100%;
  height: 150px;
  background: #ffffff;             /* carte blanche */
  border: 1px solid #111;          /* léger trait pour fond sombre */
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
  color: #111;
  opacity: 1;
  font-weight: 600;
}
:global(.d-carImg) { width: 100%; height: 100%; object-fit: cover; }
:global(.d-carPlaceholder) {
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
:global(.d-carPlaceholder::after) { content: none; }

:global(.d-carArrow) {
  position: absolute;
  top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; padding: 0;
  color: #111; cursor: pointer; user-select: none; z-index: 2;
}
:global(.d-carArrow:hover) { transform: translateY(-50%) scale(1.06); }
:global(.d-left) { left: 12px; }
:global(.d-right) { right: 12px; }

:global(.d-carDots) { display: none; }
:global(.d-dot) {
  width: 8px; height: 8px; border-radius: 999px;
  background: rgba(255,255,255,0.35);
  border: 1px solid rgba(255,255,255,0.55);
}
:global(.d-dot--active) { background: var(--accent-green, #059669); border-color: #fff; }

:global(.d-carClick){
  display:block;
  width: calc(100% - 80px);
  margin: 0 auto;
  height:100%;
  padding:0; border:none; background:transparent; cursor:pointer; z-index: 1;
}
:global(.d-carArrow svg){ stroke:#111; }

/* Harmonise la modale "Consulter" avec les encadrés verts */
.consultModal {
  background: var(--card-bg);        /* même fond que .card */
  border: 1px solid var(--border);   /* liseré vert comme les encadrés */
  box-shadow: none;                  /* la double bordure vient de .tone-green::before */
}

/* Bouton de fermeture : croix nette, fond discret */
.modalClose.xBtn {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(0,0,0,0.35);
  color: var(--border);              /* croix verte (même teinte) */
}
.modalClose.xBtn:hover {
  filter: brightness(1.06);
  box-shadow: 0 0 8px rgba(5,150,105,0.45);
}
/* ===== Cartes Planning : split en 2 colonnes, compteur + carousel ===== */
.p-split {
  display: grid;
  grid-template-columns: 140px 1fr;  /* gauche étroite pour compteur */
  gap: 12px;
  align-items: stretch;
}

.p-left { display: flex; flex-direction: column; gap: 10px; }

.p-leftBox {
  min-height: 108px;
  border-radius: 10px;
  background: #012a18;
  color: #fff;
  display: grid;
  place-items: center;
}

.p-num {                          /* style du nombre comme sur l’Accueil */
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
}

.p-consult { width: 100%; }       /* bouton “Consulter” pleine largeur */

.p-right {
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  height: 100%;
}
.block {
  position: relative;
  border: 1px solid var(--border);
}

.block::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 12px;
  border: 3px solid var(--border);
  pointer-events: none;
}
.blockHead strong {
  position: relative;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 50px;
  background: #059669;          /* vert principal */
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}
.p-right :global(.d-carousel) {
  height: var(--car-h);
  flex: 0 0 var(--car-h);
  align-self: flex-start;
}
.successHead,
.blockHead.advisorHead {
  gap: 20px;
  justify-content: center; /* centre horizontalement */
}











      `}</style>
    </section>
  );
}

/* ======= Sous-composants ======= */
function HeaderRow({ p, selected, toggle, label, when }: { p: Post; selected: boolean; toggle: ()=>void; label: string; when: string | null | undefined; }) {
  return (
    <div className="row" style={{justifyContent:'space-between',alignItems:'baseline'}}>
      <label style={{display:"inline-flex",alignItems:"center",marginRight:6}}>
        <input type="checkbox" checked={selected} onChange={toggle} style={{width:16,height:16,cursor:"pointer"}}/>
      </label>
      <strong>{label}</strong>
      <time style={{opacity:.8}}>{when ? fmtNum(new Date(when)) : ""}</time>
    </div>
  );
}

function BodyRow({ p, setPreview }: { p: Post; setPreview: (x:any)=>void }) {
  const hasImg = !!p.image_url;
  const hasVid = !!p.video_url;
  const hasDoc = !!p.doc_url;
  return (
    <>
      <div style={{whiteSpace:'pre-wrap'}}>{p.body || <i>(Sans texte)</i>}</div>
      {(p.channels?.length ? (
        <div style={{marginTop:6, display:"flex", gap:6, flexWrap:"wrap"}}>
          {p.channels!.map((c)=>(
            <span key={c} title={c} style={{fontSize:12, border:"1px solid rgba(255,255,255,.14)", borderRadius:999, padding:"2px 8px", opacity:.9}}>{c}</span>
          ))}
        </div>
      ): null)}
      {(hasImg || hasVid || hasDoc) && (
        <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap",alignItems:"flex-start"}}>
          {hasImg && (
            <div onClick={()=>setPreview({kind:"image", url:p.image_url!})} title="Clique pour agrandir l'image"
                 style={{border:"1px solid rgba(255,255,255,.14)", borderRadius:10, overflow:"hidden", cursor:"pointer", background:"#1C1C1C"}}>
              <img src={p.image_url!} alt="miniature image" style={{display:"block",maxWidth:220,height:120,objectFit:"cover"}} />
            </div>
          )}
          {hasVid && (
            <div onClick={()=>setPreview({kind:"video", url:p.video_url!})} title="Clique pour lire la vidéo"
                 style={{border:"1px solid rgba(255,255,255,.14)", borderRadius:10, overflow:"hidden", cursor:"pointer", background:"#1C1C1C"}}>
              <video src={p.video_url!} preload="metadata" style={{display:"block",maxWidth:220,height:120,objectFit:"cover"}} />
            </div>
          )}
          {hasDoc && (
            <button onClick={()=>setPreview({kind:"doc", url:p.doc_url!, isPdf: p.doc_url!.toLowerCase().includes(".pdf")})}
                    title="Aperçu du document"
                    className="btn small">
               Voir le document
            </button>
          )}
        </div>
      )}
    </>
  );
}

// Types pour preview
type Preview =
  | { kind: "image"; url: string }
  | { kind: "video"; url: string }
  | { kind: "doc"; url: string; isPdf: boolean };