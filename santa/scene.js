/* 산타의 선물가게: 방 안 도트 장면 (192×144) + 선물 상자 도트 스프라이트
 * 방 그림은 캔버스에, 선물 상자는 app.js가 그 위에 버튼으로 올려요. */
(function () {
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const W = 192, H = 144;
const cv = document.getElementById("scene"), ctx = cv.getContext("2d");
const bg = document.createElement("canvas"); bg.width = W; bg.height = H;
const b = bg.getContext("2d");
const gl = document.getElementById("glow"), g = gl.getContext("2d");
const hash = (x, y) => (((x * 73856093) ^ (y * 19349663) ^ (x * y * 83492791)) >>> 0) % 100;
const P = (c, x, y, w = 1, h = 1) => { b.fillStyle = c; b.fillRect(x, y, w, h); };
const O = "#2a140a";
const mask = () => new Uint8Array(W * H);
const inM = (m, x, y) => x >= 0 && y >= 0 && x < W && y < H && m[y * W + x];
function outline(m, col) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!m[y * W + x] && (inM(m, x - 1, y) || inM(m, x + 1, y) || inM(m, x, y - 1) || inM(m, x, y + 1))) P(col, x, y); }
function fill(m, fn) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) { const c = fn(x, y); if (c) P(c, x, y); } }
function ellipseM(m, cx, cy, rx, ry) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (x >= 0 && y >= 0 && x < W && y < H && ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) m[y * W + x] = 1; }
// 외곽선 + 밝은 면 + 그림자 상자
function box(x, y, w, h, base, hi, lo) { P(O, x, y, w, h); P(base, x + 1, y + 1, w - 2, h - 2); if (hi) { P(hi, x + 1, y + 1, w - 2, 1); P(hi, x + 1, y + 1, 1, h - 2); } if (lo) { P(lo, x + 1, y + h - 2, w - 2, 1); P(lo, x + w - 2, y + 1, 1, h - 2); } }

/* ── 바닥: 세로 나무 판자 ── */
function floor() {
  for (let y = 36; y < H; y++) for (let x = 0; x < W; x++) {
    const col = Math.floor(x / 8), lx = x % 8, seam = (y + hash(col, 9) % 24) % 24;
    let c = (hash(col, 3) % 3 === 0) ? "#8a5226" : "#94592a";
    if (lx === 0) c = "#5a3014";
    else if (lx === 1) c = "#a8693a";
    else if (lx === 7) c = "#7a4520";
    if (seam === 0) c = "#5a3014";
    if (hash(x, y) < 2 && lx > 2 && lx < 6) c = "#7a4520";
    P(c, x, y);
  }
  // 벽 아래 그림자
  P("rgba(40,15,5,.45)", 0, 36, W, 2); P("rgba(40,15,5,.2)", 0, 38, W, 2);
}

/* ── 벽: 붉은 무늬 벽지 ── */
function wall() {
  for (let y = 0; y < 34; y++) for (let x = 0; x < W; x++) {
    const lx = x % 10, ly = y % 10;
    let c = "#8a2a2c";
    if ((lx === 4 && ly === 4) || (lx === 9 && ly === 9)) c = "#c98a3a";
    else if ((lx === 3 || lx === 5) && ly === 4) c = "#6a1c20";
    else if (lx === 4 && (ly === 3 || ly === 5)) c = "#6a1c20";
    else if (hash(x, y) < 6) c = "#7e2427";
    P(c, x, y);
  }
  // 걸레받이
  P(O, 0, 33, W, 1); P("#6a3416", 0, 34, W, 2); P("#8a4a22", 0, 34, W, 1);
}

