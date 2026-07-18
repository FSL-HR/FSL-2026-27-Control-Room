// Build an ISOLATED test copy of the app: Firebase OFF, schedule embedded, TEST banner.
// Usage: node build_test.js <payload.json> [outPath]
const fs=require('fs');
const REPO="C:\\Users\\hrunnalls\\OneDrive - Silent Ice Inc. - Female Super League\\Laptop\\Desktop\\Hammie_Test\\FSL-2026-27-Control-Room\\";
const SRC=REPO+"index.html";
const payloadPath=process.argv[2];
const OUT=process.argv[3]||(REPO+"test\\index.html");
if(!payloadPath){ console.error("need payload path"); process.exit(1); }

let html=fs.readFileSync(SRC,'utf8');
const payload=JSON.parse(fs.readFileSync(payloadPath,'utf8'));
// compact + make safe to embed inside a <script> tag
let pj=JSON.stringify(payload).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');

const inject=`<title>FSL Schedule — View Only</title>
<script>
window.FSL_TEST_NO_CLOUD=true;
try{window.prompt=function(){return '';};window.alert=function(){};window.confirm=function(){return true;};}catch(e){}
window.FSL_TEST_PAYLOAD=${pj};
window.addEventListener('load',function(){
  try{
    var b=document.createElement('div');
    b.textContent='TEST SCHEDULE \\u2014 isolated preview, NOT the live site (Firebase off, live schedule untouched)';
    b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:100000;background:#C81E28;color:#fff;font:600 12px -apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:6px 10px;letter-spacing:.3px';
    document.body.appendChild(b);
    document.body.style.paddingTop='26px';
  }catch(e){}
  setTimeout(function(){ try{ if(window.__applyPayload&&window.FSL_TEST_PAYLOAD){ window.__applyPayload(window.FSL_TEST_PAYLOAD); } }catch(e){} }, 500);
});
</script>`;

// 1) inject test-config right after <title> (replaces the title line, re-adds it)
const titleTag='<title>FSL Schedule — View Only</title>';
if(html.indexOf(titleTag)<0){ console.error('title anchor not found'); process.exit(1); }
html=html.replace(titleTag, inject);

// 2) gate the Firebase boot script so it never loads in the test build
if(html.indexOf('document.head.appendChild(s);')<0){ console.error('firebase anchor not found'); process.exit(1); }
html=html.replace('document.head.appendChild(s);','if(!window.FSL_TEST_NO_CLOUD)document.head.appendChild(s);');

// 3) expose applyPayload/buildPayload so the embed + verification can call them (CRLF-tolerant)
const exposeRe=/(    return true;\r?\n  \}\r?\n)(\r?\n  \/\/ ---- Small status pill in the corner)/;
if(!exposeRe.test(html)){ console.error('expose anchor not found'); process.exit(1); }
html=html.replace(exposeRe,'$1  window.__applyPayload=applyPayload; window.__buildPayload=buildPayload;\n$2');

fs.mkdirSync(REPO+"test",{recursive:true});
fs.writeFileSync(OUT,html);
console.log('built:', OUT);
console.log('size :', (html.length/1024).toFixed(0)+'kb', '| payload games:', payload.games.length, '| parked:', payload.parking?Object.keys(payload.parking).length:'n/a');
console.log('checks: FSL_TEST_NO_CLOUD gate =', html.includes('if(!window.FSL_TEST_NO_CLOUD)document.head.appendChild(s);'),
  '| expose =', html.includes('window.__applyPayload=applyPayload;'),
  '| embed =', html.includes('window.FSL_TEST_PAYLOAD='));
