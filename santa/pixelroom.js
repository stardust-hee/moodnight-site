/* 산타의 선물가게 — 32비트 도트 방 (성탄맨션과 같은 도트 스타일)
 * 250×200 캔버스를 키워서 보여 줘요. 주인공은 트리와 선물, 주변은 단순하게.
 * 휴대폰에서는 왼쪽 22%가 잘려 보이니 중요한 건 x 56 오른쪽에 둬요. */
(function () {
const W = 250, H = 200;
const host = document.getElementById("sceneHost");

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
let C;
const R = (x, y, w, h, c) => { C.fillStyle = c; C.fillRect(x | 0, y | 0, w | 0, h | 0); };
const P = (x, y, c) => R(x, y, 1, 1, c);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const glow = (cx, cy, r, c, a) => { [[r, a * .35], [r * .66, a * .6], [r * .38, a * .9]].forEach(([rr, aa]) => { C.fillStyle = rgba(c, aa); for (let y = -Math.round(rr); y <= Math.round(rr); y++) { const w = Math.round(Math.sqrt(Math.max(0, rr * rr - y * y))); C.fillRect(cx - w, cy + y, w * 2 + 1, 1); } }); };

/* ── 고정 배경: 벽, 바닥, 창문 틀, 가랜드, 트리 ── */
const TX = 172, TTOP = 18, TBASE = 150;           // 트리 가운데 x, 꼭대기, 밑동
const WIN = { x: 64, y: 26, w: 50, h: 52 };         // 창문 (밤하늘 영역)
/* 트리 실루엣: 꼭대기는 뾰족하고 아래로 갈수록 둥글게 퍼지는 풍성한 전나무 (스타듀밸리 느낌) */
const TH = TBASE - TTOP;
const tierW = y => { const t = (y - TTOP) / TH; if (t < 0 || t > 1) return -1; return Math.round(3 + 58 * Math.pow(t, .62) - (t > .94 ? (t - .94) * 120 : 0)); };
const ORN = [];   // 오너먼트
const LIGHTS = []; // 반짝이 전구
function buildTreeParts() {
  seed = 11;
  const cols = ["#D8343A", "#F6C23A", "#7A6FD8", "#F08A2A", "#F6C23A", "#D8343A", "#7A6FD8"];
  let tries = 0;
  while (ORN.length < 30 && tries++ < 4000) {
    const y = TTOP + 14 + Math.floor(rnd() * (TH - 18)), w = tierW(y);
    if (w < 8) continue;
    const x = TX + Math.round((rnd() * 2 - 1) * (w - 6));
    if (ORN.some(o => Math.abs(o.x - x) < 9 && Math.abs(o.y - y) < 8)) continue;
    ORN.push({ x, y, c: cols[ORN.length % cols.length] });
  }
  tries = 0;
  while (LIGHTS.length < 60 && tries++ < 4000) {
    const y = TTOP + 8 + Math.floor(rnd() * (TH - 10)), w = tierW(y);
    if (w < 4) continue;
    const x = TX + Math.round((rnd() * 2 - 1) * (w - 2));
    if (ORN.some(o => Math.abs(o.x - x) < 3 && Math.abs(o.y - y) < 3)) continue;
    LIGHTS.push({ x, y, p: rnd() * 6, c: LIGHTS.length % 4 ? "#FFFFFF" : "#FFF3A0" });
  }
}
function drawTree() {
  const OUT = "#0E3A22", D = "#165A30", M = "#21753A", L = "#2F9446", HL = "#56B85A";
  // 1) 실루엣을 짙은 색으로 채우고
  for (let y = TTOP + 4; y <= TBASE; y++) { const w = tierW(y); if (w < 1) continue; R(TX - w, y, w * 2 + 1, 1, D); }
  // 2) 위에서부터 줄줄이 '아래로 처진 가지 뭉치'를 얹어 풍성하게 (아래 줄이 위 줄의 끝을 덮어 층이 생겨요)
  seed = 5;
  for (let y = TTOP + 4, row = 0; y <= TBASE - 4; y += 7, row++) {
    const w = tierW(y + 5); if (w < 3) continue;
    const step = 10, n = Math.max(0, Math.round(w / step));
    for (let i = -n; i <= n; i++) {
      const edge = Math.abs(i) === n && n > 0;
      const cx = TX + Math.round((n ? i / n : 0) * (w + (edge ? 2 : -2)) + (row % 2 ? 4 : -1) * (n ? 1 : 0) * (i === 0 ? 0 : 1) + (rnd() - .5) * 2);
      const rw = 6 + Math.round(rnd() * 2);
      for (let dy = 0; dy < 9; dy++) {
        const hw = Math.min(rw, 2 + dy);                         // 위는 좁고 아래로 퍼지는 뭉치
        for (let dx = -hw; dx <= hw; dx++) {
          const x = cx + dx + (edge ? Math.sign(i) * Math.floor(dy / 3) : 0), yy = y + dy;
          if (dy >= 7 && (dx + dy) % 3 !== 0) continue;           // 아래 끝은 바늘 몇 가닥만
          const side = (x - TX) / Math.max(1, tierW(yy));
          let c = dy < 2 ? (dx <= 0 ? HL : L) : dy < 4 ? (dx < 0 ? L : M) : dy < 7 ? M : D;
          if (dx === -hw && dy > 1) c = L;
          if (side > .45 && dy > 2) c = dy < 7 ? D : OUT;          // 오른쪽 그늘
          if (dy === 8) c = OUT;
          P(x, yy, c);
        }
      }
    }
  }
  // 3) 바깥 테두리 들쭉날쭉한 바늘
  for (let y = TTOP + 4; y <= TBASE; y++) { const w = tierW(y); if (w < 2) continue; if (y % 3 === 0) { P(TX - w - 1, y, OUT); P(TX + w + 1, y, OUT); } if (y % 5 === 1) { P(TX - w - 2, y, OUT); P(TX + w + 2, y + 1, OUT); } }
  // 4) 오너먼트 (둥근 공 + 하이라이트)
  ORN.forEach(o => {
    const dk = mix(o.c, "#000000", .38), lt = mix(o.c, "#FFFFFF", .45);
    R(o.x - 1, o.y - 2, 3, 1, o.c); R(o.x - 2, o.y - 1, 5, 3, o.c); R(o.x - 1, o.y + 2, 3, 1, dk); P(o.x + 2, o.y + 1, dk);
    P(o.x - 1, o.y - 1, lt); P(o.x - 1, o.y - 2, "#FFFFFF"); P(o.x, o.y - 3, "#C9A24A");
  });
  // 밑동
  R(TX - 4, TBASE, 9, 6, "#5A3A26"); R(TX - 4, TBASE, 3, 6, "#6E4A30");
}
function drawStatic(g) {
  C = g;
  // 벽: 따뜻한 빨간 벽지 + 얇은 줄무늬
  for (let y = 0; y < 132; y++) R(0, y, W, 1, mix("#8C2E2A", "#6E2220", y / 132));
  for (let x = 4; x < W; x += 12) { R(x, 0, 1, 124, "rgba(255,210,160,.07)"); for (let y = 6; y < 120; y += 12) P(x + 6, y, "rgba(255,220,170,.16)"); }
  // 몰딩과 굽도리
  R(0, 118, W, 3, "#3A1E16"); R(0, 121, W, 11, "#5A3424"); R(0, 121, W, 1, "#7A4A30"); for (let x = 0; x < W; x += 25) R(x, 122, 1, 10, "#3A1E16");
  // 바닥: 초록 체크 카펫 (스타듀 느낌, 너무 빽빽하지 않게 큰 칸)
  for (let y = 132; y < H; y++) for (let x = 0; x < W; x += 1) {
    const a = ((x >> 3) + (y >> 3)) % 2, b = (x % 8 === 0) || (y % 8 === 4);
    P(x, y, b ? "#2E5A3C" : a ? "#3B6E48" : "#356542");
  }
  for (let y = 132; y < 140; y++) R(0, y, W, 1, `rgba(20,8,4,${.38 - (y - 132) * .045})`);
  // 창문 (어두운 밤, 눈) — 틀과 커튼
  const { x: wx, y: wy, w: ww, h: wh } = WIN;
  R(wx - 4, wy - 4, ww + 8, wh + 8, "#EDE4D2"); R(wx - 3, wy - 3, ww + 6, wh + 6, "#D8CCB4");
  R(wx - 6, wy + wh + 3, ww + 12, 4, "#C9B99A"); R(wx - 6, wy + wh + 3, ww + 12, 1, "#F3EBDB");
  R(wx - 12, wy - 9, ww + 24, 3, "#3A1E16");
  // 커튼 (짙은 초록, 묶음)
  [[wx - 12, 0], [wx + ww + 4, 1]].forEach(([cx, side]) => { for (let y = 0; y < wh + 12; y++) { const w = y < 26 ? 9 : y < 34 ? 6 : 9 - Math.min(3, (y - 34) >> 3); R(side ? cx + (9 - w) : cx, wy - 6 + y, w, 1, y % 2 ? "#2B5A3A" : "#346B45"); } R(cx + 1, wy + 20, 7, 2, "#F2C14E"); });
  // 가랜드 (윗벽을 가로질러)
  for (let x = 0; x < W; x++) { const y = 8 + Math.round(Math.sin(x / W * Math.PI * 2) * 3 + (x % 3 ? 0 : 1)); R(x, y, 1, 4, x % 2 ? "#2B6B3C" : "#3E8A4A"); }
  for (let x = 12; x < W; x += 22) { const y = 12 + Math.round(Math.sin(x / W * Math.PI * 2) * 3); R(x - 2, y, 5, 3, "#D9473B"); P(x, y + 3, "#A8332A"); }
  // 양말 두 짝 (굽도리 위, 창문 아래)
  [[wx + 6, "#D9473B"], [wx + ww - 12, "#EDE4D2"]].forEach(([sx, c]) => { R(sx, 100, 6, 2, "#F3EBDB"); R(sx + 1, 102, 4, 9, c); R(sx + 1, 109, 7, 3, c); P(sx + 2, 104, "#F2C14E"); });
  // 트리 뒤 은은한 불빛
  glow(TX, 90, 64, "#FFC870", .09);
  drawTree();
  // 트리 치마 (러그) — 선물이 놓이는 자리
  for (let y = -11; y <= 11; y++) { const w = Math.round(62 * Math.sqrt(1 - (y * y) / 132)); R(TX - 16 - w, 168 + y, w * 2, 1, Math.abs(y) > 8 ? "#E8E2D6" : y % 4 === 0 ? "#C9C0B0" : "#F3EEE4"); }
  for (let y = -11; y <= 11; y += 2) { const w = Math.round(62 * Math.sqrt(1 - (y * y) / 132)); P(TX - 16 - w, 168 + y, "#B8AE9C"); P(TX - 16 + w - 1, 168 + y, "#B8AE9C"); }
  // 화면 가장자리 살짝 어둡게 (주인공 강조)
  for (let i = 0; i < 18; i++) { C.fillStyle = `rgba(20,6,4,${(18 - i) / 18 * .16})`; C.fillRect(i, 0, 1, H); C.fillRect(W - 1 - i, 0, 1, H); }
}
/* ── 움직이는 것: 창밖 눈, 트리 전구, 별 ── */
const FL = Array.from({ length: 34 }, () => ({ x: Math.random() * WIN.w, y: Math.random() * WIN.h, v: .25 + Math.random() * .45, s: Math.random() < .25 ? 2 : 1, p: Math.random() * 6 }));
function drawLive(g, t, still) {
  C = g;
  const { x: wx, y: wy, w: ww, h: wh } = WIN;
  for (let y = 0; y < wh; y++) R(wx, wy + y, ww, 1, mix("#0A1422", "#1B3350", y / wh));
  // 먼 지붕과 쌓인 눈
  R(wx, wy + wh - 10, 20, 10, "#0E1A28"); R(wx + 28, wy + wh - 14, 22, 14, "#101E2E");
  R(wx, wy + wh - 11, 20, 2, "#C9D6E4"); R(wx + 28, wy + wh - 15, 22, 2, "#C9D6E4");
  P(wx + 8, wy + wh - 6, "#FFC870"); P(wx + 37, wy + wh - 9, "#FFC870");
  R(wx, wy + wh - 3, ww, 3, "#E6EEF6");
  FL.forEach(f => {
    const x = Math.round(f.x + Math.sin(f.y / 9 + f.p) * 1.5), y = Math.round(f.y);
    if (x >= 0 && x < ww) R(wx + x, wy + y, f.s, f.s, "#FFFFFF");
    if (!still) { f.y += f.v; if (f.y > wh - 2) { f.y = -2; f.x = Math.random() * ww; } }
  });
  // 창살
  R(wx + ww / 2 - 1, wy, 2, wh, "#EDE4D2"); R(wx, wy + wh / 2 - 1, ww, 2, "#EDE4D2");
  // 트리 전구 반짝
  LIGHTS.forEach(l => { const on = still || Math.sin(t / 420 + l.p) > -.4; if (on) P(l.x, l.y, l.c); });
  // 꼭대기 별
  const sy = TTOP - 2, a = still ? .5 : .35 + .25 * Math.sin(t / 500);
  glow(TX, sy + 3, 10, "#FFE08A", a);
  const star = ["...Y...", "..YYY..", "YYYYYYY", ".YYWYY.", "..YYY..", ".YY.YY.", "Y.....Y"];
  star.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") P(TX - 3 + i, sy + j, ch === "W" ? "#FFFFFF" : "#FFD24A"); }));
}

/* ── 그리기 ── */
let cv, ctx, base;
function mount() {
  if (!host) return;
  host.innerHTML = '<canvas class="pxroom" width="250" height="200" aria-hidden="true"></canvas>';
  cv = host.querySelector("canvas"); ctx = cv.getContext("2d");
  base = document.createElement("canvas"); base.width = W; base.height = H;
  buildTreeParts(); drawStatic(base.getContext("2d"));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let last = 0;
  const tick = t => {
    if (t - last > 110 || reduce) { last = t; ctx.drawImage(base, 0, 0); drawLive(ctx, t, reduce); }
    if (!reduce) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
mount();
/* 공유 이미지·썸네일용: 멈춘 장면 한 장 */
window.drawSantaRoom = g => { if (!ORN.length) buildTreeParts(); drawStatic(g); drawLive(g, 0, true); };

/* ── 도트 선물 상자 5종 (16×16) ── */
const WRAP = {
  red:   { f: "#D9473B", s: "#A8332A", t: "#EE6B5A", r: "#F2C14E", rd: "#C9962E", p: "#FFE6D6", pat: "dots" },
  green: { f: "#3B8A4E", s: "#25623A", t: "#5CAE66", r: "#D9473B", rd: "#A8332A", p: "#9BD39A", pat: "check" },
  navy:  { f: "#2F4F94", s: "#1D3266", t: "#5274B8", r: "#F2C14E", rd: "#C9962E", p: "#F2C14E", pat: "stars" },
  gold:  { f: "#E5B03E", s: "#B5821F", t: "#F7D26E", r: "#D9473B", rd: "#A8332A", p: "#FFF0B8", pat: "stripe" },
  snow:  { f: "#F3EEE4", s: "#CFC6B4", t: "#FFFFFF", r: "#2F8A4A", rd: "#1F5E32", p: "#D9473B", pat: "dots" }
};
const BOX = [
  ".....BB..BB.....",
  "....BhBBBBhB....",
  "....BBBbbBBB....",
  ".....BBRRBB.....",
  "tttttttRRttttttt",
  "LLLLLLLRRLLLLLLL",
  "dddddddRRddddddd",
  ".ffffffRRffffffs",
  ".ffffffRRffffffs",
  ".ffffffRRffffffs",
  ".ffffffRRffffffs",
  ".ffffffRRffffffs",
  ".ffffffRRffffffs",
  ".ffffffRRffffffs",
  ".eeeeeeRReeeeees",
  "..zzzzzzzzzzzzz."
];
function giftSVG(k) {
  const w = WRAP[k], px = [];
  const lid = mix(w.f, "#FFFFFF", .12), lidTop = mix(w.f, "#FFFFFF", .35), lidDark = mix(w.f, "#000000", .3);
  BOX.forEach((row, y) => [...row].forEach((ch, x) => {
    let c = null;
    if (ch === "B") c = w.r; else if (ch === "h") c = mix(w.r, "#FFFFFF", .55); else if (ch === "b") c = w.rd;
    else if (ch === "R") c = x === 8 ? w.rd : w.r;
    else if (ch === "t") c = lidTop; else if (ch === "L") c = lid; else if (ch === "d") c = lidDark;
    else if (ch === "s") c = w.s; else if (ch === "e") c = mix(w.f, "#000000", .2); else if (ch === "z") c = "rgba(20,8,4,.35)";
    else if (ch === "f") {
      c = w.f;
      const pat = w.pat;
      if (pat === "dots" && (x + y * 3) % 6 === 0 && y % 2) c = w.p;
      if (pat === "check" && (x % 4 === 1 || y % 4 === 1)) c = mix(w.f, w.p, .45);
      if (pat === "stars" && ((x === 3 && y === 9) || (x === 12 && y === 11) || (x === 4 && y === 12) || (x === 11 && y === 8))) c = w.p;
      if (pat === "stripe" && (x + y) % 4 === 0) c = w.p;
      if (x === 1) c = mix(c, "#FFFFFF", .22);
    }
    if (c) px.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`);
  }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${px.join("")}</svg>`;
}
const css = Object.keys(WRAP).map(k => `.w-${k} .spr{background-image:url("data:image/svg+xml,${encodeURIComponent(giftSVG(k))}");image-rendering:pixelated}`).join("\n")
  + "\n.pxroom{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated;image-rendering:crisp-edges}";
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
})();
