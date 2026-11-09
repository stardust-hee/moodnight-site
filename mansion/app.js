/* 성탄맨션 — 실제 서비스
 * /mansion/        맨션 주인 (로그인, 만들기, 관리)
 * /mansion/r/코드  친구 (로그인 없이 입주, 벽보)
 * 그림 그리는 코드는 체험판(/mansion/demo/)과 같아요. 데이터만 서버(Supabase)에서 가져와요. */
(() => {
const SUPABASE_URL = "https://gbmlkyfguktjtroczqfw.supabase.co";
const SUPABASE_KEY = "sb_publishable_RO92ntdlSM5_Urctc5FD9w_4OHcZQzf";
const KAKAO_JS_KEY = "929f085734659fd851830cba5592775d";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
try { if (window.Kakao && !Kakao.isInitialized()) Kakao.init(KAKAO_JS_KEY); } catch (e) {}

const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, REDUCE = reduce;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const errMsg = e => { const m = (e && e.message) || '잠시 후 다시 시도해 주세요.'; return m.includes(': ') ? m.split(': ').slice(1).join(': ') : m; };

const pathSlug = (location.pathname.match(/\/mansion\/r\/([a-z0-9]+)/i) || [])[1] || null;
const MODE = pathSlug ? 'guest' : 'host';
let session = null, S = { name: '', slug: null, res: {}, notes: [], owner: false }, view = 'visit', lastNew = null;
const OWNER_NAME = () => S.name || '주인';

/* 기기 표시: 한 사람이 집을 여러 채 차지하거나, 퇴거된 친구가 닉네임만 바꿔 다시 들어오는 걸 막는 용도 */
const DEVICE = (() => {
  const make = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join('') + Date.now().toString(36);
  try { let d = localStorage.getItem('mn_device'); if (!d || !/^[a-z0-9]{16,40}$/.test(d)) { d = make(); localStorage.setItem('mn_device', d); } return d; }
  catch (e) { return make(); }
})();
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toHex=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>{const A=hex(a),B=hex(b);return toHex(A.map((v,i)=>v+(B[i]-v)*t))};
const rgba=(h,a)=>{const[r,g,b]=hex(h);return `rgba(${r},${g},${b},${a})`};

/* ── 선택지 ── */
const LIGHTS=[{id:'amber',name:'호박빛',c:'#FF9A3C'},{id:'candle',name:'촛불빛',c:'#FFD27A'},{id:'rose',name:'장밋빛',c:'#FF8F7A'},{id:'leaf',name:'풀빛',c:'#D4E89A'},{id:'moon',name:'달빛',c:'#A9C8F0'}];
const SILS=[{id:'party',name:'신나는 파티'},{id:'blanket',name:'이불 쓰고 컴퓨터'},{id:'lean',name:'창가에 기대기'},{id:'cat',name:'고양이랑 쉬기'},{id:'cook',name:'뭔가 끓이는 중'},{id:'dance',name:'혼자 춤추기'}];
const ITEMS=[{id:'none',name:'없음'},{id:'sock',name:'양말'},{id:'wreath',name:'리스'},{id:'tree',name:'작은 트리'},{id:'lights',name:'전구 줄'},{id:'candle',name:'촛불 랜턴'},{id:'snowman',name:'꼬마 눈사람'}];
const POSES=[{id:'stand',name:'서 있기'},{id:'sit',name:'앉아 있기'},{id:'manse',name:'만세'},{id:'lie',name:'드러눕기'}];
const SWEATERS=['#C8553D','#3F6C8E','#5B8C5A','#B88B4A','#8A5A9E','#D07A8C','#4E8C8A'];
const nm=(arr,id)=>arr.find(x=>x.id===id).name;
const lc=id=>LIGHTS.find(l=>l.id===id).c;

/* ── 맨션 구조: 4층 × 3호 ── */
const BX=60,BW=120,FLOORS=[52,90,128,166];
const UNITS=[];FLOORS.forEach((y,fi)=>{for(let c=0;c<3;c++)UNITS.push({no:`${4-fi}0${c+1}`,x:BX+c*40,y})});
const NOTE_COLORS=['#FFF3C4','#FFD9D2','#D8ECFF','#E3F4CF','#F3E3FF'];
/* ── 도트 그리기 ── */
let C;
const R=(x,y,w,h,c)=>{C.fillStyle=c;C.fillRect(x|0,y|0,w|0,h|0)};
const P=(x,y,c)=>R(x,y,1,1,c);
const SPR=(x,y,rows,map,flip)=>rows.forEach((row,j)=>{const r=flip?[...row].reverse():[...row];r.forEach((ch,i)=>{if(map[ch])P(x+i,y+j,map[ch])})});
const disc=(cx,cy,r,c)=>{for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+r*.6)P(cx+x,cy+y,c)};
const glow=(cx,cy,r,c,a)=>{[[r,a*.35],[r*.7,a*.55],[r*.42,a*.8]].forEach(([rr,aa])=>{C.fillStyle=rgba(c,aa);for(let y=-Math.round(rr);y<=Math.round(rr);y++){const w=Math.round(Math.sqrt(Math.max(0,rr*rr-y*y)));C.fillRect(cx-w,cy+y,w*2+1,1)}})};

/* 창문 그림자 (창 28×18 기준) */
const MAN_UP=['X.XXX.X','.XXXXX.','..XXX..','.XXXXX.','.XXXXX.','..XXX..','..XXX..','..X.X..','..X.X..'];
const MAN=['.XXX.','.XXX.','..X..','XXXXX','XXXXX','.XXX.','.XXX.','.X.X.','.X.X.'];
const DANCE=['.XXX..X','.XXX.X.','..XXX..','XXXXX..','.XXX...','.XXX...','.X..X..','X....X.','......X'];
function sil(type,x,y,light){
  const k=mix(light,'#1A0E08',.62);
  if(type==='party'){SPR(x+2,y+8,MAN_UP,{X:k});SPR(x+11,y+7,MAN_UP,{X:k});SPR(x+20,y+9,MAN,{X:k});[[4,3],[9,2],[15,4],[22,2],[25,5],[13,6]].forEach(([a,b],i)=>P(x+a,y+b,['#FF6B6B','#FFE08A','#7FD1FF','#B4F08A'][i%4]))}
  if(type==='blanket'){SPR(x+3,y+9,['..XXXX....','.XXXXXX...','XXXXXXXX..','XXXXXXXXX.','XXXXXXXXXX','XXXXXXXXXX'],{X:k});R(x+15,y+7,9,6,'#DDEBFF');R(x+16,y+8,7,4,'#F4F8FF');R(x+18,y+13,3,2,k);R(x+11,y+6,14,10,rgba('#BFD8FF',.18))}
  if(type==='lean'){SPR(x+10,y+11,['..XXX..','..XXX..','.XXXXX.','XXXXXXX','XXXXXXX'],{X:k});R(x+15,y+1,12,15,rgba('#0F1B28',.35))}
  if(type==='cat'){SPR(x+3,y+12,['X.X......','XXX......','XXXXXXX.X','.XXXXXXX.','.X....X..'],{X:k});SPR(x+18,y+5,['..X..','.XXX.','..X..','XXXXX','.XXX.','XXXXX','..X..'],{X:k})}
  if(type==='cook'){SPR(x+6,y+8,MAN,{X:k});R(x+14,y+12,7,4,k);R(x+13,y+12,9,1,k);[[15,9],[16,8],[18,7],[17,10],[19,9]].forEach(([a,b])=>P(x+a,y+b,mix(light,'#FFFFFF',.6)))}
  if(type==='dance'){SPR(x+11,y+8,DANCE,{X:k});[[4,4],[23,6],[6,12]].forEach(([a,b])=>P(x+a,y+b,mix(light,'#FFFFFF',.7)))}
}
/* 베란다 소품 (난간 위 y는 난간 꼭대기) */
function item(type,x,y){
  if(type==='sock'){SPR(x+28,y-1,['WW..','WW..','RR..','RR..','RRR.','RRRR','.RR.'],{W:'#F4F1EA',R:'#C8423A'})}
  if(type==='wreath'){SPR(x+15,y-9,['..GGGG..','.GGRGGG.','GG....GG','GR....GG','GG....RG','.GGGGGG.','..GRRG..','...RR...'],{G:'#3F7A48',R:'#D9473B'})}
  if(type==='tree'){SPR(x+28,y-10,['..Y..','..G..','.GGG.','.GYG.','GGGGG','.GGG.','GGRGG','..B..'],{G:'#3E7D4A',Y:'#FFE08A',R:'#E05A4A',B:'#6B4A35'})}
  if(type==='lights'){for(let i=0;i<34;i+=3)P(x+3+i,y+1+(i%6?0:1),['#FF6B6B','#FFE08A','#7FD1FF','#B4F08A'][(i/3|0)%4])}
  if(type==='candle'){SPR(x+4,y-8,['.K..','KKKK','KYYK','KYYK','KYYK','KKKK'],{K:'#2A2A30',Y:'#FFD27A'})}
  if(type==='snowman'){SPR(x+28,y-9,['.WW.','WKWW','.WW.','RRRR','WWWW','WWWW','.WW.'],{W:'#F4F7FC',K:'#2A2A30',R:'#C8423A'})}
}
function drawUnit(u,r){
  const{x,y}=u,wx=x+6,wy=y+5;
  R(x,y,40,36,'#3A2D33');R(x+1,y+1,38,1,'#46373D');
  if(r){
    const L=lc(r.light);
    C.fillStyle=rgba(L,.16);C.fillRect(wx-3,wy-3,34,24);C.fillStyle=rgba(L,.1);C.fillRect(wx-5,wy-4,38,27);
    for(let i=0;i<18;i++)R(wx,wy+i,28,1,mix(mix(L,'#FFFFFF',.25),L,i/18));
    R(wx,wy,4,18,mix(L,'#7A3A2A',.35));R(wx+24,wy,4,18,mix(L,'#7A3A2A',.35));
    sil(r.sil,wx,wy,L);
    R(wx+13,wy,2,18,'#2A1E22');R(wx,wy+8,28,1,mix(L,'#2A1E22',.5));
  }else{
    R(wx,wy,28,18,'#1A2836');R(wx+2,wy+2,6,1,'#2B3E52');R(wx+2,wy+3,3,1,'#2B3E52');R(wx+13,wy,2,18,'#141E28');
  }
  R(wx-1,wy-1,30,1,'#241A1E');R(wx-1,wy+18,30,1,'#241A1E');R(wx-1,wy,1,18,'#241A1E');R(wx+28,wy,1,18,'#241A1E');
  const ry=y+26;R(x+2,ry,36,1,'#1E1618');for(let i=0;i<36;i+=3)R(x+2+i,ry,1,7,'#1E1618');R(x+2,ry+7,36,2,'#2A2024');
  R(x+2,ry-1,36,1,'#EEF3F8');R(x+3,ry-2,10,1,'#EEF3F8');R(x+20,ry-2,12,1,'#DCE6F0');
  if(r)item(r.item,x+1,ry-1);
}
function drawStatic(state){
  /* 하늘 */
  const sky=['#0B1724','#0E1D2D','#112437','#152B40','#193249','#1C3A52','#21425B'];
  sky.forEach((c,i)=>R(0,i*28,240,28,c));
  for(let i=0;i<6;i++)for(let x=(i%2);x<240;x+=2)P(x,i*28+27,sky[i+1]);
  /* 먼 건물 */
  R(0,62,62,170,'#1E1922');R(178,74,62,160,'#1E1922');R(0,58,30,6,'#E3EAF2');R(178,70,40,5,'#E3EAF2');
  [[6,80],[22,80],[38,80],[6,104],[38,104],[22,128],[6,152],[38,152],[188,92],[204,92],[220,92],[188,116],[220,116],[204,140],[188,164],[220,164]].forEach(([x,y],i)=>{const c=['#FFB25C','#FFD27A','#F79A55'][i%3];if(i%5===3){R(x,y,10,12,'#1A2430');return}C.fillStyle=rgba(c,.18);C.fillRect(x-2,y-2,14,16);R(x,y,10,12,c);R(x+4,y,1,12,'#2A1E22')});
  /* 1층 가게 창 */
  [[2,192,46],[184,192,52]].forEach(([x,y,w])=>{C.fillStyle=rgba('#FFB25C',.22);C.fillRect(x-4,y-6,w+8,44);for(let i=0;i<30;i++)R(x,y+i,w,1,mix('#FFE3A8','#F28A3A',i/30));
    if(x===2){for(let k=0;k<w;k+=8)R(x+k+2,y+18,5,12,'#C8693A');R(x,y+12,w,1,'#9C4E2A')}else{R(x,y+27,w,3,'#B8602E');R(x+8,y+3,w-10,1,'#7A4A2A')}R(x-2,y-3,w+4,3,'#5A3A2A');
    for(let k=0;k<w+4;k+=3)P(x-2+k,y-5+(k%6?0:1),k%9?'#3F6B45':'#FFD27A')});
  /* 맨션 본체 */
  R(BX-4,40,BW+8,4,'#EEF3F8');R(BX-2,44,BW+4,6,'#2A2026');R(BX-5,38,BW+10,3,'#DCE6F0');for(let i=0;i<BW+10;i+=7)R(BX-5+i,41,3,2,'#EEF3F8');
  R(BX-2,50,BW+4,176,'#2E2429');
  UNITS.forEach(u=>drawUnit(u,state.res[u.no]));
  /* 1층 로비 */
  R(BX-2,204,BW+4,22,'#3A2D33');C.fillStyle=rgba('#FFD27A',.25);C.fillRect(BX+44,198,32,30);
  for(let i=0;i<20;i++)R(BX+48,206+i,24,1,mix('#FFE7B0','#F2A24A',i/20));R(BX+59,206,2,20,'#5A3A2A');R(BX+46,204,28,2,'#5A3A2A');
  for(let k=0;k<BW+4;k+=3)P(BX-2+k,202+(k%6?0:1),k%9?'#3F6B45':'#FFD27A');
  /* 벽보판 */
  R(140,207,34,17,'#5C3E2A');R(141,208,32,15,'#9A7652');
  (state.notes||[]).slice(-8).forEach((n,i)=>{const nx=143+(i%4)*7+(i>3?3:0),ny=210+(i>3?6:0)+(i%2);R(nx,ny,6,5,NOTE_COLORS[i%5]);P(nx+2,ny,'#C8423A');R(nx+1,ny+2,4,1,'#B9A58A')});
  /* 선물가게 문 */
  R(18,214,12,12,'#7A2E26');R(19,215,10,11,'#FFD9A0');R(23,215,1,11,'#7A2E26');P(27,220,'#5A3A2A');
  /* 가로등 */
  R(51,150,2,80,'#1B1E24');R(47,146,10,3,'#1B1E24');R(48,149,8,8,'#FFE7B0');R(47,157,10,2,'#1B1E24');glow(52,153,13,'#FFC86A',.45);
  /* 작은 트리 */
  [[24,200]].forEach(([tx,ty])=>{for(let i=0;i<26;i++){const w=Math.round(2+i*.42);R(tx-w,ty+i,w*2+1,1,i%7<1?'#EEF3F8':'#2E5A3A')}R(tx-1,ty+26,3,4,'#5A3A2A');
    for(let i=0;i<10;i++)P(tx-8+((i*7)%17),ty+4+i*2,['#FFE08A','#FF9A3C','#FFD27A'][i%3]);P(tx,ty-1,'#FFE08A')});
  /* 거리 */
  for(let i=0;i<38;i++)R(0,226+i,240,1,mix('#E8EFF6','#A9BCD0',i/38));
  R(0,226,240,2,'#F6F9FC');
  for(let x=0;x<240;x+=1){const t=Math.sin(x/9)*1.2;P(x,240+t,'#B6C6D7');P(x,252+t*.8,'#B6C6D7')}
  C.fillStyle=rgba('#FFB25C',.18);C.fillRect(0,228,54,10);C.fillRect(180,228,60,10);C.fillRect(100,228,40,8);
  C.fillStyle=rgba('#FFC86A',.12);C.fillRect(34,230,36,30);
}
/* 움직이는 것: 눈, 불빛 망울 */
const FL=Array.from({length:90},()=>({x:Math.random()*240,y:Math.random()*264,v:.12+Math.random()*.28,s:Math.random()<.2?2:1,p:Math.random()*6}));
const BOK=Array.from({length:22},(_,i)=>({x:(i*47+13)%240,y:(i*31)%150+6,r:2+(i%4),c:['#FFC86A','#FFB25C','#FFE3A0'][i%3],p:i*.7}));
let base=document.createElement('canvas');base.width=240;base.height=264;
function rebuild(){C=base.getContext('2d');drawStatic(S)}
function drawOverlay(cx,t,still){
  const reduce=still||REDUCE;
  /* 루돌프네 양말공장: 뿔로 양말 뜨는 그림자 (2배 도트) */
  {const fx=188,fy=193,ph=reduce?0:Math.floor(t/320),bob=ph%2,nose=reduce?1:Math.floor(t/420)%2,grow=reduce?4:Math.floor(t/600)%7;
   const K='#3A1E14',Q=(x,y,w,h,c)=>{cx.fillStyle=c;cx.fillRect(x,y,w,h)};
   [[224,195,'#C8423A'],[231,195,'#EEF3F8']].forEach(([sx,sy,c])=>{Q(sx,sy+1,3,3,c);Q(sx+1,sy+4,3,1,c)});Q(218,195,18,1,'#7A4A2A');
   const H=['X..X..X.........','XX.X.XX.........','.XXXXX..........','...XX...........','...XX...........','..XXXXX.........','.XXXXXXXX.......','.XXXXXXXXXXX....','.XXXXXXXXXXX....','..XXXXXXXXX.....','..XXXX..........','..XXXX..........','.XXXXXX.........','XXXXXXXX........'];
   const oy=fy+bob;H.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch==='X'&&!(j>11&&i<1))Q(fx+i*2,oy+j*2,2,2,K)}));
   Q(fx+12,oy-1,1,2,'#E9D8BA');Q(fx,oy-1,1,2,'#E9D8BA');
   for(let i=0;i<grow;i++)Q(fx+12,oy+2+i*2,4,2,'#C8423A');if(grow>3)Q(fx+14,oy+2+grow*2-2,4,2,'#C8423A');Q(fx+12,oy+2,4,1,'#EEF3F8');
   for(let i=0;i<18;i++)Q(fx+17+i,oy+2+Math.min(grow,5)*2+Math.round(i*.55),1,1,'rgba(200,66,58,.9)');
   Q(fx+34,fy+24,5,4,'#C8423A');Q(fx+35,fy+23,3,1,'#C8423A');Q(fx+35,fy+25,2,1,'#E05A4A');
   if(nose){C=cx;glow(fx+24,oy+15,5,'#FF5A4A',.55);Q(fx+23,oy+14,3,3,'#FF3B30');Q(fx+23,oy+14,1,1,'#FFB0A8')}else Q(fx+23,oy+14,3,3,'#7A1E18');}
  /* 선물가게 간판 전구 + 반짝임 */
  const k=reduce?0:Math.floor(t/220);
  for(let x=2;x<=52;x+=3){[[x,181],[x,198]].forEach(([bx,by],j)=>{const on=((x/3|0)+j+k)%2===0;cx.fillStyle=on?'#FFE7A0':'#7A4A2A';cx.fillRect(bx,by,2,2);if(on){cx.fillStyle='rgba(255,220,140,.35)';cx.fillRect(bx-1,by-1,4,4)}})}
  [[6,176,0],[50,178,1.3],[30,173,2.6],[56,196,3.9]].forEach(([sx,sy,ph])=>{const a=reduce?.8:Math.max(0,Math.sin(t/380+ph));if(a<.2)return;const c=`rgba(255,240,200,${a})`;cx.fillStyle=c;cx.fillRect(sx,sy-2,1,5);cx.fillRect(sx-2,sy,5,1);cx.fillStyle=`rgba(255,255,255,${a})`;cx.fillRect(sx,sy,1,1)});
}
const cv=$('#cv'),cx=cv.getContext('2d');let t0=0;
function frame(t){
  if(!reduce&&t-t0<50){requestAnimationFrame(frame);return}t0=t;
  cx.drawImage(base,0,0);C=cx;
  BOK.forEach(b=>{const a=.1+.12*(1+Math.sin(t/900+b.p));glow(b.x,b.y,b.r*2,b.c,a)});
  drawOverlay(cx,t,false);
  FL.forEach(f=>{const a=f.y>226?.0:.9;cx.fillStyle=`rgba(255,255,255,${a})`;cx.fillRect(Math.round(f.x+Math.sin(f.y/14+f.p)*2),Math.round(f.y),f.s,f.s);if(!reduce){f.y+=f.v;if(f.y>264){f.y=-2;f.x=Math.random()*240}}});
  if(!reduce)requestAnimationFrame(frame);
}
/* 집 안 장면 */
const AV={
 stand:['....hhhh....','...hhhhhh...','...hssssh...','...skssks...','...ssssss...','....ssss....','...rrrrrr...','..bbbbbbbb..','.bbbbbbbbbb.','.bbbbbbbbbb.','.sbbbbbbbbs.','..bbbbbbbb..','..pppppppp..','..ppp..ppp..','..ppp..ppp..','..ppp..ppp..','.ddd....ddd.'],
 manse:['....hhhh....','s..hhhhhh..s','b..hssssh..b','b..skssks..b','.b.ssmmss.b.','.b..ssss..b.','..brrrrrrb..','..bbbbbbbb..','..bbbbbbbb..','..bbbbbbbb..','..bbbbbbbb..','..bbbbbbbb..','..pppppppp..','..ppp..ppp..','..ppp..ppp..','..ppp..ppp..','.ddd....ddd.'],
 sit:['....hhhh........','...hhhhhh.......','...hssssh.......','...skssks.......','...ssssss.......','....ssss........','...rrrrrr.......','..bbbbbbbb......','.sbbbbbbbbs.....','..bbbbbbbb......','..pppppppppppp..','..ppppppppppppdd','cccccccccccc....','cccccccccccc....'],
 lie:['.hhhh..................','hhssss.rbbbbbbbbpppppdd','hsksks.rbbbbbbbbpppppdd','hhssss.rbbbbbbbbppppp..','.hhhh..s.......s.......']};
