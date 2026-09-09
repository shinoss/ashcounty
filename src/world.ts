import {countyContains,countyRoads,countyTerrain,settlementAt} from './county';
import {SUPPLIES,type VehicleKind} from './content';
import {FOODS} from './food.js';
import {furniture,pointIn} from './collision.js';
import {townBuildings} from './town.js';
import type {House,Zombie} from './sim';
import {createCrates,type LootCrate,type LootKind} from './loot.js';
export const CHUNK_SIZE=46;
export type Patch={x:number;y:number;w:number;h:number;kind:"road"|"parking"|"field"|"water"|"path"};
export type Prop={x:number;y:number;kind:"bench"|"grave"|"hay"|"pump"|"sign"|"barrel"|"lamp"};
export type VehicleState={x:number;y:number;id:string;color:'green'|'red'|'blue';angle:number;speed:number;kind?:VehicleKind;condition?:number};
export type Region={district:string;patches:Patch[];props:Prop[];key:string;cx:number;cy:number;seed:number;houses:House[];crates:LootCrate[];zombies:Zombie[];trees:{x:number;y:number;variant:number}[];vehicles:VehicleState[]};
export function randomFor(cx:number,cy:number){let seed=(Math.imul(cx,73856093)^Math.imul(cy,19349663)^47119)>>>0;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export class ProceduralWorld{
 cache=new Map<string,Region>();active:Region[]=[];center='';
 constructor(public starter:House[]){this.ensure(23,24);}
 relocateVehicle(vehicle:VehicleState){const cx=Math.floor(vehicle.x/CHUNK_SIZE),cy=Math.floor(vehicle.y/CHUNK_SIZE),destination=this.region(cx,cy);if(destination.vehicles.includes(vehicle))return;for(const region of this.cache.values()){const index=region.vehicles.indexOf(vehicle);if(index>=0)region.vehicles.splice(index,1);}destination.vehicles.push(vehicle);}
 region(cx:number,cy:number){const key=`${cx},${cy}`;const previous=this.cache.get(key);if(previous)return previous;const r=randomFor(cx,cy),ox=cx*CHUNK_SIZE,oy=cy*CHUNK_SIZE;const origin=cx===0&&cy===0;const colors=['#96917a','#8b9991','#a49a83','#9a8875','#869283'],roofs=['#555851','#60544c','#515951'];
 const settlement=settlementAt(cx,cy),rural=!settlement;
 const district=origin?'Wren residential':settlement?.name==='Wren'?(cx===2&&cy===0?'Civic center':cx===0&&cy===2?'Market district':Math.max(Math.abs(cx),Math.abs(cy))>=2&&r()<.65?['Market district','Civic center','Industrial yard'][Math.floor(r()*3)]:'Garden suburb'):settlement?(Math.hypot(cx-settlement.cx,cy-settlement.cy)<1.1?['Market district','Civic center','Industrial yard'][Math.floor(r()*3)]:'Garden suburb'):Math.sin(cx*.24)+Math.cos(cy*.31)+Math.sin((cx+cy)*.13)>.8?'Farm country':'Woodland reserve';
 const roads=countyRoads(cx,cy),patches:Patch[]=[...countyTerrain(cx,cy,roads),...roads],props:Prop[]=[];const patch=(x:number,y:number,w:number,h:number,kind:Patch['kind'])=>patches.push({x:ox+x,y:oy+y,w,h,kind});const prop=(x:number,y:number,kind:Prop['kind'])=>props.push({x:ox+x,y:oy+y,kind});
 if(district==='Woodland reserve'&&r()<.08){patch(16,30,20,2,'path');for(let i=0;i<4;i++)prop(19+i*5,33,'bench');}
 if(district==='Farm country'&&!patches.some(p=>p.kind==='water')){const fw=15+r()*12,fy=2+r()*4;patch(15,fy,fw,10+r()*5,'field');if(r()<.6)patch(15,29,18+r()*9,10+r()*5,'field');for(let i=0;i<3+Math.floor(r()*6);i++)prop(17+r()*(fw-4),fy+2+r()*6,'hay');}
 if(district==='Market district'){patch(14,4,28,15,'parking');patch(27,25,3,18,'road');patch(11,40,19,3,'road');prop(18,18,'pump');prop(22,18,'pump');prop(33,18,'sign');}
 if(district==='Industrial yard'){patch(14,3,29,16,'parking');for(let i=0;i<12;i++)prop(17+(i%6)*4,5+Math.floor(i/6)*4,'barrel');}
 if(district==='Memorial park'){patch(16,4,24,14,'path');for(let x=18;x<40;x+=4)for(let y=6;y<17;y+=4)prop(x,y,'grave');patch(17,32,23,2,'path');prop(26,35,'bench');}
 const wet=(x:number,y:number,pad=0)=>patches.some(p=>p.kind==='water'&&x>p.x-pad&&x<p.x+p.w+pad&&y>p.y-pad&&y<p.y+p.h+pad);
 const homes=(countyContains(ox+23,oy+23)?townBuildings(district,cx,cy,r,this.starter):[]).filter(h=>!patches.some(p=>p.kind==='water'&&h.x<p.x+p.w+1&&h.x+h.w>p.x-1&&h.y<p.y+p.h+1&&h.y+h.d>p.y-1));
 // Paths reserve clear approaches while lawns fill the space between detached homes.
 if(district==='Garden suburb'||origin)for(const h of homes){
  const center=h.x+h.w/2,localY=h.y-oy;
  if(localY<20)patch(center-ox-.75,localY+h.d,1.5,20-localY-h.d,'path');
  else{patch(h.x-ox-2,26,1.5,localY+h.d-25,'path');patch(h.x-ox-2,localY+h.d+.15,h.w/2+2.75,1,'path');}
 }
 if(rural&&homes.length){patch(9,23,13,1.5,'path');}
 for(let i=props.length-1;i>=0;i--)if(wet(props[i].x,props[i].y,1))props.splice(i,1);
 for(const home of homes)if(home.kind==='gas'){for(const x of [home.x+1.7,home.x+5.7])props.push({x,y:home.y+home.d+1.8,kind:'pump'});}
 if(settlement)for(const road of roads){const horizontal=road.w>road.h,length=horizontal?road.w:road.h;for(let t=7;t<length;t+=18){const x=road.x+(horizontal?t:road.w+1),y=road.y+(horizontal?-1:t);if(!wet(x,y,1)&&!homes.some(h=>x>h.x-.5&&x<h.x+h.w+.5&&y>h.y-.5&&y<h.y+h.d+.5)&&!props.some(p=>Math.hypot(p.x-x,p.y-y)<4))props.push({x,y,kind:'lamp'});}}
 const crates:LootCrate[]=origin?createCrates(homes):[];for(let i=origin?this.starter.length:0;i<(origin?homes.length:homes.length);i++){const home=homes[i];const x=home?home.x+1.5:ox+13+r()*29,y=home?home.y+1.7:oy+25.6;const id=`${key}:crate:${i}`;const items=(['Beans','Water','Bandage','Plank','Ammo'] as LootKind[]).filter(()=>r()>.35).map((kind,j)=>({id:`${id}:${j}`,kind,quantity:kind==='Ammo'?6+Math.floor(r()*15):1+Math.floor(r()*4)}));if(!items.length)items.push({id:id+':food',kind:'Beans',quantity:1});crates.push({id,name:home?'Household storage box':'Roadside supply crate',x,y,items});}
 const inside=(x:number,y:number)=>homes.some(h=>x>h.x-1&&x<h.x+h.w+1&&y>h.y-1&&y<h.y+h.d+1);
 // Specialized destinations make supply runs purposeful.
 const lootPool=(kind?:string):LootKind[]=>kind==='police'||kind==='gunshop'||kind==='firestation'?['Pistol','Shotgun','SMG','HuntingRifle','Ammo','Bandage']:kind==='clinic'||kind==='pharmacy'?['Painkillers','MedicalGuide','Cloth','Bandage']:kind==='hardware'||kind==='garage'||kind==='warehouse'?['Hammer','Wrench','Nails','Scrap','Tape','Electronics','RepairKit']:kind==='library'||kind==='school'||kind==='townhall'||kind==='bank'?['Manual','MedicalGuide','Electronics','EnergyBar']:kind==='laundromat'?['Cloth','Tape','Scrap','Electronics']:kind==='bakery'||kind==='pub'||kind==='grocery'||kind==='diner'?['Sandwich','Cheese','Apple','Milk','Water','EnergyBar','Charcoal']:kind==='postoffice'?['Tape','Cloth','Manual','Electronics','Nails']:['Cloth','Tape','Nails','EnergyBar','Manual','Hammer','Wrench','Painkillers','RepairKit'];
 for(const crate of crates){const home=homes.find(h=>crate.x>h.x&&crate.x<h.x+h.w&&crate.y>h.y&&crate.y<h.y+h.d),kind=home?.kind;
 const pool=lootPool(kind);
 for(const item of pool)if(r()<.48)crate.items.push({id:crate.id+':'+item,kind:item as LootKind,quantity:['Scrap','Nails','Cloth'].includes(item)?2+Math.floor(r()*4):item==='Ammo'?18:1});
 }
 if(origin&&crates[0])crates[0].items.push(...(['Hammer','Nails','Plank','Cloth','Scrap'] as LootKind[]).map((kind,i)=>({id:'starter-tools-'+i,kind,quantity:kind==='Hammer'?1:kind==='Plank'?60:kind==='Nails'?40:10})));
 const zombies:Zombie[]=[];
 const spawn=(x:number,y:number,floor=0)=>zombies.push({x,y,floor,hp:100,phase:r()*6.28,alert:false,cooldown:0,hit:0,homeX:x,homeY:y});
 // Loose population density, not tight circles: more people in towns, quiet countryside.
 const population=origin?16:rural?(homes.length?3:Math.floor(r()*3)):12+Math.floor(r()*12);
 for(let attempts=0;attempts<population*16&&zombies.length<population;attempts++){
  const x=ox+1+r()*44,y=oy+1+r()*44;
  if(!countyContains(x,y,1)||inside(x,y)||wet(x,y,.6)||Math.hypot(x-23.2,y-23.7)<10||zombies.some(z=>Math.hypot(z.x-x,z.y-y)<3.2))continue;
  spawn(x,y);
 }
 for(const home of homes){
  for(let floor=0;floor<(home.floors||1);floor++){
   if(floor>0||r()<.55){const id=`${key}:cabinet:${homes.indexOf(home)}:${floor}`,pool=lootPool(home.kind);crates.push({id,name:home.name+' · Supplies',x:home.x+home.w-1.3,y:home.y+1,floor,items:pool.filter(()=>r()<.15).map((kind,i)=>({id:id+':'+i,kind,quantity:1+Math.floor(r()*2)}))});}
   for(const locker of furniture(home,floor).filter(b=>b.kind==='locker')){
    const id=`${key}:locker:${homes.indexOf(home)}:${floor}:${locker.id}`,pool=lootPool(home.kind),chosen=pool.filter(()=>r()<.45);
    if(!chosen.length)chosen.push(pool[Math.floor(r()*pool.length)]);
    crates.push({id,name:home.name+' · Locker',x:locker.x+locker.w/2,y:locker.y+locker.d/2,floor,furnitureId:locker.id,items:chosen.map((kind,i)=>({id:id+':'+i,kind,quantity:kind==='Ammo'?12:1+Math.floor(r()*2)}))});
   }
   const id=`${key}:fridge:${homes.indexOf(home)}:${floor}`,foods=(Object.keys(FOODS) as (keyof typeof FOODS)[]).filter(()=>r()<.55);
   crates.push({id,name:home.name+' · Refrigerator',x:home.x+.5,y:home.y+1.65,floor,fridge:true,items:foods.map((kind,i)=>({id:id+':'+i,kind,quantity:1+Math.floor(r()*3)}))});
   if(r()<.38)for(let i=0;i<1+Math.floor(r()*3);i++){const x=home.x+1+r()*(home.w-2),y=home.y+1+r()*(home.d-2);if(!furniture(home).some(b=>pointIn(b,x,y,.3)))spawn(x,y,floor);}
  }
 }
 const trees:Region['trees']=[];for(let i=0;i<(district==='Woodland reserve'?210:district==='Farm country'||district==='Industrial yard'?35:95);i++){const lx=r()*46,ly=r()*46,x=ox+lx,y=oy+ly;if(!countyContains(x,y,1)||zombies.some(z=>Math.hypot(z.x-x,z.y-y)<.8)||patches.some(p=>x>p.x-1&&x<p.x+p.w+1&&y>p.y-1&&y<p.y+p.h+1)||inside(x,y)||crates.some(c=>Math.hypot(c.x-x,c.y-y)<2.7))continue;trees.push({x,y,variant:Math.floor(r()*3)});}
 const vehicles:Region['vehicles']=[];const vehicleCount=origin?1:rural?(homes.length?1:0):district==='Market district'?5:district==='Industrial yard'?4:district==='Wren residential'?2:district==='Garden suburb'?3:1;for(let i=0;i<vehicleCount;i++){const x=origin?25.5:ox+({"Market district":16,"Industrial yard":18,"Garden suburb":31}[district]??12)+i*4.8,y=origin?23.5:oy+({"Market district":22,"Industrial yard":22,"Garden suburb":8}[district]??24);vehicles.push({id:`${key}:vehicle:${i}`,x,y,angle:(i%4)*Math.PI/2,speed:0,kind:(['wagon','sedan','pickup','van','police'] as VehicleKind[])[origin?0:Math.floor(r()*5)],condition:origin?100:45+Math.floor(r()*56),color:(['green','red','blue'] as const)[i%3]});}
 if(origin)vehicles.push({id:'0,0:vehicle:sports',x:20,y:23.3,angle:0,speed:0,kind:'sports',condition:100,color:'red'});const safeVehicles=vehicles.filter(v=>!wet(v.x,v.y,2)&&!homes.some(h=>v.x>h.x-2&&v.x<h.x+h.w+2&&v.y>h.y-1&&v.y<h.y+h.d+1));for(let i=trees.length-1;i>=0;i--)if(safeVehicles.some(v=>Math.hypot(v.x-trees[i].x,v.y-trees[i].y)<2.5))trees.splice(i,1);const region={district:settlement?settlement.name+' · '+district:district,patches,props,key,cx,cy,seed:Math.floor(r()*1e8),houses:homes,crates,zombies,trees,vehicles:safeVehicles};this.cache.set(key,region);return region;}
 ensure(x:number,y:number){const cx=Math.floor(x/CHUNK_SIZE),cy=Math.floor(y/CHUNK_SIZE),key=`${cx},${cy}`;if(this.center===key)return false;this.center=key;this.active=[];for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)this.active.push(this.region(cx+i,cy+j));return true;}
}
