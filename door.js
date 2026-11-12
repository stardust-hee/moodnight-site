/* 무드나잇 문 전환: 성탄맨션 ↔ 산타의 선물가게를 오갈 때 도트 문이 닫혔다가 열려요.
 * 링크에 data-door="문에 붙일 간판 글자"를 달면 돼요. 동적으로 생긴 링크도 돼요. */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = document.createElement("style");
  css.textContent = `
.mn-door{position:fixed;inset:0;z-index:90;pointer-events:none;display:grid;grid-template-columns:1fr 1fr}
.mn-door i{display:block;height:100%;background:#4A2A1C;box-shadow:inset 0 0 0 6px #2A160E,inset 0 0 0 10px #6A3E26;transition:transform .42s steps(6)}
.mn-door i:first-of-type{transform:translateX(-101%);background-image:repeating-linear-gradient(90deg,transparent 0 22px,rgba(0,0,0,.18) 22px 26px)}
.mn-door i:last-of-type{transform:translateX(101%);background-image:repeating-linear-gradient(90deg,transparent 0 22px,rgba(0,0,0,.18) 22px 26px)}
.mn-door.shut i{transform:none}
.mn-door b{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) scale(.6);opacity:0;transition:.2s steps(3);font:400 22px/1.4 "Galmuri14","Galmuri11",monospace;white-space:nowrap;
  color:#FFF4DE;background:#C8553D;padding:6px 18px;box-shadow:0 -4px #FFD27A,0 4px #FFD27A,-4px 0 #FFD27A,4px 0 #FFD27A,8px 8px 0 4px rgba(0,0,0,.4)}
.mn-door.shut b{opacity:1;transform:translate(-50%,-50%) scale(1)}
.mn-door s{position:absolute;top:52%;width:8px;height:22px;background:#FFD27A;box-shadow:inset -3px -3px 0 #C9962E;text-decoration:none;opacity:0;transition:opacity .2s steps(2)}
.mn-door s:first-of-type{left:calc(50% - 22px)}.mn-door s:last-of-type{left:calc(50% + 14px)}
.mn-door.shut s{opacity:1}`;
  document.head.appendChild(css);
  const make = label => {
    const d = document.createElement("div"); d.className = "mn-door"; d.setAttribute("aria-hidden", "true");
    d.innerHTML = `<i></i><i></i><s></s><s></s><b></b>`; d.querySelector("b").textContent = label || "";
    document.body.appendChild(d); return d;
  };
  const store = (k, v) => { try { v === undefined ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} };
  const read = k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };

  // 들어오는 쪽: 닫힌 문으로 시작해서 열기
  const incoming = read("mn_door");
  if (incoming !== null) {
    store("mn_door");
    const go = () => {
      const d = make(incoming); d.classList.add("shut");
      if (reduce) { d.remove(); return; }
      setTimeout(() => { d.classList.remove("shut"); setTimeout(() => d.remove(), 600); }, 380);
    };
    document.body ? go() : document.addEventListener("DOMContentLoaded", go);
  }
  // 나가는 쪽: 문 닫고 이동
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[data-door]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    e.preventDefault();
    const label = a.dataset.door, href = a.href;
    store("mn_door", label);
    if (reduce) { location.href = href; return; }
    const d = make(label);
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("shut")));
    setTimeout(() => { location.href = href; }, 620);
  });
  // 뒤로 가기로 돌아왔을 때 닫힌 문이 남지 않게
  addEventListener("pageshow", ev => { if (ev.persisted) document.querySelectorAll(".mn-door").forEach(d => d.remove()); });
})();
