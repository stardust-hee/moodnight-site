/* 무드나잇 "내가 놀러 간 친구 집" 기록 — 선물가게·성탄맨션·홈 공통
 * 방문한 사람이 친구 링크(/santa/r/…, /mansion/r/…)로 들어가 본 집을 자기 기기(localStorage)에만 저장해요.
 * 서버로 보내지 않고, 집주인에게도 알려지지 않아요. 내 집에 누가 다녀갔는지는 어디에도 저장·표시되지 않아요(선물가게는 익명 추리라서요).
 *
 * mnFriends.visit(kind, slug, name)   놀러 간 집 기록 (kind: "santa" | "mansion")
 * mnFriends.list()                    최근 순서 목록
 * mnFriends.attach(el)                el 맨 끝에 "내가 놀러 간 친구 집" 카드를 붙여요 (목록이 비면 아무것도 안 붙임)
 * mnFriends.render(el, sample)        el 안을 카드로 채워요 (목록이 비면 el.hidden = true). sample을 주면 미리보기용 가짜 목록
 * mnFriends.announce(force)           새 기능 안내 팝업 (기기당 한 번, ANN_UNTIL 전까지만). force=true면 미리보기용으로 항상 보여줘요
 * 글자는 모두 textContent로 넣어서, 집 이름에 이상한 글자가 있어도 안전해요. */
