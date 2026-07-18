const http=require('http'), fs=require('fs'), path=require('path');
const ROOT="C:\\Users\\hrunnalls\\OneDrive - Silent Ice Inc. - Female Super League\\Laptop\\Desktop\\Hammie_Test\\FSL-2026-27-Control-Room";
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.ico':'image/x-icon','.png':'image/png'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const fp=path.join(ROOT,p);
  fs.readFile(fp,(e,buf)=>{
    if(e){res.writeHead(404);res.end('404');return;}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(fp).toLowerCase()]||'application/octet-stream','Access-Control-Allow-Origin':'*'});
    res.end(buf);
  });
}).listen(8765,()=>console.log('serving on http://localhost:8765'));
