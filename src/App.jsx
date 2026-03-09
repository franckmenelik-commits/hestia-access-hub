import { useState, useEffect } from "react";

// ============================================================
// STACK GRATUIT :
// - Supabase (auth + base de données) → supabase.com
// - Stripe (paiements) → stripe.com
// - Resend (emails) → resend.com
// - Vercel (hébergement) → vercel.com
// Tous gratuits pour démarrer. 0$/mois.
// ============================================================

// ── ANTI-BYPASS ENGINE ──────────────────────────────────────
const redactContact = (text) => {
return text
.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "🔒 [email masqué]")
.replace(/(?:\+?\d[\d\s-().]{8,}\d)/g, "🔒 [téléphone masqué]")
.replace(/@\w{2,}/g, "🔒 [handle masqué]")
.replace(/\b(instagram|whatsapp|telegram|facebook|snapchat|signal|wechat|line)\b/gi, “🔒 [réseau masqué]”)
.replace(/\b(mon insta|mon ig|mon snap|mon télé|mon numéro|my number|my insta)\b/gi, “🔒 [contact masqué]”);
};

// ── MATCHING ENGINE ─────────────────────────────────────────
const computeScore = (a, b) => {
let score = 0;
// Régions complémentaires (ils ont ce que l’autre veut)
if (a.home_location !== b.home_location) score += 30;
// Vibe compatible
const vibeCompat = { design: [“design”,“nature”], chaleureux: [“chaleureux”,“urbain”], nature: [“design”,“nature”], urbain: [“chaleureux”,“urbain”], cozy: [“cozy”,“urban”], minimal: [“minimal”,“nature”], urban: [“cozy”,“urban”] };
if (vibeCompat[a.home_vibe]?.includes(b.home_vibe)) score += 20;
// Style hôte compatible avec style invité
if ((a.hosting_style === “precis” && b.guest_behavior === “respectueux”) ||
(a.hosting_style === “flexible” && b.guest_behavior === “naturel”) ||
(a.hosting_style === “guide” && b.guest_behavior === “curieux”)) score += 25;
// Règles compatibles (dealbreakers)
const aRules = a.home_rules || [];
const bRules = b.home_rules || [];
const incompatible = (aRules.includes(“pas_animaux”) && bRules.includes(“animaux_ok”)) ||
(bRules.includes(“pas_animaux”) && aRules.includes(“animaux_ok”)) ||
(aRules.includes(“pas_enfants”) && bRules.includes(“enfants_ok”)) ||
(bRules.includes(“pas_enfants”) && aRules.includes(“enfants_ok”));
if (!incompatible) score += 15;
else score -= 30;
// Fréquence de voyage similaire
if (a.travel_rhythm === b.travel_rhythm) score += 10;
return Math.min(99, Math.max(40, score));
};

// ── MOCK DATA ────────────────────────────────────────────────
const MOCK_USERS = [
{ id: “u1”, name: “Sacha M.”, location: “République Dominicaine”, avatar: “🌴”, isPremium: true, answers: { home_location: “americas”, home_vibe: “nature”, hosting_style: “flexible”, guest_behavior: “naturel”, home_rules: [“animaux_ok”,“non_fumeur”], travel_rhythm: “3_4”, match_priority: “destination” }, bio: “Maison face à la plage, 4 chambres, piscine privée. On adore recevoir.”, photos: [“🏖️”,“🌺”,“🏠”] },
{ id: “u2”, name: “Léa & Tom B.”, location: “Paris, France”, avatar: “🗼”, isPremium: true, answers: { home_location: “europe”, home_vibe: “chaleureux”, hosting_style: “guide”, guest_behavior: “curieux”, home_rules: [“non_fumeur”,“pas_fete”], travel_rhythm: “3_4”, match_priority: “style_vie” }, bio: “Appart Marais 3P, déco vintage, à 5 min du Centre Pompidou.”, photos: [“🛋️”,“🎨”,“🌆”] },
{ id: “u3”, name: “Carlos V.”, location: “Barcelona, Espagne”, avatar: “🌞”, isPremium: false, answers: { home_location: “europe”, home_vibe: “urbain”, hosting_style: “discret”, guest_behavior: “naturel”, home_rules: [“animaux_ok”], travel_rhythm: “5_plus”, match_priority: “communication” }, bio: “Penthouse Eixample, terrasse 60m², vue sur Sagrada Família.”, photos: [“🏙️”,“☀️”,“🍷”] },
{ id: “u4”, name: “Amara D.”, location: “Dakar, Sénégal”, avatar: “🌍”, isPremium: true, answers: { home_location: “africa”, home_vibe: “chaleureux”, hosting_style: “guide”, guest_behavior: “social”, home_rules: [“non_fumeur”,“enfants_ok”], travel_rhythm: “1_2”, match_priority: “confiance” }, bio: “Villa familiale à 10min de la plage de N’Gor. Cuisine sénégalaise garantie.”, photos: [“🌊”,“🏡”,“🌅”] },
{ id: “u5”, name: “Yuki T.”, location: “Tokyo, Japon”, avatar: “⛩️”, isPremium: true, answers: { home_location: “asia”, home_vibe: “design”, hosting_style: “precis”, guest_behavior: “respectueux”, home_rules: [“non_fumeur”,“pas_animaux”,“pas_fete”], travel_rhythm: “3_4”, match_priority: “style_vie” }, bio: “Appartement minimaliste Shinjuku, 2 chambres, vue sur les jardins.”, photos: [“🌸”,“🏯”,“✨”] },
];

