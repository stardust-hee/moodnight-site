/* 산타의 선물가게: 따뜻한 3D 디오라마 방 (SVG 500×400)
 * 빛(창문·전구·트리), 그림자(구석·바닥), 질감(벽지·나무결·러그)을 넣어 그린 장면.
 * 선물 상자는 app.js가 그 위에 버튼으로 올리고, 상자 그림은 여기서 만든 SVG를 배경으로 씁니다. */
(function () {
const NS = "http://www.w3.org/2000/svg";
let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

/* ── 트리 모양: 층마다 아래가 물결지는 잎 덩어리 ── */
const TX = 338, TB = 262;
const TIERS = [[80, 120, 62], [102, 154, 94], [128, 190, 128], [156, 224, 166], [186, 250, 204]]; // [꼭대기 y, 아래 y, 폭]
function tierPath([ty, by, w]) {
  const n = Math.round(w / 22), half = w / 2;
  let d = `M${TX},${ty} C${TX + half * .35},${ty + (by - ty) * .35} ${TX + half * .8},${by - 18} ${TX + half},${by - 4}`;
  for (let i = 0; i < n; i++) {
    const x1 = TX + half - (w / n) * (i + 1), xm = TX + half - (w / n) * (i + .5);
    d += ` Q${xm},${by + 9} ${x1},${by - 2 - (i % 2) * 3}`;
  }
  d += ` C${TX - half * .8},${by - 18} ${TX - half * .35},${ty + (by - ty) * .35} ${TX},${ty}Z`;
  return d;
}
function inTree(x, y) { return TIERS.some(([ty, by, w]) => y > ty + 8 && y < by - 4 && Math.abs(x - TX) < (w / 2) * ((y - ty) / (by - ty)) - 4); }

/* ── 장면 SVG ── */
function build() {
  const t = [];
  t.push(`<svg class="scene" viewBox="0 0 500 400" preserveAspectRatio="none" aria-hidden="true" xmlns="${NS}">
<defs>
  <linearGradient id="dCeil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf4e6"/><stop offset="1" stop-color="#eadbbd"/></linearGradient>
  <radialGradient id="dBack" cx=".42" cy=".38" r=".8"><stop offset="0" stop-color="#fff7e6"/><stop offset=".55" stop-color="#f3e3c3"/><stop offset="1" stop-color="#dcc49b"/></radialGradient>
  <linearGradient id="dLeft" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ead7b2"/><stop offset="1" stop-color="#c9ad80"/></linearGradient>
  <linearGradient id="dRight" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dcc59b"/><stop offset="1" stop-color="#b89a6c"/></linearGradient>
  <linearGradient id="dFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c5a2e"/><stop offset=".45" stop-color="#b8723f"/><stop offset="1" stop-color="#cf8a51"/></linearGradient>
  <pattern id="dPaper" width="24" height="24" patternUnits="userSpaceOnUse">
    <rect x="0" y="0" width="12" height="24" fill="#d9786a" opacity=".16"/><rect x="11" y="0" width="1" height="24" fill="#fff" opacity=".35"/>
    <path d="M18 9 l2 3 -2 3 -2 -3z" fill="#c9604f" opacity=".22"/>
  </pattern>
  <linearGradient id="dWain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ead6b1"/><stop offset="1" stop-color="#d6bb8d"/></linearGradient>
  <linearGradient id="dSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1838"/><stop offset=".6" stop-color="#22366a"/><stop offset="1" stop-color="#3c5590"/></linearGradient>
  <linearGradient id="dFrame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e2d9c6"/></linearGradient>
  <linearGradient id="dCurtain" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8e1f1b"/><stop offset=".18" stop-color="#d6463a"/><stop offset=".32" stop-color="#a8291f"/><stop offset=".5" stop-color="#e05446"/><stop offset=".68" stop-color="#a8291f"/><stop offset=".85" stop-color="#d6463a"/><stop offset="1" stop-color="#7e1a17"/>
  </linearGradient>
  <linearGradient id="dBrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#e2b23e"/><stop offset="1" stop-color="#9c7020"/></linearGradient>
  <linearGradient id="dTree" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5fae5c"/><stop offset=".45" stop-color="#3a8447"/><stop offset="1" stop-color="#1c4f2c"/></linearGradient>
  <linearGradient id="dTreeIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e2e18" stop-opacity=".55"/><stop offset=".35" stop-color="#0e2e18" stop-opacity="0"/></linearGradient>
  <linearGradient id="dDoor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3f9a63"/><stop offset="1" stop-color="#22603c"/></linearGradient>
  <linearGradient id="dBasket" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c58a4a"/><stop offset="1" stop-color="#7d4c22"/></linearGradient>
  <radialGradient id="dRug" cx=".5" cy=".45" r=".55"><stop offset="0" stop-color="#c8443a"/><stop offset=".75" stop-color="#a22f29"/><stop offset="1" stop-color="#7c2020"/></radialGradient>
  <radialGradient id="dMoon" cx=".4" cy=".35" r=".6"><stop offset="0" stop-color="#fffbe2"/><stop offset="1" stop-color="#f3dc8a"/></radialGradient>
  <radialGradient id="dWarm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
  <radialGradient id="dCool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9cb6ff" stop-opacity=".35"/><stop offset="1" stop-color="#9cb6ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="dVig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#3a1c08" stop-opacity="0"/><stop offset="1" stop-color="#3a1c08" stop-opacity=".32"/></radialGradient>
  <linearGradient id="dStar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6b0"/><stop offset=".5" stop-color="#ffd23f"/><stop offset="1" stop-color="#d99a14"/></linearGradient>
  ${[["Gold", "#fff2a8", "#e8b22e", "#9a6a10"], ["Red", "#ffb0a0", "#d8392c", "#7e1712"], ["Blue", "#dbeaff", "#5f8fe0", "#23407e"], ["Silver", "#ffffff", "#c9d3e2", "#7a8598"]]
    .map(([n, a, b, c]) => `<radialGradient id="dOrn${n}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`).join("")}
  <filter id="dBlur4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="dBlur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="dGlow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="dWin"><rect x="152" y="66" width="92" height="104" rx="2"/></clipPath>
  ${TIERS.map((tr, i) => `<clipPath id="dT${i}"><path d="${tierPath(tr)}"/></clipPath>`).join("")}
</defs>`);

  // 방 껍데기
  t.push(`<polygon points="0,0 500,0 430,32 70,32" fill="url(#dCeil)"/>
<polygon points="70,32 430,32 430,250 70,250" fill="url(#dBack)"/>
<polygon points="70,32 430,32 430,206 70,206" fill="url(#dPaper)"/>
<polygon points="0,0 70,32 70,250 0,400" fill="url(#dLeft)"/>
<polygon points="500,0 430,32 430,250 500,400" fill="url(#dRight)"/>
<polygon points="0,400 500,400 430,250 70,250" fill="url(#dFloor)"/>`);
  // 바닥 판자 (원근)
  for (let i = 1; i < 12; i++) {
    const bx = 70 + (360 / 12) * i, fx = (500 / 12) * i;
    t.push(`<line x1="${bx}" y1="250" x2="${fx}" y2="400" stroke="#7a4220" stroke-width="1.2" opacity=".55"/><line x1="${bx + 1.5}" y1="250" x2="${fx + 4}" y2="400" stroke="#e0a066" stroke-width=".8" opacity=".35"/>`);
  }
  [[268, .25], [292, .22], [322, .2], [358, .18]].forEach(([y, o]) => {
    const k = (y - 250) / 150, x0 = 70 - 70 * k, x1 = 430 + 70 * k;
    for (let i = 0; i < 12; i++) { const a = x0 + (x1 - x0) * (i / 12), off = ((i * 37) % 11) / 11 * ((x1 - x0) / 12); t.push(`<line x1="${a + off}" y1="${y}" x2="${a + off}" y2="${y + 12 + k * 10}" stroke="#7a4220" stroke-width="1" opacity="${o}"/>`); }
  });
  // 징두리 판벽
  t.push(`<rect x="70" y="206" width="360" height="44" fill="url(#dWain)"/>
<rect x="70" y="204" width="360" height="4" fill="#fff6e0"/><rect x="70" y="208" width="360" height="1.5" fill="#b79563" opacity=".6"/>`);
  for (let i = 0; i < 6; i++) { const x = 78 + i * 59; t.push(`<rect x="${x}" y="214" width="50" height="26" rx="2" fill="none" stroke="#fff3d8" stroke-width="1.5"/><rect x="${x + 1.2}" y="215.2" width="50" height="26" rx="2" fill="none" stroke="#b38d5c" stroke-width="1" opacity=".55"/>`); }
  t.push(`<rect x="70" y="243" width="360" height="7" fill="#c6a273"/><rect x="70" y="243" width="360" height="1.5" fill="#f3dfb8"/>`);
  // 구석 그림자 (AO)
  t.push(`<g opacity=".55" filter="url(#dBlur4)"><rect x="70" y="244" width="360" height="12" fill="#5a3010" opacity=".5"/><rect x="66" y="30" width="8" height="222" fill="#7a5530" opacity=".55"/><rect x="426" y="30" width="8" height="222" fill="#5a3a1a" opacity=".6"/><rect x="70" y="30" width="360" height="8" fill="#a08050" opacity=".4"/></g>`);

  // 창문 · 벽난로 · 커튼은 왼쪽으로 조금 옮겨서 트리와 겹치지 않게
  t.push(`<g transform="translate(-34 0)">`);
  t.push(`<rect x="134" y="52" width="128" height="134" fill="url(#dCool)"/>
<rect x="144" y="58" width="108" height="120" rx="4" fill="url(#dFrame)"/>
<rect x="146" y="60" width="104" height="116" rx="3" fill="none" stroke="#c9bea8" stroke-width="1"/>
<g clip-path="url(#dWin)">
  <rect x="152" y="66" width="92" height="104" fill="url(#dSky)"/>
  <circle cx="222" cy="86" r="11" fill="url(#dMoon)" filter="url(#dGlow)"/><circle cx="227" cy="83" r="9" fill="#14224a" opacity=".85"/>
  ${Array.from({ length: 22 }, () => `<circle cx="${(152 + rnd() * 92).toFixed(1)}" cy="${(68 + rnd() * 52).toFixed(1)}" r="${(.4 + rnd() * .8).toFixed(2)}" fill="#fff" opacity="${(.5 + rnd() * .5).toFixed(2)}"/>`).join("")}
  <path d="M152 140 L166 128 L180 140 L180 170 L152 170Z" fill="#162348"/><path d="M150 141 L166 126 L182 141 L178 141 L166 130 L154 141Z" fill="#eef4ff"/>
  <path d="M196 146 L214 132 L232 146 L232 170 L196 170Z" fill="#1a2a55"/><path d="M194 147 L214 129 L234 147 L229 147 L214 134 L199 147Z" fill="#eef4ff"/>
  <rect x="160" y="148" width="7" height="8" fill="#ffd36b" filter="url(#dGlow)"/><rect x="205" y="152" width="6" height="7" fill="#ffd36b" filter="url(#dGlow)"/><rect x="218" y="152" width="6" height="7" fill="#ffc35a" filter="url(#dGlow)"/>
  <path d="M152 162 Q176 154 198 160 T244 156 V170 H152Z" fill="#f4f8ff"/><path d="M152 166 Q190 160 244 164 V170 H152Z" fill="#d6e2f7"/>
  <g id="snowfield"></g>
</g>
<rect x="196" y="66" width="4.5" height="104" fill="url(#dFrame)"/><rect x="152" y="116" width="92" height="4.5" fill="url(#dFrame)"/>
<rect x="138" y="176" width="120" height="8" rx="2" fill="#fbfbfb"/><path d="M138 176 Q160 170 182 175 T258 174 V178 H138Z" fill="#ffffff"/><rect x="140" y="184" width="116" height="3" fill="#8a7a5a" opacity=".35" filter="url(#dBlur4)"/>`);

  // 벽난로 (창문 아래) + 양말
  t.push(`<rect x="136" y="188" width="124" height="62" fill="#3a1c10" opacity=".25" filter="url(#dBlur4)"/>
<rect x="138" y="190" width="120" height="60" fill="#f7f1e6"/><rect x="138" y="190" width="120" height="60" fill="none" stroke="#d8cdb8" stroke-width="1"/>
<rect x="132" y="184" width="132" height="8" rx="2" fill="#fffaf0"/><rect x="132" y="191" width="132" height="2" fill="#bfae8c" opacity=".7"/>
<rect x="160" y="204" width="76" height="46" rx="3" fill="#8c3a26"/>
${Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => `<rect x="${161 + c * 15 + (r % 2) * 7}" y="${205 + r * 9}" width="13" height="7.5" rx="1" fill="${(r + c) % 3 ? "#b4523a" : "#a24630"}"/>`).join("")).join("")}
<path d="M168 250 V218 Q198 204 228 218 V250Z" fill="#1c0e0a"/>
<ellipse cx="198" cy="244" rx="26" ry="10" fill="url(#dWarm)" class="fireglow"/>
<g class="flame"><path d="M186 248 Q184 232 194 222 Q192 234 200 238 Q202 226 210 220 Q214 236 210 248Z" fill="#ff8a2a"/><path d="M191 248 Q190 238 197 232 Q197 240 203 242 Q205 236 208 232 Q210 242 206 248Z" fill="#ffd25a"/></g>
<rect x="176" y="246" width="44" height="4" rx="2" fill="#5a3018"/>`);
  [[146, "#d8392c"], [168, "#2f8a4a"], [228, "#d8392c"], [246, "#2f8a4a"]].forEach(([x, c]) => t.push(`<g transform="translate(${x} 191)"><rect x="-1" y="0" width="12" height="5" rx="1.5" fill="#fff"/><path d="M0 5 h10 v12 q6 0 6 6 q0 5 -6 5 h-6 q-4 0 -4 -5z" fill="${c}"/><path d="M2 8 v8" stroke="#fff" stroke-width="1.2" opacity=".35"/></g>`));
  // 커튼 + 봉
  const curtain = (x, flip) => {
    const s = flip ? -1 : 1, cx = x;
    return `<path d="M${cx} 50 L${cx + 30 * s} 50 Q${cx + 26 * s} 110 ${cx + 18 * s} 132 Q${cx + 30 * s} 162 ${cx + 36 * s} 198 L${cx - 2 * s} 198 Q${cx + 4 * s} 150 ${cx + 2 * s} 132 Q${cx - 2 * s} 92 ${cx} 50Z" fill="url(#dCurtain)"/>
<path d="M${cx + 4 * s} 128 Q${cx + 14 * s} 134 ${cx + 22 * s} 128" stroke="url(#dBrass)" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  };
  t.push(`<g filter="url(#dBlur4)" opacity=".35"><rect x="120" y="54" width="30" height="148" fill="#5a2a10"/><rect x="246" y="54" width="30" height="148" fill="#5a2a10"/></g>`);
  t.push(curtain(118, false) + curtain(278, true));
  t.push(`<rect x="110" y="44" width="176" height="5" rx="2.5" fill="url(#dBrass)"/><circle cx="110" cy="46.5" r="5" fill="url(#dBrass)"/><circle cx="286" cy="46.5" r="5" fill="url(#dBrass)"/>`);
  t.push(`</g>`);

  // 왼쪽 벽: 눈송이 장식 + 벽등
  [[22, 76, 9], [44, 118, 12], [58, 70, 7]].forEach(([x, y, r]) => {
    t.push(`<line x1="${x}" y1="${x * .45}" x2="${x}" y2="${y - r}" stroke="#fff" stroke-width="1" opacity=".9"/><g transform="translate(${x} ${y})" stroke="#fff" stroke-width="2.2" stroke-linecap="round" filter="url(#dGlow)">${[0, 60, 120].map(a => `<line x1="${-r}" y1="0" x2="${r}" y2="0" transform="rotate(${a})"/><line x1="${r * .55}" y1="-3" x2="${r * .8}" y2="0" transform="rotate(${a})"/><line x1="${r * .55}" y1="3" x2="${r * .8}" y2="0" transform="rotate(${a})"/>`).join("")}</g>`);
  });
  t.push(`<ellipse cx="40" cy="190" rx="36" ry="46" fill="url(#dWarm)"/><path d="M34 180 L46 176 L46 196 L34 200Z" fill="url(#dBrass)"/><path d="M30 166 L50 160 L46 176 L34 180Z" fill="#fff1c8" stroke="#c9a24a" stroke-width="1"/>`);

  // 오른쪽 벽: 문 (원근) + 리스
  t.push(`<polygon points="440,96 490,76 490,370 440,300" fill="#efe4cc"/>
<polygon points="446,104 486,88 486,364 446,296" fill="url(#dDoor)"/>
<polygon points="452,118 480,107 480,196 452,201" fill="#2f7a4c" stroke="#5fb07f" stroke-width="1"/>
<polygon points="452,215 480,212 480,334 452,287" fill="#2f7a4c" stroke="#5fb07f" stroke-width="1"/>
<ellipse cx="456" cy="232" rx="2.5" ry="5" fill="url(#dBrass)"/>
<g transform="translate(467 154)">
  <ellipse rx="16" ry="20" fill="none" stroke="#1f5a30" stroke-width="9"/>
  ${Array.from({ length: 18 }, (_, i) => { const a = i / 18 * Math.PI * 2; return `<ellipse cx="${(Math.cos(a) * 16).toFixed(1)}" cy="${(Math.sin(a) * 20).toFixed(1)}" rx="4.5" ry="3" transform="rotate(${(a * 57).toFixed(0)} ${(Math.cos(a) * 16).toFixed(1)} ${(Math.sin(a) * 20).toFixed(1)})" fill="${i % 3 ? "#3f9a52" : "#5fbf6a"}"/>`; }).join("")}
  ${[[-10, -14], [12, -10], [14, 8], [-14, 10], [0, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="url(#dOrnRed)"/>`).join("")}
  <path d="M-2 18 q-12 -8 -14 2 q8 4 14 -2z M2 18 q12 -8 14 2 q-8 4 -14 -2z" fill="#d8392c"/><path d="M-2 20 l-6 16 M2 20 l6 16" stroke="#d8392c" stroke-width="3.5"/><circle cx="0" cy="19" r="3" fill="#b02a20"/>
</g>`);

  // 가랜드 (뒷벽 위)
  const garland = [];
  for (let i = 0; i <= 120; i++) {
    const x = 72 + i * 3, y = 40 + Math.sin(i / 120 * Math.PI) * 26 - Math.sin(i / 10) * 1.5;
    garland.push(`<circle cx="${x}" cy="${y}" r="${(4.5 + rnd() * 2).toFixed(1)}" fill="${["#2f7a3c", "#3f9a4a", "#25622f", "#4fae58"][i % 4]}"/>`);
    if (i % 9 === 4) garland.push(`<circle cx="${x}" cy="${y + 4}" r="2.4" fill="url(#dOrnRed)"/>`);
  }
  t.push(`<g filter="url(#dBlur4)" opacity=".3"><path d="M72 46 Q250 106 430 46" stroke="#3a2a10" stroke-width="10" fill="none"/></g>${garland.join("")}`);
  t.push(`<g id="bulbs"></g>`);
  // 종
  t.push(`<g transform="translate(250 66)"><path d="M-14 -8 q14 -10 28 0" stroke="#c23a2e" stroke-width="5" fill="none"/>
<path d="M-16 0 q0 -14 9 -14 q9 0 9 14 l3 6 h-24z" fill="url(#dBrass)"/><path d="M2 0 q0 -14 9 -14 q9 0 9 14 l3 6 h-24z" fill="url(#dBrass)"/>
<circle cx="-7" cy="8" r="2.5" fill="#9c7020"/><circle cx="11" cy="8" r="2.5" fill="#9c7020"/><path d="M-12 -6 q2 -5 6 -6" stroke="#fff6c0" stroke-width="2" fill="none" opacity=".8"/></g>`);

  // 러그 (그림자 → 술 → 본체 → 무늬)
  t.push(`<ellipse cx="296" cy="324" rx="172" ry="50" fill="#3a1408" opacity=".35" filter="url(#dBlur8)"/>`);
  const fringe = [];
  for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2, x = 296 + Math.cos(a) * 166, y = 318 + Math.sin(a) * 46; fringe.push(`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(296 + Math.cos(a) * 174).toFixed(1)}" y2="${(318 + Math.sin(a) * 51).toFixed(1)}" stroke="#f3dca4" stroke-width="1.6"/>`); }
  t.push(fringe.join(""));
  t.push(`<ellipse cx="296" cy="318" rx="166" ry="46" fill="url(#dRug)"/>
<ellipse cx="296" cy="318" rx="152" ry="40" fill="none" stroke="#e9c16a" stroke-width="2.2" stroke-dasharray="7 5"/>
<ellipse cx="296" cy="318" rx="138" ry="35" fill="none" stroke="#7c2020" stroke-width="5" opacity=".6"/>
<ellipse cx="296" cy="318" rx="96" ry="22" fill="none" stroke="#e9c16a" stroke-width="1.4" opacity=".8"/>`);


  // 큰 눈사람 (왼쪽 앞)
  t.push(`<ellipse cx="62" cy="372" rx="54" ry="12" fill="#2a1006" opacity=".35" filter="url(#dBlur8)"/>
<radialGradient id="dSnow" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eef2fa"/><stop offset="1" stop-color="#c7d2e6"/></radialGradient>
<circle cx="62" cy="334" r="42" fill="url(#dSnow)"/><circle cx="62" cy="276" r="30" fill="url(#dSnow)"/><circle cx="62" cy="230" r="22" fill="url(#dSnow)"/>
<rect x="42" y="190" width="40" height="26" rx="3" fill="#1e1e26"/><rect x="34" y="212" width="56" height="6" rx="3" fill="#2a2a34"/><rect x="42" y="206" width="40" height="5" fill="#c8392c"/>
<circle cx="54" cy="226" r="2.6" fill="#1e1e26"/><circle cx="70" cy="226" r="2.6" fill="#1e1e26"/><path d="M62 232 l16 4 -16 2z" fill="#ff8a2a"/>
${[-8, -4, 0, 4, 8].map((d, i) => `<circle cx="${62 + d}" cy="${242 + Math.abs(d) * -.2 + (i === 2 ? 1.5 : 0)}" r="1.6" fill="#1e1e26"/>`).join("")}
<path d="M40 250 Q62 262 84 250 L86 258 Q62 270 38 258Z" fill="#d8392c"/><path d="M70 258 l6 30 -9 2 -5 -30z" fill="#b82a20"/>
<circle cx="62" cy="276" r="3" fill="#1e1e26"/><circle cx="62" cy="292" r="3" fill="#1e1e26"/><circle cx="62" cy="322" r="3" fill="#1e1e26"/>
<path d="M34 270 L8 252 M14 256 l-6 -2 M14 256 l-2 -6" stroke="#6a3a1a" stroke-width="3" stroke-linecap="round" fill="none"/>
<path d="M90 270 L114 254 M108 258 l6 -1 M108 258 l1 -6" stroke="#6a3a1a" stroke-width="3" stroke-linecap="round" fill="none"/>`);
  // 트리 그림자 + 바구니
  t.push(`<ellipse cx="${TX + 8}" cy="${TB + 6}" rx="106" ry="18" fill="#2a1006" opacity=".45" filter="url(#dBlur8)"/>`);
  t.push(`<path d="M${TX - 26} ${TB - 18} L${TX + 26} ${TB - 18} L${TX + 20} ${TB + 6} L${TX - 20} ${TB + 6}Z" fill="url(#dBasket)"/>
${[0, 1, 2, 3].map(i => `<line x1="${TX - 25 + i * .8}" y1="${TB - 13 + i * 5.5}" x2="${TX + 25 - i * .8}" y2="${TB - 13 + i * 5.5}" stroke="#6a3a14" stroke-width="1.2" opacity=".6"/>`).join("")}
${Array.from({ length: 9 }, (_, i) => `<line x1="${TX - 24 + i * 6}" y1="${TB - 18}" x2="${TX - 19 + i * 4.8}" y2="${TB + 6}" stroke="#e2a964" stroke-width="1" opacity=".45"/>`).join("")}
<rect x="${TX - 28}" y="${TB - 21}" width="56" height="5" rx="2.5" fill="#d89a58"/>`);

  // 트리: 층마다 그라데이션 + 위층이 드리운 그림자 + 잎결
  TIERS.slice().reverse().forEach((tr, ri) => {
    const i = TIERS.length - 1 - ri, [ty, by, w] = tr;
    const needles = [];
    for (let k = 0; k < 70; k++) {
      const yy = ty + 6 + rnd() * (by - ty), half = (w / 2) * ((yy - ty) / (by - ty));
      const xx = TX - half + rnd() * half * 2, len = 4 + rnd() * 6, dir = xx < TX ? -1 : 1;
      needles.push(`<line x1="${xx.toFixed(1)}" y1="${yy.toFixed(1)}" x2="${(xx + dir * len * .6).toFixed(1)}" y2="${(yy + len).toFixed(1)}" stroke="${xx < TX ? "#7fca72" : "#3a8447"}" stroke-width="1.3" stroke-linecap="round" opacity="${xx < TX ? .55 : .35}"/>`);
    }
    t.push(`<path d="${tierPath(tr)}" fill="url(#dTree)"/>
<g clip-path="url(#dT${i})">${needles.join("")}${i > 0 ? `<ellipse cx="${TX + 6}" cy="${ty + 10}" rx="${TIERS[i - 1][2] / 2 + 6}" ry="14" fill="#0b2a15" opacity=".45" filter="url(#dBlur4)"/>` : ""}<rect x="${TX - w / 2}" y="${ty}" width="${w}" height="${by - ty}" fill="url(#dTreeIn)"/></g>`);
  });
  // 금색 띠
  [[114, 48], [148, 78], [184, 110], [218, 146], [246, 180]].forEach(([y, w], k) => {
    t.push(`<path d="M${TX - w / 2} ${y - 10} Q${TX} ${y + 10 - (k % 2) * 4} ${TX + w / 2} ${y - 16}" stroke="#f2c54a" stroke-width="2.6" fill="none" stroke-dasharray="1 3.2" stroke-linecap="round" opacity=".95"/>`);
  });
  // 오너먼트
  const orn = [], kinds = ["Gold", "Red", "Blue", "Silver", "Red", "Gold"];
  for (let i = 0; i < 400 && orn.length < 30; i++) {
    const x = TX - 100 + rnd() * 200, y = 94 + rnd() * 158;
    if (!inTree(x, y) || orn.some(o => Math.hypot(o[0] - x, o[1] - y) < 17)) continue;
    orn.push([x, y, kinds[orn.length % kinds.length], 4.5 + rnd() * 2.5]);
  }
  orn.forEach(([x, y, k, r]) => t.push(`<ellipse cx="${(x + 1).toFixed(1)}" cy="${(y + r + 1).toFixed(1)}" rx="${r}" ry="${r * .35}" fill="#0b2a15" opacity=".35"/><rect x="${(x - 1.6).toFixed(1)}" y="${(y - r - 2.4).toFixed(1)}" width="3.2" height="3" rx=".8" fill="url(#dBrass)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#dOrn${k})"/><circle cx="${(x - r * .35).toFixed(1)}" cy="${(y - r * .35).toFixed(1)}" r="${(r * .22).toFixed(1)}" fill="#fff" opacity=".85"/>`));
  t.push(`<g id="treeLights"></g>`);
  // 별
  t.push(`<g transform="translate(${TX} 68)" filter="url(#dGlow)"><circle r="22" fill="url(#dWarm)"/>
<path d="M0 -17 L5 -6 L17 -5 L8 3 L11 15 L0 9 L-11 15 L-8 3 L-17 -5 L-5 -6Z" fill="url(#dStar)" stroke="#b9800c" stroke-width="1"/>
<path d="M0 -12 L3 -5 L0 -3Z" fill="#fff" opacity=".8"/></g>`);

  // 전체 빛: 트리 주변 따뜻한 빛, 가장자리 어둡게
  t.push(`<ellipse cx="${TX}" cy="170" rx="136" ry="124" fill="url(#dWarm)" opacity=".35" style="mix-blend-mode:screen"/>
<rect x="0" y="0" width="500" height="400" fill="url(#dVig)" pointer-events="none"/>
</svg>`);
  return t.join("\n");
}

const host = document.getElementById("sceneHost");
if (host) {
  host.innerHTML = build();
  // 내리는 눈
  const f = document.getElementById("snowfield");
  for (let i = 0; i < 26; i++) {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", (152 + rnd() * 92).toFixed(1)); c.setAttribute("cy", (40 + rnd() * 30).toFixed(1)); c.setAttribute("r", (.8 + rnd() * 1.4).toFixed(1));
    c.setAttribute("fill", "#fff"); c.setAttribute("class", "snow");
    c.style.animationDuration = (5 + rnd() * 5) + "s"; c.style.animationDelay = (-rnd() * 10) + "s";
    f.appendChild(c);
  }
  // 트리 전구
  const L = document.getElementById("treeLights");
  let n = 0;
  for (let i = 0; i < 600 && n < 46; i++) {
    const x = TX - 100 + rnd() * 200, y = 88 + rnd() * 166;
    if (!inTree(x, y)) continue; n++;
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", y.toFixed(1)); c.setAttribute("r", "1.7");
    c.setAttribute("fill", ["#fff6c8", "#ffd86a", "#ffe9a8"][n % 3]); c.setAttribute("filter", "url(#dGlow)"); c.setAttribute("class", "twinkle");
    c.style.animationDelay = (rnd() * 2) + "s"; L.appendChild(c);
  }
  // 가랜드 전구
  const B = document.getElementById("bulbs");
  for (let i = 0; i < 13; i++) {
    const k = (i + .5) / 13, x = 72 + k * 358, y = 40 + Math.sin(k * Math.PI) * 26 + 7;
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", y.toFixed(1)); c.setAttribute("r", "2.6");
    c.setAttribute("fill", ["#ffd86a", "#ff8a6a", "#9fd0ff", "#b6f09a"][i % 4]); c.setAttribute("filter", "url(#dGlow)"); c.setAttribute("class", "twinkle");
    c.style.animationDelay = (i * .23) + "s"; B.appendChild(c);
  }
}

/* ── 선물 상자: 앞면·옆면·윗면 3면 + 리본·매듭 (SVG를 배경 그림으로 등록) ── */
const WRAP = {
  red:   { b: "#e04a3c", l: "#ff7a68", d: "#a82a22", rib: "#ffd25a", ribD: "#c9961e", pat: (id) => `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.6" fill="#ffe8d6" opacity=".9"/></pattern>` },
  green: { b: "#3f8f52", l: "#66b874", d: "#25623a", rib: "#e0453a", ribD: "#a32a22", pat: (id) => `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="3" fill="#fff" opacity=".18"/><rect width="3" height="10" fill="#fff" opacity=".18"/></pattern>` },
  navy:  { b: "#2f4f94", l: "#5a7cc4", d: "#1d3266", rib: "#e0453a", ribD: "#a32a22", pat: (id) => `<pattern id="${id}" width="11" height="11" patternUnits="userSpaceOnUse"><path d="M5.5 2 l1 2.2 2.4.2 -1.8 1.6 .6 2.4 -2.2 -1.3 -2.2 1.3 .6 -2.4 -1.8 -1.6 2.4 -.2z" fill="#ffd25a" opacity=".85"/></pattern>` },
  gold:  { b: "#e8b43a", l: "#ffd772", d: "#b58220", rib: "#d8392c", ribD: "#99231c", pat: (id) => `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="10" fill="#fff3b8" opacity=".45"/></pattern>` },
  snow:  { b: "#f6f1e7", l: "#ffffff", d: "#cfc6b4", rib: "#2f8a4a", ribD: "#1f5e32", pat: (id) => `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.5" fill="#d8392c" opacity=".85"/></pattern>` }
};
function giftSVG(k) {
  const w = WRAP[k], p = "p" + k;
  return `<svg xmlns="${NS}" viewBox="0 0 100 100"><defs>${w.pat(p)}
<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${w.l}"/><stop offset="1" stop-color="${w.b}"/></linearGradient>
<linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${w.b}"/><stop offset="1" stop-color="${w.d}"/></linearGradient>
<linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c8"/><stop offset=".35" stop-color="${w.rib}"/><stop offset="1" stop-color="${w.ribD}"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs>
<ellipse cx="52" cy="94" rx="40" ry="6" fill="#2a1006" opacity=".45" filter="url(#sh)"/>
<polygon points="12,46 70,46 70,94 12,94" fill="url(#f)"/><polygon points="12,46 70,46 70,94 12,94" fill="url(#${p})"/>
<polygon points="70,46 88,38 88,84 70,94" fill="url(#s)"/><polygon points="70,46 88,38 88,84 70,94" fill="url(#${p})" opacity=".6"/>
<polygon points="8,40 72,40 72,50 8,50" fill="${w.l}"/><polygon points="72,40 92,32 92,42 72,50" fill="${w.b}"/><polygon points="8,40 28,32 92,32 72,40" fill="${w.l}"/><polygon points="8,40 28,32 92,32 72,40" fill="#fff" opacity=".25"/>
<polygon points="8,49 72,49 72,51 8,51" fill="#000" opacity=".15"/>
<rect x="36" y="50" width="10" height="44" fill="url(#r)"/><rect x="36" y="40" width="10" height="10" fill="url(#r)"/>
<polygon points="76,48 82,45.5 82,91 76,93.5" fill="${w.ribD}"/><polygon points="38,32 46,32 66,40 58,40" fill="${w.rib}"/><polygon points="16,36 22,33 86,33 80,36" fill="${w.rib}" opacity=".95"/>
<path d="M50 34 C34 14 18 24 30 34 C36 38 46 37 50 34Z" fill="url(#r)"/><path d="M50 34 C66 14 82 24 70 34 C64 38 54 37 50 34Z" fill="url(#r)"/>
<path d="M30 30 C34 24 42 25 46 31" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>
<ellipse cx="50" cy="35" rx="6" ry="4.5" fill="${w.ribD}"/><ellipse cx="49" cy="33.5" rx="3" ry="1.8" fill="#fff" opacity=".45"/>
<polygon points="12,46 15,46 15,94 12,94" fill="#fff" opacity=".25"/></svg>`;
}
const css = Object.keys(WRAP).map(k => `.w-${k} .spr{background-image:url("data:image/svg+xml,${encodeURIComponent(giftSVG(k))}")}`).join("\n");
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
})();