/* ── 창문: 밤하늘과 별 ── */
function windowAt(x, y, w, h) {
  box(x - 3, y - 3, w + 6, h + 6, "#b9733b", "#d99a5c", "#7a4220");
  P(O, x - 1, y - 1, w + 2, h + 2);
  for (let j = 0; j < h; j++) P(j < h / 2 ? "#1c2350" : "#26306a", x, y + j, w, 1);
  for (let i = 0; i < 14; i++) P(i % 4 ? "#ffffff" : "#ffe27a", x + hash(i, 1) % w, y + hash(1, i) % (h - 6));
  P("#eef4fc", x, y + h - 4, w, 4); P("#cfe0f5", x, y + h - 1, w, 1);
  P(O, x + w / 2 - 1, y, 2, h); P(O, x, y + h / 2 - 1, w, 2);
}

/* ── 벽난로 ── */
function fireplace(t) {
  const x = 78, y = 0;
  // 굴뚝
  for (let j = 0; j < 16; j += 4) for (let i = (j / 4 % 2) * 3; i < 30; i += 6) { P("#7a3a22", x + 3 + i, y + j, 6, 4); P("#a85030", x + 3 + i, y + j, 5, 3); P("#c26a42", x + 3 + i, y + j, 5, 1); }
  P(O, x + 2, 0, 1, 16); P(O, x + 33, 0, 1, 16);
  // 몸체
  P(O, x - 2, 15, 40, 26);
  for (let j = 0; j < 24; j += 4) for (let i = (j / 4 % 2) * 3 - 3; i < 38; i += 6) { const xx = Math.max(x - 1, x - 1 + i), w = Math.min(6, x + 37 - xx); if (w > 0) { P("#7a3a22", xx, 16 + j, w, 4); P("#a85030", xx, 16 + j, w - 1, 3); P("#c26a42", xx, 16 + j, w - 1, 1); } }
  box(x - 4, 14, 44, 4, "#7a4220", "#a8693a", "#5a3014");
  P(O, x + 8, 22, 20, 18); P("#1a0e0a", x + 9, 23, 18, 17);
  P("#3a2a24", x + 9, 37, 18, 3);
  // 하스(바닥 돌)
  box(x - 2, 40, 40, 4, "#8a8494", "#a8a2b2", "#6a6474");
}
function fire(t) {
  const x = 78, f = Math.floor(t / 120) % 3;
  ctx.fillStyle = "#e0482a"; ctx.fillRect(x + 11, 31 - f, 14, 7 + f);
  ctx.fillStyle = "#ffa82e"; ctx.fillRect(x + 13, 29 + (f === 1 ? 1 : 0), 10, 9);
  ctx.fillStyle = "#fff09a"; ctx.fillRect(x + 15, 32 - (f === 2 ? 1 : 0), 6, 5);
  ctx.fillStyle = "#5a3014"; ctx.fillRect(x + 11, 37, 14, 2);
}

/* ── 책장 ── */
function bookshelf(x, y) {
  box(x, y, 30, 34, "#9a5426", "#c27a40", "#6a3416");
  const books = ["#c8423a", "#3f73d6", "#3d8b3a", "#f2b83a", "#7a52c8", "#e86a3a", "#2a8a8a"];
  for (let s = 0; s < 3; s++) {
    const sy = y + 3 + s * 10;
    P("#4a2410", x + 2, sy, 26, 8);
    let bx = x + 3;
    for (let k = 0; bx < x + 26; k++) { const w = 2 + hash(k, s) % 2, h = 5 + hash(s, k) % 3, c = books[(k + s * 3) % books.length]; P(c, bx, sy + 8 - h, w, h); P("rgba(255,255,255,.25)", bx, sy + 8 - h, 1, h); bx += w + (hash(k + 9, s) % 4 === 0 ? 1 : 0); }
    P("#c27a40", x + 2, sy + 8, 26, 1); P(O, x + 2, sy + 9, 26, 1);
  }
}

