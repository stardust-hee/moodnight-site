/* 무드나잇 언어 (한국어 / English) — 선물가게, 성탄맨션 공통
 * 고르는 순서: 주소의 ?lang=en|ko → 지난번에 고른 언어(localStorage mn_lang) → 브라우저 언어(한국어면 ko, 아니면 en)
 * 페이지 코드에서는 L("한국어", "English")처럼 두 문장을 나란히 써요.
 * HTML 글자는 data-en="영어"를 붙이면 영어일 때 바뀌고, <html data-en-title="...">은 탭 제목이 돼요.
 * body 끝(화면 요소 뒤)에서 불러야 바로 바뀌어요. */
(function () {
  let lang = null;
  try { const q = new URLSearchParams(location.search).get("lang"); if (q === "en" || q === "ko") { lang = q; localStorage.setItem("mn_lang", q); } } catch (e) {}
  if (!lang) try { const s = localStorage.getItem("mn_lang"); if (s === "en" || s === "ko") lang = s; } catch (e) {}
  if (!lang) lang = /^ko\b/i.test(navigator.language || "") ? "ko" : "en";
  window.LANG = lang;
  window.L = (ko, en) => (lang === "en" ? en : ko);
  window.setLang = l => {
    try { localStorage.setItem("mn_lang", l); } catch (e) {}
    const u = new URL(location.href); u.searchParams.delete("lang"); location.replace(u.pathname + u.search + u.hash);
  };
  document.documentElement.lang = lang;
  const mount = () => {
    const nav = document.querySelector(".site-nav"); if (!nav || nav.querySelector(".lang-btn")) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "lang-btn";
    b.textContent = lang === "en" ? "🌐 한국어" : "🌐 English"; b.setAttribute("aria-label", lang === "en" ? "한국어로 보기" : "View in English");
    b.onclick = () => setLang(lang === "en" ? "ko" : "en");
    nav.appendChild(b);
    if (lang === "en") {
      document.querySelectorAll("[data-en]").forEach(el => { el.textContent = el.dataset.en; });
      document.querySelectorAll("[data-en-label]").forEach(el => el.setAttribute("aria-label", el.dataset.enLabel));
      const t = document.documentElement.dataset.enTitle; if (t) document.title = t;
    }
  };
  document.querySelector(".site-nav") ? mount() : document.addEventListener("DOMContentLoaded", mount);
})();
