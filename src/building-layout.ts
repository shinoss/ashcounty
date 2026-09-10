import type {House} from './sim';
export type Footprint={x:number;y:number;w:number;d:number};
export type Room=Footprint&{name:string;use:'shop'|'stock'|'ward'|'reception'|'cell'|'mess'|'barracks'|'armory'|'office'};
export type Partition=Footprint;
export type BuildingLayout={parts:Footprint[];rooms:Room[];partitions:Partition[];openings?:{x:number;y:number;width:number}[]};
export function footprint(h:House):Footprint[]{return h.layout?.parts||[{x:0,y:0,w:h.w,d:h.d}];}
export function inBuilding(h:House,x:number,y:number,pad=0){return footprint(h).some(b=>x>h.x+b.x-pad&&x<h.x+b.x+b.w+pad&&y>h.y+b.y-pad&&y<h.y+b.y+b.d+pad);}
export type Edge={x:number;y:number;length:number;horizontal:boolean;front:boolean};
const edgeCache=new WeakMap<House,Edge[]>();
/** The exterior of a union of rectangular wings, with no walls between joined wings. */
export function perimeter(h:House){let cached=edgeCache.get(h);if(cached)return cached;
 const parts=footprint(h),xs=[...new Set(parts.flatMap(b=>[b.x,b.x+b.w]))].sort((a,b)=>a-b),ys=[...new Set(parts.flatMap(b=>[b.y,b.y+b.d]))].sort((a,b)=>a-b),edges:Edge[]=[];
 const filled=(i:number,j:number)=>i>=0&&i<xs.length-1&&j>=0&&j<ys.length-1&&inBuilding(h,h.x+(xs[i]+xs[i+1])/2,h.y+(ys[j]+ys[j+1])/2);
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++)if(filled(i,j)){
  if(!filled(i,j-1))edges.push({x:xs[i],y:ys[j],length:xs[i+1]-xs[i],horizontal:true,front:false});
  if(!filled(i,j+1))edges.push({x:xs[i],y:ys[j+1],length:xs[i+1]-xs[i],horizontal:true,front:true});
  if(!filled(i-1,j))edges.push({x:xs[i],y:ys[j],length:ys[j+1]-ys[j],horizontal:false,front:false});
  if(!filled(i+1,j))edges.push({x:xs[i+1],y:ys[j],length:ys[j+1]-ys[j],horizontal:false,front:true});
 }
 edgeCache.set(h,edges);return edges;
}
export function layoutFor(kind:string,w:number,d:number):BuildingLayout|undefined{
 const parts:Footprint[]=[],rooms:Room[]=[],partitions:Partition[]=[];
 const part=(x:number,y:number,w:number,d:number)=>parts.push({x,y,w,d});
 const room=(name:string,use:Room['use'],x:number,y:number,w:number,d:number)=>rooms.push({name,use,x,y,w,d});
 // Partitions stop short of corridors; every room opens onto a broad central aisle.
 const divider=(x:number,y:number,w:number,d:number)=>partitions.push({x,y,w,d});
 if(kind==='supermarket'){
  part(0,0,10,d);part(10,5,w-10,d-5);
  room('Stockroom','stock',0,0,10,5);room('Market hall','shop',0,5,w,d-5);
  divider(.2,5,3,.12);divider(6,5,3.9,.12);
 }else if(kind==='hospital'){
  part(0,0,8,d-8);part(w-8,0,8,d-8);part(0,d-8,w,8);
  room('West wards','ward',0,0,8,d-8);room('East wards','ward',w-8,0,8,d-8);room('Reception','reception',0,d-8,w,8);
  for(let y=5;y<d-9;y+=5){divider(.1,y,5.5,.12);divider(w-5.6,y,5.5,.12);}
 }else if(kind==='prison'){
  part(0,0,w,6);part(0,6,7,d-13);part(w-7,6,7,d-13);part(0,d-7,w,7);
  room('Administration','office',0,d-7,w,7);room('Mess hall','mess',0,0,w,6);room('West cells','cell',0,6,7,d-13);room('East cells','cell',w-7,6,7,d-13);
  for(let y=10;y<d-8;y+=4){divider(.1,y,4.5,.12);divider(w-4.6,y,4.5,.12);}
 }else if(kind==='barracks'){
  part(0,0,w*.6,d-6);part(0,d-6,w,6);
  room('Sleeping quarters','barracks',0,0,w*.6,d-6);room('Mess and duty desk','mess',0,d-6,w,6);
 }else if(kind==='armory'){
  part(0,0,w,d);room('Equipment stores','armory',0,0,w,d-5);room('Issue desk','office',0,d-5,w,5);
  divider(.1,d-5,w/2-1.3,.12);divider(w/2+1.3,d-5,w/2-1.4,.12);
 }else return undefined;
 return {parts,rooms,partitions,openings:kind==='prison'?[{x:w/2,y:d-7,width:1.8}]:[]};
}
