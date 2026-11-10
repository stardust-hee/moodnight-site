/* 산타의 선물가게 — 실제 서비스 */
const SUPABASE_URL = "https://gbmlkyfguktjtroczqfw.supabase.co";
const SUPABASE_KEY = "sb_publishable_RO92ntdlSM5_Urctc5FD9w_4OHcZQzf";
const KAKAO_JS_KEY = "929f085734659fd851830cba5592775d";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
try { if (window.Kakao && !Kakao.isInitialized()) Kakao.init(KAKAO_JS_KEY); } catch (e) {}

const EN = window.LANG === "en";
const WRAPS = [
  { id: "red", name: L("산타 레드", "Santa Red") }, { id: "green", name: L("전나무 체크", "Pine Check") }, { id: "navy", name: L("한밤 별빛", "Midnight Stars") },
  { id: "gold", name: L("금빛 줄무늬", "Gold Stripes") }, { id: "snow", name: L("눈송이", "Snowflake") }
];
/* 예전 선물 (11/9 이전에 보낸 상자 표시용) */
const ITEMS = [
  { id: "cocoa", icon: "☕", name: "핫초코 한 잔", shake: "찰랑찰랑, 따뜻한 액체 소리가 나요" },
  { id: "mitten", icon: "🧤", name: "털장갑", shake: "아무 소리도 안 나요. 폭신폭신해요" },
  { id: "tangerine", icon: "🍊", name: "귤 한 박스", shake: "데굴데굴 굴러가는 소리가 나요" },
  { id: "letter", icon: "💌", name: "행운 편지", shake: "종이가 사락사락 스쳐요" },
  { id: "globe", icon: "🔮", name: "스노우볼", shake: "반짝이는 무언가가 출렁여요" },
  { id: "ticket", icon: "🎟", name: "영화 데이트권", shake: "얇고 가벼워요. 거의 비어 있는 것 같아요" }
];
/* 선물 놓을 자리: 3D 방의 트리 아래 러그 위 (배경 그림 기준 %, 상자 아래 가운데). 앞줄일수록 조금 크게 */
const SLOTS = [[50,93],[64,93],[57,97.5],[43,96.5],[71,97],[46,89.5],[68,89.5],[36,92.5],[78,92.5],[57,90],
  [30,97],[84,97],[50,99.5],[64,99.5],[27,92],[85,92],[38,99.5],[76,99.5],[22,99],[85,100]];
const slot = i => { const [x, y] = SLOTS[i % SLOTS.length]; const k = Math.floor(i / SLOTS.length); return { x: x + (k % 2 ? 2.5 : -2.5) * k, y: y - k * 2.2 }; };
const giftW = y => (9.6 + (y - 89) * 0.22).toFixed(2) + "%";
let firstPaint = true;

const $ = s => document.querySelector(s);
const localize = g => { if (!g || !EN) return g; const e = (window.GIFT_EN || {})[g.id]; return e ? Object.assign({}, g, { name: e[0], line: e[1] || g.line, shake: e[2] }) : g; };
const item = id => localize((window.REAL_GIFTS || []).find(g => g.id === id) || ITEMS.find(i => i.id === id)) || { icon: "🎁", name: L("선물", "Gift"), shake: L("뭔가 들어 있어요", "Something's inside") };
const POSS = n => L(`${n}의`, /s$/i.test(n) ? `${n}'` : `${n}'s`);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const giftHTML = () => `<span class="spr"></span>`;
const ERR_EN = { rate_limit: "Too many requests right now. Please try again later.", locked: "Gifts open on Dec 25.", not_found: "We couldn't find that.", closed: "Sending gifts has closed.", full: "This gift shop is full.", login: "Please log in first." };
const errMsg = e => { const m = (e && e.message) || L("잠시 후 다시 시도해 주세요.", "Something went wrong. Please try again."); const code = m.split(":")[0].trim();
  if (EN) return ERR_EN[code] || (/[가-힣]/.test(m) ? "Something went wrong. Please try again." : m);
  return m.includes(": ") ? m.split(": ").slice(1).join(": ") : m; };
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2800); }

let pathSlug = (location.pathname.match(/\/santa\/r\/([a-z0-9]+)/i) || [])[1] || null;
let MODE = pathSlug ? "guest" : "host";
/* 체험판(santa/demo): demo-backend.js가 window.DEMO를 만들고, 탭으로 화면을 바꿔요 */
if (window.DEMO) { MODE = DEMO.mode; pathSlug = MODE === "guest" ? "demo" : null; }
window.demoSwitch = mode => {
  DEMO.mode = MODE = mode; pathSlug = mode === "guest" ? "demo" : null;
  sent = false; draft = freshDraft(); draftErr = ""; cur = null; $("#overlay").hidden = true;
  return mode === "guest" ? loadGuest() : loadHost();
};

let session = null, room = null, sent = false;
const freshDraft = () => ({ wrap: "red", item: null, msg: "", hints: ["", "", ""], name: "", decoys: ["", "", ""], autoInitial: true, realTier: null });
let draft = freshDraft(), draftErr = "";

const unlockDate = () => new Date(room ? room.unlock_at : "2026-12-25T00:00:00+09:00");
const isOpen = () => Date.now() >= unlockDate().getTime();
const daysLeft = () => Math.max(0, Math.ceil((unlockDate().getTime() - Date.now()) / 86400000));
const roomUrl = () => `${location.origin}/santa/r/${room.slug}${EN ? "?lang=en" : ""}`;
const nameOk = n => EN ? n.length >= 2 && n.length <= 12 : n.length >= 2 && n.length <= 3;
const cleanName = v => EN ? v.trim().replace(/\s+/g, " ") : v.replace(/\s/g, "");

/* ── 화면 그리기 ── */
function renderTop() {
  setTimeout(renderSide, 0);
  const el = $("#dday");
  el.textContent = isOpen() ? "Merry Christmas" : L(`개봉까지 D-${daysLeft()}`, `${daysLeft()} days to open`);
  el.classList.toggle("xmas", isOpen());
  $("#title").textContent = room ? L(`${room.display_name}의 선물가게`, `${POSS(room.display_name)} Gift Shop`) : L("산타의 선물가게", "Santa's Gift Shop");
}

function renderGifts(newId) {
  const wrap = $("#gifts"); wrap.innerHTML = "";
  if (MODE !== "host" && $("#roomTools")) $("#roomTools").remove();
  const boxes = room ? room.boxes : [];
  boxes.forEach((g, i) => {
    const s = slot(i);
    const b = document.createElement("button");
    b.className = `gift w-${g.wrap}${g.opened ? " opened" : ""}${g.hidden ? " is-hidden" : ""}`;
    const tag = g.hidden ? L("숨김", "Hidden") : g.result === "right" ? L("정답", "Solved") : g.opened ? L("개봉", "Opened") : "";
    b.innerHTML = giftHTML() + (tag ? `<span class="tag">${tag}</span>` : "");
    b.setAttribute("aria-label", L(`선물 ${i + 1}${g.opened ? " (열어봄)" : ""}`, `Gift ${i + 1}${g.opened ? " (opened)" : ""}`));
    b.style.zIndex = Math.round(s.y * 10);
    b.style.width = giftW(s.y);
    if (firstPaint && g.id !== newId) {
      b.classList.add("enter"); b.style.setProperty("--i", i);
      b.addEventListener("animationend", () => b.classList.remove("enter"), { once: true });
    }
    if (g.id === newId) {
      b.style.left = "93%"; b.style.top = "82%"; b.classList.add("new");
      requestAnimationFrame(() => requestAnimationFrame(() => { b.style.left = s.x + "%"; b.style.top = s.y + "%"; }));
    } else { b.style.left = s.x + "%"; b.style.top = s.y + "%"; }
    b.onclick = () => onGift(g, b);
    wrap.appendChild(b);
  });
  if (boxes.length) firstPaint = false;
  let hint = L("선물을 눌러서 흔들어 보세요", "Tap a gift to shake it");
  if (!room) hint = L("로그인하면 나만의 선물가게가 생겨요", "Log in to get your own gift shop");
  else if (!boxes.length) hint = MODE === "host" ? L("아직 선물이 없어요. 링크를 공유해 보세요", "No gifts yet. Share your link!") : L("첫 번째 선물을 두고 가 주세요", "Be the first to leave a gift");
  else if (isOpen() && MODE === "host") hint = L("선물을 눌러서 열어 보세요", "Tap a gift to open it");
  else if (MODE !== "host" && !isOpen() && !sent) hint = L("👇 아래에서 선물을 포장해 두고 가 주세요", "👇 Wrap a gift below and leave it here");
  $("#roomHint").textContent = hint;
  // 친구 화면: 방 바로 아래 큰 버튼 (누르면 선물 포장하는 곳으로 내려가요)
  let cta = $("#guestCta");
  if (room && MODE !== "host" && !isOpen() && !sent) {
    if (!cta) { cta = document.createElement("div"); cta.id = "guestCta"; cta.className = "room-tools one"; $("#room").after(cta); }
    cta.innerHTML = `<button class="btn red wide" id="ctaBtn">${L(`🎁 ${esc(room.display_name)}에게 몰래 선물 두고 가기`, `🎁 Leave ${esc(room.display_name)} a secret gift`)}</button>`;
    $("#ctaBtn").onclick = () => { const t = document.querySelector(".panel"); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); };
  } else if (cta) cta.remove();
}

