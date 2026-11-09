/* 산타의 선물가게 — 3D 로우폴리 방 (미리 렌더한 배경 + 움직이는 조각들)
 * 배경: /santa/3d/room-*.webp (Three.js로 만든 장면을 한 장으로 구운 것, 선물 없음)
 * 움직임: 벽난로 불(프레임 3장 번갈아), 전구·랜턴·별 반짝임, 창밖 눈. 모두 CSS 애니메이션이라 휴대폰에서도 가벼워요.
 * 선물 상자: /santa/3d/gift-{색}.webp 를 .w-{색} .spr 배경으로 넣어요. 자리 잡기는 app.js(SLOTS)가 해요.
 * 좌표는 모두 배경 이미지 기준 %예요 (scene.html이 내보낸 값). */
(function () {
const host = document.getElementById("sceneHost");
const V = "?v=1";
const FIRE = { l: 32.8, t: 57.75, w: 14.55, h: 12.15 };
const WIN = { l: 11.08, t: 23.86, w: 17.93, h: 20.01 };
// [x%, y%, 반지름(배경 너비 대비 %), 종류] 0 전구 1 랜턴 2 별
const BULBS = [[29.75,47.1,4.2,1],[50.18,47.03,4.2,1],[74.53,35.14,4.2,1],
  [8.37,11.91,3.2],[13.08,13.83,3.2],[17.69,14.52,3.2],[22.22,13.82,3.2],[26.72,11.9,3.2],
  [55.29,12.31,3.2],[62.77,14.53,3.2],[70.23,15.33,3.2],[77.73,14.51,3.2],[85.32,12.28,3.2],[57.11,14.85,9,2],
  [61.75,73.51,2.4],[57.56,75.53,2.4],[53.89,73.83,2.4],[50.96,71.84,2.4],[48.86,69.71,2.4],
  [63.24,59.46,2.4],[58.96,57.79,2.4],[54.68,57.62,2.4],[52.43,56.05,2.4],[50.8,54.38,2.4],
  [61.36,44.17,2.4],[59.82,43.34,2.4],[58.39,42.39,2.4],[55.46,39.15,2.4],[53.35,38.65,2.4],[52.63,36.15,2.4]];

const css = `
.r3d{position:absolute;inset:0;overflow:hidden;background:#5a1e16}
.r3d img.bg{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;user-select:none;-webkit-user-drag:none}
.r3d .fire{position:absolute;left:${FIRE.l}%;top:${FIRE.t}%;width:${FIRE.w}%;height:${FIRE.h}%}
.r3d .fire img{position:absolute;inset:0;width:100%;height:100%;opacity:0}
.r3d .fire img:nth-child(1){opacity:1}
.r3d .fire img:nth-child(2){animation:r3f 1.2s steps(1) infinite}
.r3d .fire img:nth-child(3){animation:r3f 1.2s steps(1) .4s infinite}
@keyframes r3f{0%{opacity:1}33.3%,100%{opacity:0}}
.r3d .hearth{position:absolute;left:${FIRE.l - 8}%;top:${FIRE.t - 6}%;width:${FIRE.w + 16}%;height:${FIRE.h + 22}%;
  background:radial-gradient(closest-side,rgba(255,150,60,.42),rgba(255,120,40,.12) 60%,transparent);mix-blend-mode:screen;animation:r3g 2.3s ease-in-out infinite alternate}
@keyframes r3g{0%{opacity:.55}30%{opacity:.9}55%{opacity:.65}80%{opacity:1}100%{opacity:.7}}
.r3d .glow{position:absolute;border-radius:50%;translate:-50% -50%;aspect-ratio:1;mix-blend-mode:screen;
  background:radial-gradient(closest-side,rgba(255,228,150,.85),rgba(255,190,90,.28) 45%,transparent);
  animation:r3t var(--d,2s) ease-in-out var(--l,0s) infinite alternate}
.r3d .glow.lan{background:radial-gradient(closest-side,rgba(255,200,110,.6),rgba(255,160,70,.2) 50%,transparent);animation-name:r3g}
.r3d .glow.star{background:radial-gradient(closest-side,rgba(255,240,180,.75),rgba(255,210,120,.25) 50%,transparent);animation-duration:3.2s}
@keyframes r3t{from{opacity:.15}to{opacity:1}}
.r3d .win{position:absolute;left:${WIN.l}%;top:${WIN.t}%;width:${WIN.w}%;height:${WIN.h}%;overflow:hidden;pointer-events:none}
.r3d .win i{position:absolute;top:-6%;width:3.2%;aspect-ratio:1;border-radius:50%;background:#fff;opacity:.9;animation:r3s linear infinite}
@keyframes r3s{to{transform:translate(12px,var(--fall,160px))}}
@media (prefers-reduced-motion: reduce){.r3d *{animation:none!important}.r3d .win{display:none}}
.w-red .spr{background-image:url(/santa/3d/gift-red.webp${V})}
.w-green .spr{background-image:url(/santa/3d/gift-green.webp${V})}
.w-navy .spr{background-image:url(/santa/3d/gift-navy.webp${V})}
.w-gold .spr{background-image:url(/santa/3d/gift-gold.webp${V})}
.w-snow .spr{background-image:url(/santa/3d/gift-snow.webp${V})}`;
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

function mount() {
  if (!host) return;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const glows = BULBS.map(([x, y, r, k]) => {
    const cls = k === 1 ? "glow lan" : k === 2 ? "glow star" : "glow";
    const size = r * (k === 2 ? 2.4 : k === 1 ? 2.2 : 1.9);
    return `<span class="${cls}" style="left:${x}%;top:${y}%;width:${size}%;--d:${rnd(1.2, 2.6).toFixed(2)}s;--l:-${rnd(0, 2.5).toFixed(2)}s"></span>`;
  }).join("");
  const flakes = Array.from({ length: 14 }, () =>
    `<i style="left:${rnd(0, 100).toFixed(1)}%;animation-duration:${rnd(4, 9).toFixed(1)}s;animation-delay:-${rnd(0, 9).toFixed(1)}s;scale:${rnd(.5, 1.1).toFixed(2)}"></i>`).join("");
  host.innerHTML = `<div class="r3d" aria-hidden="true">
    <img class="bg" src="/santa/3d/room-1600.webp${V}" srcset="/santa/3d/room-1000.webp${V} 1000w, /santa/3d/room-1600.webp${V} 1600w"
      sizes="(max-width:600px) 130vw, 720px" alt="" decoding="async" fetchpriority="high">
    <div class="win">${flakes}</div>
    <div class="hearth"></div>
    <div class="fire"><img src="/santa/3d/fire0.webp${V}" alt=""><img src="/santa/3d/fire1.webp${V}" alt=""><img src="/santa/3d/fire2.webp${V}" alt=""></div>
    ${glows}
  </div>`;
  const win = host.querySelector(".win");
  const setFall = () => win.style.setProperty("--fall", (win.clientHeight * 1.12 || 160) + "px");
  setFall(); addEventListener("resize", setFall);
}
mount();
})();
