import { useState, useRef, useCallback } from "react";
import Sidebar from "./components/Sidebar.jsx";
import CanvasPreview from "./components/CanvasPreview.jsx";
import { CLUBS, DEFAULT_STATE, TEMPLATE_LABELS } from "./data/clubs.js";

export default function App() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef(null);

  const onUpdate = useCallback((key, value) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const onImageLoad = useCallback((src) => {
    setState(prev => ({ ...prev, imgSrc: src, op: prev.op || 40, sc: prev.sc || 100 }));
  }, []);

  const onImageDelete = useCallback(() => {
    setState(prev => ({ ...prev, imgSrc: null }));
  }, []);

  const download = useCallback(() => {
    const src = canvasRef.current;
    if (!src) return;
    setDownloading(true);

    // Export at 2× (1080×1080)
    const big = document.createElement("canvas");
    big.width = 1080; big.height = 1080;
    const bx = big.getContext("2d");
    bx.scale(2, 2);
    bx.drawImage(src, 0, 0);

    big.toBlob(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `omani-league-${state.tpl}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      setDownloading(false);
    }, "image/png", 1);
  }, [state.tpl]);

  const hc = CLUBS[state.hk];
  const ac = CLUBS[state.ak];
  const tplHint = TEMPLATE_LABELS[state.tpl] || "";

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden" }}>

      {/* Sidebar */}
      <Sidebar
        state={state}
        onUpdate={onUpdate}
        onImageLoad={onImageLoad}
        onImageDelete={onImageDelete}
      />

      {/* Main area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0c0c18" }}>

        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,.07)",
          flexShrink: 0, background: "#0e0e1c",
        }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.2)", letterSpacing: ".12em" }}>
            {tplHint} · 1080 × 1080
          </span>
          <button
            onClick={download}
            disabled={downloading}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "#facc15", color: "#000", fontWeight: 900,
              border: "none", borderRadius: 10, padding: "9px 20px",
              fontSize: 13, cursor: downloading ? "default" : "pointer",
              opacity: downloading ? 0.6 : 1, transition: "opacity .2s",
            }}
          >
            {downloading ? "⏳ جاري..." : "⬇️ تحميل PNG"}
          </button>
        </div>

        {/* Canvas preview (fills remaining space) */}
        <CanvasPreview state={state} canvasRef={canvasRef} />

        {/* Bottom chips bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,.06)",
          flexShrink: 0, background: "#0e0e1c",
        }}>
          {[hc, ac].map((club, i) => (
            <>
              {i === 1 && <span key="vs" style={{ fontSize: 11, color: "rgba(255,255,255,.2)" }}>◆</span>}
              <div key={club.n} style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)",
                borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 700,
              }}>
                <span>{club.b}</span>
                <span>{club.n}</span>
              </div>
            </>
          ))}
        </div>

      </main>
    </div>
  );
}