function drawRoom(c,r,no,t){
  const g=c.getContext('2d');C=g;const L=lc(r.light),wall=mix(L,'#4A2A22',.55);
  for(let i=0;i<88;i++)R(0,i,200,1,mix(mix(wall,'#FFFFFF',.08),wall,i/88));
  R(0,88,200,37,'#5C3E2E');for(let i=0;i<200;i+=22)R(i,88,1,37,'#4A3024');R(0,88,200,2,'#3A261C');
  /* 창 */
  R(14,16,56,46,'#2A1E22');for(let i=0;i<42;i++)R(16,18+i,52,1,mix('#0E1D2D','#21425B',i/42));R(16,52,52,8,'#E8EFF6');
  [[24,26],[40,22],[58,34],[30,44],[52,48]].forEach(([a,b],i)=>{C=g;glow(a,b,3,['#FFC86A','#FFE3A0'][i%2],.5)});
  R(41,18,2,42,'#2A1E22');R(16,38,52,2,'#2A1E22');R(10,62,64,3,'#3A261C');
  for(let k=0;k<12;k++){const y=((t||0)/60+k*13)%42;P(18+((k*17)%48),18+y,'#FFFFFF')}
  /* 커튼 */
  R(8,12,8,56,mix(L,'#8A3A2A',.45));R(68,12,8,56,mix(L,'#8A3A2A',.45));R(6,10,72,3,'#3A261C');
  /* 트리, 조명 */
  for(let i=0;i<34;i++){const w=Math.round(1+i*.45);R(170-w,50+i,w*2+1,1,'#2E6A3E')}R(168,84,5,6,'#6B4A35');P(170,49,'#FFE08A');
  for(let i=0;i<9;i++)P(162+((i*5)%16),56+i*3,['#FF6B6B','#FFE08A','#7FD1FF'][i%3]);
  glow(130,30,26,L,.35);R(126,20,9,6,mix(L,'#FFFFFF',.4));R(129,0,3,20,'#2A1E22');
  /* 러그 */
  for(let y=-6;y<=6;y++){const w=Math.round(46*Math.sqrt(1-(y*y)/40));R(100-w,108+y,w*2,1,y%3?'#B5523B':'#D9A06A')}
  /* 아바타 */
  const map={h:'#3A2A22',s:'#F2C9A0',k:'#2B2B33',m:'#8A3A3A',r:'#E7E1D6',b:sweaterOf(no),p:'#3B4458',d:'#2A2A30',c:'#E6B66A'};
  const sp=AV[r.pose],w=sp[0].length,h=sp.length,s=3,ax=Math.round(100-w*s/2),ay=Math.round(110-h*s);
  sp.forEach((row,j)=>[...row].forEach((ch,i)=>{if(map[ch]){g.fillStyle=map[ch];g.fillRect(ax+i*s,ay+j*s,s,s)}}));
  g.fillStyle='rgba(0,0,0,.18)';g.fillRect(ax+2,110,w*s-4,2);
}
/* ── 데이터 ── */
const order = () => Object.keys(S.res);
const sweaterOf = no => SWEATERS[(order().indexOf(no) + SWEATERS.length) % SWEATERS.length];
const canRead = r => view === 'owner' || r.vis === 'all' || r.mine;
const whoOf = r => r.who || '친구';
const mineUnit = () => order().find(no => S.res[no].mine) || null;
const shareUrl = () => `${location.origin}/mansion/r/${S.slug}`;
function apply(d) {
  S = { name: d.display_name, slug: d.slug, owner: !!d.is_owner, res: {}, notes: (d.notes || []).map(n => ({ id: n.id, who: n.who, text: n.text })) };
  (d.residents || []).forEach(r => { S.res[r.unit] = { id: r.id, who: r.nick, light: r.light, sil: r.sil, item: r.item, pose: r.pose, msg: r.msg, vis: r.vis, mine: !!r.mine }; });
  view = S.owner ? 'owner' : 'visit';
}
async function reload() {
  const { data, error } = await sb.rpc('get_mansion', { p_slug: S.slug, p_device: DEVICE });
  if (!error && data) apply(data);
  render();
}

