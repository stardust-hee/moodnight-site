# 산타 방 3D 원본

`santa/3d/`의 배경·불·선물 그림은 여기 `scene.html`(Three.js 0.160 로우폴리 장면)을 구워서 만든 거예요.

```
cd tools/room3d && npm install
node render.js "mode=room&fire=0" bg_f0.png      # 배경 2000×1600 (선물 없음) + bg_f0.png.json (전구·불·창문·선물 자리 좌표 %)
node render.js "mode=room&fire=1" bg_f1.png      # 불꽃 모양만 다른 프레임 (fire=2도)
node render.js "mode=gift&wrap=red&w=480&h=480" gift_red.png   # 선물 상자 (투명 배경), red/green/navy/gold/snow
```

구운 뒤:
- 배경 → `santa/3d/room-1600.webp`, `room-1000.webp` (webp, 품질 82)
- 불 → json의 fire 사각형만 잘라 `fire0~2.webp`
- 선물 → (119,118)-(351,350) 정사각형으로 잘라 240px `gift-색.webp`
- 좌표가 바뀌면 `santa/room3d.js`(FIRE, WIN, BULBS)와 `santa/app.js`(SLOTS)도 같이 고쳐요
- 파일을 바꾸면 `room3d.js`의 `?v=` 숫자를 올려요
