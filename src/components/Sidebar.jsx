import { useState } from "react";
import { CLUBS, CANVAS_SIZES } from "../data/clubs.js";

/* ── Shared style tokens ─────────────────────────────────────── */
const T = {
  label: {
    display: "block", fontSize: 10, fontWeight: 700,
    letterSpacing: ".15em", color: "rgba(255,255,255,.28)",
    textTransform: "uppercase", marginBottom: 6, textAlign: "right",
  },
  slRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 5,
  },
  clubGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 },
};

/* ── Accordion section ───────────────────────────────────────── */
function Section({ title, open, onToggle, children }) {
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "11px 14px",
          background: "transparent", border: "none", cursor: "pointer",
          color: open ? "#facc15" : "rgba(255,255,255,.6)",
          fontSize: 12, fontWeight: 700, transition: "color .18s",
        }}
      >
        <span style={{
          fontSize: 9, color: open ? "#facc15" : "rgba(255,255,255,.2)",
          transition: "transform .18s", display: "inline-block",
          transform: open ? "rotate(180deg)" : "none",
        }}>▼</span>
        <span>{title}</span>
      </button>
      {open && (
        <div style={{ padding: "2px 14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Template button ─────────────────────────────────────────── */
function TplBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 9,
        border: active ? "1px solid #facc15" : "1px solid rgba(255,255,255,.1)",
        background: active ? "#facc15" : "rgba(255,255,255,.03)",
        color: active ? "#000" : "rgba(255,255,255,.45)",
        padding: "9px 5px", textAlign: "center",
        fontSize: 11, fontWeight: 700, lineHeight: 1.4,
        transition: "all .18s", whiteSpace: "pre-line",
      }}
    >
      {label}
    </button>
  );
}

/* ── Club button ─────────────────────────────────────────────── */
function ClubBtn({ club, active, side, onClick }) {
  const accent = side === "home" ? "#facc15" : "#60a5fa";
  return (
    <button
      onClick={onClick}
      title={club.n}
      style={{
        borderRadius: 9,
        border: `1px solid ${active ? accent : "rgba(255,255,255,.1)"}`,
        background: active ? `${accent}18` : "rgba(255,255,255,.03)",
        padding: "7px 4px", textAlign: "center", transition: "all .18s",
        position: "relative",
      }}
    >
      <em style={{ fontStyle: "normal", fontSize: 18, display: "block", marginBottom: 2 }}>
        {club.b}
      </em>
      <span style={{
        fontSize: 8, fontWeight: 700,
        color: active ? accent : "rgba(255,255,255,.55)",
        lineHeight: 1.2, display: "block",
      }}>
        {club.n.replace("نادي ", "")}
      </span>
      {active && (
        <span style={{
          position: "absolute", top: 3, right: 3,
          width: 5, height: 5, borderRadius: "50%",
          background: accent, display: "block",
        }} />
      )}
    </button>
  );
}

/* ── Size toggle button ──────────────────────────────────────── */
function SizeBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "9px 6px", borderRadius: 9, fontSize: 11, fontWeight: 700,
        border: active ? "1px solid #facc15" : "1px solid rgba(255,255,255,.1)",
        background: active ? "#facc15" : "rgba(255,255,255,.03)",
        color: active ? "#000" : "rgba(255,255,255,.45)",
        transition: "all .18s",
      }}
    >
      {label}
    </button>
  );
}

