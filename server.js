const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const {WebSocketServer}=require('ws');
const path=require('path');
const crypto=require('crypto');
const app=express(), server=http.createServer(app), io=new Server(server,{cors:{origin:true}});
app.use(express.json({limit:'64kb'}));
const rooms=new Map();
function fresh(){return {mapId:null,mapName:'Waiting for ToN log…',roundType:'',pins:{},updatedAt:Date.now()}}
function reds(st){return Object.values(st.pins).filter(p=>p.color==='red').sort((a,b)=>(a.redOrder??Infinity)-(b.redOrder??Infinity)||(a.createdAt??0)-(b.createdAt??0))}
function renumberRed(st){reds(st).forEach((p,i)=>p.number=i+1)}
function nextRedOrder(st){return Object.values(st.pins).reduce((m,p)=>Math.max(m,Number(p.redOrder)||0),0)+1}
function validRoom(v){return typeof v==='string' && /^[a-f0-9]{24,64}$/.test(v)}
function getRoom(id){if(!rooms.has(id))rooms.set(id,fresh());return rooms.get(id)}
function safeRoom(req,res){const id=String(req.params.room||'');if(!validRoom(id)){res.status(400).json({ok:false,error:'invalid room'});return null}return id}
function stateMsg(room){return JSON.stringify({type:'state',state:getRoom(room)})}
const nativeClients=new Map();
function broadcast(room){const st=getRoom(room);io.to(room).emit('state',st);const msg=stateMsg(room);for(const ws of nativeClients.get(room)||[])if(ws.readyState===1)ws.send(msg)}
function setPin(room,p){if(!p||!p.clientId||!['red','green','blue'].includes(p.color))return;const st=getRoom(room);if(Number(p.mapId)!==Number(st.mapId))return;const clientId=String(p.clientId).slice(0,80);let pin=Object.values(st.pins).find(x=>x.clientId===clientId);const oldColor=pin?.color;if(!pin){pin={pinId:crypto.randomUUID(),clientId,createdAt:Date.now()};st.pins[pin.pinId]=pin}pin.name=String(p.name||'').slice(0,32);pin.color=p.color;pin.x=Math.max(0,Math.min(1,Number(p.x)));pin.y=Math.max(0,Math.min(1,Number(p.y)));pin.mapId=st.mapId;if(p.color==='red'&&oldColor!=='red')pin.redOrder=nextRedOrder(st);if(p.color!=='red'){delete pin.number;delete pin.redOrder}renumberRed(st);st.updatedAt=Date.now();broadcast(room)}
function movePin(room,p){const st=getRoom(room),pin=st.pins[p?.pinId];if(!pin||pin.clientId!==String(p.clientId))return;pin.x=Math.max(0,Math.min(1,Number(p.x)));pin.y=Math.max(0,Math.min(1,Number(p.y)));st.updatedAt=Date.now();broadcast(room)}
function removePin(room,p){const st=getRoom(room),pin=st.pins[p?.pinId];if(!pin||pin.clientId!==String(p.clientId))return;delete st.pins[p.pinId];renumberRed(st);st.updatedAt=Date.now();broadcast(room)}
app.get('/health',(q,r)=>r.json({ok:true}));
app.get('/api/room/:room/state',(req,res)=>{const id=safeRoom(req,res);if(id)res.json(getRoom(id))});
app.post('/api/room/:room/round',(req,res)=>{const id=safeRoom(req,res);if(!id)return;const st=getRoom(id);const {mapId,mapName,roundType}=req.body||{};const n=Number(mapId);if(!Number.isInteger(n)||n<0||n>999)return res.status(400).json({ok:false});if(n!==st.mapId)st.pins={};st.mapId=n;st.mapName=String(mapName||`Map ${n}`).slice(0,80);st.roundType=String(roundType||'').slice(0,80);st.updatedAt=Date.now();broadcast(id);res.json({ok:true})});
io.on('connection',s=>{s.on('joinRoom',p=>{const room=String(p?.room||'');if(!validRoom(room))return;s.data.room=room;s.join(room);s.emit('state',getRoom(room))});s.on('setPin',p=>s.data.room&&setPin(s.data.room,p));s.on('movePin',p=>s.data.room&&movePin(s.data.room,p));s.on('removePin',p=>s.data.room&&removePin(s.data.room,p))});
const wss=new WebSocketServer({server,path:'/native'});
wss.on('connection',ws=>{ws.room=null;ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}if(m.type==='join'){const room=String(m.room||'');if(!validRoom(room))return;ws.room=room;if(!nativeClients.has(room))nativeClients.set(room,new Set());nativeClients.get(room).add(ws);ws.send(stateMsg(room));return}if(!ws.room)return;if(m.type==='setPin')setPin(ws.room,m);if(m.type==='movePin')movePin(ws.room,m);if(m.type==='removePin')removePin(ws.room,m)});ws.on('close',()=>{if(ws.room)nativeClients.get(ws.room)?.delete(ws)})});
setInterval(()=>{const cutoff=Date.now()-12*60*60*1000;for(const [id,st] of rooms)if(st.updatedAt<cutoff)rooms.delete(id)},3600000).unref();
const port=process.env.PORT||8787;server.listen(port,'0.0.0.0',()=>console.log(`ToN Pin System listening on ${port}`));
