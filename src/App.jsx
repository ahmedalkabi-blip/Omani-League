import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════════════════ */
/* Jindal League 2026-2027 — 14 clubs
   logo field = path under /public; auto-loaded when club selected.
   Drop PNG files into public/logos/clubs/ to activate them.         */
const CLUBS = {
  nahda:    { ar:"النهضة",  en:"AL-NAHDA",    slug:"al-nahda",    logo:"/logos/clubs/al-nahda.png",    p:"#b50000", s:"#f0d000", e:"🔴" },
  nasr:     { ar:"النصر",   en:"AL-NASR",     slug:"al-nasr",     logo:"/logos/clubs/al-nasr.png",     p:"#002e99", s:"#f5c800", e:"⭐" },
  shabab:   { ar:"الشباب",  en:"AL-SHABAB",   slug:"al-shabab",   logo:"/logos/clubs/al-shabab.png",   p:"#1a1a1a", s:"#f5c800", e:"🟡" },
  seeb:     { ar:"السيب",   en:"AL-SEEB",     slug:"al-seeb",     logo:"/logos/clubs/al-seeb.png",     p:"#1a3a6e", s:"#c8a84b", e:"⚽" },
  sur:      { ar:"صور",     en:"SUR",         slug:"sur",         logo:"/logos/clubs/sur.png",         p:"#6a3300", s:"#ffbb00", e:"🟠" },
  sohar:    { ar:"صحار",    en:"SOHAR",       slug:"sohar",       logo:"/logos/clubs/sohar.png",       p:"#004faa", s:"#f0a000", e:"💙" },
  oman:     { ar:"عُمان",   en:"OMAN CLUB",   slug:"oman-club",   logo:"/logos/clubs/oman-club.png",   p:"#a00000", s:"#008800", e:"🇴🇲" },
  bahla:    { ar:"بهلاء",   en:"BAHLA",       slug:"bahla",       logo:"/logos/clubs/bahla.png",       p:"#1a1a5e", s:"#d4aa50", e:"🔵" },
  ibri:     { ar:"عبري",    en:"IBRI",        slug:"ibri",        logo:"/logos/clubs/ibri.png",        p:"#003399", s:"#f0f0f0", e:"🏔️" },
  saham:    { ar:"صحم",     en:"SAHAM",       slug:"saham",       logo:"/logos/clubs/saham.png",       p:"#006633", s:"#f0f0f0", e:"🌊" },
  samail:   { ar:"سمائل",   en:"SAMAIL",      slug:"samail",      logo:"/logos/clubs/samail.png",      p:"#cc0000", s:"#f0f0f0", e:"🔶" },
  dhofar:   { ar:"ظفار",    en:"DHOFAR",      slug:"dhofar",      logo:"/logos/clubs/dhofar.png",      p:"#005c2b", s:"#f5c800", e:"🦁" },
  fanja:    { ar:"فنجاء",   en:"FANJA",       slug:"fanja",       logo:"/logos/clubs/fanja.png",       p:"#004488", s:"#f0d000", e:"🟣" },
  musannah: { ar:"المصنعة", en:"AL-MUSANNAH", slug:"al-musannah", logo:"/logos/clubs/al-musannah.png", p:"#8b0000", s:"#f0c030", e:"🔺" },
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
  scorers:"أحمد الكندي 23'",
  aScorers:"سالم البلوشي 67'",
  motmName:"أحمد الكندي",
  accent:"#e8c84a",
  showDate:true, showBranding:true, showStats:false,
  showSocial:true, showSponsor:true, showAr:true, showEn:true,
  bgOverlay:0.45, bgBlur:0, bgBrightness:95, bgScale:100,
  bgPosX:50, bgPosY:30, bgFit:"cover",
  bgImage:null, scoreSize:160, bgGradient:"strong",
  goalScorerName:"أحمد الكندي", goalMinute:"23", goalShirtNumber:"10",
  goalScoringTeam:"h",
  goalBgColor:"#cc1111", goalTitleColor:"#ffffff",
  goalLabelBg:"#e8c84a",  goalLabelColor:"#000000",
};

/* ═══════════════════════════════════════════════════════════════════════════
   DRAW ENGINE
═══════════════════════════════════════════════════════════════════════════ */
const R = x => Math.round(x);

/* Return the tight bounding box of non-transparent pixels.
   Result is cached on img._tight so the offscreen read runs once per load. */
