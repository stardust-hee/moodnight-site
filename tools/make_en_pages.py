"""영어 미리보기용 페이지 만들기: santa/index.html, mansion/index.html을 복사해서
<head>의 제목·설명·미리보기 이미지만 영어로 바꾼 index.en.html을 만들어요.
(카톡·레딧 같은 곳은 페이지 <head>만 읽어서 미리보기를 만들기 때문에, 영어 링크에는 영어 head가 필요해요)
화면 글자는 /lang.js가 바꿔요. 이 파일은 영어로 고정되도록 localStorage에 en을 넣어요.
santa/index.html이나 mansion/index.html을 고치면 꼭 다시 돌려 주세요:  python3 tools/make_en_pages.py"""
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = {
  "santa": dict(title="Santa's Gift Shop | Guess who sent your gift", desc="Friends leave you secret virtual gifts with a message and 3 clues. On Christmas you open them and guess who sent each one. Free, no sign-up for friends.",
                og_title="Guess who? Leave me a secret gift", og_desc="Hide your name, leave a virtual gift with a message and clues. I'll guess who sent it on Christmas! Free, 1 minute, no sign-up.",
                img="https://www.moodnight.co.kr/santa/og-en.png?v=1", canon="https://www.moodnight.co.kr/santa/en"),
  "mansion": dict(title="Christmas Mansion | Moodnight", desc="A 12-unit pixel mansion with your name on it. Friends move into empty units, decorate their windows, light them up and leave you letters.",
                og_title="Light up my Christmas Mansion!", og_desc="Move into an empty unit, decorate your window and turn on the light. Leave the owner a letter, or a note on the board. Free, no sign-up.",
                img="https://www.moodnight.co.kr/mansion/og-en.png?v=1", canon="https://www.moodnight.co.kr/mansion/en"),
}
def sub(s, pat, rep):
    n = re.subn(pat, lambda m: rep, s, count=1)
    assert n[1] == 1, pat
    return n[0]
for d, c in PAGES.items():
    s = (ROOT / d / "index.html").read_text()
    s = sub(s, r'<html lang="ko"', '<html lang="en"')
    s = sub(s, r"<title>.*?</title>", f"<title>{c['title']}</title>")
    s = sub(s, r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{c["desc"]}">')
    s = sub(s, r'<meta property="og:site_name" content="[^"]*">', '<meta property="og:site_name" content="Moodnight">')
    s = sub(s, r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{c["og_title"]}">')
    s = sub(s, r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{c["og_desc"]}">')
    s = sub(s, r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{c["img"]}">\n<meta property="og:locale" content="en_US">')
    s = sub(s, r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{c["canon"]}">')
    s = sub(s, r"<meta charset=\"utf-8\">", '<meta charset="utf-8">\n<script>try{localStorage.setItem("mn_lang","en")}catch(e){}</script>')
    s = "<!-- 자동 생성: tools/make_en_pages.py (직접 고치지 마세요) -->\n" + s
    (ROOT / d / "index.en.html").write_text(s)
    print("wrote", d + "/index.en.html")
