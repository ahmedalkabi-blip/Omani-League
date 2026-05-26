/* ─── Canvas Drawing Utilities ─────────────────────────────────────── */

export function ft(ctx, text, x, y, size, color = "#fff", weight = "900", align = "center", mw) {
  ctx.font          = `${weight} ${size}px 'Cairo', sans-serif`;
  ctx.fillStyle     = color;
  ctx.textAlign     = align;
  ctx.textBaseline  = "middle";
  mw ? ctx.fillText(text, x, y, mw) : ctx.fillText(text, x, y);
}

export function hexGrid(ctx, col, W, H) {
  ctx.save();
  ctx.globalAlpha  = 0.06;
  ctx.strokeStyle  = col;
  ctx.lineWidth    = 1;
  for (let r = -1; r < Math.ceil(H / 100) + 1; r++) {
    for (let c = -1; c < Math.ceil(W / 56) + 1; c++) {
      const ox = c * 56, oy = r * 100;
      ctx.beginPath();
      [[28,2],[54,16],[54,44],[28,58],[2,44],[2,16]].forEach(([px, py], i) =>
        i === 0 ? ctx.moveTo(ox+px, oy+py) : ctx.lineTo(ox+px, oy+py)
      );
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* Background image — confined to the upper `topFrac` of the canvas */
export function drawUImg(ctx, uImg, op, sc, W, H, topFrac = 0.55) {
  if (!uImg) return;
  const tH    = H * topFrac;
  const scale = sc / 100;
  const f     = Math.max(W / uImg.naturalWidth, tH / uImg.naturalHeight) * scale;
  const dw    = uImg.naturalWidth  * f;
  const dh    = uImg.naturalHeight * f;
  ctx.save();
  ctx.globalAlpha = op / 100;
  ctx.drawImage(uImg, (W - dw) / 2, (tH - dh) / 2, dw, dh);
  ctx.restore();
}

function darkOverlay(ctx, W, H, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  stops.forEach(([p, a]) => g.addColorStop(p, `rgba(0,0,0,${a})`));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function circle(ctx, x, y, r, fill, stroke, sw = 2.5) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke(); }
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, rad, fill, stroke, alpha) {
  ctx.save();
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, rad);
  if (fill)   { ctx.fillStyle   = fill;   ctx.fill();   }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.8; ctx.stroke(); }
  ctx.restore();
}

function colorStrip(ctx, W, y, h, hc, ac, alpha = 0.6) {
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0,    hc.p);
  g.addColorStop(0.45, hc.s);
  g.addColorStop(0.55, ac.s);
  g.addColorStop(1,    ac.p);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle   = g;
  ctx.fillRect(28, y, W - 56, h);
  ctx.restore();
}

function parseScore(score) {
  const parts = (score || "0 - 0").split(/\s*[-–:]\s*/);
  return [parts[0]?.trim() || "0", parts[1]?.trim() || "0"];
}

