import type {House} from './sim';
import type {Patch,Prop,Region} from './world';
import {inBuilding} from './building-layout';
import type {Solid} from './collision';
export type Foliage={x:number;y:number;kind:number;size:number};
export function landscape(cx:number,cy:number,district:string,homes:House[],patches:Patch[],props:Prop[],random:()=>number){
 const ox=cx*46,oy=cy*46,foliage:Foliage[]=[],barriers:Solid[]=[];
 const free=(x:number,y:number,pad=.5)=>x>ox+.8&&x<ox+45.2&&y>oy+.8&&y<oy+45.2&&!homes.some(h=>inBuilding(h,x,y,pad))&&!patches.some(p=>['road','path','parking','water'].includes(p.kind)&&x>p.x-pad&&x<p.x+p.w+pad&&y>p.y-pad&&y<p.y+p.h+pad)&&!props.some(p=>Math.hypot(p.x-x,p.y-y)<1.5);
 const plant=(x:number,y:number,kind:number,size=1)=>{if(free(x,y,.4)&&!foliage.some(f=>Math.hypot(f.x-x,f.y-y)<.65))foliage.push({x,y,kind,size});};
 const patch=(x:number,y:number,w:number,h:number,kind:Patch['kind'])=>patches.push({x:ox+x,y:oy+y,w,h,kind});
 const row=(x:number,y:number,n:number,dx:number,dy:number,kind:number,size=1)=>{for(let i=0;i<n;i++)plant(ox+x+i*dx,oy+y+i*dy,kind,size);};
 if(district==='Memorial park'){
  // Two connected green spaces beside the high street, with clear walking axes.
  patch(14,2,29,16,'lawn');patch(14,28,16,15,'lawn');
  patch(14,9,29,1.6,'path');patch(27,2,1.6,17,'path');patch(20,28,1.6,16,'path');patch(14,35,16,1.6,'path');
  props.push({x:ox+27.8,y:oy+9.8,kind:'fountain'},{x:ox+18,y:oy+7,kind:'bench'},{x:ox+37,y:oy+12.5,kind:'bench'},{x:ox+18,y:oy+32,kind:'bench'});
  row(15,3,17,1.65,0,1,.8);row(15,17,17,1.65,0,1,.8);
  for(const [x,y,kind] of [[18,5,5],[34,5,2],[17,13,3],[34,13,5],[24,31,2],[24,39,3]]){patch(x,y,3.5,1.3,'garden');row(x+.4,y+.65,3,1.2,0,kind,.8);}
 }
 for(const h of homes){
  if(h.kind==='hospital'){
   patch(h.x-ox+9,h.y-oy+1,h.w-18,h.d-10,'lawn');
   patch(h.x-ox+13,h.y-oy+1,1.6,h.d-10,'path');
   for(let y=h.y+2;y<h.y+h.d-9;y+=3){plant(h.x+10.5,y,2,.85);plant(h.x+h.w-10.5,y,5,.8);}
   props.push({x:h.x+11,y:h.y+h.d-11,kind:'bench'});
  }else if(h.kind==='prison'){
   patch(h.x-ox+7.1,h.y-oy+6.1,h.w-14.2,h.d-13.2,'parking');
   props.push({x:h.x+9,y:h.y+8,kind:'bench'},{x:h.x+h.w-9,y:h.y+8,kind:'bench'});
  }else if(!h.layout&&['cottage','ranch','colonial','townhouse','lodge'].includes(h.kind||'')){
   const wild=random()<.35;
   for(let x=h.x+.5;x<h.x+h.w;x+=1.4){plant(x,h.y-1.1,wild?0:5,.6+random()*.35);if(Math.abs(x-h.x-h.w/2)>1.6)plant(x,h.y+h.d+1.2,wild?3:2,.65);}
   for(let y=h.y+1;y<h.y+h.d-1;y+=1.7)plant(h.x+h.w+1.1,y,wild?4:1,.7);
  }
 }
 if(district==='Military base'||district==='Correctional complex'){
  // Deliberate street-facing access gap; never fence across a road.
  const add=(x:number,y:number,w:number,d:number)=>barriers.push({x:ox+x,y:oy+y,w,d,height:2.3,kind:'security-fence'});
  add(12.2,.8,32.5,.15);if(district==='Military base'){add(44.5,.8,.15,18);add(44.5,27,.15,16.7);}else add(44.5,.8,.15,43);add(12.2,43.7,32.5,.15);
  if(district==='Military base'){add(12.2,.8,.15,18);add(12.2,27,.15,16.7);}else{add(12.2,.8,.15,34);add(12.2,41.8,.15,2);}
 }
 // Wild plants form patches of undergrowth; planted borders use orderly rows.
 const rural=district==='Woodland reserve'||district==='Farm country',clusters=rural?15:8;
 for(let n=0;n<clusters;n++){const x=ox+random()*46,y=oy+random()*46,kind=random()<.45?0:random()<.6?4:3;
  for(let j=0;j<(rural?9:4);j++)plant(x+(random()-.5)*7,y+(random()-.5)*7,kind,.5+random()*.75);
 }
 // Soften road verges without putting shrubs in traffic lanes.
 for(const p of patches.filter(p=>p.kind==='road')){if(p.w>p.h)for(let x=p.x+2;x<p.x+p.w;x+=3.8)plant(x,p.y+p.h+1.3,3,.55);}
 return {foliage,barriers};
}
