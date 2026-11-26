// 심리테스트 결과 링크 미리보기(카톡·인스타·페이스북 등)용: 결과 유형 이름과 이미지를 보여 줘요.
// 봇에게만 응답하고, 사람은 vercel.json 규칙에 따라 바로 테스트 페이지로 가요. 실패해도 기본 문구로 응답해요.
const engine = require("../test/relation/engine.js");
const REL = require("../test/relation/relation-v1.json");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const OH = { wood: ["나무", "눈 속에서도 새싹 틔우는 아기 사슴", "🦌"], fire: ["불", "모닥불 앞의 수다쟁이 여우", "🦊"], earth: ["흙", "모두를 불러 모으는 다정한 곰 집주인", "🐻"], metal: ["쇠", "은빛 취향을 수집하는 고양이", "🐱"], water: ["물", "달빛 아래 생각 많은 수달", "🦦"] };
const GF = { ribbon: ["리본을 세 번 묶는 정성 상자", "🎀"], pop: ["열자마자 펑! 깜짝 팝업 상자", "🎉"], kraft: ["튼튼한 크래프트 실속 상자", "📦"], silver: ["은박이 반짝이는 취향 상자", "🪩"], letter: ["손편지가 먼저 나오는 봉투", "💌"], bundle: ["다 같이 나눠 먹는 보따리", "🧺"] };
const BASE = "https://www.moodnight.co.kr";

function build(t, k) {
  if (t === "ohaeng" && Object.prototype.hasOwnProperty.call(OH, k)) {
    const [ko, name, em] = OH[k];
    return { page: `/test/ohaeng/?from=${k}`, image: `ohaeng-${k}`, title: `나는 ${ko} 기운 '${name}'! ${em}`, desc: "나의 겨울밤 기운은? 오행 심리테스트. 너는 어떤 기운이야? 해 보고 우리 궁합도 확인해 봐요." };
  }
  if (t === "gift" && Object.prototype.hasOwnProperty.call(GF, k)) {
    const [name, em] = GF[k];
    return { page: `/test/gift/?from=${k}`, image: `gift-${k}`, title: `나는 '${name}'! ${em}`, desc: "나는 어떤 크리스마스 선물 상자일까? 너도 해 보고 상자 궁합을 확인해 봐요." };
  }
  if (t === "relation") {
    const d = engine.decode(k);
    if (d && d.version === REL.version) {
      const r = engine.fromRaw(REL, d.raw);
      const ty = REL.types.filter((x) => x.id === r.primary)[0];
      if (ty) return { page: `/test/relation/?r=${k}`, image: `relation-${ty.id}`, title: `내 인간관계 유형은 '${ty.name}'! ${ty.emoji}`, desc: `${ty.tagline} 나는 어떤 사람과 잘 맞을까? 테스트로 너의 유형도 확인해 봐요.` };
    }
  }
  return null;
}

module.exports = async (req, res) => {
  const t = String((req.query && req.query.t) || "");
  const k = String((req.query && req.query.k) || "");
  let m = null;
  try { m = build(t, k); } catch (e) { m = null; }
  const pageUrl = BASE + (m ? m.page : "/test/");
  const title = m ? m.title : "무드나잇 심리테스트";
  const desc = m ? m.desc : "1분이면 끝나는 무료 성격·궁합 테스트 모음이에요.";
  const img = BASE + "/test/og/" + (m ? m.image : "list") + ".jpg";
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:site_name" content="무드나잇">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script>location.replace(${JSON.stringify(pageUrl)})</script>
</head><body><a href="${esc(pageUrl)}">${esc(title)}</a></body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(html);
};
