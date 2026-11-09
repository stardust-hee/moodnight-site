/* 무드나잇 방문·공유 기록 (관리자 페이지 숫자용)
 * 어떤 페이지를 열었는지와 기기 구분 값(무작위 문자열)만 남겨요. 이름, 메시지 같은 내용은 안 보내요.
 * 공유 버튼은 window.mnTrack("share", "kakao") 처럼 불러요. */
(function () {
  const URL = "https://gbmlkyfguktjtroczqfw.supabase.co/rest/v1/rpc/log_event";
  const KEY = "sb_publishable_RO92ntdlSM5_Urctc5FD9w_4OHcZQzf";
  const p = location.pathname;
  if (/\/demo\//.test(p) || /^\/admin/.test(p)) { window.mnTrack = () => {}; return; }
  const page = p === "/" || p === "/index.html" ? "home" : p.startsWith("/blog") ? "blog"
    : p.startsWith("/santa/r/") ? "santa_r" : p.startsWith("/santa") ? "santa"
    : p.startsWith("/mansion/r/") ? "mansion_r" : p.startsWith("/mansion") ? "mansion" : "other";
  const device = (() => {
    const make = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join("") + Date.now().toString(36);
    try { let d = localStorage.getItem("mn_device"); if (!d || !/^[a-z0-9]{16,40}$/.test(d)) { d = make(); localStorage.setItem("mn_device", d); } return d; } catch (e) { return null; }
  })();
  const send = (kind, detail) => {
    try {
      fetch(URL, { method: "POST", keepalive: true, headers: { apikey: KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ p_kind: kind, p_page: page, p_detail: detail || null, p_device: device }) }).catch(() => {});
    } catch (e) {}
  };
  window.mnTrack = (kind, detail) => send(kind, detail);
  send("visit");
})();
