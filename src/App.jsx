import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════════════════ */
const CLUBS = {
  seeb:    { ar:"السيب",    en:"AL-SEEB",    p:"#1a3a6e", s:"#c8a84b", e:"⚽" },
  dhofar:  { ar:"ظفار",    en:"DHOFAR",     p:"#005c2b", s:"#f5c800", e:"🦁" },
  nahda:   { ar:"النهضة",  en:"AL-NAHDA",   p:"#b50000", s:"#f0d000", e:"🔴" },
  nasr:    { ar:"النصر",   en:"AL-NASR",    p:"#002e99", s:"#f5c800", e:"⭐" },
  oman:    { ar:"عمان",    en:"OMAN CLUB",  p:"#a00000", s:"#008800", e:"🇴🇲" },
  rustaq:  { ar:"الرستاق", en:"AL-RUSTAQ",  p:"#c04a00", s:"#dddddd", e:"🔶" },
  sohar:   { ar:"صحار",    en:"SOHAR",      p:"#004faa", s:"#f0a000", e:"💙" },
  muscat:  { ar:"مسقط",   en:"MUSCAT FC",  p:"#4a0066", s:"#c088ff", e:"💜" },
  nizwa:   { ar:"نزوى",   en:"NIZWA",      p:"#004422", s:"#eeeeee", e:"🟢" },
  sur:     { ar:"صور",    en:"SUR",        p:"#6a3300", s:"#ffbb00", e:"🟠" },
  bahla:   { ar:"بهلاء",  en:"BAHLA",      p:"#1a1a5e", s:"#d4aa50", e:"🔵" },
  bousher: { ar:"بوشر",   en:"BOUSHER",    p:"#005544", s:"#ffee44", e:"🟡" },
};

const CANVAS_SIZES = {
  portrait: { w:1080, h:1350, label:"1080×1350", sub:"Portrait" },
  square:   { w:1080, h:1080, label:"1080×1080", sub:"Square"   },
  story:    { w:1080, h:1920, label:"1080×1920", sub:"Story"    },
};

const POST_TYPES = [
  { id:"matchday",  ar:"يوم المباراة",     en:"MATCHDAY"   },
  { id:"fulltime",  ar:"النتيجة النهائية", en:"FULL TIME"  },
  { id:"halftime",  ar:"نصف الوقت",        en:"HALF TIME"  },
  { id:"nextmatch", ar:"المباراة القادمة", en:"NEXT MATCH" },
  { id:"goal",      ar:"هدف!",             en:"GOAL!"      },
  { id:"motm",      ar:"رجل المباراة",     en:"MOTM"       },
];

const DEFAULT = {
  postType:"matchday", canvasSize:"portrait",
  comp:"دوري عُمانتل للمحترفين", compEn:"OMANTEL PRO LEAGUE",
  round:"الجولة ١٢", date:"٢٤ مايو ٢٠٢٦", time:"٢٠:٠٠",
  venue:"ملعب السلطان قابوس", footer:"osl.om  ·  @OmanLeague",
  hNameAr:"السيب",  hNameEn:"AL-SEEB", hPrimary:"#1a3a6e", hSecondary:"#c8a84b",
  aNameAr:"ظفار",   aNameEn:"DHOFAR",  aPrimary:"#005c2b",  aSecondary:"#f5c800",
  hScore:"2", aScore:"1",
  scorers:"أحمد الكندي 23' • سالم البلوشي 67'",
  motmName:"أحمد الكندي",
  accent:"#e8c84a",
  showDate:true, showBranding:true, showStats:false,
  showSocial:true, showSponsor:true, showAr:true, showEn:true,
  bgOverlay:0.45, bgBlur:0, bgBrightness:95, bgScale:100,
  bgPosX:50, bgPosY:30, bgFit:"cover",
  bgImage:null, scoreSize:160, bgGradient:"strong",
};

/* ═══════════════════════════════════════════════════════════════════════════
   DRAW ENGINE
═══════════════════════════════════════════════════════════════════════════ */
const R = x => Math.round(x);

