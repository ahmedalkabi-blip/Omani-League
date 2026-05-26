import { useRef, useEffect, useCallback } from "react";
import { CLUBS, CANVAS_SIZES } from "../data/clubs.js";
import { drawMatchDay, drawFinalScore, drawMOTM } from "../utils/canvasDraw.js";

export default function CanvasPreview({ state, canvasRef: externalRef }) {
  const internalRef  = useRef(null);
  const ref          = externalRef || internalRef;
  const uImgRef      = useRef(null);
  const containerRef = useRef(null);

  const size = CANVAS_SIZES[state.canvasSize] || CANVAS_SIZES.portrait;
  const CW   = size.w;   // e.g. 540
  const CH   = size.h;   // e.g. 675 (portrait), 540 (square), 960 (story)

  /* Load uploaded image once and store for redraws */
  useEffect(() => {
    if (!state.imgSrc) { uImgRef.current = null; return; }
    const img  = new Image();
    img.onload = () => { uImgRef.current = img; redraw(); };
    img.src    = state.imgSrc;
  }, [state.imgSrc]); // eslint-disable-line

  const redraw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // Ensure canvas pixel resolution matches the selected size
    if (canvas.width  !== CW) canvas.width  = CW;
    if (canvas.height !== CH) canvas.height = CH;
    const ctx  = canvas.getContext("2d");
    ctx.clearRect(0, 0, CW, CH);
    const hc   = CLUBS[state.hk];
    const ac   = CLUBS[state.ak];
    const uImg = uImgRef.current;
    if (state.tpl === "matchday")   drawMatchDay(ctx, state, hc, ac, uImg, CW, CH);
    if (state.tpl === "finalscore") drawFinalScore(ctx, state, hc, ac, uImg, CW, CH);
    if (state.tpl === "motm")       drawMOTM(ctx, state, hc, ac, uImg, CW, CH);
  }, [state, ref, CW, CH]);

  useEffect(() => { redraw(); }, [redraw]);

  /* Resize canvas CSS display to fill container while keeping aspect ratio */
  useEffect(() => {
    const resize = () => {
      const el = containerRef.current;
      if (!el) return;
      const maxW  = el.clientWidth  - 40;
      const maxH  = el.clientHeight - 40;
      const ratio = CH / CW;                          // > 1 for portrait/story
      // Fit within both maxW and maxH
      let dW = Math.min(maxW, maxH / ratio);
      let dH = dW * ratio;
      if (dH > maxH) { dH = maxH; dW = dH / ratio; }
      // Cap display width so it never looks gigantic on wide screens
      const cap = CW === CH ? 520 : 460;             // square can be larger
      if (dW > cap) { dW = cap; dH = dW * ratio; }
      const canvas = ref.current;
      if (canvas) {
        canvas.style.width  = Math.round(dW) + "px";
        canvas.style.height = Math.round(dH) + "px";
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [ref, CW, CH]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, overflow: "hidden",
      }}
    >
      <div style={{
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 0 0 1px rgba(255,255,255,.08), 0 24px 60px rgba(0,0,0,.7)",
        /* Explicit inline-block so the shadow wrapper hugs the canvas */
        display: "inline-block", lineHeight: 0,
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