/* ── 화분 ── */
function plant(x, y) {
  const m = mask();
  [[0, 0, 5], [-4, 3, 4], [4, 3, 4], [-2, -4, 4], [3, -3, 4]].forEach(([dx, dy, r]) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r && x + dx + i >= 0 && y + dy + j >= 0) m[(y + dy + j) * W + x + dx + i] = 1; });
  outline(m, "#0f2e1c"); fill(m, (xx, yy) => { const v = hash(xx, yy); return yy < y - 2 && v < 40 ? "#6cc85a" : v < 18 ? "#1f6330" : "#3d9a40"; });
  box(x - 5, y + 6, 11, 8, "#b84a2a", "#d86a42", "#8a3018");
}

/* ── 걸어 둔 전구 ── */
const bulbs = [];
function garland() {
  for (let x = 0; x < W; x++) {
    const yy = 3 + Math.round(Math.abs(Math.sin(x / 13)) * 3);
    if (x > 76 && x < 116) continue;
    P("#1d5a2a", x, yy, 1, 3); if (x % 3 === 0) P("#4fae4a", x, yy, 1, 1);
    if (x % 16 === 8) bulbs.push([x, yy + 4]);
  }
}

/* ── 트리 (샘플 3에서 좋았던 덩어리 트리) ── */
let lights = [];
function drawTree(cx, top, rows) {
  P(O, cx - 4, top + rows * 7 + 2, 9, 8); P("#7a4526", cx - 3, top + rows * 7 + 2, 7, 7);
  const m = mask(), owner = new Int16Array(W * H).fill(-1), blobs = [];
  for (let k = 0; k <= rows; k++) {
    const y = top + 6 + k * 7, hw = 3 + k * 3.3;
    for (let x = -hw; x <= hw; x += 5) blobs.push([cx + x + (hash(k, x + 50) % 3) - 1, y + (hash(x + 50, k) % 3), 4.4 + (k > rows - 3 ? 0.7 : 0)]);
  }
  blobs.forEach(([bx, by, r], i) => { for (let y = Math.floor(by - r); y <= by + r; y++) for (let x = Math.floor(bx - r); x <= bx + r; x++) if (x >= 0 && y >= 0 && x < W && y < H && (x - bx) ** 2 + (y - by) ** 2 <= r * r) { m[y * W + x] = 1; owner[y * W + x] = i; } });
  outline(m, "#0f2e1c");
  fill(m, (x, y) => {
    const [bx, by, r] = blobs[owner[y * W + x]];
    const dx = (x - bx) / r, dy = (y - by) / r, d = dx * dx + dy * dy, v = hash(x, y);
    if (d > 0.72 && dy > 0.1) return "#174d27";
    if (dy > 0.35) return "#1f6330";
    if (dx < -0.1 && dy < -0.15 && d < 0.6) return x < cx ? "#6cc85a" : "#4fae4a";
    if (dy < -0.55 && v < 40) return "#5fbf52";
    if (v < 6) return "#1f6330";
    return "#2f8a3e";
  });
  const cols = [["#ffd04a", "#c9961e"], ["#e8443a", "#a52a20"], ["#8a5cd6", "#5c3a9e"], ["#4a8be8", "#2a5cb0"]];
  const orn = [];
  for (let i = 0; i < 500 && orn.length < 26; i++) {
    const x = cx - 32 + (hash(i, 7) % 65), y = top + 8 + (hash(7, i) % (rows * 7));
    if (!inM(m, x - 2, y) || !inM(m, x + 2, y) || !inM(m, x, y + 3) || !inM(m, x, y - 2)) continue;
    if (orn.some(o => Math.abs(o[0] - x) < 6 && Math.abs(o[1] - y) < 5)) continue;
    orn.push([x, y, cols[i % 4]]);
  }
  orn.forEach(([x, y, [c, lo]]) => { P("#0f2e1c", x - 1, y - 2, 3, 5); P("#0f2e1c", x - 2, y - 1, 5, 3); P(c, x - 1, y - 1, 3, 3); P(lo, x, y + 1, 2, 1); P(lo, x + 1, y, 1, 1); P("#ffffff", x - 1, y - 1, 1, 1); });
  lights = [];
  for (let i = 0; i < 600 && lights.length < 36; i++) {
    const x = cx - 32 + (hash(i, 13) % 65), y = top + 6 + (hash(13, i) % (rows * 7 + 4));
    if (!inM(m, x, y) || orn.some(o => Math.abs(o[0] - x) < 3 && Math.abs(o[1] - y) < 3)) continue;
    lights.push([x, y, i]);
  }
}