/* ── 패널 ── */
function panel(h) { $('#panelBody').innerHTML = h; }
function render() {
  rebuild(); if (reduce) frame(0);
  const hits = $('#hits'); hits.innerHTML = '';
  const live = !!S.slug;
  UNITS.forEach(u => {
    const r = S.res[u.no], b = document.createElement('button'); b.className = 'unit' + (lastNew === u.no ? ' new' : '');
    Object.assign(b.style, { left: (u.x / 240 * 100) + '%', top: (u.y / 264 * 100) + '%', width: (40 / 240 * 100) + '%', height: (36 / 264 * 100) + '%' });
    b.innerHTML = `<span class="no">${u.no}호${r ? (r.mine ? ' · 내 집' : '') : ' · 빈 집'}</span>`;
    b.setAttribute('aria-label', r ? `${u.no}호, ${canRead(r) ? whoOf(r) : '친구'}네 집` : `${u.no}호, 빈 집`);
    b.onclick = () => live && openUnit(u.no); hits.appendChild(b);
  });
  const spot = (x, y, w, h, label, fn) => { const b = document.createElement('button'); b.className = 'spot'; Object.assign(b.style, { left: (x / 240 * 100) + '%', top: (y / 264 * 100) + '%', width: (w / 240 * 100) + '%', height: (h / 264 * 100) + '%' }); b.setAttribute('aria-label', label); b.onclick = fn; hits.appendChild(b); };
  spot(0, 184, 54, 42, '산타의 선물가게 들어가기', openShop); spot(182, 184, 58, 42, '루돌프네 양말공장 엿보기', openFactory);
  if (live) spot(138, 205, 38, 21, `벽보 보기, ${S.notes.length}장`, () => openBoard());
  $('#title').textContent = live ? `${S.name}의 성탄맨션` : '성탄맨션';
  document.title = live ? `${S.name}의 성탄맨션 | 무드나잇` : '성탄맨션 | 무드나잇';
  const n = order().length;
  $('#hintChip').textContent = !live ? '내 맨션을 만들면 친구들이 빈 집에 입주해요' : n ? '불 켜진 창문을 누르면 그 집에 들어가 볼 수 있어요' : (S.owner ? '아직 빈 맨션이에요. 친구들에게 링크를 보내 보세요' : '첫 번째 입주자가 되어 주세요');
  $('#ctas').hidden = !live;
  if (live) {
    const mine = mineUnit(), full = n >= 12;
    $('#moveBtn').textContent = S.owner ? '벽보 보기' : mine ? `내 집 ${mine}호 보기` : full ? '벽보 붙이기' : '빈 집에 입주하기';
  }
  if (!live) return;
  if (MODE === 'host') renderHost(); else renderGuest();
}
function statsHTML() {
  const n = order().length;
  return `<div class="stats"><div class="stat"><b>${n}</b><span>입주한 집</span></div><div class="stat"><b>${12 - n}</b><span>빈 집</span></div><div class="stat"><b>${S.notes.length}</b><span>벽보</span></div></div>`;
}
function listHTML() {
  return `<div style="display:grid;gap:8px"><p class="h2">입주자 명단</p><ul class="res">${UNITS.map(u => {
    const r = S.res[u.no];
    if (!r) return `<li><button data-unit="${u.no}"><span class="ho off">${u.no}</span><span><b style="color:var(--snow-soft)">빈 집</b><p>${S.owner ? '아직 아무도 안 들어왔어요' : '눌러서 입주하기'}</p></span></button></li>`;
    const ok = canRead(r);
    return `<li><button data-unit="${u.no}"><span class="ho">${u.no}</span><span style="min-width:0"><b>${esc(ok ? whoOf(r) : '친구')}</b>${r.mine ? '<span class="lock" style="background:var(--candle);color:#2A1608">내 집</span>' : ''}${r.vis === 'owner' ? '<span class="lock">주인만</span>' : ''}<p>${ok ? esc(r.msg || '(말 없이 불만 켜 뒀어요)') : `${esc(OWNER_NAME())}님만 볼 수 있는 편지예요`}</p></span></button></li>`;
  }).join('')}</ul></div>`;
}
function bindList() { document.querySelectorAll('[data-unit]').forEach(b => b.onclick = () => openUnit(b.dataset.unit)); }

