/* ─── Canvas Drawing Utilities v3 — Premium Editorial Design ─── */

/* Text helper */
export function ft(ctx, text, x, y, size, color = "#fff", weight = "900", align = "center", mw) {
  ctx.font         = `${weight} ${size}px 'Cairo', sans-serif`;
  ctx.fillStyle    = color;
  ctx.textAlign    = align;
  ctx.textBaseline = "middle";
  mw ? ctx.fillText(text, x, y, mw) : ctx.fillText(text, x, y);
}

/* Subtle diagonal texture */
function diagTexture(ctx, W, H, alpha = 0.022) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth   = 1;
  for (let i = -H; i < W + H; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();
}

/* Hex grid texture (MOTM only) */
export function hexGrid(ctx, col, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = col;
  ctx.lineWidth   = 1;
  for (let r = -1; r < Math.ceil(H / 100) + 1; r++) {
    for (let c = -1; c < Math.ceil(W / 56) + 1; c++) {
      const ox = c * 56, oy = r * 100;
      ctx.beginPath();
      [[28,2],[54,16],[54,44],[28,58],[2,44],[2,16]].forEach(([px, py], i) =>
        i === 0 ? ctx.moveTo(ox+px, oy+py) : ctx.lineTo(ox+px, oy+py));
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* Background image — fills topFrac of canvas height */
export function drawUImg(ctx, uImg, op, sc, W, H, topFrac = 0.52) {
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

/* Linear gradient dark overlay */
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

function parseScore(score) {
  const parts = (score || "0 - 0").split(/\s*[-–:]\s*/);
  return [parts[0]?.trim() || "0", parts[1]?.trim() || "0"];
}

/* Gradient accent divider line */
function accentLine(ctx, W, y, hc, ac) {
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0,    "rgba(0,0,0,0)");
  g.addColorStop(0.08, hc.s);
  g.addColorStop(0.50, "rgba(255,255,255,.28)");
  g.addColorStop(0.92, ac.s);
  g.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.save();
  ctx.strokeStyle = g;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(24, y);
  ctx.lineTo(W - 24, y);
  ctx.stroke();
  ctx.restore();
}

/* Club logo circle with glow */
function logoCircle(ctx, x, y, r, club) {
  ctx.save();
  ctx.shadowColor = club.s;
  ctx.shadowBlur  = 18;
  circle(ctx, x, y, r, club.p, club.s, 2.5);
  ctx.restore();
  ft(ctx, club.b, x, y, Math.round(r * 0.74));
}

/* Premium footer — shared across all templates */
function drawFooter(ctx, W, H, hc, ac) {
  const fH = 46;
  const fY = H - fH;

  ctx.fillStyle = "rgba(0,0,0,.85)";
  ctx.fillRect(0, fY, W, fH);

  /* Club-color accent line at footer top */
  const lg = ctx.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0,    hc.p);
  lg.addColorStop(0.28, hc.s);
  lg.addColorStop(0.72, ac.s);
  lg.addColorStop(1,    ac.p);
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle   = lg;
  ctx.fillRect(0, fY, W, 2.5);
  ctx.restore();

  /* Small Oman flag logo left */
  ft(ctx, "🇴🇲", 22, fY + 23, 14, "#fff", "400");

  /* League name */
  ft(ctx, "دوري عُمانتل للمحترفين", W / 2, fY + 16, 10.5, "rgba(255,255,255,.58)", "700");
  /* Social / hashtag */
  ft(ctx, "#OmantelLeague  •  omantelleague.om", W / 2, fY + 33, 8, "rgba(255,255,255,.22)", "400");
}

/* ═══════════════════════════════════════════════════════════════
   MATCH DAY
   Image: top 52 % visible, fades to dark below 43 %
   Logo row: 64 % of H (portrait) / 52 % (square)
═══════════════════════════════════════════════════════════════ */
export function drawMatchDay(ctx, S, hc, ac, uImg, W = 540, H = 675) {
  const cx         = W / 2;
  const isPortrait = H > W;

  /* ── Base background ── */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0,    hc.p);
  bg.addColorStop(0.48, "#04040e");
  bg.addColorStop(1,    ac.p);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  diagTexture(ctx, W, H);

  /* ── Hero image — top 52 % ── */
  drawUImg(ctx, uImg, S.op, S.sc, W, H, 0.52);

  /* ── Gradient overlay: image bright in top 40 %, dark below 55 % ── */
  darkOverlay(ctx, W, H, [
    [0,    0.02],
    [0.28, 0.06],
    [0.40, 0.28],
    [0.52, 0.68],
    [0.66, 0.88],
    [1,    0.97],
  ]);

  /* ── TOP BAR ── */
  ft(ctx, S.date || "", 18, 24, 10.5, "rgba(255,255,255,.78)", "600", "left");
  roundRect(ctx, W - 162, 11, 150, 27, 13, "rgba(0,0,0,.62)", "rgba(255,255,255,.18)");
  ft(ctx, "🇴🇲  دوري عُمانتل", W - 87, 24.5, 10, "#facc15", "700");

  /* ── COMPETITION LABEL — centered pill ── */
  roundRect(ctx, cx - 102, 47, 204, 31, 15, "#facc15");
  ft(ctx, "يوم المباراة", cx, 62.5, 15, "#000", "900");

  /* ── LOGOS + VS ── */
  const logoR = Math.round(W * 0.092);                          // ~50 px
  const logoY = Math.round(H * (isPortrait ? 0.638 : 0.518));  // portrait: ~431, square: ~280
  const homeX = Math.round(W * 0.195);                         // ~105
  const awayX = Math.round(W * 0.805);                         // ~435

  logoCircle(ctx, homeX, logoY, logoR, hc);
  logoCircle(ctx, awayX, logoY, logoR, ac);

  /* VS ghost behind logos */
  ft(ctx, "VS", cx, logoY - 4, Math.round(logoR * 1.22), "rgba(255,255,255,.05)", "900");

  /* ── TIME PILL ── */
  const timeY = logoY + logoR + 20;
  roundRect(ctx, cx - 74, timeY - 14, 148, 29, 14,
    "rgba(250,204,21,.12)", "rgba(250,204,21,.38)");
  ft(ctx, S.time, cx, timeY, 17, "#facc15", "800");

  /* ── TEAM NAMES ── */
  const nameY = timeY + 28;
  ft(ctx, hc.n, homeX, nameY,      14.5, "#fff",                  "900", "center", 148);
  ft(ctx, hc.e, homeX, nameY + 20,  8.5, "rgba(255,255,255,.32)", "400");
  ft(ctx, ac.n, awayX, nameY,      14.5, "#fff",                  "900", "center", 148);
  ft(ctx, ac.e, awayX, nameY + 20,  8.5, "rgba(255,255,255,.32)", "400");

  /* ── ACCENT DIVIDER ── */
  const divY = nameY + 36;
  accentLine(ctx, W, divY, hc, ac);

  /* ── BOTTOM INFO ROW (round + venue) ── */
  const rowY = divY + 18;
  roundRect(ctx, cx - 72, rowY - 12, 144, 25, 12,
    "rgba(255,255,255,.06)", "rgba(255,255,255,.16)");
  ft(ctx, S.round,   cx, rowY,      12.5, "rgba(255,255,255,.75)", "700");
  ft(ctx, S.stadium, cx, rowY + 24, 11.5, "rgba(255,255,255,.42)", "400", "center", 370);

  drawFooter(ctx, W, H, hc, ac);
}

/* ═══════════════════════════════════════════════════════════════
   FINAL SCORE
   Layout: status badge → score + logos on same row → names →
           scorers box → venue → footer
═══════════════════════════════════════════════════════════════ */
export function drawFinalScore(ctx, S, hc, ac, uImg, W = 540, H = 675) {
  const cx         = W / 2;
  const isPortrait = H > W;

  /* ── Base background ── */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0,    hc.p);
  bg.addColorStop(0.44, "#04040e");
  bg.addColorStop(1,    ac.p);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  diagTexture(ctx, W, H, 0.028);

  /* ── Hero image — top 50 % ── */
  drawUImg(ctx, uImg, S.op, S.sc, W, H, 0.50);

  darkOverlay(ctx, W, H, [
    [0,    0.02],
    [0.24, 0.05],
    [0.38, 0.30],
    [0.50, 0.70],
    [0.66, 0.90],
    [1,    0.97],
  ]);

  /* ── TOP BAR ── */
  ft(ctx, S.round || "", 18, 24, 10.5, "rgba(255,255,255,.60)", "600", "left");
  roundRect(ctx, cx - 90, 11, 180, 27, 13, "rgba(255,255,255,.07)", "rgba(255,255,255,.18)");
  ft(ctx, "النتيجة النهائية", cx, 24.5, 11.5, "#fde047", "700");
  ft(ctx, S.date || "", W - 18, 24, 10.5, "rgba(255,255,255,.50)", "400", "right");

  /* ── STATUS BADGE ── */
  const statusY   = Math.round(H * (isPortrait ? 0.456 : 0.375));
  roundRect(ctx, cx - 80, statusY - 14, 160, 28, 14, "#facc15");
  ft(ctx, S.status || "FULL TIME", cx, statusY, 12, "#000", "900");

  /* ── SCORE + LOGOS ROW ── */
  const scoreRowY = statusY + 48;
  const logoR     = Math.round(W * 0.086);   // ~46 px
  const homeX     = Math.round(W * 0.18);
  const awayX     = Math.round(W * 0.82);

  logoCircle(ctx, homeX, scoreRowY, logoR, hc);
  logoCircle(ctx, awayX, scoreRowY, logoR, ac);

  /* Large score digits flanked by logos */
  const [hs, as]  = parseScore(S.score);
  const scoreSize = Math.round(W * 0.148);   // ~80 px
  ft(ctx, hs, cx - 52, scoreRowY + 6, scoreSize, "#fff", "900");
  ft(ctx, "–", cx,     scoreRowY - 2, Math.round(scoreSize * 0.38), "rgba(255,255,255,.22)", "300");
  ft(ctx, as, cx + 52, scoreRowY + 6, scoreSize, "#fff", "900");

  /* ── TEAM NAMES below logos ── */
  const nameY = scoreRowY + logoR + 18;
  ft(ctx, hc.n, homeX, nameY,      14, "#fff",                  "900", "center", 146);
  ft(ctx, hc.e, homeX, nameY + 19,  8.5, "rgba(255,255,255,.32)", "400");
  ft(ctx, ac.n, awayX, nameY,      14, "#fff",                  "900", "center", 146);
  ft(ctx, ac.e, awayX, nameY + 19,  8.5, "rgba(255,255,255,.32)", "400");

  /* ── SCORERS BOX ── */
  const scorersY = nameY + (isPortrait ? 42 : 32);
  const scorersH = Math.round(H * (isPortrait ? 0.117 : 0.110));
  roundRect(ctx, 32, scorersY, W - 64, scorersH, 16,
    "rgba(255,255,255,.055)", "rgba(255,255,255,.14)");

  ft(ctx, "⚽  الهدافون", cx, scorersY + 16, 10.5, "rgba(255,255,255,.36)", "400");

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.07)";
  ctx.lineWidth   = 0.8;
  ctx.beginPath();
  ctx.moveTo(52, scorersY + 30);
  ctx.lineTo(W - 52, scorersY + 30);
  ctx.stroke();
  ctx.restore();

  ft(ctx, S.scorers || "—", cx, scorersY + 48, 12, "#fff", "700", "center", 374);

  /* ── VENUE + ACCENT LINES ── */
  const venueY = scorersY + scorersH + 18;
  ft(ctx, S.stadium, cx, venueY, 11, "rgba(255,255,255,.40)", "400", "center", 366);

  const lineY = venueY + 22;
  ctx.save();
  ctx.lineWidth   = 2.5;
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = hc.s;
  ctx.beginPath(); ctx.moveTo(28, lineY); ctx.lineTo(cx - 22, lineY); ctx.stroke();
  ctx.strokeStyle = ac.s;
  ctx.beginPath(); ctx.moveTo(cx + 22, lineY); ctx.lineTo(W - 28, lineY); ctx.stroke();
  ctx.restore();

  drawFooter(ctx, W, H, hc, ac);
}