/* ── 초록 카페트, 러그, 가구 ── */
function carpet(cx, cy, rx, ry) {
  const m = mask(); ellipseM(m, cx, cy, rx, ry);
  outline(m, "#0e2a18");
  fill(m, (x, y) => { const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (e > 0.82) return "#2f6e40"; if (e > 0.74) return "#1c4a2c"; return (x + y) % 8 === 0 && hash(x, y) < 50 ? "#2a5c38" : "#21503a"; });
}
function rug(x, y, w, h) {
  box(x, y, w, h, "#4f8a3a", "#6aa84a", "#3a6a2c");
  for (let j = 4; j < h - 4; j += 8) for (let i = 4 + (j / 8 % 2) * 4; i < w - 4; i += 8) { P("#6aa84a", x + i, y + j, 2, 1); P("#6aa84a", x + i - 1, y + j + 1, 4, 1); P("#6aa84a", x + i, y + j + 2, 2, 1); }
  P("#3a6a2c", x + 3, y + 3, w - 6, 1); P("#3a6a2c", x + 3, y + h - 4, w - 6, 1);
}
function table(x, y) {
  box(x, y, 30, 12, "#a8602e", "#c87a42", "#7a4220");
  P(O, x + 1, y + 12, 3, 4); P("#7a4220", x + 2, y + 12, 1, 3); P(O, x + 26, y + 12, 3, 4); P("#7a4220", x + 27, y + 12, 1, 3);
  P("rgba(30,10,0,.3)", x + 2, y + 16, 26, 2);
}
function mystery(x, y) {
  box(x, y + 3, 12, 11, "#3f73d6", "#6aa2f0", "#2a4c9e"); P("#6aa2f0", x + 1, y, 10, 4); P(O, x, y, 12, 1); P(O, x, y, 1, 4); P(O, x + 11, y, 1, 4);
  const q = ["oo.", "..o", ".o.", "...", ".o."];
  q.forEach((r, j) => [...r].forEach((c, i) => { if (c === "o") P("#ffd04a", x + 5 + i, y + 5 + j); }));
}
function armchair(x, y, flip) {
  const m = mask();
  for (let j = 0; j < 20; j++) for (let i = 0; i < 18; i++) m[(y + j) * W + x + i] = 1;
  outline(m, O);
  fill(m, (xx, yy) => { const lx = xx - x, ly = yy - y; const armSide = flip ? lx > 13 : lx < 4; const back = flip ? lx < 5 : lx > 12; if (armSide && ly > 4) return ly === 5 ? "#8ce06a" : "#3fae4a"; if (back) return ly < 3 ? "#8ce06a" : "#2f8a3a"; if (ly > 16) return "#256a2c"; return ly < 6 ? "#6cd05a" : "#4fc04a"; });
}
function sofa(x, y) {
  box(x, y, 34, 8, "#c8423a", "#e86a5a", "#9a2a26");
  box(x, y + 6, 34, 10, "#e05a4a", "#ff8a7a", "#a83a30");
  box(x - 3, y + 3, 6, 13, "#c8423a", "#e86a5a", "#9a2a26"); box(x + 31, y + 3, 6, 13, "#c8423a", "#e86a5a", "#9a2a26");
}
function snowman(x, y) {
  const spr = ["...ooo....", "..oWWWo...", "..oWkWkWo.", "..oWWnWo..", "...oWWo...", "..oRRRRo..", ".oWWWWWWo.", "oWWWWWWWWo", "oWWWkWWWWo", "oWWWWWWWBo", ".oWWWWWWBo", "..oooooo..."];
  const col = { o: "#2a3a5a", W: "#ffffff", k: "#1a1a26", n: "#ff8a2a", R: "#e8443a", B: "#cfe0f5" };
  spr.forEach((r, j) => [...r].forEach((c, i) => { if (col[c]) P(col[c], x + i, y + j); }));
}
function lampStand(x, y) {
  P(O, x - 4, y + 26, 9, 3); P("#c98a3a", x - 3, y + 26, 7, 2);
  P(O, x - 1, y + 8, 3, 19); P("#c98a3a", x, y + 8, 1, 18);
  P(O, x - 6, y - 2, 13, 11); P("#5fbf52", x - 5, y - 1, 11, 9); P("#8ce06a", x - 5, y - 1, 11, 2); P("#3d9a40", x - 5, y + 6, 11, 2);
}
function bunny(x, y, t) {
  const bob = Math.floor(t / 420) % 2;
  const spr = ["..o...o.....", ".oWo.oWo....", ".oPo.oPo....", ".oWo.oWo....", "..ooooooo...", ".oRRRRRRRoo.", "oRRRRRRRRRWo", "oWWWWWWWWWoo", "oWWWWWWWWWo.", "oWkWWWWkWWo.", "oWWPWkWPWWo.", ".oWWWWWWWo..", ".oRRRRRRRo..", "oRRRWWWRRRo.", "oRRRWWWRRRo.", ".oRRRRRRRo..", "..oWWo.oWWo.", "...oo...oo.."];
  const col = { o: "#2a1a14", W: "#ffffff", P: "#ff9db0", R: "#e8443a", k: "#2a1a14" };
  ctx.fillStyle = "rgba(30,10,0,.3)"; ctx.fillRect(x + 1, y + 18, 10, 1);
  spr.forEach((row, j) => [...row].forEach((c, i) => { if (col[c]) { ctx.fillStyle = col[c]; ctx.fillRect(x + i, y + j - bob * (j < 16 ? 1 : 0), 1, 1); } }));
}