function getLogoTightBounds(img) {
  if (img._tight) return img._tight;
  const iw = img.naturalWidth || img.width || 1;
  const ih = img.naturalHeight || img.height || 1;
  try {
    const oc = document.createElement("canvas");
    oc.width = iw; oc.height = ih;
    const oc2d = oc.getContext("2d", { willReadFrequently: true });
    oc2d.drawImage(img, 0, 0);
    const { data } = oc2d.getImageData(0, 0, iw, ih);
    let x0 = iw, y0 = ih, x1 = 0, y1 = 0;
    for (let y = 0; y < ih; y++) {
      for (let x = 0; x < iw; x++) {
        if (data[(y * iw + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    const bounds = x1 > x0 && y1 > y0
      ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
      : { x: 0,  y: 0,  w: iw,           h: ih           };
    img._tight = bounds;
    return bounds;
  } catch (_) {
    const bounds = { x: 0, y: 0, w: iw, h: ih };
    img._tight = bounds;
    return bounds;
  }
}

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
    /* ── Outer glow — identical strength for every club ── */
    ctx.save();
    ctx.shadowColor = ringColor; ctx.shadowBlur = 20; ctx.globalAlpha = 0.22;
    circ(cx, cy, r + 2, ringColor, null);
    ctx.restore();

    /* ── Club-colour accent ring ── */
    circ(cx, cy, r + 3, ringColor2 || ringColor, null);   // solid fill to r+3
    circ(cx, cy, r - 1, "#09090f",              null);    // dark gap → ring width = 4px

    /* ── Neutral off-white badge face — same for every club ── */
    const face = r - 3;                                   // 2px shadow gap inside ring
    circ(cx, cy, face, "rgba(242,242,240,1)", null);

    if (img) {
      /* Contain: scale tight content to 76% of face diameter — no stretch, no padding bias */
      const innerD = R(face * 0.76) * 2;
      const tb = getLogoTightBounds(img);
      const scale = Math.min(innerD / tb.w, innerD / tb.h);
      const dw = R(tb.w * scale), dh = R(tb.h * scale);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, face - 1, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, tb.x, tb.y, tb.w, tb.h, R(cx - dw / 2), R(cy - dh / 2), dw, dh);
      ctx.restore();
    }
    // No emoji fallback — badge face stays blank when no logo image is loaded
  }

  return { txt, txtStroke, rrect, circ, line, hexPattern, darken, drawBackground, drawLogo };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED LAYOUT HELPERS
═══════════════════════════════════════════════════════════════════════════ */
function getClub(S, side) {
  const match = Object.values(CLUBS).find(c => c.ar === S[`${side}NameAr`]);
  return {
    ar:    S[`${side}NameAr`],
    en:    S[`${side}NameEn`],
    p:     S[`${side}Primary`],
    s:     S[`${side}Secondary`],
    emoji: match?.e    || (side === "h" ? "⚽" : "🦁"),
    slug:  match?.slug || null,
    logo:  match?.logo || null,
  };
}

function drawTopStrip(e, S, W, ctx) {
  if (S.showDate) {
    ctx.save();
    ctx.shadowColor   = "rgba(0,0,0,.75)";
    ctx.shadowBlur    = 12;
    ctx.shadowOffsetY = 2;
    e.txt(String(S.date).toUpperCase(), 44, 48, 18, "rgba(255,255,255,.95)", "700", "left");
    ctx.restore();
  }
  if (S.showSponsor) {
    ctx.save();
    ctx.shadowColor   = "rgba(0,0,0,.75)";
    ctx.shadowBlur    = 12;
    ctx.shadowOffsetY = 2;
    e.txt(S.compEn, W - 44, 48, 15, "rgba(255,255,255,.70)", "600", "right");
    ctx.restore();
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
  drawTopStrip(e,S,W,ctx);

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
  const sz = CANVAS_SIZES[S.canvasSize], W = sz.w, H = sz.h;
  const e  = createEngine(ctx, W, H);

  /* Background only — no extra overlay added here; user controls darkness */
  e.drawBackground(S, bgImg);
  drawTopStrip(e, S, W, ctx);

  /* ── League / comp name ── */
  const leagueY = yAt(H, 0.575);
  e.txt(S.comp, W/2, leagueY, 15, "rgba(255,255,255,0.40)", "600", "center", W * 0.55);

  /* ── FULL TIME badge ── */
  const ftY = leagueY + R(H * 0.040);
  e.rrect(W/2 - 82, ftY - 13, 164, 26, 4, S.accent, null);
  e.txt("FULL TIME", W/2, ftY, 13, "#000", "900");
  if (S.date) e.txt(S.date, W/2, ftY + 21, 13, "rgba(255,255,255,0.28)", "500");

  /* ── Logos + Score row ── */
  const LR   = R(W * 0.072);
  const hX   = R(W * 0.175);
  const aX   = R(W * 0.825);
  const rowY = ftY + R(H * 0.043) + LR;

  const hc = getClub(S, "h"), ac = getClub(S, "a");
  e.drawLogo(hImg, hc.emoji, hX, rowY, LR, hc.p, hc.s);
  e.drawLogo(aImg, ac.emoji, aX, rowY, LR, ac.p, ac.s);

  /* Score: large digits with a plain long dash — no accent box */
  const ss  = parseInt(S.scoreSize) || 160;
  const gap = R(ss * 0.68);
  e.txtStroke(S.hScore || "0", W/2 - gap, rowY, ss, "#fff", "rgba(0,0,0,.45)", "900");
  e.txt("—", W/2, rowY, R(ss * 0.30), "rgba(255,255,255,0.50)", "700");
  e.txtStroke(S.aScore || "0", W/2 + gap, rowY, ss, "#fff", "rgba(0,0,0,.45)", "900");

  /* ── Team names ── */
  const nY = rowY + LR + 18;
  if (S.showAr) {
    e.txt(hc.ar, hX, nY,     28, "rgba(0,0,0,.45)", "900", "center", W * 0.27);
    e.txt(hc.ar, hX, nY - 1, 28, "#fff",            "900", "center", W * 0.27);
    e.txt(ac.ar, aX, nY,     28, "rgba(0,0,0,.45)", "900", "center", W * 0.27);
    e.txt(ac.ar, aX, nY - 1, 28, "#fff",            "900", "center", W * 0.27);
  }
  if (S.showEn) {
    const enY = nY + (S.showAr ? 34 : 0);
    e.txt(hc.en, hX, enY, 12, "rgba(255,255,255,.28)", "600", "center", W * 0.24);
    e.txt(ac.en, aX, enY, 12, "rgba(255,255,255,.28)", "600", "center", W * 0.24);
  }

  /* ── SCORERS — home list left, away list right ── */
  const hLines = (S.scorers   || "").split(/\n/).map(l => l.trim()).filter(Boolean);
  const aLines = (S.aScorers  || "").split(/\n/).map(l => l.trim()).filter(Boolean);
  const nameEndY = nY + (S.showAr ? 36 : 10) + (S.showEn ? 20 : 0);
  const scY      = Math.max(nameEndY + 14, yAt(H, 0.836));
  hLines.forEach((ln, i) =>
    e.txt("⚽ " + ln, hX, scY + i * 26, 15, "rgba(255,255,255,.60)", "600", "center", W * 0.34)
  );
  aLines.forEach((ln, i) =>
    e.txt("⚽ " + ln, aX, scY + i * 26, 15, "rgba(255,255,255,.60)", "600", "center", W * 0.34)
  );

  /* ── Venue + Round — single dim line near bottom ── */
  const maxSc   = Math.max(hLines.length, aLines.length);
  const scEndY  = maxSc > 0 ? scY + (maxSc - 1) * 26 + 20 : scY;
  const infoY   = Math.min(Math.max(scEndY + 18, yAt(H, 0.905)), H - 110);
  const infoParts = [S.venue && "📍 " + S.venue, S.round && "🏆 " + S.round].filter(Boolean);
  if (infoParts.length)
    e.txt(infoParts.join("   ·   "), W/2, infoY, 15,
          "rgba(255,255,255,.28)", "600", "center", W - 160);

  drawFooter(e, S, W, H, hImg, aImg);
}

function renderHalftime(ctx, S, hImg, aImg, bgImg) {
  const sz = CANVAS_SIZES[S.canvasSize], W = sz.w, H = sz.h;
  const e  = createEngine(ctx, W, H);
  e.drawBackground(S, bgImg);
  drawTopStrip(e, S, W, ctx);

  const { hX, aX, botY } = logoRow(W, H);
  const LR = R(W * 0.058);          // slightly smaller than other templates
  drawBottomOverlay(ctx, S, W, H, botY);

  /* Small, clean HALF TIME badge — no comp pill above it */
  const badgeW = 200, badgeH = 36, badgeY = yAt(H, 0.615);
  e.rrect(W/2 - badgeW/2, badgeY - R(badgeH/2), badgeW, badgeH, 18, S.accent, null);
  e.txt("HALF TIME", W/2, badgeY, 18, "#000", "900");

  /* Logo + score row */
  const rowY = yAt(H, 0.718);

  /* Helper: draw team name block for halftime (tighter, lighter) */
  function htName(cx, club) {
    const ny = rowY + LR + 14;
    if (S.showAr) {
      e.txt(club.ar, cx, ny,     30, "rgba(0,0,0,.4)", "900", "center", W * 0.27);
      e.txt(club.ar, cx, ny - 1, 30, "#fff",           "900", "center", W * 0.27);
    }
    if (S.showEn) {
      e.txt(club.en, cx, ny + (S.showAr ? 34 : 0), 12,
            "rgba(255,255,255,.32)", "600", "center", W * 0.24);
    }
    e.rrect(cx - 28, ny + (S.showAr ? 24 : 6), 56, 2, 1, club.s, null);
  }

  const hClub = getClub(S, "h");
  const aClub = getClub(S, "a");
  e.drawLogo(hImg, hClub.emoji, hX, rowY, LR, hClub.p, hClub.s);
  e.drawLogo(aImg, aClub.emoji, aX, rowY, LR, aClub.p, aClub.s);
  htName(hX, hClub);
  htName(aX, aClub);

  /* Score — 85 % of user's slider so it reads lighter than Full Time */
  const ss  = R((parseInt(S.scoreSize) || 130) * 0.85);
  const gap = R(ss * 0.68);
  e.txtStroke(S.hScore || "0", W/2 - gap, rowY, ss, "#fff", "rgba(0,0,0,.55)", "900");
  const cbw = 40, cbh = R(ss * 0.55);
  e.rrect(W/2 - cbw/2, rowY - R(cbh/2), cbw, cbh, 5, S.accent, null);
  e.txt("—", W/2, rowY, R(ss * 0.28), "#000", "900");
  e.txtStroke(S.aScore || "0", W/2 + gap, rowY, ss, "#fff", "rgba(0,0,0,.55)", "900");

  /* 45' pill — small, borderline, no solid fill */
  const pillY = rowY + 58;
  e.rrect(W/2 - 44, pillY - 14, 88, 28, 14, "rgba(0,0,0,.42)", S.accent + "55", 1);
  e.txt("45'", W/2, pillY, 15, S.accent, "700");

  /* Single thin info line — venue · round, no heavy boxes */
  const infoY = yAt(H, 0.885);
  e.line(60, infoY - 12, W - 60, infoY - 12, "rgba(255,255,255,.06)", 1);
  const infoParts = [S.venue && "📍 "+S.venue, S.round && "🏆 "+S.round].filter(Boolean);
  e.txt(infoParts.join("   ·   "), W/2, infoY + 6, 17,
        "rgba(255,255,255,.42)", "600", "center", W - 120);

  drawFooter(e, S, W, H, hImg, aImg);
}

function renderNextMatch(ctx, S, hImg, aImg, bgImg) {
  const sz=CANVAS_SIZES[S.canvasSize], W=sz.w, H=sz.h;
  const e=createEngine(ctx,W,H);
  e.drawBackground(S,bgImg);
  drawTopStrip(e,S,W,ctx);

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

function renderGoal(ctx, S, hImg, aImg, bgImg, goalPlayerImg) {
  const sz  = CANVAS_SIZES[S.canvasSize], W = sz.w, H = sz.h;
  const e   = createEngine(ctx, W, H);
  const bgCol    = S.goalBgColor    || "#cc1111";
  const titleCol = S.goalTitleColor || "#ffffff";
  const labelBg  = S.goalLabelBg   || "#e8c84a";
  const labelCol = S.goalLabelColor || "#000000";
  const side     = S.goalScoringTeam || "h";
  const clubImg  = side === "h" ? hImg : aImg;
  const club     = getClub(S, side);

  /* ── 1. SOLID BACKGROUND ─────────────────────────────────────────── */
  ctx.fillStyle = bgCol;
  ctx.fillRect(0, 0, W, H);

  /* ── 2. RADIAL BURST — speed lines from upper-center ────────────── */
  const burstCX = W / 2, burstCY = H * 0.36;
  const lineCount = 32;
  ctx.save();
  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * Math.PI * 2;
    const len   = Math.max(W, H) * 1.5;
    const lw    = i % 2 === 0 ? W * 0.018 : W * 0.007;
    ctx.beginPath();
    ctx.moveTo(burstCX, burstCY);
    ctx.lineTo(burstCX + Math.cos(angle) * len, burstCY + Math.sin(angle) * len);
    ctx.strokeStyle = titleCol;
    ctx.globalAlpha  = i % 2 === 0 ? 0.055 : 0.028;
    ctx.lineWidth    = R(lw);
    ctx.stroke();
  }
  ctx.restore();

  /* ── 3. BACKGROUND "GOAL" TYPOGRAPHY — strong typographic wallpaper ── */
  const gFontSz = R(W * 0.31);
  ctx.save();
  ctx.font = `900 italic ${gFontSz}px 'Cairo','Tajawal',sans-serif`;
  ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.direction = "ltr";
  const measW  = ctx.measureText("GOAL").width || (gFontSz * 3.2);
  const scaleX = (W * 1.04) / measW;
  const rowH   = H * 0.165;
  const rows   = Math.ceil(H / rowH) + 2;
  ctx.fillStyle = titleCol;
  for (let i = 0; i < rows; i++) {
    ctx.save();
    ctx.globalAlpha = i % 2 === 0 ? 0.38 : 0.20;
    ctx.scale(scaleX, 1);
    ctx.fillText("GOAL", (-W * 0.02) / scaleX, H * 0.04 + i * rowH);
    ctx.restore();
  }
  ctx.restore();

  /* ── 4. DYNAMIC DIAGONAL STRIPE GROUPS (each edge) ──────────────── */
  const drawStripe = (x1, y1, x2, y2, col, alpha, lw) => {
    ctx.save();
    ctx.strokeStyle = col; ctx.globalAlpha = alpha;
    ctx.lineWidth = R(lw); ctx.lineCap = "butt";
    ctx.beginPath(); ctx.moveTo(R(x1), R(y1)); ctx.lineTo(R(x2), R(y2));
    ctx.stroke(); ctx.restore();
  };
  // Left edge — 5 stripes fanning inward
  const leftStripes = [
    [0, H*0.28, W*0.28, H*0.54],
    [0, H*0.33, W*0.22, H*0.58],
    [0, H*0.38, W*0.16, H*0.62],
    [0, H*0.43, W*0.10, H*0.65],
    [0, H*0.48, W*0.05, H*0.68],
  ];
  // Right edge — mirror
  const rightStripes = leftStripes.map(([,y1,,y2]) => [W, y1, W*0.72, y2]);
  [...leftStripes, ...rightStripes].forEach(([x1,y1,x2,y2], idx) => {
    drawStripe(x1, y1, x2, y2, labelBg, idx < 3 ? 0.70 : 0.40, W * (idx < 2 ? 0.0055 : 0.0035));
  });
  // Thin white echo stripes slightly offset
  leftStripes.slice(0, 3).forEach(([x1,y1,x2,y2]) => {
    drawStripe(x1, y1 - H*0.018, x2, y2 - H*0.018, titleCol, 0.30, W * 0.0018);
  });
  rightStripes.slice(0, 3).forEach(([x1,y1,x2,y2]) => {
    drawStripe(x1, y1 - H*0.018, x2, y2 - H*0.018, titleCol, 0.30, W * 0.0018);
  });

  /* ── 5. PLAYER IMAGE — hero element, edge-blended into bg ───────── */
  if (goalPlayerImg) {
    const ph = R(H * 0.88);
    const ps = ph / (goalPlayerImg.naturalHeight || 1);
    const pw = R((goalPlayerImg.naturalWidth || 1) * ps);
    const px = R((W - pw) / 2);
    const py = R(H * 0.04);

    ctx.drawImage(goalPlayerImg, px, py, pw, ph);

    // Left edge fade: bgCol → transparent over inner 36% of image width
    const blendW = R(pw * 0.36);
    const lGrad = ctx.createLinearGradient(px, 0, px + blendW, 0);
    lGrad.addColorStop(0,   bgCol);
    lGrad.addColorStop(0.6, bgCol + "88");
    lGrad.addColorStop(1,   bgCol + "00");
    ctx.fillStyle = lGrad;
    ctx.fillRect(px, py, blendW, ph);

    // Right edge fade
    const rGrad = ctx.createLinearGradient(px + pw - blendW, 0, px + pw, 0);
    rGrad.addColorStop(0,   bgCol + "00");
    rGrad.addColorStop(0.4, bgCol + "88");
    rGrad.addColorStop(1,   bgCol);
    ctx.fillStyle = rGrad;
    ctx.fillRect(px + pw - blendW, py, blendW, ph);

    // Top edge fade
    const topH = R(ph * 0.12);
    const tGrad = ctx.createLinearGradient(0, py, 0, py + topH);
    tGrad.addColorStop(0, bgCol);
    tGrad.addColorStop(1, bgCol + "00");
    ctx.fillStyle = tGrad;
    ctx.fillRect(px, py, pw, topH);
  } else {
    // Placeholder silhouette
    const pR = R(W * 0.16);
    const pCY = R(H * 0.38);
    e.circ(W / 2, pCY, pR, `${titleCol}11`, `${titleCol}33`, R(W * 0.004));
    ctx.save(); ctx.globalAlpha = 0.40;
    e.txt("⬆ رفع صورة اللاعب", W / 2, pCY, R(W * 0.034), titleCol, "700");
    ctx.restore();
  }

  /* ── 6. BOTTOM DARK OVERLAY ──────────────────────────────────────── */
  const fadeStart = H * 0.50;
  const fade = ctx.createLinearGradient(0, fadeStart, 0, H);
  fade.addColorStop(0,    "rgba(0,0,0,0)");
  fade.addColorStop(0.20, "rgba(0,0,0,.40)");
  fade.addColorStop(0.55, "rgba(0,0,0,.78)");
  fade.addColorStop(0.80, "rgba(0,0,0,.90)");
  fade.addColorStop(1,    "rgba(0,0,0,.96)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, R(fadeStart), W, H - R(fadeStart));

  /* ── 7. BIG "GOAL!" TITLE — moved higher to clear space below ───── */
  const bigSz = R(W * 0.192);
  ctx.save();
  ctx.font = `900 italic ${bigSz}px 'Cairo','Tajawal',sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "ltr";
  ctx.lineWidth   = R(W * 0.013);
  ctx.strokeStyle = labelBg;
  ctx.lineJoin    = "round";
  ctx.strokeText("GOAL!", W / 2, R(H * 0.700));
  ctx.fillStyle = titleCol;
  ctx.fillText("GOAL!", W / 2, R(H * 0.700));
  ctx.restore();

  /* ── 8. SCORER ROW — badge | name pill | minute, centered as group ─ */
  const sNum      = S.goalShirtNumber;
  const scorerStr = S.goalScorerName || "اسم اللاعب";
  const rowCY     = R(H * 0.792);           // well below GOAL! text
  const pillH     = R(H * 0.034);           // ~46 px at 1350 h — compact
  const pPad      = R(pillH * 0.55);

  ctx.save();
  ctx.font = `700 ${R(pillH * 0.50)}px 'Cairo','Tajawal',sans-serif`;
  ctx.direction = "ltr"; ctx.textAlign = "left";
  const nameTextW = ctx.measureText(scorerStr).width;
  ctx.restore();

  const badgeR  = R(pillH * 0.44);         // shirt # circle radius
  const minR    = R(pillH * 0.52);         // minute circle radius
  const elemGap = R(W * 0.022);            // gap between elements

  const pillW  = R(pPad + nameTextW + pPad);
  const hasBadge = !!sNum;
  const groupW = (hasBadge ? 2 * badgeR + elemGap : 0) + pillW + elemGap + 2 * minR;
  let   gx     = R(W / 2 - groupW / 2);

  // — Shirt # badge: small dark circle, gold ring, gold number
  if (hasBadge) {
    const bCX = gx + badgeR;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bCX, rowCY, badgeR + R(W * 0.004), 0, Math.PI * 2);
    ctx.fillStyle = labelBg; ctx.fill();
    ctx.restore();
    e.circ(bCX, rowCY, badgeR, "rgba(0,0,0,.72)", null);
    ctx.save();
    ctx.font = `900 ${R(badgeR * 0.92)}px 'Cairo','Tajawal',sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "ltr";
    ctx.fillStyle = labelBg;
    ctx.fillText(String(sNum), bCX, rowCY);
    ctx.restore();
    gx += 2 * badgeR + elemGap;
  }

  // — Scorer name pill
  const pillX = gx;
  const pillY = R(rowCY - pillH / 2);
  ctx.save();
  ctx.shadowColor   = "rgba(0,0,0,.55)";
  ctx.shadowBlur    = R(W * 0.016);
  ctx.shadowOffsetY = R(H * 0.003);
  e.rrect(pillX, pillY, pillW, pillH, pillH / 2, labelBg, null);
  ctx.restore();
  ctx.save();
  ctx.font = `700 ${R(pillH * 0.50)}px 'Cairo','Tajawal',sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "ltr";
  ctx.fillStyle = labelCol;
  ctx.fillText(scorerStr, R(pillX + pillW / 2), rowCY, pillW - pPad);
  ctx.restore();
  gx += pillW + elemGap;

  // — Minute circle: glow halo + solid circle + text
  const minCX = gx + minR;
  ctx.save();
  ctx.beginPath();
  ctx.arc(minCX, rowCY, minR + R(W * 0.005), 0, Math.PI * 2);
  ctx.fillStyle = `${labelBg}44`; ctx.fill();
  ctx.restore();
  e.circ(minCX, rowCY, minR, titleCol, null);
  e.txt((S.goalMinute || "0") + "'", minCX, rowCY, R(pillH * 0.40), bgCol, "900");

  /* ── 9. CLUB LOGO — centered, slightly smaller, clear gap above ──── */
  const logoR  = R(W * 0.068);             // smaller: was 0.086
  const logoCX = R(W / 2);
  const logoCY = R(H * 0.886);             // 20 px clear gap above logo visual top
  e.circ(logoCX, logoCY, logoR + R(W * 0.010), labelBg, null);        // gold ring
  e.circ(logoCX, logoCY, logoR + R(W * 0.004), "rgba(0,0,0,.70)", null); // dark gap
  e.drawLogo(clubImg, club.emoji, logoCX, logoCY, logoR, club.p, club.s);

  /* ── 10. MATCH SCORE — small pill to the right of logo ──────────── */
  const scoreStr = `${S.hScore || "0"} – ${S.aScore || "0"}`;
  const spH  = R(H * 0.026);
  const spW  = R(W * 0.145);
  const spX  = R(logoCX + logoR + R(W * 0.024));
  e.rrect(spX, R(logoCY - spH / 2), spW, spH, spH / 2,
    "rgba(0,0,0,.42)", `${titleCol}22`, 1);
  e.txt(scoreStr, spX + spW / 2, logoCY, R(spH * 0.48), `${titleCol}60`, "700");

  /* ── 11. TOP STRIP ───────────────────────────────────────────────── */
  if (S.showDate) {
    ctx.save();
    ctx.shadowColor   = "rgba(0,0,0,.80)";
    ctx.shadowBlur    = 12;
    ctx.shadowOffsetY = 2;
    e.txt(String(S.date).toUpperCase(), 44, 48, 18, `${titleCol}f2`, "700", "left");
    ctx.restore();
  }
  if (S.showSponsor) {
    ctx.save();
    ctx.shadowColor   = "rgba(0,0,0,.80)";
    ctx.shadowBlur    = 12;
    ctx.shadowOffsetY = 2;
    e.txt(S.compEn, W - 44, 48, 15, `${titleCol}bb`, "600", "right");
    ctx.restore();
  }

  /* ── 12. FOOTER ───────────────────────────────────────────────────── */
  if (S.showBranding) {
    e.txt(S.footer, W / 2, R(H * 0.960), 14, `${titleCol}44`, "400");
  }
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

  drawTopStrip(e,S,W,ctx);
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
   THEME TOKENS
═══════════════════════════════════════════════════════════════════════════ */
const DARK_T = {
  name:"dark", appBg:"#09090f", topBarBg:"#0d0d1a", sidebarBg:"#0d0d1a",
  stageBg:"radial-gradient(ellipse at 50% 35%,#14142a 0%,#09090f 100%)",
  divider:"rgba(255,255,255,.07)",
  text:"rgba(255,255,255,.88)", textMuted:"rgba(255,255,255,.42)", textFaint:"rgba(255,255,255,.18)",
  secTitle:"rgba(255,255,255,.40)", secHover:"rgba(255,255,255,.025)",
  inputBg:"rgba(255,255,255,.06)", inputBorder:"rgba(255,255,255,.10)",
  inputText:"rgba(255,255,255,.85)", inputFocus:"rgba(232,200,74,.40)",
  accent:"#e8c84a", accentFg:"#000", accentBg:"rgba(232,200,74,.12)",
  btnBg:"rgba(255,255,255,.04)", btnBorder:"rgba(255,255,255,.09)", btnText:"rgba(255,255,255,.45)",
  togOn:"#e8c84a", togOff:"rgba(255,255,255,.15)",
  scrollbar:"rgba(255,255,255,.12)", selectOpt:"#131320",
  stageLabel:"rgba(255,255,255,.16)", stagePill:"rgba(255,255,255,.05)", stagePillBorder:"rgba(255,255,255,.08)",
};
const LIGHT_T = {
  name:"light", appBg:"#f0f1f5", topBarBg:"#ffffff", sidebarBg:"#ffffff",
  stageBg:"#dde1e7",
  divider:"rgba(0,0,0,.08)",
  text:"#1f2937", textMuted:"#6b7280", textFaint:"#9ca3af",
  secTitle:"#374151", secHover:"rgba(0,0,0,.025)",
  inputBg:"#f9fafb", inputBorder:"rgba(0,0,0,.12)",
  inputText:"#1f2937", inputFocus:"rgba(13,148,136,.40)",
  accent:"#0d9488", accentFg:"#fff", accentBg:"rgba(13,148,136,.08)",
  btnBg:"#f3f4f6", btnBorder:"rgba(0,0,0,.10)", btnText:"#4b5563",
  togOn:"#0d9488", togOff:"rgba(0,0,0,.15)",
  scrollbar:"rgba(0,0,0,.15)", selectOpt:"#ffffff",
  stageLabel:"rgba(0,0,0,.28)", stagePill:"rgba(0,0,0,.04)", stagePillBorder:"rgba(0,0,0,.08)",
};
const ThemeCtx = createContext(DARK_T);
const useTh = () => useContext(ThemeCtx);

/* ═══════════════════════════════════════════════════════════════════════════
   UI ATOMS
═══════════════════════════════════════════════════════════════════════════ */
function Lbl({children}) {
  const T = useTh();
  return <label style={{display:"block",fontSize:10,color:T.textMuted,marginBottom:4,textAlign:"right",letterSpacing:".04em"}}>{children}</label>;
}
function Inp({value,onChange,placeholder,type="text",min,max,dir="rtl"}) {
  const T = useTh();
  return (
    <input type={type} value={value} placeholder={placeholder} min={min} max={max} dir={dir}
      onChange={e=>onChange(e.target.value)}
      style={{
        width:"100%",background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:6,
        padding:"6px 10px",fontSize:12,color:T.inputText,outline:"none",transition:"border-color .15s",
        fontFamily:"inherit",
      }}
      onFocus={e=>e.target.style.borderColor=T.inputFocus}
      onBlur={e=>e.target.style.borderColor=T.inputBorder}
    />
  );
}
function Sel({value,onChange,children}) {
  const T = useTh();
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} dir="rtl"
      style={{
        width:"100%",background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:6,
        padding:"6px 10px",fontSize:12,color:T.inputText,outline:"none",cursor:"pointer",
        appearance:"none",fontFamily:"inherit",
      }}>
      {children}
    </select>
  );
}
function Tx({value,onChange,rows=2}) {
  const T = useTh();
  return (
    <textarea value={value} rows={rows} dir="rtl" onChange={e=>onChange(e.target.value)}
      style={{
        width:"100%",background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:6,
        padding:"6px 10px",fontSize:12,color:T.inputText,outline:"none",resize:"none",
        transition:"border-color .15s",fontFamily:"inherit",
      }}
      onFocus={e=>e.target.style.borderColor=T.inputFocus}
      onBlur={e=>e.target.style.borderColor=T.inputBorder}
    />
  );
}
function ColPick({value,onChange,label}) {
  const T = useTh();
  return (
    <div>
      {label&&<Lbl>{label}</Lbl>}
      <div style={{display:"flex",gap:6}}>
        <input type="color" value={value} onChange={e=>onChange(e.target.value)}
          style={{width:32,height:28,borderRadius:5,border:`1px solid ${T.inputBorder}`,cursor:"pointer",background:"transparent",padding:2,flexShrink:0}} />
        <input type="text" value={value} dir="ltr" onChange={e=>onChange(e.target.value)}
          style={{
            flex:1,background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:6,
            padding:"4px 8px",fontSize:11,color:T.textMuted,outline:"none",fontFamily:"monospace",
          }} />
      </div>
    </div>
  );
}
function Tog({value,onChange,label}) {
  const T = useTh();
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0"}}>
      <span style={{fontSize:11,color:T.textMuted}}>{label}</span>
      <button onClick={()=>onChange(!value)} style={{
        position:"relative",width:36,height:20,borderRadius:999,flexShrink:0,cursor:"pointer",
        background:value?T.togOn:T.togOff,border:"none",transition:"background .2s",
      }}>
        <span style={{
          position:"absolute",top:2,width:16,height:16,borderRadius:"50%",background:"#fff",
          boxShadow:"0 1px 3px rgba(0,0,0,.3)",transition:"all .2s",
          [value?"right":"left"]:2,
        }}/>
      </button>
    </div>
  );
}
function SliderRow({label,value,onChange,min=0,max=100,unit="",step=1}) {
  const T = useTh();
  const pct = ((value-min)/(max-min))*100;
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:10,color:T.textMuted}}>{label}</span>
        <span style={{fontSize:10,color:T.text,fontWeight:600}}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))}
        style={{
          width:"100%",height:3,borderRadius:999,cursor:"pointer",appearance:"none",outline:"none",
          background:`linear-gradient(90deg,${T.accent} ${pct}%,${T.inputBorder} 0%)`,
        }}
      />
    </div>
  );
}
function F({label,children}) {
  return <div style={{marginBottom:8}}>{label&&<Lbl>{label}</Lbl>}{children}</div>;
}

function Accordion({title,defaultOpen=false,children,accentColor,badge}) {
  const [open,setOpen] = useState(defaultOpen);
  const T = useTh();
  return (
    <div style={{borderBottom:`1px solid ${T.divider}`}}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",
        transition:"background .15s",
      }}
      onMouseOver={e=>e.currentTarget.style.background=T.secHover}
      onMouseOut={e=>e.currentTarget.style.background="transparent"}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:accentColor||T.secTitle}}>{title}</span>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {badge && <span style={{fontSize:9,padding:"1px 6px",borderRadius:999,background:T.accentBg,color:T.accent,fontWeight:700}}>{badge}</span>}
          <span style={{fontSize:8,color:T.textFaint,transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s",display:"inline-block"}}>▼</span>
        </div>
      </button>
      {open && <div style={{padding:"4px 14px 12px"}}>{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLUB LOGO IMAGE — sidebar use only (canvas uses drawLogo in the engine)
═══════════════════════════════════════════════════════════════════════════ */
function ClubLogoImg({ src, alt, size = 32 }) {
  const [err, setErr] = useState(false);
  const inner = Math.round(size * 0.80);  // 20 % padding inside the box
  if (!src || err) {
    // No logo available — render a neutral placeholder circle, no emoji
    return (
      <span style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        width:size, height:size,
        borderRadius:"50%", background:"rgba(128,128,128,.18)",
        flexShrink:0,
      }}/>
    );
  }
  return (
    <span style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      width:size, height:size,
    }}>
      <img
        src={src} alt={alt}
        style={{maxWidth:inner, maxHeight:inner, objectFit:"contain", display:"block"}}
        onError={() => setErr(true)}
      />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEAM PANEL
═══════════════════════════════════════════════════════════════════════════ */
function TeamPanel({side, S, U, onLogo, onClubLogo}) {
  const T   = useTh();
  const isH = side === "h";
  const p   = side;
  const active = S[`${p}NameAr`];
  const selAccent = isH ? "#e8c84a" : "#60a5fa";
  const selBg     = isH ? "rgba(232,200,74,.10)" : "rgba(96,165,250,.10)";

  function applyClub(c) {
    U(`${p}NameAr`, c.ar); U(`${p}NameEn`, c.en);
    U(`${p}Primary`, c.p); U(`${p}Secondary`, c.s);
    if (onClubLogo) onClubLogo(c.logo);
  }

  return (
    <>
      <F label="اختر النادي">
        <Sel value="" onChange={key => {
          if (CLUBS[key]) applyClub(CLUBS[key]);
        }}>
          <option value="">— اختر النادي —</option>
          {Object.entries(CLUBS).map(([k, c]) => (
            <option key={k} value={k}>نادي {c.ar} — {c.en}</option>
          ))}
        </Sel>
      </F>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
        {Object.entries(CLUBS).map(([k, c]) => {
          const on = active === c.ar;
          return (
            <button key={k} title={`نادي ${c.ar}`}
              onClick={() => applyClub(c)}
              style={{
                height:38,padding:2,borderRadius:6,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                border:`1.5px solid ${on?selAccent:T.btnBorder}`,
                background:on?selBg:T.btnBg,
                transition:"all .15s",
              }}>
              <ClubLogoImg src={c.logo} alt={c.ar} size={32}/>
            </button>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <F label="الاسم عربي"><Inp value={S[`${p}NameAr`]} onChange={v=>U(`${p}NameAr`,v)}/></F>
        <F label="الاسم إنجليزي"><Inp value={S[`${p}NameEn`]} onChange={v=>U(`${p}NameEn`,v)} dir="ltr"/></F>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <ColPick label="اللون الأساسي"  value={S[`${p}Primary`]}   onChange={v=>U(`${p}Primary`,v)}/>
        <ColPick label="اللون الثانوي"  value={S[`${p}Secondary`]} onChange={v=>U(`${p}Secondary`,v)}/>
      </div>
      <label style={{
        display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        border:`1.5px dashed ${S[`${p}Logo`]?selAccent:T.inputBorder}`,
        borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:11,
        color:S[`${p}Logo`]?selAccent:T.textFaint,transition:"all .15s",
      }}>
        {S[`${p}Logo`]?"✓ تم رفع الشعار":"⬆️ رفع شعار النادي"}
        <input type="file" accept="image/*" style={{display:"none"}} onChange={onLogo}/>
      </label>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BACKGROUND PANEL
═══════════════════════════════════════════════════════════════════════════ */
function BgPanel({S,U,onBgLoad,onBgRemove}) {
  const T = useTh();
  const gradOpts = [
    { value:"strong", label:"قوي",   desc:"تلاشٍ داكن من المنتصف" },
    { value:"light",  label:"خفيف",  desc:"إظلام خفيف في الأسفل فقط" },
    { value:"none",   label:"بدون",  desc:"بدون طبقة سوداء" },
  ];
  return (
    <>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:10,color:T.textMuted,textAlign:"right",marginBottom:6,letterSpacing:".04em"}}>شدة التدرج</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {gradOpts.map(o=>{
            const on = S.bgGradient === o.value;
            return (
              <button key={o.value} onClick={()=>U("bgGradient",o.value)}
                style={{
                  display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                  padding:"8px 4px",borderRadius:8,border:`1.5px solid ${on?T.accent:T.btnBorder}`,
                  background:on?T.accentBg:T.btnBg,cursor:"pointer",textAlign:"center",transition:"all .15s",
                }}>
                <div style={{
                  width:"100%",height:14,borderRadius:4,overflow:"hidden",
                  background: o.value==="strong"
                    ? "linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.9) 100%)"
                    : o.value==="light"
                    ? "linear-gradient(to bottom,transparent 30%,rgba(0,0,0,.55) 100%)"
                    : "repeating-linear-gradient(45deg,rgba(128,128,128,.2) 0px,rgba(128,128,128,.2) 2px,transparent 2px,transparent 6px)",
                }}/>
                <span style={{fontSize:11,fontWeight:700,color:on?T.accent:T.textMuted,lineHeight:1}}>{o.label}</span>
                <span style={{fontSize:9,color:T.textFaint,lineHeight:1.3,textAlign:"center"}}>{o.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {S.bgImage ? (
        <>
          <div style={{position:"relative",borderRadius:8,overflow:"hidden",marginBottom:10,height:72}}>
            <img src={S.bgImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.6}}/>
            <button onClick={onBgRemove} style={{
              position:"absolute",top:6,right:6,background:"rgba(239,68,68,.85)",color:"#fff",
              border:"none",borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,cursor:"pointer",
            }}>✕ حذف</button>
          </div>
          <SliderRow label="الإظلام"   value={Math.round(S.bgOverlay*100)} onChange={v=>U("bgOverlay",v/100)} min={0} max={100} unit="%"/>
          <SliderRow label="السطوع"    value={S.bgBrightness} onChange={v=>U("bgBrightness",v)} min={20} max={150} unit="%"/>
          <SliderRow label="الضبابية"  value={S.bgBlur}       onChange={v=>U("bgBlur",v)}       min={0} max={20}  unit="px"/>
          <SliderRow label="التكبير"   value={S.bgScale}      onChange={v=>U("bgScale",v)}      min={50} max={200} unit="%"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:4}}>
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
        <label style={{
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,
          border:`2px dashed ${T.inputBorder}`,borderRadius:10,padding:"20px 10px",cursor:"pointer",
          transition:"border-color .15s",
        }}>
          <span style={{fontSize:24}}>🖼️</span>
          <span style={{fontSize:11,color:T.textMuted}}>رفع صورة خلفية</span>
          <span style={{fontSize:9,color:T.textFaint}}>PNG · JPG · WEBP</span>
          <input type="file" accept="image/*" style={{display:"none"}} onChange={onBgLoad}/>
        </label>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGNER (formerly App)
═══════════════════════════════════════════════════════════════════════════ */
const POST_TYPE_ICONS = {matchday:"⚽",fulltime:"🏁",halftime:"⏱️",nextmatch:"📅",goal:"🎯",motm:"⭐"};

function Designer({ onBack, theme, onThemeToggle }) {
  const [S,setS]          = useState({...DEFAULT});
  const [zoom,setZoom]    = useState(0);
  const [hImg,setHImg]    = useState(null);
  const [aImg,setAImg]    = useState(null);
  const [bgImg,setBgImg]  = useState(null);
  const [dl,setDl]        = useState(false);
  const [goalPlayerImg, setGoalPlayerImg] = useState(null);
  const T = theme === "dark" ? DARK_T : LIGHT_T;

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
    (RENDERERS[S.postType]||renderMatchday)(ctx,S,hImg,aImg,bgImg,goalPlayerImg);
  },[S,hImg,aImg,bgImg,goalPlayerImg]);

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

  const loadGoalPlayer = useCallback(e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => { setGoalPlayerImg(img); U("goalPlayerImgUrl", ev.target.result); };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file); e.target.value = "";
  }, [U]);

  const tryLoadClubLogo = useCallback((side, url) => {
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      if (side === "h") { setHImg(img); U("hLogo", url); }
      else              { setAImg(img); U("aLogo", url); }
    };
    img.onerror = () => {};
    img.src = url;
  }, [U]);

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
    <ThemeCtx.Provider value={T}>
    <div dir="rtl" style={{
      fontFamily:"'Cairo','Tajawal',sans-serif",
      display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",
      background:T.appBg,color:T.text,
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;overflow:hidden}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${T.scrollbar};border-radius:4px}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:${T.accent};cursor:pointer;margin-top:-5px}
        input[type=range]::-webkit-slider-runnable-track{height:3px;border-radius:9999px}
        select option{background:${T.selectOpt};color:${T.inputText}}
      `}</style>

      {/* TOP BAR */}
      <div style={{
        height:48,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 16px",gap:12,background:T.topBarBg,borderBottom:`1px solid ${T.divider}`,
      }}>
        {/* Brand */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:14,flexShrink:0,background:T.accent,
          }}>🇴🇲</div>
          <div>
            <div style={{fontSize:13,fontWeight:900,lineHeight:1,color:T.text}}>مصمم دوري عُمانتل</div>
            <div style={{fontSize:8,letterSpacing:".14em",color:T.textFaint}}>OMANTEL LEAGUE POST DESIGNER</div>
          </div>
        </div>

        {/* Zoom controls */}
        <div style={{
          display:"flex",alignItems:"center",gap:2,borderRadius:8,padding:4,
          background:T.btnBg,border:`1px solid ${T.btnBorder}`,
        }}>
          <span style={{fontSize:9,padding:"0 4px",color:T.textFaint}}>تكبير</span>
          {[[0.35,"35%"],[0.5,"50%"],[0.65,"65%"],[0.8,"80%"]].map(([z,lbl])=>{
            const active=Math.abs(zoom-z)<0.01;
            return (
              <button key={z} onClick={()=>setZoom(z)} style={{
                padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",border:"none",
                background:active?T.accentBg:"transparent",
                color:active?T.accent:T.textMuted,transition:"all .15s",
              }}>{lbl}</button>
            );
          })}
          <button onClick={()=>setZoom(calcFit())} style={{
            padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",
            border:"none",background:"transparent",color:T.textMuted,
          }}>ملاءمة</button>
        </div>

        {/* Right actions */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Theme toggle */}
          <button onClick={onThemeToggle} style={{
            display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:8,
            border:`1px solid ${T.divider}`,background:T.btnBg,cursor:"pointer",
            fontSize:10,fontWeight:700,color:T.textMuted,transition:"all .15s",
          }}>
            {theme==="dark"?"☀️ فاتح":"🌙 داكن"}
          </button>

          {onBack && (
            <button onClick={onBack} style={{
              display:"flex",alignItems:"center",gap:4,borderRadius:8,padding:"5px 12px",
              fontSize:11,fontWeight:700,border:`1px solid ${T.divider}`,
              background:T.btnBg,color:T.textMuted,cursor:"pointer",
            }}>← الاستوديو</button>
          )}

          <span style={{
            fontSize:9,borderRadius:6,padding:"4px 8px",
            color:T.textFaint,border:`1px solid ${T.divider}`,
          }}>{sz.label}</span>

          <button onClick={dlPNG} disabled={dl} style={{
            display:"flex",alignItems:"center",gap:6,fontWeight:900,border:"none",
            borderRadius:8,padding:"6px 16px",fontSize:12,cursor:dl?"not-allowed":"pointer",
            background:T.accent,color:T.accentFg,opacity:dl?0.5:1,transition:"opacity .15s",
          }}>
            {dl?"⏳":"⬇️"} {dl?"جاري...":"تصدير PNG"}
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* CANVAS STAGE */}
        <div ref={stageRef} style={{
          flex:1,display:"flex",alignItems:"center",justifyContent:"center",
          overflow:"auto",padding:20,background:T.stageBg,
        }}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
            <div style={{fontSize:9,letterSpacing:".2em",textTransform:"uppercase",color:T.stageLabel}}>
              Instagram {sz.sub} · {sz.label}
            </div>
            <div style={{
              width:cW,height:cH,flexShrink:0,borderRadius:12,overflow:"hidden",
              boxShadow:`0 0 0 1px ${T.stagePillBorder},0 32px 100px rgba(0,0,0,${T.name==="dark"?".9":".25"})`,
            }}>
              <canvas ref={canvasRef} style={{display:"block",width:cW,height:cH}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {[
                Object.values(CLUBS).find(c=>c.ar===S.hNameAr)||{ar:S.hNameAr,e:"⚽",logo:null},
                null,
                Object.values(CLUBS).find(c=>c.ar===S.aNameAr)||{ar:S.aNameAr,e:"🦁",logo:null},
              ].map((item,i)=>item?(
                <div key={i} style={{
                  display:"flex",alignItems:"center",gap:5,borderRadius:999,
                  padding:"3px 10px 3px 4px",
                  fontSize:11,fontWeight:700,background:T.stagePill,
                  border:`1px solid ${T.stagePillBorder}`,color:T.text,
                }}>
                  <ClubLogoImg src={item.logo} alt={item.ar} size={20}/>
                  {item.ar}
                </div>
              ):(
                <span key={i} style={{fontSize:9,color:T.textFaint}}>◆</span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside style={{
          width:276,flexShrink:0,overflowY:"auto",
          background:T.sidebarBg,borderRight:`1px solid ${T.divider}`,
        }}>

          <Accordion title="نوع البوست" defaultOpen={true}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,paddingTop:4}}>
              {POST_TYPES.map(pt=>{
                const on = S.postType===pt.id;
                return (
                  <button key={pt.id} onClick={()=>{U("postType",pt.id);U("title",pt.ar);}} style={{
                    padding:"8px 6px",borderRadius:8,border:`1.5px solid ${on?T.accent:T.btnBorder}`,
                    background:on?T.accentBg:T.btnBg,cursor:"pointer",fontSize:11,fontWeight:700,
                    color:on?T.accent:T.btnText,transition:"all .15s",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                  }}>
                    <span style={{fontSize:18}}>{POST_TYPE_ICONS[pt.id]||"📋"}</span>
                    {pt.ar}
                  </button>
                );
              })}
            </div>
          </Accordion>

          <Accordion title="حجم الكانفاس">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,paddingTop:4}}>
              {Object.entries(CANVAS_SIZES).map(([k,v])=>{
                const on=S.canvasSize===k;
                return (
                  <button key={k} onClick={()=>{U("canvasSize",k);setTimeout(()=>setZoom(calcFit()),50);}} style={{
                    padding:"8px 4px",borderRadius:8,border:`1.5px solid ${on?T.accent:T.btnBorder}`,
                    background:on?T.accentBg:T.btnBg,cursor:"pointer",textAlign:"center",transition:"all .15s",
                  }}>
                    <div style={{fontSize:10,fontWeight:700,color:on?T.accent:T.textMuted}}>{v.sub}</div>
                    <div style={{fontSize:8,color:T.textFaint}}>{v.label}</div>
                  </button>
                );
              })}
            </div>
          </Accordion>

          <Accordion title="تفاصيل المباراة" defaultOpen={true}>
            <div style={{paddingTop:4}}>
              <F label="البطولة (عربي)"><Inp value={S.comp}    onChange={v=>U("comp",v)}/></F>
              <F label="البطولة (إنجليزي)"><Inp value={S.compEn} onChange={v=>U("compEn",v)} dir="ltr"/></F>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <F label="الجولة"><Inp value={S.round} onChange={v=>U("round",v)}/></F>
                <F label="التوقيت"><Inp value={S.time}  onChange={v=>U("time",v)} dir="ltr"/></F>
              </div>
              <F label="الملعب"><Inp value={S.venue} onChange={v=>U("venue",v)}/></F>
              <F label="التاريخ"><Inp value={S.date}  onChange={v=>U("date",v)}/></F>
              <F label="نص الذيل"><Inp value={S.footer} onChange={v=>U("footer",v)} dir="ltr"/></F>
            </div>
          </Accordion>

          <Accordion title="الفريق المضيف" defaultOpen={true} accentColor="#d4a017">
            <div style={{paddingTop:4}}>
              <TeamPanel side="h" S={S} U={U} onLogo={e=>loadLogo("h",e)} onClubLogo={url=>tryLoadClubLogo("h",url)}/>
            </div>
          </Accordion>

          <Accordion title="الفريق الضيف" defaultOpen={true} accentColor="#3b82f6">
            <div style={{paddingTop:4}}>
              <TeamPanel side="a" S={S} U={U} onLogo={e=>loadLogo("a",e)} onClubLogo={url=>tryLoadClubLogo("a",url)}/>
            </div>
          </Accordion>

          {hasScore && (
            <Accordion title="النتيجة والهدافون" defaultOpen={true} accentColor="#22c55e">
              <div style={{paddingTop:4}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <F label="أهداف المضيف"><Inp type="number" min="0" max="20" value={S.hScore} onChange={v=>U("hScore",v)} dir="ltr"/></F>
                  <F label="أهداف الضيف"><Inp type="number" min="0" max="20" value={S.aScore} onChange={v=>U("aScore",v)} dir="ltr"/></F>
                </div>
                <F label="هدافو المضيف"><Tx value={S.scorers}  onChange={v=>U("scorers",v)}/></F>
                <F label="هدافو الضيف"><Tx value={S.aScorers||""} onChange={v=>U("aScorers",v)}/></F>
                {hasMOTM&&<F label="رجل المباراة"><Inp value={S.motmName} onChange={v=>U("motmName",v)}/></F>}
                <SliderRow label="حجم النتيجة" value={S.scoreSize||160} onChange={v=>U("scoreSize",v)} min={80} max={220} unit="px"/>
              </div>
            </Accordion>
          )}

          {/* ── GOAL-SPECIFIC SECTIONS (only shown for Goal template) ── */}
          {S.postType === "goal" && (<>

            <Accordion title="تفاصيل الهدف" defaultOpen={true} accentColor={S.goalLabelBg||"#e8c84a"}>
              <div style={{paddingTop:4}}>

                {/* Player image upload */}
                <div style={{marginBottom:8}}>
                  <Lbl>صورة اللاعب (PNG شفاف)</Lbl>
                  <label style={{
                    display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                    border:`1.5px dashed ${S.goalPlayerImgUrl?(S.goalLabelBg||"#e8c84a"):T.inputBorder}`,
                    borderRadius:8,padding:"10px",cursor:"pointer",fontSize:11,fontWeight:700,
                    color:S.goalPlayerImgUrl?(S.goalLabelBg||"#e8c84a"):T.textFaint,transition:"all .15s",
                  }}>
                    {S.goalPlayerImgUrl ? "✓ تم رفع صورة اللاعب" : "⬆️ رفع صورة اللاعب"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={loadGoalPlayer}/>
                  </label>
                  {S.goalPlayerImgUrl && (
                    <button onClick={()=>{setGoalPlayerImg(null);U("goalPlayerImgUrl",null);}} style={{
                      marginTop:6,width:"100%",padding:"4px",borderRadius:6,fontSize:10,fontWeight:700,
                      border:"1px solid rgba(239,68,68,.45)",background:"rgba(239,68,68,.08)",
                      color:"rgba(239,68,68,.8)",cursor:"pointer",
                    }}>✕ حذف الصورة</button>
                  )}
                </div>

                {/* Scoring team */}
                <F label="الفريق المسجل">
                  <Sel value={S.goalScoringTeam||"h"} onChange={v=>U("goalScoringTeam",v)}>
                    <option value="h">الفريق المضيف — {S.hNameAr}</option>
                    <option value="a">الفريق الضيف — {S.aNameAr}</option>
                  </Sel>
                </F>

                {/* Scorer info */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <F label="رقم القميص"><Inp value={S.goalShirtNumber||""} onChange={v=>U("goalShirtNumber",v)} dir="ltr"/></F>
                  <F label="الدقيقة"><Inp value={S.goalMinute||""} onChange={v=>U("goalMinute",v)} dir="ltr"/></F>
                </div>
                <F label="اسم الهداف"><Inp value={S.goalScorerName||""} onChange={v=>U("goalScorerName",v)}/></F>
              </div>
            </Accordion>

            <Accordion title="ألوان الهدف">
              <div style={{paddingTop:4}}>
                {[
                  {label:"لون الخلفية",   key:"goalBgColor"},
                  {label:'لون "GOAL"',    key:"goalTitleColor"},
                  {label:"خلفية اللافتة",key:"goalLabelBg"},
                  {label:"نص اللافتة",   key:"goalLabelColor"},
                ].map(({label,key})=>(
                  <div key={key} style={{marginBottom:12}}>
                    <Lbl>{label}</Lbl>
                    <div style={{display:"flex",gap:4,marginBottom:5,flexWrap:"wrap"}}>
                      {["#cc1111","#003399","#006622","#e8c84a","#111111","#f5f5f5"].map(p=>(
                        <button key={p} onClick={()=>U(key,p)} style={{
                          width:24,height:24,borderRadius:4,background:p,cursor:"pointer",
                          flexShrink:0,
                          border:S[key]===p?`2.5px solid ${T.accent}`:`1px solid ${T.btnBorder}`,
                        }}/>
                      ))}
                    </div>
                    <ColPick value={S[key]||"#ffffff"} onChange={v=>U(key,v)}/>
                  </div>
                ))}
              </div>
            </Accordion>

          </>)}

          <Accordion title="الخلفية">
            <div style={{paddingTop:4}}>
              <BgPanel S={S} U={U} onBgLoad={loadBg} onBgRemove={removeBg}/>
            </div>
          </Accordion>

          <Accordion title="إعدادات التصميم">
            <div style={{paddingTop:4}}>
              <F label="لون التمييز"><ColPick value={S.accent} onChange={v=>U("accent",v)}/></F>
              <div style={{marginTop:8}}>
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
            <div style={{paddingTop:4}}>
              <button onClick={dlPNG} disabled={dl} style={{
                width:"100%",fontWeight:900,borderRadius:10,padding:"10px 0",fontSize:13,
                border:"none",cursor:dl?"not-allowed":"pointer",marginBottom:6,
                background:T.accent,color:T.accentFg,opacity:dl?0.5:1,transition:"opacity .15s",
              }}>
                {dl?"⏳ جاري...":"⬇️ تحميل PNG — "+sz.label}
              </button>
              <p style={{fontSize:9,textAlign:"center",lineHeight:1.6,color:T.textFaint}}>
                {sz.w}×{sz.h} بكسل · جودة كاملة للنشر
              </p>
            </div>
          </Accordion>

        </aside>
      </div>
    </div>
    </ThemeCtx.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STUDIO HOME
═══════════════════════════════════════════════════════════════════════════ */
const COMING_SOON = [
  { id:"carousel",   ar:"مصمم الكاروسيل",           en:"Carousel Studio",       icon:"🎠" },
  { id:"tournament", ar:"جرافيكس البطولات",          en:"Tournament Graphics",   icon:"🏆" },
];

function StudioHome({ onOpen, onOpenNews, theme, onThemeToggle, T }) {
  const isDark = theme === "dark";
  return (
    <div dir="rtl" style={{
      fontFamily:"'Cairo','Tajawal',sans-serif",
      background: isDark ? "#07070e" : T.appBg,
      color: T.text,
      minHeight:"100vh",display:"flex",flexDirection:"column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{min-height:100%}
        @keyframes sh-pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes sh-glow{
          0%,100%{box-shadow:0 0 0 1px rgba(232,200,74,.28),0 20px 60px rgba(232,200,74,.1)}
          50%{box-shadow:0 0 0 1px rgba(232,200,74,.5),0 24px 80px rgba(232,200,74,.22)}
        }
        .sh-main-card{transition:transform .2s}
        .sh-main-card:hover{transform:translateY(-4px)}
        .sh-open-btn{transition:background .15s,transform .12s,box-shadow .15s}
        .sh-open-btn:hover{background:#f5d660!important;box-shadow:0 6px 24px rgba(232,200,74,.45)!important;transform:scale(1.03)}
        .sh-cs-card{transition:opacity .15s,transform .15s}
        .sh-cs-card:hover{opacity:.75;transform:translateY(-2px)}
        .sh-toggle-btn{transition:background .15s,color .15s}
        .sh-toggle-btn:hover{opacity:.8}
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"14px 32px",
        borderBottom:`1px solid ${T.divider}`,
        background: isDark ? "rgba(7,7,14,.85)" : T.topBarBg,
        backdropFilter:"blur(12px)",
        position:"sticky",top:0,zIndex:20,flexShrink:0,
        gap:12,
      }}>
        {/* Brand */}
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{
            width:38,height:38,borderRadius:10,flexShrink:0,
            background:"linear-gradient(135deg,#e8c84a 0%,#b8920a 100%)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:17,fontWeight:900,color:"#000",
            boxShadow:"0 4px 20px rgba(232,200,74,.38)",
          }}>O</div>
          <div>
            <div style={{fontSize:15,fontWeight:900,letterSpacing:"-.01em",lineHeight:1,color:T.text}}>
              Observer AI Studio
            </div>
            <div style={{fontSize:9,letterSpacing:".14em",color:T.textFaint,marginTop:3}}>
              DESIGN TOOLS FOR OMANI FOOTBALL
            </div>
          </div>
        </div>

        {/* Right side: theme toggle + beta badge */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          {/* Theme toggle */}
          <button className="sh-toggle-btn" onClick={onThemeToggle} style={{
            display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,
            border:`1px solid ${T.divider}`,background:T.btnBg,cursor:"pointer",
            fontSize:10,fontWeight:700,color:T.textMuted,
          }}>
            {isDark ? "☀️ فاتح" : "🌙 داكن"}
          </button>

          {/* Beta badge */}
          <div style={{
            display:"flex",alignItems:"center",gap:6,
            borderRadius:999,padding:"5px 13px",
            background:"rgba(16,185,129,.08)",
            border:"1px solid rgba(16,185,129,.22)",
            fontSize:10,fontWeight:700,color:"#10b981",
          }}>
            <span style={{
              width:7,height:7,borderRadius:"50%",background:"#10b981",
              animation:"sh-pulse 2s infinite",display:"inline-block",
            }}/>
            Beta
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        flex:1,display:"flex",flexDirection:"column",alignItems:"center",
        padding:"56px 24px 64px",
        background: isDark
          ? "radial-gradient(ellipse 75% 45% at 50% 0%, rgba(232,200,74,.055) 0%, transparent 55%)"
          : "none",
      }}>

        {/* HERO TEXT */}
        <div style={{textAlign:"center",maxWidth:580,marginBottom:44}}>
          <div style={{
            display:"inline-flex",alignItems:"center",gap:8,
            borderRadius:999,padding:"6px 16px",marginBottom:20,
            background:"rgba(232,200,74,.09)",
            border:"1px solid rgba(232,200,74,.25)",
            fontSize:11,fontWeight:700,color:"#c8a820",
          }}>
            ✦ أدوات التصميم الرياضي
          </div>

          <h1 style={{
            fontSize:"clamp(30px,5.5vw,48px)",fontWeight:900,
            lineHeight:1.2,letterSpacing:"-.025em",marginBottom:16,
            color:T.text,
          }}>
            صمّم محتوى رياضيًا
            <br/>
            <span style={{color:"#e8c84a"}}>بجودة احترافية</span>
          </h1>

          <p style={{
            fontSize:14,lineHeight:1.9,
            color:T.textMuted,
            maxWidth:460,margin:"0 auto",
          }}>
            منصة واحدة لإنشاء تصاميم الدوري العُماني والبطاقات الرياضية بسرعة واحترافية
          </p>
        </div>

        {/* ── MAIN CARD ── */}
        <div className="sh-main-card" onClick={onOpen} style={{
          width:"100%",maxWidth:600,borderRadius:22,
          padding:"32px 36px 28px",marginBottom:16,
          background: isDark
            ? "linear-gradient(140deg, rgba(232,200,74,.1) 0%, rgba(200,168,32,.05) 45%, rgba(0,0,0,0) 100%)"
            : T.sidebarBg,
          border:`1px solid ${isDark ? "rgba(232,200,74,.32)" : "rgba(232,200,74,.45)"}`,
          boxShadow: isDark
            ? "0 0 0 1px rgba(232,200,74,.28), 0 20px 60px rgba(232,200,74,.1)"
            : "0 4px 32px rgba(232,200,74,.18), 0 0 0 1.5px rgba(232,200,74,.38)",
          cursor:"pointer",position:"relative",overflow:"hidden",
          animation: isDark ? "sh-glow 3.5s ease-in-out infinite" : "none",
        }}>
          {/* ambient glow blobs */}
          <div style={{position:"absolute",top:-70,right:-60,width:220,height:220,
            borderRadius:"50%",background:"rgba(232,200,74,.08)",
            filter:"blur(55px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:-50,left:"25%",width:160,height:160,
            borderRadius:"50%",background:"rgba(232,200,74,.05)",
            filter:"blur(40px)",pointerEvents:"none"}}/>

          {/* diagonal accent line */}
          <div style={{
            position:"absolute",top:0,left:0,width:3,height:"100%",
            background:"linear-gradient(180deg,#e8c84a 0%,transparent 100%)",
            borderRadius:"22px 0 0 22px",opacity:.55,pointerEvents:"none",
          }}/>

          <div style={{position:"relative"}}>
            {/* top row */}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22}}>
              <div style={{
                width:56,height:56,borderRadius:15,
                background:"rgba(232,200,74,.1)",
                border:"1px solid rgba(232,200,74,.22)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:28,flexShrink:0,
              }}>🇴🇲</div>

              <div style={{
                display:"flex",alignItems:"center",gap:6,
                borderRadius:999,padding:"5px 13px",
                background:"rgba(232,200,74,.1)",
                border:"1px solid rgba(232,200,74,.38)",
                fontSize:10,fontWeight:900,color:"#e8c84a",letterSpacing:".09em",
              }}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"#e8c84a",
                  animation:"sh-pulse 2s infinite",display:"inline-block"}}/>
                LIVE
              </div>
            </div>

            {/* title */}
            <div style={{fontSize:26,fontWeight:900,lineHeight:1.2,letterSpacing:"-.02em",marginBottom:4,color:T.text}}>
              مصمم الدوري العُماني
            </div>
            <div style={{fontSize:12,fontWeight:700,color:"#c8a820",marginBottom:14,letterSpacing:".025em"}}>
              Oman League Designer
            </div>

            {/* description */}
            <p style={{fontSize:13,lineHeight:1.8,color:T.textMuted,marginBottom:26}}>
              أنشئ بوستات يوم المباراة، النتيجة النهائية، الشوط الأول، الأهداف ورجل المباراة
            </p>

            {/* CTA row */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <button className="sh-open-btn" style={{
                display:"flex",alignItems:"center",gap:8,
                padding:"11px 26px",borderRadius:10,
                background:"#e8c84a",color:"#000",
                fontSize:13,fontWeight:900,border:"none",cursor:"pointer",
                boxShadow:"0 4px 20px rgba(232,200,74,.3)",
              }}>
                فتح المصمم
                <span style={{transform:"rotate(180deg)",display:"inline-block",fontSize:14,lineHeight:1}}>←</span>
              </button>
              <div style={{fontSize:11,color:T.textFaint,textAlign:"start"}}>
                6 قوالب جاهزة · تصدير PNG بجودة 1080px
              </div>
            </div>
          </div>
        </div>

        {/* ── NEWS CARD STUDIO — active tool ── */}
        <div onClick={onOpenNews} style={{
          width:"100%",maxWidth:600,marginBottom:16,
          borderRadius:16,padding:"22px 28px",cursor:"pointer",
          background: isDark ? "rgba(255,255,255,.03)" : T.btnBg,
          border:`1px solid ${T.divider}`,
          display:"flex",alignItems:"center",gap:18,
          transition:"opacity .15s,transform .15s",
        }}
          onMouseEnter={e=>{e.currentTarget.style.opacity=".8";e.currentTarget.style.transform="translateY(-2px)"}}
          onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="none"}}
        >
          <div style={{fontSize:32,lineHeight:1}}>📰</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:3}}>
              مصمم البطاقات الإخبارية
            </div>
            <div style={{fontSize:10,color:T.textMuted}}>News Card Studio</div>
          </div>
          <div style={{
            borderRadius:999,padding:"4px 12px",
            background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.25)",
            fontSize:9,fontWeight:700,color:"#10b981",whiteSpace:"nowrap",
          }}>
            جديد
          </div>
        </div>

        {/* ── COMING SOON CARDS ── */}
        <div style={{
          width:"100%",maxWidth:600,
          display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,
        }}>
          {COMING_SOON.map(c => (
            <div key={c.id} className="sh-cs-card" style={{
              borderRadius:16,padding:"20px 16px",
              background: isDark ? "rgba(255,255,255,.025)" : T.btnBg,
              border:`1px solid ${T.divider}`,
              opacity:0.7,
            }}>
              <div style={{fontSize:24,marginBottom:12}}>{c.icon}</div>
              <div style={{fontSize:13,fontWeight:800,lineHeight:1.35,marginBottom:4,color:T.textMuted}}>
                {c.ar}
              </div>
              <div style={{fontSize:9,fontWeight:600,letterSpacing:".04em",color:T.textFaint,marginBottom:14}}>
                {c.en}
              </div>
              <div style={{
                display:"inline-block",borderRadius:999,padding:"3px 10px",
                background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)",
                border:`1px solid ${T.divider}`,
                fontSize:9,fontWeight:700,color:T.textFaint,
              }}>
                قريبًا
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        textAlign:"center",padding:"18px",
        fontSize:10,color:T.textFaint,
        borderTop:`1px solid ${T.divider}`,
        flexShrink:0,
      }}>
        Observer AI Studio • الدوري العُماني للمحترفين
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NEWS CARD STUDIO — placeholder shell (UI to be built here)
═══════════════════════════════════════════════════════════════════════════ */
/* ── News Card canvas renderer ─────────────────────────────────────────── */
/* ── Hex → rgba helper for canvas gradient stops ───────────────────── */
function hexAlpha(hex, a) {
  const h = (hex || "#e8c84a").replace("#", "");
  const r = parseInt(h.slice(0,2),16)||232;
  const g = parseInt(h.slice(2,4),16)||200;
  const b = parseInt(h.slice(4,6),16)||74;
  return `rgba(${r},${g},${b},${a})`;
}

