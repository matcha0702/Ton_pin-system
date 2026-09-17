const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const path=require('path');
const crypto=require('crypto');
const app=express(), server=http.createServer(app), io=new Server(server,{cors:{origin:true}});
app.use(express.json({limit:'64kb'}));
app.use(express.static(path.join(__dirname,'public')));
const rooms=new Map();
function fresh(){return {mapId:null,mapName:'Waiting for ToN log…',roundType:'',pins:{},nextRedNumber:1,updatedAt:Date.now()}}
function validRoom(v){return typeof v==='string' && /^[a-f0-9]{24,64}$/.test(v)}
function getRoom(id){if(!rooms.has(id))rooms.set(id,fresh());return rooms.get(id)}
function safeRoom(req,res){const id=String(req.params.room||'');if(!validRoom(id)){res.status(400).json({ok:false,error:'invalid room'});return null}return id}
app.get('/health',(q,r)=>r.json({ok:true}));
app.get('/api/room/:room/state',(req,res)=>{const id=safeRoom(req,res);if(id)res.json(getRoom(id))});
app.post('/api/room/:room/round',(req,res)=>{const id=safeRoom(req,res);if(!id)return;const st=getRoom(id);const {mapId,mapName,roundType}=req.body||{};const n=Number(mapId);if(!Number.isInteger(n)||n<0||n>999)return res.status(400).json({ok:false});if(n!==st.mapId){st.pins={};st.nextRedNumber=1}st.mapId=n;st.mapName=String(mapName||`Map ${n}`).slice(0,80);st.roundType=String(roundType||'').slice(0,80);st.updatedAt=Date.now();io.to(id).emit('state',st);res.json({ok:true})});
io.on('connection',s=>{
 s.on('joinRoom',payload=>{const room=String(payload?.room||'');if(!validRoom(room))return;s.data.room=room;s.join(room);s.emit('state',getRoom(room))});
 s.on('setPin',p=>{const room=s.data.room;if(!room||!p||!p.clientId||!['red','green','blue'].includes(p.color))return;const st=getRoom(room);if(Number(p.mapId)!==Number(st.mapId))return;const clientId=String(p.clientId).slice(0,80);let pin=Object.values(st.pins).find(x=>x.clientId===clientId);const oldColor=pin?.color;if(!pin){pin={pinId:crypto.randomUUID(),clientId};st.pins[pin.pinId]=pin}pin.name=String(p.name||'').slice(0,32);pin.color=p.color;pin.x=Math.max(0,Math.min(1,Number(p.x)));pin.y=Math.max(0,Math.min(1,Number(p.y)));pin.mapId=st.mapId;if(p.color==='red'&&oldColor!=='red')pin.number=st.nextRedNumber++;if(p.color!=='red')delete pin.number;st.updatedAt=Date.now();io.to(room).emit('state',st)});
 s.on('movePin',p=>{const room=s.data.room;if(!room)return;const st=getRoom(room),pin=st.pins[p?.pinId];if(!pin||pin.clientId!==String(p.clientId))return;pin.x=Math.max(0,Math.min(1,Number(p.x)));pin.y=Math.max(0,Math.min(1,Number(p.y)));st.updatedAt=Date.now();io.to(room).emit('state',st)});
 s.on('removePin',p=>{const room=s.data.room;if(!room)return;const st=getRoom(room),pin=st.pins[p?.pinId];if(!pin||pin.clientId!==String(p.clientId))return;delete st.pins[p.pinId];st.updatedAt=Date.now();io.to(room).emit('state',st)});
});
setInterval(()=>{const cutoff=Date.now()-12*60*60*1000;for(const [id,st] of rooms)if(st.updatedAt<cutoff)rooms.delete(id)},60*60*1000).unref();
const port=process.env.PORT||8787;server.listen(port,'0.0.0.0',()=>console.log(`ToN Pin Tool listening on ${port}`));