function renderHost() {
  const n = order().length;
  $('#viewPill').textContent = '집주인';
  panel(`<div class="who"><b>${esc(S.name)}의 성탄맨션</b><button class="linkish" id="renameBtn">이름 바꾸기</button></div>
    <div id="renameBox" class="field" hidden><label class="lbl2" for="renameIn">친구들이 부르는 이름 <small>2~3글자</small></label><input type="text" id="renameIn" maxlength="3" value="${esc(S.name)}"><p class="err" id="renameErr"></p><div class="ctas"><button class="btn sm" id="renameSave">저장</button><button class="btn ghost sm" id="renameCancel">취소</button></div></div>
    <p class="sub">집주인은 모든 편지를 읽고, 이상한 입주자는 퇴거시키고, 벽보는 뗄 수 있어요.</p>
    ${statsHTML()}
    <div class="share"><p class="h2">친구 불러서 불 밝히기</p>
      <div class="linkrow"><code id="linkTxt">${esc(shareUrl().replace(/^https?:\/\//, ''))}</code><button class="btn sm" id="copyBtn">복사</button></div>
      <button class="btn wide kakao" id="kakaoBtn">카카오톡으로 링크 보내기</button>
      ${navigator.share ? '<button class="btn ghost wide" id="moreShare">다른 앱으로 공유</button>' : ''}
      <p class="sub">${n ? `빈 집이 ${12 - n}개 남았어요.` : '집이 12채 있어요.'} 단톡방에 링크 하나만 올려도 금방 불이 켜져요.</p></div>
    ${listHTML()}
    <p class="fine">다음에 들어올 때도 처음 로그인한 방법으로 로그인해야 이 맨션이 보여요. <button class="linkish" id="logout">로그아웃</button></p>`);
  bindList();
  $('#copyBtn').onclick = copyLink; $('#kakaoBtn').onclick = kakaoShare;
  if ($('#moreShare')) $('#moreShare').onclick = () => navigator.share({ title: `${S.name}의 성탄맨션`, text: shareText(), url: shareUrl() }).catch(() => {});
  $('#logout').onclick = logout;
  $('#renameBtn').onclick = () => { $('#renameBox').hidden = false; $('#renameIn').focus(); };
  $('#renameCancel').onclick = () => { $('#renameBox').hidden = true; };
  $('#renameSave').onclick = async () => {
    const name = $('#renameIn').value.replace(/\s/g, '');
    if (name.length < 2 || name.length > 3) { $('#renameErr').textContent = '이름은 2~3글자로 적어 주세요.'; return; }
    const { error } = await sb.from('mansions').update({ display_name: name }).eq('owner_id', session.user.id);
    if (error) { $('#renameErr').textContent = '바꾸지 못했어요. 잠시 후 다시 시도해 주세요.'; return; }
    await reload(); toast('이름을 바꿨어요');
  };
}
function renderGuest() {
  const mine = mineUnit(), n = order().length;
  $('#viewPill').textContent = mine ? `${mine}호 입주자` : '놀러 온 친구';
  panel(`<div class="who"><b>${esc(S.name)}의 성탄맨션</b></div>
    <p class="sub">${mine ? `${mine}호에 불을 켜 두었어요. 다른 친구들이 들어올수록 맨션이 환해져요.` : n >= 12 ? '맨션이 꽉 찼어요. 들어오지 못한 친구는 벽보에 한마디 남길 수 있어요.' : `빈 집 하나를 골라 입주해 보세요. 로그인은 필요 없어요. 편지는 '${esc(S.name)}님만 보기'로 남길 수도 있어요.`}</p>
    ${statsHTML()}
    ${listHTML()}
    <a class="btn wide" href="/mansion/">나도 내 맨션 만들기</a>
    <p class="fine">욕설이나 상처 주는 말은 집주인이 퇴거시킬 수 있어요. <a href="/terms.html">이용약관</a></p>`);
  bindList();
}

