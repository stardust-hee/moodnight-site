/* 산타의 선물가게 — 32bit 도트 방 (도트 샘플 4의 방을 실제 서비스로)
 * 붉은 무늬 벽지, 벽난로와 굴뚝, 화분 둘, 책장, 밤눈 창문, 전구 가랜드, 세로 나무 판자 바닥.
 * 주인공은 가운데 오른쪽의 동글동글 덩어리 트리와 그 아래 선물. 가구는 빼고 단순하게.
 * 180×144 캔버스(5:4)를 키워서 보여 줘요. 휴대폰에서는 왼쪽 22%(창문)가 잘려요. */
(function () {
const W = 180, H = 144;
const host = document.getElementById("sceneHost");
const hash = (x, y) => (((x * 73856093) ^ (y * 19349663) ^ (x * y * 83492791)) >>> 0) % 100;
const O = "#2a140a";
let b;                                            // 지금 그리는 캔버스
const P = (c, x, y, w = 1, h = 1) => { b.fillStyle = c; b.fillRect(x, y, w, h); };
const mask = () => new Uint8Array(W * H);
const inM = (m, x, y) => x >= 0 && y >= 0 && x < W && y < H && m[y * W + x];
function outline(m, col) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!m[y * W + x] && (inM(m, x - 1, y) || inM(m, x + 1, y) || inM(m, x, y - 1) || inM(m, x, y + 1))) P(col, x, y); }
function fill(m, fn) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) { const c = fn(x, y); if (c) P(c, x, y); } }
function ellipseM(m, cx, cy, rx, ry) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (x >= 0 && y >= 0 && x < W && y < H && ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) m[y * W + x] = 1; }
function box(x, y, w, h, base, hi, lo) { P(O, x, y, w, h); P(base, x + 1, y + 1, w - 2, h - 2); if (hi) { P(hi, x + 1, y + 1, w - 2, 1); P(hi, x + 1, y + 1, 1, h - 2); } if (lo) { P(lo, x + 1, y + h - 2, w - 2, 1); P(lo, x + w - 2, y + 1, 1, h - 2); } }

/* 자리 */
const FX = 62;                       // 벽난로 왼쪽 x
const TX = 112, TTOP = 40, ROWS = 9; // 트리 가운데, 꼭대기, 덩어리 줄 수
const WINX = 10, WINY = 7, WINW = 34, WINH = 20;

