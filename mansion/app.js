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
const EN = window.LANG === 'en', L = window.L || ((k) => k);
const POSS = n => /s$/i.test(n) ? `${n}'` : `${n}'s`;
const MN = n => L(`${n}의 성탄맨션`, `${POSS(n)} Christmas Mansion`);
const nameOk = n => EN ? n.length >= 2 && n.length <= 12 : n.length >= 2 && n.length <= 3;
const cleanName = v => EN ? v.trim().replace(/\s+/g, ' ') : v.replace(/\s/g, '');
const ERR_EN = { rate_limit: "Too many requests right now. Please try again later.", not_found: "We couldn't find that.", nick: 'Please choose a different nickname.', banned: "The owner has blocked you from this mansion.", dup: "You've already moved in. One home per person.", taken: 'Someone just took that unit. Pick another one.', full: 'The mansion is full. Leave a note on the board instead!', text: 'Please write something.', limit: 'You can post up to 5 notes.', login: 'Please log in first.' };
const errMsg = e => { const m = (e && e.message) || L('잠시 후 다시 시도해 주세요.', 'Something went wrong. Please try again.'); const code = m.split(':')[0].trim();
  if (EN) return ERR_EN[code] || (/[가-힣]/.test(m) ? 'Something went wrong. Please try again.' : m);
  return m.includes(': ') ? m.split(': ').slice(1).join(': ') : m; };

const pathSlug = (location.pathname.match(/\/mansion\/r\/([a-z0-9]+)/i) || [])[1] || null;
const MODE = pathSlug ? 'guest' : 'host';
let session = null, S = { name: '', slug: null, res: {}, notes: [], owner: false }, view = 'visit', lastNew = null;
const OWNER_NAME = () => S.name || L('주인', 'the owner');

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
const LIGHTS=[{id:'amber',name:L('호박빛','Amber'),c:'#FF9A3C'},{id:'candle',name:L('촛불빛','Candle'),c:'#FFD27A'},{id:'rose',name:L('장밋빛','Rose'),c:'#FF8F7A'},{id:'leaf',name:L('풀빛','Leaf'),c:'#D4E89A'},{id:'moon',name:L('달빛','Moonlight'),c:'#A9C8F0'}];
const SILS=[{id:'party',name:L('신나는 파티','Party time')},{id:'blanket',name:L('이불 쓰고 컴퓨터','Blanket + laptop')},{id:'lean',name:L('창가에 기대기','By the window')},{id:'cat',name:L('고양이랑 쉬기','Chilling with a cat')},{id:'cook',name:L('뭔가 끓이는 중','Cooking something')},{id:'dance',name:L('혼자 춤추기','Dancing alone')}];
const ITEMS=[{id:'none',name:L('없음','None')},{id:'sock',name:L('양말','Stocking')},{id:'wreath',name:L('리스','Wreath')},{id:'tree',name:L('작은 트리','Mini tree')},{id:'lights',name:L('전구 줄','String lights')},{id:'candle',name:L('촛불 랜턴','Candle lantern')},{id:'snowman',name:L('꼬마 눈사람','Little snowman')}];
const POSES=[{id:'stand',name:L('서 있기','Standing')},{id:'sit',name:L('앉아 있기','Sitting')},{id:'manse',name:L('만세','Hands up')},{id:'lie',name:L('드러눕기','Lying down')}];
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
  /* 로비 왼쪽: 박살방 가는 지하 계단 (B1) */
  R(66,206,28,20,'#140C10');C.fillStyle=rgba('#FF4A3A',.18);C.fillRect(64,204,32,22);
  for(let i=0;i<5;i++){R(68+i*2,210+i*3,24-i*4,1,'#3A2A30');R(68+i*2,211+i*3,24-i*4,2,'#241820')}
  R(66,205,28,1,'#5A3A2A');R(65,205,1,21,'#5A3A2A');R(94,205,1,21,'#5A3A2A');
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
  /* 길 끝 오른쪽: 숲속 캠핑장 이정표 */
  R(222,236,3,22,'#5A3A2A');R(223,234,1,24,'#7A4A2A');R(219,256,9,2,'#DCE6F0');
  [[206,240],[214,236],[236,242]].forEach(([tx,ty])=>{for(let i=0;i<12;i++){const w=Math.round(1+i*.35);R(tx-w,ty+i,w*2+1,1,i%5<1?'#EEF3F8':'#24452E')}R(tx,ty+12,1,3,'#3A2418')});
}
/* 움직이는 것: 눈, 불빛 망울 */
const LANTERNS=[[12,30,'#E0584A',0],[30,16,'#F2B84B',1.7],[46,38,'#E07A9A',3.1],[196,24,'#F2B84B',2.3],[220,44,'#E0584A',.8]];
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
  /* 하늘에 떠가는 연등 (누르면 무드나잇 산사) */
  LANTERNS.forEach(([lx,ly,c,ph])=>{const bob=reduce?0:Math.round(Math.sin(t/900+ph)*2),y=ly+bob,Q=(x,yy,w,h,cc)=>{cx.fillStyle=cc;cx.fillRect(x,yy,w,h)};
    C=cx;glow(lx+3,y+4,6,c,.45);
    Q(lx+1,y,4,1,'#3A2418');Q(lx,y+1,6,6,c);Q(lx+1,y+2,1,4,'rgba(255,240,200,.55)');Q(lx,y+3,6,1,'rgba(90,30,20,.35)');Q(lx+1,y+7,4,1,'#3A2418');Q(lx+2,y+8,2,2,'#FFD27A')});
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
const whoOf = r => r.who || L('친구', 'a friend');
const mineUnit = () => order().find(no => S.res[no].mine) || null;
const shareUrl = () => `${location.origin}/mansion/r/${S.slug}${EN ? '?lang=en' : ''}`;
const HO = no => L(`${no}호`, `#${no}`);
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
function panel(h) {
  $('#panelBody').innerHTML = h;
  if (MODE === 'host' && window.mnFriends) mnFriends.attach($('#panelBody'));  // 집주인 화면 맨 아래에 "내가 놀러 간 친구 집" 카드
}
function render() {
  rebuild(); if (reduce) frame(0);
  const hits = $('#hits'); hits.innerHTML = '';
  const live = !!S.slug;
  UNITS.forEach(u => {
    const r = S.res[u.no], b = document.createElement('button'); b.className = 'unit' + (lastNew === u.no ? ' new' : '');
    Object.assign(b.style, { left: (u.x / 240 * 100) + '%', top: (u.y / 264 * 100) + '%', width: (40 / 240 * 100) + '%', height: (36 / 264 * 100) + '%' });
    b.innerHTML = `<span class="no">${HO(u.no)}${r ? (r.mine ? L(' · 내 집', ' · mine') : '') : L(' · 빈 집', ' · empty')}</span>`;
    b.setAttribute('aria-label', r ? L(`${u.no}호, ${canRead(r) ? whoOf(r) : '친구'}네 집`, `#${u.no}, ${canRead(r) ? whoOf(r) : 'a friend'}'s home`) : L(`${u.no}호, 빈 집`, `#${u.no}, empty`));
    b.onclick = () => live && openUnit(u.no); hits.appendChild(b);
  });
  const spot = (x, y, w, h, label, fn) => { const b = document.createElement('button'); b.className = 'spot'; Object.assign(b.style, { left: (x / 240 * 100) + '%', top: (y / 264 * 100) + '%', width: (w / 240 * 100) + '%', height: (h / 264 * 100) + '%' }); b.setAttribute('aria-label', label); b.onclick = fn; hits.appendChild(b); };
  spot(0, 184, 54, 42, L('산타의 선물가게 들어가기', "Enter Santa's Gift Shop"), openShop); spot(182, 184, 58, 42, L('루돌프네 양말공장 엿보기', "Peek into Rudolph's Sock Factory"), openFactory);
  spot(4, 10, 54, 42, L('연등 따라 무드나잇 산사 가기', 'Follow the lanterns to Moodnight Temple'), openSansa); spot(188, 18, 46, 40, L('연등 따라 무드나잇 산사 가기', 'Follow the lanterns to Moodnight Temple'), openSansa);
  spot(64, 203, 32, 23, L('지하 박살방 내려가기', 'Go down to the Smash Room'), openSmash); spot(196, 226, 44, 36, L('숲속 캠핑장 가는 길', 'Path to the forest camp'), openCamp);
  if (live) spot(138, 205, 38, 21, L(`벽보 보기, ${S.notes.length}장`, `Notice board, ${S.notes.length} notes`), () => openBoard());
  $('#title').textContent = live ? MN(S.name) : L('성탄맨션', 'Christmas Mansion');
  document.title = live ? `${MN(S.name)} | ${L('무드나잇', 'Moodnight')}` : L('성탄맨션 | 무드나잇', 'Christmas Mansion | Moodnight');
  const n = order().length;
  $('#hintChip').textContent = !live ? L('내 맨션을 만들면 친구들이 빈 집에 입주해요', 'Build your mansion and friends move in') : n ? L('불 켜진 창문을 누르면 그 집에 들어가 볼 수 있어요', 'Tap a lit window to peek inside') : (S.owner ? L('아직 빈 맨션이에요. 친구들에게 링크를 보내 보세요', 'Still empty. Send your link to friends!') : L('첫 번째 입주자가 되어 주세요', 'Be the first to move in'));
  $('#ctas').hidden = !live;
  if (live) {
    const mine = mineUnit(), full = n >= 12;
    $('#moveBtn').textContent = S.owner ? L('벽보 보기', 'Notice board') : mine ? L(`내 집 ${mine}호 보기`, `My home #${mine}`) : full ? L('벽보 붙이기', 'Post a note') : L('빈 집에 입주하기', 'Move into an empty unit');
    const bb = $('#boardBtn'); if (bb) { bb.hidden = S.owner || (!mine && full); bb.textContent = S.notes.length ? L(`📌 벽보 보기·붙이기 (${S.notes.length})`, `📌 Notice board (${S.notes.length})`) : L('📌 벽보 붙이기', '📌 Post a note'); }
  }
  if (!live) return;
  if (MODE === 'host') renderHost(); else renderGuest();
}
function statsHTML() {
  const n = order().length;
  return `<div class="stats"><div class="stat"><b>${n}</b><span>${L('입주한 집', 'Moved in')}</span></div><div class="stat"><b>${12 - n}</b><span>${L('빈 집', 'Empty')}</span></div><div class="stat"><b>${S.notes.length}</b><span>${L('벽보', 'Notes')}</span></div></div>`;
}
function listHTML() {
  return `<div style="display:grid;gap:8px"><p class="h2">${L('입주자 명단', 'Residents')}</p><ul class="res">${UNITS.map(u => {
    const r = S.res[u.no];
    if (!r) return `<li><button data-unit="${u.no}"><span class="ho off">${u.no}</span><span><b style="color:var(--snow-soft)">${L('빈 집', 'Empty')}</b><p>${S.owner ? L('아직 아무도 안 들어왔어요', 'No one yet') : L('눌러서 입주하기', 'Tap to move in')}</p></span></button></li>`;
    const ok = canRead(r);
    return `<li><button data-unit="${u.no}"><span class="ho">${u.no}</span><span style="min-width:0"><b>${esc(ok ? whoOf(r) : L('친구', 'A friend'))}</b>${r.mine ? `<span class="lock" style="background:var(--candle);color:#2A1608">${L('내 집', 'Mine')}</span>` : ''}${r.vis === 'owner' ? `<span class="lock">${L('주인만', 'Owner only')}</span>` : ''}<p>${ok ? esc(r.msg || L('(말 없이 불만 켜 뒀어요)', '(Just left the light on)')) : L(`${esc(OWNER_NAME())}님만 볼 수 있는 편지예요`, `Only ${esc(OWNER_NAME())} can read this`)}</p></span></button></li>`;
  }).join('')}</ul></div>`;
}
function bindList() { document.querySelectorAll('[data-unit]').forEach(b => b.onclick = () => openUnit(b.dataset.unit)); }

