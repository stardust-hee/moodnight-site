/* 산타의 선물가게 언어 (한국어 / English)
 * 고르는 순서: 주소의 ?lang=en|ko → 지난번에 고른 언어(localStorage mn_lang) → 브라우저 언어(한국어면 ko, 아니면 en)
 * app.js에서는 L("한국어", "English")처럼 두 문장을 나란히 써요. */
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

  /* 선물 이름·흔들 때 소리 (영어) */
  window.GIFT_EN = {
    socks: ["Christmas Fuzzy Socks", "For cold winter nights", "No sound at all. Soft and squishy"],
    hotpack: ["Box of Hand Warmers", "Keep one in each pocket", "Little packets rustling together"],
    mug: ["Christmas Mug", "Make your hot cocoa in this", "Something solid clinks. Careful, it might break"],
    lipbalm: ["Lip Balm Set", "So your lips don't crack", "Tiny tubes rattling around"],
    keyring: ["Fish-Bread Keyring", "Can't give you the snack, so here's this", "A little jingle, like a ring"],
    moodlight: ["Mood Lamp", "In charge of bedtime vibes", "Something round and heavy rolls"],
    blanket: ["Fluffy Blanket", "Because outside the blanket is dangerous", "Soft and packed full"],
    candle: ["Scented Candle", "Make your room smell like Christmas", "A faint, lovely scent leaks out"],
    tumbler: ["Tumbler", "Keep your drinks warm longer", "A clear little ting"],
    handcream: ["Hand Cream Set", "You said your hands were dry", "A few tubes bump together"],
    humidifier: ["Mini Humidifier", "One for your dry room", "Light and roundish"],
    speaker: ["Bluetooth Speaker", "Carols should be loud", "Heavy. Feels like it could boom"],
    warmer: ["Rechargeable Hand Warmer", "Hand warmer, upgraded", "Palm-sized, it taps around"],
    charger: ["Wireless Charger", "No more low battery", "Flat and solid"],
    lego: ["LEGO Christmas Set", "Let's build it together", "Clatter clatter, lots of tiny pieces"],
    drip: ["Home Café Drip Set", "Café at home", "Glass and paper inside"],
    instax: ["Instax Mini", "Let's take lots of photos", "Square and solid. Sounds like it could click"],
    earbuds: ["Wireless Earbuds", "For your commute playlist", "A small case clicks"],
    heatpad: ["Electric Blanket", "Save on heating this winter", "Big and soft. Feels like there's a cord"],
    perfume: ["Perfume", "Thought it would suit you", "A glass bottle sloshes"],
    ps5: ["PlayStation 5", "...would you believe it?", "Super heavy. No way...?"],
    switch2: ["Nintendo Switch 2", "Let's play Mario Kart", "Click click, like buttons"],
    airpods: ["AirPods Pro", "Went big this time", "A tiny case clicks. No way...?"],
    ipad: ["iPad", "Dream big", "Thin, wide and heavy"],
    dyson: ["Dyson Hair Dryer", "Santa went wild", "Something sleek is inside"],
    cocoa: ["Cup of Hot Cocoa", "", "A warm liquid sloshes"],
    mitten: ["Wool Mittens", "", "No sound. Soft and fluffy"],
    tangerine: ["Box of Tangerines", "", "Something rolls around"],
    letter: ["Lucky Letter", "", "Paper rustles softly"],
    globe: ["Snow Globe", "", "Something sparkly swirls"],
    ticket: ["Movie Date Ticket", "", "Thin and light. Almost empty"]
  };
  window.TIER_EN = { "소소한 마음": "Little something", "제법 성의": "Thoughtful", "마음 좀 썼어": "Went the extra mile", "통 크게": "Big spender", "산타가 미쳤어요": "Santa went wild" };

  /* 언어 버튼: 화면 위 메뉴 오른쪽 */
  const mount = () => {
    const nav = document.querySelector(".site-nav"); if (!nav || nav.querySelector(".lang-btn")) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "lang-btn";
    b.textContent = lang === "en" ? "🌐 한국어" : "🌐 English"; b.setAttribute("aria-label", lang === "en" ? "한국어로 보기" : "View in English");
    b.onclick = () => setLang(lang === "en" ? "ko" : "en");
    nav.appendChild(b);
    if (lang === "en") {
      document.querySelectorAll("[data-en]").forEach(el => { el.textContent = el.dataset.en; });
      document.title = "Santa's Gift Shop | Moodnight";
    }
  };
  // 이 파일은 body 끝에서 불러서 화면 요소가 이미 있어요. 바로 적용해야 app.js가 쓴 글을 덮지 않아요
  document.querySelector(".site-nav") ? mount() : document.addEventListener("DOMContentLoaded", mount);
})();
