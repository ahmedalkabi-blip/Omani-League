import { useState } from "react";
import { CLUBS } from "../data/clubs.js";

const s = {
  sidebar: {
    width: "260px", minWidth: "260px", background: "#13131f",
    borderLeft: "1px solid rgba(255,255,255,.07)",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  sbHeader: {
    padding: "14px 14px 10px", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0,
  },
  brand: { display: "flex", alignItems: "center", gap: "9px" },
  brandIcon: {
    width: 30, height: 30, background: "#facc15", borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, flexShrink: 0,
  },
  brandName: { fontSize: 14, fontWeight: 900, lineHeight: 1.15 },
  brandSub: { fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: ".15em" },
  sbTabs: { display: "flex", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0 },
  sbBody: { flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 16 },
  secLabel: { fontSize: 9, fontWeight: 700, letterSpacing: ".2em", color: "rgba(255,255,255,.25)", textTransform: "uppercase", marginBottom: 8 },
  fieldLabel: { display: "block", fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 5, textAlign: "right" },
  clubGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 },
  tplGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 12 },
  slRow: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 5 },
};

function SbTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "9px 4px", fontSize: 11, fontWeight: 700,
      background: "transparent", border: "none", color: active ? "#facc15" : "rgba(255,255,255,.35)",
      cursor: "pointer", borderBottom: active ? "2px solid #facc15" : "2px solid transparent",
      transition: "all .2s",
    }}>
      {label}
    </button>
  );
}

function TplBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      borderRadius: 9, border: active ? "1px solid #facc15" : "1px solid rgba(255,255,255,.1)",
      background: active ? "#facc15" : "rgba(255,255,255,.03)",
      color: active ? "#000" : "rgba(255,255,255,.45)",
      padding: "9px 5px", textAlign: "center", fontSize: 11, fontWeight: 700,
      transition: "all .2s", lineHeight: 1.4,
    }}>
      {label}
    </button>
  );
}

function ClubBtn({ club, active, side, onClick }) {
  const gold = "#facc15", blue = "#60a5fa";
  const accentColor = side === "home" ? gold : blue;
  return (
    <button onClick={onClick} title={club.n} style={{
      borderRadius: 9, border: `1px solid ${active ? accentColor : "rgba(255,255,255,.1)"}`,
      background: active ? `${accentColor}18` : "rgba(255,255,255,.03)",
      padding: "7px 4px", textAlign: "center", transition: "all .2s",
      position: "relative",
    }}>
      <em style={{ fontStyle: "normal", fontSize: 18, display: "block", marginBottom: 2 }}>{club.b}</em>
      <span style={{
        fontSize: 8, fontWeight: 700, color: active ? accentColor : "rgba(255,255,255,.55)",
        lineHeight: 1.2, display: "block",
      }}>
        {club.n.replace("نادي ", "")}
      </span>
      {active && (
        <span style={{
          position: "absolute", top: 3, right: 3, width: 5, height: 5,
          borderRadius: "50%", background: accentColor, display: "block",
        }} />
      )}
    </button>
  );
}