function onGift(g, el) {
  if (MODE === "host" && isOpen()) { openModal(g); return; }
  el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
  toast(isOpen() ? L(`${room.display_name}님만 열어볼 수 있어요`, `Only ${room.display_name} can open these`) : L(`흔들어 보니 ${item(g.item).shake}. 12월 25일에 열려요`, `You give it a shake... ${item(g.item).shake}. Opens on Dec 25`));
}

function panel(html) { $("#panelBody").innerHTML = html; }

function renderLogin() {
  panel(`
  <div class="stack">
    <div><h2>${L("나만의 선물가게 만들기", "Make your own gift shop")}</h2>
      <ol class="how">
        <li data-i="🔗"><b>${L("링크 공유", "Share your link")}</b>${L("내 선물가게 링크를 단톡방이나 인스타에 올려요", "Post your gift shop link in a group chat or on Instagram")}</li>
        <li data-i="🎁"><b>${L("몰래 선물", "Secret gifts")}</b>${L("친구들이 이름을 숨기고 가상 선물, 메시지, 단서를 두고 가요", "Friends leave a virtual gift, a message and clues, with their name hidden")}</li>
        <li data-i="🔍"><b>${L("25일에 맞히기", "Guess on the 25th")}</b>${L("크리스마스에 선물을 열고, 단서로 누가 보냈는지 맞혀요", "Open your gifts on Christmas and use the clues to guess who sent each one")}</li>
      </ol></div>
    ${EN ? "" : `<button class="login kakao" id="loginKakao">카카오로 시작하기</button>`}
    <button class="login google" id="loginGoogle">${L("구글로 시작하기", "Continue with Google")}</button>
    ${EN ? `<button class="linkish" id="loginKakao">Continue with Kakao</button>` : ""}
    <p class="fine">${L(`선물가게를 만드는 사람만 로그인해요. 로그인하면 <a href="/terms.html">이용약관</a>과 <a href="/privacy.html">개인정보처리방침</a>에 동의하는 것으로 봐요.`, `Only the gift shop owner logs in. Friends don't need an account. By logging in you agree to our <a href="/terms.html">Terms</a> and <a href="/privacy.html">Privacy Policy</a> (in Korean).`)}</p>
  </div>`);
  const back = location.origin + "/santa/";
  $("#loginKakao").onclick = () => sb.auth.signInWithOAuth({ provider: "kakao", options: { redirectTo: back, scopes: "profile_nickname profile_image" } });
  $("#loginGoogle").onclick = () => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: back } });
}

function renderCreate() {
  const m = session.user.user_metadata || {};
  const raw = (m.name || m.full_name || m.nickname || "").replace(/\s/g, "");
  const raw2 = EN ? (m.name || m.full_name || m.nickname || "").trim().split(/\s+/)[0] || "" : raw;
  const guess = nameOk(raw2) ? raw2 : "";
  panel(`
  <div class="stack">
    <div><h2>${L("선물가게 이름 정하기", "Name your gift shop")}</h2><p class="sub">${L(`친구들이 링크를 열면 "○○의 선물가게"로 보여요. 친구들이 부르는 이름이나 별명을 2~3글자로 써 주세요.`, `Friends will see "___'s Gift Shop". Use the name or nickname your friends call you (2–12 characters).`)}</p></div>
    <input type="text" id="roomName" maxlength="${EN ? 12 : 3}" value="${esc(guess)}" placeholder="${L("예: 하린", "e.g. Emily")}">
    <p class="err" id="createErr" hidden></p>
    <button class="btn red wide" id="createBtn">${L("선물가게 만들기", "Create my gift shop")}</button>
    <button class="linkish" id="logout">${L("다른 계정으로 로그인", "Log in with another account")}</button>
  </div>`);
  $("#createBtn").onclick = async () => {
    const name = cleanName($("#roomName").value);
    if (!nameOk(name)) { const e = $("#createErr"); e.textContent = L("이름은 2~3글자로 적어 주세요.", "Please use 2–12 characters."); e.hidden = false; return; }
    $("#createBtn").disabled = true;
    const { error } = await sb.from("rooms").insert({ owner_id: session.user.id, display_name: name });
    if (error && error.code !== "23505") { const e = $("#createErr"); e.textContent = L("만들지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't create it. Please try again."); e.hidden = false; $("#createBtn").disabled = false; return; }
    if (!error) window.mnTrack && mnTrack("create", "santa");
    await loadHost();
    toast(L("선물가게가 생겼어요. 링크를 친구들에게 보내 보세요", "Your gift shop is ready. Send the link to your friends!"));
  };
  $("#logout").onclick = logout;
}

/* ── 공유 카드 (1080×1350, 인스타 4:5) ──
 * 3D 방 배경 + 받은 선물 상자 + 숫자만 그려요. 메시지, 보낸 사람 이름은 안 들어가요.
 * 크리스마스 전: "선물 N개가 도착했어요" / 크리스마스 뒤: 맞힌 결과와 칭호 */
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
function cardTitle(total, opened, solved) {
  if (!opened) return null;
  if (solved === total) return L("완벽한 명탐정", "Master Detective");
  if (solved / total >= .5) return L("눈치 백단 탐정", "Sharp-Eyed Sleuth");
  if (solved) return L("새싹 탐정", "Rookie Detective");
  return L("비밀 산타들의 완승", "The Secret Santas Win");
}
async function drawCard() {
  const boxes = room.boxes.filter(b => !b.hidden);
  const total = boxes.length, opened = boxes.filter(b => b.opened).length, solved = boxes.filter(b => b.result === "right").length;
  const open = isOpen();
  // 구글 한글 글꼴은 글자 묶음별로 나눠 받아서, 카드에 쓸 글자를 다 알려 줘야 빠짐없이 받아져요
  const ALL = EN ? `${room.display_name}'s Gift Shop ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?.,-` : `${room.display_name}의 선물가게 2026 크리스마스 선물 개봉 결과 크리스마스까지 D-0123456789 개 중 보낸 친구 명을 맞혔어요 가 열리길 기다려요 도착했어요 누가 보냈는지 단서로 맞히는 놀이 는 12월 25일에 맞혀 볼게요 moodnight.co.kr/santa 완벽한 명탐정 눈치 백단 탐정 새싹 비밀 산타들의 완승`;
  try { await Promise.all([document.fonts.load('60px "Jua"', ALL), document.fonts.load('30px "Pretendard Variable"', ALL)]); } catch (e) {}
  const kinds = [...new Set(boxes.map(b => b.wrap))];
  const [bg, ...gi] = await Promise.all(["/santa/3d/room-1600.webp?v=1", ...kinds.map(k => `/santa/3d/gift-${k}.webp?v=1`)].map(loadImg));
  const GI = Object.fromEntries(kinds.map((k, i) => [k, gi[i]]));
  const c = document.createElement("canvas"); c.width = 1080; c.height = 1350; const g = c.getContext("2d");
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const D = '"Jua","Gowun Dodum",sans-serif', B = '"Pretendard Variable","Jua",sans-serif';
  g.fillStyle = "#F4ECDD"; g.fillRect(0, 0, 1080, 1350);
  g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.fillStyle = "#C23A2E"; g.font = `64px ${D}`; g.fillText(L(`${room.display_name}의 선물가게`, `${POSS(room.display_name)} Gift Shop`), 540, 118);
  g.fillStyle = "#7A6352"; g.font = `30px ${B}`; g.fillText(open ? L("2026 크리스마스 선물 개봉 결과", "Christmas 2026 unwrapping results") : L(`크리스마스까지 D-${daysLeft()}`, `${daysLeft()} days until Christmas`), 540, 168);
  // 방: 배경 가로 9%~91%를 잘라 정사각형에 가깝게
  const RX = 120, RY = 200, RW = 840, sx0 = bg.width * .09, sw = bg.width * .82, RH = Math.round(RW * bg.height / sw), k = RW / sw;
  g.save(); g.shadowColor = "rgba(80,50,20,.25)"; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = "#fff"; rr(RX - 16, RY - 16, RW + 32, RH + 32, 44); g.fill(); g.restore();
  g.save(); rr(RX, RY, RW, RH, 30); g.clip();
  g.drawImage(bg, sx0, 0, sw, bg.height, RX, RY, RW, RH);
  boxes.slice(0, 40).map((b, i) => ({ b, s: slot(i) })).sort((a, z) => a.s.y - z.s.y).forEach(({ b, s }) => {
    const w = parseFloat(giftW(s.y)) / 100 * bg.width * k, cx = RX + (s.x / 100 * bg.width - sx0) * k, by = RY + s.y / 100 * RH;
    g.save(); g.fillStyle = "rgba(45,18,6,.35)"; g.filter = "blur(4px)"; g.beginPath(); g.ellipse(cx, by - w * .06, w * .4, w * .07, 0, 0, Math.PI * 2); g.fill(); g.restore();
    g.drawImage(GI[b.wrap], cx - w / 2, by - w * .97, w, w);
  });
  g.restore();
  // 결과
  let y = RY + RH + 92;
  const title = open ? cardTitle(total, opened, solved) : null;
  if (title) {
    g.font = `34px ${D}`; const tw = g.measureText(title).width + 56;
    g.fillStyle = "#2E6E46"; rr(540 - tw / 2, y - 46, tw, 62, 31); g.fill();
    g.fillStyle = "#FFF8EA"; g.fillText(title, 540, y - 4); y += 74;
  }
  g.fillStyle = "#3A2A22"; g.font = `48px ${D}`;
  g.fillText(open ? (opened ? L(`선물 ${total}개 중 보낸 친구 ${solved}명을 맞혔어요`, `Guessed ${solved} of ${total} secret Santas`) : L(`선물 ${total}개가 열리길 기다려요`, `${total} gifts waiting to be opened`)) : L(`선물 ${total}개가 도착했어요`, `${total} gift${total === 1 ? "" : "s"} arrived!`), 540, y);
  g.fillStyle = "#7A6352"; g.font = `30px ${B}`;
  g.fillText(open ? L("누가 보냈는지 단서로 맞히는 크리스마스 놀이", "A Christmas game of guessing who sent what") : L("누가 보냈는지는 12월 25일에 맞혀 볼게요", "I'll guess who sent them on Dec 25"), 540, y + 52);
  g.fillStyle = "#B08A5A"; g.font = `28px ${D}`; g.fillText("moodnight.co.kr/santa", 540, 1312);
  return { canvas: c, total, solved, open };
}
async function openCard() {
  const btn = $("#cardBtn"); if (btn) btn.disabled = true;
  let r;
  try { r = await drawCard(); } catch (e) { toast(L("이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요", "Couldn't make the image. Please try again.")); if (btn) btn.disabled = false; return; }
  if (btn) btn.disabled = false;
  window.mnTrack && mnTrack("share", "card");
  const url = r.canvas.toDataURL("image/png");
  const blob = await new Promise(ok => r.canvas.toBlob(ok, "image/png"));
  const file = blob && new File([blob], `moodnight-santa-${r.open ? "result" : "room"}.png`, { type: "image/png" });
  const text = r.open ? L(`내 선물가게에서 선물 ${r.total}개 중 ${r.solved}명을 맞혔어! 너도 해 봐`, `I guessed ${r.solved} of ${r.total} secret Santas in my gift shop! Try it yourself`) : L(`내 선물가게에 선물 ${r.total}개가 도착했어. 너도 몰래 하나 두고 가!`, `${r.total} gifts are already in my gift shop. Leave one secretly too!`);
  const link = r.open ? `${location.origin}/santa/${EN ? "en" : ""}` : roomUrl();
  const canFile = file && navigator.canShare && navigator.canShare({ files: [file] });
  $("#overlay").hidden = false;
  sheet(`<div><h2>${r.open ? L("결과 카드", "Result card") : L("내 선물가게 이미지", "My gift shop image")}</h2><p class="sub">${L("메시지와 보낸 사람 이름은 이미지에 들어가지 않아요.", "Messages and sender names are never in the image.")}</p></div>
    <img class="card-shot" src="${url}" alt="${esc(L(`${room.display_name}의 선물가게 공유 카드`, `${POSS(room.display_name)} gift shop share card`))}">
    ${canFile ? `<button class="btn red wide" id="cardShare">${L("인스타·카톡으로 공유하기", "Share to Instagram & more")}</button>` : ""}
    <a class="btn ${canFile ? "ghost" : "red"} wide" id="cardSave" href="${url}" download="${file ? file.name : "moodnight-santa.png"}">${L("이미지 저장하기", "Save image")}</a>
    <p class="fine">${L(`휴대폰에서 저장이 안 되면 이미지를 꾹 눌러 저장해 주세요. 인스타 스토리에 올릴 땐 링크 스티커로 <b>${esc(link.replace(/^https?:\/\//, ""))}</b>를 붙여 주세요.`, `If saving doesn't work on your phone, press and hold the image. On Instagram Stories, add <b>${esc(link.replace(/^https?:\/\//, ""))}</b> as a link sticker.`)}</p>`);
  if ($("#cardShare")) $("#cardShare").onclick = () => { window.mnTrack && mnTrack("share", "card_native"); navigator.share({ files: [file], text: `${text}\n${link}` }).catch(() => {}); };
}

function renderHost() {
  const boxes = room.boxes;
  const visible = boxes.filter(b => !b.hidden);
  const opened = visible.filter(b => b.opened).length;
  const solved = visible.filter(b => b.result === "right").length;
  panel(`
  <div class="stack">
    <div id="nameView"><h2>${esc(L(`${room.display_name}의 선물가게`, `${POSS(room.display_name)} Gift Shop`))}</h2><p class="sub">${L("누가 보냈는지는 크리스마스에 직접 맞혀야 알 수 있어요.", "You'll only find out who sent what by guessing on Christmas.")} <button class="linkish" id="renameBtn">${L("이름 바꾸기", "Rename")}</button></p></div>
    <div id="nameEdit" class="stack" style="gap:10px" hidden>
      <span class="label">${L("친구들이 부르는 이름이나 별명 (2~3글자)", "The name or nickname your friends use (2–12 characters)")}</span>
      <input type="text" id="renameIn" maxlength="${EN ? 12 : 3}" value="${esc(room.display_name)}">
      <p class="err" id="renameErr" hidden></p>
      <div class="link-row"><button class="btn red" id="renameSave">${L("저장", "Save")}</button><button class="btn ghost" id="renameCancel">${L("취소", "Cancel")}</button></div>
    </div>
    <div class="stats">
      <div class="stat"><b>${visible.length}</b><span>${L("받은 선물", "Gifts")}</span></div>
      <div class="stat"><b>${opened}</b><span>${L("열어본 선물", "Opened")}</span></div>
      <div class="stat"><b>${solved}</b><span>${L("맞힌 친구", "Guessed")}</span></div>
    </div>
    <div class="count ${isOpen() ? "xmas" : ""}">
      ${isOpen()
        ? `<div><p>${L("크리스마스가 왔어요", "Christmas is here")}</p><strong>${L("선물 열기", "Open gifts")}</strong></div><p class="count-note">${L("방 안의 선물을 눌러 리본을 풀어 보세요", "Tap a gift in your room to untie the ribbon")}</p>`
        : `<div><p>${L("12월 25일 0시에 열려요", "Opens Dec 25, 00:00 (KST)")}</p><strong>D-${daysLeft()}</strong></div><p class="count-note">${L("그전엔 흔들어서 소리만 들을 수 있어요", "Until then, you can only shake them and listen")}</p>`}
    </div>
    ${isOpen() ? "" : `<button class="btn ghost wide" id="remindBtn">${L("📅 12월 25일 0시 알림 받기", "📅 Remind me on Dec 25")}</button>`}
    ${visible.length ? `<button class="btn ${isOpen() ? "red" : "ghost"} wide" id="cardBtn">${isOpen() ? L("결과 카드 만들기", "Make my result card") : L("내 선물가게 이미지 만들기", "Make a shareable image")}</button>` : ""}
    <div class="box">
      <span class="label">${L("내 선물가게 링크", "My gift shop link")}</span>
      <div class="link-row"><code id="linkTxt">${esc(roomUrl().replace(/^https?:\/\//, ""))}</code><button class="btn" id="copyBtn">${L("복사", "Copy")}</button></div>
      ${EN ? "" : `<button class="login kakao" id="kakaoShare">카카오톡으로 링크 보내기</button>`}
      ${navigator.share ? `<button class="btn ${EN ? "red" : "ghost"} wide" id="moreShare">${L("다른 앱으로 공유", "Share link")}</button>` : ""}
      <span class="sub" style="margin:0">${L("선물이 <b>3개만</b> 모여도 추리가 재밌어져요. 단톡방 하나에 올리는 걸로 충분해요. 인스타 스토리에는 링크를 복사해서 링크 스티커로 붙여 주세요.", "It gets fun with just <b>3 gifts</b>. One group chat is enough. For Instagram Stories, copy the link and add it as a link sticker.")}</span>
    </div>
    <p class="fine">${L("다음에 들어올 때도 처음 로그인한 방법으로 로그인해야 이 선물가게가 보여요.", "Next time, log in the same way to see this gift shop.")} <button class="linkish" id="logout">${L("로그아웃", "Log out")}</button> · <button class="linkish" id="delRoom">${L("선물가게 삭제", "Delete gift shop")}</button></p>
  </div>`);
  $("#renameBtn").onclick = () => { $("#nameView").hidden = true; $("#nameEdit").hidden = false; $("#renameIn").focus(); };
  $("#renameCancel").onclick = () => { $("#nameEdit").hidden = true; $("#nameView").hidden = false; };
  $("#renameSave").onclick = async () => {
    const name = cleanName($("#renameIn").value), e = $("#renameErr");
    if (!nameOk(name)) { e.textContent = L("이름은 2~3글자로 적어 주세요.", "Please use 2–12 characters."); e.hidden = false; return; }
    $("#renameSave").disabled = true;
    const { error } = await sb.from("rooms").update({ display_name: name }).eq("owner_id", session.user.id);
    if (error) { e.textContent = L("바꾸지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't rename. Please try again."); e.hidden = false; $("#renameSave").disabled = false; return; }
    await loadHost();
    toast(L("이름을 바꿨어요", "Renamed"));
  };
  $("#copyBtn").onclick = () => copyLink();
  if ($("#kakaoShare")) $("#kakaoShare").onclick = kakaoShare;
  if ($("#moreShare")) $("#moreShare").onclick = () => { window.mnTrack && mnTrack("share", "more"); navigator.share({ title: L(`${room.display_name}의 선물가게`, `${POSS(room.display_name)} Gift Shop`), text: L("누가 보냈게? 이름 숨기고 몰래 선물이랑 단서 남겨 줘. 크리스마스에 누가 보냈는지 맞혀 볼게!", "Guess who? Leave me a secret gift with a message and clues. I'll try to guess who sent it on Christmas!"), url: roomUrl() }).catch(() => {}); };
  $("#logout").onclick = logout;
  if ($("#cardBtn")) $("#cardBtn").onclick = openCard;
  if ($("#remindBtn")) $("#remindBtn").onclick = openRemind;
  $("#delRoom").onclick = askDelete;
  // 방 그림 바로 아래 버튼: 선물 목록, 이미지 저장 (방 그림을 꾹 눌러 저장하면 선물 없는 배경만 저장돼서)
  let bar = $("#roomTools");
  if (room.boxes.length) {
    if (!bar) { bar = document.createElement("div"); bar.id = "roomTools"; bar.className = "room-tools"; $("#room").after(bar); }
    bar.innerHTML = `<button class="room-card-btn" id="listBtn" aria-label="${L("받은 선물 목록", "Gift list")}">${L("☰ 선물 목록", "☰ Gift list")}</button>`
      + (visible.length ? `<button class="room-card-btn" id="roomCardBtn">${isOpen() ? L("📸 결과 카드", "📸 Result card") : L("📸 이미지 저장", "📸 Save image")}</button>` : "");
    $("#listBtn").onclick = openList;
    if ($("#roomCardBtn")) $("#roomCardBtn").onclick = openCard;
  } else if (bar) bar.remove();
}

/* ── 받은 선물 목록 (주인만) ──
 * 크리스마스 전: 상자와 흔든 소리만. 메시지는 개봉 전엔 서버가 주지 않아요.
 * 크리스마스 뒤: 연 선물은 메시지와 보낸 사람(맞혔거나 공개된 경우)까지, 안 연 선물은 "열기" */
async function openList() {
  $("#overlay").hidden = false;
  sheet(`<div><h2>${L("받은 선물", "Your gifts")}</h2><p class="sub">${L("불러오는 중…", "Loading…")}</p></div>`);
  const { data, error } = await sb.rpc("list_my_gifts");
  if (error) { toast(errMsg(error)); closeModal(); return; }
  const list = data || [], open = isOpen();
  const rows = list.map((g, i) => {
    const it = item(g.item);
    const tag = g.hidden ? `<span class="gl-tag off">${L("숨김", "Hidden")}</span>` : g.result === "right" ? `<span class="gl-tag ok">${L("정답", "Solved")}</span>` : g.result === "miss" ? `<span class="gl-tag">${L("공개", "Revealed")}</span>` : g.opened ? `<span class="gl-tag">${L("추리 중", "Guessing")}</span>` : "";
    let body;
    if (!open) body = `<p class="gl-sub">${L("흔들어 보니", "Shake:")} ${esc(it.shake)}</p>`;
    else if (!g.opened) body = `<p class="gl-sub">${L("아직 리본을 안 풀었어요", "Ribbon still tied")}</p>`;
    else body = `<p class="gl-item">${it.icon} ${esc(it.name)}</p><p class="gl-msg">${esc(g.message)}</p><p class="gl-from">From. ${g.sender_name ? esc(g.sender_name) : "???"}</p>`;
    const action = open ? `<span class="gl-go">${g.opened ? L("보기", "View") : L("열기", "Open")} ›</span>` : "";
    return `<li><button class="gl-row" data-id="${esc(g.id)}" ${open ? "" : "disabled"}>
      <span class="gift static w-${esc(g.wrap)}">${giftHTML()}</span>
      <span class="gl-text"><span class="gl-head"><b>${L("선물", "Gift")} ${i + 1}</b>${tag}</span>${body}</span>${action}</button></li>`;
  }).join("");
  const opened = list.filter(g => g.opened).length;
  sheet(`<div><h2>${L(`받은 선물 ${list.length}개`, `${list.length} gift${list.length === 1 ? "" : "s"}`)}</h2><p class="sub">${open ? L(`${opened}개를 열어 봤어요. 선물을 누르면 단서를 보고 보낸 사람을 맞힐 수 있어요.`, `You've opened ${opened}. Tap a gift to read the clues and guess the sender.`) : L("메시지는 12월 25일에 선물을 열면 여기서 한 번에 볼 수 있어요.", "Once you open them on Dec 25, all the messages show up here.")}</p></div>
    <ul class="gift-list">${rows}</ul>`);
  document.querySelectorAll(".gl-row:not(:disabled)").forEach(b => b.onclick = () => {
    const box = room.boxes.find(x => x.id === b.dataset.id); if (box) openModal(box);
  });
}

async function copyLink() {
  window.mnTrack && mnTrack("share", "copy");
  try { await navigator.clipboard.writeText(roomUrl()); toast(L("링크를 복사했어요", "Link copied")); }
  catch (e) { const r = document.createRange(); r.selectNodeContents($("#linkTxt")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(L("링크를 선택했어요. 길게 눌러 복사하세요", "Link selected. Press and hold to copy")); }
}

function kakaoShare() {
  window.mnTrack && mnTrack("share", "kakao");
  const url = roomUrl();
  try {
    Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: `누가 보냈게? ${room.display_name}에게 몰래 선물하기 🎁`,
        description: "이름 숨기고 가상 선물에 메시지와 단서를 남겨 줘. 크리스마스에 누가 보냈는지 맞혀 볼게! 로그인 없이 1분",
        imageUrl: "https://www.moodnight.co.kr/santa/og.png?v=6",
        imageWidth: 1200,
        imageHeight: 630,
        link: { mobileWebUrl: url, webUrl: url }
      },
      buttons: [{ title: "몰래 선물하러 가기", link: { mobileWebUrl: url, webUrl: url } }]
    });
  } catch (e) { copyLink(); }
}

/* ── 크리스마스 알림: 휴대폰 캘린더에 일정 추가 (서버 없이) ──
 * 12월 25일 0시(한국 시간) 일정 + 하루 전·당일 알림. 일정 안에 내 선물가게 링크가 들어가요 */
function openRemind() {
  const url = `${location.origin}/santa/r/${room.slug}${EN ? "?lang=en" : ""}`;
  const title = L(`🎁 ${room.display_name}의 선물가게 개봉!`, `🎁 Open ${POSS(room.display_name)} gift shop!`);
  const desc = L(`크리스마스예요! 친구들이 두고 간 선물을 열고 누가 보냈는지 맞혀 보세요.\n${url}`, `It's Christmas! Open the gifts your friends left and guess who sent each one.\n${url}`);
  const gcal = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(title) + "&dates=20261224T150000Z/20261224T153000Z&details=" + encodeURIComponent(desc) + "&location=" + encodeURIComponent(url);
  const esc2 = v => String(v).replace(/[\\;,]/g, m => "\\" + m).replace(/\n/g, "\\n");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//moodnight//santa//KO", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:santa-${room.slug}-2026@moodnight.co.kr`, "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, ""),
    "DTSTART:20261224T150000Z", "DTEND:20261224T153000Z", "SUMMARY:" + esc2(title), "DESCRIPTION:" + esc2(desc), "URL:" + url,
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + esc2(L("내일 0시에 선물이 열려요", "Your gifts open tomorrow at midnight")), "TRIGGER:-P1D", "END:VALARM",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + esc2(title), "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const icsUrl = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  $("#overlay").hidden = false;
  sheet(`<div><h2>${L("크리스마스 알림 받기", "Christmas reminder")}</h2><p class="sub">${L("휴대폰 캘린더에 12월 25일 0시 일정을 넣어 둘게요. 하루 전과 당일 0시에 알림이 울리고, 일정을 누르면 바로 내 선물가게로 와요.", "We'll add a Dec 25, 00:00 (KST) event to your calendar. You'll get a reminder the day before and at midnight, and the event links straight to your gift shop.")}</p></div>
    <a class="btn red wide" id="remIcs" href="${icsUrl}" download="moodnight-christmas.ics">${L("아이폰 캘린더에 추가", "Add to iPhone calendar")}</a>
    <a class="btn ghost wide" id="remG" href="${gcal}" target="_blank" rel="noopener">${L("구글 캘린더에 추가 (갤럭시)", "Add to Google Calendar (Android)")}</a>
    <p class="fine">${L("카카오톡 안에서 열었다면 오른쪽 위 ⋯ 메뉴에서 '다른 브라우저로 열기'를 누른 뒤 추가해 주세요.", "If this doesn't work inside a chat app, open the page in your browser first.")}</p>`);
  $("#remIcs").onclick = () => { window.mnTrack && mnTrack("act", "remind"); };
  $("#remG").onclick = () => { window.mnTrack && mnTrack("act", "remind"); };
}

function askDelete() {
  $("#overlay").hidden = false;
  sheet(`<div><h2>${L("선물가게를 삭제할까요?", "Delete your gift shop?")}</h2><p class="sub">${L(`받은 선물 ${room.boxes.length}개와 메시지, 단서, 맞히기 기록이 모두 지워지고 되돌릴 수 없어요. 친구들이 가진 링크도 더는 열리지 않아요.`, `All ${room.boxes.length} gifts, messages, clues and guesses will be deleted for good. Your friends' links will stop working.`)}</p></div>
    <button class="btn red wide" id="delYes">${L("삭제하기", "Delete")}</button><button class="btn ghost wide" id="delNo">${L("취소", "Cancel")}</button>`);
  $("#delNo").onclick = closeModal;
  $("#delYes").onclick = async () => {
    $("#delYes").disabled = true;
    const { error } = await sb.rpc("delete_my_room");
    if (error) { $("#delYes").disabled = false; return toast(errMsg(error)); }
    $("#overlay").hidden = true; room = null; $("#roomTools") && $("#roomTools").remove();
    renderTop(); renderGifts(); renderCreate(); toast(L("선물가게를 삭제했어요", "Gift shop deleted"));
  };
}

async function logout() { await sb.auth.signOut(); session = null; room = null; $("#roomTools") && $("#roomTools").remove(); renderTop(); renderGifts(); renderLogin(); }



/* 진짜 선물 (쿠팡 파트너스) */
const realList = () => (window.REAL_GIFTS || []).filter(g => /^https:\/\/(link\.coupang\.com|www\.coupang\.com|coupa\.ng)\//.test(g.url || "")).map(localize);
const realById = id => realList().find(g => g.id === id);
const buyable = id => !EN && realById(id);  // 쿠팡은 한국 사용자에게만
const realTiers = () => (window.REAL_GIFT_TIERS || []).filter(t => realList().some(g => g.tier === t));
/* 보내는 사람이 고르는 선물 6개: 가격대마다 1개씩 + 1개 더, 들어올 때마다 랜덤. "다른 선물 보기"로 다시 섞기 */
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let PICKS = [];
function reshuffle(keep) {
  const all = realList(), out = keep && realById(keep) ? [keep] : [];
  for (const t of realTiers()) { if (out.length >= 6) break; const g = shuffle(all.filter(x => x.tier === t && !out.includes(x.id)))[0]; if (g && !out.some(id => realById(id).tier === t)) out.push(g.id); }
  for (const g of shuffle(all)) { if (out.length >= 6) break; if (!out.includes(g.id)) out.push(g.id); }
  const order = all.map(g => g.id); PICKS = out.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
const picks = () => { if (!PICKS.length) reshuffle(); return PICKS.map(id => realById(id)).filter(Boolean); };
let lastItem = null;
const DISCLOSURE = "이 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";
function buyCard(id) {
  const g = buyable(id); if (!g) return "";
  return `<div class="real-card">
    <div class="real-row"><span class="real-icon">${g.icon}</span><div><b>${esc(g.name)}</b><p>“${esc(g.line)}”</p></div></div>
    <a class="buy-link" href="${esc(g.url)}" target="_blank" rel="sponsored noopener"><span>🛒 이거 어디서 팔아?</span><small>쿠팡에서 보기 →</small></a>
    <p class="fine" style="margin:0">${DISCLOSURE}</p>
  </div>`;
}
function realCard(id, forReal, sender) {
  const g = buyable(id); if (!g) return "";
  const head = forReal ? `<span class="real-badge">🎁 진짜로 준비했대요!</span>` : `<span class="label">산타가 몰래 넣은 선물</span>`;
  const note = forReal
    ? (sender ? `맞혔으니 ${esc(sender)}님에게 직접 받으러 가세요.` : "누가 보냈는지 맞히고 직접 받으러 가세요.")
    : `마음만 담았대요.${sender ? ` 진짜로 받고 싶다면 ${esc(sender)}님에게 졸라 보세요.` : ""}`;
  return `<div class="real-card ${forReal ? "for-real" : ""}">
    ${head}
    <div class="real-row"><span class="real-icon">${g.icon}</span><div><b>${esc(g.name)}</b>${forReal ? "" : `<p>“${esc(g.line)}”</p>`}</div></div>
    <p class="sub" style="margin:0">${note}</p>
    <a class="buy-link" href="${esc(g.url)}" target="_blank" rel="sponsored noopener"><span>🛒 이거 어디서 팔아?</span><small>쿠팡에서 보기 →</small></a>
    <p class="fine" style="margin:0">${DISCLOSURE}</p>
  </div>`;
}

/* ── 방 아래 안내 카드 ── */
function renderSide() {
  const el = $("#sideCard"); if (!el) return;
  const n = room ? room.boxes.filter(b => !b.hidden).length : 0;
  const meta = room ? `<div class="side-meta"><span>${L(`이 방의 선물 ${n}개`, `${n} gift${n === 1 ? "" : "s"} here`)}</span><span>${isOpen() ? L("개봉 중", "Opening now") : L(`12월 25일 0시 개봉 · D-${daysLeft()}`, `Opens Dec 25 · D-${daysLeft()}`)}</span></div>` : "";
  const flow = `<ol class="flow">
      <li><b>${L("링크 공유", "Share")}</b>${L("내 선물가게 링크를 카톡이나 인스타에 올려요", "Post your gift shop link in a chat or on Instagram")}</li>
      <li><b>${L("몰래 선물", "Secret gifts")}</b>${L("친구들이 선물과 메시지, 단서를 두고 가요", "Friends leave gifts, messages and clues")}</li>
      <li><b>${L("열고 맞히기", "Open & guess")}</b>${L("12월 25일에 열고 누가 보냈는지 맞혀요", "Open on Dec 25 and guess who sent each one")}</li>
    </ol>`;
  el.classList.remove("desk-only");
  if (MODE === "guest" && !sent && !isOpen() && room) {
    const it = draft.item ? item(draft.item) : null;
    const wrapName = (WRAPS.find(w => w.id === draft.wrap) || WRAPS[0]).name;
    el.innerHTML = `<h3>${L("지금 포장 중인 선물", "Your gift so far")}</h3>
      <div class="preview"><span class="gift static w-${draft.wrap}">${giftHTML()}</span>
        <div><b>${esc(wrapName)}${L(" 포장", " wrap")}${it ? ` · ${it.icon} ${esc(it.name)}` : ""}</b><p>${it ? L(`흔들면 ${it.shake}.`, `When shaken: ${it.shake}.`) : L("상자 속에 넣을 선물을 골라 주세요.", "Pick what goes in the box.")}</p><p>${L(`보내면 ${esc(room.display_name)}님 방 트리 아래에 놓여요.`, `It'll go under ${esc(POSS(room.display_name))} tree.`)}</p></div></div>${meta}`;
    el.classList.add("desk-only");
  } else if (MODE === "guest" && room) {
    el.innerHTML = `<h3>${L("산타의 선물가게는 이렇게 놀아요", "How Santa's Gift Shop works")}</h3>${flow}${meta}`;
  } else {
    el.innerHTML = `<h3>${L("이렇게 진행돼요", "How it works")}</h3>${flow}${meta}`;
    if (room) el.classList.add("desk-only");
  }
  el.hidden = false;
  const wrap = $("#sideWrap"); if (wrap) { wrap.hidden = false; wrap.classList.toggle("desk-only", el.classList.contains("desk-only")); }
}

/* ── 친구: 선물 보내기 ── */
/* 단서 도우미 */
const HINT_IDEAS = EN ? [
  "We first met at ___", "I'm obsessed with ___", "The last place we went together was ___",
  "My MBTI is ___", "Lately I'm really into ___", "You and I once ___ together",
  "My profile picture is ___", "I live in ___", "A friend we both know is ___"
] : [
  "우리는 ___에서 처음 만났어요", "나는 ___를 정말 좋아해요", "우리가 마지막으로 같이 간 곳은 ___",
  "내 MBTI는 ___", "나는 요즘 ___에 빠져 있어요", "너랑 같이 ___ 해본 적 있어요",
  "내 카톡 프로필 사진은 ___", "나는 ___ 살아요", "우리 둘 다 아는 친구는 ___"
];
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
function initialHint(name) {
  const c = (name || "").trim().charCodeAt(0);
  const ch = (name || "").trim()[0];
  if (c >= 0xAC00 && c <= 0xD7A3) { const cho = CHO[Math.floor((c - 0xAC00) / 588)]; return L(`내 이름은 '${cho}'으로 시작해요`, `My name starts with '${cho}' (Korean initial)`); }
  return ch ? L(`내 이름은 '${ch.toUpperCase()}'(으)로 시작해요`, `My name starts with '${ch.toUpperCase()}'`) : "";
}
const hintCount = () => draft.autoInitial ? 2 : 3;
let ideaPage = 0;

function renderSend() {
  if (sent) return renderSent();
  if (isOpen()) {
    panel(`<div class="stack"><div><h2>${L("선물 보내기가 마감됐어요", "Gift sending has closed")}</h2><p class="sub">${L(`${esc(room.display_name)}님은 이미 선물을 열어 보고 있어요. 내년에는 나만의 선물가게도 만들어 보세요.`, `${esc(room.display_name)} is already opening gifts. Make your own gift shop next year!`)}</p></div><a class="btn red wide" href="/santa/">${L("나도 선물가게 만들기", "Make my own gift shop")}</a></div>`);
    return;
  }
  const d = draft, host = esc(room.display_name);
  let stepNo = 0; const st = () => ++stepNo;
  panel(`
  <div class="stack" style="gap:28px">
    <div><h2>${L(`${host}에게 몰래 선물하기`, `Leave ${host} a secret gift`)}</h2>
      <ol class="how">
        <li data-i="🎁"><b>${L("몰래 두고 가기", "Drop it off secretly")}</b>${L("가상 선물 상자에 메시지를 담고, 나를 맞힐 단서 3개를 남겨요", "Put a message in a virtual gift box and leave 3 clues about who you are")}</li>
        <li data-i="🎄"><b>${L("12월 25일 개봉", "Opens Dec 25")}</b>${L(`크리스마스 0시에 ${host}님이 선물을 열어요`, `${host} opens the gifts at midnight on Christmas`)}</li>
        <li data-i="🔍"><b>${L("누구게?", "Guess who?")}</b>${L(`${host}님이 단서를 보고 보낸 사람을 맞혀요. 틀릴 때마다 단서가 하나씩 더 열려요`, `${host} reads your clues and guesses who sent it. Each wrong guess unlocks one more clue`)}</li>
      </ol>
      <p class="sub how-note">${L("이름은 맞히기 전까지 숨겨져요 · 무료 · 로그인 없이 1분", "Your name stays hidden until guessed · Free · 1 minute, no sign-up")}</p></div>
    <div class="step">
      <div class="step-h"><i>${st()}</i>${L("포장지 고르기", "Pick a wrapping")}</div>
      <div class="wraps">${WRAPS.map(w => `<button class="wrap-opt" data-wrap="${w.id}" aria-pressed="${d.wrap === w.id}"><span class="gift static w-${w.id}">${giftHTML()}</span>${w.name}</button>`).join("")}</div>
    </div>
    <div class="step">
      <div class="step-h"><i>${st()}</i>${L("상자 속 선물", "What's in the box")} <small>${L("진짜 사는 게 아니라 마음만 담는 가상 선물이에요", "It's a virtual gift. You're not buying anything, it's the thought that counts")}</small></div>
      <div class="items">${picks().map(g => `<button class="item-opt" data-item="${g.id}" aria-pressed="${d.item === g.id}"><b>${g.icon}</b>${esc(g.name)}</button>`).join("")}</div>
      <button type="button" class="chip more" id="morePicks" style="justify-self:start">${L("다른 선물 보기 ↻", "Show other gifts ↻")}</button>
    </div>
    <div class="step">
      <div class="step-h"><i>${st()}</i>${L("메시지", "Message")}</div>
      <textarea id="msg" maxlength="200" placeholder="${L("크리스마스에 열어볼 메시지를 남겨 주세요", "Write a message to be opened on Christmas")}">${esc(d.msg)}</textarea>
      <div class="meta"><span>${L("말투에서 들키지 않게 조심하세요", "Careful, your writing style might give you away")}</span><span id="msgCount">${d.msg.length}/200</span></div>
    </div>
    <div class="step">
      <div class="step-h"><i>${st()}</i>${L("나를 맞힐 단서", "Clues about you")}</div>
      <p class="sub" style="margin:0">${L("틀릴 때마다 하나씩 열려요. 어려운 단서부터 써 주세요.", "One unlocks with each wrong guess. Start with the hardest.")}</p>
      <div class="chips" aria-label="${L("단서 아이디어", "Clue ideas")}">${[0, 1, 2].map(k => { const i = (ideaPage * 3 + k) % HINT_IDEAS.length; return `<button type="button" class="chip" data-idea="${i}">${esc(HINT_IDEAS[i].replace("___", "○○"))}</button>`; }).join("")}<button type="button" class="chip more" id="moreIdeas">${L("다른 예시 ↻", "More ideas ↻")}</button></div>
      <div class="hint-in">${[0, 1, 2].map(n => n < hintCount() ? `<input type="text" id="hint${n}" maxlength="40" value="${esc(d.hints[n])}" placeholder="${(EN ? ["Clue revealed 1st (hardest)", "Clue revealed 2nd", "Clue revealed 3rd (easiest)"] : ["첫 번째로 공개될 단서", "두 번째로 공개될 단서", "세 번째로 공개될 단서"])[n]}">` : `<div class="auto-hint">${L("세 번째로 공개될 단서", "Clue revealed 3rd")} · ${d.name.trim() ? esc(initialHint(d.name)) : L("이름을 적으면 초성으로 자동 완성돼요", "Fills in automatically with your first letter")}</div>`).join("")}</div>
      <label class="check" for="autoInitial"><input type="checkbox" id="autoInitial" ${d.autoInitial ? "checked" : ""}> ${L("마지막 단서는 이름 초성으로 자동", "Make the last clue my first initial")}</label>
    </div>
    <div class="step">
      <div class="step-h"><i>${st()}</i>${L("내 이름", "Your name")} <small>${L("정답으로만 쓰여요", "Only used as the answer")}</small></div>
      <input type="text" id="name" maxlength="10" value="${esc(d.name)}" placeholder="${L(`${host}님이 부르는 이름`, `What ${host} calls you`)}">
    </div>
    <details class="step opt" ${d.decoys.some(x => x) ? "open" : ""}>
      <summary class="step-h"><i>+</i>${L("헷갈리게 할 친구 이름", "Decoy names")} <small>${L("선택 · 안 써도 돼요", "Optional · you can skip this")}</small></summary>
      <p class="sub" style="margin:0">${L("보기는 이 방에 선물을 보낸 다른 친구들 이름으로 자동으로 만들어져요. 선물이 적은 방에서는 여기 적은 이름이 보기로 쓰여요.", "Answer choices are made from other senders' names. If there aren't many gifts yet, these names fill in the choices.")}</p>
      <div class="decoys">${[0, 1, 2].map(n => `<input type="text" id="decoy${n}" maxlength="10" value="${esc(d.decoys[n])}" placeholder="${(EN ? ["e.g. Jake", "e.g. Mia", "e.g. Sam"] : ["예: 재훈", "예: 뽀삐", "예: 이나"])[n]}">`).join("")}</div>
    </details>
    ${draftErr ? `<p class="err">${esc(draftErr)}</p>` : ""}
    <button class="btn red wide" id="sendBtn">${L("선물 몰래 두고 오기", "Leave my secret gift")}</button>
    <p class="fine">${L(`욕설이나 상처 주는 메시지는 신고되면 삭제돼요. <a href="/terms.html">이용약관</a>`, `Hurtful messages are removed when reported. <a href="/terms.html">Terms</a>`)}</p>
  </div>`);
  document.querySelectorAll("[data-wrap]").forEach(b => b.onclick = () => { draft.wrap = b.dataset.wrap; renderSend(); renderSide(); });
  document.querySelectorAll("[data-item]").forEach(b => b.onclick = () => { draft.item = b.dataset.item; renderSend(); renderSide(); });
  $("#msg").oninput = e => { draft.msg = e.target.value; $("#msgCount").textContent = `${draft.msg.length}/200`; };
  [0, 1, 2].forEach(n => { if ($("#hint" + n)) $("#hint" + n).oninput = e => draft.hints[n] = e.target.value; $("#decoy" + n).oninput = e => draft.decoys[n] = e.target.value; });
  $("#name").oninput = e => { draft.name = e.target.value; const a = document.querySelector(".auto-hint"); if (a) a.textContent = L("세 번째로 공개될 단서", "Clue revealed 3rd") + " · " + (draft.name.trim() ? initialHint(draft.name) : L("이름을 적으면 초성으로 자동 완성돼요", "Fills in automatically with your first letter")); };
  document.querySelectorAll("[data-tier]").forEach(b => b.onclick = () => { draft.realTier = b.dataset.tier; renderSend(); });
  $("#moreIdeas").onclick = () => { ideaPage++; renderSend(); };
  $("#morePicks").onclick = () => { reshuffle(draft.item); renderSend(); };
  $("#autoInitial").onchange = e => { draft.autoInitial = e.target.checked; renderSend(); };
  document.querySelectorAll("[data-idea]").forEach(b => b.onclick = () => {
    const n = [0, 1, 2].slice(0, hintCount()).find(i => !draft.hints[i].trim());
    if (n === undefined) { toast(L("단서 칸이 다 찼어요. 바꾸고 싶은 칸을 지우고 다시 눌러 주세요", "All clue boxes are filled. Clear one and tap again")); return; }
    const text = HINT_IDEAS[+b.dataset.idea]; draft.hints[n] = text;
    const el = $("#hint" + n); el.value = text; el.focus();
    const at = text.indexOf("___"); if (at >= 0) el.setSelectionRange(at, at + 3);
  });
  $("#sendBtn").onclick = sendGift;
}

async function sendGift() {
  const d = draft;
  const norm = s => s.replace(/\s/g, "").toLowerCase();
  if (!d.item) draftErr = L("상자에 넣을 선물을 골라 주세요.", "Pick what goes in the box.");
  else if (d.msg.trim().length < 5) draftErr = L("메시지를 5자 이상 써 주세요.", "Write at least 5 characters.");
  else if (!d.name.trim()) draftErr = L("정답이 될 내 이름을 적어 주세요.", "Enter your name (it's the answer).");
  else if (d.hints.slice(0, hintCount()).some(h => !h.trim())) draftErr = L(`단서 ${hintCount()}개를 모두 채워 주세요. 위의 아이디어 버튼을 눌러도 돼요.`, `Fill in all ${hintCount()} clues. You can tap an idea above.`);
  else if (d.hints.slice(0, hintCount()).some(h => h.includes("___"))) draftErr = L("단서의 ___ 부분을 채워 주세요.", "Fill in the ___ in your clue.");
  else if (d.decoys.some(x => x.trim() && norm(x) === norm(d.name))) draftErr = L("헷갈리게 할 이름에 내 이름이 들어가 있어요.", "One of the decoy names is your own name.");
  else draftErr = "";
  if (draftErr) { renderSend(); return; }
  $("#sendBtn").disabled = true; $("#sendBtn").textContent = L("두고 오는 중…", "Dropping it off…");
  const { data: id, error } = await sb.rpc("send_gift", {
    p_slug: room.slug, p_wrap: d.wrap, p_item: d.item, p_message: d.msg.trim(),
    p_hints: d.autoInitial ? [d.hints[0].trim(), d.hints[1].trim(), initialHint(d.name)] : d.hints.map(h => h.trim()), p_sender_name: d.name.trim(),
    p_decoys: d.decoys.map(x => x.trim()).filter(Boolean),
    p_real_gift: null,
    p_real_for_real: false
  });
  if (error) { draftErr = errMsg(error); renderSend(); return; }
  window.mnTrack && mnTrack("act", "gift");
  sent = true; lastItem = d.item;
  draft = freshDraft();
  await refreshRoom(id);
  renderSent(); renderSide();
}

function renderSent() {
  const host = esc(room.display_name);
  panel(`
  <div class="stack">
    <div class="sent-mark" aria-hidden="true"><span class="gift static w-gold">${giftHTML()}</span></div>
    <div><h2>${L("선물을 몰래 두고 왔어요", "Your secret gift is under the tree")}</h2><p class="sub">${L(`12월 25일에 ${host}님이 선물을 열고 누가 보냈는지 맞혀 볼 거예요. 그때까지 들키지 않게 조심하세요.`, `On Dec 25, ${host} will open it and try to guess who sent it. Don't give yourself away until then!`)}</p></div>
    ${buyable(lastItem) ? `<div class="real-card"><span class="label">상자에 담은 선물</span>${buyCard(lastItem).replace(/^<div class="real-card">|<\/div>$/g, "")}</div>` : ""}
    <a class="btn red wide" href="/santa/${EN ? "en" : ""}">${L("나도 선물가게 만들기", "Make my own gift shop")}</a>
    <button class="btn ghost wide" id="again">${L("선물 하나 더 보내기", "Send another gift")}</button>
    <!-- 광고 자리: 애드핏/애드센스 승인 후 이 아래에 광고 코드를 넣어요 -->
    <div class="ad-slot" id="adSent" hidden></div>
  </div>`);
  $("#again").onclick = () => { sent = false; renderSend(); renderSide(); };
}

/* ── 방 주인: 개봉과 추리 ── */
let cur = null, view = null;
async function openModal(box) {
  cur = box; view = null;
  $("#overlay").hidden = false;
  if (!box.opened) { renderUnwrap(); return; }
  await fetchView();
}
async function fetchView() {
  const { data, error } = await sb.rpc("open_gift", { p_gift_id: cur.id });
  if (error) { toast(errMsg(error)); closeModal(); return; }
  view = data; renderModal();
}
function renderUnwrap() {
  sheet(`<div><h2>${L("누군가 두고 간 선물", "Someone left you a gift")}</h2><p class="sub">${item(cur.item).shake}.</p></div>
    <div class="stage-gift"><span class="gift static w-${cur.wrap}" id="bigGift">${giftHTML()}</span></div>
    <button class="btn red wide" id="unwrapBtn">${L("리본 풀기", "Untie the ribbon")}</button>`);
  $("#unwrapBtn").onclick = () => { $("#bigGift").classList.add("unwrap"); $("#unwrapBtn").disabled = true; setTimeout(fetchView, 700); };
}
function renderModal(reportOpen) {
  const v = view, it = item(v.item);
  const lives = 3 - v.wrong_guesses.length;
  const wrongSet = new Set(v.wrong_guesses.map(s => s.replace(/\s/g, "")));
  const hintsHTML = [0, 1, 2].map(n => n < v.hints.length ? `<li><em>${L("단서", "Clue")} ${n + 1}</em>${esc(v.hints[n])}</li>` : `<li class="locked"><em>${L("단서", "Clue")} ${n + 1}</em>${L("틀리면 열려요", "Unlocks after a wrong guess")}</li>`).join("");
  let guessHTML = "";
  if (!v.result) {
    guessHTML = v.candidates
      ? `<div class="cands">${v.candidates.map(c => { const w = wrongSet.has(String(c).replace(/\s/g, "")); return `<button class="cand ${w ? "wrong" : ""}" data-c="${esc(c)}" ${w ? "disabled" : ""}>${esc(c)}</button>`; }).join("")}</div>`
      : `<div class="guess-input"><input type="text" id="guessIn" maxlength="10" placeholder="${L("보낸 사람 이름", "Sender's name")}"><button class="btn" id="guessBtn">${L("맞히기", "Guess")}</button></div>
         ${v.wrong_guesses.length ? `<p class="sub" style="margin:0">${L("아니었던 이름", "Not them")}: ${v.wrong_guesses.map(esc).join(", ")}</p>` : ""}`;
  }
  const result = v.result === "right"
    ? `<div class="result"><b>${L("정답!", "Correct!")}</b> ${L(`단서 ${v.wrong_guesses.length + 1}개 만에 맞혔어요. ${esc(v.sender_name)}에게 고맙다고 답장해 보세요.`, `You got it with ${v.wrong_guesses.length + 1} clue${v.wrong_guesses.length ? "s" : ""}. Send ${esc(v.sender_name)} a thank-you!`)}</div>`
    : v.result === "miss" ? `<div class="result"><b>${L("아쉽게 놓쳤어요", "So close!")}</b> ${L(`이 선물은 ${esc(v.sender_name)}님이 보냈어요.`, `This one was from ${esc(v.sender_name)}.`)}</div>` : "";
  sheet(`
    <div class="letter">
      <span class="item">${it.icon} ${esc(it.name)}</span>
      <p>To. ${esc(room.display_name)}\n${esc(v.message)}</p>
      <div class="from">${v.result ? `<span class="stamp ${v.result === "right" ? "" : "miss"}">${v.result === "right" ? L("정답", "Solved") : L("공개", "Revealed")}</span>` : ""}From. ${v.result ? esc(v.sender_name) : `<span class="q">???</span>`}</div>
    </div>
    ${realById(v.item) ? buyCard(v.item) : ""}
    ${v.real_gift ? realCard(v.real_gift, v.real_for_real, v.result ? v.sender_name : null) : ""}
    <div class="guess-h"><h2 style="font-size:1.15rem">${L("보낸 친구는 누구일까요?", "Who sent this?")}</h2>${v.result ? "" : `<span class="lives" aria-label="${L(`남은 기회 ${lives}번`, `${lives} tries left`)}">${"●".repeat(lives)}${"○".repeat(3 - lives)}</span>`}</div>
    <ul class="hints">${hintsHTML}</ul>
    ${guessHTML}${result}
    <div class="mod-row">
      <button class="linkish" id="hideBtn">${cur.hidden ? L("다시 보이기", "Show again") : L("이 선물 숨기기", "Hide this gift")}</button>
      <button class="linkish" id="reportBtn">${L("신고하기", "Report")}</button>
    </div>
    ${reportOpen ? `<div class="report"><label for="reportWhy" class="label">${L("어떤 문제가 있나요?", "What's wrong?")}</label><textarea id="reportWhy" maxlength="200" placeholder="${L("예: 욕설이 있어요", "e.g. It's abusive")}"></textarea><button class="btn red" id="reportSend">${L("신고하고 숨기기", "Report & hide")}</button></div>` : ""}`);
  document.querySelectorAll(".cand:not(:disabled)").forEach(b => b.onclick = () => guess(b.dataset.c));
  if ($("#guessBtn")) { const go = () => { const n = $("#guessIn").value.trim(); if (n) guess(n); }; $("#guessBtn").onclick = go; $("#guessIn").onkeydown = e => { if (e.key === "Enter") go(); }; }
  $("#hideBtn").onclick = async () => {
    const { error } = await sb.rpc("hide_gift", { p_gift_id: cur.id, p_hidden: !cur.hidden });
    if (error) return toast(errMsg(error));
    cur.hidden = !cur.hidden; toast(cur.hidden ? L("선물을 숨겼어요. 다른 친구들에게도 안 보여요", "Hidden. Other friends won't see it either") : L("다시 보이게 했어요", "Visible again")); renderModal();
  };
  $("#reportBtn").onclick = () => renderModal(true);
  if ($("#reportSend")) $("#reportSend").onclick = async () => {
    const { error } = await sb.rpc("report_gift", { p_gift_id: cur.id, p_reason: $("#reportWhy").value.trim() });
    if (error) return toast(errMsg(error));
    toast(L("신고했어요. 운영자가 확인할게요", "Reported. We'll take a look")); cur.hidden = true; closeModal();
  };
}
async function guess(name) {
  const before = view.wrong_guesses.length;
  const { data, error } = await sb.rpc("guess_sender", { p_gift_id: cur.id, p_name: name });
  if (error) return toast(errMsg(error));
  view = data;
  if (!view.result && view.wrong_guesses.length > before) toast(L(`${name}님은 아니에요. 단서 하나가 더 열렸어요`, `Not ${name}. One more clue unlocked`));
  renderModal();
}
function sheet(inner) {
  $("#overlay").innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${L("선물 열기", "Gift")}"><button class="close" id="closeBtn" aria-label="${L("닫기", "Close")}">×</button>${inner}</div>`;
  $("#closeBtn").onclick = closeModal;
}
async function closeModal() { $("#overlay").hidden = true; cur = null; await refreshRoom(); }
$("#overlay").addEventListener("click", e => { if (e.target.id === "overlay") closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && cur) closeModal(); });

/* ── 불러오기 ── */
async function refreshRoom(newId) {
  if (!room) return;
  const { data } = await sb.rpc("get_room", { p_slug: room.slug });
  if (data) room = data;
  renderTop(); renderGifts(newId);
  if (MODE === "host") renderHost();
}

async function loadHost() {
  try { const d = localStorage.getItem("mn_device"); if (d && !window.DEMO) sb.rpc("mark_admin_device", { p_device: d }).then(() => {}, () => {}); } catch (e) {}  // 관리자 기기면 방문 숫자에서 빼요
  const { data: mine } = await sb.from("rooms").select("slug").eq("owner_id", session.user.id).maybeSingle();
  if (!mine) { room = null; renderTop(); renderGifts(); renderCreate(); return; }
  const { data } = await sb.rpc("get_room", { p_slug: mine.slug });
  room = data; renderTop(); renderGifts(); renderHost();
}

async function loadGuest() {
  const { data, error } = await sb.rpc("get_room", { p_slug: pathSlug });
  if (error || !data) {
    renderTop(); renderGifts();
    panel(`<div class="stack"><div><h2>${L("선물가게를 찾을 수 없어요", "Gift shop not found")}</h2><p class="sub">${L("링크가 잘못됐거나 선물가게가 삭제됐어요. 링크를 보낸 친구에게 다시 확인해 주세요.", "The link may be wrong, or the gift shop was deleted. Check with the friend who sent it.")}</p></div><a class="btn red wide" href="/santa/${EN ? "en" : ""}">${L("나도 선물가게 만들기", "Make my own gift shop")}</a></div>`);
    return;
  }
  if (data.is_owner && !window.DEMO) { location.replace("/santa/"); return; }
  room = data; document.title = L(`${room.display_name}의 선물가게 | 산타의 선물가게`, `${POSS(room.display_name)} Gift Shop | Santa's Gift Shop`);
  renderTop(); renderGifts(); renderSend();
}

(async function init() {
  const { data } = await sb.auth.getSession();
  session = data.session;
  if (MODE === "guest") return loadGuest();
  if (!session) { renderTop(); renderGifts(); renderLogin(); return; }
  if (location.hash.includes("access_token")) history.replaceState(null, "", "/santa/" + location.search);
  loadHost();
})();
sb.auth.onAuthStateChange((evt, s) => {
  if (MODE === "host" && evt === "SIGNED_IN" && !session) { session = s; loadHost(); }
});
