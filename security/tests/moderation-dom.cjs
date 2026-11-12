// Install linkedom@0.18.12 in your test environment; no production dependency.
const {parseHTML}=require('linkedom');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'admin/index.html'),'utf8');
for(const f of ['admin/index.html','sansa/index.html'])for(const m of fs.readFileSync(path.join(root,f),'utf8').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
const code=html.slice(html.indexOf('function moderationHTML()'),html.indexOf('// 크롬 탭처럼:'));
const {document}=parseHTML('<html><body><div id="mount"></div></body></html>');
const row={id:'00000000-0000-4000-8000-000000000002',kind:'lantern',text:'<img src=x onerror="evil()">안전 검사',reports:2,pending:true,hidden:false};
const S={sansaQueue:[row]},calls=[];
let fail=false,confirmed=true;
const ctx=vm.createContext({document,S,n:x=>String(x),esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),$:s=>document.querySelector(s),confirm:()=>confirmed,sb:{rpc:async(name,args)=>{calls.push({name,args});if(fail)return {error:{message:'forbidden'}};row.hidden=args.p_hidden;row.pending=false;return {error:null}}},load:async()=>render()});
vm.runInContext(code,ctx);
function render(){document.querySelector('#mount').innerHTML=ctx.moderationHTML();ctx.bindModeration();}
(async()=>{
 render();assert.equal(document.querySelectorAll('.rep img').length,0);assert.match(document.querySelector('.rep p').textContent,/<img src=x/);
 confirmed=false;await document.querySelector('[data-hidden="true"]').onclick();assert.equal(calls.length,0);
 confirmed=true;await document.querySelector('[data-hidden="true"]').onclick();assert.equal(row.hidden,true);assert.equal(row.pending,false);assert.match(document.querySelector('#reviewStatus').textContent,/숨겼어요/);
 await document.querySelector('[data-hidden="false"]').onclick();assert.equal(row.hidden,false);assert.deepEqual(calls.map(c=>c.args.p_hidden),[true,false]);
 fail=true;await document.querySelector('[data-hidden="true"]').onclick();assert.equal(row.hidden,false);assert.equal(document.querySelector('[data-hidden="true"]').disabled,false);assert.match(document.querySelector('#reviewStatus').textContent,/처리하지 못했어요/);
 S.sansaQueue=[];render();assert.match(document.querySelector('#mount').textContent,/신고가 없어요/);
 S.sansaQueue=null;render();assert.match(document.querySelector('#mount').textContent,/불러오지 못했어요/);
 console.log('PASS: syntax, escaped text, cancel, hide, restore, permission failure/retry, empty/error states');
})().catch(e=>{console.error(e);process.exit(1)});