function renderHost() {
  const n = order().length;
  $('#viewPill').textContent = L('집주인', 'Owner');
  panel(`<div class="who"><b>${esc(MN(S.name))}</b><button class="linkish" id="renameBtn">${L('이름 바꾸기', 'Rename')}</button></div>
    <div id="renameBox" class="field" hidden><label class="lbl2" for="renameIn">${L('친구들이 부르는 이름 <small>2~3글자</small>', 'Name your friends call you <small>2–12 characters</small>')}</label><input type="text" id="renameIn" maxlength="${EN ? 12 : 3}" value="${esc(S.name)}"><p class="err" id="renameErr"></p><div class="ctas"><button class="btn sm" id="renameSave">${L('저장', 'Save')}</button><button class="btn ghost sm" id="renameCancel">${L('취소', 'Cancel')}</button></div></div>
    <p class="sub">${L('불 켜진 창문을 누르면 친구가 남긴 편지를 읽을 수 있어요. 맨션 1층 벽보판에는 입주 못 한 친구들도 한마디 붙여요. 이상한 입주자는 퇴거시키고, 벽보는 뗄 수 있어요.', "Tap a lit window to read your friend's letter. Friends who couldn't move in can post on the ground-floor notice board. You can evict rude residents and take down notes.")}</p>
    ${statsHTML()}
    <div class="share"><p class="h2">${L('친구 불러서 불 밝히기', 'Invite friends to light it up')}</p>
      <div class="linkrow"><code id="linkTxt">${esc(shareUrl().replace(/^https?:\/\//, ''))}</code><button class="btn sm" id="copyBtn">${L('복사', 'Copy')}</button></div>
      ${EN ? '' : '<button class="btn wide kakao" id="kakaoBtn">카카오톡으로 링크 보내기</button>'}
      ${navigator.share ? `<button class="btn ${EN ? '' : 'ghost '}wide" id="moreShare">${L('다른 앱으로 공유', 'Share link')}</button>` : ''}
      <p class="sub">${n ? L(`빈 집이 ${12 - n}개 남았어요.`, `${12 - n} empty unit${12 - n === 1 ? '' : 's'} left.`) : L('집이 12채 있어요.', 'There are 12 units.')} ${L('단톡방에 링크 하나만 올려도 금방 불이 켜져요.', 'Drop the link in one group chat and the lights come on fast.')}</p></div>
    ${listHTML()}
    <p class="fine">${L('다음에 들어올 때도 처음 로그인한 방법으로 로그인해야 이 맨션이 보여요.', 'Next time, log in the same way to see this mansion.')} <button class="linkish" id="logout">${L('로그아웃', 'Log out')}</button> · <button class="linkish" id="delMansion">${L('맨션 삭제', 'Delete mansion')}</button></p>`);
  bindList();
  $('#copyBtn').onclick = copyLink; if ($('#kakaoBtn')) $('#kakaoBtn').onclick = kakaoShare;
  if ($('#moreShare')) $('#moreShare').onclick = () => navigator.share({ title: MN(S.name), text: shareText(), url: shareUrl() }).catch(() => {});
  $('#logout').onclick = logout;
  $('#delMansion').onclick = () => {
    openSheet(L('맨션을 삭제할까요?', 'Delete your mansion?'), `<p class="sub">${L('입주한 친구들의 집과 편지, 벽보가 모두 지워지고 되돌릴 수 없어요. 친구들이 가진 링크도 더는 열리지 않아요.', "All homes, letters and notes will be deleted for good. Your friends' links will stop working.")}</p>
      <div class="ctas"><button class="btn sm" id="delYes">${L('삭제하기', 'Delete')}</button><button class="btn ghost sm" id="delNo">${L('취소', 'Cancel')}</button></div>`);
    $('#delNo').onclick = closeSheet;
    $('#delYes').onclick = async () => {
      $('#delYes').disabled = true;
      const { error } = await sb.rpc('delete_my_mansion');
      if (error) { $('#delYes').disabled = false; return toast(L('삭제하지 못했어요. 잠시 후 다시 시도해 주세요', "Couldn't delete. Please try again.")); }
      closeSheet(); S = { name: '', slug: null, res: {}, notes: [], owner: false }; render(); loadHost(); toast(L('맨션을 삭제했어요', 'Mansion deleted'));
    };
  };
  $('#renameBtn').onclick = () => { $('#renameBox').hidden = false; $('#renameIn').focus(); };
  $('#renameCancel').onclick = () => { $('#renameBox').hidden = true; };
  $('#renameSave').onclick = async () => {
    const name = cleanName($('#renameIn').value);
    if (!nameOk(name)) { $('#renameErr').textContent = L('이름은 2~3글자로 적어 주세요.', 'Please use 2–12 characters.'); return; }
    const { error } = await sb.from('mansions').update({ display_name: name }).eq('owner_id', session.user.id);
    if (error) { $('#renameErr').textContent = L('바꾸지 못했어요. 잠시 후 다시 시도해 주세요.', "Couldn't rename. Please try again."); return; }
    await reload(); toast(L('이름을 바꿨어요', 'Renamed'));
  };
}
const HOW_GUEST = n => EN ? `<ol class="how">
  <li data-i="🏠"><b>Move in</b>Pick one of the 12 units and choose a nickname. No sign-up needed</li>
  <li data-i="🪟"><b>Decorate your window</b>Choose a light color, a window silhouette and a balcony decoration to light up your home</li>
  <li data-i="💌"><b>Leave a letter</b>Write ${esc(n)} a speech-bubble note. Make it 'Only ${esc(n)}' for a secret one</li>
  <li data-i="📌"><b>Notice board</b>Anyone can post on the ground-floor notice board, even without moving in. Notes are public</li>
</ol>` : `<ol class="how">
  <li data-i="🏠"><b>빈 집에 입주</b>12채 중 빈 집 하나를 골라 닉네임을 정해요. 로그인은 필요 없어요</li>
  <li data-i="🪟"><b>창문 꾸미기</b>불빛 색, 창가 그림자, 베란다 소품을 골라 내 집에 불을 켜요</li>
  <li data-i="💌"><b>말풍선 편지</b>${esc(n)}님에게 한마디 남겨요. '${esc(n)}님만 보기'로 비밀 편지도 돼요</li>
  <li data-i="📌"><b>벽보 붙이기</b>맨션 1층 벽보판에는 입주하지 않아도 누구나 한마디 붙일 수 있어요. 벽보는 모두에게 보여요</li>
</ol>`;
const HOW_HOST = EN ? `<ol class="how">
  <li data-i="🔗"><b>Share your link</b>Post your mansion link in a group chat or on Instagram</li>
  <li data-i="🏠"><b>Friends move in</b>Friends pick empty units, decorate their windows and turn on the lights. Fill all 12 and your mansion glows</li>
  <li data-i="💌"><b>Read letters</b>Tap a lit window to read the speech-bubble letter your friend left</li>
  <li data-i="📌"><b>Notice board</b>Friends who couldn't move in can post on the ground-floor notice board</li>
</ol>` : `<ol class="how">
  <li data-i="🔗"><b>링크 공유</b>내 맨션 링크를 단톡방이나 인스타에 올려요</li>
  <li data-i="🏠"><b>친구 입주</b>친구들이 빈 집을 골라 창문을 꾸미고 불을 켜요. 12집이 다 차면 맨션이 환해져요</li>
  <li data-i="💌"><b>편지 읽기</b>불 켜진 창문을 누르면 그 친구가 남긴 말풍선 편지를 읽을 수 있어요</li>
  <li data-i="📌"><b>벽보</b>입주 못 한 친구도 맨션 1층 벽보판에 한마디 붙일 수 있어요</li>
</ol>`;