/* ── 집 안 보기 ── */
let roomTimer = null;
function openUnit(no) {
  const r = S.res[no];
  if (!r) { if (S.owner) { toast(`${no}호는 아직 빈 집이에요`); return; } if (mineUnit()) { toast('이미 이 맨션에 입주했어요. 한 사람당 한 집이에요'); return; } F.unit = no; return openMove(); }
  const ok = canRead(r);
  openSheet(`${no}호`, `<div class="who"><b>${esc(ok ? whoOf(r) : '친구')}네 집${r.mine ? ' (내 집)' : ''}</b><span>${nm(LIGHTS, r.light)} · ${nm(SILS, r.sil)} · ${nm(POSES, r.pose)}</span></div>
   <div class="room"><canvas id="roomCv" width="200" height="125"></canvas><div class="bubble${ok ? '' : ' locked'}">${ok ? (r.msg ? esc(r.msg) : '…') : `이 집 편지는 ${esc(OWNER_NAME())}님만 볼 수 있어요`}</div></div>
   <p class="hint">${r.vis === 'owner' ? (view === 'owner' || r.mine ? `'주인만 보기'로 남긴 편지예요. 다른 친구에게는 잠겨 보여요.` : '입주한 친구가 맨션 주인만 읽게 해 뒀어요.') : '이 집 편지는 놀러 온 친구 누구나 읽을 수 있어요.'}</p>
   ${view === 'owner' && r.id ? `<div class="evict" id="evictBox"><p>집주인 관리 · 이상한 말을 남긴 입주자는 내보낼 수 있어요.</p><div class="row"><button class="btn danger sm" id="evictBtn">${no}호 퇴거시키기</button></div></div>` : ''}`);
  const eb = $('#evictBtn'); if (eb) eb.onclick = () => {
    $('#evictBox').innerHTML = `<p>${esc(whoOf(r))}님을 내보낼까요? 집과 편지가 모두 사라지고, 같은 닉네임이나 같은 기기로는 다시 입주할 수 없어요.</p>
      <label class="check"><input type="checkbox" id="evictReport"> 욕설이나 괴롭힘이라 신고도 함께 할게요</label>
      <div class="row"><button class="btn danger sm" id="evictYes">퇴거시키기</button><button class="btn ghost sm" id="evictNo">그만두기</button></div>`;
    $('#evictNo').onclick = () => openUnit(no);
    $('#evictYes').onclick = async () => {
      $('#evictYes').disabled = true;
      const { error } = await sb.rpc('evict_resident', { p_resident_id: r.id, p_reason: $('#evictReport').checked ? '집주인 신고: 욕설·괴롭힘' : null });
      if (error) { toast(errMsg(error)); $('#evictYes').disabled = false; return; }
      lastNew = null; closeSheet(); await reload(); stamp(`${no}호 방 빼!`); toast(`${whoOf(r)}님을 퇴거시켰어요. ${no}호가 빈 집이 됐어요`);
    };
  };
  const rc = $('#roomCv'); let tt = 0; const loop = () => { if ($('#overlay').hidden || !document.body.contains(rc)) return; drawRoom(rc, r, no, tt); tt += 16; roomTimer = reduce ? null : setTimeout(loop, 60); }; loop();
}
function stamp(t) { $('#stampText').textContent = t; const s = $('#stamp'); s.hidden = false; clearTimeout(stamp.t); stamp.t = setTimeout(() => s.hidden = true, 1500); }

