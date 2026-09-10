import {perimeter} from './building-layout';
import {institutionFurniture} from './institution-furniture';
import {STAIR_CLEARANCE} from './stairs.js';
import type {Region,VehicleState} from './world.js';
import type {House} from './sim.js';
export type Solid={id?:string;x:number;y:number;w:number;d:number;height:number;kind:string};
export function furniture(h:House,floor=0,includeRemoved=false):Solid[]{
 if(h.layout)return institutionFurniture(h).filter(b=>!((h.floors||1)>1&&b.x+b.w>h.x+h.w-STAIR_CLEARANCE&&b.y+b.d>h.y+h.d-3.2)).map(b=>({...b,id:b.kind+':'+b.x+':'+b.y})).filter(b=>includeRemoved||!h.removedFurniture?.[floor+':'+b.id]);
 const at=(x:number,y:number,w:number,d:number,height:number,kind:string):Solid=>({x:h.x+x,y:h.y+y,w,d,height,kind});
 const home=['cottage','ranch','colonial','townhouse','apartments','motel','lodge'].includes(h.kind||'cottage'),design=h.design||0;
 const base:Solid[]=[at(.15,1.30,.70,.70,1.91,'fridge')];
 if(home||h.kind==='diner'||h.kind==='gas')base.push(at(.5,.24,Math.min(h.w-1,4.5),.7,.95,'counter'));
 if(home){base.push(at(1.3,h.d/2,2,.8,.85,'sofa'));base.push(at(.2,h.d-1.1,.8,.5,1.0,'tv'));if(h.w>=7)base.push(at(h.w/2,1.5,1.2,1.9,.65,'bed'));else base.push(at(1.2,2.1,1.2,.8,.85,'table'));if(design%2)base.push(at(.2,2.5,.6,1,1.6,'cabinet'));}
 if(['library','school','grocery','hardware','pharmacy','gunshop'].includes(h.kind||'')){for(let x=2.2;x<h.w-1.6;x+=2.4)base.push(at(x,.7,.65,Math.max(1,h.d-4),1.8,h.kind==='grocery'?'shelf':h.kind==='pharmacy'?'medicine':h.kind==='hardware'?'toolchest':'bookshelf'));base.push(at(1.3,h.d-2,1.8,.8,.9,'desk'));}
 if(h.kind==='police'){for(let x=1.3;x<h.w-2;x+=2.5)base.push(at(x,2,1.7,.9,.9,'desk'));base.push(at(.2,h.d-2,.7,1.2,1.8,'locker'));base.push(at(1,.3,2,.5,1.6,'cabinet'));}
 if(h.kind==='clinic'){for(const x of [1.3,h.w-2])base.push(at(x,1,1.1,2,.65,'bed'));base.push(at(.2,h.d-2,.65,1.2,1.6,'medicine'));}
 if(h.kind==='garage'||h.kind==='warehouse'){base.push(at(1.5,2,2,3,.45,'worklift'));base.push(at(h.w-2,1.5,1,1,1.5,'toolchest'));base.push(at(1,.2,2,.6,1.6,'locker'));}
 if(h.kind==='diner'){for(const x of [1.1,h.w-2.1]){base.push(at(x,h.d-1.5,1.1,.8,.8,'booth'));base.push(at(x,h.d-2.7,1.1,.7,.85,'table'));}}
 if(h.kind==='church'){for(let y=2.5;y<h.d-1.5;y+=1.5)for(const x of [.8,h.w/2+.65])base.push(at(x,y,h.w/2-1.5,.5,.85,'pew'));}
 if(['bank','postoffice','townhall','firestation'].includes(h.kind||'')){for(let x=1.6;x<h.w-2;x+=2.5)base.push(at(x,2,1.7,.8,.9,'desk'));base.push(at(.2,h.d-2,.7,1.2,1.8,'locker'));}
 if(h.kind==='laundromat'){for(let x=1.3;x<h.w-1.5;x+=1.2)base.push(at(x,.3,.9,.9,1,'washer'));base.push(at(1,h.d-2.1,2,.8,.85,'table'));}
 if(h.kind==='pub'||h.kind==='bakery'){base.push(at(1,.25,h.w-2,.8,1,'counter'));for(let x=1.2;x<h.w-2;x+=2.5){base.push(at(x,h.d-2.4,1.2,.8,.85,'table'));base.push(at(x,h.d-1.2,1.2,.6,.8,'booth'));}}
 if(h.kind==='townhall'||h.kind==='bank')for(const x of [1,h.w-1])base.push(at(x-.15,h.d+.45,.3,.3,2.5,'post'));
 if(h.kind==='gas')for(const x of [.235,h.w-.365])base.push(at(x,h.d+2.435,.13,.13,2.5,'post'));
 if(h.kind==='library'||h.kind==='police')for(const x of [h.w/2-1.265,h.w/2+1.035])base.push(at(x,h.d+.235,.23,.23,2.3,'post'));
 const layout=(h.floors||1)>1?base.filter(b=>!(b.x+b.w>h.x+h.w-STAIR_CLEARANCE&&b.y+b.d>h.y+h.d-3.2)):base;
 return layout.map(b=>({...b,id:b.kind+':'+b.x+':'+b.y})).filter(b=>includeRemoved||!h.removedFurniture?.[floor+':'+b.id]);
}
export function regionSolids(r:Region):Solid[]{return [
 ...(r.barriers||[]),
 ...(r.foliage||[]).filter(f=>f.kind===1).map(f=>({x:f.x-.4*f.size,y:f.y-.26*f.size,w:.8*f.size,d:.52*f.size,height:.7*f.size,kind:'hedge'})),
 ...r.houses.flatMap(h=>furniture(h)),
 ...r.patches.filter(p=>p.kind==='water').map(p=>({x:p.x,y:p.y,w:p.w,d:p.h,height:.05,kind:'water'})),
 ...r.trees.map(t=>({x:t.x-.22,y:t.y-.22,w:.44,d:.44,height:3.5,kind:'tree'})),
 ...r.crates.filter(c=>!c.fridge&&!c.furnitureId&&!(c.floor||0)).map(c=>({x:c.x-.375,y:c.y-.325,w:.75,d:.65,height:.69,kind:'crate'})),
 ...r.props.map(p=>{const w=p.kind==='fountain'?3.5:p.kind==='bench'?1.8:p.kind==='grave'?.55:p.kind==='sign'||p.kind==='lamp'?.3:.65,d=p.kind==='fountain'?3.5:p.kind==='bench'?.6:p.kind==='grave'?.18:p.kind==='sign'||p.kind==='lamp'?.3:.65;return {x:p.x-w/2,y:p.y-d/2,w,d,height:p.kind==='lamp'?4:p.kind==='sign'?1.8:.85,kind:p.kind};})];}