const MOCK_MESSAGES = {
“u1”: [
{ from: “them”, text: “Bonjour ! J’ai vu ton profil et je pense qu’on serait un excellent match. Ma maison en RD est dispo en juillet.”, time: “10:32” },
{ from: “me”, text: “Super ! Montréal serait parfait pour vous en juillet, il fait beau. C’est un chalet à 45min de la ville.”, time: “10:45” },
{ from: “them”, text: “On peut s’échanger nos numéros pour continuer ?”, time: “10:47” },
{ from: “them”, text: “Mon whatsapp c’est +1 809 XXXXXXX”, time: “10:48”, redacted: true },
],
“u2”: [
{ from: “them”, text: “Coucou, ton profil nous plaît beaucoup ! On cherche justement quelque chose pour août.”, time: “Hier” },
],
};

// ── TRANSLATIONS ─────────────────────────────────────────────
const T = {
fr: {
tagline: “Échangez votre maison avec des gens qui lui ressemblent.”,
sub: “La première plateforme de home exchange basée sur la compatibilité humaine.”,
cta: “Créer mon profil gratuitement”,
login: “Se connecter”,
pricing_title: “Simple et transparent”,
free_label: “Gratuit”, free_price: “0€”, free_desc: “Pour toujours”,
free_f: [“Créer un profil”, “Voir vos matchs (score visible)”, “1 aperçu de message”],
member_label: “Member”, member_price: “99€”, member_desc: “par an”,
member_f: [“Tout le gratuit”, “Messagerie complète”, “3 échanges / an”, “Badge vérifié”],
premium_label: “Premium”, premium_price: “199€”, premium_desc: “par an”,
premium_f: [“Tout Member”, “Matchs prioritaires”, “Échanges illimités”, “Support dédié”],
start: “Commencer”,
anti_title: “Pourquoi passer par Hestia ?”,
anti_1: “Les contacts sont masqués jusqu’à la confirmation d’échange sur la plateforme.”,
anti_2: “Chaque échange confirmé génère un code de protection des deux côtés.”,
anti_3: “Les avis ne peuvent être laissés qu’après un échange vérifié.”,
nav_matches: “Mes matchs”, nav_messages: “Messages”, nav_profile: “Mon profil”, nav_exchanges: “Échanges”,
match_score: “compatibilité”,
locked_msg: “Passe en Member pour envoyer des messages”,
upgrade: “Passer en Member — 99€/an”,
confirm_exchange: “Confirmer l’échange”,
exchange_confirmed: “Échange confirmé ✓ — Contacts révélés”,
redacted_notice: “🔒 Ce message contenait des coordonnées. Confirmez l’échange pour les voir.”,
propose: “Proposer un échange”,
send: “Envoyer”,
type_msg: “Votre message…”,
free_blur: “Passez en Member pour voir ce match”,
},
en: {
tagline: “Swap your home with people who share your vibe.”,
sub: “The first home exchange platform built on human compatibility.”,
cta: “Create my profile — free”,
login: “Log in”,
pricing_title: “Simple & transparent”,
free_label: “Free”, free_price: “$0”, free_desc: “Forever”,
free_f: [“Create a profile”, “See your matches (score visible)”, “1 message preview”],
member_label: “Member”, member_price: “$99”, member_desc: “per year”,
member_f: [“Everything in Free”, “Full messaging”, “3 exchanges / year”, “Verified badge”],
premium_label: “Premium”, premium_price: “$199”, premium_desc: “per year”,
premium_f: [“Everything in Member”, “Priority matching”, “Unlimited exchanges”, “Dedicated support”],
start: “Get started”,
anti_title: “Why keep it on Hestia?”,
anti_1: “Contact info is hidden until both parties confirm the exchange on the platform.”,
anti_2: “Every confirmed exchange generates a protection code for both sides.”,
anti_3: “Reviews can only be left after a verified exchange.”,
nav_matches: “My matches”, nav_messages: “Messages”, nav_profile: “My profile”, nav_exchanges: “Exchanges”,
match_score: “compatibility”,
locked_msg: “Upgrade to Member to send messages”,
upgrade: “Upgrade to Member — $99/year”,
confirm_exchange: “Confirm exchange”,
exchange_confirmed: “Exchange confirmed ✓ — Contacts revealed”,
redacted_notice: “🔒 This message contained contact info. Confirm the exchange to reveal it.”,
propose: “Propose an exchange”,
send: “Send”,
type_msg: “Your message…”,
free_blur: “Upgrade to Member to see this match”,
}
};

