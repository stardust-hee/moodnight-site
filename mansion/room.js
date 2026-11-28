/* 성탄맨션 방 꾸미기 엔진: 방 그리기 · 가구 반응 · 방 꾸미기 · 선물 고르기
   확인용 화면(방 꾸미기 데모)에서 옮겨 왔어요. 그림 코드는 window.MNRoom 하나로만 열려 있어요.
   글자는 window.LANG === 'en' 이면 영어로 나와요. */
(function () {
'use strict';
const EN = () => window.LANG === 'en';
const T = (ko, en) => EN() ? en : ko;
let C = null;
const R=(x,y,w,h,c)=>{C.fillStyle=c;C.fillRect(x|0,y|0,w|0,h|0)},P=(x,y,c)=>R(x,y,1,1,c);
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,t)=>{const A=hx(a),B=hx(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const rgba=(h,a)=>{const A=hx(h);return `rgba(${A[0]},${A[1]},${A[2]},${a})`};
const glow=(cx,cy,r,c,a)=>{[[r,a*.35],[r*.7,a*.55],[r*.42,a*.8]].forEach(([rr,aa])=>{C.fillStyle=rgba(c,aa);for(let y=-Math.round(rr);y<=Math.round(rr);y++){const w=Math.round(Math.sqrt(Math.max(0,rr*rr-y*y)));C.fillRect(cx-w,cy+y,w*2+1,1)}})};
const LIGHTS=[['호박빛','#FF9A3C'],['촛불빛','#FFD27A'],['장밋빛','#FF8F7A'],['풀빛','#D4E89A'],['달빛','#A9C8F0']];
const FLOORS=['나무','장판','체크'];
const AV={stand:['....hhhh....','...hhhhhh...','...hssssh...','...skssks...','...ssssss...','....ssss....','...rrrrrr...','..bbbbbbbb..','.bbbbbbbbbb.','.bbbbbbbbbb.','.sbbbbbbbbs.','..bbbbbbbb..','..pppppppp..','..ppp..ppp..','..ppp..ppp..','..ppp..ppp..','.ddd....ddd.'],
 manse:['....hhhh....','s..hhhhhh..s','b..hssssh..b','b..skssks..b','.b.ssmmss.b.','.b..ssss..b.','..brrrrrrb..','..bbbbbbbb..','..bbbbbbbb..','..bbbbbbbb..','..bbbbbbbb..','..bbbbbbbb..','..pppppppp..','..ppp..ppp..','..ppp..ppp..','..ppp..ppp..','.ddd....ddd.'],
 sit:['....hhhh........','...hhhhhh.......','...hssssh.......','...skssks.......','...ssssss.......','....ssss........','...rrrrrr.......','..bbbbbbbb......','.sbbbbbbbbs.....','..bbbbbbbb......','..pppppppppppp..','..ppppppppppppdd','cccccccccccc....','cccccccccccc....'],
 lie:['.hhsss..'+'.'+'................','hhsksss.'+'.'+'................','hhsssms.'+'.'+'rbbbbbbbbpppppdd','hhsssms.'+'s'+'rbbbbbbbbpppppdd','hhsksss.'+'.'+'rbbbbbbbbppppp..','.hhsss..'+'.'+'s.......s.......']};
const AVG={
 stand:['...hhhhhh...','..hhhhhhhh..','..hhssssho.'+'.','..hskssksh..','..hssssssh..','..h.ssss.h..','..hrrrrrrh..','.hbbbbbbbbh.','.bbbbbbbbbb.','.bbbbbbbbbb.','.sbbbbbbbbs.','..bbbbbbbb..','..qqqqqqqq..','.qqqqqqqqqq.','...ss..ss...','...ss..ss...','..ddd..ddd..'],
 manse:['...hhhhhh...','s.hhhhhhhh.s','b.hhsssshh.b','b.hskssksh.b','.bhssmmsshb.','.bh.ssss.hb.','..brrrrrrb..','..bbbbbbbb..','..bbbbbbbb..','..bbbbbbbb..','..bbbbbbbb..','..bbbbbbbb..','..qqqqqqqq..','.qqqqqqqqqq.','...ss..ss...','...ss..ss...','..ddd..ddd..'],
 sit:['...hhhhhh.......','..hhhhhhhh......','..hhsssshh......','..hskssksh......','..hssssssh......','..h.ssss.h......','..hrrrrrrh......','..bbbbbbbb......','.sbbbbbbbbs.....','..bbbbbbbb......','..qqqqqqqqqqqq..','..qqqqqqqqqqqqdd','cccccccccccc....','cccccccccccc....'],
 lie:['.hhosss.'+'.'+'................','hhhsksss'+'.'+'................','hhhsssms'+'.'+'rbbbbbbbbqqqqqdd','hhhsssms'+'s'+'rbbbbbbbbqqqqqdd','hhhsksss'+'.'+'rbbbbbbbbqqqqq..','.hhhhhs.'+'.'+'s.......s.......']};
const POSES=[['stand','서 있기'],['manse','만세'],['sit','앉기'],['lie','눕기']];
const CHS={"new": {"p": {"0": "#fadec1", "1": "#452923", "2": "#bf725f", "3": "#f9b595", "4": "#57342c", "6": "#39211e", "7": "#d3ad8e", "9": "#927362", "a": "#7e5046", "b": "#0b0705", "c": "#ea6b50", "d": "#b38b76", "e": "#673f36", "f": "#732f2b", "g": "#e9c8ab"}, "r": {"stand": [".........66666.........", "........6000006........", "........6000006........", "........6000006........", "......66ddddddd61......", "......600000000006.....", "....660000000000006....", "..6100000000000000066..", "..60777777777777777066.", "..6777700g700700777716.", "600700700g700700700g006", "600700700g7007007007006", "60070016666666661007006", "60071611111911111617006", "60006644444334444667006", ".666444444333344444666.", ".664443333333333344466.", ".6644333b33333b3334466.", ".6644333b33333b3334466.", "61133333b33333b33333116", "611eecc333333333ccee116", "61111333dCCCCC3333616..", ".66113333CCCCC3333616..", "...611133CCCC2336666...", "....6AAAAAAAAAAAAA6....", "....6AAAAAAAAAAAAA6....", "....6AAAAAAAAAAAAA6....", "....6fAAAAAAAAAAAf6....", "...600ffffffffffff06...", "...6007000000fAAAf06...", "...4007000000fAAAf09...", "..600077A0AA0fAAAf006..", "..600070A00A0fAfff006..", "..66666000000ff0e6666..", "...3331000000000a133...", "...33310000000006633...", "....331666666666663....", "......66eee6eee16......", "......66eee6eee46......", ".....6eeeee6eeeee6.....", ".....6eeeee6eeee46.....", ".....666666.666666....."], "manse": ["...........66666............", "..........6000006...........", "..........6000006...........", "..........6000006...........", "........66ddddddd66.........", "......664000000000016.......", "......6600000000000041......", ".....6000000000000000g6.....", "....60777777777777777006....", "....67777g00700700777776....", "..660gg07g007007007007006...", "..660g707g007007007007006...", "..660g7006666666666007006...", "..66001664441ad1141666006...", "..61006614444334444666006...", "....661444e43333e4444666....", "....64444333333333344446....", "..66644433bb3333bb33444666..", ".161614e336b3333bb33ee46146.", "63333633336b3333bb3333133336", "63333614cc33333333ccc1633336", "63333666333CCCCCC33316633336", ".16660063332CCCC23336106666.", "..6670006633CCCC3376100g66..", "..660000fAAAAAAAAAABf0006...", "....1000fAAAAAAAAAABf006....", "....6600fAAAAAAAAAABf066....", ".....600fffffffffffff06.....", "......660000000fBAA466......", ".......60A000A0fAAA46.......", ".......62AA0AAAfAAA46.......", ".......60A000A0fAAA46.......", "......600000000fAAfg66......", "......6000000000Bf0066......", "......6000000000000066......", "......666666666666666.......", ".......6666666666666........", "........6eeee666eee6........", "........6eeee6.6eee6........", ".......6eeeee6.6eeee6.......", ".......6eeeee6.6eeee6.......", ".......666666..666666......."], "sit": ["...........6666.........", "..........6000066.......", ".........60000066.......", ".........60000066.......", "......666ddddddd166.....", "......6400000000046.....", "....6600000000000006....", "...600000000000000006...", "..17007777777777770071..", ".660777g007007007777066.", ".667707g007007007707716.", "6007707g0070070077070006", "6007707999999a99a0070006", "600g70766666666660070006", "600066644447344446660006", "600664444433334444466006", ".6644433333333333444666.", ".6644433b43333b33344466.", ".6644733be3333b33344466.", ".6633333b43333b33333466.", "61433cc333333333cc334116", "611663333CCCCC233366166.", ".66163333CCCCCC33361166.", "...6666333CCCC3366666...", "....6AAAAAAAAAAAAA66....", "....6AAAAAAAAAAAAA66....", "....6AAAAAAAAAAAAA66....", "....61fffffffffffff16...", "....6fffffffffffffAB6...", "...60000020000ffAAAA6...", "...6000g6AA0AA6dBAAA6...", "..6664000600A1g0BAAAf6..", ".66aa666669006666BB706..", ".66aaa6d33616aaae6A006..", ".66aaa6d33d66aaaa60006..", ".66aaa6d33d66aaaa6666...", ".66aaa6666666aaaa6......", "...6666.....666666......"], "lie": ["........6666.......................", ".......6000076.....................", ".......6000076.....................", ".......600079666...................", "......61dddd0000166................", "....66a0000000000dd4...............", "...666000000gggg00001..............", ".660000077777777777006.............", ".660077770070007007776.............", ".6677700700700070070006............", "60070700700700070070006............", "60070700666666666600006............", "60070466444433444466601666.........", "60066144444333344441616666.........", ".666444333333333344416ddd06........", ".6644443b33333b3344446g00066666....", ".6644433b33333b334444166006644e66..", ".6643333b33333b333331111000g14e46..", "61443cc333333333cc3314ff0AA064eaa66", "661473333CCCCC3333d91AAf0A006aaaa66", ".66666333CCCCC336666AAAf00006aaaa66", ".660001133CCC336add6AAAfd0006aaaa66", ".660000g6ee44e6000006AAA4g006aaaa66", ".66000006111113g00006AAAA416666666.", ".66000g066666630000061AAAA6666666..", "...66666......666666..666666......."]}}, "girl": {"p": {"0": "#452826", "1": "#fabb9f", "2": "#782f2b", "3": "#fadabe", "5": "#d6ae92", "6": "#603d35", "7": "#050403", "8": "#ac8572", "9": "#6c463d", "a": "#c1967e", "b": "#e0bca3", "c": "#402523", "d": "#fa997d", "e": "#54332e", "f": "#946c5e", "g": "#7a564b", "h": "#f7ceb2"}, "r": {"stand": ["...........000c..........", "..........033330.........", ".........c3333330........", ".........0333333c........", ".......00caaaaaacc0......", ".....c033333333333c0.....", "....03333333333333330....", "...09333hbbbbbbbb33330...", "...c3h5555555555555b3g...", "..0855h53355335335h55h0..", "..c353353355335335335300.", "..c553353355335335335500.", ".0335333ccccccccc033533bc", ".0330cc06666666666c0033bc", ".c330ee66666666666eec33b0", ".c30666666666a166666603bc", ".00c66661166611166666ec0.", "..c6666611a51111116666c..", "..06666117c111171116660..", "..06166117c111171116190..", ".066166dd11111111d16156c.", "06669661d15222211d1666660", "0666666111122221111666660", "0666ee0c111222111ccee666c", "0e66eceAAAAAAAAAAAAce66e0", ".0e66cAAAAAAAAAAAAAce660.", "..e6ecAAAAAAAAAAAAAce66..", "c666cc22AAAAAAAAAA2cc6660", "ceeec333222222222223ceee0", "ceeec33a333333b2AA230eee0", ".00c333a333333b2AA233c00.", ".00c333abAA3AAh2AA233c00.", "...0888f3A33A3b2AA288c...", "....c0cc3333333222eccc...", "....011c3333333333c11c...", "....0110eeeeeeeeeec19c...", ".....0eccccccccccc.f.....", ".......08111cd111c.......", "........999e.0999c.......", ".......c9990.c9990c......", ".......c999c.09990c......", ".......ccccc.cccccc......"], "manse": ["...........00000............", "..........ch3333c...........", ".........083333390..........", ".........0833333g0..........", "........00faaaaa600.........", "......003333333333300.......", ".....0333333333333333c......", "....0833h555555555533390....", "....035555b55bb5bb555330....", "...0h5535h335335335355hf0...", "...c35335h335335335333530...", "...c55335333533533533355c...", "..0335333cccccccccc3335330..", "..033cccc6666666666ccc3330..", "..0330666666666666666c3330..", "..03c666666666616666660fhc..", "...c0666661166111666666cc...", "..c0e66661101111a5166666cc..", ".011066611f711117711666011c.", "c111106111f71111771166c11110", "c11110011d11111111dd6e011110", "011103cc111122221111c0301110", ".c003330c1112222111ec333000.", "..c33333c01122221100g33330..", "...e33332AAAAAAAAAA22333c...", "...0h3332AAAAAAAAAA2233h....", "....03332AAAAAAAAAA293h0....", "...06cf322222222222293060...", "...0ee003aaaaaa22AA2ccee0...", "...0eeec33333332AAAAc0ee0...", "....00003A333A32AAAA0000....", ".......03AA3AAA2AAAA0.......", "......0333333A332222bc......", "......c3333333333333bc......", "......c3333333333333bc......", "......c00000000000c0cc......", ".........000000cc00c........", ".........c1116c111c.........", ".........c996..099c.........", "........c9999..c9990........", "........c9999..0999c........", "........ccccc..ccccc........"], "sit": ["...........c0000.........", "..........033333.........", ".........03333330........", ".........03333330........", "........c0aaaaaa00.......", "......00333333333300.....", "....0c633333333333300....", "...cg333333333333333fc...", "...033355555555555333f...", "..0fb5553355335335555b0..", "..0h5b35335533533533530..", "..055335335533533533550..", "0033533bccccccccc03353390", "00330c0666666666660c03390", "003300c66666666666cc0339c", "003c66666666651666666c390", "..ce666611666111666666c0.", "..c66666119811111566660..", "..c6668117111117111666c..", ".0e616811711111711161g60.", "0666168dd51111111d161a660", "0666668dd12222211d1666660", "0666e68111f22221111666660", ".066ee00111222111ccee660.", "..66ecAAAAAAAAAAAAAce660.", ".e666cAAAAAAAAAAAAAc666e.", "c666ecAAAAAAAAAAAAAcee660", "0eee0c222222222222200eee0", "0000033333333332AAAec0000", ".000033333333332AAA20000.", "....03333AA3AAh2AAAA0....", "...c3ccc3A33hcccc2220....", "..c309990333a0999c33c....", "..c609999c00c9999c830....", "..0609999c11c9999c830....", "..0609999c11c9999c83c....", "...cc999ec00069990cc.....", ".....cccc....cccc........"], "lie": ["...........00000....................", ".........00333300...................", ".........c3333330...................", ".........c3333330...................", ".......c0caaaaa8000.................", ".....0033333333333c0................", "....c3333333333333330...............", "...03335555555555533300.............", "...0h55533533533555533c.............", "..035535335335335b35b30.............", "..cb53353353353355335h0.............", ".c35333b0cccc00cc3335bf00...........", ".c35339966666666e699b33g0...........", ".c35bh006666666660003h3g0...........", ".c35cc66666g16666666c03gc0000cc.....", ".0306666666g1a6666666che053330cc....", "..c66661166g1116966666ccch3333c6c...", "..0666f111a1111115616666e03A3309c...", ".c6666111111111115619eee6c3AA330c0c.", "06666617771117771566eAAAce0a333c90cc", "0666661111111111156eAAAAc603333c999c", "0660000e111111100cccAAAAceec333c999c", "06chhhh001111101hhh3ceA2000ec33c999c", ".c0hhhhhc0000c1hhh3306AAAAAAcccc999c", "..chhhhh0ccccchhhh33ceAAAAAA0c0cccc.", "...ccccc......cccccccccccccc........"]}}};
const SWC=['#B5523B','#3F6C8E','#5B8C5A','#C99A3A','#8A5A9E','#D07A8C','#4E8C8A'];
const SWN=['벽돌','겨울하늘','이끼','겨자','자주','살구','청록'];
const shade=(c,k)=>mix(c,'#000000',k);
function drawMe(x,y,pose,sw,flip,ck){const CH=CHS[ck]||CHS.new,CHP=CH.p,rows=CH.r[pose],base=SWC[sw],sh={A:base,B:shade(base,.18),C:shade(base,.34)},w=rows[0].length;rows.forEach((r,j)=>{for(let i=0;i<w;i++){const ch=r[flip?w-1-i:i];if(ch==='.')continue;R(x+i,y+j,1,1,sh[ch]||CHP[ch])}})}

const SPR=(x,y,rows,map,s=1,flip)=>rows.forEach((row,j)=>{const r=flip?[...row].reverse():[...row];r.forEach((ch,i)=>{if(map[ch])R(x+i*s,y+j*s,s,s,map[ch])})});
/* 가구 도트 (x,y = 왼쪽 위). 방 전체 조명색 L 사용 */
const WD='#6B4A35',WD2='#3A261C';
const F={
 rug:{n:'러그',w:56,h:16,floor:1,d(x,y){for(let j=0;j<16;j++){const w=Math.round(28*Math.sqrt(1-((j-7.5)**2)/70));R(x+28-w,y+j,w*2,1,j%4<2?'#B5523B':'#D9A06A')}}},
 bed:{n:'침대',w:44,h:24,d(x,y){R(x,y+6,44,18,WD);R(x,y,5,24,WD2);R(x+2,y+6,40,12,'#E7E1D6');R(x+16,y+6,26,12,'#B5523B');R(x+16,y+6,26,2,'#D9705A');R(x+4,y+7,10,6,'#FFFFFF');R(x+4,y+12,10,1,'#CBD3DC');R(x+2,y+22,3,2,WD2);R(x+40,y+22,3,2,WD2)}},
 sofa:{n:'소파',w:40,h:20,d(x,y){R(x+2,y,36,10,'#8E4646');R(x,y+6,40,14,'#7A3B3B');R(x,y+6,5,14,'#6A3030');R(x+35,y+6,5,14,'#6A3030');R(x+5,y+10,30,6,'#9A4A4A');R(x+20,y+10,1,6,'#6A3030');R(x+3,y+18,3,2,WD2);R(x+34,y+18,3,2,WD2)}},
 desk:{n:'책상',w:36,h:32,d(x,y){R(x+12,y+13,12,1,'#444');R(x+10,y,16,12,'#2B2B33');R(x+11,y+1,14,9,'#7FD1FF');R(x+11,y+1,14,2,'#A9E4FF');R(x+17,y+11,3,2,'#444');R(x,y+14,36,3,'#8A6240');R(x,y+14,36,1,'#A67B52');R(x+2,y+17,3,15,WD);R(x+31,y+17,3,15,WD);R(x+7,y+12,6,2,'#CCD3DA')}},
 shelf:{n:'책장',w:20,h:38,d(x,y){R(x,y,20,38,WD);R(x+2,y+2,16,34,WD2);[12,24].forEach(a=>R(x+2,y+a,16,2,WD));const bk=['#C8423A','#3F6C8E','#E6B66A','#5B8C5A','#8A5A9E'];for(let r=0;r<3;r++)for(let i=0;i<5;i++)R(x+3+i*3,y+4+r*12+(i%2),2,7-(i%2),bk[(i+r)%5])}},
 tree:{n:'트리',w:30,h:44,d(x,y,t){const T=t||0,cx=x+15;glow(cx,y+5,8,'#FFE08A',.35);
  [[0,0],[-1,1],[1,1],[0,1],[0,2],[-2,2],[2,2],[-1,3],[1,3],[-3,2],[3,2]].forEach(([a,b])=>P(cx+a,y+b+2,b<2?'#FFF2B8':'#FFD23A'));R(cx-2,y+4,5,2,'#FFD23A');
  R(x+12,y+38,6,5,'#6B4A35');R(x+13,y+38,2,5,'#8A6244');
  [[7,11,6],[15,13,10],[25,13,14]].forEach(([ty,h,mw],k)=>{for(let i=0;i<h;i++){const hw=Math.round(3+(mw-3)*i/(h-1)),yy=y+ty+i;R(cx-hw,yy,hw*2+1,1,'#1F5A33');R(cx-hw,yy,hw+1,1,'#2E7A44');if(i%4===1)R(cx-hw+2,yy,Math.max(1,hw-3),1,'#3E9A56');P(cx-hw,yy,'#15432A');P(cx+hw,yy,'#15432A');if(i===h-1){for(let q=-hw;q<=hw;q+=3)P(cx+q,yy,'#15432A')}if(i>1&&i%5===2){P(cx-hw+1,yy,'#EAF6EA');P(cx+hw-1,yy,'#EAF6EA')}}});
  R(x+7,y+40,16,4,'#C8423A');R(x+7,y+40,16,1,'#EEF3F8');R(x+8,y+43,14,1,'#8E2F2A');
  for(let i=0;i<21;i++){const gy=y+30+Math.round(2*Math.sin(i/21*Math.PI*2)),gx=x+5+i;P(gx,gy,i%4<2?'#FFD23A':'#E8B02A')}
  for(let i=0;i<14;i++){const gy=y+20+Math.round(1.5*Math.sin(i/14*Math.PI*2)),gx=x+8+i;P(gx,gy,i%4<2?'#FFD23A':'#E8B02A')}
  [[12,27,'#E04A56'],[17,32,'#5FB4F0'],[13,34,'#FFD23A'],[6,34,'#9A7AE0'],[22,34,'#E04A56'],[13,21,'#FF9AB8'],[17,22,'#FFD23A'],[14,12,'#5FB4F0'],[12,17,'#E04A56']].forEach(([a,b,c])=>{R(x+a,y+b,3,3,c);P(x+a,y+b,'#FFFFFF');P(x+a+1,y+b-1,'#8A8A8A')});
  [[14,9],[19,22],[9,27],[21,30],[12,36],[18,36],[16,16],[23,36],[6,36]].forEach(([a,b],i)=>{const on=(Math.floor(T/450)+i)%2;P(x+a,y+b,on?['#FF6B6B','#FFE08A','#7FD1FF','#B4F08A'][i%4]:'#2E5A3A');if(on){C.fillStyle=rgba(['#FF6B6B','#FFE08A','#7FD1FF','#B4F08A'][i%4],.28);C.fillRect(x+a-1,y+b-1,3,3)}})}},
 cat:{n:'고양이집',w:24,h:22,d(x,y){R(x,y+8,24,14,'#B88B4A');R(x+2,y+2,20,6,'#8A5A3A');R(x+6,y,12,2,'#8A5A3A');R(x+7,y+11,10,11,'#2A1E22');R(x+8,y+12,8,3,'#6A4A38');P(x+9,y+14,'#FFE08A');P(x+14,y+14,'#FFE08A');R(x+8,y+11,2,2,'#D9A06A');R(x+14,y+11,2,2,'#D9A06A')}},
 table:{n:'라면 상',w:30,h:18,d(x,y){R(x,y+9,30,3,'#8A6240');R(x+3,y+12,3,6,WD);R(x+24,y+12,3,6,WD);R(x+9,y+3,12,6,'#C8CCD2');R(x+9,y+3,12,2,'#E4E7EB');R(x+7,y+5,2,2,'#7A7F88');R(x+21,y+5,2,2,'#7A7F88');P(x+12,y,'#CFE3F2');P(x+15,y+1,'#CFE3F2');P(x+18,y,'#CFE3F2');R(x+11,y+6,8,1,'#FF9A3C')}},
 heater:{n:'난로',w:16,h:24,d(x,y){glow(x+8,y+14,14,'#FF9A3C',.35);R(x+6,y,4,5,'#4A4A52');R(x,y+5,16,19,'#3A3A42');R(x+3,y+10,10,9,'#FF9A3C');R(x+3,y+10,10,3,'#FFD27A');R(x+2,y+22,12,2,'#2A2A30')}},
 plant:{n:'화분',w:14,h:26,d(x,y){R(x+3,y+17,8,9,'#B5523B');R(x+2,y+17,10,2,'#D9705A');[[2,6,5],[7,2,6],[5,10,5],[0,12,4],[9,11,5]].forEach(([a,b,s])=>{R(x+a,y+b,s,3,'#3E8350');R(x+a+1,y+b+3,s-2,2,'#2E6A3E')});R(x+6,y+8,2,10,'#2E6A3E')}},
 gift:{n:'선물상자',w:16,h:14,d(x,y){R(x,y+4,16,10,'#C8423A');R(x,y+4,16,2,'#E05A4A');R(x+7,y+4,2,10,'#FFE08A');R(x,y+8,16,2,'#FFE08A');R(x+4,y,4,4,'#FFE08A');R(x+8,y,4,4,'#FFE08A')}},
 frame:{n:'액자',w:16,h:18,d(x,y){R(x,y,16,18,WD);R(x+2,y+2,12,14,'#24384C');R(x+2,y+11,12,5,'#E8EFF6');for(let i=0;i<5;i++)R(x+3+i,y+10-i,6-i*2>0?6-i*2:1,1,'#5A7490');P(x+10,y+5,'#FFE08A')}},
 lights:{n:'전구 줄',w:44,h:8,wall:1,d(x,y,t){for(let i=0;i<44;i++)P(x+i,y+Math.round(2*Math.sin(i/44*Math.PI)*-1+2),'#2A1E22');for(let i=3;i<44;i+=6){const yy=y+Math.round(2-2*Math.sin(i/44*Math.PI))+1,c=['#FF6B6B','#FFE08A','#7FD1FF','#B4F08A'][(i/6|0)%4],on=((i/6|0)+Math.floor((t||0)/500))%2;R(x+i,yy,2,3,on?c:mix(c,'#000000',.55));if(on){C.fillStyle=rgba(c,.25);C.fillRect(x+i-2,yy-1,6,5)}}}},
 lamp:{n:'스탠드',w:12,h:38,d(x,y){glow(x+6,y+6,16,'#FFD27A',.35);R(x+1,y,10,8,'#FFD27A');R(x+1,y,10,2,'#FFF0C0');R(x+5,y+8,2,26,'#2A1E22');R(x+2,y+34,8,4,'#2A1E22')}}
};
const sp=(x,y,t,k)=>{if(Math.floor((t||0)/300+k)%3===0){P(x,y-1,'#FFFFFF');P(x,y+1,'#FFFFFF');P(x-1,y,'#FFFFFF');P(x+1,y,'#FFFFFF')}};
F.g_star={n:'금빛 별',w:15,h:15,gift:1,wall:1,d(x,y,t){glow(x+7,y+7,12,'#FFE08A',.4);['.....X.....','....XXX....','XXXXXXXXXXX','.XXXXXXXXX.','..XXXXXXX..','..XXXXXXX..','.XXX...XXX.','.XX.....XX.'].forEach((r,j)=>[...r].forEach((c,i)=>{if(c==='X')P(x+2+i,y+3+j,j<3?'#FFE9A8':'#F2B83A')}));sp(x+1,y+2,t,0);sp(x+13,y+10,t,1)}};
F.g_blanket={n:'포근 담요',w:32,h:12,gift:1,floor:1,d(x,y){R(x,y+2,32,10,'#B5523B');for(let i=0;i<32;i+=8)R(x+i,y+2,3,10,'#8E3A2A');for(let j=2;j<12;j+=4)R(x,y+j,32,2,'#D9705A');R(x+4,y,24,3,'#C8553D');for(let i=0;i<32;i+=3)R(x+i,y+11,1,2,'#E9D8BA')}};
F.g_cocoa={n:'코코아',w:14,h:16,gift:1,d(x,y,t){R(x+2,y+6,9,9,'#EEF3F8');R(x+11,y+8,3,4,'#EEF3F8');R(x+12,y+9,1,2,'#2A3A4A');R(x+3,y+7,7,2,'#6B3A22');R(x+2,y+14,9,1,'#C8D0D8');const k=Math.floor((t||0)/400);P(x+5+(k%2),y+3-(k%2),'#CFE3F2');P(x+7-(k%2),y+1+(k%2),'#CFE3F2');P(x+6,y,'#9FB2C6')}};
F.g_globe={n:'스노우볼',w:16,h:20,gift:1,d(x,y,t){R(x+2,y+14,12,6,'#6B4A35');R(x+1,y+17,14,3,'#3A261C');for(let j=0;j<14;j++){const w=Math.round(7*Math.sqrt(1-((j-6.5)**2)/50));R(x+8-w,y+j,w*2,1,'#2A4A6A')}R(x+4,y+10,8,3,'#EEF3F8');for(let i=3;i<6;i++)R(x+8-(i-2),y+10-(i-2)*2+2,(i-2)*2,1,'#2E6A3E');for(let k=0;k<6;k++){const f=((t||0)/90+k*7)%12;P(x+3+((k*5)%10),y+1+f,'#FFFFFF')}R(x+3,y+2,2,3,'rgba(255,255,255,.35)')}};
F.g_lantern={n:'소원 등불',w:14,h:22,gift:1,d(x,y,t){const f=.4+.15*Math.sin((t||0)/260);glow(x+7,y+11,13,'#FF9A3C',f);R(x+6,y,2,3,'#3A2418');R(x+2,y+3,10,13,'#E9702F');R(x+3,y+4,8,11,'#FF9A3C');R(x+5,y+6,4,7,'#FFE08A');R(x+2,y+9,10,1,'rgba(90,30,20,.4)');R(x+3,y+16,8,2,'#3A2418');R(x+5,y+18,1,4,'#FFD27A');R(x+8,y+18,1,3,'#FFD27A')}};
F.g_wreath={n:'반짝 리스',w:20,h:20,gift:1,wall:1,d(x,y,t){for(let j=0;j<20;j++)for(let i=0;i<20;i++){const dd=Math.hypot(i-9.5,j-9.5);if(dd<9.5&&dd>5)P(x+i,y+j,(i+j)%3?'#2E6A3E':'#3E8350')}R(x+7,y+15,6,4,'#C8423A');R(x+5,y+17,4,3,'#C8423A');R(x+11,y+17,4,3,'#C8423A');[[3,8],[10,2],[16,8],[5,14],[15,14]].forEach(([a,b],i)=>{const on=(Math.floor((t||0)/450)+i)%2;P(x+a,y+b,on?['#FF6B6B','#FFE08A','#7FD1FF'][i%3]:'#4A3A2A')})}};

F.g_poop={n:'응가',w:16,h:16,gift:1,d(x,y,t){const k='#7A4A2A',h='#9A6338';R(x+1,y+11,14,5,k);R(x+3,y+7,10,5,k);R(x+5,y+3,6,5,k);R(x+7,y,3,4,k);R(x+2,y+11,12,1,h);R(x+4,y+7,8,1,h);R(x+6,y+3,4,1,h);R(x+4,y+9,2,2,'#FFFFFF');R(x+9,y+9,2,2,'#FFFFFF');P(x+5,y+10,'#2A1E22');P(x+10,y+10,'#2A1E22');R(x+6,y+13,4,1,'#2A1E22');const a=(t||0)/250;P(Math.round(x+8+Math.cos(a)*9),Math.round(y+3+Math.sin(a)*3),'#2A2A30');P(Math.round(x+8+Math.cos(a+3)*9),Math.round(y+3+Math.sin(a+3)*3),'#2A2A30')}};
F.g_toilet={n:'황금 변기',w:18,h:22,gift:1,d(x,y,t){const g='#E6B63A',l='#FFE08A';R(x+2,y,14,9,g);R(x+2,y,14,2,l);R(x+1,y+9,16,3,g);R(x+2,y+12,14,5,g);R(x+4,y+17,10,5,'#B88A22');R(x+3,y+12,2,4,l);R(x+5,y+10,8,2,'#8A6A18');const on=Math.floor((t||0)/350)%3;if(on===0){P(x+1,y+2,'#FFF');P(x,y+2,'#FFF');P(x+2,y+2,'#FFF');P(x+1,y+1,'#FFF');P(x+1,y+3,'#FFF')}if(on===1){P(x+16,y+14,'#FFF');P(x+15,y+14,'#FFF');P(x+17,y+14,'#FFF');P(x+16,y+13,'#FFF');P(x+16,y+15,'#FFF')}}};
F.g_chicken={n:'대왕 치킨',w:16,h:18,gift:1,d(x,y){R(x+3,y,10,3,'#E9D8BA');R(x+2,y+1,3,2,'#E9D8BA');R(x+11,y+1,3,2,'#E9D8BA');R(x+6,y+3,4,5,'#E9D8BA');for(let j=0;j<10;j++){const w=Math.round(7*Math.sqrt(1-((j-5)**2)/36));R(x+8-w,y+8+j,w*2,1,j<2?'#E8A33A':'#C8782A')}R(x+3,y+10,2,2,'#F2C066');R(x+9,y+13,2,1,'#8A4A1A')}};
F.g_sock={n:'꼬린내 양말',w:18,h:20,gift:1,d(x,y,t){R(x+3,y+4,8,4,'#EEF3F8');R(x+3,y+4,8,1,'#C8423A');R(x+3,y+6,8,1,'#C8423A');R(x+3,y+8,8,7,'#C8423A');R(x+3,y+15,12,4,'#C8423A');R(x+11,y+17,4,2,'#9E2F28');R(x+4,y+9,2,5,'#E05A4A');for(let i=0;i<3;i++){const f=((t||0)/200+i*4)%12;P(x+4+i*5+Math.round(Math.sin(f/1.5)*1.5),y+3-Math.floor(f/2)+ (i%2?2:0),'#7CC95A');P(x+4+i*5+Math.round(Math.sin(f/1.5)*1.5),y+4-Math.floor(f/2)+(i%2?2:0),'#5FA83E')}}};
F.g_duck={n:'오리 튜브',w:20,h:16,gift:1,d(x,y,t){const b=Math.floor((t||0)/500)%2;R(x+3,y+7+b,15,8,'#FFD23A');R(x+2,y+9+b,2,4,'#FFD23A');R(x+14,y+2+b,6,7,'#FFD23A');R(x+17,y+4+b,3,2,'#F08A2A');R(x+17,y+2+b,1,1,'#2A1E22');R(x+5,y+9+b,6,3,'#F2B81F');R(x+3,y+14,15,1,'#C8A020')}};
F.g_onigiri={n:'삼각김밥',w:16,h:16,gift:1,d(x,y){for(let j=0;j<16;j++){const w=Math.round(1+j*.5);R(x+8-w,y+j,w*2,1,j<10?'#F4F6F8':'#2A2E34')}R(x+3,y+11,10,1,'#2A2E34');R(x+6,y+5,1,2,'#2A1E22');R(x+9,y+5,1,2,'#2A1E22');R(x+7,y+8,2,1,'#F08A8A')}};
F.g_whoopee={n:'방귀 쿠션',w:22,h:12,gift:1,d(x,y,t){const k=Math.floor((t||0)/700)%4===0;for(let j=0;j<8;j++){const w=Math.round(10*Math.sqrt(1-((j-3.5)**2)/20));R(x+11-w,y+4+j-(k?1:0),w*2,1,'#E86A9A')}R(x+5,y+5,8,1,'#F7A6C6');if(k){R(x+22-3,y+3,3,2,'#CFE3F2');R(x+20,y+6,3,2,'#9FB2C6')}}};
F.g_potato={n:'멋쟁이 감자',w:16,h:16,gift:1,d(x,y){for(let j=0;j<16;j++){const w=Math.round(7*Math.sqrt(1-((j-7.5)**2)/70)+.5);R(x+8-w,y+j,w*2,1,'#B88B4A')}R(x+4,y+3,3,1,'#D9B06A');R(x+10,y+12,2,1,'#8A6232');R(x+3,y+6,10,3,'#1C1C22');R(x+4,y+7,3,1,'#6A7A8A');R(x+7,y+6,2,1,'#1C1C22');R(x+6,y+11,4,1,'#8A3A3A')}};
F.g_fish={n:'멍한 물고기',w:24,h:12,gift:1,d(x,y,t){const w=Math.floor((t||0)/400)%2;R(x+4,y+2,14,8,'#4A8CC8');R(x+4,y+2,14,2,'#7FB8E8');R(x+18,y+3+w,5,2,'#3A6CA0');R(x+19,y+7-w,4,2,'#3A6CA0');R(x+6,y+4,4,4,'#FFFFFF');R(x+8,y+5,2,2,'#2A1E22');R(x+1,y+6,4,1,'#F08A8A');R(x+11,y+4,1,5,'#3A6CA0');R(x+14,y+4,1,5,'#3A6CA0')}};

const K='#2A1E22',bl=(x,y,ws,c)=>ws.forEach((w,j)=>R(x+Math.round((10-w)/2),y+j,w,1,c));
const FNT={L:['X..','X..','X..','X..','XXX'],E:['XXX','X..','XXX','X..','XXX'],V:['X.X','X.X','X.X','X.X','.X.'],U:['X.X','X.X','X.X','X.X','XXX'],P:['XXX','X.X','XXX','X..','X..'],'!':['X','X','X','.','X']};
const txt=(x,y,str,c)=>{let cx=x;[...str].forEach(ch=>{const g=FNT[ch];g.forEach((r,j)=>[...r].forEach((v,i)=>{if(v==='X')P(cx+i,y+j,c)}));cx+=g[0].length+1})};
F.pcpink={n:'핑크 컴퓨터',w:22,h:20,d(x,y){const o='#E470A0';R(x+2,y,16,13,o);R(x+3,y+1,14,11,'#F2DCE6');R(x+5,y+3,10,7,'#B9A3D0');R(x+6,y+4,8,5,'#DACFE8');R(x+7,y+5,4,2,'#F6F0F4');R(x+9,y+7,4,2,'#F6F0F4');R(x+7,y+5,4,1,'#EEA0C0');R(x+9,y+7,4,1,'#EEA0C0');R(x+1,y+13,20,7,o);R(x+2,y+14,18,5,'#F0DCE4');R(x+4,y+16,2,2,'#E8E08A');R(x+11,y+16,7,1,o);R(x+11,y+17,7,1,'#EEB0CC')}};
F.strawberry={n:'딸기',w:10,h:12,d(x,y){bl(x,y+3,[6,8,10,10,10,8,6,4],'#E04A56');R(x+2,y+1,6,2,'#4E9A4E');R(x+4,y,2,2,'#3E7A3E');[[3,5],[6,5],[4,7],[7,7],[5,9]].forEach(([a,b])=>P(x+a,y+b,'#FFE08A'))}};
F.clover={n:'네잎클로버',w:12,h:14,d(x,y){[[3,3],[8,3],[3,7],[8,7]].forEach(([a,b])=>{R(x+a-2,y+b-1,4,3,'#3E9A52');R(x+a-1,y+b-2,2,5,'#3E9A52');P(x+a-1,y+b-1,'#7AD08A')});R(x+5,y+9,2,5,'#2E7A42')}};
F.sunflower={n:'해바라기',w:14,h:22,d(x,y){for(let a=0;a<8;a++){const dx=Math.round(Math.cos(a*Math.PI/4)*4.5),dy=Math.round(Math.sin(a*Math.PI/4)*4.5);R(x+5+dx,y+5+dy,3,3,'#FFD23A')}R(x+4,y+4,5,5,'#7A4A22');P(x+5,y+5,'#A8703A');R(x+6,y+10,2,12,'#3E8A4A');R(x+8,y+15,4,2,'#3E8A4A');R(x+2,y+17,4,2,'#3E8A4A')}};
F.chick={n:'병아리',w:12,h:12,d(x,y,t){const b=Math.floor((t||0)/450)%2;bl(x+1,y+1+b,[4,8,10,10,10,8],'#FFE45A');R(x+8,y+4+b,3,2,'#F08A2A');R(x+4,y+3+b,1,2,K);R(x+5,y+11,1,1,'#F08A2A');R(x+7,y+11,1,1,'#F08A2A')}};
F.ladybug={n:'무당벌레',w:12,h:10,d(x,y){bl(x+1,y+2,[6,8,10,10,10,8,6],'#D8403A');R(x+1,y+5,10,1,K);R(x+5,y+2,1,7,K);R(x+3,y,2,3,K);R(x+7,y,2,3,K);[[3,4],[8,4],[3,7],[8,7]].forEach(([a,b])=>P(x+a,y+b,K))}};
F.tulip={n:'튤립',w:10,h:20,d(x,y){R(x+2,y,6,6,'#F04A8A');R(x+3,y,1,3,'#F8A0C0');R(x+6,y,1,3,'#F8A0C0');R(x+3,y+6,4,2,'#D8387A');R(x+4,y+8,2,12,'#3E8A4A');R(x+6,y+12,3,3,'#3E8A4A');R(x+1,y+14,3,3,'#3E8A4A')}};
F.g_tama={n:'다마고치',w:16,h:19,gift:1,d(x,y,t){const o='#2A1E22';for(let j=0;j<19;j++){const w=Math.round(8*Math.sqrt(1-((j-9.5)/10)**2));R(x+8-w,y+j,w*2,1,o);if(w>1)R(x+9-w,y+j,w*2-2,1,'#FF6FA0')}R(x+5,y,6,2,'#C8423A');R(x+3,y+4,10,8,o);R(x+4,y+5,8,6,'#CFE6D8');const hb=Math.floor((t||0)/500)%2;[[5,6],[6,6],[8,6],[9,6]].forEach(([a,b])=>P(x+a,y+b+0,'#5E9A7A'));R(x+5,y+7+hb,6,2,'#5E9A7A');R(x+6,y+9+hb,4,1,'#5E9A7A');P(x+4,y+14,'#FFB0D0');P(x+8,y+15,'#FFB0D0');P(x+11,y+14,'#FFB0D0')}};
F.g_plane={n:'종이비행기',w:22,h:16,gift:1,d(x,y,t){const b=Math.round(Math.sin((t||0)/500)*1.5),k='#2A5AA8';y+=b;['.........kk.....','......kkkbbk....','...kkkbbbbbbk...','kkkbbbbbblbbbk..','.kkbbbbbbbbbbk..','...kkkkbbbbbbk..','.......kkkkbbk..','..........kkk...'].forEach((r,j)=>[...r].forEach((c,i)=>{if(c!=='.')P(x+i,y+j+2,c==='k'?k:c==='l'?'#FFFFFF':'#CFE6FA')}));[[15,0],[18,2],[17,0]].forEach(([a,c],i)=>P(x+a+1,y+c+(i===0?1:0),'#FF6FA0'))}};
F.g_money={n:'날개 달린 돈',w:22,h:16,gift:1,d(x,y,t){const f=Math.floor((t||0)/260)%2,b=Math.round(Math.sin((t||0)/450)*1.5);y+=b;R(x+7,y+5,14,10,'#1F6A4A');R(x+8,y+6,12,8,'#A8EBB8');R(x+8,y+6,12,2,'#D8FFE0');R(x+12,y+8,4,4,'#2E9A6A');R(x+13,y+9,2,2,'#D8FFE0');P(x+9,y+7,'#1F6A4A');P(x+18,y+12,'#1F6A4A');const wy=f?0:2;R(x,y+wy+1,8,2,'#2A5A6A');R(x+1,y+wy+3,7,2,'#E8F6FF');R(x+3,y+wy+5,5,1,'#B8DCF0');R(x+2,y+wy,6,1,'#2A5A6A')}};
F.g_cat={n:'흰 고양이',w:24,h:16,gift:1,d(x,y,t){const f=Math.floor((t||0)/300)%2,w='#FDFCF8',g='#C8C8C0';R(x+7,y+5,13,7,K);R(x+8,y+6,11,5,w);R(x+1,y+2,9,9,K);R(x+2,y+3,7,7,w);R(x+1,y,3,4,K);R(x+7,y,3,4,K);R(x+2,y+1,1,3,'#F0A0A0');R(x+8,y+1,1,3,'#F0A0A0');P(x+3,y+6,K);P(x+7,y+6,K);P(x+5,y+8,'#E88A8A');R(x+8,y+10,11,1,g);R(x+9,y+12,2,3+f,K);R(x+10,y+12,1,3+f,w);R(x+16,y+12,2,4-f,K);R(x+17,y+12,1,4-f,w);R(x+20,y+7-f,2,2,K);R(x+21,y+3-f,2,5,K);R(x+22,y+3-f,1,4,w)}};
F.g_bunny={n:'토끼 인형',w:14,h:20,gift:1,d(x,y,t){const w='#FFFFFF',b=Math.floor((t||0)/600)%2;R(x+3,y,3,7,K);R(x+8,y,3,7,K);R(x+4,y+1,1,6,w);R(x+9,y+1,1,6,w);R(x+1,y+6,12,8,K);R(x+2,y+7,10,6,w);P(x+4,y+9,K);P(x+9,y+9,K);P(x+6,y+11,K);P(x+7,y+11,K);R(x+3,y+14,8,6,K);R(x+4,y+14,6,5,w);R(x+2,y+15+b,2,3,K);R(x+10,y+15-b,2,3,K);R(x+2,y+11,10,1,'#D8DCF0')}};
F.g_levelup={n:'레벨업 말풍선',w:30,h:26,gift:1,wall:1,d(x,y,t){const on=Math.floor((t||0)/400)%2;R(x+1,y,28,22,K);R(x+2,y+1,26,20,'#FFFFFF');R(x,y+1,1,20,K);R(x+29,y+1,1,20,K);P(x+1,y,'#FFFFFF');R(x+6,y+22,5,3,K);R(x+7,y+22,3,2,'#FFFFFF');R(x+4,y+22,3,2,K);R(x+5,y+22,2,1,'#FFFFFF');txt(x+6,y+4,'LEVEL',on?'#E04A56':K);txt(x+6,y+11,'UP!',on?K:'#E04A56')}};

const rrc=(x,y,w,h,c)=>{R(x,y,w,h,'#3A2418');R(x+1,y+1,w-2,h-2,c);R(x,y,1,1,'rgba(0,0,0,0)');};
F.g_dog={n:'강아지',w:22,h:23,gift:1,d(x,y,t){const T=t||0,B='#E8A872',D='#C98550',L='#F7D2A8',K='#3A2418',wag=Math.floor(T/220)%2,blink=Math.floor(T/2500)%2===0&&Math.floor(T/120)%7===0;
  rrc(17+x,y+14-wag,4,7,D);R(x+18,y+15-wag,2,3,'#E8A872');
  rrc(x+5,y+12,12,10,B);R(x+9,y+13,4,7,'#FFFFFF');R(x+6,y+19,3,2,L);R(x+13,y+19,3,2,L);R(x+8,y+21,1,2,K);R(x+13,y+21,1,2,K);
  rrc(x+1,y+3,5,9,D);rrc(x+16,y+3,5,9,D);rrc(x+4,y,14,13,B);R(x+5,y+1,12,1,L);
  R(x+8,y+7,2,blink?1:3,K);R(x+13,y+7,2,blink?1:3,K);R(x+9,y+9,4,3,L);R(x+10,y+9,2,1,K);R(x+9,y+11,1,1,K);R(x+12,y+11,1,1,K);R(x+10,y+11,2,1,K);
  R(x+5,y+9,3,2,'#F5A6B8');R(x+15,y+9,3,2,'#F5A6B8')}};
F.g_tabby={n:'줄무늬 고양이',w:30,h:20,gift:1,d(x,y,t){const T=t||0,B='#E39A5A',D='#B96A30',K='#3A2418',L='#F5CFA0',sw=Math.round(Math.sin(T/380)*1.5);
  rrc(x+22,y+6,7,4,B);rrc(x+25+sw,y+0,4,9,B);R(x+26+sw,y+2,2,1,D);R(x+26+sw,y+5,2,1,D);R(x+24,y+7,1,2,D);
  rrc(x+7,y+6,17,8,B);R(x+9,y+8,15,1,L);for(let i=0;i<4;i++)R(x+11+i*3,y+7,1,5,D);R(x+9,y+12,8,1,L);
  rrc(x+8,y+13,3,6,B);rrc(x+13,y+13,3,6,B);rrc(x+19,y+13,3,6,B);rrc(x+22,y+13,3,6,D);R(x+8,y+18,3,2,K);R(x+13,y+18,3,2,K);R(x+19,y+18,3,2,K);R(x+22,y+18,3,2,K);
  rrc(x+1,y+3,10,9,B);R(x+2,y+1,3,3,K);R(x+3,y+2,1,2,'#F5A6B8');R(x+8,y+1,3,3,K);R(x+9,y+2,1,2,'#F5A6B8');R(x+2,y+4,8,2,B);R(x+4,y+4,2,1,D);R(x+8,y+4,2,1,D);
  R(x+3,y+6,2,2,K);R(x+8,y+6,2,2,K);R(x+3,y+6,1,1,'#FFFFFF');R(x+8,y+6,1,1,'#FFFFFF');R(x+2,y+9,6,2,L);R(x+5,y+8,2,1,'#C06A6A')}};

F.fireplace={n:'벽난로',w:32,h:30,d(x,y,t){const T=t||0,K1='#2A1E22';glow(x+16,y+22,20,'#FF9A3C',.28+.08*Math.sin(T/200));R(x,y+4,32,26,'#7A4A3A');for(let j=6;j<30;j+=5){R(x,y+j,32,1,'#5A3226')}for(let j=0;j<5;j++)for(let i=(j%2)*4;i<32;i+=8)R(x+i,y+6+j*5,1,5,'#5A3226');R(x-1,y+1,34,4,'#4A2E22');R(x-1,y+1,34,1,'#7A5440');R(x+6,y+11,20,19,K1);R(x+7,y+12,18,18,'#1A0E0A');
  [[9,8],[13,12],[17,10],[21,7]].forEach(([a,h],i)=>{const hh=h+Math.round(Math.sin(T/130+i*1.7)*2);R(x+a,y+29-hh,4,hh,'#E04A2A');R(x+a+1,y+29-hh+2,2,hh-2,'#FF9A3C');R(x+a+1,y+29-Math.round(hh*.5),2,Math.round(hh*.5),'#FFD23A')});
  R(x+8,y+27,16,3,'#6B4A35');R(x+8,y+27,16,1,'#8A6244');[[4,-5,'#C8423A'],[24,-5,'#3E8350']].forEach(([a,b,c])=>{R(x+a,y+b,5,2,'#EEF3F8');R(x+a,y+b+2,5,5,c);R(x+a,y+b+6,8,3,c)})}};
F.stockings={n:'양말 줄',w:30,h:18,wall:1,d(x,y){R(x,y,30,1,'#3A2418');R(x+1,y+1,28,1,'#3A2418');[[3,'#C8423A'],[12,'#3E8350'],[21,'#4A78C0']].forEach(([a,c])=>{R(x+a,y+2,6,3,'#EEF3F8');R(x+a,y+5,6,7,c);R(x+a,y+11,9,4,c);R(x+a+1,y+6,1,5,mix(c,'#FFFFFF',.3));R(x+a+4,y+12,3,3,mix(c,'#000000',.2));P(x+a+2,y+8,'#FFE08A');P(x+a+3,y+9,'#FFE08A')})}};
F.snowman={n:'눈사람',w:14,h:23,d(x,y){const W='#F4F8FC',S2='#C9D8E8',K1='#2A1E22';bl(x+2,y+3,[6,8,8,8,6],W);bl(x+1,y+8,[8,10,10,10,8],W);bl(x,y+14,[12,14,14,14,14,12,10],W);R(x+3,y+7,8,2,'#C8423A');R(x+9,y+8,2,4,'#C8423A');R(x+3,y+2,8,1,K1);R(x+4,y-0,6,3,K1);R(x+5,y+3,1,1,K1);R(x+8,y+3,1,1,K1);R(x+6,y+5,3,1,'#F08A2A');R(x+9,y+5,1,1,'#F08A2A');P(x+6,y+11,K1);P(x+6,y+15,K1);P(x+6,y+19,K1);R(x+2,y+11,1,1,'#7A5A3A');R(x+11,y+11,1,1,'#7A5A3A');R(x+1,y+15,1,5,S2);R(x+12,y+15,1,5,S2)}};
F.xcake={n:'케이크',w:20,h:16,d(x,y,t){const on=Math.floor((t||0)/250)%2;R(x,y+6,20,10,'#3A1E14');R(x+1,y+7,18,8,'#F4D9B0');R(x+1,y+11,18,1,'#E8B880');R(x,y+4,20,4,'#FFFFFF');[2,7,13,17].forEach(a=>R(x+a,y+7,2,2,'#FFFFFF'));[[3,2],[9,1],[15,2]].forEach(([a,b])=>{R(x+a,y+b+1,3,3,'#E04A56');P(x+a+1,y+b,'#3E8A4A')});R(x+9,y,2,1,on?'#FFD23A':'#FF9A3C')}};
F.rudolph={n:'루돌프 인형',w:20,h:24,d(x,y,t){const on=Math.floor((t||0)/500)%2,K1='#2A1E22',B='#B8804A',D='#8A5A2E';R(x+1,y,2,6,'#E9D8BA');R(x+0,y+1,2,2,'#E9D8BA');R(x+17,y,2,6,'#E9D8BA');R(x+18,y+1,2,2,'#E9D8BA');R(x+4,y+8,12,12,K1);R(x+5,y+9,10,10,D);R(x+7,y+10,6,7,'#E8C9A0');R(x+3,y+3,14,10,K1);R(x+4,y+4,12,8,B);R(x+3,y+5,2,3,D);R(x+15,y+5,2,3,D);R(x+6,y+6,2,2,K1);R(x+12,y+6,2,2,K1);R(x+6,y+6,1,1,'#FFFFFF');R(x+12,y+6,1,1,'#FFFFFF');if(on)glow(x+10,y+10,5,'#FF5A4A',.55);R(x+8,y+9,4,3,on?'#FF3B30':'#A8261F');R(x+5,y+19,4,4,K1);R(x+11,y+19,4,4,K1);R(x+6,y+19,2,3,D);R(x+12,y+19,2,3,D)}};
F.santahat={n:'산타 모자',w:18,h:14,d(x,y){const R1='#D8342E',K1='#2A1E22';for(let j=0;j<10;j++){const w=Math.round(4+j*.9);R(x+2,y+j+1,w,1,R1);}R(x+2,y+2,2,8,'#E8584E');R(x,y+9,18,4,'#FFFFFF');R(x,y+12,18,1,'#D0D8E0');R(x+9,y+1,5,3,R1);R(x+13,y+2,5,5,'#FFFFFF');R(x+14,y+3,2,2,'#F0F4F8')}};
F.candycane={n:'사탕 지팡이',w:12,h:24,d(x,y){for(let j=4;j<24;j++){R(x+6,y+j,3,1,j%4<2?'#E0343A':'#FFFFFF')}R(x+4,y+1,6,3,'#E0343A');R(x+2,y+2,3,5,'#FFFFFF');R(x+2,y+3,3,2,'#E0343A');R(x+3,y,4,1,'#FFFFFF');R(x+5,y+1,2,1,'#E0343A');R(x+7,y+4,2,2,'#E0343A')}};

/* 집주인 선물(집주인만 줄 수 있음) */
F.o_tteok={n:'이사떡',w:20,h:15,gift:1,owner:1,d(x,y){R(x,y+4,20,11,'#8A5A3A');R(x+1,y+5,18,9,'#C98E5A');R(x,y+3,20,3,'#A8703F');for(let i=0;i<3;i++){R(x+3+i*5,y,4,5,['#F4B6C2','#F4F1E6','#A9D9A0'][i]);R(x+3+i*5,y+3,4,1,mix(['#F4B6C2','#F4F1E6','#A9D9A0'][i],'#000000',.15))}R(x+9,y+4,2,11,'#C8423A');R(x+1,y+9,18,2,'#C8423A');R(x+8,y+7,4,3,'#E0584A')}};
F.o_tissue={n:'두루마리 휴지',w:16,h:14,gift:1,owner:1,d(x,y){for(let k=0;k<2;k++){const xx=x+k*8,yy=y+k*2;R(xx,yy+2,8,10,'#F4F1E6');R(xx,yy+2,1,10,'#D8D4C6');R(xx+7,yy+2,1,10,'#D8D4C6');R(xx+2,yy,4,2,'#F4F1E6');R(xx+3,yy+5,2,3,'#B8905A');R(xx+1,yy+3,6,1,'#E4DFD0')}R(x+8,y+14-1,8,1,'#00000033')}};
F.o_soap={n:'세제 통',w:12,h:18,gift:1,owner:1,d(x,y){R(x+4,y,4,3,'#E0584A');R(x+3,y+2,6,2,'#2A6FB0');R(x+1,y+4,10,13,'#3F86D6');R(x+2,y+5,2,11,'#7FB8F0');R(x+3,y+8,6,5,'#F4F1E6');R(x+4,y+9,4,1,'#3F86D6');R(x+4,y+11,3,1,'#E0584A');R(x+1,y+16,10,1,'#2A6FB0');P(x+9,y-2,'#CFE8FF');P(x+11,y,'#CFE8FF');P(x+10,y+1,'#CFE8FF')}};
F.o_lucky={n:'행운목',w:18,h:34,gift:1,owner:1,d(x,y,t){const sw=Math.round(Math.sin((t||0)/900));R(x+8,y+12,3,16,'#7A5A3A');R(x+9,y+12,1,16,'#8E6B47');[[2,2,'#3E8350'],[9,0,'#4E9A5E'],[13,5,'#3E8350'],[0,8,'#4E9A5E'],[11,10,'#3E8350']].forEach(([a,b,c])=>{R(x+a+sw,y+b+3,6,3,c);R(x+a+1+sw,y+b+2,4,1,mix(c,'#FFFFFF',.2));R(x+a+1+sw,y+b+6,4,1,mix(c,'#000000',.2))});R(x+3,y+26,12,8,'#B5523B');R(x+2,y+25,14,2,'#C96248');R(x+4,y+28,2,5,'#D9705A');R(x+6,y+21,6,5,'#3A2A22')}};
F.o_key={n:'황금 열쇠',w:14,h:20,gift:1,owner:1,wall:1,d(x,y,t){glow(x+7,y+11,10,'#FFE08A',.35);R(x+6,y,2,3,'#3A2418');R(x+3,y+3,8,2,'#6B4A35');R(x+4,y+5,6,1,'#6B4A35');[[5,6],[4,7],[4,8],[4,9],[5,10],[8,6],[9,7],[9,8],[9,9],[8,10]].forEach(([a,b])=>P(x+a,y+b,'#F2B83A'));R(x+6,y+10,2,8,'#F2B83A');R(x+7,y+11,1,6,'#FFE9A8');R(x+8,y+14,3,2,'#F2B83A');R(x+8,y+17,2,2,'#F2B83A');sp(x+2,y+6,t,0)}};
F.o_welcome={n:'입주 환영 현수막',w:52,h:16,gift:1,owner:1,wall:1,d(x,y,t){R(x,y,52,1,'#3A2418');R(x+1,y+1,50,11,'#C8423A');R(x+1,y+1,50,2,'#E0584A');R(x+1,y+10,50,2,'#9A2E28');for(let i=0;i<52;i+=2)P(x+i,y+12,'#9A2E28');for(let i=0;i<5;i++){const cx=x+6+i*10,yy=y+4+(i%2);['.XX.XX.','XXXXXXX','.XXXXX.','..XXX..','...X...'].forEach((r,j)=>[...r].forEach((c,k)=>{if(c==='X')P(cx+k-3,yy+j,i%2?'#FFE08A':'#FFF3C4')}))}R(x+2,y+13,1,3,'#FFE08A');R(x+49,y+13,1,3,'#FFE08A');const on=Math.floor((t||0)/500)%2;P(x+3,y+3,on?'#FFFFFF':'#FFE08A');P(x+48,y+3,on?'#FFE08A':'#FFFFFF')}};
/* 입주하면 문 앞에 붙는 전단지(문 앞 광고지). 가구 개수에 안 세고, 떼어낼 수만 있어요 */
const fly=(x,y,c,hd,ic)=>{R(x,y,14,18,'#2A1E22');R(x+1,y+1,12,16,c);R(x+1,y+1,12,4,hd);R(x+5,y-1,4,2,'#E8E0C8');R(x+3,y+2,8,1,mix(hd,'#FFFFFF',.55));ic(x+3,y+6)};
const pic=(x,y,rows,map)=>rows.forEach((r,j)=>[...r].forEach((c,i)=>{if(map[c])P(x+i,y+j,map[c])}));
F.fl_jjajang={n:'짜장면 전단지',w:14,h:18,wall:1,flyer:1,d(x,y,t){fly(x,y,'#FFE8A0','#C8423A',(a,b)=>{pic(a,b,['..x..x..','.x..x...','.NNNNNN.','NnNnNnNN','.wwwwww.','..wwww..'],{x:'#FFFFFF',N:'#3A2418',n:'#5A3A22',w:'#EEF3F8'});R(a-1,b+4,1,1,'#C8423A');R(a+7,b-1,2,1,'#C8423A')})}};
F.fl_chicken={n:'치킨 전단지',w:14,h:18,wall:1,flyer:1,d(x,y){fly(x,y,'#FFF3C4','#E8A23A',(a,b)=>pic(a,b,['..oooo..','.oOOOOo.','.oOOOOo.','..oOOo..','...oo...','...bb...','..b..b..'],{o:'#B8631F',O:'#E39A3C',b:'#F4F1E6'}))}};
F.fl_key={n:'열쇠 전단지',w:14,h:18,wall:1,flyer:1,d(x,y){fly(x,y,'#D8ECFF','#3F6C8E',(a,b)=>pic(a,b,['.kkk....','k...k...','k...kkkk','.kkk..k.','......kk','......k.'],{k:'#3A4658'}))}};
F.fl_aircon={n:'에어컨 전단지',w:14,h:18,wall:1,flyer:1,d(x,y){fly(x,y,'#E3F4CF','#4A78C0',(a,b)=>pic(a,b,['x..x..x.','.x.x.x..','..xxx...','xxxxxxx.','..xxx...','.x.x.x..','x..x..x.'],{x:'#4A78C0'}))}};
F.fl_move={n:'이사 전단지',w:14,h:18,wall:1,flyer:1,d(x,y){fly(x,y,'#FFD9D2','#B5523B',(a,b)=>pic(a,b,['bbbbbb..','bbbbbbcc','bbbbbbcc','bbbbbbcc','kkbbkkkk','.kk..kk.'],{b:'#B5523B',c:'#7FB8F0',k:'#2A1E22'}))}};
F.fl_pizza={n:'피자 전단지',w:14,h:18,wall:1,flyer:1,d(x,y){fly(x,y,'#FFF3C4','#C8423A',(a,b)=>pic(a,b,['cccccccc','.cprcrc.','.cccrcc.','..cpcc..','...cc...','....c...'],{c:'#E8A23A',p:'#C8423A',r:'#4E9A5E'}))}};
const FLYERS=['fl_jjajang','fl_chicken','fl_key','fl_aircon','fl_move','fl_pizza'];
const OORDER=['o_tteok','o_tissue','o_soap','o_lucky','o_key','o_welcome'];
const CATS={f:['rug','bed','sofa','desk','shelf','cat','table','heater','lamp','pcpink'],p:['plant','frame','strawberry','clover','sunflower','chick','ladybug','tulip'],s:['tree','lights','gift','fireplace','stockings','snowman','xcake','rudolph','santahat','candycane']};
CATS.g=null;
const PTN={f:'가구',p:'소품',s:'겨울 한정',g:'선물',o:'집주인 선물'};
const TXT={rug:'폭신폭신',bed:'zZ…',sofa:'푹…',desk:'타닥타닥',shelf:'책이 많아요',cat:'야옹?',table:'후루룩!',heater:'뜨끈뜨끈',lamp:'딸깍',pcpink:'삐빅, 부팅 중',frame:'멋진 사진이에요',plant:'쑥쑥 자라요',strawberry:'새콤달콤!',clover:'행운이 와요',sunflower:'해를 바라봐요',chick:'삐약!',ladybug:'따르르',tulip:'봄이 올까요',tree:'반짝반짝',lights:'깜빡깜빡',gift:'뭐가 들었을까?',fireplace:'따끈따끈…',stockings:'선물 가득!',snowman:'녹지 않아요',xcake:'냠냠!',rudolph:'코가 반짝!',santahat:'호호호!',candycane:'달콤해요',
 g_star:'소원을 빌어요',g_blanket:'포근해요…',g_cocoa:'호로록~',g_globe:'눈이 내려요',g_lantern:'소원이 이뤄져요',g_wreath:'메리 크리스마스!',g_poop:'…꿈틀',g_toilet:'쏴아아~',g_chicken:'냠냠!',g_sock:'으악, 냄새!',g_duck:'꽥!',g_onigiri:'참치마요!',g_whoopee:'뿌우웅~!',g_potato:'나 좀 멋짐',g_fish:'…?',g_tama:'삐빅, 사랑해요',g_levelup:'LEVEL UP!',g_plane:'휘리릭~',g_money:'파닥파닥!',g_cat:'야옹~',g_bunny:'깡충깡충',g_dog:'멍멍!',g_tabby:'냐아옹~'};
Object.assign(TXT,{o_tteok:'이사떡이에요, 드세요!',o_tissue:'잘 풀리세요~',o_soap:'거품이 퐁퐁!',o_lucky:'무럭무럭 자라요',o_key:'이 집은 당신 거예요',o_welcome:'입주를 환영합니다!',fl_jjajang:'짜장면 배다링요~',fl_chicken:'치킨은 사랑입니다',fl_key:'열쇠·도어락 24시',fl_aircon:'에어컨 청소 해드려요',fl_move:'용달 이사 1톤',fl_pizza:'두 판 값에 세 판!'});
const MEX=['으쌰!','메리 크리스마스!','…?','안녕!','배고파요'];
const LOVE=['g_dog','g_tabby','g_cat','g_bunny','g_tama','chick','cat','g_duck'];
const RX={};const heart=(x,y,a)=>{C.globalAlpha=a;['.X.X.','XXXXX','.XXX.','..X..'].forEach((r,j)=>[...r].forEach((c,i)=>{if(c==='X')P(x+i,y+j,'#FF6FA0')}));C.globalAlpha=1};
const GORDER=['g_dog','g_tabby','g_tama','g_levelup','g_plane','g_money','g_cat','g_bunny','g_poop','g_toilet','g_star','g_chicken','g_sock','g_duck','g_blanket','g_onigiri','g_cocoa','g_whoopee','g_globe','g_potato','g_lantern','g_fish','g_wreath'];
const ORDER=['pcpink','strawberry','clover','sunflower','chick','ladybug','tulip','rug','bed','sofa','desk','shelf','tree','cat','table','heater','plant','gift','frame','lights','lamp'];
const MAXN=12;
const hid=(it,off)=>!!off&&it.type!=='me'&&CATS.s.includes(it.type);
CATS.g=GORDER;CATS.o=OORDER;/* ── 영어 이름·반응 ── */
const NEN = { rug: 'Rug', bed: 'Bed', sofa: 'Sofa', desk: 'Desk', shelf: 'Bookshelf', tree: 'Tree', cat: 'Cat house', table: 'Ramen table', heater: 'Heater', plant: 'Plant', gift: 'Gift box', frame: 'Frame', lights: 'String lights', lamp: 'Floor lamp', g_star: 'Golden star', g_blanket: 'Cozy blanket', g_cocoa: 'Cocoa', g_globe: 'Snow globe', g_lantern: 'Wish lantern', g_wreath: 'Sparkly wreath', g_poop: 'Poop', g_toilet: 'Golden toilet', g_chicken: 'Giant fried chicken', g_sock: 'Stinky sock', g_duck: 'Duck float', g_onigiri: 'Triangle kimbap', g_whoopee: 'Whoopee cushion', g_potato: 'Cool potato', g_fish: 'Spaced-out fish', pcpink: 'Pink PC', strawberry: 'Strawberry', clover: 'Four-leaf clover', sunflower: 'Sunflower', chick: 'Chick', ladybug: 'Ladybug', tulip: 'Tulip', g_tama: 'Tamagotchi', g_plane: 'Paper plane', g_money: 'Flying money', g_cat: 'White cat', g_bunny: 'Bunny doll', g_levelup: 'Level-up bubble', g_dog: 'Puppy', g_tabby: 'Tabby cat', fireplace: 'Fireplace', stockings: 'Stocking garland', snowman: 'Snowman', xcake: 'Cake', rudolph: 'Rudolph doll', santahat: 'Santa hat', candycane: 'Candy cane', o_tteok: 'Moving-in rice cakes', o_tissue: 'Toilet paper', o_soap: 'Detergent', o_lucky: 'Lucky tree', o_key: 'Golden key', o_welcome: 'Welcome banner', fl_jjajang: 'Jjajangmyeon flyer', fl_chicken: 'Chicken flyer', fl_key: 'Locksmith flyer', fl_aircon: 'AC cleaning flyer', fl_move: 'Moving truck flyer', fl_pizza: 'Pizza flyer' };
const TEN = { rug: 'So fluffy', bed: 'zZ…', sofa: 'Sink in…', desk: 'Tap tap', shelf: 'So many books', cat: 'Meow?', table: 'Slurp!', heater: 'Toasty', lamp: 'Click', pcpink: 'Beep, booting', frame: 'Nice photo', plant: 'Growing!', strawberry: 'Sweet & sour!', clover: 'Good luck!', sunflower: 'Facing the sun', chick: 'Peep!', ladybug: 'Brrr', tulip: 'Is spring coming?', tree: 'Sparkle', lights: 'Blink blink', gift: "What's inside?", fireplace: 'So cozy…', stockings: 'Full of gifts!', snowman: 'Never melts', xcake: 'Yum!', rudolph: 'His nose glows!', santahat: 'Ho ho ho!', candycane: 'Sweet', g_star: 'Make a wish', g_blanket: 'Cozy…', g_cocoa: 'Slurp~', g_globe: "It's snowing", g_lantern: 'Wishes come true', g_wreath: 'Merry Christmas!', g_poop: '…wiggle', g_toilet: 'Flush~', g_chicken: 'Yum!', g_sock: 'Ew, the smell!', g_duck: 'Quack!', g_onigiri: 'Tuna mayo!', g_whoopee: 'Pfffbbt~!', g_potato: 'I look cool', g_fish: '…?', g_tama: 'Beep, love you', g_levelup: 'LEVEL UP!', g_plane: 'Whoosh~', g_money: 'Flap flap!', g_cat: 'Meow~', g_bunny: 'Hop hop', g_dog: 'Woof!', g_tabby: 'Meeow~', o_tteok: 'Moving-in rice cakes, enjoy!', o_tissue: 'May everything go smoothly~', o_soap: 'Bubbles!', o_lucky: 'Growing and growing', o_key: 'This home is yours', o_welcome: 'Welcome home!', fl_jjajang: 'Jjajangmyeon delivery~', fl_chicken: 'Chicken is love', fl_key: 'Locksmith, 24 hours', fl_aircon: 'AC cleaning!', fl_move: 'Moving truck, 1 ton', fl_pizza: 'Buy 2, get 1 free!' };
const MEXE = ['Heave-ho!', 'Merry Christmas!', '…?', 'Hi!', "I'm hungry"];
const nm = t => EN() ? (NEN[t] || t) : (F[t] ? F[t].n : t);
const say = t => EN() ? (TEN[t] || '♥') : (TXT[t] || '♥');
const mex = () => { const a = EN() ? MEXE : MEX; return a[Math.floor(Math.random() * a.length)]; };
const SWNE = ['Brick', 'Winter sky', 'Moss', 'Mustard', 'Plum', 'Apricot', 'Teal'];
const PTNE = { f: 'Furniture', p: 'Props', s: 'Winter only', g: 'Gifts', o: 'Owner gifts' };
const ptn = k => EN() ? PTNE[k] : PTN[k];
const FLN = () => EN() ? ['Wood', 'Vinyl', 'Check'] : ['나무', '장판', '체크'];
const CHN = () => [['old', T('병맛 남', 'Goofy boy')], ['oldgirl', T('병맛 여', 'Goofy girl')], ['new', T('포근 소년', 'Cozy boy')], ['girl', T('포근 소녀', 'Cozy girl')]];
const PON = () => [['stand', T('서 있기', 'Standing')], ['manse', T('만세', 'Hooray')], ['sit', T('앉기', 'Sitting')], ['lie', T('눕기', 'Lying')]];

/* ── 크기·보임·찾기 ── */
const size = (it, ch, pose) => it.type === 'me'
  ? (ch !== 'old' && ch !== 'oldgirl' ? { w: CHS[ch].r[pose][0].length, h: CHS[ch].r[pose].length } : (() => { const a = ch === 'oldgirl' ? AVG : AV; return { w: a[pose][0].length * 3, h: a[pose].length * 3 }; })())
  : { w: F[it.type].w, h: F[it.type].h };
const vis = (it, off) => (it.type === 'me' || !!F[it.type]) && !hid(it, off);
function hit(st, x, y, off) {
  const items = (st.layout || []).filter(i => vis(i, off)), sz = i => size(i, st.avatar, st.pose);
  const l = [...items].sort((a, b) => (b.y + sz(b).h) - (a.y + sz(a).h));
  return l.find(it => {
    const z = sz(it);
    if (it.type !== 'me' && F[it.type].floor && items.some(o => o !== it && x >= o.x && x <= o.x + sz(o).w && y >= o.y && y <= o.y + sz(o).h && !(o.type !== 'me' && F[o.type].floor))) return false;
    return x >= it.x && x <= it.x + z.w && y >= it.y && y <= it.y + z.h;
  });
}
function draw(c,st,t,o){o=o||{};const off=!!o.off,sz=i=>size(i,st.avatar,st.pose);
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;C=g;const L=st.lightColor||'#FF9A3C',wall=mix(L,'#4A2A22',.55);
  for(let i=0;i<88;i++)R(0,i,200,1,mix(mix(wall,'#FFFFFF',.08),wall,i/88));
  if((st.floor_kind|0)===0){R(0,88,200,37,'#5C3E2E');for(let i=0;i<200;i+=22)R(i,88,1,37,'#4A3024')}
  if((st.floor_kind|0)===1){R(0,88,200,37,'#C9B79A');for(let j=90;j<125;j+=6)R(0,j,200,1,'#B8A584')}
  if((st.floor_kind|0)===2){for(let j=0;j<5;j++)for(let i=0;i<14;i++)R(i*15,88+j*8,15,8,(i+j)%2?'#4B5568':'#3A4254')}
  R(0,88,200,2,'#3A261C');
  R(14,16,56,46,'#2A1E22');for(let i=0;i<42;i++)R(16,18+i,52,1,mix('#0E1D2D','#21425B',i/42));R(16,52,52,8,'#E8EFF6');
  [[24,26],[40,22],[58,34],[30,44],[52,48]].forEach(([a,b],i)=>glow(a,b,3,['#FFC86A','#FFE3A0'][i%2],.5));
  R(41,18,2,42,'#2A1E22');R(16,38,52,2,'#2A1E22');R(10,62,64,3,'#3A261C');
  for(let k=0;k<12;k++){const y=((t||0)/60+k*13)%42;P(18+((k*17)%48),18+y,'#FFFFFF')}
  R(8,12,8,56,mix(L,'#8A3A2A',.45));R(68,12,8,56,mix(L,'#8A3A2A',.45));R(6,10,72,3,'#3A261C');
  glow(130,30,26,L,.35);R(126,20,9,6,mix(L,'#FFFFFF',.4));R(129,0,3,20,'#2A1E22');
  const list=(st.layout||[]).filter(i=>vis(i,off)).sort((a,b)=>{const fa=a.type!=='me'&&F[a.type].floor?0:1,fb=b.type!=='me'&&F[b.type].floor?0:1;if(fa!==fb)return fa-fb;const sa=sz(a),sb=sz(b);return (a.y+sa.h)-(b.y+sb.h)});
  const nowT=performance.now();
  list.forEach(it=>{
    const z=sz(it);const rt=RX[(o.key||'m')+'-'+it.id];let dy=0,re=-1;if(rt){re=(nowT-rt)/700;if(re>=0&&re<1)dy=Math.round(Math.abs(Math.sin(re*Math.PI*2))*5*(1-re));else re=-1}
    C.save();C.translate(0,-dy);
    if(it.type==='me'){C.fillStyle='rgba(0,0,0,.2)';C.fillRect(it.x+3,it.y+z.h-1,z.w-6,2);if(st.avatar!=='old'&&st.avatar!=='oldgirl')drawMe(it.x,it.y,st.pose,st.sweater||0,it.flip,st.avatar);else{const map={h:'#3A2A22',s:'#F2C9A0',k:'#2B2B33',m:'#8A3A3A',r:'#E7E1D6',b:SWC[st.sweater||0],p:'#3B4458',d:'#2A2A30',c:'#E6B66A',q:'#7A4A5E',o:'#E85A7A'};SPR(it.x,it.y,(st.avatar==='oldgirl'?AVG:AV)[st.pose],map,3,it.flip)}}
    else{if(it.flip){C.save();C.translate(it.x*2+z.w,0);C.scale(-1,1);F[it.type].d(it.x,it.y,t);C.restore()}else F[it.type].d(it.x,it.y,t)}
    C.restore();if(re>=0&&LOVE.includes(it.type)){for(let k=0;k<3;k++)heart(Math.round(it.x+z.w/2-9+k*6),Math.round(it.y-8-re*16-k*3),1-re)}
  });
  if(o.sel){const it=(st.layout||[]).find(i=>i.id===o.sel&&vis(i,off));if(it){const z=sz(it),on=Math.floor((t||0)/350)%2;C.fillStyle=on?'#FFC86A':'#FFFFFF';const x=it.x-1,y=it.y-1,w=z.w+2,h=z.h+2;for(let i=0;i<w;i+=2){C.fillRect(x+i,y,1,1);C.fillRect(x+i,y+h-1,1,1)}for(let j=0;j<h;j+=2){C.fillRect(x,y+j,1,1);C.fillRect(x+w-1,y+j,1,1)}}}
}
/* ── 반응(톡 누르면 통통 + 말풍선) ── */
const clone = o => JSON.parse(JSON.stringify(o));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const posOf = (cv, e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 200 / r.width, (e.clientY - r.top) * 125 / r.height]; };
function bubble(wrap, x, y, txt) {
  const b = document.createElement('div'); b.className = 'rm-bub'; b.textContent = txt;
  b.style.left = Math.max(14, Math.min(86, x / 200 * 100)) + '%'; b.style.top = Math.max(8, y / 125 * 100) + '%';
  wrap.appendChild(b); setTimeout(() => b.remove(), 1500);
}
function react(wrap, st, it, key) {
  const z = size(it, st.avatar, st.pose); RX[key + '-' + it.id] = performance.now();
  bubble(wrap, it.x + z.w / 2, it.y, it.type === 'me' ? mex() : say(it.type));
}
/* 보기 전용 방: get()이 { st, off, mine }를 돌려주면 누른 가구가 반응해요. 내 방의 전단지를 누르면 onFlyer(it) */
function bindReact(cv, wrap, get, key, redraw, onFlyer) {
  injectCss(); cv.style.cursor = 'pointer';
  cv.onclick = e => {
    const g = get(); if (!g || !g.st) return; const [x, y] = posOf(cv, e), it = hit(g.st, x, y, g.off);
    if (!it) return; react(wrap, g.st, it, key); if (redraw) redraw();
    if (g.mine && onFlyer && F[it.type] && F[it.type].flyer) onFlyer(it);
  };
}

/* ── 가구함 아이콘 ── */
function icon(type) { const c = document.createElement('canvas'); c.width = 44; c.height = 36; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; const o = C; C = x; const z = F[type], s = Math.min(2, Math.floor(40 / z.w * 2) / 2 || 1, Math.floor(32 / z.h * 2) / 2 || 1); x.save(); x.translate(Math.round((44 - z.w * s) / 2), Math.round((36 - z.h * s) / 2)); x.scale(s, s); z.d(0, 0, 0); x.restore(); C = o; return c; }

const defaultLayout = (winter, pose) => [{ id: 'd1', type: 'rug', x: 72, y: 98, flip: 0 }, { id: 'd2', type: 'me', x: pose === 'sit' ? 76 : pose === 'lie' ? 62 : 82, y: pose === 'sit' ? 66 : pose === 'lie' ? 90 : 57, flip: 0 }, { id: 'd3', type: 'bed', x: 6, y: 66, flip: 0 }, { id: 'd4', type: 'desk', x: 118, y: 62, flip: 0 }].concat(winter ? [{ id: 'd5', type: 'tree', x: 162, y: 70, flip: 0 }] : []);
const isGiftType = t => F[t] && F[t].gift;

/* ── 방 꾸미기 ──
   o: { root, layout, light, floor_kind, avatar, sweater, pose, lights:[{id,name,c}], gifts:[{id,type,from,owner}], seasonOpen,
        toast(m), onSave(payload) → Promise<오류 글자|null>, onBack(), onRemoveGift(id) → Promise<오류 글자|null> } */
function openEditor(o) {
  injectCss();
  const root = o.root, toast = o.toast || (() => {}), off = !o.seasonOpen, lights = o.lights;
  const gifts = (o.gifts || []).map(g => ({ ...g }));
  const st = { layout: o.layout && o.layout.length ? clone(o.layout) : defaultLayout(o.seasonOpen, o.pose), light: o.light, floor_kind: o.floor_kind | 0, avatar: o.avatar || 'old', sweater: o.sweater | 0, pose: o.pose || 'stand' };
  let sel = null, hist = [], drag = null, pt = 'f', dirty = false, armed = false, ask = false, nid = 1;
  const sz = i => size(i, st.avatar, st.pose);
  const count = () => st.layout.filter(i => i.type !== 'me' && !F[i.type].gift && !F[i.type].flyer && !hid(i, off)).length;
  const snap = () => { hist.push(clone({ l: st.layout, p: st.pose, a: st.avatar })); if (hist.length > 30) hist.shift(); dirty = true; armed = false; setBack(); };
  const newId = () => 'e' + (Date.now() % 1e7).toString(36) + (nid++);
  root.innerHTML = `<div class="rm-ed">
   <div class="room rm-stage" id="rmStage"><canvas id="rmCv" width="200" height="125" aria-label="${T('내 방', 'My room')}"></canvas></div>
   <div class="rm-tools" id="rmTools"></div>
   <p class="hint" id="rmHint"></p>
   <div class="rm-box" id="rmPal"></div>
   <div class="rm-box" id="rmLook"></div>
   <p class="err" id="rmErr" role="alert"></p>
   <div class="rm-acts"><button type="button" class="btn wide" id="rmSave">${T('방 저장하기', 'Save my room')}</button><button type="button" class="btn ghost wide" id="rmBack"></button></div></div>`;
  const $ = s => root.querySelector(s), cv = $('#rmCv'), stage = $('#rmStage');
  const setBack = () => { const b = $('#rmBack'); if (b) b.textContent = armed ? T('저장하지 않고 나가기', 'Leave without saving') : T('닫기', 'Close'); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  const paint = t => { st.lightColor = (lights.find(l => l.id === st.light) || lights[0]).c; draw(cv, st, reduce ? 0 : t, { off, key: 'e', sel }); };
  const loop = t => { if (!document.body.contains(root)) { document.removeEventListener('keydown', kh); return; } paint(t); if (!reduce || drag) raf = requestAnimationFrame(loop); };
  const kick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); };

  cv.addEventListener('pointerdown', e => {
    const [x, y] = posOf(cv, e), it = hit(st, x, y, off); sel = it ? it.id : null; ask = false;
    if (it) { snap(); drag = { it, dx: x - it.x, dy: y - it.y, sx: x, sy: y, moved: false }; cv.setPointerCapture(e.pointerId); cv.classList.add('drag'); }
    tools(); kick();
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return; const [x, y] = posOf(cv, e), z = sz(drag.it);
    if (Math.hypot(x - drag.sx, y - drag.sy) > 2) drag.moved = true;
    drag.it.x = Math.round(Math.max(0, Math.min(200 - z.w, x - drag.dx))); drag.it.y = Math.round(Math.max(0, Math.min(125 - z.h, y - drag.dy)));
    if (reduce) paint(0);
  });
  const end = () => { if (drag && !drag.moved) { react(stage, st, drag.it, 'e'); hist.pop(); } drag = null; cv.classList.remove('drag'); tools(); kick(); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  function kh(e) {
    if (!sel || /INPUT|TEXTAREA|BUTTON/.test(document.activeElement.tagName)) return;
    const it = st.layout.find(i => i.id === sel), d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (d && it) { e.preventDefault(); snap(); const z = sz(it), k = e.shiftKey ? 5 : 1; it.x = Math.max(0, Math.min(200 - z.w, it.x + d[0] * k)); it.y = Math.max(0, Math.min(125 - z.h, it.y + d[1] * k)); kick(); }
  }
  document.addEventListener('keydown', kh);

  function add(type) {
    if (off && CATS.s.includes(type)) return toast(T('겨울이 되면 다시 열려요', 'Opens again in winter'));
    const z = F[type];
    if (z.gift) { if (!gifts.some(g => g.type === type)) return toast(T('이웃이 선물해 줘야 쓸 수 있어요', 'A neighbor has to give you this one')); if (st.layout.some(i => i.type === type)) return; }
    else if (count() >= MAXN) return toast(T(`가구는 ${MAXN}개까지 놓을 수 있어요`, `You can place up to ${MAXN} pieces`));
    snap();
    const it = { id: newId(), type, x: Math.round(100 - z.w / 2 + (Math.random() * 30 - 15)), y: z.wall ? 14 : Math.round(Math.min(125 - z.h, 92 - z.h + z.h * .6)), flip: 0 };
    st.layout.push(it); sel = it.id; ask = false; tools(); pal(); kick();
  }
  function del() {
    const it = st.layout.find(i => i.id === sel); if (!it || it.type === 'me') return;
    snap(); st.layout = st.layout.filter(i => i !== it); sel = null; ask = false; tools(); pal(); kick();
    if (F[it.type].gift) toast(T('선물함에 넣었어요. 다시 꺼내 놓을 수 있어요', 'Put it back in the gift box. You can place it again'));
    if (F[it.type].flyer) toast(T('전단지를 떼어냈어요. 저장하면 창문에서도 사라져요', 'Flyer peeled off. Save to remove it from your window too'));
  }
  function flip() { const it = st.layout.find(i => i.id === sel); if (!it) return; snap(); it.flip ^= 1; kick(); }
  function undo() { const h = hist.pop(); if (!h) return; st.layout = h.l; st.pose = h.p; st.avatar = h.a; sel = null; ask = false; tools(); pal(); look(); kick(); }
  function tools() {
    const it = st.layout.find(i => i.id === sel), isGift = it && it.type !== 'me' && F[it.type].gift, isFly = it && it.type !== 'me' && F[it.type].flyer, g = isGift && gifts.find(x => x.type === it.type);
    $('#rmTools').innerHTML = `<button type="button" id="bFlip" ${it ? '' : 'disabled'}>${T('뒤집기', 'Flip')}</button><button type="button" id="bDel" ${it && it.type !== 'me' ? '' : 'disabled'}>${isGift ? T('선물함에', 'To gift box') : isFly ? T('떼어내기', 'Peel off') : T('치우기', 'Remove')}</button><button type="button" id="bUndo" ${hist.length ? '' : 'disabled'}>${T('되돌리기', 'Undo')}</button><button type="button" id="bClr">${T('다 비우기', 'Clear all')}</button>${g && g.id ? `<button type="button" id="bBack">${T('선물 돌려보내기', 'Return gift')}</button>` : ''}<span class="rm-cnt">${T('가구', 'Pieces')} ${count()}/${MAXN}</span>`;
    $('#bFlip').onclick = flip; $('#bDel').onclick = del; $('#bUndo').onclick = undo;
    $('#bClr').onclick = () => { snap(); st.layout = st.layout.filter(i => i.type === 'me' || F[i.type].gift || F[i.type].flyer); sel = null; tools(); pal(); kick(); };
    if ($('#bBack')) $('#bBack').onclick = () => { ask = true; tools(); };
    const h = $('#rmHint');
    if (ask && g) {
      h.innerHTML = `${T(`'${esc(nm(it.type))}'을(를) 돌려보낼까요? 방에서도 사라지고 도감에서도 빠져요.`, `Return '${esc(nm(it.type))}'? It leaves your room and your collection.`)} <button type="button" class="rm-link" id="gYes">${T('돌려보내기', 'Return')}</button> <button type="button" class="rm-link" id="gNo">${T('그만두기', 'Cancel')}</button>`;
      $('#gNo').onclick = () => { ask = false; tools(); };
      $('#gYes').onclick = async () => {
        $('#gYes').disabled = true; const err = await o.onRemoveGift(g.id);
        if (err) { toast(err); ask = false; tools(); return; }
        gifts.splice(gifts.indexOf(g), 1); st.layout = st.layout.filter(i => i !== it); sel = null; ask = false; tools(); pal(); kick(); toast(T('선물을 돌려보냈어요', 'Gift returned'));
      };
    } else if (isGift && g && g.owner) h.innerHTML = `<b class="rm-tag">${T('선물', 'Gift')}</b> ${T('집주인이 놓아 준 입주 선물이에요. 옮기거나 선물함에 넣을 수 있어요', 'A move-in gift from the mansion owner. Move it or put it in the gift box')}`;
    else if (isGift && g && g.from) h.innerHTML = `<b class="rm-tag">${T('선물', 'Gift')}</b> ${T(`${esc(g.from)}호 이웃이 놓아 준 선물이에요. 옮기거나 선물함에 넣을 수 있어요`, `A gift from the neighbor in #${esc(g.from)}. Move it or put it in the gift box`)}`;
    else if (isFly) h.innerHTML = `<b class="rm-tag">${T('전단지', 'Flyer')}</b> ${T('문 앞에 붙은 광고지예요. 떼어내면 다시 붙일 수 없어요', 'A flyer stuck on your window. Once peeled off, it can’t be put back')}`;
    else h.innerHTML = `<b class="rm-tag">${T('끌기', 'Drag')}</b> ${T('가구를 잡고 옮기기 · 톡 누르면 반응해요 · 선택한 가구는 뒤집거나 치울 수 있어요', 'Drag pieces to move them · Tap one to see it react · Flip or remove the selected piece')}`;
  }
  function pal() {
    const gotG = GORDER.filter(t => gifts.some(g => g.type === t)).length, gotO = OORDER.filter(t => gifts.some(g => g.type === t)).length, el = $('#rmPal');
    const note = pt === 'g'
      ? `<div class="rm-dex"><b>${T('선물 도감', 'Gift collection')}</b> <span>${T(`${gotG} / ${GORDER.length}종 모았어요`, `${gotG} / ${GORDER.length} collected`)}</span><div class="rm-bar"><i style="width:${Math.round(gotG / GORDER.length * 100)}%"></i></div></div><p class="rm-note">${T('내가 만들 수 없는 특별 아이템이에요. 이웃이 내 방에 놓고 가면 열리고, 한 번 받으면 도감에 남아요. 선물함에 넣어도 사라지지 않아요.', "Special items you can't make yourself. They unlock when a neighbor leaves one in your room, and stay in your collection. Putting one in the gift box won't lose it.")}</p>`
      : pt === 'o' ? `<div class="rm-dex"><b>${T('집주인 선물', 'Owner gifts')}</b> <span>${T(`${gotO} / ${OORDER.length}종 받았어요`, `${gotO} / ${OORDER.length} received`)}</span><div class="rm-bar"><i style="width:${Math.round(gotO / OORDER.length * 100)}%"></i></div></div><p class="rm-note">${T('맨션 주인만 줄 수 있는 입주 선물이에요. 이웃 선물과는 따로 받아요.', 'Move-in gifts only the mansion owner can give. They are separate from neighbor gifts.')}</p>`
      : pt === 's' ? `<p class="rm-note"><b class="rm-tag">${T('겨울 한정', 'Winter only')}</b> ${off ? T('지금은 겨울이 아니라서 잠겨 있어요. 놓아 둔 가구는 숨겨져 있고, 다음 겨울에 같은 자리로 돌아와요.', 'Locked until winter. Your placed pieces are hidden and return to the same spot next winter.') : T('겨울에만 열리는 가구예요. 겨울이 지나면 방에서 잠시 숨겨지고, 다음 겨울에 같은 자리로 돌아와요.', 'Winter-only furniture. After winter it hides for a while and returns to the same spot next winter.')}</p>`
      : `<p class="rm-note">${T('누르면 방에 놓여요. 같은 가구를 여러 개 놓아도 돼요.', 'Tap to place it in your room. You can place the same piece more than once.')}</p>`;
    el.innerHTML = `<div class="rm-ptabs">${Object.keys(PTN).map(k => `<button type="button" class="${pt === k ? 'on' : ''}" data-pt="${k}">${ptn(k)}${k === 'g' ? ' ' + gotG + '/' + GORDER.length : k === 'o' ? ' ' + gotO + '/' + OORDER.length : ''}</button>`).join('')}</div>
     <div class="rm-ph"><span>${T('옆으로 밀어서 보기', 'Swipe sideways')}</span><span class="rm-arr"><button type="button" data-d="-1" aria-label="${T('왼쪽', 'Left')}">◀</button><button type="button" data-d="1" aria-label="${T('오른쪽', 'Right')}">▶</button></span></div>
     <div class="rm-pal" id="rmP"></div>${note}`;
    el.querySelectorAll('[data-pt]').forEach(b => b.onclick = () => { pt = b.dataset.pt; pal(); });
    const P_ = el.querySelector('#rmP');
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => P_.scrollBy({ left: +b.dataset.d * 240, behavior: reduce ? 'auto' : 'smooth' }));
    if (pt === 'g' || pt === 'o') (pt === 'g' ? GORDER : OORDER).forEach(t => {
      const g1 = gifts.find(g => g.type === t), on = st.layout.some(i => i.type === t), b = document.createElement('button'); b.type = 'button';
      const ic = icon(t); if (!g1) ic.style.filter = 'brightness(0) opacity(.35)';
      b.append(ic, g1 ? (on ? nm(t) + ' ✓' : nm(t)) : '???');
      if (g1) b.title = g1.owner ? T('집주인이 선물했어요', 'Gift from the mansion owner') : g1.from ? T(`${g1.from}호 이웃이 선물했어요`, `Gift from the neighbor in #${g1.from}`) : '';
      b.disabled = !g1 || on; b.onclick = () => add(t); P_.append(b);
    });
    else CATS[pt].forEach(t => {
      const b = document.createElement('button'); b.type = 'button'; b.append(icon(t), nm(t));
      if (pt === 's' && off) b.disabled = true; b.onclick = () => add(t); P_.append(b);
    });
  }
  function look() {
    const chip = (k, v, label, sw) => `<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${String(st[k]) === String(v)}">${sw ? `<i style="background:${sw};color:${sw}"></i>` : ''}${label}</button>`;
    $('#rmLook').innerHTML = `<div class="field"><div class="lbl2">${T('벽지 · 창문 불빛', 'Wall & window light')}</div><div class="chips">${lights.map(l => chip('light', l.id, l.name, l.c)).join('')}</div></div>
     <div class="field"><div class="lbl2">${T('바닥', 'Floor')}</div><div class="chips">${FLN().map((n, i) => chip('floor_kind', i, n)).join('')}</div></div>
     <div class="field"><div class="lbl2">${T('캐릭터', 'Character')}</div><div class="chips">${CHN().map(([v, n]) => chip('avatar', v, n)).join('')}</div></div>
     <div class="field"><div class="lbl2">${T('옷 색', 'Outfit color')} <small>${T('병맛은 스웨터, 포근은 목도리', 'Sweater for Goofy, scarf for Cozy')}</small></div><div class="chips">${SWC.map((c, i) => chip('sweater', i, EN() ? SWNE[i] : SWN[i], c)).join('')}</div></div>
     <div class="field"><div class="lbl2">${T('나의 자세', 'My pose')}</div><div class="chips">${PON().map(([v, n]) => chip('pose', v, n)).join('')}</div></div>`;
    $('#rmLook').querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const k = b.dataset.k; snap(); st[k] = (k === 'floor_kind' || k === 'sweater') ? +b.dataset.v : b.dataset.v;
      const me = st.layout.find(i => i.type === 'me'); if (me) { const z = sz(me); me.x = Math.max(0, Math.min(200 - z.w, me.x)); me.y = Math.max(0, Math.min(125 - z.h, me.y)); }
      look(); kick();
    });
  }
  $('#rmSave').onclick = async () => {
    const b = $('#rmSave'), er = $('#rmErr'); er.textContent = ''; b.disabled = true; b.textContent = T('저장하는 중…', 'Saving…');
    const err = await o.onSave({ layout: st.layout.map(({ id, type, x, y, flip }) => ({ id, type, x, y, flip: flip ? 1 : 0 })), light: st.light, floor_kind: st.floor_kind, avatar: st.avatar, sweater: st.sweater, pose: st.pose });
    if (err) { er.textContent = err; b.disabled = false; b.textContent = T('방 저장하기', 'Save my room'); return; }
    dirty = false;
  };
  $('#rmBack').onclick = () => { if (dirty && !armed) { armed = true; setBack(); toast(T('저장하지 않은 변화가 있어요. 한 번 더 누르면 나가요', 'You have unsaved changes. Tap again to leave')); return; } o.onBack(); };
  setBack(); tools(); pal(); look(); kick();
}

