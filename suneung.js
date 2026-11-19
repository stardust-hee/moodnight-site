/* 수능 응원 한 줄 공지 — 서비스 화면 맨 위 띠
 * 2026-11-21 00:00(한국시간)이 지나면 코드가 남아 있어도 아무것도 하지 않아요.
 * × 로 닫으면 그 기기에서는 다시 안 보여요(서비스마다 따로).
 * 기본은 페이지 맨 위에 한 줄로 끼워 넣고, data-mode="float"인 화면(캠프·산사처럼 화면을 꽉 채우는 놀이)은 위에 얹어요. */
(function () {
  "use strict";
  var UNTIL = new Date("2026-11-21T00:00:00+09:00").getTime();
  if (Date.now() >= UNTIL) return;
  if (window.LANG === "en" || /[?&]lang=en/.test(location.search)) return;
  var me = document.currentScript;
  var float = me && me.dataset.mode === "float";
  var KEY = "mn_suneung_bar_2026:" + location.pathname.split("/")[1];
  try { if (localStorage.getItem(KEY)) return; } catch (e) {}

  function show() {
    var st = document.createElement("style");
    st.textContent =
      ".mn-snbar{box-sizing:border-box;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;" +
      "padding:7px 44px 7px 14px;background:#1B2140;color:#F6EEDD;border-bottom:1px solid #2E3660;position:relative;" +
      "font:500 13px/1.45 'Pretendard Variable',Pretendard,-apple-system,'Apple SD Gothic Neo',sans-serif;text-align:center}" +
      ".mn-snbar b{color:#F2C46B;font-weight:700;white-space:nowrap}" +
      ".mn-snbar span{min-width:0}" +
      ".mn-snbar button{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:#B9B3A6;font-size:17px;cursor:pointer}" +
      ".mn-snbar button:focus-visible{outline:2px solid #F2C46B}" +
      ".mn-snbar.float{position:fixed;left:0;right:0;top:0;z-index:9998;padding-top:max(7px,env(safe-area-inset-top,0px));background:rgba(27,33,64,.94)}";
    document.head.appendChild(st);
    var bar = document.createElement("div");
    bar.className = "mn-snbar" + (float ? " float" : ""); bar.setAttribute("role", "note");
    var b = document.createElement("b"); b.textContent = "🎉 수능 끝!";
    var t = document.createElement("span"); t.textContent = "수험생 여러분, 정말 고생 많았어요 🌙";
    var x = document.createElement("button"); x.type = "button"; x.setAttribute("aria-label", "공지 닫기"); x.textContent = "×";
    bar.append(b, t, x);
    x.onclick = function () { try { localStorage.setItem(KEY, "1"); } catch (e) {} bar.remove(); };
    if (float) document.body.appendChild(bar); else document.body.insertBefore(bar, document.body.firstChild);
  }
  if (document.body) show(); else document.addEventListener("DOMContentLoaded", show);
})();