function createEngine(ctx, W, H) {
  function txt(str, x, y, size, color="#fff", weight="700", align="center", maxW) {
    if (!str && str !== 0) return;
    ctx.save();
    ctx.font = `${weight} ${R(size)}px 'Cairo','Tajawal','Noto Kufi Arabic',sans-serif`;
    ctx.fillStyle = color; ctx.textAlign = align;
    ctx.textBaseline = "middle"; ctx.direction = "rtl";
    maxW ? ctx.fillText(String(str),x,y,maxW) : ctx.fillText(String(str),x,y);
    ctx.restore();
  }

  function txtStroke(str, x, y, size, fill="#fff", stroke="rgba(0,0,0,.55)", weight="900") {
    if (!str) return;
    ctx.save();
    ctx.font = `${weight} ${R(size)}px 'Cairo','Tajawal',sans-serif`;
    ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.direction="rtl";
    ctx.lineWidth = size*0.07; ctx.strokeStyle=stroke; ctx.lineJoin="round";
    ctx.strokeText(String(str),x,y);
    ctx.fillStyle=fill; ctx.fillText(String(str),x,y);
    ctx.restore();
  }

  function rrect(x, y, w, h, r, fill, stroke, sw=1, alpha=1) {
    if (!fill && !stroke) return;
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.beginPath(); ctx.roundRect(x,y,w,h,r);
    if (fill)   { ctx.fillStyle=fill;   ctx.fill();   }
    if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=sw; ctx.stroke(); }
    ctx.restore();
  }

  function circ(x, y, r, fill, stroke, sw=3) {
    ctx.save(); ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    if (fill)   { ctx.fillStyle=fill;   ctx.fill();   }
    if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=sw; ctx.stroke(); }
    ctx.restore();
  }

  function line(x1,y1,x2,y2,color,lw=1,alpha=1) {
    ctx.save(); ctx.globalAlpha=alpha; ctx.strokeStyle=color; ctx.lineWidth=lw;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore();
  }

  function hexPattern(col, alpha=0.045) {
    ctx.save(); ctx.globalAlpha=alpha; ctx.strokeStyle=col; ctx.lineWidth=1.2;
    const pts=[[28,2],[54,16],[54,44],[28,58],[2,44],[2,16]];
    for (let row=-1; row<H/50+2; row++)
      for (let col2=-2; col2<W/56+2; col2++) {
        const ox=col2*56+(row%2?28:0), oy=row*50;
        ctx.beginPath();
        pts.forEach(([px,py],i)=>i?ctx.lineTo(ox+px,oy+py):ctx.moveTo(ox+px,oy+py));
        ctx.closePath(); ctx.stroke();
      }
    ctx.restore();
  }

  function darken(hex, f) {
    const n=parseInt(hex.replace("#",""),16);
    return `rgb(${R(((n>>16)&255)*f)},${R(((n>>8)&255)*f)},${R((n&255)*f)})`;
  }

  function drawBackground(S, bgImg) {
    const hc=S.hPrimary, ac=S.aPrimary;
    if (bgImg) {
      ctx.save();
      ctx.filter = S.bgBlur>0
        ? `blur(${S.bgBlur}px) brightness(${S.bgBrightness}%)`
        : `brightness(${S.bgBrightness}%)`;
      const sc=S.bgScale/100;
      const iw=bgImg.naturalWidth, ih=bgImg.naturalHeight;
      let dw,dh,dx,dy;
      if (S.bgFit==="cover") {
        const fit=Math.max(W/iw,H/ih)*sc;
        dw=iw*fit; dh=ih*fit;
        dx=(W-dw)*(S.bgPosX/100); dy=(H-dh)*(S.bgPosY/100);
      } else {
        const fit=Math.min(W/iw,H/ih)*sc;
        dw=iw*fit; dh=ih*fit;
        dx=(W-dw)/2; dy=(H-dh)/2;
        ctx.fillStyle="#000"; ctx.fillRect(0,0,W,H);
      }
      ctx.drawImage(bgImg,dx,dy,dw,dh);
      ctx.restore();
      if (S.bgGradient !== "none") {
        const fade=ctx.createLinearGradient(0,0,0,H);
        const ov=S.bgOverlay;
        fade.addColorStop(0,   `rgba(0,0,0,${ov*0.25})`);
        fade.addColorStop(0.38,`rgba(0,0,0,${ov*0.40})`);
        fade.addColorStop(0.60,`rgba(0,0,0,${ov*0.75})`);
        fade.addColorStop(0.80,`rgba(0,0,0,${ov*0.92})`);
        fade.addColorStop(1,   "rgba(0,0,0,.97)");
        ctx.fillStyle=fade; ctx.fillRect(0,0,W,H);
      }
    } else {
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,    darken(hc,0.72));
      g.addColorStop(0.42, darken(hc,0.48));
      g.addColorStop(0.58, darken(ac,0.48));
      g.addColorStop(1,    darken(ac,0.72));
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      const rad=ctx.createRadialGradient(W/2,H*0.3,0,W/2,H*0.3,W*0.75);
      rad.addColorStop(0,"rgba(255,255,255,.05)"); rad.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=rad; ctx.fillRect(0,0,W,H);
      const bot=ctx.createLinearGradient(0,H*0.45,0,H);
      bot.addColorStop(0,"rgba(0,0,0,0)"); bot.addColorStop(1,"rgba(0,0,0,.78)");
      ctx.fillStyle=bot; ctx.fillRect(0,0,W,H);
    }
    hexPattern(S.accent, 0.032);
  }

  function drawLogo(img, emoji, cx, cy, r, ringColor, ringColor2) {
    ctx.save();
    ctx.shadowColor=ringColor; ctx.shadowBlur=28; ctx.globalAlpha=0.32;
    circ(cx,cy,r+2,ringColor,null);
    ctx.restore();
    circ(cx,cy,r+7, null,"rgba(255,255,255,.07)",16);
    circ(cx,cy,r+3, ringColor2||ringColor,null);
    circ(cx,cy,r,   "rgba(0,0,0,.35)",null);
    if (img) {
      ctx.save();
      ctx.beginPath(); ctx.arc(cx,cy,r-1,0,Math.PI*2); ctx.clip();
      ctx.drawImage(img,cx-r+1,cy-r+1,(r-1)*2,(r-1)*2);
      ctx.restore();
    } else {
      ctx.save();
      ctx.font=`${R(r*1.12)}px serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(emoji,cx,cy);
      ctx.restore();
    }
  }

  return { txt, txtStroke, rrect, circ, line, hexPattern, darken, drawBackground, drawLogo };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED LAYOUT HELPERS
═══════════════════════════════════════════════════════════════════════════ */
function getClub(S, side) {
  return {
    ar:    S[`${side}NameAr`],
    en:    S[`${side}NameEn`],
    p:     S[`${side}Primary`],
    s:     S[`${side}Secondary`],
    emoji: Object.values(CLUBS).find(c=>c.ar===S[`${side}NameAr`])?.e || (side==="h"?"⚽":"🦁"),
  };
}

function drawTopStrip(e, S, W) {
  if (S.showDate) {
    e.rrect(36,24,220,40,4,"rgba(0,0,0,.38)","rgba(255,255,255,.1)",1);
    e.txt(S.date,146,44,20,"rgba(255,255,255,.8)","600");
  }
  if (S.showSponsor) {
    e.rrect(W-256,24,220,40,4,"rgba(0,0,0,.38)","rgba(255,255,255,.1)",1);
    e.txt(S.compEn,W-146,44,16,"rgba(255,255,255,.55)","600");
  }
}

function drawCompPill(e, S, W, y) {
  const pw=Math.min(W-80,580);
  e.rrect(W/2-pw/2,y-22,pw,44,22,"rgba(0,0,0,.5)",S.accent+"66",1.5);
  e.circ(W/2-pw/2+20,y,5,S.accent,null);
  e.txt(S.comp,W/2+4,y,20,S.accent,"700","center",pw-50);
}

function drawStatusBadge(e, S, W, y, labelEn) {
  const bw=280;
  e.rrect(W/2-bw/2,y-24,bw,48,4,S.accent,null);
  e.txt(labelEn,W/2,y,26,"#000","900");
}

function drawInfoRow(e, S, W, y) {
  const rw=(W-88)/2-6, rh=56;
  e.rrect(44,y,rw,rh,6,"rgba(0,0,0,.5)","rgba(255,255,255,.08)",1);
  e.txt("📍",44+26,y+28,20,"rgba(255,255,255,.45)","400","left");
  e.txt(S.venue,44+52,y+28,19,"rgba(255,255,255,.75)","600","left",rw-64);
  e.rrect(W/2+6,y,rw,rh,6,"rgba(0,0,0,.5)","rgba(255,255,255,.08)",1);
  e.txt("🏆",W/2+6+26,y+28,20,"rgba(255,255,255,.45)","400","left");
  e.txt(S.round,W/2+6+52,y+28,19,"rgba(255,255,255,.75)","600","left",rw-64);
}

function drawFooter(e, S, W, H, hImg, aImg) {
  if (!S.showBranding) return;
  const fy=H-88;
  e.line(60,fy,W-60,fy,"rgba(255,255,255,.1)",1);
  const hc=getClub(S,"h"), ac=getClub(S,"a");
  e.drawLogo(hImg,hc.emoji,52,fy+44,22,hc.p,hc.s);
  e.txt(S.footer,W/2,fy+44,18,"rgba(255,255,255,.28)","400");
  e.drawLogo(aImg,ac.emoji,W-52,fy+44,22,ac.p,ac.s);
}

/* ── Dark gradient overlay for the bottom panel ── */
const GRAD_STOPS = {
  strong: [0, .82, .94, .98],
  light:  [0, .30, .52, .68],
  none:   null,
};
function drawBottomOverlay(ctx, S, W, H, fromY) {
  if (S.bgGradient === "none") return;
  const stops = GRAD_STOPS[S.bgGradient] || GRAD_STOPS.strong;
  const g = ctx.createLinearGradient(0, fromY, 0, H);
  g.addColorStop(0,    `rgba(0,0,0,${stops[0]})`);
  g.addColorStop(0.18, `rgba(0,0,0,${stops[1]})`);
  g.addColorStop(0.42, `rgba(0,0,0,${stops[2]})`);
  g.addColorStop(1,    `rgba(0,0,0,${stops[3]})`);
  ctx.fillStyle = g; ctx.fillRect(0, fromY, W, H - fromY);
}

/* ── Team block: circular logo + name, placed in bottom section ── */
function drawTeamBlock(e, S, side, cx, rowY, LR, img, W) {
  const club = getClub(S, side);
  e.drawLogo(img, club.emoji, cx, rowY, LR, club.p, club.s);
  const nameY = rowY + LR + 26;
  if (S.showAr) {
    e.txt(club.ar, cx, nameY,     34, "rgba(0,0,0,.4)", "900","center",W*0.28);
    e.txt(club.ar, cx, nameY - 1, 34, "#fff",           "900","center",W*0.28);
  }
  if (S.showEn) {
    e.txt(club.en, cx, nameY + (S.showAr ? 40 : 0), 14,
          "rgba(255,255,255,.38)","600","center",W*0.26);
  }
  e.rrect(cx - 36, nameY + (S.showAr ? 28 : 8), 72, 2, 1, club.s, null);
}

/* ── Inline score: [H] [accent dash] [A] centred between logos ── */
function drawCenterScore(e, S, W, cy) {
  const ss  = parseInt(S.scoreSize) || 130;
  const gap = R(ss * 0.68);
  e.txtStroke(S.hScore||"0", W/2 - gap, cy, ss, "#fff","rgba(0,0,0,.55)","900");
  const bw = 44, bh = R(ss * 0.55);
  e.rrect(W/2 - bw/2, cy - bh/2, bw, bh, 5, S.accent, null);
  e.txt("—", W/2, cy, R(ss * 0.28), "#000","900");
  e.txtStroke(S.aScore||"0", W/2 + gap, cy, ss, "#fff","rgba(0,0,0,.55)","900");
}

/* ── Compact 2-row stats (possession + shots) ── */
function drawCompactStats(e, S, W, y) {
  [["الاستحواذ",65,35],["التسديدات",7,4]].forEach(([lbl,hv,av],i)=>{
    const ry = y + i * 40;
    const total = hv + av || 1;
    const hw = R((hv/total) * (W - 88));
    e.rrect(44, ry+22, W-88, 3, 2, "rgba(255,255,255,.1)", null);
    e.rrect(44, ry+22, hw,   3, 2, S.accent, null);
    e.txt(String(hv)+"%", 44,   ry+11, 14, "#fff","700","left");
    e.txt(String(av)+"%", W-44, ry+11, 14, "#fff","700","right");
    e.txt(lbl, W/2, ry+11, 13, "rgba(255,255,255,.32)","400");
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE RENDERERS
   Shared layout: background image in top ~52%, dark panel at bottom.
   Bottom panel: [Home logo] [score/VS/time] [Away logo] in one row,
   team names directly below their logos.
═══════════════════════════════════════════════════════════════════════════ */
function yAt(H, pct) { return Math.round(H * pct); }

/* Shared logo-row constants */
function logoRow(W, H) {
  return {
    LR:   R(W * 0.068),          // logo radius ~73px at 1080
    hX:   R(W * 0.18),           // home logo centre X
    aX:   R(W * 0.82),           // away logo centre X
    botY: yAt(H, 0.52),          // dark overlay starts here
  };
}

function renderMatchday(ctx, S, hImg, aImg, bgImg) {
  const sz=CANVAS_SIZES[S.canvasSize], W=sz.w, H=sz.h;
  const e=createEngine(ctx,W,H);
  e.drawBackground(S,bgImg);
  drawTopStrip(e,S,W);

  const { LR, hX, aX, botY } = logoRow(W, H);
  drawBottomOverlay(ctx, S, W, H, botY);
  drawCompPill(e, S, W, yAt(H, 0.578));
  drawStatusBadge(e, S, W, yAt(H, 0.628), "MATCHDAY");

  const rowY = yAt(H, 0.718);
  drawTeamBlock(e, S, "h", hX, rowY, LR, hImg, W);
  drawTeamBlock(e, S, "a", aX, rowY, LR, aImg, W);

  /* VS ghost + kick-off time pill, centred between the two logos */
  e.txt("VS", W/2, rowY - 6, 90, "rgba(255,255,255,.04)", "900");
  const tpw = 200;
  e.rrect(W/2 - tpw/2, rowY - 22, tpw, 44, 22, "rgba(0,0,0,.72)", S.accent+"88", 2);
  e.txt(S.time, W/2, rowY, 28, S.accent, "900");

  const infoY = yAt(H, 0.868);
  drawInfoRow(e, S, W, infoY);
  e.line(60, infoY-14, W-60, infoY-14, "rgba(255,255,255,.06)", 1);
  drawFooter(e, S, W, H, hImg, aImg);
}

function renderFulltime(ctx, S, hImg, aImg, bgImg) {
  const sz=CANVAS_SIZES[S.canvasSize], W=sz.w, H=sz.h;
  const e=createEngine(ctx,W,H);
  e.drawBackground(S,bgImg);
  drawTopStrip(e,S,W);

  const { LR, hX, aX, botY } = logoRow(W, H);
  drawBottomOverlay(ctx, S, W, H, botY);

  /* FULL TIME badge + date subtitle */
  const badgeY = yAt(H, 0.578);
  e.rrect(W/2-130, badgeY-18, 260, 36, 4, S.accent, null);
  e.txt("FULL TIME", W/2, badgeY, 20, "#000","900");
  e.txt(S.date, W/2, badgeY+28, 15, "rgba(255,255,255,.38)","500");

  drawCompPill(e, S, W, yAt(H, 0.638));

  const rowY = yAt(H, 0.722);
  drawTeamBlock(e, S, "h", hX, rowY, LR, hImg, W);
  drawTeamBlock(e, S, "a", aX, rowY, LR, aImg, W);
  drawCenterScore(e, S, W, rowY);

  /* Scorers line */
  const nameEndY = rowY + LR + 26 + (S.showAr ? 40 : 0) + (S.showEn ? 20 : 0) + 18;
  const scorY = Math.max(nameEndY, yAt(H, 0.846));
  e.txt(S.scorers, W/2, scorY, 20, "rgba(255,255,255,.68)","500","center",W-120);

  if (S.showStats) {
    drawCompactStats(e, S, W, scorY + 34);
  } else {
    const infoY = Math.max(scorY + 44, yAt(H, 0.878));
    drawInfoRow(e, S, W, infoY);
    e.line(60, infoY-14, W-60, infoY-14, "rgba(255,255,255,.06)", 1);
  }
  drawFooter(e, S, W, H, hImg, aImg);
}

function renderHalftime(ctx, S, hImg, aImg, bgImg) {
  const sz=CANVAS_SIZES[S.canvasSize], W=sz.w, H=sz.h;
  const e=createEngine(ctx,W,H);
  e.drawBackground(S,bgImg);
  drawTopStrip(e,S,W);

  const { LR, hX, aX, botY } = logoRow(W, H);
  drawBottomOverlay(ctx, S, W, H, botY);
  drawCompPill(e, S, W, yAt(H, 0.578));
  drawStatusBadge(e, S, W, yAt(H, 0.628), "HALF TIME");

  const rowY = yAt(H, 0.718);
  drawTeamBlock(e, S, "h", hX, rowY, LR, hImg, W);
  drawTeamBlock(e, S, "a", aX, rowY, LR, aImg, W);
  drawCenterScore(e, S, W, rowY);

  /* 45' pill below score, in the centre gap */
  const mpw = 116;
  e.rrect(W/2 - mpw/2, rowY + 50, mpw, 40, 20, S.accent, null);
  e.txt("45'", W/2, rowY + 70, 22, "#000","900");

  const infoY = yAt(H, 0.872);
  drawInfoRow(e, S, W, infoY);
  e.line(60, infoY-14, W-60, infoY-14, "rgba(255,255,255,.06)", 1);
  drawFooter(e, S, W, H, hImg, aImg);
}

function renderNextMatch(ctx, S, hImg, aImg, bgImg) {
  const sz=CANVAS_SIZES[S.canvasSize], W=sz.w, H=sz.h;
  const e=createEngine(ctx,W,H);
  e.drawBackground(S,bgImg);
  drawTopStrip(e,S,W);

  const { LR, hX, aX, botY } = logoRow(W, H);
  drawBottomOverlay(ctx, S, W, H, botY);
  drawCompPill(e, S, W, yAt(H, 0.578));
  drawStatusBadge(e, S, W, yAt(H, 0.628), "NEXT MATCH");

  const rowY = yAt(H, 0.718);
  drawTeamBlock(e, S, "h", hX, rowY, LR, hImg, W);
  drawTeamBlock(e, S, "a", aX, rowY, LR, aImg, W);

  /* Large time pill centred between logos */
  const tpw = 240;
  e.rrect(W/2 - tpw/2, rowY - 28, tpw, 56, 28, "rgba(0,0,0,.72)", S.accent+"99", 2);
  e.txt(S.time, W/2, rowY, 34, S.accent,"900");

  /* Date badge below the logos (centre X, cleared from logo X positions) */
  const dateY = rowY + LR + 26;
  e.rrect(W/2-140, dateY, 280, 42, 6, "rgba(0,0,0,.5)","rgba(255,255,255,.08)",1);
  e.txt("📅  "+S.date, W/2, dateY+21, 19, "rgba(255,255,255,.65)","600");

  const infoY = yAt(H, 0.880);
  drawInfoRow(e, S, W, infoY);
  e.line(60, infoY-14, W-60, infoY-14, "rgba(255,255,255,.06)", 1);
  drawFooter(e, S, W, H, hImg, aImg);
}

function renderGoal(ctx, S, hImg, aImg, bgImg) {
  const sz=CANVAS_SIZES[S.canvasSize], W=sz.w, H=sz.h;
  const e=createEngine(ctx,W,H);
  e.drawBackground(S,bgImg);

  /* Golden radial burst behind the upper section */
  ctx.save();
  const burst=ctx.createRadialGradient(W/2, H*0.3, 0, W/2, H*0.3, W*0.6);
  burst.addColorStop(0,"rgba(230,190,55,.18)"); burst.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=burst; ctx.fillRect(0,0,W,H); ctx.restore();

  drawTopStrip(e,S,W);

  /* GOAL! banner pinned to top */
  e.rrect(40, yAt(H,0.075), W-80, 90, 8, S.accent, null);
  e.txt("⚽  GOAL!", W/2, yAt(H,0.075)+45, 50, "#000","900");

  const { LR, hX, aX, botY } = logoRow(W, H);
  drawBottomOverlay(ctx, S, W, H, botY);
  drawCompPill(e, S, W, yAt(H, 0.578));

  const rowY = yAt(H, 0.698);
  drawTeamBlock(e, S, "h", hX, rowY, LR, hImg, W);
  drawTeamBlock(e, S, "a", aX, rowY, LR, aImg, W);
  drawCenterScore(e, S, W, rowY);

  /* Scorer card */
  const scorY = yAt(H, 0.848);
  e.rrect(44, scorY, W-88, 64, 8, "rgba(0,0,0,.5)", S.accent+"44", 1.5);
  e.txt("المسجّل", W/2, scorY+17, 15, S.accent,"700");
  e.txt(S.scorers, W/2, scorY+45, 22, "#fff","700","center",W-110);

  drawFooter(e, S, W, H, hImg, aImg);
}

function renderMOTM(ctx, S, hImg, aImg, bgImg) {
  const sz=CANVAS_SIZES[S.canvasSize], W=sz.w, H=sz.h;
  const e=createEngine(ctx,W,H);
  e.drawBackground(S,bgImg);

  if (S.bgGradient !== "none") {
    const deepOv=ctx.createLinearGradient(0,H*0.25,0,H);
    deepOv.addColorStop(0,"rgba(0,0,0,0)");
    deepOv.addColorStop(0.3,"rgba(0,0,0,.65)");
    deepOv.addColorStop(1,"rgba(0,0,0,.97)");
    ctx.fillStyle=deepOv; ctx.fillRect(0,0,W,H);
  }

  drawTopStrip(e,S,W);
  drawCompPill(e,S,W,yAt(H,0.12));

  ctx.save(); ctx.strokeStyle=S.accent; ctx.lineWidth=4;
  const tl=80, tr=W-80;
  const ty1=yAt(H,0.19), ty2=yAt(H,0.225);
  ctx.beginPath(); ctx.moveTo(tl,ty1); ctx.lineTo(tr,ty1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tl,ty2); ctx.lineTo(tr,ty2); ctx.stroke();
  ctx.restore();
  e.txt("رجل المباراة",W/2,(ty1+ty2)/2,42,S.accent,"900");
  e.txt("PLAYER  OF  THE  MATCH",W/2,ty2+20,17,"rgba(255,255,255,.28)","600");

  /* Compact score above the player card */
  const scoreY = yAt(H, 0.36);
  const ss = R((parseInt(S.scoreSize)||130) * 0.82);
  e.txtStroke(S.hScore||"0", W/2-R(ss*0.72), scoreY, ss, "#fff","rgba(0,0,0,.5)","900");
  e.rrect(W/2-22, scoreY-R(ss*0.28), 44, R(ss*0.56), 4, S.accent, null);
  e.txt("—", W/2, scoreY, R(ss*0.27), "#000","900");
  e.txtStroke(S.aScore||"0", W/2+R(ss*0.72), scoreY, ss, "#fff","rgba(0,0,0,.5)","900");

  /* Player name card */
  const cardY = yAt(H, 0.488);
  const cardH = R(H * 0.192);
  e.rrect(44, cardY, W-88, cardH, 12, "rgba(0,0,0,.68)", S.accent+"2a", 1.5);
  e.line(46, cardY+52, W-46, cardY+52, "rgba(255,255,255,.07)", 1);
  e.txt("اللاعب", W/2, cardY+27, 17, "rgba(255,255,255,.32)","600");
  e.txt(S.motmName||"اسم اللاعب", W/2, cardY+cardH/2+14, 50, "#fff","900","center",W-120);

  /* Bottom: team logos + venue/round text in centre gap */
  const { LR, hX, aX } = logoRow(W, H);
  const rowY = yAt(H, 0.800);
  drawTeamBlock(e, S, "h", hX, rowY, LR, hImg, W);
  drawTeamBlock(e, S, "a", aX, rowY, LR, aImg, W);
  e.txt(S.venue+"  ·  "+S.round, W/2, rowY, 16, "rgba(255,255,255,.35)","500");

  drawFooter(e, S, W, H, hImg, aImg);
}

const RENDERERS = {
  matchday: renderMatchday, fulltime: renderFulltime,
  halftime: renderHalftime, nextmatch: renderNextMatch,
  goal: renderGoal,         motm: renderMOTM,
};

/* ═══════════════════════════════════════════════════════════════════════════
   UI ATOMS
═══════════════════════════════════════════════════════════════════════════ */
function Lbl({children}) {
  return <label className="block text-[10px] text-white/35 mb-1 text-right tracking-wide">{children}</label>;
}
function Inp({value,onChange,placeholder,type="text",min,max,dir="rtl"}) {
  return (
    <input type={type} value={value} placeholder={placeholder} min={min} max={max} dir={dir}
      onChange={e=>onChange(e.target.value)}
      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-md px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-yellow-400/40 transition-colors" />
  );
}
function Sel({value,onChange,children}) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} dir="rtl"
      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-md px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-yellow-400/40 cursor-pointer appearance-none">
      {children}
    </select>
  );
}
function Tx({value,onChange,rows=2}) {
  return (
    <textarea value={value} rows={rows} dir="rtl" onChange={e=>onChange(e.target.value)}
      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-md px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-yellow-400/40 transition-colors resize-none" />
  );
}
function ColPick({value,onChange,label}) {
  return (
    <div>
      {label&&<Lbl>{label}</Lbl>}
      <div className="flex gap-1.5">
        <input type="color" value={value} onChange={e=>onChange(e.target.value)}
          className="w-8 h-7 rounded border border-white/20 cursor-pointer bg-transparent p-0.5 flex-shrink-0" />
        <input type="text" value={value} dir="ltr" onChange={e=>onChange(e.target.value)}
          className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-md px-2 py-1 text-[11px] text-white/70 outline-none focus:border-yellow-400/40 font-mono" />
      </div>
    </div>
  );
}
function Tog({value,onChange,label}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-white/45">{label}</span>
      <button onClick={()=>onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${value?"bg-yellow-400":"bg-white/15"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${value?"right-0.5":"left-0.5"}`}/>
      </button>
    </div>
  );
}
function SliderRow({label,value,onChange,min=0,max=100,unit="",step=1}) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-white/35">{label}</span>
        <span className="text-[10px] text-white/55">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))}
        className="w-full h-[3px] rounded-full cursor-pointer appearance-none"
        style={{background:`linear-gradient(90deg,#e8c84a ${((value-min)/(max-min))*100}%,rgba(255,255,255,.12) 0%)`}}
      />
    </div>
  );
}
function F({label,children}) {
  return <div className="mb-2">{label&&<Lbl>{label}</Lbl>}{children}</div>;
}