/* ── 방 둘레 두꺼운 벽 ── */
function frameWalls() {
  const c = "#c97a3a", hi = "#e29a52", lo = "#9a5426";
  P(c, 0, 0, 4, H); P(hi, 1, 0, 1, H); P(O, 4, 0, 1, H);
  P(c, W - 4, 0, 4, H); P(lo, W - 2, 0, 1, H); P(O, W - 5, 0, 1, H);
  P(c, 0, H - 4, W, 4); P(hi, 0, H - 3, W, 1); P(O, 0, H - 5, W, 1);
}

/* ── 배경 한 번 그리기 ── */
wall(); floor();
windowAt(12, 8, 34, 20);
fireplace(0);
bookshelf(152, 2);
garland();
plant(68, 30); plant(126, 30);
carpet(46, 112, 42, 17);
drawTree(46, 50, 7);
rug(96, 58, 70, 40);
armchair(98, 62, false); armchair(146, 62, true);
table(116, 70); mystery(125, 60);
sofa(98, 120);
snowman(140, 124); snowman(160, 124);
lampStand(178, 96);
plant(84, 126);
frameWalls();

/* ── 애니메이션 ── */
function frame(t) {
  ctx.drawImage(bg, 0, 0);
  fire(t);
  lights.forEach(([x, y, i]) => { const on = (Math.floor(t / 380) + i) % 4; ctx.fillStyle = on === 0 ? "#2f8a3e" : ["#fff6c8", "#ffd04a", "#ffb0a0", "#c8e0ff"][i % 4]; ctx.fillRect(x, y, 1, 1); });
  bulbs.forEach(([x, y], i) => { ctx.fillStyle = O; ctx.fillRect(x - 1, y - 1, 3, 4); ctx.fillStyle = (Math.floor(t / 600) + i) % 2 ? "#fff6c8" : "#ffd04a"; ctx.fillRect(x, y, 1, 2); });
  // 트리 별
  const sx = 46, sy = 50, shape = ["...o...", "..oyo..", "ooyyyoo", "oyyWyyo", ".oyyyo.", ".oyoyo.", "oyo.oyo", "oo...oo"];
  shape.forEach((row, j) => [...row].forEach((c, i) => { if (c === ".") return; ctx.fillStyle = c === "o" ? "#7a4a08" : c === "W" ? "#ffffff" : (Math.floor(t / 500) % 2 ? "#ffe066" : "#ffd04a"); ctx.fillRect(sx - 3 + i, sy - 6 + j, 1, 1); }));
  bunny(84, 74, t);
  // 빛
  g.clearRect(0, 0, 768, 576);
  const k = 4, spot = (cx, cy, r, col, a) => { const gr = g.createRadialGradient(cx * k, cy * k, 0, cx * k, cy * k, r * k); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, 768, 576); };
  const fl = 0.9 + Math.sin(t / 150) * 0.08;
  spot(96, 34, 46 * fl, "255,150,60", 0.42);
  spot(46, 48, 14, "255,225,110", 0.5 + Math.sin(t / 300) * 0.15);
  spot(178, 96, 24, "255,210,120", 0.3);
  spot(29, 18, 22, "120,150,255", 0.14);
  bulbs.forEach(([x, y]) => spot(x, y + 1, 7, "255,220,140", 0.35));
  if (!still) requestAnimationFrame(frame);
}


