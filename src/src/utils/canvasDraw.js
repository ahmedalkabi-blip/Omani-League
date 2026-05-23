/* ─── Canvas Drawing Utilities ─────────────────────────────────────── */

export function ft(ctx, text, x, y, size, color = "#fff", weight = "900", align = "center", mw) {
  ctx.font = `${weight} ${size}px 'Cairo', sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  mw ? ctx.fillText(text, x, y, mw) : ctx.fillText(text, x, y);
}

export function hexGrid(ctx, col) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = col;
  ctx.lineWidth = 1;
  for (let r = -1; r < 7; r++) {
    for (let c = -1; c < 11; c++) {
      const ox = c * 56, oy = r * 100;
      const pts = [[28,2],[54,16],[54,44],[28,58],[2,44],[2,16]];
      ctx.beginPath();
      pts.forEach(([px, py], i) => {
        i === 0 ? ctx.moveTo(ox + px, oy + py) : ctx.lineTo(ox + px, oy + py);
      });
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawUImg(ctx, uImg, op, sc, full = true) {
  if (!uImg) return;
  const W = 540, H = 540, scale = sc / 100;
  ctx.save();
  if (full) {
    const f = Math.max(W / uImg.naturalWidth, H / uImg.naturalHeight) * scale;
    const dw = uImg.naturalWidth * f, dh = uImg.naturalHeight * f;
    ctx.globalAlpha = op / 100;
    ctx.drawImage(uImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    const f = Math.max(W / uImg.naturalWidth, (H * 0.7) / uImg.naturalHeight) * scale;
    const dw = uImg.naturalWidth * f, dh = uImg.naturalHeight * f;
    ctx.globalAlpha = op / 100;
    ctx.drawImage(uImg, (W - dw) / 2, H * 0.3 - dh * 0.05, dw, dh);
  }
  ctx.restore();
}

export function overlay(ctx, a, b, c, d) {
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0,   `rgba(0,0,0,${a})`);
  g.addColorStop(0.5, `rgba(0,0,0,${b})`);
  g.addColorStop(0.8, `rgba(0,0,0,${c})`);
  g.addColorStop(1,   `rgba(0,0,0,${d})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 540, 540);
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

/* ─── Match Day ─────────────────────────────────────────────────────── */
export function drawMatchDay(ctx, S, hc, ac, uImg) {
  const W = 540;
  const g = ctx.createLinearGradient(0, 0, W, W);
  g.addColorStop(0, hc.p); g.addColorStop(0.45, "#080812"); g.addColorStop(1, ac.p);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
  hexGrid(ctx, hc.s);
  drawUImg(ctx, uImg, S.op, S.sc, true);
  overlay(ctx, 0.25, 0.05, 0.1, 0.55);

  // League pill
  roundRect(ctx, 145, 18, 250, 28, 14, "rgba(255,255,255,.08)", "rgba(255,255,255,.18)", 0.9);
  ft(ctx, "دوري عُمانتل للمحترفين", 270, 32, 11, "rgba(255,255,255,.8)", "700");

  // Ribbon
  ctx.save();
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.moveTo(150, 58); ctx.lineTo(390, 58); ctx.lineTo(383, 83); ctx.lineTo(157, 83);
  ctx.closePath(); ctx.fill(); ctx.restore();
  ft(ctx, "يوم المباراة", 270, 70.5, 17, "#000", "900");

  // Home
  circle(ctx, 115, 200, 50, hc.p, hc.s);
  ft(ctx, hc.b, 115, 200, 36);
  ft(ctx, hc.n, 115, 268, 15, "#fff", "900", "center", 160);
  ft(ctx, hc.e, 115, 288, 8, "rgba(255,255,255,.4)", "400");

  // Away
  circle(ctx, 425, 200, 50, ac.p, ac.s);
  ft(ctx, ac.b, 425, 200, 36);
  ft(ctx, ac.n, 425, 268, 15, "#fff", "900", "center", 160);
  ft(ctx, ac.e, 425, 288, 8, "rgba(255,255,255,.4)", "400");

  // Centre
  ft(ctx, "VS", 270, 195, 46, "rgba(255,255,255,.12)", "900");
  ft(ctx, S.time, 270, 236, 15, "#facc15", "700");
  ft(ctx, S.stadium, 270, 260, 11, "rgba(255,255,255,.45)", "400", "center", 180);

  // Round pill
  roundRect(ctx, 190, 310, 160, 26, 13, "rgba(255,255,255,.06)", "rgba(255,255,255,.1)");
  ft(ctx, S.round, 270, 323, 12, "rgba(255,255,255,.55)", "600");

  // Bottom bar
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 500, W, 40);
  ft(ctx, "مباراة الجولة | Match of the Round", 270, 520, 10, "rgba(255,255,255,.35)", "400");
}

