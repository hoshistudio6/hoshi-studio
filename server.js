const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const dataDir = path.join(root, 'data');
const port = process.env.PORT || 3000;
const adminPassword = process.env.ADMIN_PASSWORD || 'hoshi-admin';
const sessions = new Set();
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const productsFile = path.join(dataDir, 'products.json');
const ordersFile = path.join(dataDir, 'orders.json');
const starterProducts = [
  ['moonlight-pearl-necklace','Moonlight Pearl Necklace','Jewellery',1299,'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80','An elegant pearl-inspired necklace designed for everyday style and special occasions.'],
  ['classic-gold-earrings','Classic Gold Earrings','Jewellery',899,'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80','Simple and elegant earrings that add a refined touch to any outfit.'],
  ['red-heart-pendant','Red Heart Pendant','Jewellery',749,'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80','A cute heart-inspired pendant made for gifting or keeping for yourself.'],
  ['vintage-charm-bracelet','Vintage Charm Bracelet','Jewellery',1099,'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80','A charming bracelet with a timeless vintage-inspired appearance.'],
  ['ceramic-cat','Decorative Ceramic Cat','Artifacts',1599,'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=800&q=80','A decorative art piece designed to bring character to your room.'],
  ['table-artifact','Handcrafted Table Artifact','Artifacts',1899,'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80','A handcrafted decorative artifact for desks, shelves and living spaces.'],
  ['miniature-sculpture','Miniature Decorative Sculpture','Artifacts',2299,'https://images.unsplash.com/photo-1577083552431-6e5fd01988b5?auto=format&fit=crop&w=800&q=80','A unique miniature sculpture that works beautifully as a statement decor piece.'],
  ['artisan-bowl','Artisan Decorative Bowl','Artifacts',1399,'https://images.unsplash.com/photo-1610701596061-2ecf227c7d6b?auto=format&fit=crop&w=800&q=80','A decorative artisan-style bowl perfect for modern interiors.']
].map(([id,name,category,price,image,description]) => ({id,name,category,price,image,description,badge:'NEW',active:true}));
function read(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function save(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
if (!fs.existsSync(productsFile)) save(productsFile, starterProducts);
if (!fs.existsSync(ordersFile)) save(ordersFile, []);
function send(res, status, data) { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(data)); }
function parse(req) { return new Promise(resolve => { let raw=''; req.on('data', chunk => raw += chunk); req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); } }); }); }
function signedIn(req) { return [...sessions].some(token => (req.headers.cookie || '').includes(`hoshi_session=${token}`)); }
function needsLogin(req,res) { if (!signedIn(req)) { send(res,401,{error:'Please sign in'}); return true; } return false; }
function staticFile(res, target) { const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png'}; fs.readFile(target,(error,file)=>{if(error){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(target)] || 'application/octet-stream'});res.end(file);}); }

http.createServer(async (req,res) => {
  const url = new URL(req.url, `http://${req.headers.host}`); const pathname = url.pathname;
  if (pathname === '/api/products' && req.method === 'GET') return send(res,200,read(productsFile,[]).filter(product => product.active));
  if (pathname === '/api/orders' && req.method === 'POST') { const body=await parse(req); if (!body.customer?.name || !body.customer?.phone || !body.items?.length) return send(res,400,{error:'Please complete your delivery details.'}); const order={id:`HS-${Date.now().toString().slice(-7)}`,createdAt:new Date().toISOString(),status:'Payment pending',paymentMethod:body.paymentMethod || 'UPI',customer:body.customer,items:body.items,total:Number(body.total)||0}; const orders=read(ordersFile,[]);orders.unshift(order);save(ordersFile,orders);return send(res,201,{order}); }
  if (pathname === '/api/admin/login' && req.method === 'POST') { const body=await parse(req); if(body.password!==adminPassword)return send(res,401,{error:'Incorrect password'});const token=crypto.randomBytes(24).toString('hex');sessions.add(token);res.writeHead(200,{'Content-Type':'application/json','Set-Cookie':`hoshi_session=${token}; HttpOnly; SameSite=Lax; Path=/`});return res.end('{"ok":true}'); }
  if (pathname === '/api/admin/logout' && req.method === 'POST') { res.writeHead(200,{'Set-Cookie':'hoshi_session=; Max-Age=0; Path=/'});return res.end(); }
  if (pathname === '/api/admin/products' && req.method === 'GET') { if(needsLogin(req,res))return;return send(res,200,read(productsFile,[])); }
  if (pathname === '/api/admin/products' && req.method === 'POST') { if(needsLogin(req,res))return;const body=await parse(req),all=read(productsFile,[]);const product={id:body.id||crypto.randomUUID(),name:body.name||'Untitled product',category:body.category||'Jewellery',price:Number(body.price)||0,image:body.image||'',description:body.description||'',badge:body.badge||'NEW',active:body.active!==false};const index=all.findIndex(p=>p.id===product.id);if(index<0)all.unshift(product);else all[index]=product;save(productsFile,all);return send(res,200,product); }
  if (pathname.startsWith('/api/admin/products/') && req.method === 'DELETE') { if(needsLogin(req,res))return;const id=pathname.split('/').pop();save(productsFile,read(productsFile,[]).filter(p=>p.id!==id));return send(res,200,{ok:true}); }
  if (pathname === '/api/admin/orders' && req.method === 'GET') { if(needsLogin(req,res))return send(res,200,read(ordersFile,[])); }
  const target=pathname==='/' ? path.join(root,'index.html') : path.join(root,pathname);if(!target.startsWith(root)){res.writeHead(403);return res.end();}staticFile(res,target);
}).listen(port, '0.0.0.0', ()=>console.log(`Hoshi Studio: http://localhost:${port}`));
