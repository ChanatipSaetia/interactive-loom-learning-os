// Run after npm run build:mcp and npm run mcp:host.
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch(fs.existsSync('/usr/bin/chromium') ? {executablePath:'/usr/bin/chromium'} : {});
for(const touch of [false,true]){
 const page=await browser.newPage({viewport:{width:1000,height:1000},hasTouch:touch});
 await page.goto('http://localhost:8090/?topic=http-caching&mode=read');
 await page.evaluate(()=>document.body.style.minHeight='3000px');
 const app=page.frameLocator('#app');await app.locator('[data-testid=mcp-play]').click({timeout:30000});
 const scroll=app.locator('[data-testid=mcp-read-scroll]');await scroll.waitFor();
 await page.evaluate(()=>window.scrollTo(0,100));
 const gesture=async(outside,delta)=>{
  const box=await scroll.boundingBox();const x=outside?10:box.x+box.width*.5;
  if(!touch){await page.mouse.move(x,Math.max(200,box.y+150));await page.mouse.wheel(0,delta)}
  else{
   const cdp=await page.context().newCDPSession(page);const y=Math.max(250,box.y+180);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-Math.sign(delta)*i*18}]});await page.waitForTimeout(20)}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await page.waitForTimeout(400);
 };
 for(const edge of ['middle','bottom','top']){
  await scroll.evaluate((el,edge)=>{el.scrollTop=edge==='top'?0:edge==='bottom'?el.scrollHeight:100},edge);
  const outer=await page.evaluate(()=>window.scrollY);
  await gesture(false,edge==='top'?-200:200);
  if(await page.evaluate(()=>window.scrollY)!==outer)throw Error('Chat scrolled for inside gesture at '+edge);
  console.log(touch?'touch':'wheel',edge,'outer stable:',outer,'inner:',await scroll.evaluate(el=>el.scrollTop));
 }
 const outer=await page.evaluate(()=>window.scrollY);await gesture(true,200);
 if(await page.evaluate(()=>window.scrollY)===outer)throw Error('Outside gesture must scroll the chat');
 console.log(touch?'touch':'wheel','outside scrolls chat');
 await page.close();
}
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