function Accordion({title,defaultOpen=false,children,accent}) {
  const [open,setOpen]=useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.07]">
      <button onClick={()=>setOpen(o=>!o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-white/[0.02] transition-colors">
        <span className={`text-[11px] font-bold tracking-[0.12em] uppercase ${accent||"text-white/50"}`}>{title}</span>
        <span className={`text-white/30 text-[10px] transition-transform duration-200 ${open?"rotate-180":""}`}>▼</span>
      </button>
      {open && <div className="px-3.5 pb-3">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEAM PANEL
═══════════════════════════════════════════════════════════════════════════ */
function TeamPanel({side,S,U,onLogo}) {
  const isH=side==="h";
  const p=side;
  const active=S[`${p}NameAr`];
  return (
    <>
      <F label="اختر النادي">
        <Sel value="" onChange={key=>{
          if (!CLUBS[key]) return;
          const c=CLUBS[key];
          U(`${p}NameAr`,c.ar); U(`${p}NameEn`,c.en);
          U(`${p}Primary`,c.p); U(`${p}Secondary`,c.s);
        }}>
          <option value="">— اختر النادي —</option>
          {Object.entries(CLUBS).map(([k,c])=>(
            <option key={k} value={k}>نادي {c.ar} — {c.en}</option>
          ))}
        </Sel>
      </F>
      <div className="grid grid-cols-6 gap-1 mb-2">
        {Object.entries(CLUBS).map(([k,c])=>{
          const on=active===c.ar;
          return (
            <button key={k} title={`نادي ${c.ar}`}
              onClick={()=>{U(`${p}NameAr`,c.ar);U(`${p}NameEn`,c.en);U(`${p}Primary`,c.p);U(`${p}Secondary`,c.s);}}
              className={`rounded py-1 text-[15px] border transition-all ${on?(isH?"border-yellow-400 bg-yellow-400/10":"border-blue-400 bg-blue-400/10"):"border-white/[0.07] bg-white/[0.03] hover:border-white/20"}`}>
              {c.e}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <F label="الاسم عربي"><Inp value={S[`${p}NameAr`]} onChange={v=>U(`${p}NameAr`,v)}/></F>
        <F label="الاسم إنجليزي"><Inp value={S[`${p}NameEn`]} onChange={v=>U(`${p}NameEn`,v)} dir="ltr"/></F>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <ColPick label="اللون الأساسي"  value={S[`${p}Primary`]}   onChange={v=>U(`${p}Primary`,v)}/>
        <ColPick label="اللون الثانوي"  value={S[`${p}Secondary`]} onChange={v=>U(`${p}Secondary`,v)}/>
      </div>
      <label className={`flex items-center justify-center gap-2 border border-dashed rounded-md py-2 cursor-pointer text-[11px] transition-colors ${S[`${p}Logo`]?"border-yellow-400/40 text-yellow-400/60":"border-white/15 text-white/30 hover:border-white/25"}`}>
        {S[`${p}Logo`]?"✓ تم رفع الشعار":"⬆️ رفع شعار النادي"}
        <input type="file" accept="image/*" className="hidden" onChange={onLogo}/>
      </label>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BACKGROUND PANEL
═══════════════════════════════════════════════════════════════════════════ */
function BgPanel({S,U,onBgLoad,onBgRemove}) {
  const gradOpts = [
    { value:"strong", label:"قوي",   desc:"تلاشٍ داكن من المنتصف" },
    { value:"light",  label:"خفيف",  desc:"إظلام خفيف في الأسفل فقط" },
    { value:"none",   label:"بدون",  desc:"بدون طبقة سوداء" },
  ];
  return (
    <>
      {/* Gradient intensity — always visible */}
      <div className="mb-3">
        <div className="text-[10px] text-white/35 text-right mb-1.5 tracking-wide">شدة التدرج</div>
        <div className="grid grid-cols-3 gap-1.5">
          {gradOpts.map(o=>{
            const on = S.bgGradient === o.value;
            return (
              <button key={o.value} onClick={()=>U("bgGradient",o.value)}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-md border text-center transition-all"
                style={{
                  background: on ? "rgba(232,200,74,.12)" : "rgba(255,255,255,.03)",
                  borderColor: on ? "#e8c84a"             : "rgba(255,255,255,.09)",
                }}>
                {/* mini gradient preview */}
                <div className="w-full h-4 rounded-sm overflow-hidden" style={{
                  background: o.value==="strong"
                    ? "linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.9) 100%)"
                    : o.value==="light"
                    ? "linear-gradient(to bottom,transparent 30%,rgba(0,0,0,.55) 100%)"
                    : "repeating-linear-gradient(45deg,rgba(255,255,255,.06) 0px,rgba(255,255,255,.06) 2px,transparent 2px,transparent 6px)",
                }}/>
                <span className="text-[11px] font-bold leading-none"
                  style={{color: on ? "#e8c84a" : "rgba(255,255,255,.5)"}}>
                  {o.label}
                </span>
                <span className="text-[9px] leading-tight text-center"
                  style={{color:"rgba(255,255,255,.22)"}}>
                  {o.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {S.bgImage ? (
        <>
          <div className="relative rounded-lg overflow-hidden mb-2.5" style={{height:72}}>
            <img src={S.bgImage} alt="" className="w-full h-full object-cover opacity-60"/>
            <button onClick={onBgRemove}
              className="absolute top-1.5 right-1.5 bg-red-500/80 text-white rounded px-2 py-0.5 text-[10px] font-bold">
              ✕ حذف
            </button>
          </div>
          <SliderRow label="الإظلام"   value={Math.round(S.bgOverlay*100)} onChange={v=>U("bgOverlay",v/100)} min={0} max={100} unit="%"/>
          <SliderRow label="السطوع"    value={S.bgBrightness} onChange={v=>U("bgBrightness",v)} min={20} max={150} unit="%"/>
          <SliderRow label="الضبابية"  value={S.bgBlur}       onChange={v=>U("bgBlur",v)}       min={0} max={20}  unit="px"/>
          <SliderRow label="التكبير"   value={S.bgScale}      onChange={v=>U("bgScale",v)}      min={50} max={200} unit="%"/>
          <div className="grid grid-cols-2 gap-2 mb-1">
            <SliderRow label="أفقي" value={S.bgPosX} onChange={v=>U("bgPosX",v)} unit="%"/>
            <SliderRow label="رأسي" value={S.bgPosY} onChange={v=>U("bgPosY",v)} unit="%"/>
          </div>
          <F label="ملاءمة الصورة">
            <Sel value={S.bgFit} onChange={v=>U("bgFit",v)}>
              <option value="cover">تغطية (Cover)</option>
              <option value="contain">احتواء (Contain)</option>
            </Sel>
          </F>
        </>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-lg py-5 cursor-pointer hover:border-white/22 transition-colors">
          <span className="text-2xl">🖼️</span>
          <span className="text-[11px] text-white/30">رفع صورة خلفية</span>
          <span className="text-[9px] text-white/18">PNG · JPG · WEBP</span>
          <input type="file" accept="image/*" className="hidden" onChange={onBgLoad}/>
        </label>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [S,setS]        = useState({...DEFAULT});
  const [zoom,setZoom]  = useState(0);
  const [hImg,setHImg]  = useState(null);
  const [aImg,setAImg]  = useState(null);
  const [bgImg,setBgImg]= useState(null);
  const [dl,setDl]      = useState(false);
  const canvasRef = useRef(null);
  const stageRef  = useRef(null);

  const U = useCallback((k,v)=>setS(p=>({...p,[k]:v})),[]);

  const calcFit = useCallback(()=>{
    if (!stageRef.current) return 0.42;
    const {clientWidth:sw,clientHeight:sh}=stageRef.current;
    const sz=CANVAS_SIZES[S.canvasSize];
    return Math.min((sw-44)/sz.w,(sh-52)/sz.h,0.82);
  },[S.canvasSize]);

  useEffect(()=>{setZoom(calcFit());},[calcFit]);
  useEffect(()=>{
    const h=()=>setZoom(calcFit());
    window.addEventListener("resize",h);
    return ()=>window.removeEventListener("resize",h);
  },[calcFit]);

  useEffect(()=>{
    const canvas=canvasRef.current; if (!canvas) return;
    const sz=CANVAS_SIZES[S.canvasSize];
    canvas.width=sz.w; canvas.height=sz.h;
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,sz.w,sz.h);
    (RENDERERS[S.postType]||renderMatchday)(ctx,S,hImg,aImg,bgImg);
  },[S,hImg,aImg,bgImg]);

  const loadLogo=useCallback((side,e)=>{
    const file=e.target.files[0]; if (!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        if (side==="h"){setHImg(img);U("hLogo",ev.target.result);}
        else           {setAImg(img);U("aLogo",ev.target.result);}
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file); e.target.value="";
  },[U]);

  const loadBg=useCallback(e=>{
    const file=e.target.files[0]; if (!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{setBgImg(img);U("bgImage",ev.target.result);};
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file); e.target.value="";
  },[U]);

  const removeBg=useCallback(()=>{setBgImg(null);U("bgImage",null);},[U]);

  const dlPNG=useCallback(()=>{
    const canvas=canvasRef.current; if (!canvas) return;
    setDl(true);
    canvas.toBlob(blob=>{
      const a=document.createElement("a");
      a.href=URL.createObjectURL(blob);
      a.download=`omani-league-${S.postType}-${S.canvasSize}-${Date.now()}.png`;
      a.click(); URL.revokeObjectURL(a.href);
      setDl(false);
    },"image/png",1);
  },[S.postType,S.canvasSize]);

  const sz=CANVAS_SIZES[S.canvasSize];
  const cW=Math.round(zoom*sz.w);
  const cH=Math.round(zoom*sz.h);
  const hasScore=["fulltime","halftime","goal","motm"].includes(S.postType);
  const hasMOTM =S.postType==="motm";

  return (
    <div className="flex flex-col h-screen overflow-hidden text-white"
      dir="rtl" style={{fontFamily:"'Cairo','Tajawal',sans-serif",background:"#09090f"}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;overflow:hidden}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:3px}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:#e8c84a;cursor:pointer;margin-top:-5px}
        input[type=range]::-webkit-slider-runnable-track{height:3px;border-radius:9999px}
        select option{background:#131320;color:#fff}
      `}</style>

      {/* TOP BAR */}
      <div className="h-11 flex-shrink-0 flex items-center justify-between px-4 gap-3"
        style={{background:"#0d0d1a",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
            style={{background:"#e8c84a"}}>🇴🇲</div>
          <div>
            <div className="text-[13px] font-black leading-none">مصمم دوري عُمانتل</div>
            <div className="text-[8px] tracking-[.14em]" style={{color:"rgba(255,255,255,.25)"}}>OMANTEL LEAGUE POST DESIGNER</div>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg p-1"
          style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)"}}>
          <span className="text-[9px] px-1" style={{color:"rgba(255,255,255,.28)"}}>تكبير</span>
          {[[0.35,"35%"],[0.5,"50%"],[0.65,"65%"],[0.8,"80%"]].map(([z,lbl])=>(
            <button key={z} onClick={()=>setZoom(z)}
              className="px-2 py-0.5 rounded text-[10px] font-bold transition-all"
              style={{background:Math.abs(zoom-z)<0.01?"rgba(232,200,74,.18)":"transparent",
                      color:Math.abs(zoom-z)<0.01?"#e8c84a":"rgba(255,255,255,.35)"}}>
              {lbl}
            </button>
          ))}
          <button onClick={()=>setZoom(calcFit())}
            className="px-2 py-0.5 rounded text-[10px] font-bold"
            style={{color:"rgba(255,255,255,.35)"}}>ملاءمة</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] rounded px-2 py-1 hidden sm:block"
            style={{color:"rgba(255,255,255,.22)",border:"1px solid rgba(255,255,255,.08)"}}>
            {sz.label}
          </span>
          <button onClick={dlPNG} disabled={dl}
            className="flex items-center gap-1.5 font-black border-none rounded-lg px-4 py-1.5 text-[12px] disabled:opacity-50 transition-opacity"
            style={{background:"#e8c84a",color:"#000"}}>
            {dl?"⏳":"⬇️"} {dl?"جاري...":"تصدير PNG"}
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* CANVAS STAGE */}
        <div ref={stageRef}
          className="flex-1 flex items-center justify-center overflow-auto p-5"
          style={{background:"radial-gradient(ellipse at 50% 35%,#14142a 0%,#09090f 100%)"}}>
          <div className="flex flex-col items-center gap-3">
            <div className="text-[9px] tracking-[.2em] uppercase" style={{color:"rgba(255,255,255,.16)"}}>
              Instagram {sz.sub} · {sz.label}
            </div>
            <div style={{width:cW,height:cH,flexShrink:0,borderRadius:12,overflow:"hidden",
              boxShadow:"0 0 0 1px rgba(255,255,255,.08),0 32px 100px rgba(0,0,0,.9)"}}>
              <canvas ref={canvasRef} style={{display:"block",width:cW,height:cH}}/>
            </div>
            <div className="flex items-center gap-2">
              {[
                {ar:S.hNameAr,e:Object.values(CLUBS).find(c=>c.ar===S.hNameAr)?.e||"⚽"},
                null,
                {ar:S.aNameAr,e:Object.values(CLUBS).find(c=>c.ar===S.aNameAr)?.e||"🦁"},
              ].map((item,i)=>item?(
                <div key={i} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)"}}>
                  {item.e} {item.ar}
                </div>
              ):(
                <span key={i} className="text-[9px]" style={{color:"rgba(255,255,255,.16)"}}>◆</span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[268px] flex-shrink-0 overflow-y-auto"
          style={{background:"#0d0d1a",borderRight:"1px solid rgba(255,255,255,.07)"}}>

          <Accordion title="نوع البوست" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-1.5 mt-0.5">
              {POST_TYPES.map(pt=>(
                <button key={pt.id}
                  onClick={()=>{U("postType",pt.id);U("title",pt.ar);}}
                  className="py-2 px-2 rounded border text-[11px] font-bold transition-all leading-tight text-center"
                  style={{
                    background:S.postType===pt.id?"#e8c84a":"rgba(255,255,255,.04)",
                    borderColor:S.postType===pt.id?"#e8c84a":"rgba(255,255,255,.09)",
                    color:S.postType===pt.id?"#000":"rgba(255,255,255,.45)"
                  }}>
                  {pt.ar}
                </button>
              ))}
            </div>
          </Accordion>

          <Accordion title="حجم الكانفاس">
            <div className="grid grid-cols-3 gap-1.5 mt-0.5">
              {Object.entries(CANVAS_SIZES).map(([k,v])=>(
                <button key={k}
                  onClick={()=>{U("canvasSize",k);setTimeout(()=>setZoom(calcFit()),50);}}
                  className="py-2 rounded border text-center transition-all"
                  style={{
                    background:S.canvasSize===k?"rgba(232,200,74,.12)":"rgba(255,255,255,.04)",
                    borderColor:S.canvasSize===k?"#e8c84a":"rgba(255,255,255,.09)",
                  }}>
                  <div className="text-[10px] font-bold"
                    style={{color:S.canvasSize===k?"#e8c84a":"rgba(255,255,255,.5)"}}>{v.sub}</div>
                  <div className="text-[8px]" style={{color:"rgba(255,255,255,.22)"}}>{v.label}</div>
                </button>
              ))}
            </div>
          </Accordion>

          <Accordion title="تفاصيل المباراة" defaultOpen={true}>
            <div className="mt-0.5 space-y-0">
              <F label="البطولة (عربي)"><Inp value={S.comp}    onChange={v=>U("comp",v)}/></F>
              <F label="البطولة (إنجليزي)"><Inp value={S.compEn} onChange={v=>U("compEn",v)} dir="ltr"/></F>
              <div className="grid grid-cols-2 gap-2">
                <F label="الجولة"><Inp value={S.round} onChange={v=>U("round",v)}/></F>
                <F label="التوقيت"><Inp value={S.time}  onChange={v=>U("time",v)}  dir="ltr"/></F>
              </div>
              <F label="الملعب"><Inp value={S.venue} onChange={v=>U("venue",v)}/></F>
              <F label="التاريخ"><Inp value={S.date}  onChange={v=>U("date",v)}/></F>
              <F label="نص الذيل"><Inp value={S.footer} onChange={v=>U("footer",v)} dir="ltr"/></F>
            </div>
          </Accordion>

          <Accordion title="الفريق المضيف" defaultOpen={true} accent="text-yellow-400/70">
            <div className="mt-0.5">
              <TeamPanel side="h" S={S} U={U} onLogo={e=>loadLogo("h",e)}/>
            </div>
          </Accordion>

          <Accordion title="الفريق الضيف" defaultOpen={true} accent="text-blue-400/70">
            <div className="mt-0.5">
              <TeamPanel side="a" S={S} U={U} onLogo={e=>loadLogo("a",e)}/>
            </div>
          </Accordion>

          {hasScore && (
            <Accordion title="النتيجة والهدافون" defaultOpen={true} accent="text-green-400/70">
              <div className="mt-0.5 space-y-0">
                <div className="grid grid-cols-2 gap-2">
                  <F label="أهداف المضيف"><Inp type="number" min="0" max="20" value={S.hScore} onChange={v=>U("hScore",v)} dir="ltr"/></F>
                  <F label="أهداف الضيف"> <Inp type="number" min="0" max="20" value={S.aScore} onChange={v=>U("aScore",v)} dir="ltr"/></F>
                </div>
                <F label="الهدافون"><Tx value={S.scorers} onChange={v=>U("scorers",v)}/></F>
                {hasMOTM&&<F label="رجل المباراة"><Inp value={S.motmName} onChange={v=>U("motmName",v)}/></F>}
                <SliderRow label="حجم النتيجة" value={S.scoreSize||160} onChange={v=>U("scoreSize",v)} min={80} max={220} unit="px"/>
              </div>
            </Accordion>
          )}

          <Accordion title="الخلفية">
            <div className="mt-0.5">
              <BgPanel S={S} U={U} onBgLoad={loadBg} onBgRemove={removeBg}/>
            </div>
          </Accordion>

          <Accordion title="إعدادات التصميم">
            <div className="mt-0.5 space-y-0">
              <F label="لون التمييز"><ColPick value={S.accent} onChange={v=>U("accent",v)}/></F>
              <div className="mt-1.5 space-y-0">
                <Tog value={S.showAr}       onChange={v=>U("showAr",v)}       label="الأسماء العربية"/>
                <Tog value={S.showEn}       onChange={v=>U("showEn",v)}       label="الأسماء الإنجليزية"/>
                <Tog value={S.showDate}     onChange={v=>U("showDate",v)}     label="إظهار التاريخ"/>
                <Tog value={S.showBranding} onChange={v=>U("showBranding",v)} label="شريط الذيل"/>
                <Tog value={S.showStats}    onChange={v=>U("showStats",v)}    label="الإحصائيات"/>
                <Tog value={S.showSponsor}  onChange={v=>U("showSponsor",v)}  label="شارة البطولة"/>
              </div>
            </div>
          </Accordion>

          <Accordion title="التصدير" defaultOpen={true}>
            <div className="mt-0.5">
              <button onClick={dlPNG} disabled={dl}
                className="w-full font-black rounded-lg py-2.5 text-[13px] disabled:opacity-50 transition-opacity mb-1.5"
                style={{background:"#e8c84a",color:"#000"}}>
                {dl?"⏳ جاري...":"⬇️ تحميل PNG — "+sz.label}
              </button>
              <p className="text-[9px] text-center leading-relaxed" style={{color:"rgba(255,255,255,.18)"}}>
                {sz.w}×{sz.h} بكسل · جودة كاملة للنشر
              </p>
            </div>
          </Accordion>

        </aside>
      </div>
    </div>
  );
}
