// Regenerate test/index.html: the CURRENT root engine + test isolation + a schedule payload.
// Usage: node tools/make-test-build.js [payload.json]   (default: FSL_schedule_2026-07-18_REBUILT.json)
// Isolation: no Firebase boot, dialogs stubbed, in-memory localStorage (falls back to clear()).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const payloadFile = process.argv[2] || path.join(ROOT, 'FSL_schedule_2026-07-18_REBUILT.json');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const payload = fs.readFileSync(payloadFile, 'utf8').trim();

// 1) test header right after <title>
const titleEnd = html.indexOf('</title>');
if (titleEnd < 0) throw new Error('no </title> anchor');
const header = `</title>
<script>
window.FSL_TEST_NO_CLOUD=true;
try{window.prompt=function(){return '';};window.alert=function(){};window.confirm=function(){return true;};}catch(e){}
try{(function(){var m={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:function(k){return m[k]==null?null:m[k];},setItem:function(k,v){m[k]=String(v);},removeItem:function(k){delete m[k];},clear:function(){m={};},key:function(i){return Object.keys(m)[i]||null;},get length(){return Object.keys(m).length;}}});})();}catch(e){try{localStorage.clear();}catch(e2){}}
window.FSL_TEST_PAYLOAD=${payload};
</script>
<script>
  setTimeout(function(){ try{ if(window.__applyPayload&&window.FSL_TEST_PAYLOAD){ window.__applyPayload(window.FSL_TEST_PAYLOAD); } }catch(e){} }, 500);
</script>`;
html = html.slice(0, titleEnd) + header + html.slice(titleEnd + '</title>'.length);

// 2) guard the Firebase boot
const boot = 'document.head.appendChild(s);';
if (html.split(boot).length !== 2) throw new Error('Firebase boot anchor not unique');
html = html.replace(boot, 'if(!window.FSL_TEST_NO_CLOUD)document.head.appendChild(s);');

// 3) expose payload helpers for the harness
const bp = 'function buildPayload(){';
if (html.indexOf(bp) < 0) throw new Error('buildPayload anchor missing');
html = html.replace(bp, 'window.__applyPayload=applyPayload; window.__buildPayload=buildPayload;\n  ' + bp);

fs.writeFileSync(path.join(ROOT, 'test', 'index.html'), html);
console.log('wrote test/index.html from current root + ' + path.basename(payloadFile) + ' (' + html.length + ' bytes)');