/* ── Field helper ────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label style={T.label}>{label}</label>
      {children}
    </div>
  );
}

/* ── Main sidebar ────────────────────────────────────────────── */
export default function Sidebar({ state, onUpdate, onImageLoad, onImageDelete, onDownload, downloading }) {
  const [open, setOpen] = useState({
    type: true, size: false, home: true, away: false,
    match: true, score: false, image: false, design: false, export: false,
  });

  const tog = key => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const field = (label, key, placeholder, rows) => (
    <Field label={label}>
      {rows
        ? <textarea rows={rows} value={state[key] || ""} onChange={e => onUpdate(key, e.target.value)} placeholder={placeholder} />
        : <input value={state[key] || ""} onChange={e => onUpdate(key, e.target.value)} placeholder={placeholder} />
      }
    </Field>
  );

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onImageLoad(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <aside style={{
      width: 264, minWidth: 264, background: "#13131f",
      borderLeft: "1px solid rgba(255,255,255,.07)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Brand header */}
      <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "#facc15", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
          }}>🇴🇲</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.15 }}>مصمم البوستات</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: ".15em" }}>دوري عُمانتل</div>
          </div>
        </div>
      </div>

      {/* Accordion body */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* ── 1. Post Type ── */}
        <Section title="نوع البوست" open={open.type} onToggle={() => tog("type")}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
            {[
              ["matchday",   "يوم\nالمباراة"],
              ["finalscore", "النتيجة\nالنهائية"],
              ["motm",       "رجل\nالمباراة"],
            ].map(([id, lbl]) => (
              <TplBtn key={id} label={lbl} active={state.tpl === id}
                onClick={() => onUpdate("tpl", id)} />
            ))}
          </div>
        </Section>

        {/* ── 2. Canvas Size ── */}
        <Section title="حجم التصميم" open={open.size} onToggle={() => tog("size")}>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(CANVAS_SIZES).map(([k, v]) => (
              <SizeBtn key={k} label={v.label} active={state.canvasSize === k}
                onClick={() => onUpdate("canvasSize", k)} />
            ))}
          </div>
          <p dir="ltr" style={{ fontSize: 10, color: "rgba(255,255,255,.25)", textAlign: "right", margin: 0 }}>
            {(CANVAS_SIZES[state.canvasSize] || CANVAS_SIZES.portrait).hint} بكسل
          </p>
        </Section>

        {/* ── 3. Home Team ── */}
        <Section title="الفريق المضيف" open={open.home} onToggle={() => tog("home")}>
          <div style={T.clubGrid}>
            {Object.entries(CLUBS).map(([k, c]) => (
              <ClubBtn key={k} club={c} side="home" active={state.hk === k}
                onClick={() => onUpdate("hk", k)} />
            ))}
          </div>
          {/* Color preview strip */}
          <div style={{
            height: 4, borderRadius: 99, overflow: "hidden",
            background: `linear-gradient(90deg,${CLUBS[state.hk].p},${CLUBS[state.hk].s})`,
          }} />
        </Section>

        {/* ── 4. Away Team ── */}
        <Section title="الفريق الضيف" open={open.away} onToggle={() => tog("away")}>
          <div style={T.clubGrid}>
            {Object.entries(CLUBS).map(([k, c]) => (
              <ClubBtn key={k} club={c} side="away" active={state.ak === k}
                onClick={() => onUpdate("ak", k)} />
            ))}
          </div>
          <div style={{
            height: 4, borderRadius: 99, overflow: "hidden",
            background: `linear-gradient(90deg,${CLUBS[state.ak].p},${CLUBS[state.ak].s})`,
          }} />
        </Section>

        {/* ── 5. Match Details ── */}
        <Section title="تفاصيل المباراة" open={open.match} onToggle={() => tog("match")}>
          {field("التاريخ",  "date",    "السبت، 15 مارس 2025")}
          {field("التوقيت",  "time",    "8:00 مساءً")}
          {field("الملعب",   "stadium", "ملعب السلطان قابوس")}
          {field("الجولة",   "round",   "الجولة 12")}
        </Section>

        {/* ── 6. Score & Scorers ── */}
        <Section title="النتيجة والهدافون" open={open.score} onToggle={() => tog("score")}>
          {field("النتيجة", "score", "2 - 1")}
          {field("الهدافون", "scorers", "أحمد الكندي 23' • سالم البلوشي 67'", 2)}
          <Field label="الحالة">
            <div style={{ display: "flex", gap: 5 }}>
              {["FULL TIME", "HALF TIME"].map(s => (
                <SizeBtn key={s} label={s} active={state.status === s}
                  onClick={() => onUpdate("status", s)} />
              ))}
            </div>
          </Field>
          {state.tpl === "motm" && field("رجل المباراة", "motm", "اسم اللاعب")}
        </Section>

        {/* ── 7. Background Image ── */}
        <Section title="صورة الخلفية" open={open.image} onToggle={() => tog("image")}>
          <label style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            border: "2px dashed rgba(255,255,255,.12)", borderRadius: 10,
            padding: "18px 0", cursor: "pointer",
            color: "rgba(255,255,255,.3)", fontSize: 11, transition: "all .2s",
          }}>
            <span style={{ fontSize: 22 }}>🖼️</span>
            <span>ارفع صورة الخلفية</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,.2)" }}>PNG · JPG · WEBP</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          </label>

          {state.imgSrc && (
            <>
              <div style={{ borderRadius: 8, overflow: "hidden", height: 72, background: "rgba(255,255,255,.05)" }}>
                <img src={state.imgSrc} alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
              </div>

              <Field label="الشفافية">
                <div style={T.slRow}>
                  <span>{state.op}%</span>
                  <span>الشفافية</span>
                </div>
                <input type="range" min="0" max="100" value={state.op}
                  onChange={e => onUpdate("op", +e.target.value)} />
              </Field>

              <Field label="الحجم">
                <div style={T.slRow}>
                  <span>{state.sc}%</span>
                  <span>الحجم</span>
                </div>
                <input type="range" min="50" max="200" value={state.sc}
                  onChange={e => onUpdate("sc", +e.target.value)} />
              </Field>

              <button onClick={onImageDelete} style={{
                width: "100%", padding: 7, borderRadius: 8,
                border: "1px solid rgba(239,68,68,.3)", background: "transparent",
                color: "rgba(239,68,68,.65)", fontSize: 11,
              }}>
                ✕ حذف الصورة
              </button>
            </>
          )}
        </Section>

        {/* ── 8. Design Settings ── */}
        <Section title="إعدادات التصميم" open={open.design} onToggle={() => tog("design")}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,.25)", textAlign: "center", margin: "8px 0" }}>
            الألوان تُحدَّد تلقائياً من أندية المباراة
          </p>
          {/* Color preview of current matchup */}
          <div style={{
            height: 8, borderRadius: 99, overflow: "hidden",
            background: `linear-gradient(90deg,${CLUBS[state.hk].p} 0%,${CLUBS[state.hk].s} 40%,rgba(255,255,255,.15) 50%,${CLUBS[state.ak].s} 60%,${CLUBS[state.ak].p} 100%)`,
          }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,.3)" }}>
            <span>{CLUBS[state.ak].e}</span>
            <span>{CLUBS[state.hk].e}</span>
          </div>
        </Section>

        {/* ── 9. Export ── */}
        <Section title="تصدير" open={open.export} onToggle={() => tog("export")}>
          <p dir="ltr" style={{ fontSize: 10, color: "rgba(255,255,255,.25)", textAlign: "right", margin: 0 }}>
            مقاس الإخراج: {(CANVAS_SIZES[state.canvasSize] || CANVAS_SIZES.portrait).hint} بكسل
          </p>
          <button
            onClick={onDownload}
            disabled={downloading}
            style={{
              width: "100%", padding: "11px 0",
              background: downloading ? "rgba(250,204,21,.4)" : "#facc15",
              color: "#000", fontWeight: 900, border: "none",
              borderRadius: 10, fontSize: 13,
              cursor: downloading ? "default" : "pointer",
              transition: "background .2s",
            }}
          >
            {downloading ? "⏳ جاري التصدير..." : "⬇️ تحميل PNG"}
          </button>
        </Section>

      </div>
    </aside>
  );
}
