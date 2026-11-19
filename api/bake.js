// 카톡·인스타 미리보기용: 받는 사람 이름이 들어간 제목을 보여 주고, 사람은 바로 빵집 페이지로 보내요.
// 실패해도 기본 문구로 응답해서 링크가 깨지지 않게 해요.
const SB = "https://gbmlkyfguktjtroczqfw.supabase.co/rest/v1/rpc/bake_get";
const KEY = "sb_publishable_RO92ntdlSM5_Urctc5FD9w_4OHcZQzf";
const NAMES = { cake: "케이크가", cupcake: "컵케이크가", pie: "파이가", bread: "식빵이", bungeo: "붕어빵이" };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || "").toLowerCase();
  const ok = /^[a-z0-9]{10}$/.test(id);
  const url = ok ? `https://www.moodnight.co.kr/bakery/r/${id}` : "https://www.moodnight.co.kr/bakery/";
  let title = "한밤의 빵집에서 빵이 배달됐어요 🧁";
  let desc = "상자를 열어서 무엇이 들었는지 확인해 보세요.";
  if (ok) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const r = await fetch(SB, { method: "POST", signal: ctrl.signal, headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_id: id }) });
      clearTimeout(t);
      if (r.ok) {
        const rows = await r.json();
        if (rows && rows[0]) {
          const b = rows[0];
          title = `${b.to_name}님에게 ${NAMES[b.base] || "빵이"} 배달됐어요 🧁`;
          desc = `${b.from_name}님이 한밤의 빵집에서 직접 꾸며 보냈어요. 상자를 열어 보세요!`;
        }
      }
    } catch (e) { /* 기본 문구 사용 */ }
  }
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:site_name" content="무드나잇">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="https://www.moodnight.co.kr/bakery/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script>location.replace(${JSON.stringify(url)})</script>
</head><body><a href="${esc(url)}">${esc(title)}</a></body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  res.status(200).send(html);
};
