import type {Patch} from './world';
import {houses,SIZE,type House} from './sim';
import {canvas,sheets,drawFit,loadSprites} from './sprite-assets';
export {canvas,loadSprites};
export const TW=64,TH=32,OX=SIZE*32+140,OY=120;
export const iso=(x:number,y:number)=>({x:OX+(x-y)*32,y:OY+(x+y)*16});
type C=CanvasRenderingContext2D;type P=[number,number];
function poly(c:C,p:P[],fill:string){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();}
function line(c:C,a:P,b:P,color:string,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
// Map raster material onto a world-space parallelogram. This preserves exact
// building footprints and door openings used by the simulation.
function surface(c:C,id:number,a:P,b:P,d:P,u=1,v=1,shade=0){const s=sheets.materials[id];c.save();c.transform((b[0]-a[0])/(u*64),(b[1]-a[1])/(u*64),(d[0]-a[0])/(v*64),(d[1]-a[1])/(v*64),a[0],a[1]);const tex=materialTiles[id]??=(()=>{const t=canvas(64,64);const tc=t.getContext('2d')!;tc.filter=id===0?'brightness(1.45) saturate(1.15)':id===1?'brightness(1.12)':'none';tc.drawImage(s,0,0,64,64);return t;})();c.fillStyle=c.createPattern(tex,'repeat')!;c.fillRect(0,0,u*64+.2,v*64+.2);if(shade){c.fillStyle=`rgba(0,0,0,${shade})`;c.fillRect(0,0,u*64,v*64);}c.restore();}
const materialTiles:HTMLCanvasElement[]=[],groundTiles=new Map<string,HTMLCanvasElement>();
function terrainTile(id:number,variant:number){const key=id+':'+variant;let t=groundTiles.get(key);if(t)return t;t=canvas(66,34);const c=t.getContext('2d')!;surface(c,id,[33,0],[65,16],[1,16]);if(variant){poly(c,[[33,0],[65,16],[33,32],[1,16]],variant===1?'#00000009':'#adb8ab0b');}groundTiles.set(key,t);return t;}
export function ground(localHouses:House[]=houses,worldSeed=3291,patches:Patch[]=[]){const a=canvas(OX*2,SIZE*32+300),c=a.getContext('2d')!;
 for(let x=0;x<SIZE;x++)for(let y=0;y<SIZE;y++){const patch=patches.find(p=>x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h),road=patch?.kind==='road'||y>=21&&y<=24||x>=8&&x<=10,pavement=y===20||y===25||x===7||x===11;const id=patch?{road:1,parking:1,field:3,water:4,path:5}[patch.kind]:road?1:pavement?2:0,p=iso(x,y);c.drawImage(terrainTile(id,Math.abs((x*79+y*37+worldSeed)%3)),p.x-33,p.y);if(patch?.kind==='parking'&&x%3===0&&y%4<3)line(c,[p.x-20,p.y+10],[p.x+10,p.y+25],'#b5b5a0',2);}
 for(let x=0;x<SIZE;x+=2){const p=iso(x,23);line(c,[p.x,p.y],[p.x+30,p.y+15],'#b9b293',2);}
 for(const h of localHouses){const end=h.y<21?20:26,y0=Math.min(h.y+h.d,end),y1=Math.max(h.y+h.d,end);for(let y=y0;y<y1;y++){const p=iso(h.x+h.w/2-.5,y);c.drawImage(terrainTile(2,0),p.x-33,p.y);}}
 const reduced=canvas(a.width/2,a.height/2);reduced.getContext('2d')!.drawImage(a,0,0,reduced.width,reduced.height);return reduced;}
export function house(h:House,inside=false){const a=canvas(440,330),c=a.getContext('2d')!,p=(x:number,y:number,z=0):P=>[218+(x-y)*32,93+(x+y)*16-z],w=h.w,d=h.d,H=72;
 const wall=(a:P,b:P,d:P,u:number,v:number,shade=0)=>surface(c,h.style==='warehouse'?11:h.style==='barn'?7:8,a,b,d,u,v,shade);
 surface(c,inside?6:2,p(0,0),p(w,0),p(0,d),w,d);
 const decal=(id:number,x:number,y:number,z:number,width:number,height:number,side=false)=>{const at=p(x,y,z),s=sheets.furniture[id];c.save();c.translate(...at);c.transform(side?-1:1,.5,0,1,0,0);c.drawImage(s,0,0,width,height);c.restore();};
 if(inside){surface(c,9,p(0,0,H),p(w,0,H),p(0,0),w,H/64);surface(c,9,p(0,0,H),p(0,d,H),p(0,0),d,H/64,.14);decal(8,.35,0,58,34,34);const furniture=(id:number,x:number,y:number,ww:number,hh:number)=>{const at=p(x,y);drawFit(c,sheets.furniture[id],at[0],at[1],ww,hh);};
 furniture(3,w-.65,.65,34,64);furniture(0,1.05,.75,53,39);furniture(1,2.25,.75,53,41);furniture(2,3.25,.8,34,42);furniture(6,.7,2.5,65,46);furniture(11,.5,d-.6,27,43);furniture(7,w-.8,2.9,48,55);furniture(4,w/2,d-1.2,45,38);furniture(5,w/2+.6,d-.65,22,32);return a;}
 wall(p(w,0,H),p(w,d,H),p(w,0),d,H/64,.22);
 // Split the front wall around the real doorway rather than painting a door
 // onto an opaque wall. The opening remains aligned with collision geometry.
 const dx=w/2-.4;wall(p(0,d,H),p(dx,d,H),p(0,d),dx,H/64);wall(p(dx+.8,d,H),p(w,d,H),p(dx+.8,d),w-dx-.8,H/64);wall(p(dx,d,H),p(dx+.8,d,H),p(dx,d,48),.8,(H-48)/64);
 if(h.door)poly(c,[p(dx,d,48),p(dx+.8,d,48),p(dx+.8,d),p(dx,d)],'#1e272b');else decal(9,dx,d,48,26,48);
 decal(8,.4,d,55,27,27);decal(8,w-1.25,d,55,27,27);decal(8,w,1.2,55,27,27,true);decal(8,w,d-.65,55,27,27,true);
 if(h.style==='shop'||h.style==='warehouse'){surface(c,11,p(-.12,-.12,H),p(w+.12,-.12,H),p(-.12,d+.12,H),w,d);const at=p(.25,d,62);c.save();c.translate(...at);c.transform(1,.5,0,1,0,0);c.fillStyle='#394d59';c.fillRect(0,0,(w-.5)*32,13);c.font='8px monospace';c.fillStyle='#c4c8bf';c.fillText(h.style==='shop'?'COUNTY MARKET':'STORAGE',4,9);c.restore();}
 else {const ridge=d/2;surface(c,10,p(-.2,-.2,H),p(w+.2,-.2,H),p(-.2,ridge,H+36),w,d/2);surface(c,10,p(-.2,ridge,H+36),p(w+.2,ridge,H+36),p(-.2,d+.2,H),w,d/2,.14);c.save();const g=[p(w+.2,-.2,H),p(w+.2,ridge,H+36),p(w+.2,d+.2,H)];c.beginPath();g.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.clip();surface(c,8,p(w+.2,-.2,H+36),p(w+.2,d+.2,H+36),p(w+.2,-.2,H),d,1,.2);c.restore();}
 return a;}
function prop(id:number,w:number,h:number,bx:number,by:number,maxW:number,maxH:number){const a=canvas(w,h),c=a.getContext('2d')!;drawFit(c,sheets.props[id],bx,by,maxW,maxH);return a;}
export const tree=(variant:number)=>prop(variant%3,150,190,75,171,132,162);
export const fence=()=>prop(5,76,76,38,64,68,58);
export const lamp=()=>prop(6,100,170,50,153,64,148);
export const mailbox=()=>prop(7,52,60,27,54,35,50);
export const storageCrate=(empty=false)=>prop(empty?4:3,86,78,43,70,66,52);
export const scenery=(kind:string)=>prop(({bench:8,grave:9,hay:10,pump:11,sign:12,barrel:13} as Record<string,number>)[kind]??14,90,100,45,88,76,75);
export function driveCar(angle:number){const a=canvas(200,160),c=a.getContext('2d')!,q=Math.round(angle/(Math.PI/4)),i=((q%8)+8)%8,s=sheets.cars[[0,1,2,3,6,5,4,7][i]],scale=150/Math.max(...sheets.cars.map(s=>s.width)),residual=angle-q*Math.PI/4;c.save();c.translate(100,112);c.rotate(residual);c.translate(-100,-112);c.drawImage(s,100-s.width*scale/2,112-s.height*scale,s.width*scale,s.height*scale);c.restore();return a;}
export function car(_color:string){const a=canvas(160,130),c=a.getContext('2d')!;c.drawImage(driveCar(0),-20,-10);return a;}
export type SurvivorAction='idle'|'walk'|'run'|'sneak'|'attack'|'hurt';
export const SURVIVOR_ACTIONS:SurvivorAction[]=['idle','walk','run','sneak','attack','hurt'];
export function survivor(action:SurvivorAction,frame:number,back:boolean,weapon:'bat'|'rifle'='bat',aiming=false,_aimAngle=0,target?:HTMLCanvasElement){const a=target??canvas(96,112),c=a.getContext('2d')!;c.clearRect(0,0,96,112);const locomotion=['walk','run','sneak'].includes(action),phase=locomotion?frame/2:Math.floor(frame/2),f=action==='idle'?0:Math.floor(phase)%4,next=(f+1)%4,blend=locomotion?phase-Math.floor(phase):0;let row=back?1:0,sheet='survivor';if(weapon==='rifle'){sheet='rifle';row=(aiming?2:0)+(back?1:0);}else if(action==='attack')row=2;else if(action==='hurt')row=3;
 const weaponSprite=(id:number,x:number,y:number,angle:number,width:number)=>{const s=sheets.items[id];c.save();c.translate(x,y);c.rotate(angle);c.drawImage(s,-width*.25,-3,width,Math.min(10,width*s.height/s.width));c.restore();};
 if(weapon==='bat'&&!back)weaponSprite(0,38,61,-1.25,38);
 c.save();if(action==='sneak'){c.translate(0,8);c.scale(1,.92);}c.globalAlpha=1-blend;c.drawImage(sheets[sheet][row*4+f],0,0);if(blend>.02){c.globalAlpha=blend;c.drawImage(sheets[sheet][row*4+next],0,0);}c.globalAlpha=1;c.restore();
 if(weapon==='bat'){if(back)weaponSprite(0,43,57,-1.25,38);const attack=action==='attack',positions=attack?[[52,57,-1.8],[45,36,-2.2],[64,59,.1],[59,68,-.8]]:[[55,73,-1.15],[58,72,-1.05],[57,71,-1.2],[55,73,-1.1]];const [x,y,angle]=positions[f];weaponSprite(1,x,y,angle,30);}
 // Tiny breathing shift is omitted: the generated feet remain grounded.
 return a;}
export function undead(action:'idle'|'walk'|'attack'|'hurt',frame:number,back=false){const a=canvas(96,112),row=action==='attack'?2:action==='hurt'?3:back?1:0,f=action==='idle'?0:Math.floor(frame/4)%4;a.getContext('2d')!.drawImage(sheets.zombie[row*4+f],0,0);return a;}

export function effect(index:number){const a=canvas(80,80);a.getContext('2d')!.drawImage(sheets.fx[index],0,0,80,80);return a;}
