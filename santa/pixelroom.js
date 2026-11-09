/* 산타의 선물가게 — 32bit 도트 방
 * 처음 디오라마 방(창문·벽난로·트리·초록 문·빨간 러그)을 그대로 도트로 옮겼어요.
 * 트리는 스타듀밸리 트리처럼: 둥글게 퍼진 실루엣, 들쭉날쭉한 바늘, 동그란 오너먼트, 흰 전구, 별, 나무 밑동과 바구니 화분.
 * 200×160 캔버스를 키워서 보여 줘요. 휴대폰에서는 왼쪽 22%가 잘려요. */
(function () {
const W = 200, H = 160;
const host = document.getElementById("sceneHost");

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
let C;
const R = (x, y, w, h, c) => { C.fillStyle = c; C.fillRect(x | 0, y | 0, w | 0, h | 0); };
const P = (x, y, c) => R(x, y, 1, 1, c);
const SPR = (x, y, rows, map) => rows.forEach((row, j) => [...row].forEach((ch, i) => { if (map[ch]) P(x + i, y + j, map[ch]); }));
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const glow = (cx, cy, r, c, a) => { [[r, a * .35], [r * .66, a * .6], [r * .38, a * .9]].forEach(([rr, aa]) => { C.fillStyle = rgba(c, aa); for (let y = -Math.round(rr); y <= Math.round(rr); y++) { const w = Math.round(Math.sqrt(Math.max(0, rr * rr - y * y))); C.fillRect(cx - w, cy + y, w * 2 + 1, 1); } }); };

/* ── 방 구조 ── */
const WALL_R = 160;              // 뒷벽 오른쪽 끝 (그 오른쪽은 문이 있는 옆벽)
const FLOOR_Y = 112;             // 뒷벽과 바닥이 만나는 줄
const WIN = { x: 22, y: 30, w: 32, h: 40 };  // 창문 안쪽(밤하늘)
const TX = 116, TTOP = 20, TBASE = 104;      // 트리 가운데, 꼭대기, 잎 끝

/* ── 스타듀밸리풍 트리 ── */
const TH = TBASE - TTOP;
const half = y => {             // 높이별 반폭: 꼭대기는 좁고 아래로 둥글게 퍼지다가 바닥에서 살짝 오므라듦
  const t = (y - TTOP) / TH; if (t < 0 || t > 1) return -1;
  return 2 + 37 * Math.pow(t, .6) - (t > .88 ? (t - .88) * 60 : 0);
};
let TREE = null;                // 미리 계산한 트리 픽셀
function buildTree() {
  const OUT = "#0A3A22", DK = "#0F5A2C", D = "#167034", M = "#1F8A3C", L = "#34A246", HL = "#62C25A";
  const px = new Map(), key = (x, y) => x + "," + y;
  // 1) 실루엣: 줄마다 좌우 끝에 바늘 가시를 랜덤하게
  const edge = {};
  for (let y = TTOP + 2; y <= TBASE; y++) {
    const w = half(y); if (w < 1) continue;
    const spikeL = (y % 5 === 0 ? 4 : y % 5 === 1 ? 3 : y % 5 === 2 ? 1 : 0) * (hash(y, 1) > .2 ? 1 : 0) + Math.round(hash(y, 2) * 1.5);
    const spikeR = (y % 5 === 2 ? 4 : y % 5 === 3 ? 3 : y % 5 === 4 ? 1 : 0) * (hash(y, 3) > .2 ? 1 : 0) + Math.round(hash(y, 4) * 1.5);
    edge[y] = [Math.round(TX - w - spikeL), Math.round(TX + w + spikeR)];
  }
  // 아래 끝도 들쭉날쭉 (바늘이 아래로 처짐)
  for (let x = Math.round(TX - half(TBASE) - 2); x <= TX + half(TBASE) + 2; x++) {
    const drop = hash(x, 9) > .55 ? (hash(x, 10) > .6 ? 3 : 2) : hash(x, 11) > .5 ? 1 : 0;
    for (let k = 1; k <= drop; k++) px.set(key(x, TBASE + k), "fill");
  }
  for (const y in edge) for (let x = edge[y][0]; x <= edge[y][1]; x++) px.set(key(x, +y), "fill");
  // 2) 색칠: 짧은 사선 바늘 결 + 층마다 드리운 그림자 + 왼쪽 위가 밝게
  const inside = (x, y) => px.has(key(x, y));
  const out = [];
  px.forEach((_, k) => {
    const [x, y] = k.split(",").map(Number);
    let c;
    const border = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    if (border) c = OUT;
    else {
      const t = (y - TTOP) / TH, side = (x - TX) / Math.max(4, half(y) || 4);
      const layer = ((y - TTOP + Math.round(Math.sin(x / 5) * 2)) % 10) / 10;                         // 9줄마다 한 층, 층 아랫부분이 어둡게
      const stroke = hash(Math.floor((x + y) / 3), Math.floor(y / 3)); // 사선 바늘 결
      const stroke2 = hash(Math.floor((x - y) / 3), Math.floor(y / 4) + 7);
      let v = .36 - side * .3 - layer * .38 + (stroke - .5) * .55 + (stroke2 - .5) * .25 - t * .05;
      c = v > .6 ? HL : v > .36 ? L : v > .08 ? M : v > -.16 ? D : DK;
    }
    out.push([x, y, c]);
  });
  // 3) 오너먼트: 엇갈린 줄로 고르게, 동그란 공
  const orn = [], cols = ["#E8B02E", "#D8343A", "#7A6FD8", "#F0882A", "#E8B02E", "#D8343A", "#7A6FD8"];
  let row = 0;
  for (let y = TTOP + 12; y <= TBASE - 6; y += 11, row++) {
    const w = half(y) - 4; if (w < 3) continue;
    const step = 12, off = row % 2 ? step / 2 : 0;
    for (let x = TX - Math.floor((w - off) / step) * step - off; x <= TX + w; x += step) {
      if (Math.abs(x - TX) > w) continue;
      const jx = Math.round((hash(x, y) - .5) * 4), jy = Math.round((hash(y, x) - .5) * 3);
      orn.push({ x: x + jx, y: y + jy, c: cols[(row * 3 + Math.round(x / step)) % cols.length & 7 % cols.length] || cols[0] });
    }
  }
  orn.forEach((o, i) => { o.c = cols[(i * 5 + (o.y >> 2)) % cols.length]; });
  // 4) 흰 전구와 노란 전구, 갈색 리본 조각
  const lights = []; seed = 31;
  for (let i = 0; i < 70; i++) {
    const y = TTOP + 5 + Math.floor(rnd() * (TH - 6)), w = half(y) - 2; if (w < 2) continue;
    const x = Math.round(TX + (rnd() * 2 - 1) * w);
    if (orn.some(o => Math.abs(o.x - x) < 3 && Math.abs(o.y - y) < 3)) continue;
    lights.push({ x, y, c: i % 3 ? "#FFFFFF" : "#FFE45A", p: rnd() * 6 });
  }
  const ribbons = [];
  for (let i = 0; i < 12; i++) {
    const y = TTOP + 12 + Math.floor(rnd() * (TH - 18)), w = half(y) - 5; if (w < 3) continue;
    ribbons.push({ x: Math.round(TX + (rnd() * 2 - 1) * w), y, d: rnd() > .5 ? 1 : -1 });
  }
  TREE = { out, orn, lights, ribbons };
}
function drawTree() {
  if (!TREE) buildTree();
  // 나무 밑동과 바구니 화분
  R(TX - 3, TBASE - 2, 7, 10, "#6A4128"); R(TX - 3, TBASE - 2, 2, 10, "#8A5A36"); R(TX + 2, TBASE - 2, 2, 10, "#4A2C1A");
  const by = TBASE + 7;
  R(TX - 12, by, 25, 2, "#8A5A2E"); R(TX - 11, by + 2, 23, 9, "#C08A44"); R(TX - 10, by + 11, 21, 2, "#8A5A2E");
  for (let y = by + 2; y < by + 11; y++) for (let x = TX - 11; x < TX + 12; x++) if ((x + (y >> 1) * 2) % 4 === 0) P(x, y, "#9A6A32"); else if ((x + y) % 4 === 1) P(x, y, "#D8A458");
  R(TX - 12, by, 25, 1, "#D8A458");
  TREE.out.forEach(([x, y, c]) => P(x, y, c));
  TREE.ribbons.forEach(r => { P(r.x, r.y, "#7A4A26"); P(r.x + r.d, r.y + 1, "#7A4A26"); P(r.x + 2 * r.d, r.y + 1, "#5A3218"); });
  TREE.orn.forEach(o => {
    const dk = mix(o.c, "#000000", .35), lt = mix(o.c, "#FFFFFF", .5);
    SPR(o.x - 2, o.y - 2, [".AA.", "AhAA", "AAAd", ".dd."], { A: o.c, h: lt, d: dk });
  });
}

/* ── 고정 배경 ── */
function drawStatic(g) {
  C = g;
  // 뒷벽: 크림 줄무늬 벽지
  R(0, 0, WALL_R, FLOOR_Y, "#F3E7D0");
  for (let x = 2; x < WALL_R; x += 10) { R(x, 0, 4, FLOOR_Y, "#EBDCC0"); }
  for (let x = 7; x < WALL_R; x += 10) for (let y = 6; y < 86; y += 10) { P(x, y, "#E2B8A0"); P(x - 1, y + 1, "#E2B8A0"); P(x + 1, y + 1, "#E2B8A0"); P(x, y + 2, "#E2B8A0"); }
  // 천장 그늘
  for (let y = 0; y < 6; y++) R(0, y, WALL_R, 1, `rgba(120,80,40,${(6 - y) / 6 * .18})`);
  // 굽도리 판 (아래쪽 벽)
  R(0, 86, WALL_R, 26, "#F8F0E2"); R(0, 86, WALL_R, 2, "#DCC8A8"); R(0, 88, WALL_R, 1, "#FFFFFF");
  for (let x = 4; x < WALL_R - 8; x += 22) { R(x, 92, 18, 14, "#EFE2CC"); R(x, 92, 18, 1, "#D8C4A2"); R(x, 92, 1, 14, "#D8C4A2"); R(x, 105, 18, 1, "#FFFFFF"); R(x + 17, 92, 1, 14, "#FFFFFF"); }
  R(0, 108, WALL_R, 4, "#D8C4A2"); R(0, 111, WALL_R, 1, "#B89A72");
  // 옆벽 (원근): 뒷벽 오른쪽에서 앞으로 넓어지는 사다리꼴
  for (let x = WALL_R; x < W; x++) {
    const k = (x - WALL_R) / (W - WALL_R), top = 0, bot = FLOOR_Y + Math.round(k * 46);
    R(x, top, 1, bot, mix("#E2CFAE", "#C9B08A", k));
    if ((x - WALL_R) % 7 < 3) R(x, top, 1, bot, mix("#D8C29C", "#BFA27A", k));
  }
  R(WALL_R, 0, 1, FLOOR_Y, "#C9B08A");
  // 초록 문 (옆벽, 원근)
  const dx0 = 170, dx1 = 194;
  for (let x = dx0 - 2; x <= dx1 + 2; x++) {
    const k = (x - WALL_R) / (W - WALL_R), top = 30 - Math.round(k * 10), bot = FLOOR_Y + Math.round(k * 46);
    R(x, top, 1, bot - top, x < dx0 || x > dx1 ? "#F6EEDC" : mix("#2E7A4A", "#1E5A36", (x - dx0) / (dx1 - dx0)));
    if (x === dx0 + 4 || x === dx1 - 4) R(x, top + 6, 1, bot - top - 12, "#1A4A2C");
    if (x > dx0 + 4 && x < dx1 - 4) { R(x, top + 6, 1, 1, "#1A4A2C"); R(x, Math.round((top + bot) / 2) - 2, 1, 1, "#1A4A2C"); R(x, Math.round((top + bot) / 2) + 2, 1, 1, "#1A4A2C"); R(x, bot - 7, 1, 1, "#1A4A2C"); }
  }
  R(dx0 + 2, 82, 2, 4, "#E8B02E"); P(dx0 + 2, 82, "#FFE08A");
  // 문의 리스
  const wx = 182, wy = 52;
  for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2, x = Math.round(wx + Math.cos(t) * 7), y = Math.round(wy + Math.sin(t) * 7); R(x - 1, y - 1, 3, 3, a % 3 ? "#2F7A3E" : "#3E9A4A"); if (a % 6 === 0) P(x, y, "#D8343A"); }
  SPR(wx - 4, wy + 6, ["RR...RR", ".RRRRR.", "..RRR..", ".R...R.", "R.....R"], { R: "#D8343A" });
  // 바닥: 나무 마루 (원근으로 모이는 선)
  for (let y = FLOOR_Y; y < H; y++) R(0, y, W, 1, mix("#B87A44", "#CF9258", (y - FLOOR_Y) / (H - FLOOR_Y)));
  for (let i = -6; i <= 14; i++) { const x0 = 80 + i * 14, x1 = 80 + i * 26; for (let y = FLOOR_Y; y < H; y++) { const k = (y - FLOOR_Y) / (H - FLOOR_Y); P(Math.round(x0 + (x1 - x0) * k), y, "#A06A3A"); } }
  for (let y = FLOOR_Y + 9; y < H; y += Math.round(6 + (y - FLOOR_Y) / 5)) for (let x = (y * 7) % 23; x < W; x += 31) R(x, y, 9, 1, "#A86E3C");
  R(0, FLOOR_Y, W, 1, "#8A5A30");
  // 창문: 커튼, 틀, 밤하늘(움직이는 부분은 drawLive)
  const { x, y, w, h } = WIN;
  R(x - 5, y - 5, w + 10, h + 10, "#FFFFFF"); R(x - 4, y - 4, w + 8, h + 8, "#EDE6DA");
  R(x - 7, y + h + 4, w + 14, 3, "#F8F4EC"); R(x - 7, y + h + 7, w + 14, 1, "#CDBFA6");
  R(x - 12, y - 10, w + 24, 2, "#C9962E"); R(x - 13, y - 11, 3, 4, "#E8B02E"); R(x + w + 10, y - 11, 3, 4, "#E8B02E");
  [[x - 12, 0], [x + w + 3, 1]].forEach(([cx, side]) => {
    for (let yy = 0; yy < h + 16; yy++) {
      const pinch = yy > 22 && yy < 28, ww = pinch ? 5 : yy < 22 ? 9 : 9 + Math.min(2, (yy - 28) >> 3);
      const left = side ? cx + (9 - ww) : cx;
      for (let k = 0; k < ww; k++) P(left + k, y - 8 + yy, (k + (side ? 1 : 0)) % 3 === 1 ? "#A8281F" : "#C8342A");
    }
    R(cx + (side ? 3 : 1), y + 17, 6, 2, "#E8B02E");
  });
  // 벽난로 (창문 아래)
  const fx = 12, fy = 86, fw = 52;
  R(fx - 3, fy - 4, fw + 6, 4, "#FBF6EC"); R(fx - 3, fy - 1, fw + 6, 1, "#D8CCB4");
  R(fx, fy, fw, FLOOR_Y - fy, "#A8432F");
  for (let yy = fy; yy < FLOOR_Y; yy += 4) { R(fx, yy, fw, 1, "#7A2E20"); for (let xx = fx + ((yy / 4) % 2 ? 0 : 4); xx < fx + fw; xx += 8) R(xx, yy, 1, 4, "#7A2E20"); }
  R(fx + 12, fy + 6, fw - 24, FLOOR_Y - fy - 6, "#1A0E0A"); R(fx + 10, fy + 4, fw - 20, 2, "#5A2A1E");
  R(fx + 14, FLOOR_Y - 3, fw - 28, 2, "#4A2A1A"); R(fx + 16, FLOOR_Y - 4, fw - 32, 1, "#6A3A22");
  // 양말 셋
  [[fx + 4, "#D8343A"], [fx + 22, "#2F8A4A"], [fx + 40, "#D8343A"]].forEach(([sx, c]) => SPR(sx, fy, ["WWWW.", ".cc..", ".cc..", ".cc..", ".ccc.", ".cccc", "..cc."], { W: "#FFFFFF", c }));
  // 가랜드 + 종
  for (let xx = 4; xx < WALL_R - 4; xx++) { const t = (xx - 4) / (WALL_R - 8), yy = 14 + Math.round(Math.sin(t * Math.PI) * 6); R(xx, yy, 1, 4, xx % 3 ? "#2F7A3E" : "#3E9A4A"); if (xx % 4 === 0) P(xx, yy - 1, "#2F7A3E"); if (xx % 13 === 0) { R(xx - 1, yy + 3, 3, 2, ["#D8343A", "#E8B02E", "#4A7BD0"][xx % 3]); } }
  SPR(70, 18, [".YY..YY.", "YYYYYYYY", "YYYYYYYY", "YyYYYyYY", ".r....r."], { Y: "#E8B02E", y: "#FFE08A", r: "#C9962E" });
  // 러그 (선물이 놓이는 자리)
  const rx = 100, ry = 140, a = 78, b = 15;
  for (let yy = -b - 2; yy <= b + 2; yy++) {
    const ww = Math.round((a + 2) * Math.sqrt(Math.max(0, 1 - (yy * yy) / ((b + 2) * (b + 2)))));
    for (let xx = -ww; xx <= ww; xx += 2) if ((xx + yy) % 4 === 0) P(rx + xx, ry + yy, "#F2C46B");
  }
  for (let yy = -b; yy <= b; yy++) {
    const ww = Math.round(a * Math.sqrt(1 - (yy * yy) / (b * b)));
    R(rx - ww, ry + yy, ww * 2 + 1, 1, "#B8352B");
  }
  [[.86, "#8E2420"], [.8, "#B8352B"], [.55, "#C8453A"], [.5, null]].forEach(([s, c]) => {
    const aa = a * s, bb = b * s;
    for (let t = 0; t < 360; t += 1) { const r = t / 180 * Math.PI, xx = Math.round(rx + Math.cos(r) * aa), yy = Math.round(ry + Math.sin(r) * bb); if (c) P(xx, yy, c); else if (t % 6 < 3) P(xx, yy, "#E6B85A"); }
  });
  for (let t = 0; t < 360; t += 1) { const r = t / 180 * Math.PI; if (t % 8 < 4) P(Math.round(rx + Math.cos(r) * a * .93), Math.round(ry + Math.sin(r) * b * .93), "#E6B85A"); }
  // 트리 뒤 따뜻한 빛
  glow(TX, 66, 50, "#FFD890", .12);
  drawTree();
}

/* ── 움직이는 것: 창밖 밤과 눈, 벽난로 불, 트리 전구, 별 ── */
const FL = Array.from({ length: 26 }, () => ({ x: Math.random() * WIN.w, y: Math.random() * WIN.h, v: .2 + Math.random() * .35, s: Math.random() < .2 ? 2 : 1, p: Math.random() * 6 }));
function drawLive(g, t, still) {
  C = g;
  const { x, y, w, h } = WIN;
  for (let yy = 0; yy < h; yy++) R(x, y + yy, w, 1, mix("#0C1A3A", "#24407A", yy / h));
  [[4, 5], [12, 3], [26, 7], [8, 14], [20, 11], [29, 18]].forEach(([a, b], i) => P(x + a, y + b, i % 2 ? "#FFFFFF" : "#C8D8FF"));
  // 초승달
  SPR(x + 20, y + 4, [".YYY.", "YYY..", "YY...", "YYY..", ".YYY."], { Y: "#FFE9A8" });
  // 눈 덮인 집 두 채
  R(x, y + h - 6, w, 6, "#E8F0FA");
  SPR(x + 2, y + h - 16, ["....W....", "...WWW...", "..WWWWW..", ".WWWWWWW.", "WWWWWWWWW", ".NNNNNNN.", ".NYNNNYN.", ".NYNNNYN.", ".NNNNNNN.", ".NNNNNNN."], { W: "#F4F8FF", N: "#1E2E58", Y: "#FFC85A" });
  SPR(x + 18, y + h - 14, ["...W...", "..WWW..", ".WWWWW.", "WWWWWWW", ".NNNNN.", ".NYNYN.", ".NNNNN.", ".NNNNN."], { W: "#F4F8FF", N: "#22325E", Y: "#FFC85A" });
  FL.forEach(f => {
    const xx = Math.round(f.x + Math.sin(f.y / 8 + f.p) * 1.2), yy = Math.round(f.y);
    if (xx >= 0 && xx < w && yy >= 0 && yy < h - 4) R(x + xx, y + yy, f.s, f.s, "#FFFFFF");
    if (!still) { f.y += f.v; if (f.y > h - 4) { f.y = -2; f.x = Math.random() * w; } }
  });
  R(x + w / 2 - 1, y, 2, h, "#FFFFFF"); R(x, y + h / 2 - 1, w, 2, "#FFFFFF");
  // 벽난로 불
  const fx = 12 + 26, fy = FLOOR_Y - 3, k = still ? 0 : Math.floor(t / 150) % 3;
  const flames = [["...O...", "..OOO..", ".OOYOO.", ".OYYYO.", "OOYYYOO"], ["..O....", "..OO.O.", ".OOYOO.", ".OYYYO.", "OOYYYOO"], ["....O..", ".O.OO..", ".OOYOO.", ".OYYYO.", "OOYYYOO"]];
  C.fillStyle = "rgba(255,150,60,.25)"; C.fillRect(fx - 9, fy - 9, 18, 10);
  SPR(fx - 4, fy - 5, flames[k], { O: "#F07A2A", Y: "#FFD24A" }); SPR(fx - 10, fy - 4, flames[(k + 1) % 3].map(r => r.slice(1, 6)), { O: "#E0602A", Y: "#FFB83A" });
  // 트리 전구 반짝
  TREE.lights.forEach(l => { if (still || Math.sin(t / 380 + l.p) > -.35) P(l.x, l.y, l.c); });
  // 꼭대기 별
  const sx = TX - 4, sy = TTOP - 9;
  glow(TX, sy + 4, 9, "#FFE08A", still ? .45 : .3 + .2 * Math.sin(t / 500));
  SPR(sx, sy, ["....O....", "...OYO...", "OOOOYOOOO", ".OYYWYYO.", "..OYYYO..", "..OYOYO..", ".OO...OO."], { O: "#E07A1A", Y: "#FFD24A", W: "#FFFFFF" });
}

/* ── 그리기 ── */
function mount() {
  if (!host) return;
  host.innerHTML = '<canvas class="pxroom" width="200" height="160" aria-hidden="true"></canvas>';
  const cv = host.querySelector("canvas"), ctx = cv.getContext("2d");
  const base = document.createElement("canvas"); base.width = W; base.height = H;
  drawStatic(base.getContext("2d"));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let last = 0;
  const tick = t => {
    if (t - last > 110 || reduce) { last = t; ctx.drawImage(base, 0, 0); drawLive(ctx, t, reduce); }
    if (!reduce) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
mount();
window.drawSantaRoom = g => { drawStatic(g); drawLive(g, 0, true); };

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
