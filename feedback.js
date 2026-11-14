/* 무드나잇 의견함 — "이런 기능 있었으면 좋겠어요"
 * 페이지 왼쪽 아래에 작은 버튼을 띄우고, 누르면 익명 의견 창이 열려요.
 * 저장되는 것: 쓴 내용(2~300자), 어느 서비스에서 보냈는지, 기기 구분 값(하루 5개 제한용). 이름·연락처·계정은 안 받아요.
 * 사용: <script src="/feedback.js" data-page="santa"></script>
 *   data-page: home|santa|mansion|sansa|smash|tray|camp|blog|other (없으면 주소로 추정)
 *   data-inline="#id" 를 주면 떠 있는 버튼 대신 그 요소 안에 버튼을 넣어요.
 * 색은 페이지에서 --mnfb-bg, --mnfb-fg, --mnfb-soft, --mnfb-line, --mnfb-accent, --mnfb-accent-text 로 바꿀 수 있어요. */
(function () {
  "use strict";
  if (window.mnFeedback) return;
  const API = "https://gbmlkyfguktjtroczqfw.supabase.co/rest/v1/rpc/feedback_add";
  const KEY = "sb_publishable_RO92ntdlSM5_Urctc5FD9w_4OHcZQzf";
  const me = document.currentScript;
  const T = (ko, en) => (typeof window.L === "function" ? window.L(ko, en) : ko);
  const PAGES = ["home", "santa", "mansion", "sansa", "smash", "tray", "camp", "blog", "other"];
  function guessPage() {
    const p = location.pathname;
    if (p === "/" || p === "/index.html") return "home";
    const k = p.split("/")[1] || "";
    return PAGES.includes(k) ? k : "other";
  }
  let page = (me && me.dataset.page) || guessPage();
  if (!PAGES.includes(page)) page = "other";
  function device() {
    try {
      let d = localStorage.getItem("mn_device");
      if (!d || !/^[a-z0-9]{16,40}$/.test(d)) {
        d = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join("") + Date.now().toString(36);
        localStorage.setItem("mn_device", d);
      }
      return d;
    } catch (e) { return null; }
  }

  const css = `
.mnfb-btn{--b:var(--mnfb-bg,#fff);--f:var(--mnfb-fg,#3A2A22);--l:var(--mnfb-line,#E2D6C2);
  display:inline-flex;align-items:center;gap:6px;border:1px solid var(--l);border-radius:999px;background:var(--b);color:var(--f);
  font:inherit;font-size:.85rem;font-weight:600;line-height:1.2;padding:9px 14px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.18)}
.mnfb-btn:focus-visible{outline:3px solid var(--mnfb-accent,#C23A2E);outline-offset:2px}
.mnfb-btn.float{position:fixed;z-index:9990;left:max(12px,env(safe-area-inset-left,0px));bottom:max(12px,env(safe-area-inset-bottom,0px))}
.mnfb-pop{--b:var(--mnfb-bg,#fff);--f:var(--mnfb-fg,#3A2A22);--s:var(--mnfb-soft,#5E4A3C);--l:var(--mnfb-line,#E2D6C2);--a:var(--mnfb-accent,#C23A2E);--ab:var(--mnfb-accent-text,#fff);
  position:fixed;inset:0;z-index:9999;display:grid;place-items:end center;background:rgba(0,0,0,.5);
  padding:16px max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
@media (min-width:600px){.mnfb-pop{place-items:center}}
.mnfb-card{width:min(420px,100%);max-height:calc(100dvh - 32px);overflow:auto;box-sizing:border-box;background:var(--b);color:var(--f);border:1px solid var(--l);
  border-radius:20px;padding:20px;display:grid;gap:12px;box-shadow:0 12px 40px rgba(0,0,0,.35);text-align:left}
.mnfb-card h2{margin:0;font-size:1.15rem;line-height:1.4}
.mnfb-card p{margin:0;font-size:.88rem;line-height:1.55;color:var(--s)}
.mnfb-card textarea{box-sizing:border-box;width:100%;min-height:120px;resize:vertical;border:1px solid var(--l);border-radius:12px;padding:12px;
  font:inherit;font-size:16px;line-height:1.5;background:transparent;color:var(--f)}
.mnfb-card textarea:focus{outline:2px solid var(--a);outline-offset:1px}
.mnfb-row{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.8rem;color:var(--s)}
.mnfb-acts{display:flex;gap:8px}
.mnfb-acts button{flex:1;border-radius:12px;padding:12px;font:inherit;font-weight:700;font-size:1rem;cursor:pointer}
.mnfb-send{border:0;background:var(--a);color:var(--ab)}
.mnfb-send:disabled{opacity:.5;cursor:default}
.mnfb-cancel{border:1px solid var(--l);background:none;color:var(--f)}
.mnfb-msg{min-height:1.4em;font-size:.88rem;color:var(--a)}
.mnfb-done{text-align:center;display:grid;gap:12px;padding:8px 0}
.mnfb-done b{font-size:2rem;font-weight:400}`;
  function style() { if (document.getElementById("mnfb-css")) return; const s = document.createElement("style"); s.id = "mnfb-css"; s.textContent = css; document.head.appendChild(s); }

  function open() {
    if (document.querySelector(".mnfb-pop")) return;
    style();
    const prev = document.activeElement;
    const wrap = document.createElement("div"); wrap.className = "mnfb-pop";
    const card = document.createElement("div"); card.className = "mnfb-card";
    card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "mnfbT");
    const h = document.createElement("h2"); h.id = "mnfbT"; h.textContent = T("💌 이런 기능 있었으면 좋겠어요", "💌 I wish there was…");
    const p = document.createElement("p");
    p.textContent = T("바라는 기능, 불편했던 점, 아무 말이나 좋아요. 이름 없이 익명으로 무드나잇에게만 전달돼요.",
                      "Feature ideas, anything that bugged you, or just a hello. It goes anonymously to the moodnight team only.");
    const ta = document.createElement("textarea"); ta.maxLength = 300; ta.setAttribute("aria-label", T("의견 내용", "Your feedback"));
    ta.placeholder = T("예) 맨션에 친구 방 꾸미기도 있으면 좋겠어요!", "e.g. I'd love to decorate rooms in the mansion!");
    const row = document.createElement("div"); row.className = "mnfb-row";
    const hint = document.createElement("span"); hint.textContent = T("답장이 필요하면 무드나잇 인스타그램 DM으로 와 주세요", "Need a reply? DM us on Instagram");
    const cnt = document.createElement("span"); cnt.textContent = "0/300";
    row.append(hint, cnt);
    const msg = document.createElement("div"); msg.className = "mnfb-msg"; msg.setAttribute("role", "status"); msg.setAttribute("aria-live", "polite");
    const acts = document.createElement("div"); acts.className = "mnfb-acts";
    const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "mnfb-cancel"; cancel.textContent = T("닫기", "Close");
    const send = document.createElement("button"); send.type = "button"; send.className = "mnfb-send"; send.textContent = T("보내기", "Send"); send.disabled = true;
    acts.append(cancel, send);
    card.append(h, p, ta, row, msg, acts); wrap.appendChild(card); document.body.appendChild(wrap);

    ta.addEventListener("input", () => { const n = ta.value.trim().length; cnt.textContent = ta.value.length + "/300"; send.disabled = n < 2; msg.textContent = ""; });
    function close() { document.removeEventListener("keydown", onKey, true); wrap.remove(); try { prev && prev.focus && prev.focus(); } catch (e) {} }
    function onKey(e) {
      if (e.key === "Escape") { e.stopPropagation(); close(); return; }
      if (e.key === "Tab") {
        const f = Array.from(card.querySelectorAll("button,textarea")).filter(x => !x.disabled && x.offsetParent !== null);
        if (!f.length) return; const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    }
    document.addEventListener("keydown", onKey, true);
    cancel.onclick = close;
    wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    send.onclick = async () => {
      const body = ta.value.trim(); if (body.length < 2) return;
      send.disabled = true; ta.disabled = true; msg.textContent = T("보내는 중이에요…", "Sending…");
      try {
        const r = await fetch(API, { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ p_page: page, p_body: body, p_device: device() }) });
        if (!r.ok) {
          let m = ""; try { m = (await r.json()).message || ""; } catch (e) {}
          throw new Error(m);
        }
        card.textContent = "";
        const done = document.createElement("div"); done.className = "mnfb-done";
        const b = document.createElement("b"); b.setAttribute("aria-hidden", "true"); b.textContent = "💌";
        const t = document.createElement("h2"); t.id = "mnfbT"; t.textContent = T("고마워요! 잘 받았어요", "Thank you! Got it");
        const q = document.createElement("p"); q.textContent = T("하나하나 읽어 보고 다음 업데이트에 참고할게요.", "We read every one and use them for the next update.");
        const ok = document.createElement("button"); ok.type = "button"; ok.className = "mnfb-send"; ok.textContent = T("닫기", "Close"); ok.style.padding = "12px"; ok.style.borderRadius = "12px"; ok.style.fontWeight = "700"; ok.style.font = "inherit";
        ok.onclick = close;
        done.append(b, t, q, ok); card.appendChild(done); ok.focus();
        try { window.mnTrack && window.mnTrack("act", "feedback"); } catch (e) {}
      } catch (e) {
        const m = String(e && e.message || "");
        msg.textContent = m.startsWith("limit:") ? m.slice(6).trim()
          : m.startsWith("body:") ? m.slice(5).trim()
          : m.startsWith("rate_limit:") ? m.slice(11).trim()
          : T("보내지 못했어요. 잠시 뒤에 다시 해 주세요.", "Couldn't send. Please try again shortly.");
        send.disabled = false; ta.disabled = false;
      }
    };
    ta.focus();
  }

  function mount() {
    style();
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "mnfb-btn";
    btn.textContent = T("💌 의견 보내기", "💌 Feedback");
    btn.setAttribute("aria-haspopup", "dialog");
    btn.onclick = open;
    const sel = me && me.dataset.inline;
    const host = sel ? document.querySelector(sel) : null;
    if (host) host.appendChild(btn); else { btn.classList.add("float"); document.body.appendChild(btn); }
  }
  window.mnFeedback = { open, setPage: p => { if (PAGES.includes(p)) page = p; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