/* Returns black or white text for the best contrast against a hex background */
function contrastText(hex) {
  const h = (hex || "#ffffff").replace("#", "");
  const r = parseInt(h.slice(0,2),16) / 255 || 0;
  const g = parseInt(h.slice(2,4),16) / 255 || 0;
  const b = parseInt(h.slice(4,6),16) / 255 || 0;
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.42 ? "#000000" : "#ffffff";
}


/* Draws a sz×sz rounded-square badge at (x, cy-sz/2) for the given platform */
function drawPlatformBadge(ctx, platform, x, cy, sz) {
  const hy = cy - sz / 2;
  const rc = sz * 0.22;
  const cx = x + sz / 2;
  ctx.save();

  /* Rounded square background */
  ctx.beginPath();
  ctx.moveTo(x + rc, hy);
  ctx.arcTo(x + sz, hy,       x + sz, hy + sz, rc);
  ctx.arcTo(x + sz, hy + sz,  x,      hy + sz, rc);
  ctx.arcTo(x,      hy + sz,  x,      hy,      rc);
  ctx.arcTo(x,      hy,       x + sz, hy,      rc);
  ctx.closePath();
  const BG = {
    instagram:"#c13584", twitter:"#000000", tiktok:"#010101",
    facebook:"#1877f2",  youtube:"#ff0000", website:"#6b7280",
  };
  ctx.fillStyle = BG[platform] || "#6b7280";
  ctx.fill();

  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#ffffff";
  ctx.textAlign = "center";  ctx.textBaseline = "middle";

  if (platform === "instagram") {
    /* Rounded square outline + inner circle + highlight dot */
    const pad = sz * 0.19, ir = sz * 0.12;
    const ix = x + pad, iy = hy + pad, is2 = sz - pad * 2;
    ctx.lineWidth = sz * 0.09;
    ctx.beginPath();
    ctx.moveTo(ix + ir, iy);
    ctx.arcTo(ix + is2, iy,       ix + is2, iy + is2, ir);
    ctx.arcTo(ix + is2, iy + is2, ix,       iy + is2, ir);
    ctx.arcTo(ix,       iy + is2, ix,       iy,       ir);
    ctx.arcTo(ix,       iy,       ix + is2, iy,       ir);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, sz * 0.14, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + sz*0.19, cy - sz*0.19, sz*0.055, 0, Math.PI*2); ctx.fill();

  } else if (platform === "twitter") {
    /* Bold X */
    ctx.lineWidth = sz * 0.13; ctx.lineCap = "round";
    const d = sz * 0.2;
    ctx.beginPath(); ctx.moveTo(cx-d, cy-d); ctx.lineTo(cx+d, cy+d); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+d, cy-d); ctx.lineTo(cx-d, cy+d); ctx.stroke();

  } else if (platform === "tiktok") {
    /* Musical note — readable at small size */
    ctx.font = `bold ${Math.round(sz * 0.58)}px Arial,sans-serif`;
    ctx.fillText("♪", cx, cy + sz * 0.04);

  } else if (platform === "facebook") {
    ctx.font = `bold ${Math.round(sz * 0.65)}px Georgia,serif`;
    ctx.fillText("f", cx + sz * 0.035, cy + sz * 0.04);

  } else if (platform === "youtube") {
    /* Right-pointing play triangle */
    const pw = sz * 0.25, ph = sz * 0.21;
    ctx.beginPath();
    ctx.moveTo(cx - pw * 0.45, cy - ph);
    ctx.lineTo(cx + pw * 0.9,  cy);
    ctx.lineTo(cx - pw * 0.45, cy + ph);
    ctx.closePath(); ctx.fill();

  } else {
    /* Website — simplified globe: circle + horizontal line + vertical oval */
    ctx.lineWidth = sz * 0.09;
    ctx.beginPath(); ctx.arc(cx, cy, sz * 0.27, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + sz*0.1, cy); ctx.lineTo(x + sz*0.9, cy); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, sz * 0.10, sz * 0.27, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/* ── Platform ordering / visibility metadata ────────────────────────── */
const DEFAULT_PLATFORMS = [
  { id:"website",   on:true  },
  { id:"instagram", on:true  },
  { id:"twitter",   on:true  },
  { id:"tiktok",    on:true  },
  { id:"facebook",  on:true  },
  { id:"youtube",   on:true  },
];

const PLAT_FIELD = {
  website:"brandFooterSite", instagram:"brandInstagram",
  twitter:"brandTwitter",   tiktok:"brandTikTok",
  facebook:"brandFacebook", youtube:"brandYoutube",
};

const PLAT_META = {
  website:  { label:"الموقع",     color:"#6b7280", ph:"ofa.om"          },
  instagram:{ label:"إنستغرام",   color:"#c13584", ph:"@handle"         },
  twitter:  { label:"X / تويتر", color:"#000000", ph:"@handle"         },
  tiktok:   { label:"تيك توك",    color:"#010101", ph:"@handle"         },
  facebook: { label:"فيسبوك",     color:"#1877f2", ph:"اسم الصفحة"     },
  youtube:  { label:"يوتيوب",     color:"#ff0000", ph:"اسم القناة"     },
};

/* Identity presets — only touch branding fields, never article content */
const IDENTITY_PRESETS = [
  { id:"ofa", label:"OFA Style",
    fields:{ showBranding:true, brandHeaderTitle:"أخبار الاتحاد",
      brandHeaderTitleColor:"#e8c84a", brandFooterMode:"compact",
      brandFooterSite:"ofa.om", brandShortHandle:"omanfa",
      brandLongName:"oman football association",
      brandInstagram:"@omanfa", brandTwitter:"@omanfa", brandTikTok:"@omanfa",
      brandFacebook:"Oman FA", brandYoutube:"Oman FA", brandIdentityPreset:"ofa",
      brandPlatforms:[
        {id:"website",on:true},{id:"instagram",on:true},{id:"twitter",on:true},
        {id:"tiktok",on:true},{id:"facebook",on:true},{id:"youtube",on:true},
      ],
    },
  },
  { id:"league", label:"League Style",
    fields:{ showBranding:true, brandHeaderTitle:"أخبار الدوري",
      brandHeaderTitleColor:"#e8c84a", brandFooterMode:"compact",
      brandFooterSite:"osl.om", brandShortHandle:"OmanLeague",
      brandLongName:"Oman League",
      brandInstagram:"@OmanLeague", brandTwitter:"@OmanLeague", brandTikTok:"@OmanLeague",
      brandFacebook:"", brandYoutube:"", brandIdentityPreset:"league",
      brandPlatforms:[
        {id:"website",on:true},{id:"instagram",on:true},{id:"twitter",on:true},
        {id:"tiktok",on:true},{id:"facebook",on:false},{id:"youtube",on:false},
      ],
    },
  },
  { id:"minimal", label:"Minimal",
    fields:{ showBranding:true, brandHeaderTitle:"",
      brandHeaderTitleColor:"#e8c84a", brandFooterMode:"compact",
      brandFooterSite:"", brandShortHandle:"", brandLongName:"",
      brandInstagram:"", brandTwitter:"", brandTikTok:"",
      brandFacebook:"", brandYoutube:"", brandIdentityPreset:"minimal",
      brandPlatforms:[
        {id:"website",on:true},{id:"instagram",on:true},{id:"twitter",on:true},
        {id:"tiktok",on:false},{id:"facebook",on:false},{id:"youtube",on:false},
      ],
    },
  },
  { id:"clean", label:"بدون هوية",
    fields:{ showBranding:false, brandIdentityPreset:"clean",
      brandPlatforms:[
        {id:"website",on:false},{id:"instagram",on:false},{id:"twitter",on:false},
        {id:"tiktok",on:false},{id:"facebook",on:false},{id:"youtube",on:false},
      ],
    },
  },
];

/* Resolve ordered, enabled platforms that have a text value — used by canvas renderers */
function resolveFooterItems(NC) {
  const platforms = NC.brandPlatforms || DEFAULT_PLATFORMS;
  return platforms
    .filter(p => p.on && NC[PLAT_FIELD[p.id]])
    .map(p => ({ id: p.id, text: NC[PLAT_FIELD[p.id]] }));
}

/*
 * Compact footer: website  [social icons] shortHandle  [video icons] longName
 * Automatically wraps to two lines when content exceeds maxRightX.
 */
function drawFooterCompact(ctx, NC, items, startX, footY, footH, maxRightX, iconSz, fontSz, Rn) {
  const SOCIAL_IDS = ["instagram","twitter","tiktok"];
  const VIDEO_IDS  = ["facebook","youtube"];
  const iconGap = 3, halfGap = 7, secGap = 20;
  const footMid = footY + footH / 2;

  ctx.font = `400 ${Rn(fontSz)}px 'Cairo','Tajawal',sans-serif`;
  ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.direction = "ltr";

  const webItem     = items.find(i => i.id === "website");
  const socialItems = items.filter(i => SOCIAL_IDS.includes(i.id));
  const videoItems  = items.filter(i => VIDEO_IDS.includes(i.id));

  const groupW = (grp, label) => {
    if (grp.length === 0) return 0;
    let w = grp.length * (iconSz + iconGap) - iconGap;
    if (label) w += halfGap + ctx.measureText(label).width;
    return w;
  };

  const webW    = webItem ? ctx.measureText(webItem.text).width + secGap : 0;
  const socialW = socialItems.length > 0 ? groupW(socialItems, NC.brandShortHandle) + secGap : 0;
  const videoW  = videoItems.length > 0  ? groupW(videoItems, NC.brandLongName)              : 0;
  const totalW  = webW + socialW + videoW;
  const maxW    = maxRightX - startX;

  /* Draw one icon cluster then its text label; returns the ending X */
  const drawGroup = (grp, label, x, y) => {
    for (const item of grp) {
      drawPlatformBadge(ctx, item.id, x, y, iconSz);
      x += iconSz + iconGap;
    }
    if (grp.length > 0 && label) {
      x -= iconGap; x += halfGap;
      ctx.fillText(label, x, y);
      x += ctx.measureText(label).width;
    }
    return x;
  };

  if (totalW <= maxW || videoItems.length === 0) {
    /* Single line */
    let x = startX;
    if (webItem) {
      ctx.fillText(webItem.text, x, footMid);
      x += ctx.measureText(webItem.text).width + secGap;
    }
    if (socialItems.length > 0) {
      x = drawGroup(socialItems, NC.brandShortHandle, x, footMid);
      if (videoItems.length > 0) x += secGap;
    }
    if (videoItems.length > 0) {
      drawGroup(videoItems, NC.brandLongName, x, footMid);
    }
  } else {
    /* Two lines: line1 = website + social, line2 = video */
    const line1Y = footY + footH * 0.28;
    const line2Y = footY + footH * 0.72;
    let x = startX;
    if (webItem) {
      ctx.fillText(webItem.text, x, line1Y);
      x += ctx.measureText(webItem.text).width + secGap;
    }
    if (socialItems.length > 0) {
      drawGroup(socialItems, NC.brandShortHandle, x, line1Y);
    }
    drawGroup(videoItems, NC.brandLongName, startX, line2Y);
  }
}

/*
 * Detailed footer: [icon] text  [icon] text  ...
 * Wraps to two lines when more than 3 items or content exceeds maxRightX.
 */
function drawFooterDetailed(ctx, items, startX, footY, footH, maxRightX, iconSz, fontSz, Rn) {
  if (items.length === 0) return;
  const iconGap = 4, itemGap = 10;
  const footMid = footY + footH / 2;

  ctx.font = `400 ${Rn(fontSz)}px 'Cairo','Tajawal',sans-serif`;
  ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.direction = "ltr";

  let totalW = 0;
  for (const item of items) {
    totalW += iconSz + iconGap + ctx.measureText(item.text).width + itemGap;
  }

  const drawItems = (subset, x, y) => {
    for (const item of subset) {
      drawPlatformBadge(ctx, item.id, x, y, iconSz);
      x += iconSz + iconGap;
      ctx.fillText(item.text, x, y);
      x += ctx.measureText(item.text).width + itemGap;
    }
  };

  if (totalW <= maxRightX - startX || items.length <= 3) {
    drawItems(items, startX, footMid);
  } else {
    const half = Math.ceil(items.length / 2);
    drawItems(items.slice(0, half), startX, footY + footH * 0.28);
    drawItems(items.slice(half),    startX, footY + footH * 0.72);
  }
}

/* ── Style presets ──────────────────────────────────────────────────── */
const NC_PRESETS = {
  default:   { label:"الافتراضي",  sw:["#e8c84a","#ffffff","#2a2a38"], gradient:"strong", accentColor:"#e8c84a", headColor:"#ffffff", subColor:"rgba(255,255,255,.55)", bodyColor:"#2a2a38" },
  soft:      { label:"ناعم",       sw:["#ffffff","#f8f8f8","#1a1a2e"], gradient:"soft",   accentColor:"#ffffff", headColor:"#f8f8f8",  subColor:"rgba(248,248,248,.75)", bodyColor:"#1a1a2e" },
  breaking:  { label:"عاجل",       sw:["#ef4444","#ffffff","#200808"], gradient:"strong", accentColor:"#ef4444", headColor:"#ffffff",  subColor:"rgba(255,200,200,.75)", bodyColor:"#200808" },
  midnight:  { label:"ليلي",       sw:["#3b82f6","#e8f0ff","#0a0a2a"], gradient:"strong", accentColor:"#3b82f6", headColor:"#e8f0ff",  subColor:"rgba(200,220,255,.70)", bodyColor:"#0a0a2a" },
  golden:    { label:"ذهبي فاتح",  sw:["#f59e0b","#fffde8","#1a1000"], gradient:"soft",   accentColor:"#f59e0b", headColor:"#fffde8",  subColor:"rgba(255,253,200,.65)", bodyColor:"#1a1000" },
  editorial: { label:"إخباري",     sw:["#10b981","#ffffff","#022c22"], gradient:"soft",   accentColor:"#10b981", headColor:"#ffffff",  subColor:"rgba(200,255,235,.65)", bodyColor:"#022c22" },
};

/* ── News content templates ─────────────────────────────────────────── */
const NEWS_TEMPLATES = [
  { id:"official", label:"خبر رسمي", sublabel:"Official News",
    fields:{ category:"رياضة",
      headline:"عنوان الخبر الرسمي يكتب هنا",
      subheadline:"تفاصيل الخبر الرسمي تكتب هنا بشكل مختصر وواضح.",
      body:"تفاصيل الخبر الرسمي تكتب هنا بشكل مختصر وواضح.",
    },
  },
  { id:"statement", label:"تصريح", sublabel:"Statement",
    fields:{ category:"تصريح",
      headline:"تصريح رسمي",
      subheadline:"",
      body:'قال [الاسم]: "اكتب التصريح هنا..."',
    },
  },
  { id:"honouring", label:"تكريم", sublabel:"Honouring",
    fields:{ category:"تكريم",
      headline:"تكريم [الجهة/الشخص]",
      subheadline:"",
      body:"تم تكريم [الاسم/الفريق] تقديرًا لجهوده وإنجازاته خلال الفترة الماضية.",
    },
  },
  { id:"announcement", label:"بيان", sublabel:"Announcement",
    fields:{ category:"بيان",
      headline:"بيان رسمي",
      subheadline:"",
      body:"تعلن [الجهة] عن [التفاصيل]، وذلك في إطار [السياق].",
    },
  },
  { id:"congratulations", label:"تهنئة", sublabel:"Congratulations",
    fields:{ category:"تهنئة",
      headline:"تهنئة",
      subheadline:"",
      body:"تتقدم [الجهة] بالتهنئة إلى [الاسم/الفريق] بمناسبة [الإنجاز].",
    },
  },
  { id:"breaking", label:"عاجل", sublabel:"Breaking News",
    fields:{ category:"عاجل",
      headline:"خبر عاجل",
      subheadline:"تفاصيل الخبر العاجل تكتب هنا.",
      body:"تفاصيل الخبر العاجل تكتب هنا.",
      preset:"breaking", accentColor:"#ef4444", headColor:"#ffffff",
      subColor:"rgba(255,200,200,.75)", bodyColor:"#200808", gradient:"strong",
    },
  },
];

/* ── Default NC state (used for initial state and full reset) ───────── */
const DEFAULT_NC = {
  category:"رياضة", date:"٢٤ مايو ٢٠٢٦",
  headline:"عنوان الخبر الرياضي الرئيسي يُكتب هنا",
  subheadline:"تفاصيل وملخص الخبر يُكتبان في هذا الحقل",
  body:"اكتب نص الخبر الكامل هنا. يمكن أن يكون النص طويلاً ويمتد على عدة أسطر. يتم ضبط حجم الخط والتباعد تلقائياً حسب حجم البطاقة المختارة.",
  footer:"osl.om  ·  @OmanLeague",
  gradient:"strong", template:"image", cardSize:"portrait",
  imgScale:1.0, imgOffsetX:0, imgOffsetY:0, imgFit:"cover",
  headSzMult:1.0, subSzMult:1.0, bodySzMult:1.0,
  highlights:[], preset:"default",
  headColor:"#ffffff", subColor:"rgba(255,255,255,.55)",
  accentColor:"#e8c84a", bodyColor:"#2a2a38",
  /* Card branding (Long Text only) */
  showBranding: false,
  brandHeaderTitle: "أخبار كرة القدم",
  brandHeaderTitleColor: "#e8c84a",
  brandFooterMode: "compact",
  brandFooterSite: "ofa.om",
  brandShortHandle: "omanfa",
  brandLongName: "",
  brandInstagram: "@omanfa",
  brandTwitter: "",
  brandTikTok: "",
  brandFacebook: "",
  brandYoutube: "",
  brandPlatforms: [
    {id:"website",on:true},{id:"instagram",on:true},{id:"twitter",on:true},
    {id:"tiktok",on:true},{id:"facebook",on:true},{id:"youtube",on:true},
  ],
  brandIdentityPreset: "",
  newsTemplate: "",
};

/* ── Word-highlight renderer for RTL canvas text ───────────────────── */
/* Draws text in default color then clips + redraws each matched phrase. */
function drawHighlightedText(ctx, text, x, y, lineH, highlights) {
  ctx.fillText(text, x, y);
  if (!highlights || highlights.length === 0) return;
  for (const { phrase, color } of highlights) {
    if (!phrase || !phrase.trim() || !color) continue;
    let pos = 0, idx;
    while ((idx = text.indexOf(phrase, pos)) !== -1) {
      const before  = text.substring(0, idx);
      const beforeW = ctx.measureText(before).width;
      const phraseW = ctx.measureText(phrase).width;
      const clipX   = x - beforeW - phraseW - 6;
      ctx.save();
      ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
      ctx.beginPath(); ctx.rect(clipX, y - 2, phraseW + 12, lineH + 4); ctx.clip();
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();
      pos = idx + phrase.length;
    }
  }
}

/* ── Canvas text-wrap utility (shared by all card draw functions) ────── */
function wrapText(ctx, text, maxW, maxLines) {
  const words = (text || "").split(" ").filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur); cur = w;
      if (lines.length === maxLines - 1) { cur = w; break; }
    } else { cur = test; }
  }
  if (cur) {
    const remaining = words.slice(words.indexOf(cur.split(" ")[0]));
    const joined = remaining.join(" ");
    if (ctx.measureText(joined).width > maxW) {
      let t = "";
      for (const w of remaining) {
        const attempt = (t ? t + " " + w : w) + "…";
        if (ctx.measureText(attempt).width > maxW && t) break;
        t = (t ? t + " " + w : w);
      }
      lines.push(t + "…");
    } else {
      lines.push(joined);
    }
  }
  return lines;
}

