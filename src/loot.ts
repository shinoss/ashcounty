import type {House} from './sim';
import {SUPPLIES} from './content';
import {FOODS} from './food.js';
export type LootKind=keyof typeof FOODS|keyof typeof SUPPLIES|'Beans'|'Water'|'Bandage'|'Plank'|'Ammo';
export type LootStack={id:string;kind:LootKind;quantity:number};
export type LootCrate={id:string;name:string;x:number;y:number;items:LootStack[];floor?:number;fridge?:boolean;furnitureId?:string};
export const LOOT_INFO:Record<LootKind,{name:string;category:string;icon:string}>={...SUPPLIES,...Object.fromEntries(Object.entries(FOODS).map(([key,f])=>[key,{name:f.name,category:'Food',icon:key}])) as Record<keyof typeof FOODS,{name:string;category:string;icon:string}>,Beans:{name:'Canned beans',category:'Food',icon:'food'},Water:{name:'Drinking water',category:'Drink',icon:'water'},Bandage:{name:'Field bandage',category:'Medical',icon:'bandage'},Plank:{name:'Wooden plank',category:'Material',icon:'wood'},Ammo:{name:'Firearm rounds',category:'Ammunition',icon:'ammo'}};
for(const [kind,info] of Object.entries(LOOT_INFO))info.icon=kind;

export function createCrates(homes?:House[]):LootCrate[]{
 if(homes)return [
  ...homes.map(h=>({x:h.x+1.5,y:h.y+1.1,name:h.name+' · Pantry crate'})),
 ].map((c,i)=>({...c,id:'crate-'+i,items:(['Beans','Water','Bandage','Plank','Ammo'] as LootKind[]).map((kind,j)=>({id:`crate-${i}-${j}`,kind,quantity:kind==='Ammo'?12:kind==='Plank'?2:1+(i+j)%3}))}));
 return [];
}
