import * as T from 'three';
import {box} from './models3d';
import {varietyMaterial as mat} from './variety-art';
import type {House} from './sim';
import type {Solid} from './collision';
export function furnish(parent:T.Group,h:House,b:Solid){
 const group=new T.Group();group.position.set(b.x-h.x,0,b.y-h.y);parent.add(group);const {w,d,height:y,kind}=b;
 const add=(size:number[],at:number[],tile:number,atlas='furniture'):T.Mesh=>{const m=box(group,size,at,'#827e6b');m.material=mat(atlas,tile);return m;};
 if(kind==='sofa'||kind==='booth'){const tile=kind==='booth'?1:(h.design||0)%2?3:0;add([w,.3,d],[w/2,.35,d/2],tile);add([w,.65,.17],[w/2,.53,.085],tile);for(const x of [.1,w-.1])add([.2,.5,d],[x,.45,d/2],tile);}
 else if(kind==='bed'){add([w,.22,d],[w/2,.25,d/2],13);add([w-.08,.16,d-.1],[w/2,.44,d/2],h.kind==='clinic'?2:(h.design||0)%2?14:15);add([w-.2,.12,.35],[w/2,.57,.3],2);add([w,.8,.12],[w/2,.4,.06],4);}
 else if(['bookshelf','shelf','medicine','toolchest','locker','cabinet','counter'].includes(kind)){
  const tile=kind==='bookshelf'?8:kind==='medicine'?9:kind==='shelf'?8:kind==='toolchest'?7:kind==='locker'?10:kind==='counter'?(h.design||0)%2?6:4:(h.design||0)%2?5:4;
  const mesh=add([w,y,d],[w/2,y/2,d/2],tile);const side=mat('furniture',kind==='locker'||kind==='toolchest'?13:5),face=mat('furniture',tile);mesh.material=d>w?[face,face,side,side,side,side]:[side,side,side,side,face,side];
  if(kind==='counter'){add([w+.03,.07,d+.03],[w/2,y+.03,d/2],12);if(w>2){const top=add([.7,.02,d*.85],[w*.45,y+.08,d/2],13);top.material=[side,side,mat('furniture',13),side,side,side];const hob=add([.6,.02,d*.85],[w*.75,y+.08,d/2],13);hob.material=[side,side,mat('furniture',13),side,side,side];}}
 }
 else if(kind==='tv'){const mesh=add([w,y,d],[w/2,y/2,d/2],11),side=mat('materials',3);mesh.material=[side,side,side,side,mat('furniture',11),side];}
 else if(kind==='table'||kind==='desk'){add([w,.09,d],[w/2,y-.05,d/2],4);for(const x of [.08,w-.08])for(const z of [.08,d-.08])add([.1,y-.1,.1],[x,(y-.1)/2,z],5);if(kind==='desk'){add([.4,.3,.4],[w*.7,y+.15,d*.5],11);}}
 else if(kind==='worklift'){add([w,.15,d],[w/2,.25,d/2],13);for(const x of [.2,w-.2])add([.1,.4,d],[x,.2,d/2],13);}
 else add([w,y,d],[w/2,y/2,d/2],14);
 return group;
}
