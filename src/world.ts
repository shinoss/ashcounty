import {townPlan} from './county-plan';
import {landscape,type Foliage} from './landscape';
import {inBuilding} from './building-layout';
import {walls,type Solid} from './collision';
import {ENCOUNTERS,VEHICLE_STORAGE} from './expedition-content';
import {countyContains,countyRoads,countyTerrain} from './county';
import {SUPPLIES,type VehicleKind} from './content';
import {FOODS} from './food.js';
import {furniture,pointIn} from './collision.js';
import {townBuildings} from './town.js';
import type {House,Zombie} from './sim';
import {createCrates,type LootCrate,type LootKind} from './loot.js';
export const CHUNK_SIZE=46;
export type Patch={x:number;y:number;w:number;h:number;kind:"road"|"parking"|"field"|"water"|"path"|"lawn"|"garden"};
export type Prop={x:number;y:number;kind:"bench"|"grave"|"hay"|"pump"|"sign"|"barrel"|"lamp"|"fountain"};
export type VehicleState={x:number;y:number;id:string;color:'green'|'red'|'blue';angle:number;speed:number;kind?:VehicleKind;condition?:number;fuel?:number;battery?:number;trunk?:LootCrate};
export type Region={foliage?:Foliage[];barriers?:Solid[];revision?:number;district:string;patches:Patch[];props:Prop[];key:string;cx:number;cy:number;seed:number;houses:House[];crates:LootCrate[];zombies:Zombie[];trees:{x:number;y:number;variant:number}[];vehicles:VehicleState[]};
export function randomFor(cx:number,cy:number){let seed=(Math.imul(cx,73856093)^Math.imul(cy,19349663)^47119)>>>0;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export class ProceduralWorld{
 cache=new Map<string,Region>();active:Region[]=[];center='';
 constructor(public starter:House[]){this.ensure(23,24);}
 relocateVehicle(vehicle:VehicleState){const cx=Math.floor(vehicle.x/CHUNK_SIZE),cy=Math.floor(vehicle.y/CHUNK_SIZE),destination=this.region(cx,cy);if(destination.vehicles.includes(vehicle))return;for(const region of this.cache.values()){const index=region.vehicles.indexOf(vehicle);if(index>=0)region.vehicles.splice(index,1);}destination.vehicles.push(vehicle);}
 region(cx:number,cy:number):Region{const key=`${cx},${cy}`;const previous=this.cache.get(key);if(previous)return previous;const r=randomFor(cx,cy),ox=cx*CHUNK_SIZE,oy=cy*CHUNK_SIZE;const origin=cx===0&&cy===0;const colors=['#96917a','#8b9991','#a49a83','#9a8875','#869283'],roofs=['#555851','#60544c','#515951'];
 const plan=townPlan(cx,cy),settlement=plan.settlement,rural=!settlement,district=plan.district;
 const roads=countyRoads(cx,cy),patches:Patch[]=[...countyTerrain(cx,cy,roads),...roads],props:Prop[]=[];const patch=(x:number,y:number,w:number,h:number,kind:Patch['kind'])=>patches.push({x:ox+x,y:oy+y,w,h,kind});const prop=(x:number,y:number,kind:Prop['kind'])=>props.push({x:ox+x,y:oy+y,kind});
 if(district==='Woodland reserve'&&r()<.08){patch(16,30,20,2,'path');for(let i=0;i<4;i++)prop(19+i*5,33,'bench');}
 if(district==='Farm country'&&!patches.some(p=>p.kind==='water')){const fw=15+r()*12,fy=2+r()*4;patch(15,fy,fw,10+r()*5,'field');if(r()<.6)patch(15,29,18+r()*9,10+r()*5,'field');for(let i=0;i<3+Math.floor(r()*6);i++)prop(17+r()*(fw-4),fy+2+r()*6,'hay');}
 if(district==='Market district'){patch(14,15,29,4,'parking');patch(42.8,26,2,19,'path');patch(13,43.4,30,1.3,'path');}
 if(district==='Industrial yard'){patch(14,14,29,4,'parking');for(let i=0;i<3;i++)prop(17+i*3,17,'barrel');}
 if(district==='Medical campus'||district==='Correctional complex'){patch(14,34,29,4,'parking');patch(26,32,3,11,'path');}
 if(district==='Military base'){patch(32,15,12,4,'parking');}
 const wet=(x:number,y:number,pad=0)=>patches.some(p=>p.kind==='water'&&x>p.x-pad&&x<p.x+p.w+pad&&y>p.y-pad&&y<p.y+p.h+pad);
 const homes=(countyContains(ox+23,oy+23)?townBuildings(district,cx,cy,r,this.starter):[]).filter(h=>!patches.some(p=>p.kind==='water'&&h.x<p.x+p.w+1&&h.x+h.w>p.x-1&&h.y<p.y+p.h+1&&h.y+h.d>p.y-1));
 // Encounter supplies follow the building's actual purpose; they never turn a
 // quiet residential plot into a randomly placed armory or industrial site.
 const encounterKind=({garage:'workshop',warehouse:'provisions',colonial:'survivor',lodge:'ranger',clinic:'medical',police:'armory'} as Record<string,string>)[homes[0]?.kind||''];
 const site=!origin&&encounterKind&&r()<.45?ENCOUNTERS.find(e=>e.id===encounterKind):undefined;
 // Paths reserve clear approaches while lawns fill the space between detached homes.
 if(district==='Garden suburb'||origin)for(const h of homes){
  const center=h.x+h.w/2,localY=h.y-oy;
  if(localY<20)patch(center-ox-.75,localY+h.d,1.5,20-localY-h.d,'path');
  else{patch(h.x-ox-2,26,1.5,localY+h.d-25,'path');patch(h.x-ox-2,localY+h.d+.15,h.w/2+2.75,1,'path');}
 }
 if(rural&&homes.length){patch(9,23,13,1.5,'path');}
 for(let i=props.length-1;i>=0;i--)if(wet(props[i].x,props[i].y,1)||homes.some(h=>inBuilding(h,props[i].x,props[i].y,.5)))props.splice(i,1);
 for(const home of homes)if(home.kind==='gas'){for(const x of [home.x+1.7,home.x+5.7])props.push({x,y:home.y+home.d+1.8,kind:'pump'});}
 if(settlement)for(const road of roads){const horizontal=road.w>road.h,length=horizontal?road.w:road.h;for(let t=7;t<length;t+=18){const x=road.x+(horizontal?t:road.w+1),y=road.y+(horizontal?-1:t);if(!wet(x,y,1)&&!homes.some(h=>x>h.x-.5&&x<h.x+h.w+.5&&y>h.y-.5&&y<h.y+h.d+.5)&&!props.some(p=>Math.hypot(p.x-x,p.y-y)<4))props.push({x,y,kind:'lamp'});}}
 const crates:LootCrate[]=origin?createCrates(homes):[];for(let i=origin?this.starter.length:0;i<(origin?homes.length:homes.length);i++){const home=homes[i];const x=home?home.x+home.w/2-1.6:ox+13+r()*29,y=home?home.y+home.d-1.3:oy+25.6;const id=`${key}:crate:${i}`;const items=(['Beans','Water','Bandage','Plank','Ammo'] as LootKind[]).filter(()=>r()>.35).map((kind,j)=>({id:`${id}:${j}`,kind,quantity:kind==='Ammo'?6+Math.floor(r()*15):1+Math.floor(r()*4)}));if(!items.length)items.push({id:id+':food',kind:'Beans',quantity:1});crates.push({id,name:home?'Household storage box':'Roadside supply crate',x,y,items});}
 const inside=(x:number,y:number)=>homes.some(h=>inBuilding(h,x,y,1));
 // Specialized destinations make supply runs purposeful.
 const lootPool=(kind?:string):LootKind[]=>kind==='armory'||kind==='barracks'||kind==='prison'||kind==='police'||kind==='gunshop'||kind==='firestation'?['Carbine','Pistol','Shotgun','SMG','HuntingRifle','Ammo','PistolAmmo','Shells','RifleAmmo','helmet','kevlar','PoliceShirt','Bandage']:kind==='hospital'||kind==='clinic'||kind==='pharmacy'?['Painkillers','MedicalGuide','Cloth','Bandage']:kind==='hardware'||kind==='garage'||kind==='warehouse'?['Hammer','Wrench','Nails','Scrap','Tape','Electronics','RepairKit','Saw','Axe','Crowbar','Jerrycan','Battery','Petrol']:kind==='library'||kind==='school'||kind==='townhall'||kind==='bank'?['Manual','MedicalGuide','ElectricalGuide','MapNote','Electronics','EnergyBar']:kind==='laundromat'?['RedFlannel','BlueJeans','CargoPants','WorkShirt','RangerJacket','Cloth','Tape']:kind==='supermarket'||kind==='bakery'||kind==='pub'||kind==='grocery'||kind==='diner'?['Sandwich','Cheese','Apple','Milk','Water','EnergyBar','Charcoal']:kind==='postoffice'?['Tape','Cloth','Manual','Electronics','Nails']:['RedFlannel','CargoPants','WorkShirt','Cloth','Tape','Nails','EnergyBar','Manual','Hammer','Wrench','Painkillers','RepairKit'];
 for(const crate of crates){const home=homes.find(h=>crate.x>h.x&&crate.x<h.x+h.w&&crate.y>h.y&&crate.y<h.y+h.d),kind=home?.kind;
 const pool=lootPool(kind);
 for(const item of pool)if(r()<.48)crate.items.push({id:crate.id+':'+item,kind:item as LootKind,quantity:['Scrap','Nails','Cloth'].includes(item)?2+Math.floor(r()*4):['Ammo','Shells','PistolAmmo','RifleAmmo'].includes(item)?18:1});
 }
 if(origin&&crates[0])crates[0].items.push(...(['Hammer','Saw','Axe','RedFlannel','CargoPants','Nails','Plank','Cloth','Scrap'] as LootKind[]).map((kind,i)=>({id:'starter-tools-'+i,kind,quantity:['Hammer','Saw','Axe','RedFlannel','CargoPants'].includes(kind)?1:kind==='Plank'?6:kind==='Nails'?8:3})));
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
   if(!home.layout&&(floor>0||r()<.55)){const id=`${key}:cabinet:${homes.indexOf(home)}:${floor}`,pool=lootPool(home.kind);crates.push({id,name:home.name+' · Supplies',x:home.x+home.w-1.3,y:home.y+1,floor,items:pool.filter(()=>r()<.15).map((kind,i)=>({id:id+':'+i,kind,quantity:1+Math.floor(r()*2)}))});}
   for(const locker of furniture(home,floor).filter(b=>b.kind==='locker'||home.layout&&['shelf','produce','medicine','toolchest'].includes(b.kind))){
    const id=`${key}:locker:${homes.indexOf(home)}:${floor}:${locker.id}`,pool=locker.kind==='medicine'?lootPool('hospital'):locker.kind==='produce'?(['Apple','Carrots','Cheese','Water'] as LootKind[]):lootPool(home.kind),chosen=pool.filter(()=>r()<.45);
    if(!chosen.length)chosen.push(pool[Math.floor(r()*pool.length)]);
    crates.push({id,name:home.name+' · '+locker.kind.replace(/^./,c=>c.toUpperCase()),x:locker.x+locker.w/2,y:locker.y+locker.d/2,floor,furnitureId:locker.id,items:chosen.map((kind,i)=>({id:id+':'+i,kind,quantity:['Ammo','Shells','PistolAmmo','RifleAmmo'].includes(kind)?12:1+Math.floor(r()*2)}))});
   }
   for(const fridge of furniture(home,floor).filter(b=>b.kind==='fridge')){
    const id=`${key}:fridge:${homes.indexOf(home)}:${floor}:${fridge.id}`,foods=(Object.keys(FOODS) as (keyof typeof FOODS)[]).filter(()=>r()<.55);
    crates.push({id,name:home.name+' · Refrigerator',x:fridge.x+fridge.w/2,y:fridge.y+fridge.d/2,floor,fridge:true,furnitureId:home.layout?fridge.id:undefined,items:foods.map((kind,i)=>({id:id+':'+i,kind,quantity:1+Math.floor(r()*3)}))});
   }
   if(r()<.38)for(let i=0;i<1+Math.floor(r()*3);i++){const x=home.x+1+r()*(home.w-2),y=home.y+1+r()*(home.d-2);if(inBuilding(home,x,y)&&!walls(home).some(b=>pointIn(b,x,y,.4))&&!furniture(home,floor).some(b=>pointIn(b,x,y,.3)))spawn(x,y,floor);}
  }
 }
 const greenery=landscape(cx,cy,district,homes,patches,props,r);
 const trees:Region['trees']=[];for(let i=0;i<(district==='Woodland reserve'?115:district==='Farm country'||district==='Industrial yard'?25:24);i++){const lx=r()*46,ly=r()*46,x=ox+lx,y=oy+ly;if(!countyContains(x,y,1)||greenery.foliage.some(f=>Math.hypot(f.x-x,f.y-y)<1.3)||greenery.barriers.some(b=>pointIn(b,x,y,.7))||zombies.some(z=>Math.hypot(z.x-x,z.y-y)<.8)||patches.some(p=>x>p.x-1&&x<p.x+p.w+1&&y>p.y-1&&y<p.y+p.h+1)||inside(x,y)||crates.some(c=>Math.hypot(c.x-x,c.y-y)<2.7))continue;trees.push({x,y,variant:Math.floor(r()*3)});}
 const vehicles:Region['vehicles']=[];
 const vehicleCount=origin?1:rural?(homes.length?1:0):district==='Memorial park'?1:district==='Medical campus'?4:district==='Military base'?4:district==='Market district'?5:3;
 const lot=patches.find(p=>p.kind==='parking'&&p.w>10&&p.h>=3);
 for(let i=0;i<vehicleCount;i++){
  const x=origin?25.5:lot?lot.x+2.5+i*5:ox+16+i*6,y=origin?23.5:lot?lot.y+lot.h/2:oy+23;
  if(x>ox+43)continue;
  const kind:VehicleKind=origin?'wagon':district==='Medical campus'?(i===0?'van':'sedan'):district==='Military base'?(i%2?'van':'pickup'):district==='Correctional complex'?'police':(['wagon','sedan','pickup','van'] as VehicleKind[])[Math.floor(r()*4)];
  vehicles.push({id:`${key}:vehicle:${i}`,x,y,angle:lot?Math.PI/2:0,speed:0,kind,condition:origin?100:45+Math.floor(r()*56),color:(['green','red','blue'] as const)[i%3]});
 }
 if(origin)vehicles.push({id:'0,0:vehicle:sports',x:20,y:23.3,angle:0,speed:0,kind:'sports',condition:100,color:'red'});const safeVehicles=vehicles.filter(v=>!wet(v.x,v.y,2)&&!homes.some(h=>inBuilding(h,v.x,v.y,1.8))&&!greenery.barriers.some(b=>pointIn(b,v.x,v.y,1.8))&&!props.some(p=>Math.hypot(p.x-v.x,p.y-v.y)<2));for(let i=trees.length-1;i>=0;i--)if(safeVehicles.some(v=>Math.hypot(v.x-trees[i].x,v.y-trees[i].y)<2.5))trees.splice(i,1); if(site){const home=homes[0];home.name=site.name;home.encounter=site.id;home.locked=site.locked;home.alarmArmed=site.alarm;home.doorHp=80;home.barricade=site.id==='survivor'?80:0;
 const box=crates.find(c=>!c.fridge&&c.x>home.x&&c.x<home.x+home.w&&c.y>home.y&&c.y<home.y+home.d);
 if(box){box.name=site.name+' · Supply cache';box.encounter=site.id;box.items=Object.entries(site.loot).map(([kind,quantity])=>({id:box.id+':reward:'+kind,kind:kind as LootKind,quantity:quantity!}));}
 for(let i=0;i<3;i++){const x=home.x+home.w/2+i-1,y=home.y+home.d+2.5;if(!wet(x,y)&&!inside(x,y))spawn(x,y);}
 props.push({x:home.x+home.w+.7,y:home.y+home.d,kind:'sign'});
 }
 for(const v of safeVehicles){v.fuel=origin?18:r()<.25?0:3+Math.floor(r()*15);v.battery=origin?100:r()<.12?0:35+Math.floor(r()*65);v.trunk={id:'trunk:'+v.id,name:((v.kind||'wagon')+' trunk').replace(/^./,c=>c.toUpperCase()),x:v.x,y:v.y,vehicleId:v.id,capacity:VEHICLE_STORAGE[v.kind||'wagon'],items:[]};}
 greenery.foliage=greenery.foliage.filter(f=>!crates.some(c=>Math.hypot(c.x-f.x,c.y-f.y)<1.1)&&!safeVehicles.some(v=>Math.hypot(v.x-f.x,v.y-f.y)<2)&&!zombies.some(z=>Math.hypot(z.x-f.x,z.y-f.y)<.7));
 const region={...greenery,district:settlement?settlement.name+' · '+district:district,patches,props,key,cx,cy,seed:Math.floor(r()*1e8),houses:homes,crates,zombies,trees,vehicles:safeVehicles};this.cache.set(key,region);return region;}
 ensure(x:number,y:number){const cx=Math.floor(x/CHUNK_SIZE),cy=Math.floor(y/CHUNK_SIZE),key=`${cx},${cy}`;if(this.center===key)return false;this.center=key;this.active=[];for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)this.active.push(this.region(cx+i,cy+j));return true;}
}
