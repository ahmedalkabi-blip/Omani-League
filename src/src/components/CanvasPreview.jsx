import { useRef, useEffect, useCallback } from "react";
import { CLUBS } from "../data/clubs.js";
import {
  drawMatchDay, drawFinalScore, drawMOTM,
} from "../utils/canvasDraw.js";

const CANVAS_SIZE = 540; // internal resolution (exported at 1080 via 2× scale)

export default function CanvasPreview({ state, canvasRef: externalRef }) {
  const internalRef = useRef(null);
  const ref = externalRef || internalRef;
  const uImgRef = useRef(null);
  const containerRef = useRef(null);

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
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const hc = CLUBS[state.hk];
    const ac = CLUBS[state.ak];
    const uImg = uImgRef.current;
    if (state.tpl === "matchday")   drawMatchDay(ctx, state, hc, ac, uImg);
    if (state.tpl === "finalscore") drawFinalScore(ctx, state, hc, ac, uImg);
    if (state.tpl === "motm")       drawMOTM(ctx, state, hc, ac, uImg);
  }, [state, ref]);

  /* Redraw whenever state changes */
  useEffect(() => { redraw(); }, [redraw]);

  /* Responsive canvas display size */
  useEffect(() => {
    const resize = () => {
      const el = containerRef.current;
      if (!el) return;
      const sz = Math.min(el.clientWidth - 32, el.clientHeight - 32, 520);
      const canvas = ref.current;
      if (canvas) {
        canvas.style.width  = sz + "px";
        canvas.style.height = sz + "px";
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [ref]);

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
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
}
