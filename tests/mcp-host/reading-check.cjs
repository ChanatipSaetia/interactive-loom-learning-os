// Run after npm run build:mcp and npm run mcp:host.
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch(fs.existsSync('/usr/bin/chromium') ? {executablePath:'/usr/bin/chromium'} : {});
 for(const [name,width,mobile] of [['pages-mobile',390,true],['pages-narrow',1000,false]]){
 const page=await browser.newPage({viewport:{width,height:900},hasTouch:mobile,isMobile:mobile});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:8090/?topic=http-caching&mode=read');
 await page.evaluate(()=>{const m=document.createElement('meta');m.name='viewport';m.content='width=device-width,initial-scale=1';document.head.append(m)});
 if(!mobile)await page.locator('#chat').evaluate(el=>el.style.maxWidth='500px');
 const app=page.frameLocator('#app');
 await app.locator('[data-testid=mcp-play]').click({timeout:30000});
 await app.locator('[data-testid=mcp-read-next]').waitFor();
 await page.waitForTimeout(800);
 const status=()=>app.locator('[data-testid=mcp-read-page]').innerText();
 console.log(name,'initial',await status());
 const before=await status();await app.locator('[data-testid=mcp-read-next]').click();
 if(before===await status())throw Error('Next did not navigate');
 await app.locator('[data-testid=mcp-read-prev]').click();
 if(await status()!==before)throw Error('Previous did not return');
 await page.screenshot({path:`tests/mcp-host/results/${name}-first.png`});
 const total=Number((await status()).split(' of ')[1]);
 for(let n=1;n<total;n++){await app.locator('[data-testid=mcp-read-next]').click();if(n===Math.floor(total/2))await page.screenshot({path:`tests/mcp-host/results/${name}-middle.png`});}
 if(!await app.locator('[data-testid=mcp-read-next]').isDisabled())throw Error('Next must stop at last page');
 await page.screenshot({path:`tests/mcp-host/results/${name}-last.png`});
 console.log(name,'last',await status(),'layout',await app.locator('[data-testid=mcp-read-scroll]').evaluate(el=>({h:el.clientHeight,sh:el.scrollHeight,w:el.clientWidth,sw:el.scrollWidth,top:el.scrollTop})),errors);
 await app.locator('[data-testid^=quiz-choice-0-]').first().click();
 await page.waitForTimeout(200);
 const answer=await app.locator('[data-testid^=quiz-explanation-]').first().innerText();
 const chosen=await status();
 await app.locator('[data-testid=mcp-read-prev]').click();
 await app.locator('[data-testid=mcp-read-next]').click();
 if(await app.locator('[data-testid^=quiz-explanation-]').first().innerText()!==answer)throw Error('Answer lost across page navigation');
 // Keyboard navigation works from the reading area, without taking arrow keys from controls.
 await app.locator('[data-testid=mcp-read-scroll]').focus();
 await page.keyboard.press('ArrowLeft');
 if(await status()===chosen)throw Error('Keyboard did not navigate');
 if(mobile) {
   const beforeSwipe=await status();
   const box=await app.locator('[data-testid=mcp-read-scroll]').boundingBox();
   const session=await page.context().newCDPSession(page);
   const x=box.x+box.width*0.8,y=box.y+24;
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-120,y}]});
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(100);
   if(await status()===beforeSwipe)throw Error('Touch swipe did not navigate');
   console.log('touch swipe passed');
 }
 await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