/* ── 입주하기 ── */
const F = { unit: null, nick: '', light: 'amber', sil: 'lean', item: 'sock', pose: 'stand', msg: '', vis: 'all' };
function openMove() {
  const empties = UNITS.filter(u => !S.res[u.no]).map(u => u.no);
  if (!empties.length) { openBoard('빈 집이 없어요. 들어오지 못한 친구는 벽보에 한마디 남길 수 있어요.'); return; }
  if (!F.unit || S.res[F.unit]) F.unit = empties[empties.length - 1];
  const chip = (arr, key, sw) => arr.map(o => `<button type="button" data-k="${key}" data-v="${o.id}" aria-pressed="${F[key] === o.id}">${sw ? `<i style="background:${o.c};color:${o.c}"></i>` : ''}${o.name}</button>`).join('');
  const h = `<div class="pv"><canvas id="pvUnit" width="40" height="36"></canvas><canvas id="pvRoom" width="200" height="125"></canvas></div>
  <div class="field"><label class="lbl2" for="fnick"><span class="n">1</span>닉네임 <small>문패와 명단에 나와요</small></label><input type="text" id="fnick" maxlength="8" placeholder="예: 302호 고양이" autocomplete="off" value="${esc(F.nick)}"></div>
  <div class="field"><div class="lbl2"><span class="n">2</span>호수 고르기</div><div class="units">${UNITS.map(u => `<button type="button" data-u="${u.no}" aria-pressed="${F.unit === u.no}" ${S.res[u.no] ? 'disabled' : ''}>${u.no}<small>${S.res[u.no] ? '입주 완료' : '빈 집'}</small></button>`).join('')}</div></div>
  <div class="field"><div class="lbl2"><span class="n">3</span>창문 불빛</div><div class="chips">${chip(LIGHTS, 'light', true)}</div></div>
  <div class="field"><div class="lbl2"><span class="n">4</span>창에 비치는 그림자</div><div class="chips">${chip(SILS, 'sil')}</div></div>
  <div class="field"><div class="lbl2"><span class="n">5</span>베란다 꾸미기</div><div class="chips">${chip(ITEMS, 'item')}</div></div>
  <div class="field"><div class="lbl2"><span class="n">6</span>집 안 내 모습</div><div class="chips">${chip(POSES, 'pose')}</div></div>
  <div class="field"><label class="lbl2" for="fmsg"><span class="n">7</span>말풍선 한마디 <small>창문을 누르면 보여요</small></label><textarea id="fmsg" maxlength="60" placeholder="올해 고마웠던 거 한 줄">${esc(F.msg)}</textarea><div class="meta"><span>최대 60자</span><span id="fcount">${F.msg.length}/60</span></div>
   <div class="chips"><button type="button" data-k="vis" data-v="all" aria-pressed="${F.vis === 'all'}">모두 보기</button><button type="button" data-k="vis" data-v="owner" aria-pressed="${F.vis === 'owner'}">${esc(OWNER_NAME())}님만 보기</button></div></div>
  <p class="err" id="ferr" role="alert"></p><button class="btn wide" id="fgo">${F.unit}호에 입주하기</button>
  <p class="hint">한 사람당 한 집이에요. 입주한 뒤에는 고칠 수 없어요.</p>`;
  const sh = $('.sheet'), keep = !$('#overlay').hidden && $('#sheetTitle').textContent === '빈 집에 입주하기' ? sh.scrollTop : 0;
  openSheet('빈 집에 입주하기', h); sh.scrollTop = keep;
  const preview = { who: F.nick || '나', light: F.light, sil: F.sil, item: F.item, pose: F.pose, msg: F.msg, vis: F.vis };
  const tmp = document.createElement('canvas'); tmp.width = 240; tmp.height = 264; C = tmp.getContext('2d'); drawStatic({ res: { ...S.res, [F.unit]: preview }, notes: S.notes });
  const u = UNITS.find(x => x.no === F.unit), pu = $('#pvUnit').getContext('2d'); pu.drawImage(tmp, u.x, u.y, 40, 36, 0, 0, 40, 36);
  drawRoom($('#pvRoom'), preview, F.unit, 0);
  const ni = $('#fnick'), ta = $('#fmsg'); ni.oninput = () => F.nick = ni.value; ta.oninput = () => { F.msg = ta.value; $('#fcount').textContent = ta.value.length + '/60'; };
  document.querySelectorAll('.units button').forEach(b => b.onclick = () => { F.unit = b.dataset.u; openMove(); });
  document.querySelectorAll('.chips button[data-k]').forEach(b => b.onclick = () => { F[b.dataset.k] = b.dataset.v; openMove(); });
  $('#fgo').onclick = async () => {
    const err = $('#ferr'), nick = F.nick.trim();
    if (!nick) { err.textContent = '닉네임을 적어 주세요. 문패에 들어가요.'; ni.focus(); return; }
    $('#fgo').disabled = true; $('#fgo').textContent = '이삿짐 옮기는 중…';
    const { error } = await sb.rpc('move_in', { p_slug: S.slug, p_unit: F.unit, p_nick: nick, p_light: F.light, p_sil: F.sil, p_item: F.item, p_pose: F.pose, p_msg: F.msg.trim(), p_vis: F.vis, p_device: DEVICE });
    if (error) { err.textContent = errMsg(error); $('#fgo').disabled = false; $('#fgo').textContent = `${F.unit}호에 입주하기`; if (/taken|full/.test(error.message || '')) { await reload(); } return; }
    const no = F.unit; lastNew = no; Object.assign(F, { unit: null, nick: '', msg: '' });
    closeSheet(); await reload(); $('#frame').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); stamp(`${no}호에 불이 켜졌어요`);
  };
}