// ── QUESTIONNAIRE DATA ────────────────────────────────────────
const getQuestions = (lang) => lang === “fr” ? [
{ id: “home_location”, category: “Ta maison”, question: “Où se trouve ta maison ?”, subtitle: “Le point de départ de tout échange”, type: “select”,
options: [{ value: “americas”, label: “🌎 Amériques” }, { value: “europe”, label: “🌍 Europe” }, { value: “africa”, label: “🌍 Afrique” }, { value: “asia”, label: “🌏 Asie & Océanie” }] },
{ id: “home_vibe”, category: “L’âme de ta maison”, question: “Comment tu décrirais ton espace ?”, subtitle: “Choisis ce qui lui ressemble le mieux”, type: “select”,
options: [{ value: “design”, label: “✦ Épuré & design”, desc: “Chaque objet a sa place” }, { value: “chaleureux”, label: “☕ Chaleureux & vivant”, desc: “Des livres, des plantes, une cuisine qui sent bon” }, { value: “nature”, label: “🌿 Nature & calme”, desc: “Jardin, lumière naturelle, loin du bruit” }, { value: “urbain”, label: “⚡ Urbain & dynamique”, desc: “En plein cœur de la ville” }] },
{ id: “hosting_style”, category: “Toi comme hôte”, question: “Quel type d’hôte tu es ?”, subtitle: “Sois honnête”, type: “select”,
options: [{ value: “guide”, label: “🗺️ Le guide local”, desc: “Je prépare un carnet d’adresses secrètes” }, { value: “discret”, label: “🔑 Le discret bienveillant”, desc: “Je laisse les clés et fais confiance” }, { value: “precis”, label: “📋 Le précis & organisé”, desc: “J’ai des règles claires à respecter” }, { value: “flexible”, label: “🌊 Le flexible”, desc: “Installe-toi comme chez toi, vraiment” }] },
{ id: “guest_behavior”, category: “Toi comme invité”, question: “Dans une maison qui n’est pas la tienne, tu es…”, subtitle: “La vraie question de compatibilité”, type: “select”,
options: [{ value: “respectueux”, label: “🧘 Ultra respectueux”, desc: “Je laisse tout comme je l’ai trouvé” }, { value: “naturel”, label: “🏡 Naturel & à l’aise”, desc: “Je vis normalement et range bien avant de partir” }, { value: “curieux”, label: “🔍 Curieux & attentionné”, desc: “J’essaie de comprendre leur façon de vivre” }, { value: “social”, label: “💬 Social”, desc: “J’aime rester en contact avec les hôtes” }] },
{ id: “home_rules”, category: “Tes règles”, question: “Ce qui est non-négociable chez toi ?”, subtitle: “Sélectionne tout ce qui s’applique”, type: “multi”,
options: [{ value: “non_fumeur”, label: “🚭 Non-fumeur” }, { value: “pas_animaux”, label: “🐾 Pas d’animaux” }, { value: “animaux_ok”, label: “🐕 Animaux bienvenus” }, { value: “pas_fete”, label: “🔇 Pas de fêtes” }, { value: “enfants_ok”, label: “👨‍👩‍👧 Familles bienvenues” }, { value: “pas_enfants”, label: “🚫 Pas d’enfants” }] },
{ id: “travel_rhythm”, category: “Ton rythme”, question: “Combien de fois par an tu voyages ?”, subtitle: “Pour calibrer tes opportunités”, type: “select”,
options: [{ value: “1_2”, label: “1–2 fois par an”, desc: “Les grandes vacances” }, { value: “3_4”, label: “3–4 fois par an”, desc: “Un long + quelques courts” }, { value: “5_plus”, label: “5 fois ou plus”, desc: “Je voyage dès que je peux” }, { value: “nomade”, label: “Quasi nomade”, desc: “La maison est autant là-bas qu’ici” }] },
{ id: “match_priority”, category: “Le match parfait”, question: “Un bon match c’est avant tout…”, subtitle: “Ce qui prime pour toi”, type: “select”,
options: [{ value: “style_vie”, label: “🌀 Un style de vie compatible” }, { value: “communication”, label: “💬 Une communication fluide” }, { value: “destination”, label: “📍 La bonne destination” }, { value: “confiance”, label: “🔒 Un profil fiable & vérifié” }] },
] : [
{ id: “home_location”, category: “Your home”, question: “Where is your home?”, subtitle: “The starting point of every swap”, type: “select”,
options: [{ value: “americas”, label: “🌎 Americas” }, { value: “europe”, label: “🌍 Europe” }, { value: “africa”, label: “🌍 Africa” }, { value: “asia”, label: “🌏 Asia & Oceania” }] },
{ id: “home_vibe”, category: “Your home’s soul”, question: “How would you describe your space?”, subtitle: “Pick what fits best”, type: “select”,
options: [{ value: “design”, label: “✦ Minimal & designed”, desc: “Every object has its place” }, { value: “cozy”, label: “☕ Cozy & lived-in”, desc: “Books, plants, a kitchen that smells great” }, { value: “nature”, label: “🌿 Nature & calm”, desc: “Garden, natural light, away from noise” }, { value: “urban”, label: “⚡ Urban & dynamic”, desc: “Heart of the city” }] },
{ id: “hosting_style”, category: “You as a host”, question: “What kind of host are you?”, subtitle: “Be honest”, type: “select”,
options: [{ value: “guide”, label: “🗺️ The local guide”, desc: “I prep a secret address book” }, { value: “discret”, label: “🔑 The discreet & trusting”, desc: “I leave the keys and trust completely” }, { value: “precis”, label: “📋 The organized one”, desc: “I have clear rules I want respected” }, { value: “flexible”, label: “🌊 The flexible one”, desc: “Make yourself truly at home” }] },
{ id: “guest_behavior”, category: “You as a guest”, question: “In someone else’s home, you are…”, subtitle: “The real compatibility question”, type: “select”,
options: [{ value: “respectueux”, label: “🧘 Ultra respectful”, desc: “I leave everything as I found it” }, { value: “naturel”, label: “🏡 Natural & comfortable”, desc: “I live normally and tidy well before leaving” }, { value: “curieux”, label: “🔍 Curious & attentive”, desc: “I try to understand how they live” }, { value: “social”, label: “💬 Social”, desc: “I like staying in touch with hosts” }] },
{ id: “home_rules”, category: “Your rules”, question: “What’s non-negotiable at your place?”, subtitle: “Select all that apply”, type: “multi”,
options: [{ value: “non_fumeur”, label: “🚭 No smoking” }, { value: “pas_animaux”, label: “🐾 No pets” }, { value: “animaux_ok”, label: “🐕 Pets welcome” }, { value: “pas_fete”, label: “🔇 No parties” }, { value: “enfants_ok”, label: “👨‍👩‍👧 Families welcome” }, { value: “pas_enfants”, label: “🚫 No children” }] },
{ id: “travel_rhythm”, category: “Your rhythm”, question: “How often do you travel per year?”, subtitle: “To calibrate your opportunities”, type: “select”,
options: [{ value: “1_2”, label: “1–2 times a year”, desc: “Main holidays” }, { value: “3_4”, label: “3–4 times a year”, desc: “One long + a few short” }, { value: “5_plus”, label: “5+ times a year”, desc: “I travel whenever I can” }, { value: “nomade”, label: “Almost nomadic”, desc: “Home is as much there as here” }] },
{ id: “match_priority”, category: “The perfect match”, question: “A great match is above all…”, subtitle: “What matters most to you”, type: “select”,
options: [{ value: “style_vie”, label: “🌀 A compatible lifestyle” }, { value: “communication”, label: “💬 Smooth communication” }, { value: “destination”, label: “📍 The right destination” }, { value: “confiance”, label: “🔒 A verified, reliable profile” }] },
];

