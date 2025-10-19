"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useAppSettings } from "@/lib/useAppSettings";

/* ---------- Helpers IBAN / BIC ---------- */
function isValidIBAN(raw: string): boolean {
  const s = raw.replace(/\s+/g, "").toUpperCase();
  if (s.length < 15 || s.length > 34) return false;
  const rearranged = s.slice(4) + s.slice(0, 4);
  let acc = 0;
  for (let i = 0; i < rearranged.length; i++) {
    const ch = rearranged[i];
    const code = ch >= "A" && ch <= "Z" ? ch.charCodeAt(0) - 55 : parseInt(ch, 10);
    const piece = String(code);
    for (let j = 0; j < piece.length; j++) acc = (acc * 10 + (piece.charCodeAt(j) - 48)) % 97;
  }
  return acc === 1;
}
function isValidBIC(raw: string): boolean {
  const s = raw.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s);
}
function normalizeIBAN(v: string) { return v.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/(.{4})/g, "$1 ").trim(); }
function normalizeBIC(v: string) { return v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11); }

/* ---------- Types ---------- */
type Socials = { twitter: string; instagram: string; facebook: string; linkedin: string; youtube: string; tiktok: string; };
type OrgData = {
  lang: string; iban: string; bic: string; holder: string; bank: string; socials: Socials; sites: string[];
};

/* ---------- LocalStorage helpers ---------- */
function loadCurrentOrgId(): string {
  try { return localStorage.getItem("org.current") || "plomberie"; } catch { return "plomberie"; }
}
function loadOrgName(id: string): string {
  try {
    const list = JSON.parse(localStorage.getItem("org.list") || "[]") as { id: string; name: string }[];
    return list.find((o) => o.id === id)?.name || id;
  } catch { return id; }
}
function loadOrgData(id: string): OrgData {
  try { const raw = localStorage.getItem(`org.data.${id}`); if (raw) return JSON.parse(raw); } catch {}
  return {
    lang: "fr",
    iban: "FR76 3000 6000 0112 3456 7890 189",
    bic: "BNPAFRPPXXX",
    holder: "John Fernandez",
    bank: "BNP Paribas",
    socials: { twitter: "", instagram: "", facebook: "", linkedin: "", youtube: "", tiktok: "" },
    sites: [],
  };
}
function saveOrgData(id: string, data: OrgData) { try { localStorage.setItem(`org.data.${id}`, JSON.stringify(data)); } catch {} }

export default function ProfilePage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;           // ← évite l’erreur si ENV absentes
    return createClient(url, key);
  }, []);

  /* ------ Sites internet ------- */
  const addSite = () => setData((d) => ({ ...d, sites: [...(d.sites || []), ""] }));
  const setSite = (i: number, v: string) => setData((d) => { const next = [...(d.sites || [])]; next[i] = v; return { ...d, sites: next }; });
  const removeSite = (i: number) => setData((d) => { const next = [...(d.sites || [])]; next.splice(i, 1); return { ...d, sites: next }; });

  /* ------ Global (identité) ------- */
  const [isEditingName, setEditingName] = useState(false);
  const [isEditingEmail, setEditingEmail] = useState(false);
  const [fullName, setFullName] = useState("John Fernandez");
  const [email, setEmail] = useState("john@example.com");
  const [pwdName, setPwdName] = useState("");
  const [pwdMail, setPwdMail] = useState("");

const { locale, orgId } = useAppSettings();     // ← on récupère depuis le hook
const orgName = useMemo(() => loadOrgName(orgId), [orgId]);


  /* ------ Données dépendantes ------- */
  const [data, setData] = useState<OrgData>(() => loadOrgData(orgId));
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "ok" | "error">("idle");
const [isEditingBankInfo, setEditingBankInfo] = useState(false);

// ----- Édition ciblée : un seul réseau à la fois -----
const [editingSocial, setEditingSocial] = useState<keyof Socials | null>(null);
const [tempSocial, setTempSocial] = useState<string>("");

// ----- Édition d’un site (par index) -----
const [editingSiteIndex, setEditingSiteIndex] = useState<number | null>(null);
const [tempSite, setTempSite] = useState<string>("");

useEffect(() => {
  // À chaque changement d’orgId (provenant du hook), on recharge les données
  setData(loadOrgData(orgId));
  setVerifyStatus("idle");
}, [orgId]);


  useEffect(() => { saveOrgData(orgId, data); }, [orgId, data]);

  const verifyBank = () => {
    const ok = isValidIBAN(data.iban) && isValidBIC(data.bic);
    setVerifyStatus(ok ? "ok" : "error");
  };

  const setLang = (v: string) => setData((d) => ({ ...d, lang: v }));
  const setIban = (v: string) => setData((d) => ({ ...d, iban: normalizeIBAN(v) }));
  const setBic = (v: string) => setData((d) => ({ ...d, bic: normalizeBIC(v) }));
  const setHolder = (v: string) => setData((d) => ({ ...d, holder: v }));
  const setBank = (v: string) => setData((d) => ({ ...d, bank: v }));
  const setSocial = (k: keyof Socials, v: string) => setData((d) => ({ ...d, socials: { ...d.socials, [k]: v } }));

  /* ------ UX ------- */
  const [username, setUsername] = useState("johnf");
const [isEditingUsername, setIsEditingUsername] = useState(false);     // ← AJOUT
const [tempUsername, setTempUsername] = useState(username);
useEffect(() => { setTempUsername(username); }, [username]);           // ← AJOUT

