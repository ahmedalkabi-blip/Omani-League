/* ─── Canvas Drawing Utilities v4 ────────────────────────────────────────
 *
 * Portrait export: 1080 × 1350.  Internal canvas: 540 × 675 (÷2).
 * All spec values below are in INTERNAL portrait coords (= export ÷ 2).
 *
 * Zone map (internal, portrait H = 675):
 *   Hero area    y = 0   – 310   (export 0   – 620)
 *   Match zone   y = 310 – 565   (export 620 – 1130)
 *   Footer zone  y = 565 – 675   (export 1130 – 1350)
 *
 * P(n, H)  →  scales a portrait-internal value to current H.
 * ─────────────────────────────────────────────────────────────────────── */

/* Scale a portrait-internal pixel value to the current canvas height */
function P(n, H) { return Math.round(n * H / 675); }

/* ── Typography helper ─────────────────────────────────────────────────── */
export function ft(ctx, text, x, y, size, color = "#fff", weight = "900", align = "center", mw) {
  ctx.font         = `${weight} ${size}px 'Cairo', sans-serif`;
  ctx.fillStyle    = color;
  ctx.textAlign    = align;
  ctx.textBaseline = "middle";
  mw ? ctx.fillText(text, x, y, mw) : ctx.fillText(text, x, y);
}

/* ── Hex grid (MOTM background texture) ───────────────────────────────── */
export function hexGrid(ctx, col, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.055;
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

/* ── Diagonal line texture ─────────────────────────────────────────────── */
function diagTexture(ctx, W, H, alpha = 0.018) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth   = 0.8;
  for (let i = -H; i < W + H; i += 26) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();
}

/* ── Hero image: cover-fills heroH, clipped, no blur ─────────────────── */
export function drawUImg(ctx, uImg, op, sc, W, H, topFrac) {
  // topFrac kept for API compat; heroH derived from it when called externally
  if (!uImg) return;
  const heroH = topFrac !== undefined ? Math.round(H * topFrac) : H;
  _drawHero(ctx, uImg, op, sc, W, heroH);
}

function _drawHero(ctx, uImg, op, sc, W, heroH) {
  if (!uImg) return;
  const scale = sc / 100;
  const f     = Math.max(W / uImg.naturalWidth, heroH / uImg.naturalHeight) * scale;
  const dw    = uImg.naturalWidth  * f;
  const dh    = uImg.naturalHeight * f;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, heroH);           // clip to hero zone — no overflow
  ctx.clip();
  ctx.globalAlpha = op / 100;
  ctx.drawImage(uImg, (W - dw) / 2, (heroH - dh) / 2, dw, dh);
  ctx.restore();
}

/* ── Dark gradient overlay ─────────────────────────────────────────────── */
function overlay(ctx, W, H, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  stops.forEach(([p, a]) => g.addColorStop(p, `rgba(0,0,0,${a})`));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/* ── Primitives ────────────────────────────────────────────────────────── */
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

function line(ctx, x1, y1, x2, y2, color, lw = 0.8) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}

function parseScore(score) {
  const parts = (score || "0 - 0").split(/\s*[-–:]\s*/);
  return [parts[0]?.trim() || "0", parts[1]?.trim() || "0"];
}

/* ── Club logo circle with soft glow ──────────────────────────────────── */
function logoCircle(ctx, x, y, r, club) {
  ctx.save();
  ctx.shadowColor = club.s;
  ctx.shadowBlur  = Math.round(r * 0.55);
  circle(ctx, x, y, r, club.p, club.s, Math.max(2, r * 0.055));
  ctx.restore();
  ft(ctx, club.b, x, y, Math.round(r * 0.76));
}

/* ── Gradient accent divider ───────────────────────────────────────────── */
function accentDivider(ctx, W, y, hc, ac, lw = 1.5) {
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0,    "rgba(0,0,0,0)");
  g.addColorStop(0.06, hc.s);
  g.addColorStop(0.50, "rgba(255,255,255,.30)");
  g.addColorStop(0.94, ac.s);
  g.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.save();
  ctx.strokeStyle = g;
  ctx.lineWidth   = lw;
  ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(W - 20, y); ctx.stroke();
  ctx.restore();
}