/* 선물 상자 스프라이트 → CSS 배경으로 등록 (.w-red .spr 등) */
const WRAP_COLORS = {
  red:   { top: "#ff6a5a", b: "#e8443a", lo: "#a52a20", rib: "#ffd04a", ribLo: "#c9961e" },
  green: { top: "#5fbf52", b: "#3d8b3a", lo: "#256127", rib: "#e8443a", ribLo: "#a52a20" },
  navy:  { top: "#6aa2f0", b: "#3f73d6", lo: "#2a4c9e", rib: "#ffd04a", ribLo: "#c9961e" },
  gold:  { top: "#ffe27a", b: "#f2b83a", lo: "#c08420", rib: "#e8443a", ribLo: "#a52a20" },
  snow:  { top: "#ffffff", b: "#eef2fa", lo: "#c8d4ea", rib: "#3d8b3a", ribLo: "#256127" }
};
function giftSprite(w) {
  const c = document.createElement("canvas"); c.width = 16; c.height = 16;
  const q = c.getContext("2d"); const r = (col, x, y, ww = 1, hh = 1) => { q.fillStyle = col; q.fillRect(x, y, ww, hh); };
  r("#2a1a14", 1, 4, 14, 12); r(w.top, 2, 5, 12, 4); r(w.b, 2, 9, 12, 6); r(w.lo, 2, 14, 12, 1); r(w.lo, 12, 9, 2, 6); r("#2a1a14", 2, 9, 12, 1);
  r(w.rib, 7, 5, 2, 10); r(w.ribLo, 8, 9, 1, 6); r(w.rib, 2, 6, 12, 2); r(w.ribLo, 2, 7, 12, 1);
  r("#2a1a14", 3, 1, 4, 5); r("#2a1a14", 9, 1, 4, 5); r(w.rib, 4, 2, 2, 3); r(w.rib, 10, 2, 2, 3); r("#ffffff", 4, 2, 1, 1); r("#2a1a14", 6, 3, 4, 4); r(w.rib, 7, 4, 2, 2);
  return c.toDataURL();
}
const css = Object.entries(WRAP_COLORS).map(([id, w]) => `.w-${id} .spr{background-image:url(${giftSprite(w)})}`).join("\n");
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

/* 점원 말풍선 */
const LINES = ["어서 오세요!", "선물 맡기고 가세요", "누가 보냈는지는 비밀!", "25일에 열어 드릴게요"];
const bub = document.getElementById("bubble");
if (bub) { let li = 0; bub.textContent = LINES[0]; setInterval(() => { li = (li + 1) % LINES.length; bub.textContent = LINES[li]; }, 2600); }

frame(0);
})();
