/* 수능 응원 한마디 — 서비스 화면 위쪽에 잠깐 떴다가 사라지는 작은 알림
 * 2026-11-21 00:00(한국시간)이 지나면 코드가 남아 있어도 아무것도 하지 않아요.
 * 같은 기기·같은 페이지에서는 한 번만 보여요. 게임 화면을 막지 않게 8초 뒤 저절로 닫혀요. */
(function () {
  "use strict";
  var UNTIL = new Date("2026-11-21T00:00:00+09:00").getTime();
  if (Date.now() >= UNTIL) return;
  if (window.LANG === "en" || /[?&]lang=en/.test(location.search)) return;
  var KEY = "mn_suneung_2026:" + location.pathname.split("/")[1];
  try { if (localStorage.getItem(KEY)) return; } catch (e) {}

  function show() {
    var st = document.createElement("style");
    st.textContent =
      ".mn-sn{position:fixed;z-index:9998;left:50%;top:max(12px,env(safe-area-inset-top,0px));transform:translate(-50%,-140%);" +
      "width:min(440px,calc(100vw - 24px));box-sizing:border-box;display:flex;gap:10px;align-items:flex-start;" +
      "padding:12px 12px 12px 16px;border-radius:16px;background:#1B2140;color:#F6EEDD;border:1px solid #2E3660;" +
      "box-shadow:0 10px 30px rgba(0,0,0,.35);font:500 14px/1.55 'Pretendard Variable',Pretendard,-apple-system,'Apple SD Gothic Neo',sans-serif;" +
      "transition:transform .45s cubic-bezier(.2,.9,.3,1.2)}" +
      ".mn-sn.on{transform:translate(-50%,0)}" +
      ".mn-sn b{color:#F2C46B;display:block;font-size:15px;margin-bottom:2px}" +
      ".mn-sn p{margin:0;flex:1;min-width:0}" +
      ".mn-sn button{flex:none;width:32px;height:32px;border:0;border-radius:10px;background:transparent;color:#B9B3A6;font-size:18px;cursor:pointer}" +
      ".mn-sn button:focus-visible{outline:2px solid #F2C46B}" +
      "@media (prefers-reduced-motion:reduce){.mn-sn{transition:none}}";
    document.head.appendChild(st);
    var box = document.createElement("div");
    box.className = "mn-sn"; box.setAttribute("role", "status");
    var p = document.createElement("p");
    var b = document.createElement("b"); b.textContent = "수능 끝! 🎉";
    p.appendChild(b);
    p.appendChild(document.createTextNode("수험생 여러분, 정말 고생 많았어요. 오늘은 마음껏 놀고 푹 쉬어요 🌙"));
    var x = document.createElement("button"); x.type = "button"; x.setAttribute("aria-label", "닫기"); x.textContent = "×";
    box.append(p, x);
    document.body.appendChild(box);
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    var closed = false;
    function close() { if (closed) return; closed = true; box.classList.remove("on"); setTimeout(function () { box.remove(); }, 500); }
    x.onclick = close;
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add("on"); }); });
    setTimeout(close, 8000);
  }
  if (document.readyState === "complete") setTimeout(show, 900);
  else window.addEventListener("load", function () { setTimeout(show, 900); });
})();
