import * as T from 'three';
export const SIGHT_RADIUS=44;
export const CLEAR_SIGHT_RADIUS=32;
export class Darkness{
 opaqueVariants=new WeakMap<T.Material,T.Material>();
 occluded={value:0};floorHeight={value:0};occlusionRay=new T.Raycaster();
 center={value:new T.Vector2()};focus={value:new T.Vector2()};focusDepth={value:0};fadeRadius={value:64};seen=new WeakSet<T.Material>();
 updateOcclusion(camera:T.Camera,focus:T.Vector3,roots:T.Object3D[],floor:number){
  this.floorHeight.value=floor;
  const direction=new T.Vector3();camera.getWorldDirection(direction);
  // Orthographic sight line: stop before the survivor, never test ground behind them.
  this.occlusionRay.set(focus.clone().addScaledVector(direction,-80),direction);
  this.occlusionRay.far=79.45;
  this.occluded.value=this.occlusionRay.intersectObjects(roots,true).some(hit=>{
   if(hit.point.y<=floor+.3)return false;
   for(let o:T.Object3D|null=hit.object;o;o=o.parent)if(!o.visible)return false;
   return true;
  })?1:0;
 }
 apply(root:T.Object3D){root.traverse(o=>{let raw=(o as T.Mesh).material;if(!raw)return;
 let solid=false;for(let parent:T.Object3D|null=o;parent;parent=parent.parent)if(parent.userData.solidOccluder){solid=true;break;}
 if(solid){const opaque=(m:T.Material)=>{if(m.userData.noOcclusionFade)return m;let clone=this.opaqueVariants.get(m);if(!clone){clone=m.clone();clone.userData.noOcclusionFade=true;this.opaqueVariants.set(m,clone);}return clone;};raw=Array.isArray(raw)?raw.map(opaque):opaque(raw);(o as T.Mesh).material=raw;}
 for(const m of Array.isArray(raw)?raw:[raw]){if(this.seen.has(m))continue;this.seen.add(m);
 m.onBeforeCompile=shader=>{
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
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 sightWorld; varying float sightHeight; uniform vec2 survivorCenter; uniform float occluded; uniform float floorHeight; varying float objectDepth; uniform vec2 focusPixel; uniform float focusDepth; uniform float fadeRadius;').replace('#include <dithering_fragment>',`#include <dithering_fragment>
 float obstruction=${m.userData.noOcclusionFade?'0.0':'occluded'}*step(floorHeight+.3,sightHeight)*(1.0-smoothstep(fadeRadius*.65,fadeRadius,distance(gl_FragCoord.xy,focusPixel)))*step(objectDepth+.55,focusDepth);
 float stipple=fract(dot(floor(gl_FragCoord.xy),vec2(.754877666,.569840296)));
 if(stipple<obstruction*.80)discard;
 float sight=1.0-smoothstep(${CLEAR_SIGHT_RADIUS.toFixed(1)},${SIGHT_RADIUS.toFixed(1)},distance(sightWorld,survivorCenter));
 // Lift the dark, baked-in albedo tones in the original artwork for morning daylight.
 gl_FragColor.rgb=clamp(pow(max(gl_FragColor.rgb,vec3(0.0)),vec3(.82))*1.08,0.0,1.0)*sight;`);
 };m.customProgramCacheKey=()=> 'survivor-darkness-v6-'+!!m.userData.noOcclusionFade;m.needsUpdate=true;
 }});}
}