function renderGuest() {
  const mine = mineUnit(), n = order().length;
  $('#viewPill').textContent = mine ? L(`${mine}호 입주자`, `Resident of #${mine}`) : L('놀러 온 친구', 'Visitor');
  panel(`<div class="who"><b>${esc(MN(S.name))}</b></div>
    <p class="sub">${mine ? L(`${mine}호에 불을 켜 두었어요. 다른 친구들이 들어올수록 맨션이 환해져요.`, `Your light is on in #${mine}. The more friends move in, the brighter it gets.`) : n >= 12 ? L('맨션이 꽉 찼어요. 들어오지 못한 친구는 벽보에 한마디 남길 수 있어요.', "The mansion is full. You can still leave a note on the notice board.") : L(`${esc(S.name)}님의 맨션 빈 집에 들어와 불을 켜 주세요. 이렇게 놀아요.`, `Move into an empty unit in ${esc(POSS(S.name))} mansion and turn on the light. Here's how:`)}</p>
    ${mine ? '' : HOW_GUEST(S.name)}
    ${statsHTML()}
    ${listHTML()}
    <a class="btn wide" href="/mansion/${EN ? 'en' : ''}">${L('나도 내 맨션 만들기', 'Build my own mansion')}</a>
    <p class="fine">${L('욕설이나 상처 주는 말은 집주인이 퇴거시킬 수 있어요. <a href="/terms.html">이용약관</a>', 'The owner can evict anyone who leaves hurtful words. <a href="/terms.html">Terms</a>')}</p>`);
  bindList();
}

/* ── 집 안 보기 ── */
let roomTimer = null;
function openUnit(no) {
  const r = S.res[no];
  if (!r) { if (S.owner) { toast(L(`${no}호는 아직 빈 집이에요`, `#${no} is still empty`)); return; } if (mineUnit()) { toast(L('이미 이 맨션에 입주했어요. 한 사람당 한 집이에요', "You've already moved in. One home per person")); return; } F.unit = no; return openMove(); }
  const ok = canRead(r);
  const who = esc(ok ? whoOf(r) : L('친구', 'A friend'));
  openSheet(HO(no), `<div class="who"><b>${L(`${who}네 집`, `${who}'s home`)}${r.mine ? L(' (내 집)', ' (mine)') : ''}</b><span>${nm(LIGHTS, r.light)} · ${nm(SILS, r.sil)} · ${nm(POSES, r.pose)}</span></div>
   <div class="room"><canvas id="roomCv" width="200" height="125"></canvas><div class="bubble${ok ? '' : ' locked'}">${ok ? (r.msg ? esc(r.msg) : '…') : L(`이 집 편지는 ${esc(OWNER_NAME())}님만 볼 수 있어요`, `Only ${esc(OWNER_NAME())} can read this letter`)}</div></div>
   <p class="hint">${r.vis === 'owner' ? (view === 'owner' || r.mine ? L(`'주인만 보기'로 남긴 편지예요. 다른 친구에게는 잠겨 보여요.`, "This letter is 'owner only'. Other friends see it locked.") : L('입주한 친구가 맨션 주인만 읽게 해 뒀어요.', 'This resident made their letter owner-only.')) : L('이 집 편지는 놀러 온 친구 누구나 읽을 수 있어요.', 'Any visitor can read this letter.')}</p>
   ${view === 'owner' && r.id ? `<div class="evict" id="evictBox"><p>${L('집주인 관리 · 이상한 말을 남긴 입주자는 내보낼 수 있어요.', 'Owner tools · You can evict residents who leave hurtful words.')}</p><div class="row"><button class="btn danger sm" id="evictBtn">${L(`${no}호 퇴거시키기`, `Evict #${no}`)}</button></div></div>` : ''}`);
  const eb = $('#evictBtn'); if (eb) eb.onclick = () => {
    $('#evictBox').innerHTML = `<p>${L(`${esc(whoOf(r))}님을 내보낼까요? 집과 편지가 모두 사라지고, 같은 닉네임이나 같은 기기로는 다시 입주할 수 없어요.`, `Evict ${esc(whoOf(r))}? Their home and letter will be removed, and they can't move back in with the same nickname or device.`)}</p>
      <label class="check"><input type="checkbox" id="evictReport"> ${L('욕설이나 괴롭힘이라 신고도 함께 할게요', "Also report it as abuse or harassment")}</label>
      <div class="row"><button class="btn danger sm" id="evictYes">${L('퇴거시키기', 'Evict')}</button><button class="btn ghost sm" id="evictNo">${L('그만두기', 'Cancel')}</button></div>`;
    $('#evictNo').onclick = () => openUnit(no);
    $('#evictYes').onclick = async () => {
      $('#evictYes').disabled = true;
      const { error } = await sb.rpc('evict_resident', { p_resident_id: r.id, p_reason: $('#evictReport').checked ? '집주인 신고: 욕설·괴롭힘' : null });
      if (error) { toast(errMsg(error)); $('#evictYes').disabled = false; return; }
      lastNew = null; closeSheet(); await reload(); stamp(L(`${no}호 방 빼!`, `#${no}, out!`)); toast(L(`${whoOf(r)}님을 퇴거시켰어요. ${no}호가 빈 집이 됐어요`, `${whoOf(r)} was evicted. #${no} is empty now`));
    };
  };
  const rc = $('#roomCv'); let tt = 0; const loop = () => { if ($('#overlay').hidden || !document.body.contains(rc)) return; drawRoom(rc, r, no, tt); tt += 16; roomTimer = reduce ? null : setTimeout(loop, 60); }; loop();
}
function stamp(t) { $('#stampText').textContent = t; const s = $('#stamp'); s.hidden = false; clearTimeout(stamp.t); stamp.t = setTimeout(() => s.hidden = true, 1500); }

/* ── 입주하기 ── */
const F = { unit: null, nick: '', light: 'amber', sil: 'lean', item: 'sock', pose: 'stand', msg: '', vis: 'all' };
function openMove() {
  const empties = UNITS.filter(u => !S.res[u.no]).map(u => u.no);
  if (!empties.length) { openBoard(L('빈 집이 없어요. 들어오지 못한 친구는 벽보에 한마디 남길 수 있어요.', "No empty units left. You can still leave a note on the board.")); return; }
  if (!F.unit || S.res[F.unit]) F.unit = empties[empties.length - 1];
  const chip = (arr, key, sw) => arr.map(o => `<button type="button" data-k="${key}" data-v="${o.id}" aria-pressed="${F[key] === o.id}">${sw ? `<i style="background:${o.c};color:${o.c}"></i>` : ''}${o.name}</button>`).join('');
  const h = `<div class="pv"><canvas id="pvUnit" width="40" height="36"></canvas><canvas id="pvRoom" width="200" height="125"></canvas></div>
  <div class="field"><label class="lbl2" for="fnick"><span class="n">1</span>${L('닉네임 <small>문패와 명단에 나와요</small>', 'Nickname <small>Shown on your door and the list</small>')}</label><input type="text" id="fnick" maxlength="8" placeholder="${L('예: 302호 고양이', 'e.g. Cat in 302')}" autocomplete="off" value="${esc(F.nick)}"></div>
  <div class="field"><div class="lbl2"><span class="n">2</span>${L('호수 고르기', 'Pick a unit')}</div><div class="units">${UNITS.map(u => `<button type="button" data-u="${u.no}" aria-pressed="${F.unit === u.no}" ${S.res[u.no] ? 'disabled' : ''}>${u.no}<small>${S.res[u.no] ? L('입주 완료', 'Taken') : L('빈 집', 'Empty')}</small></button>`).join('')}</div></div>
  <div class="field"><div class="lbl2"><span class="n">3</span>${L('창문 불빛', 'Window light')}</div><div class="chips">${chip(LIGHTS, 'light', true)}</div></div>
  <div class="field"><div class="lbl2"><span class="n">4</span>${L('창에 비치는 그림자', 'Silhouette in the window')}</div><div class="chips">${chip(SILS, 'sil')}</div></div>
  <div class="field"><div class="lbl2"><span class="n">5</span>${L('베란다 꾸미기', 'Balcony decoration')}</div><div class="chips">${chip(ITEMS, 'item')}</div></div>
  <div class="field"><div class="lbl2"><span class="n">6</span>${L('집 안 내 모습', 'You, inside')}</div><div class="chips">${chip(POSES, 'pose')}</div></div>
  <div class="field"><label class="lbl2" for="fmsg"><span class="n">7</span>${L('말풍선 한마디 <small>창문을 누르면 보여요</small>', 'Speech bubble <small>Shows when someone taps your window</small>')}</label><textarea id="fmsg" maxlength="60" placeholder="${L('올해 고마웠던 거 한 줄', 'One line about what you were thankful for this year')}">${esc(F.msg)}</textarea><div class="meta"><span>${L('최대 60자', 'Up to 60 characters')}</span><span id="fcount">${F.msg.length}/60</span></div>
   <div class="chips"><button type="button" data-k="vis" data-v="all" aria-pressed="${F.vis === 'all'}">${L('모두 보기', 'Everyone')}</button><button type="button" data-k="vis" data-v="owner" aria-pressed="${F.vis === 'owner'}">${L(`${esc(OWNER_NAME())}님만 보기`, `Only ${esc(OWNER_NAME())}`)}</button></div></div>
  <p class="err" id="ferr" role="alert"></p><button class="btn wide" id="fgo">${L(`${F.unit}호에 입주하기`, `Move into #${F.unit}`)}</button>
  <p class="hint">${L('한 사람당 한 집이에요. 입주한 뒤에는 고칠 수 없어요.', "One home per person. You can't change it after moving in.")}</p>`;
  const MOVE_T = L('빈 집에 입주하기', 'Move into an empty unit');
  const sh = $('.sheet'), keep = !$('#overlay').hidden && $('#sheetTitle').textContent === MOVE_T ? sh.scrollTop : 0;
  openSheet(MOVE_T, h); sh.scrollTop = keep;
  const preview = { who: F.nick || L('나', 'Me'), light: F.light, sil: F.sil, item: F.item, pose: F.pose, msg: F.msg, vis: F.vis };
  const tmp = document.createElement('canvas'); tmp.width = 240; tmp.height = 264; C = tmp.getContext('2d'); drawStatic({ res: { ...S.res, [F.unit]: preview }, notes: S.notes });
  const u = UNITS.find(x => x.no === F.unit), pu = $('#pvUnit').getContext('2d'); pu.drawImage(tmp, u.x, u.y, 40, 36, 0, 0, 40, 36);
  drawRoom($('#pvRoom'), preview, F.unit, 0);
  const ni = $('#fnick'), ta = $('#fmsg'); ni.oninput = () => F.nick = ni.value; ta.oninput = () => { F.msg = ta.value; $('#fcount').textContent = ta.value.length + '/60'; };
  document.querySelectorAll('.units button').forEach(b => b.onclick = () => { F.unit = b.dataset.u; openMove(); });
  document.querySelectorAll('.chips button[data-k]').forEach(b => b.onclick = () => { F[b.dataset.k] = b.dataset.v; openMove(); });
  $('#fgo').onclick = async () => {
    const err = $('#ferr'), nick = F.nick.trim();
    if (!nick) { err.textContent = L('닉네임을 적어 주세요. 문패에 들어가요.', 'Enter a nickname. It goes on your door.'); ni.focus(); return; }
    $('#fgo').disabled = true; $('#fgo').textContent = L('이삿짐 옮기는 중…', 'Moving in…');
    const { error } = await sb.rpc('move_in', { p_slug: S.slug, p_unit: F.unit, p_nick: nick, p_light: F.light, p_sil: F.sil, p_item: F.item, p_pose: F.pose, p_msg: F.msg.trim(), p_vis: F.vis, p_device: DEVICE });
    if (error) { err.textContent = errMsg(error); $('#fgo').disabled = false; $('#fgo').textContent = L(`${F.unit}호에 입주하기`, `Move into #${F.unit}`); if (/taken|full/.test(error.message || '')) { await reload(); } return; }
    window.mnTrack && mnTrack('act', 'movein');
    const no = F.unit; lastNew = no; Object.assign(F, { unit: null, nick: '', msg: '' });
    closeSheet(); await reload(); $('#frame').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); stamp(L(`${no}호에 불이 켜졌어요`, `#${no} lights up!`));
  };
}

