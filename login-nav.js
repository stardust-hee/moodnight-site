/* 무드나잇 상단 로그인 버튼: 성탄맨션·산타의 선물가게 맨 위 줄에 로그인(또는 이름)을 보여줘요.
 * 로그인하면 내 선물가게·내 맨션으로 가거나 로그아웃할 수 있어요. 로그인 정보는 두 서비스가 함께 써요. */
(function () {
  if (!window.supabase) return;
  const EN = window.LANG === "en", T = (ko, en) => (EN ? en : ko);
  const sb = supabase.createClient("https://gbmlkyfguktjtroczqfw.supabase.co", "sb_publishable_RO92ntdlSM5_Urctc5FD9w_4OHcZQzf", { auth: { autoRefreshToken: false, detectSessionInUrl: false } });
  const inSanta = /^\/santa\b/.test(location.pathname), back = location.origin + (inSanta ? "/santa/" : "/mansion/");
  const css = document.createElement("style");
  css.textContent = `.site-nav{position:relative}.mn-login-btn{order:2;margin-left:auto!important;font-weight:700}.mn-login-btn+.lang-btn{margin-left:0!important}
.mn-login-pop{position:absolute;right:0;top:calc(100% + 6px);z-index:40;min-width:210px;display:grid;gap:6px;padding:10px;background:var(--night2,var(--cream,#fff));color:var(--snow,var(--ink,#222));box-shadow:0 0 0 2px var(--edge,var(--line,#999)),4px 4px 0 rgba(0,0,0,.35);font-size:.85rem}
.mn-login-pop[hidden]{display:none}.mn-login-pop p{margin:0 0 2px;opacity:.85;line-height:1.5}
.mn-login-pop button,.mn-login-pop a{display:block;text-align:center;font:inherit;font-weight:700;padding:8px 10px;border:0;cursor:pointer;text-decoration:none;background:var(--amber,#F6A94A);color:#2A1608}
.mn-login-pop .k{background:#FEE500;color:#191919}.mn-login-pop .g{background:#fff;color:#222}.mn-login-pop .o{background:transparent;color:inherit;box-shadow:inset 0 0 0 1px currentColor}`;
  document.head.appendChild(css);
  const mount = () => {
    const nav = document.querySelector(".site-nav"); if (!nav || nav.querySelector(".mn-login-btn")) return;
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "lang-btn mn-login-btn"; btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false");
    const pop = document.createElement("div"); pop.className = "mn-login-pop"; pop.hidden = true;
    const lang = nav.querySelector(".lang-btn"); nav.insertBefore(btn, lang && lang !== btn ? lang : null); nav.appendChild(pop);
    const open = v => { pop.hidden = !v; btn.setAttribute("aria-expanded", String(v)); };
    btn.onclick = e => { e.stopPropagation(); open(pop.hidden); };
    document.addEventListener("click", e => { if (!pop.contains(e.target) && e.target !== btn) open(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") open(false); });
    const show = session => {
      if (!session) {
        btn.textContent = T("로그인", "Log in");
        pop.innerHTML = `<p>${T("로그인하면 내 선물가게와 내 맨션을 볼 수 있어요.", "Log in to see your gift shop and your mansion.")}</p>
          <button type="button" class="k" id="mnK">${T("카카오로 로그인", "Continue with Kakao")}</button><button type="button" class="g" id="mnG">${T("구글로 로그인", "Continue with Google")}</button>`;
        pop.querySelector("#mnK").onclick = () => sb.auth.signInWithOAuth({ provider: "kakao", options: { redirectTo: back, scopes: "profile_nickname profile_image" } });
        pop.querySelector("#mnG").onclick = () => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: back } });
      } else {
        const m = session.user.user_metadata || {}, nm = (m.name || m.full_name || m.nickname || "").trim().split(/\s+/)[0] || T("내 계정", "Account");
        btn.textContent = nm.slice(0, 8) + " ▾";
        pop.innerHTML = `<button type="button" id="mnS">${T("내 선물가게", "My gift shop")}</button><button type="button" id="mnM">${T("내 맨션", "My mansion")}</button><button type="button" class="o" id="mnOut">${T("로그아웃", "Log out")}</button>`;
        pop.querySelector("#mnS").onclick = () => { location.href = "/santa/" + (EN ? "en" : ""); };
        pop.querySelector("#mnM").onclick = () => { location.href = "/mansion/" + (EN ? "en" : ""); };
        pop.querySelector("#mnOut").onclick = async () => { try { await sb.auth.signOut(); } catch (e) {} location.reload(); };
      }
    };
    show(null);
    sb.auth.getSession().then(r => { if (r.data && r.data.session) show(r.data.session); }).catch(() => {});
  };
  document.querySelector(".site-nav") ? mount() : document.addEventListener("DOMContentLoaded", mount);
})();