/* ── Top bar: date left, league badge right ────────────────────────────── */
function drawTopBar(ctx, W, S) {
  ft(ctx, S.date || "", 18, 24, 10.5, "rgba(255,255,255,.82)", "600", "left");
  roundRect(ctx, W - 164, 10, 152, 27, 13, "rgba(0,0,0,.65)", "rgba(255,255,255,.18)");
  ft(ctx, "🇴🇲  دوري عُمانتل", W - 88, 23.5, 10, "#facc15", "700");
}

/* ── Shared premium footer ─────────────────────────────────────────────── */
function drawFooter(ctx, W, H, hc, ac) {
  const fY = P(565, H);
  const fH = H - fY;
  const cx = W / 2;

  /* Dark background */
  ctx.fillStyle = "rgba(0,0,0,.90)";
  ctx.fillRect(0, fY, W, fH);

  /* Club-color gradient line at top of footer */
  const cg = ctx.createLinearGradient(0, 0, W, 0);
  cg.addColorStop(0,    hc.p);
  cg.addColorStop(0.25, hc.s);
  cg.addColorStop(0.75, ac.s);
  cg.addColorStop(1,    ac.p);
  ctx.save(); ctx.globalAlpha = 0.92; ctx.fillStyle = cg;
  ctx.fillRect(0, fY, W, 2.5);
  ctx.restore();

  /* Thin secondary divider at 1160 export = 580 internal */
  const divY = P(580, H);
  line(ctx, 28, divY, W - 28, divY, "rgba(255,255,255,.07)");

  /* Oman flag mark — bottom left */
  ft(ctx, "🇴🇲", 22, fY + Math.round(fH * 0.46), 13, "#fff", "400");

  /* League name Arabic — center */
  ft(ctx, "دوري عُمانتل للمحترفين", cx, fY + Math.round(fH * 0.33), 10.5, "rgba(255,255,255,.62)", "700");

  /* League name English — center */
  ft(ctx, "OMANTEL PROFESSIONAL LEAGUE", cx, fY + Math.round(fH * 0.52), 7, "rgba(255,255,255,.28)", "400");

  /* Website / handle */
  ft(ctx, "@OmantelLeague  •  omantelleague.om", cx, fY + Math.round(fH * 0.72), 8, "rgba(255,255,255,.22)", "400");
}