/* ── 벽보 ── */
const B = { who: '', text: '' }; let newNote = -1;
function openBoard(lead) {
  const full = order().length >= 12;
  const h = `${lead || full ? `<p class="hint">${esc(lead || L('맨션이 꽉 찼어요. 들어오지 못한 친구는 벽보에 한마디 남겨요.', "The mansion is full. Friends who couldn't move in leave a note here."))}</p>` : `<p class="hint">${L('입주하지 않아도 누구나 벽보에 한마디 붙일 수 있어요. 벽보는 모두에게 보여요.', "Anyone can post a note, even without moving in. Notes are public.")}</p>`}
   <div class="notes">${S.notes.length ? S.notes.map((n, i) => `<div class="note${i === newNote ? ' new' : ''}" style="background:${NOTE_COLORS[i % 5]};transform:rotate(${(i % 3 - 1) * 2.5}deg)">${esc(n.text)}<b>— ${esc(n.who)}</b>${view === 'owner' && n.id ? `<button class="rm" data-rm="${n.id}" aria-label="${esc(L(`${n.who}님 벽보 떼기`, `Remove ${n.who}'s note`))}">${L('떼기', 'Remove')}</button>` : ''}</div>`).join('') : `<p class="hint" style="color:#F3E3D0">${L('아직 붙은 벽보가 없어요.', 'No notes yet.')}</p>`}</div>
   ${S.owner ? `<p class="hint">${L('욕설이 담긴 벽보는 떼면 같은 기기에서 다시 붙일 수 없게 막아 둘게요.', "If you remove an abusive note, that device can't post again.")}</p>` : `<div class="field"><label class="lbl2" for="bwho">${L('닉네임 <small>비우면 익명</small>', 'Nickname <small>Leave blank to stay anonymous</small>')}</label><input type="text" id="bwho" maxlength="8" placeholder="${L('익명', 'Anonymous')}" autocomplete="off" value="${esc(B.who)}"></div>
   <div class="field"><label class="lbl2" for="btext">${L('벽보 한마디', 'Your note')}</label><textarea id="btext" maxlength="40" placeholder="${L('방빼!! 나도 들어가고 싶었는데', 'No vacancy?! I wanted in too')}">${esc(B.text)}</textarea><div class="meta"><span>${L('최대 40자', 'Up to 40 characters')}</span><span id="bcount">${B.text.length}/40</span></div>
   <div class="chips">${(EN ? ['No vacancy?!', 'I wanted in too', 'Merry Christmas!', "I'm moving in next year"] : ['방빼!!', '나도 들어가고 싶었는데', '크리스마스 잘 보내', '내년엔 꼭 입주한다']).map(t => `<button type="button" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>
   <p class="err" id="berr" role="alert"></p><button class="btn wide" id="bgo">${L('벽보 붙이기', 'Post note')}</button>`}`;
  openSheet(L(`벽보 · ${S.notes.length}장`, `Notice board · ${S.notes.length}`), h);
  document.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const { error } = await sb.rpc('remove_note', { p_note_id: b.dataset.rm, p_reason: '집주인이 뗌' });
    if (error) { toast(errMsg(error)); b.disabled = false; return; }
    newNote = -1; await reload(); openBoard(lead); toast(L('벽보를 뗐어요', 'Note removed'));
  });
  if (S.owner) return;
  const bw = $('#bwho'), bt = $('#btext'); bw.oninput = () => B.who = bw.value; bt.oninput = () => { B.text = bt.value; $('#bcount').textContent = bt.value.length + '/40'; };
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { B.text = (B.text ? B.text + ' ' : '') + b.dataset.t; B.text = B.text.slice(0, 40); bt.value = B.text; $('#bcount').textContent = B.text.length + '/40'; });
  $('#bgo').onclick = async () => {
    const text = B.text.trim(); if (!text) { $('#berr').textContent = L('한마디를 적어 주세요.', 'Please write something.'); bt.focus(); return; }
    $('#bgo').disabled = true;
    const { error } = await sb.rpc('post_note', { p_slug: S.slug, p_who: B.who.trim(), p_text: text, p_device: DEVICE });
    if (error) { $('#berr').textContent = errMsg(error); $('#bgo').disabled = false; return; }
    window.mnTrack && mnTrack('act', 'note');
    Object.assign(B, { who: '', text: '' }); await reload(); newNote = S.notes.length - 1; openBoard(); toast(L('벽보를 붙였어요', 'Note posted'));
  };
}
function openFactory() {
  openSheet(L('루돌프네 양말공장', "Rudolph's Sock Factory"), EN ? `<div class="shop" style="background-color:#3A2418"><h3>Rudolph's Sock Factory</h3><p>A tiny factory next to the gift shop. Rudolph hooks yarn on his antlers and knits socks all night. When his nose blinks, one sock is done!</p><p style="color:var(--candle)">It's closed for now. Too many Christmas stocking orders.</p></div><p class="hint">Opening soon. For now you can only watch Rudolph work through the window.</p>` : `<div class="shop" style="background-color:#3A2418"><h3>루돌프네 양말공장</h3><p>선물가게 옆 작은 공장이에요. 루돌프가 뿔에 실을 걸고 밤새 양말을 떠요. 코가 깜빡이면 한 짝 완성!</p><p style="color:var(--candle)">지금은 크리스마스 양말 주문이 밀려서 문이 닫혀 있어요.</p></div><p class="hint">곧 열려요. 창문 너머로 루돌프가 일하는 모습만 볼 수 있어요.</p>`);
}
function openSansa() {
  window.mnTrack && mnTrack('act', 'lantern');
  openSheet(L('하늘에 뜬 연등', 'Lanterns in the sky'), `<div class="shop" style="background-color:#1B1B36"><h3>${L('무드나잇 산사', 'Moodnight Temple')}</h3><p>${L('밤하늘에 떠가는 연등은 무드나잇 산사에서 날린 소원이에요. 마음에 걸린 걸 적고 목탁을 두드려 흩어 보내고, 소원은 연등으로 띄울 수 있어요.', 'These lanterns were sent up from Moodnight Temple. Write down what weighs on you, tap the moktak to let it go, and float your wish up as a lantern.')}</p>
    <a class="btn" href="/sansa/?ref=mansion_lantern" data-door="${L('무드나잇 산사', 'Moodnight Temple')}">${L('연등 따라 산사 가기', 'Follow the lanterns')}</a></div>
    <p class="hint">${L('무드나잇의 또 다른 놀이, 무드나잇 산사로 연결돼요. 로그인 없이 바로 할 수 있어요.', "Takes you to Moodnight's other page, Moodnight Temple (Korean only). No login needed.")}</p>`);
}
function openSmash() {
  window.mnTrack && mnTrack('act', 'b1');
  openSheet(L('지하 1층', 'Basement'), `<div class="shop" style="background-color:#1E1424"><h3>${L('B1 박살방', 'B1 Smash Room')}</h3><p>${L('맨션 지하 창고예요. 오늘 빡친 일을 적어 붙이고 키보드, 모니터, 머그컵을 망치로 와장창 부숴도 돼요. 누른 자리가 그대로 깨져요.', 'The storage room under the mansion. Stick on whatever made you mad today, then smash the keyboard, monitor and mug with a hammer.')}</p>
    <a class="btn" href="/smash/?ref=mansion_b1" data-door="${L('박살방', 'Smash Room')}">${L('지하로 내려가기', 'Head downstairs')}</a></div>
    <p class="hint">${L('무드나잇의 또 다른 놀이, 박살방으로 연결돼요. 로그인 없이 바로 할 수 있어요.', "Takes you to Moodnight's Smash Room (Korean only). No login needed.")}</p>`);
}
function openCamp() {
  window.mnTrack && mnTrack('act', 'camp_sign');
  openSheet(L('숲속 캠핑장 가는 길', 'Path to the forest camp'), `<div class="shop" style="background-color:#1F2E22"><h3>MY LITTLE CAMP</h3><p>${L('마을 길 끝, 산사로 올라가는 숲길에 있는 캠핑장이에요. 12자리 중 한 곳에 내 텐트를 치고 꾸미고, 모닥불 옆 게시판에 이웃 캠퍼들과 쪽지를 남겨요.', 'A campsite at the end of the road, on the forest path up to the temple. Pitch your own tent on one of 12 sites, decorate it, and leave notes for your neighbors on the board by the campfire.')}</p>
    <a class="btn" href="/camp/?ref=mansion_sign" data-door="${L('숲속 캠핑장', 'Forest camp')}">${L('숲길 따라가기', 'Follow the path')}</a></div>
    <p class="hint">${L('무드나잇의 또 다른 놀이, 숲속 캠핑장으로 연결돼요.', "Takes you to Moodnight's forest camp (Korean only).")}</p>`);
}
function openShop() {
  openSheet(L('산타의 선물가게', "Santa's Gift Shop"), `<div class="shop"><h3>${L('산타의 선물가게', "Santa's Gift Shop")}</h3><p>${L('맨션 1층 모퉁이 가게예요. 친구에게 익명 선물과 편지를 맡겨 두면, 크리스마스에 열어 보고 누가 보냈는지 단서로 맞혀요.', 'The corner shop on the ground floor. Friends leave anonymous gifts and letters, and on Christmas you open them and guess who sent each one from the clues.')}</p>
    <a class="btn" href="/santa/${EN ? 'en' : ''}" data-door="${L('산타의 선물가게', "Santa's Gift Shop")}">${L('선물가게 들어가기', 'Go to the gift shop')}</a></div>
    <p class="hint">${L('무드나잇의 또 다른 놀이, 산타의 선물가게로 연결돼요.', "Takes you to Moodnight's other game, Santa's Gift Shop.")}</p>`);
}

