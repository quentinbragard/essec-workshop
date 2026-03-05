import { useState, useRef } from "react";

const PRESET_COMPANIES = [
  { name: "NovaTech Industries", flag: "🏭", industry: "Mid-size European B2B manufacturer (food & packaging)", revenue: "~350M EUR — 1,200 employees — 3 countries", stack: "SAP · Microsoft 365 + Copilot · Salesforce · Power BI", aiStatus: "No formal AI strategy. Some employees use ChatGPT informally.", problems: ["Sales: Slow response to RFPs, inconsistent proposals", "Customer Service: High volume of repetitive delivery queries", "HR: Manual onboarding, policy questions", "Finance: Manual reporting, time-consuming consolidation", "Operations: Quality control issues, supply chain delays"] },
  { name: "Decathlon", flag: "🚴", industry: "Global sporting goods retail (own-brand + stores)", revenue: "~15B EUR — 100,000+ employees — 60+ countries", stack: "SAP · Salesforce · Google Workspace + Gemini · internal product app", aiStatus: "Gemini for Workspace pilot in marketing. No unified strategy.", problems: ["Merchandising: 80,000+ SKUs — manual product descriptions", "Customer Service: 20M+ annual contacts, mostly repetitive", "Marketing: Low personalization across 60 countries", "HR: Massive seasonal hiring with inconsistent onboarding", "Stores: Reorder management done manually by store managers"] },
  { name: "BNP Paribas", flag: "🏦", industry: "European retail & corporate banking", revenue: "~46B EUR — 190,000 employees — 65 countries", stack: "Microsoft 365 + Copilot · Salesforce · Bloomberg · internal compliance tool", aiStatus: "Copilot deployed to 5,000 employees. No broader GenAI strategy.", problems: ["Compliance: Manual review of thousands of regulatory docs monthly", "Corporate Banking: RFP and pitch book production takes days", "Retail Banking: Advisors spend too much time on admin paperwork", "Legal: Contract review and drafting is slow and manual", "IT: Internal support tickets take 3+ days to resolve"] },
  { name: "Renault Group", flag: "🚗", industry: "Automotive manufacturer (EV transition)", revenue: "~46B EUR — 110,000 employees — global", stack: "SAP · Microsoft 365 + Copilot · Salesforce · internal engineering portal", aiStatus: "Copilot rolled out to engineers. No broader GenAI roadmap.", problems: ["Manufacturing: Technical documentation is outdated and hard to find", "R&D: Engineers spend hours searching internal knowledge bases", "Supply Chain: Supplier communication is slow and unstructured", "HR: Job descriptions and offers written from scratch each time", "Customer: After-sales call centre handles too many repeat queries"] },
  { name: "LVMH", flag: "👜", industry: "Luxury goods conglomerate (75 Maisons)", revenue: "~86B EUR — 200,000 employees — global", stack: "SAP · Salesforce · Google Workspace + Gemini · Maison-specific e-commerce tools", aiStatus: "Each Maison experiments independently. No group-level GenAI governance.", problems: ["Content: Each Maison produces copy in 30+ languages manually", "Clienteling: Advisors have no AI support during client interactions", "HR: Job postings and onboarding materials written manually per Maison", "Legal: Contract and NDA review done manually across 75 entities", "E-commerce: Product page descriptions inconsistent across markets"] },
  { name: "Carrefour", flag: "🛒", industry: "European hypermarket & e-commerce retail", revenue: "~90B EUR — 320,000 employees — 30+ countries", stack: "SAP · Google Workspace + Gemini · Salesforce · internal supply chain tool", aiStatus: "Gemini for Workspace deployed broadly. Limited structured use cases.", problems: ["Supply Chain: Fresh produce waste from poor reorder decisions (~15%)", "Pricing: 500,000+ prices to update daily — mostly manual checks", "Customer: 50M loyalty members receive mostly generic communications", "Private Label: New product briefs and packaging copy written manually", "Stores: Weekly reporting takes store managers 3–4 hours to compile"] },
];

const AI_PRESETS = ["⚡ Prompt", "🛠️ Mini App", "🤖 Agent"];
const DEPTS = ["Sales", "Marketing", "HR", "Finance", "Operations", "Customer Service", "IT / Tech", "Legal & Compliance", "R&D / Product", "Supply Chain", "Strategy"];
const IMPACTS = ["🔴 High", "🟡 Medium", "🟢 Low"];
const COMPLEXITIES = ["🔴 High", "🟡 Medium", "🟢 Low"];
const STRATEGY_TEMPLATES = ["Build in-house AI capabilities with a dedicated Center of Excellence", "Partner with a strategic AI vendor for rapid deployment", "'Test & learn' — run 3–5 department-level pilots simultaneously", "Embed AI into existing licensed tools (Copilot, Einstein, Gemini…)"];