/* ═══════════════════════════════════════════════════════════════
   MAN OF THE MATCH
═══════════════════════════════════════════════════════════════ */
export function drawMOTM(ctx, S, hc, ac, uImg, W = 540, H = 675) {
  const cx         = W / 2;
  const isPortrait = H > W;

  /* ── Background ── */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0,   hc.p);
  bg.addColorStop(0.5, "#05050f");
  bg.addColorStop(1,   "#020208");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  hexGrid(ctx, hc.s, W, H);

  /* ── Player image — upper 62 % ── */
  drawUImg(ctx, uImg, S.op, S.sc, W, H, 0.62);

  darkOverlay(ctx, W, H, [
    [0,    0.00],
    [0.25, 0.05],
    [0.44, 0.52],
    [0.62, 0.86],
    [1,    0.97],
  ]);

  /* ── HEADER ── */
  ctx.save();
  ctx.strokeStyle = hc.s;
  ctx.lineWidth   = 3;
  ctx.globalAlpha = 0.72;
  ctx.beginPath(); ctx.moveTo(56, 46); ctx.lineTo(W - 56, 46); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(56, 76); ctx.lineTo(W - 56, 76); ctx.stroke();
  ctx.restore();
  ft(ctx, "رجل المباراة",        cx, 61, 19, hc.s, "900");
  ft(ctx, "PLAYER OF THE MATCH", cx, 88,  8.5, "rgba(255,255,255,.24)", "400");
  ft(ctx, S.date || "", W - 16, 24, 10, "rgba(255,255,255,.45)", "400", "right");

  /* ── MAIN CARD ── */
  const cardY = Math.round(H * (isPortrait ? 0.600 : 0.570));
  const cardH = Math.round(H * (isPortrait ? 0.293 : 0.308));
  roundRect(ctx, 24, cardY, W - 48, cardH, 22,
    "rgba(4,4,16,.90)", "rgba(255,255,255,.13)");

  /* Score block (left side of card) */
  const [hs, as] = parseScore(S.score);
  ft(ctx, `${hs}–${as}`,   80, cardY + 52, 50, "#facc15", "900", "center");
  ft(ctx, "النتيجة",       80, cardY + 88,  9, "rgba(255,255,255,.30)", "400", "center");

  /* Vertical divider */
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth   = 0.8;
  ctx.beginPath(); ctx.moveTo(128, cardY + 22); ctx.lineTo(128, cardY + 112); ctx.stroke();
  ctx.restore();

  /* Player name (right side of card) */
  ft(ctx, "اللاعب",                  W - 44, cardY + 30,  9, "rgba(255,255,255,.35)", "400", "right");
  ft(ctx, S.motm || "اسم اللاعب",   W - 44, cardY + 62, 27, "#fff", "900", "right", 265);

  /* Club + round row */
  circle(ctx, 48, cardY + 132, 13, hc.p, hc.s, 1.5);
  ft(ctx, hc.b, 48, cardY + 132, 11, "#fff", "400");
  ft(ctx, hc.n, 68, cardY + 132, 11.5, "rgba(255,255,255,.55)", "600", "left");
  ft(ctx, S.round, W - 44, cardY + 132, 11, "rgba(255,255,255,.38)", "400", "right");

  /* Divider + stadium */
  const divY = cardY + cardH - 34;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.07)";
  ctx.lineWidth   = 0.8;
  ctx.beginPath(); ctx.moveTo(44, divY); ctx.lineTo(W - 44, divY); ctx.stroke();
  ctx.restore();
  ft(ctx, S.stadium, cx, cardY + cardH - 17, 10.5, "rgba(255,255,255,.32)", "400", "center", 380);

  drawFooter(ctx, W, H, hc, ac);
}