/* ── 저장 ── */
/* ── 인스타 공유 이미지 (1080×1350) ── 맨션 그림 + 몇 집 불 켜졌는지 + 놀이 방법. 편지 내용은 안 들어가요 */
async function saveImage() {
  try { await Promise.all(['56px Galmuri14', '30px Galmuri11', '700 30px Galmuri11'].map(f => document.fonts.load(f))); } catch (e) {}
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const n = typeof order === 'function' ? order().length : Object.keys(S.res).length, left = 12 - n;
  const name = S.name || '', link = (S.slug ? shareUrl() : `${location.origin}/mansion/`).replace(/^https?:\/\//, '');
  g.fillStyle = '#0F1B28'; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.03)'; for (let x = 0; x < W; x += 6) g.fillRect(x, 0, 1, H); for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 1);
  // 맨션 그림 (눈송이만, 흐린 빛 번짐은 빼고)
  const snap = document.createElement('canvas'); snap.width = 240; snap.height = 264; const sg = snap.getContext('2d'); sg.drawImage(base, 0, 0); C = sg;
  drawOverlay(sg, 0, true); FL.forEach(f => { if (f.y < 226) { sg.fillStyle = '#fff'; sg.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s); } });
  const SH = 240, FW = 840, FH = Math.round(924 * SH / 264), FX = (W - FW) / 2, FY = 200;
  g.fillStyle = '#060C14'; g.fillRect(FX - 9, FY - 9, FW + 18, FH + 18); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(FX + 9, FY + FH + 9, FW + 9, 9); g.fillRect(FX + FW + 9, FY + 9, 9, FH + 9);
  g.drawImage(snap, 0, 0, 240, SH, FX, FY, FW, FH);
  const tag = (text, x, y, bg, fg, line, size) => { g.font = `700 ${size}px Galmuri11`; const tw = g.measureText(text).width + 20, h = size + 10, lx = Math.round(x - tw / 2), ly = Math.round(y);
    if (line) { g.fillStyle = line; g.fillRect(lx - 3, ly - 3, tw + 6, h + 6); } g.fillStyle = bg; g.fillRect(lx, ly, tw, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, lx + tw / 2, ly + h / 2 + 1); };
  tag(L('산타의 선물가게', "Santa's Gift Shop"), FX + FW * .116, FY + FH * .692 * 264 / SH, '#C8553D', '#FFF4DE', '#FFD27A', EN ? 16 : 19);
  tag(L('루돌프네 양말공장', 'Sock Factory'), FX + FW * .881, FY + FH * .692 * 264 / SH, '#5A3A2A', '#FFF4DE', '#C8423A', EN ? 16 : 19);
  tag(L('성탄맨션', 'Xmas Mansion'), FX + FW * .5, FY + FH * .79 * 264 / SH, '#F3D9A4', '#3A2418', '#7A4A2A', EN ? 16 : 18);
  // 글자
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const ttl = name ? MN(name) : L('성탄맨션', 'Christmas Mansion');
  g.font = '56px Galmuri14'; if (g.measureText(ttl).width > W - 80) g.font = '44px Galmuri14';
  g.fillStyle = '#7A2E26'; g.fillText(ttl, W / 2 + 4, 78 + 4);
  g.fillStyle = '#FFD27A'; g.fillText(ttl, W / 2, 78);
  g.fillStyle = '#C9D6E3'; g.font = '30px Galmuri11'; g.fillText(L(`12집 중 ${n}집에 불이 켜졌어요`, `${n} of 12 windows are lit`), W / 2, 146);
  const msg = left ? L(`빈 집 ${left}채! 한 칸 골라서 불 켜 줘`, `${left} empty! Pick one & light it up`) : L('12집 모두 불이 켜졌어요!', 'All 12 windows are lit!');
  g.font = '44px Galmuri14'; const mw = g.measureText(msg).width + 56;
  g.fillStyle = '#060C14'; g.fillRect(W / 2 - mw / 2 - 4, 1110 - 4, mw + 8, 76 + 8); g.fillStyle = '#C8553D'; g.fillRect(W / 2 - mw / 2, 1110, mw, 76);
  g.fillStyle = '#7A2E26'; g.fillRect(W / 2 - mw / 2, 1110 + 70, mw, 6);
  g.fillStyle = '#FFF4DE'; g.fillText(msg, W / 2, 1146);
  g.fillStyle = '#9FB2C6'; g.font = '26px Galmuri11'; g.fillText(L('빈 집 고르기 · 창문 꾸미기 · 집주인에게 편지 남기기', 'Pick a unit · Decorate your window · Leave a letter'), W / 2, 1236);
  g.fillStyle = '#FFD27A'; g.font = '26px Galmuri11'; g.fillText(link, W / 2, 1290);
  // 창
  const url = c.toDataURL('image/png');
  const blob = await new Promise(ok => c.toBlob(ok, 'image/png'));
  const file = blob && new File([blob], 'moodnight-mansion.png', { type: 'image/png' });
  const canFile = file && navigator.canShare && navigator.canShare({ files: [file] });
  window.mnTrack && mnTrack('share', 'card');
  openSheet(L('인스타 공유 이미지', 'Image for Instagram'), `<img class="shot" alt="${L('맨션 공유 이미지', 'Mansion share image')}" src="${url}">
    ${canFile ? `<button class="btn wide" id="cardShare">${L('인스타·카톡으로 공유하기', 'Share to Instagram & more')}</button>` : ''}
    <a class="btn ${canFile ? 'ghost ' : ''}wide" id="cardSave" href="${url}" download="moodnight-mansion.png">${L('이미지 저장하기', 'Save image')}</a>
    <p class="hint">${L(`편지 내용은 이미지에 들어가지 않아요. 휴대폰에서 저장이 안 되면 이미지를 꾹 눌러 저장해 주세요. 인스타 스토리에는 링크 스티커로 <b>${link}</b>를 붙여 주세요.`, `Letters are never in the image. If saving doesn't work on your phone, press and hold the image. On Instagram Stories, add <b>${link}</b> as a link sticker.`)}</p>`);
  if ($('#cardShare')) $('#cardShare').onclick = () => { window.mnTrack && mnTrack('share', 'card_native'); navigator.share({ files: [file], text: `${left ? L(`내 성탄맨션에 빈 집이 ${left}채 남았어. 하나 골라서 불 켜 줘!`, `My Christmas Mansion has ${left} empty units. Pick one and turn on the light!`) : L('내 성탄맨션이 꽉 찼어!', 'My Christmas Mansion is full!')}\n${location.protocol}//${link}` }).catch(() => {}); };
}