const uid = () => Math.random().toString(36).slice(2);
const emptyOpp = () => ({ dept: "", description: "", aiType: "", impact: "", complexity: "", id: uid() });
const emptyPOC = () => ({ title: "", department: "", objective: "", kpis: "", tools: "", team: "", timeline: "6–8 weeks", exitCriteria: "", id: uid() });

// ── Google Sheets API ────────────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbzu5keEvo6-X6d0gJblgPMR3k4Sjv-CCjlkrmTBKmFmjzrJklJHxqNj_1J_HYr-3E0w/exec";

const api = async (params) => {
  try {
    const url = API_URL + "?" + new URLSearchParams(params);
    const res = await fetch(url);
    return await res.json();
  } catch { return null; }
};

const apiPost = async (body) => {
  try {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(body) });
    return await res.json();
  } catch { return null; }
};

const saveTeam = async (name, data) => {
  await apiPost({ action: "saveTeam", team_name: name, data: JSON.stringify(data), saved_at: Date.now() });
};
const listTeams = async () => {
  const rows = await api({ action: "listTeams" });
  return (rows || []).map(r => ({ teamName: r.team_name, savedAt: r.saved_at, ...JSON.parse(r.data) }));
};
const saveVote = async (voter, target, score) => {
  await apiPost({ action: "saveVote", voter, target, score });
};
const loadMyVotes = async (voter) => {
  const result = await api({ action: "getMyVotes", voter });
  return result || {};
};
const loadVotesFor = async (target) => {
  const result = await api({ action: "getVotesFor", target });
  return result || [];
};

// ── Tiny components ──────────────────────────────────────────────────────────
const Combo = ({ value, onChange, options = [], placeholder, rows, style = {} }) => {
  const id = useRef("cb_" + uid()).current;
  const base = { fontFamily: "'DM Sans',sans-serif", fontSize: 13, padding: "8px 11px", border: "1.5px solid #ddd6c8", borderRadius: 7, background: "#fff", color: "#1c2b4a", width: "100%", outline: "none", boxSizing: "border-box", ...style };
  if (rows) return <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...base, resize: "vertical" }} />;
  return <><input list={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} /><datalist id={id}>{options.map(o => <option key={o} value={o} />)}</datalist></>;
};

const TagBox = ({ selected, onChange, presets }) => {
  const [custom, setCustom] = useState("");
  const toggle = t => onChange(selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t]);
  const add = () => { const v = custom.trim(); if (v && !selected.includes(v)) { onChange([...selected, v]); setCustom(""); } };
  const tagBase = { padding: "4px 12px", borderRadius: 20, fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "all .15s", display: "inline-flex", alignItems: "center", gap: 5 };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {presets.map(t => <span key={t} onClick={() => toggle(t)} style={{ ...tagBase, border: `1.5px solid ${selected.includes(t) ? "#b8920a" : "#ddd6c8"}`, background: selected.includes(t) ? "#b8920a" : "#fff", color: selected.includes(t) ? "#fff" : "#6a6050" }}>{t}</span>)}
        {selected.filter(s => !presets.includes(s)).map(t => <span key={t} style={{ ...tagBase, background: "#1c2b4a", color: "#fff", border: "1.5px solid #1c2b4a" }}>{t}<span onClick={() => onChange(selected.filter(x => x !== t))} style={{ opacity: .6, fontSize: 10, cursor: "pointer" }}>✕</span></span>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add custom…" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, padding: "6px 10px", border: "1.5px solid #ddd6c8", borderRadius: 6, background: "#fff", color: "#1c2b4a", outline: "none", width: 180 }} />
        <button onClick={add} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, padding: "6px 13px", background: "transparent", border: "1.5px solid #b8920a", color: "#b8920a", borderRadius: 6, cursor: "pointer" }}>+ Add</button>
      </div>
    </div>
  );
};

const Stars = ({ value = 0, onChange, size = 22 }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map(n => <span key={n} onClick={() => onChange?.(n)} style={{ fontSize: size, cursor: onChange ? "pointer" : "default", color: n <= value ? "#f0a500" : "#ddd6c8", transition: "color .1s", lineHeight: 1 }}>★</span>)}
  </div>
);