/* ─────────────────────────────────────────────────────────────────────
   MATCH DAY
   Portrait / Story  → logos sit at 50 % (below the upper 45 % image zone)
   Square            → logos sit at 38 %
───────────────────────────────────────────────────────────────────── */
export function drawMatchDay(ctx, S, hc, ac, uImg, W = 540, H = 675) {
  const cx         = W / 2;
  const isPortrait = H > W;   // true for portrait (675) and story (960)

  /* ── Background ── */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,    hc.p);
  bg.addColorStop(0.40, "#06060f");
  bg.addColorStop(1,    ac.p);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  hexGrid(ctx, hc.s, W, H);

  /* Background image fills upper ~56 % */
  drawUImg(ctx, uImg, S.op, S.sc, W, H, 0.56);

  /* Gradient overlay — image stays bright in top 45 %, darkens below */
  darkOverlay(ctx, W, H, [
    [0,    0.04],
    [0.40, 0.10],
    [0.52, 0.52],
    [0.66, 0.84],
    [1,    0.96],
  ]);

  /* ── TOP ROW ── */
  ft(ctx, S.date || "", 16, 26, 11, "rgba(255,255,255,.82)", "600", "left");
  roundRect(ctx, W - 164, 12, 152, 28, 14, "rgba(0,0,0,.55)", "rgba(255,255,255,.22)");
  ft(ctx, "🇴🇲 دوري عُمانتل", W - 88, 26, 10.5, "#facc15", "700");

  /* ── COMPETITION RIBBON ── */
  const ribY = isPortrait ? 52 : 48;
  ctx.save();
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.moveTo(cx - 114, ribY); ctx.lineTo(cx + 114, ribY);
  ctx.lineTo(cx + 106, ribY + 28); ctx.lineTo(cx - 106, ribY + 28);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ft(ctx, "يوم المباراة", cx, ribY + 14, 17, "#000", "900");

  /* ── LOGOS + VS ── */
  // Portrait/Story: logos at 50 % (below image zone); Square: 38 %
  const logoFrac = isPortrait ? 0.50 : 0.38;
  const logoY    = Math.round(H * logoFrac);
  const logoR    = Math.round(W * 0.094);       // ~51 px
  const homeX    = Math.round(W * 0.195);       // ~105
  const awayX    = Math.round(W * 0.805);       // ~435

  circle(ctx, homeX, logoY, logoR, hc.p, hc.s, 3);
  ft(ctx, hc.b, homeX, logoY, Math.round(logoR * 0.74));

  circle(ctx, awayX, logoY, logoR, ac.p, ac.s, 3);
  ft(ctx, ac.b, awayX, logoY, Math.round(logoR * 0.74));

  /* VS ghost + time */
  ft(ctx, "VS", cx, logoY, Math.round(logoR * 1.1), "rgba(255,255,255,.07)", "900");
  ft(ctx, S.time, cx, logoY + logoR + 16, 18, "#facc15", "800");

  /* ── TEAM NAMES ── */
  const nameY = logoY + logoR + 56;
  ft(ctx, hc.n, homeX, nameY,      15, "#fff", "900", "center", 155);
  ft(ctx, hc.e, homeX, nameY + 21, 9,  "rgba(255,255,255,.38)", "400");
  ft(ctx, ac.n, awayX, nameY,      15, "#fff", "900", "center", 155);
  ft(ctx, ac.e, awayX, nameY + 21, 9,  "rgba(255,255,255,.38)", "400");

  /* ── COLOR STRIP ── */
  const stripY = nameY + 52;
  colorStrip(ctx, W, stripY, 3, hc, ac, 0.6);

  /* ── INFO PANEL ── */
  const panelY = stripY + 18;
  const panelH = Math.round(H * 0.148);
  roundRect(ctx, 28, panelY, W - 56, panelH, 18,
    "rgba(255,255,255,.04)", "rgba(255,255,255,.1)");

  /* Round pill inside panel */
  roundRect(ctx, cx - 82, panelY + 13, 164, 26, 13,
    "rgba(255,255,255,.06)", "rgba(255,255,255,.15)");
  ft(ctx, S.round, cx, panelY + 26, 13, "rgba(255,255,255,.72)", "700");

  /* Divider */
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(55, panelY + 52); ctx.lineTo(W - 55, panelY + 52);
  ctx.stroke();
  ctx.restore();

  /* Venue */
  ft(ctx, S.stadium, cx, panelY + 76, 12, "rgba(255,255,255,.52)", "400", "center", 360);

  /* Watermark in empty space before footer (portrait / story only) */
  if (isPortrait) {
    const panelEnd = panelY + panelH;
    const footerY  = H - 34;
    const gap      = footerY - panelEnd;
    if (gap > 30) {
      const wmY = panelEnd + gap / 2;
      ft(ctx, `${hc.e}  ×  ${ac.e}`, cx, wmY - 10, 12, "rgba(255,255,255,.07)", "300");
      ft(ctx, "#OmantelLeague",        cx, wmY + 12, 11, "rgba(255,255,255,.05)", "300");
    }
  }

  /* ── FOOTER ── */
  const footerY = H - 34;
  ctx.fillStyle = "rgba(0,0,0,.72)"; ctx.fillRect(0, footerY, W, 34);
  ctx.save(); ctx.globalAlpha = 0.7;
  const fg = ctx.createLinearGradient(0, 0, W, 0);
  fg.addColorStop(0, hc.p); fg.addColorStop(0.5, "rgba(255,255,255,.06)"); fg.addColorStop(1, ac.p);
  ctx.fillStyle = fg; ctx.fillRect(0, footerY, W, 2);
  ctx.restore();
  ft(ctx, "دوري عُمانتل للمحترفين  •  Omantel League", cx, footerY + 17, 10, "rgba(255,255,255,.32)", "400");
}