/* ── 공유 ── */
const shareText = () => { const n = 12 - order().length; return n ? L(`${S.name}의 성탄맨션에 빈 집이 ${n}개 남았어. 하나 골라서 불 좀 켜 줘!`, `${MN(S.name)} has ${n} empty unit${n === 1 ? '' : 's'}. Move in and turn on a light!`) : L(`${S.name}의 성탄맨션이 꽉 찼어! 벽보에 한마디 남겨 줘`, `${MN(S.name)} is full! Leave a note on the board`); };
async function copyLink() {
  window.mnTrack && mnTrack("share", "copy");
  try { await navigator.clipboard.writeText(`${shareText()}\n${shareUrl()}`); toast(L('링크를 복사했어요', 'Link copied')); }
  catch (e) { const r = document.createRange(); r.selectNodeContents($('#linkTxt')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(L('링크를 선택했어요. 길게 눌러 복사하세요', 'Link selected. Press and hold to copy')); }
}
function kakaoShare() {
  window.mnTrack && mnTrack("share", "kakao");
  const url = shareUrl(), n = 12 - order().length;
  try {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: { title: n ? `${S.name}의 성탄맨션에 빈 집이 ${n}개 남았어요` : `${S.name}의 성탄맨션이 꽉 찼어요`, description: n ? '하나 골라서 입주하고 창문에 불을 켜 주세요' : '들어오지 못한 친구는 벽보에 한마디 남겨요',
        imageUrl: 'https://www.moodnight.co.kr/mansion/og.png?v=2', imageWidth: 1200, imageHeight: 630, link: { mobileWebUrl: url, webUrl: url } },
      buttons: [{ title: n ? '입주하러 가기' : '벽보 붙이러 가기', link: { mobileWebUrl: url, webUrl: url } }]
    });
  } catch (e) { copyLink(); }
}

