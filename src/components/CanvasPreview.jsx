import { useRef, useEffect, useCallback } from "react";
import { CLUBS } from "../data/clubs.js";
import { drawMatchDay, drawFinalScore, drawMOTM } from "../utils/canvasDraw.js";

const DIMS = {
  portrait: [540, 675],
  square:   [540, 540],
};

export default function CanvasPreview({ state, canvasRef: externalRef }) {
  const internalRef  = useRef(null);
  const ref          = externalRef || internalRef;
  const uImgRef      = useRef(null);
  const containerRef = useRef(null);

  const [CW, CH] = DIMS[state.canvasSize] || DIMS.portrait;

  /* Load uploaded image into a reusable Image object */
  useEffect(() => {
    if (!state.imgSrc) { uImgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { uImgRef.current = img; redraw(); };
    img.src = state.imgSrc;
  }, [state.imgSrc]); // eslint-disable-line

  const redraw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // Sync canvas element dimensions in case canvasSize changed
    if (canvas.width !== CW)  canvas.width  = CW;
    if (canvas.height !== CH) canvas.height = CH;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CW, CH);
    const hc   = CLUBS[state.hk];
    const ac   = CLUBS[state.ak];
    const uImg = uImgRef.current;
    if (state.tpl === "matchday")   drawMatchDay(ctx, state, hc, ac, uImg, CW, CH);
    if (state.tpl === "finalscore") drawFinalScore(ctx, state, hc, ac, uImg, CW, CH);
    if (state.tpl === "motm")       drawMOTM(ctx, state, hc, ac, uImg, CW, CH);
  }, [state, ref, CW, CH]);

  /* Redraw whenever state changes */
  useEffect(() => { redraw(); }, [redraw]);

  /* Responsive canvas display size (maintains aspect ratio) */
  useEffect(() => {
    const resize = () => {
      const el = containerRef.current;
      if (!el) return;
      const maxW = el.clientWidth  - 32;
      const maxH = el.clientHeight - 32;
      const ratio = CH / CW;
      let dispW = Math.min(maxW, maxH / ratio, 520);
      let dispH = dispW * ratio;
      if (dispH > maxH) { dispH = maxH; dispW = dispH / ratio; }
      const canvas = ref.current;
      if (canvas) {
        canvas.style.width  = Math.round(dispW) + "px";
        canvas.style.height = Math.round(dispH) + "px";
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [ref, CW, CH]);

  return (
    <div ref={containerRef} style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, overflow: "hidden",
    }}>
      <div style={{
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 0 0 1px rgba(255,255,255,.08), 0 24px 60px rgba(0,0,0,.7)",
      }}>
        <canvas
          ref={ref}
          width={CW}
          height={CH}
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
}
