const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '../..');
  const html = fs.readFileSync(path.join(root,'admin/index.html'),'utf8');
  for (const file of ['admin/index.html','sansa/index.html']) {
    const text = fs.readFileSync(path.join(root,file),'utf8');
    for (const m of text.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
      if (m[1].trim()) new vm.Script(m[1],{filename:file});
    }
  }
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844}});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://**/*', route=>route.abort());
    await page.addInitScript(() => {
      window.calls=[];
      window.row={id:'00000000-0000-4000-8000-000000000002',kind:'lantern',text:'<img src=x onerror="window.injected=true">테스트',reports:2,pending:true,hidden:false,last_report:'2026-11-10T00:00:00Z'};
      window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{id:'test'}}}}),onAuthStateChange:()=>{},signOut:async()=>({}),signInWithOAuth:async()=>({})},rpc:async(name,args)=>{
        window.calls.push({name,args});
        if(name==='admin_stats')return {data:{db_bytes:0,daily:[],reports:[]}};
        if(name==='admin_sansa_reports')return {data:[{...window.row}]};
        if(name==='admin_review_sansa'){window.row.hidden=args.p_hidden;window.row.pending=false;return {data:null};}
        return {data:null};
      }})};
    });
    await page.goto('file://'+path.join(root,'admin/index.html')+'#report');
    await page.getByRole('button',{name:'전체 숨기기'}).waitFor();
    assert.equal(await page.locator('.rep img').count(),0,'untrusted text must not render markup');
    assert.equal(await page.evaluate(()=>window.injected),undefined);
    page.on('dialog',d=>d.accept());
    await page.getByRole('button',{name:'전체 숨기기'}).click();
    await page.getByText('전체 화면에서 숨겼어요.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.row.hidden),true);
    await page.getByRole('button',{name:'다시 공개하기'}).click();
    await page.getByText('공개 상태로 검토를 완료했어요.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.row.hidden),false);
    assert.equal(await page.evaluate(()=>window.row.pending),false);
    const calls=await page.evaluate(()=>window.calls.filter(c=>c.name==='admin_review_sansa'));
    assert.deepEqual(calls.map(c=>c.args.p_hidden),[true,false]);
    await page.screenshot({path:'/tmp/moodnight-moderation-mobile.png',fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('PASS: inline JS parses, mobile moderation renders, XSS escaped, hide/restore payloads and states correct');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
