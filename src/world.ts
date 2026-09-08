import {SUPPLIES,type VehicleKind} from './content';
import {FOODS} from './food.js';
import {furniture,pointIn} from './collision.js';
import {townBuildings} from './town.js';
import type {House,Zombie} from './sim';
import {createCrates,type LootCrate,type LootKind} from './loot.js';
export const CHUNK_SIZE=46;
export type Patch={x:number;y:number;w:number;h:number;kind:"road"|"parking"|"field"|"water"|"path"};
export type Prop={x:number;y:number;kind:"bench"|"grave"|"hay"|"pump"|"sign"|"barrel"};
export type VehicleState={x:number;y:number;id:string;color:'green'|'red'|'blue';angle:number;speed:number;kind?:VehicleKind;condition?:number};
export type Region={district:string;patches:Patch[];props:Prop[];key:string;cx:number;cy:number;seed:number;houses:House[];crates:LootCrate[];zombies:Zombie[];trees:{x:number;y:number;variant:number}[];vehicles:VehicleState[]};
export function randomFor(cx:number,cy:number){let seed=(Math.imul(cx,73856093)^Math.imul(cy,19349663)^47119)>>>0;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export class ProceduralWorld{
 cache=new Map<string,Region>();active:Region[]=[];center='';
 constructor(public starter:House[]){this.ensure(23,24);}
 relocateVehicle(vehicle:VehicleState){const cx=Math.floor(vehicle.x/CHUNK_SIZE),cy=Math.floor(vehicle.y/CHUNK_SIZE),destination=this.region(cx,cy);if(destination.vehicles.includes(vehicle))return;for(const region of this.cache.values()){const index=region.vehicles.indexOf(vehicle);if(index>=0)region.vehicles.splice(index,1);}destination.vehicles.push(vehicle);}
 region(cx:number,cy:number){const key=`${cx},${cy}`;const previous=this.cache.get(key);if(previous)return previous;const r=randomFor(cx,cy),ox=cx*CHUNK_SIZE,oy=cy*CHUNK_SIZE;const origin=cx===0&&cy===0;const colors=['#96917a','#8b9991','#a49a83','#9a8875','#869283'],roofs=['#555851','#60544c','#515951'];
 const nearby:Record<string,string>={'1,0':'Market district','-1,0':'Farm country','0,-1':'Woodland reserve','0,1':'Industrial yard','1,1':'Civic center','-1,-1':'Garden suburb'};const district=origin?'Wren residential':nearby[key]||['Woodland reserve','Farm country','Market district','Industrial yard','Garden suburb','Memorial park','Civic center'][Math.floor(r()*7)];
 const patches:Patch[]=[],props:Prop[]=[];const patch=(x:number,y:number,w:number,h:number,kind:Patch['kind'])=>patches.push({x:ox+x,y:oy+y,w,h,kind});const prop=(x:number,y:number,kind:Prop['kind'])=>props.push({x:ox+x,y:oy+y,kind});
 if(district==='Woodland reserve'){patch(16,30,20,2,'path');for(let i=0;i<4;i++)prop(19+i*5,33,'bench');}
 if(district==='Farm country'){patch(15,2,27,14,'field');patch(15,29,27,14,'field');for(let i=0;i<12;i++)prop(17+(i%4)*7,5+Math.floor(i/4)*4,'hay');}
 if(district==='Market district'){patch(14,4,28,15,'parking');patch(27,25,3,18,'road');patch(11,40,19,3,'road');prop(18,18,'pump');prop(22,18,'pump');prop(33,18,'sign');}
 if(district==='Industrial yard'){patch(14,3,29,16,'parking');for(let i=0;i<12;i++)prop(17+(i%6)*4,5+Math.floor(i/6)*4,'barrel');}
 if(district==='Memorial park'){patch(16,4,24,14,'path');for(let x=18;x<40;x+=4)for(let y=6;y<17;y+=4)prop(x,y,'grave');patch(17,32,23,2,'path');prop(26,35,'bench');}
 if(district==='Garden suburb'||origin){patch(27,0,2,20,'road');patch(29,5,12,5,'path');for(let i=0;i<3;i++)prop(31+i*4,9,'bench');}
 const homes=townBuildings(district,cx,cy,r,this.starter);
 for(const home of homes)if(home.kind==='gas'){for(const x of [home.x+1.7,home.x+5.7])props.push({x,y:home.y+home.d+1.8,kind:'pump'});}
 const crates:LootCrate[]=origin?createCrates():[];for(let i=origin?this.starter.length:0;i<(origin?homes.length:homes.length+3);i++){const home=homes[i];const x=home?home.x+1.5:ox+13+r()*29,y=home?home.y+1.7:oy+25.6;const id=`${key}:crate:${i}`;const items=(['Beans','Water','Bandage','Plank','Ammo'] as LootKind[]).filter(()=>r()>.35).map((kind,j)=>({id:`${id}:${j}`,kind,quantity:kind==='Ammo'?6+Math.floor(r()*15):1+Math.floor(r()*4)}));if(!items.length)items.push({id:id+':food',kind:'Beans',quantity:1});crates.push({id,name:home?'Household storage box':'Roadside supply crate',x,y,items});}
 const inside=(x:number,y:number)=>homes.some(h=>x>h.x-1&&x<h.x+h.w+1&&y>h.y-1&&y<h.y+h.d+1);
 // Specialized destinations make supply runs purposeful.
 for(const crate of crates){const home=homes.find(h=>crate.x>h.x&&crate.x<h.x+h.w&&crate.y>h.y&&crate.y<h.y+h.d),kind=home?.kind;
 const pool=kind==='police'||kind==='gunshop'?['Pistol','Shotgun','SMG','HuntingRifle','Ammo','Bandage']:kind==='clinic'||kind==='pharmacy'?['Painkillers','MedicalGuide','Cloth','Bandage']:kind==='hardware'||kind==='garage'||kind==='warehouse'?['Hammer','Wrench','Nails','Scrap','Tape','Electronics','RepairKit']:kind==='library'||kind==='school'?['Manual','MedicalGuide','EnergyBar']:['Cloth','Tape','Nails','EnergyBar','Manual','Hammer'];
 for(const item of pool)if(r()<.48)crate.items.push({id:crate.id+':'+item,kind:item as LootKind,quantity:['Scrap','Nails','Cloth'].includes(item)?2+Math.floor(r()*4):item==='Ammo'?18:1});
 }
 if(origin)crates[0].items.push(...(['Hammer','Nails','Plank','Cloth'] as LootKind[]).map((kind,i)=>({id:'starter-tools-'+i,kind,quantity:kind==='Hammer'?1:5})));
 const zombies:Zombie[]=[];
 const spawn=(x:number,y:number,floor=0)=>zombies.push({x,y,floor,hp:100,phase:r()*6.28,alert:false,cooldown:0,hit:0,homeX:x,homeY:y});
 // A few gathering points leave long stretches of streets quiet.
 const hubs=origin?[[38,23],[9,35]]:[[15+r()*24,23],[9,8+r()*30]].slice(0,r()<.45?1:2);
 for(const [hx,hy]of hubs)for(let i=0;i<6+Math.floor(r()*6);i++){const angle=r()*Math.PI*2,dist=Math.sqrt(r())*2.3,x=ox+hx+Math.cos(angle)*dist,y=oy+hy+Math.sin(angle)*dist;if(!inside(x,y)&&Math.hypot(x-23.2,y-23.7)>8)spawn(x,y);}
 for(const home of homes){
  for(let floor=0;floor<(home.floors||1);floor++){
   const id=`${key}:fridge:${homes.indexOf(home)}:${floor}`,foods=(Object.keys(FOODS) as (keyof typeof FOODS)[]).filter(()=>r()<.55);
   crates.push({id,name:home.name+' · Refrigerator',x:home.x+.5,y:home.y+1.65,floor,fridge:true,items:foods.map((kind,i)=>({id:id+':'+i,kind,quantity:1+Math.floor(r()*3)}))});
   if(r()<.38)for(let i=0;i<1+Math.floor(r()*3);i++){const x=home.x+1+r()*(home.w-2),y=home.y+1+r()*(home.d-2);if(!furniture(home).some(b=>pointIn(b,x,y,.3)))spawn(x,y,floor);}
  }
 }
 const trees:Region['trees']=[];for(let i=0;i<(district==='Woodland reserve'?210:district==='Farm country'||district==='Industrial yard'?35:95);i++){const lx=r()*46,ly=r()*46,x=ox+lx,y=oy+ly;if((ly>19&&ly<27)||(lx>6&&lx<12)||patches.some(p=>x>p.x-1&&x<p.x+p.w+1&&y>p.y-1&&y<p.y+p.h+1)||inside(x,y)||crates.some(c=>Math.hypot(c.x-x,c.y-y)<2.7))continue;trees.push({x,y,variant:Math.floor(r()*3)});}
 const vehicles:Region['vehicles']=[];const vehicleCount=origin?1:district==='Market district'?5:district==='Industrial yard'?4:district==='Wren residential'?2:district==='Garden suburb'?3:1;for(let i=0;i<vehicleCount;i++){const x=origin?25.5:ox+({"Market district":16,"Industrial yard":18,"Garden suburb":31}[district]??12)+i*4.8,y=origin?23.5:oy+({"Market district":22,"Industrial yard":22,"Garden suburb":8}[district]??24);vehicles.push({id:`${key}:vehicle:${i}`,x,y,angle:(i%4)*Math.PI/2,speed:0,kind:(['wagon','sedan','pickup','van','police'] as VehicleKind[])[origin?0:Math.floor(r()*5)],condition:origin?100:45+Math.floor(r()*56),color:(['green','red','blue'] as const)[i%3]});}
 const safeVehicles=vehicles.filter(v=>!homes.some(h=>v.x>h.x-2&&v.x<h.x+h.w+2&&v.y>h.y-1&&v.y<h.y+h.d+1));const region={district,patches,props,key,cx,cy,seed:Math.floor(r()*1e8),houses:homes,crates,zombies,trees,vehicles:safeVehicles};this.cache.set(key,region);return region;}
 ensure(x:number,y:number){const cx=Math.floor(x/CHUNK_SIZE),cy=Math.floor(y/CHUNK_SIZE),key=`${cx},${cy}`;if(this.center===key)return false;this.center=key;this.active=[];for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)this.active.push(this.region(cx+i,cy+j));return true;}
}
