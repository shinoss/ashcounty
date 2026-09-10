import {townPlan} from './county-plan';
import type {Patch} from './world';

// A finite, seeded county; chunks only stream its contents, never repeat towns.
export const COUNTY_MIN=-32*46, COUNTY_MAX=32*46;
export const SETTLEMENTS=[
 {name:'Wren',cx:0,cy:0,radius:2.2},
 {name:'Millhaven',cx:9,cy:0,radius:2.6},
 {name:'Pine Hollow',cx:-9,cy:0,radius:1.5},
 {name:'Redwater',cx:9,cy:9,radius:2.0},
 {name:'Cedar Cross',cx:0,cy:-10,radius:1.7},
 {name:'Westfield',cx:-9,cy:9,radius:1.8},
 {name:'Briar Glen',cx:0,cy:9,radius:1.3},
];
export const LAKES=[{x:-440,y:-400,rx:180,ry:110},{x:690,y:610,rx:105,ry:155},{x:-350,y:1010,rx:160,ry:95}];
export const riverCenter=(y:number)=>1110+48*Math.sin(y/140)+25*Math.sin(y/63);
export function countyContains(x:number,y:number,margin=0){return x>=COUNTY_MIN+margin&&x<=COUNTY_MAX-margin&&y>=COUNTY_MIN+margin&&y<=COUNTY_MAX-margin;}
export function settlementAt(cx:number,cy:number){return SETTLEMENTS.find(t=>Math.hypot(cx-t.cx,cy-t.cy)<t.radius);}
export function naturalWater(x:number,y:number){
 if(!countyContains(x,y))return true;
 if(LAKES.some(l=>Math.pow((x-l.x)/l.rx,2)+Math.pow((y-l.y)/l.ry,2)<1+.08*Math.sin(x*.035)*Math.cos(y*.027)))return true;
 const river=riverCenter(y);
 return Math.abs(x-river)<10+3*Math.sin(y/85);
}
export function countyRoads(cx:number,cy:number):Patch[]{
 const x=cx*46,y=cy*46,roads:Patch[]=[];
 const add=(px:number,py:number,w:number,h:number)=>{const left=Math.max(x,px),top=Math.max(y,py),right=Math.min(x+46,px+w),bottom=Math.min(y+46,py+h);if(right>left&&bottom>top)roads.push({x:left,y:top,w:right-left,h:bottom-top,kind:'road'});};
 if(!countyContains(x+23,y+23))return roads;
 // Two trunk routes, three north/south connectors, and village access roads.
 add(-24*46,20,52*46,6);add(-18*46,9*46+20,46*46,6);
 add(7,-24*46,4,43*46);add(9*46+7,20,4,23*46);add(-9*46+7,20,4,9*46);
 add(27*46+7,20,4,9*46+6);
 const plan=townPlan(cx,cy);
 if(plan.settlement){add(x+7,y,4,46);if(plan.landmark?.district==='Medical campus'||plan.landmark?.district==='Correctional complex')add(x+11,y+39,32,4);else add(x,y+20,46,6);}
 // Union rectangular roads so intersections never have stacked asphalt faces.
 const result:Patch[]=[];
 for(const road of roads){let pieces=[road];for(const old of result){pieces=pieces.flatMap(p=>{
  const l=Math.max(p.x,old.x),t=Math.max(p.y,old.y),r=Math.min(p.x+p.w,old.x+old.w),b=Math.min(p.y+p.h,old.y+old.h);
  if(l>=r||t>=b)return [p];
  return [{...p,h:t-p.y},{...p,y:b,h:p.y+p.h-b},{...p,y:t,w:l-p.x,h:b-t},{...p,x:r,y:t,w:p.x+p.w-r,h:b-t}].filter(q=>q.w>0&&q.h>0);
 });}result.push(...pieces);}
 return result;
}
export function countyTerrain(cx:number,cy:number,roads:Patch[]):Patch[]{
 const out:Patch[]=[],step=1.15;
 // Shared world-coordinate shoreline samples keep adjacent chunks seamless.
 // Merge adjacent wet samples into strips to keep draw calls and colliders small.
 for(let j=0;j<40;j++){
  let run=-1;const y=cy*46+j*step;
  for(let i=0;i<=40;i++){
   const x=cx*46+i*step;
   const wet=i<40&&naturalWater(x+step/2,y+step/2)&&!roads.some(p=>x<p.x+p.w+.8&&x+step>p.x-.8&&y<p.y+p.h+.8&&y+step>p.y-.8);
   if(wet&&run<0)run=i;
   if(!wet&&run>=0){out.push({x:cx*46+run*step,y,w:(i-run)*step,h:step,kind:'water'});run=-1;}
  }
 }
 return out;
}
