/* MOODNIGHT prompt board — shared helpers */
(function () {
  var SUPABASE_URL = 'https://gbmlkyfguktjtroczqfw.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_RO92ntdlSM5_Urctc5FD9w_4OHcZQzf';

  window.MN = window.MN || {};

  MN.sb = function () {
    if (!MN._sb) MN._sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return MN._sb;
  };

  MN.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  function inline(s) {
    s = MN.esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/(^|\s)@([A-Za-z0-9._]+)/g,
      '$1<a href="https://www.instagram.com/$2/" target="_blank" rel="noopener noreferrer">@$2</a>');
    return s;
  }

  /* tiny markdown: # ## ###, lists, > quote, ---, ``` code (with copy button), paragraphs */
  MN.md = function (src) {
    var lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
    var out = [], i = 0, para = [];
    function flush() {
      if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; }
    }
    while (i < lines.length) {
      var line = lines[i];
      if (/^```/.test(line)) {
        flush();
        var buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out.push(
          '<div class="codeblock"><div class="codehead"><span>복사해서 사용하세요</span>' +
          '<button type="button" class="copy-btn">복사하기</button></div>' +
          '<pre>' + MN.esc(buf.join('\n')) + '</pre></div>'
        );
        continue;
      }
      if (/^\s*$/.test(line)) { flush(); i++; continue; }
      var m;
      if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
        flush(); out.push('<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>'); i++; continue;
      }
      if (/^---+\s*$/.test(line)) { flush(); out.push('<hr>'); i++; continue; }
      if (/^>\s?/.test(line)) {
        flush(); var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
        out.push('<blockquote>' + q.map(inline).join('<br>') + '</blockquote>'); continue;
      }
      if (/^\d+\.\s+/.test(line)) {
        flush(); var ol = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { ol.push('<li>' + inline(lines[i].replace(/^\d+\.\s+/, '')) + '</li>'); i++; }
        out.push('<ol class="steps">' + ol.join('') + '</ol>'); continue;
      }
      if (/^[-*]\s+/.test(line)) {
        flush(); var ul = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) { ul.push('<li>' + inline(lines[i].replace(/^[-*]\s+/, '')) + '</li>'); i++; }
        out.push('<ul>' + ul.join('') + '</ul>'); continue;
      }
      para.push(line); i++;
    }
    flush();
    return out.join('\n');
  };

  /* clipboard */
  MN.copyText = function (text) {
    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); return ok;
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacy(); });
    }
    return Promise.resolve(legacy());
  };

  MN.toast = function (msg) {
    var t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(MN._tt); MN._tt = setTimeout(function () { t.classList.remove('show'); }, 2000);
  };

  /* wire up copy buttons inside a container (event delegation) */
  MN.bindCopy = function (root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.copy-btn'); if (!b) return;
      var pre = b.closest('.codeblock').querySelector('pre');
      MN.copyText(pre.textContent).then(function (ok) {
        if (ok) {
          var old = b.textContent; b.textContent = '복사 완료 ✓'; b.classList.add('done');
          MN.toast('복사됐어요 ✓');
          setTimeout(function () { b.textContent = old; b.classList.remove('done'); }, 2000);
        } else {
          MN.toast('복사에 실패했어요. 길게 눌러 직접 복사해 주세요');
        }
      });
    });
  };

  MN.shareUrl = function (slug) {
    return location.origin + '/prompt/?s=' + encodeURIComponent(slug);
  };
})();