/* ═══════════════════════════════════════════════════════════════════════
   MATCH DAY
   ─────────────────────────────────────────────────────────────────────
   Spec (export px → internal px for portrait H=675):
     Hero image:   0 – 620   →  0 – 310
     Logo center:  y = 760   →  y = 380    (below hero zone)
     Logo radius:  85        →  43
     Home logo:    x = 270   →  x = 135
     Away logo:    x = 810   →  x = 405
     VS:           x = 540, y = 760  →  x = 270, y = 380
     Time pill:    y = 865   →  y = 433
     Arabic names: y = 910   →  y = 455    font 46 → 23
     English names:y = 955   →  y = 478    font 20 → 10
     Round/venue:  y = 1040  →  y = 520
═══════════════════════════════════════════════════════════════════════ */
export function drawMatchDay(ctx, S, hc, ac, uImg, W = 540, H = 675) {
  const cx = W / 2;

  /* ── 1. Base background ── */
  ctx.fillStyle = "#04040e";
  ctx.fillRect(0, 0, W, H);

  /* Club-color atmospheric vignettes in lower area */
  const hv = ctx.createRadialGradient(0, H, 0, 0, H, W * 0.9);
  hv.addColorStop(0, hc.p + "66"); hv.addColorStop(1, "transparent");
  ctx.fillStyle = hv; ctx.fillRect(0, 0, W, H);

  const av = ctx.createRadialGradient(W, H, 0, W, H, W * 0.9);
  av.addColorStop(0, ac.p + "66"); av.addColorStop(1, "transparent");
  ctx.fillStyle = av; ctx.fillRect(0, 0, W, H);

  diagTexture(ctx, W, H);

  /* ── 2. Hero image — covers top heroH pixels, clipped ── */
  const heroH = P(310, H);
  _drawHero(ctx, uImg, S.op, S.sc, W, heroH);

  /* ── 3. Gradient overlay
         Top of hero: 12% dark (image clearly visible)
         Bottom of hero: 88% dark (fades into match zone)
         Match zone: ~96% dark  ── */
  const heroFrac  = heroH / H;
  overlay(ctx, W, H, [
    [0,              0.12],
    [heroFrac * 0.4, 0.20],
    [heroFrac * 0.8, 0.72],
    [heroFrac,       0.88],
    [1,              0.97],
  ]);

  /* ── 4. TOP BAR ── */
  drawTopBar(ctx, W, S);

  /* ── 5. POST TYPE LABEL (near bottom of hero zone) ── */
  const labelY = P(258, H);   // export: 516 — sits just above match zone
  roundRect(ctx, cx - 96, labelY - 14, 192, 28, 14, "#facc15");
  ft(ctx, "يوم المباراة", cx, labelY, 14, "#000", "900");

  /* ── 6. LOGOS + VS ── */
  const logoY = P(380, H);    // export: 760
  const logoR = P(43,  H);    // export: 85px radius (170px diameter)
  const homeX = Math.round(W * 0.25);   // 135  (export: 270)
  const awayX = Math.round(W * 0.75);   // 405  (export: 810)

  logoCircle(ctx, homeX, logoY, logoR, hc);
  logoCircle(ctx, awayX, logoY, logoR, ac);

  /* VS — large, semi-visible, sits center between logos */
  ft(ctx, "VS", cx, logoY, P(44, H), "rgba(255,255,255,.38)", "900");

  /* ── 7. TIME PILL ── */
  const timeY  = P(433, H);   // export: 865
  const pillW  = P(148, H);
  const pillH  = P(29, H);
  roundRect(ctx, cx - pillW / 2, timeY - pillH / 2, pillW, pillH, P(14, H),
    "rgba(250,204,21,.14)", "rgba(250,204,21,.40)");
  ft(ctx, S.time, cx, timeY, P(17, H), "#facc15", "800");

  /* ── 8. ARABIC TEAM NAMES ── */
  const arNameY = P(455, H);  // export: 910
  const arFont  = P(23,  H);  // export: 46
  const arMaxW  = Math.round(W * 0.35);
  ft(ctx, hc.n, homeX, arNameY, arFont, "#fff",                  "900", "center", arMaxW);
  ft(ctx, ac.n, awayX, arNameY, arFont, "#fff",                  "900", "center", arMaxW);

  /* ── 9. ENGLISH TEAM NAMES ── */
  const enNameY = P(476, H);  // export: 952
  const enFont  = P(10,  H);  // export: 20
  ft(ctx, hc.e, homeX, enNameY, enFont, "rgba(255,255,255,.36)", "400");
  ft(ctx, ac.e, awayX, enNameY, enFont, "rgba(255,255,255,.36)", "400");

  /* ── 10. ACCENT DIVIDER ── */
  const divY = P(496, H);     // export: 992
  accentDivider(ctx, W, divY, hc, ac);

  /* ── 11. ROUND + VENUE INFO ROW ── */
  const infoY  = P(516, H);   // export: 1032
  const venueY = P(538, H);   // export: 1076

  /* Round pill */
  const rpW = P(144, H);
  roundRect(ctx, cx - rpW / 2, infoY - P(13, H), rpW, P(26, H), P(13, H),
    "rgba(255,255,255,.06)", "rgba(255,255,255,.18)");
  ft(ctx, S.round, cx, infoY, P(12, H), "rgba(255,255,255,.80)", "700");

  /* Venue */
  ft(ctx, S.stadium, cx, venueY, P(11, H), "rgba(255,255,255,.46)", "400", "center", Math.round(W * 0.82));

  /* ── 12. FOOTER ── */
  drawFooter(ctx, W, H, hc, ac);
}