/* ── 선물 고르기 ──
   o: { root, owner:boolean(집주인 선물이면 true), have:[그 방에 이미 있는 선물 type], unitLabel, onGive(type) → Promise<오류 글자|null>, onBack() } */
function openGiftPicker(o) {
  injectCss();
  const root = o.root, have = o.have || [], list = o.owner ? OORDER : GORDER; let pick = null;
  const lead = o.owner
    ? T(`${esc(o.unitLabel)}에 입주 선물을 놓고 가세요. "입주해 줘서 고마워요" 하는 마음이에요. 선물마다 한 번씩 줄 수 있어요.`, `Leave a move-in gift at ${esc(o.unitLabel)}. A little "thanks for moving in". Each gift can be given once.`)
    : T(`${esc(o.unitLabel)} 방에 놓고 갈 선물을 골라 보세요. 한 집에는 한 번만 선물할 수 있고, 받은 사람은 마음에 안 들면 돌려보낼 수 있어요.`, `Pick a gift to leave in ${esc(o.unitLabel)}. You can give one gift per home, and the owner can return gifts they don't want.`);
  root.innerHTML = `<div class="rm-pick"><p class="hint">${lead}</p>
   <div class="rm-grid" id="gg"></div><div class="rm-say" id="gSay"></div><p class="err" id="gErr" role="alert"></p>
   <div class="rm-acts"><button type="button" class="btn wide" id="gGo" disabled>${T('선물 놓고 가기', 'Leave the gift')}</button><button type="button" class="btn ghost wide" id="gBack">${T('돌아가기', 'Back')}</button></div></div>`;
  const grid = root.querySelector('#gg');
  list.forEach(t => {
    const b = document.createElement('button'), h = have.includes(t); b.type = 'button'; b.append(icon(t), h ? T('이미 있어요', 'Already has') : nm(t)); b.disabled = h; b.setAttribute('aria-pressed', 'false');
    b.onclick = () => { pick = t; grid.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); root.querySelector('#gSay').textContent = `${nm(t)}: “${say(t)}”`; root.querySelector('#gGo').disabled = false; };
    grid.append(b);
  });
  root.querySelector('#gBack').onclick = o.onBack;
  root.querySelector('#gGo').onclick = async () => {
    if (!pick) return; const b = root.querySelector('#gGo'); b.disabled = true; b.textContent = T('놓는 중…', 'Leaving it…');
    const err = await o.onGive(pick);
    if (err) { root.querySelector('#gErr').textContent = err; b.disabled = false; b.textContent = T('선물 놓고 가기', 'Leave the gift'); }
  };
}

