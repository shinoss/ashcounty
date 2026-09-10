import * as T from 'three';
import type {House} from './sim';
import {box} from './models3d';
import {perimeter,footprint,type Footprint} from './building-layout';
import {furniture} from './collision';
import {furnish} from './room-furniture';
import {finishes,varietyMaterial} from './variety-art';
import {FLOOR_HEIGHT,STAIR_WIDTH,STAIR_LENGTH,stairPoint} from './stairs';
function subtract(a:Footprint,b:Footprint):Footprint[]{
 const l=Math.max(a.x,b.x),r=Math.min(a.x+a.w,b.x+b.w),t=Math.max(a.y,b.y),z=Math.min(a.y+a.d,b.y+b.d);if(l>=r||t>=z)return [a];
 return [{x:a.x,y:a.y,w:a.w,d:t-a.y},{x:a.x,y:z,w:a.w,d:a.y+a.d-z},{x:a.x,y:t,w:l-a.x,d:z-t},{x:r,y:t,w:a.x+a.w-r,d:z-t}].filter(b=>b.w>0&&b.d>0);
}
export function institutionModel(h:House){
 const group=new T.Group();group.position.set(h.x,0,h.y);group.userData.contextHouse=h;group.userData.solidOccluder=true;
 const finish=finishes(h),front=new T.Group(),side=new T.Group(),roof=new T.Group(),upper=new T.Group(),door=new T.Group();group.add(front,side,roof,upper,door);
 const mat=(tile:number,rx=1,ry=1)=>varietyMaterial('districts',tile,rx,ry);
 const mesh=(parent:T.Object3D,size:number[],at:number[],tile:number)=>{const o=box(parent,size,at,'#9a9e92');o.material=mat(tile,Math.max(.2,size[0]/3),Math.max(.2,size[1]/2.5));return o;};
 const shell=(parent:T.Group,level:number,cut=false)=>{
  for(const e of perimeter(h)){
   const portal=h.layout?.openings?.find(o=>e.horizontal&&o.y===e.y&&o.x>=e.x&&o.x<=e.x+e.length);
   const entry=!!portal||e.horizontal&&e.y===h.d&&e.x<=h.w/2&&e.x+e.length>=h.w/2,center=portal?.x??h.w/2,half=(portal?.width??1.2)/2;
   const target=cut&&e.front?front:parent;
   const segment=(start:number,length:number,height=2.5,base=0)=>{if(length<=0)return;const o=mesh(target,e.horizontal?[length,height,.15]:[.15,height,length],e.horizontal?[start+length/2,base+height/2+.08,e.y]:[e.x,base+height/2+.08,start+length/2],finish.outside);if(cut&&target===parent)o.userData.roomWall=true;};
   if(entry){segment(e.x,center-half-e.x);segment(center+half,e.x+e.length-center-half);segment(center-half,half*2,.48,2.02);}
   else segment(e.horizontal?e.x:e.y,e.length);
   for(let t=1.4;t<e.length-.8;t+=3.4){const at=(e.horizontal?e.x:e.y)+t;if(entry&&Math.abs(at-h.w/2)<1.5)continue;
    const window=mesh(target,e.horizontal?[1,.8,.18]:[.18,.8,1],e.horizontal?[at,1.5,e.y]:[e.x,1.5,at],h.kind==='prison'?7:4);
    if(cut)window.userData.interior=false;
   }
  }
  if(level>0){parent.position.y=level*FLOOR_HEIGHT;}
 };
 shell(group,0,true);
 door.position.set(h.w/2-.6,0,h.d);door.userData.house=h;
 mesh(door,[1.2,1.95,.12],[.6,1.025,0],h.kind==='prison'?7:h.kind==='barracks'||h.kind==='armory'?2:4);
 box(door,[.04,.15,.08],[1.08,1,.1],'#c4c8ba');
 const ground:T.Object3D[]=group.children.filter(o=>![front,side,roof,upper,door].includes(o as T.Group));
 const interior=(parent:T.Group,floor:number)=>{
  let parts=footprint(h);if(floor>0){const down=stairPoint(h,floor-1),hole={x:down.x-h.x-STAIR_WIDTH/2-.08,y:down.y-h.y-STAIR_LENGTH-.08,w:STAIR_WIDTH+.16,d:STAIR_LENGTH+.24};parts=parts.flatMap(p=>subtract(p,hole));}
  for(const p of parts){const o=mesh(parent,[p.w,.1,p.d],[p.x+p.w/2,.05,p.y+p.d/2],finish.floor);o.material=mat(finish.floor,p.w/3,p.d/3);o.userData.interior=true;}
  for(const p of h.layout!.partitions){const o=mesh(parent,[p.w,1.05,p.d],[p.x+p.w/2,.57,p.y+p.d/2],h.kind==='prison'?7:finish.inside);o.userData.interior=true;}
  for(const b of furniture(h,floor,true)){const obj=furnish(parent,h,b);obj.userData.interior=true;obj.userData.furnitureId=b.id;obj.userData.furnitureFloor=floor;}
 };
 const before=group.children.length;interior(group,0);ground.push(...group.children.slice(before));
 const levels:T.Group[]=[],stairs:T.Group[]=[];
 for(let floor=0;floor<(h.floors||1);floor++){
  let parent=group;
  if(floor>0){const room=new T.Group();room.position.y=floor*FLOOR_HEIGHT;room.userData.upperFloor=floor;room.visible=false;group.add(room);levels.push(room);parent=room;
   for(const source of ground.filter(o=>!o.userData.interior)){const clone=source.clone(true);if(clone instanceof T.Mesh&&clone.userData.roomWall)clone.material=mat(finish.inside);room.add(clone);}interior(room,floor);
   const exterior=new T.Group();upper.add(exterior);shell(exterior,floor);
  }
  const flight=new T.Group();parent.add(flight);stairs.push(flight);
  for(const base of [floor-1,floor])if(base>=0&&base<(h.floors||1)-1){const at=stairPoint(h,base);for(let i=0;i<12;i++)mesh(flight,[STAIR_WIDTH,.16,STAIR_LENGTH/12+.02],[at.x-h.x,(base-floor)*FLOOR_HEIGHT+(i+.5)*FLOOR_HEIGHT/12,at.y-h.y-(i+.5)*STAIR_LENGTH/12],8);}
 }
 for(const p of footprint(h)){mesh(roof,[p.w+.18,.22,p.d+.18],[p.x+p.w/2,(h.floors||1)*FLOOR_HEIGHT+.08,p.y+p.d/2],finish.roof);}
 // Parapets, roof vents and an entrance canopy make large institutions legible at a distance.
 for(const e of perimeter(h))mesh(roof,e.horizontal?[e.length,.28,.18]:[.18,.28,e.length],[e.x+(e.horizontal?e.length/2:0),(h.floors||1)*FLOOR_HEIGHT+.27,e.y+(e.horizontal?0:e.length/2)],finish.outside);
 for(const p of footprint(h).slice(0,3))mesh(roof,[1.2,.65,1.1],[p.x+p.w/2,(h.floors||1)*FLOOR_HEIGHT+.55,p.y+p.d/2],3);
 mesh(upper,[5,.18,1.6],[h.w/2,2.55,h.d+.7],finish.outside);
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=80;const c=canvas.getContext('2d')!;c.fillStyle=h.kind==='hospital'?'#34666e':h.kind==='supermarket'?'#416d3e':h.kind==='prison'?'#50565d':'#4c5438';c.fillRect(0,0,768,80);c.fillStyle='#f2ead5';c.font='bold 36px monospace';c.textAlign='center';c.fillText(h.name.toUpperCase(),384,52,740);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.magFilter=T.NearestFilter;
 const sign=box(upper,[Math.min(13,h.w-1),.75,.1],[h.w/2,2.55,h.d+.16],'#ffffff');sign.material=new T.MeshLambertMaterial({map});sign.userData.ownedTexture=map;
 const empty=()=>{const a=new T.Group();group.add(a);return a;};
 const barricades=empty();for(const y of [.7,1.15,1.6])mesh(barricades,[1.5,.14,.1],[h.w/2,y,h.d+.13],2);
 Object.assign(group.userData,{ground,levels,stairs,upper,barricades,curtains:empty(),rearWindow:empty(),rearBoards:empty()});
 return {group,front,side,roof,door};
}
