import type {Patch} from './world';
import {houses,SIZE,type House} from './sim';
export const TW=64,TH=32,OX=SIZE*32+140,OY=120;
export const iso=(x:number,y:number)=>({x:OX+(x-y)*32,y:OY+(x+y)*16});
type C=CanvasRenderingContext2D;
export function canvas(w:number,h:number){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
let seed=3291;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function poly(c:C,p:number[][],fill:string,stroke?:string){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function line(c:C,x:number,y:number,x2:number,y2:number,color:string,w=1){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
function tile(c:C,x:number,y:number,color:string){const p=iso(x,y);poly(c,[[p.x,p.y],[p.x+32,p.y+16],[p.x,p.y+32],[p.x-32,p.y+16]],color);}
export function ground(localHouses:House[]=houses,worldSeed=3291,patches:Patch[]=[]){seed=worldSeed;const a=canvas(OX*2,SIZE*32+300),c=a.getContext('2d')!;
 for(let x=0;x<SIZE;x++)for(let y=0;y<SIZE;y++){const patch=patches.find(p=>x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h);const road=patch?.kind==='road'||y>=21&&y<=24||x>=8&&x<=10;const pavement=y===20||y===25||x===7||x===11;const t=rnd();tile(c,x,y,patch&&patch.kind!=='road'?({parking:'#75796b',field:(x%2?'#756643':'#948256'),water:'#456e68',path:'#9a9575'}[patch.kind]):road?['#545852','#565a54','#585b55'][Math.floor(t*3)]:pavement?['#929386','#8d8e81','#969689'][Math.floor(t*3)]:['#596345','#5b6647','#606b4b','#566143','#5e6747'][Math.floor(t*5)]);const p=iso(x,y);if(!road&&!pavement&&!patch){for(let k=0;k<13;k++){const u=rnd(),v=rnd(),sx=p.x+(u-v)*32,sy=p.y+(u+v)*16;line(c,sx,sy,sx+1,sy-2-rnd()*3,rnd()>.5?'#6d7751':'#4e5c40');}}if(patch?.kind==='parking'&&x%3===0&&y%4<3)line(c,p.x-20,p.y+10,p.x+10,p.y+25,'#c9c5a3',2);if(patch?.kind==='water'&&rnd()<.4)line(c,p.x-10,p.y+16,p.x+8,p.y+16,'#8baa9160');if(pavement&&!patch){line(c,p.x,p.y,p.x+32,p.y+16,'#666f604f');line(c,p.x+32,p.y+16,p.x,p.y+32,'#666f604f');}if(road&&rnd()<.22){line(c,p.x-13,p.y+13,p.x+7,p.y+19,'#424740');line(c,p.x+7,p.y+19,p.x+13,p.y+16,'#424740');}}
 for(let x=0;x<SIZE;x+=2){const p=iso(x,23);line(c,p.x,p.y,p.x+30,p.y+15,'#b4ad7b',2);const q=iso(x,22.82);line(c,q.x,q.y,q.x+30,q.y+15,'#aaa476',1);}
 for(const h of localHouses){for(let x=h.x-.5;x<h.x+h.w+.5;x+=.5)for(let y=h.y-.5;y<h.y+h.d+.5;y+=.5){const p=iso(x,y);poly(c,[[p.x,p.y],[p.x+16,p.y+8],[p.x,p.y+16],[p.x-16,p.y+8]],'#7b7a60');}const end=h.y<21?20:26;const door=h.x+h.w/2;const y0=Math.min(h.y+h.d,end),y1=Math.max(h.y+h.d,end);for(let y=y0;y<y1;y+=.5){const p=iso(door-.65,y);poly(c,[[p.x,p.y],[p.x+42,p.y+21],[p.x+26,p.y+29],[p.x-16,p.y+8]],'#a4a08c','#8c8b78');}}
 // Weathered painted street lettering follows the road.
 const p=iso(26,24.4);c.save();c.translate(p.x,p.y);c.transform(.894,.447,-.894,.447,0,0);c.font='bold 20px monospace';c.fillStyle='#bab79880';c.fillText('WREN  ST',0,0);c.restore();
 for(let i=0;i<1300;i++){const p=iso(rnd()*SIZE,rnd()*SIZE);c.fillStyle=['#9b8653','#767046','#a29459','#3e4b36'][Math.floor(rnd()*4)];c.fillRect(p.x,p.y,2+rnd()*3,1+rnd()*2);}const reduced=canvas(Math.ceil(a.width/2),Math.ceil(a.height/2));reduced.getContext('2d')!.drawImage(a,0,0,reduced.width,reduced.height);return reduced;}
export function house(h:House,inside=false){const a=canvas(440,330),c=a.getContext('2d')!,o={x:218,y:93};const p=(x:number,y:number,z=0)=>[o.x+(x-y)*32,o.y+(x+y)*16-z];const box=(x:number,y:number,w:number,d:number,z:number,col:string)=>{poly(c,[p(x,y),p(x+w,y),p(x+w,y+d),p(x,y+d)],col);poly(c,[p(x,y,z),p(x+w,y,z),p(x+w,y+d,z),p(x,y+d,z)],col);poly(c,[p(x+w,y,z),p(x+w,y+d,z),p(x+w,y+d)],'#00000030');};
 poly(c,[p(.3,.3),p(h.w+1.6,.3),p(h.w+1.6,h.d+1),p(.3,h.d+1)],'#202a2470');
 const w=h.w,d=h.d,H=65;
 poly(c,[p(0,0),p(w,0),p(w,d),p(0,d)],'#97846a');
 if(inside){for(let y=0;y<d;y+=.28){const q=p(0,y),r=p(w,y);line(c,q[0],q[1],r[0],r[1],'#675e4c',1);}poly(c,[p(0,0,H),p(w,0,H),p(w,0),p(0,0)],'#bcb49b');poly(c,[p(0,0,H),p(0,d,H),p(0,d),p(0,0)],'#918e79');
 // Furniture: couch, patterned rug, table, kitchen counter, bed.
 poly(c,[p(1.4,2.2),p(3.6,2.2),p(3.6,4.1),p(1.4,4.1)],'#777157','#948469');
 box(.3,.6,.7,2.2,20,'#647b6e');box(.3,.6,.25,2.2,33,'#77897a');box(2,.4,2.6,.6,27,'#cdc7ad');box(3.6,1.2,1,1.9,14,'#b1aa8c');box(3.6,1.2,1,.4,19,'#d4cbb0');box(2,2.8,.85,.7,18,'#755c43');box(2.25,2.9,.2,.18,24,'#c6bb8c');box(.4,4.3,.6,.5,22,'#7b694b');
 const q=p(w/2,d);line(c,q[0]-17,q[1]-8,q[0]+17,q[1]+8,'#bbaa80',4);return a;}
 // Side and front walls.
 poly(c,[p(w,0,H),p(w,d,H),p(w,d),p(w,0)],'#777c6c');poly(c,[p(0,d,H),p(w,d,H),p(w,d),p(0,d)],h.color);
 for(let z=6;z<H;z+=7){let l=p(0,d,z),r=p(w,d,z);line(c,l[0],l[1],r[0],r[1],'#353e3030');l=p(w,0,z);r=p(w,d,z);line(c,l[0],l[1],r[0],r[1],'#2f372c50');}
 function window(x:number,y:number,side:boolean){const p1=side?p(x,y,44):p(x,y,44),p2=side?p(x,y+.8,44):p(x+.8,y,44),p3=side?p(x,y+.8,20):p(x+.8,y,20),p4=p(x,y,20);poly(c,[p1,p2,p3,p4],'#303c36','#d1c9ad');line(c,(p1[0]+p2[0])/2,(p1[1]+p2[1])/2,(p3[0]+p4[0])/2,(p3[1]+p4[1])/2,'#aeae96',2);line(c,(p1[0]+p4[0])/2,(p1[1]+p4[1])/2,(p2[0]+p3[0])/2,(p2[1]+p3[1])/2,'#aeae96',2);poly(c,[p1,[p1[0]+6,p1[1]+5],[p4[0]+6,p4[1]+2],p4],'#a5a99260');}
 window(.55,d,false);window(w-1.3,d,false);window(w,.7,true);window(w,d-1.5,true);
 const dx=w/2-.38;poly(c,[p(dx,d,43),p(dx+.76,d,43),p(dx+.76,d),p(dx,d)],h.door?'#27342b':'#5d695d','#b7ae93');if(!h.door){const k=p(dx+.59,d,20);c.fillStyle='#c3b68c';c.fillRect(k[0],k[1],2,3);}
 poly(c,[p(dx-.3,d,1),p(dx+1.1,d,1),p(dx+1.1,d+.45,1),p(dx-.3,d+.45,1)],'#afaa92','#666d5c');
 if(h.style==='shop'||h.style==='warehouse'){poly(c,[p(-.15,-.15,H+3),p(w+.15,-.15,H+3),p(w+.15,d+.15,H+3),p(-.15,d+.15,H+3)],h.style==='shop'?'#8a8e7b':'#737e75','#c1bea2');for(let y=.5;y<d;y+=.6){const a=p(0,y,H+4),b=p(w,y,H+4);line(c,a[0],a[1],b[0],b[1],'#45574766');}const vent=p(w*.6,d*.4,H+4);c.fillStyle='#52665b';c.fillRect(vent[0]-12,vent[1]-14,24,14);c.fillStyle='#9ba897';c.fillRect(vent[0]-12,vent[1]-17,24,4);const label=p(.2,d,52);c.save();c.translate(label[0],label[1]);c.transform(1,.5,0,1,0,0);c.fillStyle=h.style==='shop'?'#436c59':'#85694e';c.fillRect(0,-10,w*27,14);c.fillStyle='#e2d7ac';c.font='bold 9px monospace';c.fillText(h.style==='shop'?'ASH COUNTY MARKET':'STORAGE & SUPPLY',5,0);c.restore();return a;}
 // Pitched roof with individual shingle rows.
 const ridge=d/2;poly(c,[p(-.25,-.28,H),p(w+.25,-.28,H),p(w+.25,ridge,H+42),p(-.25,ridge,H+42)],'#777368','#2c382d');poly(c,[p(-.25,ridge,H+42),p(w+.25,ridge,H+42),p(w+.25,d+.3,H),p(-.25,d+.3,H)],h.roof,'#333e31');poly(c,[p(w+.25,-.28,H),p(w+.25,ridge,H+42),p(w+.25,d+.3,H)],'#96927d','#575e50');
 for(let t=0;t<1;t+=.11){const yy=ridge+(d+.3-ridge)*t,zz=H+42*(1-t);const l=p(-.25,yy,zz),r=p(w+.25,yy,zz);line(c,l[0],l[1],r[0],r[1],'#202c2765');for(let xx=-.25+(Math.round(t*10)%2)*.27;xx<w;xx+=.55){const q=p(xx,yy,zz),v=p(xx,yy+.22,zz-3.5);line(c,q[0],q[1],v[0],v[1],'#a19b7b25');}}
 const l=p(-.3,ridge,H+43),r=p(w+.3,ridge,H+43);line(c,l[0],l[1],r[0],r[1],'#aaa48a',2);
 const ch=p(w-1,1.6,H+25);poly(c,[[ch[0],ch[1]],[ch[0]+13,ch[1]+6],[ch[0]+13,ch[1]-26],[ch[0],ch[1]-32]],'#8b7861');poly(c,[[ch[0]+13,ch[1]+6],[ch[0]+23,ch[1]],[ch[0]+23,ch[1]-32],[ch[0]+13,ch[1]-26]],'#6d6856');poly(c,[[ch[0],ch[1]-32],[ch[0]+10,ch[1]-38],[ch[0]+23,ch[1]-32],[ch[0]+13,ch[1]-26]],'#b5a58b');
 return a;}
export function tree(variant:number){const a=canvas(150,190),c=a.getContext('2d')!;c.fillStyle='#29372860';c.beginPath();c.ellipse(82,171,57,16,-.15,0,Math.PI*2);c.fill();poly(c,[[71,169],[80,169],[77,100],[72,100]],'#615b43');line(c,74,135,50,109,'#615b43',4);line(c,76,124,100,100,'#615b43',3);const colors=variant===1?['#79774a','#8c8750','#a39459','#b1a366','#6b6c41']:variant===2?['#7e6740','#958049','#ae9354','#c3a361','#716541']:['#4a5c3e','#586c47','#6c7b4e','#7c8957','#3e5239'];for(let i=0;i<110;i++){const angle=rnd()*Math.PI*2,r=Math.sqrt(rnd()),x=75+Math.cos(angle)*r*53,y=84+Math.sin(angle)*r*64;c.fillStyle=colors[Math.floor(rnd()*5)];c.beginPath();c.ellipse(x,y,8+rnd()*15,7+rnd()*12,0,0,Math.PI*2);c.fill();}for(let i=0;i<170;i++){c.fillStyle=colors[Math.floor(rnd()*5)];const angle=rnd()*Math.PI*2,r=Math.sqrt(rnd());c.fillRect(75+Math.cos(angle)*r*55,83+Math.sin(angle)*r*62,2+rnd()*5,2+rnd()*3);}return a;}
export function car(color:string){const a=canvas(160,130),c=a.getContext('2d')!;poly(c,[[18,75],[57,56],[145,97],[106,120]],'#1c282660');for(const [x,y]of [[39,78],[105,112],[129,96],[65,65]]){c.fillStyle='#272d29';c.beginPath();c.ellipse(x,y,7,11,-.4,0,Math.PI*2);c.fill();c.fillStyle='#70786a';c.fillRect(x-2,y-3,4,6);}poly(c,[[21,65],[57,47],[139,86],[105,105]],color,'#394438');poly(c,[[21,65],[105,105],[105,116],[21,76]],'#5b66594f','#394438');poly(c,[[105,105],[139,86],[139,98],[105,116]],'#424d45');poly(c,[[47,62],[69,42],[103,58],[110,91]],color,'#3f4b42');poly(c,[[47,62],[54,43],[76,31],[69,42]],'#3b4a46');poly(c,[[54,43],[76,31],[109,47],[86,60]],color,'#505b50');poly(c,[[86,60],[109,47],[119,76],[110,91]],'#394f4e','#929c84');poly(c,[[49,64],[56,46],[83,61],[88,83]],'#405552','#929c84');line(c,69,55,73,75,'#8b9582',2);line(c,89,85,88,100,'#39483e');c.fillStyle='#c9c4a0';c.fillRect(112,102,7,3);c.fillStyle='#9b5e49';c.fillRect(24,70,5,4);return a;}
export function person(zombie:boolean,frame:number){const a=canvas(64,88),c=a.getContext('2d')!;c.fillStyle='#16281f70';c.beginPath();c.ellipse(33,78,14,5,0,0,Math.PI*2);c.fill();const step=Math.sin(frame*Math.PI/2)*5;line(c,29,59,27+step,77,zombie?'#424a42':'#343e3e',6);line(c,36,59,38-step,76,zombie?'#4e5146':'#43504b',6);line(c,25+step,78,30+step,78,'#252d28',4);line(c,36-step,77,42-step,77,'#252d28',4);poly(c,[[25,36],[36,34],[42,57],[35,64],[26,59]],zombie?'#817d60':'#697a70','#364b3e');if(!zombie){poly(c,[[22,39],[30,37],[33,55],[24,56]],'#534e3b','#8a8060');line(c,34,38,36,53,'#ada488',2);}line(c,37,39,43+step*.5,zombie?45:52,zombie?'#87856a':'#758478',6);line(c,43+step*.5,zombie?45:52,49,zombie?43:56,zombie?'#a2a083':'#c2ad8e',4);if(!zombie)line(c,47,58,58,33,'#948263',4);line(c,26,39,21-step*.4,53,zombie?'#7f7f65':'#6f8074',5);c.fillStyle=zombie?'#999b7a':'#bca588';c.beginPath();c.ellipse(31,28,7,9,-.12,0,Math.PI*2);c.fill();poly(c,[[24,24],[24,20],[32,18],[38,22],[38,27],[32,23]],zombie?'#5a5b46':'#413f33');if(zombie){line(c,31,42,34,55,'#70473b',3);c.fillStyle='#4a4f37';c.fillRect(35,28,2,2);}return a;}
export function fence(){const a=canvas(76,76),c=a.getContext('2d')!;for(let i=0;i<6;i++){const x=8+i*10,y=38+i*5;poly(c,[[x,y],[x+4,y+2],[x+4,y-23],[x+2,y-27],[x,y-25]],'#9a9478','#706f58');}line(c,8,22,62,49,'#b0a589',3);line(c,8,32,62,59,'#8b896d',3);return a;}
export function lamp(){const a=canvas(100,170),c=a.getContext('2d')!;line(c,50,153,50,28,'#424e43',4);line(c,50,28,73,17,'#424e43',4);line(c,73,17,80,22,'#424e43',4);poly(c,[[70,24],[83,17],[90,22],[77,29]],'#b7b09a');c.fillStyle='#d6caa066';c.beginPath();c.ellipse(78,25,10,5,0,0,Math.PI*2);c.fill();return a;}
export function mailbox(){const a=canvas(52,60),c=a.getContext('2d')!;line(c,27,54,27,24,'#7e7b5d',3);poly(c,[[15,23],[26,17],[39,23],[28,30]],'#a6a691');poly(c,[[15,23],[28,30],[28,39],[15,32]],'#747e6e');poly(c,[[28,30],[39,23],[39,32],[28,39]],'#525f53');line(c,33,24,33,16,'#b16c54',2);return a;}

export type SurvivorAction='idle'|'walk'|'run'|'sneak'|'attack'|'hurt';
export const SURVIVOR_ACTIONS:SurvivorAction[]=['idle','walk','run','sneak','attack','hurt'];
// Every pose shares a fixed ground anchor at (48, 100).
export function survivor(action:SurvivorAction,frame:number,back:boolean,weapon:'bat'|'rifle'='bat',aiming=false,aimAngle=0,target?:HTMLCanvasElement){
 const a=target??canvas(96,112),c=a.getContext('2d')!,phase=frame/8*Math.PI*2;c.clearRect(0,0,96,112);
 const moving=['walk','run','sneak'].includes(action),running=action==='run',sneaking=action==='sneak';
 const stride=moving?Math.sin(phase)*(running?12:sneaking?5:8):0;
 const lift=moving?Math.abs(Math.cos(phase))*(running?3:1.5):0;
 const breath=action==='idle'?Math.sin(phase)*1.2:0;
 const progress=frame/7, swing=action==='attack'&&weapon==='bat';
 const lunge=swing?Math.sin(progress*Math.PI)*5:0;
 const lean=running?5:sneaking?7:action==='hurt'?-4:lunge;
 const hip={x:47+lean*.3,y:78+(sneaking?5:0)-lift};
 const shoulder={x:47+lean,y:54+(sneaking?10:0)-lift+breath};
 const head={x:shoulder.x+1,y:shoulder.y-12};
 c.lineCap='round';c.lineJoin='round';c.fillStyle='#16281f66';c.beginPath();c.ellipse(48,101,running?17:14,5,0,0,Math.PI*2);c.fill();
 const limb=(points:number[][],color:string,width:number)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 const leg=(side:number,far:boolean)=>{const step=stride*side;const footX=48+side*4+step;const footY=99-Math.max(0,-Math.cos(phase)*side)*(moving?running?8:4:0);limb([[hip.x+side*3,hip.y],[hip.x+side*4+step*.55,hip.y+11],[footX,footY]],far?'#35413e':'#48564e',6);limb([[footX-2,footY+1],[footX+4,footY+1]],'#252d28',4);};
 leg(-1,true);
 const rifle=(x:number,y:number,angle:number)=>{c.save();c.translate(x,y);c.rotate(angle);poly(c,[[-16,-3],[-6,-2],[-6,3],[-17,5]],'#796044','#b19970');c.fillStyle='#34413d';c.fillRect(-7,-3,22,5);c.fillStyle='#a2aba0';c.fillRect(14,-2,15,2);c.fillStyle='#2b3532';c.fillRect(2,2,4,6);c.fillRect(-2,-6,8,2);c.restore();};
 if(weapon==='bat')rifle(shoulder.x-12,shoulder.y+12,-1.4);
 const armSwing=moving?-stride*.7:Math.sin(phase)*.7;
 limb([[shoulder.x-5,shoulder.y+3],[shoulder.x-9-armSwing*.5,shoulder.y+13],[shoulder.x-8-armSwing,shoulder.y+23]],'#5c7064',5);
 c.fillStyle='#bca88a';c.beginPath();c.arc(shoulder.x-8-armSwing,shoulder.y+24,2.5,0,Math.PI*2);c.fill();
 leg(1,false);
 poly(c,[[shoulder.x-6,shoulder.y],[shoulder.x+6,shoulder.y-1],[hip.x+8,hip.y-2],[hip.x+3,hip.y+4],[hip.x-7,hip.y]],'#708577','#394e42');
 line(c,shoulder.x+3,shoulder.y+3,hip.x+4,hip.y-3,'#9eaa8a',1.5);
 if(back){poly(c,[[shoulder.x-7,shoulder.y+3],[shoulder.x+5,shoulder.y+2],[hip.x+5,hip.y-2],[hip.x-8,hip.y-2]],'#685f45','#9a8c64');line(c,shoulder.x-5,shoulder.y+13,shoulder.x+5,shoulder.y+13,'#a09168',1.5);}else{poly(c,[[shoulder.x-9,shoulder.y+3],[shoulder.x-4,shoulder.y+1],[hip.x-3,hip.y-2],[hip.x-9,hip.y-3]],'#61573e','#978768');}
 if(weapon==='bat'&&back)rifle(shoulder.x-4,shoulder.y+13,-1.15);
 let handX=shoulder.x+11+armSwing*.7,handY=shoulder.y+22;
 let batAngle=-1.1+(moving?stride*.025:0);
 if(swing){const ease=progress<.25?progress/.25:(progress-.25)/.75;batAngle=progress<.25?-1.1-ease*1.3:-2.4+Math.sin(ease*Math.PI/2)*3.5;handX=shoulder.x+8+Math.sin(progress*Math.PI)*7;handY=shoulder.y+13-Math.sin(progress*Math.PI)*5;}
 if(action==='hurt'){handX=shoulder.x+6;handY=shoulder.y+13;batAngle=-.7;}
 if(weapon==='rifle'){const angle=aiming?aimAngle:.45;handX=shoulder.x+8;handY=shoulder.y+(aiming?7:18);limb([[shoulder.x-4,shoulder.y+4],[shoulder.x-4,shoulder.y+17],[handX+Math.cos(angle)*9,handY+Math.sin(angle)*9]],'#718577',5);rifle(handX,handY,angle);}
 limb([[shoulder.x+5,shoulder.y+3],[shoulder.x+10+armSwing*.3,shoulder.y+12],[handX,handY]],'#809181',5);
 c.fillStyle='#c5ae8e';c.beginPath();c.arc(handX,handY,3,0,Math.PI*2);c.fill();
 if(weapon==='bat'){const tipX=handX+Math.cos(batAngle)*29,tipY=handY+Math.sin(batAngle)*29;
 line(c,handX-Math.cos(batAngle)*4,handY-Math.sin(batAngle)*4,tipX,tipY,'#786449',4);
 line(c,handX+Math.cos(batAngle)*12,handY+Math.sin(batAngle)*12,tipX,tipY,'#b49a6a',6);
 line(c,handX+Math.cos(batAngle)*13,handY+Math.sin(batAngle)*13,tipX,tipY,'#c9b17e',1);}
 c.fillStyle='#c1a98a';c.beginPath();c.ellipse(head.x,head.y,6.5,8,-.1,0,Math.PI*2);c.fill();
 poly(c,[[head.x-7,head.y-2],[head.x-6,head.y-8],[head.x+1,head.y-10],[head.x+7,head.y-5],[head.x+6,head.y+(back?5:-1)],[head.x,head.y+(back?4:-6)]],'#444336');
 if(!back){line(c,head.x+5,head.y,head.x+7,head.y+2,'#b59878',2);c.fillStyle='#484838';c.fillRect(head.x+3,head.y-1,1.5,1.5);}
 return a;
}

export function storageCrate(empty=false){const a=canvas(86,78),c=a.getContext('2d')!;
 poly(c,[[6,54],[44,35],[83,55],[45,76]],'#18271b65');
 poly(c,[[8,31],[43,13],[78,31],[43,50]],empty?'#454839':'#9a8860','#b3a47a');
 poly(c,[[8,31],[43,50],[43,72],[8,53]],'#7a6846','#b2a078');
 poly(c,[[43,50],[78,31],[78,53],[43,72]],'#5c563b','#a69a6c');
 for(let i=1;i<4;i++){line(c,8,31+i*5,43,50+i*5,'#4c4a33',1);line(c,43,50+i*5,78,31+i*5,'#393e2b',1);}
 for(const x of [13,34]){poly(c,[[x,34+(x-8)*.54],[x+4,36+(x-8)*.54],[x+4,57+(x-8)*.54],[x,55+(x-8)*.54]],'#a4976c');}
 line(c,50,49,69,58,'#a49568',4);line(c,49,64,70,36,'#998961',3);
 if(!empty){line(c,17,27,53,45,'#665b3e',2);line(c,29,21,65,39,'#665b3e',2);poly(c,[[33,30],[43,25],[54,31],[43,37]],'#ccc49b');line(c,40,29,47,33,'#655e43',2);}else poly(c,[[17,31],[43,19],[69,32],[43,44]],'#252f22','#746e4c');
 return a;}

export function undead(action:'idle'|'walk'|'attack'|'hurt',frame:number){const a=canvas(80,112),c=a.getContext('2d')!,phase=frame/16*Math.PI*2,walk=action==='walk',hurt=action==='hurt',attack=action==='attack';const stride=walk?Math.sin(phase)*8:0,bob=walk?Math.abs(Math.sin(phase))*2:Math.sin(phase)*.7,lean=hurt?-7*Math.sin(frame/15*Math.PI):attack?6*Math.sin(frame/15*Math.PI):3;
 c.lineCap='round';c.lineJoin='round';c.fillStyle='#14201955';c.beginPath();c.ellipse(40,100,14,5,0,0,Math.PI*2);c.fill();
 const limb=(points:number[][],color:string,w:number)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 for(const side of [-1,1]){const foot=40+side*4+stride*side;limb([[40+side*3,77-bob],[40+side*3+stride*side*.5,87-bob],[foot,99-Math.max(0,-Math.cos(phase)*side)*(walk?5:0)]],side<0?'#3c453a':'#505345',6);limb([[foot-2,100],[foot+4,100]],'#292e26',4);}
 poly(c,[[32+lean,52-bob],[45+lean,50-bob],[49,76-bob],[43,82-bob],[33,77-bob]],'#7b7f5d','#46523e');line(c,39+lean,56-bob,43,75-bob,'#765145',3);const reach=attack?12*Math.sin(frame/15*Math.PI):hurt?-7:3;limb([[33+lean,55-bob],[25+lean,65-bob],[25+lean+reach,74-bob-stride*.2]],'#81866b',5);limb([[44+lean,55-bob],[51+lean,63-bob],[56+lean+reach,59-bob+stride*.3]],'#949577',5);c.fillStyle='#9da182';c.beginPath();c.ellipse(39+lean,42-bob,7,9,.18,0,Math.PI*2);c.fill();poly(c,[[32+lean,39-bob],[33+lean,33-bob],[41+lean,31-bob],[46+lean,37-bob],[41+lean,36-bob]],'#535945');c.fillStyle='#424b35';c.fillRect(43+lean,41-bob,2,2);return a;}
export function scenery(kind:string){const a=canvas(90,100),c=a.getContext('2d')!;c.fillStyle='#26372455';c.beginPath();c.ellipse(44,88,30,9,0,0,Math.PI*2);c.fill();if(kind==='grave'){poly(c,[[30,83],[51,91],[62,84],[41,77]],'#777e6a');poly(c,[[35,80],[53,85],[53,52],[48,45],[39,46],[35,52]],'#9aa08a','#5c6b58');line(c,43,53,43,69,'#566453',2);line(c,39,58,48,61,'#566453',2);}else if(kind==='bench'){line(c,20,70,20,88,'#454e39',4);line(c,68,86,68,95,'#454e39',4);poly(c,[[15,65],[34,56],[77,78],[58,87]],'#937d55');poly(c,[[15,65],[15,48],[58,70],[58,87]],'#a18c60','#64583e');}else if(kind==='hay'){poly(c,[[20,62],[45,49],[73,65],[47,78]],'#c0a55e');poly(c,[[20,62],[47,78],[47,91],[20,76]],'#9e8246');poly(c,[[47,78],[73,65],[73,78],[47,91]],'#84713d');line(c,30,57,58,72,'#d4bb78',3);}else if(kind==='pump'){c.fillStyle='#787558';c.fillRect(28,47,25,39);c.fillStyle='#b3ae8e';c.fillRect(26,30,29,28);c.fillStyle='#374b43';c.fillRect(30,35,20,13);line(c,57,39,65,74,'#2c372d',4);line(c,65,74,54,66,'#2c372d',4);}else if(kind==='barrel'){c.fillStyle='#7e6345';c.fillRect(28,48,28,35);c.beginPath();c.ellipse(42,48,14,7,0,0,Math.PI*2);c.fill();line(c,28,58,56,58,'#a29b76',3);line(c,28,76,56,76,'#a29b76',3);}else{line(c,43,40,43,89,'#7c8062',4);c.fillStyle='#49614c';c.fillRect(10,27,66,24);c.strokeStyle='#b4bc99';c.strokeRect(10,27,66,24);c.fillStyle='#d5d4af';c.font='9px monospace';c.fillText('ASH COUNTY',15,42);}return a;}
export function driveCar(angle:number){const a=canvas(200,160),c=a.getContext('2d')!;const p=(f:number,r:number,z=0)=>{const x=f*Math.cos(angle)-r*Math.sin(angle),y=f*Math.sin(angle)+r*Math.cos(angle);return [100+(x-y)*25,96+(x+y)*12.5-z];};poly(c,[p(-1.7,-.85),p(1.7,-.85),p(1.7,.85),p(-1.7,.85)],'#17271b66');for(const f of [-1,1])for(const r of [-.7,.7]){const q=p(f,r);c.fillStyle='#202b24';c.beginPath();c.ellipse(q[0],q[1]-3,7,9,0,0,Math.PI*2);c.fill();}const corners=[[-1.5,-.7],[1.5,-.7],[1.5,.7],[-1.5,.7]];for(let i=0;i<4;i++){const [f,r]=corners[i],[f2,r2]=corners[(i+1)%4];poly(c,[p(f,r,17),p(f2,r2,17),p(f2,r2,3),p(f,r,3)],i%2?'#667b6e':'#809384','#354a3b');}poly(c,corners.map(([f,r])=>p(f,r,17)),'#a6b5a0','#596e59');poly(c,[p(-.8,-.6,17),p(.65,-.6,17),p(.25,-.5,36),p(-.55,-.5,36)],'#49695f','#b4c0aa');poly(c,[p(.65,-.6,17),p(.65,.6,17),p(.25,.5,36),p(.25,-.5,36)],'#567a71','#c0cbb3');poly(c,[p(-.8,.6,17),p(.65,.6,17),p(.25,.5,36),p(-.55,.5,36)],'#537468','#b4c0aa');poly(c,[p(-.55,-.5,36),p(.25,-.5,36),p(.25,.5,36),p(-.55,.5,36)],'#b2bd9f');for(const r of [-.48,.48]){const q=p(1.5,r,12);c.fillStyle='#e3dbab';c.fillRect(q[0]-3,q[1]-2,6,4);}return a;}