/* ─────────────────────────────────────────────────────────────────────
   FINAL SCORE / HALF TIME
───────────────────────────────────────────────────────────────────── */
export function drawFinalScore(ctx, S, hc, ac, uImg, W = 540, H = 675) {
  const cx         = W / 2;
  const isPortrait = H > W;

  /* ── Background ── */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,    hc.p);
  bg.addColorStop(0.40, "#04040e");
  bg.addColorStop(1,    ac.p);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  /* Diagonal texture */
  ctx.save(); ctx.globalAlpha = 0.04; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
  for (let i = -20; i < 30; i++) {
    ctx.beginPath(); ctx.moveTo(i * 20, 0); ctx.lineTo(i * 20 + H, H); ctx.stroke();
  }
  ctx.restore();

  drawUImg(ctx, uImg, S.op, S.sc, W, H, 0.54);

  darkOverlay(ctx, W, H, [
    [0,    0.08],
    [0.32, 0.22],
    [0.48, 0.60],
    [0.64, 0.86],
    [1,    0.96],
  ]);

  /* ── TOP ROW ── */
  ft(ctx, S.round,     16,     26, 11, "rgba(255,255,255,.55)", "600", "left");
  roundRect(ctx, cx - 90, 13, 180, 26, 13, "rgba(255,255,255,.07)", "rgba(255,255,255,.18)");
  ft(ctx, "النتيجة النهائية", cx, 26, 11.5, "#fde047", "700");
  ft(ctx, S.date || "", W - 16, 26, 11, "rgba(255,255,255,.45)", "400", "right");

  /* ── TEAM LOGOS ── */
  const logoFrac = isPortrait ? 0.40 : 0.36;
  const logoY    = Math.round(H * logoFrac);
  const logoR    = Math.round(W * 0.089);
  const homeX    = Math.round(W * 0.19);
  const awayX    = Math.round(W * 0.81);

  circle(ctx, homeX, logoY, logoR, hc.p, hc.s, 2.5);
  ft(ctx, hc.b, homeX, logoY, Math.round(logoR * 0.70));
  circle(ctx, awayX, logoY, logoR, ac.p, ac.s, 2.5);
  ft(ctx, ac.b, awayX, logoY, Math.round(logoR * 0.70));

  /* ── TEAM NAMES ── */
  const nameY = logoY + logoR + (isPortrait ? 44 : 38);
  ft(ctx, hc.n, homeX, nameY,      14, "#fff", "900", "center", 148);
  ft(ctx, hc.e, homeX, nameY + 18, 9,  "rgba(255,255,255,.35)", "400");
  ft(ctx, ac.n, awayX, nameY,      14, "#fff", "900", "center", 148);
  ft(ctx, ac.e, awayX, nameY + 18, 9,  "rgba(255,255,255,.35)", "400");

  /* ── SCORE BOX ── */
  const scoreBoxY = nameY + (isPortrait ? 52 : 38);
  const scoreBoxH = Math.round(H * (isPortrait ? 0.148 : 0.135));

  if (isPortrait) {
    /* Yellow status badge above score box */
    roundRect(ctx, cx - 74, scoreBoxY - 34, 148, 26, 13, "#facc15");
    ft(ctx, S.status || "FULL TIME", cx, scoreBoxY - 21, 11, "#000", "900");
  }

  roundRect(ctx, cx - 102, scoreBoxY, 204, scoreBoxH, 20,
    "rgba(255,255,255,.06)", "rgba(255,255,255,.18)");

  const [hs, as]  = parseScore(S.score);
  const scoreTextY = scoreBoxY + scoreBoxH / 2 + (isPortrait ? 6 : 10);

  if (!isPortrait) {
    ft(ctx, S.status || "FULL TIME", cx, scoreBoxY + 14, 10, "rgba(255,255,255,.45)", "400");
  }
  ft(ctx, hs,  cx - 54, scoreTextY, 62, "#fff", "900");
  ft(ctx, ":", cx,      scoreTextY - 6, 36, "rgba(255,255,255,.2)", "300");
  ft(ctx, as,  cx + 54, scoreTextY, 62, "#fff", "900");

  /* ── SCORERS BOX ── */
  const scorersY = scoreBoxY + scoreBoxH + (isPortrait ? 26 : 16);
  const scorersH = Math.round(H * (isPortrait ? 0.114 : 0.108));
  roundRect(ctx, 36, scorersY, W - 72, scorersH, 14,
    "rgba(255,255,255,.04)", "rgba(255,255,255,.1)");
  ft(ctx, "⚽  الهدافون", cx, scorersY + 17, 11, "rgba(255,255,255,.38)", "400");
  ft(ctx, S.scorers || "—", cx, scorersY + 40, 12.5, "#fff", "700", "center", 370);

  /* ── VENUE + ACCENT LINES ── */
  const venueY = scorersY + scorersH + (isPortrait ? 20 : 12);
  ft(ctx, S.stadium, cx, venueY, 11, "rgba(255,255,255,.38)", "400", "center", 360);

  const lineY = venueY + (isPortrait ? 26 : 18);
  ctx.save(); ctx.lineWidth = 3; ctx.globalAlpha = 0.55;
  ctx.strokeStyle = hc.s;
  ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(W * 0.47, lineY); ctx.stroke();
  ctx.strokeStyle = ac.s;
  ctx.beginPath(); ctx.moveTo(W * 0.53, lineY); ctx.lineTo(W, lineY); ctx.stroke();
  ctx.restore();

  /* ── FOOTER ── */
  const footerY = H - 34;
  ctx.fillStyle = "rgba(0,0,0,.72)"; ctx.fillRect(0, footerY, W, 34);
  ft(ctx, "دوري عُمانتل للمحترفين", cx, footerY + 17, 10, "rgba(255,255,255,.3)", "400");
}

