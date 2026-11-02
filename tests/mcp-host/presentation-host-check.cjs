// Run after npm run build:mcp and npm run mcp:host.
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch(fs.existsSync('/usr/bin/chromium') ? {executablePath:'/usr/bin/chromium'} : {});
const page=await browser.newPage({viewport:{width:1000,height:850}});
await page.goto('http://localhost:8090/?topic=http-caching');
const app=page.frameLocator('#app');await app.locator('[data-testid=mcp-card]').waitFor({timeout:30000});
const theme=()=>app.locator('html').getAttribute('data-theme');
await page.evaluate(()=>window.setHostTheme('light'));await page.waitForTimeout(100);
if(await theme()!=='liquid-glass-light')throw Error('MCP theme did not follow');
await app.locator('html').evaluate(()=>window.dispatchEvent(new CustomEvent('openai:set_globals',{detail:{globals:{theme:'dark'}}})));
await page.waitForTimeout(100);if(await theme()!=='liquid-glass')throw Error('OpenAI theme did not follow');
await app.locator('html').evaluate(()=>window.dispatchEvent(new CustomEvent('openai:set_globals',{detail:{globals:{theme:'light'}}})));
await page.waitForTimeout(100);if(await theme()!=='liquid-glass-light')throw Error('OpenAI light theme did not follow');
await app.locator('[data-testid=mcp-play]').click();await app.locator('[data-testid=present-mini-controls]').waitFor();
await app.locator('[data-testid=present-mini-play]').click();
await page.waitForTimeout(1200);
for(let i=0;i<5;i++){
const metrics=await app.locator('[data-testid=present-mode]').evaluate(root=>{
const current=root.querySelector('.is-current');
return {inactiveContent:root.querySelectorAll('.present-region:not(.is-current) .present-region-body > *').length,
 visibleScenes:Array.from(current.querySelectorAll('.present-scenes > [data-beat]')).filter(el=>getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none'&&Number(getComputedStyle(el).opacity)>0.1).length,
 bodyVisibility:getComputedStyle(current.querySelector('.present-region-body')).visibility,
 titleShown:!!Array.from(current.querySelectorAll('.present-title-card[data-shown]')).length};
});
console.log('slide',i,metrics);if(metrics.inactiveContent||metrics.visibleScenes>1||(metrics.titleShown&&metrics.bodyVisibility!=='hidden'))throw Error('Stacked content');
await app.locator('[data-testid=present-mini-next]').click();await page.waitForTimeout(1800);
}
const bg=await app.locator('.mcp-bar').evaluate(el=>getComputedStyle(el).backgroundColor);console.log('nav background',bg);if(bg==='rgba(0, 0, 0, 0)')throw Error('Transparent nav');
await page.locator('#app').screenshot({path:'tests/mcp-host/results/fixed-surfaces.png'});
await browser.close();console.log('MCP and OpenAI theme events, single active section and navigation surfaces passed');
})().catch(e=>{console.error(e);process.exit(1)});