(function () {
  "use strict";
  const KEY = "mn_friends_v1", MAX = 20, ANN_KEY = "mn_ann_friends_v1";
  /* 안내 팝업은 이 시각까지만 보여요 (한국시간 11월 17일 0시 = 14·15·16일 3일간). 이후엔 코드가 남아 있어도 뜨지 않아요 */
  const ANN_UNTIL = new Date("2026-11-17T00:00:00+09:00").getTime();
  const T = (ko, en) => (typeof window.L === "function" ? window.L(ko, en) : ko);
  const isEn = () => window.LANG === "en";

  const KINDS = {
    santa:   { icon: "🎁", path: "/santa/r/",   label: n => T(n + "의 선물가게", n + "'s Gift Shop") },
    mansion: { icon: "🏢", path: "/mansion/r/", label: n => T(n + "의 성탄맨션", n + "'s Christmas Mansion") },
  };

  function load() {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(a)) return [];
      return a.filter(x => x && KINDS[x.k] && typeof x.s === "string" && /^[a-z0-9]{4,24}$/i.test(x.s) && typeof x.n === "string" && x.n);
    } catch (e) { return []; }
  }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, MAX))); } catch (e) {} }

  function visit(kind, slug, name) {
    if (!KINDS[kind] || !/^[a-z0-9]{4,24}$/i.test(String(slug || "")) || !name || slug === "demo") return;
    const rest = load().filter(x => !(x.k === kind && x.s === slug));
    rest.unshift({ k: kind, s: slug, n: String(name).slice(0, 12), t: Date.now() });
    save(rest);
  }
  function remove(kind, slug) { save(load().filter(x => !(x.k === kind && x.s === slug))); }

  /* ---------- 스타일: 페이지가 --mnf-* 변수로 색을 정해요 ---------- */
  let styled = false;
  function style() {
    if (styled) return; styled = true;
    const s = document.createElement("style");
    s.textContent = `
.mnf{--b:var(--mnf-bg,#fff);--f:var(--mnf-fg,#3A2A22);--s:var(--mnf-soft,#5E4A3C);--l:var(--mnf-line,#E2D6C2);--a:var(--mnf-accent,#C23A2E);
  border:1px solid var(--l);border-radius:16px;background:var(--b);color:var(--f);padding:14px;display:grid;gap:10px;text-align:left;box-sizing:border-box;min-width:0;max-width:100%;width:100%}
.mnf h3{margin:0;font-size:1rem;font-weight:700;line-height:1.4;color:var(--f)}
.mnf p.mnf-sub{margin:0;font-size:.85rem;line-height:1.5;color:var(--s);overflow-wrap:anywhere;min-width:0}
.mnf ul{list-style:none;margin:0;padding:0;display:grid;gap:8px;min-width:0}
.mnf li{display:flex;align-items:stretch;gap:6px;min-width:0;margin:0;padding:0}
.mnf li a{flex:1;min-width:0;display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--l);border-radius:12px;color:var(--f);text-decoration:none;font-size:.95rem;line-height:1.4}
.mnf li a:hover,.mnf li a:focus-visible{border-color:var(--a)}
.mnf li a span.mnf-n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mnf li a span.mnf-i{flex:none;font-size:1.2rem}
.mnf li a span.mnf-go{flex:none;color:var(--a);font-size:1.5rem;line-height:1;padding-left:2px}
.mnf li button{flex:none;width:40px;border:1px solid var(--l);border-radius:12px;background:none;color:var(--s);font-size:1.1rem;cursor:pointer}
.mnf li button:hover,.mnf li button:focus-visible{color:var(--a);border-color:var(--a)}
.mnf .mnf-more{border:0;background:none;color:var(--s);font:inherit;font-size:.85rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer;justify-self:start;padding:0}
.mnf-pop{--b:var(--mnf-bg,#fff);--f:var(--mnf-fg,#3A2A22);--s:var(--mnf-soft,#5E4A3C);--l:var(--mnf-line,#E2D6C2);--a:var(--mnf-accent,#C23A2E);--ab:var(--mnf-accent-text,#fff);
  position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));background:rgba(0,0,0,.55)}
.mnf-pop .mnf-card{width:min(380px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:var(--b);color:var(--f);border:1px solid var(--l);border-radius:20px;padding:22px 20px 18px;display:grid;gap:12px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.35)}
.mnf-pop .mnf-tag{justify-self:center;font-size:.78rem;font-weight:700;color:var(--a);border:1px solid var(--a);border-radius:999px;padding:2px 10px}
.mnf-pop h2{margin:0;font-size:1.2rem;line-height:1.45;color:var(--f)}
.mnf-pop .mnf-rows{display:grid;gap:8px;text-align:left}
.mnf-pop .mnf-rows p{margin:0;display:flex;gap:10px;align-items:center;padding:10px 12px;border:1px solid var(--l);border-radius:12px;font-size:.95rem;line-height:1.45}
.mnf-pop .mnf-rows p b{flex:none;font-size:1.3rem;font-weight:400}
.mnf-pop .mnf-note{margin:0;font-size:.82rem;line-height:1.5;color:var(--s)}
.mnf-pop .mnf-ok{border:0;border-radius:12px;padding:12px 16px;font:inherit;font-weight:700;font-size:1rem;background:var(--a);color:var(--ab);cursor:pointer}
.mnf-pop .mnf-ok:focus-visible{outline:3px solid var(--f);outline-offset:2px}
`;
    document.head.appendChild(s);
  }

  /* ---------- 카드 ---------- */
  function build(sample) {
    const all = sample ? sample.slice() : load();
    if (!all.length) return null;
    style();
    const box = document.createElement("section");
    box.className = "mnf"; box.setAttribute("aria-label", T("내가 놀러 간 친구 집", "Places I visited"));
    const h = document.createElement("h3"); h.textContent = T("👋 내가 놀러 간 친구 집", "👋 Places I visited");
    const p = document.createElement("p"); p.className = "mnf-sub";
    p.textContent = T("내가 친구 링크로 들어가 본 집만 모여요. 나만 볼 수 있고, 친구에게는 알려지지 않아요.", "Only places I opened from a friend's link are listed. Only I can see this, and friends are never notified.");
    const ul = document.createElement("ul");
    let shown = 5;
    const more = document.createElement("button"); more.type = "button"; more.className = "mnf-more";
    function fill() {
      const cur = sample ? sample.slice() : load(); ul.textContent = "";
      cur.slice(0, shown).forEach(x => {
        const k = KINDS[x.k]; const li = document.createElement("li");
        const a = document.createElement("a"); a.href = k.path + x.s + (isEn() ? "?lang=en" : "");
        const i = document.createElement("span"); i.className = "mnf-i"; i.setAttribute("aria-hidden", "true"); i.textContent = k.icon;
        const n = document.createElement("span"); n.className = "mnf-n"; n.textContent = k.label(x.n);
        const g = document.createElement("span"); g.className = "mnf-go"; g.setAttribute("aria-hidden", "true"); g.textContent = "›";
        a.setAttribute("aria-label", k.label(x.n) + " " + T("놀러 가기", "Visit"));
        a.append(i, n, g);
        const d = document.createElement("button"); d.type = "button"; d.textContent = "×";
        d.setAttribute("aria-label", T(k.label(x.n) + " 목록에서 지우기", "Remove " + k.label(x.n) + " from the list"));
        d.onclick = () => {
          if (sample) { const j = sample.findIndex(y => y.k === x.k && y.s === x.s); if (j >= 0) sample.splice(j, 1); if (!sample.length) box.remove(); else fill(); return; }  // 미리보기는 진짜 목록을 건드리지 않아요
          remove(x.k, x.s); if (!load().length) box.remove(); else fill();
        };
        li.append(a, d); ul.appendChild(li);
      });
      const rest = cur.length - shown;
      more.hidden = rest <= 0;
      more.textContent = T("더 보기 (" + rest + ")", "Show more (" + rest + ")");
    }
    more.onclick = () => { shown = MAX; fill(); };
    fill();
    box.append(h, p, ul, more);
    return box;
  }
  function attach(el) { if (!el) return; const old = el.querySelector(":scope > .mnf"); if (old) old.remove(); const b = build(); if (b) el.appendChild(b); }
  function render(el, sample) {
    if (!el) return; el.textContent = ""; const b = build(sample);
    if (b) { el.appendChild(b); el.hidden = false; } else el.hidden = true;
  }

  /* ---------- 새 기능 안내 팝업 (기기당 한 번) ---------- */
  function announce(force) {
    if (!force) {
      if (Date.now() >= ANN_UNTIL) return;   // 3일이 지나면 더 이상 안 보여요
      try { if (localStorage.getItem(ANN_KEY)) return; } catch (e) { return; }
    }
    if (document.querySelector(".mnf-pop")) return;
    style();
    const prevFocus = document.activeElement;
    const wrap = document.createElement("div"); wrap.className = "mnf-pop";
    const card = document.createElement("div"); card.className = "mnf-card"; card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "mnfT");
    const tag = document.createElement("span"); tag.className = "mnf-tag"; tag.textContent = "NEW";
    const h = document.createElement("h2"); h.id = "mnfT"; h.textContent = T("이젠 내가 놀러 간 친구 집을 모아서 볼 수 있어요", "Now you can revisit the places you visited");
    const rows = document.createElement("div"); rows.className = "mnf-rows";
    [["🏢", T("이젠 친구의 맨션을 다시 볼 수 있어요", "Revisit friends' mansions")], ["🎁", T("이젠 친구의 선물가게를 다시 볼 수 있어요", "Revisit friends' gift shops")]].forEach(([e, t]) => {
      const p = document.createElement("p"); const b = document.createElement("b"); b.setAttribute("aria-hidden", "true"); b.textContent = e; p.append(b, document.createTextNode(t)); rows.appendChild(p);
    });
    const note = document.createElement("p"); note.className = "mnf-note";
    note.textContent = T("지금부터 내가 친구 링크로 놀러 간 집만 이 기기에 모여요. 내 집에 누가 다녀갔는지는 저장도, 표시도 되지 않아요.", "From now on, only places you open from a friend's link are saved on this device. Who visited your own place is never saved or shown.");
    const ok = document.createElement("button"); ok.type = "button"; ok.className = "mnf-ok"; ok.textContent = T("알겠어요", "Got it");
    card.append(tag, h, rows, note, ok); wrap.appendChild(card); document.body.appendChild(wrap);
    function close() {
      if (!force) try { localStorage.setItem(ANN_KEY, String(Date.now())); } catch (e) {}
      document.removeEventListener("keydown", onKey, true); wrap.remove();
      try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) {}
    }
    function onKey(e) {
      if (e.key === "Escape") { e.stopPropagation(); close(); }
      else if (e.key === "Tab") { e.preventDefault(); ok.focus(); }   // 버튼이 하나라 포커스를 가둬요
    }
    ok.onclick = close;
    wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    document.addEventListener("keydown", onKey, true);
    ok.focus();
  }

  window.mnFriends = { visit, list: load, remove, attach, render, announce };
})();
