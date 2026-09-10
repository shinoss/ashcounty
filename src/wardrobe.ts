export type ClothingSlot='top'|'bottom';
export const CLOTHING={
 WorkShirt:{slot:'top',name:'Slate work shirt',color:'#9cb7b2',weight:.4},
 RedFlannel:{slot:'top',name:'Red flannel shirt',color:'#bc6556',weight:.5},
 PoliceShirt:{slot:'top',name:'Navy duty shirt',color:'#6383af',weight:.5},
 RangerJacket:{slot:'top',name:'Ranger field jacket',color:'#8b9862',weight:.9},
 BlueJeans:{slot:'bottom',name:'Blue jeans',color:'#698aaa',weight:.6},
 CargoPants:{slot:'bottom',name:'Olive cargo trousers',color:'#929369',weight:.7},
} as const;
export type ClothingKind=keyof typeof CLOTHING;
export type Outfit=Record<ClothingSlot,ClothingKind|null>;
export const clothingKind=(key:string):key is ClothingKind=>key in CLOTHING;
export const CLOTHING_ITEMS=Object.fromEntries(Object.entries(CLOTHING).map(([key,c])=>[key,{name:c.name,icon:key,category:'Clothing',desc:'Wear from inventory to change your character. Drag to the matching clothing slot.',weight:c.weight,w:2,h:2}])) as Record<ClothingKind,{name:string;icon:string;category:string;desc:string;weight:number;w:number;h:number}>;