/* ── 바닥: 세로 나무 판자 ── */
function floor() {
  for (let y = 36; y < H; y++) for (let x = 0; x < W; x++) {
    const col = Math.floor(x / 8), lx = x % 8, seam = (y + hash(col, 9) % 24) % 24;
    let c = (hash(col, 3) % 3 === 0) ? "#8a5226" : "#94592a";
    if (lx === 0) c = "#5a3014"; else if (lx === 1) c = "#a8693a"; else if (lx === 7) c = "#7a4520";
    if (seam === 0) c = "#5a3014";
    if (hash(x, y) < 2 && lx > 2 && lx < 6) c = "#7a4520";
    P(c, x, y);
  }
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
  P(O, 0, 33, W, 1); P("#6a3416", 0, 34, W, 2); P("#8a4a22", 0, 34, W, 1);
}
/* ── 창문 틀 (밤하늘과 눈은 움직이는 쪽에서) ── */
function windowFrame() { box(WINX - 3, WINY - 3, WINW + 6, WINH + 6, "#b9733b", "#d99a5c", "#7a4220"); P(O, WINX - 1, WINY - 1, WINW + 2, WINH + 2); }
/* ── 벽난로 ── */
function fireplace() {
  const x = FX, y = 0;
  for (let j = 0; j < 16; j += 4) for (let i = (j / 4 % 2) * 3; i < 30; i += 6) { P("#7a3a22", x + 3 + i, y + j, 6, 4); P("#a85030", x + 3 + i, y + j, 5, 3); P("#c26a42", x + 3 + i, y + j, 5, 1); }
  P(O, x + 2, 0, 1, 16); P(O, x + 33, 0, 1, 16);
  P(O, x - 2, 15, 40, 26);
  for (let j = 0; j < 24; j += 4) for (let i = (j / 4 % 2) * 3 - 3; i < 38; i += 6) { const xx = Math.max(x - 1, x - 1 + i), w = Math.min(6, x + 37 - xx); if (w > 0) { P("#7a3a22", xx, 16 + j, w, 4); P("#a85030", xx, 16 + j, w - 1, 3); P("#c26a42", xx, 16 + j, w - 1, 1); } }
  box(x - 4, 14, 44, 4, "#7a4220", "#a8693a", "#5a3014");
  P(O, x + 8, 22, 20, 18); P("#1a0e0a", x + 9, 23, 18, 17); P("#3a2a24", x + 9, 37, 18, 3);
  box(x - 2, 40, 40, 4, "#8a8494", "#a8a2b2", "#6a6474");
  // 양말 셋 (선반에 걸린)
  [[x + 1, "#e8443a"], [x + 16, "#3d8b3a"], [x + 31, "#e8443a"]].forEach(([sx, c]) => { P(O, sx - 1, 17, 6, 9); P("#ffffff", sx, 18, 4, 2); P(c, sx, 20, 4, 4); P(c, sx, 24, 5, 2); P(O, sx + 5, 24, 1, 2); });
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
/* ── 가랜드 ── */
const bulbs = [];
function garland() {
  for (let x = 0; x < W; x++) {
    const yy = 3 + Math.round(Math.abs(Math.sin(x / 13)) * 3);
    if (x > FX - 2 && x < FX + 38) continue;
    P("#1d5a2a", x, yy, 1, 3); if (x % 3 === 0) P("#4fae4a", x, yy, 1, 1);
    if (x % 16 === 8) bulbs.push([x, yy + 4]);
  }
}
/* ── 트리: 동글동글 덩어리 트리 (샘플 4의 트리, 크게) ── */
let lights = [];
function drawTree(cx, top, rows) {
  const ty = top + rows * 7 + 2;
  P(O, cx - 5, ty, 11, 15); P("#7a4526", cx - 4, ty, 9, 14); P("#9a5a32", cx - 4, ty, 3, 14); P("#5a3018", cx + 3, ty, 1, 14);
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
  const orn = [], span = Math.round(3 + rows * 3.3) + 2;
  for (let i = 0; i < 900 && orn.length < 34; i++) {
    const x = cx - span + (hash(i, 7) % (span * 2 + 1)), y = top + 8 + (hash(7, i) % (rows * 7));
    if (!inM(m, x - 2, y) || !inM(m, x + 2, y) || !inM(m, x, y + 3) || !inM(m, x, y - 2)) continue;
    if (orn.some(o => Math.abs(o[0] - x) < 6 && Math.abs(o[1] - y) < 5)) continue;
    orn.push([x, y, cols[i % 4]]);
  }
  orn.forEach(([x, y, [c, lo]]) => { P("#0f2e1c", x - 1, y - 2, 3, 5); P("#0f2e1c", x - 2, y - 1, 5, 3); P(c, x - 1, y - 1, 3, 3); P(lo, x, y + 1, 2, 1); P(lo, x + 1, y, 1, 1); P("#ffffff", x - 1, y - 1, 1, 1); });
  lights = [];
  for (let i = 0; i < 900 && lights.length < 46; i++) {
    const x = cx - span + (hash(i, 13) % (span * 2 + 1)), y = top + 6 + (hash(13, i) % (rows * 7 + 4));
    if (!inM(m, x, y) || orn.some(o => Math.abs(o[0] - x) < 3 && Math.abs(o[1] - y) < 3)) continue;
    lights.push([x, y, i]);
  }
}
/* ── 트리 아래 초록 카펫 ── */
function carpet(cx, cy, rx, ry) {
  const m = mask(); ellipseM(m, cx, cy, rx, ry);
  outline(m, "#0e2a18");
  fill(m, (x, y) => { const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (e > 0.82) return "#2f6e40"; if (e > 0.74) return "#1c4a2c"; return (x + y) % 8 === 0 && hash(x, y) < 50 ? "#2a5c38" : "#21503a"; });
}
/* ── 방 둘레 두꺼운 벽 ── */
function frameWalls() {
  const c = "#c97a3a", hi = "#e29a52", lo = "#9a5426";
  P(c, 0, 0, 4, H); P(hi, 1, 0, 1, H); P(O, 4, 0, 1, H);
  P(c, W - 4, 0, 4, H); P(lo, W - 2, 0, 1, H); P(O, W - 5, 0, 1, H);
  P(c, 0, H - 4, W, 4); P(hi, 0, H - 3, W, 1); P(O, 0, H - 5, W, 1);
}
function drawStatic(g) {
  b = g; bulbs.length = 0;
  wall(); floor();
  windowFrame();
  fireplace();
  bookshelf(144, 2);
  garland();
  plant(50, 30); plant(133, 30);
  carpet(TX - 4, 116, 58, 20);
  drawTree(TX, TTOP, ROWS);
  frameWalls();
}

/* ── 움직이는 것 ── */
const FL = Array.from({ length: 22 }, () => ({ x: Math.random() * WINW, y: Math.random() * WINH, v: .15 + Math.random() * .3, p: Math.random() * 6 }));
function drawLive(c, t, still) {
  b = c;
  for (let j = 0; j < WINH; j++) P(j < WINH / 2 ? "#141a3e" : "#1c2456", WINX, WINY + j, WINW, 1);
  for (let i = 0; i < 6; i++) P("#ffe27a", WINX + hash(i, 1) % WINW, WINY + hash(1, i) % 8);
  P("#eef4fc", WINX, WINY + WINH - 4, WINW, 4); P("#cfe0f5", WINX, WINY + WINH - 1, WINW, 1);
  FL.forEach(f => { const x = Math.round(f.x + Math.sin(f.y / 6 + f.p)), y = Math.round(f.y); if (x >= 0 && x < WINW && y < WINH - 4) P("#ffffff", WINX + x, WINY + y); if (!still) { f.y += f.v; if (f.y > WINH - 4) { f.y = -1; f.x = Math.random() * WINW; } } });
  P(O, WINX + WINW / 2 - 1, WINY, 2, WINH); P(O, WINX, WINY + WINH / 2 - 1, WINW, 2);
  const fx = FX, fr = still ? 0 : Math.floor(t / 120) % 3;
  P("#e0482a", fx + 11, 31 - fr, 14, 7 + fr); P("#ffa82e", fx + 13, 29 + (fr === 1 ? 1 : 0), 10, 9); P("#fff09a", fx + 15, 32 - (fr === 2 ? 1 : 0), 6, 5); P("#5a3014", fx + 11, 37, 14, 2);
  lights.forEach(([x, y, i]) => { const on = still ? 1 : (Math.floor(t / 380) + i) % 4; P(on === 0 ? "#2f8a3e" : ["#fff6c8", "#ffd04a", "#ffb0a0", "#c8e0ff"][i % 4], x, y); });
  bulbs.forEach(([x, y], i) => { P(O, x - 1, y - 1, 3, 4); P((still ? 0 : Math.floor(t / 600) + i) % 2 ? "#fff6c8" : "#ffd04a", x, y, 1, 2); });
  const sx = TX, sy = TTOP, shape = ["...o...", "..oyo..", "ooyyyoo", "oyyWyyo", ".oyyyo.", ".oyoyo.", "oyo.oyo", "oo...oo"];
  shape.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === ".") return; P(ch === "o" ? "#7a4a08" : ch === "W" ? "#ffffff" : (!still && Math.floor(t / 500) % 2 ? "#ffe066" : "#ffd04a"), sx - 3 + i, sy - 6 + j); }));
  const spot = (cx, cy, r, col, a) => { const gr = c.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gr; c.fillRect(cx - r, cy - r, r * 2, r * 2); };
  c.save(); c.globalCompositeOperation = "screen";
  const fl = still ? 1 : 0.9 + Math.sin(t / 150) * 0.08;
  spot(FX + 18, 34, 40 * fl, "255,150,60", 0.38);
  spot(TX, TTOP - 2, 13, "255,225,110", still ? .5 : 0.5 + Math.sin(t / 300) * 0.15);
  spot(TX, TTOP + 40, 46, "255,200,120", 0.12);
  spot(WINX + WINW / 2, WINY + WINH / 2, 20, "120,150,255", 0.14);
  bulbs.forEach(([x, y]) => spot(x, y + 1, 6, "255,220,140", 0.3));
  c.restore();
}