/* ─── Final Score ───────────────────────────────────────────────────── */
export function drawFinalScore(ctx, S, hc, ac, uImg) {
  const W = 540;
  const g = ctx.createLinearGradient(0, 0, W, W);
  g.addColorStop(0, hc.p); g.addColorStop(0.4, "#04040e"); g.addColorStop(1, ac.p);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);

  // Diagonal lines
  ctx.save(); ctx.globalAlpha = 0.04; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
  for (let i = -20; i < 30; i++) {
    ctx.beginPath(); ctx.moveTo(i * 20, 0); ctx.lineTo(i * 20 + 540, 540); ctx.stroke();
  }
  ctx.restore();

  drawUImg(ctx, uImg, S.op, S.sc, true);
  overlay(ctx, 0.2, 0.05, 0.05, 0.55);

  ft(ctx, "FULL TIME", 50, 30, 9, "rgba(255,255,255,.3)", "400", "left");
  roundRect(ctx, 170, 18, 200, 26, 13, "rgba(255,255,255,.08)", "rgba(255,255,255,.15)");
  ft(ctx, "النتيجة النهائية", 270, 31, 12, "#fde047", "700");
  ft(ctx, S.round, 490, 30, 9, "rgba(255,255,255,.3)", "400", "right");

  circle(ctx, 100, 185, 48, hc.p, hc.s);
  ft(ctx, hc.b, 100, 185, 32);
  ft(ctx, hc.n, 100, 250, 14, "#fff", "900", "center", 140);

  circle(ctx, 440, 185, 48, ac.p, ac.s);
  ft(ctx, ac.b, 440, 185, 32);
  ft(ctx, ac.n, 440, 250, 14, "#fff", "900", "center", 140);

  roundRect(ctx, 175, 148, 190, 88, 18, "rgba(255,255,255,.06)", "rgba(255,255,255,.15)");
  const [hs, as] = (S.score || "0-0").split("-").map(v => v.trim());
  ft(ctx, hs || "0", 224, 193, 60, "#fff", "900");
  ft(ctx, ":", 270, 193, 38, "rgba(255,255,255,.2)", "300");
  ft(ctx, as || "0", 316, 193, 60, "#fff", "900");

  roundRect(ctx, 55, 345, 430, 80, 14, "rgba(255,255,255,.05)", "rgba(255,255,255,.1)");
  ft(ctx, "⚽  الهدافون", 270, 365, 11, "rgba(255,255,255,.4)", "400");
  ft(ctx, S.scorers || "—", 270, 392, 13, "#fff", "700", "center", 380);
  ft(ctx, S.stadium, 270, 424, 11, "rgba(255,255,255,.35)", "400");

  ctx.save(); ctx.lineWidth = 3; ctx.globalAlpha = 0.6;
  ctx.strokeStyle = hc.s;
  ctx.beginPath(); ctx.moveTo(0, 480); ctx.lineTo(W * 0.48, 480); ctx.stroke();
  ctx.strokeStyle = ac.s;
  ctx.beginPath(); ctx.moveTo(W * 0.52, 480); ctx.lineTo(W, 480); ctx.stroke();
  ctx.restore();

  ft(ctx, "دوري عُمانتل للمحترفين", 270, 500, 10, "rgba(255,255,255,.3)", "400");
  ft(ctx, `${S.time} | ${S.stadium}`, 270, 520, 10, "rgba(255,255,255,.25)", "400");
}

/* ─── Man of the Match ──────────────────────────────────────────────── */
export function drawMOTM(ctx, S, hc, _ac, uImg) {
  const W = 540, H = 540;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, hc.p); g.addColorStop(0.55, "#080810"); g.addColorStop(1, "#030308");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  hexGrid(ctx, hc.s);
  drawUImg(ctx, uImg, S.op, S.sc, false);

  const gf = ctx.createLinearGradient(0, H * 0.35, 0, H);
  gf.addColorStop(0,    "rgba(0,0,0,0)");
  gf.addColorStop(0.45, "rgba(5,5,14,.65)");
  gf.addColorStop(1,    "rgba(3,3,12,.97)");
  ctx.fillStyle = gf; ctx.fillRect(0, 0, W, H);

  ctx.save(); ctx.strokeStyle = hc.s; ctx.lineWidth = 3.5; ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.moveTo(105, 52); ctx.lineTo(435, 52); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(105, 80); ctx.lineTo(435, 80); ctx.stroke();
  ctx.restore();
  ft(ctx, "رجل المباراة", 270, 66, 17, hc.s, "900");
  ft(ctx, "PLAYER OF THE MATCH", 270, 94, 9, "rgba(255,255,255,.28)", "400");

  roundRect(ctx, 44, 376, 452, 138, 18, "rgba(4,4,16,.82)", "rgba(255,255,255,.1)");
  ft(ctx, "اللاعب", 460, 398, 9, "rgba(255,255,255,.38)", "400", "right");
  ft(ctx, S.motm || "اسم اللاعب", 460, 424, 28, "#fff", "900", "right", 260);

  circle(ctx, 186, 450, 13, hc.p, hc.s, 1.5);
  ft(ctx, hc.b, 186, 450, 12);
  ft(ctx, hc.n, 210, 450, 12, "rgba(255,255,255,.5)", "600", "right");

  const [hs, as] = (S.score || "0-0").split("-").map(v => v.trim());
  ft(ctx, `${hs}–${as}`, 100, 424, 44, "#facc15", "900");
  ft(ctx, "النتيجة", 100, 455, 9, "rgba(255,255,255,.3)", "400");

  ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(64, 475); ctx.lineTo(476, 475); ctx.stroke();
  ctx.restore();

  ft(ctx, S.stadium, 460, 491, 10, "rgba(255,255,255,.3)", "400", "right");
  ft(ctx, "دوري عُمانتل", 100, 491, 10, "rgba(255,255,255,.3)", "400");
}