function drawNewsCard(ctx, NC, bgImg, brandLogo = null) {
  const W = 1080, H = 1350, Rn = Math.round;
  const M = 64;
  const FOOT_H = 100;
  const ac = NC.accentColor || "#e8c84a";

  /* ── 1. BASE: full-canvas image or dark editorial background ────────── */
  if (bgImg) {
    const baseSc = (NC.imgFit === "contain")
      ? Math.min(W / bgImg.naturalWidth, H / bgImg.naturalHeight)
      : Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
    const sc = baseSc * (NC.imgScale || 1.0);
    const dw = bgImg.naturalWidth * sc, dh = bgImg.naturalHeight * sc;
    const ox = Rn((NC.imgOffsetX || 0) / 100 * W);
    const oy = Rn((NC.imgOffsetY || 0) / 100 * H);
    ctx.drawImage(bgImg, Rn((W - dw) / 2) + ox, Rn((H - dh) / 2) + oy, Rn(dw), Rn(dh));
  } else {
    /* No image: use bodyColor as base so presets tint the whole card */
    const baseClr = NC.bodyColor || "#0d0d16";
    const baseBg = ctx.createLinearGradient(0, 0, 0, H);
    baseBg.addColorStop(0, hexAlpha(baseClr, 0.72));
    baseBg.addColorStop(1, hexAlpha(baseClr, 0.98));
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); // true-black foundation
    ctx.fillStyle = baseBg; ctx.fillRect(0, 0, W, H);

    /* Image zone: slightly lighter rectangle, upper 62% */
    const zH = Rn(H * 0.62);
    const zoneBg = ctx.createLinearGradient(0, 0, 0, zH);
    zoneBg.addColorStop(0, "rgba(255,255,255,.06)");
    zoneBg.addColorStop(1, "rgba(255,255,255,.01)");
    ctx.fillStyle = zoneBg; ctx.fillRect(0, 0, W, zH);

    /* Dashed frame */
    ctx.save();
    ctx.setLineDash([18, 10]);
    ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 2;
    const fp = 48;
    ctx.strokeRect(fp, fp, W - fp * 2, zH - fp);
    ctx.setLineDash([]); ctx.restore();

    /* Camera / upload prompt */
    ctx.save();
    ctx.font = `600 ${Rn(30)}px 'Cairo','Tajawal',sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,.22)";
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "rtl";
    ctx.fillText("↑ أضف صورة الخلفية من لوحة التحكم", W / 2, zH / 2);
    ctx.restore();
  }

  /* ── 2. GRADIENT OVERLAYS (controlled by NC.gradient) ─────────────── */
  const gradStyle = NC.gradient || "strong";
  if (gradStyle !== "none") {
    /* Top: just enough to keep badge/date legible */
    const topAlpha = gradStyle === "soft" ? ".38" : ".55";
    const topOv = ctx.createLinearGradient(0, 0, 0, H * 0.22);
    topOv.addColorStop(0, `rgba(0,0,0,${topAlpha})`);
    topOv.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topOv; ctx.fillRect(0, 0, W, Rn(H * 0.22));
    /* Bottom: smooth fade from mid-image into the text zone */
    const botStart = gradStyle === "soft" ? 0.56 : 0.50;
    const botEnd   = gradStyle === "soft" ? 0.86 : 0.80;
    const maxAlpha = gradStyle === "soft" ? ".82" : ".97";
    /* Bottom overlay tinted by bodyColor so each preset has a distinct mood */
    const botClr   = NC.bodyColor || "#000000";
    const botSolid = hexAlpha(botClr, parseFloat(maxAlpha));
    const botOv = ctx.createLinearGradient(0, H * botStart, 0, H * botEnd);
    botOv.addColorStop(0, hexAlpha(botClr, 0));
    botOv.addColorStop(1, botSolid);
    ctx.fillStyle = botOv;
    ctx.fillRect(0, Rn(H * botStart), W, Rn(H * (botEnd - botStart)));
    ctx.fillStyle = botSolid;
    ctx.fillRect(0, Rn(H * botEnd), W, H - Rn(H * botEnd));
  }

  /* ── 3. CATEGORY BADGE — top-right ────────────────────────────────── */
  const cat = NC.category || "رياضة";
  ctx.save();
  ctx.font = `700 ${Rn(26)}px 'Cairo','Tajawal',sans-serif`;
  ctx.direction = "rtl"; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 12;
  const catTW  = ctx.measureText(cat).width;
  const catPW  = Rn(catTW + 48), catPH = 50;
  const catX   = W - M - catPW, catY = 64;
  ctx.beginPath(); ctx.roundRect(catX, catY, catPW, catPH, catPH / 2);
  ctx.fillStyle = ac; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = contrastText(ac); ctx.textAlign = "center";
  ctx.fillText(cat, catX + catPW / 2, catY + catPH / 2);
  ctx.restore();

  /* ── 4. DATE — top-left, same row as category ──────────────────────── */
  ctx.save();
  ctx.font = `500 ${Rn(25)}px 'Cairo','Tajawal',sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.direction = "ltr";
  ctx.shadowColor = "rgba(0,0,0,.7)"; ctx.shadowBlur = 10;
  ctx.fillText(String(NC.date || ""), M, catY + catPH / 2);
  ctx.restore();

  /* ── 5. GOLD ACCENT LINE — transition from image to text zone ──────── */
  const lineY = Rn(H * 0.630);
  const lineGrad = ctx.createLinearGradient(M, 0, W - M, 0);
  lineGrad.addColorStop(0,    hexAlpha(ac, 0));
  lineGrad.addColorStop(0.08, ac);
  lineGrad.addColorStop(0.92, ac);
  lineGrad.addColorStop(1,    hexAlpha(ac, 0));
  ctx.fillStyle = lineGrad;
  ctx.fillRect(M, lineY, W - M * 2, 2);

  /* ── 6. HEADLINE — large, bold, RTL wrapped ────────────────────────── */
  const headSz   = Rn(W * 0.058 * (NC.headSzMult || 1.0));
  const headLH   = Rn(headSz * 1.42);
  const maxTxtW  = W - (M + 20) * 2;
  const headMaxL = 4;

  ctx.save();
  ctx.font = `900 ${headSz}px 'Cairo','Tajawal',sans-serif`;
  ctx.fillStyle = NC.headColor || "#ffffff";
  ctx.textAlign = "right"; ctx.textBaseline = "top"; ctx.direction = "rtl";
  ctx.shadowColor = "rgba(0,0,0,.7)"; ctx.shadowBlur = 22;
  const headLines = wrapText(ctx, NC.headline || "العنوان الرئيسي", maxTxtW, headMaxL);
  let headY = lineY + 60;
  for (const ln of headLines) {
    drawHighlightedText(ctx, ln, W - M, headY, headLH, NC.highlights);
    headY += headLH;
  }
  ctx.restore();
  const afterHead = headY;

  /* ── 7. SUBHEADLINE — smaller, muted, max 3 lines ──────────────────── */
  const textBottom = H - FOOT_H - 32;      // don't let text enter footer zone
  if (NC.subheadline && afterHead + 20 < textBottom) {
    const subSz  = Rn(W * 0.032 * (NC.subSzMult || 1.0));
    const subLH  = Rn(subSz * 1.65);
    const subMax = Math.min(3, Math.floor((textBottom - afterHead - 36) / subLH));
    if (subMax > 0) {
      ctx.save();
      ctx.font = `400 ${subSz}px 'Cairo','Tajawal',sans-serif`;
      ctx.fillStyle = NC.subColor || "rgba(255,255,255,.55)";
      ctx.textAlign = "right"; ctx.textBaseline = "top"; ctx.direction = "rtl";
      ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 12;
      const subLines = wrapText(ctx, NC.subheadline, maxTxtW, subMax);
      let subY = afterHead + 24;
      for (const ln of subLines) {
        drawHighlightedText(ctx, ln, W - M, subY, subLH, NC.highlights);
        subY += subLH;
      }
      ctx.restore();
    }
  }

  /* ── 8. FOOTER ZONE (shown only when identity is ON) ───────────────── */
  if (NC.showBranding) {
    const footY   = H - FOOT_H;
    const footMid = footY + FOOT_H / 2;
    ctx.save();

    /* Separator */
    ctx.strokeStyle = hexAlpha(ac, .35); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(M, footY); ctx.lineTo(W - M, footY); ctx.stroke();

    /* Logo — bottom-left */
    let contentLeft = M;
    if (brandLogo) {
      const lH = Math.min(38, brandLogo.naturalHeight);
      const lW = Rn(lH * (brandLogo.naturalWidth / brandLogo.naturalHeight));
      ctx.drawImage(brandLogo, M, Rn(footMid - lH / 2), lW, lH);
      contentLeft = M + lW + 14;
    }

    ctx.fillStyle = hexAlpha(NC.headColor || "#ffffff", 0.55);

    /* Reserve right space for header title so social content doesn't overlap */
    ctx.font = `700 ${Rn(22)}px 'Cairo','Tajawal',sans-serif`;
    const titleW = NC.brandHeaderTitle ? ctx.measureText(NC.brandHeaderTitle).width + 24 : 0;
    const maxContentRight = W - M - titleW;

    const allItems = resolveFooterItems(NC);

    if (NC.brandFooterMode === "detailed") {
      ctx.fillStyle = hexAlpha(NC.headColor || "#ffffff", 0.55);
      drawFooterDetailed(ctx, allItems, contentLeft, footY, FOOT_H, maxContentRight, 18, 17, Rn);
    } else {
      ctx.fillStyle = hexAlpha(NC.headColor || "#ffffff", 0.55);
      drawFooterCompact(ctx, NC, allItems, contentLeft, footY, FOOT_H, maxContentRight, 18, 17, Rn);
    }

    /* Header title — bottom-right */
    ctx.font = `700 ${Rn(22)}px 'Cairo','Tajawal',sans-serif`;
    ctx.fillStyle = NC.brandHeaderTitleColor || ac;
    ctx.textAlign = "right"; ctx.direction = "rtl";
    ctx.fillText(NC.brandHeaderTitle || "", W - M, footMid);

    ctx.restore();
  }
}