async function saveUsername() {
  if (!supabase) {                          // ← ajout
    alert("Configuration Supabase manquante (URL/KEY).");
    return;
  }
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) { alert("Non connecté."); return; }

  // Envoie la valeur brute : la DB applique normalisation + unicité
  const { error } = await supabase
    .from("profiles")
    .update({ username: tempUsername })
    .eq("id", u.user.id);

  if (error) { alert(error.message); return; }

  // OK côté DB → on reflète côté UI
  setUsername(tempUsername);
  setIsEditingUsername(false);
}

function cancelUsernameEdit() {                                        // ← AJOUT
  setTempUsername(username);
  setIsEditingUsername(false);
}
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdNew2, setPwdNew2] = useState("");
  const [twoFA, setTwoFA] = useState(false);
  const [notifSys, setNotifSys] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
const [notifEmail, setNotifEmail] = useState(true);
const [showPwd, setShowPwd] = useState(false);
const [showPwdNew, setShowPwdNew] = useState(false);
const [showPwdNew2, setShowPwdNew2] = useState(false);

  const pwdStrong =
    (pwdNew.length >= 10 ? 1 : 0) +
    (/[A-Z]/.test(pwdNew) ? 1 : 0) +
    (/[a-z]/.test(pwdNew) ? 1 : 0) +
    (/\d/.test(pwdNew) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pwdNew) ? 1 : 0);

function startEditSocial(k: keyof Socials, current: string) {
  setEditingSocial(k);
  setTempSocial(current || "");
}
function saveSocial() {
  if (!editingSocial) return;
  setSocial(editingSocial, tempSocial.trim());
  setEditingSocial(null);
  setTempSocial("");
}
function cancelSocial() {
  setEditingSocial(null);
  setTempSocial("");
}

