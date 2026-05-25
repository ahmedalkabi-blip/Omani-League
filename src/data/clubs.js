export const CLUBS = {
  seeb:   { n: "نادي السيب",    e: "AL-SEEB",    p: "#1a3a6e", s: "#c8a84b", b: "⚽" },
  dhofar: { n: "نادي ظفار",    e: "DHOFAR",     p: "#006633", s: "#ffcc00", b: "🦁" },
  nahda:  { n: "نادي النهضة",  e: "AL-NAHDA",   p: "#cc0000", s: "#ffdd00", b: "🔴" },
  nasr:   { n: "نادي النصر",   e: "AL-NASR",    p: "#003399", s: "#ffcc00", b: "⭐" },
  oman:   { n: "نادي عمان",    e: "OMAN CLUB",  p: "#cc0000", s: "#009900", b: "🇴🇲" },
  rustaq: { n: "نادي الرستاق", e: "AL-RUSTAQ",  p: "#ff6600", s: "#333333", b: "🔶" },
  sohar:  { n: "نادي صحار",    e: "SOHAR",      p: "#0066cc", s: "#ffaa00", b: "💙" },
  muscat: { n: "نادي مسقط",   e: "MUSCAT FC",  p: "#660066", s: "#cc99ff", b: "💜" },
};

export const TEMPLATE_LABELS = {
  matchday:   "يوم المباراة",
  finalscore: "النتيجة النهائية",
  motm:       "رجل المباراة",
};

export const CANVAS_SIZES = {
  portrait: { w: 540, h: 675, label: "بورتريت 4:5",  exportW: 1080, exportH: 1350 },
  square:   { w: 540, h: 540, label: "مربع 1:1",     exportW: 1080, exportH: 1080 },
};

export const DEFAULT_STATE = {
  tpl:        "matchday",
  hk:         "seeb",
  ak:         "dhofar",
  score:      "2 - 1",
  scorers:    "أحمد الكندي 23' • سالم البلوشي 67'",
  time:       "8:00 مساءً",
  stadium:    "ملعب السلطان قابوس",
  round:      "الجولة 12",
  date:       "السبت، 15 مارس 2025",
  status:     "FULL TIME",
  motm:       "أحمد الكندي",
  op:         55,
  sc:         100,
  canvasSize: "portrait",
};
