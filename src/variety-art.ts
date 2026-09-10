import * as T from 'three';
import type {House} from './sim';
const atlases=new Map<string,HTMLImageElement>(),materials=new Map<string,T.MeshLambertMaterial>();
export async function loadVarietyArt(){await Promise.all(['materials','furniture','outfits','survivor','city','districts','institutions','botanical'].map(async key=>{const image=new Image();image.src='/assets/town-variety/'+key+(['districts','institutions','botanical'].includes(key)?'-v1.png':['survivor','city'].includes(key)?'-v3.png':'-v2.png');await image.decode();atlases.set(key,image);}));}
export function varietyMaterial(atlas:string,tile:number,repeatX=1,repeatY=repeatX,tint='#ffffff'){
 const key=[atlas,tile,repeatX,repeatY,tint].join(':');let material=materials.get(key);if(material)return material;
 const image=atlases.get(atlas)!;const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;const cols=atlas==='botanical'?3:4,rows=atlas==='botanical'?2:4,w=image.width/cols,h=image.height/rows;
 if(atlas==='survivor'&&tile===2)ctx.drawImage(image,2*w+w*.25,h*.14,w*.5,h*.38,0,0,128,128);
 else if(atlas==='furniture'&&[0,1,3].includes(tile))ctx.drawImage(image,(tile%4)*w+w*.2,Math.floor(tile/4)*h+h*.08,w*.55,h*.32,0,0,128,128);
 else ctx.drawImage(image,(tile%cols)*w+1,Math.floor(tile/cols)*h+1,w-2,h-2,0,0,128,128);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(repeatX,repeatY);map.magFilter=T.NearestFilter;map.minFilter=T.LinearMipmapLinearFilter;
 material=new T.MeshLambertMaterial({map,color:tint,side:T.DoubleSide});materials.set(key,material);return material;
}
export function finishes(h:House){
 const institution=['supermarket','hospital','barracks','prison','armory'].indexOf(h.kind||'');
 if(institution>=0){const n=institution===4?2:institution;return {outsideAtlas:'districts',insideAtlas:'districts',roofAtlas:'districts',floorAtlas:'districts',outside:n,inside:4+n,floor:8+n,roof:12+n};}
const design=h.design||0,industrial=['garage','warehouse','hardware','barn'].includes(h.kind||''),medical=['clinic','pharmacy'].includes(h.kind||''),home=['cottage','ranch','colonial','townhouse','apartments','motel'].includes(h.kind||'cottage');
 const city=['firestation','bank','laundromat','pub','postoffice','bakery','townhall','lodge'].indexOf(h.kind||'');
 if(city>=0)return {outsideAtlas:'city',insideAtlas:'city',roofAtlas:'city',outside:city,inside:12+city%4,floor:city===2?10:city===3||city===7?11:9,roof:8+city%4};
 return {outsideAtlas:'materials',insideAtlas:'materials',roofAtlas:'materials',outside:industrial?(h.kind==='barn'?2:7):h.kind==='police'?0:home?[1,0,2,3][design%4]:[0,3,7,2][design%4],inside:medical?13:industrial?14:home?12+design%3:14,floor:medical?10:industrial?15:h.kind==='diner'||h.kind==='gas'?9:home?[8,11,9,8][design%4]:h.kind==='library'||h.kind==='church'?11:10,roof:industrial?5:[4,6,4,6][design%4]};
}
