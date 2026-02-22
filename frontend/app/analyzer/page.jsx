"use client";
import { useState, useCallback } from "react";
import { analyzeMessage, analyzeBatch, downloadReport } from "@/lib/api";

const PROFILES = [
  { id: "general", label: "General" },
  { id: "student", label: "Student" },
  { id: "elderly", label: "Elderly" },
  { id: "business_owner", label: "Business" },
];
const TABS = ["overview", "highlights", "psychology", "urls", "actions"];
const RC = {
  Low: { color: "#10B981", glow: "rgba(16,185,129,0.1)", label: "LOW RISK", headline: "No significant threat detected", headlineSub: "This message appears safe, but always verify before acting." },
  Medium: { color: "#F59E0B", glow: "rgba(245,158,11,0.1)", label: "MODERATE RISK", headline: "Potential threat — verify before acting", headlineSub: "This message contains indicators that warrant caution." },
  High: { color: "#F97316", glow: "rgba(249,115,22,0.1)", label: "HIGH RISK", headline: "Strong fraud indicators detected", headlineSub: "This message uses tactics commonly found in scam communications." },
  Critical: { color: "#EF4444", glow: "rgba(239,68,68,0.1)", label: "CRITICAL THREAT DETECTED", headline: "Do not respond or click any links", headlineSub: "This message shows very strong indicators of a fraud attempt." },
};