/* ─────────────────────────────────────────────────────────────────────
   MAN OF THE MATCH
───────────────────────────────────────────────────────────────────── */
export function drawMOTM(ctx, S, hc, _ac, uImg, W = 540, H = 675) {
  const cx         = W / 2;
  const isPortrait = H > W;

  /* ── Background ── */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0,   hc.p);
  bg.addColorStop(0.5, "#06060f");
  bg.addColorStop(1,   "#020208");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  hexGrid(ctx, hc.s, W, H);

  /* Player image — upper 60 % */
  drawUImg(ctx, uImg, S.op, S.sc, W, H, 0.60);

  /* Gradient: transparent at top, very dark at bottom */
  const gf = ctx.createLinearGradient(0, 0, 0, H);
  gf.addColorStop(0,    "rgba(0,0,0,0)");
  gf.addColorStop(0.30, "rgba(0,0,0,0.06)");
  gf.addColorStop(0.52, "rgba(0,0,0,0.55)");
  gf.addColorStop(0.70, "rgba(0,0,0,0.86)");
  gf.addColorStop(1,    "rgba(0,0,0,0.97)");
  ctx.fillStyle = gf; ctx.fillRect(0, 0, W, H);

  /* ── HEADER ── */
  ctx.save();
  ctx.strokeStyle = hc.s; ctx.lineWidth = 3.5; ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.moveTo(90, 52); ctx.lineTo(W - 90, 52); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(90, 80); ctx.lineTo(W - 90, 80); ctx.stroke();
  ctx.restore();
  ft(ctx, "رجل المباراة",       cx, 66, 18, hc.s, "900");
  ft(ctx, "PLAYER OF THE MATCH", cx, 92,  9, "rgba(255,255,255,.28)", "400");
  ft(ctx, S.date || "", W - 16, 26, 10, "rgba(255,255,255,.45)", "400", "right");

  /* ── MAIN CARD ── */
  const cardFrac = isPortrait ? 0.60 : 0.58;
  const cardY    = Math.round(H * cardFrac);
  const cardH    = Math.round(H * (isPortrait ? 0.285 : 0.305));
  roundRect(ctx, 28, cardY, W - 56, cardH, 20, "rgba(3,3,14,.88)", "rgba(255,255,255,.12)");

  /* Score (left side of card) */
  const [hs, as] = parseScore(S.score);
  ft(ctx, `${hs}–${as}`, 82, cardY + 52, 48, "#facc15", "900", "center");
  ft(ctx, "النتيجة",     82, cardY + 84,  9, "rgba(255,255,255,.3)", "400", "center");

  /* Vertical divider */
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(128, cardY + 22); ctx.lineTo(128, cardY + 106); ctx.stroke();
  ctx.restore();

  /* Player name (right side of card) */
  ft(ctx, "اللاعب",                   W - 44, cardY + 28, 9,  "rgba(255,255,255,.38)", "400", "right");
  ft(ctx, S.motm || "اسم اللاعب",     W - 44, cardY + 58, 26, "#fff", "900", "right", 260);

  /* Club badge row */
  circle(ctx, 50, cardY + 128, 14, hc.p, hc.s, 1.5);
  ft(ctx, hc.b, 50,       cardY + 128, 12, "#fff", "400", "center");
  ft(ctx, hc.n, 72,       cardY + 128, 12, "rgba(255,255,255,.55)", "600", "left");
  ft(ctx, S.round, W - 44, cardY + 128, 11, "rgba(255,255,255,.38)", "400", "right");

  /* Bottom divider + stadium */
  const divY = cardY + cardH - 32;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(50, divY); ctx.lineTo(W - 50, divY); ctx.stroke();
  ctx.restore();
  ft(ctx, S.stadium, cx, cardY + cardH - 16, 10, "rgba(255,255,255,.3)", "400", "center", 380);

  /* ── FOOTER ── */
  const footerY = H - 34;
  ctx.fillStyle = "rgba(0,0,0,.75)"; ctx.fillRect(0, footerY, W, 34);
  ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = hc.s; ctx.fillRect(0, footerY, W, 2); ctx.restore();
  ft(ctx, "دوري عُمانتل للمحترفين  •  Omantel League", cx, footerY + 17, 10, "rgba(255,255,255,.32)", "400");
}
