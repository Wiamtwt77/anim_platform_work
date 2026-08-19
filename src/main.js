import './style.css';

const parts=[
 {id:'head',name:'الرأس',src:'./assets/character-01/01_head.png',x:256,y:188,px:256,py:188,sx:1,sy:1,rot:0,z:5},
 {id:'body',name:'الجسم',src:'./assets/character-01/02_body.png',x:256,y:325,px:256,py:160,sx:1,sy:1,rot:0,z:3},
 {id:'rightArm',name:'الذراع اليمنى',src:'./assets/character-01/03_right_arm.png',x:386,y:300,px:90,py:150,sx:1,sy:1,rot:0,z:4},
 {id:'leftArm',name:'الذراع اليسرى',src:'./assets/character-01/04_left_arm.png',x:126,y:300,px:90,py:150,sx:1,sy:1,rot:0,z:4},
 {id:'rightLeg',name:'الساق اليمنى',src:'./assets/character-01/05_right_leg.png',x:310,y:480,px:120,py:70,sx:1,sy:1,rot:0,z:2},
 {id:'leftLeg',name:'الساق اليسرى',src:'./assets/character-01/06_left_leg.png',x:205,y:480,px:120,py:70,sx:1,sy:1,rot:0,z:2},
];
const state={frame:0,fps:24,total:120,selected:'rightArm',playing:false,frames:{}};
const images={};
for(const p of parts){const img=new Image();img.src=p.src;images[p.id]=img;}

const app=document.querySelector('#app');
app.innerHTML=`<div class="app">
<header class="topbar"><div class="brand">Puppet <span>Motion</span></div><div class="toolbar"><button class="btn active" id="selectTool">تحريك</button><button class="btn" id="recordBtn">● تسجيل</button><button class="btn" id="resetBtn">↺ وضعية البداية</button></div><div class="spacer"></div><div class="toolbar"><button class="btn" id="newFrameBtn">+ فريم</button><button class="btn" id="saveBtn">حفظ المشروع</button></div></header>
<main class="workspace"><aside class="panel left"><h3>الشخصية</h3><div class="layers" id="layers"></div><div class="help">اسحب أي جزء من الشخصية بصريًا. لا تحتاج لرؤية العظام؛ الـRig يعمل في الخلفية.<br><br><span class="kbd">Shift</span> دوران حر &nbsp; <span class="kbd">R</span> إعادة الوضعية</div></aside>
<section class="stage-wrap"><div class="status" id="status">فريم 0 · جاهز</div><canvas id="stage" width="768" height="768"></canvas><div class="hint">اسحب اليد أو الرأس أو القدم — ثم أضف فريمًا لتسجيل الوضعية</div></section>
<aside class="panel inspector"><h3>المحدد: <span id="selectedName">الذراع اليمنى</span></h3><div class="row"><span class="label">X</span><input class="number" id="xInp" type="number" step="1"></div><div class="row"><span class="label">Y</span><input class="number" id="yInp" type="number" step="1"></div><div class="row"><span class="label">الدوران</span><input class="number" id="rInp" type="number" step="1"></div><div class="row"><span class="label">المقياس</span><input class="number" id="sInp" type="number" step="0.01" min="0.2" max="3"></div></aside></main>
<section class="timeline"><div class="timeline-head"><div class="transport"><button id="firstBtn">|◀</button><button id="prevBtn">◀</button><button id="playBtn">▶</button><button id="nextBtn">▶</button><button id="lastBtn">▶|</button></div><div class="timecode" id="timecode">00:00 / 05:00</div><div>24 FPS</div></div><div class="track-area"><div class="track-names" id="trackNames"></div><div class="tracks" id="tracks"><div class="ruler" id="ruler"></div><div id="trackRows"></div><div class="playhead" id="playhead"></div></div></div></section>
</div>`;

const canvas=document.querySelector('#stage'); const ctx=canvas.getContext('2d');
const layersEl=document.querySelector('#layers'); const trackNames=document.querySelector('#trackNames'); const trackRows=document.querySelector('#trackRows'); const ruler=document.querySelector('#ruler');
const statusEl=document.querySelector('#status'); const timeEl=document.querySelector('#timecode'); const playhead=document.querySelector('#playhead');

for(let i=0;i<=120;i+=12){const t=document.createElement('div');t.className='tick';t.style.left=`${i*10}px`;t.textContent=i; ruler.appendChild(t)}
function clonePose(){return parts.map(p=>({id:p.id,x:p.x,y:p.y,sx:p.sx,sy:p.sy,rot:p.rot}))}
function applyPose(pose){for(const saved of pose){const p=parts.find(x=>x.id===saved.id); if(p) Object.assign(p,saved)}}
function addKeyframe(frame=state.frame){state.frames[frame]=clonePose(); renderTimeline(); updateStatus();}
addKeyframe(0);