/* ── 로그인과 맨션 만들기 ── */
function renderLogin() {
  $('#viewPill').textContent = L('내 맨션 만들기', 'Build a mansion');
  panel(`<div class="who"><b>${L('내 성탄맨션 만들기', 'Build your Christmas Mansion')}</b></div>
    <p class="sub">${L('눈 내리는 밤, 내 이름이 붙은 12집짜리 맨션 한 동이 생겨요.', 'On a snowy night, you get a 12-unit mansion with your name on it.')}</p>${HOW_HOST}
    ${EN ? '<button class="btn wide" id="loginGoogle">Continue with Google</button><button class="btn ghost wide" id="loginKakao">Continue with Kakao</button>' : '<button class="btn wide kakao" id="loginKakao">카카오로 시작하기</button><button class="btn ghost wide" id="loginGoogle">구글로 시작하기</button>'}
    <p class="fine">${L('맨션을 만드는 사람만 로그인해요. 로그인하면 <a href="/terms.html">이용약관</a>과 <a href="/privacy.html">개인정보처리방침</a>에 동의하는 것으로 봐요. 만 14세 이상만 만들 수 있어요.', "Only the mansion owner logs in. Friends don't need an account. By logging in you agree to our <a href=\"/terms.html\">Terms</a> and <a href=\"/privacy.html\">Privacy Policy</a> (in Korean). You must be 14 or older.")}</p>`);
  const back = location.origin + '/mansion/';
  $('#loginKakao').onclick = () => sb.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: back, scopes: 'profile_nickname profile_image' } });
  $('#loginGoogle').onclick = () => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back } });
}
function renderCreate() {
  const m = session.user.user_metadata || {};
  const raw = (m.name || m.full_name || m.nickname || '').replace(/\s/g, '');
  const raw2 = EN ? ((m.name || m.full_name || m.nickname || '').trim().split(/\s+/)[0] || '') : raw;
  const guess = nameOk(raw2) ? raw2 : '';
  $('#viewPill').textContent = L('내 맨션 만들기', 'Build a mansion');
  panel(`<div class="who"><b>${L('맨션 이름 정하기', 'Name your mansion')}</b></div>
    <p class="sub">${L('친구들이 링크를 열면 "○○의 성탄맨션"으로 보여요. 친구들이 부르는 이름이나 별명을 2~3글자로 써 주세요.', `Friends will see "___'s Christmas Mansion". Use the name or nickname your friends call you (2–12 characters).`)}</p>
    <div class="field"><input type="text" id="mName" maxlength="${EN ? 12 : 3}" value="${esc(guess)}" placeholder="${L('예: 하린', 'e.g. Emily')}"></div>
    <p class="err" id="mErr"></p>
    <button class="btn wide" id="mGo">${L('맨션 짓기', 'Build my mansion')}</button>
    <p class="fine"><button class="linkish" id="logout">${L('다른 계정으로 로그인', 'Log in with another account')}</button></p>`);
  $('#logout').onclick = logout;
  $('#mGo').onclick = async () => {
    const name = cleanName($('#mName').value);
    if (!nameOk(name)) { $('#mErr').textContent = L('이름은 2~3글자로 적어 주세요.', 'Please use 2–12 characters.'); return; }
    $('#mGo').disabled = true;
    const { error } = await sb.from('mansions').insert({ owner_id: session.user.id, display_name: name });
    if (error && error.code !== '23505') { $('#mErr').textContent = L('만들지 못했어요. 잠시 후 다시 시도해 주세요.', "Couldn't build it. Please try again."); $('#mGo').disabled = false; return; }
    if (!error) window.mnTrack && mnTrack('create', 'mansion');
    await loadHost(); stamp(L('맨션 완공!', 'Built!')); toast(L('맨션이 생겼어요. 링크를 친구들에게 보내 보세요', 'Your mansion is ready. Send the link to your friends!'));
  };
}
async function logout() { await sb.auth.signOut(); session = null; S = { name: '', slug: null, res: {}, notes: [], owner: false }; render(); renderLogin(); }

