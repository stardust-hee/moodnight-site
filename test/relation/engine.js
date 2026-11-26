/* 인간관계 성향 테스트 분석 엔진 — 화면·서버와 무관한 순수 함수예요.
   무드나잇 사이트와 마인드맵 앱이 같은 파일을 가져다 쓸 수 있어요.
   test = relation-v1.json 내용, answers = 문항 순서대로 고른 선택지 번호(0~3) 배열 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MNRelation = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var DIMS = ["ind", "int", "conf", "trust", "comm", "bound"];

  /* 지표별 원점수(0~15)와 환산 점수(0~100) */
  function score(test, answers) {
    var raw = {}, pct = {};
    DIMS.forEach(function (d) { raw[d] = 0; });
    test.questions.forEach(function (q, i) {
      var a = answers[i];
      if (a === undefined || a === null || !q.options[a]) throw new Error("답이 비어 있어요: " + q.id);
      raw[q.dim] += q.options[a].score;
    });
    var max = test.scoring.maxRaw;
    DIMS.forEach(function (d) { pct[d] = raw[d] / max * 100; });
    return { raw: raw, pct: pct };
  }

  /* 기준 벡터와의 거리로 대표·보조 유형을 정해요. 거리에서 유형별 분포 보정값(bias)을 빼요.
   동점이면 맨해튼 거리, 그래도 같으면 유형 번호 순서예요. */
  function classify(test, pct) {
    var eps = test.scoring.epsilon || 1e-9;
    var list = test.types.map(function (t, idx) {
      var e = 0, m = 0;
      DIMS.forEach(function (d) { var x = pct[d] - t.vec[d]; e += x * x; m += Math.abs(x); });
      return { id: t.id, index: idx, dist: Math.sqrt(e) - (t.bias || 0), l1: m };
    });
    list.sort(function (a, b) {
      if (Math.abs(a.dist - b.dist) > eps) return a.dist - b.dist;
      if (Math.abs(a.l1 - b.l1) > eps) return a.l1 - b.l1;
      return a.index - b.index;
    });
    return { primary: list[0].id, secondary: list[1].id, ranking: list };
  }

  function evaluate(test, answers) {
    var s = score(test, answers), c = classify(test, s.pct);
    return { version: test.version, raw: s.raw, pct: s.pct, primary: c.primary, secondary: c.secondary, ranking: c.ranking };
  }

  /* 공유 링크용: 지표별 원점수 6개를 "12-9-7-14-6-10" 같은 문자열로 */
  function encode(raw, version) {
    return "v" + version + "." + DIMS.map(function (d) { return raw[d]; }).join("-");
  }
  function decode(str) {
    var m = /^v(\d+)\.(\d{1,2}(?:-\d{1,2}){5})$/.exec(String(str || ""));
    if (!m) return null;
    var p = m[2].split("-").map(Number), raw = {};
    for (var i = 0; i < 6; i++) { if (p[i] > 15) return null; raw[DIMS[i]] = p[i]; }
    return { version: Number(m[1]), raw: raw };
  }
  function fromRaw(test, raw) {
    var pct = {};
    DIMS.forEach(function (d) { pct[d] = raw[d] / test.scoring.maxRaw * 100; });
    var c = classify(test, pct);
    return { version: test.version, raw: raw, pct: pct, primary: c.primary, secondary: c.secondary, ranking: c.ranking };
  }

  /* 결과에서 마인드맵에 추가할 후보 노드(사용자 동의 후에만 추가해요) */
  function mindmapNodes(test, result) {
    var t = test.types.filter(function (x) { return x.id === result.primary; })[0];
    return t ? t.nodes.slice() : [];
  }

  function level(p) { return p < 34 ? "low" : p < 67 ? "mid" : "high"; }

  return { DIMS: DIMS, score: score, classify: classify, evaluate: evaluate, encode: encode, decode: decode, fromRaw: fromRaw, mindmapNodes: mindmapNodes, level: level };
});