function injectCss() {
  if (document.getElementById('mnroom-css')) return;
  const s = document.createElement('style'); s.id = 'mnroom-css';
  const ring = 'box-shadow:0 -2px var(--night3),0 2px var(--night3),-2px 0 var(--night3),2px 0 var(--night3)';
  s.textContent = `
.rm-ed,.rm-pick{display:grid;gap:12px;min-width:0}
.rm-stage canvas{touch-action:none}.rm-stage canvas.drag{cursor:grabbing}
.rm-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:2px}
.rm-cnt{margin-left:auto;color:var(--snow-soft)}
.rm-tools button,.rm-ptabs button,.rm-pal button,.rm-arr button,.rm-grid button{border:0;border-radius:0;background:var(--night);color:var(--snow);font:inherit;padding:6px 10px;${ring};cursor:pointer}
.rm-tools button:hover:not(:disabled),.rm-pal button:hover:not(:disabled),.rm-grid button:hover:not(:disabled){color:var(--candle)}
.rm-tools button:disabled,.rm-pal button:disabled,.rm-grid button:disabled{opacity:.45;cursor:default}
.rm-tag{color:var(--candle)}
.rm-link{border:0;background:none;padding:0;color:var(--candle);text-decoration:underline;text-underline-offset:3px;font:inherit;cursor:pointer;margin-left:6px}
.rm-box{background:var(--night);padding:10px;display:grid;gap:8px;min-width:0;${ring}}
.rm-ptabs{display:flex;gap:6px;flex-wrap:wrap}.rm-ptabs button{flex:1 1 auto;white-space:nowrap;background:var(--night2)}
.rm-ptabs button.on{background:var(--candle);color:#2A1608;font-weight:700}
.rm-ph{display:flex;justify-content:space-between;align-items:center;color:var(--candle)}
.rm-arr{display:flex;gap:6px}
.rm-pal{display:grid;grid-auto-flow:column;grid-template-rows:repeat(2,auto);grid-auto-columns:76px;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;padding:3px 3px 10px;scrollbar-width:thin;scrollbar-color:var(--amber) var(--edge)}
.rm-pal button,.rm-grid button{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;line-height:1.3;min-height:76px;padding:6px 2px;scroll-snap-align:start;background:var(--night2)}
.rm-grid button[aria-pressed="true"]{background:var(--candle);color:#2A1608}
.rm-pal canvas,.rm-grid canvas{width:44px;height:36px;background:#6A5E78;image-rendering:pixelated}
.rm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:8px;padding:3px}
.rm-dex{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline}.rm-dex span{color:var(--snow-soft)}
.rm-bar{flex:1 0 100%;height:8px;background:var(--edge)}.rm-bar i{display:block;height:100%;background:var(--amber)}
.rm-note{margin:0;color:var(--snow-soft)}
.rm-say{min-height:1.6em;color:var(--candle);text-align:center}
.rm-acts{display:grid;gap:4px}
.rm-extra{display:grid;gap:8px;min-width:0}
.rm-extra .row{display:flex;gap:8px;flex-wrap:wrap}
.rm-bub{position:absolute;transform:translate(-50%,-100%);background:#FFF3C4;color:#3A2A22;padding:3px 8px;font-size:12px;line-height:1.4;box-shadow:2px 2px 0 var(--edge);pointer-events:none;white-space:nowrap;animation:rmb 1.5s forwards;z-index:3}
@keyframes rmb{0%{opacity:0;margin-top:6px}12%{opacity:1;margin-top:0}80%{opacity:1}100%{opacity:0;margin-top:-10px}}
@media (prefers-reduced-motion:reduce){.rm-bub{animation:none}}`;
  document.head.appendChild(s);
}

window.MNRoom = { draw, hit, size, icon, bindReact, openEditor, openGiftPicker, nm, say, GORDER, OORDER, CATS, injectCss, defaultLayout };
})();