async function loadHost() {
  try { if (DEVICE) sb.rpc('mark_admin_device', { p_device: DEVICE }).then(() => {}, () => {}); } catch (e) {}  // 관리자 기기면 방문 숫자에서 빼요
  const { data: mine } = await sb.from('mansions').select('slug').eq('owner_id', session.user.id).maybeSingle();
  if (!mine) { render(); renderCreate(); return; }
  S.slug = mine.slug; await reload();
}
async function loadGuest() {
  const { data, error } = await sb.rpc('get_mansion', { p_slug: pathSlug, p_device: DEVICE });
  if (error || !data) { render(); panel(`<div class="who"><b>${L('맨션을 찾을 수 없어요', 'Mansion not found')}</b></div><p class="sub">${L('링크가 잘못됐거나 맨션이 없어졌어요. 링크를 보낸 친구에게 다시 확인해 주세요.', 'The link may be wrong, or the mansion was deleted. Check with the friend who sent it.')}</p><a class="btn wide" href="/mansion/${EN ? 'en' : ''}">${L('나도 내 맨션 만들기', 'Build my own mansion')}</a>`); return; }
  if (data.is_owner) { location.replace('/mansion/'); return; }
  if (window.mnFriends) {  // 친구 집 기록: 이 기기에만 저장, 주인에게는 알려지지 않아요
    const first = !mnFriends.list().length;
    mnFriends.visit('mansion', data.slug, data.display_name);
    if (first) setTimeout(() => toast(L('\'내가 놀러 간 친구 집\'에 저장했어요. 나만 볼 수 있어요', 'Saved to places you visited. Only you can see it')), 2500);
  }
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
if ($('#boardBtn')) $('#boardBtn').onclick = () => openBoard();
/* 다른 친구가 입주하면 보이게, 화면을 보고 있을 때 30초마다 새로고침 */
setInterval(() => { if (S.slug && document.visibilityState === 'visible' && $('#overlay').hidden) reload(); }, 30000);

render(); requestAnimationFrame(frame);
(async function init() {
  const { data } = await sb.auth.getSession(); session = data.session;
  if (MODE === 'guest') return loadGuest();
  if (window.mnFriends) setTimeout(() => mnFriends.announce(), 1200);  // 새 기능 안내 (기기당 한 번)
  if (!session) { renderLogin(); return; }
  if (location.hash.includes('access_token')) history.replaceState(null, '', '/mansion/');
  loadHost();
})();
sb.auth.onAuthStateChange((evt, s) => { if (MODE === 'host' && evt === 'SIGNED_IN' && !session) { session = s; loadHost(); } });
})();
