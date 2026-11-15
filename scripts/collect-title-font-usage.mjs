// Usage: node scripts/collect-title-font-usage.mjs BASE_URL PLAYWRIGHT_MODULE OUTPUT_JSON
// Run against the current production build, before changing fonts. This reads
// public rendered text only and never modifies website content.
const [base, playwrightModule, output] = process.argv.slice(2);
if (!base || !playwrightModule || !output) throw new Error("Provide BASE_URL PLAYWRIGHT_MODULE OUTPUT_JSON");
const { chromium } = await import(playwrightModule);
import fs from 'node:fs/promises';
const content=JSON.parse(await fs.readFile('content/site-content.json','utf8'));
const routes=['/','/collection','/exhibitions','/journal','/about','/contact',...['artworks','exhibitions','articles'].flatMap((section)=>content[section].filter(r=>r.publicationStatus!=='draft').map(r=>`/${section==='artworks'?'collection':section==='articles'?'journal':'exhibitions'}/${r.slug}`))];
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const result={};
await p.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
for(const route of routes){await p.goto(base+route,{waitUntil:'domcontentloaded'});await p.locator('h1').first().waitFor();await p.evaluate(()=>document.fonts.ready);result[route]=await p.evaluate(()=>{const w=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT);let n,s='';while(n=w.nextNode()){if(n.parentElement?.tagName==='STYLE'||!getComputedStyle(n.parentElement).fontFamily.includes('Zhujinju Song'))continue;const r=document.createRange();r.selectNodeContents(n);if(r.getClientRects().length)s+=n.textContent;}return[...new Set(s)].sort().join('');});console.log(route,result[route].length);}
await b.close();await fs.writeFile(output,JSON.stringify(result,null,2));
