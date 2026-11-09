/* 상자 속 선물 목록 (쿠팡 파트너스). 보내는 사람이 여기서 고르고, shake는 흔들 때 나오는 말
 * url이 빈 상품은 사이트에 보이지 않아요. 링크를 붙여넣으면 바로 켜져요.
 * 링크 형식: https://link.coupang.com/a/... */
window.REAL_GIFT_TIERS = ["소소한 마음", "제법 성의", "마음 좀 썼어", "통 크게", "산타가 미쳤어요"];
window.REAL_GIFTS = [
  { id: "socks", tier: "소소한 마음", icon: "🧦", name: "크리스마스 수면양말", line: "발 시린 겨울밤을 위해", shake: "아무 소리도 안 나요. 말랑말랑해요", url: "https://link.coupang.com/a/ivME8IhWAm" },
  { id: "hotpack", tier: "소소한 마음", icon: "🔥", name: "핫팩 한 박스", line: "주머니에 하나씩 넣고 다녀", shake: "사각사각, 작은 봉지들이 부딪쳐요", url: "https://link.coupang.com/a/ivMKNReeUC" },
  { id: "mug", tier: "소소한 마음", icon: "☕", name: "크리스마스 머그컵", line: "핫초코는 여기에 타 먹어", shake: "단단한 게 덜그럭거려요. 깨질까 조심", url: "https://link.coupang.com/a/ivMTZGNKSG" },
  { id: "lipbalm", tier: "소소한 마음", icon: "💋", name: "립밤 세트", line: "입술 트지 말라고", shake: "작은 통들이 달그락달그락", url: "https://link.coupang.com/a/ivMWaeG3KS" },
  { id: "keyring", tier: "소소한 마음", icon: "🐟", name: "붕어빵 키링", line: "겨울 간식은 못 줘도 이건 줄게", shake: "짤랑, 고리 소리가 나요", url: "https://link.coupang.com/a/ivMY8McKrc" },
  { id: "moodlight", tier: "제법 성의", icon: "🌙", name: "무드등", line: "잠들기 전 분위기 담당", shake: "묵직하고 동그란 게 굴러요", url: "https://link.coupang.com/a/ivM5jVg9Yq" },
  { id: "blanket", tier: "제법 성의", icon: "🛋️", name: "극세사 담요", line: "이불 밖은 위험하니까", shake: "폭신폭신, 꽉 차 있어요", url: "https://link.coupang.com/a/ivM8XTZxw4" },
  { id: "candle", tier: "제법 성의", icon: "🕯️", name: "향초", line: "방 안을 크리스마스 냄새로", shake: "은은한 향이 새어 나와요", url: "https://link.coupang.com/a/ivNP8P6qtM" },
  { id: "tumbler", tier: "제법 성의", icon: "🥤", name: "텀블러", line: "따뜻한 거 오래 마셔", shake: "통 하고 맑은 소리가 나요", url: "https://link.coupang.com/a/ivNSeFb9m8" },
  { id: "handcream", tier: "제법 성의", icon: "🧴", name: "핸드크림 세트", line: "손 건조하다고 했잖아", shake: "튜브 몇 개가 부딪쳐요", url: "https://link.coupang.com/a/ivNZUlMy4q" },
  { id: "humidifier", tier: "제법 성의", icon: "💨", name: "미니 가습기", line: "건조한 방에 하나쯤", shake: "가볍고 동글동글해요", url: "https://link.coupang.com/a/ivN3nsX8Cq" },
  { id: "speaker", tier: "마음 좀 썼어", icon: "🔊", name: "블루투스 스피커", line: "캐럴은 크게 들어야지", shake: "묵직해요. 뭔가 울릴 것 같아요", url: "https://link.coupang.com/a/ivN5evf10S" },
  { id: "warmer", tier: "마음 좀 썼어", icon: "♨️", name: "충전식 손난로", line: "핫팩 업그레이드 버전", shake: "손바닥만 한 게 톡톡 굴러요", url: "https://link.coupang.com/a/ivN7jOtxJI" },
  { id: "charger", tier: "마음 좀 썼어", icon: "🔋", name: "무선 충전기", line: "폰 배터리 걱정 끝", shake: "납작하고 단단해요", url: "https://link.coupang.com/a/ivN8IupUUC" },
  { id: "lego", tier: "마음 좀 썼어", icon: "🧱", name: "레고 크리스마스 세트", line: "같이 조립하자", shake: "자그락자그락, 작은 조각이 한가득", url: "https://link.coupang.com/a/ivObLSysDs" },
  { id: "drip", tier: "마음 좀 썼어", icon: "🫖", name: "홈카페 드립 세트", line: "집에서 카페 놀이", shake: "유리랑 종이가 같이 들어 있어요", url: "https://link.coupang.com/a/ivO38qHnkO" },
  { id: "instax", tier: "통 크게", icon: "📸", name: "인스탁스 미니", line: "우리 사진 많이 찍자", shake: "네모나고 단단해요. 찰칵 소리가 날 것 같아요", url: "https://link.coupang.com/a/ivO6dmOLhA" },
  { id: "earbuds", tier: "통 크게", icon: "🎧", name: "무선 이어폰", line: "출근길 플레이리스트용", shake: "작은 케이스가 딸깍거려요", url: "https://link.coupang.com/a/ivO9tsEaXs" },
  { id: "heatpad", tier: "통 크게", icon: "🛏", name: "전기요", line: "올겨울 난방비 절약", shake: "크고 말랑해요. 전선 같은 게 느껴져요", url: "https://link.coupang.com/a/ivPc725ywu" },
  { id: "perfume", tier: "통 크게", icon: "🌸", name: "향수", line: "너한테 어울릴 것 같아서", shake: "유리병 소리가 찰랑해요", url: "https://link.coupang.com/a/ivPkDRmF08" },
  { id: "ps5", tier: "산타가 미쳤어요", icon: "🎮", name: "플레이스테이션 5", line: "…라고 하면 믿을래?", shake: "엄청 무거워요. 설마…?", url: "https://link.coupang.com/a/ivPl4GIwkm" },
  { id: "switch2", tier: "산타가 미쳤어요", icon: "🕹️", name: "닌텐도 스위치 2", line: "같이 마리오카트 하자", shake: "딸깍딸깍, 버튼 소리 같아요", url: "https://link.coupang.com/a/ivPpoDd3K0" },
  { id: "airpods", tier: "산타가 미쳤어요", icon: "🎧", name: "에어팟 프로", line: "통 크게 가 봤어", shake: "작은 케이스가 딸깍해요. 설마…?", url: "https://link.coupang.com/a/ivPqKJBlca" },
  { id: "ipad", tier: "산타가 미쳤어요", icon: "📱", name: "아이패드", line: "꿈은 크게 꾸자", shake: "얇고 넓고 묵직해요", url: "https://link.coupang.com/a/ivPtoPJIoC" },
  { id: "dyson", tier: "산타가 미쳤어요", icon: "💇", name: "다이슨 헤어드라이어", line: "산타가 미쳤어요", shake: "뭔가 날렵한 게 들어 있어요", url: "https://link.coupang.com/a/ivPv4Gm2do" },
];
