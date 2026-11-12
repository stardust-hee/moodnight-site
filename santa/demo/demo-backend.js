/* 산타 체험판: 진짜 화면(app.js)을 그대로 쓰고, 서버 대신 이 파일이 예시 데이터로 대답해요.
 * 저장은 안 되고 새로고침하면 처음으로 돌아가요. */
(function () {
  const XMAS = "2026-12-25T00:00:00+09:00";
  const D = window.DEMO = { mode: "host", open: false };
  const room = { slug: "demo", display_name: "하린" };
  let seq = 0;
  const G = (wrap, item, sender, message, hints, extra) => Object.assign({
    id: "d" + (++seq), wrap, item, sender, message, hints, decoys: [], wrongs: [], result: null, opened: false, hidden: false
  }, extra || {});
  const gifts = [
    G("red", "socks", "지수", "올해 회사 적응하느라 고생 많았어. 발 따뜻하게 하고 푹 자.", ["우리는 대학교 동아리에서 처음 만났어요", "작년 겨울에 같이 전시회를 봤어요", "내 이름은 'ㅈ'으로 시작해요"]),
    G("green", "mug", "재훈", "핫초코 좋아하잖아. 이걸로 타 먹으면서 내 생각 한 번만 해 줘.", ["나는 매일 아침 아이스 아메리카노를 들고 다녀요", "우리 둘 다 곱창은 대창파예요", "내 이름은 'ㅈ'으로 시작해요"]),
    G("navy", "instax", "민아", "올해 사진이 너무 적어서 아쉬웠어. 내년엔 많이 찍자!", ["우리 집엔 하얀 털 뭉치가 한 마리 살아요", "너랑 제주도에 같이 간 적 있어요", "내 이름은 'ㅁ'으로 시작해요"]),
    G("gold", "ps5", "도윤", "…라고 하면 믿을래? 마음만은 진짜야. 메리 크리스마스!", ["나는 요즘 클라이밍에 빠져 있어요", "우리는 고등학교 때 같은 반이었어요", "내 이름은 'ㄷ'으로 시작해요"]),
    G("snow", "candle", "서연", "방 안에 좋은 냄새 나면 기분도 좋아지더라. 올 한 해 수고했어.", ["내 MBTI는 INFP예요", "우리가 마지막으로 같이 간 곳은 성수동이에요", "내 이름은 'ㅅ'으로 시작해요"]),
    G("red", "hotpack", "예준", "출근길에 하나씩 꼭 챙겨. 감기 걸리지 말고!", ["나는 너보다 한 살 어려요", "우리는 같은 동네에 살아요", "내 이름은 'ㅇ'으로 시작해요"], { decoys: ["지호"] }),
    G("green", "speaker", "나연", "캐럴은 크게 들어야 제맛이지. 연말에 같이 노래방 가자.", ["나는 노래방에서 꼭 발라드를 불러요", "너랑 같이 밤새 통화한 적 있어요", "내 이름은 'ㄴ'으로 시작해요"])
  ];
  const norm = s => String(s || "").replace(/\s/g, "").toLowerCase();
  const unlockAt = () => D.open ? new Date(Date.now() - 60000).toISOString() : XMAS;
  const box = g => ({ id: g.id, wrap: g.wrap, item: g.item, opened: g.opened, result: g.result, hidden: g.hidden, wrongs: g.wrongs.length });
  const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; };
  function view(g) {
    const others = [...new Set(gifts.filter(o => o !== g && norm(o.sender) !== norm(g.sender)).map(o => o.sender))];
    const pool = others.concat(g.decoys.filter(d => !others.some(o => norm(o) === norm(d))));
    const pick = pool.sort((a, b) => hash(a + g.id) - hash(b + g.id)).slice(0, 3);
    const cands = pick.concat(g.sender).sort((a, b) => hash(a + g.id + "o") - hash(b + g.id + "o"));
    return {
      id: g.id, wrap: g.wrap, item: g.item, message: g.message, real_gift: null, real_for_real: false,
      hints: g.result ? g.hints.slice() : g.hints.slice(0, Math.min(3, 1 + g.wrongs.length)),
      candidates: cands.length < 2 ? null : cands, wrong_guesses: g.wrongs.slice(), result: g.result,
      sender_name: g.result ? g.sender : null
    };
  }
  const err = m => ({ data: null, error: { message: m } });
  const find = id => gifts.find(g => g.id === id);
  const rpc = {
    get_room: () => ({ data: { slug: room.slug, display_name: room.display_name, unlock_at: unlockAt(), is_owner: D.mode === "host",
      boxes: gifts.filter(g => D.mode === "host" || !g.hidden).map(box) } }),
    send_gift: p => {
      if (D.open) return err("closed: 선물 보내기가 마감됐어요");
      const g = G(p.p_wrap, p.p_item, p.p_sender_name, p.p_message, p.p_hints, { decoys: (p.p_decoys || []).slice(0, 3) });
      gifts.push(g); return { data: g.id };
    },
    open_gift: p => { const g = find(p.p_gift_id); if (!g) return err("not_found: 선물을 찾을 수 없어요"); if (!D.open) return err("locked: 12월 25일에 열 수 있어요"); g.opened = true; return { data: view(g) }; },
    guess_sender: p => {
      const g = find(p.p_gift_id); if (!g) return err("not_found: 선물을 찾을 수 없어요");
      const a = norm(p.p_name), b = norm(g.sender);
      if (!g.result && a) {
        if (a === b || (a.length >= 2 && (b.endsWith(a) || a.endsWith(b)))) g.result = "right";
        else if (!g.wrongs.some(w => norm(w) === a)) { g.wrongs.push(String(p.p_name).trim().slice(0, 10)); if (g.wrongs.length >= 3) g.result = "miss"; }
        g.opened = true;
      }
      return { data: view(g) };
    },
    list_my_gifts: () => ({ data: gifts.map(g => g.opened || g.result ? Object.assign(view(g), { opened: true, hidden: g.hidden }) : { id: g.id, wrap: g.wrap, item: g.item, opened: false, hidden: g.hidden }) }),
    hide_gift: p => { const g = find(p.p_gift_id); if (g) g.hidden = !!p.p_hidden; return { data: null }; },
    report_gift: p => { const g = find(p.p_gift_id); if (g) g.hidden = true; return { data: null }; }
  };
  const session = { user: { id: "demo-owner", user_metadata: { name: "하린" } } };
  const chain = (result) => { const c = { select: () => c, eq: () => c, maybeSingle: async () => result(), then: (res, rej) => Promise.resolve(result()).then(res, rej) }; return c; };
  window.supabase = {
    createClient: () => ({
      auth: {
        getSession: async () => ({ data: { session } }),
        onAuthStateChange: () => {},
        signOut: async () => {},
        signInWithOAuth: async () => {}
      },
      rpc: async (name, params) => (rpc[name] ? rpc[name](params || {}) : { data: null }),
      from: () => ({
        select: () => chain(() => ({ data: { slug: room.slug } })),
        insert: async () => ({ error: null }),
        update: v => chain(() => { if (v && v.display_name) room.display_name = v.display_name; return { error: null }; })
      })
    })
  };
})();
