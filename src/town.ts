import type {House} from './sim.js';
export type BuildingKind='cottage'|'ranch'|'colonial'|'townhouse'|'apartments'|'police'|'library'|'gas'|'clinic'|'school'|'diner'|'church'|'grocery'|'warehouse'|'barn'|'hardware'|'garage'|'pharmacy'|'gunshop'|'motel';
export const BUILDINGS:Record<BuildingKind,{label:string;w:number;d:number;floors:number;style:House['style'];wall:number;roof:'gable'|'flat'|'hip'}>={
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
 const add=(kind:BuildingKind,x:number,y:number)=>{const def=BUILDINGS[kind],colors=['#a7aba0','#8f9c92','#b5ac93','#a89888'];result.push({x:ox+x,y:oy+y,w:def.w,d:def.d,kind,floors:def.floors,design:Math.floor(random()*4),style:def.style,color:colors[Math.floor(random()*colors.length)],roof:random()<.5?'#555851':'#60544c',name:def.label,door:false,searched:false,loot:kind==='police'?['Bandage','Plank']:kind==='clinic'?['Bandage','Bandage','Water']:['Beans','Water','Plank']});};
 if(cx===0&&cy===0){result.push(...starter.map((h,i)=>({...h,loot:[...h.loot],kind:(['cottage','colonial','ranch','townhouse','colonial','cottage','ranch','townhouse'] as BuildingKind[])[i%8],floors:i%3===1?2:1,design:i%4})));return result;}
 // Civic destinations sit at Wren's edge, away from the starting residential yards.
 if(cx===2&&cy===0){add('library',15,5);add('police',31,32);return result;}
 if(cx===0&&cy===2){add('gas',15,7);add('pharmacy',31,33);return result;}
 if(Math.abs(cx)<=2&&Math.abs(cy)<=2&&(district==='Garden suburb'||district==='Wren residential')){
  const kinds:BuildingKind[]=['cottage','ranch','colonial','townhouse'];
  for(const [x,y] of [[14,7],[32,8],[14,32],[32,33]])add(kinds[Math.floor(random()*kinds.length)],x,y);
  return result;
 }
 // Rural chunks are usually empty. Occasional farms/cabins break up long drives.
 if(district==='Woodland reserve'){if(random()<.045)add('cottage',15+random()*7,5+random()*4);return result;}
 if(district==='Farm country'){if(random()<.22){add('ranch',15,5);if(random()<.65)add('barn',30,30);}return result;}
 const residential=district==='Garden suburb'||district==='Wren residential';
 if(residential){const kinds:BuildingKind[]=['cottage','ranch','colonial','townhouse'];for(const [x,y] of [[1,3],[1,31],[14,4],[25,4],[36,4],[14,30],[25,30],[36,30]]){let k=kinds[Math.floor(random()*4)];if(x===1&&BUILDINGS[k].w>5)k='cottage';add(k,x,y);}return result;}
 const kinds:BuildingKind[]=district==='Market district'?(random()<.55?['pharmacy','gunshop','motel','hardware']:['grocery','diner','apartments','gas']):district==='Industrial yard'?(random()<.65?['garage','hardware','warehouse','gas']:['warehouse','gas','warehouse','clinic']):district==='Farm country'?['barn','ranch']:district==='Woodland reserve'?['cottage','church']:district==='Memorial park'?['library','church','police']:['police','school','library',random()<.5?'clinic':'pharmacy'];
 const slots=[[14,3],[30,3],[14,29],[30,29]];kinds.forEach((kind,i)=>add(kind,slots[i][0],slots[i][1]));return result;
}