/* ── 벽보 ── */
const B = { who: '', text: '' }; let newNote = -1;
function openBoard(lead) {
  const full = order().length >= 12;
  const h = `${lead || full ? `<p class="hint">${esc(lead || '맨션이 꽉 찼어요. 들어오지 못한 친구는 벽보에 한마디 남겨요.')}</p>` : '<p class="hint">입주하지 않아도 누구나 벽보에 한마디 붙일 수 있어요. 벽보는 모두에게 보여요.</p>'}
   <div class="notes">${S.notes.length ? S.notes.map((n, i) => `<div class="note${i === newNote ? ' new' : ''}" style="background:${NOTE_COLORS[i % 5]};transform:rotate(${(i % 3 - 1) * 2.5}deg)">${esc(n.text)}<b>— ${esc(n.who)}</b>${view === 'owner' && n.id ? `<button class="rm" data-rm="${n.id}" aria-label="${esc(n.who)}님 벽보 떼기">떼기</button>` : ''}</div>`).join('') : '<p class="hint" style="color:#F3E3D0">아직 붙은 벽보가 없어요.</p>'}</div>
   ${S.owner ? '<p class="hint">욕설이 담긴 벽보는 떼면 같은 기기에서 다시 붙일 수 없게 막아 둘게요.</p>' : `<div class="field"><label class="lbl2" for="bwho">닉네임 <small>비우면 익명</small></label><input type="text" id="bwho" maxlength="8" placeholder="익명" autocomplete="off" value="${esc(B.who)}"></div>
   <div class="field"><label class="lbl2" for="btext">벽보 한마디</label><textarea id="btext" maxlength="40" placeholder="방빼!! 나도 들어가고 싶었는데">${esc(B.text)}</textarea><div class="meta"><span>최대 40자</span><span id="bcount">${B.text.length}/40</span></div>
   <div class="chips">${['방빼!!', '나도 들어가고 싶었는데', '크리스마스 잘 보내', '내년엔 꼭 입주한다'].map(t => `<button type="button" data-t="${t}">${t}</button>`).join('')}</div></div>
   <p class="err" id="berr" role="alert"></p><button class="btn wide" id="bgo">벽보 붙이기</button>`}`;
  openSheet(`벽보 · ${S.notes.length}장`, h);
  document.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const { error } = await sb.rpc('remove_note', { p_note_id: b.dataset.rm, p_reason: '집주인이 뗌' });
    if (error) { toast(errMsg(error)); b.disabled = false; return; }
    newNote = -1; await reload(); openBoard(lead); toast('벽보를 뗐어요');
  });
  if (S.owner) return;
  const bw = $('#bwho'), bt = $('#btext'); bw.oninput = () => B.who = bw.value; bt.oninput = () => { B.text = bt.value; $('#bcount').textContent = bt.value.length + '/40'; };
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { B.text = (B.text ? B.text + ' ' : '') + b.dataset.t; B.text = B.text.slice(0, 40); bt.value = B.text; $('#bcount').textContent = B.text.length + '/40'; });
  $('#bgo').onclick = async () => {
    const text = B.text.trim(); if (!text) { $('#berr').textContent = '한마디를 적어 주세요.'; bt.focus(); return; }
    $('#bgo').disabled = true;
    const { error } = await sb.rpc('post_note', { p_slug: S.slug, p_who: B.who.trim(), p_text: text, p_device: DEVICE });
    if (error) { $('#berr').textContent = errMsg(error); $('#bgo').disabled = false; return; }
    Object.assign(B, { who: '', text: '' }); await reload(); newNote = S.notes.length - 1; openBoard(); toast('벽보를 붙였어요');
  };
}
function openFactory() {
  openSheet('루돌프네 양말공장', `<div class="shop" style="background-color:#3A2418"><h3>루돌프네 양말공장</h3><p>선물가게 옆 작은 공장이에요. 루돌프가 뿔에 실을 걸고 밤새 양말을 떠요. 코가 깜빡이면 한 짝 완성!</p><p style="color:var(--candle)">지금은 크리스마스 양말 주문이 밀려서 문이 닫혀 있어요.</p></div><p class="hint">곧 열려요. 창문 너머로 루돌프가 일하는 모습만 볼 수 있어요.</p>`);
}
function openShop() {
  openSheet('산타의 선물가게', `<div class="shop"><h3>산타의 선물가게</h3><p>맨션 1층 모퉁이 가게예요. 친구에게 익명 선물과 편지를 맡겨 두면, 크리스마스에 열어 보고 누가 보냈는지 단서로 맞혀요.</p>
    <a class="btn" href="/santa/">선물가게 들어가기</a></div>
    <p class="hint">무드나잇의 또 다른 놀이, 산타의 선물가게로 연결돼요.</p>`);
}

/* ── 저장 ── */
async function saveImage() {
  try { await document.fonts.load('30px Galmuri14'); await document.fonts.load('24px Galmuri11'); } catch (e) {}
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#0F1B28'; g.fillRect(0, 0, 1080, 1350);
  const snap = document.createElement('canvas'); snap.width = 240; snap.height = 264; const sg = snap.getContext('2d'); sg.drawImage(base, 0, 0); C = sg;
  BOK.forEach(b => glow(b.x, b.y, b.r * 2, b.c, .2)); drawOverlay(sg, 0, true); FL.forEach(f => { if (f.y < 226) { sg.fillStyle = '#fff'; sg.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s); } });
  g.drawImage(snap, 60, 150, 960, 1056);
  const FX = 60, FY = 150, FW = 960, FH = 1056;
  const tag = (text, x, y, w, bg, fg, line, size) => { g.font = `700 ${size}px Galmuri11`; const tw = w || g.measureText(text).width + 24, h = size + 12, lx = Math.round(x - tw / 2), ly = Math.round(y);
    if (line) { g.fillStyle = line; g.fillRect(lx - 4, ly - 4, tw + 8, h + 8); } g.fillStyle = bg; g.fillRect(lx, ly, tw, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, lx + tw / 2, ly + h / 2 + 1); };
  tag('산타의 선물가게', FX + FW * .116, FY + FH * .692, FW * .2, '#C8553D', '#FFF4DE', '#FFD27A', 22);
  tag('루돌프네 양말공장', FX + FW * .881, FY + FH * .692, FW * .21, '#5A3A2A', '#FFF4DE', '#C8423A', 22);
  tag('성탄맨션', FX + FW * .5, FY + FH * .79, 0, '#F3D9A4', '#3A2418', '#7A4A2A', 20);
  tag('벽보', FX + FW * .64, FY + FH * .862, 0, '#F3D9A4', '#3A2418', null, 16);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FFD27A'; g.font = '30px Galmuri14'; g.fillText(S.name ? `${S.name}의 성탄맨션` : '성탄맨션', 540, 70);
  const n = order().length; g.fillStyle = '#A9BACB'; g.font = '24px Galmuri11'; g.fillText(`12집 중 ${n}집에 불이 켜졌어요`, 540, 120);
  g.fillStyle = '#FFD27A'; g.font = '24px Galmuri11'; g.fillText('moodnight.co.kr/mansion', 540, 1270);
  openSheet('맨션 저장하기', `<img class="shot" alt="맨션 이미지" src="${c.toDataURL('image/png')}"><p class="hint">이미지를 꾹 눌러 저장하세요. 편지 내용은 이미지에 들어가지 않아요.</p>`);
}