/* ── Long-text editorial card renderer ──────────────────────────────────── */
function drawLongTextCard(ctx, NC, bgImg, brandLogo = null) {
  const W = 1080, Rn = Math.round;
  const isSquare = NC.cardSize === "square";
  const isStory  = NC.cardSize === "story";
  const H = isSquare ? 1080 : isStory ? 1920 : 1350;
  const M = 72;

  const GOLD   = NC.accentColor || "#c8a415";
  const DARK   = "#0d0d16";
  const BODY_C = NC.bodyColor  || "#2a2a38";
  const MUTED  = "#72728a";

  /* 1. White background */
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);

  /* 1b. Header masthead — white strip above image (branding only) */
  const headerH = NC.showBranding ? 70 : 0;
  if (NC.showBranding) {
    /* Gold separator line at bottom of masthead */
    const hLG = ctx.createLinearGradient(M, 0, W - M, 0);
    hLG.addColorStop(0,    hexAlpha(GOLD, 0));
    hLG.addColorStop(0.05, GOLD);
    hLG.addColorStop(0.95, GOLD);
    hLG.addColorStop(1,    hexAlpha(GOLD, 0));
    ctx.fillStyle = hLG; ctx.fillRect(M, headerH - 2, W - M * 2, 2);

    /* Logo — left side */
    let titleLeft = M;
    if (brandLogo) {
      const lH = Math.min(42, brandLogo.naturalHeight);
      const lW = Rn(lH * (brandLogo.naturalWidth / brandLogo.naturalHeight));
      ctx.drawImage(brandLogo, M, Rn((headerH - lH) / 2), lW, lH);
      titleLeft = M + lW + 14;
    }

    /* Header title — LTR, left-aligned, beside logo */
    ctx.save();
    ctx.font = `700 ${Rn(24)}px 'Cairo','Tajawal',sans-serif`;
    ctx.fillStyle = NC.brandHeaderTitleColor || "#e8c84a";
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.direction = "ltr";
    ctx.fillText(NC.brandHeaderTitle || "", titleLeft, headerH / 2);
    ctx.restore();
  }

  /* 2. Image zone — starts at headerH, occupies top 38%/36% of total height */
  const imgFrac  = isStory ? 0.36 : 0.38;
  const imgH     = Rn(H * imgFrac);   // absolute Y where image block ends
  const imgDrawH = imgH - headerH;     // actual drawable height for the image

  if (bgImg) {
    const baseSc = (NC.imgFit === "contain")
      ? Math.min(W / bgImg.naturalWidth, imgDrawH / bgImg.naturalHeight)
      : Math.max(W / bgImg.naturalWidth, imgDrawH / bgImg.naturalHeight);
    const sc = baseSc * (NC.imgScale || 1.0);
    const dw = bgImg.naturalWidth * sc, dh = bgImg.naturalHeight * sc;
    const ox = Rn((NC.imgOffsetX || 0) / 100 * W);
    const oy = Rn((NC.imgOffsetY || 0) / 100 * imgDrawH);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, headerH, W, imgDrawH); ctx.clip();
    ctx.drawImage(bgImg,
      Rn((W - dw) / 2) + ox,
      headerH + Rn((imgDrawH - dh) / 2) + oy,
      Rn(dw), Rn(dh));
    ctx.restore();
    /* Soft fade at bottom of image into white */
    const fade = ctx.createLinearGradient(0, imgH - 90, 0, imgH);
    fade.addColorStop(0, "rgba(255,255,255,0)");
    fade.addColorStop(1, "#ffffff");
    ctx.fillStyle = fade; ctx.fillRect(0, imgH - 90, W, 90);
  } else {
    ctx.fillStyle = "#ebedf0"; ctx.fillRect(0, headerH, W, imgDrawH);
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,.06)"; ctx.lineWidth = 1.5;
    for (let i = -imgDrawH; i < W + imgDrawH; i += 28) {
      ctx.beginPath();
      ctx.moveTo(i, headerH); ctx.lineTo(i + imgDrawH, headerH + imgDrawH);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.font = `600 ${Rn(28)}px 'Cairo','Tajawal',sans-serif`;
    ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.textAlign = "center";
    ctx.textBaseline = "middle"; ctx.direction = "rtl";
    ctx.fillText("↑ أضف صورة من لوحة التحكم", W / 2, headerH + imgDrawH / 2);
    ctx.restore();
  }

  /* 3. Text zone starts below image */
  let curY = imgH + 44;

  /* Category + Date row */
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Rn(24)}px 'Cairo','Tajawal',sans-serif`;
  ctx.fillStyle = GOLD; ctx.textAlign = "right"; ctx.direction = "rtl";
  ctx.fillText(NC.category || "رياضة", W - M, curY);
  ctx.font = `400 ${Rn(22)}px 'Cairo','Tajawal',sans-serif`;
  ctx.fillStyle = MUTED; ctx.textAlign = "left"; ctx.direction = "ltr";
  ctx.fillText(String(NC.date || ""), M, curY);
  ctx.restore();
  curY += 38;

  /* Gold separator */
  const lineGrad = ctx.createLinearGradient(M, 0, W - M, 0);
  lineGrad.addColorStop(0,    hexAlpha(GOLD, 0));
  lineGrad.addColorStop(0.05, GOLD);
  lineGrad.addColorStop(0.95, GOLD);
  lineGrad.addColorStop(1,    hexAlpha(GOLD, 0));
  ctx.fillStyle = lineGrad; ctx.fillRect(M, curY, W - M * 2, 2);
  curY += 30;

  /* 4. Headline */
  const headSz  = Rn(W * (isStory ? 0.060 : 0.058) * (NC.headSzMult || 1.0));
  const headLH  = Rn(headSz * 1.45);
  const maxTxtW = W - M * 2;
  ctx.save();
  ctx.font = `900 ${headSz}px 'Cairo','Tajawal',sans-serif`;
  ctx.fillStyle = DARK; ctx.textAlign = "right";
  ctx.textBaseline = "top"; ctx.direction = "rtl";
  const headLines = wrapText(ctx, NC.headline || "العنوان الرئيسي", maxTxtW, 3);
  for (const ln of headLines) {
    drawHighlightedText(ctx, ln, W - M, curY, headLH, NC.highlights);
    curY += headLH;
  }
  ctx.restore();
  curY += 18;

  /* Thin rule after headline */
  ctx.fillStyle = hexAlpha(GOLD, .28);
  ctx.fillRect(M, curY, W - M * 2, 1);
  curY += 26;

  /* 5. Body text */
  const FOOT_H    = 90;
  const textBottom = H - FOOT_H - 40;
  if (NC.body && curY < textBottom) {
    const bodySz  = isStory
      ? Rn(W * 0.036 * (NC.bodySzMult || 1.0))
      : Rn(W * 0.033 * (NC.bodySzMult || 1.0));
    const bodyLH  = Rn(bodySz * 1.78);
    const maxBody = Math.max(1, Math.floor((textBottom - curY) / bodyLH));
    ctx.save();
    ctx.font = `400 ${bodySz}px 'Cairo','Tajawal',sans-serif`;
    ctx.fillStyle = BODY_C; ctx.textAlign = "right";
    ctx.textBaseline = "top"; ctx.direction = "rtl";
    const bodyLines = wrapText(ctx, NC.body, maxTxtW, maxBody);
    for (const ln of bodyLines) {
      drawHighlightedText(ctx, ln, W - M, curY, bodyLH, NC.highlights);
      curY += bodyLH;
    }
    ctx.restore();
  }

  /* 6. Footer */
  const footY = H - FOOT_H;
  ctx.save();
  ctx.strokeStyle = hexAlpha(GOLD, .28); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(M, footY); ctx.lineTo(W - M, footY); ctx.stroke();
  const footMid = footY + FOOT_H / 2;

  if (NC.showBranding) {
    ctx.save();
    ctx.fillStyle = MUTED;

    /* Reserve right space for date so social content doesn't overlap */
    ctx.font = `400 ${Rn(17)}px 'Cairo','Tajawal',sans-serif`;
    const dateW = NC.date ? ctx.measureText(String(NC.date)).width + 20 : 0;
    const maxContentRight = W - M - dateW;

    const allItems = resolveFooterItems(NC);

    if (NC.brandFooterMode === "detailed") {
      ctx.fillStyle = MUTED;
      drawFooterDetailed(ctx, allItems, M, footY, FOOT_H, maxContentRight, 16, 15, Rn);
    } else {
      ctx.fillStyle = MUTED;
      drawFooterCompact(ctx, NC, allItems, M, footY, FOOT_H, maxContentRight, 16, 16, Rn);
    }

    /* Right: date */
    ctx.font = `400 ${Rn(17)}px 'Cairo','Tajawal',sans-serif`;
    ctx.fillStyle = MUTED;
    ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.textBaseline = "middle";
    ctx.fillText(String(NC.date || ""), W - M, footMid);
    ctx.restore();
  } else {
    ctx.font = `400 ${Rn(19)}px 'Cairo','Tajawal',sans-serif`;
    ctx.fillStyle = MUTED; ctx.textAlign = "center";
    ctx.textBaseline = "middle"; ctx.direction = "ltr";
    ctx.fillText(NC.footer || "", W / 2, footMid);
  }
  ctx.restore();
}

/* ── News Card Studio component ────────────────────────────────────────── */
function NewsCardStudio({ onBack, theme, T }) {
  const isDark     = theme === "dark";
  const ncRef      = useRef(null);
  const [NC, setNC]         = useState({...DEFAULT_NC});
  const [ncBgImg,       setNcBgImg]       = useState(null);
  const [ncBgImgSrc,    setNcBgImgSrc]    = useState(null);
  const [ncBrandLogo,   setNcBrandLogo]   = useState(null);
  const [ncBrandLogoSrc,setNcBrandLogoSrc]= useState(null);
  const [exporting,     setExporting]     = useState(false);
  const UN = (k, v) => setNC(p => ({ ...p, [k]: v }));

  /* News template state */
  const [pendingTemplate, setPendingTemplate] = useState(null);

  const applyTemplate = useCallback((templateId) => {
    const tmpl = NEWS_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;
    setNC(p => ({ ...p, ...tmpl.fields, newsTemplate: templateId }));
    setPendingTemplate(null);
  }, []);

  /* Full card reset */
  const handleReset = useCallback(() => {
    setNC({...DEFAULT_NC, highlights:[]});
    setNcBgImg(null);    setNcBgImgSrc(null);
    setNcBrandLogo(null); setNcBrandLogoSrc(null);
  }, []);

  /* PNG export */
  const handleExport = useCallback(() => {
    const canvas = ncRef.current; if (!canvas) return;
    setExporting(true);
    setTimeout(() => {
      try {
        const date = new Date().toISOString().slice(0,10);
        const a = document.createElement("a");
        a.download = `news-card-${date}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      } finally { setExporting(false); }
    }, 80);
  }, []);

  /* ── Draft saving (localStorage) ─────────────────────────────────── */
  const [drafts, setDrafts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nc_studio_drafts") || "[]"); }
    catch { return []; }
  });
  const [draftName,   setDraftName]   = useState("مسودة");
  const [editingId,   setEditingId]   = useState(null);
  const [editingName, setEditingName] = useState("");
  const [draftError,  setDraftError]  = useState("");

  /* Persist drafts list to localStorage whenever it changes */
  useEffect(() => {
    try {
      localStorage.setItem("nc_studio_drafts", JSON.stringify(drafts));
      setDraftError("");
    } catch {
      setDraftError("تعذّر الحفظ: مساحة المتصفح ممتلئة. احذف مسودات قديمة أو استخدم صوراً أصغر.");
    }
  }, [drafts]);

  const saveDraft = useCallback(() => {
    const name = draftName.trim() || "مسودة";
    const savedAt = new Date().toLocaleDateString("ar-SA",
      {day:"numeric", month:"short"});
    setDrafts(prev => [{
      id: `d${Date.now()}`,
      name,
      savedAt,
      nc: JSON.parse(JSON.stringify(NC)),
      imgSrc:      ncBgImgSrc     || null,
      brandLogoSrc:ncBrandLogoSrc || null,
    }, ...prev].slice(0, 20));
    setDraftName("مسودة");
  }, [NC, draftName, ncBgImgSrc, ncBrandLogoSrc]);

  const loadDraft = useCallback((draft) => {
    setNC({ ...DEFAULT_NC, ...draft.nc,
      highlights: draft.nc.highlights || [] });
    /* Restore background image */
    if (draft.imgSrc) {
      const img = new Image();
      img.onload  = () => { setNcBgImg(img); setNcBgImgSrc(draft.imgSrc); };
      img.onerror = () => { setNcBgImg(null); setNcBgImgSrc(null); };
      img.src = draft.imgSrc;
    } else {
      setNcBgImg(null); setNcBgImgSrc(null);
    }
    /* Restore brand logo */
    if (draft.brandLogoSrc) {
      const bl = new Image();
      bl.onload  = () => { setNcBrandLogo(bl); setNcBrandLogoSrc(draft.brandLogoSrc); };
      bl.onerror = () => { setNcBrandLogo(null); setNcBrandLogoSrc(null); };
      bl.src = draft.brandLogoSrc;
    } else {
      setNcBrandLogo(null); setNcBrandLogoSrc(null);
    }
  }, []);

  const deleteDraft = useCallback((id) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  }, []);

  const renameDraft = useCallback((id, name) => {
    setDrafts(prev => prev.map(d =>
      d.id === id ? {...d, name: name.trim() || d.name} : d));
    setEditingId(null);
  }, []);

  /* Canvas height depends on template + cardSize */
  const H_CANVAS = NC.template === "longtext"
    ? (NC.cardSize === "square" ? 1080 : NC.cardSize === "story" ? 1920 : 1350)
    : 1350;

  /* Render canvas whenever state changes */
  useEffect(() => {
    const canvas = ncRef.current; if (!canvas) return;
    canvas.width = 1080; canvas.height = H_CANVAS;
    const ctx = canvas.getContext("2d");
    if (NC.template === "longtext") drawLongTextCard(ctx, NC, ncBgImg, ncBrandLogo);
    else drawNewsCard(ctx, NC, ncBgImg, ncBrandLogo);
  }, [NC, ncBgImg, ncBrandLogo, H_CANVAS]);

  /* Background image loader — keeps data-URL for draft persistence */
  const loadBg = useCallback(e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target.result;
      const img = new Image();
      img.onload = () => { setNcBgImg(img); setNcBgImgSrc(src); };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  /* Brand logo loader */
  const loadBrandLogo = useCallback(e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target.result;
      const img = new Image();
      img.onload = () => { setNcBrandLogo(img); setNcBrandLogoSrc(src); };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  /* Shared input style */
  const inp = { width:"100%", padding:"7px 10px", borderRadius:8,
    border:`1px solid ${T.inputBorder}`, background:T.inputBg,
    color:T.inputText, fontSize:13, fontFamily:"inherit", boxSizing:"border-box" };

  /* Preview dimensions (display pixels) */
  const PH = 560, PW = Math.round(PH * 1080 / H_CANVAS);
  const sizeLabel = NC.template === "longtext"
    ? (NC.cardSize === "square" ? "1080 × 1080" : NC.cardSize === "story" ? "1080 × 1920" : "1080 × 1350")
    : "1080 × 1350";

  return (
    <div dir="rtl" style={{
      fontFamily:"'Cairo','Tajawal',sans-serif",
      height:"100vh", display:"flex", flexDirection:"column",
      background: isDark ? "#07070e" : T.appBg, color:T.text, overflow:"hidden",
    }}>

      {/* Header */}
      <header style={{
        display:"flex", alignItems:"center", gap:12, padding:"12px 24px",
        borderBottom:`1px solid ${T.divider}`,
        background: isDark ? "rgba(7,7,14,.85)" : T.topBarBg,
        flexShrink:0,
      }}>
        <button onClick={onBack} style={{
          background:"none", border:`1px solid ${T.divider}`, borderRadius:8,
          padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:700, color:T.textMuted,
        }}>← الرئيسية</button>
        <div style={{fontSize:14, fontWeight:900, color:T.text}}>مصمم البطاقات الإخبارية</div>
        <div style={{
          marginRight:"auto", borderRadius:999, padding:"3px 10px",
          background:"rgba(16,185,129,.1)", border:"1px solid rgba(16,185,129,.25)",
          fontSize:9, fontWeight:700, color:"#10b981",
        }}>News Card Studio</div>
        <button onClick={handleExport} disabled={exporting} style={{
          padding:"6px 16px", borderRadius:8, cursor: exporting ? "default" : "pointer",
          fontSize:12, fontWeight:700, border:"none",
          background: exporting ? T.btnBg : T.accent,
          color: exporting ? T.textMuted : T.accentFg,
          opacity: exporting ? .7 : 1,
          flexShrink:0,
        }}>{exporting ? "جاري التصدير..." : "⬇ تصدير PNG"}</button>
      </header>

      {/* Body */}
      <div style={{flex:1, display:"flex", overflow:"hidden"}}>

        {/* LEFT: controls */}
        <aside style={{
          width:284, flexShrink:0, overflowY:"auto", padding:"0 0 24px",
          borderLeft:`1px solid ${T.divider}`, background:T.sidebarBg,
          display:"flex", flexDirection:"column",
        }}>

          {/* Shared helpers */}
          {(() => {
            /* Section header (label + optional reset button) */
            const SH = ({ label, onReset }) => (
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"10px 14px 6px",
                borderBottom:`1px solid ${T.divider}`,
                marginBottom:10,
              }}>
                <span style={{fontSize:9, fontWeight:800, color:T.secTitle,
                  letterSpacing:".08em", textTransform:"uppercase"}}>{label}</span>
                {onReset && (
                  <button onClick={onReset} style={{
                    fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:4,
                    border:`1px solid ${T.inputBorder}`, background:T.btnBg,
                    color:T.textMuted, cursor:"pointer", lineHeight:1.4,
                  }}>إعادة ضبط</button>
                )}
              </div>
            );

            /* Toggle button group */
            const BtnGroup = ({ options, active, onSelect, gap=6 }) => (
              <div style={{display:"flex", gap, padding:"0 14px 12px"}}>
                {options.map(([val,lbl]) => (
                  <button key={val} onClick={()=>onSelect(val)} style={{
                    flex:1, padding:"6px 4px", borderRadius:8, cursor:"pointer",
                    fontSize:11, fontWeight:700,
                    border:`1px solid ${active===val ? T.accent : T.inputBorder}`,
                    background: active===val ? T.accent : T.btnBg,
                    color: active===val ? T.accentFg : T.btnText,
                  }}>{lbl}</button>
                ))}
              </div>
            );

            /* Slider row */
            const SliderRow = ({ label, value, min, max, display, onChange }) => (
              <div style={{display:"flex", alignItems:"center", gap:6, padding:"0 14px", marginBottom:5}}>
                <span style={{fontSize:10, color:T.textMuted, minWidth:36,
                  direction:"rtl", textAlign:"right"}}>{label}</span>
                <input type="range" min={min} max={max} step={1} value={value}
                  onChange={e => onChange(Number(e.target.value))}
                  style={{flex:1, accentColor:T.accent, cursor:"pointer"}}
                />
                <span style={{fontSize:10, color:T.textMuted, width:34, textAlign:"left"}}>
                  {display}
                </span>
              </div>
            );

            return (
              <>
                {/* ── 0. Full reset ── */}
                <div style={{padding:"12px 14px 0"}}>
                  <button onClick={handleReset} style={{
                    width:"100%", padding:"8px", borderRadius:8, cursor:"pointer",
                    border:`1px solid rgba(239,68,68,.30)`,
                    background:"rgba(239,68,68,.07)",
                    fontSize:11, fontWeight:700, color:"#ef4444",
                  }}>↺ إعادة تعيين البطاقة</button>
                </div>

                {/* ── Presets ── */}
                <div>
                  <SH label="الأنماط الجاهزة" />
                  <div style={{
                    display:"grid", gridTemplateColumns:"repeat(3,1fr)",
                    gap:6, padding:"0 14px 12px",
                  }}>
                    {Object.entries(NC_PRESETS).map(([key, pr]) => (
                      <button key={key}
                        onClick={() => setNC(p => ({
                          ...p, preset:key, gradient:pr.gradient,
                          accentColor:pr.accentColor, headColor:pr.headColor,
                          subColor:pr.subColor, bodyColor:pr.bodyColor,
                        }))}
                        style={{
                          padding:"7px 4px 5px", borderRadius:8, cursor:"pointer",
                          display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                          border:`2px solid ${NC.preset===key ? T.accent : T.inputBorder}`,
                          background: NC.preset===key ? T.accentBg : T.btnBg,
                        }}
                      >
                        <div style={{display:"flex", gap:2}}>
                          {pr.sw.map((c,i) => (
                            <div key={i} style={{
                              width:10, height:10, borderRadius:2, background:c,
                              border:"1px solid rgba(0,0,0,.18)",
                            }}/>
                          ))}
                        </div>
                        <span style={{fontSize:9, fontWeight:700, color:T.text,
                          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                          maxWidth:"100%"}}>{pr.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── 1. نوع البطاقة ── */}
                <div style={{paddingTop:14}}>
                  <SH label="نوع البطاقة" />
                  <BtnGroup
                    options={[["image","بطاقة إخبارية"],["longtext","نص طويل"]]}
                    active={NC.template}
                    onSelect={v => UN("template", v)}
                  />
                </div>

                {/* ── 2. حجم البطاقة (longtext only) ── */}
                {NC.template === "longtext" && (
                  <div>
                    <SH label="حجم البطاقة" />
                    <BtnGroup
                      options={[["portrait","عمودي"],["square","مربع"],["story","ستوري"]]}
                      active={NC.cardSize}
                      onSelect={v => UN("cardSize", v)}
                    />
                  </div>
                )}

                {/* ── 2b. هوية البطاقة (shared across all templates) ── */}
                <div>
                  <SH label="هوية البطاقة" />
                  <BtnGroup
                    options={[["true","إظهار الهوية"],["false","إخفاء"]]}
                    active={String(NC.showBranding)}
                    onSelect={v => UN("showBranding", v === "true")}
                  />

                  {NC.showBranding && (
                    <div style={{marginTop:10, display:"flex", flexDirection:"column", gap:10}}>

                      {/* Identity presets */}
                      <div>
                        <div style={{fontSize:10, fontWeight:600, marginBottom:6,
                          color: isDark?"rgba(255,255,255,.40)":"rgba(0,0,0,.40)",
                          direction:"rtl"}}>هوية جاهزة</div>
                        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:5}}>
                          {IDENTITY_PRESETS.map(preset => (
                            <button key={preset.id}
                              onClick={() => setNC(p => ({...p, ...preset.fields}))}
                              style={{
                                padding:"6px 4px", borderRadius:7, cursor:"pointer",
                                fontSize:10, fontWeight:600, textAlign:"center",
                                direction:"rtl",
                                border:`1px solid ${
                                  NC.brandIdentityPreset === preset.id
                                    ? T.accent : T.inputBorder
                                }`,
                                background: NC.brandIdentityPreset === preset.id
                                  ? isDark?"rgba(232,200,74,.15)":"rgba(232,200,74,.12)"
                                  : T.btnBg,
                                color: NC.brandIdentityPreset === preset.id
                                  ? T.accent : T.btnText,
                              }}>
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Logo upload */}
                      <div>
                        <div style={{fontSize:11, fontWeight:600, marginBottom:4,
                          color: isDark?"rgba(255,255,255,.45)":"rgba(0,0,0,.45)",
                          direction:"rtl"}}>شعار الجهة</div>
                        <label style={{
                          display:"block", padding:"8px 10px", borderRadius:7,
                          cursor:"pointer", textAlign:"center",
                          border:`1px dashed ${T.inputBorder}`,
                          background:T.inputBg, fontSize:11,
                          color: ncBrandLogo ? "#10b981" : T.textMuted,
                        }}>
                          {ncBrandLogo ? "✓ تم رفع الشعار" : "رفع شعار..."}
                          <input type="file" accept="image/*"
                            onChange={loadBrandLogo} style={{display:"none"}}/>
                        </label>
                        {ncBrandLogo && (
                          <button
                            onClick={()=>{setNcBrandLogo(null);setNcBrandLogoSrc(null);}}
                            style={{
                              width:"100%", padding:"5px", borderRadius:6, marginTop:4,
                              border:`1px solid ${T.btnBorder}`, background:T.btnBg,
                              cursor:"pointer", fontSize:11, color:T.btnText,
                            }}>حذف الشعار</button>
                        )}
                      </div>

                      {/* Header title + color */}
                      <div>
                        <div style={{fontSize:11, fontWeight:600, marginBottom:4,
                          color: isDark?"rgba(255,255,255,.45)":"rgba(0,0,0,.45)",
                          direction:"rtl"}}>
                          {NC.template === "image" ? "نص التذييل اليميني" : "عنوان الهيدر"}
                        </div>
                        <div style={{display:"flex", gap:6, alignItems:"center"}}>
                          <input value={NC.brandHeaderTitle||""} dir="rtl"
                            onChange={e=>UN("brandHeaderTitle",e.target.value)}
                            placeholder="أخبار كرة القدم"
                            style={{...inp, fontSize:12, flex:1}}/>
                          <input type="color"
                            value={NC.brandHeaderTitleColor||"#e8c84a"}
                            onChange={e=>UN("brandHeaderTitleColor",e.target.value)}
                            style={{
                              width:30, height:30, border:"none", borderRadius:5,
                              cursor:"pointer", background:"transparent",
                              padding:2, flexShrink:0,
                            }}/>
                        </div>
                      </div>

                      {/* Footer display mode */}
                      <div>
                        <div style={{fontSize:11, fontWeight:600, marginBottom:6,
                          color: isDark?"rgba(255,255,255,.45)":"rgba(0,0,0,.45)",
                          direction:"rtl"}}>طريقة عرض حسابات التواصل</div>
                        <BtnGroup
                          options={[["compact","مختصر"],["detailed","تفصيلي"]]}
                          active={NC.brandFooterMode||"compact"}
                          onSelect={v => UN("brandFooterMode", v)}
                        />
                      </div>

                      {/* Platform list: toggle + reorder + text field */}
                      <div>
                        <div style={{fontSize:10, fontWeight:600, marginBottom:6,
                          color: isDark?"rgba(255,255,255,.40)":"rgba(0,0,0,.40)",
                          direction:"rtl"}}>المنصات — ترتيب وتفعيل</div>
                        {(NC.brandPlatforms || DEFAULT_PLATFORMS).map((p, i, arr) => {
                          const meta  = PLAT_META[p.id];
                          const field = PLAT_FIELD[p.id];
                          return (
                            <div key={p.id} style={{
                              display:"flex", alignItems:"center", gap:4,
                              marginBottom:5, opacity: p.on ? 1 : 0.45,
                            }}>
                              {/* Up / Down */}
                              <div style={{display:"flex",flexDirection:"column",gap:1,flexShrink:0}}>
                                <button
                                  onClick={() => setNC(prev => {
                                    const pl = [...(prev.brandPlatforms || DEFAULT_PLATFORMS)];
                                    if (i > 0) { [pl[i-1],pl[i]] = [pl[i],pl[i-1]]; }
                                    return {...prev, brandPlatforms:pl, brandIdentityPreset:""};
                                  })}
                                  disabled={i === 0}
                                  style={{
                                    width:14,height:14,padding:0,border:"none",
                                    background:"transparent",
                                    cursor:i===0?"default":"pointer",
                                    color:i===0
                                      ?isDark?"rgba(255,255,255,.15)":"rgba(0,0,0,.15)"
                                      :isDark?"rgba(255,255,255,.55)":"rgba(0,0,0,.55)",
                                    fontSize:9,lineHeight:1,display:"flex",
                                    alignItems:"center",justifyContent:"center",
                                  }}>▲</button>
                                <button
                                  onClick={() => setNC(prev => {
                                    const pl = [...(prev.brandPlatforms || DEFAULT_PLATFORMS)];
                                    if (i < pl.length-1) { [pl[i+1],pl[i]] = [pl[i],pl[i+1]]; }
                                    return {...prev, brandPlatforms:pl, brandIdentityPreset:""};
                                  })}
                                  disabled={i === arr.length - 1}
                                  style={{
                                    width:14,height:14,padding:0,border:"none",
                                    background:"transparent",
                                    cursor:i===arr.length-1?"default":"pointer",
                                    color:i===arr.length-1
                                      ?isDark?"rgba(255,255,255,.15)":"rgba(0,0,0,.15)"
                                      :isDark?"rgba(255,255,255,.55)":"rgba(0,0,0,.55)",
                                    fontSize:9,lineHeight:1,display:"flex",
                                    alignItems:"center",justifyContent:"center",
                                  }}>▼</button>
                              </div>

                              {/* On / Off toggle */}
                              <button
                                onClick={() => setNC(prev => {
                                  const pl = (prev.brandPlatforms || DEFAULT_PLATFORMS)
                                    .map((x,j) => j===i ? {...x,on:!x.on} : x);
                                  return {...prev, brandPlatforms:pl, brandIdentityPreset:""};
                                })}
                                style={{
                                  width:16,height:16,borderRadius:"50%",padding:0,
                                  border:`2px solid ${p.on
                                    ? meta.color
                                    : isDark?"rgba(255,255,255,.25)":"rgba(0,0,0,.25)"}`,
                                  background: p.on ? meta.color : "transparent",
                                  cursor:"pointer",flexShrink:0,
                                }}/>

                              {/* Label */}
                              <span style={{
                                fontSize:10,fontWeight:600,minWidth:58,direction:"rtl",
                                color:isDark?"rgba(255,255,255,.55)":"rgba(0,0,0,.55)",
                              }}>{meta.label}</span>

                              {/* Text field */}
                              <input value={NC[field]||""} dir="ltr"
                                onChange={e=>UN(field,e.target.value)}
                                placeholder={meta.ph}
                                style={{
                                  flex:1,fontSize:11,padding:"3px 6px",borderRadius:5,
                                  border:`1px solid ${isDark?"rgba(255,255,255,.12)":"rgba(0,0,0,.12)"}`,
                                  background:isDark?"rgba(255,255,255,.05)":"rgba(0,0,0,.03)",
                                  color:isDark?"#e8e8f0":"#1a1a2e",outline:"none",
                                }}/>
                            </div>
                          );
                        })}
                      </div>

                      {/* Compact-only: short handle + long name */}
                      {(NC.brandFooterMode||"compact") === "compact" && (
                        <div style={{
                          borderTop:`1px solid ${isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)"}`,
                          paddingTop:8, display:"flex", flexDirection:"column", gap:8,
                        }}>
                          <div>
                            <div style={{fontSize:11,fontWeight:600,marginBottom:4,
                              color:isDark?"rgba(255,255,255,.45)":"rgba(0,0,0,.45)",
                              direction:"rtl"}}>الحساب المختصر (IG / X / TikTok)</div>
                            <input value={NC.brandShortHandle||""} dir="ltr"
                              onChange={e=>UN("brandShortHandle",e.target.value)}
                              placeholder="omanfa"
                              style={{...inp,fontSize:12}}/>
                          </div>
                          <div>
                            <div style={{fontSize:11,fontWeight:600,marginBottom:4,
                              color:isDark?"rgba(255,255,255,.45)":"rgba(0,0,0,.45)",
                              direction:"rtl"}}>الاسم الطويل / الصفحة (FB / YT)</div>
                            <input value={NC.brandLongName||""} dir="ltr"
                              onChange={e=>UN("brandLongName",e.target.value)}
                              placeholder="oman football association"
                              style={{...inp,fontSize:12}}/>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>

                {/* ── 3. نوع التدرج (image only) ── */}
                {NC.template === "image" && (
                  <div>
                    <SH label="نوع التدرج" />
                    <BtnGroup
                      options={[["strong","غامق"],["soft","ناعم"],["none","بدون"]]}
                      active={NC.gradient}
                      onSelect={v => UN("gradient", v)}
                    />
                  </div>
                )}

                {/* ── 4. أحجام النص ── */}
                <div>
                  <SH label="أحجام النص"
                    onReset={() => setNC(p => ({...p, headSzMult:1, subSzMult:1, bodySzMult:1}))}
                  />
                  <SliderRow label="العنوان"
                    value={Math.round((NC.headSzMult||1)*100)} min={60} max={150}
                    display={`${Math.round((NC.headSzMult||1)*100)}%`}
                    onChange={v => UN("headSzMult", v/100)}
                  />
                  {NC.template === "image" && (
                    <SliderRow label="الفرعي"
                      value={Math.round((NC.subSzMult||1)*100)} min={60} max={150}
                      display={`${Math.round((NC.subSzMult||1)*100)}%`}
                      onChange={v => UN("subSzMult", v/100)}
                    />
                  )}
                  {NC.template === "longtext" && (
                    <SliderRow label="النص"
                      value={Math.round((NC.bodySzMult||1)*100)} min={60} max={150}
                      display={`${Math.round((NC.bodySzMult||1)*100)}%`}
                      onChange={v => UN("bodySzMult", v/100)}
                    />
                  )}
                  <div style={{height:4}}/>
                </div>

                {/* ── 5a. قوالب الخبر ── */}
                <div>
                  <SH label="قوالب الخبر" />
                  <div style={{padding:"0 14px 12px"}}>
                    <div style={{
                      display:"grid", gridTemplateColumns:"1fr 1fr",
                      gap:6, marginBottom: pendingTemplate ? 8 : 0,
                    }}>
                      {NEWS_TEMPLATES.map(tmpl => {
                        const isActive  = NC.newsTemplate === tmpl.id;
                        const isPending = pendingTemplate === tmpl.id;
                        return (
                          <button key={tmpl.id}
                            onClick={() => {
                              if (isPending) {
                                setPendingTemplate(null);
                                return;
                              }
                              /* Check if article text has been customised */
                              const hasContent =
                                NC.headline    !== DEFAULT_NC.headline ||
                                NC.body        !== DEFAULT_NC.body     ||
                                NC.category    !== DEFAULT_NC.category;
                              if (hasContent && NC.newsTemplate !== tmpl.id) {
                                setPendingTemplate(tmpl.id);
                              } else {
                                applyTemplate(tmpl.id);
                              }
                            }}
                            style={{
                              padding:"8px 6px", borderRadius:8,
                              cursor:"pointer", textAlign:"center",
                              border:`1px solid ${
                                isActive  ? T.accent
                                : isPending
                                  ? isDark?"rgba(255,255,255,.28)":"rgba(0,0,0,.22)"
                                  : T.inputBorder
                              }`,
                              background: isActive
                                ? isDark?"rgba(232,200,74,.15)":"rgba(232,200,74,.12)"
                                : isPending
                                  ? isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.05)"
                                  : T.btnBg,
                              color: isActive ? T.accent : T.btnText,
                            }}>
                            <div style={{fontSize:12, fontWeight:700, direction:"rtl"}}>
                              {tmpl.label}
                            </div>
                            <div style={{fontSize:9, opacity:0.55, marginTop:2}}>
                              {tmpl.sublabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Inline confirmation */}
                    {pendingTemplate && (
                      <div style={{
                        padding:"10px 12px", borderRadius:8,
                        background: isDark?"rgba(255,255,255,.05)":"rgba(0,0,0,.04)",
                        border:`1px solid ${isDark?"rgba(255,255,255,.10)":"rgba(0,0,0,.09)"}`,
                      }}>
                        <div style={{
                          fontSize:11, direction:"rtl", marginBottom:8,
                          color: isDark?"rgba(255,255,255,.75)":"rgba(0,0,0,.65)",
                        }}>
                          سيتم استبدال النص الحالي. هل تريد المتابعة؟
                        </div>
                        <div style={{display:"flex", gap:6}}>
                          <button
                            onClick={() => applyTemplate(pendingTemplate)}
                            style={{
                              flex:1, padding:"6px", borderRadius:6,
                              cursor:"pointer", fontSize:11, fontWeight:700,
                              background:T.accent, border:"none", color:T.accentFg,
                            }}>تطبيق</button>
                          <button
                            onClick={() => setPendingTemplate(null)}
                            style={{
                              flex:1, padding:"6px", borderRadius:6,
                              cursor:"pointer", fontSize:11,
                              background:T.btnBg,
                              border:`1px solid ${T.btnBorder}`, color:T.btnText,
                            }}>إلغاء</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 5. بيانات الخبر ── */}
                <div>
                  <SH label="بيانات الخبر" />
                  <div style={{display:"flex", flexDirection:"column", gap:10, padding:"0 14px 12px"}}>

                    <div>
                      <div style={{fontSize:10, fontWeight:600, color:T.secTitle,
                        marginBottom:4, direction:"rtl"}}>التصنيف</div>
                      <input value={NC.category} onChange={e=>UN("category",e.target.value)}
                        style={inp} dir="rtl"/>
                    </div>

                    <div>
                      <div style={{fontSize:10, fontWeight:600, color:T.secTitle,
                        marginBottom:4, direction:"rtl"}}>التاريخ</div>
                      <input value={NC.date} onChange={e=>UN("date",e.target.value)}
                        style={inp} dir="rtl"/>
                    </div>

                    <div>
                      <div style={{fontSize:10, fontWeight:600, color:T.secTitle,
                        marginBottom:4, direction:"rtl"}}>العنوان الرئيسي</div>
                      <textarea value={NC.headline} onChange={e=>UN("headline",e.target.value)}
                        rows={3} dir="rtl" style={{...inp, resize:"vertical"}}/>
                    </div>

                    {NC.template === "image" && (
                      <div>
                        <div style={{fontSize:10, fontWeight:600, color:T.secTitle,
                          marginBottom:4, direction:"rtl"}}>العنوان الفرعي</div>
                        <textarea value={NC.subheadline} onChange={e=>UN("subheadline",e.target.value)}
                          rows={3} dir="rtl" style={{...inp, resize:"vertical"}}/>
                      </div>
                    )}

                    {NC.template === "longtext" && (
                      <div>
                        <div style={{fontSize:10, fontWeight:600, color:T.secTitle,
                          marginBottom:4, direction:"rtl"}}>نص الخبر</div>
                        <textarea value={NC.body} onChange={e=>UN("body",e.target.value)}
                          rows={8} dir="rtl" style={{...inp, resize:"vertical", lineHeight:1.6}}/>
                      </div>
                    )}

                    <div>
                      <div style={{fontSize:10, fontWeight:600, color:T.secTitle,
                        marginBottom:4, direction:"rtl"}}>الموقع / النص السفلي</div>
                      <input value={NC.footer} onChange={e=>UN("footer",e.target.value)}
                        style={inp} dir="ltr"/>
                    </div>

                  </div>
                </div>

                {/* ── 6. تمييز الكلمات ── */}
                <div>
                  <SH label="تمييز الكلمات"
                    onReset={() => UN("highlights", [])}
                  />
                  <div style={{padding:"0 14px 12px"}}>
                    {NC.highlights.map((h, i) => (
                      <div key={i} style={{display:"flex", gap:4, marginBottom:6, alignItems:"center"}}>
                        <input
                          value={h.phrase}
                          onChange={e => {
                            const n = [...NC.highlights];
                            n[i] = {...n[i], phrase: e.target.value};
                            UN("highlights", n);
                          }}
                          placeholder="الكلمة أو العبارة"
                          dir="rtl"
                          style={{...inp, flex:1, fontSize:11, padding:"5px 8px"}}
                        />
                        <input type="color" value={h.color}
                          onChange={e => {
                            const n = [...NC.highlights];
                            n[i] = {...n[i], color: e.target.value};
                            UN("highlights", n);
                          }}
                          style={{width:28, height:28, padding:2, border:"none",
                            borderRadius:5, cursor:"pointer", flexShrink:0}}
                        />
                        <button
                          onClick={() => UN("highlights", NC.highlights.filter((_,j)=>j!==i))}
                          style={{
                            width:24, height:24, borderRadius:5, flexShrink:0,
                            border:`1px solid ${T.inputBorder}`, background:T.btnBg,
                            color:T.textMuted, cursor:"pointer", fontSize:15,
                            display:"flex", alignItems:"center", justifyContent:"center", padding:0,
                          }}
                        >×</button>
                      </div>
                    ))}
                    {/* Preset swatches + add button */}
                    <div style={{display:"flex", gap:5, alignItems:"center", marginTop:4}}>
                      {["#e8c84a","#ef4444","#22c55e","#3b82f6","#ffffff"].map(clr=>(
                        <button key={clr} title={clr}
                          onClick={() => UN("highlights", [...NC.highlights, {phrase:"", color:clr}])}
                          style={{
                            width:22, height:22, borderRadius:5, background:clr, flexShrink:0,
                            border:"1px solid rgba(0,0,0,.22)", cursor:"pointer", padding:0,
                          }}
                        />
                      ))}
                      <button
                        onClick={() => UN("highlights", [...NC.highlights, {phrase:"", color:"#e8c84a"}])}
                        style={{
                          flex:1, padding:"4px 6px", borderRadius:5, fontSize:10, fontWeight:700,
                          border:`1px dashed ${T.inputBorder}`, background:T.btnBg,
                          color:T.textMuted, cursor:"pointer",
                        }}
                      >+ تمييز</button>
                    </div>
                  </div>
                </div>

                {/* ── 7. صورة الخلفية ── */}
                <div>
                  <SH label="صورة الخلفية" />
                  <div style={{padding:"0 14px"}}>
                    <label style={{
                      display:"block", padding:"10px", borderRadius:8, cursor:"pointer",
                      textAlign:"center", border:`1px dashed ${T.inputBorder}`,
                      background:T.inputBg, fontSize:11,
                      color: ncBgImg ? "#10b981" : T.textMuted, marginBottom:6,
                    }}>
                      {ncBgImg ? "✓ تم رفع الصورة" : "اختر صورة..."}
                      <input type="file" accept="image/*" onChange={loadBg} style={{display:"none"}}/>
                    </label>
                    {ncBgImg && (
                      <button onClick={()=>{ setNcBgImg(null); setNcBgImgSrc(null); }} style={{
                        width:"100%", padding:"6px", borderRadius:6, marginBottom:14,
                        border:`1px solid ${T.btnBorder}`, background:T.btnBg,
                        cursor:"pointer", fontSize:11, color:T.btnText,
                      }}>حذف الصورة</button>
                    )}
                  </div>

                  {/* Image controls — only when image loaded */}
                  {ncBgImg && (
                    <div>
                      <SH label="التحكم بالصورة"
                        onReset={() => setNC(p => ({...p, imgScale:1, imgOffsetX:0, imgOffsetY:0, imgFit:"cover"}))}
                      />
                      <BtnGroup
                        options={[["cover","تعبئة"],["contain","ملاءمة"]]}
                        active={NC.imgFit}
                        onSelect={v => UN("imgFit", v)}
                      />
                      <SliderRow label="تكبير"
                        value={Math.round((NC.imgScale||1)*100)} min={50} max={300}
                        display={`${Math.round((NC.imgScale||1)*100)}%`}
                        onChange={v => UN("imgScale", v/100)}
                      />
                      <SliderRow label="أفقي"
                        value={NC.imgOffsetX||0} min={-50} max={50}
                        display={NC.imgOffsetX||0}
                        onChange={v => UN("imgOffsetX", v)}
                      />
                      <SliderRow label="عمودي"
                        value={NC.imgOffsetY||0} min={-50} max={50}
                        display={NC.imgOffsetY||0}
                        onChange={v => UN("imgOffsetY", v)}
                      />
                      <div style={{height:4}}/>
                    </div>
                  )}
                </div>

                {/* ── 9. المسودات ── */}
                <div style={{borderTop:`1px solid ${isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)"}`, paddingTop:14}}>
                  <SH>المسودات</SH>

                  {/* Save row */}
                  <div style={{display:"flex", gap:6, marginBottom:6}}>
                    <input
                      value={draftName}
                      onChange={e => setDraftName(e.target.value)}
                      placeholder="اسم المسودة"
                      style={{
                        flex:1, fontSize:12, padding:"5px 8px",
                        borderRadius:6, border:`1px solid ${isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.14)"}`,
                        background: isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)",
                        color: isDark ? "#e8e8f0" : "#1a1a2e",
                        outline:"none", direction:"rtl",
                      }}
                    />
                    <button
                      onClick={saveDraft}
                      style={{
                        padding:"5px 12px", fontSize:12, borderRadius:6,
                        border:"none", cursor:"pointer", whiteSpace:"nowrap",
                        background:"#3b82f6", color:"#fff", fontWeight:600,
                      }}
                    >حفظ</button>
                  </div>

                  {/* Storage hint */}
                  <div style={{
                    fontSize:10, marginBottom:8,
                    color: isDark ? "rgba(255,255,255,.28)" : "rgba(0,0,0,.30)",
                  }}>
                    {ncBgImg ? "الصورة الحالية ستُحفظ مع المسودة" : "لا توجد صورة مرفقة"}
                  </div>

                  {/* Error message (e.g. storage quota exceeded) */}
                  {draftError && (
                    <div style={{
                      fontSize:11, padding:"6px 8px", borderRadius:6, marginBottom:8,
                      background: isDark ? "rgba(239,68,68,.18)" : "rgba(239,68,68,.1)",
                      color:"#ef4444", direction:"rtl",
                    }}>{draftError}</div>
                  )}

                  {/* Draft list */}
                  {drafts.length === 0 ? (
                    <div style={{
                      fontSize:11, textAlign:"center", padding:"12px 0",
                      color: isDark ? "rgba(255,255,255,.28)" : "rgba(0,0,0,.30)",
                    }}>لا توجد مسودات محفوظة</div>
                  ) : (
                    <div style={{
                      display:"flex", flexDirection:"column", gap:5,
                      maxHeight:220, overflowY:"auto", paddingLeft:2, paddingRight:2,
                    }}>
                      {drafts.map(draft => (
                        <div key={draft.id} style={{
                          display:"flex", alignItems:"center", gap:5,
                          background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)",
                          borderRadius:7, padding:"6px 8px",
                          border:`1px solid ${isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)"}`,
                        }}>
                          {/* Name / inline rename */}
                          {editingId === draft.id ? (
                            <input
                              autoFocus
                              defaultValue={draft.name}
                              onBlur={e => renameDraft(draft.id, e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") renameDraft(draft.id, e.target.value);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              style={{
                                flex:1, fontSize:11, padding:"3px 6px",
                                borderRadius:5, border:`1px solid #3b82f6`,
                                background: isDark ? "rgba(255,255,255,.08)" : "#fff",
                                color: isDark ? "#e8e8f0" : "#1a1a2e",
                                outline:"none", direction:"rtl",
                              }}
                            />
                          ) : (
                            <div style={{flex:1, minWidth:0}}>
                              <div
                                onClick={() => { setEditingId(draft.id); }}
                                title="انقر للتعديل"
                                style={{
                                  fontSize:12, fontWeight:600, cursor:"text",
                                  color: isDark ? "#e8e8f0" : "#1a1a2e",
                                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                                }}
                              >{draft.name}</div>
                              <div style={{
                                fontSize:10,
                                color: isDark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.38)",
                              }}>
                                {draft.savedAt}
                                {draft.imgSrc && (
                                  <span style={{
                                    marginRight:5, padding:"1px 5px", borderRadius:4,
                                    background: isDark ? "rgba(16,185,129,.2)" : "rgba(16,185,129,.15)",
                                    color:"#10b981", fontSize:9, fontWeight:600,
                                  }}>صورة</span>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Load */}
                          <button
                            onClick={() => loadDraft(draft)}
                            style={{
                              padding:"3px 8px", fontSize:11, borderRadius:5,
                              border:"none", cursor:"pointer", whiteSpace:"nowrap",
                              background: isDark ? "rgba(59,130,246,.25)" : "rgba(59,130,246,.15)",
                              color:"#3b82f6", fontWeight:600,
                            }}
                          >تحميل</button>
                          {/* Delete */}
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            style={{
                              width:22, height:22, display:"flex", alignItems:"center",
                              justifyContent:"center", borderRadius:5, border:"none",
                              cursor:"pointer", flexShrink:0,
                              background: isDark ? "rgba(239,68,68,.18)" : "rgba(239,68,68,.12)",
                              color:"#ef4444", fontWeight:700, fontSize:13, lineHeight:1,
                            }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </>
            );
          })()}

        </aside>

        {/* RIGHT: preview stage */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          background: isDark
            ? "radial-gradient(ellipse at 50% 35%,#14142a 0%,#09090f 100%)"
            : "#dde1e7",
          overflow:"auto", padding:24, gap:10,
        }}>
          <div style={{fontSize:10, fontWeight:600, letterSpacing:".06em",
            color: isDark ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.28)"}}>
            {sizeLabel} px
          </div>
          <canvas ref={ncRef} style={{
            display:"block", width:PW, height:PH,
            borderRadius:10,
            boxShadow:`0 0 0 1px ${isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)"}, 0 24px 80px rgba(0,0,0,.55)`,
          }}/>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT APP — view router
═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [view, setView]   = useState("studio");
  const [theme, setTheme] = useState("dark");
  const T = theme === "dark" ? DARK_T : LIGHT_T;
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  if (view === "designer")
    return <Designer onBack={() => setView("studio")} theme={theme} onThemeToggle={toggleTheme} />;
  if (view === "newscard")
    return <NewsCardStudio onBack={() => setView("studio")} theme={theme} T={T} />;
  return <StudioHome onOpen={() => setView("designer")} onOpenNews={() => setView("newscard")} theme={theme} onThemeToggle={toggleTheme} T={T} />;
}
