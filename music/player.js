/* 무드나잇 캐롤 버튼: 곡 랜덤 재생 (기본은 꺼짐, 눌러야 재생)
 * 음원: Pixabay (Pixabay Content License, 상업적 이용 가능, 출처 표시 불필요)
 *  - snowy-window-lofi: Turning_Pages (455028) / christmas-lofi-chill-beat: Aventure (439850)
 *  - christmas-jazz-holiday: Tunetank (347485) / last-table-by-the-window: OpenMindAudio (628307)
 * 사용: <script src="/music/player.js" defer></script> */
(function () {
  const TRACKS = ["snowy-window-lofi", "christmas-lofi-chill-beat", "christmas-jazz-holiday", "last-table-by-the-window"]
    .map(n => `/music/${n}.mp3`);
  let order = [], idx = 0, on = false;
  const shuffle = () => { const last = order[order.length - 1]; order = TRACKS.slice().sort(() => Math.random() - 0.5); if (order.length > 1 && order[0] === last) order.push(order.shift()); idx = 0; };
  const audio = new Audio(); audio.preload = "none"; audio.volume = 0.6; audio.setAttribute("playsinline", "");

  const css = document.createElement("style");
  css.textContent = `.mn-music{position:fixed;right:calc(14px + env(safe-area-inset-right,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:40;display:flex;align-items:center;gap:6px;border:0;border-radius:999px;padding:9px 14px;background:rgba(40,25,15,.72);color:#FFF6E6;font:600 14px/1 system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.18);cursor:pointer;-webkit-tap-highlight-color:transparent}
.mn-music b{font-size:16px}.mn-music.on{background:rgba(194,58,46,.9)}
.mn-music.on b{animation:mnBop 1s ease-in-out infinite}@keyframes mnBop{50%{transform:translateY(-2px) rotate(-8deg)}}
.mn-music.px{border-radius:0;font-family:"Galmuri11","Galmuri14",monospace;font-weight:400;background:#1B2238;color:#F2C46B;border:3px solid #0B0F1C;box-shadow:3px 3px 0 #0B0F1C}
.mn-music.px.on{background:#B8432F;color:#FFF3D6}`;
  document.head.appendChild(css);

  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "mn-music" + (/^\/(mansion|santa)/.test(location.pathname) ? " px" : "");
  const paint = () => { btn.classList.toggle("on", on); btn.innerHTML = on ? "<b>♪</b>캐롤 끄기" : "<b>♪</b>캐롤 켜기"; btn.setAttribute("aria-pressed", on); };
  const play = () => { if (idx >= order.length) shuffle(); audio.src = order[idx]; audio.play().catch(() => { on = false; paint(); }); };
  audio.addEventListener("ended", () => { idx++; if (on) play(); });
  let fails = 0;
  audio.addEventListener("playing", () => { fails = 0; });
  audio.addEventListener("error", () => { if (!on) return; if (++fails >= TRACKS.length) { on = false; paint(); return; } idx++; play(); });
  btn.onclick = () => {
    on = !on; paint();
    if (on) { if (!order.length) shuffle(); if (audio.src && !audio.ended) audio.play().catch(() => { on = false; paint(); }); else play(); }
    else audio.pause();
  };
  paint();
  const mount = () => document.body.appendChild(btn);
  document.body ? mount() : document.addEventListener("DOMContentLoaded", mount);
})();
