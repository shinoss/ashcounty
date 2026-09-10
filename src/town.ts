import {layoutFor} from './building-layout';
import {townPlan} from './county-plan';
import type {House} from './sim.js';
export type BuildingKind='supermarket'|'hospital'|'prison'|'barracks'|'armory'|'cottage'|'ranch'|'colonial'|'townhouse'|'apartments'|'police'|'library'|'gas'|'clinic'|'school'|'diner'|'church'|'grocery'|'warehouse'|'barn'|'hardware'|'garage'|'pharmacy'|'gunshop'|'motel'|'firestation'|'bank'|'laundromat'|'pub'|'postoffice'|'bakery'|'townhall'|'lodge';
export const BUILDINGS:Record<BuildingKind,{label:string;w:number;d:number;floors:number;style:House['style'];wall:number;roof:'gable'|'flat'|'hip'}>={
 supermarket:{label:'FRESHWAY SUPERMARKET',w:29,d:15,floors:1,style:'shop',wall:0,roof:'flat'},
 hospital:{label:'COUNTY GENERAL HOSPITAL',w:29,d:29,floors:2,style:'shop',wall:1,roof:'flat'},
 prison:{label:'ASH COUNTY CORRECTIONS',w:29,d:30,floors:2,style:'shop',wall:3,roof:'flat'},
 barracks:{label:'FORT ALDER · BARRACKS',w:17,d:17,floors:1,style:'warehouse',wall:2,roof:'flat'},
 armory:{label:'FORT ALDER · SUPPLY',w:12,d:10,floors:1,style:'warehouse',wall:2,roof:'flat'},
 firestation:{label:'WREN FIRE & RESCUE',w:12,d:9,floors:2,style:'shop',wall:0,roof:'flat'},
 bank:{label:'COUNTY SAVINGS BANK',w:10,d:8,floors:2,style:'shop',wall:1,roof:'flat'},
 laundromat:{label:'SPIN CYCLE LAUNDRY',w:9,d:6,floors:1,style:'shop',wall:2,roof:'flat'},
 pub:{label:'THE RUSTY ELK',w:10,d:8,floors:2,style:'shop',wall:3,roof:'gable'},
 postoffice:{label:'ASH COUNTY POST OFFICE',w:11,d:7,floors:1,style:'shop',wall:4,roof:'flat'},
 bakery:{label:'MORNING CRUST BAKERY',w:8,d:6,floors:1,style:'shop',wall:5,roof:'hip'},
 townhall:{label:'ASH COUNTY TOWN HALL',w:12,d:9,floors:3,style:'shop',wall:6,roof:'hip'},
 lodge:{label:'CEDAR TRAIL LODGE',w:11,d:9,floors:2,style:'home',wall:7,roof:'gable'},
 cottage:{label:'Cottage',w:6,d:5,floors:1,style:'home',wall:8,roof:'gable'},
 ranch:{label:'Ranch house',w:9,d:6,floors:1,style:'home',wall:8,roof:'hip'},
 colonial:{label:'Colonial house',w:8,d:7,floors:2,style:'home',wall:9,roof:'gable'},
 townhouse:{label:'Townhouse',w:7,d:7,floors:2,style:'home',wall:7,roof:'gable'},
 apartments:{label:'County apartments',w:12,d:9,floors:3,style:'home',wall:11,roof:'flat'},
 police:{label:'ASH COUNTY POLICE',w:10,d:8,floors:2,style:'shop',wall:11,roof:'flat'},
 library:{label:'PUBLIC LIBRARY',w:10,d:7,floors:2,style:'shop',wall:9,roof:'hip'},
 gas:{label:'COUNTY FUEL',w:8,d:5,floors:1,style:'shop',wall:9,roof:'flat'},
 clinic:{label:'WREN MEDICAL',w:9,d:6,floors:1,style:'shop',wall:9,roof:'flat'},
 school:{label:'ASH COUNTY SCHOOL',w:12,d:8,floors:2,style:'shop',wall:11,roof:'flat'},
 diner:{label:'SUNRISE DINER',w:8,d:5,floors:1,style:'shop',wall:11,roof:'flat'},
 church:{label:'ST. MARK CHURCH',w:7,d:10,floors:1,style:'home',wall:9,roof:'gable'},
 grocery:{label:'WREN GROCERY',w:11,d:7,floors:1,style:'shop',wall:8,roof:'flat'},
 warehouse:{label:'COUNTY STORAGE',w:12,d:10,floors:1,style:'warehouse',wall:11,roof:'flat'},
 hardware:{label:'BOLT & BOARD HARDWARE',w:11,d:8,floors:1,style:'shop',wall:8,roof:'flat'},
 garage:{label:'MILLER AUTO REPAIR',w:12,d:8,floors:1,style:'warehouse',wall:11,roof:'flat'},
 pharmacy:{label:'CROSS PHARMACY',w:9,d:7,floors:1,style:'shop',wall:9,roof:'flat'},
 gunshop:{label:'TRAILHEAD OUTFITTERS',w:10,d:7,floors:1,style:'shop',wall:7,roof:'gable'},
 motel:{label:'PINE REST MOTEL',w:13,d:8,floors:2,style:'shop',wall:8,roof:'hip'},
 barn:{label:'Redwood barn',w:8,d:8,floors:2,style:'barn',wall:7,roof:'gable'}
};
export function townBuildings(district:string,cx:number,cy:number,random:()=>number,starter:House[]):House[]{
 const ox=cx*46,oy=cy*46,result:House[]=[];
 const add=(kind:BuildingKind,x:number,y:number)=>{const def=BUILDINGS[kind],colors=['#a7aba0','#8f9c92','#b5ac93','#a89888'];result.push({x:ox+x,y:oy+y,w:def.w,d:def.d,kind,layout:layoutFor(kind,def.w,def.d),floors:def.floors,design:Math.floor(random()*4),style:def.style,color:colors[Math.floor(random()*colors.length)],roof:random()<.5?'#555851':'#60544c',name:def.label,door:false,searched:false,loot:kind==='police'?['Bandage','Plank']:kind==='clinic'?['Bandage','Bandage','Water']:['Beans','Water','Plank']});};
 if(cx===0&&cy===0){result.push(...starter.map((h,i)=>({...h,loot:[...h.loot],kind:(['cottage','colonial','ranch','townhouse','colonial','cottage','ranch','townhouse'] as BuildingKind[])[i%8],floors:i%3===1?2:1,design:i%4})));return result;}
 const plan=townPlan(cx,cy),name=plan.settlement?.name||'County';
 if(district==='Medical campus'){add('hospital',14,3);result[0].name=plan.landmark?.name||name+' General Hospital';return result;}
 if(district==='Correctional complex'){add('prison',14,2);result[0].name=plan.landmark?.name||name+' Corrections';return result;}
 if(district==='Military base'){add('barracks',14,2);add('armory',32,3);add('garage',14,29);add('clinic',33,30);return result;}
 if(district==='Memorial park'){if(random()<.4)add('bakery',32,31);return result;}
 if(district==='Woodland reserve'){if(random()<.045)add(random()<.5?'lodge':'cottage',15+random()*7,5+random()*4);return result;}
 if(district==='Farm country'){if(random()<.22){add('ranch',15,5);if(random()<.65)add('barn',30,30);}return result;}
 if(district==='Garden suburb'||district==='Wren residential'){
  const kinds:BuildingKind[]=['cottage','ranch','colonial','townhouse'];
  for(const [x,y] of [[14,5],[33,6],[14,30],[33,31]])if(random()<.86)add(kinds[Math.floor(random()*kinds.length)],x,y);
  return result;
 }
 if(district==='Market district'){
  // A recognisable retail anchor on the main road, with small shops opposite.
  if(cx===(plan.settlement?.cx||0)+1){add('supermarket',14,28);add(random()<.5?'bakery':'diner',14,6);add(random()<.5?'pharmacy':'laundromat',33,6);}
  else{add(random()<.5?'bank':'postoffice',14,3);add(random()<.5?'bakery':'pub',33,4);add(random()<.5?'motel':'apartments',14,29);add(random()<.5?'grocery':'gunshop',33,30);}
 }else if(district==='Civic center'){
  add(random()<.55?'townhall':'school',14,3);add('library',32,4);add('police',14,29);add(random()<.5?'church':'firestation',32,29);
 }else{
  add('warehouse',14,3);add('garage',31,4);add('hardware',14,29);add('gas',33,30);
 }
 for(const h of result)if(h.style==='shop'&&h.kind!=='supermarket')h.name=h.name.replace(/WREN|ASH COUNTY|COUNTY/g,name.toUpperCase());
 return result;
}
