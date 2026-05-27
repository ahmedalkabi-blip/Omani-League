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
function drawNewsCard(ctx, NC, bgImg) {
  const W = 1080, H = 1350, Rn = Math.round;
  const M = 64;                          // side margin
  const FOOT_H = 100;                    // footer zone height

  /* ── Helper: wrap text, max N lines, last line gets "…" if truncated ── */
  function wrapLines(text, maxW, maxLines) {
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
      // If we still have remaining words, truncate last line
      const remaining = words.slice(words.indexOf(cur.split(" ")[0]));
      const joined = remaining.join(" ");
      if (ctx.measureText(joined).width > maxW) {
        // Find how much fits with "…"
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

  /* ── 1. BASE: full-canvas image or dark editorial background ────────── */
  if (bgImg) {
    /* Cover-fit image to full canvas */
    const sc = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
    const dw = bgImg.naturalWidth * sc, dh = bgImg.naturalHeight * sc;
    ctx.drawImage(bgImg, Rn((W - dw) / 2), Rn((H - dh) / 2), Rn(dw), Rn(dh));
  } else {
    /* No image: dark editorial base + upper image-zone placeholder */
    const baseBg = ctx.createLinearGradient(0, 0, 0, H);
    baseBg.addColorStop(0, "#141921");
    baseBg.addColorStop(1, "#08090f");
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

  /* ── 2. GRADIENT OVERLAYS ──────────────────────────────────────────── */
  /* Top: darken for category + date readability */
  const topOv = ctx.createLinearGradient(0, 0, 0, H * 0.24);
  topOv.addColorStop(0, "rgba(0,0,0,.70)");
  topOv.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topOv; ctx.fillRect(0, 0, W, Rn(H * 0.24));

  /* Bottom: from 38% → full-black by 72%, stays opaque to footer */
  const botOv = ctx.createLinearGradient(0, H * 0.38, 0, H * 0.72);
  botOv.addColorStop(0, "rgba(0,0,0,0)");
  botOv.addColorStop(1, "rgba(0,0,0,.97)");
  ctx.fillStyle = botOv; ctx.fillRect(0, Rn(H * 0.38), W, Rn(H * 0.34));
  /* Solid black from 72% onward */
  ctx.fillStyle = "rgba(0,0,0,.97)";
  ctx.fillRect(0, Rn(H * 0.72), W, H - Rn(H * 0.72));

  /* ── 3. CATEGORY BADGE — top-right ────────────────────────────────── */
  const cat = NC.category || "رياضة";
  ctx.save();
  ctx.font = `700 ${Rn(26)}px 'Cairo','Tajawal',sans-serif`;
  ctx.direction = "rtl"; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 12;
  const catTW  = ctx.measureText(cat).width;
  const catPW  = Rn(catTW + 48), catPH = 50;
  const catX   = W - M - catPW, catY = 56;
  ctx.beginPath(); ctx.roundRect(catX, catY, catPW, catPH, catPH / 2);
  ctx.fillStyle = "#e8c84a"; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#000"; ctx.textAlign = "center";
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
  const lineY = Rn(H * 0.616);
  const lineGrad = ctx.createLinearGradient(M, 0, W - M, 0);
  lineGrad.addColorStop(0,    "rgba(232,200,74,0)");
  lineGrad.addColorStop(0.06, "#e8c84a");
  lineGrad.addColorStop(0.94, "#e8c84a");
  lineGrad.addColorStop(1,    "rgba(232,200,74,0)");
  ctx.fillStyle = lineGrad;
  ctx.fillRect(M, lineY, W - M * 2, 3);

  /* ── 6. HEADLINE — large, bold, RTL wrapped ────────────────────────── */
  const headSz   = Rn(W * 0.068);        // ~73 px
  const headLH   = Rn(headSz * 1.28);
  const maxTxtW  = W - M * 2;
  const headMaxL = 4;

  ctx.save();
  ctx.font = `900 ${headSz}px 'Cairo','Tajawal',sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right"; ctx.textBaseline = "top"; ctx.direction = "rtl";
  ctx.shadowColor = "rgba(0,0,0,.7)"; ctx.shadowBlur = 22;
  const headLines = wrapLines(NC.headline || "العنوان الرئيسي", maxTxtW, headMaxL);
  let headY = lineY + 36;
  for (const ln of headLines) { ctx.fillText(ln, W - M, headY); headY += headLH; }
  ctx.restore();
  const afterHead = headY;

  /* ── 7. SUBHEADLINE — smaller, muted, max 3 lines ──────────────────── */
  const textBottom = H - FOOT_H - 32;      // don't let text enter footer zone
  if (NC.subheadline && afterHead + 20 < textBottom) {
    const subSz  = Rn(W * 0.034);         // ~37 px
    const subLH  = Rn(subSz * 1.60);
    const subMax = Math.min(3, Math.floor((textBottom - afterHead - 20) / subLH));
    if (subMax > 0) {
      ctx.save();
      ctx.font = `400 ${subSz}px 'Cairo','Tajawal',sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.textAlign = "right"; ctx.textBaseline = "top"; ctx.direction = "rtl";
      ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 12;
      const subLines = wrapLines(NC.subheadline, maxTxtW, subMax);
      let subY = afterHead + 24;
      for (const ln of subLines) { ctx.fillText(ln, W - M, subY); subY += subLH; }
      ctx.restore();
    }
  }

  /* ── 8. FOOTER ZONE ─────────────────────────────────────────────────── */
  const footY = H - FOOT_H;
  /* Gold separator line */
  ctx.save();
  ctx.strokeStyle = "rgba(232,200,74,.35)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(M, footY); ctx.lineTo(W - M, footY); ctx.stroke();
  /* Website / footer text */
  ctx.font = `500 ${Rn(24)}px 'Cairo','Tajawal',sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,.35)";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "rtl";
  ctx.fillText(NC.footer || "", W / 2, footY + FOOT_H / 2);
  ctx.restore();
}

/* ── News Card Studio component ────────────────────────────────────────── */
function NewsCardStudio({ onBack, theme, T }) {
  const isDark     = theme === "dark";
  const ncRef      = useRef(null);
  const [NC, setNC] = useState({
    category:    "رياضة",
    date:        "٢٤ مايو ٢٠٢٦",
    headline:    "عنوان الخبر الرياضي الرئيسي يُكتب هنا",
    subheadline: "تفاصيل وملخص الخبر يُكتبان في هذا الحقل",
    footer:      "osl.om  ·  @OmanLeague",
  });
  const [ncBgImg, setNcBgImg] = useState(null);
  const UN = (k, v) => setNC(p => ({ ...p, [k]: v }));

  /* Render canvas whenever state changes */
  useEffect(() => {
    const canvas = ncRef.current; if (!canvas) return;
    canvas.width = 1080; canvas.height = 1350;
    drawNewsCard(canvas.getContext("2d"), NC, ncBgImg);
  }, [NC, ncBgImg]);

  /* Background image loader */
  const loadBg = useCallback(e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => setNcBgImg(img);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  /* Shared input style */
  const inp = { width:"100%", padding:"7px 10px", borderRadius:8,
    border:`1px solid ${T.inputBorder}`, background:T.inputBg,
    color:T.inputText, fontSize:13, fontFamily:"inherit", boxSizing:"border-box" };

  /* Preview dimensions (display) */
  const PH = 560, PW = Math.round(PH * 1080 / 1350); // 448 px wide

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
      </header>

      {/* Body */}
      <div style={{flex:1, display:"flex", overflow:"hidden"}}>

        {/* LEFT: controls */}
        <aside style={{
          width:272, flexShrink:0, overflowY:"auto", padding:"16px 14px",
          borderLeft:`1px solid ${T.divider}`, background:T.sidebarBg,
          display:"flex", flexDirection:"column", gap:14,
        }}>

          {/* Category */}
          <div>
            <div style={{fontSize:10, fontWeight:700, color:T.secTitle, marginBottom:5, letterSpacing:".04em"}}>التصنيف</div>
            <input value={NC.category} onChange={e=>UN("category",e.target.value)} style={inp}/>
          </div>

          {/* Date */}
          <div>
            <div style={{fontSize:10, fontWeight:700, color:T.secTitle, marginBottom:5, letterSpacing:".04em"}}>التاريخ</div>
            <input value={NC.date} onChange={e=>UN("date",e.target.value)} style={inp}/>
          </div>

          {/* Headline */}
          <div>
            <div style={{fontSize:10, fontWeight:700, color:T.secTitle, marginBottom:5, letterSpacing:".04em"}}>العنوان الرئيسي</div>
            <textarea value={NC.headline} onChange={e=>UN("headline",e.target.value)} rows={3}
              style={{...inp, resize:"vertical"}}/>
          </div>

          {/* Subheadline */}
          <div>
            <div style={{fontSize:10, fontWeight:700, color:T.secTitle, marginBottom:5, letterSpacing:".04em"}}>العنوان الفرعي</div>
            <textarea value={NC.subheadline} onChange={e=>UN("subheadline",e.target.value)} rows={3}
              style={{...inp, resize:"vertical"}}/>
          </div>

          {/* Footer text */}
          <div>
            <div style={{fontSize:10, fontWeight:700, color:T.secTitle, marginBottom:5, letterSpacing:".04em"}}>الموقع / النص السفلي</div>
            <input value={NC.footer} onChange={e=>UN("footer",e.target.value)} style={inp}/>
          </div>

          {/* Background image */}
          <div>
            <div style={{fontSize:10, fontWeight:700, color:T.secTitle, marginBottom:5, letterSpacing:".04em"}}>صورة الخلفية</div>
            <label style={{
              display:"block", padding:"10px", borderRadius:8, cursor:"pointer", textAlign:"center",
              border:`1px dashed ${T.inputBorder}`, background:T.inputBg,
              fontSize:11, color: ncBgImg ? "#10b981" : T.textMuted,
            }}>
              {ncBgImg ? "✓ تم رفع الصورة" : "اختر صورة..."}
              <input type="file" accept="image/*" onChange={loadBg} style={{display:"none"}}/>
            </label>
            {ncBgImg && (
              <button onClick={()=>setNcBgImg(null)} style={{
                marginTop:6, width:"100%", padding:"6px", borderRadius:6,
                border:`1px solid ${T.btnBorder}`, background:T.btnBg,
                cursor:"pointer", fontSize:11, color:T.btnText,
              }}>حذف الصورة</button>
            )}
          </div>

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
            1080 × 1350 px
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
