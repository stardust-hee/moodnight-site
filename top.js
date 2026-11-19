/* 맨 위로 버튼: 화면 한 번 반쯤 내려가면 오른쪽 아래에 나타나요 */
(function () {
  var b = document.createElement("button");
  b.type = "button"; b.className = "to-top"; b.setAttribute("aria-label", "맨 위로"); b.hidden = true;
  b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5l-7 7m7-7l7 7M12 5v14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  b.addEventListener("click", function () {
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
  document.body.appendChild(b);
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { b.hidden = window.scrollY < window.innerHeight * 0.8; ticking = false; });
  }, { passive: true });
})();
