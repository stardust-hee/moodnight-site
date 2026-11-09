(()=>{
'use strict';
const A='assets/';
// 소품은 모두 고화질 1110×1200 투명 WebP
const props=[
 ['perfume','향수','뷰티'],['soap','빈티지 비누','라이프'],['glasses','블랙 안경','소품'],
 ['earbuds','유선 이어폰','소품'],['film','필름 포토','사진'],['polaroid','폴라로이드','사진'],
 ['candle','유리 캔들','라이프'],['cream','세럼 보틀','뷰티'],['lipstick','립스틱','뷰티'],['compact','실버 콤팩트','뷰티'],['foil','실버 튜브','뷰티'],
 ['watch','가죽 시계','소품'],['rings','실버 반지','소품'],['heart','실버 하트','소품'],
 ['keyring','빈티지 키링','소품'],['letter','봉인 편지','사진'],['flowers','안개꽃','라이프'],
 ['pearls','진주 팔찌','소품'],['bow','새틴 리본','라이프'],['note','손글씨 메모','사진']
].map(([id,label,cat])=>({id,label,cat,src:A+id+'.webp'}));
const trays=[{id:1,name:'사각 트레이',desc:'simple & classic',src:A+'tray1.png'},
{id:2,name:'로코코 트레이',desc:'ornate & romantic',src:A+'tray2.png'},
{id:3,name:'빈티지 트레이',desc:'soft & antique',src:A+'tray3.png'}];
const cats=['전체','뷰티','소품','사진','라이프'];
const $=id=>document.getElementById(id);
const stage=$('stage'),layer=$('stickerLayer'),toast=$('toast');
let state={tray:1,items:[]},selected=null,cat='전체',uid=1000;
let history=[],histPos=0,drag=null,toastTimer=null,sliderSession=false;
const imageCache={};
function source(id){return props.find(v=>v.id===id)?.src||id;}
function getImage(src){if(!imageCache[src]){const im=new Image();im.src=src;imageCache[src]=im;}return imageCache[src];}
props.forEach(p=>getImage(p.src));trays.forEach(t=>getImage(t.src));
function initialItems(){return [
 {uid:++uid,id:'watch',x:38,y:43,size:16,rotation:-24,flip:1},
 {uid:++uid,id:'cream',x:60,y:43,size:16,rotation:16,flip:1},
 {uid:++uid,id:'rings',x:39,y:59,size:17,rotation:-12,flip:1},
 {uid:++uid,id:'perfume',x:61,y:58,size:17,rotation:19,flip:1},
 {uid:++uid,id:'heart',x:51,y:54,size:13,rotation:7,flip:1}
]}
function cleanItem(v){return {uid:v.uid||++uid,id:v.id,x:clamp(Number(v.x)||50,-15,115),y:clamp(Number(v.y)||50,-15,115),size:clamp(Number(v.size)||16,7,38),rotation:clamp(Number(v.rotation)||0,-180,180),flip:v.flip===-1?-1:1,customSrc:typeof v.customSrc==='string'&&v.customSrc.startsWith('data:image/')?v.customSrc:undefined};}
function cleanState(s){if(!s||typeof s!=='object')return null;return {tray:[1,2,3].includes(+s.tray)?+s.tray:1,items:Array.isArray(s.items)?s.items.slice(0,80).filter(v=>v&&typeof v.id==='string'&&(props.some(p=>p.id===v.id)||v.id==='custom')).map(cleanItem):[]};}
function readHash(){try{const v=location.hash.match(/^#tray=([A-Za-z0-9_-]+)$/)?.[1];if(!v)return null;const str=decodeURIComponent(Array.from(atob(v.replace(/-/g,'+').replace(/_/g,'/')),(x)=>'%'+x.charCodeAt(0).toString(16).padStart(2,'0')).join(''));return cleanState(JSON.parse(str));}catch(e){return null;}}
function init(){let saved=readHash();if(saved){try{window.history.replaceState(null,'',location.pathname+location.search)}catch(e){}try{localStorage.setItem('silver-tray-v1',JSON.stringify(saved))}catch(e){}}if(!saved)try{saved=cleanState(JSON.parse(localStorage.getItem('silver-tray-v1')))}catch(e){};state=saved||{tray:3,items:initialItems()};uid=Math.max(1000,...state.items.map(x=>x.uid||0))+1;history=[snapshot()];histPos=0;drawTrays();drawCats();drawProps();drawAll();attach();}
function snapshot(){return JSON.stringify(state)}
let persistWarned=false;function persist(){try{localStorage.setItem('silver-tray-v1',snapshot());persistWarned=false}catch(e){if(!persistWarned){persistWarned=true;notify('사진 용량이 커서 자동 저장을 못 했어요. 이미지 저장으로 남겨 주세요')}}}
function commit(){let next=snapshot();if(next!==history[histPos]){history=history.slice(0,histPos+1);history.push(next);histPos=history.length-1;if(history.length>70){history.shift();histPos--}persist();}updateButtons();}
function restore(){state=cleanState(JSON.parse(history[histPos]));selected=null;drawAll();persist();}
function undo(){if(histPos>0){histPos--;restore()}}function redo(){if(histPos<history.length-1){histPos++;restore()}}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function notify(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2450)}
function drawTrays(){for(const id of ['desktopTrays','mobileTrays']){
 const box=$(id);box.innerHTML='';for(const t of trays){const b=document.createElement('button');b.className='tray-option'+(t.id===state.tray?' active':'');b.type='button';b.setAttribute('aria-pressed',t.id===state.tray?'true':'false');b.innerHTML=`<span class="tray-thumb"><img src="${t.src}" alt=""></span><span class="tray-meta"><b>${t.name}</b><small>${t.desc}</small></span><span class="mini-check"></span>`;b.addEventListener('click',()=>{state.tray=t.id;drawAll();commit();notify(t.name+'로 변경했어요')});box.appendChild(b)} }
}
function drawCats(){const box=$('categories');box.innerHTML='';cats.forEach(c=>{const b=document.createElement('button');b.className='cat-btn'+(c===cat?' active':'');b.textContent=c;b.onclick=()=>{cat=c;drawCats();drawProps()};box.appendChild(b)})}
function drawProps(){const box=$('propsList');box.innerHTML='';props.filter(v=>cat==='전체'||v.cat===cat).forEach(p=>{let b=document.createElement('button');b.type='button';b.className='prop-item';b.title=p.label+' 추가';b.setAttribute('aria-label',p.label+' 추가');b.innerHTML=`<img src="${p.src}" alt=""><span class="prop-name">${p.label}</span>`;b.addEventListener('click',()=>add(p));box.appendChild(b)})}
function drawAll(){drawTrays();$('trayBase').src=trays.find(t=>t.id===state.tray).src;drawStickers();updateProps();updateButtons();$('emptyStage').classList.toggle('hidden',state.items.length!==0)}
function drawStickers(){layer.innerHTML='';state.items.forEach((item,i)=>{
  const el=document.createElement('div');el.className='stage-sticker'+(item.uid===selected?' selected':'');el.dataset.uid=item.uid;el.setAttribute('role','button');el.setAttribute('aria-label',(props.find(p=>p.id===item.id)?.label||'내 사진')+' 이동');el.tabIndex=0;
  el.style.left=item.x+'%';el.style.top=item.y+'%';el.style.width=item.size+'%';el.style.aspectRatio='1 / 1.08';el.style.transform=`translate(-50%,-50%) rotate(${item.rotation}deg) scaleX(${item.flip||1})`;el.style.zIndex=5+i;
  const im=document.createElement('img');im.src=item.customSrc||source(item.id);im.alt='';im.draggable=false;if(item.customSrc)im.style.objectFit='contain';el.appendChild(im);
  el.addEventListener('pointerdown',ev=>startDrag(ev,item,el));el.addEventListener('keydown',ev=>{if(ev.key==='Delete'){selected=item.uid;removeSelected()}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)){ev.preventDefault();selected=item.uid;item.x+=ev.key==='ArrowLeft'?-1:ev.key==='ArrowRight'?1:0;item.y+=ev.key==='ArrowUp'?-1:ev.key==='ArrowDown'?1:0;drawStickers();updateProps();commit()}});
  layer.appendChild(el)
 });}
function pick(uid){selected=uid;layer.querySelectorAll('.stage-sticker').forEach(e=>e.classList.toggle('selected',Number(e.dataset.uid)===uid));updateProps();updateButtons()}
function position(ev){let r=stage.getBoundingClientRect();return{x:(ev.clientX-r.left)/r.width*100,y:(ev.clientY-r.top)/r.height*100}}
function startDrag(ev,item,el){if(ev.button!==undefined&&ev.button!==0)return;ev.stopPropagation();ev.preventDefault();pick(item.uid);let p=position(ev);drag={uid:item.uid,dx:item.x-p.x,dy:item.y-p.y,el,moved:false};try{el.setPointerCapture(ev.pointerId)}catch(e){}
 el.addEventListener('pointermove',moveDrag);el.addEventListener('pointerup',endDrag);el.addEventListener('pointercancel',endDrag)}
function moveDrag(ev){if(!drag)return;ev.preventDefault();const item=state.items.find(v=>v.uid===drag.uid);if(!item)return;let p=position(ev);item.x=clamp(p.x+drag.dx,-10,110);item.y=clamp(p.y+drag.dy,-10,110);drag.el.style.left=item.x+'%';drag.el.style.top=item.y+'%';if(!drag.moved)$('adjustPanel').classList.add('moving');drag.moved=true;}
function endDrag(ev){if(!drag)return;const el=drag.el;el.removeEventListener('pointermove',moveDrag);el.removeEventListener('pointerup',endDrag);el.removeEventListener('pointercancel',endDrag);try{el.releasePointerCapture(ev.pointerId)}catch(e){}drag=null;commit();$('adjustPanel').classList.remove('moving');requestAnimationFrame(positionAdjust);}
function add(p,src){const n=state.items.length;let item={uid:++uid,id:p.id,x:49+(n%4-1.5)*4,y:48+(n%5-2)*3,size:p.id==='film'?14:17,rotation:(n%5-2)*6,flip:1};if(src)item.customSrc=src;state.items.push(item);selected=item.uid;drawAll();commit();notify(p.label+'을(를) 추가했어요. 드래그해서 옮겨보세요.')}
function selectedItem(){return state.items.find(x=>x.uid===selected)}
function updateProps(){const it=selectedItem();const label=it?(props.find(p=>p.id===it.id)?.label||'내 사진'):'선택한 소품 없음';$('selectedName').textContent=label;$('sizeRange').disabled=!it;$('rotateRange').disabled=!it;$('sizeRange').value=it?.size||17;$('rotateRange').value=it?.rotation||0;$('sizeValue').textContent=it?`${it.size}%`:'—';$('rotateValue').textContent=it?`${it.rotation}°`:'—';$('adjustPanel').classList.toggle('show',!!it);requestAnimationFrame(positionAdjust)}
function updateButtons(){const it=selectedItem();['duplicateBtn','flipBtn','forwardBtn','backwardBtn','deleteBtn'].forEach(id=>$(id).disabled=!it);$('undoTop').disabled=histPos<=0;$('redoTop').disabled=histPos>=history.length-1;$('clearBtn').disabled=state.items.length===0;}
function removeSelected(){const i=state.items.findIndex(v=>v.uid===selected);if(i<0)return;state.items.splice(i,1);selected=null;drawAll();commit()}
function duplicate(){const it=selectedItem();if(!it)return;const v={...it,uid:++uid,x:clamp(it.x+5,-10,110),y:clamp(it.y+5,-10,110)};state.items.push(v);selected=v.uid;drawAll();commit()}
function flip(){const it=selectedItem();if(!it)return;it.flip*=-1;drawStickers();commit()}
function moveLayer(delta){const i=state.items.findIndex(v=>v.uid===selected);const next=i+delta;if(i<0||next<0||next>=state.items.length)return;const a=state.items.splice(i,1)[0];state.items.splice(next,0,a);drawStickers();commit()}
function bindRange(name,prop,out,suffix){const el=$(name);el.addEventListener('pointerdown',()=>{sliderSession=true});el.addEventListener('input',()=>{const it=selectedItem();if(!it)return;it[prop]=Number(el.value);$(out).textContent=el.value+suffix;drawStickers()});el.addEventListener('change',()=>{sliderSession=false;commit();requestAnimationFrame(positionAdjust)});el.addEventListener('pointerup',()=>{sliderSession=false;commit()})}
function attach(){stage.addEventListener('pointerdown',ev=>{if(ev.target===stage||ev.target===$('trayBase')||ev.target===layer){selected=null;pick(null)}});
 $('undoTop').onclick=undo;$('redoTop').onclick=redo;$('headerSave').onclick=saveImage;$('saveBtn').onclick=saveImage;$('headerShare').onclick=share;$('shareBtn').onclick=share;
 $('duplicateBtn').onclick=duplicate;$('flipBtn').onclick=flip;$('forwardBtn').onclick=()=>moveLayer(1);$('backwardBtn').onclick=()=>moveLayer(-1);$('deleteBtn').onclick=removeSelected;$('clearBtn').onclick=()=>{if(state.items.length){state.items=[];selected=null;drawAll();commit();notify('트레이를 깨끗이 비웠어요')}};
 bindRange('sizeRange','size','sizeValue','%');bindRange('rotateRange','rotation','rotateValue','°');
 $('uploadInput').addEventListener('change',ev=>{const file=ev.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/'))return notify('이미지 파일만 추가할 수 있어요');if(file.size>6*1024*1024)return notify('6MB 이하 이미지를 선택해 주세요');const reader=new FileReader();reader.onload=()=>shrink(reader.result,file.type,src=>add({id:'custom',label:'내 사진'},src));reader.readAsDataURL(file);ev.target.value=''});
 document.addEventListener('keydown',ev=>{if(/INPUT|TEXTAREA/.test(document.activeElement?.tagName||''))return;if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='z'){ev.preventDefault();ev.shiftKey?redo():undo()}if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='y'){ev.preventDefault();redo()}if(ev.key==='Escape'){selected=null;pick(null)}if(ev.key==='Delete'&&selected)removeSelected()});
}
function shrink(src,type,done){const im=new Image();im.onload=()=>{const M=type==='image/jpeg'?1000:800,k=Math.min(1,M/Math.max(im.naturalWidth,im.naturalHeight));if(k>=1&&src.length<900000)return done(src);const c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);let out;try{out=type==='image/jpeg'?c.toDataURL('image/jpeg',.86):c.toDataURL('image/png')}catch(e){out=src}done(out)};im.onerror=()=>done(src);im.src=src}
function encodeState(){const share={tray:state.tray,items:state.items.filter(v=>!v.customSrc).map(({uid,id,x,y,size,rotation,flip})=>({uid,id,x:Math.round(x*10)/10,y:Math.round(y*10)/10,size,rotation,flip}))};const bytes=new TextEncoder().encode(JSON.stringify(share));let s='';bytes.forEach(x=>s+=String.fromCharCode(x));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function share(){if(!/^https?:/.test(location.protocol)){notify('공유 링크는 배포 후 사용할 수 있어요. 지금은 이미지를 저장해 공유하세요.');return}
 const url=location.origin+location.pathname+'#tray='+encodeState();if(state.items.some(x=>x.customSrc))notify('직접 업로드한 사진은 공유 링크에 포함되지 않아요');
 try{window.mnTrack&&window.mnTrack('share','tray')}catch(e){}try{await navigator.clipboard.writeText(url);notify('트레이 공유 링크를 복사했어요 ♡')}catch(e){prompt('이 링크를 복사해 주세요',url)}
}
function drawImg(ctx,img,cx,cy,maxW,maxH){const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(!w||!h)return;const ratio=Math.min(maxW/w,maxH/h);ctx.drawImage(img,cx-w*ratio/2,cy-h*ratio/2,w*ratio,h*ratio)}
async function preload(img){if(img.complete&&img.naturalWidth>0)return;await new Promise(res=>{if(img.complete)return res();img.addEventListener('load',res,{once:true});img.addEventListener('error',res,{once:true});setTimeout(res,4000)})}
async function saveImage(){const D=1600;const c=document.createElement('canvas');c.width=D;c.height=D;const ctx=c.getContext('2d');const grad=ctx.createLinearGradient(0,0,D,D);grad.addColorStop(0,'#ded6ce');grad.addColorStop(.4,'#eee8e1');grad.addColorStop(.8,'#d8cec5');grad.addColorStop(1,'#e8e1d9');ctx.fillStyle=grad;ctx.fillRect(0,0,D,D);
 let seed=23;for(let i=0;i<1900;i++){seed=(seed*16807)%2147483647;let x=seed%1600;seed=(seed*16807)%2147483647;let y=seed%1600;ctx.strokeStyle='rgba(87,67,55,.026)';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+9,y-14);ctx.stroke()}
 const trayIm=getImage(trays.find(t=>t.id===state.tray).src);await preload(trayIm);ctx.save();ctx.shadowColor='#483a3290';ctx.shadowBlur=47;ctx.shadowOffsetY=28;drawImg(ctx,trayIm,D/2,D/2,D*.88,D*.88);ctx.restore();
 for(const item of state.items){const img=getImage(item.customSrc||source(item.id));await preload(img);ctx.save();ctx.translate(D*item.x/100,D*item.y/100);ctx.rotate(item.rotation*Math.PI/180);ctx.scale(item.flip,1);ctx.shadowColor='#2b241d55';ctx.shadowBlur=14;ctx.shadowOffsetY=12;ctx.shadowOffsetX=4;if(img.naturalWidth){if(item.customSrc){drawImg(ctx,img,0,0,D*item.size/100,D*item.size*1.08/100)}else{ctx.drawImage(img,-D*item.size/200,-D*item.size*1.08/200,D*item.size/100,D*item.size*1.08/100)}}ctx.restore()}
 ctx.fillStyle='rgba(84,70,64,.65)';ctx.font='italic 33px Georgia';ctx.fillText('a little still life',45,65);ctx.textAlign='right';ctx.font='21px Georgia';ctx.fillText('silver tray studio ✳',D-48,D-47);
 try{window.mnTrack&&window.mnTrack('act','tray_save')}catch(e){}const a=document.createElement('a');a.download='my-little-tray.png';a.href=c.toDataURL('image/png');a.click();notify('이미지가 저장되었어요 ♡')}
const adjustMQ=window.matchMedia('(max-width:860px)');
// 폰: 고른 소품 바로 아래(공간이 없으면 위)에 크기·회전 패널을 띄움
function positionAdjust(){const panel=$('adjustPanel'),frame=document.querySelector('.art-frame');if(!adjustMQ.matches||panel.parentNode!==frame||!panel.classList.contains('show'))return;const el=layer.querySelector('.stage-sticker.selected');if(!el)return;const fr=frame.getBoundingClientRect(),r=el.getBoundingClientRect(),bx=fr.left+frame.clientLeft,by=fr.top+frame.clientTop,W=frame.clientWidth,H=frame.clientHeight,pw=panel.offsetWidth,ph=panel.offsetHeight,gap=14;let x=r.left+r.width/2-bx-pw/2;x=Math.max(6,Math.min(W-pw-6,x));let y=r.bottom-by+gap;if(y+ph>H-6)y=r.top-by-ph-gap;if(y<6)y=Math.max(6,Math.min(H-ph-6,r.bottom-by+gap));panel.style.left=x+'px';panel.style.top=y+'px'}
function placeAdjust(){const panel=$('adjustPanel'),frame=document.querySelector('.art-frame'),box=document.querySelector('.props-bottom');if(adjustMQ.matches){if(panel.parentNode!==frame)frame.appendChild(panel)}else if(panel.parentNode!==box){box.insertBefore(panel,box.querySelector('.upload-label'))}}
placeAdjust();try{adjustMQ.addEventListener('change',placeAdjust)}catch(e){adjustMQ.addListener(placeAdjust)}window.addEventListener('resize',()=>requestAnimationFrame(positionAdjust));
init();
})();
