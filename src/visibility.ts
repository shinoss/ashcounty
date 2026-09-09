import * as T from 'three';
export const SIGHT_RADIUS=44;
export const CLEAR_SIGHT_RADIUS=32;
export class Darkness{
 buildingVariants=new WeakMap<T.Object3D,WeakMap<T.Material,T.Material>>();
 buildingFade=new WeakMap<T.Object3D,{value:number}>();activeBuildings=new Set<T.Object3D>();
 exterior={value:1};
 occluded={value:0};floorHeight={value:0};occlusionRay=new T.Raycaster();
 center={value:new T.Vector2()};focus={value:new T.Vector2()};focusDepth={value:0};fadeRadius={value:64};seen=new WeakSet<T.Material>();
 updateOcclusion(camera:T.Camera,focus:T.Vector3,roots:T.Object3D[],floor:number){
  this.floorHeight.value=floor;
  const direction=new T.Vector3();camera.getWorldDirection(direction);
  // Orthographic sight line: stop before the survivor, never test ground behind them.
  this.occlusionRay.set(focus.clone().addScaledVector(direction,-80),direction);
  this.occlusionRay.far=79.45;
  for(const building of this.activeBuildings)this.buildingFade.get(building)!.value=0;this.activeBuildings.clear();
  this.occluded.value=0;
  for(const hit of this.occlusionRay.intersectObjects(roots,true)){
   if(hit.object.userData.smokeParticle||hit.point.y<=floor+.3)continue;
   let visible=true,building:T.Object3D|undefined;
   for(let o:T.Object3D|null=hit.object;o;o=o.parent){if(!o.visible)visible=false;if(o.userData.solidOccluder)building=o;}
   if(!visible)continue;this.occluded.value=1;
   if(building&&this.exterior.value){let fade=this.buildingFade.get(building);if(!fade){fade={value:0};this.buildingFade.set(building,fade);}fade.value=1;this.activeBuildings.add(building);}
  }
 }
 apply(root:T.Object3D){root.traverse(o=>{let raw=(o as T.Mesh).material;if(!raw)return;
 let building:T.Object3D|undefined;for(let parent:T.Object3D|null=o;parent;parent=parent.parent)if(parent.userData.solidOccluder){building=parent;break;}
 if(building){
  let variants=this.buildingVariants.get(building);if(!variants){variants=new WeakMap();this.buildingVariants.set(building,variants);}
  let fade=this.buildingFade.get(building);if(!fade){fade={value:0};this.buildingFade.set(building,fade);}
  const variant=(m:T.Material)=>{if(m.userData.buildingOwner===building!.uuid)return m;let clone=variants!.get(m);if(!clone){clone=m.clone();clone.userData.buildingOwner=building!.uuid;clone.userData.buildingFade=fade;variants!.set(m,clone);}return clone;};
  raw=Array.isArray(raw)?raw.map(variant):variant(raw);(o as T.Mesh).material=raw;
 }
 for(const m of Array.isArray(raw)?raw:[raw]){if(this.seen.has(m)||m.userData.smokeParticle)continue;this.seen.add(m);
 m.onBeforeCompile=shader=>{
 shader.uniforms.buildingFade=m.userData.buildingFade||{value:0};shader.uniforms.exteriorView=this.exterior;
 shader.uniforms.survivorCenter=this.center;shader.uniforms.occluded=this.occluded;shader.uniforms.floorHeight=this.floorHeight;
 shader.uniforms.focusPixel=this.focus;shader.uniforms.focusDepth=this.focusDepth;shader.uniforms.fadeRadius=this.fadeRadius;
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 sightWorld; varying float sightHeight; varying float objectDepth;').replace('#include <project_vertex>',`#include <project_vertex>
 objectDepth=-mvPosition.z;
 vec4 sightPosition=vec4(transformed,1.0);
 #ifdef USE_INSTANCING
 sightPosition=instanceMatrix*sightPosition;
 #endif
 sightWorld=(modelMatrix*sightPosition).xz;
 sightHeight=(modelMatrix*sightPosition).y;`);
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 sightWorld; varying float sightHeight; uniform vec2 survivorCenter; uniform float occluded; uniform float floorHeight; varying float objectDepth; uniform vec2 focusPixel; uniform float focusDepth; uniform float fadeRadius; uniform float buildingFade; uniform float exteriorView;').replace('#include <dithering_fragment>',`#include <dithering_fragment>
 float obstruction=${m.userData.buildingOwner?'0.0':'occluded'}*step(floorHeight+.3,sightHeight)*(1.0-smoothstep(fadeRadius*.65,fadeRadius,distance(gl_FragCoord.xy,focusPixel)))*step(objectDepth+.55,focusDepth);
 float stipple=fract(dot(floor(gl_FragCoord.xy),vec2(.754877666,.569840296)));
 // Every surface of the same obstructing building uses one screen-space mask.
 // This removes the whole shell in the center, instead of exposing its rear walls or floors.
 float buildingMask=buildingFade*exteriorView*(1.0-smoothstep(fadeRadius*1.15,fadeRadius*1.85,distance(gl_FragCoord.xy,focusPixel)));
 if(stipple<max(obstruction*.80,buildingMask))discard;
 float sight=1.0-smoothstep(${CLEAR_SIGHT_RADIUS.toFixed(1)},${SIGHT_RADIUS.toFixed(1)},distance(sightWorld,survivorCenter));
 // Lift the dark, baked-in albedo tones in the original artwork for morning daylight.
 gl_FragColor.rgb=clamp(pow(max(gl_FragColor.rgb,vec3(0.0)),vec3(.82))*1.08,0.0,1.0)*sight;`);
 };m.customProgramCacheKey=()=> 'survivor-darkness-v7-'+!!m.userData.buildingOwner;m.needsUpdate=true;
 }});}
}