function renderLayers(){layersEl.innerHTML='';parts.slice().sort((a,b)=>b.z-a.z).forEach(p=>{const row=document.createElement('div');row.className='layer'+(state.selected===p.id?' selected':'');row.innerHTML=`<span class="eye">◉</span><span class="dot"></span><span>${p.name}</span>`;row.onclick=()=>{state.selected=p.id;renderLayers();syncInspector()};layersEl.appendChild(row)})}
function renderTrackNames(){trackNames.innerHTML=parts.slice().sort((a,b)=>b.z-a.z).map(p=>`<div class="track-name">${p.name}</div>`).join('')}
function renderTimeline(){trackRows.innerHTML='';parts.slice().sort((a,b)=>b.z-a.z).forEach(p=>{const row=document.createElement('div');row.className='track-row';Object.keys(state.frames).forEach(f=>{const pose=state.frames[f];if(pose.some(x=>x.id===p.id)){const k=document.createElement('div');k.className='kf';k.style.left=`${Number(f)*10-5}px`;k.title=`${p.name} · ${f}`;k.onclick=()=>{state.frame=Number(f);applyPose(state.frames[state.frame]);syncInspector();updateUI()};row.appendChild(k)}});trackRows.appendChild(row)});playhead.style.left=`${state.frame*10}px`;}
function updateStatus(){statusEl.textContent=`فريم ${state.frame} · ${state.playing?'تشغيل':'جاهز'}`;timeEl.textContent=`${String(Math.floor(state.frame/state.fps)).padStart(2,'0')}:${String(Math.floor((state.frame%state.fps)/state.fps*60)).padStart(2,'0')} / 05:00`}
function syncInspector(){const p=parts.find(x=>x.id===state.selected);document.querySelector('#selectedName').textContent=p.name;document.querySelector('#xInp').value=Math.round(p.x);document.querySelector('#yInp').value=Math.round(p.y);document.querySelector('#rInp').value=Math.round(p.rot*180/Math.PI);document.querySelector('#sInp').value=p.sx.toFixed(2)}
function updateUI(){renderTimeline();updateStatus();render();syncInspector()}
function setPart(id,patch){const p=parts.find(x=>x.id===id);Object.assign(p,patch);syncInspector();render()}
for(const id of ['xInp','yInp','rInp','sInp'])document.querySelector('#'+id).addEventListener('input',e=>{const v=Number(e.target.value),p=parts.find(x=>x.id===state.selected);if(id==='xInp')p.x=v;if(id==='yInp')p.y=v;if(id==='rInp')p.rot=v*Math.PI/180;if(id==='sInp')p.sx=p.sy=v;render()});

document.querySelector('#newFrameBtn').onclick=()=>addKeyframe(state.frame);
document.querySelector('#recordBtn').onclick=()=>{addKeyframe(state.frame);document.querySelector('#recordBtn').classList.toggle('active');};
document.querySelector('#resetBtn').onclick=()=>{applyPose(state.frames[0]);updateUI()};
document.querySelector('#selectTool').onclick=()=>{};
document.querySelector('#firstBtn').onclick=()=>{state.frame=0;if(state.frames[0])applyPose(state.frames[0]);updateUI()};
document.querySelector('#lastBtn').onclick=()=>{state.frame=state.total;if(state.frames[state.total])applyPose(state.frames[state.total]);updateUI()};
document.querySelector('#prevBtn').onclick=()=>{state.frame=Math.max(0,state.frame-1);if(state.frames[state.frame])applyPose(state.frames[state.frame]);updateUI()};
document.querySelector('#nextBtn').onclick=()=>{state.frame=Math.min(state.total,state.frame+1);if(state.frames[state.frame])applyPose(state.frames[state.frame]);updateUI()};
document.querySelector('#playBtn').onclick=()=>{state.playing=!state.playing;document.querySelector('#playBtn').textContent=state.playing?'❚❚':'▶';updateStatus()};
document.querySelector('#saveBtn').onclick=()=>{const blob=new Blob([JSON.stringify({fps:state.fps,total:state.total,frames:state.frames},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='puppet-project.json';a.click();URL.revokeObjectURL(a.href)};
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r'){applyPose(state.frames[0]);updateUI()} if(e.code==='Space'){e.preventDefault();document.querySelector('#playBtn').click()}})

let drag=null;
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)*canvas.width/r.width;const y=(e.clientY-r.top)*canvas.height/r.height;const hit=hitTest(x,y);if(hit){state.selected=hit;renderLayers();drag={x,y,part:parts.find(p=>p.id===hit),startX:parts.find(p=>p.id===hit).x,startY:parts.find(p=>p.id===hit).y,startRot:parts.find(p=>p.id===hit).rot};canvas.setPointerCapture(e.pointerId);}});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)*canvas.width/r.width;const y=(e.clientY-r.top)*canvas.height/r.height;const p=drag.part;const dx=x-drag.x,dy=y-drag.y;p.x=drag.startX+dx;p.y=drag.startY+dy;if(e.shiftKey){p.rot=drag.startRot+Math.atan2(dy,dx)}else{p.rot=drag.startRot+Math.atan2(dy,dx)*0.45}syncInspector();render()});
canvas.addEventListener('pointerup',()=>{if(drag){addKeyframe(state.frame);drag=null}});
function hitTest(x,y){for(const p of parts.slice().sort((a,b)=>b.z-a.z)){if(Math.abs(x-p.x)<115*p.sx && Math.abs(y-p.y)<155*p.sy)return p.id}return null}
function drawPart(p){const img=images[p.id];if(!img.complete)return;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.scale(p.sx,p.sy);ctx.translate(-p.px,-p.py);ctx.drawImage(img,0,0);ctx.restore();}
function render(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(0,0);for(const p of parts.slice().sort((a,b)=>a.z-b.z))drawPart(p);ctx.restore();const s=parts.find(p=>p.id===state.selected);if(s){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);ctx.strokeStyle='rgba(137,169,255,.8)';ctx.setLineDash([6,5]);ctx.strokeRect(-90,-130,180,260);ctx.restore()}}
function tick(){if(state.playing){state.frame++;if(state.frame>state.total)state.frame=0;if(state.frames[state.frame])applyPose(state.frames[state.frame]);renderTimeline();updateStatus();render();}requestAnimationFrame(tick)}
renderLayers();renderTrackNames();syncInspector();updateStatus();render();tick();