/* ═══════════════════════════════════════════════════════════════════════
   FINAL SCORE — Cinematic editorial poster
   ─────────────────────────────────────────────────────────────────────
   All positions given in EXPORT px (1080×1350). Internal = export ÷ 2.
   P(n,H) scales any portrait-internal value to current canvas height.

   Exact coordinate map (export → internal portrait H=675):
     "النتيجة النهائية" badge  y=150   → P(75,H)
     S.status text             y=578   → P(289,H)
     Logos center              y=680   → P(340,H)  r=38 (export r=76)
     Score                     y=690   → P(345,H)  font=P(60,H)=120px
     Accent line               y=770   → P(385,H)
     Arabic team names         y=930   → P(465,H)  ← key: clearly lower
     English team names        y=964   → P(482,H)
     Scorers box               y=1000–1100 → P(500,H)–P(550,H)
     Match info row            y=1116  → P(558,H)
     Footer divider            y=1180  → P(590,H)
     Footer content            y=1256  → P(628,H)
═══════════════════════════════════════════════════════════════════════ */
export function drawFinalScore(ctx, S, hc, ac, uImg, W = 540, H = 675) {
  const cx = W / 2;

  /* ── 1. DARK BASE ── */
  ctx.fillStyle = "#05050d";
  ctx.fillRect(0, 0, W, H);

  /* ── 2. BACKGROUND IMAGE — full canvas, cover fit ──
        Image covers the entire canvas. The cinematic gradient below
        provides all darkening — no clip, no sub-zone restriction.  */
  if (uImg) {
    const scale = S.sc / 100;
    const f     = Math.max(W / uImg.naturalWidth, H / uImg.naturalHeight) * scale;
    const dw    = uImg.naturalWidth  * f;
    const dh    = uImg.naturalHeight * f;
    ctx.save();
    ctx.globalAlpha = S.op / 100;
    ctx.drawImage(uImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();
  }

  /* ── 3. CINEMATIC GRADIENT — barely dark at top, near-black at bottom ──
        Reference look: photo clearly visible in the upper half,
        deep editorial black consuming the lower third.              */
  const cineG = ctx.createLinearGradient(0, 0, 0, H);
  cineG.addColorStop(0.00, "rgba(0,0,0,.14)");
  cineG.addColorStop(0.18, "rgba(0,0,0,.22)");
  cineG.addColorStop(0.38, "rgba(0,0,0,.50)");
  cineG.addColorStop(0.56, "rgba(0,0,0,.74)");
  cineG.addColorStop(0.72, "rgba(0,0,0,.88)");
  cineG.addColorStop(0.86, "rgba(0,0,0,.94)");
  cineG.addColorStop(1.00, "rgba(0,0,0,.97)");
  ctx.fillStyle = cineG;
  ctx.fillRect(0, 0, W, H);

  /* ── 4. HEADER — date left, round right, badge center ──
        Export y=80 → P(40,H);  badge y=150 → P(75,H)             */
  ft(ctx, S.date  || "", 18,      P(40, H), P(10, H), "rgba(255,255,255,.72)", "600", "left");
  ft(ctx, S.round || "", W - 18,  P(40, H), P(10, H), "rgba(255,255,255,.50)", "600", "right");

  const badgeY = P(75, H);
  roundRect(ctx, cx - P(88, H), badgeY - P(12, H), P(176, H), P(25, H), P(12, H), "#facc15");
  ft(ctx, "النتيجة النهائية", cx, badgeY, P(11, H), "#000", "900");

  /* ── 5. STATUS TEXT — slim label above score ──
        Export y=578 → P(289,H)                                    */
  ft(ctx, S.status || "FULL TIME", cx, P(289, H), P(9, H),
    "rgba(255,255,255,.45)", "400");

  /* ── 6. SCORE BLOCK — dominant visual center ──
        Logos: homeX=130 (exp 260), awayX=410 (exp 820)
               logoY=P(340,H) (exp 680), logoR=P(38,H) (exp 76)
        Score: cx, scoreY=P(345,H) (exp 690), font=P(60,H) (exp 120) */
  const logoY = P(340, H);
  const logoR = P(38,  H);
  const homeX = 130;
  const awayX = 410;

  ctx.save();
  ctx.shadowColor = hc.s;
  ctx.shadowBlur  = P(24, H);
  circle(ctx, homeX, logoY, logoR, hc.p, hc.s, Math.max(2, P(2, H)));
  ctx.restore();
  ft(ctx, hc.b, homeX, logoY, Math.round(logoR * 0.78));

  ctx.save();
  ctx.shadowColor = ac.s;
  ctx.shadowBlur  = P(24, H);
  circle(ctx, awayX, logoY, logoR, ac.p, ac.s, Math.max(2, P(2, H)));
  ctx.restore();
  ft(ctx, ac.b, awayX, logoY, Math.round(logoR * 0.78));

  const [hs, as]  = parseScore(S.score);
  const scoreY    = P(345, H);
  const scoreFont = P(60,  H);
  const scoreOff  = P(52,  H);
  ft(ctx, hs, cx - scoreOff, scoreY, scoreFont, "#ffffff", "900");
  ft(ctx, "–", cx,           scoreY - P(3, H), P(22, H), "#facc15", "300");
  ft(ctx, as, cx + scoreOff, scoreY, scoreFont, "#ffffff", "900");

  /* ── 7. ACCENT LINE — separates score from team info ──
        Export y=770 → P(385,H)                                    */
  accentDivider(ctx, W, P(385, H), hc, ac, 1.2);

  /* ── 8. ARABIC TEAM NAMES — clearly in the lower section ──
        Export y=930 → P(465,H).
        Key correction: names must be low, not near the middle.     */
  const arNameY = P(465, H);
  const arFont  = P(22,  H);
  const arMaxW  = Math.round(W * 0.32);
  ft(ctx, hc.n, homeX, arNameY, arFont, "#ffffff", "900", "center", arMaxW);
  ft(ctx, ac.n, awayX, arNameY, arFont, "#ffffff", "900", "center", arMaxW);

  /* ── 9. ENGLISH TEAM NAMES ──
        Export y=964 → P(482,H)                                    */
  const enNameY = P(482, H);
  const enFont  = P(9,   H);
  ft(ctx, hc.e, homeX, enNameY, enFont, "rgba(255,255,255,.36)", "400");
  ft(ctx, ac.e, awayX, enNameY, enFont, "rgba(255,255,255,.36)", "400");

  /* ── 10. SCORERS ROW — subtle transparent box ──
        Export y=1000–1100 → P(500,H)–P(550,H)                    */
  const scorersY = P(500, H);
  const scorersH = P(50,  H);
  const scorersW = P(400, H);
  roundRect(ctx, cx - scorersW / 2, scorersY, scorersW, scorersH, P(10, H),
    "rgba(0,0,0,.50)", "rgba(255,255,255,.10)");

  ft(ctx, "الهدافون", cx, scorersY + P(13, H), P(8.5, H),
    "rgba(255,255,255,.35)", "600");
  line(ctx,
    cx - scorersW / 2 + P(14, H), scorersY + P(25, H),
    cx + scorersW / 2 - P(14, H), scorersY + P(25, H),
    "rgba(255,255,255,.07)");
  ft(ctx, S.scorers || "—", cx, scorersY + P(39, H), P(10, H),
    "#ffffff", "700", "center", scorersW - P(22, H));

  /* ── 11. MATCH INFO — venue + round on one clean line ──
        Export y=1116 → P(558,H)                                   */
  const infoY = P(558, H);
  ft(ctx, S.stadium || "", cx, infoY, P(10, H),
    "rgba(255,255,255,.48)", "400", "center", Math.round(W * 0.72));
  ft(ctx, S.round   || "", cx, infoY + P(17, H), P(8.5, H),
    "rgba(255,255,255,.26)", "400");

  /* ── 12. FOOTER — club-color bar + league branding ──
        Export y=1180 → P(590,H)                                   */
  const footerDivY = P(590, H);

  const cg = ctx.createLinearGradient(0, 0, W, 0);
  cg.addColorStop(0,    hc.p);
  cg.addColorStop(0.25, hc.s);
  cg.addColorStop(0.75, ac.s);
  cg.addColorStop(1,    ac.p);
  ctx.save(); ctx.globalAlpha = 0.75; ctx.fillStyle = cg;
  ctx.fillRect(0, footerDivY - 2, W, 2.5);
  ctx.restore();

  line(ctx, P(36, H), footerDivY, W - P(36, H), footerDivY,
    "rgba(255,255,255,.10)", 0.8);

  const fMid = P(628, H);
  ft(ctx, "🇴🇲", 22, fMid, P(13, H), "#fff", "400", "left");
  ft(ctx, "Oman League  •  @OmanLeague",  cx, fMid - P(8, H), P(10, H), "rgba(255,255,255,.58)", "700");
  ft(ctx, "دوري عُمانتل للمحترفين",        cx, fMid + P(9, H), P(10, H), "rgba(255,255,255,.32)", "600");
}

/* ═══════════════════════════════════════════════════════════════════════
   MAN OF THE MATCH
   Player image fills top 65 % (larger hero for portrait shots).
   Info card sits in lower match zone.
═══════════════════════════════════════════════════════════════════════ */
export function drawMOTM(ctx, S, hc, ac, uImg, W = 540, H = 675) {
  const cx = W / 2;

  /* ── 1. Base background ── */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0,   hc.p);
  bg.addColorStop(0.5, "#04040e");
  bg.addColorStop(1,   "#020208");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  hexGrid(ctx, hc.s, W, H);

  /* ── 2. Player image — taller hero for portrait shots ── */
  const heroH = P(360, H);        // export: 720 (65 % of 675*2=1350)
  _drawHero(ctx, uImg, S.op, S.sc, W, heroH);

  /* ── 3. Gradient overlay ── */
  const hf = heroH / H;
  overlay(ctx, W, H, [
    [0,        0.00],
    [hf * 0.3, 0.05],
    [hf * 0.7, 0.54],
    [hf,       0.88],
    [1,        0.97],
  ]);

  /* ── 4. HEADER ── */
  ctx.save();
  ctx.strokeStyle = hc.s; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(52, 46); ctx.lineTo(W - 52, 46); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(52, 76); ctx.lineTo(W - 52, 76); ctx.stroke();
  ctx.restore();
  ft(ctx, "رجل المباراة",        cx, 61, 19, hc.s, "900");
  ft(ctx, "PLAYER OF THE MATCH", cx, 88,  8.5, "rgba(255,255,255,.22)", "400");
  ft(ctx, S.date || "", W - 16, 24, 10, "rgba(255,255,255,.45)", "400", "right");

  /* ── 5. MAIN INFO CARD ── */
  const cardY = P(370, H);        // export: 740
  const cardH = P(175, H);        // export: 350
  roundRect(ctx, P(22, H), cardY, W - P(44, H), cardH, P(18, H),
    "rgba(3,3,16,.92)", "rgba(255,255,255,.14)");

  /* Score block — left side of card */
  const [hs, as] = parseScore(S.score);
  ft(ctx, `${hs} – ${as}`,  P(80, H), cardY + P(46, H), P(44, H), "#facc15", "900", "center");
  ft(ctx, "النتيجة",         P(80, H), cardY + P(78, H),  P(9, H), "rgba(255,255,255,.30)", "400", "center");

  /* Vertical divider */
  line(ctx, P(126, H), cardY + P(18, H), P(126, H), cardY + P(106, H), "rgba(255,255,255,.10)");

  /* Player name — right side of card */
  ft(ctx, "اللاعب",                 W - P(38, H), cardY + P(26, H),  P(9, H), "rgba(255,255,255,.35)", "400", "right");
  ft(ctx, S.motm || "اسم اللاعب",  W - P(38, H), cardY + P(60, H), P(25, H), "#fff",                  "900", "right", P(266, H));

  /* Club + round info row */
  circle(ctx, P(48, H), cardY + P(122, H), P(12, H), hc.p, hc.s, 1.5);
  ft(ctx, hc.b, P(48, H), cardY + P(122, H), P(10, H), "#fff", "400");
  ft(ctx, hc.n, P(66, H), cardY + P(122, H), P(11, H), "rgba(255,255,255,.55)", "600", "left");
  ft(ctx, S.round, W - P(36, H), cardY + P(122, H), P(10, H), "rgba(255,255,255,.38)", "400", "right");

  /* Divider + stadium at bottom of card */
  line(ctx, P(40, H), cardY + cardH - P(32, H), W - P(40, H), cardY + cardH - P(32, H), "rgba(255,255,255,.07)");
  ft(ctx, S.stadium, cx, cardY + cardH - P(16, H), P(10, H), "rgba(255,255,255,.32)", "400", "center", Math.round(W * 0.85));

  /* ── 6. FOOTER ── */
  drawFooter(ctx, W, H, hc, ac);
}
