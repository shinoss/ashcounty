import * as T from 'three';
import {ActorModel} from './models3d';
import type {Simulation} from './sim';
/** One reusable viewport; renders only while its inventory host is attached. */
export class InventoryPreview{
 renderer=new T.WebGLRenderer({alpha:true,antialias:true});scene=new T.Scene();camera=new T.PerspectiveCamera(31,1,.1,15);actor=new ActorModel();yaw=.38;host?:HTMLElement;last=0;drag?:{x:number;id:number};
 materials=new Map<T.Material,T.Material>();
 constructor(public s:Simulation){
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.setClearColor(0,0);
  this.scene.add(this.actor.root,new T.HemisphereLight('#fff2d9','#69796f',2.6));const key=new T.DirectionalLight('#ffe9c8',2.7);key.position.set(-3,5,4);this.scene.add(key);const rim=new T.DirectionalLight('#b1cfe4',1.4);rim.position.set(3,2,-3);this.scene.add(rim);
  this.camera.position.set(0,1.12,3.95);this.camera.lookAt(0,.92,0);
  const canvas=this.renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','3D survivor preview. Drag to rotate, or use left and right arrow keys.');
  canvas.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();canvas.setPointerCapture(e.pointerId);this.drag={x:e.clientX,id:e.pointerId};};
  canvas.onpointermove=e=>{if(this.drag?.id!==e.pointerId)return;this.yaw+=(e.clientX-this.drag.x)*.014;this.drag.x=e.clientX;};
  canvas.onpointerup=canvas.onpointercancel=()=>{this.drag=undefined;};
  canvas.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();this.yaw+=e.key==='ArrowLeft'?-.18:.18;}};
  canvas.oncontextmenu=e=>e.preventDefault();
 }
 mount(host:HTMLElement){this.host=host;host.append(this.renderer.domElement);this.render(true);}
 render(force=false){const host=this.host;if(!host?.isConnected||host.closest('[hidden]'))return;
  const now=performance.now()/1000;if(!force&&now-this.last<1/30)return;this.last=now;
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),size=this.renderer.getSize(new T.Vector2());if(size.x!==w||size.y!==h){this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  this.actor.appearance(this.s.outfit,this.s.armorEquipped);this.actor.root.rotation.y=this.yaw;
  this.actor.pose({meleeKind:this.s.meleeKind,phase:0,moving:false,rifle:this.s.weapon==='rifle',gun:this.s.gun,time:now});this.actor.rifle.visible=this.s.ownedGuns.length>0;
  // The world adds fog/occlusion shaders to shared materials. The dressing room
  // must keep its own lighting regardless of the survivor's location or time of day.
  const isolate=(source:T.Material)=>{if(source.userData.inventoryPreview)return source;let m=this.materials.get(source);if(!m){m=source.clone();m.userData={inventoryPreview:true};m.onBeforeCompile=()=>{};m.customProgramCacheKey=()=> 'inventory-preview';this.materials.set(source,m);}return m;};
  this.actor.root.traverse(o=>{if(o instanceof T.Mesh)o.material=Array.isArray(o.material)?o.material.map(isolate):isolate(o.material);});
  this.renderer.render(this.scene,this.camera);
 }
}