export function walls(h:House):Solid[]{if(h.layout){const out:Solid[]=[],add=(x:number,y:number,w:number,d:number)=>out.push({x:h.x+x,y:h.y+y,w,d,height:2.7,kind:'wall'});
 for(const edge of perimeter(h)){
  const portal=h.layout.openings?.find(o=>edge.horizontal&&o.y===edge.y&&o.x>=edge.x&&o.x<=edge.x+edge.length);
  if(edge.horizontal&&(portal||edge.y===h.d&&h.door&&edge.x<=h.w/2&&edge.x+edge.length>=h.w/2)){
   const center=portal?.x??h.w/2,half=(portal?.width??1.2)/2,lo=center-half,hi=center+half;if(lo>edge.x)add(edge.x,edge.y-.075,lo-edge.x,.15);if(hi<edge.x+edge.length)add(hi,edge.y-.075,edge.x+edge.length-hi,.15);
  }else add(edge.x-.075,edge.y-.075,edge.horizontal?edge.length+.15:.15,edge.horizontal?.15:edge.length+.15);
 }
 for(const b of h.layout.partitions)add(b.x,b.y,b.w,b.d);
 return out;
 }const s=(x:number,y:number,w:number,d:number):Solid=>({x,y,w,d,height:2.7,kind:'wall'});const result=[s(h.x-.075,h.y,.15,h.d),s(h.x+h.w-.075,h.y,.15,h.d)];if(h.windowBroken)result.push(s(h.x-.075,h.y-.075,h.w/2-.425,.15),s(h.x+h.w/2+.5,h.y-.075,h.w/2-.425,.15));else result.push(s(h.x-.075,h.y-.075,h.w+.15,.15));if(h.door){result.push(s(h.x,h.y+h.d-.075,h.w/2-.4,.15),s(h.x+h.w/2+.4,h.y+h.d-.075,h.w/2-.4,.15));}else result.push(s(h.x,h.y+h.d-.075,h.w,.15));return result;}
export function pointIn(s:Solid,x:number,y:number,r=0){return x>s.x-r&&x<s.x+s.w+r&&y>s.y-r&&y<s.y+s.d+r;}
export function carContains(v:VehicleState,x:number,y:number,padding=0){const dx=x-v.x,dy=y-v.y,c=Math.cos(v.angle),s=Math.sin(v.angle);return Math.abs(dx*c+dy*s)<1.6+padding&&Math.abs(-dx*s+dy*c)<.75+padding;}
export function carOverlap(v:VehicleState,b:Solid){const c=Math.cos(v.angle),s=Math.sin(v.angle),dx=b.x+b.w/2-v.x,dy=b.y+b.d/2-v.y;return Math.abs(dx)<Math.abs(c)*1.6+Math.abs(s)*.75+b.w/2&&Math.abs(dy)<Math.abs(s)*1.6+Math.abs(c)*.75+b.d/2&&Math.abs(dx*c+dy*s)<1.6+Math.abs(c)*b.w/2+Math.abs(s)*b.d/2&&Math.abs(-dx*s+dy*c)<.75+Math.abs(s)*b.w/2+Math.abs(c)*b.d/2;}
export function rayBox(x:number,y:number,dx:number,dy:number,b:Solid){let near=0,far=Infinity;for(const [p,v,lo,hi]of [[x,dx,b.x,b.x+b.w],[y,dy,b.y,b.y+b.d]]){if(Math.abs(v)<1e-9){if(p<lo||p>hi)return Infinity;continue;}const a=(lo-p)/v,c=(hi-p)/v;near=Math.max(near,Math.min(a,c));far=Math.min(far,Math.max(a,c));}return far>=near?near:Infinity;}
export class SolidIndex{
 buckets=new Map<string,Solid[]>();
 constructor(public all:Solid[]){for(const s of all)for(let x=Math.floor(s.x/4);x<=Math.floor((s.x+s.w)/4);x++)for(let y=Math.floor(s.y/4);y<=Math.floor((s.y+s.d)/4);y++){const key=x+','+y;const list=this.buckets.get(key)||[];list.push(s);this.buckets.set(key,list);}}
 near(x:number,y:number,r=2){const result=new Set<Solid>();for(let i=Math.floor((x-r)/4);i<=Math.floor((x+r)/4);i++)for(let j=Math.floor((y-r)/4);j<=Math.floor((y+r)/4);j++)for(const b of this.buckets.get(i+','+j)||[])result.add(b);return result;}
}
