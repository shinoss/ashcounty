import {SUPPLIES} from './content';
import {FOODS} from './food.js';
import type {Simulation} from './sim';
export const ITEM_INFO={...SUPPLIES,...Object.fromEntries(Object.entries(FOODS).map(([key,f])=>[key,{name:f.name,icon:'food',w:1,h:1,weight:f.weight,desc:`Restores ${f.hunger} food and ${f.water} hydration.`}])) as Record<keyof typeof FOODS,{name:string;icon:string;w:number;h:number;weight:number;desc:string}>,Bandage:{name:'Field bandage',icon:'bandage',w:1,h:1,weight:.1,desc:'Clean dressings. Restores 35 health.'},Water:{name:'Drinking water',icon:'water',w:1,h:2,weight:.5,desc:'Clean water. Restores 40 hydration.'},Beans:{name:'Canned beans',icon:'food',w:1,h:1,weight:.4,desc:'A cold meal. Restores 32 food.'},Plank:{name:'Wooden planks',icon:'wood',w:1,h:3,weight:1.5,desc:'Two planks secure a shelter.'},Ammo:{name:'Firearm rounds',icon:'ammo',w:2,h:1,weight:.02,desc:'Spare ammunition. Press R in the world to reload.'}};
export type Kind=keyof typeof ITEM_INFO;
export type Container='pockets'|'backpack';
export const GRIDS:Record<Container,{w:number;h:number}>={pockets:{w:6,h:2},backpack:{w:8,h:6}};
export type Stack={id:string;kind:Kind;container:Container;x:number;y:number};
export class Inventory {
 stacks:Stack[]=[];serial=0;
 constructor(public s:Simulation){this.sync();}
 quantity(a:Stack){return a.kind==='Ammo'?this.s.reserve:this.s.bag[a.kind]||0;}
 sync(){this.stacks=this.stacks.filter(a=>this.quantity(a)>0);for(const kind of Object.keys(ITEM_INFO) as Kind[]){const quantity=kind==='Ammo'?this.s.reserve:this.s.bag[kind];if(quantity>0&&!this.stacks.some(a=>a.kind===kind)){const container:Container=kind==='Bandage'||kind==='Ammo'?'pockets':'backpack';const spot=this.findSpot(kind,container)||this.findSpot(kind,'backpack');if(spot)this.stacks.push({id:'item-'+this.serial++,kind,...spot});}}}
 fits(kind:Kind,container:Container,x:number,y:number,ignore?:string){const item=ITEM_INFO[kind],grid=GRIDS[container];if(x<0||y<0||x+item.w>grid.w||y+item.h>grid.h)return false;return !this.stacks.some(a=>a.id!==ignore&&a.container===container&&x<a.x+ITEM_INFO[a.kind].w&&x+item.w>a.x&&y<a.y+ITEM_INFO[a.kind].h&&y+item.h>a.y);}
 findSpot(kind:Kind,container:Container){for(let y=0;y<GRIDS[container].h;y++)for(let x=0;x<GRIDS[container].w;x++)if(this.fits(kind,container,x,y))return {container,x,y};return null;}
 move(id:string,container:Container,x:number,y:number){const a=this.stacks.find(a=>a.id===id);if(!a||!this.fits(a.kind,container,x,y,a.id))return false;Object.assign(a,{container,x,y});return true;}
 get weight(){return 4.2+this.stacks.reduce((n,a)=>n+this.quantity(a)*ITEM_INFO[a.kind].weight,0);}
}