function startEditSite(i: number, current: string) {
  setEditingSiteIndex(i);
  setTempSite(current || "");
}
function saveSite() {
  if (editingSiteIndex === null) return;
  setSite(editingSiteIndex, tempSite.trim());
  setEditingSiteIndex(null);
  setTempSite("");
}
function cancelSite() {
  setEditingSiteIndex(null);
  setTempSite("");
}

  return (
    <section className="profile">
      <div className="container">
        {/* ===== En-tête CENTRÉ, une seule ligne ===== */}
<header className="header">
  <h1>
    <span className="titlePlate">
      <span className="title">PROFIL</span>
      <span className="subtitle">: Paramètres & sécurité du compte</span>
    </span>
  </h1>
</header>

        {/* ======= GRID PRINCIPALE ======= */}
        <div className="cardsGrid">

          {/* 1) Informations & Sécurité (fusion, 2 colonnes) */}
          <div className="card tone-blue span2">
            <h2 className="tag tag-account">Informations & Sécurité du compte</h2>

            <div className="grid two equal">
              {/* Colonne GAUCHE — Informations */}
              <div className="col leftCol">
                <div className="grid two">
                  <div className="field">
                    <label>ID utilisateur :</label>
                    <div className="staticBox"><span className="staticText">ID-000000</span></div>
                  </div>
                  <div className="field">
                    <label>Date de création :</label>
                    <div className="staticBox"><span className="staticText">—</span></div>
                  </div>

                  {/* Nom complet */}
                  <div className="field">
                    <label>Nom complet :</label>
                    {!isEditingName ? (
                      <div className="staticRow nameRowStatic">
                        <div className="staticBox"><span className="staticText">{fullName}</span></div>
                        <button className="iconButton tight" onClick={() => setEditingName(true)} title="Modifier le nom">
                          <PencilIcon />
                        </button>
                      </div>
                    ) : (
                      <div className="editRow nameRowEdit">
                        <div className="controlPanel">
                          <input className="input lightOnDark" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Votre nom complet" />
                        </div>

                        <div className="editActions">
<button className="btn small" onClick={() => { setEditingName(false); }}>Enregistrer</button>
                          <button className="btn small" onClick={() => { setEditingName(false); setPwdName(""); }}>Annuler</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="field">
                    <label>Email :</label>
                    {!isEditingEmail ? (
                      <div className="staticRow emailRowStatic">
                        <div className="staticBox"><span className="staticText">{email}</span></div>
                        <button className="iconButton tight" onClick={() => setEditingEmail(true)} title="Modifier l’email">
                          <PencilIcon />
                        </button>
                      </div>
                    ) : (
                      <div className="editRow emailRowEdit">
                        <div className="controlPanel">
                          <input className="input lightOnDark" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" />
                        </div>

                        <div className="editActions">
<button className="btn small" onClick={() => { setEditingEmail(false); }}>Enregistrer</button>
                          <button className="btn small" onClick={() => { setEditingEmail(false); setPwdMail(""); }}>Annuler</button>
                        </div>
                      </div>
                    )}
                  </div>
                  
{/* Username */}
<div className="field">
  <label>Nom d’utilisateur :</label>

{!isEditingUsername ? (
  <div className="staticRow nameRowStatic">
    <div className="staticBox">
      <span className="staticText">{username || "—"}</span>
    </div>
    <button className="iconButton tight" title="Modifier" onClick={() => setIsEditingUsername(true)}>
      <PencilIcon />
    </button>
  </div>
) : (
  <div className="editRow nameRowEdit">
    <div className="controlPanel">
      <input
        className="input lightOnDark"
        value={tempUsername}
        onChange={(e) => setTempUsername(e.target.value)}
        placeholder="Votre nom d’utilisateur"
      />
    </div>
    <div className="editActions">
      <button className="btn small" onClick={saveUsername}>Enregistrer</button>
      <button className="btn small" onClick={cancelUsernameEdit}>Annuler</button>
    </div>
  </div>
)}

</div>



		  {/* Abonnement — inline (prend une colonne, même style carte compacte) */}
<div className="field">
  <label>Abonnement :</label>
  <div className="subcard sub-account compact">
    <span className="staticText">
      Forfait actuel - <strong>"STARTER"</strong>
    </span>
    <a href="/forfaits" className="btn small">Changer de forfait</a>
  </div>
</div>
                </div>
              </div>

              {/* Colonne DROITE — Sécurité */}
              <div className="col">
                <div className="grid two">
                  <div className="field">
                    <label>Mot de passe actuel :</label>
<div className="controlPanel nochrome">
  <input
    className="input lightOnDark"
    type={showPwd ? "text" : "password"}
    value={pwdCurrent}
    onChange={(e) => setPwdCurrent(e.target.value)}
    autoComplete="current-password"
    placeholder="••••••••"
  />
  <button
    type="button"
    className="iconButton tight"
    onClick={() => setShowPwd(!showPwd)}
    aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
    title={showPwd ? "Masquer" : "Afficher"}
  >
    {showPwd ? <Eye size={18} aria-hidden /> : <EyeOff size={18} aria-hidden />}
  </button>
</div>

                  </div>
<div className="field">
  <label>Nouveau mot de passe :</label>
  <div className="controlPanel pwd inline nochrome">
<input
  className="input lightOnDark"
  type={showPwdNew ? "text" : "password"}
  value={pwdNew}
  onChange={(e) => setPwdNew(e.target.value)}
  autoComplete="new-password"
/>

    <div className="strengthInline" aria-hidden>
      <div className="bar" data-on={pwdStrong >= 1} />
      <div className="bar" data-on={pwdStrong >= 3} />
      <div className="bar" data-on={pwdStrong >= 5} />
    </div>
<button
      type="button"
      className="iconButton tight"
      onClick={() => setShowPwdNew(!showPwdNew)}
      aria-label={showPwdNew ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      title={showPwdNew ? "Masquer" : "Afficher"}
    >
      {showPwdNew ? <Eye size={18} aria-hidden /> : <EyeOff size={18} aria-hidden />}
    </button>
  </div>
  </div>


                  <div className="field">
                    <label>Confirmer le nouveau mot de passe :</label>
                    <div className="controlPanel nochrome">
                      <input
  className="input lightOnDark"
  type={showPwdNew2 ? "text" : "password"}
  value={pwdNew2}
  onChange={(e) => setPwdNew2(e.target.value)}
  autoComplete="new-password"
/>

    <button
      type="button"
      className="iconButton tight"
      onClick={() => setShowPwdNew2(!showPwdNew2)}
      aria-label={showPwdNew2 ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      title={showPwdNew2 ? "Masquer" : "Afficher"}
    >
      {showPwdNew2 ? <Eye size={18} aria-hidden /> : <EyeOff size={18} aria-hidden />}
    </button>                    
</div>
                  </div>
                  <div className="field twofarow">
                    <label>Double authentification (2FA)</label>
                    <div className="controlPanel inline">
                      <input id="twofa" type="checkbox" checked={twoFA} onChange={(e) => setTwoFA(e.target.checked)} />
                      <label htmlFor="twofa" style={{ margin: 0 }}>Activer l’Authenticator</label>
                    </div>
                  </div>
                </div>

                <div className="verifyRow">
                  <button className="btn small" disabled={!pwdCurrent || !pwdNew || pwdNew !== pwdNew2}>
                    Mettre à jour
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2) Coordonnées du compte — large */}
          <div className="card tone-emerald">
            <h2 className="tag tag-pay">Coordonnées du compte</h2>
{/* Bouton Modifier/Vérifier en haut à droite */}
<div className="editBankHeader">
  <button
    className="btn small"
    onClick={() => {
      if (!isEditingBankInfo) {
        setVerifyStatus("idle");
        setEditingBankInfo(true);
        return;
      }
      const iban = (data.iban || "").trim();
      const bic  = (data.bic  || "").trim();
      if (!iban || !bic) {
        setVerifyStatus("error");
        alert("Veuillez renseigner l’IBAN et le BIC.");
        return;
      }
      const okIban = isValidIBAN(iban);
      const okBic  = isValidBIC(bic);
      if (!okIban || !okBic) {
        setVerifyStatus("error");
        alert(!okIban ? "IBAN invalide." : "BIC invalide.");
        return;
      }
      setVerifyStatus("ok");
      setEditingBankInfo(false);
    }}
  >
    {isEditingBankInfo ? "Vérifier & valider" : "Modifier"}
  </button>
</div>

{/* Messages visibles seulement hors mode édition */}
{!isEditingBankInfo && verifyStatus === "ok"    && <div className="alert ok">✅ Coordonnées valides.</div>}
{!isEditingBankInfo && verifyStatus === "error" && <div className="alert err">❌ IBAN/BIC invalides.</div>}

            <div className="grid two">
              <div className="field">
                <label>IBAN</label>
{isEditingBankInfo ? (
  <div className="controlPanel nochrome">
    <input
      className="input mono lightOnDark"
      inputMode="text"
      placeholder="FR76 3000 6000 0112 3456 7890 189"
      value={data.iban}
      onChange={(e) => { setIban(e.target.value); setVerifyStatus("idle"); }}
    />
  </div>
) : (
  <div className="staticBox">
    <span className="staticText">{data.iban}</span>
  </div>
)}


              </div>
              <div className="field">
                <label>BIC / SWIFT</label>
{isEditingBankInfo ? (
  <div className="controlPanel nochrome">
    <input
      className="input mono lightOnDark"
      placeholder="BNPAFRPPXXX"
      value={data.bic}
      onChange={(e) => { setBic(e.target.value); setVerifyStatus("idle"); }}
      maxLength={11}
    />
  </div>
) : (
  <div className="staticBox">
    <span className="staticText">{data.bic}</span>
  </div>
)}


              </div>
              <div className="field">
                <label>Banque</label>
{isEditingBankInfo ? (
  <div className="controlPanel nochrome">
    <input
      className="input lightOnDark"
      placeholder="Nom de la banque"
      value={data.bank}
      onChange={(e) => setBank(e.target.value)}
    />
  </div>
) : (
  <div className="staticBox">
    <span className="staticText">{data.bank}</span>
  </div>
)}


              </div>
              <div className="field">
                <label>Titulaire du compte</label>
{isEditingBankInfo ? (
  <div className="controlPanel nochrome">
    <input
      className="input lightOnDark"
      placeholder="Nom Prénom / Société"
      value={data.holder}
      onChange={(e) => setHolder(e.target.value)}
    />
  </div>
) : (
  <div className="staticBox">
    <span className="staticText">{data.holder}</span>
  </div>
)}


              </div>
            </div>



          </div>


          {/* 3) Notifications */}
          <div className="card tone-cyan">
            <h2 className="tag tag-notif">Notifications</h2>

            <div className="grid two">
              <div className="field">
                <label>Notifications e-mail</label>
                <div className="controlPanel inline nochrome">
                  <input id="notif-email" type="checkbox" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} />
                  <label htmlFor="notif-email" style={{ margin: 0 }}>Recevoir les notifications par e-mail</label>
                </div>
              </div>

              <div className="field">
                <label>Notifications push</label>
                <div className="controlPanel inline nochrome">
                  <input id="notif-push" type="checkbox" checked={notifSys} onChange={(e) => setNotifSys(e.target.checked)} />
                  <label htmlFor="notif-push" style={{ margin: 0 }}>Activer les notifications système</label>
                </div>
              </div>

              <div className="field">
                <label>Alertes d’échec de publication</label>
                <div className="controlPanel inline nochrome">
                  <input id="notif-fail" type="checkbox" checked={notifSecurity} onChange={(e) => setNotifSecurity(e.target.checked)} />
                  <label htmlFor="notif-fail" style={{ margin: 0 }}>M’alerter en cas d’échec</label>
                </div>
              </div>

              <div className="field">
                <label>Rappels du calendrier</label>
                <div className="controlPanel inline nochrome">
                  <input id="notif-cal" type="checkbox" checked={notifMarketing} onChange={(e) => setNotifMarketing(e.target.checked)} />
                  <label htmlFor="notif-cal" style={{ margin: 0 }}>Recevoir un rappel avant la publication</label>
                </div>
              </div>
            </div>
          </div>

{/* 4) Réseaux & Sites */}
<div className="card tone-violet">
  <h2 className="tag tag-social">Réseaux & Sites internet</h2>

  <div className="grid two">

    {/* --- Réseaux : StaticBox par défaut, ✏️ pour éditer champ par champ --- */}
    {[
      { id: "twitter",   label: "X (Twitter)", ph: "https://x.com/toncompte" },
      { id: "instagram", label: "Instagram",   ph: "https://instagram.com/toncompte" },
      { id: "facebook",  label: "Facebook",    ph: "https://facebook.com/ta-page" },
      { id: "linkedin",  label: "LinkedIn",    ph: "https://linkedin.com/in/tonprofil" },
      { id: "youtube",   label: "YouTube",     ph: "https://youtube.com/@tonchaine" },
      { id: "tiktok",    label: "TikTok",      ph: "https://tiktok.com/@toncompte" },
    ].map((f) => {
      const k = f.id as keyof Socials;
      const val = data.socials[k] || "";
      const isEditing = editingSocial === k;

      return (
        <div className="field" key={f.id}>
          <label>{f.label}</label>

          {!isEditing ? (
            // ---- Mode lecture (Static) ----
            <div className="staticRow nameRowStatic">
              <div className="staticBox">
                <span className="staticText">{val || "—"}</span>
              </div>
              <button
                className="iconButton tight"
                title="Modifier"
                onClick={() => startEditSocial(k, val)}
              >
                <PencilIcon />
              </button>
            </div>
          ) : (
            // ---- Mode édition ----
            <div className="editRow nameRowEdit">
              <div className="controlPanel">
                <input
                  className="input lightOnDark"
                  type="url"
                  placeholder={f.ph}
                  value={tempSocial}
                  onChange={(e) => setTempSocial(e.target.value)}
                />
              </div>
              <div className="editActions">
                <button className="btn small" onClick={saveSocial}>Enregistrer</button>
                <button className="btn small" onClick={cancelSocial}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      );
    })}

    {/* --- Sites : StaticBox par défaut, ✏️ pour éditer chaque ligne --- */}
    {(data.sites || []).map((s, i) => {
      const isEditing = editingSiteIndex === i;

      return (
        <div className="field" key={i}>
          <label>Site {i + 1}</label>

          {!isEditing ? (
            // ---- Mode lecture (Static) ----
            <div className="staticRow nameRowStatic">
              <div className="staticBox">
                <span className="staticText">{s || "—"}</span>
              </div>

              <div style={{ display: "inline-flex", gap: 8 }}>
                <button
                  className="iconButton tight"
                  title="Modifier"
                  onClick={() => startEditSite(i, s)}
                >
                  <PencilIcon />
                </button>
                <button
                  className="btn small ghost"
                  onClick={() => removeSite(i)}
                  title="Supprimer ce site"
                >
                  <X size={18} color="#dc2626" />
                </button>
              </div>
            </div>
          ) : (
            // ---- Mode édition ----
            <div className="editRow nameRowEdit">
              <div className="controlPanel">
                <input
                  className="input lightOnDark"
                  type="url"
                  placeholder="https://www.monsite.com"
                  value={tempSite}
                  onChange={(e) => setTempSite(e.target.value)}
                />
              </div>
              <div className="editActions">
                <button className="btn small" onClick={saveSite}>Enregistrer</button>
                <button className="btn small" onClick={cancelSite}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      );
    })}

    {/* Bouton d’ajout : on garde le même comportement */}
    <button className="btn small" onClick={addSite}>+ Ajouter un site</button>
  </div>
</div>


          {/* 5) Sessions & appareils */}
          <div className="card tone-orange" style={{ transform: 'translateY(2px)' }}>
            <h2 className="tag tag-sessions">Sessions & appareils</h2>
            <div className="table">
              {[
                { d: "Chrome – Windows", l: "Paris, FR", t: "il y a 2 h" },
                { d: "Safari – iPhone", l: "Lyon, FR", t: "hier" },
              ].map((r, i) => (
                <div className="row" key={i}>
                  <span>{r.d}</span><span>{r.l}</span><span>{r.t}</span>
                  <button className="btn small">Déconnecter</button>
                </div>
              ))}
            </div>
            <div className="verifyRow">
              <button className="btn small">Tout déconnecter</button>
	      <button className="btn small">+ Ajouter un appareil</button>
            </div>
          </div>
          
{/* 7) Achats effectués */}
          <div className="card tone-magenta narrow">
            <h2 className="tag tag-bill">Achats effectués</h2>
            <div className="table">
              <div className="row head">
                <span>Date</span><span>Référence</span><span>Montant</span><span>Document</span>
              </div>
              {[{ d: "2025-08-30", r: "INV-20250830-001", m: "19,00 €" }].map((f, i) => (
                <div className="row" key={i}>
                  <span>{f.d}</span><span>{f.r}</span><span>{f.m}</span>
                  <a href="#" className="btn small">Facture PDF</a>
                </div>
              ))}
            </div>
          </div>
{!supabase && (
  <div className="alert err" style={{ marginTop: 12 }}>
    ⚠️ Supabase n’est pas configuré (variables NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY absentes).
  </div>
)}
        </div>
        {/* /cardsGrid */}
      </div>

      {/* ============ Styles locaux ============ */}
      <style jsx>{`
  /* ===== Safety: dark scheme + variable fallbacks ===== */
.profile {
  color-scheme: dark;

  /* Dégradé + image de fond */
  background-image:
    linear-gradient(
      to bottom,
      rgba(0,0,0,0.20) 0%,
      rgba(0,0,0,0.35) 40%,
      rgba(0,0,0,0.65) 70%,
      #000 100%
    ),
    url("/background/turquoise.jpg"); /* ← tu changeras l’URL par ton image */
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  background-size: cover, cover;
  background-attachment: fixed, fixed;

  /* fallback si image absente */
  background-color: #1C1C1C;

  color: var(--text, #e6e8ec);

  /* Variables déjà en place */
  --accent-blue:   #1D4ED8;
  --accent-violet: #7E22CE;
  --accent-emerald:#059669;
  --accent-orange: #EA580C;
  --accent-magenta:#BE185D;
  --accent-cyan:   #0891B2;
  --accent-red:    #B91C1C;
  --encadre-bg: #01161B;
  --encadre-border: #0891B2;
  --border: #0891B2;
  --card-bg: #111111;
}

  .container {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 8px 24px 40px;
  }

  /* ===== Header: centered, “Profil” cyan, rest muted ===== */
  .header { margin: 10px 0 14px 0; text-align: center; }
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
  .header .title { color: #0891B2; font-weight: 900; }   /* same as “Profil” icon */
  .header .org { font-weight: 900; color: var(--text, #e6e8ec); }
  .header .muted { color: var(--muted, #a3a7b0); font-weight: 600; }

  /* ===== Grid ===== */
  .cardsGrid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    grid-auto-flow: dense;   /* ← permet aux cartes suivantes de remonter combler les trous */
  }
  @media (min-width: 1024px) {
    .cardsGrid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  }
  .span2 { grid-column: 1 / -1; }
  .narrow { max-width: 900px; }

  /* ===== Cards ===== */
  .card {
    position: relative;
    background: var(--card-bg, #141414);
    border: 1px solid var(--border, rgba(255,255,255,0.10));
    border-radius: 14px;
    padding: 18px;
    min-width: 0;
    color: var(--text, #e6e8ec);             /* ensure white text inside */
  }
  .tone-blue::before, .tone-emerald::before, .tone-violet::before,
  .tone-orange::before, .tone-magenta::before, .tone-cyan::before, .tone-red::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 14px;
    pointer-events: none;
    box-shadow: inset 0 0 0 2px var(--border, rgba(255,255,255,0.10));
  }

  .tag {
    display: inline-block;
    padding: 6px 12px;
    margin: 0 0 14px 0;
    border-radius: 999px;
    font-size: 1.05rem;
    font-weight: 800;
    line-height: 1;
    color: var(--text, #e6e8ec);
    background: #0891B2;
  }

  .tag-notif { background: var(--accent-cyan); }
  .tone-cyan { --border: var(--accent-cyan); }

  /* ===== Inner grids ===== */
  .grid { display: grid; gap: 14px; }
  .two { grid-template-columns: 1fr; }
  .three { grid-template-columns: 1fr; }
  .two.equal { grid-template-columns: 1fr; }
  @media (min-width: 768px) {
    .two { grid-template-columns: 1fr 1fr; }
    .two.equal { grid-template-columns: 1fr 1fr; }
  }
  @media (min-width: 1200px) { .three { grid-template-columns: 1fr 1fr 1fr; } }

  /* ===== Fields ===== */
.profile .field {
  display: flex;
  flex-direction: column;
  background: #01161B;
  border: 1px solid var(--border, #0891B2);
  border-radius: 12px;
  padding: 12px;
}

  .field label {
    margin-bottom: 6px;
    font-size: 17px;
    font-weight: 600;
    color: var(--text, #e6e8ec);
    opacity: .92;
  }

  .staticBox {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 10px; border-radius: 10px;
    background: #949494; border: 1px solid var(--border, rgba(255,255,255,0.10));
    color: var(--text, #000000);
font-weight: 600;
font-size: 17px
  }
  .staticText { opacity: .98; }

  .staticRow { display: grid; align-items: center; gap: 8px; }
  .nameRowStatic, .emailRowStatic { grid-template-columns: 1fr auto; }

  .editRow { display: grid; align-items: center; gap: 8px; }
 .nameRowEdit, .emailRowEdit {
  grid-template-columns: minmax(220px, 1fr) auto; /* 2 colonnes : champ | boutons */
  align-items: start;
}

  .controlPanel {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 8px; border: 1px solid var(--border, rgba(255,255,255,0.10));
    border-radius: 12px; background: #0f0f0f;
    box-shadow: inset 0 1px 0 rgba(0,0,0,.28);
    color: var(--text, #e6e8ec);
  }
  .controlPanel.inline { width: max-content; }

  .input, .select {
    width: 100%; padding: 10px;
    border: 1px solid var(--border, rgba(255,255,255,0.10));
    border-radius: 10px; background: #ffffff;
    color: #000000;
    outline: none;
  }
  .mono { font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace; }

  .subcard {
    margin-top: 14px; padding: 12px; border-radius: 12px;
    background: #0f0f0f; border: 1px solid var(--border, rgba(255,255,255,0.10));
    color: var(--text, #e6e8ec); /* ← ensure label text isn’t black */
  }
  .sub-account { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .subhead { margin: 16px 0 6px; font-size: 1rem; font-weight: 800; color: var(--text, #e6e8ec); }

  .verifyRow { display: flex; align-items: center; gap: 10px; margin-top: 10px; flex-wrap: wrap; }

  .alert { padding: 8px 10px; border-radius: 10px; border: 1px solid; color: var(--text, #e6e8ec); }
  .alert.ok  { border-color: #059669; background: color-mix(in oklab, #059669 18%, transparent); }
  .alert.err { border-color: #B91C1C; background: color-mix(in oklab, #B91C1C 18%, transparent); }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border: 1px solid var(--border, rgba(255,255,255,0.10));
  border-radius: 10px;
  background: #111;
  color: var(--text, #e6e8ec);
  text-decoration: none;
  cursor: pointer;
  font-size: 1rem;   /* ← ajoute ça (16px) */
  font-weight: 600;  /* ← optionnel, pour du texte plus "fort" */
}

.btn.small {
  padding: 7px 10px;
  font-size: 0.95rem; /* ← un peu plus petit, si tu veux nuancer */
}
  .btn:hover { filter: brightness(1.05); }
  .btn.ghost { background: transparent; }

  .iconButton {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 8px;
    border: 1px solid var(--border, rgba(255,255,255,0.10));
    background: #111; color: var(--text, #e6e8ec); cursor: pointer;
  }

  .strength { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 8px; }
  .strength .bar {
    height: 6px; border-radius: 999px; background: #262626;
    border: 1px solid var(--border, rgba(255,255,255,0.10));
  }
  .strength .bar[data-on="true"]:nth-child(1){ background: color-mix(in oklab, #B91C1C 55%, transparent); }
  .strength .bar[data-on="true"]:nth-child(2){ background: color-mix(in oklab, #EA580C 55%, transparent); }
  .strength .bar[data-on="true"]:nth-child(3){ background: color-mix(in oklab, #059669 55%, transparent); }

  .table { width: 100%; border: 1px solid var(--border, rgba(255,255,255,0.10)); border-radius: 12px; overflow: hidden; color: var(--text, #e6e8ec); }
  .row { display: grid; grid-template-columns: 2fr 1.2fr 1.2fr auto; gap: 10px; padding: 10px 12px; }
  .row:nth-child(odd) { background: #121212; }
  .row:nth-child(even){ background: #101010; }
  .row.head { background: #0e0e0e; font-weight: 700; color: var(--muted, #a3a7b0); }
  .row a.btn { padding: 6px 10px; }
  @media (max-width: 720px){
    .row { grid-template-columns: 1fr 1fr; }
    .row.head { display: none; }
  }
/* La grille “two equal” pour bien caler Username (col 1) et Abonnement (col 2) */
.two.equal { grid-template-columns: 1fr; }
@media (min-width: 768px){ .two.equal { grid-template-columns: 1fr 1fr; } }

/* Abonnement compact en “carte” de même gabarit qu’un champ */
.subcard.sub-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #0f0f0f;
  border: 1px solid var(--border, rgba(255,255,255,0.10));
  color: var(--text, #e6e8ec);
}

/* Neutralise l’aspect "seconde carte" du wrapper */
.controlPanel.nochrome {
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
.controlPanel.nochrome.inline { gap: 8px; } /* pour le bouton Vérifier */

/* Hauteur standard des champs (adapte si besoin) */
.input { height: 42px; }

/* Abonnement compact, même gabarit qu'un champ */
.subcard.sub-inline{
  display:flex; align-items:center; justify-content:space-between;
  gap:10px;
  padding: 0 12px;                    /* même padding horizontal qu'un champ */
  min-height: 42px;                   /* = hauteur de .input */
  border-radius:12px;
  background:#0f0f0f; border:1px solid var(--border);
}

/* La ligne "Nom d'utilisateur" / "Abonnement" doit s'étirer également */
.two.equal { grid-template-columns: 1fr; align-items: stretch; }
@media (min-width: 768px){ .two.equal { grid-template-columns: 1fr 1fr; } }
.two.equal > * { height: 100%; }      /* force l’égalité de hauteur */

.grid.two .field .input {
  width: 100%;
}

/* place "Sessions & appareils" dans la colonne 1 sur les écrans >= 1024px */
@media (min-width: 1024px){
  .pull-up {
  grid-column: 1;
  margin-top: -32px
}}
/* Aligne les hauteurs des cartes dans la grille “two equal” */
.two.equal { align-items: stretch; }
.two.equal > .field { display: flex; flex-direction: column; }
.two.equal > .field .sub-inline { flex: 1; } /* la carte abonnement remplit la hauteur restante */
.two.equal > .field .sub-account { flex: 1; }

.input.lightOnDark {
  box-sizing: border-box;
  padding: 6px 10px;   /* ↓ au lieu de 10px 12px */
  height: 36px;        /* force une hauteur fixe identique */
  font-size: 0.95rem;  /* cohérent avec staticText */
color: #000000;
}

/* Corrige l’alignement de la sous-carte abonnement */
.subcard.sub-account {
  margin-top: 0;
  padding: 0;              /* pas besoin d’espace en trop */
  background: transparent; /* plus de fond coloré */
  border: none;            /* plus de bordure */
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

/* Étirement horizontal d’un controlPanel (utile pour username) */
.controlPanel.stretch { 
  width: 100%;
  display: inline-flex;        /* on garde l’inline-flex de base */
}
.controlPanel.stretch .input {
  flex: 1 1 auto;              /* l’input prend toute la place dispo */
  min-width: 0;                /* évite tout overflow */
}

/* Cette règle est la cause du non-étirement. On la neutralise quand .stretch est présent */
.controlPanel.inline { width: max-content; }  /* ← EXISTANT, ON LE GARDE */
.controlPanel.inline.stretch { width: 100%; } /* ← AJOUT : priorité quand .stretch est là */

/* ---------- Alignement boutons & champs ---------- */

/* Bouton crayon (icône edit) */
.iconButton {
  height: 35px;          /* même hauteur que les inputs */
  width: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Bouton Vérifier / Changer de forfait */
.btn.small {
  height: 35px;          /* force la même hauteur */
  padding: 0 12px;       /* réduit le vertical, garde le horizontal */
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;        /* évite les décalages texte */
}

/* Assure que l’input prend bien toute la place dispo */
.controlPanel.pwd .input{
  width: 100%;
}

/* Même hauteur que les inputs compacts, et barre à droite */
.controlPanel.pwd {
width: 100%;  
display: grid;
  grid-template-columns: 1fr auto auto; /* champ à gauche, jauge à droite */
  align-items: center;
  gap: 10px;
  min-height: 32px; /* aligne la hauteur sur les autres champs */
}

/* Jauge inline à droite du champ */
.strengthInline {
  display: inline-grid;
  grid-auto-flow: column;
  gap: 6px;
}
.strengthInline .bar {
  width: 18px;
  height: 8px;
  border-radius: 999px;
  background: #262626;                /* off */
  border: 1px solid var(--card-border, rgba(255,255,255,0.10));;
}

/* ON = couleurs punchy (mêmes accents que la sidebar) */
.strengthInline .bar[data-on="true"]:nth-child(1){
  background: var(--accent-red);
  box-shadow: 0 0 8px color-mix(in oklab, var(--accent-red) 55%, transparent);
}
.strengthInline .bar[data-on="true"]:nth-child(2){
  background: var(--accent-orange);
  box-shadow: 0 0 8px color-mix(in oklab, var(--accent-orange) 55%, transparent);
}
.strengthInline .bar[data-on="true"]:nth-child(3){
  background: var(--accent-emerald);
  box-shadow: 0 0 8px color-mix(in oklab, var(--accent-emerald) 55%, transparent);
}

/* Harmonise la hauteur des petits boutons avec les inputs (au cas où) */
.btn.small,
.iconButton {
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding-top: 0;
  padding-bottom: 0;
}

/* PATCH — éviter le rétrécissement en mode édition + virer le “double cadre” */
.profile .editRow .controlPanel {
  width: 100%;             /* l'input ne rétrécit plus quand il est vide */
  border: 0;               /* supprime la bordure du wrapper */
  background: transparent; /* supprime le fond du wrapper */
  padding: 0;              /* supprime le padding du wrapper */
  box-shadow: none;        /* pas d'effet "carte" en plus */
}
.profile .editRow .controlPanel.inline { width: 100%; } /* au cas où */

/* Hauteur et largeur des inputs en édition */
.profile .editRow .input { height: 40px; width: 100%; }

/* Boutons Valider / Annuler : espace + taille uniforme */
.profile .editActions { display: flex; gap: 10px; }
.profile .editActions .btn {
  min-width: 120px;  /* mêmes dimensions visuelles */
  height: 40px;
  padding: 8px 14px;
}

/* Empêcher le rétrécissement en mode statique (affichage) */
.profile .nameRowStatic,
.profile .emailRowStatic {
  grid-template-columns: 1fr auto; /* la boîte prend toute la largeur, le crayon reste en auto */
}

.profile .staticBox {
  width: 100%;
  box-sizing: border-box;
  height: 36px;         /* même hauteur que tes inputs compacts */
  padding: 6px 10px;      /* pas de padding vertical qui gonfle la ligne */
  display: inline-flex; /* aligne le texte au centre verticalement */
  align-items: center;
}

/* === Force la carte "Coordonnées du compte" en 4 colonnes sur large écran === */
.card.tone-emerald .grid.two {
  /* comportement mobile / small : 1 colonne (déjà par défaut) */
  grid-template-columns: 1fr;
  gap: 14px;
}

/* dès 768px on passe à 2 colonnes (défaut existant),
   mais ici on force 4 colonnes pour IBAN / BIC / Banque / Titulaire */
@media (min-width: 768px) {
  .card.tone-emerald .grid.two {
    grid-template-columns: repeat(2, 1fr);
    align-items: start;
  }
}

/* si les inputs débordent, on s'assure qu'ils tiennent bien */
.card.tone-emerald .field { 
  min-width: 0; 
}
.card.tone-emerald .field .controlPanel,
.card.tone-emerald .field .staticBox {
  width: 100%;
  box-sizing: border-box;
}

/* --- Compactage de la carte “Coordonnées du compte” --- */
.card.tone-emerald { padding: 14px; }
.card.tone-emerald .field { padding: 8px; }
.card.tone-emerald .field label { font-size: 15px; margin-bottom: 4px; }
.card.tone-emerald .staticBox { height: 32px; padding: 4px 8px; font-size: 15px; }
.card.tone-emerald .controlPanel { padding: 4px 6px; border-radius: 10px; }
.card.tone-emerald .input { height: 34px; padding: 6px 8px; font-size: 0.95rem; }

/* Coordonnées du compte : occupe 1 colonne (50%) dans la grille principale */
.card.tone-emerald {
  grid-column: auto;
}

/* Barre de séparation entre Infos (gauche) et Sécurité (droite) */
.leftCol {
  border-right: 1px solid var(--border, rgba(255,255,255,0.15));
  padding-right: 20px;
}
.leftCol + .col {
  padding-left: 8px;
}

/* — Réseaux & Sites internet : pleine largeur + 4 colonnes en large — */
.card.tone-violet { 
  grid-column: 1 / -1;                 /* la carte s'étire sur les 2 colonnes */
}

.card.tone-violet .grid.two {
  grid-template-columns: 1fr;          /* mobile: 1 col */
}

@media (min-width: 768px) {
  .card.tone-violet .grid.two {
    grid-template-columns: 1fr 1fr;    /* tablette: 2 cols */
  }
}

@media (min-width: 1200px) {
  .card.tone-violet .grid.two {
    grid-template-columns: repeat(4, 1fr); /* desktop large: 4 cols */
  }
}

/* — Sessions & appareils : pleine largeur + 2 fiches côte à côte en large — */
.card.tone-orange {
  grid-column: 1 / -1;   /* la carte occupe toute la grille */
}

.card.tone-orange .table{
  display: grid;
  grid-template-columns: 1fr;   /* mobile : 1 par ligne */
  gap: 12px;
  border: 0;                    /* plus de bordure globale */
  overflow: visible;
}

.card.tone-orange .table .row{
  background: #01161B;             /* chaque ligne = une carte */
  border: 1px solid var(--border);
  border-radius: 12px;
}

/* L’en-tête reste en haut et s’étire sur toute la largeur */
.card.tone-orange .table .row.head{
  grid-column: 1 / -1;
  background: #0e0e0e;
  border-radius: 12px;
}

/* Desktop large : 2 fiches côte à côte */
@media (min-width: 1200px){
  .card.tone-orange .table{
    grid-template-columns: 1fr 1fr;
  }
}

/* — Achats effectués : pleine largeur aussi — */
.card.tone-magenta {
  grid-column: 1 / -1;
}

/* — Achats effectués : pleine largeur + cartes qui se placent à côté puis à la ligne — */
.card.tone-magenta { 
  grid-column: 1 / -1;                  /* pleine largeur */
}
.card.tone-magenta.narrow { 
  max-width: none;                       /* annule la limite 900px */
}

.card.tone-magenta .table{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* à côté puis retour à la ligne */
  gap: 12px;
  border: 0; 
  overflow: visible;
}

/* On masque l’en-tête de tableau (inutile en mode cartes) */
.card.tone-magenta .table .row.head{
  display: none;
}

/* Chaque achat devient une “carte” */
.card.tone-magenta .table .row{
  background: #01161B;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;

  /* à l’intérieur de la carte, on met 2 colonnes fluides */
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}

/* Les 4 champs (Date / Réf / Montant / Document) se répartissent sur 2×2 */
.card.tone-magenta .table .row > span:nth-child(1), /* Date */
.card.tone-magenta .table .row > span:nth-child(2){ /* Référence */
  grid-column: auto;
}
.card.tone-magenta .table .row > span:nth-child(3){ /* Montant */
  grid-column: 1;                                   /* passe à la ligne */
}
.card.tone-magenta .table .row > a.btn{             /* Document (bouton PDF) */
  justify-self: end;
}

/* Sur petits écrans : 1 seule colonne par carte (tout se stack) */
@media (max-width: 420px){
  .card.tone-magenta .table .row{
    grid-template-columns: 1fr;
  }
  .card.tone-magenta .table .row > a.btn{
    justify-self: start;
  }
}

/* Neutralise le jaune autofill des navigateurs */
.input:-webkit-autofill,
.input:-webkit-autofill:hover,
.input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text, #000000);
  caret-color: var(--text, #e6e8ec);
  box-shadow: 0 0 0 1000px #909090 inset;  /* ← mets ici la même couleur de fond que tes autres inputs */
  transition: background-color 9999s ease 0s;
}

.input:-moz-autofill {
  -moz-text-fill-color: var(--text, #000000);
  box-shadow: 0 0 0 1000px #909090 inset;  /* idem pour Firefox */
}

.editBankHeader {
  position: absolute;
  top: 12px;
  right: 14px;
}

.cardsGrid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;   /* ← au lieu de "start" */
  grid-auto-flow: dense;
}
@media (min-width: 1024px) {
  .cardsGrid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: stretch;  /* ← ajoute ça ici aussi */
  }
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
  color: var(--accent-cyan);
  font-weight: 900;
}

.header .subtitle {
  color: #ffffff;
  font-weight: 700;
  opacity: .92;
}

`}</style>

    </section>
  );
}

/* Icône crayon */
function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
      <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor" />
    </svg>
  );
}
