import {SETTLEMENTS,settlementAt} from './county';
export type District='Wren residential'|'Garden suburb'|'Market district'|'Civic center'|'Industrial yard'|'Memorial park'|'Medical campus'|'Military base'|'Correctional complex'|'Woodland reserve'|'Farm country';
export const LANDMARKS=[
 {town:'Wren',dx:1,dy:-1,district:'Medical campus',name:'Wren County Hospital'},
 {town:'Wren',dx:2,dy:1,district:'Correctional complex',name:'Ash County Correctional Facility'},
 {town:'Millhaven',dx:2,dy:-1,district:'Military base',name:'Fort Alder'},
 {town:'Millhaven',dx:-1,dy:-1,district:'Medical campus',name:'Millhaven General Hospital'},
] as const;
export function townPlan(cx:number,cy:number){
 const landmark=LANDMARKS.find(l=>{const t=SETTLEMENTS.find(t=>t.name===l.town)!;return cx===t.cx+l.dx&&cy===t.cy+l.dy;});
 const settlement=landmark?SETTLEMENTS.find(t=>t.name===landmark.town):settlementAt(cx,cy);
 if(!settlement)return {district:(Math.sin(cx*.24)+Math.cos(cy*.31)+Math.sin((cx+cy)*.13)>.8?'Farm country':'Woodland reserve') as District};
 const dx=cx-settlement.cx,dy=cy-settlement.cy;
 let district:District=landmark?.district||'Garden suburb';
 if(!landmark){
  if(cx===0&&cy===0)district='Wren residential';
  else if(dx===0&&dy===0||dx===1&&dy===0)district='Market district';
  else if(dx===0&&dy===-1)district='Civic center';
  else if(dx===-1&&dy===0)district='Memorial park';
  else if(dx>=1&&dy>=1)district='Industrial yard';
 }
 return {district,settlement,landmark};
}