function mount() {
  if (!host) return;
  host.innerHTML = '<canvas class="pxroom" width="180" height="144" aria-hidden="true"></canvas>';
  const cv = host.querySelector("canvas"), ctx = cv.getContext("2d");
  const base = document.createElement("canvas"); base.width = W; base.height = H;
  drawStatic(base.getContext("2d"));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let last = 0;
  const tick = t => {
    if (t - last > 100 || reduce) { last = t; ctx.drawImage(base, 0, 0); drawLive(ctx, t, reduce); }
    if (!reduce) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
mount();
window.drawSantaRoom = g => { drawStatic(g); drawLive(g, 0, true); };

/* ── 도트 선물 상자 5종 (샘플 4의 상자, 16×16) ── */
const WRAP = {
  red:   { top: "#ff6a5a", b: "#e8443a", lo: "#a52a20", rib: "#ffd04a", ribLo: "#c9961e" },
  green: { top: "#5fbf52", b: "#3d8b3a", lo: "#256127", rib: "#e8443a", ribLo: "#a52a20" },
  navy:  { top: "#6aa2f0", b: "#3f73d6", lo: "#2a4c9e", rib: "#ffd04a", ribLo: "#c9961e" },
  gold:  { top: "#ffe27a", b: "#f2b83a", lo: "#c08420", rib: "#e8443a", ribLo: "#a52a20" },
  snow:  { top: "#ffffff", b: "#eef0f4", lo: "#b8c0cc", rib: "#3d8b3a", ribLo: "#256127" }
};
function giftSVG(k) {
  const w = WRAP[k], px = [];
  const r = (col, x, y, ww = 1, hh = 1) => px.push(`<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="${col}"/>`);
  r("#2a1a14", 1, 4, 14, 12); r(w.top, 2, 5, 12, 4); r(w.b, 2, 9, 12, 6); r(w.lo, 2, 14, 12, 1); r(w.lo, 12, 9, 2, 6); r("#2a1a14", 2, 9, 12, 1);
  r(w.rib, 7, 5, 2, 10); r(w.ribLo, 8, 9, 1, 6); r(w.rib, 2, 6, 12, 2); r(w.ribLo, 2, 7, 12, 1);
  r("#2a1a14", 3, 1, 4, 5); r("#2a1a14", 9, 1, 4, 5); r(w.rib, 4, 2, 2, 3); r(w.rib, 10, 2, 2, 3); r("#ffffff", 4, 2, 1, 1); r("#2a1a14", 6, 3, 4, 4); r(w.rib, 7, 4, 2, 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${px.join("")}</svg>`;
}
const css = Object.keys(WRAP).map(k => `.w-${k} .spr{background-image:url("data:image/svg+xml,${encodeURIComponent(giftSVG(k))}");image-rendering:pixelated}`).join("\n")
  + "\n.pxroom{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated;image-rendering:crisp-edges}";
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
})();