// ── Shared slide renderer ────────────────────────────────────────────────────
function Slides({ data }) {
  const { teamName, company, strategy, opportunities, pocs } = data || {};
  const S = { fontFamily: "'Playfair Display',Georgia,serif" };
  const DM = { fontFamily: "'DM Sans',sans-serif" };
  const slideWrap = (num, title, body) => (
    <div key={num} style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 16, padding: "32px 36px", marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, paddingBottom: 14, borderBottom: "2px solid #f0ebe0" }}>
        <div>
          <div style={{ ...DM, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "#b8920a", marginBottom: 3 }}>Slide {String(num).padStart(2, "0")}</div>
          <div style={{ ...S, fontSize: 24, color: "#1c2b4a", fontWeight: 700 }}>{title}</div>
        </div>
        <div style={{ ...DM, fontSize: 12, color: "#9a8a70", padding: "4px 12px", background: "#f0f3f9", borderRadius: 20, border: "1.5px solid #c5d0e8", whiteSpace: "nowrap" }}>👥 {teamName || "Team"}</div>
      </div>
      {body}
    </div>
  );
  const F = ({ label, value }) => !value ? null : (
    <div style={{ padding: "11px 14px", background: "#fafaf7", borderRadius: 8, border: "1px solid #f0ebe0" }}>
      <div style={{ ...DM, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#9a8a70", marginBottom: 3 }}>{label}</div>
      <div style={{ ...DM, fontSize: 13, color: "#1c2b4a", lineHeight: 1.55 }}>{value}</div>
    </div>
  );
  return (
    <>
      {slideWrap(1, company?.name || "Company Profile",
        <div>
          {company?.industry && <div style={{ ...DM, fontSize: 13, color: "#b8920a", marginBottom: 14 }}>{company.flag} {company.industry}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <F label="Revenue / Size" value={company?.revenue} /><F label="Tech Stack" value={company?.stack} /><F label="Current AI Status" value={company?.aiStatus} />
          </div>
          {(company?.problems || []).filter(Boolean).length > 0 && (
            <div style={{ background: "#fdf8ef", border: "1.5px solid #e8c96a", borderRadius: 10, padding: "13px 16px" }}>
              <div style={{ ...DM, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#8a6a00", marginBottom: 8 }}>Key Pain Points</div>
              {company.problems.filter(Boolean).map((p, i) => <div key={i} style={{ ...DM, fontSize: 13, color: "#2a1a00", display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: "#b8920a" }}>▸</span>{p}</div>)}
            </div>
          )}
        </div>
      )}
      {slideWrap(2, "AI Strategic Direction",
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[["🎯 Vision", strategy?.vision], ["🏛️ Governance", strategy?.governance], ["🗄️ Data Policy", strategy?.dataPolicy], ["🗺️ Roadmap", strategy?.roadmap]].map(([k, v]) => (
              <div key={k} style={{ padding: 14, background: "#fafaf7", borderRadius: 10, border: "1px solid #f0ebe0" }}>
                <div style={{ ...DM, fontSize: 12, color: "#b8920a", fontWeight: 600, marginBottom: 5 }}>{k}</div>
                <div style={{ ...DM, fontSize: 13, color: v ? "#1c2b4a" : "#c0b0a0", lineHeight: 1.5, fontStyle: v ? "normal" : "italic" }}>{v || "Not filled"}</div>
              </div>
            ))}
          </div>
          {(strategy?.priorities || []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {strategy.priorities.map(p => <span key={p} style={{ ...DM, padding: "4px 12px", borderRadius: 20, fontSize: 12, background: "#1c2b4a", color: "#fff" }}>{p}</span>)}
            </div>
          )}
        </div>
      )}
      {slideWrap(3, "AI Opportunity Landscape",
        <div style={{ border: "1.5px solid #e8e0d0", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 2.2fr 1.5fr 1fr 1fr" }}>
            {["Department", "Opportunity", "GenAI Type", "Impact", "Complexity"].map(h => <div key={h} style={{ ...DM, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#1c2b4a", background: "#f0f3f9", padding: "9px 10px", borderBottom: "1.5px solid #e8e0d0" }}>{h}</div>)}
            {(opportunities || []).filter(o => o.dept || o.description).map((o, i) => (
              ["dept", "description", "aiType", "impact", "complexity"].map(f => <div key={f} style={{ ...DM, padding: "9px 10px", fontSize: 12, color: "#1c2b4a", borderBottom: "1px solid #f5f0e8", background: i % 2 === 0 ? "#fff" : "#fafaf7" }}>{o[f] || "—"}</div>)
            ))}
          </div>
        </div>
      )}
      {(pocs || []).map((poc, i) => slideWrap(4 + i, `POC #${i + 1}: ${poc.title || "Untitled"}`,
        <div>
          {poc.department && <div style={{ ...DM, fontSize: 13, color: "#b8920a", marginBottom: 12 }}>{poc.department}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[["Objective", poc.objective], ["KPIs", poc.kpis], ["Tools", poc.tools], ["Team", poc.team], ["Timeline", poc.timeline], ["Exit Criteria", poc.exitCriteria]].map(([label, val]) => (
              <div key={label} style={{ padding: "10px 12px", background: "#fafaf7", borderRadius: 8, border: "1px solid #f0ebe0" }}>
                <div style={{ ...DM, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#9a8a70", marginBottom: 3 }}>{label}</div>
                <div style={{ ...DM, fontSize: 12, color: val ? "#1c2b4a" : "#c0b0a0", lineHeight: 1.5, fontStyle: val ? "normal" : "italic" }}>{val || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ── Main app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home"); // home | edit | present | leaderboard | view
  const [step, setStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [company, setCompany] = useState({ name: "", flag: "🏢", industry: "", revenue: "", stack: "", aiStatus: "", problems: ["", "", "", "", ""], preset: "" });
  const [strategy, setStrategy] = useState({ vision: "", governance: "", dataPolicy: "", roadmap: "", priorities: [] });
  const [opportunities, setOpportunities] = useState([emptyOpp(), emptyOpp(), emptyOpp()]);
  const [pocs, setPocs] = useState([emptyPOC()]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [myVotes, setMyVotes] = useState({});
  const [viewing, setViewing] = useState(null);

  const allData = { teamName, company, strategy, opportunities, pocs };

  const handleSave = async () => {
    if (!teamName.trim()) return;
    setSaving(true);
    await saveTeam(teamName.trim(), allData);
    setSaving(false); setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
  };

  const openLeaderboard = async () => {
    setLbLoading(true); setScreen("leaderboard");
    const teams = await listTeams();
    const votes = teamName ? await loadMyVotes(teamName) : {};
    const enriched = await Promise.all(teams.map(async t => {
      const scores = await loadVotesFor(t.teamName);
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return { ...t, scores, avg, voteCount: scores.length };
    }));
    enriched.sort((a, b) => b.avg - a.avg || b.voteCount - a.voteCount);
    setLeaderboard(enriched); setMyVotes(votes); setLbLoading(false);
  };

  const handleVote = async (target, score) => {
    if (!teamName || target === teamName) return;
    await saveVote(teamName, target, score);
    setMyVotes(v => ({ ...v, [target]: score }));
    const scores = await loadVotesFor(target);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    setLeaderboard(prev => [...prev.map(t => t.teamName === target ? { ...t, scores, avg, voteCount: scores.length } : t)].sort((a, b) => b.avg - a.avg || b.voteCount - a.voteCount));
  };

  // Shared styles
  const DM = { fontFamily: "'DM Sans',sans-serif" };
  const S = { fontFamily: "'Playfair Display',Georgia,serif" };
  const card = { background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: 20 };
  const goldCard = { background: "#fdf8ef", border: "1.5px solid #e8c96a", borderRadius: 12, padding: 18 };
  const inp = { fontFamily: "'DM Sans',sans-serif", fontSize: 13, padding: "8px 11px", border: "1.5px solid #ddd6c8", borderRadius: 7, background: "#fff", color: "#1c2b4a", outline: "none", boxSizing: "border-box" };
  const lbl = { ...DM, fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: "#9a8a70", marginBottom: 5, display: "block" };
  const B = (v = "primary") => ({ ...DM, fontSize: 13, fontWeight: 500, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", transition: "all .18s", ...(v === "primary" ? { background: "#1c2b4a", color: "#fff" } : v === "gold" ? { background: "#b8920a", color: "#fff" } : v === "ghost" ? { background: "transparent", border: "1.5px solid #ddd6c8", color: "#6a6050" } : { background: "#fff0f0", border: "1.5px solid #f0c0c0", color: "#c05050", fontSize: 11, padding: "4px 10px" }) });

  /* HOME */
  if (screen === "home") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f5f2eb,#ece6d8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box}body{margin:0}input:focus,textarea:focus{border-color:#b8920a!important;box-shadow:0 0 0 3px rgba(184,146,10,.1)}`}</style>
      <div style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>🎓</div>
        <h1 style={{ ...S, fontSize: 34, color: "#1c2b4a", margin: "0 0 6px", fontWeight: 700 }}>AI Audit Workshop</h1>
        <p style={{ ...DM, color: "#9a8a70", fontSize: 14, margin: "0 0 40px" }}>ESSEC — Generative AI in Enterprises</p>
        <div style={{ ...card, marginBottom: 18 }}>
          <label style={lbl}>Your Team Name</label>
          <input value={teamName} onChange={e => setTeamName(e.target.value)} onKeyDown={e => e.key === "Enter" && teamName.trim() && setScreen("edit")} placeholder="e.g. Team Alpha, Les Stratèges…" style={{ ...inp, width: "100%" }} autoFocus />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button style={{ ...B("primary"), padding: 14, fontSize: 15, borderRadius: 10, opacity: teamName.trim() ? 1 : .4 }} disabled={!teamName.trim()} onClick={() => setScreen("edit")}>🚀 Start the Workshop</button>
          <button style={{ ...B("ghost"), padding: 12, borderRadius: 10 }} onClick={openLeaderboard}>🏆 View Live Leaderboard</button>
        </div>
        <p style={{ ...DM, fontSize: 11, color: "#b0a88a", marginTop: 20 }}>Your work auto-saves to a shared leaderboard so classmates can rate your strategy.</p>
      </div>
    </div>
  );

  /* LEADERBOARD */
  if (screen === "leaderboard") {
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <div style={{ minHeight: "100vh", background: "#f5f2eb" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');*{box-sizing:border-box}body{margin:0}`}</style>
        <div style={{ background: "#1c2b4a", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ ...S, fontSize: 20, color: "#f5f2eb", fontWeight: 700 }}>🏆 Live Leaderboard</div>
          <div style={{ display: "flex", gap: 10 }}>
            {teamName && <button style={{ ...B("gold"), padding: "8px 16px", fontSize: 12 }} onClick={() => setScreen("edit")}>← My Workshop</button>}
            <button style={{ ...B("ghost"), borderColor: "rgba(255,255,255,.3)", color: "#e8e0d0", padding: "8px 16px", fontSize: 12 }} onClick={() => setScreen("home")}>Home</button>
          </div>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
          {teamName && <div style={{ ...DM, fontSize: 13, color: "#9a8a70", textAlign: "center", marginBottom: 24 }}>You are <strong style={{ color: "#1c2b4a" }}>{teamName}</strong> — rate other teams (★ to ★★★★★)</div>}
          {lbLoading && <div style={{ textAlign: "center", padding: 60, ...DM, color: "#9a8a70" }}>Loading…</div>}
          {!lbLoading && leaderboard.length === 0 && (
            <div style={{ ...card, textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ ...S, fontSize: 18, color: "#1c2b4a", marginBottom: 6 }}>No submissions yet</div>
              <div style={{ ...DM, fontSize: 13, color: "#9a8a70" }}>Be the first team to save your work!</div>
            </div>
          )}
          {leaderboard.map((t, i) => (
            <div key={t.teamName} style={{ ...card, marginBottom: 12, display: "flex", alignItems: "center", gap: 18, borderColor: i === 0 ? "#e8c96a" : "#e8e0d0", background: i === 0 ? "#fdf8ef" : "#fff", boxShadow: i === 0 ? "0 4px 18px rgba(184,146,10,.12)" : "none" }}>
              <div style={{ fontSize: 30, minWidth: 40, textAlign: "center" }}>{medals[i] || <span style={{ ...DM, fontSize: 16, color: "#9a8a70" }}>#{i + 1}</span>}</div>
              <div style={{ flex: 1 }}>
                <div style={{ ...S, fontSize: 18, color: "#1c2b4a", marginBottom: 2 }}>{t.teamName}</div>
                <div style={{ ...DM, fontSize: 12, color: "#9a8a70", marginBottom: 6 }}>{t.company?.name || "—"}{t.company?.industry ? " · " + t.company.industry.slice(0, 45) + "…" : ""}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Stars value={Math.round(t.avg)} size={17} />
                  <span style={{ ...DM, fontSize: 12, color: "#9a8a70" }}>{t.avg > 0 ? `${t.avg.toFixed(1)}/5` : "No votes"}{t.voteCount > 0 ? ` (${t.voteCount} vote${t.voteCount > 1 ? "s" : ""})` : ""}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                {teamName && teamName !== t.teamName && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ ...DM, fontSize: 11, color: "#9a8a70", marginBottom: 4 }}>{myVotes[t.teamName] ? `Your vote: ${myVotes[t.teamName]}/5` : "Your rating:"}</div>
                    <Stars value={myVotes[t.teamName] || 0} onChange={s => handleVote(t.teamName, s)} size={26} />
                  </div>
                )}
                <button style={{ ...B("ghost"), fontSize: 12, padding: "6px 14px" }} onClick={() => { setViewing(t); setScreen("view"); }}>View Slides →</button>
              </div>
            </div>
          ))}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button style={B("ghost")} onClick={openLeaderboard}>🔄 Refresh</button>
          </div>
        </div>
      </div>
    );
  }

  /* VIEW TEAM */
  if (screen === "view" && viewing) return (
    <div style={{ minHeight: "100vh", background: "#f5f2eb" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');*{box-sizing:border-box}body{margin:0}`}</style>
      <div style={{ background: "#1c2b4a", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ ...S, color: "#f5f2eb", fontSize: 16 }}>📊 {viewing.teamName}'s Presentation</div>
        <button style={{ ...B("ghost"), borderColor: "rgba(255,255,255,.3)", color: "#e8e0d0", padding: "7px 16px", fontSize: 12 }} onClick={() => setScreen("leaderboard")}>← Back to Leaderboard</button>
      </div>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px" }}>
        <Slides data={viewing} />
        {teamName && teamName !== viewing.teamName && (
          <div style={{ ...goldCard, marginTop: 20, textAlign: "center" }}>
            <div style={{ ...DM, fontSize: 13, color: "#6a5010", marginBottom: 10 }}>Rate this team's work</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Stars value={myVotes[viewing.teamName] || 0} onChange={s => handleVote(viewing.teamName, s)} size={38} />
            </div>
            {myVotes[viewing.teamName] && <div style={{ ...DM, fontSize: 12, color: "#9a8a70", marginTop: 8 }}>You gave {myVotes[viewing.teamName]}/5 ⭐</div>}
          </div>
        )}
      </div>
    </div>
  );

  /* EDIT + PRESENT */
  const isPresent = screen === "present";
  const updComp = (k, v) => setCompany(c => ({ ...c, [k]: v }));
  const updStrat = (k, v) => setStrategy(s => ({ ...s, [k]: v }));
  const updOpp = (id, k, v) => setOpportunities(os => os.map(o => o.id === id ? { ...o, [k]: v } : o));
  const updPOC = (id, k, v) => setPocs(ps => ps.map(p => p.id === id ? { ...p, [k]: v } : p));
  const cellInp = { fontFamily: "'DM Sans',sans-serif", fontSize: 12, padding: "7px 8px", border: "none", background: "transparent", color: "#1c2b4a", width: "100%", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f2eb" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box}body{margin:0}input:focus,textarea:focus{border-color:#b8920a!important;box-shadow:0 0 0 3px rgba(184,146,10,.1)}@media print{.noprint{display:none!important}}`}</style>

      {/* Header */}
      <div className="noprint" style={{ background: "#fff", borderBottom: "1.5px solid #e8e0d0", padding: "11px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: "#1c2b4a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🎓</div>
          <div>
            <div style={{ ...S, fontSize: 14, color: "#1c2b4a", fontWeight: 700 }}>AI Audit Workshop</div>
            <div style={{ ...DM, fontSize: 10, color: "#9a8a70", letterSpacing: ".5px" }}>ESSEC — Generative AI in Enterprises</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {teamName && <div style={{ ...DM, fontSize: 12, color: "#1c2b4a", padding: "3px 11px", background: "#f0f3f9", borderRadius: 20, border: "1.5px solid #c5d0e8" }}>👥 {teamName}</div>}
          <button style={{ ...B("ghost"), fontSize: 12, padding: "6px 12px" }} onClick={openLeaderboard}>🏆 Leaderboard</button>
          <button style={{ ...B(isPresent ? "ghost" : "gold"), fontSize: 12, padding: "6px 12px" }} onClick={() => setScreen(isPresent ? "edit" : "present")}>{isPresent ? "✏️ Edit" : "📊 Present"}</button>
          <button style={{ ...B("primary"), fontSize: 12, padding: "6px 12px", opacity: saving ? .6 : 1 }} onClick={handleSave} disabled={saving || !teamName}>
            {saving ? "Saving…" : savedOk ? "✅ Saved!" : "💾 Save & Share"}
          </button>
        </div>
      </div>

      {/* Step nav */}
      {!isPresent && (
        <div className="noprint" style={{ background: "#fff", borderBottom: "1.5px solid #e8e0d0", padding: "9px 26px", display: "flex", gap: 6, overflowX: "auto" }}>
          {[{ icon: "🏢", label: "Company" }, { icon: "🧭", label: "Strategy" }, { icon: "💡", label: "Opportunities" }, { icon: "🔬", label: "POC Design" }].map((s, i) => (
            <button key={s.label} onClick={() => setStep(i)} style={{ ...DM, fontSize: 12, padding: "6px 16px", borderRadius: 20, border: `1.5px solid ${i === step ? "#1c2b4a" : "#e8e0d0"}`, background: i === step ? "#1c2b4a" : i < step ? "#f0f3f9" : "#fff", color: i === step ? "#fff" : i < step ? "#6a7a9a" : "#9a8a70", cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s" }}>
              {s.icon} {s.label}{i < step ? " ✓" : ""}
            </button>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 24px" }}>

        {/* PRESENT */}
        {isPresent && (
          <>
            <div className="noprint" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ ...S, fontSize: 22, color: "#1c2b4a" }}>Your Presentation</div>
              <button style={B("primary")} onClick={() => window.print()}>🖨️ Print / Export PDF</button>
            </div>
            <Slides data={allData} />
          </>
        )}

        {/* STEP 0 — Company */}
        {!isPresent && step === 0 && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ ...S, fontSize: 24, color: "#1c2b4a", marginBottom: 4 }}>🏢 Company Profile</div>
              <div style={{ ...DM, fontSize: 13, color: "#9a8a70" }}>Describe the company you will audit. Use a preset or build your own.</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ ...lbl, marginBottom: 10 }}>Choose a preset or start from scratch</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 8 }}>
                {PRESET_COMPANIES.map(p => (
                  <div key={p.name} onClick={() => setCompany({ preset: p.name, name: p.name, flag: p.flag, industry: p.industry, revenue: p.revenue, stack: p.stack, aiStatus: p.aiStatus, problems: [...p.problems] })}
                    style={{ ...card, cursor: "pointer", borderColor: company.preset === p.name ? "#b8920a" : "#e8e0d0", background: company.preset === p.name ? "#fdf8ef" : "#fff", transition: "all .14s" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{p.flag}</div>
                    <div style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#1c2b4a", marginBottom: 2 }}>{p.name}</div>
                    <div style={{ ...DM, fontSize: 11, color: "#9a8a70", lineHeight: 1.4 }}>{p.industry.slice(0, 52)}…</div>
                  </div>
                ))}
                <div onClick={() => setCompany({ preset: "custom", name: "", flag: "🏢", industry: "", revenue: "", stack: "", aiStatus: "", problems: ["", "", "", "", ""] })}
                  style={{ ...card, cursor: "pointer", borderColor: company.preset === "custom" ? "#1c2b4a" : "#e8e0d0", background: company.preset === "custom" ? "#f0f3f9" : "#fff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: 90, transition: "all .14s" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>✏️</div>
                  <div style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#1c2b4a" }}>Custom Company</div>
                  <div style={{ ...DM, fontSize: 11, color: "#9a8a70" }}>Create your own</div>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {[["Company Name", "name", PRESET_COMPANIES.map(p => p.name)], ["Industry / Sector", "industry", PRESET_COMPANIES.map(p => p.industry)], ["Size & Revenue", "revenue", PRESET_COMPANIES.map(p => p.revenue)], ["Tech Stack", "stack", PRESET_COMPANIES.map(p => p.stack)]].map(([label, field, opts]) => (
                <div key={field}><label style={lbl}>{label}</label><Combo value={company[field]} onChange={v => updComp(field, v)} options={opts} placeholder={`Enter ${label.toLowerCase()}…`} style={{ width: "100%" }} /></div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}><label style={lbl}>Current AI Status</label><Combo value={company.aiStatus} onChange={v => updComp("aiStatus", v)} options={PRESET_COMPANIES.map(p => p.aiStatus)} placeholder="Describe current AI status…" rows={2} /></div>
            <div>
              <label style={{ ...lbl, marginBottom: 8 }}>Key Pain Points (up to 5)</label>
              {company.problems.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "center" }}>
                  <div style={{ ...DM, fontSize: 12, color: "#b8920a", fontWeight: 600, minWidth: 16 }}>{i + 1}.</div>
                  <Combo value={p} onChange={v => updComp("problems", company.problems.map((x, j) => j === i ? v : x))} options={PRESET_COMPANIES.flatMap(c => c.problems)} placeholder="e.g. Sales: slow RFP response time" style={{ width: "100%" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 26 }}>
              <button style={B("primary")} onClick={() => setStep(1)}>Next: AI Strategy →</button>
            </div>
          </div>
        )}

        {/* STEP 1 — Strategy */}
        {!isPresent && step === 1 && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ ...S, fontSize: 24, color: "#1c2b4a", marginBottom: 4 }}>🧭 AI Strategy</div>
              <div style={{ ...DM, fontSize: 13, color: "#9a8a70" }}>Define your recommended AI approach for this company.</div>
            </div>
            <div style={{ ...goldCard, marginBottom: 20 }}>
              <div style={{ ...lbl, color: "#8a6a00", marginBottom: 8 }}>Quick-start: pick a strategic template</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {STRATEGY_TEMPLATES.map(t => (
                  <div key={t} onClick={() => updStrat("vision", t)} style={{ ...card, cursor: "pointer", padding: "10px 14px", borderColor: strategy.vision === t ? "#b8920a" : "#e8e0d0", background: strategy.vision === t ? "#fdf8ef" : "#fff", transition: "all .14s" }}>
                    <div style={{ ...DM, fontSize: 13, color: strategy.vision === t ? "#8a6a00" : "#4a4030" }}>{t}</div>
                  </div>
                ))}
              </div>
            </div>
            {[["🎯 Vision", "vision", "Why AI? What competitive advantage does it provide?", 3], ["🏛️ Governance", "governance", "Who owns this? Sponsors, roles, communication?", 2], ["🗄️ Data Policy", "dataPolicy", "What data can be used? How to enforce compliance?", 2], ["🗺️ Roadmap (1–3 years)", "roadmap", "Budget, timeline, short vs. medium-term priorities…", 3]].map(([label, field, ph, rows]) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={lbl}>{label}</label>
                <Combo value={strategy[field]} onChange={v => updStrat(field, v)} placeholder={ph} rows={rows} />
              </div>
            ))}
            <div><label style={{ ...lbl, marginBottom: 8 }}>Priority AI Types</label><TagBox selected={strategy.priorities} onChange={v => updStrat("priorities", v)} presets={AI_PRESETS} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
              <button style={B("ghost")} onClick={() => setStep(0)}>← Back</button>
              <button style={B("primary")} onClick={() => setStep(2)}>Next: Opportunities →</button>
            </div>
          </div>
        )}

        {/* STEP 2 — Opportunities */}
        {!isPresent && step === 2 && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ ...S, fontSize: 24, color: "#1c2b4a", marginBottom: 4 }}>💡 Opportunities Map</div>
              <div style={{ ...DM, fontSize: 13, color: "#9a8a70" }}>List AI use cases across departments. Type freely or use the suggestion dropdowns.</div>
            </div>
            <div style={{ border: "1.5px solid #e8e0d0", borderRadius: 12, overflow: "hidden", background: "#fff", marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 2.2fr 1.5fr 1fr 1fr 30px" }}>
                {["Department", "Opportunity Description", "GenAI Type", "Impact", "Complexity", ""].map(h => (
                  <div key={h} style={{ ...DM, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#1c2b4a", background: "#f0f3f9", padding: "9px 9px", borderBottom: "1.5px solid #e8e0d0" }}>{h}</div>
                ))}
                {opportunities.map((o, i) => (
                  <div key={o.id} style={{ display: "contents" }}>
                    {[
                      <Combo value={o.dept} onChange={v => updOpp(o.id, "dept", v)} options={DEPTS} placeholder="Dept…" style={{ ...cellInp }} />,
                      <input value={o.description} onChange={e => updOpp(o.id, "description", e.target.value)} placeholder="Describe the use case…" style={{ ...cellInp }} />,
                      <Combo value={o.aiType} onChange={v => updOpp(o.id, "aiType", v)} options={AI_PRESETS} placeholder="AI type…" style={{ ...cellInp }} />,
                      <Combo value={o.impact} onChange={v => updOpp(o.id, "impact", v)} options={IMPACTS} placeholder="—" style={{ ...cellInp }} />,
                      <Combo value={o.complexity} onChange={v => updOpp(o.id, "complexity", v)} options={COMPLEXITIES} placeholder="—" style={{ ...cellInp }} />,
                      <button onClick={() => setOpportunities(os => os.filter(x => x.id !== o.id))} style={{ background: "none", border: "none", color: "#c09090", cursor: "pointer", fontSize: 13 }}>✕</button>,
                    ].map((cell, ci) => (
                      <div key={ci} style={{ borderBottom: "1px solid #f0ebe0", borderRight: ci < 5 ? "1px solid #f5f0e8" : "none", background: i % 2 === 0 ? "#fff" : "#fafaf7", display: "flex", alignItems: "center" }}>{cell}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <button style={{ ...B("ghost"), fontSize: 12, marginBottom: 24 }} onClick={() => setOpportunities(os => [...os, emptyOpp()])}>+ Add Row</button>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button style={B("ghost")} onClick={() => setStep(1)}>← Back</button>
              <button style={B("primary")} onClick={() => setStep(3)}>Next: POC Design →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — POC */}
        {!isPresent && step === 3 && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ ...S, fontSize: 24, color: "#1c2b4a", marginBottom: 4 }}>🔬 POC Design</div>
              <div style={{ ...DM, fontSize: 13, color: "#9a8a70" }}>Structure your Proof of Concept using the TAKARE framework.</div>
            </div>
            <div style={{ ...goldCard, marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <span style={{ ...DM, fontSize: 11, color: "#8a6a00", fontWeight: 600 }}>TAKARE:</span>
              {[["T", "Targeted Scope"], ["A", "Measurable KPIs"], ["K", "Controlled Schedule"], ["A", "Adapted Tools"], ["R", "Representative Team"], ["E", "Exit Strategy"]].map(([l, d]) => (
                <span key={d} style={{ ...DM, fontSize: 12, color: "#5a4a00" }}><strong style={{ color: "#b8920a" }}>{l}</strong> {d}</span>
              ))}
            </div>
            {pocs.map((poc, i) => (
              <div key={poc.id} style={{ ...card, marginBottom: 20, borderColor: "#ddd6c8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 12, borderBottom: "1.5px solid #f0ebe0" }}>
                  <div style={{ ...S, fontSize: 17, color: "#1c2b4a" }}>POC #{i + 1}</div>
                  {pocs.length > 1 && <button style={B("danger")} onClick={() => setPocs(ps => ps.filter(p => p.id !== poc.id))}>Remove</button>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                  {[["POC Title", "title", "e.g. AI-Powered RFP Generator", false], ["Department", "department", "e.g. Sales", false], ["Objective", "objective", "What specific problem does this solve?", 2], ["Success KPIs", "kpis", "e.g. 50% reduction in drafting time, NPS > 7…", 2], ["Tools / Tech Stack", "tools", "e.g. Copilot 365, Claude / ChatGPT via API, Gemini, internal AI tool…", false], ["Team Composition", "team", "e.g. 1 PM, 2 Sales reps, 1 IT dev, 1 sponsor", false], ["Timeline", "timeline", "e.g. 6–8 weeks", false], ["Exit Criteria (Go/No-Go)", "exitCriteria", "e.g. Stop if KPI not reached after 8 weeks", 2]].map(([label, field, ph, rows]) => (
                    <div key={field} style={rows ? { gridColumn: "1 / -1" } : {}}>
                      <label style={lbl}>{label}</label>
                      <Combo value={poc[field]} onChange={v => updPOC(poc.id, field, v)} placeholder={ph} rows={rows || undefined} style={{ width: "100%" }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button style={{ ...B("ghost"), marginBottom: 6 }} onClick={() => setPocs(ps => [...ps, emptyPOC()])}>+ Add Another POC</button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <button style={B("ghost")} onClick={() => setStep(2)}>← Back</button>
              <button style={B("gold")} onClick={() => setScreen("present")}>📊 Go to Presentation →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