export default function Sidebar({ state, onUpdate, onImageLoad, onImageDelete }) {
  const [activeTab, setActiveTab] = useState("clubs");

  const field = (label, key, placeholder, rows) => (
    <div>
      <label style={s.fieldLabel}>{label}</label>
      {rows
        ? <textarea rows={rows} value={state[key]} onChange={e => onUpdate(key, e.target.value)} placeholder={placeholder} />
        : <input value={state[key]} onChange={e => onUpdate(key, e.target.value)} placeholder={placeholder} />
      }
    </div>
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
    <aside style={s.sidebar}>
      {/* Header */}
      <div style={s.sbHeader}>
        <div style={s.brand}>
          <div style={s.brandIcon}>🇴🇲</div>
          <div>
            <div style={s.brandName}>مصمم البوستات</div>
            <div style={s.brandSub}>دوري عُمانتل</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.sbTabs}>
        {[["clubs","الأندية"],["match","المباراة"],["image","الصورة"]].map(([id, label]) => (
          <SbTab key={id} label={label} active={activeTab === id} onClick={() => setActiveTab(id)} />
        ))}
      </div>

      {/* Body */}
      <div style={s.sbBody}>

        {/* ── CLUBS TAB ── */}
        {activeTab === "clubs" && (
          <>
            {/* Template picker */}
            <div style={s.tplGrid}>
              {[["matchday","يوم\nالمباراة"],["finalscore","النتيجة\nالنهائية"],["motm","رجل\nالمباراة"]].map(([id, label]) => (
                <TplBtn key={id} label={label.replace("\\n", "\n")} active={state.tpl === id}
                  onClick={() => onUpdate("tpl", id)} />
              ))}
            </div>

            {/* Home */}
            <div>
              <div style={s.secLabel}>الفريق المضيف</div>
              <div style={s.clubGrid}>
                {Object.entries(CLUBS).map(([k, c]) => (
                  <ClubBtn key={k} club={c} side="home" active={state.hk === k}
                    onClick={() => onUpdate("hk", k)} />
                ))}
              </div>
            </div>

            {/* Away */}
            <div>
              <div style={s.secLabel}>الفريق الضيف</div>
              <div style={s.clubGrid}>
                {Object.entries(CLUBS).map(([k, c]) => (
                  <ClubBtn key={k} club={c} side="away" active={state.ak === k}
                    onClick={() => onUpdate("ak", k)} />
                ))}
              </div>
            </div>

            {/* Color strip */}
            <div style={{
              height: 5, borderRadius: 99, overflow: "hidden",
              background: `linear-gradient(90deg,${CLUBS[state.hk].p} 0%,${CLUBS[state.hk].s} 40%,rgba(255,255,255,.15) 50%,${CLUBS[state.ak].s} 60%,${CLUBS[state.ak].p} 100%)`,
            }} />
          </>
        )}

        {/* ── MATCH TAB ── */}
        {activeTab === "match" && (
          <>
            {field("النتيجة", "score", "2 - 1")}
            {field("الهدافون", "scorers", "أحمد الكندي 23'", 2)}
            {field("التوقيت", "time", "8:00 مساءً")}
            {field("الملعب", "stadium", "ملعب السلطان قابوس")}
            {field("الجولة", "round", "الجولة 12")}
            {state.tpl === "motm" && field("رجل المباراة", "motm", "اسم اللاعب")}
          </>
        )}

        {/* ── IMAGE TAB ── */}
        {activeTab === "image" && (
          <>
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              border: "2px dashed rgba(255,255,255,.12)", borderRadius: 10, padding: "20px 0",
              cursor: "pointer", color: "rgba(255,255,255,.3)", fontSize: 11,
              transition: "all .2s",
            }}>
              <span style={{ fontSize: 24 }}>🖼️</span>
              <span>ارفع صورة اللاعب أو الخلفية</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,.2)" }}>PNG · JPG · WEBP</span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
            </label>

            {state.imgSrc && (
              <>
                <div style={{ borderRadius: 8, overflow: "hidden", height: 80, background: "rgba(255,255,255,.05)" }}>
                  <img src={state.imgSrc} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
                </div>

                <div>
                  <div style={s.slRow}>
                    <span>الشفافية</span><span style={{ color: "rgba(255,255,255,.7)" }}>{state.op}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={state.op}
                    onChange={e => onUpdate("op", +e.target.value)} />
                </div>

                <div>
                  <div style={s.slRow}>
                    <span>الحجم</span><span style={{ color: "rgba(255,255,255,.7)" }}>{state.sc}%</span>
                  </div>
                  <input type="range" min="50" max="200" value={state.sc}
                    onChange={e => onUpdate("sc", +e.target.value)} />
                </div>

                <button onClick={onImageDelete} style={{
                  width: "100%", padding: 7, borderRadius: 8,
                  border: "1px solid rgba(239,68,68,.3)", background: "transparent",
                  color: "rgba(239,68,68,.65)", fontSize: 11,
                }}>
                  ✕ حذف الصورة
                </button>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
