import * as T from 'three';
import type {ActorModel} from './models3d';
import type {ActivityPose,ActivityKind} from './activity';
const down=new T.Vector3(0,-1,0),cube=new T.BoxGeometry(1,1,1);
const metal=new T.MeshLambertMaterial({color:'#808f91'}),wood=new T.MeshLambertMaterial({color:'#89704b'}),green=new T.MeshLambertMaterial({color:'#73875b'}),dark=new T.MeshLambertMaterial({color:'#303b3b'});
const ease=(t:number)=>{t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
/** Procedural work clips on the same articulated rig used for walking and combat. */
export class ActionAnimation{
 props=new Map<ActivityKind,T.Group>();weight=0;last?:ActivityPose;sitting=false;
 constructor(public actor:ActorModel){
  const box=(g:T.Object3D,size:number[],at:number[],m:T.Material)=>{const o=new T.Mesh(cube,m);o.scale.set(...size as [number,number,number]);o.position.set(...at as [number,number,number]);g.add(o);return o;};
  for(const kind of ['refuel','cook','chop','saw','hammer','repair','gather','fish','carry','rest','drink'] as ActivityKind[]){const g=new T.Group();g.visible=false;actor.torso.add(g);this.props.set(kind,g);
   if(kind==='refuel'){box(g,[.25,.33,.14],[0,-.15,0],green);box(g,[.16,.035,.04],[0,.04,0],dark);for(const x of [-.075,.075])box(g,[.035,.07,.04],[x,.01,0],dark);box(g,[.035,.035,.16],[.1,.02,.08],metal);}
   if(kind==='chop'){box(g,[.045,.70,.045],[0,.22,0],wood);box(g,[.22,.17,.065],[.07,.52,0],metal);}
   if(kind==='saw'){box(g,[.055,.10,.15],[0,0,0],wood);box(g,[.025,.11,.42],[0,0,.25],metal);}
   if(kind==='hammer'||kind==='repair'){box(g,[.04,.3,.04],[0,.07,0],wood);box(g,[.19,.08,.075],[0,.22,0],metal);}
   if(kind==='cook'){const pan=new T.Mesh(new T.CylinderGeometry(.20,.15,.065,16),dark);pan.position.set(-.13,-.1,.18);g.add(pan);box(g,[.055,.035,.25],[-.13,-.1,-.025],wood);box(g,[.03,.28,.03],[.11,.03,.18],wood);}
   if(kind==='fish'){box(g,[.022,.022,1.3],[0,0,.45],wood);const line=new T.BufferGeometry().setFromPoints([new T.Vector3(0,0,1.1),new T.Vector3(0,-.85,1.15)]);g.add(new T.Line(line,new T.LineBasicMaterial({color:'#b9c5b3',transparent:true,opacity:.7})));}
   if(kind==='carry'){box(g,[.4,.27,.3],[0,-.1,.05],wood);for(const x of [-.13,.13])box(g,[.04,.28,.31],[x,-.1,.05],dark);}
   if(kind==='drink'){const bottle=new T.Mesh(new T.CylinderGeometry(.045,.05,.19,8),green);bottle.position.y=-.06;g.add(bottle);}
  }
 }
 reset(){this.weight=0;this.last=undefined;this.sitting=false;}
 hand(i:number,target:T.Vector3){
  const arm=this.actor.arms[i],start=arm.position,axis=target.clone().sub(start),d=Math.max(.02,Math.min(.565,axis.length()));axis.normalize();target=start.clone().addScaledVector(axis,d);
  const along=(.29*.29-.285*.285+d*d)/(2*d),pole=new T.Vector3(i===0?-.5:.5,-1,-.2);pole.addScaledVector(axis,-pole.dot(axis)).normalize();
  const elbow=start.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,.29*.29-along*along)));
  arm.quaternion.setFromUnitVectors(down,elbow.clone().sub(start).normalize());this.actor.elbows[i].quaternion.setFromUnitVectors(down,target.sub(elbow).normalize().applyQuaternion(arm.quaternion.clone().invert()));
 }
 apply(work:ActivityPose|undefined,sit:boolean,dt:number){
  for(const g of this.props.values())g.visible=false;
  const a=this.actor;
  if(work){this.last=work;this.sitting=false;}else if(sit)this.sitting=true;
  this.weight+=((work||sit?1:0)-this.weight)*(1-Math.exp(-dt*14));if(this.weight<.01){this.last=undefined;return;}
  const nodes=[a.body,a.hips,a.torso,...a.legs,...a.knees,...a.arms,...a.elbows],base=nodes.map(n=>({p:n.position.clone(),q:n.quaternion.clone()}));
  a.bat.visible=false;a.rifle.visible=false;
  a.body.position.y=0;a.torso.rotation.set(.1,0,0);a.hips.position.y=.9;
  a.legs.forEach((l,i)=>l.rotation.set(i?-.08:.08,0,i?-.05:.05));a.knees.forEach(k=>k.rotation.set(.12,0,0));
  if(sit||this.sitting&&!work){
   a.hips.position.y=.54;a.torso.rotation.x=-.10;
   a.legs.forEach((l,i)=>l.rotation.set(-Math.PI/2,0,i?-.06:.06));a.knees.forEach(k=>k.rotation.set(Math.PI/2,0,0));
   this.hand(0,new T.Vector3(-.16,-.04,.3));this.hand(1,new T.Vector3(.16,-.04,.3));
  }else if(this.last){
   const p=this.last,t=p.elapsed,kind=p.kind,g=this.props.get(kind)!,wave=Math.sin(t*6),cycle=(t%1.1)/1.1;
   g.visible=!['rest','gather'].includes(kind);g.position.set(.08,.16,.4);g.rotation.set(0,0,0);
   let left=new T.Vector3(-.17,.08,.35),right=new T.Vector3(.16,.13,.42);
   if(kind==='refuel'){
    a.hips.position.y=.82;a.torso.rotation.x=.28;g.position.set(.15,.1,.47);g.rotation.set(-.7+.035*wave,0,-.25);
    left.set(-.08,.03,.35);right.copy(g.position);a.knees.forEach(k=>k.rotation.x=.22);
   }else if(kind==='chop'){
    const lift=ease(cycle/.40),strike=ease((cycle-.44)/.22),recover=ease((cycle-.76)/.24),weight=1-recover;
    a.torso.rotation.set((-.15*lift+.56*strike)*weight,(-.32*lift+.46*strike)*weight,0);a.hips.position.y=.92-.12*strike*weight;
    g.position.set(.08,.15+(.52*lift-.59*strike)*weight,.33+(.12*strike)*weight);g.rotation.set(-.9*lift*weight+2.1*strike*weight,0,-.15);
    g.updateMatrix();left=new T.Vector3(0,0,0).applyMatrix4(g.matrix);right=new T.Vector3(0,.13,0).applyMatrix4(g.matrix);
    a.knees[0].rotation.x=.2+.18*strike*weight;
   }else if(kind==='saw'){
    a.torso.rotation.x=.3;a.hips.position.y=.80;g.position.set(.13,.01,.37+wave*.13);left.set(-.18,-.05,.43);right.copy(g.position);a.knees.forEach(k=>k.rotation.x=.3);
   }else if(kind==='cook'){
    a.torso.rotation.x=.19;g.position.set(0,.12,.32);g.rotation.y=wave*.08;left.set(-.13,.02,.32);right.set(.10+Math.cos(t*5)*.04,.22,.47+Math.sin(t*5)*.035);
   }else if(kind==='hammer'||kind==='repair'){
    const hit=Math.pow(Math.max(0,Math.sin(t*8)),3);a.hips.position.y=kind==='hammer'?.7:.8;a.torso.rotation.x=.4;
    g.position.set(.17,.02+hit*.22,.43-hit*.06);g.rotation.x=-hit*.9+.7;left.set(-.14,-.03,.4);right.copy(g.position);a.knees.forEach(k=>k.rotation.x=.45);
   }else if(kind==='gather'){
    a.hips.position.y=.53;a.torso.rotation.x=.50;a.legs.forEach(l=>l.rotation.x=-.6);a.knees.forEach(k=>k.rotation.x=1.15);left.set(-.17,-.14,.31);right.set(.13,-.15+wave*.04,.38);
   }else if(kind==='fish'){
    g.position.set(.08,.21,.38);g.rotation.x=-.2+wave*.02;left.set(-.02,.20,.40);right.set(.13,.2,.25);
   }else if(kind==='carry'){
    a.hips.position.y=.85;a.torso.rotation.x=.15;g.position.set(0,.10,.39);left.set(-.22,.0,.40);right.set(.22,.0,.40);
   }else if(kind==='drink'){
    g.position.set(.14,.55,.22);g.rotation.x=-.8;right.copy(g.position);left.set(-.21,.05,.15);
   }else{a.hips.position.y=.75;a.torso.rotation.x=.22;left.set(-.17,-.12,.2);right.set(.17,-.12,.2);a.knees.forEach(k=>k.rotation.x=.4);}
   this.hand(0,left);this.hand(1,right);
  }
  for(let i=0;i<nodes.length;i++){const n=nodes[i];n.position.lerpVectors(base[i].p,n.position.clone(),this.weight);n.quaternion.slerpQuaternions(base[i].q,n.quaternion.clone(),this.weight);}
 }
}