/* ── 공유 ── */
const shareText = () => { const n = 12 - order().length; return n ? `${S.name}의 성탄맨션에 빈 집이 ${n}개 남았어. 하나 골라서 불 좀 켜 줘!` : `${S.name}의 성탄맨션이 꽉 찼어! 벽보에 한마디 남겨 줘`; };
async function copyLink() {
  try { await navigator.clipboard.writeText(`${shareText()}\n${shareUrl()}`); toast('링크를 복사했어요'); }
  catch (e) { const r = document.createRange(); r.selectNodeContents($('#linkTxt')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('링크를 선택했어요. 길게 눌러 복사하세요'); }
}
function kakaoShare() {
  const url = shareUrl(), n = 12 - order().length;
  try {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: { title: n ? `${S.name}의 성탄맨션에 빈 집이 ${n}개 남았어요` : `${S.name}의 성탄맨션이 꽉 찼어요`, description: n ? '하나 골라서 입주하고 창문에 불을 켜 주세요' : '들어오지 못한 친구는 벽보에 한마디 남겨요',
        imageUrl: 'https://www.moodnight.co.kr/mansion/og.png', imageWidth: 1200, imageHeight: 630, link: { mobileWebUrl: url, webUrl: url } },
      buttons: [{ title: n ? '입주하러 가기' : '벽보 붙이러 가기', link: { mobileWebUrl: url, webUrl: url } }]
    });
  } catch (e) { copyLink(); }
}

/* ── 로그인과 맨션 만들기 ── */
function renderLogin() {
  $('#viewPill').textContent = '내 맨션 만들기';
  panel(`<div class="who"><b>내 성탄맨션 만들기</b></div>
    <p class="sub">눈 내리는 밤, 내 이름이 붙은 맨션 한 동이 생겨요. 링크를 받은 친구가 빈 집에 입주해 창문에 불을 켜고, 말풍선으로 한마디를 남겨요. 친구는 로그인 없이 들어와요.</p>
    <button class="btn wide kakao" id="loginKakao">카카오로 시작하기</button>
    <button class="btn ghost wide" id="loginGoogle">구글로 시작하기</button>
    <p class="fine">맨션을 만드는 사람만 로그인해요. 로그인하면 <a href="/terms.html">이용약관</a>과 <a href="/privacy.html">개인정보처리방침</a>에 동의하는 것으로 봐요. 만 14세 이상만 만들 수 있어요.</p>`);
  const back = location.origin + '/mansion/';
  $('#loginKakao').onclick = () => sb.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: back, scopes: 'profile_nickname profile_image' } });
  $('#loginGoogle').onclick = () => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back } });
}
function renderCreate() {
  const m = session.user.user_metadata || {};
  const raw = (m.name || m.full_name || m.nickname || '').replace(/\s/g, '');
  const guess = raw.length >= 2 && raw.length <= 3 ? raw : '';
  $('#viewPill').textContent = '내 맨션 만들기';
  panel(`<div class="who"><b>맨션 이름 정하기</b></div>
    <p class="sub">친구들이 링크를 열면 "○○의 성탄맨션"으로 보여요. 친구들이 부르는 이름이나 별명을 2~3글자로 써 주세요.</p>
    <div class="field"><input type="text" id="mName" maxlength="3" value="${esc(guess)}" placeholder="예: 하린"></div>
    <p class="err" id="mErr"></p>
    <button class="btn wide" id="mGo">맨션 짓기</button>
    <p class="fine"><button class="linkish" id="logout">다른 계정으로 로그인</button></p>`);
  $('#logout').onclick = logout;
  $('#mGo').onclick = async () => {
    const name = $('#mName').value.replace(/\s/g, '');
    if (name.length < 2 || name.length > 3) { $('#mErr').textContent = '이름은 2~3글자로 적어 주세요.'; return; }
    $('#mGo').disabled = true;
    const { error } = await sb.from('mansions').insert({ owner_id: session.user.id, display_name: name });
    if (error && error.code !== '23505') { $('#mErr').textContent = '만들지 못했어요. 잠시 후 다시 시도해 주세요.'; $('#mGo').disabled = false; return; }
    await loadHost(); stamp('맨션 완공!'); toast('맨션이 생겼어요. 링크를 친구들에게 보내 보세요');
  };
}
async function logout() { await sb.auth.signOut(); session = null; S = { name: '', slug: null, res: {}, notes: [], owner: false }; render(); renderLogin(); }

async function loadHost() {
  const { data: mine } = await sb.from('mansions').select('slug').eq('owner_id', session.user.id).maybeSingle();
  if (!mine) { render(); renderCreate(); return; }
  S.slug = mine.slug; await reload();
}
async function loadGuest() {
  const { data, error } = await sb.rpc('get_mansion', { p_slug: pathSlug, p_device: DEVICE });
  if (error || !data) { render(); panel(`<div class="who"><b>맨션을 찾을 수 없어요</b></div><p class="sub">링크가 잘못됐거나 맨션이 없어졌어요. 링크를 보낸 친구에게 다시 확인해 주세요.</p><a class="btn wide" href="/mansion/">나도 내 맨션 만들기</a>`); return; }
  if (data.is_owner) { location.replace('/mansion/'); return; }
  apply(data); render();
}

/* ── 공통 ── */
let lastFocus = null;
function openSheet(t, h) { const ov = $('#overlay'); if (ov.hidden) lastFocus = document.activeElement; clearTimeout(roomTimer); $('#sheetTitle').textContent = t; $('#sheetBody').innerHTML = h; ov.hidden = false; $('#sheetClose').focus({ preventScroll: true }); }
function closeSheet() { clearTimeout(roomTimer); $('#overlay').hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
$('#sheetClose').onclick = closeSheet;
$('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#overlay').hidden) closeSheet(); });
let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 2600); }
$('#moveBtn').onclick = () => { if (S.owner) return openBoard(); const mine = mineUnit(); if (mine) return openUnit(mine); F.unit = null; openMove(); };
$('#saveBtn').onclick = saveImage;
/* 다른 친구가 입주하면 보이게, 화면을 보고 있을 때 30초마다 새로고침 */
setInterval(() => { if (S.slug && document.visibilityState === 'visible' && $('#overlay').hidden) reload(); }, 30000);

render(); requestAnimationFrame(frame);
(async function init() {
  const { data } = await sb.auth.getSession(); session = data.session;
  if (MODE === 'guest') return loadGuest();
  if (!session) { renderLogin(); return; }
  if (location.hash.includes('access_token')) history.replaceState(null, '', '/mansion/');
  loadHost();
})();
sb.auth.onAuthStateChange((evt, s) => { if (MODE === 'host' && evt === 'SIGNED_IN' && !session) { session = s; loadHost(); } });
})();
