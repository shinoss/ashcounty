import {SUPPLIES} from './content';
import {FOODS} from './food.js';
export type LootKind=keyof typeof FOODS|keyof typeof SUPPLIES|'Beans'|'Water'|'Bandage'|'Plank'|'Ammo';
export type LootStack={id:string;kind:LootKind;quantity:number};
export type LootCrate={id:string;name:string;x:number;y:number;items:LootStack[];floor?:number;fridge?:boolean};
export const LOOT_INFO:Record<LootKind,{name:string;category:string;icon:string}>={...SUPPLIES,...Object.fromEntries(Object.entries(FOODS).map(([key,f])=>[key,{name:f.name,category:'Food',icon:'food'}])) as Record<keyof typeof FOODS,{name:string;category:string;icon:string}>,Beans:{name:'Canned beans',category:'Food',icon:'food'},Water:{name:'Drinking water',category:'Drink',icon:'water'},Bandage:{name:'Field bandage',category:'Medical',icon:'bandage'},Plank:{name:'Wooden plank',category:'Material',icon:'wood'},Ammo:{name:'Firearm rounds',category:'Ammunition',icon:'ammo'}};
export function createCrates():LootCrate[]{return [
 {x:24.5,y:25.5,name:'Roadside supply crate'},
 {x:18,y:19,name:'Porch storage box'},
 {x:28,y:19,name:'Abandoned supply crate'},
 {x:35.8,y:25.8,name:'Roadside tool crate'},
 {x:13.5,y:15,name:'14 Wren · Pantry crate'},
 {x:22.5,y:15,name:'16 Wren · Storage box'},
 {x:22.5,y:29,name:'15 Wren · Storage box'},
 {x:31.5,y:29,name:'17 Wren · Pantry crate'},
 ].map((c,i)=>({...c,id:'crate-'+i,items:(['Beans','Water','Bandage','Plank','Ammo'] as LootKind[]).map((kind,j)=>({id:`crate-${i}-${j}`,kind,quantity:kind==='Ammo'?12:kind==='Plank'?2:1+(i+j)%3}))}));}
