import type {House,Zombie} from './sim';
import {createCrates,type LootCrate,type LootKind} from './loot.js';
export const CHUNK_SIZE=46;
export type Patch={x:number;y:number;w:number;h:number;kind:"road"|"parking"|"field"|"water"|"path"};
export type Prop={x:number;y:number;kind:"bench"|"grave"|"hay"|"pump"|"sign"|"barrel"};
export type Region={district:string;patches:Patch[];props:Prop[];key:string;cx:number;cy:number;seed:number;houses:House[];crates:LootCrate[];zombies:Zombie[];trees:{x:number;y:number;variant:number}[]};
export function randomFor(cx:number,cy:number){let seed=(Math.imul(cx,73856093)^Math.imul(cy,19349663)^47119)>>>0;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export class ProceduralWorld{
 cache=new Map<string,Region>();active:Region[]=[];center='';
 constructor(public starter:House[]){this.ensure(23,24);}
 region(cx:number,cy:number){const key=`${cx},${cy}`;const previous=this.cache.get(key);if(previous)return previous;const r=randomFor(cx,cy),ox=cx*CHUNK_SIZE,oy=cy*CHUNK_SIZE;const origin=cx===0&&cy===0;const colors=['#96917a','#8b9991','#a49a83','#9a8875','#869283'],roofs=['#555851','#60544c','#515951'];
 const nearby:Record<string,string>={'1,0':'Market district','-1,0':'Farm country','0,-1':'Woodland reserve','0,1':'Industrial yard','1,1':'Memorial park','-1,-1':'Garden suburb'};const district=origin?'Wren residential':nearby[key]||['Woodland reserve','Farm country','Market district','Industrial yard','Garden suburb','Memorial park'][Math.floor(r()*6)];
 const patches:Patch[]=[],props:Prop[]=[];const patch=(x:number,y:number,w:number,h:number,kind:Patch['kind'])=>patches.push({x:ox+x,y:oy+y,w,h,kind});const prop=(x:number,y:number,kind:Prop['kind'])=>props.push({x:ox+x,y:oy+y,kind});
 if(district==='Woodland reserve'){patch(17,3,21,12,'water');patch(16,30,20,2,'path');for(let i=0;i<4;i++)prop(19+i*5,33,'bench');}
 if(district==='Farm country'){patch(15,2,27,14,'field');patch(15,29,27,14,'field');for(let i=0;i<12;i++)prop(17+(i%4)*7,5+Math.floor(i/4)*4,'hay');}
 if(district==='Market district'){patch(14,4,28,15,'parking');patch(27,25,3,18,'road');patch(11,40,19,3,'road');prop(18,18,'pump');prop(22,18,'pump');prop(33,18,'sign');}
 if(district==='Industrial yard'){patch(14,3,29,16,'parking');for(let i=0;i<12;i++)prop(17+(i%6)*4,5+Math.floor(i/6)*4,'barrel');}
 if(district==='Memorial park'){patch(16,4,24,14,'path');for(let x=18;x<40;x+=4)for(let y=6;y<17;y+=4)prop(x,y,'grave');patch(17,32,23,2,'path');prop(26,35,'bench');}
 if(district==='Garden suburb'||origin){patch(27,0,2,20,'road');patch(29,5,12,5,'path');for(let i=0;i<3;i++)prop(31+i*4,9,'bench');}
 const lots=district==='Woodland reserve'?[[3,12],[32,32]]:district==='Farm country'?[[2,4],[2,30],[16,35]]:district==='Market district'?[[14,29],[20,29],[32,29],[38,29],[2,12]]:district==='Industrial yard'?[[16,30],[24,30],[34,30],[2,8]]:district==='Memorial park'?[[2,12],[3,30],[36,35]]:[[2,12],[13,11],[22,13],[34,13],[3,29],[15,30],[24,28],[35,32]];
 const homes:House[]=origin?this.starter:[];if(!origin)for(const [x,y]of lots){if(r()<.22)continue;homes.push({x:ox+x+r(),y:oy+y,w:4+Math.floor(r()*2),d:4+Math.floor(r()*2),style:district==='Market district'?'shop':district==='Industrial yard'?'warehouse':district==='Farm country'?'barn':'home',color:colors[Math.floor(r()*colors.length)],roof:roofs[Math.floor(r()*roofs.length)],name:`${district} · ${Math.floor(r()*900)+1}`,door:false,searched:false,loot:['Beans','Water','Bandage','Plank'].filter(()=>r()>.35)});}
 const crates:LootCrate[]=origin?createCrates():[];if(!origin)for(let i=0;i<homes.length+3;i++){const home=homes[i];const x=home?home.x+1.5:ox+13+r()*29,y=home?home.y+1.7:oy+25.6;const id=`${key}:crate:${i}`;const items=(['Beans','Water','Bandage','Plank','Ammo'] as LootKind[]).filter(()=>r()>.35).map((kind,j)=>({id:`${id}:${j}`,kind,quantity:kind==='Ammo'?6+Math.floor(r()*15):1+Math.floor(r()*4)}));if(!items.length)items.push({id:id+':food',kind:'Beans',quantity:1});crates.push({id,name:home?'Household storage box':'Roadside supply crate',x,y,items});}
 const inside=(x:number,y:number)=>homes.some(h=>x>h.x-1&&x<h.x+h.w+1&&y>h.y-1&&y<h.y+h.d+1);
 const zombies:Zombie[]=[];for(let i=0;i<15+Math.floor(r()*12);i++){const x=ox+1+r()*44,y=oy+1+r()*44;if(inside(x,y)||Math.hypot(x-23.2,y-23.7)<7)continue;zombies.push({x,y,hp:100,phase:r()*6.28,alert:false,cooldown:0,hit:0});}
 const trees:Region['trees']=[];for(let i=0;i<(district==='Woodland reserve'?210:district==='Farm country'||district==='Industrial yard'?35:95);i++){const lx=r()*46,ly=r()*46,x=ox+lx,y=oy+ly;if((ly>19&&ly<27)||(lx>6&&lx<12)||patches.some(p=>x>p.x-1&&x<p.x+p.w+1&&y>p.y-1&&y<p.y+p.h+1)||inside(x,y)||crates.some(c=>Math.hypot(c.x-x,c.y-y)<2.7))continue;trees.push({x,y,variant:Math.floor(r()*3)});}
 const region={district,patches,props,key,cx,cy,seed:Math.floor(r()*1e8),houses:homes,crates,zombies,trees};this.cache.set(key,region);return region;}
 ensure(x:number,y:number){const cx=Math.floor(x/CHUNK_SIZE),cy=Math.floor(y/CHUNK_SIZE),key=`${cx},${cy}`;if(this.center===key)return false;this.center=key;this.active=[];for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)this.active.push(this.region(cx+i,cy+j));return true;}
}
