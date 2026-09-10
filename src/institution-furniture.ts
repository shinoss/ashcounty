import type {House} from './sim';
import type {Solid} from './collision';
/** Furniture lives in named rooms, leaving 2m+ connecting corridors clear. */
export function institutionFurniture(h:House):Solid[]{
 const items:Solid[]=[];const add=(x:number,y:number,w:number,d:number,height:number,kind:string)=>items.push({x:h.x+x,y:h.y+y,w,d,height,kind});
 for(const r of h.layout!.rooms){const x=r.x,y=r.y;
  if(r.use==='shop'){
   for(let sx=x+3;sx<x+r.w-3;sx+=3.4)add(sx,y+1,.85,Math.max(2,r.d-5),1.5,'shelf');
   for(let sx=x+2;sx<x+r.w-4;sx+=6)if(Math.abs(sx+.8-h.w/2)>1.8)add(sx,y+r.d-2.1,1.6,.75,.95,'checkout');
   add(x+.4,y+1.2,1.2,2.2,.7,'produce');
  }else if(r.use==='stock'||r.use==='armory'){
   for(let sx=x+1;sx<x+r.w-1.4;sx+=2)add(sx,y+.3,1.2,.65,1.7,r.use==='armory'?'locker':'shelf');
   if(r.use==='stock')add(x+.2,y+1.7,.7,.7,1.85,'fridge');
   if(r.use==='armory')add(x+.3,y+r.d-1.5,2,.7,1,'toolchest');
  }else if(r.use==='ward'){
   const left=r.x===0;
   for(let sy=y+1;sy<y+r.d-2;sy+=5){add(left?x+.8:x+r.w-2.1,sy,1.2,2.2,.65,'hospitalbed');add(left?x+2.5:x+r.w-3.2,sy+.2,.7,.55,1.25,'medicine');}
  }else if(r.use==='cell'){
   const left=x===0;for(let sy=y+.8;sy<y+r.d-2;sy+=4){add(left?x+.6:x+r.w-1.7,sy,1.1,2,.65,'prisonbed');add(left?x+2.1:x+r.w-3,sy,.65,.5,.9,'basin');}
  }else if(r.use==='barracks'){
   for(let sy=y+1;sy<y+r.d-2;sy+=3.4)for(const sx of [x+.6,x+r.w-2])add(sx,sy,1.2,2.2,1.65,'bunk');
   add(x+r.w/2-.5,y+.3,1,.6,1.8,'locker');
  }else if(r.use==='mess'){
   for(let sx=x+1.3;sx<x+r.w-3;sx+=4)add(sx,y+1.2,2.4,1,.8,'table');add(x+.2,y+r.d-1,2,.7,.95,'counter');
  }else{
   add(x+1,y+1,3,.8,1,'desk');add(x+1,y+r.d-1.8,2.4,.8,.8,'sofa');
   if(r.use==='reception')add(x+r.w-5,y+.5,1.3,.6,1.7,'medicine');else add(x+r.w-5,y+.3,1,.65,1.7,'locker');
  }
 }
 return items;
}