// ── STYLES ───────────────────────────────────────────────────
const C = {
bg: “#080a0f”, bgCard: “rgba(255,255,255,0.03)”, bgCard2: “rgba(255,255,255,0.06)”,
gold: “#D4AF6A”, goldLight: “#E8C980”, purple: “#8B7FD4”,
text: “#F0EDE8”, textMuted: “rgba(240,237,232,0.45)”, textDim: “rgba(240,237,232,0.25)”,
border: “rgba(255,255,255,0.08)”, borderGold: “rgba(212,175,106,0.3)”,
grad: “linear-gradient(135deg, #D4AF6A, #8B7FD4)”,
gradBtn: “linear-gradient(135deg, #D4AF6A 0%, #C4956A 50%, #8B7FD4 100%)”,
};

const base = { fontFamily: “‘Georgia’, ‘Times New Roman’, serif”, color: C.text, background: C.bg, minHeight: “100vh” };

const tag = (extra = {}) => ({ fontSize: “0.6rem”, letterSpacing: “0.25em”, textTransform: “uppercase”, color: C.gold, fontFamily: “sans-serif”, …extra });
const heading = (size = “2rem”, extra = {}) => ({ fontSize: size, fontWeight: 700, color: C.text, letterSpacing: “-0.02em”, lineHeight: 1.2, …extra });
const body = (extra = {}) => ({ fontSize: “0.9rem”, color: C.textMuted, fontFamily: “sans-serif”, lineHeight: 1.6, …extra });
const btn = (variant = “primary”, extra = {}) => ({
padding: “0.85rem 1.75rem”, borderRadius: “10px”, border: “none”, cursor: “pointer”,
fontSize: “0.85rem”, fontWeight: 700, fontFamily: “sans-serif”, letterSpacing: “0.05em”,
background: variant === “primary” ? C.gradBtn : variant === “ghost” ? “transparent” : C.bgCard2,
color: variant === “primary” ? “#080a0f” : C.text,
border: variant === “ghost” ? `1px solid ${C.border}` : “none”,
transition: “all 0.2s ease”, …extra
});
const card = (extra = {}) => ({ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: “14px”, padding: “1.5rem”, …extra });
const input = (extra = {}) => ({ width: “100%”, padding: “0.85rem 1rem”, borderRadius: “10px”, border: `1px solid ${C.border}`, background: “rgba(255,255,255,0.04)”, color: C.text, fontSize: “0.9rem”, fontFamily: “sans-serif”, outline: “none”, boxSizing: “border-box”, …extra });

// ── COMPONENTS ───────────────────────────────────────────────
const ProgressBar = ({ current, total }) => (

  <div style={{ height: "2px", background: C.border, borderRadius: "2px", marginBottom: "2.5rem" }}>
    <div style={{ height: "100%", width: `${(current / total) * 100}%`, background: C.grad, borderRadius: "2px", transition: "width 0.5s ease" }} />
  </div>
);

const ScoreBadge = ({ score }) => {
const color = score >= 80 ? “#6ED9A0” : score >= 65 ? C.gold : “#E07070”;
return (
<div style={{ display: “inline-flex”, alignItems: “center”, gap: “0.4rem”, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: “99px”, padding: “0.3rem 0.75rem” }}>
<div style={{ width: “6px”, height: “6px”, borderRadius: “50%”, background: color }} />
<span style={{ fontSize: “0.8rem”, fontWeight: 700, color, fontFamily: “sans-serif” }}>{score}%</span>
</div>
);
};

const Avatar = ({ emoji, size = 48 }) => (

  <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(212,175,106,0.15)", border: `1px solid ${C.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, flexShrink: 0 }}>
    {emoji}
  </div>
);

// ── LANDING PAGE ─────────────────────────────────────────────
const LandingPage = ({ lang, setLang, onStart }) => {
const t = T[lang];
return (
<div style={{ …base, overflowX: “hidden” }}>
{/* Orbs */}
<div style={{ position: “fixed”, top: “-20%”, right: “-10%”, width: “60vw”, height: “60vw”, borderRadius: “50%”, background: “radial-gradient(circle, rgba(212,175,106,0.07) 0%, transparent 65%)”, pointerEvents: “none”, zIndex: 0 }} />
<div style={{ position: “fixed”, bottom: “-20%”, left: “-10%”, width: “50vw”, height: “50vw”, borderRadius: “50%”, background: “radial-gradient(circle, rgba(139,127,212,0.07) 0%, transparent 65%)”, pointerEvents: “none”, zIndex: 0 }} />

```
  {/* Nav */}
  <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 2rem", position: "relative", zIndex: 1 }}>
    <span style={{ fontSize: "1rem", letterSpacing: "0.3em", color: C.text, fontStyle: "italic" }}>HESTIA</span>
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <button style={btn("ghost", { padding: "0.5rem 1rem", fontSize: "0.75rem" })} onClick={() => setLang(l => l === "fr" ? "en" : "fr")}>{lang === "fr" ? "EN" : "FR"}</button>
      <button style={btn("ghost", { padding: "0.5rem 1rem", fontSize: "0.75rem" })} onClick={onStart}>{t.login}</button>
    </div>
  </nav>

  {/* Hero */}
  <div style={{ textAlign: "center", padding: "5rem 2rem 4rem", position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto" }}>
    <div style={{ ...tag(), marginBottom: "1.5rem" }}>Home Exchange — Reimagined</div>
    <h1 style={{ ...heading("3rem"), marginBottom: "1.25rem", background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
      {t.tagline}
    </h1>
    <p style={{ ...body(), fontSize: "1.05rem", marginBottom: "2.5rem", maxWidth: "500px", margin: "0 auto 2.5rem" }}>{t.sub}</p>
    <button style={btn("primary", { fontSize: "1rem", padding: "1rem 2.5rem" })} onClick={onStart}>{t.cta}</button>
  </div>

  {/* Anti-bypass block */}
  <div style={{ maxWidth: "800px", margin: "0 auto 5rem", padding: "0 2rem", position: "relative", zIndex: 1 }}>
    <div style={card({ borderColor: C.borderGold })}>
      <div style={{ ...tag(), marginBottom: "1rem", textAlign: "center" }}>{t.anti_title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
        {[t.anti_1, t.anti_2, t.anti_3].map((txt, i) => (
          <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <span style={{ color: C.gold, fontSize: "1.1rem", marginTop: "0.1rem" }}>✦</span>
            <p style={body({ fontSize: "0.85rem" })}>{txt}</p>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Pricing */}
  <div style={{ maxWidth: "900px", margin: "0 auto 6rem", padding: "0 2rem", position: "relative", zIndex: 1 }}>
    <div style={{ ...tag(), textAlign: "center", marginBottom: "2rem" }}>{t.pricing_title}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
      {[
        { label: t.free_label, price: t.free_price, desc: t.free_desc, features: t.free_f, highlight: false },
        { label: t.member_label, price: t.member_price, desc: t.member_desc, features: t.member_f, highlight: true },
        { label: t.premium_label, price: t.premium_price, desc: t.premium_desc, features: t.premium_f, highlight: false },
      ].map((plan, i) => (
        <div key={i} style={card({ borderColor: plan.highlight ? C.borderGold : C.border, position: "relative", overflow: "hidden" })}>
          {plan.highlight && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: C.grad }} />}
          <div style={{ ...tag(), marginBottom: "0.5rem" }}>{plan.label}</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 700, color: plan.highlight ? C.gold : C.text, marginBottom: "0.25rem" }}>{plan.price}</div>
          <div style={body({ fontSize: "0.8rem", marginBottom: "1.5rem" })}>{plan.desc}</div>
          {plan.features.map((f, j) => (
            <div key={j} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem", alignItems: "center" }}>
              <span style={{ color: C.gold, fontSize: "0.7rem" }}>✓</span>
              <span style={body({ fontSize: "0.82rem" })}>{f}</span>
            </div>
          ))}
          <button style={btn(plan.highlight ? "primary" : "ghost", { width: "100%", marginTop: "1.5rem" })} onClick={onStart}>{t.start}</button>
        </div>
      ))}
    </div>
  </div>
</div>
```

);
};

// ── AUTH PAGE ────────────────────────────────────────────────
const AuthPage = ({ lang, onAuth }) => {
const [isLogin, setIsLogin] = useState(false);
const [name, setName] = useState(””);
const [email, setEmail] = useState(””);
// → Supabase: supabase.auth.signUp({ email, password }) or signInWithPassword
return (
<div style={{ …base, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: “2rem” }}>
<div style={{ maxWidth: “420px”, width: “100%” }}>
<div style={{ textAlign: “center”, marginBottom: “2.5rem” }}>
<div style={{ fontSize: “1rem”, letterSpacing: “0.3em”, color: C.text, fontStyle: “italic”, marginBottom: “0.5rem” }}>HESTIA</div>
<h2 style={heading(“1.5rem”)}>{isLogin ? (lang === “fr” ? “Bon retour” : “Welcome back”) : (lang === “fr” ? “Rejoindre Hestia” : “Join Hestia”)}</h2>
</div>
<div style={card()}>
{!isLogin && <input style={{ …input(), marginBottom: “0.75rem” }} placeholder={lang === “fr” ? “Ton prénom” : “Your first name”} value={name} onChange={e => setName(e.target.value)} />}
<input style={{ …input(), marginBottom: “0.75rem” }} placeholder=“Email” type=“email” value={email} onChange={e => setEmail(e.target.value)} />
<input style={{ …input(), marginBottom: “1.5rem” }} placeholder={lang === “fr” ? “Mot de passe” : “Password”} type=“password” />
<button style={btn(“primary”, { width: “100%” })} onClick={() => onAuth(name || “Vous”, email)}>
{isLogin ? (lang === “fr” ? “Se connecter” : “Log in”) : (lang === “fr” ? “Créer mon compte” : “Create account”)}
</button>
<p style={{ …body({ fontSize: “0.8rem”, textAlign: “center”, marginTop: “1rem”, cursor: “pointer” })} onClick={() => setIsLogin(!isLogin)}>
{isLogin ? (lang === “fr” ? “Pas encore de compte ? Créer un profil” : “No account? Create one”) : (lang === “fr” ? “Déjà un compte ? Se connecter” : “Already have an account? Log in”)}
</p>
</div>
</div>
</div>
);
};

// ── QUESTIONNAIRE ────────────────────────────────────────────
const Questionnaire = ({ lang, onComplete }) => {
const [step, setStep] = useState(0);
const [answers, setAnswers] = useState({});
const [otherText, setOtherText] = useState({});
const questions = getQuestions(lang);
const q = questions[step];
const isMulti = q?.type === “multi”;
const selected = answers[q?.id];
const canContinue = isMulti ? (selected?.length > 0) : !!selected;

const handleSelect = (value) => {
if (isMulti) {
const cur = answers[q.id] || [];
const upd = cur.includes(value) ? cur.filter(v => v !== value) : […cur, value];
setAnswers({ …answers, [q.id]: upd });
} else {
setAnswers({ …answers, [q.id]: value });
}
};

return (
<div style={{ …base, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: “2rem 1rem” }}>
<div style={{ maxWidth: “540px”, width: “100%” }}>
<div style={{ textAlign: “center”, marginBottom: “2rem” }}>
<span style={{ fontSize: “0.85rem”, letterSpacing: “0.3em”, color: C.text, fontStyle: “italic” }}>HESTIA</span>
</div>
<ProgressBar current={step + 1} total={questions.length} />
<div style={{ …tag(), marginBottom: “0.6rem” }}>{q.category}</div>
<h2 style={{ …heading(“1.75rem”), marginBottom: “0.5rem” }}>{q.question}</h2>
<p style={{ …body(), marginBottom: “1.75rem” }}>{q.subtitle}</p>
<div style={{ display: isMulti ? “grid” : “flex”, gridTemplateColumns: isMulti ? “1fr 1fr” : undefined, flexDirection: isMulti ? undefined : “column”, gap: “0.6rem”, marginBottom: “1.5rem” }}>
{q.options.map(opt => {
const sel = isMulti ? (selected || []).includes(opt.value) : selected === opt.value;
return (
<button key={opt.value} onClick={() => handleSelect(opt.value)}
style={{ padding: “0.9rem 1.1rem”, borderRadius: “10px”, border: `1px solid ${sel ? C.borderGold : C.border}`, background: sel ? “rgba(212,175,106,0.08)” : C.bgCard, cursor: “pointer”, textAlign: “left”, display: “flex”, flexDirection: “column”, gap: “0.2rem”, transition: “all 0.15s” }}>
<span style={{ fontSize: “0.9rem”, color: sel ? C.gold : C.text, fontFamily: “sans-serif”, fontWeight: sel ? 600 : 400 }}>{opt.label}</span>
{opt.desc && <span style={body({ fontSize: “0.75rem” })}>{opt.desc}</span>}
</button>
);
})}
{/* Other option */}
<div style={{ gridColumn: isMulti ? “span 2” : undefined }}>
<input style={{ …input(), fontSize: “0.85rem” }}
placeholder={lang === “fr” ? “✏️ Autre chose à préciser ? (optionnel)” : “✏️ Anything else to add? (optional)”}
value={otherText[q.id] || “”}
onChange={e => setOtherText({ …otherText, [q.id]: e.target.value })} />
</div>
</div>
<button style={btn(“primary”, { width: “100%”, opacity: canContinue ? 1 : 0.4 })}
onClick={() => { if (!canContinue) return; if (step < questions.length - 1) setStep(s => s + 1); else onComplete(answers); }}>
{step === questions.length - 1 ? (lang === “fr” ? “Voir mes matchs →” : “See my matches →”) : (lang === “fr” ? “Continuer →” : “Continue →”)}
</button>
{step > 0 && <button style={btn(“ghost”, { width: “100%”, marginTop: “0.75rem” })} onClick={() => setStep(s => s - 1)}>{lang === “fr” ? “← Retour” : “← Back”}</button>}
<p style={{ …body({ textAlign: “center”, fontSize: “0.7rem”, marginTop: “1rem” }) }}>{step + 1} / {questions.length}</p>
</div>
</div>
);
};

// ── DASHBOARD ────────────────────────────────────────────────
const Dashboard = ({ lang, user, answers, isPremium, onUpgrade }) => {
const [tab, setTab] = useState(“matches”);
const [activeConv, setActiveConv] = useState(null);
const [msgInput, setMsgInput] = useState(””);
const [conversations, setConversations] = useState(MOCK_MESSAGES);
const [confirmedExchanges, setConfirmedExchanges] = useState([]);
const [isAdmin] = useState(user.email === “admin@hestia.app”);
const t = T[lang];

const matches = MOCK_USERS.map(u => ({ …u, score: computeScore(answers, u.answers) }))
.sort((a, b) => b.score - a.score);

const sendMessage = () => {
if (!msgInput.trim()) return;
const redacted = redactContact(msgInput);
const newMsg = { from: “me”, text: redacted, time: “maintenant” };
setConversations(prev => ({ …prev, [activeConv]: […(prev[activeConv] || []), newMsg] }));
setMsgInput(””);
};

const confirmExchange = (userId) => setConfirmedExchanges(prev => […prev, userId]);

const navItems = [
{ id: “matches”, icon: “✦”, label: t.nav_matches },
{ id: “messages”, icon: “💬”, label: t.nav_messages },
{ id: “exchanges”, icon: “🔄”, label: t.nav_exchanges },
{ id: “profile”, icon: “◉”, label: t.nav_profile },
…(isAdmin ? [{ id: “admin”, icon: “⚙️”, label: “Admin” }] : []),
];

return (
<div style={{ …base, display: “flex”, flexDirection: “column”, minHeight: “100vh” }}>
{/* Top bar */}
<div style={{ padding: “1rem 1.5rem”, borderBottom: `1px solid ${C.border}`, display: “flex”, justifyContent: “space-between”, alignItems: “center” }}>
<span style={{ fontSize: “0.85rem”, letterSpacing: “0.3em”, color: C.text, fontStyle: “italic” }}>HESTIA</span>
<div style={{ display: “flex”, alignItems: “center”, gap: “1rem” }}>
{isPremium && <span style={{ …tag(), color: C.gold, background: “rgba(212,175,106,0.1)”, padding: “0.3rem 0.75rem”, borderRadius: “99px”, border: `1px solid ${C.borderGold}` }}>✦ MEMBER</span>}
<Avatar emoji="👤" size={34} />
</div>
</div>

```
  {/* Bottom nav */}
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0d0f14", borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100 }}>
    {navItems.map(n => (
      <button key={n.id} onClick={() => { setTab(n.id); setActiveConv(null); }}
        style={{ flex: 1, padding: "0.9rem 0.5rem", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
        <span style={{ fontSize: "1rem" }}>{n.icon}</span>
        <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", fontFamily: "sans-serif", color: tab === n.id ? C.gold : C.textDim, textTransform: "uppercase" }}>{n.label}</span>
      </button>
    ))}
  </div>

  {/* Content */}
  <div style={{ flex: 1, padding: "1.5rem", paddingBottom: "5rem", maxWidth: "700px", width: "100%", margin: "0 auto" }}>

    {/* MATCHES */}
    {tab === "matches" && (
      <div>
        <div style={{ ...tag(), marginBottom: "1.5rem" }}>{matches.length} {lang === "fr" ? "matchs trouvés" : "matches found"}</div>
        {matches.map((m, i) => (
          <div key={m.id} style={{ ...card({ marginBottom: "1rem", position: "relative", overflow: "hidden" }), borderColor: i === 0 ? C.borderGold : C.border }}>
            {!isPremium && i >= 2 && (
              <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(8px)", background: "rgba(8,10,15,0.7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2, borderRadius: "14px" }}>
                <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔒</span>
                <p style={body({ fontSize: "0.8rem", textAlign: "center", marginBottom: "1rem" })}>{t.free_blur}</p>
                <button style={btn("primary", { fontSize: "0.8rem", padding: "0.6rem 1.25rem" })} onClick={onUpgrade}>{t.upgrade}</button>
              </div>
            )}
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <Avatar emoji={m.avatar} size={52} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 600, color: C.text }}>{m.name}</span>
                  <ScoreBadge score={m.score} />
                </div>
                <p style={body({ fontSize: "0.8rem", marginBottom: "0.5rem" })}>📍 {m.location}</p>
                <p style={body({ fontSize: "0.82rem", marginBottom: "0.75rem" })}>{m.bio}</p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {isPremium || i < 2 ? (
                    <button style={btn("ghost", { fontSize: "0.78rem", padding: "0.5rem 1rem" })}
                      onClick={() => { setTab("messages"); setActiveConv(m.id); }}>
                      💬 {lang === "fr" ? "Écrire" : "Message"}
                    </button>
                  ) : null}
                  {m.isPremium && <span style={{ ...tag(), color: C.gold, padding: "0.3rem 0.6rem", background: "rgba(212,175,106,0.08)", borderRadius: "6px", border: `1px solid ${C.borderGold}` }}>✦ Vérifié</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {!isPremium && (
          <div style={card({ textAlign: "center", borderColor: C.borderGold })}>
            <p style={body({ marginBottom: "1rem" })}>{lang === "fr" ? `${matches.length - 2} autres matchs disponibles en Member` : `${matches.length - 2} more matches available in Member`}</p>
            <button style={btn("primary")} onClick={onUpgrade}>{t.upgrade}</button>
          </div>
        )}
      </div>
    )}

    {/* MESSAGES */}
    {tab === "messages" && !activeConv && (
      <div>
        <div style={{ ...tag(), marginBottom: "1.5rem" }}>{t.nav_messages}</div>
        {!isPremium && (
          <div style={card({ borderColor: C.borderGold, marginBottom: "1.5rem", textAlign: "center" })}>
            <p style={body({ marginBottom: "1rem" })}>🔒 {t.locked_msg}</p>
            <button style={btn("primary")} onClick={onUpgrade}>{t.upgrade}</button>
          </div>
        )}
        {Object.entries(conversations).map(([uid, msgs]) => {
          const matchUser = MOCK_USERS.find(u => u.id === uid);
          if (!matchUser) return null;
          const last = msgs[msgs.length - 1];
          return (
            <div key={uid} style={{ ...card({ marginBottom: "0.75rem", cursor: isPremium ? "pointer" : "default" }), opacity: isPremium ? 1 : 0.5 }}
              onClick={() => isPremium && setActiveConv(uid)}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <Avatar emoji={matchUser.avatar} size={40} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{matchUser.name}</div>
                  <div style={body({ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                    {last.redacted ? "🔒 " + t.redacted_notice.substring(0, 40) + "..." : last.text.substring(0, 50) + "..."}
                  </div>
                </div>
                <span style={body({ fontSize: "0.72rem" })}>{last.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* CONVERSATION */}
    {tab === "messages" && activeConv && (() => {
      const matchUser = MOCK_USERS.find(u => u.id === activeConv);
      const msgs = conversations[activeConv] || [];
      const isConfirmed = confirmedExchanges.includes(activeConv);
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 10rem)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <button style={btn("ghost", { padding: "0.4rem 0.8rem", fontSize: "0.8rem" })} onClick={() => setActiveConv(null)}>←</button>
            <Avatar emoji={matchUser?.avatar} size={36} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{matchUser?.name}</div>
              <div style={body({ fontSize: "0.75rem" })}>📍 {matchUser?.location}</div>
            </div>
            {!isConfirmed && (
              <button style={btn("primary", { marginLeft: "auto", fontSize: "0.75rem", padding: "0.5rem 0.9rem" })} onClick={() => confirmExchange(activeConv)}>
                {t.confirm_exchange}
              </button>
            )}
            {isConfirmed && <span style={{ ...tag(), color: "#6ED9A0", marginLeft: "auto" }}>{t.exchange_confirmed}</span>}
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingBottom: "1rem" }}>
            {msgs.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "75%", padding: "0.75rem 1rem", borderRadius: msg.from === "me" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.from === "me" ? "rgba(212,175,106,0.15)" : C.bgCard2,
                  border: `1px solid ${msg.from === "me" ? C.borderGold : C.border}` }}>
                  {msg.redacted && !isConfirmed ? (
                    <p style={body({ fontSize: "0.82rem", color: "#E07070" })}>🔒 {t.redacted_notice}</p>
                  ) : (
                    <p style={body({ fontSize: "0.85rem", color: C.text })}>{msg.text}</p>
                  )}
                  <p style={body({ fontSize: "0.68rem", marginTop: "0.3rem", textAlign: "right" })}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.75rem", borderTop: `1px solid ${C.border}` }}>
            <input style={{ ...input(), flex: 1, fontSize: "0.85rem" }} placeholder={t.type_msg} value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()} />
            <button style={btn("primary", { padding: "0.85rem 1.25rem" })} onClick={sendMessage}>{t.send}</button>
          </div>
          <p style={body({ fontSize: "0.7rem", textAlign: "center", marginTop: "0.5rem" })}>
            🔒 {lang === "fr" ? "Coordonnées masquées automatiquement jusqu'à la confirmation d'échange" : "Contact info auto-hidden until exchange confirmation"}
          </p>
        </div>
      );
    })()}

    {/* EXCHANGES */}
    {tab === "exchanges" && (
      <div>
        <div style={{ ...tag(), marginBottom: "1.5rem" }}>{t.nav_exchanges}</div>
        {confirmedExchanges.length === 0 ? (
          <div style={card({ textAlign: "center" })}>
            <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>🏡</p>
            <p style={body()}>{lang === "fr" ? "Aucun échange confirmé pour l'instant. Matchez et confirmez un échange pour commencer." : "No confirmed exchanges yet. Match and confirm an exchange to get started."}</p>
          </div>
        ) : confirmedExchanges.map(uid => {
          const u = MOCK_USERS.find(x => x.id === uid);
          return (
            <div key={uid} style={card({ marginBottom: "1rem", borderColor: "#6ED9A040" })}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <Avatar emoji={u.avatar} size={44} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{u.name}</div>
                  <div style={body({ fontSize: "0.8rem" })}>📍 {u.location}</div>
                  <div style={{ ...tag(), color: "#6ED9A0", marginTop: "0.5rem" }}>✓ {lang === "fr" ? "Échange confirmé — Contacts révélés" : "Confirmed — Contacts revealed"}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* PROFILE */}
    {tab === "profile" && (
      <div>
        <div style={{ ...tag(), marginBottom: "1.5rem" }}>{t.nav_profile}</div>
        <div style={card({ marginBottom: "1rem" })}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
            <Avatar emoji="👤" size={60} />
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>{user.name}</div>
              <div style={body({ fontSize: "0.82rem" })}>{user.email}</div>
              {isPremium && <span style={{ ...tag(), color: C.gold }}>✦ Member</span>}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {Object.entries(answers).slice(0, 4).map(([k, v]) => (
              <div key={k} style={card({ padding: "0.75rem" })}>
                <div style={{ ...tag(), marginBottom: "0.25rem" }}>{k.replace(/_/g, " ")}</div>
                <div style={body({ fontSize: "0.82rem", color: C.text })}>{Array.isArray(v) ? v.join(", ") : v}</div>
              </div>
            ))}
          </div>
        </div>
        {!isPremium && (
          <div style={card({ borderColor: C.borderGold, textAlign: "center" })}>
            <p style={body({ marginBottom: "1rem" })}>{lang === "fr" ? "Passez en Member pour débloquer la messagerie et les échanges." : "Upgrade to Member to unlock messaging and exchanges."}</p>
            <button style={btn("primary")} onClick={onUpgrade}>{t.upgrade}</button>
          </div>
        )}
      </div>
    )}

    {/* ADMIN */}
    {tab === "admin" && isAdmin && (
      <div>
        <div style={{ ...tag(), marginBottom: "0.5rem" }}>Admin Panel</div>
        <p style={body({ marginBottom: "1.5rem" })}>Vue complète — matche les utilisateurs manuellement.</p>
        {MOCK_USERS.map(u => (
          <div key={u.id} style={card({ marginBottom: "0.75rem" })}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Avatar emoji={u.avatar} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: "0.1rem" }}>{u.name} — {u.location}</div>
                <div style={body({ fontSize: "0.78rem" })}>{u.bio}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <button style={btn("primary", { fontSize: "0.72rem", padding: "0.4rem 0.8rem" })}>Matcher</button>
                <button style={btn("ghost", { fontSize: "0.72rem", padding: "0.4rem 0.8rem" })}>Profil</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
```

);
};

// ── APP ROOT ─────────────────────────────────────────────────
export default function HestiaApp() {
const [screen, setScreen] = useState(“landing”); // landing | auth | onboarding | dashboard
const [lang, setLang] = useState(“fr”);
const [user, setUser] = useState(null);
const [answers, setAnswers] = useState({});
const [isPremium, setIsPremium] = useState(false);

const handleAuth = (name, email) => {
setUser({ name, email });
setScreen(“onboarding”);
};

const handleComplete = (ans) => {
setAnswers(ans);
setScreen(“dashboard”);
};

const handleUpgrade = () => {
// → Stripe: stripe.redirectToCheckout({ lineItems: [{ price: ‘price_xxx’, quantity: 1 }] })
// Pour l’instant : simulation
setIsPremium(true);
};

return (
<div>
{screen === “landing” && <LandingPage lang={lang} setLang={setLang} onStart={() => setScreen(“auth”)} />}
{screen === “auth” && <AuthPage lang={lang} onAuth={handleAuth} />}
{screen === “onboarding” && <Questionnaire lang={lang} onComplete={handleComplete} />}
{screen === “dashboard” && <Dashboard lang={lang} user={user || { name: “Vous”, email: “” }} answers={answers} isPremium={isPremium} onUpgrade={handleUpgrade} />}
</div>
);
}