export default function AnalyzerPage() {
  const [msg, setMsg] = useState("");
  const [profile, setProfile] = useState("general");
  const [aiOn, setAiOn] = useState(true);
  const [batch, setBatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);
  const [batchRes, setBatchRes] = useState(null);
  const [batchIdx, setBatchIdx] = useState(0);
  const [tab, setTab] = useState("overview");

  // Voice
  const [listening, setListening] = useState(false);
  const [voiceOk, setVoiceOk] = useState(true);
  const [voiceErr, setVoiceErr] = useState(null);

  const onTranscript = useCallback((t) => setMsg((p) => (p.trim() ? p + " " + t : t)), []);

  const doAnalyze = async () => {
    if (!msg.trim() || loading) return;
    setLoading(true); setErr(null); setResult(null); setBatchRes(null); setBatchIdx(0); setTab("overview");
    try {
      if (batch) {
        const r = await analyzeBatch(msg.trim(), profile, aiOn);
        setBatchRes(r.results);
      } else {
        const r = await analyzeMessage(msg.trim(), profile, aiOn);
        setResult(r.data);
      }
    } catch (e) { setErr(e.message || "Analysis failed."); }
    finally { setLoading(false); }
  };

  const toggleVoice = () => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceOk(false); return; }
    if (listening) { window._sRec?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = false; rec.lang = "en-IN";
    rec.onresult = (e) => { let t = ""; for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript; if (t.trim()) onTranscript(t.trim()); };
    rec.onerror = (e) => { setListening(false); setVoiceErr(e.error === "not-allowed" ? "Microphone access denied." : `Error: ${e.error}`); setTimeout(() => setVoiceErr(null), 4000); };
    rec.onend = () => setListening(false);
    try { rec.start(); window._sRec = rec; setListening(true); setVoiceErr(null); }
    catch { setVoiceErr("Could not start voice."); }
  };

  const d = batchRes ? batchRes[batchIdx] : result;
  const rc = d ? RC[d.final_assessment?.risk_level] || RC.Low : null;
  const allCats = d ? [...(d.rule_analysis?.categories || []), ...(d.psych_analysis?.categories || [])].filter((v, i, a) => a.indexOf(v) === i) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cx-text tracking-tight">Fraud Analyzer</h1>
        <p className="text-sm text-cx-textSec mt-1">Real-time risk assessment for suspicious communications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-cx-card border border-cx-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-cx-textDim uppercase tracking-wider">Message Input</span>
              <label className="flex items-center gap-1.5 text-[10px] text-cx-textDim cursor-pointer select-none">
                <input type="checkbox" checked={batch} onChange={(e) => setBatch(e.target.checked)} className="rounded border-cx-border bg-cx-surface text-cx-accent focus:ring-cx-accent/30 h-3 w-3" />
                Batch
              </label>
            </div>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); doAnalyze(); }}} disabled={loading} rows={7}
              placeholder={batch ? "One message per line..." : "Paste suspicious SMS, WhatsApp, or call transcript..."}
              className="w-full bg-cx-base border border-cx-border rounded-xl px-4 py-3 text-sm text-cx-text placeholder-cx-textGhost resize-none disabled:opacity-40 focus:border-cx-accent/40 transition-colors font-mono text-[12px] leading-relaxed"
            />
            <div className="flex items-center gap-2 flex-wrap">
              {voiceOk ? (
                <button onClick={toggleVoice} disabled={loading} className={`px-3 py-2 rounded-xl text-[11px] font-medium transition-all btn-press ${listening ? "bg-risk-critGlow text-risk-crit border border-risk-crit/20" : "bg-cx-surface border border-cx-border text-cx-textDim hover:text-cx-textSec hover:border-cx-borderLight"} disabled:opacity-40`}>
                  {listening ? <span className="flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="listening-dot absolute inline-flex h-full w-full rounded-full bg-risk-crit" /><span className="relative inline-flex rounded-full h-2 w-2 bg-risk-crit" /></span>Listening...</span> : "Voice"}
                </button>
              ) : <span className="text-[10px] text-cx-textGhost">Voice unavailable</span>}
              <span className="text-[10px] text-cx-textGhost border border-cx-border/50 rounded-xl px-2.5 py-1.5">Audio upload — coming soon</span>
            </div>
            {voiceErr && <p className="text-[10px] text-risk-crit">{voiceErr}</p>}
            <div>
              <span className="text-[10px] font-semibold text-cx-textGhost uppercase tracking-wider block mb-2">Profile</span>
              <div className="grid grid-cols-4 gap-1.5">
                {PROFILES.map((p) => (
                  <button key={p.id} onClick={() => setProfile(p.id)} className={`py-1.5 rounded-lg text-[10px] font-medium transition-all ${profile === p.id ? "bg-cx-accentGlow text-cx-accent border border-cx-accent/20" : "bg-cx-surface border border-cx-border text-cx-textDim hover:text-cx-textSec"}`}>{p.label}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between bg-cx-base border border-cx-border rounded-xl px-3 py-2.5">
              <div><p className="text-[11px] font-medium text-cx-text">AI Analysis</p><p className="text-[9px] text-cx-textGhost">BART semantic model</p></div>
              <button onClick={() => setAiOn(!aiOn)} className={`relative w-9 h-5 rounded-full transition-colors ${aiOn ? "bg-cx-accent" : "bg-cx-border"}`}><span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${aiOn ? "translate-x-4" : ""}`} /></button>
            </div>
            <button onClick={doAnalyze} disabled={!msg.trim() || loading} className="w-full py-3 bg-cx-accent hover:bg-cx-accentHover disabled:bg-cx-border disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all btn-press">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Analyzing...</span> : batch ? "Analyze Batch" : "Analyze Message"}
            </button>
            <p className="text-[9px] text-cx-textGhost text-center">Ctrl+Enter to submit</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-3 space-y-4">
          {loading && <div className="bg-cx-card border border-cx-border rounded-2xl p-8 space-y-4 animate-fade-in"><div className="skel h-6 w-28" /><div className="skel h-36 w-36 rounded-full mx-auto" /><div className="skel h-4 w-44 mx-auto" /></div>}

          {err && <div className="bg-risk-critGlow border border-risk-crit/15 rounded-2xl p-5 animate-fade-in"><p className="text-sm text-risk-crit">{err}</p><button onClick={() => setErr(null)} className="text-[10px] text-risk-crit/60 underline mt-1">Dismiss</button></div>}

          {batchRes && batchRes.length > 0 && (
            <div className="bg-cx-card border border-cx-border rounded-2xl p-4 animate-fade-in">
              <span className="text-[10px] font-medium text-cx-textGhost uppercase tracking-wider">{batchRes.length} Results</span>
              <div className="flex flex-wrap gap-1.5 mt-2">{batchRes.map((r, i) => { const l = r?.final_assessment?.risk_level || "Low"; const c = RC[l] || RC.Low; return (
                <button key={i} onClick={() => { setBatchIdx(i); setTab("overview"); }} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${batchIdx === i ? "ring-1 ring-cx-accent" : ""}`} style={{ backgroundColor: c.glow, color: c.color }}>
                  #{i+1} {r?.error ? "Err" : `${l} ${r?.final_assessment?.final_score}`}
                </button>); })}</div>
            </div>
          )}

          {d && !d.error && !loading && (
            <div className="animate-slide-up space-y-4">
              {/* RISK CARD */}
              <div className="bg-cx-card border border-cx-border rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: rc.color }} />
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  <div className="relative w-36 h-36 flex-shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#1E293B" strokeWidth="5" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke={rc.color} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={264} strokeDashoffset={264 * (1 - d.final_assessment.final_score / 100)}
                        className="animate-gauge" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-cx-text">{d.final_assessment.final_score}</span>
                      <span className="text-[9px] text-cx-textGhost font-mono">/100</span>
                    </div>
                  </div>
                  <div className="flex-1 text-center lg:text-left">
                    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider mb-3 ${d.final_assessment.risk_level === "Critical" ? "animate-glow-pulse" : ""}`} style={{ backgroundColor: rc.glow, color: rc.color }}>
                      {rc.label}
                    </span>
                    <h2 className="text-lg font-bold text-cx-text mb-1">{rc.headline}</h2>
                    <p className="text-xs text-cx-textSec leading-relaxed">{rc.headlineSub}</p>
                    {allCats.length > 0 && (
                      <p className="text-xs text-cx-textDim mt-3">
                        This message uses: {allCats.slice(0, 4).map(c => c.replace(/_/g, " ")).join(", ")}{allCats.length > 4 ? ` +${allCats.length - 4} more` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-cx-border">
                  <MiniBar label="Rule Engine" val={d.rule_analysis.score} color="#3B82F6" />
                  <MiniBar label="AI Model" val={d.ai_analysis.enabled ? Math.round(d.ai_analysis.probability * 100) : 0} color="#8B5CF6" off={!d.ai_analysis.enabled} />
                  <MiniBar label="Psychology" val={d.psych_analysis.score} color="#EC4899" />
                </div>
              </div>

              {/* TABS */}
              <div className="bg-cx-card border border-cx-border rounded-2xl overflow-hidden">
                <div className="flex border-b border-cx-border overflow-x-auto">
                  {TABS.map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-[11px] font-semibold capitalize whitespace-nowrap transition-all ${tab === t ? "tab-glow text-cx-accent bg-cx-base/40" : "text-cx-textDim hover:text-cx-textSec"}`}>{t}</button>
                  ))}
                </div>
                <div className="p-5 min-h-[180px]" key={tab}>
                  {tab === "overview" && <TabOverview d={d} allCats={allCats} />}
                  {tab === "highlights" && <TabHighlights d={d} />}
                  {tab === "psychology" && <TabPsych d={d} />}
                  {tab === "urls" && <TabUrls d={d} />}
                  {tab === "actions" && <TabActions d={d} />}
                </div>
              </div>
            </div>
          )}

          {d && d.error && !loading && (
            <div className="bg-risk-critGlow border border-risk-crit/15 rounded-2xl p-5 animate-fade-in">
              <p className="text-sm text-risk-crit font-medium">Analysis failed</p>
              <p className="text-[11px] text-cx-textDim mt-1">{d.error}</p>
            </div>
          )}

          {!d && !loading && !err && (
            <div className="bg-cx-card border border-cx-border rounded-2xl p-16 text-center animate-fade-in">
              <div className="w-14 h-14 bg-cx-surface rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <p className="text-sm text-cx-textSec">Paste a message to begin analysis.</p>
              <p className="text-[10px] text-cx-textGhost mt-1">Full risk breakdown appears here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniBar({ label, val, color, off }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] text-cx-textDim mb-1">
        <span>{label}{off ? " (off)" : ""}</span>
        <span className="font-mono">{off ? "—" : val}</span>
      </div>
      <div className="w-full h-1.5 bg-cx-base rounded-full overflow-hidden">
        <div className="h-full rounded-full animate-bar-grow" style={{ width: off ? "0%" : `${val}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function TabOverview({ d, allCats }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap gap-1.5">
        <Fl label="OTP" on={d.rule_analysis.flags.has_otp} />
        <Fl label="Suspicious URL" on={d.rule_analysis.flags.has_suspicious_url} />
        <Fl label="Money Request" on={d.rule_analysis.flags.has_money_request} />
        {d.rule_analysis.flags.has_financial_request !== undefined && <Fl label="Financial" on={d.rule_analysis.flags.has_financial_request} />}
        {d.rule_analysis.flags.has_dynamic_urgency !== undefined && <Fl label="Time Pressure" on={d.rule_analysis.flags.has_dynamic_urgency} />}
      </div>
      {allCats.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider mb-2">Risk Factors</p>
          <div className="space-y-1.5">
            {allCats.map((c) => (
              <div key={c} className="flex items-center gap-2 text-[11px]">
                <span className="w-1 h-1 rounded-full bg-cx-accent flex-shrink-0" />
                <span className="text-cx-textSec">{c.replace(/_/g, " ").replace(/\b\w/g, x => x.toUpperCase())}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-3 border-t border-cx-border">
        <span className="text-cx-textDim">Rule (adj/orig)</span><span className="text-cx-text font-mono text-right">{d.rule_analysis.score}/{d.rule_analysis.original_score}</span>
        <span className="text-cx-textDim">Psych (adj/orig)</span><span className="text-cx-text font-mono text-right">{d.psych_analysis.score}/{d.psych_analysis.original_score}</span>
        <span className="text-cx-textDim">AI Probability</span><span className="text-cx-text font-mono text-right">{(d.ai_analysis.probability*100).toFixed(1)}%</span>
        <span className="text-cx-textDim">Profile</span><span className="text-cx-text font-mono text-right capitalize">{d.profile_adjustment.profile_used}</span>
        <span className="text-cx-textDim">Agreement</span><span className="text-cx-text font-mono text-right">{d.final_assessment.agreement_level}</span>
      </div>
    </div>
  );
}

function TabHighlights({ d }) {
  const hl = d.highlights || [];
  if (!hl.length) return <p className="text-sm text-cx-textDim animate-fade-in">No suspicious phrases detected.</p>;
  const sorted = [...hl].sort((a,b) => a.start - b.start);
  const merged = []; for (const h of sorted) { if (!merged.length || h.start >= merged[merged.length-1].end) merged.push(h); }
  const segs = []; let cur = 0;
  for (const h of merged) {
    if (h.start > cur) segs.push({ t: "p", text: d.message.slice(cur, h.start) });
    segs.push({ t: "h", text: d.message.slice(h.start, h.end), color: h.color, cat: h.category });
    cur = h.end;
  }
  if (cur < d.message.length) segs.push({ t: "p", text: d.message.slice(cur) });

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-[12px] leading-relaxed whitespace-pre-wrap font-mono">
        {segs.map((s,i) => s.t === "p" ? <span key={i} className="text-cx-textSec">{s.text}</span> : (
          <span key={i} title={s.cat} className="font-semibold rounded-sm px-0.5 cursor-help" style={{ backgroundColor: `${s.color}18`, color: s.color, textShadow: `0 0 8px ${s.color}25` }}>{s.text}</span>
        ))}
      </p>
      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-cx-border">
        {[...new Set(merged.map(h=>h.category))].map(c => { const cl = merged.find(h=>h.category===c)?.color; return <span key={c} className="text-[9px] px-2 py-0.5 rounded" style={{ backgroundColor: `${cl}12`, color: cl }}>{c.replace(/_/g," ")}</span>; })}
      </div>
    </div>
  );
}

function TabPsych({ d }) {
  const cats = d.psych_analysis.categories;
  if (!cats.length) return <p className="text-sm text-cx-textDim animate-fade-in">No psychological manipulation detected.</p>;
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap gap-1.5">
        {cats.map(c => <span key={c} className="px-3 py-1.5 bg-cx-violetGlow text-cx-violet border border-cx-violet/15 rounded-xl text-[11px] font-medium">{c}</span>)}
      </div>
      <div className="space-y-3 pt-2">
        {cats.map(c => (
          <div key={c} className="bg-cx-base/50 rounded-xl px-4 py-3 border border-cx-border/40">
            <p className="text-[11px] font-semibold text-cx-text mb-1">{c}</p>
            <p className="text-[10px] text-cx-textDim leading-relaxed">
              {c === "Fear" && "Uses fear of loss, legal action, or account closure to override rational thinking."}
              {c === "Urgency" && "Creates artificial time pressure to prevent verification."}
              {c === "Authority" && "Impersonates banks, government, or law enforcement for instant credibility."}
              {c === "Financial Pressure" && "Implies monetary loss unless immediate action is taken."}
              {c === "Financial Coercion" && "Threatens financial consequences like payment failure or invoice penalties."}
              {c === "Emotional Manipulation" && "Exploits family bonds and trust to bypass skepticism."}
              {c === "Reward" && "Promises prizes or gifts to lure victims into sharing data."}
              {c === "Scarcity" && "Creates false scarcity to pressure immediate action."}
              {!["Fear","Urgency","Authority","Financial Pressure","Financial Coercion","Emotional Manipulation","Reward","Scarcity"].includes(c) && "Psychological manipulation tactic detected."}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-cx-textGhost font-mono pt-2 border-t border-cx-border">Psych Score: {d.psych_analysis.score}/100</p>
    </div>
  );
}

function TabUrls({ d }) {
  const u = d.rule_analysis.url_analysis;
  if (!u.suspicious_urls.length) return <p className="text-sm text-cx-textDim animate-fade-in">No suspicious URLs detected.</p>;
  return (
    <div className="space-y-3 animate-fade-in">
      {u.suspicious_urls.map((url,i) => (
        <div key={i} className="bg-risk-critGlow border border-risk-crit/10 rounded-xl px-4 py-3">
          <span className="text-[11px] text-risk-crit font-mono break-all">{url}</span>
        </div>
      ))}
      {u.reasons.map((r,i) => <p key={i} className="text-[11px] text-cx-textDim">— {r}</p>)}
      <p className="text-[10px] text-cx-textGhost font-mono">URL Score: {u.url_score}</p>
    </div>
  );
}

function TabActions({ d }) {
  const tips = d.safety_tips || [];
  return (
    <div className="space-y-4 animate-fade-in">
      {tips.length > 0 ? (
        <ul className="space-y-2.5">
          {tips.map((t,i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 bg-cx-accentGlow rounded-full flex items-center justify-center mt-0.5"><span className="text-[9px] font-bold text-cx-accent">{i+1}</span></span>
              <p className="text-[11px] text-cx-textSec leading-relaxed">{t}</p>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-cx-textDim">No specific recommendations.</p>}
      <div className="pt-3 border-t border-cx-border"><DLBtn id={d.id} /></div>
    </div>
  );
}

function DLBtn({ id }) {
  const [dl, setDl] = useState(false);
  const [e, setE] = useState(null);
  const go = async () => {
    if (!id) return; setDl(true); setE(null);
    try { const b = await downloadReport(id); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `suraksha_${id}.pdf`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); }
    catch (x) { setE(x.message); } finally { setDl(false); }
  };
  return <div><button onClick={go} disabled={dl||!id} className="px-4 py-2 bg-cx-surface border border-cx-border rounded-xl text-[11px] font-medium text-cx-textDim hover:text-cx-textSec hover:border-cx-borderLight transition-all btn-press disabled:opacity-40">{dl?"Generating...":"Download PDF Report"}</button>{e&&<p className="text-[9px] text-risk-crit mt-1">{e}</p>}</div>;
}

function Fl({ label, on }) {
  return <span className={`text-[9px] px-2 py-0.5 rounded font-medium ${on ? "bg-risk-critGlow text-risk-crit" : "bg-cx-surface text-cx-textGhost"}`}>{label}: {on?"Yes":"No"}</span>;
}